'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { LockIcon, UsersIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, DonutChart } from '@/shared/engines/ChartEngine';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import {
  useTimesheetSummary,
  useTimesheetPermissions,
  type TimesheetSummaryByEmployee,
  type TimesheetSummaryRange,
} from '@/modules/timesheets';

import { useExportReport } from '../hooks/useWorkforceReports';
import { ReportShell } from './ReportShell';

const RANGE_LABEL: Record<TimesheetSummaryRange, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

const COLS: ColumnDef<TimesheetSummaryByEmployee>[] = [
  {
    accessorKey: 'employeeName',
    header: 'Employee',
    cell: ({ row }) => <span className="font-medium text-fg">{row.original.employeeName}</span>,
  },
  {
    accessorKey: 'hours',
    header: 'Hours',
    cell: ({ row }) => <span className="tabular-nums text-fg">{row.original.hours}h</span>,
  },
  {
    accessorKey: 'utilizationPct',
    header: 'Billable %',
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-success">{row.original.utilizationPct}%</span>
    ),
  },
];

export default function TimesheetUtilizationReport() {
  const perms = useTimesheetPermissions();
  const [range, setRange] = useState<TimesheetSummaryRange>('30d');

  const { data, isLoading, isError, refetch } = useTimesheetSummary(range);
  const exportMutation = useExportReport();

  // Reporting is for approvers / admins only (§27).
  if (!perms.canApprove && !perms.canAdmin) {
    return (
      <div className="rounded-xl border border-subtle bg-surface">
        <EmptyState
          title="No access"
          description="Timesheet utilization is available to managers and HR only."
          illustration={<LockIcon className="size-8 text-fg-muted" />}
        />
      </div>
    );
  }

  const byProject = (data?.byProject ?? []).map((p) => ({
    projectName: p.projectName,
    hours: p.hours,
    billableHours: p.billableHours,
  }));
  const byEmployee = data?.byEmployee ?? [];

  const filterBar = (
    <Select value={range} onValueChange={(v) => setRange((v as TimesheetSummaryRange) ?? '30d')}>
      <SelectTrigger className="h-8 w-40 text-sm">
        <SelectValue>{(v) => RANGE_LABEL[v as TimesheetSummaryRange] ?? v}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="30d">{RANGE_LABEL['30d']}</SelectItem>
        <SelectItem value="90d">{RANGE_LABEL['90d']}</SelectItem>
      </SelectContent>
    </Select>
  );

  const summaryCards = data ? (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Total hours', value: `${data.totalHours}h`, cls: 'text-fg' },
        { label: 'Billable', value: `${data.billableHours}h`, cls: 'text-success' },
        { label: 'Overtime', value: `${data.overtimeHours}h`, cls: 'text-warning' },
        { label: 'Utilization', value: `${data.utilizationPct}%`, cls: 'text-fg' },
      ].map((c) => (
        <div key={c.label} className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${c.cls}`}>{c.value}</p>
        </div>
      ))}
    </div>
  ) : null;

  const chart = data ? (
    <div className="space-y-4">
      {summaryCards}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-fg">Billable vs non-billable</p>
          <DonutChart
            data={[
              { name: 'Billable', value: data.billableHours, color: 'hsl(152 60% 40%)' },
              { name: 'Non-billable', value: data.nonBillableHours, color: 'hsl(220 9% 55%)' },
            ]}
            height={220}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-fg">Hours by project</p>
          <BarChart
            data={byProject as unknown as Record<string, unknown>[]}
            series={[
              { dataKey: 'hours', label: 'Hours', color: 'hsl(222 80% 52%)' },
              { dataKey: 'billableHours', label: 'Billable', color: 'hsl(152 60% 40%)' },
            ]}
            xAxisKey="projectName"
            height={220}
          />
        </div>
      </div>
    </div>
  ) : undefined;

  const table = (
    <DynamicTable
      columns={COLS}
      data={byEmployee}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      emptyTitle="No logged hours"
      emptyDescription="No time has been logged in the selected period."
      emptyIllustration={<UsersIcon className="size-8 text-fg-muted" />}
    />
  );

  return (
    <ReportShell
      title="Timesheet Utilization"
      description="Logged hours, billable split and overtime across projects and employees."
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : chart}
      table={isLoading || isError ? undefined : table}
      onExport={() =>
        exportMutation.mutate({
          reportType: 'timesheets/utilization',
          format: 'CSV',
          filters: { range },
        })
      }
      isExporting={exportMutation.isPending}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
