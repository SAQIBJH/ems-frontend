'use client';

import { useState } from 'react';
import { BanknoteIcon, DownloadIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';

import {
  useRunPaymentBatch,
  useCreatePaymentBatch,
  useReconcilePaymentBatch,
  usePayrollPermissions,
  payrollRunsApi,
  BANK_FILE_FORMATS,
  PAYOUT_STATUS_CONFIG,
  PAYMENT_BATCH_STATUS_CONFIG,
  formatMajor,
} from '@/modules/payroll';
import type { BankFileFormat, PaymentBatchStatus } from '@/modules/payroll';

/** Currency-aware whole-unit formatter — guarded against the "MULTI" run-header sentinel. */
function fmtCurrency(amount: number, currency: string): string {
  return formatMajor(amount, currency, { fractionDigits: 0 });
}

function apiMessage(err: unknown, fallback: string): string {
  return (
    (err as AxiosError<{ error: { message: string } }>).response?.data?.error?.message ?? fallback
  );
}

/** Label for the reconcile action, driven by the batch's current lifecycle stage. */
const RECONCILE_LABEL: Record<PaymentBatchStatus, string> = {
  PENDING: 'Send to bank',
  PROCESSING: 'Reconcile from bank',
  COMPLETED: 'Reconciled',
};

interface DisbursementPanelProps {
  runId: string;
  currency: string;
}

export function DisbursementPanel({ runId, currency }: DisbursementPanelProps) {
  const perms = usePayrollPermissions();
  const [format, setFormat] = useState<BankFileFormat>('NACH');
  const [downloading, setDownloading] = useState(false);

  const { data: batch, isLoading, isError, refetch } = useRunPaymentBatch(runId);
  const createBatch = useCreatePaymentBatch();
  const reconcile = useReconcilePaymentBatch();

  async function handleGenerate() {
    try {
      await createBatch.mutateAsync(runId);
      toast.success('Payment batch generated.');
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to generate payment batch'));
    }
  }

  async function handleReconcile() {
    if (!batch) return;
    try {
      const updated = await reconcile.mutateAsync({ runId, batchId: batch.id });
      toast.success(
        updated.status === 'COMPLETED'
          ? 'Bank reconciliation complete.'
          : 'Batch sent — awaiting settlement.',
      );
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to reconcile'));
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await payrollRunsApi.downloadBankFile(runId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank-file-${runId}-${format}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate bank file');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <BanknoteIcon className="size-4 text-fg-muted" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-fg">Disbursement</h3>
            <p className="text-xs text-fg-muted">
              Generate the bank file and track each payout to settlement.
            </p>
          </div>
        </div>
        {batch && (
          <span
            className={cn(
              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
              PAYMENT_BATCH_STATUS_CONFIG[batch.status].color,
            )}
          >
            {PAYMENT_BATCH_STATUS_CONFIG[batch.status].label}
          </span>
        )}
      </div>

      {/* Bank-file format + download — available whether or not a batch exists. */}
      <div className="flex flex-wrap items-end gap-3 border-b border-subtle px-4 py-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-fg-muted" htmlFor="bank-file-format">
            Bank file format
          </label>
          <Select value={format} onValueChange={(v) => setFormat(v as BankFileFormat)}>
            <SelectTrigger id="bank-file-format" className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BANK_FILE_FORMATS.map((f) => (
                <SelectItem key={f.code} value={f.code}>
                  {f.label} · {f.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <DownloadIcon className="size-3.5" aria-hidden />
          )}
          Download bank file
        </Button>
      </div>

      {/* Batch + per-payslip payout lifecycle */}
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <ErrorState message="Failed to load payment batch" onRetry={() => refetch()} />
        </div>
      ) : !batch ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="text-sm text-fg-muted">
            No payment batch yet. Generate one to start disbursing this run.
          </p>
          {perms.canDisburse && (
            <Button onClick={handleGenerate} disabled={createBatch.isPending}>
              {createBatch.isPending && (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              )}
              Generate payment batch
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="text-sm text-fg-muted">
              <span className="font-medium text-fg">{batch.count}</span> payouts ·{' '}
              <span className="font-medium text-fg tabular-nums">
                {fmtCurrency(batch.totalAmount, batch.currency || currency)}
              </span>
            </div>
            {perms.canDisburse && batch.status !== 'COMPLETED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconcile}
                disabled={reconcile.isPending}
              >
                {reconcile.isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCwIcon className="size-3.5" aria-hidden />
                )}
                {RECONCILE_LABEL[batch.status]}
              </Button>
            )}
          </div>
          <ul className="divide-y divide-subtle border-t border-subtle">
            {batch.lines.map((line) => {
              const cfg = PAYOUT_STATUS_CONFIG[line.status];
              return (
                <li
                  key={line.payslipId}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fg">{line.employeeName}</div>
                    <div className="text-xs text-fg-muted">
                      <span className="font-mono">{line.employeeCode}</span>
                      {line.payoutRef && <span className="ml-2">Ref {line.payoutRef}</span>}
                      {line.failureReason && (
                        <span className="ml-2 text-danger">{line.failureReason}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm tabular-nums text-fg">
                      {fmtCurrency(line.amount, line.currency)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex w-[88px] justify-center rounded px-2 py-0.5 text-xs font-medium',
                        cfg.color,
                      )}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
