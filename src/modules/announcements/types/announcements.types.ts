export type AnnouncementCategory = 'Company' | 'People' | 'Product' | 'IT' | 'Office';

export interface AnnouncementAuthor {
  name: string;
  role: string | null;
}

export interface Announcement {
  id: string;
  category: AnnouncementCategory;
  channelId: string;
  title: string;
  body: string;
  author: AnnouncementAuthor;
  audience: string;
  readCount: number;
  postedAt: string;
  isPinned: boolean;
}

export interface Channel {
  id: string;
  name: string;
  postCount: number;
  category: AnnouncementCategory;
}

export interface UpcomingEvent {
  id: string;
  date: string;
  title: string;
  meta: string;
}

export interface AnnouncementsData {
  pinned: Announcement | null;
  feed: Announcement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  category: AnnouncementCategory;
  channelId?: string;
  audience?: string;
  isPinned?: boolean;
}

export interface AnnouncementsParams {
  channelId?: string;
  page?: number;
  limit?: number;
}
