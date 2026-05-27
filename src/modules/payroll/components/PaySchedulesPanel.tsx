'use client';

import { CalendarClockIcon } from 'lucide-react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaySchedules } from '../index';

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  BIWEEKLY: 'Bi-weekly',
  WEEKLY: 'Weekly',
};

export function PaySchedulesPanel() {
  const { data: schedules = [], isLoading, isError, refetch } = usePaySchedules();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load pay schedules" onRetry={() => refetch()} />;
  }

  if (schedules.length === 0) {
    return (
      <EmptyState
        title="No pay schedules"
        description="Pay schedules for bi-weekly and weekly pay groups are configured here. Contact your administrator to add schedules."
        icon={<CalendarClockIcon className="size-6 text-fg-muted" />}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">
        Pay schedules define pay period cadence for bi-weekly and weekly pay groups. Monthly groups
        default to the calendar month.
      </p>

      <div className="rounded-lg border border-subtle overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-surface-raised/40">
              <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted">Name</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted">Frequency</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted">Timezone</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted">Next Run</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted">Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="border-b border-subtle last:border-0">
                <td className="px-3 py-2.5 font-medium text-fg">{schedule.name}</td>
                <td className="px-3 py-2.5 text-fg-muted">
                  {FREQUENCY_LABELS[schedule.frequency] ?? schedule.frequency}
                </td>
                <td className="px-3 py-2.5 text-fg-muted font-mono text-xs">{schedule.timezone}</td>
                <td className="px-3 py-2.5 text-fg-muted">{schedule.nextRunDate}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={
                      schedule.active
                        ? 'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-success bg-success/10'
                        : 'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-fg-muted bg-surface-raised'
                    }
                  >
                    {schedule.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
