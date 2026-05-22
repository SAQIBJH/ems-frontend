import { apiClient } from '@/lib/api-client';
import type { User } from '@/types/user';
import type { LoginInput } from '../validations/login.schema';
import type { LoginResponse, Session } from '../types/auth.types';

export const authApi = {
  login: async (input: LoginInput): Promise<LoginResponse> => {
    const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/login', input);
    return data.data;
  },

  refresh: async (): Promise<void> => {
    // Under cookie auth the server rotates the accessToken cookie silently.
    // The 401 interceptor in api-client.ts calls this directly; callers
    // outside that interceptor should not need to inspect the response.
    await apiClient.post('/auth/refresh');
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  logoutAll: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all');
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ data: User }>('/auth/me');
    return data.data;
  },

  sessions: async (): Promise<Session[]> => {
    const { data } = await apiClient.get<{ data: Session[] }>('/auth/sessions');
    return data.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },
};
