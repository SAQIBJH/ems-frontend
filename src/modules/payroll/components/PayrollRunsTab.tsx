'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/data-display/StatsCard';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { PermissionWrapper } from '@/shared/guards';
import { cn } from '@/lib/utils';

import { usePayrollRuns, useApprovePayrollRun, RUN_STATUS_CONFIG } from '@/modules/payroll';
import type { PayrollRun, PayrollRunStatus } from '@/modules/payroll';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtInr(amount: number, currency = 'INR'): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: PayrollRunStatus }) {
  const cfg = RUN_STATUS_CONFIG[status] ?? {
    label: status,
    color: 'text-fg-muted bg-surface-raised',
  };
  const isCalculating = status === 'CALCULATING';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
        cfg.color,
      )}
    >
      {isCalculating && <Loader2Icon className="size-3 animate-spin" aria-hidden />}
      {cfg.label}
    </span>
  );
}

/* ── component ────────────────────────────────────────────────────────────── */

export function PayrollRunsTab({ onRunPayroll }: { onRunPayroll: () => void }) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = usePayrollRuns({
    year: currentYear,
    page,
    limit: 10,
  });

  const approveMutation = useApprovePayrollRun();

  const runs = data?.items ?? [];
  const pagination = data?.pagination;

  /* Stats computed from current year list */
  const stats = useMemo(() => {
    const paidRuns = runs.filter((r) => r.status === 'PAID');
    const totalPaid = paidRuns.reduce((s, r) => s + r.totalNet, 0);
    const lastPaid = paidRuns.at(-1);
    const employeesOnPayroll = lastPaid?.employeeCount ?? 0;
    const pendingRuns = runs.filter(
      (r) => r.status === 'DRAFT' || r.status === 'CALCULATING' || r.status === 'REVIEW',
    ).length;
    return { totalPaid, lastRunNet: lastPaid?.totalNet ?? 0, employeesOnPayroll, pendingRuns };
  }, [runs]);

  const currency = runs[0]?.currency ?? 'INR';

  async function handleApprove(run: PayrollRun) {
    try {
      await approveMutation.mutateAsync({ id: run.id });
      toast.success(`${run.periodLabel} payroll approved.`);
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to approve payroll run');
    }
  }

  const columns: ColumnDef<PayrollRun>[] = [
    {
      accessorKey: 'periodLabel',
      header: 'Period',
      cell: ({ row }) => <span className="font-medium text-fg">{row.original.periodLabel}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'employeeCount',
      header: 'Employees',
      cell: ({ row }) => <span className="tabular-nums">{row.original.employeeCount}</span>,
    },
    {
      accessorKey: 'totalGross',
      header: 'Gross',
      cell: ({ row }) => (
        <span className="tabular-nums text-fg-muted">
          {fmtInr(row.original.totalGross, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'totalDeductions',
      header: 'Deductions',
      cell: ({ row }) => (
        <span className="tabular-nums text-danger">
          −{fmtInr(row.original.totalDeductions, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'totalNet',
      header: 'Net',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-fg">
          {fmtInr(row.original.totalNet, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'processedAt',
      header: 'Processed On',
      cell: ({ row }) => <span className="text-fg-muted">{fmtDate(row.original.processedAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const run = row.original;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" onClick={() => router.push(`/payroll/${run.id}`)}>
              View
            </Button>
            {run.status === 'REVIEW' && (
              <PermissionWrapper permission="payroll:approve">
                <Button
                  size="sm"
                  onClick={() => handleApprove(run)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending && approveMutation.variables?.id === run.id && (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  )}
                  Approve
                </Button>
              </PermissionWrapper>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          label="Total Paid (This Year)"
          value={fmtInr(stats.totalPaid, currency)}
          loading={isLoading}
        />
        <StatsCard
          label="Last Run Net"
          value={stats.lastRunNet ? fmtInr(stats.lastRunNet, currency) : '—'}
          loading={isLoading}
        />
        <StatsCard
          label="Employees on Payroll"
          value={stats.employeesOnPayroll}
          loading={isLoading}
        />
        <StatsCard
          label="Pending Runs"
          value={stats.pendingRuns}
          loading={isLoading}
          subLine={
            stats.pendingRuns > 0
              ? { text: 'Needs attention', tone: 'warning' }
              : { text: 'All clear', tone: 'positive' }
          }
        />
      </div>

      {/* Runs table */}
      <DynamicTable
        columns={columns}
        data={runs}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load payroll runs"
        onRetry={() => refetch()}
        emptyTitle="No payroll runs"
        emptyDescription="Initiate a payroll run to get started."
        emptyAction={
          <Button size="default" onClick={onRunPayroll}>
            Run Payroll
          </Button>
        }
        onRowClick={(run) => router.push(`/payroll/${run.id}`)}
        pagination={
          pagination
            ? {
                page: pagination.page,
                pages: pagination.totalPages,
                total: pagination.total,
                pageSize: pagination.limit,
              }
            : undefined
        }
        onPageChange={setPage}
        rowLabel="runs"
        loadingRows={5}
      />
    </div>
  );
}
