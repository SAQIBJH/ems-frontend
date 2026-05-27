'use client';

import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSignIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { usePayrollSummaryReport } from '../hooks/usePayrollReports';
import { useExportReport } from '../hooks/useWorkforceReports';
import { ReportShell } from './ReportShell';
import type { PayrollSummaryTableItem } from '../types/reports.types';

function fmtInr(value: number): string {
  if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}

const COLS: ColumnDef<PayrollSummaryTableItem>[] = [
  {
    accessorKey: 'departmentName',
    header: 'Department',
    cell: ({ row }) => <span className="font-medium text-fg">{row.original.departmentName}</span>,
  },
  {
    accessorKey: 'employeeCount',
    header: 'Employees',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg-muted">{row.original.employeeCount}</span>
    ),
  },
  {
    accessorKey: 'totalGross',
    header: 'Gross',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg">{fmtInr(row.original.totalGross)}</span>
    ),
  },
  {
    accessorKey: 'totalDeductions',
    header: 'Deductions',
    cell: ({ row }) => (
      <span className="tabular-nums text-danger">{fmtInr(row.original.totalDeductions)}</span>
    ),
  },
  {
    accessorKey: 'totalNet',
    header: 'Net Pay',
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-fg">{fmtInr(row.original.totalNet)}</span>
    ),
  },
  {
    accessorKey: 'avgNetPerEmployee',
    header: 'Avg / Employee',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg-muted">{fmtInr(row.original.avgNetPerEmployee)}</span>
    ),
  },
];

export default function PayrollSummaryReport() {
  const defaultEnd = format(new Date(), 'yyyy-MM');
  const defaultStart = format(subMonths(new Date(), 5), 'yyyy-MM');

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

  const { data, isLoading, isError, refetch } = usePayrollSummaryReport(params);
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
        { label: 'Total Payroll Cost', value: fmtInr(summary.totalPayrollCost), cls: 'text-fg' },
        { label: 'Avg Monthly', value: fmtInr(summary.avgMonthlyPayroll), cls: 'text-fg' },
        { label: 'Total Employees', value: summary.totalEmployees, cls: 'text-fg' },
        { label: 'Currency', value: summary.currency, cls: 'text-fg-muted' },
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
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(222 80% 52%)" stopOpacity={0.18} />
              <stop offset="95%" stopColor="hsl(222 80% 52%)" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v: number) => fmtInr(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(0 0% 100%)',
              border: '1px solid hsl(220 13% 91%)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => (typeof value === 'number' ? fmtInr(value) : String(value))}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'hsl(220 9% 38%)' }}
            iconType="plainline"
            iconSize={16}
          />
          <Area
            type="monotone"
            dataKey="totalNet"
            name="Net Pay"
            stroke="hsl(222 80% 52%)"
            strokeWidth={2}
            fill="url(#netGrad)"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="totalGross"
            name="Gross"
            stroke="hsl(38 92% 50%)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const table = (
    <DynamicTable
      columns={COLS}
      data={tableItems}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      emptyTitle="No payroll data"
      emptyDescription="No payroll records found for the selected period."
      emptyIllustration={<DollarSignIcon className="size-8 text-fg-muted" />}
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
      title="Payroll Summary"
      description="Monthly payroll cost by department and period."
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : chart}
      table={isLoading || isError ? undefined : table}
      onExport={() =>
        exportMutation.mutate({
          reportType: 'payroll/summary',
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
