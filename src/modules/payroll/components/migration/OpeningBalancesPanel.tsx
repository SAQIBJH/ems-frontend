'use client';

import { useState } from 'react';
import { Loader2Icon, UploadIcon, WalletIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

import {
  useOpeningBalances,
  useSaveOpeningBalance,
  usePayrollRoster,
  formatMajor,
} from '@/modules/payroll';
import type { OpeningBalanceInput } from '@/modules/payroll';

const CURRENCY = 'INR';
const HEADER = 'employeeCode,fiscalYear,gross,taxable,tax,deductions,net';

interface ParsedRow {
  employeeCode: string;
  input: OpeningBalanceInput;
}

function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ParsedRow[] = [];
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.toLowerCase().startsWith('employeecode'));
  lines.forEach((line, i) => {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 7) {
      errors.push(`Line ${i + 1}: expected 7 columns`);
      return;
    }
    const [code, fy, gross, taxable, tax, deductions, net] = parts;
    rows.push({
      employeeCode: code,
      input: {
        fiscalYear: fy,
        grossEarnings: Number(gross) || 0,
        taxableIncome: Number(taxable) || 0,
        taxDeducted: Number(tax) || 0,
        totalDeductions: Number(deductions) || 0,
        netPay: Number(net) || 0,
      },
    });
  });
  return { rows, errors };
}

export function OpeningBalancesPanel({ canManage }: { canManage: boolean }) {
  const { data: balances = [], isLoading, isError, refetch } = useOpeningBalances();
  const { data: roster = [] } = usePayrollRoster();
  const save = useSaveOpeningBalance();
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);

  function loadSample() {
    setText([HEADER, ...roster.map((r) => `${r.employeeCode},2026-27,0,0,0,0,0`)].join('\n'));
  }

  async function handleImport() {
    const { rows, errors } = parseCsv(text);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    if (rows.length === 0) {
      toast.error('Nothing to import');
      return;
    }
    const codeToId = new Map(roster.map((r) => [r.employeeCode, r.employeeId]));
    setImporting(true);
    let imported = 0;
    let failed = 0;
    for (const row of rows) {
      const employeeId = codeToId.get(row.employeeCode);
      if (!employeeId) {
        failed++;
        continue;
      }
      try {
        await save.mutateAsync({ employeeId, input: row.input });
        imported++;
      } catch {
        failed++;
      }
    }
    setImporting(false);
    if (imported > 0)
      toast.success(`Imported ${imported} opening balance${imported === 1 ? '' : 's'}.`);
    if (failed > 0) toast.error(`${failed} row${failed === 1 ? '' : 's'} could not be imported.`);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-fg">Opening YTD balances</h2>
        <p className="text-xs text-fg-muted">
          Seed each employee&apos;s year-to-date ledger so the first run computes correct cumulative
          tax and ceilings.
        </p>
      </div>

      {canManage && (
        <div className="space-y-2 rounded-lg border border-subtle bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-fg-muted">
              Paste CSV — <code className="text-fg">{HEADER}</code>
            </p>
            <Button variant="ghost" size="sm" className="h-7" onClick={loadSample}>
              Load roster template
            </Button>
          </div>
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`${HEADER}\nE0001,2026-27,1200000,1080000,90000,180000,1020000`}
            className="font-mono text-xs"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleImport} disabled={importing || !text.trim()}>
              {importing ? (
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
            <ErrorState message="Failed to load opening balances" onRetry={() => refetch()} />
          </div>
        ) : balances.length === 0 ? (
          <EmptyState
            title="No opening balances"
            description="Import opening YTD balances to enable mid-year go-live."
            illustration={<WalletIcon className="size-8 text-fg-muted" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 font-medium">FY</th>
                  <th className="px-3 py-2 text-right font-medium">Gross</th>
                  <th className="px-3 py-2 text-right font-medium">Taxable</th>
                  <th className="px-3 py-2 text-right font-medium">Tax</th>
                  <th className="px-3 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr
                    key={`${b.employeeId}-${b.fiscalYear}`}
                    className="border-b border-subtle last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-fg">{b.employeeName}</div>
                      <div className="text-xs text-fg-muted">{b.employeeCode}</div>
                    </td>
                    <td className="px-3 py-2.5 text-fg-muted">{b.fiscalYear}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-fg">
                      {formatMajor(b.grossEarnings, CURRENCY, { fractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">
                      {formatMajor(b.taxableIncome, CURRENCY, { fractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-danger">
                      {formatMajor(b.taxDeducted, CURRENCY, { fractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-fg">
                      {formatMajor(b.netPay, CURRENCY, { fractionDigits: 0 })}
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
