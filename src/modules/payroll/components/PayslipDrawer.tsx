'use client';

import { format, parseISO } from 'date-fns';
import { PrinterIcon } from 'lucide-react';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';

import { useRunPayslip } from '@/modules/payroll';
import type { Payslip } from '@/modules/payroll';

function fmtCurrency(amount: number, currency = 'INR'): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

interface PayslipDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
  payslipId: string | null;
}

export function PayslipDrawer({ open, onOpenChange, runId, payslipId }: PayslipDrawerProps) {
  const {
    data: payslip,
    isLoading,
    isError,
    refetch,
  } = useRunPayslip(open ? runId : null, open ? payslipId : null);

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

          {payslip && !isLoading && <PayslipContent payslip={payslip} />}
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

function PayslipContent({ payslip }: { payslip: Payslip }) {
  const { currency } = payslip;

  return (
    <div className="payslip-print-root space-y-5 px-4 py-4 text-sm">
      {/* Company header */}
      <div className="border-b border-subtle pb-4">
        <p className="font-semibold text-fg">{payslip.company.name}</p>
        <p className="text-xs text-fg-muted">{payslip.company.address}</p>
        <p className="mt-1 text-xs font-medium text-fg-muted">Payslip for {payslip.periodLabel}</p>
      </div>

      {/* Employee info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <p className="text-fg-muted">Name</p>
          <p className="font-medium text-fg">
            {payslip.employee.firstName} {payslip.employee.lastName}
          </p>
        </div>
        <div>
          <p className="text-fg-muted">Employee Code</p>
          <p className="font-mono font-medium text-fg">{payslip.employee.employeeCode}</p>
        </div>
        <div>
          <p className="text-fg-muted">Designation</p>
          <p className="font-medium text-fg">{payslip.employee.designation}</p>
        </div>
        <div>
          <p className="text-fg-muted">Department</p>
          <p className="font-medium text-fg">{payslip.employee.departmentName}</p>
        </div>
        {payslip.employee.panNumber && (
          <div>
            <p className="text-fg-muted">PAN</p>
            <p className="font-mono font-medium text-fg">{payslip.employee.panNumber}</p>
          </div>
        )}
      </div>

      {/* Earnings */}
      <section>
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
          Earnings
        </h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-subtle text-left text-fg-muted">
              <th className="pb-1.5 font-medium">Component</th>
              <th className="pb-1.5 text-right font-medium">Amount</th>
              <th className="pb-1.5 text-right font-medium">Taxable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {payslip.earnings.map((line) => (
              <tr key={line.code}>
                <td className="py-1.5 text-fg">{line.name}</td>
                <td className="py-1.5 text-right tabular-nums text-fg">
                  {fmtCurrency(line.amount, currency)}
                </td>
                <td className="py-1.5 text-right text-fg-muted">{line.taxable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* One-time additions */}
      {payslip.oneTimeAdditions.length > 0 && (
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            One-time Additions
          </h3>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-subtle">
              {payslip.oneTimeAdditions.map((item, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-fg">{item.description}</td>
                  <td className="py-1.5 text-right tabular-nums text-success">
                    +{fmtCurrency(item.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Deductions */}
      <section>
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
          Deductions
        </h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-subtle text-left text-fg-muted">
              <th className="pb-1.5 font-medium">Component</th>
              <th className="pb-1.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {payslip.deductions.map((line) => (
              <tr key={line.code}>
                <td className="py-1.5 text-fg">{line.name}</td>
                <td className="py-1.5 text-right tabular-nums text-danger">
                  −{fmtCurrency(line.amount, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* One-time deductions */}
      {payslip.oneTimeDeductions.length > 0 && (
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            One-time Deductions
          </h3>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-subtle">
              {payslip.oneTimeDeductions.map((item, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-fg">{item.description}</td>
                  <td className="py-1.5 text-right tabular-nums text-danger">
                    −{fmtCurrency(item.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Totals */}
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

      {/* Working days summary */}
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-subtle p-3 text-center">
        <div>
          <p className="text-lg font-semibold text-fg">{payslip.workingDays}</p>
          <p className="text-xs text-fg-muted">Working Days</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-fg">{payslip.presentDays}</p>
          <p className="text-xs text-fg-muted">Present</p>
        </div>
        <div>
          <p
            className={cn('text-lg font-semibold', payslip.lopDays > 0 ? 'text-danger' : 'text-fg')}
          >
            {payslip.lopDays}
          </p>
          <p className="text-xs text-fg-muted">LOP</p>
        </div>
      </div>

      {/* Payment info */}
      {payslip.paymentDate && (
        <p className="text-xs text-fg-muted">
          <span className="font-medium text-fg">Paid on</span>{' '}
          {format(parseISO(payslip.paymentDate), 'dd MMM yyyy')}
          {payslip.paymentReference && ` · Ref: ${payslip.paymentReference}`}
        </p>
      )}
    </div>
  );
}
