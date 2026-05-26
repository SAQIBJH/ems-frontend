'use client';

import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/providers';
import { useLeaveRequests, LeaveStatusBadge } from '@/modules/leave';
import type { LeaveBalance } from '../types/employee.types';

function formatDateRange(start: string, end: string): string {
  try {
    const s = format(parseISO(start), 'dd MMM');
    const e = format(parseISO(end), 'dd MMM');
    return s === e ? s : `${s} – ${e}`;
  } catch {
    return '—';
  }
}

function BalanceCards({ balances }: { balances: LeaveBalance[] }) {
  if (balances.length === 0) {
    return (
      <EmptyState
        title="No leave balances"
        description="Leave balances have not been configured for this employee."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((b) => (
        <div
          key={b.leaveTypeId}
          className="space-y-3 rounded-lg border border-subtle bg-surface p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg">{b.leaveType.name}</span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {b.leaveType.code}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="tabular-nums text-xl font-semibold text-fg">{b.balance}</p>
              <p className="text-[10px] uppercase tracking-wide text-fg-muted">Available</p>
            </div>
            <div>
              <p className="tabular-nums text-xl font-semibold text-fg">{b.used}</p>
              <p className="text-[10px] uppercase tracking-wide text-fg-muted">Used</p>
            </div>
            <div>
              <p className="tabular-nums text-xl font-semibold text-warning">{b.pending}</p>
              <p className="text-[10px] uppercase tracking-wide text-fg-muted">Pending</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SelfLeaveRequests() {
  const { data, isLoading, isError, refetch } = useLeaveRequests({ limit: 10 });
  const requests = data?.requests ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load leave requests." onRetry={() => refetch()} />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title="No requests"
        description="No leave requests found."
        icon={<CalendarIcon className="size-6 text-fg-muted" aria-hidden />}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-subtle">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-subtle bg-surface-2 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            <th className="px-4 py-2.5">Type</th>
            <th className="px-4 py-2.5">Period</th>
            <th className="px-4 py-2.5">Days</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-surface-2/50">
              <td className="px-4 py-3 font-medium text-fg">{req.leaveTypeName}</td>
              <td className="px-4 py-3 text-fg-muted">
                {formatDateRange(req.startDate, req.endDate)}
              </td>
              <td className="px-4 py-3 tabular-nums text-fg-muted">{req.totalDays}</td>
              <td className="px-4 py-3">
                <LeaveStatusBadge status={req.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface LeaveTabProps {
  balances: LeaveBalance[];
  employeeId: string;
}

export function LeaveTab({ balances, employeeId }: LeaveTabProps) {
  const { user } = useAuth();
  const isSelf = user?.employeeId === employeeId;

  return (
    <div className="space-y-6">
      <BalanceCards balances={balances} />
      {isSelf && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-fg">Leave Requests</h3>
          <SelfLeaveRequests />
        </div>
      )}
    </div>
  );
}
