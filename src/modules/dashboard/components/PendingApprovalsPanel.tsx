'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { NoApprovalsIllustration } from '@/components/feedback/illustrations';
import { useApproveLeaveRequest, useRejectLeaveRequest } from '@/modules/leave';
import { useApproveRegularization, useDenyRegularization } from '@/modules/attendance';
import { useManagerApprovals } from '../hooks/useDashboard';
import type { ManagerLeaveApproval, ManagerRegularizationApproval } from '../types/dashboard.types';

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

function dateRange(start: string, end: string): string {
  try {
    const s = format(parseISO(start), 'MMM d');
    const e = format(parseISO(end), 'MMM d, yyyy');
    return s === e ? s : `${s} – ${e}`;
  } catch {
    return start;
  }
}

function DenyInput({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: (comment: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [comment, setComment] = useState('');
  return (
    <div className="mt-2 ml-11 flex items-center gap-2">
      <input
        type="text"
        placeholder="Reason for denial (required)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="flex-1 rounded-md border border-subtle bg-surface-2 px-3 py-1.5 text-xs text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-brand"
        autoFocus
      />
      <Button
        size="xs"
        variant="destructive"
        disabled={isPending || !comment.trim()}
        onClick={() => onConfirm(comment.trim())}
      >
        {isPending ? (
          <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
        ) : (
          'Confirm'
        )}
      </Button>
      <Button size="xs" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

function LeaveRow({
  req,
  approveMutation,
  rejectMutation,
}: {
  req: ManagerLeaveApproval;
  approveMutation: ReturnType<typeof useApproveLeaveRequest>;
  rejectMutation: ReturnType<typeof useRejectLeaveRequest>;
}) {
  const [denying, setDenying] = useState(false);
  const isApproving = approveMutation.isPending && approveMutation.variables?.id === req.id;
  const isDenying = rejectMutation.isPending && rejectMutation.variables?.id === req.id;

  return (
    <div className="px-5 py-3">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand">
          {initials(req.employeeName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-fg truncate">{req.employeeName}</p>
            <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
              Leave
            </span>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">
            {req.leaveType} · {req.totalDays}d · {dateRange(req.startDate, req.endDate)}
          </p>
          {req.reason && (
            <p className="text-xs text-fg-subtle mt-0.5 italic line-clamp-1">
              &ldquo;{req.reason}&rdquo;
            </p>
          )}
        </div>
        {!denying && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="xs"
              variant="ghost"
              className="text-success hover:bg-success/10 hover:text-success gap-1"
              disabled={isApproving || isDenying}
              onClick={() => approveMutation.mutate({ id: req.id })}
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
              onClick={() => setDenying(true)}
            >
              <XIcon className="size-3" aria-hidden />
              Deny
            </Button>
          </div>
        )}
      </div>
      {denying && (
        <DenyInput
          isPending={isDenying}
          onCancel={() => setDenying(false)}
          onConfirm={(comment) =>
            rejectMutation.mutate({ id: req.id, comment }, { onSettled: () => setDenying(false) })
          }
        />
      )}
    </div>
  );
}

function RegularizationRow({
  req,
  approveMutation,
  denyMutation,
}: {
  req: ManagerRegularizationApproval;
  approveMutation: ReturnType<typeof useApproveRegularization>;
  denyMutation: ReturnType<typeof useDenyRegularization>;
}) {
  const [denying, setDenying] = useState(false);
  const isApproving = approveMutation.isPending && approveMutation.variables?.id === req.id;
  const isDenying = denyMutation.isPending && denyMutation.variables?.id === req.id;

  return (
    <div className="px-5 py-3">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand">
          {initials(req.employeeName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-fg truncate">{req.employeeName}</p>
            <span className="shrink-0 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
              Regularization
            </span>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">Attendance · {fmtDate(req.attendanceDate)}</p>
          {req.reason && (
            <p className="text-xs text-fg-subtle mt-0.5 italic line-clamp-1">
              &ldquo;{req.reason}&rdquo;
            </p>
          )}
        </div>
        {!denying && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="xs"
              variant="ghost"
              className="text-success hover:bg-success/10 hover:text-success gap-1"
              disabled={isApproving || isDenying}
              onClick={() => approveMutation.mutate({ id: req.id })}
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
              onClick={() => setDenying(true)}
            >
              <XIcon className="size-3" aria-hidden />
              Deny
            </Button>
          </div>
        )}
      </div>
      {denying && (
        <DenyInput
          isPending={isDenying}
          onCancel={() => setDenying(false)}
          onConfirm={(comment) =>
            denyMutation.mutate({ id: req.id, comment }, { onSettled: () => setDenying(false) })
          }
        />
      )}
    </div>
  );
}

export function PendingApprovalsPanel() {
  const { data, isLoading, isError, refetch } = useManagerApprovals();
  const approveLeaveMutation = useApproveLeaveRequest();
  const rejectLeaveMutation = useRejectLeaveRequest();
  const approveRegMutation = useApproveRegularization();
  const denyRegMutation = useDenyRegularization();

  const leaveRequests = (data?.leaveRequests ?? []).filter((r) => r.status === 'PENDING');
  const regRequests = (data?.regularizationRequests ?? []).filter((r) => r.status === 'PENDING');
  const totalPending = leaveRequests.length + regRequests.length;

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">Pending Approvals</h2>
        {totalPending > 0 && !isLoading && (
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            {totalPending}
          </span>
        )}
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
        ) : totalPending === 0 ? (
          <EmptyState
            illustration={<NoApprovalsIllustration />}
            title="No pending approvals"
            description="You're all caught up."
            className="py-12"
          />
        ) : (
          <>
            {leaveRequests.map((req) => (
              <LeaveRow
                key={req.id}
                req={req}
                approveMutation={approveLeaveMutation}
                rejectMutation={rejectLeaveMutation}
              />
            ))}
            {regRequests.map((req) => (
              <RegularizationRow
                key={req.id}
                req={req}
                approveMutation={approveRegMutation}
                denyMutation={denyRegMutation}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
