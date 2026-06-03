'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { PinIcon, UsersIcon, CheckIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Announcement } from '../types/announcements.types';
import { CATEGORY_CONFIG } from '../constants';

interface Props {
  announcement: Announcement;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function AnnouncementCard({ announcement: a }: Props) {
  const cfg = CATEGORY_CONFIG[a.category];

  return (
    <article
      className="rounded-xl border border-subtle bg-surface overflow-hidden"
      style={{ borderLeft: `3px solid ${cfg.color}` }}
    >
      <div className="flex flex-col gap-3 px-5 py-[18px]">
        {/* Meta row */}
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em]"
            style={{ color: cfg.color }}
          >
            <span
              className="size-[7px] rounded-full shrink-0"
              style={{ background: cfg.color }}
              aria-hidden
            />
            {a.category}
          </span>

          {a.isPinned && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-subtle">
              <PinIcon size={11} aria-hidden />
              Pinned
            </span>
          )}

          <span className="ml-auto text-[12px] text-fg-subtle">{timeAgo(a.postedAt)}</span>
        </div>

        {/* Title */}
        <h3
          className="font-semibold text-fg m-0"
          style={{
            fontSize: a.isPinned ? '18px' : '15px',
            lineHeight: a.isPinned ? '24px' : '20px',
          }}
        >
          {a.title}
        </h3>

        {/* Body */}
        <p className="text-[13px] leading-[20px] text-fg-muted m-0 max-w-[68ch]">{a.body}</p>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(a.author.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-[12px] font-medium text-fg leading-4">{a.author.name}</div>
              {a.author.role && (
                <div className="text-[11px] text-fg-subtle leading-[14px]">{a.author.role}</div>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-fg-subtle">
              <UsersIcon size={13} aria-hidden />
              {a.audience}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-fg-subtle">
              <CheckIcon size={13} aria-hidden />
              {a.readCount} read
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
