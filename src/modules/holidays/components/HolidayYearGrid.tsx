'use client';

import { useMemo } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Holiday } from '../types/holiday.types';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_ABBRS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface HolidayYearGridProps {
  year: number;
  holidays: Holiday[];
  onMonthClick?: (month: number) => void;
  onHolidayClick?: (holiday: Holiday) => void;
  selectedDate?: string;
}

export function HolidayYearGrid({
  year,
  holidays,
  onMonthClick,
  onHolidayClick,
  selectedDate,
}: HolidayYearGridProps) {
  const holidayDateMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const h of holidays) {
      const key = format(parseISO(h.holidayDate), 'yyyy-MM-dd');
      map.set(key, h);
    }
    return map;
  }, [holidays]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {MONTH_NAMES.map((monthName, monthIndex) => (
        <MonthCard
          key={monthIndex}
          year={year}
          month={monthIndex}
          monthName={monthName}
          holidayDateMap={holidayDateMap}
          selectedDate={selectedDate}
          onMonthClick={onMonthClick ? () => onMonthClick(monthIndex) : undefined}
          onHolidayClick={onHolidayClick}
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
  selectedDate?: string;
  onMonthClick?: () => void;
  onHolidayClick?: (holiday: Holiday) => void;
}

function MonthCard({
  year,
  month,
  monthName,
  holidayDateMap,
  selectedDate,
  onMonthClick,
  onHolidayClick,
}: MonthCardProps) {
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
  const holidayCount = days.filter((d) => holidayDateMap.has(format(d, 'yyyy-MM-dd'))).length;

  return (
    <div className="rounded-xl border border-subtle bg-surface p-3.5">
      {/* Month header */}
      <div
        className={cn('flex items-center justify-between mb-2', onMonthClick && 'cursor-pointer')}
        onClick={onMonthClick}
      >
        <h3 className="text-[13px] font-semibold leading-[18px] text-fg">
          {monthName} <span className="font-normal text-fg-muted">{year}</span>
        </h3>
        <span className="font-mono text-[11px] font-medium text-fg-muted tabular-nums">
          {holidayCount || ''}
        </span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_ABBRS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-fg-muted py-0.5">
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
          const isSelected = selectedDate === key;

          const cell = (
            <span
              className={cn(
                'flex size-6 mx-auto items-center justify-center rounded-full text-[11px] leading-none tabular-nums transition-all duration-[120ms]',
                isTodayDay && 'bg-brand text-white font-semibold ring-0',
                !isTodayDay &&
                  holiday &&
                  !holiday.isOptional &&
                  'bg-brand/15 text-brand font-semibold ring-1 ring-brand/30',
                !isTodayDay &&
                  holiday &&
                  holiday.isOptional &&
                  'bg-info/15 text-info font-medium ring-1 ring-info/20 ring-dashed',
                isSelected && !isTodayDay && 'ring-2 ring-brand',
                !holiday && !isTodayDay && isWeekend && 'text-fg-muted',
                !holiday && !isTodayDay && !isWeekend && 'text-fg',
                holiday && onHolidayClick && 'cursor-pointer hover:scale-110',
              )}
              title={holiday?.name}
            >
              {format(day, 'd')}
            </span>
          );

          return (
            <div
              key={key}
              className="flex flex-col items-center"
              onClick={holiday && onHolidayClick ? () => onHolidayClick(holiday) : undefined}
            >
              {cell}
            </div>
          );
        })}
      </div>
    </div>
  );
}
