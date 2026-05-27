'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { CalendarDaysIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { useAttendanceSummaryReport } from '../hooks/useAttendanceReports';
import { useExportReport } from '../hooks/useWorkforceReports';
import { ReportShell } from './ReportShell';
import type { AttendanceSummaryItem } from '../types/reports.types';

function attendanceColor(pct: number): string {
  if (pct >= 90) return 'text-success';
  if (pct >= 75) return 'text-warning';
  return 'text-danger';
}

const COLS: ColumnDef<AttendanceSummaryItem>[] = [
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
        <div className="text-xs text-fg-muted">{row.original.departmentName}</div>
      </div>
    ),
  },
  {
    accessorKey: 'presentDays',
    header: 'Present',
    cell: ({ row }) => (
      <span className="tabular-nums text-success">{row.original.presentDays}</span>
    ),
  },
  {
    accessorKey: 'absentDays',
    header: 'Absent',
    cell: ({ row }) => (
      <span
        className={`tabular-nums ${row.original.absentDays > 0 ? 'text-danger' : 'text-fg-muted'}`}
      >
        {row.original.absentDays}
      </span>
    ),
  },
  {
    accessorKey: 'leaveDays',
    header: 'Leave',
    cell: ({ row }) => <span className="tabular-nums text-fg-muted">{row.original.leaveDays}</span>,
  },
  {
    accessorKey: 'wfhDays',
    header: 'WFH',
    cell: ({ row }) => <span className="tabular-nums text-fg-muted">{row.original.wfhDays}</span>,
  },
  {
    accessorKey: 'lateDays',
    header: 'Late',
    cell: ({ row }) => (
      <span
        className={`tabular-nums ${row.original.lateDays > 0 ? 'text-warning' : 'text-fg-muted'}`}
      >
        {row.original.lateDays}
      </span>
    ),
  },
  {
    accessorKey: 'attendancePercent',
    header: 'Attendance %',
    cell: ({ row }) => {
      const pct = row.original.attendancePercent;
      return (
        <span className={`tabular-nums font-medium ${attendanceColor(pct)}`}>
          {pct.toFixed(1)}%
        </span>
      );
    },
  },
];

export default function AttendanceSummaryReport() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [deptId, setDeptId] = useState('');

  const { data: departments = [] } = useDepartments();
  const flatDepts = flattenDepartmentTree(departments);

  const params = { month, departmentId: deptId || undefined };
  const { data, isLoading, isError, refetch } = useAttendanceSummaryReport(params);
  const exportMutation = useExportReport();

  const summary = data?.summary;
  const tableItems = data?.tableData?.items ?? [];
  const tablePagination = data?.tableData?.pagination;

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-fg-muted">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-4">
      {[
        { label: 'Working Days', value: summary.totalWorkingDays, cls: 'text-fg' },
        {
          label: 'Avg Attendance',
          value: `${summary.avgAttendancePercent.toFixed(1)}%`,
          cls: 'text-fg',
        },
        { label: 'Total Present', value: summary.totalPresent, cls: 'text-success' },
        { label: 'Total Absent', value: summary.totalAbsent, cls: 'text-danger' },
        { label: 'Total Leave', value: summary.totalLeave, cls: 'text-warning' },
      ].map((c) => (
        <div key={c.label} className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${c.cls}`}>{c.value}</p>
        </div>
      ))}
    </div>
  ) : null;

  const table = (
    <>
      {summaryCards}
      <DynamicTable
        columns={COLS}
        data={tableItems}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No attendance data"
        emptyDescription="No records found for the selected month and department."
        emptyIllustration={<CalendarDaysIcon className="size-8 text-fg-muted" />}
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
    </>
  );

  return (
    <ReportShell
      title="Monthly Attendance Summary"
      description="Per-employee attendance breakdown for the selected month."
      filterBar={filterBar}
      table={isLoading || isError ? undefined : table}
      onExport={() =>
        exportMutation.mutate({
          reportType: 'attendance/summary',
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
