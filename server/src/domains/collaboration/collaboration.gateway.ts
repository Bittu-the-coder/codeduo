import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import * as decoding from 'lib0/decoding.js';
import * as encoding from 'lib0/encoding.js';
import { Socket, Server as SocketServer } from 'socket.io';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as syncProtocol from 'y-protocols/sync.js';
import * as Y from 'yjs';

import { env, isAllowedOrigin } from '../../config/env.js';
import type { JwtPayload } from '../../shared/middleware/auth.middleware.js';
import { logger } from '../../shared/utils/logger.js';
import { projectRepository } from '../projects/project.repository.js';
import { presenceService } from './presence.service.js';
import { yjsService } from './yjs.service.js';

// Message types for y-websocket protocol
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  displayName?: string;
  roomId?: string;
  projectId?: string;
}

export function initializeCollaborationGateway(
  httpServer: HttpServer
): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, env.JWT_SECRET) as JwtPayload;
      socket.userId = decoded.userId;
      socket.displayName = decoded.email.split('@')[0]; // Default display name

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Awareness state per room
  const roomAwareness = new Map<string, awarenessProtocol.Awareness>();

  function getOrCreateAwareness(
    roomId: string,
    doc: Y.Doc
  ): awarenessProtocol.Awareness {
    if (!roomAwareness.has(roomId)) {
      const awareness = new awarenessProtocol.Awareness(doc);
      roomAwareness.set(roomId, awareness);

      // Clean up awareness on client disconnect
      awareness.on('update', ({ added, updated, removed }: any) => {
        const changedClients = added.concat(updated).concat(removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
        );
        const message = encoding.toUint8Array(encoder);

        // Broadcast to all clients in the room
        io.to(roomId).emit('yjs-message', Buffer.from(message));
      });
    }
    return roomAwareness.get(roomId)!;
  }

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id}, user: ${socket.userId}`);

    // Join collaboration room
    socket.on(
      'join-room',
      async (data: { projectId: string; displayName?: string }) => {
        try {
          const { projectId, displayName } = data;

          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          // Check access
          const access = await projectRepository.checkAccess(
            projectId,
            socket.userId
          );
          if (!access.hasAccess) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Join session
          const { session, participant } = await presenceService.joinSession(
            projectId,
            socket.userId,
            socket.id,
            displayName || socket.displayName || 'Anonymous'
          );

          socket.roomId = session.roomId;
          socket.projectId = projectId;
          socket.displayName = participant.displayName;

          // Join Socket.io room
          await socket.join(session.roomId);

          // Get Yjs document
          const doc = await yjsService.getDocument(session.roomId, projectId);
          const awareness = getOrCreateAwareness(session.roomId, doc);

          // Set awareness state for this user
          awareness.setLocalStateField('user', {
            name: participant.displayName,
            color: participant.color,
            colorLight: participant.color + '40',
          });

          // Send initial sync
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.writeSyncStep1(encoder, doc);
          socket.emit(
            'yjs-message',
            Buffer.from(encoding.toUint8Array(encoder))
          );

          // Notify others
          socket.to(session.roomId).emit('user-joined', {
            participant,
            participants: session.participants,
          });

          // Send current participants to joining user
          socket.emit('room-joined', {
            roomId: session.roomId,
            participants: session.participants,
            canEdit: access.role === 'owner' || access.role === 'editor',
          });

          logger.info(
            `User ${participant.displayName} joined room ${session.roomId}`
          );
        } catch (error) {
          logger.error('Join room error:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      }
    );

    // Handle Yjs sync messages
    socket.on('yjs-message', async (data: ArrayBuffer | Buffer) => {
      if (!socket.roomId || !socket.projectId) return;

      try {
        const message = new Uint8Array(data);
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);

        const doc = await yjsService.getDocument(
          socket.roomId,
          socket.projectId
        );
        const awareness = getOrCreateAwareness(socket.roomId, doc);

        switch (messageType) {
          case MESSAGE_SYNC: {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, MESSAGE_SYNC);
            const syncMessageType = syncProtocol.readSyncMessage(
              decoder,
              encoder,
              doc,
              null
            );

            if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
              // Respond with sync step 2
            }

            if (encoding.length(encoder) > 1) {
              socket.emit(
                'yjs-message',
                Buffer.from(encoding.toUint8Array(encoder))
              );
            }

            // Broadcast document updates to other clients
            if (syncMessageType === syncProtocol.messageYjsUpdate) {
              const update = decoding.readVarUint8Array(
                decoding.createDecoder(message)
              );
              socket.to(socket.roomId).emit('yjs-message', data);
            }
            break;
          }

          case MESSAGE_AWARENESS: {
            const update = awarenessProtocol.modifyAwarenessUpdate(
              decoding.readVarUint8Array(decoder),
              from => from // Keep original client IDs
            );
            awarenessProtocol.applyAwarenessUpdate(awareness, update, socket);
            break;
          }
        }
      } catch (error) {
        logger.error('Yjs message error:', error);
      }
    });

    // Handle cursor updates
    socket.on(
      'cursor-move',
      async (data: { line: number; column: number; filePath?: string }) => {
        if (!socket.roomId) return;

        await presenceService.updateCursor(socket.roomId, socket.id, data);

        socket.to(socket.roomId).emit('cursor-update', {
          socketId: socket.id,
          userId: socket.userId,
          displayName: socket.displayName,
          cursor: data,
        });
      }
    );

    // Handle file tree changes
    socket.on(
      'file-change',
      (data: { type: string; path: string; content?: string }) => {
        if (!socket.roomId) return;
        socket.to(socket.roomId).emit('file-change', {
          ...data,
          userId: socket.userId,
        });
      }
    );

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id}`);

      if (socket.roomId) {
        await presenceService.leaveSession(socket.roomId, socket.id);

        // Notify others
        socket.to(socket.roomId).emit('user-left', {
          socketId: socket.id,
          userId: socket.userId,
        });

        // Check if room is empty and persist
        const participants = await presenceService.getParticipants(
          socket.roomId
        );
        if (participants.length === 0 && socket.projectId) {
          // Persist document to database
          await yjsService.persistAndCleanup(socket.roomId, socket.projectId);
          roomAwareness.delete(socket.roomId);
          logger.info(`Room ${socket.roomId} is empty, document persisted`);
        }
      }
    });

    // Handle explicit leave
    socket.on('leave-room', async () => {
      if (!socket.roomId) return;

      await presenceService.leaveSession(socket.roomId, socket.id);

      socket.to(socket.roomId).emit('user-left', {
        socketId: socket.id,
        userId: socket.userId,
      });

      await socket.leave(socket.roomId);
      socket.roomId = undefined;
      socket.projectId = undefined;
    });
  });

  logger.info('Collaboration gateway initialized');
  return io;
}
