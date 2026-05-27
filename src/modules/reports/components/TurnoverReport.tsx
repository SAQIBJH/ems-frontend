'use client';

import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { UserMinusIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaChart } from '@/shared/engines/ChartEngine';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { useTurnoverReport, useExportReport } from '../hooks/useWorkforceReports';
import { ReportShell } from './ReportShell';
import type { TurnoverTableItem } from '../types/reports.types';

const COLS: ColumnDef<TurnoverTableItem>[] = [
  {
    accessorKey: 'employeeCode',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-fg-muted">{row.original.employeeCode}</span>
    ),
  },
  {
    accessorKey: 'employeeName',
    header: 'Employee',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-fg">{row.original.employeeName}</div>
        <div className="text-xs text-fg-muted">{row.original.designation}</div>
      </div>
    ),
  },
  {
    accessorKey: 'departmentName',
    header: 'Department',
    cell: ({ row }) => <span className="text-sm text-fg-muted">{row.original.departmentName}</span>,
  },
  {
    accessorKey: 'exitDate',
    header: 'Exit Date',
    cell: ({ row }) => <span className="tabular-nums text-fg-muted">{row.original.exitDate}</span>,
  },
  {
    accessorKey: 'exitType',
    header: 'Type',
    cell: ({ row }) => (
      <span
        className={
          row.original.exitType === 'VOLUNTARY'
            ? 'rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning'
            : 'rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger'
        }
      >
        {row.original.exitType === 'VOLUNTARY' ? 'Voluntary' : 'Involuntary'}
      </span>
    ),
  },
  {
    accessorKey: 'tenure',
    header: 'Tenure',
    cell: ({ row }) => <span className="text-sm text-fg-muted">{row.original.tenure}</span>,
  },
];

export default function TurnoverReport() {
  const defaultEnd = format(new Date(), 'yyyy-MM');
  const defaultStart = format(subMonths(new Date(), 4), 'yyyy-MM');

  const [startMonth, setStartMonth] = useState(defaultStart);
  const [endMonth, setEndMonth] = useState(defaultEnd);
  const [deptId, setDeptId] = useState('');

  const { data: departments = [] } = useDepartments();
  const flatDepts = flattenDepartmentTree(departments);

  const params = {
    startDate: `${startMonth}-01`,
    endDate: `${endMonth}-28`,
    departmentId: deptId || undefined,
  };

  const { data, isLoading, isError, refetch } = useTurnoverReport(params);
  const exportMutation = useExportReport();

  const summary = data?.summary;
  const chartData = (data?.chartData ?? []) as unknown as Record<string, unknown>[];
  const tableItems = data?.tableData?.items ?? [];
  const tablePagination = data?.tableData?.pagination;

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-fg-muted">From</label>
        <input
          type="month"
          value={startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
          className="h-8 rounded-md border border-subtle bg-surface px-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-fg-muted">To</label>
        <input
          type="month"
          value={endMonth}
          onChange={(e) => setEndMonth(e.target.value)}
          className="h-8 rounded-md border border-subtle bg-surface px-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <Select value={deptId} onValueChange={(v) => setDeptId(v ?? '')}>
        <SelectTrigger className="h-8 w-48 text-sm">
          <SelectValue placeholder="All departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All departments</SelectItem>
          {flatDepts.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const summaryCards = summary ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Total Exits', value: summary.totalExits, className: 'text-fg' },
        { label: 'Voluntary', value: summary.voluntaryExits, className: 'text-warning' },
        { label: 'Involuntary', value: summary.involuntaryExits, className: 'text-danger' },
        { label: 'Attrition Rate', value: `${summary.attritionRate}%`, className: 'text-fg' },
      ].map((card) => (
        <div key={card.label} className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">{card.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${card.className}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  ) : null;

  const chart = (
    <div className="space-y-4">
      {summaryCards}
      <AreaChart
        data={chartData}
        series={[
          { dataKey: 'attritionRate', label: 'Attrition Rate (%)', color: 'hsl(0 75% 50%)' },
        ]}
        xAxisKey="monthLabel"
        height={220}
      />
    </div>
  );

  const table = (
    <DynamicTable
      columns={COLS}
      data={tableItems}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      emptyTitle="No exits in this period"
      emptyDescription="No employees exited during the selected date range."
      emptyIllustration={<UserMinusIcon className="size-8 text-fg-muted" />}
      pagination={
        tablePagination
          ? {
              page: tablePagination.page,
              pages: tablePagination.totalPages,
              total: tablePagination.total,
              pageSize: tablePagination.limit,
            }
          : undefined
      }
    />
  );

  return (
    <ReportShell
      title="Turnover"
      description="Employee exits and attrition rate over time."
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : chart}
      table={isLoading || isError ? undefined : table}
      onExport={() =>
        exportMutation.mutate({
          reportType: 'workforce/turnover',
          format: 'CSV',
          filters: params,
        })
      }
      isExporting={exportMutation.isPending}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
