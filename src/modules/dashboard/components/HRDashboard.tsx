'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  UsersIcon,
  CalendarCheckIcon,
  CalendarXIcon,
  ClipboardListIcon,
  PlusIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { StatsCard } from '@/components/data-display/StatsCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart } from '@/shared/engines/ChartEngine/AreaChart';
import { DonutChart } from '@/shared/engines/ChartEngine/DonutChart';
import type { DonutSlice } from '@/shared/engines/ChartEngine/DonutChart';
import { PermissionWrapper } from '@/shared/guards/PermissionWrapper';
import { useAuth } from '@/providers';
import { cn } from '@/lib/utils';
import {
  useAnalyticsSummary,
  useAttendanceAnalytics,
  useHeadcountByDepartment,
  useRecentActivity,
} from '../hooks/useDashboard';
import type { AttendanceRange, RecentActivityItem } from '../types/dashboard.types';

const RANGE_OPTIONS: { label: string; value: AttendanceRange }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

const DEPT_COLORS = [
  'hsl(222 80% 52%)',
  'hsl(152 60% 40%)',
  'hsl(38 92% 50%)',
  'hsl(280 60% 55%)',
  'hsl(0 75% 55%)',
  'hsl(190 80% 42%)',
  'hsl(340 70% 50%)',
  'hsl(60 80% 42%)',
];

function SectionCard({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function AttendanceTrendChart() {
  const [range, setRange] = useState<AttendanceRange>('30d');
  const { data, isLoading, isError, refetch } = useAttendanceAnalytics(range);

  const chartData =
    data?.series.map((p) => ({
      ...p,
      date: (() => {
        try {
          return format(parseISO(p.date), 'MMM d');
        } catch {
          return p.date;
        }
      })(),
    })) ?? [];

  const rangeActions = (
    <>
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setRange(opt.value)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
            range === opt.value ? 'bg-brand text-white' : 'text-fg-muted hover:bg-surface-2',
          )}
        >
          {opt.label}
        </button>
      ))}
    </>
  );

  return (
    <SectionCard title="Attendance — Last 30 Days" actions={rangeActions}>
      {isLoading ? (
        <Skeleton className="h-60 w-full rounded-md" />
      ) : isError ? (
        <ErrorState compact message="Failed to load attendance data" onRetry={() => refetch()} />
      ) : chartData.length === 0 ? (
        <div className="flex h-60 items-center justify-center text-sm text-fg-muted">
          No attendance data for this period.
        </div>
      ) : (
        <AreaChart
          data={chartData}
          xAxisKey="date"
          height={240}
          series={[
            { dataKey: 'present', label: 'Present', color: 'hsl(152 60% 40%)' },
            { dataKey: 'absent', label: 'Absent', color: 'hsl(0 75% 50%)' },
            { dataKey: 'wfh', label: 'WFH', color: 'hsl(222 80% 52%)' },
            { dataKey: 'leave', label: 'Leave', color: 'hsl(38 92% 50%)' },
          ]}
        />
      )}
    </SectionCard>
  );
}

function HeadcountChart() {
  const { data, isLoading, isError, refetch } = useHeadcountByDepartment();

  const chartData: DonutSlice[] =
    data?.map((d, i) => ({
      name: d.departmentName.length > 14 ? d.departmentName.slice(0, 14) + '…' : d.departmentName,
      value: d.employeeCount,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    })) ?? [];

  return (
    <SectionCard title="Headcount by Department">
      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-md" />
      ) : isError ? (
        <ErrorState compact message="Failed to load headcount data" onRetry={() => refetch()} />
      ) : chartData.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-fg-muted">
          No department data available.
        </div>
      ) : (
        <DonutChart data={chartData} height={220} />
      )}
    </SectionCard>
  );
}

function actorInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatRelativeTime(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, h:mm a');
  } catch {
    return iso;
  }
}

