import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementsApi } from '../services/announcements.api';
import type { AnnouncementsParams, CreateAnnouncementInput } from '../types/announcements.types';

export const ANNOUNCEMENTS_KEYS = {
  feed: (params?: AnnouncementsParams) => ['announcements', 'feed', params] as const,
  channels: ['announcements', 'channels'] as const,
  events: ['announcements', 'events'] as const,
};

export function useAnnouncements(params?: AnnouncementsParams) {
  return useQuery({
    queryKey: ANNOUNCEMENTS_KEYS.feed(params),
    queryFn: () => announcementsApi.getAnnouncements(params),
  });
}

export function useAnnouncementChannels() {
  return useQuery({
    queryKey: ANNOUNCEMENTS_KEYS.channels,
    queryFn: () => announcementsApi.getChannels(),
  });
}

export function useAnnouncementEvents() {
  return useQuery({
    queryKey: ANNOUNCEMENTS_KEYS.events,
    queryFn: () => announcementsApi.getEvents(),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) => announcementsApi.createAnnouncement(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['announcements', 'feed'] });
      void qc.invalidateQueries({ queryKey: ['announcements', 'channels'] });
    },
  });
}
