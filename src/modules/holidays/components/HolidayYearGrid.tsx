'use client';

import { useMemo } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Holiday } from '../types/holiday.types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_ABBRS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface HolidayYearGridProps {
  year: number;
  holidays: Holiday[];
}

export function HolidayYearGrid({ year, holidays }: HolidayYearGridProps) {
  // Build a Set of YYYY-MM-DD keys and a map of date → holiday for the year
  const holidayDateMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const h of holidays) {
      const key = format(parseISO(h.holidayDate), 'yyyy-MM-dd');
      map.set(key, h);
    }
    return map;
  }, [holidays]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MONTH_NAMES.map((monthName, monthIndex) => (
        <MonthCard
          key={monthIndex}
          year={year}
          month={monthIndex}
          monthName={monthName}
          holidayDateMap={holidayDateMap}
        />
      ))}
    </div>
  );
}

interface MonthCardProps {
  year: number;
  month: number;
  monthName: string;
  holidayDateMap: Map<string, Holiday>;
}

function MonthCard({ year, month, monthName, holidayDateMap }: MonthCardProps) {
  const days = useMemo(() => {
    const result: Date[] = [];
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      result.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return result;
  }, [year, month]);

  const leadingBlanks = days[0]?.getDay() ?? 0;

  const hasHolidayThisMonth = days.some((d) => holidayDateMap.has(format(d, 'yyyy-MM-dd')));

  return (
    <div
      className={cn(
        'rounded-lg border bg-surface transition-colors',
        hasHolidayThisMonth ? 'border-brand/20' : 'border-subtle',
      )}
    >
      {/* Month header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-subtle">
        <h3 className="text-xs font-semibold text-fg">{monthName}</h3>
        {hasHolidayThisMonth && (
          <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand">
            {days.filter((d) => holidayDateMap.has(format(d, 'yyyy-MM-dd'))).length}
          </span>
        )}
      </div>

      {/* Calendar grid */}
      <div className="p-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_ABBRS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-fg-subtle py-0.5">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const holiday = holidayDateMap.get(key);
            const isTodayDay = isToday(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={key}
                className="flex flex-col items-center"
                title={holiday ? holiday.name : undefined}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-[11px] leading-none transition-colors',
                    isTodayDay && !holiday && 'bg-brand text-on-primary font-semibold',
                    isTodayDay && holiday && 'bg-brand text-on-primary font-semibold',
                    !isTodayDay &&
                      holiday &&
                      !holiday.isOptional &&
                      'bg-success/15 text-success font-semibold ring-1 ring-success/20',
                    !isTodayDay &&
                      holiday &&
                      holiday.isOptional &&
                      'bg-info/15 text-info font-medium ring-1 ring-info/20 ring-dashed',
                    !holiday && !isTodayDay && isWeekend && 'text-fg-muted',
                    !holiday && !isTodayDay && !isWeekend && 'text-fg',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
