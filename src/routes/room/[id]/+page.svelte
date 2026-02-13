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
  import {
    getDefaultTheme,
    getThemeById,
    themes,
    type ThemeDefinition,
  } from '$lib/themes';
  import { onDestroy, onMount } from 'svelte';

  let { data } = $props();
  const roomId = data.roomId;

  // ── State ──
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

  // ── Name Entry ──
  let userName: string = $state('');
  let nameInput: string = $state('');
  let showNameModal: boolean = $state(true);

  // ── Refs ──
  let editorInstance: any = null;
  let monacoInstance: any = null;
  let collaboration: CollaborationInstance | null = null;
  let awarenessInterval: ReturnType<typeof setInterval> | null = null;

  // ── Resize ──
  let consoleWidth: number = $state(380);
  let isResizing: boolean = $state(false);
  let mainContentEl: HTMLDivElement;

  // ── Persist preferences ──
  function loadPreferences() {
    if (!browser) return;
    const savedTheme = localStorage.getItem('codeduo-theme');
    const savedLang = localStorage.getItem('codeduo-lang');
    const savedName = localStorage.getItem('codeduo-username');
    if (savedTheme) {
      const t = getThemeById(savedTheme);
      if (t) currentTheme = t;
    }
    if (savedLang) {
      const l = getLanguageById(savedLang);
      if (l) currentLanguage = l;
    }
    if (savedName) {
      userName = savedName;
      showNameModal = false;
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
        addConsoleLine('info', '✓ Code is auto-synced across all participants');
      }
    );
  }

  async function setupCollaboration(editor: any) {
    if (!browser) return;
    try {
      const { MonacoBinding } = await import('y-monaco');
      collaboration = createCollaboration(roomId, userName || undefined);

      // Initialize with boilerplate if document is empty
      if (collaboration.ytext.toString() === '') {
        collaboration.ytext.insert(0, currentLanguage.boilerplate);
      }

      new MonacoBinding(
        collaboration.ytext,
        editor.getModel(),
        new Set([editor]),
        collaboration.awareness
      );
      awarenessInterval = setInterval(() => {
        if (collaboration) {
          connectedUsers = getConnectedUsers(collaboration.awareness);
        }
      }, 1000);
      addConsoleLine('info', `🔗 Connected to room: ${roomId}`);
    } catch (err) {
      addConsoleLine(
        'stderr',
        `⚠ Collaboration unavailable — editing locally`
      );
    }
  }

  // ── Code Execution ──
  async function runCode() {
    if (execution.status === 'running') return;
    if (!editorInstance) return;

    const code = editorInstance.getValue();
    if (!code.trim()) {
      addConsoleLine('stderr', '⚠ No code to execute');
      return;
    }

    execution = { ...defaultExecutionState, status: 'running' };
    addConsoleLine('info', `▶ Running ${currentLanguage.displayName}...`);

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
    currentLanguage = lang;
    showLangDropdown = false;

    if (editorInstance && !collaboration) {
      editorInstance.setValue(lang.boilerplate);
    }

    if (collaboration) {
      collaboration.ytext.delete(0, collaboration.ytext.length);
      collaboration.ytext.insert(0, lang.boilerplate);
    }

    savePreferences();
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
  });

  onDestroy(() => {
    collaboration?.destroy();
    if (awarenessInterval) clearInterval(awarenessInterval);
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
  />

  <!-- Main Content -->
  <div class="main-content" bind:this={mainContentEl}>
    <div class="editor-panel">
      <MonacoEditor
        language={currentLanguage.monacoId}
        theme={currentTheme.id}
        onEditorReady={handleEditorReady}
      />
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

  .editor-panel {
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
