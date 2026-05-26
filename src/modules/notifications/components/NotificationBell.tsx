'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import type { Notification } from '../types/notification.types';

const TYPE_COLOR: Record<string, string> = {
  LEAVE_APPROVED: 'bg-success',
  LEAVE_REJECTED: 'bg-danger',
  LEAVE_WITHDRAWN: 'bg-warning',
  LEAVE_REQUESTED: 'bg-brand',
  REGULARIZATION_REQUESTED: 'bg-warning',
  REGULARIZATION_APPROVED: 'bg-success',
  REGULARIZATION_DENIED: 'bg-danger',
  ATTENDANCE_CHECK_IN: 'bg-success',
  ATTENDANCE_CHECK_OUT: 'bg-info',
  EMPLOYEE_CREATED: 'bg-brand',
  DOCUMENT_UPLOADED: 'bg-info',
  SYSTEM: 'bg-fg-muted',
};

function NotificationItem({
  notification,
  onAction,
}: {
  notification: Notification;
  onAction: (n: Notification) => void;
}) {
  const dot = TYPE_COLOR[notification.type] ?? 'bg-fg-muted';
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <button
      type="button"
      onClick={() => onAction(notification)}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-surface-2',
        !notification.isRead && 'bg-brand-50/40 dark:bg-brand/5',
      )}
    >
      {/* Type dot */}
      <span className={cn('mt-1.5 size-2 rounded-full shrink-0', dot)} aria-hidden />

      <span className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span
          className={cn(
            'text-sm leading-snug truncate',
            notification.isRead ? 'font-normal text-fg-muted' : 'font-medium text-fg',
          )}
        >
          {notification.title}
        </span>
        <span className="text-xs text-fg-muted line-clamp-2">{notification.body}</span>
        <span className="text-[10px] text-fg-subtle mt-0.5">{timeAgo}</span>
      </span>
    </button>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function handleAction(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    if (n.actionUrl) router.push(n.actionUrl);
  }

  function handleMarkAllRead() {
    markAllRead.mutate();
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="text-fg-muted relative"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white pointer-events-none"
            aria-hidden
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-subtle bg-popover shadow-lg z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
            <span className="text-sm font-semibold text-fg">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors cursor-pointer"
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-subtle">
            {notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <Bell className="size-8 text-fg-muted" aria-hidden />
                <p className="text-sm text-fg-muted">You&apos;re all caught up.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onAction={handleAction} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
