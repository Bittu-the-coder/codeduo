<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import {
    createCollaboration,
    getConnectedUsers,
    type AwarenessUser,
    type CollaborationInstance,
  } from '$lib/collaboration';
  import ConsolePanel from '$lib/components/ConsolePanel.svelte';
  import FileExplorer from '$lib/components/FileExplorer.svelte';
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
  import NameModal from '$lib/components/NameModal.svelte';
  import StatusBar from '$lib/components/StatusBar.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import { defaultExecutionState, type ExecutionState } from '$lib/index';
  import {
    getDefaultLanguage,
    getLanguageById,
    languages,
    type LanguageConfig,
  } from '$lib/languages';
  import { executeCode } from '$lib/piston';
  import { projectService } from '$lib/services';
  import { isAuthenticated, isAuthLoading } from '$lib/stores';
  import {
    getDefaultTheme,
    getThemeById,
    themes,
    type ThemeDefinition,
  } from '$lib/themes';
  import type { FileTreeNode } from '$lib/types';
  import { onDestroy, onMount } from 'svelte';

  let { data }: { data: any } = $props();
  const roomId = $derived(data.roomId);
  const defaultFiles: FileTreeNode[] = [
    {
      name: 'main.cpp',
      path: 'main.cpp',
      type: 'file',
      content: '',
      language: 'cpp',
    },
  ];
  const initialFiles = $derived(
    (data.project?.fileTree as FileTreeNode[] | undefined) || defaultFiles
  );

  // ── State ──
  // ── State ──
  // Using $state.raw for complex objects if deep reactivity isn't needed, but here we likely need it.
  // We initialize from data, but since data is a prop, we need to handle updates if the user navigates
  // while keeping the component mounted. Ideally, we use a key in layout, but let's sync inputs.

  let currentLanguage: LanguageConfig = $state(getDefaultLanguage());
  let currentTheme: ThemeDefinition = $state(getDefaultTheme());
  let execution: ExecutionState = $state({ ...defaultExecutionState });
  let stdinInput: string = $state('');
  let connectedUsers: AwarenessUser[] = $state([]);
  let copied: boolean = $state(false);
  let showThemeDropdown: boolean = $state(false);
  let showLangDropdown: boolean = $state(false);
  let showUsersPanel: boolean = $state(false);
  let consoleLines: {
    type: 'stdout' | 'stderr' | 'info' | 'stdin';
    text: string;
  }[] = $state([]);

  // ── File System ──
  // Initialize from DB data if available
  // We use a derived initialization pattern or an effect to reset if roomId changes
  let files: FileTreeNode[] = $state([]);

  // Open tabs state
  let openTabs: string[] = $state([]);
  let activeFile = $state('');

  $effect(() => {
    if (files.length === 0) {
      files = initialFiles;
    }

    if (!activeFile && files.length > 0) {
      activeFile = files[0].path;
    }
  });

  // Initialize open tabs with active file
  $effect(() => {
    if (activeFile && !openTabs.includes(activeFile)) {
      openTabs = [...openTabs, activeFile];
    }
  });

  // Fetch project client-side if not loaded server-side
  let projectLoadAttempted = false;
  $effect(() => {
    if (!browser || projectLoadAttempted) return;

    // Wait for auth to finish loading
    if ($isAuthLoading) {
      console.log('[PROJECT] Waiting for auth to load...');
      return;
    }

    // Only attempt if we have a valid project ID and no data from server
    if (!data.project && roomId.match(/^[0-9a-fA-F]{24}$/)) {
      projectLoadAttempted = true;
      console.log(
        '[PROJECT] Fetching project client-side, authenticated:',
        $isAuthenticated
      );

      (async () => {
        try {
          const response = await projectService.getProject(roomId);
          console.log('[PROJECT] Response:', response);
          if (response.success && response.data) {
            // Cast fileTree to FileTreeNode[] since structure is compatible
            const loadedFiles =
              (response.data.fileTree as unknown as FileTreeNode[]) || [];
            if (loadedFiles.length > 0) {
              files = loadedFiles;
              activeFile = loadedFiles[0].path;
              console.log(
                '[PROJECT] Loaded files:',
                loadedFiles.map(f => f.path)
              );
              addConsoleLine('info', 'Project loaded successfully.');

              // Re-bind editor to the new active file if collaboration is ready
              if (collaboration && editorInstance) {
                bindEditorToFile(activeFile);
              }
            }
          } else {
            console.log('[PROJECT] No project data in response');
          }
        } catch (e) {
          console.error('[PROJECT] Failed to fetch:', e);
        }
      })();
    }
  });

  // ── Name Entry ──
  const initialUserName = browser
    ? localStorage.getItem('codeduo-username') || ''
    : '';
  let userName: string = $state(initialUserName);
  let nameInput: string = $state('');
  let showNameModal: boolean = $state(!initialUserName);

  // ── Refs ──
  let editorInstance: any = null;
  let monacoInstance: any = null;
  let collaboration: CollaborationInstance | null = null;
  let binding: any = null;
  let awarenessInterval: ReturnType<typeof setInterval> | null = null;

  // Store models per file path to prevent content sharing
  let fileModels: Map<string, any> = new Map();

  // ── Resize ──
  let consoleWidth: number = $state(380);
  let isResizing: boolean = $state(false);
  let isSaving: boolean = $state(false);
  let mainContentEl: HTMLDivElement;

  // ── Persist preferences ──
  function loadPreferences() {
    if (!browser) return;
    const savedTheme = localStorage.getItem('codeduo-theme');
    const savedLang = localStorage.getItem('codeduo-lang');
    if (savedTheme) {
      const t = getThemeById(savedTheme);
      if (t) currentTheme = t;
    }
    if (savedLang) {
      const l = getLanguageById(savedLang);
      if (l) currentLanguage = l;
    }
  }

  function savePreferences() {
    if (!browser) return;
    localStorage.setItem('codeduo-theme', currentTheme.id);
    localStorage.setItem('codeduo-lang', currentLanguage.id);
  }

  // ── Editor Ready ──
  function handleEditorReady(editor: any, monaco: any) {
    editorInstance = editor;
    monacoInstance = monaco;
    setupCollaboration(editor);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      (e: Event) => {
        saveProject(); // Trigger save on Ctrl+S
      }
    );
  }

  // ── File Switching ──
  function handleFileSelect(event: CustomEvent) {
    const newPath = event.detail.path;
    if (newPath === activeFile) return;

    activeFile = newPath;

    // Add to open tabs if not already open
    if (!openTabs.includes(newPath)) {
      openTabs = [...openTabs, newPath];
    }

    updateLanguageFromPath(newPath);

    if (collaboration && editorInstance) {
      bindEditorToFile(activeFile);
    }
  }

  function updateLanguageFromPath(path: string) {
    const ext = path.split('.').pop();
    if (ext === 'js') selectLanguage(getLanguageById('javascript')!);
    else if (ext === 'ts') selectLanguage(getLanguageById('typescript')!);
    else if (ext === 'py') selectLanguage(getLanguageById('python')!);
    else if (ext === 'java') selectLanguage(getLanguageById('java')!);
    else if (ext === 'cpp') selectLanguage(getLanguageById('cpp')!);
    else if (ext === 'c') selectLanguage(getLanguageById('c')!);
  }

  // ── Tree Helper Functions ──
  function findNodeByPath(
    nodes: FileTreeNode[],
    path: string
  ): FileTreeNode | null {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  function findParentNode(
    nodes: FileTreeNode[],
    path: string
  ): FileTreeNode | null {
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    if (!parentPath) return null;
    return findNodeByPath(nodes, parentPath);
  }

  function addNodeToTree(
    nodes: FileTreeNode[],
    parentPath: string | null,
    newNode: FileTreeNode
  ): FileTreeNode[] {
    if (!parentPath) {
      // Add to root
      return [...nodes, newNode];
    }

    return nodes.map(node => {
      if (node.path === parentPath && node.type === 'folder') {
        return {
          ...node,
          children: [...(node.children || []), newNode],
        };
      }
      if (node.children) {
        return {
          ...node,
          children: addNodeToTree(node.children, parentPath, newNode),
        };
      }
      return node;
    });
  }

  function removeNodeFromTree(
    nodes: FileTreeNode[],
    path: string
  ): FileTreeNode[] {
    return nodes.filter(node => {
      if (node.path === path) return false;
      if (node.children) {
        node.children = removeNodeFromTree(node.children, path);
      }
      return true;
    });
  }

  function updateNodeInTree(
    nodes: FileTreeNode[],
    oldPath: string,
    updates: Partial<FileTreeNode>
  ): FileTreeNode[] {
    return nodes.map(node => {
      if (node.path === oldPath) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeInTree(node.children, oldPath, updates),
        };
      }
      return node;
    });
  }

  function moveNodeInTree(
    nodes: FileTreeNode[],
    oldPath: string,
    newParentPath: string,
    newPath: string
  ): FileTreeNode[] {
    // Find and remove the node
    let movedNode: FileTreeNode | null = null;
    const treeCopy = JSON.parse(JSON.stringify(nodes));

    function findAndRemove(items: FileTreeNode[]): FileTreeNode[] {
      return items.filter(item => {
        if (item.path === oldPath) {
          movedNode = { ...item, path: newPath };
          return false;
        }
        if (item.children) {
          item.children = findAndRemove(item.children);
        }
        return true;
      });
    }

    let result = findAndRemove(treeCopy);

    if (movedNode) {
      result = addNodeToTree(result, newParentPath, movedNode);
    }

    return result;
  }

  function handleFileCreate(event: CustomEvent) {
    const newFile = event.detail;
    const parentPath = newFile.path.includes('/')
      ? newFile.path.substring(0, newFile.path.lastIndexOf('/'))
      : null;

    const newNode: FileTreeNode = {
      name: newFile.name,
      path: newFile.path,
      type: newFile.type,
      content: newFile.type === 'file' ? '' : undefined,
      language: newFile.type === 'file' ? newFile.language : undefined,
      children: newFile.type === 'folder' ? [] : undefined,
    };

    files = addNodeToTree(files, parentPath, newNode);

    if (collaboration) {
      // @ts-ignore
      const { Text } = window.Y;
      const filesMap = collaboration.ydoc.getMap('files');
      if (newFile.type === 'file') {
        filesMap.set(newFile.path, new Text(''));
      }
      const projectMeta = collaboration.ydoc.getMap('project-meta');
      projectMeta.set('file-list', files);
    }

    if (newFile.type === 'file') {
      activeFile = newFile.path;
      if (!openTabs.includes(newFile.path)) {
        openTabs = [...openTabs, newFile.path];
      }
      updateLanguageFromPath(newFile.path);
      if (collaboration && editorInstance) bindEditorToFile(activeFile);
    }
  }

  function handleFileRename(event: CustomEvent) {
    const { oldPath, newPath, newName } = event.detail;

    files = updateNodeInTree(files, oldPath, { path: newPath, name: newName });

    if (collaboration) {
      const filesMap = collaboration.ydoc.getMap('files');
      const yText = filesMap.get(oldPath);
      if (yText) {
        filesMap.delete(oldPath);
        filesMap.set(newPath, yText);
      }
      const projectMeta = collaboration.ydoc.getMap('project-meta');
      projectMeta.set('file-list', files);
    }

    // Move file model to new path (dispose old, will be recreated on bind)
    const model = fileModels.get(oldPath);
    if (model) {
      model.dispose();
      fileModels.delete(oldPath);
    }

    // Update open tabs
    openTabs = openTabs.map(tab => (tab === oldPath ? newPath : tab));

    if (activeFile === oldPath) {
      activeFile = newPath;
      updateLanguageFromPath(newPath);
      // Re-bind to create a new model with the new path
      if (collaboration && editorInstance) bindEditorToFile(newPath);
    }
  }

  function handleFileDelete(event: CustomEvent) {
    const file = event.detail;

    files = removeNodeFromTree(files, file.path);

    if (collaboration) {
      const filesMap = collaboration.ydoc.getMap('files');
      filesMap.delete(file.path);
      const projectMeta = collaboration.ydoc.getMap('project-meta');
      projectMeta.set('file-list', files);
    }

    // Dispose the Monaco model for this file
    const model = fileModels.get(file.path);
    if (model) {
      model.dispose();
      fileModels.delete(file.path);
    }

    // Close tab if open
    openTabs = openTabs.filter(tab => tab !== file.path);

    // If we deleted the active file, select another one
    if (activeFile === file.path) {
      activeFile = openTabs.length > 0 ? openTabs[openTabs.length - 1] : '';
      if (activeFile && collaboration && editorInstance) {
        bindEditorToFile(activeFile);
        updateLanguageFromPath(activeFile);
      }
    }
  }

  function handleFileMove(event: CustomEvent) {
    const { oldPath, newPath, targetFolder } = event.detail;

    files = moveNodeInTree(files, oldPath, targetFolder, newPath);

    if (collaboration) {
      const filesMap = collaboration.ydoc.getMap('files');
      const yText = filesMap.get(oldPath);
      if (yText) {
        filesMap.delete(oldPath);
        filesMap.set(newPath, yText);
      }
      const projectMeta = collaboration.ydoc.getMap('project-meta');
      projectMeta.set('file-list', files);
    }

    // Update open tabs
    openTabs = openTabs.map(tab => (tab === oldPath ? newPath : tab));

    if (activeFile === oldPath) {
      activeFile = newPath;
    }
  }

  // ── Tab Management ──
  function closeTab(path: string) {
    openTabs = openTabs.filter(tab => tab !== path);
    if (activeFile === path) {
      activeFile = openTabs.length > 0 ? openTabs[openTabs.length - 1] : '';
      if (activeFile && collaboration && editorInstance) {
        bindEditorToFile(activeFile);
        updateLanguageFromPath(activeFile);
      }
    }
  }

  function selectTab(path: string) {
    if (path === activeFile) return;
    activeFile = path;
    updateLanguageFromPath(path);
    if (collaboration && editorInstance) {
      bindEditorToFile(activeFile);
    }
  }

  let isSettingUp = false;

  async function setupCollaboration(editor: any) {
    if (!browser) return;
    if (isSettingUp) return;

    isSettingUp = true;
    cleanup();

    try {
      const { MonacoBinding } = await import('y-monaco');
      // @ts-ignore
      const { Text } = await import('yjs');
      // @ts-ignore
      window.Y = { Text };

      collaboration = createCollaboration(roomId, userName || undefined);

      let hasInitialized = false;
      collaboration.provider.on('sync', (isSynced: boolean) => {
        if (isSynced && !hasInitialized && collaboration) {
          hasInitialized = true;
          const filesMap = collaboration.ydoc.getMap('files');
          const projectMeta = collaboration.ydoc.getMap('project-meta');

          console.log('[COLLAB] Synced. YJS files count:', filesMap.size);

          // Helper to recursively extract files from tree (only creates if not exist)
          function extractFilesFromTree(nodes: FileTreeNode[]): void {
            nodes.forEach(node => {
              if (node.type === 'file') {
                // Only create yText if it doesn't already exist in YJS
                if (!filesMap.has(node.path)) {
                  console.log(
                    '[COLLAB] Creating yText for:',
                    node.path,
                    'content length:',
                    (node.content || '').length
                  );
                  const yText = new Text(node.content || '');
                  filesMap.set(node.path, yText);
                } else {
                  console.log('[COLLAB] yText already exists for:', node.path);
                }
              }
              if (node.children) {
                extractFilesFromTree(node.children);
              }
            });
          }

          // Hydrate if empty - use data.project.fileTree or current files state
          const sourceFileTree = data.project?.fileTree || files;
          if (sourceFileTree && sourceFileTree.length > 0) {
            console.log(
              '[COLLAB] Hydrating YJS from fileTree, count:',
              sourceFileTree.length,
              'existing YJS files:',
              filesMap.size
            );
            collaboration.ydoc.transact(() => {
              extractFilesFromTree(sourceFileTree);
              projectMeta.set('file-list', sourceFileTree);
            });
          }

          // Sync files from remote if available
          const remoteFileList = projectMeta.get('file-list') as
            | FileTreeNode[]
            | undefined;
          if (remoteFileList && remoteFileList.length > 0) {
            files = remoteFileList;
            console.log(
              '[COLLAB] Loaded file list from remote:',
              files.map((f: any) => f.path)
            );
          }

          if (activeFile) {
            bindEditorToFile(activeFile);
          }
        }
      });

      collaboration.ydoc.getMap('project-meta').observe(() => {
        const remoteFiles = collaboration?.ydoc
          .getMap('project-meta')
          .get('file-list') as FileTreeNode[] | undefined;
        if (remoteFiles) {
          files = remoteFiles;
        }
      });

      awarenessInterval = setInterval(() => {
        if (collaboration) {
          connectedUsers = getConnectedUsers(collaboration.awareness);
        }
      }, 1000);
      addConsoleLine('info', `Connected to room: ${roomId}`);
    } catch (err) {
      console.error(err);
      addConsoleLine('stderr', `Collaboration unavailable: ${err}`);
    } finally {
      isSettingUp = false;
    }
  }

  async function bindEditorToFile(filePath: string) {
    if (!collaboration || !editorInstance || !monacoInstance) {
      console.log('[BIND] Cannot bind - missing:', {
        collaboration: !!collaboration,
        editorInstance: !!editorInstance,
        monacoInstance: !!monacoInstance,
      });
      return;
    }

    console.log('[BIND] Switching to file:', filePath);

    // Always destroy the current binding first
    if (binding) {
      binding.destroy();
      binding = null;
    }

    const { MonacoBinding } = await import('y-monaco');
    // @ts-ignore
    const { Text } = await import('yjs');

    const filesMap = collaboration.ydoc.getMap('files');

    // Find existing content from files array
    function findContent(nodes: FileTreeNode[]): string | null {
      for (const node of nodes) {
        if (node.path === filePath && node.type === 'file') {
          return node.content || '';
        }
        if (node.children) {
          const found = findContent(node.children);
          if (found !== null) return found;
        }
      }
      return null;
    }

    // Get or create yText for this specific file
    let yText: any = filesMap.get(filePath);
    const existingContent = findContent(files) || '';

    if (!yText) {
      console.log(
        '[BIND] Creating new yText for:',
        filePath,
        'content length:',
        existingContent.length
      );
      yText = new Text(existingContent);
      filesMap.set(filePath, yText);
    } else {
      console.log(
        '[BIND] Found existing yText for:',
        filePath,
        'content length:',
        yText.toString().length
      );
    }

    // Get file extension for language detection
    const ext = filePath.split('.').pop() || '';
    const langMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    const language = langMap[ext] || 'plaintext';

    // Check if model already exists (Monaco caches by URI)
    const uri = monacoInstance.Uri.parse(
      `file:///${encodeURIComponent(filePath)}`
    );
    let model = monacoInstance.editor.getModel(uri);

    const content = yText.toString();

    if (!model) {
      // Create a new model for this file
      model = monacoInstance.editor.createModel(content, language, uri);
      fileModels.set(filePath, model);
      console.log(
        '[BIND] Created new model for:',
        filePath,
        'language:',
        language
      );
    } else {
      // Model exists - just update content if needed
      if (model.getValue() !== content) {
        model.setValue(content);
      }
      fileModels.set(filePath, model);
      console.log('[BIND] Using existing model for:', filePath);
    }

    // Set the model on the editor
    editorInstance.setModel(model);

    // Create new binding between YJS text and this specific model
    binding = new MonacoBinding(
      yText as any,
      model,
      new Set([editorInstance]),
      collaboration.awareness
    );

    console.log('[BIND] Binding created for:', filePath);
  }

  async function saveProject() {
    if (isSaving || !collaboration) {
      console.log(
        '[SAVE] Blocked: isSaving=',
        isSaving,
        'collaboration=',
        !!collaboration
      );
      return;
    }

    // Only allow saving if we actually have a valid project ID
    if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
      addConsoleLine(
        'info',
        'This is a temporary room. Sign in to create projects.'
      );
      return;
    }

    isSaving = true;
    addConsoleLine('info', 'Saving project...');

    try {
      const filesMap = collaboration.ydoc.getMap('files');

      // First, sync current editor content to YJS for the active file
      if (editorInstance && activeFile) {
        const currentContent = editorInstance.getValue();
        const existingYText = filesMap.get(activeFile);
        console.log(
          '[SAVE] Active file:',
          activeFile,
          'Editor content length:',
          currentContent.length
        );

        // Update YJS with current editor content
        // @ts-ignore
        const { Text } = window.Y;
        if (!existingYText || existingYText.toString() !== currentContent) {
          collaboration.ydoc.transact(() => {
            filesMap.delete(activeFile);
            const newYText = new Text(currentContent);
            filesMap.set(activeFile, newYText);
          });
        }
      }

      console.log('[SAVE] Files in state:', files);
      console.log('[SAVE] Files in YJS map:', Array.from(filesMap.keys()));

      // Recursive function to update file contents in tree
      function updateFileContents(nodes: FileTreeNode[]): FileTreeNode[] {
        return nodes.map(node => {
          if (node.type === 'file') {
            // For active file, use editor content directly
            if (node.path === activeFile && editorInstance) {
              const editorContent = editorInstance.getValue();
              console.log(
                '[SAVE] File:',
                node.path,
                '(active) content length:',
                editorContent.length
              );
              return { ...node, content: editorContent };
            }
            // For other files, use YJS content
            const yText = filesMap.get(node.path);
            console.log(
              '[SAVE] File:',
              node.path,
              'yText exists:',
              !!yText,
              'content length:',
              yText?.toString()?.length || 0
            );
            return {
              ...node,
              content: yText ? yText.toString() : node.content || '',
            };
          }
          if (node.children) {
            return { ...node, children: updateFileContents(node.children) };
          }
          return node;
        });
      }

      const updatedFiles = updateFileContents(files);
      console.log('[SAVE] Sending fileTree:', updatedFiles);

      const response = await projectService.updateProject(roomId, {
        fileTree: updatedFiles,
      });

      console.log('[SAVE] Response:', response);

      if (response.success) {
        addConsoleLine('info', 'Project saved successfully.');
      } else {
        console.error('[SAVE] Save failed:', response.error);
        addConsoleLine(
          'stderr',
          `Failed to save: ${response.error?.message || 'Unknown error'}`
        );
      }
    } catch (e) {
      console.error('[SAVE] Exception:', e);
      addConsoleLine('stderr', `Error saving: ${e}`);
    } finally {
      isSaving = false;
    }
  }

  // ── Code Execution ──
  async function runCode() {
    if (execution.status === 'running') return;
    if (!editorInstance) return;

    const code = editorInstance.getValue();
    if (!code.trim()) {
      addConsoleLine('stderr', 'No code to execute');
      return;
    }

    execution = { ...defaultExecutionState, status: 'running' };
    addConsoleLine('info', `Running ${currentLanguage.displayName}...`);

    const result = await executeCode(
      currentLanguage.pistonRuntime,
      currentLanguage.pistonVersion,
      code,
      stdinInput
    );

    execution = {
      status: result.exitCode === 0 ? 'success' : 'error',
      stdout: result.stdout,
      stderr: result.stderr,
      output: result.output,
      exitCode: result.exitCode,
      executionTime: result.executionTime,
    };

    if (result.stdout) addConsoleLine('stdout', result.stdout);
    if (result.stderr) addConsoleLine('stderr', result.stderr);

    const statusIcon = result.exitCode === 0 ? '✓' : '✗';
    addConsoleLine(
      'info',
      `${statusIcon} Exited with code ${result.exitCode} (${result.executionTime}ms)`
    );
  }

  function addConsoleLine(
    type: 'stdout' | 'stderr' | 'info' | 'stdin',
    text: string
  ) {
    consoleLines = [...consoleLines, { type, text }];
  }

  function clearConsole() {
    consoleLines = [];
  }

  // ── Actions ──
  function selectLanguage(lang: LanguageConfig) {
    // Optimistic update
    currentLanguage = lang;
    showLangDropdown = false;
    savePreferences();
    // Note: We don't reset content here anymore as we rely on Yjs file content
  }

  function selectTheme(theme: ThemeDefinition) {
    currentTheme = theme;
    showThemeDropdown = false;
    savePreferences();
    applyUiTheme(theme);
  }

  function applyUiTheme(theme: ThemeDefinition) {
    if (!browser) return;
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', theme.uiColors.bg);
    root.style.setProperty('--bg-secondary', theme.uiColors.surface);
    root.style.setProperty('--bg-tertiary', theme.uiColors.surface);
    root.style.setProperty('--text-primary', theme.uiColors.text);
    root.style.setProperty('--text-secondary', theme.uiColors.textSecondary);
    root.style.setProperty('--border-default', theme.uiColors.border);
    root.style.setProperty('--accent-primary', theme.uiColors.accent);
  }

  async function copyRoomLink() {
    if (!browser) return;
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function goHome() {
    goto('/');
  }

  function submitName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    userName = trimmed;
    showNameModal = false;
    if (browser) localStorage.setItem('codeduo-username', trimmed);
  }

  // ── Lifecycle ──
  onMount(() => {
    loadPreferences();
    window.addEventListener('beforeunload', cleanup);
  });

  function cleanup() {
    console.log('[CLEANUP] Cleaning up resources...');
    if (binding) {
      binding.destroy();
      binding = null;
    }
    collaboration?.destroy();
    if (awarenessInterval) clearInterval(awarenessInterval);
    // Dispose all file models
    fileModels.forEach((model, path) => {
      console.log('[CLEANUP] Disposing model:', path);
      model?.dispose();
    });
    fileModels.clear();
  }

  onDestroy(() => {
    cleanup();
    if (browser) window.removeEventListener('beforeunload', cleanup);
  });

  // ── Close dropdowns on outside click ──
  function handleWindowClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      showThemeDropdown = false;
      showLangDropdown = false;
    }
    if (!target.closest('.users-panel-wrapper')) {
      showUsersPanel = false;
    }
  }

  // ── Resize handlers ──
  function startResize(e: MouseEvent) {
    e.preventDefault();
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onResize);
    window.addEventListener('mouseup', stopResize);
  }

  function onResize(e: MouseEvent) {
    if (!isResizing || !mainContentEl) return;
    const rect = mainContentEl.getBoundingClientRect();
    const newWidth = rect.right - e.clientX;
    consoleWidth = Math.max(200, Math.min(600, newWidth));
  }

  function stopResize() {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', stopResize);
  }
