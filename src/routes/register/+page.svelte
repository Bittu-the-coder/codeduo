<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore, isAuthenticated, isAuthLoading } from '$lib/stores';

  let username = $state('');
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  // Redirect if already authenticated
  $effect(() => {
    if ($isAuthenticated && !$isAuthLoading) {
      goto('/dashboard');
    }
  });

  async function handleRegister(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const result = await authStore.register(email, username, password);

      if (result.success) {
        goto('/dashboard');
      } else {
        error = result.error || 'Registration failed';
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleGitHubLogin() {
    authStore.loginWithGitHub();
  }
</script>

<div class="auth-container">
  <div class="auth-box">
    <h1>Create Account</h1>
    <p class="subtitle">Join CodeDuo today</p>

    <div class="social-login">
      <button class="github-btn" onclick={handleGitHubLogin}>
        <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
          ></path>
        </svg>
        Continue with GitHub
      </button>
    </div>

    <div class="divider">
      <span>OR</span>
    </div>

    <form onsubmit={handleRegister}>
      <div class="form-group">
        <label for="username">Username</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          required
          placeholder="johndoe"
        />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          placeholder="name@example.com"
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          placeholder="••••••••"
        />
      </div>

      {#if error}
        <div class="error-msg">{error}</div>
      {/if}

      <button type="submit" class="submit-btn" disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>

    <p class="footer-text">
      Already have an account? <a href="/login">Sign in</a>
    </p>
  </div>
</div>

<style>
  /* Reusing styles from Login page (could be shared component) */
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .auth-box {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  h1 {
    text-align: center;
    margin-bottom: 0.5rem;
    font-size: 1.8rem;
  }
  .subtitle {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .form-group {
    margin-bottom: 1.2rem;
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.8rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    color: var(--text-primary);
  }
  input:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .submit-btn {
    width: 100%;
    padding: 0.8rem;
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 1rem;
  }
  .submit-btn:hover {
    opacity: 0.9;
  }
  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-msg {
    color: #ff4d4d;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  .footer-text {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  a {
    color: var(--accent-primary);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  .social-login {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-bottom: 1rem;
  }

  .github-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.8rem;
    background: #24292e;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }

  .github-btn:hover {
    background: #2f363d;
  }

  .divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    color: var(--text-muted, #666);
    font-size: 0.85rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-default);
  }

  .divider span {
    padding: 0 1rem;
  }
</style>
