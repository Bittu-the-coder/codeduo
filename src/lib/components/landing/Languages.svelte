<section class="languages-section">
  <h2 class="section-title">
    Supports your <span class="gradient-text">favorite languages</span>
  </h2>
  <div class="languages-grid">
    {#each ['JavaScript', 'TypeScript', 'Python', 'C', 'C++', 'Java'] as lang}
      <div class="lang-chip">{lang}</div>
    {/each}
  </div>
</section>

<style>
  .languages-section {
    position: relative;
    z-index: 1;
    padding: var(--space-12) var(--space-8) var(--space-20);
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-title {
    text-align: center;
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 700;
    margin-bottom: var(--space-12);
    color: var(--text-primary);
  }

  .gradient-text {
    background: linear-gradient(135deg, #a5c9ca 0%, #395b64 50%, #a5c9ca 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 4s ease infinite;
  }

  .languages-grid {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .lang-chip {
    padding: var(--space-3) var(--space-6);
    background: var(--surface-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-secondary);
    backdrop-filter: blur(10px);
    transition: all var(--transition-base);
  }

  .lang-chip:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    box-shadow: var(--shadow-glow);
  }

  @media (max-width: 768px) {
    .languages-section {
      padding-left: var(--space-4);
      padding-right: var(--space-4);
    }
    .lang-chip {
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-xs);
    }
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% center;
    }
    50% {
      background-position: 100% center;
    }
    100% {
      background-position: 0% center;
    }
  }
</style>
