<script lang="ts">
  let {
    features,
  }: {
    features: { icon: string; title: string; description: string }[];
  } = $props();
</script>

<section class="features" id="features">
  <h2 class="section-title">
    Everything you need to <span class="gradient-text">code together</span>
  </h2>
  <div class="features-grid">
    {#each features as feature, i}
      <div class="feature-card" style="animation-delay: {i * 0.1}s;">
        <div class="feature-icon">
          {@html feature.icon}
        </div>
        <h3 class="feature-title">{feature.title}</h3>
        <p class="feature-description">{feature.description}</p>
      </div>
    {/each}
  </div>
</section>

<style>
  .features {
    position: relative;
    z-index: 1;
    padding: var(--space-20) var(--space-8);
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

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-6);
  }

  .feature-card {
    background: var(--surface-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    backdrop-filter: blur(10px);
    transition: all var(--transition-base);
    animation: fadeInUp 0.6s ease-out both;
  }

  .feature-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-4px);
    box-shadow: var(--shadow-glow);
  }

  .feature-icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-glass);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
    color: var(--accent-primary);
  }

  .feature-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .feature-description {
    font-size: var(--text-sm);
    color: var(--text-muted);
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .features {
      padding-left: var(--space-4);
      padding-right: var(--space-4);
    }
    .features-grid {
      grid-template-columns: 1fr;
    }
    .feature-card {
      padding: var(--space-6);
    }
    .section-title {
      font-size: clamp(1.25rem, 4vw, 2rem);
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
