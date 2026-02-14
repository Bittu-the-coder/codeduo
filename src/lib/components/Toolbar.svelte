<script lang="ts">
  import type { AwarenessUser } from '$lib/collaboration';
  import type { ExecutionState } from '$lib/index';
  import type { LanguageConfig } from '$lib/languages';
  import type { ThemeDefinition } from '$lib/themes';
  import { LayoutDashboard } from 'lucide-svelte';

  let {
    roomId,
    currentTheme,
    currentLanguage,
    connectedUsers,
    execution,
    themes,
    languages,
    copied,
    showThemeDropdown = $bindable(false),
    showLangDropdown = $bindable(false),
    showUsersPanel = $bindable(false),
    onSelectLanguage,
    onSelectTheme,
    onCopyRoomLink,
    onGoHome,
    onRunCode,
    onSaveCode,
  }: {
    roomId: string;
    currentTheme: ThemeDefinition;
    currentLanguage: LanguageConfig;
    connectedUsers: AwarenessUser[];
    execution: ExecutionState;
    themes: ThemeDefinition[];
    languages: LanguageConfig[];
    copied: boolean;
    showThemeDropdown: boolean;
    showLangDropdown: boolean;
    showUsersPanel: boolean;
    onSelectLanguage: (lang: LanguageConfig) => void;
    onSelectTheme: (theme: ThemeDefinition) => void;
    onCopyRoomLink: () => void;
    onGoHome: () => void;
    onRunCode: () => void;
    onSaveCode: () => void;
  } = $props();
</script>

