'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { DonutChart } from '@/shared/engines/ChartEngine';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { useCtcAnalysisReport } from '../hooks/usePayrollReports';
import { ReportShell } from './ReportShell';

const BAND_COLORS = [
  'hsl(222 80% 52%)',
  'hsl(152 60% 40%)',
  'hsl(38 92% 50%)',
  'hsl(280 65% 55%)',
  'hsl(0 75% 50%)',
];

function fmtInr(value: number): string {
  if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}

export default function CtcAnalysisReport() {
  const [deptId, setDeptId] = useState('');
  const [asOf, setAsOf] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: departments = [] } = useDepartments();
  const flatDepts = flattenDepartmentTree(departments);

  const params = {
    departmentId: deptId || undefined,
    asOf,
  };

  const { data, isLoading, isError, refetch } = useCtcAnalysisReport(params);

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-fg-muted">As of</label>
        <input
          type="date"
          value={asOf}
          onChange={(e) => setAsOf(e.target.value)}
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

  const bandSlices = (data?.bands ?? []).map((b, i) => ({
    name: b.label,
    value: b.count,
    color: BAND_COLORS[i % BAND_COLORS.length],
  }));

  const percentiles = data?.percentiles;

  const chart = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* CTC Band Distribution */}
      <div className="rounded-lg border border-subtle bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          CTC Band Distribution
        </p>
        {bandSlices.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-fg-muted">No data</div>
        ) : (
          <DonutChart data={bandSlices} height={220} innerRadius={55} outerRadius={85} />
        )}
        {/* Band breakdown table */}
        {(data?.bands ?? []).length > 0 && (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="pb-1.5 text-left text-xs font-medium text-fg-muted">Band</th>
                <th className="pb-1.5 text-right text-xs font-medium text-fg-muted">Employees</th>
                <th className="pb-1.5 text-right text-xs font-medium text-fg-muted">%</th>
              </tr>
            </thead>
            <tbody>
              {(data?.bands ?? []).map((b, i) => (
                <tr key={b.label} className="border-b border-subtle/50 last:border-0">
                  <td className="py-1.5 text-fg flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: BAND_COLORS[i % BAND_COLORS.length] }}
                    />
                    {b.label}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-fg-muted">{b.count}</td>
                  <td className="py-1.5 text-right tabular-nums text-fg-muted">
                    {b.percent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Salary Percentiles */}
      <div className="rounded-lg border border-subtle bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Salary Percentiles
        </p>
        {percentiles ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="pb-1.5 text-left text-xs font-medium text-fg-muted">Percentile</th>
                <th className="pb-1.5 text-right text-xs font-medium text-fg-muted">Annual CTC</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'P25 (bottom quartile)', value: percentiles.p25 },
                { label: 'P50 (median)', value: percentiles.p50 },
                { label: 'P75 (top quartile)', value: percentiles.p75 },
                { label: 'P90', value: percentiles.p90 },
              ].map((row) => (
                <tr key={row.label} className="border-b border-subtle/50 last:border-0">
                  <td className="py-2.5 text-fg-muted">{row.label}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium text-fg">
                    {fmtInr(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-fg-muted">
            No percentile data
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ReportShell
      title="CTC Analysis"
      description="CTC band distribution and salary percentile analysis. Visible to HR only."
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : chart}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
