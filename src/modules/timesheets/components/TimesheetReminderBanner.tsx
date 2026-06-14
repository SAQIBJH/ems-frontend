'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangleIcon, BellIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useWeekTimesheet } from '../hooks/useTimesheets';
import { getWeekEnd, getWeekStart, shiftWeek } from '../utils/rollups';

interface TimesheetReminderBannerProps {
  /** Employee whose timesheet to check; omit for the signed-in user (self). */
  employeeId?: string;
}

/**
 * In-app submit reminder (design M7). Nudges the employee when last week is still
 * unsubmitted — REJECTED (must fix & resubmit) or DRAFT with logged hours. Dismissible
 * for the session. Email/push reminders are a backend job (documented separately).
 */
export function TimesheetReminderBanner({ employeeId }: TimesheetReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const lastWeek = shiftWeek(getWeekStart(format(new Date(), 'yyyy-MM-dd')), -1);
  const { data } = useWeekTimesheet(lastWeek, employeeId);

  if (dismissed || !data) return null;

  const rejected = data.status === 'REJECTED';
  const draftWithHours = data.status === 'DRAFT' && data.totalHours > 0;
  if (!rejected && !draftWithHours) return null;

  const label = `${format(parseISO(lastWeek), 'MMM d')} – ${format(parseISO(getWeekEnd(lastWeek)), 'MMM d')}`;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border p-3',
        rejected ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5',
      )}
    >
      {rejected ? (
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
      ) : (
        <BellIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      )}
      <div className="flex-1 text-sm">
        <p className="font-medium text-fg">
          {rejected ? 'Last week was returned for changes' : 'Last week isn’t submitted yet'}
        </p>
        <p className="text-fg-muted">
          {rejected
            ? `Your timesheet for ${label} needs changes — fix it and resubmit. Use the week arrows below to open it.`
            : `You have ${data.totalHours}h logged for ${label} that hasn’t been submitted. Open last week below to submit it.`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-fg-muted hover:text-fg"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss reminder"
      >
        <XIcon className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
