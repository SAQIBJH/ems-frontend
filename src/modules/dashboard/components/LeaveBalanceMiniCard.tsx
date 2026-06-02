'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useEmployeeDashboard } from '../hooks/useDashboard';

export function LeaveBalanceMiniCard() {
  const { data, isLoading, isError, refetch } = useEmployeeDashboard();
  const balances = data?.leaveBalanceSummary ?? [];

  return (
    <div className="rounded-xl border border-subtle bg-surface p-5 space-y-4">
      <p className="text-sm font-medium text-fg">Leave Balance</p>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md bg-surface-2 p-3 space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-7 w-8" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact message="Failed to load leave balance" onRetry={() => refetch()} />
      ) : balances.length === 0 ? (
        <p className="text-sm text-fg-muted">No leave balance available.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {balances.map((b) => (
            <div key={b.code} className="rounded-md bg-surface-2 p-3">
              <p className="text-xs text-fg-subtle truncate">{b.name}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-fg">{b.available}</p>
              <p className="text-[10px] text-fg-subtle">days left</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
