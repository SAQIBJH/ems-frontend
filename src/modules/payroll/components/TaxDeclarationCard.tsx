'use client';

import { useMemo, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  useEmployeeSalary,
  useTaxDeclaration,
  useSaveTaxDeclaration,
  useUpdateTaxDeclaration,
} from '../hooks/useEmployeeSalary';
import { useStatutoryPacks } from '../hooks/useLocalization';
import { computeRegimeTax } from '../utils/formula.utils';
import { formatMoney, fromMinor, toMinor } from '../utils/money.utils';
import type { ProofStatus, TaxDeclaration, TaxDeclarationItem } from '../types/payroll.types';
import type { StatutoryPack, TaxRegime } from '../types/statutory.types';

const EXEMPTION_LABELS: Record<string, string> = {
  STD_DEDUCTION: 'Standard Deduction',
  '80C': 'Section 80C (investments)',
  '80D': 'Section 80D (medical insurance)',
  HRA: 'House Rent Allowance',
  LTA: 'Leave Travel Allowance',
};

const PROOF_STYLES: Record<ProofStatus, string> = {
  PENDING: 'bg-warning/10 text-warning',
  VERIFIED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
};

const PROOF_STATUSES: ProofStatus[] = ['PENDING', 'VERIFIED', 'REJECTED'];

/** Current fiscal-year label for a given start month (IN = April). */
function currentFyLabel(startMonth = 4): string {
  const d = new Date();
  const month = d.getMonth() + 1;
  const sy = month >= startMonth ? d.getFullYear() : d.getFullYear() - 1;
  return `${sy}-${String((sy + 1) % 100).padStart(2, '0')}`;
}

