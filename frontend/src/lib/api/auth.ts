import apiClient from './client';
import { AuthResponse } from '@/types/user';

export const authApi = {
  // Exchange Keycloak code for JWT token
  exchangeToken: async (code: string, redirectUri: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/token', { code, redirect_uri: redirectUri });
    return response.data;
  },

  // Refresh JWT token
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  // Logout
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
