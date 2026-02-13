<footer class="footer">
  <div class="footer-content">
    <div class="footer-brand">
      <span class="logo-bracket">&lt;</span><span class="logo-text">CD</span
      ><span class="logo-bracket">/&gt;</span>
      <span>CodeDuo</span>
    </div>
    <p class="footer-text">Built for developers who love to collaborate.</p>
  </div>
</footer>

<style>
  .footer {
    position: relative;
    z-index: 1;
    border-top: 1px solid var(--border-default);
    padding: var(--space-8);
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--text-primary);
  }

  .logo-bracket {
    color: var(--accent-primary);
  }
  .logo-text {
    color: var(--text-primary);
  }

  .footer-text {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .footer-content {
      flex-direction: column;
      gap: var(--space-2);
      text-align: center;
    }
  }
</style>
