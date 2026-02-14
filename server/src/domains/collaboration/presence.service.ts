import { v4 as uuidv4 } from 'uuid';
import { cache } from '../../config/redis.js';
import { logger } from '../../shared/utils/logger.js';
import { projectRepository } from '../projects/project.repository.js';
import { Session, type IParticipant, type ISession } from './session.model.js';

const SESSION_TTL = 30 * 60; // 30 minutes in seconds
const PRESENCE_TTL = 60; // 1 minute in seconds

// Generate random color for user cursor
function getRandomColor(): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
    '#F0B27A',
    '#82E0AA',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

class PresenceService {
  /**
   * Get active session for a project (create if doesn't exist)
   */
  async getOrCreateSession(projectId: string): Promise<ISession> {
    // Check for existing active session
    let session = await Session.findOne({
      projectId,
      isActive: true,
    });

    if (!session) {
      // Create new session
      const roomId = uuidv4();
      session = await Session.create({
        projectId,
        roomId,
        participants: [],
        isActive: true,
        expiresAt: new Date(Date.now() + SESSION_TTL * 1000),
      });
      logger.info(`Created new session ${roomId} for project ${projectId}`);
    }

    return session;
  }

  /**
   * Join a collaboration session
   */
  async joinSession(
    projectId: string,
    userId: string,
    socketId: string,
    displayName: string
  ): Promise<{ session: ISession; participant: IParticipant }> {
    // Check if user has access
    const access = await projectRepository.checkAccess(projectId, userId);
    if (!access.hasAccess) {
      throw new Error('User does not have access to this project');
    }

    const session = await this.getOrCreateSession(projectId);

    const participant: IParticipant = {
      userId: userId as any, // Will be converted to ObjectId by Mongoose
      socketId,
      cursor: { line: 1, column: 1 },
      color: getRandomColor(),
      displayName,
      joinedAt: new Date(),
    };

    // Add or update participant
    session.addParticipant(participant);
    session.expiresAt = new Date(Date.now() + SESSION_TTL * 1000);
    await session.save();

    // Store in Redis for fast presence lookups
    await this.updateRedisPresence(session.roomId, participant);

    logger.info(`User ${displayName} joined session ${session.roomId}`);

    return { session, participant };
  }

  /**
   * Leave a collaboration session
   */
  async leaveSession(roomId: string, socketId: string): Promise<void> {
    const session = await Session.findOne({ roomId });
    if (!session) return;

    session.removeParticipant(socketId);

    if (session.participants.length === 0) {
      session.isActive = false;
    }

    await session.save();

    // Remove from Redis
    await this.removeRedisPresence(roomId, socketId);

    logger.info(`Socket ${socketId} left session ${roomId}`);
  }

  /**
   * Update cursor position
   */
  async updateCursor(
    roomId: string,
    socketId: string,
    cursor: { line: number; column: number; filePath?: string }
  ): Promise<void> {
    const session = await Session.findOne({ roomId });
    if (!session) return;

    session.updateCursor(socketId, cursor);
    await session.save();

    // Update in Redis for fast access
    await cache.set(`cursor:${roomId}:${socketId}`, cursor, PRESENCE_TTL);
  }

  /**
   * Get all participants in a room
   */
  async getParticipants(roomId: string): Promise<IParticipant[]> {
    // Try Redis first for faster response
    const cached = await cache.get<IParticipant[]>(`participants:${roomId}`);
    if (cached) return cached;

    const session = await Session.findOne({ roomId });
    if (!session) return [];

    // Cache for quick access
    await cache.set(
      `participants:${roomId}`,
      session.participants,
      PRESENCE_TTL
    );

    return session.participants;
  }

  /**
   * Get session by room ID
   */
  async getSession(roomId: string): Promise<ISession | null> {
    return Session.findOne({ roomId });
  }

  /**
   * Check if user is in session
   */
  async isUserInSession(roomId: string, userId: string): Promise<boolean> {
    const participants = await this.getParticipants(roomId);
    return participants.some(p => p.userId.toString() === userId);
  }

  // ── Redis Helpers ──

  private async updateRedisPresence(
    roomId: string,
    participant: IParticipant
  ): Promise<void> {
    // Store individual participant
    await cache.set(
      `presence:${roomId}:${participant.socketId}`,
      {
        ...participant,
        userId: participant.userId.toString(),
      },
      SESSION_TTL
    );

    // Update participants list
    const participants = await this.getParticipants(roomId);
    await cache.set(`participants:${roomId}`, participants, SESSION_TTL);
  }

  private async removeRedisPresence(
    roomId: string,
    socketId: string
  ): Promise<void> {
    await cache.del(`presence:${roomId}:${socketId}`);
    await cache.del(`cursor:${roomId}:${socketId}`);

    // Update participants list
    const session = await Session.findOne({ roomId });
    if (session) {
      await cache.set(
        `participants:${roomId}`,
        session.participants,
        SESSION_TTL
      );
    }
  }
}

export const presenceService = new PresenceService();
