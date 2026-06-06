'use client';

import { useState } from 'react';
import { CheckCircle2Icon, AlertTriangleIcon, DownloadIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

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

import { useRunJournal, payrollRunsApi, JOURNAL_EXPORT_FORMATS } from '@/modules/payroll';
import type { JournalExportFormat } from '@/modules/payroll';

function fmtCurrency(amount: number, currency: string): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

export function JournalPanel({ runId }: { runId: string }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<JournalExportFormat>('CSV');
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, isError, refetch } = useRunJournal(runId, open);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await payrollRunsApi.exportJournal(runId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = format === 'TALLY' ? 'txt' : 'csv';
      a.href = url;
      a.download = `journal-${runId}-${format}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export journal');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-fg">Accounting Journal</h3>
          <p className="text-xs text-fg-muted">Double-entry GL posting for this run.</p>
        </div>
        {data && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
              data.balanced ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}
          >
            {data.balanced ? (
              <CheckCircle2Icon className="size-3" aria-hidden />
            ) : (
              <AlertTriangleIcon className="size-3" aria-hidden />
            )}
            {data.balanced ? 'Balanced' : 'Unbalanced'}
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-subtle">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 rounded" />
              ))}
            </div>
          ) : isError || !data ? (
            <div className="p-4">
              <ErrorState message="Failed to load journal" onRetry={() => refetch()} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-subtle text-left text-xs text-fg-muted">
                      <th className="px-4 py-2 font-medium">Account</th>
                      <th className="px-4 py-2 font-medium">Cost center</th>
                      <th className="px-4 py-2 text-right font-medium">Debit</th>
                      <th className="px-4 py-2 text-right font-medium">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {data.lines.map((l, i) => (
                      <tr key={`${l.account}-${l.costCenter ?? ''}-${i}`}>
                        <td className="px-4 py-2 text-fg">{l.account}</td>
                        <td className="px-4 py-2 text-fg-muted">{l.costCenter ?? '—'}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-fg">
                          {l.debit > 0 ? fmtCurrency(l.debit, l.currency) : ''}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-fg">
                          {l.credit > 0 ? fmtCurrency(l.credit, l.currency) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-subtle font-medium">
                      <td className="px-4 py-2 text-fg" colSpan={2}>
                        Total
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-fg">
                        {fmtCurrency(data.totalDebit, data.currency)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-fg">
                        {fmtCurrency(data.totalCredit, data.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-subtle px-4 py-3">
                <Select
                  value={format}
                  onValueChange={(v) => v && setFormat(v as JournalExportFormat)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURNAL_EXPORT_FORMATS.map((f) => (
                      <SelectItem key={f.format} value={f.format}>
                        {f.label} · {f.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <DownloadIcon className="size-3.5" aria-hidden />
                  )}
                  Export
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
