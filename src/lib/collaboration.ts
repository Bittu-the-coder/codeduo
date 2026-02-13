// Y.js collaboration setup for real-time document sync

import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

const WS_SERVER = 'ws://localhost:4444';

export interface CollaborationInstance {
	ydoc: Y.Doc;
	provider: WebsocketProvider;
	ytext: Y.Text;
	awareness: WebsocketProvider['awareness'];
	destroy: () => void;
}

// Generate a random user color for cursors
function getRandomColor(): string {
	const colors = [
		'#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
		'#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
		'#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
		'#F1948A', '#AED6F1', '#A3E4D7', '#FAD7A0'
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

// Generate a random username
function getRandomUsername(): string {
	const adjectives = ['Swift', 'Clever', 'Bold', 'Calm', 'Sharp', 'Agile', 'Quick', 'Bright'];
	const nouns = ['Coder', 'Dev', 'Hacker', 'Builder', 'Maker', 'Ninja', 'Guru', 'Pilot'];
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	return `${adj}${noun}`;
}

export function createCollaboration(roomId: string, displayName?: string): CollaborationInstance {
	const ydoc = new Y.Doc();

	const provider = new WebsocketProvider(WS_SERVER, roomId, ydoc, {
		connect: true,
		maxBackoffTime: 2500
	});

	const ytext = ydoc.getText('monaco');

	// Set local awareness state (cursor info)
	const userColor = getRandomColor();
	const userName = displayName || getRandomUsername();

	provider.awareness.setLocalStateField('user', {
		name: userName,
		color: userColor,
		colorLight: userColor + '40'
	});

	function destroy() {
		provider.disconnect();
		provider.destroy();
		ydoc.destroy();
	}

	return {
		ydoc,
		provider,
		ytext,
		awareness: provider.awareness,
		destroy
	};
}

export type AwarenessUser = {
	name: string;
	color: string;
	colorLight: string;
};

export function getConnectedUsers(awareness: WebsocketProvider['awareness']): AwarenessUser[] {
	const users: AwarenessUser[] = [];
	awareness.getStates().forEach((state) => {
		if (state.user) {
			users.push(state.user as AwarenessUser);
		}
	});
	return users;
}
