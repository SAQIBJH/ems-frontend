import { apiClient } from '@/lib/api-client';
import type { NotificationsResponse } from '../types/notification.types';

export const notificationsApi = {
  list: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
    since?: string;
  }) => {
    const { data } = await apiClient.get<{ success: boolean; data: NotificationsResponse }>(
      '/notifications',
      { params },
    );
    return data.data;
  },

  unreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ success: boolean; data: { count: number } }>(
      '/notifications/unread-count',
    );
    return data.data.count;
  },

  markRead: async (id: string) => {
    // Primary method is PATCH; POST is a backend alias — use PATCH (API_MAPPING.md)
    const { data } = await apiClient.patch<{
      success: boolean;
      data: { id: string; isRead: boolean };
    }>(`/notifications/${id}/read`);
    return data.data;
  },

  markAllRead: async () => {
    // Primary method is PATCH; POST is a backend alias — use PATCH (API_MAPPING.md)
    const { data } = await apiClient.patch<{ success: boolean; data: { markedRead: number } }>(
      '/notifications/read-all',
    );
    return data.data;
  },
};
