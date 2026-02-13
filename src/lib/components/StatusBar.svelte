<script lang="ts">
  import type { AwarenessUser } from '$lib/collaboration';
  import type { LanguageConfig } from '$lib/languages';

  let {
    connectedUsers,
    currentLanguage,
    roomId,
  }: {
    connectedUsers: AwarenessUser[];
    currentLanguage: LanguageConfig;
    roomId: string;
  } = $props();
</script>

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

<style>
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

  @media (max-width: 480px) {
    .statusbar {
      font-size: 10px;
    }
    .statusbar-right {
      display: none;
    }
    .statusbar-left {
      flex: 1;
      justify-content: space-between;
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
