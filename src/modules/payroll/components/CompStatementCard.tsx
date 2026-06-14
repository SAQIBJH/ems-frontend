'use client';

import type { AxiosError } from 'axios';

import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';

import { useEmployeeSalary } from '../hooks/useEmployeeSalary';
import { COMPONENT_TYPE_CONFIG } from '../constants';
import { formatMajor } from '../utils/money.utils';

// Guarded against non-ISO currency sentinels via the shared formatter.
function fmtMoney(amount: number, currency = 'INR'): string {
  return formatMajor(amount, currency, { fractionDigits: 0 });
}

/**
 * Self-service annual compensation statement (§13) — the employee's own CTC breakup,
 * read-only. Currency comes from the pay group; no country assumptions in the view.
 */
export function CompStatementCard({ employeeId }: { employeeId: string }) {
  const { data: salary, isLoading, isError, error, refetch } = useEmployeeSalary(employeeId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  const isNotAssigned = isError && (error as AxiosError)?.response?.status === 404;
  if (isError && !isNotAssigned) {
    return (
      <ErrorState message="Failed to load your compensation statement" onRetry={() => refetch()} />
    );
  }
  if (!salary || isNotAssigned) {
    return (
      <EmptyState
        title="No compensation statement"
        description="Your salary structure has not been set up yet. Please contact HR."
      />
    );
  }

  const currency = salary.payGroup.currency;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">Annual CTC</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">
            {fmtMoney(salary.annualCtc, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">Monthly gross</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">
            {fmtMoney(salary.monthlyGross, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-subtle bg-surface p-4">
          <p className="text-xs text-fg-muted">Monthly net</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">
            {fmtMoney(salary.monthlyNet, currency)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-subtle">
        <div className="border-b border-subtle bg-surface-raised/40 px-4 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
            Component breakdown — {salary.payGroup.name}
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-surface-raised/20">
              <th className="px-4 py-2 text-left text-xs font-medium text-fg-muted">Component</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-fg-muted">Type</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-fg-muted">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {salary.calculatedComponents.map((cc) => {
              const cfg = COMPONENT_TYPE_CONFIG[cc.type] ?? {
                label: cc.type,
                color: 'text-fg-muted bg-surface-raised',
                icon: '?',
              };
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
                  <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap text-fg">
                    {fmtMoney(cc.monthlyAmount, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-subtle bg-surface-raised/20">
              <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-fg-muted">
                Gross earnings
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-success">
                {fmtMoney(salary.monthlyGross, currency)}
              </td>
            </tr>
            <tr className="border-t border-subtle/50">
              <td colSpan={2} className="px-4 py-2 text-xs font-medium text-fg-muted">
                Total deductions
              </td>
              <td className="px-4 py-2 text-right text-sm font-medium tabular-nums text-danger">
                −{fmtMoney(salary.monthlyDeductions, currency)}
              </td>
            </tr>
            <tr className="border-t-2 border-subtle">
              <td colSpan={2} className="px-4 py-3 text-sm font-bold text-fg">
                Net pay / month
              </td>
              <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-fg">
                {fmtMoney(salary.monthlyNet, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
