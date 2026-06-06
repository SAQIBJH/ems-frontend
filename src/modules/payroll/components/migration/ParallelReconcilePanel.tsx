'use client';

import { useMemo, useState } from 'react';
import { Loader2Icon, GitCompareIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatsCard } from '@/components/data-display/StatsCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/lib/utils';

import {
  usePayrollRuns,
  useParallelReconcile,
  formatMajor,
  RECONCILE_STATUS_CONFIG,
} from '@/modules/payroll';
import type { PayrollRun, ParallelReconcileResult } from '@/modules/payroll';

const CURRENCY = 'INR';
const HEADER = 'employeeCode,netPay';
const ELIGIBLE = new Set(['REVIEW', 'APPROVED', 'PAID']);

function parseLegacy(text: string): { employeeCode: string; netPay: number }[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.toLowerCase().startsWith('employeecode'))
    .map((line) => {
      const [employeeCode, netPay] = line.split(',').map((p) => p.trim());
      return { employeeCode: employeeCode ?? '', netPay: Number(netPay) || 0 };
    });
}

export function ParallelReconcilePanel() {
  const { data: runsPage } = usePayrollRuns({ limit: 50 });
  const reconcile = useParallelReconcile();

  const eligibleRuns = useMemo<PayrollRun[]>(
    () => (runsPage?.items ?? []).filter((r) => ELIGIBLE.has(r.status)),
    [runsPage],
  );

  const [runId, setRunId] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState('0');
  const [legacyText, setLegacyText] = useState('');
  const [result, setResult] = useState<ParallelReconcileResult | null>(null);

  const activeRunId = runId ?? eligibleRuns[0]?.id ?? null;

  async function handleReconcile() {
    if (!activeRunId) return;
    const legacy = parseLegacy(legacyText);
    if (legacy.length === 0) {
      toast.error('Paste legacy net-pay figures first');
      return;
    }
    try {
      const res = await reconcile.mutateAsync({
        runId: activeRunId,
        input: { tolerance: Number(tolerance) || 0, legacy },
      });
      setResult(res);
    } catch {
      toast.error('Failed to run reconciliation');
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-fg">Parallel run & reconciliation</h2>
        <p className="text-xs text-fg-muted">
          Compare the computed cycle against your legacy system, employee-by-employee, before
          cutover.
        </p>
      </div>

      {eligibleRuns.length === 0 ? (
        <EmptyState
          title="No runs to reconcile"
          description="Reconciliation needs a run in review, approved, or paid."
          illustration={<GitCompareIcon className="size-8 text-fg-muted" />}
        />
      ) : (
        <div className="space-y-3 rounded-lg border border-subtle bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Payroll run</Label>
              <Select value={activeRunId ?? ''} onValueChange={(v) => v && setRunId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a run" />
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
            <div className="space-y-1.5">
              <Label htmlFor="rec-tol">Tolerance ({CURRENCY})</Label>
              <Input
                id="rec-tol"
                type="number"
                min={0}
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-legacy">
              Legacy net pay — <code className="text-fg">{HEADER}</code>
            </Label>
            <Textarea
              id="rec-legacy"
              rows={5}
              value={legacyText}
              onChange={(e) => setLegacyText(e.target.value)}
              placeholder={`${HEADER}\nE0001,178520`}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleReconcile}
              disabled={reconcile.isPending || !legacyText.trim()}
            >
              {reconcile.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <GitCompareIcon className="size-3.5" aria-hidden />
              )}
              Reconcile
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <StatsCard label="Matched" value={result.matched} />
            <StatsCard label="Mismatched" value={result.mismatched} />
            <StatsCard label="Missing legacy" value={result.missing} />
          </div>
          <div className="overflow-hidden rounded-lg border border-subtle bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                    <th className="px-4 py-2 font-medium">Employee</th>
                    <th className="px-3 py-2 text-right font-medium">Computed</th>
                    <th className="px-3 py-2 text-right font-medium">Legacy</th>
                    <th className="px-3 py-2 text-right font-medium">Diff</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((it) => (
                    <tr key={it.employeeId} className="border-b border-subtle last:border-0">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-fg">{it.employeeName}</div>
                        <div className="text-xs text-fg-muted">{it.employeeCode}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-fg">
                        {formatMajor(it.computedNet, CURRENCY, { fractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-fg-muted">
                        {it.legacyNet === null
                          ? '—'
                          : formatMajor(it.legacyNet, CURRENCY, { fractionDigits: 0 })}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5 text-right tabular-nums',
                          it.diff === 0 ? 'text-fg-muted' : 'text-danger',
                        )}
                      >
                        {it.diff === 0
                          ? '—'
                          : formatMajor(it.diff, CURRENCY, { fractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                            RECONCILE_STATUS_CONFIG[it.status].color,
                          )}
                        >
                          {RECONCILE_STATUS_CONFIG[it.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
