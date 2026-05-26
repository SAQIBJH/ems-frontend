'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckIcon, XIcon, InboxIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useApproveLeaveRequest, useRejectLeaveRequest } from '@/modules/leave';
import { useManagerApprovals } from '../hooks/useDashboard';

function dateRange(start: string, end: string): string {
  try {
    const s = format(parseISO(start), 'MMM d');
    const e = format(parseISO(end), 'MMM d, yyyy');
    return s === e ? s : `${s} – ${e}`;
  } catch {
    return start;
  }
}

export function PendingApprovalsPanel() {
  const { data, isLoading, isError, refetch } = useManagerApprovals();
  const approve = useApproveLeaveRequest();
  const reject = useRejectLeaveRequest();
  const [denying, setDenying] = useState<string | null>(null);

  const pending = (data ?? []).filter((r) => r.status === 'PENDING');

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">Pending Approvals</h2>
      </div>
      <div className="divide-y divide-subtle">
        {isLoading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-14 rounded-md" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-4">
            <ErrorState
              compact
              message="Failed to load pending approvals"
              onRetry={() => refetch()}
            />
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 px-5">
            <InboxIcon className="size-10 text-fg-muted" aria-hidden />
            <p className="text-sm font-medium text-fg-muted">No pending approvals</p>
            <p className="text-xs text-fg-subtle">You&apos;re all caught up.</p>
          </div>
        ) : (
          pending.map((req) => {
            const name = req.employee
              ? `${req.employee.firstName} ${req.employee.lastName}`
              : (req.employeeName ?? 'Employee');
            const initials = name
              .split(' ')
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? '')
              .join('');
            const isApproving = approve.isPending && approve.variables?.id === req.id;
            const isDenying = reject.isPending && reject.variables?.id === req.id;
            const showDenyInput = denying === req.id;

            return (
              <div key={req.id} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand">
                    {initials}
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg truncate">{name}</p>
                    <p className="text-xs text-fg-muted mt-0.5">
                      {req.leaveTypeName} · {req.totalDays}d ·{' '}
                      {dateRange(req.startDate, req.endDate)}
                    </p>
                    {req.reason && (
                      <p className="text-xs text-fg-subtle mt-0.5 italic line-clamp-1">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {!showDenyInput && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-success hover:bg-success/10 hover:text-success gap-1"
                        disabled={isApproving || isDenying}
                        onClick={() => approve.mutate({ id: req.id })}
                      >
                        {isApproving ? (
                          <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : (
                          <CheckIcon className="size-3" aria-hidden />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-danger hover:bg-danger/10 hover:text-danger gap-1"
                        disabled={isApproving || isDenying}
                        onClick={() => setDenying(req.id)}
                      >
                        <XIcon className="size-3" aria-hidden />
                        Deny
                      </Button>
                    </div>
                  )}
                </div>

                {/* Inline deny comment input */}
                {showDenyInput && (
                  <div className="mt-2 ml-11 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Reason for denial (required)"
                      className="flex-1 rounded-md border border-subtle bg-surface-2 px-3 py-1.5 text-xs text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-brand"
                      id={`deny-comment-${req.id}`}
                      autoFocus
                    />
                    <Button
                      size="xs"
                      variant="destructive"
                      disabled={isDenying}
                      onClick={() => {
                        const el = document.getElementById(
                          `deny-comment-${req.id}`,
                        ) as HTMLInputElement | null;
                        const comment = el?.value?.trim() ?? '';
                        if (!comment) return;
                        reject.mutate(
                          { id: req.id, comment },
                          { onSettled: () => setDenying(null) },
                        );
                      }}
                    >
                      {isDenying ? (
                        <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : (
                        'Confirm'
                      )}
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setDenying(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
