'use client';

import Link from 'next/link';
import { ArrowRightIcon, TimerIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers';
import { useWeekTimesheet, getWeekStart, TimesheetStatusBadge } from '@/modules/timesheets';

/** Employee dashboard widget — hours logged this week + approval status. */
export function MyTimesheetCard() {
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? undefined;
  const week = getWeekStart(new Date());
  const { data, isLoading, isError } = useWeekTimesheet(week, employeeId);

  return (
    <Link
      href="/timesheets"
      className="group flex flex-col rounded-xl border border-subtle bg-surface p-5 transition-colors hover:border-fg-muted"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-fg">
          <TimerIcon className="size-4 text-fg-muted" aria-hidden />
          This Week
        </div>
        <ArrowRightIcon
          className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>

      {isLoading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : isError ? (
        <p className="mt-4 text-sm text-fg-muted">Couldn’t load your timesheet.</p>
      ) : (
        <>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-fg">
            {data?.totalHours ?? 0}
            <span className="ml-1 text-base font-normal text-fg-muted">h logged</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <TimesheetStatusBadge status={data?.status ?? 'DRAFT'} />
            <span className="text-xs text-fg-muted">{data?.billableHours ?? 0}h billable</span>
          </div>
          {data?.status === 'SUBMITTED' && (
            <p className="mt-2 text-xs text-info">Awaiting approval</p>
          )}
          {data?.status === 'REJECTED' && (
            <p className="mt-2 text-xs text-danger">Returned — needs changes</p>
          )}
        </>
      )}
    </Link>
  );
}
