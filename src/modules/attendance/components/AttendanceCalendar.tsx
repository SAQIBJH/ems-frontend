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
  /** Called when the user clicks a day cell. */
  onDayClick?: (
    date: string,
    record: import('../types/attendance.types').AttendanceRecord | null,
  ) => void;
}

export function AttendanceCalendar({
  currentDate,
  onPrev,
  onNext,
  employeeId,
  onDayClick,
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
    <div className="rounded-xl border border-subtle bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
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

      <div className="p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1.5">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-fg-subtle"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* leading blank cells */}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} className="rounded-md" />
          ))}

          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const record = recordMap.get(key);
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={key}
                role={onDayClick ? 'button' : undefined}
                tabIndex={onDayClick ? 0 : undefined}
                onClick={() => onDayClick?.(key, record ?? null)}
                onKeyDown={(e) => {
                  if (onDayClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onDayClick(key, record ?? null);
                  }
                }}
                className={cn(
                  'flex min-h-[68px] flex-col gap-1 rounded-md border p-2',
                  'transition-colors duration-[120ms]',
                  isCurrentDay ? 'border-brand' : 'border-subtle',
                  isWeekend && !isCurrentDay && 'bg-surface-2',
                  !isWeekend && !isCurrentDay && 'bg-surface',
                  onDayClick &&
                    'cursor-pointer hover:border-default-border hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                )}
              >
                {isLoading ? (
                  <Skeleton className="size-4 rounded" />
                ) : (
                  <>
                    <span
                      className={cn(
                        'text-xs font-semibold tabular-nums',
                        isCurrentDay
                          ? 'text-brand'
                          : isCurrentMonth
                            ? 'text-fg'
                            : 'text-fg-disabled',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {record && (
                      <span className="mt-auto">
                        <StatusPip status={record.status} />
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
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
            <span className={cn('size-2 rounded-full', cfg.bgClass)} aria-hidden />
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
        'inline-block rounded-full px-1.5 py-[1px] text-[10px] font-medium leading-[14px]',
        cfg.bgClass,
        cfg.textClass,
      )}
      title={cfg.label}
    >
      {cfg.label}
    </span>
  );
}
