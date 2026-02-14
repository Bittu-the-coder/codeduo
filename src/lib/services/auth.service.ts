import type {
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '$lib/types';
import { api } from './api.service';

export interface AuthServiceResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<AuthServiceResponse>> {
    const response = await api.post<AuthServiceResponse>(
      '/auth/login',
      credentials
    );
    if (response.success && response.data?.accessToken) {
      api.setAccessToken(response.data.accessToken);
    }
    return response;
  },

  async register(
    credentials: RegisterCredentials
  ): Promise<ApiResponse<AuthServiceResponse>> {
    const response = await api.post<AuthServiceResponse>(
      '/auth/register',
      credentials
    );
    if (response.success && response.data?.accessToken) {
      api.setAccessToken(response.data.accessToken);
    }
    return response;
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await api.post<void>('/auth/logout');
    api.setAccessToken(null);
    return response;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get<User>('/users/me');
  },

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const response = await api.post<{ accessToken: string }>('/auth/refresh');
    if (response.success && response.data?.accessToken) {
      api.setAccessToken(response.data.accessToken);
    }
    return response;
  },

  getGitHubAuthUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    return `${apiUrl}/auth/github`;
  },

  setAccessToken(token: string | null): void {
    api.setAccessToken(token);
  },

  getAccessToken(): string | null {
    return api.getAccessToken();
  },
};
