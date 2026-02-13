<script lang="ts">
  import { goto } from '$app/navigation';
  import { v4 as uuidv4 } from 'uuid';

  function createRoom() {
    const roomId = uuidv4().slice(0, 8);
    goto(`/room/${roomId}`);
  }

  const features = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      title: 'Real-time Collaboration',
      description:
        "Code together with live cursor tracking, instant sync, and awareness of who's editing what.",
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
      title: 'Multi-Language Support',
      description:
        'Write in JavaScript, TypeScript, Python, C, C++, and Java with full syntax highlighting.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
      title: 'Secure Execution',
      description:
        'Code runs in isolated sandboxed containers. Your code is executed safely and securely.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      title: 'Instant Rooms',
      description:
        'Create a room in one click, share the link, and start pair programming instantly.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
      title: 'VS Code Themes',
      description:
        '16+ beautiful editor themes including One Dark, Dracula, Monokai, Nord, and more.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
      title: 'Integrated Console',
      description:
        'Built-in I/O console with stdin support, stdout/stderr display, and execution metrics.',
    },
  ];
</script>

<svelte:head>
  <title
    >CodeDuo — Free Online Compiler & Real-Time Collaborative Code Editor</title
  >
  <meta
    name="description"
    content="CodeDuo is a free online compiler and real-time collaborative code editor. Write, compile, run, and debug JavaScript, Python, TypeScript, C, C++, and Java together in a shared online IDE with VS Code themes, live cursors, and instant execution."
  />
  <meta
    name="keywords"
    content="online compiler, online code editor, real time code editor, collaborative code editor, online IDE, code compiler online, run code online, pair programming tool, live code editor, real time collaboration, code together online, online coding platform, code execution online, JavaScript compiler online, Python compiler online, TypeScript compiler, C compiler online, C++ compiler online, Java compiler online, Monaco editor online, VS Code online, code sharing platform, coding interview tool, remote pair programming, collaborative IDE, live coding, shared code editor, multi language compiler, sandbox code execution, code runner online, web based IDE, browser code editor, free online compiler, compile and run code, online code runner"
  />
  <link rel="canonical" href="https://codeduo.dev/" />

  <!-- Open Graph -->
  <meta
    property="og:title"
    content="CodeDuo — Free Online Compiler & Real-Time Code Editor"
  />
  <meta
    property="og:description"
    content="Free online compiler and collaborative code editor. Write, compile, and run code together in 6 languages with VS Code themes, live cursors, and sandboxed execution."
  />
  <meta property="og:url" content="https://codeduo.dev/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="CodeDuo" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="CodeDuo — Code Together, Instantly" />
  <meta
    name="twitter:description"
    content="Free online compiler and collaborative code editor. Compile and run JavaScript, Python, C, C++, Java, TypeScript together with VS Code themes."
  />

  <!-- JSON-LD Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CodeDuo',
    url: 'https://codeduo.dev',
    description:
      'Free online compiler and real-time collaborative code editor for pair programming. Compile and run JavaScript, Python, TypeScript, C, C++, and Java with VS Code themes and live cursors.',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Online compiler for JavaScript, Python, TypeScript, C, C++, Java',
      'Real-time collaborative code editing with live cursors',
      'Remote pair programming with shared editor',
      '16 VS Code themes including One Dark, Dracula, Monokai, Nord',
      'Sandboxed code execution with stdin/stdout support',
      'Instant room creation with shareable links',
      'Integrated console with I/O and execution metrics',
      'Monaco editor with syntax highlighting',
      'No sign-up required — start coding instantly',
    ],
    keywords:
      'online compiler, online code editor, collaborative coding, pair programming, real-time editor, run code online, free online compiler',
  })}</script>`}
</svelte:head>

<div class="landing">
  <!-- ── Animated Background ── -->
  <div class="bg-effects">
    <div class="gradient-orb orb-1"></div>
    <div class="gradient-orb orb-2"></div>
    <div class="gradient-orb orb-3"></div>
    <div class="grid-overlay"></div>
  </div>

  <!-- ── Navigation ── -->
  <nav class="nav">
    <div class="nav-brand">
      <div class="logo">
        <span class="logo-bracket">&lt;</span><span class="logo-text">CD</span
        ><span class="logo-bracket">/&gt;</span>
      </div>
      <span class="brand-name">CodeDuo</span>
    </div>
    <a
      href="https://github.com"
      target="_blank"
      rel="noopener noreferrer"
      class="nav-link"
      aria-label="GitHub"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        ><path
          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
        /></svg
      >
    </a>
  </nav>

  <!-- ── Hero Section ── -->
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
      <button class="btn btn-primary" onclick={createRoom}>
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
          ><line x1="12" y1="5" x2="12" y2="19" /><line
            x1="5"
            y1="12"
            x2="19"
            y2="12"
          /></svg
        >
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

    <!-- ── Code Preview ── -->
    <div
      class="code-preview animate-fade-in-up"
      style="animation-delay: 0.45s;"
    >
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
            ><span class="code-param">merge</span><span class="code-paren"
              >)</span
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

  <!-- ── Features Section ── -->
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

  <!-- ── Languages Section ── -->
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

  <!-- ── CTA Section ── -->
  <section class="cta-section">
    <div class="cta-card">
      <h2 class="cta-title">Ready to code together?</h2>
      <p class="cta-subtitle">
        Create a room and share the link. It's that simple.
      </p>
      <button class="btn btn-primary btn-lg" onclick={createRoom}>
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
          ><line x1="5" y1="12" x2="19" y2="12" /><polyline
            points="12 5 19 12 12 19"
          /></svg
        >
      </button>
    </div>
  </section>

  <!-- ── Footer ── -->
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
</div>

<style>
  /* ── Landing Layout ── */
  .landing {
    position: relative;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── Background Effects ── */
  .bg-effects {
    position: fixed;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
  }

  .gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.4;
  }

  .orb-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #395b64 0%, transparent 70%);
    top: -200px;
    right: -100px;
    animation: float 8s ease-in-out infinite;
  }

  .orb-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #a5c9ca 0%, transparent 70%);
    bottom: 20%;
    left: -100px;
    animation: float 10s ease-in-out infinite reverse;
  }

  .orb-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #2c3333 0%, transparent 70%);
    top: 50%;
    right: 20%;
    animation: float 12s ease-in-out infinite 2s;
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        rgba(165, 201, 202, 0.03) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(165, 201, 202, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* ── Navigation ── */
  .nav {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-8);
    max-width: 1200px;
    margin: 0 auto;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .logo {
    font-family: var(--font-mono);
    font-size: var(--text-xl);
    font-weight: 700;
  }

  .logo-bracket {
    color: var(--accent-primary);
  }

  .logo-text {
    color: var(--text-primary);
  }

  .brand-name {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .nav-link {
    color: var(--text-secondary);
    transition: color var(--transition-fast);
    padding: var(--space-2);
  }

  .nav-link:hover {
    color: var(--text-primary);
  }

  /* ── Hero ── */
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

  .hero-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: var(--space-16);
  }

  /* ── Buttons ── */
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

  .btn-lg {
    padding: var(--space-4) var(--space-8);
    font-size: var(--text-lg);
  }

  /* ── Code Preview ── */
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

  /* ── Features ── */
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

  /* ── Languages ── */
  .languages-section {
    position: relative;
    z-index: 1;
    padding: var(--space-12) var(--space-8) var(--space-20);
    max-width: 1200px;
    margin: 0 auto;
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

  /* ── CTA ── */
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

  /* ── Footer ── */
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

  .footer-text {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  /* ── Responsive ── */
  .hide-mobile {
    display: inline;
  }

  @media (max-width: 768px) {
    .hero {
      padding: var(--space-10) var(--space-4) var(--space-8);
    }

    .hide-mobile {
      display: none;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .footer-content {
      flex-direction: column;
      gap: var(--space-2);
      text-align: center;
    }

    .code-preview {
      margin: 0 -8px;
    }

    .nav {
      padding: var(--space-3) var(--space-4);
    }
  }
</style>
