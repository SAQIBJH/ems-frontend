'use client';

import { useState } from 'react';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';

import { useTeamLeaveRequests } from '../hooks/useLeave';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { useAuth } from '@/providers';

export function LeaveTeamCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const canViewTeam =
    user?.memberType === 'MANAGER' ||
    user?.memberType === 'HR_ADMIN' ||
    user?.memberType === 'SUPER_ADMIN';

  const monthStart = format(currentDate, 'yyyy-MM-01');
  const monthEnd = format(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    'yyyy-MM-dd',
  );

  const { data, isLoading, isError, refetch } = useTeamLeaveRequests(
    { fromDate: monthStart, toDate: monthEnd, limit: 50 },
    canViewTeam,
  );

  if (!canViewTeam) {
    return (
      <EmptyState
        title="Access restricted"
        description="Team calendar is available to managers and HR admins."
      />
    );
  }

  const requests = data?.requests ?? [];

  // Group requests by start date for timeline display
  const grouped = requests.reduce<Record<string, typeof requests>>((acc, req) => {
    const key = req.startDate.slice(0, 10);
    (acc[key] ??= []).push(req);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
        </Button>
        <span className="min-w-[120px] text-center text-sm font-medium text-fg">
          {format(currentDate, 'MMMM yyyy')}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          aria-label="Next month"
        >
          <ChevronRightIcon className="size-4" aria-hidden />
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-16 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <ErrorState message="Failed to load team leave calendar." onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && sortedDates.length === 0 && (
        <EmptyState
          title="No team leave this month"
          description="No leave requests from your team for this period."
        />
      )}

      {!isLoading && !isError && sortedDates.length > 0 && (
        <div className="space-y-1">
          {sortedDates.map((dateKey) => {
            const dayRequests = grouped[dateKey];
            const date = parseISO(dateKey);
            return (
              <div
                key={dateKey}
                className="grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-subtle bg-surface p-3"
              >
                <div className="text-center">
                  <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                    {format(date, 'EEE')}
                  </p>
                  <p className="text-xl font-semibold text-fg tabular-nums leading-none mt-0.5">
                    {format(date, 'd')}
                  </p>
                  <p className="text-[11px] text-fg-subtle">{format(date, 'MMM')}</p>
                </div>
                <div className="space-y-2">
                  {dayRequests.map((req) => (
                    <div key={req.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {req.employee ? (
                          <p className="text-sm font-medium text-fg truncate">
                            {req.employee.firstName} {req.employee.lastName}
                          </p>
                        ) : null}
                        <p className="text-xs text-fg-muted">
                          {req.leaveTypeName}
                          {req.totalDays > 1 && (
                            <>
                              {' '}
                              · {format(parseISO(req.startDate), 'MMM d')} –{' '}
                              {format(parseISO(req.endDate), 'MMM d')} ({req.totalDays}d)
                            </>
                          )}
                        </p>
                      </div>
                      <LeaveStatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