function regimeLabel(code: string): string {
  return code
    .replace(/^IN_/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface EditorProps {
  employeeId: string;
  fy: string;
  mode: 'employee' | 'hr';
  regimes: TaxRegime[];
  currency: string;
  annualTaxable: number;
  initial: TaxDeclaration;
}

function DeclarationEditor({
  employeeId,
  fy,
  mode,
  regimes,
  currency,
  annualTaxable,
  initial,
}: EditorProps) {
  const initialByCode = useMemo(
    () => new Map(initial.items.map((i) => [i.code, i])),
    [initial.items],
  );

  const [regime, setRegime] = useState(initial.regime || regimes[0]?.code || '');
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const item of initial.items) seed[item.code] = String(fromMinor(item.amount, currency));
    return seed;
  });
  const [statuses, setStatuses] = useState<Record<string, ProofStatus>>(() => {
    const seed: Record<string, ProofStatus> = {};
    for (const item of initial.items) seed[item.code] = item.proofStatus;
    return seed;
  });

  const save = useSaveTaxDeclaration();
  const update = useUpdateTaxDeclaration();
  const pending = save.isPending || update.isPending;

  const selectedRegime = regimes.find((r) => r.code === regime) ?? regimes[0];
  const exemptionCodes = (selectedRegime?.allowedExemptions ?? []).filter(
    (c) => c !== 'STD_DEDUCTION',
  );

  function amountMinor(code: string): number {
    const major = Number(amounts[code]);
    return Number.isFinite(major) && major > 0 ? toMinor(major, currency) : 0;
  }

  /** Projected annual tax for a regime, using currently declared amounts. */
  function projectedTax(r: TaxRegime): number {
    const allowed = new Set((r.allowedExemptions ?? []).filter((c) => c !== 'STD_DEDUCTION'));
    const exemptions = Object.keys(amounts)
      .filter((code) => allowed.has(code))
      .reduce((sum, code) => sum + amountMinor(code), 0);
    return computeRegimeTax(Math.max(0, annualTaxable - exemptions), r);
  }

  function buildItems(): TaxDeclarationItem[] {
    const codes = mode === 'hr' ? initial.items.map((i) => i.code) : exemptionCodes;
    const items: TaxDeclarationItem[] = [];
    for (const code of codes) {
      const minor = mode === 'hr' ? (initialByCode.get(code)?.amount ?? 0) : amountMinor(code);
      if (minor <= 0) continue;
      const prior = initialByCode.get(code);
      // Editing an amount resets verification; HR sets the status explicitly.
      const proofStatus: ProofStatus =
        mode === 'hr'
          ? (statuses[code] ?? prior?.proofStatus ?? 'PENDING')
          : prior && prior.amount === minor
            ? prior.proofStatus
            : 'PENDING';
      items.push({ code, amount: minor, meta: prior?.meta, proofStatus });
    }
    return items;
  }

  async function handleSave() {
    try {
      if (mode === 'hr') {
        await update.mutateAsync({ employeeId, input: { fiscalYear: fy, items: buildItems() } });
        toast.success('Proof statuses updated.');
      } else {
        await save.mutateAsync({
          employeeId,
          input: { fiscalYear: fy, regime, items: buildItems() },
        });
        toast.success('Tax declaration saved.');
      }
    } catch {
      toast.error('Failed to save tax declaration');
    }
  }

  return (
    <div className="space-y-4">
      {/* Regime */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Regime
        </span>
        {mode === 'employee' ? (
          <Select value={regime} onValueChange={(v) => setRegime(v ?? '')}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regimes.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {regimeLabel(r.code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm font-medium text-fg">{regimeLabel(initial.regime)}</span>
        )}
      </div>

      {/* Exemption items */}
      {exemptionCodes.length === 0 ? (
        <p className="rounded-md border border-subtle bg-surface-raised/40 px-3 py-2 text-sm text-fg-muted">
          This regime does not allow declared exemptions — only the standard deduction applies.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                <th className="px-3 py-2 font-medium">Exemption</th>
                <th className="px-3 py-2 font-medium">Amount / year</th>
                <th className="px-3 py-2 font-medium">Proof</th>
              </tr>
            </thead>
            <tbody>
              {exemptionCodes.map((code) => (
                <tr key={code} className="border-b border-subtle last:border-0">
                  <td className="px-3 py-2 font-medium text-fg">
                    {EXEMPTION_LABELS[code] ?? code}
                  </td>
                  <td className="px-3 py-2">
                    {mode === 'employee' ? (
                      <Input
                        type="number"
                        min={0}
                        value={amounts[code] ?? ''}
                        onChange={(e) =>
                          setAmounts((prev) => ({ ...prev, [code]: e.target.value }))
                        }
                        placeholder="0"
                        className="h-8 w-36 tabular-nums"
                        aria-label={`${code} amount`}
                      />
                    ) : (
                      <span className="tabular-nums text-fg">
                        {formatMoney(initialByCode.get(code)?.amount ?? 0, currency)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {mode === 'hr' && initialByCode.has(code) ? (
                      <Select
                        value={statuses[code] ?? initialByCode.get(code)?.proofStatus ?? 'PENDING'}
                        onValueChange={(v) =>
                          setStatuses((prev) => ({ ...prev, [code]: v as ProofStatus }))
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROOF_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0) + s.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <ProofBadge
                        status={statuses[code] ?? initialByCode.get(code)?.proofStatus ?? 'PENDING'}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Projected tax per regime */}
      {annualTaxable > 0 && (
        <div className="rounded-lg border border-subtle bg-surface-raised/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Projected annual tax · based on declared amounts
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {regimes.map((r) => {
              const isChosen = r.code === regime;
              return (
                <div
                  key={r.code}
                  className={cn(
                    'flex items-center justify-between rounded-md border px-3 py-2',
                    isChosen ? 'border-brand/40 bg-brand/5' : 'border-subtle bg-surface',
                  )}
                >
                  <span className="text-sm text-fg">{regimeLabel(r.code)}</span>
                  <span className="font-semibold tabular-nums text-fg">
                    {formatMoney(Math.round(projectedTax(r)), currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={pending}>
          {pending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
          {mode === 'hr' ? 'Update proofs' : 'Save declaration'}
        </Button>
      </div>
    </div>
  );
}

function ProofBadge({ status }: { status: ProofStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        PROOF_STYLES[status],
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function TaxDeclarationCard({
  employeeId,
  mode,
}: {
  employeeId: string;
  mode: 'employee' | 'hr';
}) {
  const fy = currentFyLabel();
  const declQuery = useTaxDeclaration(employeeId, fy);
  const { data: packs = [] } = useStatutoryPacks('IN');
  const { data: salary } = useEmployeeSalary(employeeId);

  const activePack: StatutoryPack | undefined =
    packs.find((p) => p.effectiveTo === null) ?? packs[0];
  const regimes = activePack?.taxRegimes ?? [];

  const annualTaxable = salary
    ? salary.calculatedComponents
        .filter((c) => c.type === 'EARNING' && c.taxable)
        .reduce((s, c) => s + c.monthlyAmount, 0) * 12
    : 0;
  const currency = salary?.payGroup.currency ?? 'INR';

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-fg">Tax Declaration · FY {fy}</h3>
        <p className="text-xs text-fg-muted">
          {mode === 'hr'
            ? 'Verify submitted investment and exemption proofs.'
            : 'Declare investments and exemptions, and compare tax under each regime.'}
        </p>
      </div>

      {declQuery.isLoading || regimes.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-9 rounded" />
          <Skeleton className="h-24 rounded" />
        </div>
      ) : declQuery.isError ? (
        <ErrorState message="Failed to load tax declaration" onRetry={() => declQuery.refetch()} />
      ) : (
        <DeclarationEditor
          key={`${fy}-${declQuery.data?.updatedAt ?? 'new'}`}
          employeeId={employeeId}
          fy={fy}
          mode={mode}
          regimes={regimes}
          currency={currency}
          annualTaxable={annualTaxable}
          initial={declQuery.data!}
        />
      )}
    </div>
  );
}
