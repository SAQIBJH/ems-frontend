'use client';

import { useState } from 'react';
import { Loader2Icon, UploadIcon, FileClockIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

import {
  useHistoricalPayslips,
  useImportHistoricalPayslips,
  usePayrollRoster,
  formatMajor,
} from '@/modules/payroll';
import type { HistoricalPayslipImportRow } from '@/modules/payroll';

const CURRENCY = 'INR';
const HEADER = 'employeeCode,period,gross,deductions,net';

function parseCsv(text: string): HistoricalPayslipImportRow[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.toLowerCase().startsWith('employeecode'))
    .map((line) => {
      const [employeeCode, period, gross, deductions, net] = line.split(',').map((p) => p.trim());
      return {
        employeeCode: employeeCode ?? '',
        period: period ?? '',
        grossEarnings: Number(gross) || 0,
        totalDeductions: Number(deductions) || 0,
        netPay: Number(net) || 0,
      };
    });
}

export function HistoricalPayslipsPanel({ canManage }: { canManage: boolean }) {
  const { data, isLoading, isError, refetch } = useHistoricalPayslips();
  const { data: roster = [] } = usePayrollRoster();
  const importMutation = useImportHistoricalPayslips();
  const [text, setText] = useState('');

  function loadSample() {
    setText(
      [
        HEADER,
        ...roster.slice(0, 3).map((r) => `${r.employeeCode},2026-03,100000,18000,82000`),
      ].join('\n'),
    );
  }

  async function handleImport() {
    const rows = parseCsv(text);
    if (rows.length === 0) {
      toast.error('Nothing to import');
      return;
    }
    try {
      const result = await importMutation.mutateAsync(rows);
      if (result.imported > 0)
        toast.success(`Imported ${result.imported} payslip${result.imported === 1 ? '' : 's'}.`);
      if (result.failed > 0)
        toast.error(`${result.failed} row(s) failed: ${result.errors[0]?.message ?? ''}`);
      if (result.imported > 0) setText('');
    } catch {
      toast.error('Failed to import historical payslips');
    }
  }

  const rows = data?.rows ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-fg">Historical payslips</h2>
        <p className="text-xs text-fg-muted">
          Load prior payslips for continuity and accurate year-end tax forms.
        </p>
      </div>

      {canManage && (
        <div className="space-y-2 rounded-lg border border-subtle bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-fg-muted">
              Paste CSV — <code className="text-fg">{HEADER}</code>
            </p>
            <Button variant="ghost" size="sm" className="h-7" onClick={loadSample}>
              Load sample
            </Button>
          </div>
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`${HEADER}\nE0001,2026-03,200000,40000,160000`}
            className="font-mono text-xs"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleImport}
              disabled={importMutation.isPending || !text.trim()}
            >
              {importMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <UploadIcon className="size-3.5" aria-hidden />
              )}
              Import
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-subtle bg-surface">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="Failed to load historical payslips" onRetry={() => refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No historical payslips"
            description="Import prior payslips to preserve pay history."
            illustration={<FileClockIcon className="size-8 text-fg-muted" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 text-right font-medium">Gross</th>
                  <th className="px-3 py-2 text-right font-medium">Deductions</th>
                  <th className="px-3 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.employeeCode}-${r.period}-${i}`}
                    className="border-b border-subtle last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-fg">{r.employeeCode}</td>
                    <td className="px-3 py-2.5 text-fg-muted">{r.period}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-fg">
                      {formatMajor(r.grossEarnings, CURRENCY, { fractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-danger">
                      {formatMajor(r.totalDeductions, CURRENCY, { fractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-fg">
                      {formatMajor(r.netPay, CURRENCY, { fractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
