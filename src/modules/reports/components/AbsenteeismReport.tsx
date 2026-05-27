'use client';

import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircleIcon } from 'lucide-react';

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
import { useAbsenteeismReport } from '../hooks/useAttendanceReports';
import { useExportReport } from '../hooks/useWorkforceReports';
import { ReportShell } from './ReportShell';
import type { AbsenteeismTableItem } from '../types/reports.types';

const COLS: ColumnDef<AbsenteeismTableItem>[] = [
  {
    accessorKey: 'employeeName',
    header: 'Employee',
    cell: ({ row }) => <span className="font-medium text-fg">{row.original.employeeName}</span>,
  },
  {
    accessorKey: 'absentDays',
    header: 'Absent Days',
    cell: ({ row }) => <span className="tabular-nums text-danger">{row.original.absentDays}</span>,
  },
  {
    accessorKey: 'unauthorizedAbsences',
    header: 'Unauthorized',
    cell: ({ row }) => (
      <span
        className={`tabular-nums font-medium ${row.original.unauthorizedAbsences > 0 ? 'text-danger' : 'text-fg-muted'}`}
      >
        {row.original.unauthorizedAbsences}
      </span>
    ),
  },
  {
    accessorKey: 'leaveDays',
    header: 'Leave Days',
    cell: ({ row }) => <span className="tabular-nums text-fg-muted">{row.original.leaveDays}</span>,
  },
  {
    accessorKey: 'absenteeismRate',
    header: 'Rate',
    cell: ({ row }) => {
      const rate = row.original.absenteeismRate;
      return (
        <span
          className={`tabular-nums font-medium ${rate >= 15 ? 'text-danger' : rate >= 10 ? 'text-warning' : 'text-fg-muted'}`}
        >
          {rate.toFixed(1)}%
        </span>
      );
    },
  },
];

export default function AbsenteeismReport() {
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

  const { data, isLoading, isError, refetch } = useAbsenteeismReport(params);
  const exportMutation = useExportReport();

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

  const chart = (
    <AreaChart
      data={chartData}
      series={[
        { dataKey: 'absenteeismRate', label: 'Absenteeism Rate (%)', color: 'hsl(0 75% 50%)' },
      ]}
      xAxisKey="monthLabel"
      height={220}
    />
  );

  const table = (
    <DynamicTable
      columns={COLS}
      data={tableItems}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      emptyTitle="No absenteeism data"
      emptyDescription="No unauthorized absences recorded for this period."
      emptyIllustration={<AlertCircleIcon className="size-8 text-fg-muted" />}
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
      title="Absenteeism Trend"
      description="Track unauthorized absences and absenteeism rate over time."
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : chart}
      table={isLoading || isError ? undefined : table}
      onExport={() =>
        exportMutation.mutate({
          reportType: 'attendance/absenteeism',
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
