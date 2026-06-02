'use client';

import { SectionCard } from '@/components/data-display/SectionCard';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useLeaveTypes } from '@/modules/leave';
import type { LeaveBalance } from '../types/employee.types';

interface LeaveBalanceSidecardProps {
  balances: LeaveBalance[];
}

export function LeaveBalanceSidecard({ balances }: LeaveBalanceSidecardProps) {
  const { data: leaveTypes = [], isLoading } = useLeaveTypes();

  if (balances.length === 0) return null;

  return (
    <SectionCard title="Leave balance" noPad>
      <div className="px-5 py-1">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-b border-subtle py-3 last:border-0 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))
          : balances.map((b) => {
              const typeName = leaveTypes.find((t) => t.id === b.leaveTypeId)?.name ?? 'Leave';
              const remaining = Math.max(0, b.balance - b.used);
              const pct = b.balance > 0 ? Math.min((b.used / b.balance) * 100, 100) : 0;

              return (
                <div key={b.leaveTypeId} className="border-b border-subtle py-3 last:border-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-fg">{typeName}</span>
                    <span className="text-xs tabular-nums text-fg-muted">
                      {remaining} / {b.balance} days
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-[280ms]"
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={b.used}
                      aria-valuemin={0}
                      aria-valuemax={b.balance}
                    />
                  </div>
                </div>
              );
            })}
      </div>
    </SectionCard>
  );
}
