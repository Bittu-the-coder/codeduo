/**
 * Minimal y-websocket compatible WebSocket server.
 * Handles Yjs document synchronisation and awareness without requiring auth,
 * so anonymous/guest users can collaborate freely.
 */

import type { IncomingMessage } from 'http';
import * as decoding from 'lib0/decoding.js';
import * as encoding from 'lib0/encoding.js';
import { WebSocket, WebSocketServer } from 'ws';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as syncProtocol from 'y-protocols/sync.js';
import * as Y from 'yjs';

import { logger } from '../../shared/utils/logger.js';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

interface RoomData {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Set<WebSocket>;
}

const rooms = new Map<string, RoomData>();
const connToRoom = new Map<WebSocket, string>();

function getRoom(roomId: string): RoomData {
  if (rooms.has(roomId)) {
    return rooms.get(roomId)!;
  }

  const doc = new Y.Doc();
  const conns: Set<WebSocket> = new Set();
  const awareness = new awarenessProtocol.Awareness(doc);

  // Broadcast awareness updates to all connections in room
  awareness.on(
    'update',
    ({
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      const changedClients = [...added, ...updated, ...removed];
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
      );
      const msg = encoding.toUint8Array(encoder);
      conns.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
      });
    }
  );

  // Broadcast doc updates to all connections except the origin
  doc.on('update', (update: Uint8Array, origin: unknown) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const msg = encoding.toUint8Array(encoder);
    conns.forEach(ws => {
      if (ws !== origin && ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
  });

  const room: RoomData = { doc, awareness, conns };
  rooms.set(roomId, room);
  return room;
}

function closeConn(ws: WebSocket): void {
  const roomId = connToRoom.get(ws);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (room) {
    room.conns.delete(ws);
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      [ws as unknown as number],
      null
    );

    // Lazily clean up empty rooms after 30 s
    if (room.conns.size === 0) {
      setTimeout(() => {
        const r = rooms.get(roomId);
        if (r && r.conns.size === 0) {
          rooms.delete(roomId);
          logger.info(`[YWS] Room "${roomId}" cleaned up (empty)`);
        }
      }, 30_000);
    }
  }

  connToRoom.delete(ws);
}

export function createYjsWebSocketServer(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // URL path is the room ID, e.g. ws://host/my-room-id
    const rawPath = (req.url ?? '/').split('?')[0];
    const roomId = decodeURIComponent(rawPath.replace(/^\/+/, '')) || 'default';

    logger.info(`[YWS] Client connected → room: "${roomId}"`);

    const room = getRoom(roomId);
    room.conns.add(ws);
    connToRoom.set(ws, roomId);

    // ── Initial sync: send SYNC_STEP_1 so client sends back its state ──
    {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeSyncStep1(encoder, room.doc);
      ws.send(encoding.toUint8Array(encoder));
    }

    // ── Send existing awareness states ──
    const states = room.awareness.getStates();
    if (states.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          room.awareness,
          Array.from(states.keys())
        )
      );
      ws.send(encoding.toUint8Array(encoder));
    }

    ws.on('message', (rawData: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        const buf = Buffer.isBuffer(rawData)
          ? rawData
          : Buffer.from(rawData as ArrayBuffer);
        const message = new Uint8Array(buf);
        const decoder = decoding.createDecoder(message);
        const msgType = decoding.readVarUint(decoder);

        switch (msgType) {
          case MESSAGE_SYNC: {
            const replyEncoder = encoding.createEncoder();
            encoding.writeVarUint(replyEncoder, MESSAGE_SYNC);
            // Pass ws as origin so the doc.on('update') handler can skip it
            syncProtocol.readSyncMessage(decoder, replyEncoder, room.doc, ws);
            if (encoding.length(replyEncoder) > 1) {
              ws.send(encoding.toUint8Array(replyEncoder));
            }
            break;
          }

          case MESSAGE_AWARENESS: {
            const update = decoding.readVarUint8Array(decoder);
            awarenessProtocol.applyAwarenessUpdate(room.awareness, update, ws);
            break;
          }

          default:
            break;
        }
      } catch (err) {
        logger.error(`[YWS] Message error in room "${roomId}":`, err);
      }
    });

    ws.on('close', () => {
      closeConn(ws);
      logger.info(`[YWS] Client disconnected ← room: "${roomId}"`);
    });

    ws.on('error', err => {
      logger.error(`[YWS] Socket error in room "${roomId}":`, err);
      closeConn(ws);
    });
  });

  return wss;
}