</script>

<svelte:head>
  <title>Room {roomId} — CodeDuo | Collaborative Code Editor</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta
    name="description"
    content="Collaborative coding session on CodeDuo. Write and execute code together in real-time."
  />
</svelte:head>

<svelte:window onclick={handleWindowClick} />

<NameModal {roomId} show={showNameModal} bind:nameInput onSubmit={submitName} />

<div
  class="editor-page"
  style="--ui-bg: {currentTheme.uiColors.bg}; --ui-surface: {currentTheme
    .uiColors.surface}; --ui-text: {currentTheme.uiColors
    .text}; --ui-text-secondary: {currentTheme.uiColors
    .textSecondary}; --ui-border: {currentTheme.uiColors
    .border}; --ui-accent: {currentTheme.uiColors.accent};"
>
  <Toolbar
    {roomId}
    {currentTheme}
    {currentLanguage}
    {connectedUsers}
    {execution}
    {themes}
    {languages}
    {copied}
    bind:showThemeDropdown
    bind:showLangDropdown
    bind:showUsersPanel
    onSelectLanguage={selectLanguage}
    onSelectTheme={selectTheme}
    onCopyRoomLink={copyRoomLink}
    onGoHome={goHome}
    onRunCode={runCode}
    onSaveCode={saveProject}
  />

  <!-- Main Content -->
  <div class="main-content" bind:this={mainContentEl}>
    <div class="file-explorer-wrapper">
      <FileExplorer
        {files}
        {activeFile}
        on:select={handleFileSelect}
        on:create={handleFileCreate}
        on:rename={handleFileRename}
        on:delete={handleFileDelete}
        on:move={handleFileMove}
      />
    </div>

    <div class="editor-panel">
      <!-- Tab Bar -->
      <div class="tab-bar">
        {#each openTabs as tabPath}
          {@const fileName = tabPath.split('/').pop()}
          <div
            class="tab"
            class:active={tabPath === activeFile}
            role="button"
            tabindex="0"
            onclick={() => selectTab(tabPath)}
            onkeydown={e => e.key === 'Enter' && selectTab(tabPath)}
          >
            <span class="tab-name">{fileName}</span>
            <button
              class="tab-close"
              onclick={e => {
                e.stopPropagation();
                closeTab(tabPath);
              }}
              title="Close"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        {/each}
      </div>

      <div class="editor-content">
        <MonacoEditor
          language={currentLanguage.monacoId}
          theme={currentTheme.id}
          onEditorReady={handleEditorReady}
        />
      </div>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="resize-handle"
      class:active={isResizing}
      onmousedown={startResize}
    ></div>

    <div class="console-wrapper" style="width: {consoleWidth}px;">
      <ConsolePanel
        {consoleLines}
        bind:stdinInput
        {execution}
        onClear={clearConsole}
      />
    </div>
  </div>

  <StatusBar {connectedUsers} {currentLanguage} {roomId} />
</div>

<style>
  .editor-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--ui-bg, var(--bg-primary));
    color: var(--ui-text, var(--text-primary));
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .file-explorer-wrapper {
    flex-shrink: 0;
    height: 100%;
  }

  .editor-panel {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .tab-bar {
    display: flex;
    background: var(--ui-surface, var(--bg-secondary));
    border-bottom: 1px solid var(--ui-border, var(--border-default));
    overflow-x: auto;
    flex-shrink: 0;
  }

  .tab-bar::-webkit-scrollbar {
    height: 3px;
  }

  .tab-bar::-webkit-scrollbar-thumb {
    background: var(--ui-border, var(--border-default));
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-right: 1px solid var(--ui-border, var(--border-default));
    color: var(--ui-text-secondary, var(--text-secondary));
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }

  .tab:hover {
    background: var(--ui-bg, var(--bg-tertiary));
  }

  .tab.active {
    background: var(--ui-bg, var(--bg-primary));
    color: var(--ui-text, var(--text-primary));
    border-bottom: 2px solid var(--ui-accent, var(--accent-primary));
  }

  .tab-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 2px;
    border-radius: 3px;
    color: var(--ui-text-secondary, var(--text-secondary));
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s;
  }

  .tab:hover .tab-close {
    opacity: 1;
  }

  .tab-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--ui-text, var(--text-primary));
  }

  .editor-content {
    flex: 1;
    overflow: hidden;
  }

  .console-wrapper {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-left: 1px solid var(--ui-border, var(--border-default));
  }

  .resize-handle {
    width: 4px;
    cursor: col-resize;
    background: transparent;
    transition: background var(--transition-fast);
    flex-shrink: 0;
    position: relative;
  }

  .resize-handle:hover,
  .resize-handle.active {
    background: var(--ui-accent, var(--accent-primary));
  }

  /* Responsive */
  @media (max-width: 768px) {
    .main-content {
      flex-direction: column;
    }

    .console-wrapper {
      width: 100% !important;
      height: 220px;
      border-left: none;
      border-top: 1px solid var(--ui-border, var(--border-default));
    }

    .resize-handle {
      width: 100%;
      height: 5px;
      cursor: row-resize;
    }
  }

  @media (max-width: 480px) {
    .console-wrapper {
      height: 180px;
    }
  }
</style>