<header class="toolbar">
  <div class="toolbar-left">
    <button class="toolbar-logo" onclick={onGoHome} title="Back to home">
      <span class="logo-bracket">&lt;</span><span class="logo-text">CD</span
      ><span class="logo-bracket">/&gt;</span>
    </button>

    <div class="toolbar-divider"></div>

    <!-- Dashboard Link -->
    <a href="/dashboard" class="toolbar-link" title="Dashboard">
      <LayoutDashboard size={16} />
      <span>Dashboard</span>
    </a>

    <div class="toolbar-divider"></div>

    <!-- Room ID -->
    <button class="room-badge" onclick={onCopyRoomLink} title="Copy room link">
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
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path
          d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        />
      </svg>
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
        <span class="label-text">{currentLanguage.displayName}</span>
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
              onclick={() => onSelectLanguage(lang)}
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
        <span class="label-text">{currentTheme.displayName}</span>
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
              onclick={() => onSelectTheme(theme)}
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
              onclick={() => onSelectTheme(theme)}
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
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
                cx="9"
                cy="7"
                r="4"
              /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path
                d="M16 3.13a4 4 0 0 1 0 7.75"
              />
            </svg>
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

    <!-- Save Button -->
    <button
      class="btn-secondary"
      onclick={onSaveCode}
      title="Save Project (Ctrl+S)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        ></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      <span>Save</span>
    </button>

    <!-- Run Button -->
    <button
      class="btn-run"
      class:running={execution.status === 'running'}
      onclick={onRunCode}
      disabled={execution.status === 'running'}
      title="Run code (Ctrl+Enter)"
    >
      {#if execution.status === 'running'}
        <div class="spinner"></div>
        <span>Running...</span>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg
        >
        <span>Run</span>
      {/if}
    </button>
  </div>
</header>

<style>
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
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 2px;
    transition: opacity var(--transition-fast);
  }

  .toolbar-logo:hover {
    opacity: 0.8;
  }

  .logo-bracket {
    color: var(--brand-medium);
  }
  .logo-text {
    color: var(--brand-light);
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: var(--ui-border, var(--border-default));
    opacity: 0.5;
  }

  .toolbar-link {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    color: var(--ui-text-secondary, var(--text-secondary));
    font-size: var(--text-sm);
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .toolbar-link:hover {
    color: var(--ui-text, var(--text-primary));
    background: rgba(255, 255, 255, 0.06);
  }

  /* Room Badge */
  .room-badge {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-md);
    color: var(--ui-text-secondary, var(--text-secondary));
    font-size: var(--text-xs);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .room-badge:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--ui-text, var(--text-primary));
  }

  .room-id {
    font-family: var(--font-mono);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copied-badge {
    font-size: 10px;
    color: var(--status-success);
    font-weight: 600;
    animation: fadeIn 0.2s ease-out;
  }

  /* Dropdowns */
  .dropdown {
    position: relative;
  }

  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-md);
    color: var(--ui-text, var(--text-primary));
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .dropdown-trigger:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 180px;
    background: var(--ui-surface, var(--bg-secondary));
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-lg);
    padding: var(--space-1);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    max-height: 400px;
    overflow-y: auto;
  }

  .theme-menu {
    min-width: 200px;
  }

  .dropdown-section-label {
    padding: var(--space-2) var(--space-3);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ui-text-secondary, var(--text-muted));
    opacity: 0.6;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    border-radius: var(--radius-md);
    color: var(--ui-text, var(--text-primary));
    font-size: var(--text-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .dropdown-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .dropdown-item.active {
    background: rgba(165, 201, 202, 0.15);
    color: var(--ui-accent, var(--accent-primary));
  }

  .lang-icon {
    font-size: var(--text-base);
  }

  .theme-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Users */
  .users-panel-wrapper {
    position: relative;
  }

  .users-trigger {
    display: flex;
    align-items: center;
    gap: -4px;
    padding: var(--space-1) var(--space-2);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .users-trigger:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: white;
    margin-left: -6px;
    border: 2px solid var(--ui-surface, var(--bg-secondary));
  }

  .user-avatar:first-child {
    margin-left: 0;
  }

  .user-overflow {
    background: var(--ui-border, var(--border-default));
    font-size: 10px;
  }

  .users-count {
    font-size: var(--text-xs);
    color: var(--ui-text-secondary, var(--text-secondary));
    margin-left: var(--space-1);
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--ui-text-secondary, var(--text-secondary));
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--status-warning);
    animation: pulse 2s infinite;
  }

  .users-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 200px;
    background: var(--ui-surface, var(--bg-secondary));
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-lg);
    padding: var(--space-2);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
  }

  .users-dropdown-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--ui-text-secondary, var(--text-secondary));
    border-bottom: 1px solid var(--ui-border, var(--border-default));
    margin-bottom: var(--space-1);
  }

  .users-dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-md);
  }

  .user-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .user-name-label {
    font-size: var(--text-sm);
    color: var(--ui-text, var(--text-primary));
  }

  .users-dropdown-empty {
    padding: var(--space-3);
    text-align: center;
    font-size: var(--text-sm);
    color: var(--ui-text-secondary, var(--text-muted));
  }

  /* Run Button */
  .btn-run {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-base);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  }

  .btn-run:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  }

  .btn-run:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-run.running {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  }

  .btn-secondary {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: rgba(255, 255, 255, 0.1);
    color: var(--ui-text, var(--text-primary));
    border: 1px solid var(--ui-border, var(--border-default));
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .toolbar {
      padding: 0 var(--space-2);
      gap: var(--space-1);
    }
    .room-id {
      max-width: 80px;
    }
  }

  @media (max-width: 768px) {
    .toolbar {
      flex-wrap: wrap;
      height: auto;
      min-height: var(--toolbar-height);
      padding: var(--space-1) var(--space-2);
    }

    .toolbar-center {
      order: 3;
      width: 100%;
      justify-content: flex-start;
      padding: var(--space-1) 0;
      border-top: 1px solid var(--ui-border, var(--border-default));
    }

    .toolbar-left {
      flex: 1;
    }

    .dropdown-menu,
    .users-dropdown {
      position: fixed;
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 60vh;
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      z-index: calc(var(--z-dropdown) + 10);
    }

    .users-dropdown {
      min-width: unset;
    }
  }

  @media (max-width: 480px) {
    .toolbar-logo {
      display: none;
    }
    .toolbar-divider {
      display: none;
    }
    .room-id {
      max-width: 50px;
    }
    .label-text {
      display: none;
    }
    .dropdown-trigger {
      padding: var(--space-1) var(--space-2);
    }
    .btn-run {
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-xs);
    }
  }

  @media (max-width: 360px) {
    .room-badge {
      display: none;
    }
    .users-count {
      display: none;
    }
    .toolbar {
      padding: 0 var(--space-1);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
