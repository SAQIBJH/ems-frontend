import { http, HttpResponse } from 'msw';
import type {
  Announcement,
  AnnouncementsData,
  Channel,
  UpcomingEvent,
  AnnouncementCategory,
  CreateAnnouncementInput,
} from '@/modules/announcements/types/announcements.types';

const BASE = '/api/announcements';

// ── Fixture data ─────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = [
  { id: 'ch_1', name: 'Company-wide', postCount: 142, category: 'Company' },
  { id: 'ch_2', name: 'People & Culture', postCount: 38, category: 'People' },
  { id: 'ch_3', name: 'Product updates', postCount: 51, category: 'Product' },
  { id: 'ch_4', name: 'IT & Security', postCount: 24, category: 'IT' },
  { id: 'ch_5', name: 'Office & Facilities', postCount: 17, category: 'Office' },
];

const EVENTS: UpcomingEvent[] = [
  { id: 'ev_1', date: '2026-06-02', title: 'Q2 All-Hands', meta: '4:00 PM · Main hall + Zoom' },
  { id: 'ev_2', date: '2026-06-06', title: 'New-hire orientation', meta: '10:00 AM · 7 joining' },
  { id: 'ev_3', date: '2026-06-14', title: 'Manager review deadline', meta: 'H1 2026 cycle' },
];

let PINNED: Announcement = {
  id: 'ann_0',
  category: 'Company',
  channelId: 'ch_1',
  title: 'Q2 All-Hands — Thursday 4 PM IST',
  body: "Join the leadership team for the Q2 business review, product roadmap, and a live Q&A. Calendar invites are out; the session will be recorded for those who can't attend live.",
  author: { name: 'Aman Khanna', role: 'Chief People Officer' },
  audience: 'All employees',
  readCount: 182,
  postedAt: '2026-06-02T07:00:00Z',
  isPinned: true,
};

let FEED: Announcement[] = [
  {
    id: 'ann_1',
    category: 'IT',
    channelId: 'ch_4',
    title: 'Mandatory password rotation by Jun 5',
    body: "Single sign-on credentials must be rotated before June 5. You'll be prompted at next login — enable the authenticator app if you haven't.",
    author: { name: 'Security Team', role: null },
    audience: 'All employees',
    readCount: 211,
    postedAt: '2026-06-01T14:00:00Z',
    isPinned: false,
  },
  {
    id: 'ann_2',
    category: 'People',
    channelId: 'ch_2',
    title: 'New parental leave policy now live',
    body: "We've extended paid parental leave to 26 weeks effective this quarter. Full details and eligibility are on the People portal.",
    author: { name: 'Sneha Rao', role: 'HR Manager' },
    audience: 'All employees',
    readCount: 168,
    postedAt: '2026-05-31T09:00:00Z',
    isPinned: false,
  },
  {
    id: 'ann_3',
    category: 'Office',
    channelId: 'ch_5',
    title: 'Bengaluru office closed May 30 (maintenance)',
    body: 'The Bengaluru HQ will be closed Friday for electrical maintenance. Please plan to work remotely; meeting rooms are unavailable.',
    author: { name: 'Facilities', role: null },
    audience: 'Bengaluru',
    readCount: 96,
    postedAt: '2026-05-30T06:00:00Z',
    isPinned: false,
  },
  {
    id: 'ann_4',
    category: 'Product',
    channelId: 'ch_3',
    title: 'EMS v2.4 ships Monday',
    body: 'The new Performance and Recruitment modules go live for all admins Monday morning. Release notes and a short walkthrough are attached.',
    author: { name: 'Nisha Iyer', role: 'Product Manager' },
    audience: 'Managers',
    readCount: 74,
    postedAt: '2026-05-29T11:00:00Z',
    isPinned: false,
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export const announcementsHandlers = [
  // GET /announcements
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');

    let feed = FEED;
    let pinned: Announcement | null = PINNED;

    if (channelId) {
      feed = FEED.filter((a) => a.channelId === channelId);
      pinned = PINNED.channelId === channelId ? PINNED : null;
    }

    const response: AnnouncementsData = {
      pinned,
      feed,
      pagination: { page: 1, limit: 20, total: feed.length + (pinned ? 1 : 0), totalPages: 1 },
    };
    return HttpResponse.json({ success: true, data: response });
  }),

  // GET /announcements/channels
  http.get(`${BASE}/channels`, () => {
    return HttpResponse.json({ success: true, data: { channels: CHANNELS } });
  }),

  // GET /announcements/events
  http.get(`${BASE}/events`, () => {
    return HttpResponse.json({ success: true, data: { events: EVENTS } });
  }),

  // POST /announcements/events
  http.post(`${BASE}/events`, async ({ request }) => {
    const body = (await request.json()) as { date: string; title: string; meta: string };

    if (!body.date || !body.title || !body.meta) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'date, title and meta are required',
            details: [
              ...(!body.date ? [{ field: 'date', message: 'Date is required' }] : []),
              ...(!body.title ? [{ field: 'title', message: 'Title is required' }] : []),
              ...(!body.meta ? [{ field: 'meta', message: 'Time / location is required' }] : []),
            ],
          },
        },
        { status: 422 },
      );
    }

    const newEvent: UpcomingEvent = {
      id: `ev_${Date.now()}`,
      date: body.date,
      title: body.title,
      meta: body.meta,
    };

    // Insert sorted by date
    EVENTS.push(newEvent);
    EVENTS.sort((a, b) => a.date.localeCompare(b.date));

    return HttpResponse.json({ success: true, data: newEvent }, { status: 201 });
  }),

  // POST /announcements
  http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as CreateAnnouncementInput;

    if (!body.title || !body.body || !body.category) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'title, body and category are required',
            details: [
              ...(!body.title ? [{ field: 'title', message: 'Title is required' }] : []),
              ...(!body.body ? [{ field: 'body', message: 'Body is required' }] : []),
              ...(!body.category ? [{ field: 'category', message: 'Category is required' }] : []),
            ],
          },
        },
        { status: 422 },
      );
    }

    const channel = CHANNELS.find((c) => c.category === body.category);
    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      category: body.category,
      channelId: body.channelId ?? channel?.id ?? 'ch_1',
      title: body.title,
      body: body.body,
      author: { name: 'You', role: null },
      audience: body.audience ?? 'All employees',
      readCount: 0,
      postedAt: new Date().toISOString(),
      isPinned: body.isPinned ?? false,
    };

    if (newAnn.isPinned) {
      PINNED = newAnn;
    } else {
      FEED = [newAnn, ...FEED];
    }

    // bump channel post count
    const ch = CHANNELS.find((c) => c.id === newAnn.channelId);
    if (ch) ch.postCount += 1;

    return HttpResponse.json({ success: true, data: newAnn }, { status: 201 });
  }),
];
