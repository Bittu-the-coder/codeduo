import type { ApiError, ApiResponse } from '$lib/types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

class ApiService {
  private accessToken: string | null = null;

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    console.log(
      '[API]',
      method,
      endpoint,
      'Token:',
      this.accessToken ? 'Yes' : 'No'
    );
    if (body) console.log('[API] Body:', body);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Include cookies for refresh token
      });

      const data = await response.json();
      console.log('[API] Response status:', response.status, 'data:', data);

      if (!response.ok) {
        // Handle token refresh on 401
        if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the request with new token
            return this.request<T>(endpoint, options);
          }
        }

        return {
          success: false,
          data: null as T,
          error: data.error as ApiError,
        };
      }

      return data as ApiResponse<T>;
    } catch (error) {
      console.error('[API] Network error:', error);
      return {
        success: false,
        data: null as T,
        error: {
          code: 'NETWORK_ERROR',
          message:
            error instanceof Error ? error.message : 'Network error occurred',
        },
      };
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.accessToken) {
          this.setAccessToken(data.data.accessToken);
          return true;
        }
      }
    } catch {
      // Refresh failed
    }

    this.setAccessToken(null);
    return false;
  }

  // HTTP Methods
  async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const api = new ApiService();
