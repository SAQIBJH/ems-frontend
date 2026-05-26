'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  UsersIcon,
  ClipboardListIcon,
  CalendarCheckIcon,
  BarChart2Icon,
  CheckCheckIcon,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { StatsCard } from '@/components/data-display/StatsCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';
import { useManagerDashboard } from '../hooks/useDashboard';
import { PendingApprovalsPanel } from './PendingApprovalsPanel';
import { TeamWeeklyAttendanceGrid } from './TeamWeeklyAttendanceGrid';

export function ManagerDashboard() {
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useManagerDashboard();

  const breakdown = summary?.approvalBreakdown;
  const breakdownText = breakdown
    ? `${breakdown.leave} leave, ${breakdown.regularization} reg.`
    : undefined;

  const avgText =
    summary?.avgAttendancePercent !== undefined
      ? `${summary.avgAttendancePercent}% this month`
      : undefined;

  const presentDelta =
    summary?.presentToday !== undefined && summary?.teamSize
      ? `${summary.presentToday} of ${summary.teamSize} in`
      : undefined;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">My Team</h1>
          <p className="mt-0.5 text-sm text-fg-muted">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/leave?view=bulk"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <CheckCheckIcon className="size-3.5" aria-hidden />
            Bulk approve
          </Link>
          <Link
            href="/employees?manager=me"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
          >
            <UsersIcon className="size-3.5" aria-hidden />
            View team
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {summaryError ? (
        <ErrorState compact message="Failed to load dashboard" onRetry={() => refetchSummary()} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            label="Team Size"
            value={summary?.teamSize ?? 0}
            icon={<UsersIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
          />
          <StatsCard
            label="Present Today"
            value={summary?.presentToday ?? 0}
            icon={<CalendarCheckIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            subLine={presentDelta ? { text: presentDelta, tone: 'positive' } : undefined}
          />
          <StatsCard
            label="Pending Approvals"
            value={summary?.pendingApprovals ?? 0}
            icon={<ClipboardListIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            href="/leave"
            subLine={breakdownText ? { text: breakdownText, tone: 'warning' } : undefined}
          />
          <StatsCard
            label="Avg. Attendance"
            value={
              summary?.avgAttendancePercent !== undefined ? `${summary.avgAttendancePercent}%` : '—'
            }
            icon={<BarChart2Icon className="size-4" aria-hidden />}
            loading={summaryLoading}
            subLine={avgText ? { text: avgText, tone: 'neutral' } : undefined}
          />
        </div>
      )}

      {/* Two-column: Pending Approvals + Weekly Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PendingApprovalsPanel />
        <TeamWeeklyAttendanceGrid />
      </div>
    </div>
  );
}
