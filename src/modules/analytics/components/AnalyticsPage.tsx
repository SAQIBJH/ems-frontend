'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { parseAsString, useQueryState } from 'nuqs';
import { ExternalLinkIcon } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/data-display/StatsCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AreaChart } from '@/shared/engines/ChartEngine/AreaChart';
import { BarChart } from '@/shared/engines/ChartEngine/BarChart';
import { DonutChart } from '@/shared/engines/ChartEngine/DonutChart';
import type { DonutSlice } from '@/shared/engines/ChartEngine/DonutChart';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/shared/layouts/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import {
  useAnalyticsSummary,
  useAttendanceAnalytics,
  useHeadcountByDepartment,
  useLeaveSummaryAnalytics,
  useRecentActivity,
} from '@/modules/dashboard';
import type { AttendanceRange, RecentActivityItem } from '@/modules/dashboard';
import {
  useWorkforceTrend,
  useAttritionTrend,
  usePayrollCostTrend,
  useDepartmentPerformance,
} from '../hooks/useAnalytics';
import type {
  WorkforceTrendRange,
  DeptPerfRange,
  DepartmentPerformanceRow,
} from '../types/analytics.types';
import { RangeSelector } from './RangeSelector';

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

function actorInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatTime(iso: string): string {
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
    <tr className="border-b border-subtle last:border-0">
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand">
            {initials}
          </span>
          <span className="max-w-[120px] truncate text-sm text-fg">{item.actorName}</span>
        </div>
      </td>
      <td className="py-2.5 pr-3">
        <span className="text-sm text-fg-muted">{item.actionLabel}</span>
      </td>
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
      <td className="whitespace-nowrap py-2.5 text-xs text-fg-muted">
        {formatTime(item.createdAt)}
      </td>
    </tr>
  );
}

const TREND_RANGE_OPTIONS: { label: string; value: WorkforceTrendRange }[] = [
  { label: '6m', value: '6m' },
  { label: '12m', value: '12m' },
  { label: '2y', value: '2y' },
];

