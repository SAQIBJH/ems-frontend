'use client';

import { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  getDaysInMonth,
  isWeekend,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers';

import { useTeamLeaveCalendar } from '../hooks/useLeave';
import type { TeamCalendarLeaveRange } from '../types/leave.types';

const STATUS_CELL = {
  APPROVED: { bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' },
  PENDING: { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/30' },
} as const;

function toDateStr(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM-dd');
}

function leaveOnDay(
  leaves: TeamCalendarLeaveRange[],
  dayStr: string,
): TeamCalendarLeaveRange | null {
  for (const leave of leaves) {
    if (leave.status === 'DENIED' || leave.status === 'REJECTED' || leave.status === 'WITHDRAWN') {
      continue;
    }
    if (dayStr >= toDateStr(leave.startDate) && dayStr <= toDateStr(leave.endDate)) {
      return leave;
    }
  }
  return null;
}

export function LeaveTeamCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(() => startOfMonth(new Date()));

  const canViewTeam =
    user?.memberType === 'MANAGER' ||
    user?.memberType === 'HR_ADMIN' ||
    user?.memberType === 'SUPER_ADMIN';

  const monthParam = format(currentDate, 'yyyy-MM');
  const { data, isLoading, isError, refetch } = useTeamLeaveCalendar(monthParam, canViewTeam);

  const days = useMemo(() => {
    const count = getDaysInMonth(currentDate);
    return Array.from(
      { length: count },
      (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1),
    );
  }, [currentDate]);

  if (!canViewTeam) {
    return (
      <EmptyState
        title="Access restricted"
        description="Team calendar is available to managers and HR admins."
      />
    );
  }

  const employees = data?.employees ?? [];

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
        </Button>
        <span className="min-w-[120px] text-center text-sm font-medium text-fg">
          {format(currentDate, 'MMMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          aria-label="Next month"
        >
          <ChevronRightIcon className="size-4" aria-hidden />
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-1.5">
          <Skeleton className="h-9 w-full rounded-t-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState message="Failed to load team leave calendar." onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && employees.length === 0 && (
        <EmptyState
          title="No team leave this month"
          description="No employees found for the selected month."
        />
      )}

      {!isLoading && !isError && employees.length > 0 && (
        <div className="rounded-lg border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs w-full">
              <thead>
                <tr className="bg-surface-2 border-b border-subtle">
                  {/* Sticky name column header */}
                  <th className="sticky left-0 z-10 bg-surface-2 w-44 min-w-[176px] px-3 py-2.5 text-left text-[11px] font-medium text-fg-muted border-r border-subtle whitespace-nowrap">
                    Team member
                  </th>
                  {days.map((day) => {
                    const weekend = isWeekend(day);
                    return (
                      <th
                        key={day.getDate()}
                        className={cn(
                          'w-8 min-w-[28px] py-2 text-center',
                          weekend ? 'bg-surface-2/60 text-fg-disabled' : 'text-fg-muted',
                        )}
                      >
                        <div className="text-[11px] font-semibold leading-none">
                          {format(day, 'd')}
                        </div>
                        <div className="text-[9px] font-normal leading-none mt-0.5 opacity-70">
                          {format(day, 'EEEEE')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {employees.map((emp, rowIdx) => (
                  <tr
                    key={emp.id}
                    className={cn(
                      'border-b border-subtle last:border-b-0 group',
                      rowIdx % 2 === 1 && 'bg-surface-2/20',
                    )}
                  >
                    {/* Sticky name cell */}
                    <td className="sticky left-0 z-10 bg-surface group-odd:bg-surface group-even:bg-surface-2/20 border-r border-subtle px-3 py-1.5 transition-colors group-hover:bg-surface-2/40">
                      <p className="font-medium text-fg truncate max-w-[148px] text-[12px] leading-tight">
                        {emp.name}
                      </p>
                      <p className="text-[10px] text-fg-muted font-mono leading-tight">
                        {emp.employeeCode}
                      </p>
                    </td>

                    {days.map((day) => {
                      const ds = format(day, 'yyyy-MM-dd');
                      const weekend = isWeekend(day);
                      const leave = leaveOnDay(emp.leaves, ds);
                      const cellStyle =
                        leave && (leave.status === 'APPROVED' || leave.status === 'PENDING')
                          ? STATUS_CELL[leave.status]
                          : null;

                      return (
                        <td
                          key={day.getDate()}
                          title={
                            leave
                              ? `${emp.name} · ${leave.leaveType} · ${leave.status.charAt(0) + leave.status.slice(1).toLowerCase()} · ${format(parseISO(leave.startDate), 'MMM d')}–${format(parseISO(leave.endDate), 'MMM d')} (${leave.totalDays}d)`
                              : undefined
                          }
                          className={cn(
                            'h-8 w-8 text-center align-middle border-r border-subtle/40 last:border-r-0',
                            !cellStyle && weekend && 'bg-surface-2/40',
                            cellStyle?.bg,
                          )}
                        >
                          {cellStyle && leave && (
                            <span className={cn('font-bold text-[10px]', cellStyle.text)}>
                              {(leave.leaveTypeCode ?? leave.leaveType).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-subtle px-3 py-2 bg-surface-2/30">
            <div className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-sm bg-success/20 border border-success/30"
                aria-hidden
              />
              <span className="text-[11px] text-fg-muted">Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-sm bg-warning/20 border border-warning/30"
                aria-hidden
              />
              <span className="text-[11px] text-fg-muted">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-sm bg-surface-2/60 border border-subtle"
                aria-hidden
              />
              <span className="text-[11px] text-fg-muted">Weekend</span>
            </div>
            <span className="text-[11px] text-fg-subtle italic ml-auto hidden sm:block">
              Hover a cell for details
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
