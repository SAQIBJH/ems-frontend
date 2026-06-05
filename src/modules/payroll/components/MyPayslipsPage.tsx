'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { EyeIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers';

import { useEmployeePayslips } from '@/modules/payroll';
import { PayslipDrawer } from './PayslipDrawer';
import { TaxDeclarationCard } from './TaxDeclarationCard';
import { LoansCard } from './LoansCard';
import type { PayslipStatus, PayslipSummary } from '../types/payroll.types';

const PAYSLIP_STATUS_CONFIG: Record<PayslipStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'text-warning bg-warning/10' },
  PAID: { label: 'Paid', color: 'text-success bg-success/10' },
  HELD: { label: 'Held', color: 'text-danger bg-danger/10' },
};

function fmtCurrency(amount: number, currency = 'INR'): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

const YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2, current - 3].map(String);
})();

interface PayslipCardProps {
  payslip: PayslipSummary;
  onView: (payslip: PayslipSummary) => void;
}

function PayslipCard({ payslip, onView }: PayslipCardProps) {
  const status = PAYSLIP_STATUS_CONFIG[payslip.status];
  return (
    <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface p-4 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{payslip.periodLabel}</p>
        {payslip.paymentDate && (
          <p className="text-xs text-fg-muted mt-0.5">
            Paid {format(parseISO(payslip.paymentDate), 'dd MMM yyyy')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-base font-semibold text-fg tabular-nums">
            {fmtCurrency(payslip.netPay, payslip.currency)}
          </p>
          <p className="text-[10px] text-fg-muted">Net Pay</p>
        </div>

        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
            status.color,
          )}
        >
          {status.label}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(payslip)}
          aria-label={`View payslip for ${payslip.periodLabel}`}
        >
          <EyeIcon className="size-3.5" aria-hidden />
          View
        </Button>
      </div>
    </div>
  );
}

export function MyPayslipsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState<PayslipSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isEmployee = user?.memberType === 'EMPLOYEE';
  const isHrOrAdmin = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';

  // HR/Admin should not be on this page — redirect to /payroll
  useEffect(() => {
    if (isHrOrAdmin) {
      router.replace('/payroll');
    }
  }, [isHrOrAdmin, router]);

  const { data, isLoading, isError, refetch } = useEmployeePayslips(
    isEmployee ? (user?.employeeId ?? null) : null,
    { year },
  );

  if (isHrOrAdmin) {
    return null;
  }

  function handleView(payslip: PayslipSummary) {
    setSelected(payslip);
    setDrawerOpen(true);
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="My Payslips"
        breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'My Payslips' }]}
      />

      <div className="p-6 space-y-4">
        {/* Year filter */}
        <div className="flex items-center gap-3">
          <label htmlFor="year-select" className="text-sm font-medium text-fg-muted">
            Year
          </label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger id="year-select" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <ErrorState
            message="Failed to load your payslips. Please try again."
            onRetry={() => void refetch()}
          />
        )}

        {/* Empty */}
        {!isLoading && !isError && data?.items.length === 0 && (
          <EmptyState
            title="No payslips yet"
            description="Once payroll is processed, your payslips will appear here."
          />
        )}

        {/* Payslip cards */}
        {!isLoading && !isError && data && data.items.length > 0 && (
          <div className="space-y-3">
            {data.items.map((payslip) => (
              <PayslipCard key={payslip.id} payslip={payslip} onView={handleView} />
            ))}
          </div>
        )}

        {/* Tax declaration — employee self-service */}
        {user?.employeeId && <TaxDeclarationCard employeeId={user.employeeId} mode="employee" />}

        {/* Loans & advances — employee self-service */}
        {user?.employeeId && <LoansCard employeeId={user.employeeId} mode="employee" />}
      </div>

      <PayslipDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        payslipId={selected?.id ?? null}
        employeeId={user?.employeeId ?? null}
      />
    </div>
  );
}
