'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  Loader2Icon,
  MoreHorizontalIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/data-display/StatsCard';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers';
import { ErrorState } from '@/components/feedback/ErrorState';

import {
  usePayrollRun,
  useRunPayslips,
  useApproveRunLevel,
  useMarkPaidPayrollRun,
  useCalculatePayrollRun,
  useDryRunPayrollRun,
  useReprocessPayslip,
  useRunVariance,
  useRunAudit,
  useRunEvents,
  usePublishPayrollRun,
  usePayrollPermissions,
  useRunFnf,
  RUN_STATUS_CONFIG,
  PAYROLL_EVENT_CATALOGUE,
  PAYROLL_EVENT_CONFIG,
  formatMoney,
  payrollRunsApi,
} from '@/modules/payroll';
import type {
  PayrollRunStatus,
  PayslipRunItem,
  PayrollRun,
  RunVarianceFlag,
  PayrollEventType,
} from '@/modules/payroll';

import { PayslipDrawer } from './PayslipDrawer';
import { AdjustmentDialog } from './AdjustmentDialog';
import { RunInputsPanel } from './RunInputsPanel';
import { DisbursementPanel } from './DisbursementPanel';
import { JournalPanel } from './JournalPanel';
import { StatutoryFilingPanel } from './StatutoryFilingPanel';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtCurrency(amount: number, currency = 'INR'): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
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

/* ── MarkPaidDialog ───────────────────────────────────────────────────────── */

