import { browser } from '$app/environment';
import { authService } from '$lib/services';
import type { User } from '$lib/types';
import { derived, writable } from 'svelte/store';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    async initialize() {
      if (!browser) return;

      update(state => ({ ...state, isLoading: true }));

      // Try to restore session from stored token
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        authService.setAccessToken(storedToken);
      }

      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          update(state => ({
            ...state,
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }));
        } else {
          localStorage.removeItem('accessToken');
          authService.setAccessToken(null);
          update(state => ({
            ...state,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } catch {
        localStorage.removeItem('accessToken');
        update(state => ({
          ...state,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    },

    async login(email: string, password: string) {
      update(state => ({ ...state, isLoading: true, error: null }));

      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        update(state => ({
          ...state,
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        return { success: true };
      } else {
        update(state => ({
          ...state,
          isLoading: false,
          error: response.error?.message || 'Login failed',
        }));
        return { success: false, error: response.error?.message };
      }
    },

    async register(email: string, username: string, password: string) {
      update(state => ({ ...state, isLoading: true, error: null }));

      const response = await authService.register({
        email,
        username,
        password,
      });

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        update(state => ({
          ...state,
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        return { success: true };
      } else {
        update(state => ({
          ...state,
          isLoading: false,
          error: response.error?.message || 'Registration failed',
        }));
        return { success: false, error: response.error?.message };
      }
    },

    async logout() {
      await authService.logout();
      localStorage.removeItem('accessToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },

    loginWithGitHub() {
      if (browser) {
        window.location.href = authService.getGitHubAuthUrl();
      }
    },

    setUser(user: User, accessToken: string) {
      localStorage.setItem('accessToken', accessToken);
      authService.setAccessToken(accessToken);
      update(state => ({
        ...state,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    },

    clearError() {
      update(state => ({ ...state, error: null }));
    },
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const isAuthenticated = derived(
  authStore,
  $auth => $auth.isAuthenticated
);
export const isAuthLoading = derived(authStore, $auth => $auth.isLoading);
