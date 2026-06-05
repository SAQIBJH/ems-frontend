'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, Loader2Icon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/lib/utils';

import { useEmployeeLoans, useCreateLoan, useForecloseLoan } from '../hooks/useLoans';
import { formatMoney, toMinor } from '../utils/money.utils';
import type { Loan, LoanInterestMethod, LoanStatus, LoanType } from '../types/payroll.types';

const STATUS_STYLES: Record<LoanStatus, string> = {
  ACTIVE: 'bg-info/10 text-info',
  CLOSED: 'bg-success/10 text-success',
  FORECLOSED: 'bg-warning/10 text-warning',
};

const METHOD_LABELS: Record<LoanInterestMethod, string> = {
  REDUCING: 'Reducing balance',
  FLAT: 'Flat',
  ZERO: 'Interest-free',
};

function fmtPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function RequestLoanDialog({
  open,
  onOpenChange,
  employeeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
}) {
  const [type, setType] = useState<LoanType>('LOAN');
  const [method, setMethod] = useState<LoanInterestMethod>('REDUCING');
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('10');
  const [tenure, setTenure] = useState('12');
  const [startPeriod, setStartPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const create = useCreateLoan();

  async function handleSubmit() {
    try {
      await create.mutateAsync({
        employeeId,
        input: {
          type,
          principal: toMinor(Number(principal), 'INR'),
          currency: 'INR',
          interestMethod: type === 'ADVANCE' ? 'ZERO' : method,
          annualRatePct: type === 'ADVANCE' ? 0 : Number(rate),
          tenureMonths: Number(tenure),
          startPeriod,
        },
      });
      toast.success('Loan request created.');
      onOpenChange(false);
    } catch {
      toast.error('Failed to create loan');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request loan / advance</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType((v as LoanType) ?? 'LOAN')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOAN">Loan</SelectItem>
                <SelectItem value="ADVANCE">Salary advance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loan-principal">Principal (₹)</Label>
            <Input
              id="loan-principal"
              type="number"
              min={0}
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </div>
          {type === 'LOAN' && (
            <>
              <div className="space-y-1.5">
                <Label>Interest method</Label>
                <Select
                  value={method}
                  onValueChange={(v) => setMethod((v as LoanInterestMethod) ?? 'REDUCING')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REDUCING">Reducing balance</SelectItem>
                    <SelectItem value="FLAT">Flat</SelectItem>
                    <SelectItem value="ZERO">Interest-free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loan-rate">Rate (% p.a.)</Label>
                <Input
                  id="loan-rate"
                  type="number"
                  min={0}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="loan-tenure">Tenure (months)</Label>
            <Input
              id="loan-tenure"
              type="number"
              min={1}
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loan-start">First EMI</Label>
            <Input
              id="loan-start"
              type="month"
              value={startPeriod}
              onChange={(e) => setStartPeriod(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending || !principal || Number(tenure) < 1}
          >
            {create.isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoanRow({
  loan,
  mode,
  employeeId,
}: {
  loan: Loan;
  mode: 'employee' | 'hr';
  employeeId: string;
}) {
  const [open, setOpen] = useState(false);
  const foreclose = useForecloseLoan();

  async function handleForeclose() {
    try {
      await foreclose.mutateAsync({ employeeId, loanId: loan.id });
      toast.success('Loan foreclosed.');
    } catch {
      toast.error('Failed to foreclose loan');
    }
  }

  return (
    <div className="border-b border-subtle last:border-0">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDownIcon className="size-4 text-fg-muted" aria-hidden />
          ) : (
            <ChevronRightIcon className="size-4 text-fg-muted" aria-hidden />
          )}
          <div>
            <div className="text-sm font-medium text-fg">
              {loan.type === 'ADVANCE' ? 'Salary advance' : 'Loan'} ·{' '}
              {formatMoney(loan.principal, loan.currency)}
            </div>
            <div className="text-xs text-fg-muted">
              {METHOD_LABELS[loan.interestMethod]} · {loan.tenureMonths} months
              {loan.annualRatePct > 0 ? ` · ${loan.annualRatePct}% p.a.` : ''}
            </div>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums text-fg">
              {formatMoney(loan.emiAmount, loan.currency)}
            </div>
            <div className="text-[10px] text-fg-muted">EMI / month</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums text-fg">
              {formatMoney(loan.outstandingBalance, loan.currency)}
            </div>
            <div className="text-[10px] text-fg-muted">Outstanding</div>
          </div>
          <span
            className={cn(
              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
              STATUS_STYLES[loan.status],
            )}
          >
            {loan.status.charAt(0) + loan.status.slice(1).toLowerCase()}
          </span>
          {mode === 'hr' && loan.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleForeclose}
              disabled={foreclose.isPending}
            >
              Foreclose
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="overflow-x-auto px-4 pb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-subtle text-left text-fg-muted">
                <th className="py-1.5 font-medium">#</th>
                <th className="py-1.5 font-medium">Period</th>
                <th className="py-1.5 text-right font-medium">EMI</th>
                <th className="py-1.5 text-right font-medium">Principal</th>
                <th className="py-1.5 text-right font-medium">Interest</th>
                <th className="py-1.5 text-right font-medium">Balance</th>
                <th className="py-1.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {loan.schedule.map((e) => (
                <tr key={e.installmentNo} className="border-b border-subtle/50 last:border-0">
                  <td className="py-1.5 text-fg-muted">{e.installmentNo}</td>
                  <td className="py-1.5 text-fg">{fmtPeriod(e.period)}</td>
                  <td className="py-1.5 text-right text-fg">{formatMoney(e.emi, loan.currency)}</td>
                  <td className="py-1.5 text-right text-fg-muted">
                    {formatMoney(e.principalComponent, loan.currency)}
                  </td>
                  <td className="py-1.5 text-right text-fg-muted">
                    {formatMoney(e.interestComponent, loan.currency)}
                  </td>
                  <td className="py-1.5 text-right text-fg-muted">
                    {formatMoney(e.balanceAfter, loan.currency)}
                  </td>
                  <td className="py-1.5 text-right">
                    <span
                      className={cn(e.status === 'RECOVERED' ? 'text-success' : 'text-fg-muted')}
                    >
                      {e.status === 'RECOVERED' ? 'Recovered' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function LoansCard({ employeeId, mode }: { employeeId: string; mode: 'employee' | 'hr' }) {
  const { data: loans = [], isLoading, isError, refetch } = useEmployeeLoans(employeeId);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-fg">Loans &amp; Advances</h3>
          <p className="text-xs text-fg-muted">
            EMIs are recovered automatically each payroll run.
          </p>
        </div>
        {mode === 'employee' && (
          <Button variant="outline" size="sm" onClick={() => setRequestOpen(true)}>
            <PlusIcon className="size-3.5" aria-hidden />
            Request
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <ErrorState message="Failed to load loans" onRetry={() => refetch()} />
        </div>
      ) : loans.length === 0 ? (
        <EmptyState
          title="No loans or advances"
          description={
            mode === 'employee'
              ? 'Request a loan or salary advance to see its EMI schedule here.'
              : 'This employee has no active loans or advances.'
          }
        />
      ) : (
        <div>
          {loans.map((loan) => (
            <LoanRow key={loan.id} loan={loan} mode={mode} employeeId={employeeId} />
          ))}
        </div>
      )}

      <RequestLoanDialog open={requestOpen} onOpenChange={setRequestOpen} employeeId={employeeId} />
    </div>
  );
}
