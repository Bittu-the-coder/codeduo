import type { EditorSettings, EditorTab, FileNode } from '$lib/types';
import { derived, get, writable } from 'svelte/store';

interface EditorState {
  activeFileId: string | null;
  activeFile: FileNode | null;
  openTabs: EditorTab[];
  settings: EditorSettings;
  isDirty: boolean;
  isExecuting: boolean;
  executionOutput: string;
}

const defaultSettings: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  theme: 'vs-dark',
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
};

const initialState: EditorState = {
  activeFileId: null,
  activeFile: null,
  openTabs: [],
  settings: defaultSettings,
  isDirty: false,
  isExecuting: false,
  executionOutput: '',
};

function createEditorStore() {
  const store = writable<EditorState>(initialState);
  const { subscribe, set, update } = store;

  // Find file by ID in the file tree
  function findFileById(node: FileNode, id: string): FileNode | null {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findFileById(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Get file path
  function getFilePath(
    node: FileNode,
    targetId: string,
    currentPath = ''
  ): string | null {
    const path = currentPath ? `${currentPath}/${node.name}` : node.name;
    if (node.id === targetId) return path;
    if (node.children) {
      for (const child of node.children) {
        const found = getFilePath(child, targetId, path);
        if (found) return found;
      }
    }
    return null;
  }

  return {
    subscribe,

    openFile(file: FileNode, fileTree: FileNode) {
      const path = getFilePath(fileTree, file.id) || file.name;

      update(state => {
        const existingTab = state.openTabs.find(t => t.fileId === file.id);

        if (existingTab) {
          return {
            ...state,
            activeFileId: file.id,
            activeFile: file,
          };
        }

        const newTab: EditorTab = {
          fileId: file.id,
          name: file.name,
          path,
          isDirty: false,
        };

        return {
          ...state,
          activeFileId: file.id,
          activeFile: file,
          openTabs: [...state.openTabs, newTab],
        };
      });
    },

    closeTab(fileId: string) {
      update(state => {
        const tabIndex = state.openTabs.findIndex(t => t.fileId === fileId);
        const newTabs = state.openTabs.filter(t => t.fileId !== fileId);

        let newActiveId = state.activeFileId;
        let newActiveFile = state.activeFile;

        if (state.activeFileId === fileId) {
          if (newTabs.length > 0) {
            const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
            newActiveId = newTabs[newActiveIndex].fileId;
            // Note: activeFile would need to be updated from the file tree
            newActiveFile = null;
          } else {
            newActiveId = null;
            newActiveFile = null;
          }
        }

        return {
          ...state,
          openTabs: newTabs,
          activeFileId: newActiveId,
          activeFile: newActiveFile,
        };
      });
    },

    closeAllTabs() {
      update(state => ({
        ...state,
        openTabs: [],
        activeFileId: null,
        activeFile: null,
        isDirty: false,
      }));
    },

    closeOtherTabs(fileId: string) {
      update(state => ({
        ...state,
        openTabs: state.openTabs.filter(t => t.fileId === fileId),
      }));
    },

    setActiveFile(fileId: string, file: FileNode) {
      update(state => ({
        ...state,
        activeFileId: fileId,
        activeFile: file,
      }));
    },

    updateFileContent(fileId: string, content: string) {
      update(state => ({
        ...state,
        activeFile:
          state.activeFile?.id === fileId
            ? { ...state.activeFile, content }
            : state.activeFile,
        isDirty: true,
        openTabs: state.openTabs.map(tab =>
          tab.fileId === fileId ? { ...tab, isDirty: true } : tab
        ),
      }));
    },

    markTabSaved(fileId: string) {
      update(state => ({
        ...state,
        isDirty: false,
        openTabs: state.openTabs.map(tab =>
          tab.fileId === fileId ? { ...tab, isDirty: false } : tab
        ),
      }));
    },

    setExecuting(isExecuting: boolean) {
      update(state => ({ ...state, isExecuting }));
    },

    setExecutionOutput(output: string) {
      update(state => ({ ...state, executionOutput: output }));
    },

    appendExecutionOutput(output: string) {
      update(state => ({
        ...state,
        executionOutput: state.executionOutput + output,
      }));
    },

    clearExecutionOutput() {
      update(state => ({ ...state, executionOutput: '' }));
    },

    updateSettings(settings: Partial<EditorSettings>) {
      update(state => ({
        ...state,
        settings: { ...state.settings, ...settings },
      }));
    },

    loadSettings() {
      try {
        const saved = localStorage.getItem('editorSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          update(state => ({
            ...state,
            settings: { ...defaultSettings, ...settings },
          }));
        }
      } catch {
        // Use defaults
      }
    },

    saveSettings() {
      const state = get(store);
      localStorage.setItem('editorSettings', JSON.stringify(state.settings));
    },

    reset() {
      set(initialState);
    },
  };
}

export const editorStore = createEditorStore();

// Derived stores
export const activeFile = derived(editorStore, $editor => $editor.activeFile);
export const openTabs = derived(editorStore, $editor => $editor.openTabs);
export const editorSettings = derived(editorStore, $editor => $editor.settings);
export const isExecuting = derived(editorStore, $editor => $editor.isExecuting);
export const executionOutput = derived(
  editorStore,
  $editor => $editor.executionOutput
);
