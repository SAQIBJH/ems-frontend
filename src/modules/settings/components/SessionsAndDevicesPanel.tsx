'use client';

import { MonitorIcon, SmartphoneIcon, TabletIcon, TrashIcon } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useSessions, useRevokeSession } from '@/modules/auth/hooks/useSessions';
import type { Session } from '@/modules/auth/types/auth.types';

function parseDevice(userAgent: string): {
  browser: string;
  os: string;
  type: 'desktop' | 'mobile' | 'tablet';
} {
  const ua = userAgent.toLowerCase();

  let browser = 'Unknown browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/')) browser = 'Safari';

  let os = 'Unknown OS';
  if (ua.includes('windows nt')) os = 'Windows';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (ua.includes('ipad') || ua.includes('tablet')) type = 'tablet';
  else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android'))
    type = 'mobile';

  return { browser, os, type };
}

function DeviceIcon({ type }: { type: 'desktop' | 'mobile' | 'tablet' }) {
  if (type === 'mobile') return <SmartphoneIcon className="size-5 text-fg-subtle" />;
  if (type === 'tablet') return <TabletIcon className="size-5 text-fg-subtle" />;
  return <MonitorIcon className="size-5 text-fg-subtle" />;
}

function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-subtle p-4 flex items-start gap-3">
          <Skeleton className="size-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

interface SessionCardProps {
  session: Session;
  isCurrent: boolean;
}

function SessionCard({ session, isCurrent }: SessionCardProps) {
  const revoke = useRevokeSession();
  const { browser, os, type } = parseDevice(session.userAgent);

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4 flex items-start gap-3">
      <div className="size-9 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
        <DeviceIcon type={type} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-fg">
            {session.deviceName ?? `${browser} on ${os}`}
          </span>
          {isCurrent && (
            <Badge variant="default" className="text-[0.625rem] leading-none py-0.5">
              This device
            </Badge>
          )}
          {session.isRevoked && (
            <Badge variant="destructive" className="text-[0.625rem] leading-none py-0.5">
              Revoked
            </Badge>
          )}
        </div>
        <p className="text-xs text-fg-muted mt-0.5">IP: {session.ipAddress}</p>
        <p className="text-xs text-fg-muted">
          Last seen {formatDistanceToNow(parseISO(session.lastSeenAt), { addSuffix: true })} ·
          Signed in {formatDistanceToNow(parseISO(session.loginAt), { addSuffix: true })}
        </p>
      </div>

      {!isCurrent && !session.isRevoked && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-danger hover:text-danger"
          disabled={revoke.isPending}
          onClick={() => revoke.mutate(session.id)}
        >
          <TrashIcon className="size-3.5 mr-1.5" />
          Revoke
        </Button>
      )}
    </div>
  );
}

export function SessionsAndDevicesPanel() {
  const { data: sessions, isLoading, isError, refetch } = useSessions();

  if (isError) {
    return <ErrorState message="Failed to load sessions." onRetry={() => void refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-fg">Sessions & Devices</h2>
          <p className="text-sm text-fg-muted mt-0.5">
            Active sessions for your account across all devices.
          </p>
        </div>
        <SessionsSkeleton />
      </div>
    );
  }

  const active = (sessions ?? []).filter((s) => !s.isRevoked);
  const revoked = (sessions ?? []).filter((s) => s.isRevoked);

  // The most recently seen active session is marked as "This device"
  const currentId =
    active.length > 0 ? active.reduce((a, b) => (a.lastSeenAt > b.lastSeenAt ? a : b)).id : null;

  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState
        title="No active sessions"
        description="You have no active sessions. Sign in to see them here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-fg">Sessions & Devices</h2>
        <p className="text-sm text-fg-muted mt-0.5">
          Active sessions for your account across all devices. Revoke any session you don&apos;t
          recognise.
        </p>
      </div>

      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-disabled">
            Active ({active.length})
          </p>
          <div className="space-y-2">
            {active
              .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
              .map((s) => (
                <SessionCard key={s.id} session={s} isCurrent={s.id === currentId} />
              ))}
          </div>
        </div>
      )}

      {revoked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-disabled">
            Revoked ({revoked.length})
          </p>
          <div className="space-y-2">
            {revoked
              .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
              .map((s) => (
                <SessionCard key={s.id} session={s} isCurrent={false} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
