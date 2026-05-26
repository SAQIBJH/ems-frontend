'use client';

import { useMemo } from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/lib/utils';

import { useAttendanceRecords, useAttendanceTeamRecords } from '../hooks/useAttendance';
import { STATUS_CONFIG } from '../constants';
import { buildDateMap, getDaysInMonth } from '../utils/attendance.utils';
import type { AttendanceStatus } from '../types/attendance.types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface AttendanceCalendarProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  /** If set, shows records for this employee via the team endpoint. */
  employeeId?: string;
}

export function AttendanceCalendar({
  currentDate,
  onPrev,
  onNext,
  employeeId,
}: AttendanceCalendarProps) {
  const monthParam = format(currentDate, 'yyyy-MM');

  // Two queries — only one is enabled at a time based on whether viewing another employee
  const selfQuery = useAttendanceRecords({ month: monthParam, limit: 31 }, !employeeId);
  const teamQuery = useAttendanceTeamRecords(
    { month: monthParam, limit: 31, employeeId },
    !!employeeId,
  );

  const { data, isLoading, isError, refetch } = employeeId ? teamQuery : selfQuery;

  const recordMap = useMemo(() => buildDateMap(data?.records ?? []), [data?.records]);

  const days = useMemo(
    () => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  );

  // leading empty cells to align first day with correct weekday column
  const leadingBlanks = days[0]?.getDay() ?? 0;

  if (isError) {
    return <ErrorState message="Failed to load attendance records." onRetry={() => refetch()} />;
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
        <h3 className="text-sm font-semibold text-fg">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onPrev}
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onNext}
            aria-label="Next month"
          >
            <ChevronRightIcon className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-subtle">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-fg-subtle">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {/* leading blank cells */}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div
            key={`blank-${i}`}
            className="aspect-square border-b border-r border-subtle p-1 last:border-r-0"
          />
        ))}

        {days.map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd');
          const record = recordMap.get(key);
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isLastRow = idx >= days.length - 7;

          // Sunday or Saturday → weekend styling
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const colIdx = (leadingBlanks + idx) % 7;
          const isLastCol = colIdx === 6;

          return (
            <div
              key={key}
              className={cn(
                'relative flex flex-col items-center justify-start gap-0.5',
                'border-b border-r border-subtle p-1 pt-1.5',
                'min-h-[60px] sm:min-h-[72px]',
                isLastRow && 'border-b-0',
                isLastCol && 'border-r-0',
                isWeekend && 'bg-surface-2/50',
                isCurrentDay && 'ring-1 ring-inset ring-brand/40',
              )}
            >
              {isLoading ? (
                <Skeleton className="size-5 rounded-full" />
              ) : (
                <>
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                      isCurrentDay
                        ? 'bg-brand text-on-primary'
                        : isCurrentMonth
                          ? 'text-fg'
                          : 'text-fg-disabled',
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {record && <StatusPip status={record.status} />}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-subtle px-4 py-3">
        {(
          Object.entries(STATUS_CONFIG) as [
            AttendanceStatus,
            (typeof STATUS_CONFIG)[AttendanceStatus],
          ][]
        ).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className={cn('size-2 rounded-full', cfg.bgClass.replace('/10', ''))}
              style={{ backgroundColor: undefined }}
              aria-hidden
            />
            <span className="text-xs text-fg-subtle">{cfg.label}</span>
          </div>
        ))}
      </div>

      {!isLoading && data?.records.length === 0 && (
        <div className="py-8">
          <EmptyState
            title="No attendance records"
            description="No records found for this month."
          />
        </div>
      )}
    </div>
  );
}

function StatusPip({ status }: { status: AttendanceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none',
        cfg.bgClass,
        cfg.textClass,
      )}
      title={cfg.label}
    >
      {cfg.label}
    </span>
  );
}
