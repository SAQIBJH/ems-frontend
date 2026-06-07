'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { FileSpreadsheetIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/lib/utils';
import {
  usePayrollRuns,
  useRunRegister,
  payrollRunsApi,
  formatMajor,
  PAYROLL_REGISTERS,
} from '@/modules/payroll';
import type { PayrollRegisterType, RegisterColumn, PayrollRun } from '@/modules/payroll';
import { ReportShell } from './ReportShell';

type RegisterRow = Record<string, string | number | null>;

// A register is per-run; DRAFT/CALCULATING/CANCELLED runs have nothing to file yet.
const ELIGIBLE_STATUSES = new Set(['REVIEW', 'APPROVED', 'PAID']);

function formatCell(value: string | number | null, col: RegisterColumn, currency: string): string {
  if (value === null || value === undefined || value === '') return '—';
  switch (col.kind) {
    case 'money':
      return typeof value === 'number'
        ? formatMajor(value, currency, { fractionDigits: 0 })
        : String(value);
    case 'percent':
      return typeof value === 'number' ? `${value > 0 ? '+' : ''}${value}%` : String(value);
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    default:
      return String(value);
  }
}

export function PayrollRegisterReport({ register }: { register: PayrollRegisterType }) {
  const meta = PAYROLL_REGISTERS.find((r) => r.type === register)!;
  const [runId, setRunId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: runsPage, isLoading: runsLoading } = usePayrollRuns({ limit: 50 });
  const eligibleRuns = useMemo<PayrollRun[]>(
    () => (runsPage?.items ?? []).filter((r) => ELIGIBLE_STATUSES.has(r.status)),
    [runsPage],
  );

  const activeRunId = runId ?? eligibleRuns[0]?.id ?? null;

  const { data, isLoading, isError, refetch } = useRunRegister(
    activeRunId,
    register,
    !!activeRunId,
  );
  const currency = data?.currency ?? 'INR';

  const columns = useMemo<ColumnDef<RegisterRow>[]>(
    () =>
      (data?.columns ?? []).map((col) => ({
        accessorKey: col.key,
        header: () => <div className={cn(col.align === 'right' && 'text-right')}>{col.label}</div>,
        cell: ({ row }) => (
          <span
            className={cn(
              'block',
              col.align === 'right' && 'text-right tabular-nums',
              col.kind === 'money' && 'font-medium text-fg',
              col.key === 'employeeName' && 'font-medium text-fg',
            )}
          >
            {formatCell(row.original[col.key] ?? null, col, currency)}
          </span>
        ),
      })),
    [data?.columns, currency],
  );

  async function handleExport() {
    if (!activeRunId) return;
    setExporting(true);
    try {
      const blob = await payrollRunsApi.exportRegister(activeRunId, register);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `register-${data?.period ?? activeRunId}-${register}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export register');
    } finally {
      setExporting(false);
    }
  }

  const filterBar = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-fg-muted">Payroll run</label>
      <Select
        value={activeRunId ?? ''}
        onValueChange={(v) => v && setRunId(v)}
        disabled={runsLoading || eligibleRuns.length === 0}
      >
        <SelectTrigger className="h-8 w-64 text-sm">
          <SelectValue placeholder={runsLoading ? 'Loading runs…' : 'Select a run'}>
            {(v: string) => {
              const r = eligibleRuns.find((run) => run.id === v);
              if (r) return `${r.periodLabel} · ${r.status}`;
              return runsLoading ? 'Loading runs…' : 'Select a run';
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {eligibleRuns.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.periodLabel} · {r.status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // No eligible run to report on yet.
  if (!runsLoading && eligibleRuns.length === 0) {
    return (
      <ReportShell
        title={meta.label}
        description={meta.description}
        table={
          <EmptyState
            title="No runs to report on"
            description="Registers become available once a payroll run reaches review, approval, or paid."
            illustration={<FileSpreadsheetIcon className="size-8 text-fg-muted" />}
          />
        }
      />
    );
  }

  const summaryCards =
    data?.summary && data.summary.length > 0 ? (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data.summary.map((s) => (
          <div key={s.label} className="rounded-lg border border-subtle bg-surface p-4">
            <p className="text-xs text-fg-muted">{s.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-fg">{s.value}</p>
          </div>
        ))}
      </div>
    ) : null;

  const table = (
    <DynamicTable
      columns={columns}
      data={(data?.rows ?? []) as RegisterRow[]}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      emptyTitle="No rows"
      emptyDescription="This register has no rows for the selected run."
      emptyIllustration={<FileSpreadsheetIcon className="size-8 text-fg-muted" />}
    />
  );

  return (
    <ReportShell
      title={meta.label}
      description={meta.description}
      filterBar={filterBar}
      chart={isLoading || isError ? undefined : (summaryCards ?? undefined)}
      table={isLoading || isError ? undefined : table}
      onExport={handleExport}
      isExporting={exporting}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
