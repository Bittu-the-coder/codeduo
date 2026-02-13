<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import {
    createCollaboration,
    getConnectedUsers,
    type AwarenessUser,
    type CollaborationInstance,
  } from '$lib/collaboration';
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
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

    // Set boilerplate
    editor.setValue(currentLanguage.boilerplate);

    // Setup Y.js collaboration
    setupCollaboration(editor);

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      (e: Event) => {
        // Prevent default save dialog - code is auto-synced
        addConsoleLine('info', '✓ Code is auto-synced across all participants');
      }
    );
  }

  async function setupCollaboration(editor: any) {
    if (!browser) return;

    try {
      const { MonacoBinding } = await import('y-monaco');
      collaboration = createCollaboration(roomId, userName || undefined);

      // Bind Y.js to Monaco
      new MonacoBinding(
        collaboration.ytext,
        editor.getModel(),
        new Set([editor]),
        collaboration.awareness
      );

      // Monitor connected users
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

    if (result.stdout) {
      addConsoleLine('stdout', result.stdout);
    }
    if (result.stderr) {
      addConsoleLine('stderr', result.stderr);
    }

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

  // ── Name submit ──
  function submitName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    userName = trimmed;
    showNameModal = false;
    if (browser) {
      localStorage.setItem('codeduo-username', trimmed);
    }
  }

  function handleNameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitName();
    }
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

