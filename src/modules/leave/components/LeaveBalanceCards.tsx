'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/lib/utils';

import { useLeaveBalance } from '../hooks/useLeave';

export function LeaveBalanceCards() {
  const { data: balances, isLoading, isError, refetch } = useLeaveBalance();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-subtle bg-surface p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load leave balances." onRetry={() => refetch()} />;
  }

  if (!balances || balances.length === 0) {
    return (
      <EmptyState
        title="No leave balances"
        description="Your leave balances will appear here once configured."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((balance) => {
        const usedPct = balance.total > 0 ? Math.round((balance.used / balance.total) * 100) : 0;

        return (
          <div
            key={balance.id}
            className="rounded-lg border border-subtle bg-surface p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">{balance.leaveTypeName}</h3>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-fg-muted">
                {balance.leaveTypeCode}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <BalanceStat label="Total" value={balance.total} />
              <BalanceStat label="Used" value={balance.used} highlight="used" />
              <BalanceStat label="Available" value={balance.available} highlight="available" />
            </div>

            {/* Progress bar */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-fg-subtle">{usedPct}% used</span>
                {balance.pending > 0 && (
                  <span className="text-[11px] text-warning">{balance.pending} pending</span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    usedPct > 80 ? 'bg-danger' : usedPct > 60 ? 'bg-warning' : 'bg-success',
                  )}
                  style={{ width: `${usedPct}%` }}
                  role="progressbar"
                  aria-valuenow={usedPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${balance.leaveTypeName} used: ${usedPct}%`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BalanceStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: 'used' | 'available';
}) {
  return (
    <div className="rounded-md bg-surface-2 px-2 py-2">
      <p className="text-xs text-fg-subtle mb-1">{label}</p>
      <p
        className={cn(
          'text-lg font-semibold tabular-nums',
          highlight === 'available' && 'text-success',
          highlight === 'used' && 'text-fg',
          !highlight && 'text-fg',
        )}
      >
        {value}
      </p>
    </div>
  );
}
