'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CalendarIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart } from '@/shared/engines/ChartEngine';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { useLeaveTypes } from '@/modules/leave';
import { useLeaveUtilizationReport } from '../hooks/useLeaveReports';
import { useExportReport } from '../hooks/useWorkforceReports';
import { ReportShell } from './ReportShell';
import type { LeaveUtilizationTableItem } from '../types/reports.types';

const COLS: ColumnDef<LeaveUtilizationTableItem>[] = [
  {
    accessorKey: 'employeeName',
    header: 'Employee',
    cell: ({ row }) => <span className="font-medium text-fg">{row.original.employeeName}</span>,
  },
  {
    accessorKey: 'annualAllocated',
    header: 'Annual Alloc.',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg-muted">{row.original.annualAllocated}</span>
    ),
  },
  {
    accessorKey: 'annualTaken',
    header: 'Annual Taken',
    cell: ({ row }) => <span className="tabular-nums text-fg">{row.original.annualTaken}</span>,
  },
  {
    accessorKey: 'annualBalance',
    header: 'Annual Bal.',
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-success">{row.original.annualBalance}</span>
    ),
  },
  {
    accessorKey: 'sickAllocated',
    header: 'Sick Alloc.',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg-muted">{row.original.sickAllocated}</span>
    ),
  },
  {
    accessorKey: 'sickTaken',
    header: 'Sick Taken',
    cell: ({ row }) => <span className="tabular-nums text-fg">{row.original.sickTaken}</span>,
  },
  {
    accessorKey: 'sickBalance',
    header: 'Sick Bal.',
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-success">{row.original.sickBalance}</span>
    ),
  },
];

export default function LeaveUtilizationReport() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [deptId, setDeptId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');

  const { data: departments = [] } = useDepartments();
  const flatDepts = flattenDepartmentTree(departments);
  const { data: leaveTypes = [] } = useLeaveTypes();

  const params = {
    year: Number(year),
    departmentId: deptId || undefined,
    leaveTypeId: leaveTypeId || undefined,
  };

  const { data, isLoading, isError, refetch } = useLeaveUtilizationReport(params);
  const exportMutation = useExportReport();

  const summary = data?.summary;
  const chartData = (data?.chartData ?? []) as unknown as Record<string, unknown>[];
  const tableItems = data?.tableData?.items ?? [];
  const tablePagination = data?.tableData?.pagination;

  const yearOptions = Array.from({ length: 4 }, (_, i) => String(currentYear - i));

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={year} onValueChange={(v) => setYear(v ?? String(currentYear))}>
        <SelectTrigger className="h-8 w-28 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
      <Select value={leaveTypeId} onValueChange={(v) => setLeaveTypeId(v ?? '')}>
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue placeholder="All leave types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All leave types</SelectItem>
          {leaveTypes.map((lt) => (
            <SelectItem key={lt.id} value={lt.id}>
              {lt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const summaryCards = summary ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
      {[
        { label: 'Total Allocated', value: summary.totalAllocated, cls: 'text-fg' },
        { label: 'Total Taken', value: summary.totalTaken, cls: 'text-warning' },
        { label: 'Total Pending', value: summary.totalPending, cls: 'text-fg-muted' },
        {
          label: 'Utilization Rate',
          value: `${summary.utilizationRate.toFixed(1)}%`,
          cls: 'text-fg',
        },
      ].map((c) => (
        <div key={c.label} className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${c.cls}`}>{c.value}</p>
        </div>
      ))}
    </div>
  ) : null;

  const chart = (
    <div className="space-y-4">
      {summaryCards}
      <BarChart
        data={chartData}
        series={[
          { dataKey: 'allocated', label: 'Allocated', color: 'hsl(222 80% 52%)' },
          { dataKey: 'taken', label: 'Taken', color: 'hsl(152 60% 40%)' },
          { dataKey: 'pending', label: 'Pending', color: 'hsl(38 92% 50%)' },
        ]}
        xAxisKey="leaveTypeName"
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
      emptyTitle="No leave data"
      emptyDescription="No leave records found for the selected filters."
      emptyIllustration={<CalendarIcon className="size-8 text-fg-muted" />}
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
      title="Leave Utilization"
      description="How much of allocated leave is being used across the organization."
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : chart}
      table={isLoading || isError ? undefined : table}
      onExport={() =>
        exportMutation.mutate({
          reportType: 'leave/utilization',
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