{#if showNameModal}
  <!-- ── Name Entry Modal ── -->
  <div class="modal-overlay">
    <div class="modal-card">
      <div class="modal-logo">
        <span class="logo-bracket">&lt;</span><span class="logo-text">CD</span
        ><span class="logo-bracket">/&gt;</span>
      </div>
      <h2 class="modal-title">Join Room</h2>
      <p class="modal-subtitle">Enter your name so others know who you are</p>
      <div class="modal-input-group">
        <input
          type="text"
          class="modal-input"
          placeholder="Your display name"
          bind:value={nameInput}
          onkeydown={handleNameKeydown}
          maxlength="20"
          autofocus
        />
      </div>
      <button
        class="modal-btn"
        onclick={submitName}
        disabled={!nameInput.trim()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline
            points="10 17 15 12 10 7"
          /><line x1="15" y1="12" x2="3" y2="12" /></svg
        >
        Join Room
      </button>
      <p class="modal-room-id">Room: <span class="font-mono">{roomId}</span></p>
    </div>
  </div>
{/if}

<div
  class="editor-page"
  style="--ui-bg: {currentTheme.uiColors.bg}; --ui-surface: {currentTheme
    .uiColors.surface}; --ui-text: {currentTheme.uiColors
    .text}; --ui-text-secondary: {currentTheme.uiColors
    .textSecondary}; --ui-border: {currentTheme.uiColors
    .border}; --ui-accent: {currentTheme.uiColors.accent};"
>
  <!-- ── Toolbar ── -->
  <header class="toolbar">
    <div class="toolbar-left">
      <button class="toolbar-logo" onclick={goHome} title="Back to home">
        <span class="logo-bracket">&lt;</span><span class="logo-text">CD</span
        ><span class="logo-bracket">/&gt;</span>
      </button>

      <div class="toolbar-divider"></div>

      <!-- Room ID -->
      <button class="room-badge" onclick={copyRoomLink} title="Copy room link">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
          /><path
            d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
          /></svg
        >
        <span class="room-id">{roomId}</span>
        {#if copied}
          <span class="copied-badge">Copied!</span>
        {/if}
      </button>
    </div>

    <div class="toolbar-center">
      <!-- Language Selector -->
      <div class="dropdown">
        <button
          class="dropdown-trigger"
          onclick={() => {
            showLangDropdown = !showLangDropdown;
            showThemeDropdown = false;
          }}
        >
          <span class="lang-icon">{currentLanguage.icon}</span>
          <span>{currentLanguage.displayName}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg
          >
        </button>
        {#if showLangDropdown}
          <div class="dropdown-menu">
            {#each languages as lang}
              <button
                class="dropdown-item"
                class:active={lang.id === currentLanguage.id}
                onclick={() => selectLanguage(lang)}
              >
                <span class="lang-icon">{lang.icon}</span>
                <span>{lang.displayName}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Theme Selector -->
      <div class="dropdown">
        <button
          class="dropdown-trigger"
          onclick={() => {
            showThemeDropdown = !showThemeDropdown;
            showLangDropdown = false;
          }}
        >
          <div
            class="theme-dot"
            style="background: {currentTheme.uiColors.accent};"
          ></div>
          <span>{currentTheme.displayName}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg
          >
        </button>
        {#if showThemeDropdown}
          <div class="dropdown-menu theme-menu">
            <div class="dropdown-section-label">Dark Themes</div>
            {#each themes.filter(t => t.type === 'dark') as theme}
              <button
                class="dropdown-item"
                class:active={theme.id === currentTheme.id}
                onclick={() => selectTheme(theme)}
              >
                <div
                  class="theme-dot"
                  style="background: {theme.uiColors.accent};"
                ></div>
                <span>{theme.displayName}</span>
              </button>
            {/each}
            <div class="dropdown-section-label">Light Themes</div>
            {#each themes.filter(t => t.type === 'light') as theme}
              <button
                class="dropdown-item"
                class:active={theme.id === currentTheme.id}
                onclick={() => selectTheme(theme)}
              >
                <div
                  class="theme-dot"
                  style="background: {theme.uiColors.accent};"
                ></div>
                <span>{theme.displayName}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="toolbar-right">
      <!-- Connected Users -->
      <div class="users-panel-wrapper">
        <button
          class="users-trigger"
          onclick={() => (showUsersPanel = !showUsersPanel)}
          title="{connectedUsers.length} connected"
        >
          {#each connectedUsers.slice(0, 4) as user}
            <div class="user-avatar" style="background: {user.color};">
              {user.name.charAt(0)}
            </div>
          {/each}
          {#if connectedUsers.length > 4}
            <div class="user-avatar user-overflow">
              +{connectedUsers.length - 4}
            </div>
          {/if}
          {#if connectedUsers.length === 0}
            <div class="connection-status offline">
              <span class="status-dot"></span>
              Connecting...
            </div>
          {/if}
          {#if connectedUsers.length > 0}
            <span class="users-count">{connectedUsers.length}</span>
          {/if}
        </button>

        {#if showUsersPanel}
          <div class="users-dropdown">
            <div class="users-dropdown-header">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
                  cx="9"
                  cy="7"
                  r="4"
                /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                /></svg
              >
              In this room ({connectedUsers.length})
            </div>
            {#each connectedUsers as user}
              <div class="users-dropdown-item">
                <div class="user-dot" style="background: {user.color};"></div>
                <span class="user-name-label">{user.name}</span>
              </div>
            {/each}
            {#if connectedUsers.length === 0}
              <div class="users-dropdown-empty">No one else here yet</div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Run Button -->
      <button
        class="btn-run"
        class:running={execution.status === 'running'}
        onclick={runCode}
        disabled={execution.status === 'running'}
        title="Run code (Ctrl+Enter)"
      >
        {#if execution.status === 'running'}
          <div class="spinner"></div>
          Running...
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg
          >
          Run
        {/if}
      </button>
    </div>
  </header>

  <!-- ── Main Content ── -->
  <div class="main-content" bind:this={mainContentEl}>
    <!-- Editor Panel -->
    <div class="editor-panel">
      <MonacoEditor
        language={currentLanguage.monacoId}
        theme={currentTheme.id}
        onEditorReady={handleEditorReady}
      />
    </div>

    <!-- Resize Handle -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="resize-handle"
      class:active={isResizing}
      onmousedown={startResize}
    ></div>

    <!-- Console Panel -->
    <div class="console-panel" style="width: {consoleWidth}px;">
      <div class="console-header">
        <div class="console-tabs">
          <span class="console-tab active">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><polyline points="4 17 10 11 4 5" /><line
                x1="12"
                y1="19"
                x2="20"
                y2="19"
              /></svg
            >
            Console
          </span>
        </div>
        <div class="console-actions">
          {#if execution.executionTime !== null}
            <span class="exec-time">{execution.executionTime}ms</span>
          {/if}
          <button
            class="console-btn"
            onclick={clearConsole}
            title="Clear console"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><line x1="18" y1="6" x2="6" y2="18" /><line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              /></svg
            >
          </button>
        </div>
      </div>

      <div class="console-output" id="console-output">
        {#if consoleLines.length === 0}
          <div class="console-empty">
            <span class="console-prompt">$</span>
            Run your code to see output here...
          </div>
        {/if}
        {#each consoleLines as line}
          <div class="console-line {line.type}">
            <pre>{line.text}</pre>
          </div>
        {/each}
      </div>

      <!-- Stdin Input -->
      <div class="stdin-section">
        <div class="stdin-label">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><polyline points="4 17 10 11 4 5" /><line
              x1="12"
              y1="19"
              x2="20"
              y2="19"
            /></svg
          >
          stdin
        </div>
        <textarea
          class="stdin-input"
          bind:value={stdinInput}
          placeholder="Provide input for your program..."
          rows="3"
        ></textarea>
      </div>
    </div>
  </div>

  <!-- ── Status Bar ── -->
  <footer class="statusbar">
    <div class="statusbar-left">
      <span class="status-item">
        <span
          class="status-dot-sm"
          class:connected={connectedUsers.length > 0}
          class:disconnected={connectedUsers.length === 0}
        ></span>
        {connectedUsers.length > 0 ? 'Connected' : 'Offline'}
      </span>
      <span class="status-item">{currentLanguage.displayName}</span>
    </div>
    <div class="statusbar-right">
      <span class="status-item">Room: {roomId}</span>
      <span class="status-item"
        >{connectedUsers.length} user{connectedUsers.length !== 1
          ? 's'
          : ''}</span
      >
      <span class="status-item">CodeDuo</span>
    </div>
  </footer>
</div>

<style>
  /* ── Page Layout ── */
  .editor-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--ui-bg, var(--bg-primary));
    color: var(--ui-text, var(--text-primary));
    overflow: hidden;
  }

  /* ── Toolbar ── */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--toolbar-height);
    padding: 0 var(--space-3);
    background: var(--ui-surface, var(--bg-secondary));
    border-bottom: 1px solid var(--ui-border, var(--border-default));
    z-index: var(--z-sticky);
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .toolbar-left {
    flex-shrink: 0;
  }

  .toolbar-center {
    flex: 1;
    justify-content: center;
  }

  .toolbar-right {
    flex-shrink: 0;
  }

  .toolbar-logo {
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--ui-text, var(--text-primary));
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .toolbar-logo:hover {
    background: var(--bg-hover);
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: var(--ui-border, var(--border-default));
  }

  .room-badge {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    background: var(--surface-glass);
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-full);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ui-text-secondary, var(--text-secondary));
    transition: all var(--transition-fast);
    position: relative;
  }

  .room-badge:hover {
    border-color: var(--ui-accent, var(--accent-primary));
    color: var(--ui-accent, var(--accent-primary));
  }

  .copied-badge {
    position: absolute;
    top: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 8px;
    background: var(--status-success);
    color: #000;
    border-radius: var(--radius-sm);
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    animation: fadeIn 0.2s ease-out;
  }

  /* ── Dropdowns ── */
  .dropdown {
    position: relative;
  }

  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--ui-text-secondary, var(--text-secondary));
    transition: all var(--transition-fast);
    border: 1px solid transparent;
  }

  .dropdown-trigger:hover {
    background: var(--bg-hover);
    color: var(--ui-text, var(--text-primary));
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    min-width: 200px;
    background: var(--ui-surface, var(--bg-secondary));
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    padding: var(--space-1);
    animation: fadeIn 0.15s ease-out;
    max-height: 400px;
    overflow-y: auto;
  }

  .theme-menu {
    min-width: 220px;
  }

  .dropdown-section-label {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--ui-text-secondary, var(--text-muted));
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--ui-text, var(--text-primary));
    transition: all var(--transition-fast);
    text-align: left;
  }

  .dropdown-item:hover {
    background: var(--bg-hover);
  }

  .dropdown-item.active {
    background: var(--bg-active);
    color: var(--brand-light);
  }

  .lang-icon {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    min-width: 20px;
    text-align: center;
  }

  .theme-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Users Panel ── */
  .users-panel-wrapper {
    position: relative;
  }

  .users-trigger {
    display: flex;
    align-items: center;
    gap: 0;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
    cursor: pointer;
    border: 1px solid transparent;
  }

  .users-trigger:hover {
    background: var(--bg-hover);
    border-color: var(--ui-border, var(--border-default));
  }

  .users-count {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--ui-text-secondary, var(--text-secondary));
    margin-left: var(--space-2);
  }

  .user-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    border: 2px solid var(--ui-surface, var(--bg-secondary));
    margin-left: -6px;
    text-transform: uppercase;
  }

  .user-avatar:first-child {
    margin-left: 0;
  }

  .user-overflow {
    background: var(--bg-elevated);
    font-size: 10px;
    color: var(--text-secondary);
  }

  .users-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 220px;
    background: var(--ui-surface, var(--bg-secondary));
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    padding: var(--space-2);
    animation: fadeIn 0.15s ease-out;
  }

  .users-dropdown-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--ui-text-secondary, var(--text-muted));
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--ui-border, var(--border-default));
    margin-bottom: var(--space-1);
    padding-bottom: var(--space-2);
  }

  .users-dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
  }

  .user-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 6px currentColor;
  }

  .user-name-label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ui-text, var(--text-primary));
  }

  .users-dropdown-empty {
    padding: var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-muted);
    text-align: center;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--status-warning);
    animation: pulse 2s infinite;
  }

  /* ── Run Button ── */
  .btn-run {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: linear-gradient(135deg, #2d8f5e, #1a6b3f);
    color: #fff;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    transition: all var(--transition-fast);
    border: 1px solid rgba(45, 143, 94, 0.3);
  }

  .btn-run:hover:not(:disabled) {
    background: linear-gradient(135deg, #34a66b, #1f7a48);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(45, 143, 94, 0.3);
  }

  .btn-run:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-run.running {
    background: linear-gradient(135deg, #b8860b, #8b6914);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* ── Main Content ── */
  .main-content {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }

  .editor-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .resize-handle {
    width: 6px;
    background: var(--ui-border, var(--border-default));
    cursor: col-resize;
    flex-shrink: 0;
    transition: background var(--transition-fast);
    position: relative;
  }

  .resize-handle::after {
    content: '';
    position: absolute;
    inset: 0 -3px;
  }

  .resize-handle:hover,
  .resize-handle.active {
    background: var(--ui-accent, var(--accent-primary));
  }

  /* ── Console Panel ── */
  .console-panel {
    display: flex;
    flex-direction: column;
    background: var(--console-bg);
    border-left: 1px solid var(--ui-border, var(--border-default));
    flex-shrink: 0;
    min-width: 200px;
    max-width: 600px;
  }

  .console-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
  }

  .console-tabs {
    display: flex;
    gap: var(--space-1);
  }

  .console-tab {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--console-text);
    border-radius: var(--radius-sm);
  }

  .console-tab.active {
    background: rgba(255, 255, 255, 0.06);
  }

  .console-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .exec-time {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .console-btn {
    padding: var(--space-1);
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .console-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--console-text);
  }

  .console-output {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  .console-empty {
    color: var(--text-muted);
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .console-prompt {
    color: var(--console-stdout);
    font-weight: 700;
  }

  .console-line {
    margin-bottom: 2px;
  }

  .console-line pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: inherit;
    font-size: inherit;
  }

  .console-line.stdout pre {
    color: var(--console-stdout);
  }

  .console-line.stderr pre {
    color: var(--console-stderr);
  }

  .console-line.info pre {
    color: var(--text-muted);
    font-style: italic;
  }

  .console-line.stdin pre {
    color: var(--console-stdin);
  }

  /* ── Stdin ── */
  .stdin-section {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding: var(--space-2) var(--space-3);
    flex-shrink: 0;
  }

  .stdin-label {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--console-stdin);
    margin-bottom: var(--space-1);
  }

  .stdin-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-sm);
    padding: var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--console-text);
    resize: vertical;
    min-height: 40px;
    transition: border-color var(--transition-fast);
  }

  .stdin-input:focus {
    border-color: var(--console-stdin);
  }

  .stdin-input::placeholder {
    color: rgba(201, 209, 217, 0.3);
  }

  /* ── Status Bar ── */
  .statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--statusbar-height);
    padding: 0 var(--space-3);
    background: var(--brand-dark);
    font-size: 11px;
    color: rgba(231, 246, 242, 0.8);
    flex-shrink: 0;
    z-index: var(--z-sticky);
  }

  .statusbar-left,
  .statusbar-right {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .status-dot-sm {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .status-dot-sm.connected {
    background: var(--status-success);
  }

  .status-dot-sm.disconnected {
    background: var(--status-warning);
    animation: pulse 2s infinite;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .main-content {
      flex-direction: column;
    }

    .console-panel {
      width: 100%;
      height: 250px;
      border-left: none;
      border-top: 1px solid var(--ui-border, var(--border-default));
    }

    .resize-handle {
      width: 100%;
      height: 4px;
      cursor: row-resize;
    }

    .toolbar-center {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .room-badge .room-id {
      max-width: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  /* ── Name Entry Modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    animation: fadeIn 0.3s ease-out;
  }

  .modal-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-2xl);
    padding: var(--space-10) var(--space-8);
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: var(--shadow-lg), var(--shadow-glow-lg);
    animation: fadeInUp 0.4s ease-out;
  }

  .modal-logo {
    font-family: var(--font-mono);
    font-size: var(--text-2xl);
    font-weight: 700;
    margin-bottom: var(--space-4);
  }

  .modal-title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .modal-subtitle {
    font-size: var(--text-sm);
    color: var(--text-muted);
    margin-bottom: var(--space-6);
  }

  .modal-input-group {
    margin-bottom: var(--space-5);
  }

  .modal-input {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    font-size: var(--text-base);
    text-align: center;
    transition: border-color var(--transition-fast);
  }

  .modal-input:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .modal-input::placeholder {
    color: var(--text-muted);
  }

  .modal-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3) var(--space-6);
    background: linear-gradient(135deg, #395b64, #2c3333);
    color: var(--brand-light);
    border: 1px solid var(--brand-medium);
    border-radius: var(--radius-lg);
    font-size: var(--text-base);
    font-weight: 600;
    transition: all var(--transition-base);
    cursor: pointer;
  }

  .modal-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      var(--shadow-md),
      0 0 20px rgba(165, 201, 202, 0.15);
  }

  .modal-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .modal-room-id {
    margin-top: var(--space-4);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
</style>
