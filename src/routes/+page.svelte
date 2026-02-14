<script lang="ts">
  import { goto } from '$app/navigation';
  import CTA from '$lib/components/landing/CTA.svelte';
  import Features from '$lib/components/landing/Features.svelte';
  import Footer from '$lib/components/landing/Footer.svelte';
  import Hero from '$lib/components/landing/Hero.svelte';
  import Languages from '$lib/components/landing/Languages.svelte';
  import Navbar from '$lib/components/landing/Navbar.svelte';

  function generateRoomId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    }
    return Math.random().toString(36).slice(2, 10);
  }

  function createRoom() {
    const roomId = generateRoomId();
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
  <link rel="canonical" href="https://codeduo.bittuthecoder.me/" />

  <!-- Open Graph -->
  <meta
    property="og:title"
    content="CodeDuo — Free Online Compiler & Real-Time Code Editor"
  />
  <meta
    property="og:description"
    content="Free online compiler and collaborative code editor. Write, compile, and run code together in 6 languages with VS Code themes, live cursors, and sandboxed execution."
  />
  <meta property="og:url" content="https://codeduo.bittuthecoder.me/" />
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
    url: 'https://codeduo.bittuthecoder.me',
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
  <!-- Animated Background -->
  <div class="bg-effects">
    <div class="gradient-orb orb-1"></div>
    <div class="gradient-orb orb-2"></div>
    <div class="gradient-orb orb-3"></div>
    <div class="grid-overlay"></div>
  </div>

  <Navbar />
  <Hero onCreateRoom={createRoom} />
  <Features {features} />
  <Languages />
  <CTA onCreateRoom={createRoom} />
  <Footer />
</div>

<style>
  .landing {
    position: relative;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Background Effects */
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

  @keyframes float {
    0%,
    100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-30px) scale(1.05);
    }
  }
</style>
