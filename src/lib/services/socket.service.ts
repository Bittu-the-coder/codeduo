import type { CursorPosition, Participant } from '$lib/types';
import { io, type Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { authService } from './auth.service';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export interface SocketEvents {
  'participant-joined': (participant: Participant) => void;
  'participant-left': (participantId: string) => void;
  'participants-updated': (participants: Participant[]) => void;
  'cursor-updated': (data: {
    participantId: string;
    position: CursorPosition;
  }) => void;
  'sync-update': (update: Uint8Array) => void;
  'awareness-update': (update: Uint8Array) => void;
  'file-changed': (data: { fileId: string; participantId: string }) => void;
  error: (error: { code: string; message: string }) => void;
  connected: () => void;
  disconnected: () => void;
}

type EventCallback<T extends keyof SocketEvents> = SocketEvents[T];

class SocketService {
  private socket: Socket | null = null;
  private ydoc: Y.Doc | null = null;
  private projectId: string | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(projectId: string): void {
    if (this.socket?.connected && this.projectId === projectId) {
      return;
    }

    // Disconnect existing connection
    this.disconnect();

    this.projectId = projectId;
    this.ydoc = new Y.Doc();

    const token = authService.getAccessToken();

    this.socket = io(SOCKET_URL, {
      auth: { token },
      query: { projectId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Join project room
      this.socket?.emit('join-project', { projectId: this.projectId });
    });

    this.socket.on('disconnect', () => {
      this.emit('disconnected');
    });

    this.socket.on('connect_error', error => {
      this.reconnectAttempts++;
      this.emit('error', {
        code: 'CONNECTION_ERROR',
        message: error.message,
      });
    });

    // Collaboration events
    this.socket.on('participant-joined', (participant: Participant) => {
      this.emit('participant-joined', participant);
    });

    this.socket.on('participant-left', (participantId: string) => {
      this.emit('participant-left', participantId);
    });

    this.socket.on('participants-list', (participants: Participant[]) => {
      this.emit('participants-updated', participants);
    });

    this.socket.on(
      'cursor-update',
      (data: { participantId: string; position: CursorPosition }) => {
        this.emit('cursor-updated', data);
      }
    );

    // Yjs sync events
    this.socket.on('sync-update', (update: ArrayBuffer) => {
      if (this.ydoc) {
        Y.applyUpdate(this.ydoc, new Uint8Array(update));
      }
      this.emit('sync-update', new Uint8Array(update));
    });

    this.socket.on('sync-state', (state: ArrayBuffer) => {
      if (this.ydoc) {
        Y.applyUpdate(this.ydoc, new Uint8Array(state));
      }
    });

    this.socket.on(
      'file-changed',
      (data: { fileId: string; participantId: string }) => {
        this.emit('file-changed', data);
      }
    );

    this.socket.on('error', (error: { code: string; message: string }) => {
      this.emit('error', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.ydoc) {
      this.ydoc.destroy();
      this.ydoc = null;
    }

    this.projectId = null;
    this.reconnectAttempts = 0;
  }

  // ── Event Emitter ──
  on<T extends keyof SocketEvents>(event: T, callback: EventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off<T extends keyof SocketEvents>(
    event: T,
    callback: EventCallback<T>
  ): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit<T extends keyof SocketEvents>(
    event: T,
    ...args: Parameters<SocketEvents[T]>
  ): void {
    this.eventListeners.get(event)?.forEach(callback => {
      (callback as Function)(...args);
    });
  }

  // ── Collaboration Actions ──
  sendCursorUpdate(position: CursorPosition): void {
    this.socket?.emit('cursor-update', position);
  }

  sendDocUpdate(update: Uint8Array): void {
    this.socket?.emit('doc-update', update);
  }

  changeActiveFile(fileId: string): void {
    this.socket?.emit('change-file', { fileId });
  }

  sendChatMessage(message: string): void {
    this.socket?.emit('chat-message', { message });
  }

  // ── Getters ──
  getYDoc(): Y.Doc | null {
    return this.ydoc;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getProjectId(): string | null {
    return this.projectId;
  }
}

export const socketService = new SocketService();
