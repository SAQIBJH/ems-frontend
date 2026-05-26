'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { FileTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/providers';
import { useEmployeeAuditLogs } from '../hooks/useEmployeeAuditLogs';
import type { AuditLogEntry } from '../services/auditLogs.api';

type KnownAction = 'CREATE' | 'UPDATE' | 'DELETE';

const ACTION_CONFIG: Record<KnownAction, { label: string; className: string }> = {
  CREATE: { label: 'Created', className: 'bg-success/10 text-success' },
  UPDATE: { label: 'Updated', className: 'bg-info/10 text-info' },
  DELETE: { label: 'Deleted', className: 'bg-danger/10 text-danger' },
};

function ActionBadge({ action }: { action: AuditLogEntry['action'] }) {
  const cfg = ACTION_CONFIG[action as KnownAction] ?? {
    label: action,
    className: 'bg-surface-2 text-fg-muted',
  };
  return (
    <span
      className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', cfg.className)}
    >
      {cfg.label}
    </span>
  );
}

function AuditLogList({ employeeId }: { employeeId: string }) {
  const { data: logs, isLoading, isError, refetch } = useEmployeeAuditLogs(employeeId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load activity log." onRetry={() => refetch()} />;
  }

  if (!logs || logs.length === 0) {
    return (
      <EmptyState
        title="No activity"
        description="No audit events have been recorded for this employee."
        icon={<FileTextIcon className="size-6 text-fg-muted" aria-hidden />}
      />
    );
  }

  return (
    <div className="space-y-1">
      {logs.map((log) => {
        const relativeTime = (() => {
          try {
            return formatDistanceToNow(parseISO(log.created_at), { addSuffix: true });
          } catch {
            return '—';
          }
        })();

        return (
          <div
            key={log.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-2"
          >
            <ActionBadge action={log.action} />
            <span className="flex-1 truncate text-sm text-fg">{log.user_email}</span>
            <span className="shrink-0 text-xs text-fg-muted">{relativeTime}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ActivityTab({ employeeId }: { employeeId: string }) {
  const { user, permissions } = useAuth();

  const canView =
    permissions.includes('audit-logs:read') ||
    (user !== null && ['HR_ADMIN', 'SUPER_ADMIN'].includes(user.memberType));

  if (!canView) {
    return (
      <EmptyState
        title="Access restricted"
        description="Activity log is visible to HR administrators only."
        icon={<FileTextIcon className="size-6 text-fg-muted" aria-hidden />}
      />
    );
  }

  return <AuditLogList employeeId={employeeId} />;
}
