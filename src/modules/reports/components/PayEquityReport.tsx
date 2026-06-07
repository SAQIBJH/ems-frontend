'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ScaleIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { cn } from '@/lib/utils';
import { usePayEquityReport, formatMajor } from '@/modules/payroll';
import type { PayEquityGroupBy, PayEquityGroup } from '@/modules/payroll';
import { ReportShell } from './ReportShell';

const CURRENCY = 'INR';

const GROUP_BY_LABELS: Record<PayEquityGroupBy, string> = {
  gender: 'Gender',
  level: 'Level',
  location: 'Location',
};

function fmtInr(value: number): string {
  if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}

const COLS: ColumnDef<PayEquityGroup>[] = [
  {
    accessorKey: 'group',
    header: 'Group',
    cell: ({ row }) => <span className="font-medium text-fg">{row.original.group}</span>,
  },
  {
    accessorKey: 'headcount',
    header: 'Headcount',
    cell: ({ row }) => <span className="tabular-nums text-fg-muted">{row.original.headcount}</span>,
  },
  {
    accessorKey: 'meanPay',
    header: 'Mean pay',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg">
        {formatMajor(row.original.meanPay, CURRENCY, { fractionDigits: 0 })}
      </span>
    ),
  },
  {
    accessorKey: 'medianPay',
    header: 'Median pay',
    cell: ({ row }) => (
      <span className="tabular-nums text-fg-muted">
        {formatMajor(row.original.medianPay, CURRENCY, { fractionDigits: 0 })}
      </span>
    ),
  },
  {
    accessorKey: 'meanGapPct',
    header: 'Mean gap',
    cell: ({ row }) => (
      <span
        className={cn('tabular-nums', row.original.meanGapPct > 0 ? 'text-danger' : 'text-success')}
      >
        {row.original.meanGapPct === 0 ? 'ref' : `${row.original.meanGapPct}%`}
      </span>
    ),
  },
  {
    accessorKey: 'medianGapPct',
    header: 'Median gap',
    cell: ({ row }) => (
      <span
        className={cn(
          'tabular-nums',
          row.original.medianGapPct > 0 ? 'text-danger' : 'text-success',
        )}
      >
        {row.original.medianGapPct === 0 ? 'ref' : `${row.original.medianGapPct}%`}
      </span>
    ),
  },
];

export default function PayEquityReport() {
  const [groupBy, setGroupBy] = useState<PayEquityGroupBy>('gender');
  const { data, isLoading, isError, refetch } = usePayEquityReport(groupBy);

  const filterBar = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-fg-muted">Group by</label>
      <Select value={groupBy} onValueChange={(v) => v && setGroupBy(v as PayEquityGroupBy)}>
        <SelectTrigger className="h-8 w-40 text-sm">
          <SelectValue>{(v: string) => GROUP_BY_LABELS[v as PayEquityGroupBy] ?? v}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(GROUP_BY_LABELS) as PayEquityGroupBy[]).map((g) => (
            <SelectItem key={g} value={g}>
              {GROUP_BY_LABELS[g]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const summaryCards = data ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Reference group', value: data.referenceGroup || '—' },
        { label: 'Mean pay gap', value: `${data.overallMeanGapPct}%` },
        { label: 'Median pay gap', value: `${data.overallMedianGapPct}%` },
        { label: 'Groups', value: data.groups.length },
      ].map((c) => (
        <div key={c.label} className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">{c.value}</p>
        </div>
      ))}
    </div>
  ) : null;

  const chart = (
    <div className="space-y-4">
      {summaryCards}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data?.groups ?? []} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
          <XAxis
            dataKey="group"
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
          <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(220 9% 38%)' }} iconType="circle" />
          <Bar dataKey="meanPay" name="Mean pay" fill="hsl(222 80% 52%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="medianPay" name="Median pay" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const table = (
    <DynamicTable
      columns={COLS}
      data={data?.groups ?? []}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      emptyTitle="No pay-equity data"
      emptyDescription="No compensation data is available to analyse."
      emptyIllustration={<ScaleIcon className="size-8 text-fg-muted" />}
    />
  );

  return (
    <ReportShell
      title="Pay Equity"
      description="Gender & diversity pay-gap analysis from compensation and demographics."
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : chart}
      table={isLoading || isError ? undefined : table}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
