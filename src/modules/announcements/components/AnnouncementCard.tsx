'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { PinIcon, UsersIcon, CheckIcon, MoreHorizontalIcon, PinOffIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Announcement } from '../types/announcements.types';
import { CATEGORY_CONFIG } from '../constants';

interface Props {
  announcement: Announcement;
  canPin?: boolean;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  isPinning?: boolean;
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

export function AnnouncementCard({
  announcement: a,
  canPin = false,
  onPin,
  onUnpin,
  isPinning = false,
}: Props) {
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

          {/* 3-dot menu — HR/SUPER_ADMIN only */}
          {canPin && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-6 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-[120ms]"
                disabled={isPinning}
                aria-label="Announcement actions"
              >
                <MoreHorizontalIcon size={14} aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {a.isPinned ? (
                  <DropdownMenuItem onClick={() => onUnpin?.(a.id)}>
                    <PinOffIcon size={13} aria-hidden />
                    Unpin
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onPin?.(a.id)}>
                    <PinIcon size={13} aria-hidden />
                    Pin to top
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
