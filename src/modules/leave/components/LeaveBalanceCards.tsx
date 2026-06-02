'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useLeaveBalance } from '../hooks/useLeave';
import { leaveTypeColor } from './LeaveStatusBadge';

/* ── Compact balance row (embedded in My Requests tab) ───────────────────── */

export function LeaveBalanceRow() {
  const { data: balances, isLoading, isError, refetch } = useLeaveBalance();

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex-none w-44 rounded-xl border border-subtle bg-surface p-3.5 space-y-2"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState compact message="Failed to load balances." onRetry={() => refetch()} />;
  }

  if (!balances || balances.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {balances.map((b) => {
        const color = leaveTypeColor(b.leaveTypeCode, b.leaveTypeName);
        const usedPct = b.total > 0 ? (b.used / b.total) * 100 : 0;
        const left = b.available;

        return (
          <div
            key={b.id}
            className="flex-none w-44 rounded-xl border border-subtle bg-surface p-3.5"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: color }}
                aria-hidden
              />
              <span className="text-[12px] font-medium leading-[16px] text-fg truncate">
                {b.leaveTypeName}
              </span>
            </div>
            <p className="text-[13px] leading-[18px] font-medium text-fg tabular-nums">
              <strong>{left}</strong>
              <span className="text-fg-muted font-normal"> / {b.total} days</span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${usedPct}%`, background: color }}
                role="progressbar"
                aria-valuenow={Math.round(usedPct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${b.leaveTypeName}: ${Math.round(usedPct)}% used`}
              />
            </div>
            {b.pending > 0 && <p className="mt-1 text-[11px] text-warning">{b.pending} pending</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ── Legacy full-page grid (kept for backward compat) ────────────────────── */

export function LeaveBalanceCards() {
  return (
    <div className="px-6 pb-6">
      <LeaveBalanceRow />
    </div>
  );
}
