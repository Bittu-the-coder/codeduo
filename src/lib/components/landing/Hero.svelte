<script lang="ts">
  let {
    onCreateRoom,
  }: {
    onCreateRoom: () => void;
  } = $props();
</script>

<section class="hero">
  <div class="hero-badge animate-fade-in">
    <span class="badge-dot"></span>
    Real-time Collaborative Coding
  </div>

  <h1 class="hero-title animate-fade-in-up">
    Code Together,<br />
    <span class="gradient-text">Instantly.</span>
  </h1>

  <p class="hero-subtitle animate-fade-in-up" style="animation-delay: 0.15s;">
    A real-time collaborative coding platform where developers write, edit, <br
      class="hide-mobile"
    />
    and execute code together in a shared online editor.
  </p>

  <div class="hero-actions animate-fade-in-up" style="animation-delay: 0.3s;">
    <button class="btn btn-primary" onclick={onCreateRoom}>
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
        <line x1="12" y1="5" x2="12" y2="19" /><line
          x1="5"
          y1="12"
          x2="19"
          y2="12"
        />
      </svg>
      Create a Room
    </button>
    <button
      class="btn btn-secondary"
      onclick={() => {
        const el = document.getElementById('features');
        el?.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      Learn More
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg
      >
    </button>
  </div>

  <!-- Code Preview -->
  <div class="code-preview animate-fade-in-up" style="animation-delay: 0.45s;">
    <div class="code-window">
      <div class="code-titlebar">
        <div class="code-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <span class="code-filename">main.js — CodeDuo</span>
        <div class="code-users">
          <span class="user-dot" style="background: #FF6B6B;"></span>
          <span class="user-dot" style="background: #4ECDC4;"></span>
        </div>
      </div>
      <div class="code-body">
        <div class="code-line">
          <span class="line-num">1</span>
          <span class="code-comment">// Two developers, one editor ✨</span>
        </div>
        <div class="code-line">
          <span class="line-num">2</span>
          <span class="code-keyword">function</span>
          <span class="code-fn">collaborate</span><span class="code-paren"
            >(</span
          ><span class="code-param">developers</span><span class="code-paren"
            >)</span
          > <span class="code-paren">&#123;</span>
        </div>
        <div class="code-line">
          <span class="line-num">3</span>
          <span class="code-indent"></span><span class="code-keyword"
            >return</span
          > developers
        </div>
        <div class="code-line">
          <span class="line-num">4</span>
          <span class="code-indent"></span><span class="code-indent"
          ></span>.<span class="code-fn">map</span><span class="code-paren"
            >(</span
          ><span class="code-param">dev</span>
          <span class="code-operator">=&gt;</span>
          dev.<span class="code-fn">writeCode</span><span class="code-paren"
            >()</span
          ><span class="code-paren">)</span>
        </div>
        <div class="code-line">
          <span class="line-num">5</span>
          <span class="code-indent"></span><span class="code-indent"
          ></span>.<span class="code-fn">reduce</span><span class="code-paren"
            >(</span
          ><span class="code-param">merge</span><span class="code-paren">)</span
          >;
        </div>
        <div class="code-line">
          <span class="line-num">6</span>
          <span class="code-paren">&#125;</span>
        </div>
        <div class="cursor-blink"></div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: var(--space-16) var(--space-8) var(--space-12);
    max-width: 1200px;
    margin: 0 auto;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--surface-glass);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-8);
    backdrop-filter: blur(10px);
  }

  .badge-dot {
    width: 8px;
    height: 8px;
    background: var(--status-success);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .hero-title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--text-primary);
    margin-bottom: var(--space-6);
  }

  .gradient-text {
    background: linear-gradient(135deg, #a5c9ca 0%, #395b64 50%, #a5c9ca 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 4s ease infinite;
  }

  .hero-subtitle {
    font-size: var(--text-lg);
    color: var(--text-muted);
    max-width: 600px;
    margin: 0 auto var(--space-10);
    line-height: 1.7;
  }

  .hide-mobile {
    display: inline;
  }

  .hero-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: var(--space-16);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    border-radius: var(--radius-lg);
    font-size: var(--text-base);
    font-weight: 600;
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
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
    border-color: var(--brand-medium);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
  }

  .btn-secondary:hover {
    background: var(--surface-glass);
    color: var(--text-primary);
    border-color: var(--border-hover);
  }

  /* Code Preview */
  .code-preview {
    max-width: 640px;
    margin: 0 auto;
    perspective: 1000px;
  }

  .code-window {
    background: #1a1e1e;
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-default);
    overflow: hidden;
    box-shadow: var(--shadow-lg), var(--shadow-glow-lg);
    transform: rotateX(2deg);
    transition: transform var(--transition-slow);
  }

  .code-window:hover {
    transform: rotateX(0deg);
  }

  .code-titlebar {
    display: flex;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: rgba(44, 51, 51, 0.8);
    border-bottom: 1px solid var(--border-default);
  }

  .code-dots {
    display: flex;
    gap: 6px;
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .dot-red {
    background: #ff5f57;
  }
  .dot-yellow {
    background: #febc2e;
  }
  .dot-green {
    background: #28c840;
  }

  .code-filename {
    flex: 1;
    text-align: center;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .code-users {
    display: flex;
    gap: 4px;
  }
  .user-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1.5px solid rgba(0, 0, 0, 0.3);
  }

  .code-body {
    padding: var(--space-4) var(--space-5);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.7;
    position: relative;
  }

  .code-line {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  .line-num {
    color: var(--text-muted);
    min-width: 20px;
    text-align: right;
    user-select: none;
    font-size: var(--text-xs);
  }

  .code-comment {
    color: #6a9955;
    font-style: italic;
  }
  .code-keyword {
    color: #a5c9ca;
  }
  .code-fn {
    color: #dcdcaa;
  }
  .code-paren {
    color: #e7f6f2;
  }
  .code-param {
    color: #9cdcfe;
  }
  .code-operator {
    color: #a5c9ca;
  }
  .code-indent {
    display: inline-block;
    width: 16px;
  }

  .cursor-blink {
    position: absolute;
    bottom: 20px;
    left: 64px;
    width: 2px;
    height: 18px;
    background: #a5c9ca;
    animation: pulse 1s infinite;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero {
      padding: var(--space-10) var(--space-4) var(--space-8);
    }
    .hero-title {
      font-size: clamp(2rem, 8vw, 3rem);
    }
    .hero-subtitle {
      font-size: var(--text-base);
      margin: 0 auto var(--space-8);
    }
    .hide-mobile {
      display: none;
    }
    .code-preview {
      margin: 0 -8px;
    }

    .hero-actions {
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .btn {
      width: 100%;
      max-width: 300px;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .hero {
      padding: var(--space-8) var(--space-3) var(--space-6);
    }
    .hero-title {
      font-size: 1.75rem;
    }
    .hero-badge {
      font-size: var(--text-xs);
      padding: var(--space-1) var(--space-3);
    }
    .code-body {
      font-size: var(--text-xs);
      padding: var(--space-3);
    }
    .code-titlebar {
      padding: var(--space-2) var(--space-3);
    }
    .hero-actions {
      margin-bottom: var(--space-10);
    }
  }

  @media (max-width: 360px) {
    .hero-title {
      font-size: 1.5rem;
    }
    .code-preview {
      margin: 0 -12px;
    }
    .hero-subtitle {
      font-size: var(--text-sm);
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
