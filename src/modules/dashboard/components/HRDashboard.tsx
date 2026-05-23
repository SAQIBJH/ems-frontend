'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  UsersIcon,
  CalendarCheckIcon,
  CalendarXIcon,
  ClipboardListIcon,
  ActivityIcon,
} from 'lucide-react';
import { StatsCard } from '@/components/data-display/StatsCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart } from '@/shared/engines/ChartEngine/BarChart';
import { HorizontalBarChart } from '@/shared/engines/ChartEngine/HorizontalBarChart';
import {
  useAnalyticsSummary,
  useAttendanceAnalytics,
  useHeadcountByDepartment,
  useLeaveSummaryAnalytics,
  useRecentActivity,
} from '../hooks/useDashboard';
import type { AttendanceRange } from '../types/dashboard.types';

const RANGE_OPTIONS: { label: string; value: AttendanceRange }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">{title}</h2>
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

  return (
    <SectionCard title="Attendance Trend">
      <div className="mb-4 flex items-center gap-1">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              range === opt.value ? 'bg-brand text-white' : 'text-fg-muted hover:bg-surface-2'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <Skeleton className="h-60 w-full rounded-md" />
      ) : isError ? (
        <ErrorState message="Failed to load attendance data" onRetry={() => refetch()} />
      ) : chartData.length === 0 ? (
        <div className="flex h-60 items-center justify-center text-sm text-fg-muted">
          No attendance data for this period.
        </div>
      ) : (
        <BarChart
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

  const chartData =
    data?.map((d) => ({
      name: d.departmentName.length > 12 ? d.departmentName.slice(0, 12) + '…' : d.departmentName,
      value: d.employeeCount,
    })) ?? [];

  return (
    <SectionCard title="Headcount by Department">
      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-md" />
      ) : isError ? (
        <ErrorState message="Failed to load headcount data" onRetry={() => refetch()} />
      ) : chartData.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-fg-muted">
          No department data available.
        </div>
      ) : (
        <HorizontalBarChart data={chartData} height={Math.max(chartData.length * 36, 160)} />
      )}
    </SectionCard>
  );
}

function LeaveSummaryPanel() {
  const { data, isLoading, isError, refetch } = useLeaveSummaryAnalytics();

  return (
    <SectionCard title="Leave Summary (30d)">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load leave summary" onRetry={() => refetch()} />
      ) : data ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Pending', value: data.pending, color: 'text-warning' },
            { label: 'Approved', value: data.approved, color: 'text-success' },
            { label: 'Rejected', value: data.rejected, color: 'text-danger' },
            { label: 'Withdrawn', value: data.withdrawn, color: 'text-fg-muted' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-md border border-subtle bg-surface-2 p-3">
              <p className="text-xs text-fg-muted">{label}</p>
              <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}

function RecentActivityFeed() {
  const { data, isLoading, isError, refetch } = useRecentActivity(8);

  const formatAction = (action: string, entityType: string | undefined) => {
    const a = (action ?? '').toLowerCase();
    const e = (entityType ?? '').replace(/_/g, ' ').toLowerCase();
    return `${a} ${e}`.trim();
  };

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
        <ErrorState message="Failed to load recent activity" onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <div className="py-6 text-center text-sm text-fg-muted">No recent activity.</div>
      ) : (
        <ul className="space-y-3">
          {data.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50">
                <ActivityIcon className="size-3.5 text-brand" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">
                  <span className="font-medium">{item.user_email}</span>{' '}
                  {formatAction(item.action, item.entity_type)}
                </p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {(() => {
                    try {
                      return format(parseISO(item.created_at), 'MMM d, h:mm a');
                    } catch {
                      return item.created_at;
                    }
                  })()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function HRDashboard() {
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useAnalyticsSummary();

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Stats row */}
      {summaryError ? (
        <ErrorState message="Failed to load summary" onRetry={() => refetchSummary()} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            label="Total Employees"
            value={summary?.totalEmployees ?? 0}
            icon={<UsersIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            href="/employees"
          />
          <StatsCard
            label="Active Today"
            value={summary?.activeToday ?? 0}
            icon={<CalendarCheckIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
          />
          <StatsCard
            label="On Leave Today"
            value={summary?.onLeaveToday ?? 0}
            icon={<CalendarXIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
          />
          <StatsCard
            label="Open Requests"
            value={summary?.openRequests ?? 0}
            icon={<ClipboardListIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            href="/leave"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AttendanceTrendChart />
        </div>
        <LeaveSummaryPanel />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <HeadcountChart />
        <RecentActivityFeed />
      </div>
    </div>
  );
}