const DEPT_PERF_RANGE_OPTIONS: { label: string; value: DeptPerfRange }[] = [
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

function RangeToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
            value === opt.value ? 'bg-brand text-white' : 'text-fg-muted hover:bg-surface-2',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function WorkforceTrendChart() {
  const [range, setRange] = useState<WorkforceTrendRange>('6m');
  const { data, isLoading, isError, refetch } = useWorkforceTrend(range);

  return (
    <SectionCard title="Workforce Trend">
      <div className="mb-4 flex items-center gap-1">
        <RangeToggle value={range} options={TREND_RANGE_OPTIONS} onChange={setRange} />
      </div>
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-md" />
      ) : isError ? (
        <ErrorState compact message="Failed to load workforce trend" onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-fg-muted">
          No trend data for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={256}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(220 13% 91%)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'hsl(220 9% 38%)' }}
              iconType="plainline"
              iconSize={16}
            />
            <Bar
              dataKey="hires"
              name="Hires"
              fill="hsl(152 60% 40%)"
              radius={[3, 3, 0, 0]}
              barSize={14}
            />
            <Bar
              dataKey="exits"
              name="Exits"
              fill="hsl(0 75% 55%)"
              radius={[3, 3, 0, 0]}
              barSize={14}
            />
            <Line
              type="monotone"
              dataKey="headcount"
              name="Headcount"
              stroke="hsl(222 80% 52%)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

function AttritionChart() {
  const [range, setRange] = useState<WorkforceTrendRange>('6m');
  const { data, isLoading, isError, refetch } = useAttritionTrend(range);

  return (
    <SectionCard title="Attrition Rate">
      <div className="mb-1 flex items-center justify-between gap-2">
        <RangeToggle value={range} options={TREND_RANGE_OPTIONS} onChange={setRange} />
        {data && (
          <span className="text-xs text-fg-muted">
            Rolling annual: <span className="font-semibold text-fg">{data.rollingAnnualRate}%</span>
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-52 w-full rounded-md" />
      ) : isError ? (
        <ErrorState compact message="Failed to load attrition data" onRetry={() => refetch()} />
      ) : !data || data.trend.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-fg-muted">
          No attrition data for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={208}>
          <LineChart data={data.trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(220 13% 91%)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v) => [`${v}%`, 'Rate']}
            />
            <Line
              type="monotone"
              dataKey="rate"
              name="Attrition %"
              stroke="hsl(0 75% 50%)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(0 75% 50%)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

function PayrollCostChart() {
  const [range, setRange] = useState<Exclude<WorkforceTrendRange, '2y'>>('6m');
  const { data, isLoading, isError, refetch } = usePayrollCostTrend(range);

  const chartData = (data ?? []) as unknown as Record<string, unknown>[];

  return (
    <SectionCard title="Payroll Cost Trend">
      <div className="mb-4 flex items-center gap-1">
        <RangeToggle
          value={range}
          options={[
            { label: '6m', value: '6m' as const },
            { label: '12m', value: '12m' as const },
          ]}
          onChange={setRange}
        />
      </div>
      {isLoading ? (
        <Skeleton className="h-52 w-full rounded-md" />
      ) : isError ? (
        <ErrorState compact message="Failed to load payroll cost" onRetry={() => refetch()} />
      ) : chartData.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-fg-muted">
          No payroll data for this period.
        </div>
      ) : (
        <AreaChart
          data={chartData}
          xAxisKey="monthLabel"
          height={208}
          series={[
            { dataKey: 'totalNet', label: 'Net Pay', color: 'hsl(222 80% 52%)' },
            { dataKey: 'totalGross', label: 'Gross', color: 'hsl(38 92% 50%)' },
          ]}
        />
      )}
    </SectionCard>
  );
}

const DEPT_PERF_COLS: ColumnDef<DepartmentPerformanceRow>[] = [
  {
    accessorKey: 'departmentName',
    header: 'Department',
    cell: ({ row }) => <span className="font-medium text-fg">{row.original.departmentName}</span>,
  },
  {
    accessorKey: 'headcount',
    header: 'Headcount',
    cell: ({ row }) => <span className="tabular-nums text-fg-muted">{row.original.headcount}</span>,
  },
  {
    accessorKey: 'attendanceRate',
    header: 'Attendance',
    cell: ({ row }) => {
      const rate = row.original.attendanceRate;
      const cls = rate >= 95 ? 'text-success' : rate >= 88 ? 'text-warning' : 'text-danger';
      return <span className={`tabular-nums font-medium ${cls}`}>{rate.toFixed(1)}%</span>;
    },
  },
  {
    accessorKey: 'leaveRate',
    header: 'Leave Rate',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg-muted">{row.original.leaveRate.toFixed(1)}%</span>
    ),
  },
  {
    accessorKey: 'pendingApprovals',
    header: 'Pending',
    cell: ({ row }) => {
      const n = row.original.pendingApprovals;
      return (
        <span className={`tabular-nums font-medium ${n > 0 ? 'text-warning' : 'text-fg-muted'}`}>
          {n}
        </span>
      );
    },
  },
  {
    accessorKey: 'avgTenureMonths',
    header: 'Avg Tenure',
    cell: ({ row }) => {
      const months = row.original.avgTenureMonths;
      const label = months >= 12 ? `${(months / 12).toFixed(1)}y` : `${months.toFixed(0)}m`;
      return <span className="tabular-nums text-fg-muted">{label}</span>;
    },
  },
];

function DeptPerformanceTable() {
  const [range, setRange] = useState<DeptPerfRange>('30d');
  const { data, isLoading, isError, refetch } = useDepartmentPerformance(range);

  return (
    <SectionCard title="Department Performance">
      <div className="mb-4 flex items-center gap-1">
        <RangeToggle value={range} options={DEPT_PERF_RANGE_OPTIONS} onChange={setRange} />
      </div>
      <DynamicTable
        columns={DEPT_PERF_COLS}
        data={data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No department data"
        emptyDescription="No performance data available for the selected period."
      />
    </SectionCard>
  );
}

export function AnalyticsPage() {
  const [range, setRange] = useQueryState('range', parseAsString.withDefault('30d'));
  const [from, setFrom] = useQueryState('from', parseAsString.withDefault(''));
  const [to, setTo] = useQueryState('to', parseAsString.withDefault(''));
  const [departmentId, setDepartmentId] = useQueryState(
    'departmentId',
    parseAsString.withDefault(''),
  );
  const [activityLimit, setActivityLimit] = useState(10);

  const { data: departments = [] } = useDepartments();
  const flatDepts = flattenDepartmentTree(departments);

  const attendanceRange: AttendanceRange =
    range === '7d' || range === '30d' || range === '90d' ? range : '30d';

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useAnalyticsSummary();

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    isError: attendanceError,
    refetch: refetchAttendance,
  } = useAttendanceAnalytics(attendanceRange);

  const {
    data: headcountData,
    isLoading: headcountLoading,
    isError: headcountError,
    refetch: refetchHeadcount,
  } = useHeadcountByDepartment();

  const {
    data: leaveData,
    isLoading: leaveLoading,
    isError: leaveError,
    refetch: refetchLeave,
  } = useLeaveSummaryAnalytics();

  const {
    data: activityData,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useRecentActivity(activityLimit);

  const attendanceChartData =
    attendanceData?.series.map((p) => ({
      ...p,
      date: (() => {
        try {
          return format(parseISO(p.date), 'MMM d');
        } catch {
          return p.date;
        }
      })(),
    })) ?? [];

  const headcountChartData: DonutSlice[] =
    headcountData?.map((d, i) => ({
      name: d.departmentName.length > 14 ? d.departmentName.slice(0, 14) + '…' : d.departmentName,
      value: d.employeeCount,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    })) ?? [];

  const leaveSummaryChartData: Record<string, unknown>[] = leaveData
    ? [
        { status: 'Approved', count: leaveData.approved },
        { status: 'Pending', count: leaveData.pending },
        { status: 'Rejected', count: leaveData.rejected },
        { status: 'Withdrawn', count: leaveData.withdrawn },
      ]
    : [];

  const deltas = summary?.deltas;
  const employeeDeltaText = deltas?.totalEmployees?.deltaLabel;
  const activeTodayText =
    deltas?.activeToday?.deltaPercent !== undefined
      ? `${deltas.activeToday.deltaPercent > 0 ? '+' : ''}${deltas.activeToday.deltaPercent}%`
      : undefined;
  const onLeaveDeltaText =
    deltas?.onLeaveToday?.delta !== undefined
      ? `${deltas.onLeaveToday.delta > 0 ? '+' : ''}${deltas.onLeaveToday.delta} vs last period`
      : undefined;
  const urgentText =
    deltas?.openRequests?.urgent !== undefined ? `${deltas.openRequests.urgent} urgent` : undefined;

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <RangeSelector
        range={range}
        from={from || undefined}
        to={to || undefined}
        onRangeChange={(r) => {
          void setRange(r);
          if (r !== 'custom') {
            void setFrom('');
            void setTo('');
          }
        }}
        onCustomRange={(f, t) => {
          void setRange('custom');
          void setFrom(f);
          void setTo(t);
        }}
      />
      <Select
        value={departmentId || '_all'}
        onValueChange={(v) => void setDepartmentId(v === '_all' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="h-8 w-48 text-sm">
          <SelectValue>
            {(v: string) =>
              v === '_all' ? 'All departments' : (flatDepts.find((d) => d.id === v)?.name ?? v)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All departments</SelectItem>
          {flatDepts.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Analytics"
        description="Organisation-wide metrics and trends."
        actions={filterBar}
      />

      <div className="space-y-6 p-6">
        {/* Row 1 — KPI cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          ) : summaryError ? (
            <div className="col-span-4">
              <ErrorState
                compact
                message="Failed to load summary"
                onRetry={() => refetchSummary()}
              />
            </div>
          ) : (
            <>
              <StatsCard
                label="Total Employees"
                value={summary?.totalEmployees ?? 0}
                subLine={
                  employeeDeltaText ? { text: employeeDeltaText, tone: 'neutral' } : undefined
                }
              />
              <StatsCard
                label="Active Today"
                value={summary?.activeToday ?? 0}
                subLine={activeTodayText ? { text: activeTodayText, tone: 'positive' } : undefined}
              />
              <StatsCard
                label="On Leave Today"
                value={summary?.onLeaveToday ?? 0}
                subLine={onLeaveDeltaText ? { text: onLeaveDeltaText, tone: 'neutral' } : undefined}
              />
              <StatsCard
                label="Open Requests"
                value={summary?.openRequests ?? 0}
                subLine={urgentText ? { text: urgentText, tone: 'warning' } : undefined}
              />
            </>
          )}
        </div>

        {/* Row 2 — Attendance trend (full width) */}
        <SectionCard
          title={`Attendance Trend — Last ${attendanceRange === '7d' ? '7 days' : attendanceRange === '30d' ? '30 days' : '90 days'}`}
        >
          {attendanceLoading ? (
            <Skeleton className="h-60 w-full rounded-md" />
          ) : attendanceError ? (
            <ErrorState
              compact
              message="Failed to load attendance data"
              onRetry={() => refetchAttendance()}
            />
          ) : attendanceChartData.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-sm text-fg-muted">
              No attendance data for this period.
            </div>
          ) : (
            <AreaChart
              data={attendanceChartData}
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

        {/* Row 3 — Headcount donut + Leave summary bar */}
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <SectionCard title="Headcount by Department">
              {headcountLoading ? (
                <Skeleton className="h-56 w-full rounded-md" />
              ) : headcountError ? (
                <ErrorState
                  compact
                  message="Failed to load headcount data"
                  onRetry={() => refetchHeadcount()}
                />
              ) : headcountChartData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-fg-muted">
                  No department data available.
                </div>
              ) : (
                <DonutChart data={headcountChartData} height={220} />
              )}
            </SectionCard>
          </div>

          <div className="xl:col-span-7">
            <SectionCard title="Leave Summary">
              {leaveLoading ? (
                <Skeleton className="h-56 w-full rounded-md" />
              ) : leaveError ? (
                <ErrorState
                  compact
                  message="Failed to load leave data"
                  onRetry={() => refetchLeave()}
                />
              ) : leaveSummaryChartData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-fg-muted">
                  No leave data available.
                </div>
              ) : (
                <BarChart
                  data={leaveSummaryChartData}
                  xAxisKey="status"
                  height={220}
                  series={[{ dataKey: 'count', label: 'Requests', color: 'hsl(222 80% 52%)' }]}
                />
              )}
            </SectionCard>
          </div>
        </div>

        {/* Row 4 — Recent Activity */}
        <SectionCard title="Recent Activity">
          {activityLoading ? (
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
          ) : activityError ? (
            <ErrorState
              compact
              message="Failed to load recent activity"
              onRetry={() => refetchActivity()}
            />
          ) : !activityData || activityData.length === 0 ? (
            <div className="py-6 text-center text-sm text-fg-muted">No recent activity.</div>
          ) : (
            <>
              <div className="-mx-1 overflow-x-auto">
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
                    {activityData.map((item) => (
                      <ActivityRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setActivityLimit((prev) => prev + 10)}
                  className="text-xs font-medium text-brand hover:underline cursor-pointer"
                >
                  Load more
                </button>
              </div>
            </>
          )}
        </SectionCard>

        {/* Row 5 — Workforce Trend (full width) */}
        <WorkforceTrendChart />

        {/* Row 6 — Attrition (6-col) + Payroll Cost (6-col) */}
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <AttritionChart />
          </div>
          <div className="xl:col-span-6">
            <PayrollCostChart />
          </div>
        </div>

        {/* Row 7 — Department Performance (full width) */}
        <DeptPerformanceTable />
      </div>
    </div>
  );
}