function ActivityRow({ item }: { item: RecentActivityItem }) {
  const initials = actorInitials(item.actorName);
  const resource = item.entity_label ?? item.entityType;
  const resourceUrl = item.entity_url;

  return (
    <tr className="border-b border-subtle last:border-0 hover:bg-surface-2 transition-colors duration-[120ms]">
      {/* Who */}
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand">
            {initials}
          </span>
          <span className="text-sm text-fg truncate max-w-[120px]">{item.actorName}</span>
        </div>
      </td>
      {/* Action */}
      <td className="py-2.5 pr-3">
        <span className="text-sm text-fg-muted">{item.actionLabel}</span>
      </td>
      {/* Resource */}
      <td className="py-2.5 pr-3">
        {resourceUrl ? (
          <Link
            href={resourceUrl}
            className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
          >
            {resource}
            <ExternalLinkIcon className="size-3" aria-hidden />
          </Link>
        ) : (
          <span className="text-sm text-fg-muted">{resource}</span>
        )}
      </td>
      {/* When */}
      <td className="py-2.5 whitespace-nowrap text-xs text-fg-subtle">
        {formatRelativeTime(item.createdAt)}
      </td>
    </tr>
  );
}

function RecentActivityTable() {
  const { data, isLoading, isError, refetch } = useRecentActivity(8);

  return (
    <SectionCard title="Recent Activity">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-7 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact message="Failed to load recent activity" onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <div className="py-6 text-center text-sm text-fg-muted">No recent activity.</div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-subtle">
                <th className="pb-2 pr-3 text-xs font-medium text-fg-muted">Who</th>
                <th className="pb-2 pr-3 text-xs font-medium text-fg-muted">Action</th>
                <th className="pb-2 pr-3 text-xs font-medium text-fg-muted">Resource</th>
                <th className="pb-2 text-xs font-medium text-fg-muted">When</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

export function HRDashboard() {
  const { user } = useAuth();
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useAnalyticsSummary();

  const firstName = user?.employee?.firstName ?? user?.email?.split('@')[0] ?? 'there';
  const deltas = summary?.deltas;

  const employeeDeltaText = deltas?.totalEmployees
    ? `${deltas.totalEmployees.delta !== undefined ? `+${deltas.totalEmployees.delta}` : ''} ${deltas.totalEmployees.deltaLabel ?? ''}`.trim()
    : undefined;

  const activeTodayText =
    deltas?.activeToday?.deltaPercent !== undefined
      ? `${deltas.activeToday.deltaPercent > 0 ? '+' : ''}${deltas.activeToday.deltaPercent}%`
      : undefined;

  const onLeaveDeltaText =
    deltas?.onLeaveToday?.delta !== undefined
      ? `${deltas.onLeaveToday.delta > 0 ? '+' : ''}${deltas.onLeaveToday.delta} vs last period`
      : undefined;

  const urgentCount = deltas?.openRequests?.urgent;
  const urgentText = urgentCount !== undefined ? `${urgentCount} urgent` : undefined;

  return (
    <div className="space-y-6 p-6">
      {/* Greeting header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Welcome back, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-fg-muted">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <PermissionWrapper permission="employees:write">
          <Link
            href="/employees/new"
            className={cn(buttonVariants({ size: 'default' }), 'gap-1.5 shrink-0')}
          >
            <PlusIcon className="size-4 shrink-0" aria-hidden />
            Add Employee
          </Link>
        </PermissionWrapper>
      </div>

      {/* Stats row */}
      {summaryError ? (
        <ErrorState compact message="Failed to load summary" onRetry={() => refetchSummary()} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            label="Total Employees"
            value={summary?.totalEmployees ?? 0}
            icon={<UsersIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            href="/employees"
            accent="var(--brand-500)"
            subLine={employeeDeltaText ? { text: employeeDeltaText, tone: 'positive' } : undefined}
          />
          <StatsCard
            label="Active Today"
            value={summary?.activeToday ?? 0}
            icon={<CalendarCheckIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            accent="var(--success-500)"
            subLine={activeTodayText ? { text: activeTodayText, tone: 'positive' } : undefined}
          />
          <StatsCard
            label="On Leave Today"
            value={summary?.onLeaveToday ?? 0}
            icon={<CalendarXIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            accent="var(--warning-500)"
            subLine={onLeaveDeltaText ? { text: onLeaveDeltaText, tone: 'neutral' } : undefined}
          />
          <StatsCard
            label="Open Requests"
            value={summary?.openRequests ?? 0}
            icon={<ClipboardListIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            href="/leave"
            accent="var(--dept-product)"
            subLine={urgentText ? { text: urgentText, tone: 'warning' } : undefined}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AttendanceTrendChart />
        </div>
        <HeadcountChart />
      </div>

      {/* Recent Activity */}
      <RecentActivityTable />
    </div>
  );
}
