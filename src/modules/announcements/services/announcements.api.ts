import { apiClient } from '@/lib/api-client';
import type {
  AnnouncementsData,
  Channel,
  UpcomingEvent,
  Announcement,
  CreateAnnouncementInput,
  CreateEventInput,
  AnnouncementsParams,
} from '../types/announcements.types';

export const announcementsApi = {
  getAnnouncements: async (params?: AnnouncementsParams): Promise<AnnouncementsData> => {
    const { data } = await apiClient.get<{ data: AnnouncementsData }>('/announcements', {
      params,
    });
    return data.data;
  },

  getChannels: async (): Promise<Channel[]> => {
    const { data } = await apiClient.get<{ data: { channels: Channel[] } }>(
      '/announcements/channels',
    );
    return data.data.channels;
  },

  getEvents: async (): Promise<UpcomingEvent[]> => {
    const { data } = await apiClient.get<{ data: { events: UpcomingEvent[] } }>(
      '/announcements/events',
    );
    return data.data.events;
  },

  pinAnnouncement: async (id: string): Promise<Announcement> => {
    const { data } = await apiClient.patch<{ data: Announcement }>(`/announcements/${id}/pin`, {});
    return data.data;
  },

  unpinAnnouncement: async (id: string): Promise<{ unpinned: boolean }> => {
    const { data } = await apiClient.patch<{ data: { unpinned: boolean } }>(
      `/announcements/${id}/unpin`,
      {},
    );
    return data.data;
  },

  createEvent: async (input: CreateEventInput): Promise<UpcomingEvent> => {
    const { data } = await apiClient.post<{ data: UpcomingEvent }>('/announcements/events', input);
    return data.data;
  },

  createAnnouncement: async (input: CreateAnnouncementInput): Promise<Announcement> => {
    const { data } = await apiClient.post<{ data: Announcement }>('/announcements', input);
    return data.data;
  },
};
