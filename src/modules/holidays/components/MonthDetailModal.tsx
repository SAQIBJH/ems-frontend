'use client';

import { parseISO, format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';
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

interface MonthDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  /** 0-based month index (0 = January). null means nothing selected. */
  month: number | null;
  holidays: Holiday[];
}

export function MonthDetailModal({
  open,
  onOpenChange,
  year,
  month,
  holidays,
}: MonthDetailModalProps) {
  if (month === null) return null;

  const monthHolidays = holidays
    .filter((h) => {
      const d = parseISO(h.holidayDate);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {MONTH_NAMES[month]} {year}
          </DialogTitle>
        </DialogHeader>

        {monthHolidays.length === 0 ? (
          <EmptyState
            title="No holidays"
            description={`No holidays defined for ${MONTH_NAMES[month]} ${year}.`}
          />
        ) : (
          <ul className="divide-y divide-subtle">
            {monthHolidays.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 text-xs tabular-nums text-fg-subtle w-12">
                    {format(parseISO(h.holidayDate), 'dd MMM')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{h.name}</p>
                    {h.location && <p className="text-xs text-fg-subtle">{h.location}</p>}
                  </div>
                </div>
                {h.isOptional ? (
                  <Badge
                    variant="outline"
                    className="shrink-0 text-info border-info/30 bg-info/10 text-xs"
                  >
                    Optional
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="shrink-0 text-success border-success/30 bg-success/10 text-xs"
                  >
                    Public
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
