import { socketService } from '$lib/services';
import type { CursorPosition, Participant } from '$lib/types';
import { derived, writable } from 'svelte/store';

interface CollaborationState {
  isConnected: boolean;
  isConnecting: boolean;
  participants: Map<string, Participant>;
  cursorPositions: Map<string, CursorPosition>;
  error: string | null;
}

const initialState: CollaborationState = {
  isConnected: false,
  isConnecting: false,
  participants: new Map(),
  cursorPositions: new Map(),
  error: null,
};

function createCollaborationStore() {
  const { subscribe, set, update } = writable<CollaborationState>(initialState);

  return {
    subscribe,

    connect(projectId: string) {
      update(state => ({ ...state, isConnecting: true, error: null }));

      socketService.connect(projectId);

      // Socket event handlers
      socketService.on('connected', () => {
        update(state => ({
          ...state,
          isConnected: true,
          isConnecting: false,
        }));
      });

      socketService.on('disconnected', () => {
        update(state => ({
          ...state,
          isConnected: false,
          isConnecting: false,
        }));
      });

      socketService.on('participant-joined', participant => {
        update(state => {
          const newParticipants = new Map(state.participants);
          newParticipants.set(participant.id, participant);
          return { ...state, participants: newParticipants };
        });
      });

      socketService.on('participant-left', participantId => {
        update(state => {
          const newParticipants = new Map(state.participants);
          newParticipants.delete(participantId);
          const newCursors = new Map(state.cursorPositions);
          newCursors.delete(participantId);
          return {
            ...state,
            participants: newParticipants,
            cursorPositions: newCursors,
          };
        });
      });

      socketService.on('participants-updated', participants => {
        update(state => {
          const newParticipants = new Map();
          participants.forEach(p => newParticipants.set(p.id, p));
          return { ...state, participants: newParticipants };
        });
      });

      socketService.on('cursor-updated', ({ participantId, position }) => {
        update(state => {
          const newCursors = new Map(state.cursorPositions);
          newCursors.set(participantId, position);
          return { ...state, cursorPositions: newCursors };
        });
      });

      socketService.on('error', error => {
        update(state => ({
          ...state,
          error: error.message,
          isConnecting: false,
        }));
      });
    },

    disconnect() {
      socketService.disconnect();
      set(initialState);
    },

    sendCursorPosition(position: CursorPosition) {
      socketService.sendCursorUpdate(position);
    },

    changeActiveFile(fileId: string) {
      socketService.changeActiveFile(fileId);
    },

    sendDocUpdate(update: Uint8Array) {
      socketService.sendDocUpdate(update);
    },

    getYDoc() {
      return socketService.getYDoc();
    },

    clearError() {
      update(state => ({ ...state, error: null }));
    },

    reset() {
      this.disconnect();
      set(initialState);
    },
  };
}

export const collaborationStore = createCollaborationStore();

// Derived stores
export const isCollaborationConnected = derived(
  collaborationStore,
  $collab => $collab.isConnected
);
export const collaborators = derived(collaborationStore, $collab =>
  Array.from($collab.participants.values())
);
export const cursorPositions = derived(
  collaborationStore,
  $collab => $collab.cursorPositions
);
