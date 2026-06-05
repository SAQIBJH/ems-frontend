'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, PlusIcon } from 'lucide-react';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers';

import {
  useEmployeeSalary,
  usePayrollComponents,
  useBankSchema,
  COMPONENT_TYPE_CONFIG,
  TaxDeclarationCard,
  LoansCard,
  ClaimsCard,
} from '@/modules/payroll';
import type { SalaryComponent, EmployeeSalary } from '@/modules/payroll';

import { SalaryAssignmentDrawer } from './SalaryAssignmentDrawer';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy');
  } catch {
    return iso;
  }
}

function fmtInr(amount: number, currency = 'INR'): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

function calcText(comp: SalaryComponent): string {
  if (comp.calculationType === 'FLAT') {
    return `${(comp.value ?? 0).toLocaleString('en-IN')} flat`;
  }
  if (comp.calculationType === 'PERCENTAGE') {
    return `${comp.value ?? '—'}% of ${comp.basisCode ?? 'CTC'}`;
  }
  if (comp.calculationType === 'FORMULA') {
    const f = comp.formula ?? '—';
    return f.length > 32 ? f.slice(0, 32) + '…' : f;
  }
  return '—';
}

/* ── skeleton ─────────────────────────────────────────────────────────────── */

function CompensationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────────── */

