'use client';

import type { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { PrinterIcon } from 'lucide-react';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';

import { useRunPayslip, useEmployeePayslip, usePayslipTemplate } from '@/modules/payroll';
import { DEFAULT_PAYSLIP_TEMPLATE } from '@/modules/payroll';
import type {
  Payslip,
  PayslipTemplate,
  PayslipSectionKey,
  PayslipHeaderFieldKey,
} from '@/modules/payroll';

function makeFmt(locale: string) {
  return (amount: number, currency = 'INR'): string =>
    amount.toLocaleString(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
}

interface PayslipDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslipId: string | null;
  /** HR / run context — provide this OR employeeId, not both. */
  runId?: string | null;
  /** Employee self-service context — provide this OR runId, not both. */
  employeeId?: string | null;
}

export function PayslipDrawer({
  open,
  onOpenChange,
  payslipId,
  runId,
  employeeId,
}: PayslipDrawerProps) {
  const runQuery = useRunPayslip(open && runId ? runId : null, open && runId ? payslipId : null);
  const empQuery = useEmployeePayslip(
    open && employeeId ? employeeId : null,
    open && employeeId ? payslipId : null,
  );
  // The payslip layout is config-driven; fall back to the built-in template until loaded.
  const { data: template } = usePayslipTemplate();

  const { data: payslip, isLoading, isError, refetch } = employeeId ? empQuery : runQuery;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-subtle pb-3">
          <SheetTitle>
            {payslip
              ? `${payslip.employee.firstName} ${payslip.employee.lastName} · ${payslip.periodLabel}`
              : 'Payslip'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-3 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full rounded" />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div className="p-4">
              <ErrorState message="Failed to load payslip" onRetry={() => refetch()} />
            </div>
          )}

          {payslip && !isLoading && (
            <PayslipContent payslip={payslip} template={template ?? DEFAULT_PAYSLIP_TEMPLATE} />
          )}
        </div>

        {payslip && !isLoading && (
          <div className="no-print shrink-0 border-t border-subtle p-4">
            <Button
              variant="outline"
              size="default"
              className="w-full"
              onClick={() => window.print()}
            >
              <PrinterIcon className="size-3.5" aria-hidden />
              Download PDF
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ── Template-driven payslip body ──────────────────────────────────────────── */

function PayslipContent({ payslip, template }: { payslip: Payslip; template: PayslipTemplate }) {
  const { currency } = payslip;
  const locale = template.locale || 'en-IN';
  const fmtCurrency = makeFmt(locale);
  const periodTaxable = payslip.earnings
    .filter((line) => line.taxable)
    .reduce((sum, line) => sum + line.amount, 0);
  const periodTax = payslip.deductions.find((line) => line.code === 'TDS')?.amount ?? 0;

  // Section ordering/visibility is config. Money sections render first, then the always-on
  // Net Pay box, then informational sections — each group honouring template order.
  const enabledByOrder = [...template.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  const labelFor = (key: PayslipSectionKey) =>
    template.sections.find((s) => s.key === key)?.label ?? key;

  const MONEY_KEYS: PayslipSectionKey[] = [
    'earnings',
    'oneTime',
    'deductions',
    'employerContributions',
  ];
  const INFO_KEYS: PayslipSectionKey[] = ['ytd', 'attendance', 'paymentInfo'];

  function renderSection(key: PayslipSectionKey): ReactNode {
    switch (key) {
      case 'earnings':
        return (
          <Section key={key} title={labelFor('earnings')}>
            <LineTable
              rows={payslip.earnings.map((l) => ({
                name: l.name,
                amount: l.amount,
                taxable: l.taxable,
              }))}
              fmt={fmtCurrency}
              currency={currency}
              showTaxable
            />
          </Section>
        );
      case 'oneTime': {
        if (payslip.oneTimeAdditions.length === 0 && payslip.oneTimeDeductions.length === 0)
          return null;
        return (
          <Section key={key} title={labelFor('oneTime')}>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-subtle">
                {payslip.oneTimeAdditions.map((item, i) => (
                  <tr key={`add-${i}`}>
                    <td className="py-1.5 text-fg">{item.description}</td>
                    <td className="py-1.5 text-right tabular-nums text-success">
                      +{fmtCurrency(item.amount, currency)}
                    </td>
                  </tr>
                ))}
                {payslip.oneTimeDeductions.map((item, i) => (
                  <tr key={`ded-${i}`}>
                    <td className="py-1.5 text-fg">{item.description}</td>
                    <td className="py-1.5 text-right tabular-nums text-danger">
                      −{fmtCurrency(item.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        );
      }
      case 'deductions':
        return (
          <Section key={key} title={labelFor('deductions')}>
            <LineTable
              rows={payslip.deductions.map((l) => ({ name: l.name, amount: l.amount }))}
              fmt={fmtCurrency}
              currency={currency}
              negative
            />
          </Section>
        );
      case 'employerContributions': {
        const lines = payslip.employerContributions ?? [];
        if (lines.length === 0) return null;
        return (
          <Section key={key} title={labelFor('employerContributions')}>
            <LineTable
              rows={lines.map((l) => ({ name: l.name, amount: l.amount }))}
              fmt={fmtCurrency}
              currency={currency}
            />
          </Section>
        );
      }
      case 'ytd': {
        if (!payslip.ytd) return null;
        const ytd = payslip.ytd;
        return (
          <Section
            key={key}
            title={`${labelFor('ytd')} · FY ${ytd.fiscalYear}`}
            subtitle={`${ytd.monthsElapsed} ${ytd.monthsElapsed === 1 ? 'month' : 'months'}`}
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-subtle text-left text-fg-muted">
                  <th className="pb-1.5 font-medium">Item</th>
                  <th className="pb-1.5 text-right font-medium">This period</th>
                  <th className="pb-1.5 text-right font-medium">YTD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle tabular-nums">
                <YtdRow
                  label="Gross earnings"
                  period={fmtCurrency(payslip.grossEarnings, currency)}
                  ytd={fmtCurrency(ytd.grossEarnings, currency)}
                />
                <YtdRow
                  label="Taxable income"
                  period={fmtCurrency(periodTaxable, currency)}
                  ytd={fmtCurrency(ytd.taxableIncome, currency)}
                  muted
                />
                <YtdRow
                  label="Tax deducted"
                  period={fmtCurrency(periodTax, currency)}
                  ytd={fmtCurrency(ytd.taxDeducted, currency)}
                  muted
                />
                <YtdRow
                  label="Net pay"
                  period={fmtCurrency(payslip.netPay, currency)}
                  ytd={fmtCurrency(ytd.netPay, currency)}
                />
              </tbody>
            </table>
          </Section>
        );
      }
      case 'attendance':
        return (
          <div
            key={key}
            className="grid grid-cols-3 gap-2 rounded-lg border border-subtle p-3 text-center"
          >
            <Stat value={payslip.workingDays} label="Working Days" />
            <Stat value={payslip.presentDays} label="Present" />
            <Stat value={payslip.lopDays} label="LOP" danger={payslip.lopDays > 0} />
          </div>
        );
      case 'paymentInfo':
        if (!payslip.paymentDate) return null;
        return (
          <p key={key} className="text-xs text-fg-muted">
            <span className="font-medium text-fg">Paid on</span>{' '}
            {format(parseISO(payslip.paymentDate), 'dd MMM yyyy')}
            {payslip.paymentReference && ` · Ref: ${payslip.paymentReference}`}
          </p>
        );
      default:
        return null;
    }
  }

  return (
    <div className="payslip-print-root space-y-5 px-4 py-4 text-sm">
      {/* Company header */}
      <div className="border-b border-subtle pb-4">
        {template.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={template.logoUrl} alt="" className="mb-2 h-8 w-auto object-contain" />
        )}
        <p className="font-semibold text-fg">{payslip.company.name}</p>
        <p className="text-xs text-fg-muted">{payslip.company.address}</p>
        <p className="mt-1 text-xs font-medium text-fg-muted">Payslip for {payslip.periodLabel}</p>
      </div>

      {/* Employee info — fields gated by template config */}
      <PayslipHeaderFields payslip={payslip} template={template} />

      {/* Money sections in configured order */}
      {enabledByOrder.filter((s) => MONEY_KEYS.includes(s.key)).map((s) => renderSection(s.key))}

      {/* Net pay totals — always shown */}
      <div className="rounded-lg bg-surface-raised p-4 space-y-2">
        <div className="flex justify-between text-sm text-fg-muted">
          <span>Gross Earnings</span>
          <span className="tabular-nums">{fmtCurrency(payslip.grossEarnings, currency)}</span>
        </div>
        <div className="flex justify-between text-sm text-danger">
          <span>Total Deductions</span>
          <span className="tabular-nums">−{fmtCurrency(payslip.totalDeductions, currency)}</span>
        </div>
        <div className="flex justify-between border-t border-subtle pt-2 text-base font-bold text-fg">
          <span>Net Pay</span>
          <span className="tabular-nums">{fmtCurrency(payslip.netPay, currency)}</span>
        </div>
      </div>

      {/* Informational sections in configured order */}
      {enabledByOrder.filter((s) => INFO_KEYS.includes(s.key)).map((s) => renderSection(s.key))}
    </div>
  );
}

/* ── small presentational helpers ──────────────────────────────────────────── */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
        {title}
        {subtitle && <span className="ml-1 font-normal normal-case">({subtitle})</span>}
      </h3>
      {children}
    </section>
  );
}

function LineTable({
  rows,
  fmt,
  currency,
  showTaxable,
  negative,
}: {
  rows: { name: string; amount: number; taxable?: boolean }[];
  fmt: (amount: number, currency?: string) => string;
  currency: string;
  showTaxable?: boolean;
  negative?: boolean;
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-subtle text-left text-fg-muted">
          <th className="pb-1.5 font-medium">Component</th>
          <th className="pb-1.5 text-right font-medium">Amount</th>
          {showTaxable && <th className="pb-1.5 text-right font-medium">Taxable</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-subtle">
        {rows.map((line) => (
          <tr key={line.name}>
            <td className="py-1.5 text-fg">{line.name}</td>
            <td
              className={cn('py-1.5 text-right tabular-nums', negative ? 'text-danger' : 'text-fg')}
            >
              {negative ? '−' : ''}
              {fmt(line.amount, currency)}
            </td>
            {showTaxable && (
              <td className="py-1.5 text-right text-fg-muted">{line.taxable ? 'Yes' : 'No'}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function YtdRow({
  label,
  period,
  ytd,
  muted,
}: {
  label: string;
  period: string;
  ytd: string;
  muted?: boolean;
}) {
  return (
    <tr>
      <td className="py-1.5 text-fg">{label}</td>
      <td className={cn('py-1.5 text-right', muted ? 'text-fg-muted' : 'text-fg')}>{period}</td>
      <td className={cn('py-1.5 text-right', muted ? 'text-fg-muted' : 'text-fg')}>{ytd}</td>
    </tr>
  );
}

function Stat({ value, label, danger }: { value: number; label: string; danger?: boolean }) {
  return (
    <div>
      <p className={cn('text-lg font-semibold', danger ? 'text-danger' : 'text-fg')}>{value}</p>
      <p className="text-xs text-fg-muted">{label}</p>
    </div>
  );
}

function PayslipHeaderFields({
  payslip,
  template,
}: {
  payslip: Payslip;
  template: PayslipTemplate;
}) {
  const valueFor = (key: PayslipHeaderFieldKey): { value: string; mono?: boolean } | null => {
    switch (key) {
      case 'employeeCode':
        return { value: payslip.employee.employeeCode, mono: true };
      case 'designation':
        return { value: payslip.employee.designation };
      case 'department':
        return { value: payslip.employee.departmentName };
      case 'pan':
        return payslip.employee.panNumber
          ? { value: payslip.employee.panNumber, mono: true }
          : null;
      case 'payDate':
        return payslip.paymentDate
          ? { value: format(parseISO(payslip.paymentDate), 'dd MMM yyyy') }
          : null;
      case 'paymentRef':
        return payslip.paymentReference ? { value: payslip.paymentReference, mono: true } : null;
      default:
        return null;
    }
  };

  const fields = template.fields
    .filter((f) => f.enabled)
    .map((f) => ({ ...f, resolved: valueFor(f.key) }))
    .filter((f) => f.resolved !== null);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      <div>
        <p className="text-fg-muted">Name</p>
        <p className="font-medium text-fg">
          {payslip.employee.firstName} {payslip.employee.lastName}
        </p>
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          <p className="text-fg-muted">{f.label}</p>
          <p className={cn('font-medium text-fg', f.resolved!.mono && 'font-mono')}>
            {f.resolved!.value}
          </p>
        </div>
      ))}
    </div>
  );
}
