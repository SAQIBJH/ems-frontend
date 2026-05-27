'use client';

import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UsersIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { useHeadcountReport, useExportReport } from '../hooks/useWorkforceReports';
import { ReportShell } from './ReportShell';
import type { HeadcountTableItem } from '../types/reports.types';

const COLS: ColumnDef<HeadcountTableItem>[] = [
  {
    accessorKey: 'departmentName',
    header: 'Department',
    cell: ({ row }) => <span className="font-medium text-fg">{row.original.departmentName}</span>,
  },
  {
    accessorKey: 'startHeadcount',
    header: 'Start',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg-muted">{row.original.startHeadcount}</span>
    ),
  },
  {
    accessorKey: 'endHeadcount',
    header: 'End',
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-fg">{row.original.endHeadcount}</span>
    ),
  },
  {
    accessorKey: 'hires',
    header: 'Hires',
    cell: ({ row }) => <span className="tabular-nums text-success">{row.original.hires}</span>,
  },
  {
    accessorKey: 'exits',
    header: 'Exits',
    cell: ({ row }) => <span className="tabular-nums text-danger">{row.original.exits}</span>,
  },
  {
    accessorKey: 'changePercent',
    header: 'Change',
    cell: ({ row }) => {
      const v = row.original.changePercent;
      return (
        <span className={v >= 0 ? 'tabular-nums text-success' : 'tabular-nums text-danger'}>
          {v >= 0 ? '+' : ''}
          {v.toFixed(1)}%
        </span>
      );
    },
  },
];

export default function HeadcountReport() {
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

  const { data, isLoading, isError, refetch } = useHeadcountReport(params);
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
        { label: 'Current Headcount', value: summary.currentHeadcount },
        {
          label: 'Net Change',
          value: `${summary.changeFromStart >= 0 ? '+' : ''}${summary.changeFromStart}`,
          className: summary.changeFromStart >= 0 ? 'text-success' : 'text-danger',
        },
        { label: 'Net Hires', value: summary.netHires, className: 'text-success' },
        { label: 'Net Exits', value: summary.netExits, className: 'text-danger' },
      ].map((card) => (
        <div key={card.label} className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">{card.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${card.className ?? 'text-fg'}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  ) : null;

  const chart = (
    <div className="space-y-4">
      {summaryCards}
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="count"
            tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="headcount"
            orientation="right"
            tick={{ fontSize: 11, fill: 'hsl(220 9% 55%)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
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
            iconType="square"
            iconSize={10}
          />
          <Bar
            yAxisId="count"
            dataKey="hires"
            name="Hires"
            fill="hsl(152 60% 40%)"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            yAxisId="count"
            dataKey="exits"
            name="Exits"
            fill="hsl(0 75% 50%)"
            radius={[3, 3, 0, 0]}
          />
          <Line
            yAxisId="headcount"
            type="monotone"
            dataKey="headcount"
            name="Headcount"
            stroke="hsl(222 80% 52%)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'hsl(222 80% 52%)' }}
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
      emptyTitle="No department data"
      emptyDescription="No headcount data for the selected period."
      emptyIllustration={<UsersIcon className="size-8 text-fg-muted" />}
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
      title="Headcount"
      description="Employee headcount over time by department."
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : chart}
      table={isLoading || isError ? undefined : table}
      onExport={() =>
        exportMutation.mutate({
          reportType: 'workforce/headcount',
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
