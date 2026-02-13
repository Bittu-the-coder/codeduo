import { WebSocket, WebSocketServer } from 'ws';
import * as Y from 'yjs';

// ── Configuration ──
const PORT = parseInt(process.env.PORT || '4444', 10);
const HOST = process.env.HOST || '0.0.0.0';

// ── Types ──
interface Room {
	doc: Y.Doc;
	clients: Set<WebSocket>;
	awareness: Map<number, Uint8Array>;
}

// ── Room Management ──
const rooms = new Map<string, Room>();

function getOrCreateRoom(name: string): Room {
	let room = rooms.get(name);
	if (!room) {
		const doc = new Y.Doc();
		room = {
			doc,
			clients: new Set(),
			awareness: new Map()
		};
		rooms.set(name, room);
		console.log(`📁 Room created: ${name}`);
	}
	return room;
}

function cleanupRoom(name: string): void {
	const room = rooms.get(name);
	if (room && room.clients.size === 0) {
		room.doc.destroy();
		rooms.delete(name);
		console.log(`🗑️  Room destroyed: ${name}`);
	}
}

// ── Message Types (y-websocket protocol) ──
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

// ── WebSocket Server ──
const wss = new WebSocketServer({ port: PORT, host: HOST });

console.log(`
╔══════════════════════════════════════╗
║   🚀 CodeDuo Collaboration Server   ║
║                                      ║
║   ws://${HOST}:${PORT}               ║
╚══════════════════════════════════════╝
`);

wss.on('connection', (ws: WebSocket, req) => {
	// Extract room name from URL path
	const url = new URL(req.url || '/', `http://${req.headers.host}`);
	const roomName = url.pathname.slice(1) || 'default';

	const room = getOrCreateRoom(roomName);
	room.clients.add(ws);

	console.log(`👤 Client connected to room "${roomName}" (${room.clients.size} clients)`);

	ws.on('message', (data: Buffer) => {
		try {
			const message = new Uint8Array(data);

			// Broadcast message to all other clients in the same room
			room.clients.forEach((client) => {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(message);
				}
			});
		} catch (err) {
			console.error('Error processing message:', err);
		}
	});

	ws.on('close', () => {
		room.clients.delete(ws);
		console.log(`👤 Client disconnected from room "${roomName}" (${room.clients.size} clients)`);

		// Clean up empty rooms after a delay
		setTimeout(() => cleanupRoom(roomName), 30000);
	});

	ws.on('error', (err) => {
		console.error(`WebSocket error in room "${roomName}":`, err.message);
		room.clients.delete(ws);
	});
});

// ── Graceful Shutdown ──
process.on('SIGINT', () => {
	console.log('\n🛑 Shutting down server...');
	wss.close(() => {
		rooms.forEach((room) => room.doc.destroy());
		rooms.clear();
		console.log('✅ Server shut down gracefully');
		process.exit(0);
	});
});

// ── Stats Logging ──
setInterval(() => {
	if (rooms.size > 0) {
		let totalClients = 0;
		rooms.forEach((room) => {
			totalClients += room.clients.size;
		});
		console.log(`📊 Active: ${rooms.size} rooms, ${totalClients} clients`);
	}
}, 60000);
