import { apiClient } from '@/lib/api-client';
import type { NotificationsResponse } from '../types/notification.types';

export const notificationsApi = {
  list: async (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ success: boolean; data: NotificationsResponse }>(
      '/notifications',
      { params },
    );
    return data.data;
  },

  markRead: async (id: string) => {
    const { data } = await apiClient.post<{
      success: boolean;
      data: { id: string; isRead: boolean };
    }>(`/notifications/${id}/read`);
    return data.data;
  },

  markAllRead: async () => {
    const { data } = await apiClient.post<{ success: boolean; data: { markedRead: number } }>(
      '/notifications/read-all',
    );
    return data.data;
  },
};
