'use client';

import { useState } from 'react';
import { format, parseISO, startOfMonth, subMonths, addMonths } from 'date-fns';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/providers';
import { cn } from '@/lib/utils';
import {
  useAttendanceRecords,
  useAttendanceTeamRecords,
} from '@/modules/attendance/hooks/useAttendance';
import { STATUS_CONFIG } from '@/modules/attendance/constants';
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '@/modules/attendance/types/attendance.types';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'h:mm a');
  } catch {
    return '—';
  }
}

function formatDuration(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    textClass: 'text-fg-muted',
    bgClass: 'bg-surface-2',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        cfg.bgClass,
        cfg.textClass,
      )}
    >
      {cfg.label}
    </span>
  );
}

function RecordsTable({ records }: { records: AttendanceRecord[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-subtle">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-subtle bg-surface-2 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            <th className="px-4 py-2.5">Date</th>
            <th className="px-4 py-2.5">Check In</th>
            <th className="px-4 py-2.5">Check Out</th>
            <th className="px-4 py-2.5">Duration</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-surface-2/50">
              <td className="px-4 py-2.5 font-medium text-fg">
                {format(parseISO(r.attendanceDate), 'EEE, dd MMM')}
              </td>
              <td className="px-4 py-2.5 tabular-nums text-fg-muted">{formatTime(r.checkInAt)}</td>
              <td className="px-4 py-2.5 tabular-nums text-fg-muted">{formatTime(r.checkOutAt)}</td>
              <td className="px-4 py-2.5 tabular-nums text-fg-muted">
                {formatDuration(r.totalMinutes)}
              </td>
              <td className="px-4 py-2.5">
                <AttendanceStatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AttendanceTab({ employeeId }: { employeeId: string }) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const isSelf = user?.employeeId === employeeId;
  const monthParam = format(currentMonth, 'yyyy-MM');
  const isCurrentMonth = startOfMonth(new Date()) <= currentMonth;

  const selfQuery = useAttendanceRecords({ month: monthParam }, isSelf);
  const teamQuery = useAttendanceTeamRecords({ employeeId, month: monthParam }, !isSelf);
  const query = isSelf ? selfQuery : teamQuery;

  const records = query.data?.records ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
        </Button>
        <span className="min-w-28 text-center text-sm font-medium text-fg">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
          disabled={isCurrentMonth}
        >
          <ChevronRightIcon className="size-4" aria-hidden />
        </Button>
      </div>

      {query.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      )}

      {query.isError && (
        <ErrorState message="Failed to load attendance records." onRetry={() => query.refetch()} />
      )}

      {!query.isLoading && !query.isError && records.length === 0 && (
        <EmptyState
          title="No records"
          description={`No attendance records for ${format(currentMonth, 'MMMM yyyy')}.`}
          icon={<CalendarIcon className="size-6 text-fg-muted" aria-hidden />}
        />
      )}

      {!query.isLoading && !query.isError && records.length > 0 && (
        <RecordsTable records={records} />
      )}
    </div>
  );
}
