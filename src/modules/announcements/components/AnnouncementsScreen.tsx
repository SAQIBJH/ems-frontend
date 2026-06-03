'use client';

import { useState } from 'react';
import { PlusIcon, MegaphoneIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
import { PageHeader } from '@/shared/layouts/PageHeader';
import {
  useAnnouncements,
  useAnnouncementChannels,
  useAnnouncementEvents,
  usePinAnnouncement,
  useUnpinAnnouncement,
} from '../hooks/useAnnouncements';
import { CATEGORY_CONFIG } from '../constants';
import { AnnouncementCard } from './AnnouncementCard';
import { CreateAnnouncementDialog } from './CreateAnnouncementDialog';
import { CreateEventDialog } from './CreateEventDialog';
import type { Channel } from '../types/announcements.types';
import { useAuth } from '@/providers';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-subtle bg-surface p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-subtle bg-surface p-4 space-y-2">
        <Skeleton className="h-4 w-20 mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="size-[7px] rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-subtle bg-surface p-4 space-y-3">
        <Skeleton className="h-4 w-24 mb-1" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="space-y-1 w-10">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-3 w-6" />
            </div>
            <div className="space-y-1 flex-1 pl-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnnouncementsScreen() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const { user } = useAuth();

  const feedQuery = useAnnouncements(activeChannelId ? { channelId: activeChannelId } : undefined);
  const channelsQuery = useAnnouncementChannels();
  const eventsQuery = useAnnouncementEvents();

  const pinned = feedQuery.data?.pinned ?? null;
  const feed = feedQuery.data?.feed ?? [];
  const channels = channelsQuery.data ?? [];
  const events = eventsQuery.data ?? [];

  const canPost =
    user?.memberType === 'HR_ADMIN' ||
    user?.memberType === 'SUPER_ADMIN' ||
    user?.memberType === 'MANAGER';

  const canPin = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';

  const pinMutation = usePinAnnouncement();
  const unpinMutation = useUnpinAnnouncement();

  function handlePin(id: string) {
    pinMutation.mutate(id, {
      onSuccess: () => toast.success('Announcement pinned'),
      onError: () => toast.error('Failed to pin announcement'),
    });
  }

  function handleUnpin(id: string) {
    unpinMutation.mutate(id, {
      onSuccess: () => toast.success('Announcement unpinned'),
      onError: () => toast.error('Failed to unpin announcement'),
    });
  }

  const authorName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : (user?.email ?? 'You');

  function handleChannelClick(ch: Channel) {
    setActiveChannelId((prev) => (prev === ch.id ? null : ch.id));
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Company-wide updates, policy changes, and events."
        breadcrumbs={[{ label: 'Announcements' }]}
        actions={
          canPost && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <PlusIcon className="size-3.5" aria-hidden />
              New Announcement
            </Button>
          )
        }
      />

      <div className="p-6">
        <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) 300px' }}>
          {/* ── Feed column ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Composer */}
            {canPost && (
              <div className="rounded-xl border border-subtle bg-surface px-[18px] py-3.5 flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback className="text-[10px] font-medium">
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="flex-1 text-left text-[13px] text-fg-disabled bg-surface-2 border border-subtle rounded-lg px-3.5 py-2.5 hover:border-default transition-colors duration-[120ms] cursor-pointer"
                  onClick={() => setDialogOpen(true)}
                >
                  Share an update with the company…
                </button>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <MegaphoneIcon className="size-3.5" aria-hidden />
                  Post
                </Button>
              </div>
            )}

            {/* Active channel chip */}
            {activeChannelId &&
              (() => {
                const activeCh = channels.find((c) => c.id === activeChannelId);
                if (!activeCh) return null;
                const cfg = CATEGORY_CONFIG[activeCh.category];
                return (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveChannelId(null)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 py-1 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      <span
                        className="size-[6px] shrink-0 rounded-full"
                        style={{ background: cfg.color }}
                        aria-hidden
                      />
                      {activeCh.name}
                      <XIcon className="size-3 text-fg-subtle" aria-hidden />
                    </button>
                  </div>
                );
              })()}

            {/* Feed */}
            {feedQuery.isLoading ? (
              <FeedSkeleton />
            ) : feedQuery.isError ? (
              <ErrorState
                message="Failed to load announcements"
                onRetry={() => void feedQuery.refetch()}
              />
            ) : pinned === null && feed.length === 0 ? (
              <EmptyState
                title="No announcements"
                description={
                  activeChannelId
                    ? 'No announcements in this channel yet.'
                    : 'Nothing has been posted yet.'
                }
              />
            ) : (
              <>
                {pinned && (
                  <AnnouncementCard
                    announcement={pinned}
                    canPin={canPin}
                    onUnpin={handleUnpin}
                    isPinning={unpinMutation.isPending && unpinMutation.variables === pinned.id}
                  />
                )}
                {feed.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    canPin={canPin}
                    onPin={handlePin}
                    isPinning={pinMutation.isPending && pinMutation.variables === a.id}
                  />
                ))}
              </>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 sticky top-[var(--page-header-height,0px)]">
            {channelsQuery.isLoading || eventsQuery.isLoading ? (
              <SidebarSkeleton />
            ) : (
              <>
                {/* Channels */}
                <SectionCard title="Channels">
                  <div className="-mx-5 -mb-5 flex flex-col gap-0.5 px-2 pb-2">
                    {channels.map((ch) => {
                      const cfg = CATEGORY_CONFIG[ch.category];
                      const isActive = activeChannelId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleChannelClick(ch)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-[120ms] hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer "
                          style={{ background: isActive ? 'var(--bg-surface-2)' : 'transparent' }}
                        >
                          <span
                            className="size-[7px] shrink-0 rounded-full"
                            style={{ background: cfg.color }}
                            aria-hidden
                          />
                          <span className="flex-1 text-[13px] font-medium text-fg">{ch.name}</span>
                          <span className="font-mono text-[12px] text-fg-subtle">
                            {ch.postCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>

                {/* Upcoming events */}
                <SectionCard
                  title="Upcoming"
                  actions={
                    canPost && (
                      <button
                        type="button"
                        onClick={() => setEventDialogOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-hover transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        aria-label="Add upcoming event"
                      >
                        <PlusIcon className="size-3" aria-hidden />
                        Add
                      </button>
                    )
                  }
                >
                  <div className="-mx-5 -mb-5 flex flex-col gap-3.5 px-5 pb-5">
                    {events.length === 0 ? (
                      <p className="text-[13px] text-fg-muted">No upcoming events.</p>
                    ) : (
                      events.map((ev) => {
                        const parsed = parseISO(ev.date);
                        const day = format(parsed, 'd');
                        const month = format(parsed, 'MMM').toUpperCase();
                        return (
                          <div key={ev.id} className="flex gap-3">
                            <div className="w-11 shrink-0 text-center">
                              <div className="text-[16px] font-bold leading-[18px] text-fg">
                                {day}
                              </div>
                              <div className="text-[10px] font-medium leading-[12px] uppercase tracking-[0.05em] text-fg-subtle">
                                {month}
                              </div>
                            </div>
                            <div className="border-l border-subtle pl-3">
                              <div className="text-[13px] font-medium leading-[18px] text-fg">
                                {ev.title}
                              </div>
                              <div className="text-[12px] leading-4 text-fg-subtle">{ev.meta}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </div>

      {dialogOpen && <CreateAnnouncementDialog open={dialogOpen} onOpenChange={setDialogOpen} />}
      {eventDialogOpen && (
        <CreateEventDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} />
      )}
    </>
  );
}