export function CompensationTab({ employeeId }: { employeeId: string }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isHrOrAdmin = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';

  const {
    data: salary,
    isLoading,
    isError,
    error,
    refetch,
  } = useEmployeeSalary(isHrOrAdmin ? employeeId : null);

  const { data: allComponents = [] } = usePayrollComponents();

  /* Role gate */
  if (!isHrOrAdmin) {
    return (
      <EmptyState
        title="Access restricted"
        description="Compensation details are visible to HR administrators only."
      />
    );
  }

  /* Loading */
  if (isLoading) return <CompensationSkeleton />;

  /* 404 = not yet assigned */
  const isNotAssigned = isError && (error as AxiosError)?.response?.status === 404;

  /* Other errors */
  if (isError && !isNotAssigned) {
    return <ErrorState message="Failed to load compensation data" onRetry={() => refetch()} />;
  }

  /* Empty — no salary config */
  if (!salary || isNotAssigned) {
    return (
      <>
        <EmptyState
          title="No salary configuration"
          description="Assign a pay group and CTC to run payroll for this employee."
          action={
            <Button size="default" onClick={() => setDrawerOpen(true)}>
              <PlusIcon className="size-3.5" aria-hidden />
              Assign Salary
            </Button>
          }
        />
        <SalaryAssignmentDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          employeeId={employeeId}
          existing={null}
        />
      </>
    );
  }

  /* ── Assigned state ─────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="rounded-lg border border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Pay Group
            </p>
            <Link
              href="/settings/pay/groups"
              className="text-sm font-semibold text-brand hover:underline"
            >
              {salary.payGroup.name}
            </Link>
            <p className="text-xs text-fg-muted font-mono">{salary.payGroup.code}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Annual CTC
            </p>
            <p className="text-lg font-bold tabular-nums text-fg">
              {fmtInr(salary.annualCtc, salary.payGroup.currency)}
            </p>
            <p className="text-xs text-fg-muted">
              {fmtInr(salary.annualCtc / 12, salary.payGroup.currency)}&nbsp;/ month
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Effective From
            </p>
            <p className="text-sm font-medium text-fg">{fmtDate(salary.effectiveFrom)}</p>
            {salary.effectiveTo && (
              <p className="text-xs text-fg-muted">to {fmtDate(salary.effectiveTo)}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
            <PencilIcon className="size-3.5" aria-hidden />
            Edit
          </Button>
        </div>
      </div>

      {/* Component breakdown table */}
      <div className="rounded-lg border border-subtle overflow-hidden">
        <div className="bg-surface-raised/40 px-4 py-2 border-b border-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
            Component Breakdown
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-surface-raised/20">
              <th className="text-left px-4 py-2 text-xs font-medium text-fg-muted">Component</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-fg-muted">Type</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-fg-muted">Calculation</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-fg-muted">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {salary.calculatedComponents.map((cc) => {
              const baseComp = allComponents.find((c) => c.code === cc.code);
              const cfg =
                COMPONENT_TYPE_CONFIG[cc.type] ??
                ({
                  label: cc.type,
                  color: 'text-fg-muted bg-surface-raised',
                  icon: '?',
                } as (typeof COMPONENT_TYPE_CONFIG)[keyof typeof COMPONENT_TYPE_CONFIG]);
              return (
                <tr key={cc.code} className="border-b border-subtle last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-fg">{cc.name}</span>
                    <span className="ml-1.5 font-mono text-xs text-fg-muted">{cc.code}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                        cfg.color,
                      )}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">
                    {baseComp ? calcText(baseComp) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg whitespace-nowrap">
                    {fmtInr(cc.monthlyAmount, salary.payGroup.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Totals */}
          <tfoot>
            <tr className="border-t border-subtle bg-surface-raised/20">
              <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-fg-muted">
                Gross Earnings
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-success">
                {fmtInr(salary.monthlyGross, salary.payGroup.currency)}
              </td>
            </tr>
            <tr className="border-t border-subtle/50">
              <td colSpan={3} className="px-4 py-2 text-xs font-medium text-fg-muted">
                Total Deductions
              </td>
              <td className="px-4 py-2 text-right text-sm font-medium tabular-nums text-danger">
                −{fmtInr(salary.monthlyDeductions, salary.payGroup.currency)}
              </td>
            </tr>
            <tr className="border-t-2 border-subtle">
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-fg">
                Net Pay / Month
              </td>
              <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-fg">
                {fmtInr(salary.monthlyNet, salary.payGroup.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bank details — labels resolved from the country bank schema */}
      <BankDetailsCard salary={salary} />

      {/* Tax declaration — HR review/verify */}
      <TaxDeclarationCard employeeId={employeeId} mode="hr" />

      {/* Loans & advances — HR view of schedule/balance */}
      <LoansCard employeeId={employeeId} mode="hr" />

      {/* Reimbursement claims — HR approve/reject */}
      <ClaimsCard employeeId={employeeId} mode="hr" />

      {/* History */}
      {salary.history.length > 0 && (
        <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-fg hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <span>Previous Salary Records ({salary.history.length})</span>
            {historyOpen ? (
              <ChevronUpIcon className="size-4 text-fg-muted" aria-hidden />
            ) : (
              <ChevronDownIcon className="size-4 text-fg-muted" aria-hidden />
            )}
          </button>
          {historyOpen && (
            <div className="border-t border-subtle divide-y divide-subtle">
              {salary.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="font-mono text-xs text-fg-muted mr-2">{h.payGroupCode}</span>
                    <span className="text-fg-muted">
                      {fmtDate(h.effectiveFrom)} –{' '}
                      {h.effectiveTo ? fmtDate(h.effectiveTo) : 'Present'}
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums text-fg">
                    {fmtInr(h.annualCtc)} / yr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <SalaryAssignmentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        employeeId={employeeId}
        existing={salary}
      />
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="font-medium text-fg">{value || '—'}</p>
    </div>
  );
}

function BankDetailsCard({ salary }: { salary: EmployeeSalary }) {
  const { data: bankSchema = [] } = useBankSchema(salary.country);
  const entries = Object.entries(salary.bankAccount ?? {}).filter(([, value]) => value);
  if (entries.length === 0) return null;
  const labelFor = (key: string) => bankSchema.find((f) => f.key === key)?.label ?? key;

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">
        Bank Details
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {entries.map(([key, value]) => (
          <BankRow key={key} label={labelFor(key)} value={value} />
        ))}
      </div>
    </div>
  );
}
