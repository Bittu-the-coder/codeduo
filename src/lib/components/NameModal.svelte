<script lang="ts">
  let {
    roomId,
    show,
    nameInput = $bindable(''),
    onSubmit,
  }: {
    roomId: string;
    show: boolean;
    nameInput: string;
    onSubmit: () => void;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  }
</script>

{#if show}
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
          onkeydown={handleKeydown}
          maxlength="20"
        />
      </div>
      <button class="modal-btn" onclick={onSubmit} disabled={!nameInput.trim()}>
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
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline
            points="10 17 15 12 10 7"
          /><line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        Join Room
      </button>
      <p class="modal-room-id">Room: <span class="font-mono">{roomId}</span></p>
    </div>
  </div>
{/if}

<style>
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

  .logo-bracket {
    color: var(--brand-medium);
  }
  .logo-text {
    color: var(--brand-light);
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

  .font-mono {
    font-family: var(--font-mono);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .modal-card {
      padding: var(--space-6) var(--space-4);
      width: 95%;
      border-radius: var(--radius-xl);
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

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
