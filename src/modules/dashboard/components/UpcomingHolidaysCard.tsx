'use client';

import { format, isAfter, parseISO, startOfDay } from 'date-fns';
import { CalendarDaysIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useHolidays } from '@/modules/holidays/hooks/useHolidays';

const UPCOMING_COUNT = 3;

export function UpcomingHolidaysCard() {
  const year = new Date().getFullYear();
  const { data, isLoading, isError, refetch } = useHolidays(year);

  const upcoming = (() => {
    if (!data?.holidays) return [];
    const today = startOfDay(new Date());
    return data.holidays
      .filter(
        (h) =>
          isAfter(parseISO(h.holidayDate), today) ||
          format(parseISO(h.holidayDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      )
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate))
      .slice(0, UPCOMING_COUNT);
  })();

  return (
    <div className="rounded-xl border border-subtle bg-surface p-5 space-y-4">
      <p className="text-sm font-medium text-fg">Upcoming Holidays</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: UPCOMING_COUNT }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact message="Failed to load holidays" onRetry={() => refetch()} />
      ) : upcoming.length === 0 ? (
        <p className="text-sm text-fg-muted">No upcoming holidays.</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((h) => {
            const date = parseISO(h.holidayDate);
            return (
              <li key={h.id} className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-md bg-brand-50 text-brand dark:bg-brand/10">
                  <span className="text-[10px] font-semibold uppercase leading-none">
                    {format(date, 'MMM')}
                  </span>
                  <span className="text-base font-bold leading-none">{format(date, 'd')}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{h.name}</p>
                  {h.isOptional && <p className="text-[10px] text-fg-subtle">Optional</p>}
                </div>
                <CalendarDaysIcon className="ml-auto size-4 shrink-0 text-fg-muted" aria-hidden />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