function MarkPaidDialog({
  open,
  onOpenChange,
  runId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  runId: string;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [paidAt, setPaidAt] = useState(today);
  const [ref, setRef] = useState('');
  const markPaid = useMarkPaidPayrollRun();

  async function handleConfirm() {
    try {
      await markPaid.mutateAsync({ id: runId, paidAt, paymentReference: ref });
      toast.success('Payroll run marked as paid.');
      onOpenChange(false);
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to mark as paid');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Paid</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="paid-date">Payment Date</Label>
            <Input
              id="paid-date"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paid-ref">Payment Reference</Label>
            <Input
              id="paid-ref"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. NEFT/2024/06/BATCH001"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!paidAt || markPaid.isPending}>
            {markPaid.isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── FnF settlement view ──────────────────────────────────────────────────── */

function FnfDetail({ runId }: { runId: string }) {
  const { data: fnf, isLoading, isError, refetch } = useRunFnf(runId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-6">
        <Loader2Icon className="size-4 animate-spin text-fg-muted" aria-hidden />
      </div>
    );
  }
  if (isError || !fnf) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-6">
        <ErrorState message="Failed to load settlement" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="border-b border-subtle px-4 py-3">
        <h2 className="text-sm font-medium text-fg">
          Full &amp; Final Settlement · {fnf.employeeName}
        </h2>
        <p className="text-xs text-fg-muted">Last working day {fnf.lastWorkingDay}</p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
            Payable
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-subtle">
              {fnf.earnings.map((l) => (
                <tr key={l.code}>
                  <td className="py-1.5 text-fg">{l.label}</td>
                  <td className="py-1.5 text-right tabular-nums text-fg">
                    {formatMoney(l.amount, fnf.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
            Recovery
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-subtle">
              {fnf.deductions.map((l) => (
                <tr key={l.code}>
                  <td className="py-1.5 text-fg">{l.label}</td>
                  <td className="py-1.5 text-right tabular-nums text-danger">
                    −{formatMoney(l.amount, fnf.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-subtle px-4 py-3">
        <span className="text-sm font-medium text-fg">Net settlement</span>
        <span className="text-base font-bold tabular-nums text-fg">
          {formatMoney(fnf.netSettlement, fnf.currency)}
        </span>
      </div>
    </div>
  );
}

/* ── Approval chain (maker-checker, multi-level) ──────────────────────────── */

function ApprovalChainPanel({
  run,
  currentUser,
  canApprove,
}: {
  run: PayrollRun;
  currentUser: string;
  canApprove: boolean;
}) {
  const approveLevel = useApproveRunLevel();
  const approvals = run.approvals ?? [];
  const isMaker = !!currentUser && currentUser === run.initiatedBy;
  if (approvals.length === 0) return null;
  const nextPending = approvals.find((a) => a.status === 'PENDING');

  async function handleApproveLevel(level: number) {
    try {
      await approveLevel.mutateAsync({ id: run.id, level, approver: currentUser });
      toast.success(`Approval level ${level} signed off.`);
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { code: string; message: string } }>).response
        ?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to approve');
    }
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="border-b border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-fg">Approval Chain</h3>
        <p className="text-xs text-fg-muted">
          Maker ≠ checker — the initiator ({run.initiatedBy ?? 'unknown'}) cannot approve.
        </p>
      </div>
      <ul className="divide-y divide-subtle">
        {approvals.map((a) => {
          const isApproved = a.status === 'APPROVED';
          const isNext = nextPending?.level === a.level && run.status === 'REVIEW';
          return (
            <li key={a.level} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                    isApproved ? 'bg-success/15 text-success' : 'bg-surface-raised text-fg-muted',
                  )}
                >
                  {a.level}
                </span>
                <div>
                  <div className="text-sm font-medium text-fg">{a.label}</div>
                  <div className="text-xs text-fg-muted">
                    {isApproved
                      ? `Approved by ${a.approver} · ${a.approvedAt ? format(new Date(a.approvedAt), 'dd MMM, HH:mm') : ''}`
                      : 'Pending'}
                  </div>
                </div>
              </div>
              {isApproved ? (
                <span className="inline-flex items-center rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  Approved
                </span>
              ) : isNext && canApprove && !isMaker ? (
                <Button
                  size="sm"
                  onClick={() => handleApproveLevel(a.level)}
                  disabled={approveLevel.isPending}
                >
                  {approveLevel.isPending && (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  )}
                  Approve
                </Button>
              ) : (
                <span className="text-xs text-fg-muted">
                  {isNext && isMaker
                    ? 'You initiated this run'
                    : isNext
                      ? 'Awaiting approver'
                      : 'Locked'}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Variance / anomaly review ────────────────────────────────────────────── */

const VARIANCE_FLAG_LABELS: Record<RunVarianceFlag, string> = {
  HIGH_VARIANCE: 'High variance',
  NEGATIVE_NET: 'Negative net',
  ZERO_PAY: 'Zero pay',
  NEW_JOINER: 'New joiner',
};

function VariancePanel({ runId, currency }: { runId: string; currency: string }) {
  const { data, isLoading, isError, refetch } = useRunVariance(runId);

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="border-b border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-fg">Variance Review</h3>
        <p className="text-xs text-fg-muted">
          {data?.comparedToPeriod
            ? `Net change vs ${data.comparedToPeriod}; flags above ${data.thresholdPct}%.`
            : 'Outlier checks (negative net, zero pay, new joiners).'}
        </p>
      </div>
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <ErrorState message="Failed to load variance" onRetry={() => refetch()} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-fg-muted">No anomalies detected.</div>
      ) : (
        <ul className="divide-y divide-subtle">
          {data.items.map((it) => (
            <li
              key={it.employeeId}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-fg">{it.employeeName}</span>
                {it.flags.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning"
                  >
                    {VARIANCE_FLAG_LABELS[f]}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs tabular-nums">
                {it.deltaPct !== null && (
                  <span
                    className={cn('font-medium', it.deltaPct < 0 ? 'text-danger' : 'text-success')}
                  >
                    {it.deltaPct > 0 ? '+' : ''}
                    {it.deltaPct}%
                  </span>
                )}
                <span className="text-fg">{fmtCurrency(it.currentNet, currency)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Audit trail ──────────────────────────────────────────────────────────── */

function AuditPanel({ runId }: { runId: string }) {
  const [open, setOpen] = useState(false);
  const { data: entries = [] } = useRunAudit(runId, open);

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <h3 className="text-sm font-semibold text-fg">Audit Trail</h3>
        {open ? (
          <ChevronDownIcon className="size-4 text-fg-muted" aria-hidden />
        ) : (
          <ChevronRightIcon className="size-4 text-fg-muted" aria-hidden />
        )}
      </button>
      {open && (
        <div className="border-t border-subtle">
          {entries.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-fg-muted">
              No audit entries recorded yet.
            </div>
          ) : (
            <ul className="divide-y divide-subtle">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div>
                    <span className="font-mono text-xs font-medium text-fg">{e.action}</span>
                    {e.detail && <span className="ml-2 text-xs text-fg-muted">{e.detail}</span>}
                  </div>
                  <div className="text-right text-xs text-fg-muted">
                    <div>{e.actor}</div>
                    <div>{format(new Date(e.at), 'dd MMM, HH:mm')}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Lifecycle events (webhook/notification feed) ─────────────────────────── */

const EVENT_META = new Map<PayrollEventType, { label: string; category: string }>(
  PAYROLL_EVENT_CATALOGUE.map((e) => [e.type, { label: e.label, category: e.category }]),
);

function EventsPanel({ runId }: { runId: string }) {
  const [open, setOpen] = useState(false);
  const { data: events = [] } = useRunEvents(runId, open);

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <h3 className="text-sm font-semibold text-fg">Events</h3>
        {open ? (
          <ChevronDownIcon className="size-4 text-fg-muted" aria-hidden />
        ) : (
          <ChevronRightIcon className="size-4 text-fg-muted" aria-hidden />
        )}
      </button>
      {open && (
        <div className="border-t border-subtle">
          {events.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-fg-muted">
              No events emitted yet.
            </div>
          ) : (
            <ul className="divide-y divide-subtle">
              {events.map((e) => {
                const meta = EVENT_META.get(e.type);
                const cfg =
                  PAYROLL_EVENT_CONFIG[
                    (meta?.category ?? 'run') as keyof typeof PAYROLL_EVENT_CONFIG
                  ];
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                          cfg.color,
                        )}
                      >
                        {e.type}
                      </span>
                      <span className="text-xs text-fg-muted">{e.summary}</span>
                    </div>
                    <div className="text-right text-xs text-fg-muted">
                      {format(new Date(e.at), 'dd MMM, HH:mm')}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

interface PayrollRunDetailProps {
  runId: string;
}

export function PayrollRunDetail({ runId }: PayrollRunDetailProps) {
  const [page, setPage] = useState(1);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [adjustPayslip, setAdjustPayslip] = useState<{ id: string; name: string } | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    data: run,
    isLoading: runLoading,
    isError: runError,
    refetch: refetchRun,
  } = usePayrollRun(runId);

  const {
    data: payslipsPage,
    isLoading: slipsLoading,
    isError: slipsError,
    refetch: refetchSlips,
  } = useRunPayslips(runId, { page, limit: 20 });

  const { user } = useAuth();
  const perms = usePayrollPermissions();
  const calculateMutation = useCalculatePayrollRun();
  const dryRunMutation = useDryRunPayrollRun();
  const reprocessMutation = useReprocessPayslip();
  const publishMutation = usePublishPayrollRun();

  async function handlePublish() {
    if (!run) return;
    try {
      await publishMutation.mutateAsync(run.id);
      toast.success('Payslips published — employees can now view them.');
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to publish payslips');
    }
  }

  async function handleReprocess(payslipId: string, name: string) {
    if (!run) return;
    try {
      await reprocessMutation.mutateAsync({
        id: run.id,
        payslipId,
        actor: user?.email ?? 'system',
      });
      toast.success(`${name}'s payslip recalculated.`);
    } catch {
      toast.error('Failed to recalculate payslip');
    }
  }

  const payslips = payslipsPage?.items ?? [];
  const pagination = payslipsPage?.pagination;
  const warnings = run?.summary?.warnings ?? [];

  async function handleDryRun() {
    if (!run) return;
    try {
      const result = await dryRunMutation.mutateAsync(run.id);
      const anomalies = result.variance.items.length;
      toast.success(
        `Dry run: net ${fmtCurrency(result.totalNet, result.currency)} · ${anomalies} anomal${
          anomalies === 1 ? 'y' : 'ies'
        } · ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'} (nothing saved).`,
      );
    } catch {
      toast.error('Failed to run dry calculation');
    }
  }

  async function handleCalculate() {
    if (!run) return;
    try {
      await calculateMutation.mutateAsync(run.id);
      toast.success('Calculation started — payslips will appear shortly.');
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to start calculation');
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await payrollRunsApi.exportCsv(runId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${run?.period ?? runId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export payroll register');
    } finally {
      setExporting(false);
    }
  }

  const columns: ColumnDef<PayslipRunItem>[] = [
    {
      accessorKey: 'employeeCode',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-fg-muted">{row.original.employeeCode}</span>
      ),
    },
    {
      accessorKey: 'employeeName',
      header: 'Name',
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
        <span className="tabular-nums text-fg-muted">
          {row.original.presentDays}/{row.original.workingDays}
        </span>
      ),
    },
    {
      accessorKey: 'lopDays',
      header: 'LOP',
      cell: ({ row }) => (
        <span
          className={cn(
            'tabular-nums',
            row.original.lopDays > 0 ? 'text-danger' : 'text-fg-subtle',
          )}
        >
          {row.original.lopDays}
        </span>
      ),
    },
    {
      accessorKey: 'grossEarnings',
      header: 'Gross',
      cell: ({ row }) => (
        <span className="tabular-nums text-fg-muted">
          {fmtCurrency(row.original.grossEarnings, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'totalDeductions',
      header: 'Deductions',
      cell: ({ row }) => (
        <span className="tabular-nums text-danger">
          −{fmtCurrency(row.original.totalDeductions, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'netPay',
      header: 'Net',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-fg">
          {fmtCurrency(row.original.netPay, row.original.currency)}
        </span>
      ),
    },
    {
      id: 'adj-flag',
      header: '',
      cell: ({ row }) =>
        row.original.hasAdjustments ? (
          <span className="inline-flex items-center rounded bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">
            ADJ
          </span>
        ) : null,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const slip = row.original;
        const adjustable =
          (run?.status === 'REVIEW' || run?.status === 'APPROVED') && perms.canAdjust;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
                aria-label={`Actions for ${slip.employeeName}`}
              >
                <MoreHorizontalIcon className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedPayslipId(slip.id)}>
                  View payslip
                </DropdownMenuItem>
                {adjustable && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setAdjustPayslip({ id: slip.id, name: slip.employeeName })}
                    >
                      Add adjustment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReprocess(slip.id, slip.employeeName)}>
                      Recalculate payslip
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (runError) {
    return (
      <div className="p-6">
        <ErrorState message="Failed to load payroll run" onRetry={() => refetchRun()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={runLoading ? 'Loading…' : (run?.periodLabel ?? 'Payroll Run')}
        breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: run?.periodLabel ?? runId }]}
        actions={
          <div className="flex items-center gap-2">
            {run && run.type !== 'REGULAR' && (
              <span className="inline-flex items-center rounded bg-surface-raised px-2 py-0.5 text-xs font-medium text-fg-muted">
                {run.type.replace(/_/g, ' ')}
              </span>
            )}
            {run && <StatusBadge status={run.status} />}
            {run?.published && (
              <span className="inline-flex items-center rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                Published
              </span>
            )}

            <Button variant="outline" size="default" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <DownloadIcon className="size-3.5" aria-hidden />
              )}
              Export Register
            </Button>

            {(run?.status === 'REVIEW' || run?.status === 'DRAFT') && perms.canInitiate && (
              <Button
                variant="outline"
                size="default"
                onClick={handleDryRun}
                disabled={dryRunMutation.isPending}
              >
                {dryRunMutation.isPending && (
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                )}
                Dry Run
              </Button>
            )}

            {run?.status === 'DRAFT' && perms.canInitiate && (
              <Button
                size="default"
                onClick={handleCalculate}
                disabled={calculateMutation.isPending}
              >
                {calculateMutation.isPending && (
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                )}
                Calculate Payroll
              </Button>
            )}

            {run &&
              (run.status === 'APPROVED' || run.status === 'PAID') &&
              !run.published &&
              perms.canApprove && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending && (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  )}
                  Publish Payslips
                </Button>
              )}

            {run?.status === 'APPROVED' && perms.canDisburse && (
              <Button size="default" onClick={() => setMarkPaidOpen(true)}>
                Mark as Paid
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard label="Total Employees" value={run?.employeeCount ?? 0} loading={runLoading} />
          <StatsCard
            label="Gross Earnings"
            value={run ? fmtCurrency(run.totalGross, run.currency) : '—'}
            loading={runLoading}
          />
          <StatsCard
            label="Total Deductions"
            value={run ? fmtCurrency(run.totalDeductions, run.currency) : '—'}
            loading={runLoading}
          />
          <StatsCard
            label="Net Pay"
            value={run ? fmtCurrency(run.totalNet, run.currency) : '—'}
            loading={runLoading}
          />
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
              onClick={() => setWarningsOpen((v) => !v)}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-warning">
                <AlertTriangleIcon className="size-4 shrink-0" aria-hidden />
                {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
              </div>
              {warningsOpen ? (
                <ChevronDownIcon className="size-4 shrink-0 text-fg-muted" aria-hidden />
              ) : (
                <ChevronRightIcon className="size-4 shrink-0 text-fg-muted" aria-hidden />
              )}
            </button>
            {warningsOpen && (
              <ul className="mt-3 space-y-1.5 border-t border-warning/20 pt-3">
                {warnings.map((w, i) => (
                  <li key={`${w.employeeId}-${i}`} className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-fg">{w.employeeName}</span>
                    <span className="text-fg-muted">·</span>
                    <span className="text-fg-muted">{w.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Approval chain — maker-checker, multi-level */}
        {run && (run.status === 'REVIEW' || run.status === 'APPROVED') && (
          <ApprovalChainPanel
            run={run}
            currentUser={user?.email ?? ''}
            canApprove={perms.canApprove}
          />
        )}

        {/* Variance / anomaly review — surfaced in REVIEW */}
        {run && run.status === 'REVIEW' && <VariancePanel runId={run.id} currency={run.currency} />}

        {/* Audit trail — every transition / override / approval */}
        {run && <AuditPanel runId={run.id} />}

        {/* Lifecycle events — webhook/notification feed */}
        {run && <EventsPanel runId={run.id} />}

        {/* Department summary */}
        {run?.summary?.byDepartment && run.summary.byDepartment.length > 0 && (
          <div className="rounded-lg border border-subtle bg-surface">
            <div className="border-b border-subtle px-4 py-3">
              <h2 className="text-sm font-medium text-fg">By Department</h2>
            </div>
            <div className="divide-y divide-subtle">
              {run.summary.byDepartment.map((dept) => (
                <div
                  key={dept.departmentName}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="font-medium text-fg">{dept.departmentName}</span>
                  <div className="flex items-center gap-6 text-fg-muted">
                    <span>{dept.employeeCount} employees</span>
                    <span className="font-medium tabular-nums text-fg">
                      {fmtCurrency(dept.totalNet, run.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disbursement — bank file + per-payslip payout lifecycle, once approved */}
        {run && run.type !== 'FNF' && (run.status === 'APPROVED' || run.status === 'PAID') && (
          <DisbursementPanel runId={run.id} currency={run.currency} />
        )}

        {/* Accounting journal — double-entry GL posting, once calculated */}
        {run &&
          run.type !== 'FNF' &&
          run.status !== 'DRAFT' &&
          run.status !== 'CALCULATING' &&
          run.status !== 'CANCELLED' && <JournalPanel runId={run.id} />}

        {/* Statutory filing returns — pack-driven exporters, once calculated */}
        {run &&
          run.type !== 'FNF' &&
          run.status !== 'DRAFT' &&
          run.status !== 'CALCULATING' &&
          run.status !== 'CANCELLED' && <StatutoryFilingPanel runId={run.id} />}

        {/* FnF runs settle a single employee — show the settlement, not payslips */}
        {run?.type === 'FNF' ? (
          <FnfDetail runId={runId} />
        ) : (
          <>
            {/* Period inputs — editable before calculation */}
            {run?.status === 'DRAFT' && <RunInputsPanel runId={runId} />}

            {/* Payslips table */}
            <div>
              <h2 className="mb-3 text-sm font-medium text-fg">Payslips</h2>
              <DynamicTable
                columns={columns}
                data={payslips}
                isLoading={slipsLoading}
                isError={slipsError}
                errorMessage="Failed to load payslips"
                onRetry={() => refetchSlips()}
                emptyTitle="No payslips yet"
                emptyDescription="Payslips appear after payroll is calculated."
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
                rowLabel="payslips"
                loadingRows={6}
              />
            </div>
          </>
        )}
      </div>

      {/* Payslip drawer */}
      <PayslipDrawer
        open={!!selectedPayslipId}
        onOpenChange={(open) => {
          if (!open) setSelectedPayslipId(null);
        }}
        runId={runId}
        payslipId={selectedPayslipId}
      />

      {/* Adjustment dialog */}
      {adjustPayslip && (
        <AdjustmentDialog
          open={!!adjustPayslip}
          onOpenChange={(open) => {
            if (!open) setAdjustPayslip(null);
          }}
          runId={runId}
          payslipId={adjustPayslip.id}
          employeeName={adjustPayslip.name}
        />
      )}

      {/* Mark as paid dialog */}
      <MarkPaidDialog open={markPaidOpen} onOpenChange={setMarkPaidOpen} runId={runId} />
    </div>
  );
}
