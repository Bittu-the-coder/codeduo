<script lang="ts">
  let {
    onCreateRoom,
  }: {
    onCreateRoom: () => void;
  } = $props();
</script>

<section class="cta-section">
  <div class="cta-card">
    <h2 class="cta-title">Ready to code together?</h2>
    <p class="cta-subtitle">
      Create a room and share the link. It's that simple.
    </p>
    <button class="btn btn-primary btn-lg" onclick={onCreateRoom}>
      Start Coding Now
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12" /><polyline
          points="12 5 19 12 12 19"
        />
      </svg>
    </button>
  </div>
</section>

<style>
  .cta-section {
    position: relative;
    z-index: 1;
    padding: 0 var(--space-8) var(--space-20);
    max-width: 800px;
    margin: 0 auto;
  }

  .cta-card {
    text-align: center;
    padding: var(--space-16) var(--space-8);
    background: linear-gradient(
      135deg,
      rgba(57, 91, 100, 0.2),
      rgba(44, 51, 51, 0.4)
    );
    border: 1px solid var(--border-default);
    border-radius: var(--radius-2xl);
    backdrop-filter: blur(20px);
  }

  .cta-title {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--space-3);
  }

  .cta-subtitle {
    color: var(--text-muted);
    margin-bottom: var(--space-8);
    font-size: var(--text-lg);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius-lg);
    font-size: var(--text-base);
    font-weight: 600;
    transition: all var(--transition-base);
    cursor: pointer;
  }

  .btn-primary {
    background: linear-gradient(135deg, #395b64, #2c3333);
    color: var(--brand-light);
    border: 1px solid var(--brand-medium);
    box-shadow:
      var(--shadow-md),
      0 0 20px rgba(57, 91, 100, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow:
      var(--shadow-lg),
      0 0 40px rgba(165, 201, 202, 0.2);
  }

  .btn-lg {
    padding: var(--space-4) var(--space-8);
    font-size: var(--text-lg);
  }

  @media (max-width: 768px) {
    .cta-section {
      padding-left: var(--space-4);
      padding-right: var(--space-4);
    }
    .cta-card {
      padding: var(--space-10) var(--space-4);
    }
    .cta-title {
      font-size: var(--text-2xl);
    }
    .btn-lg {
      padding: var(--space-3) var(--space-6);
      font-size: var(--text-base);
    }
  }
</style>
