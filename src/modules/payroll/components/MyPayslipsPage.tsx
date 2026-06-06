'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers';

import { useEmployeePayslips } from '@/modules/payroll';
import { PayslipDrawer } from './PayslipDrawer';
import { CompStatementCard } from './CompStatementCard';
import { TaxDeclarationCard } from './TaxDeclarationCard';
import { TaxFormsCard } from './TaxFormsCard';
import { LoansCard } from './LoansCard';
import { ClaimsCard } from './ClaimsCard';
import type { PayslipStatus, PayslipSummary } from '../types/payroll.types';

const PAYSLIP_STATUS_CONFIG: Record<PayslipStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'text-warning bg-warning/10' },
  PAID: { label: 'Paid', color: 'text-success bg-success/10' },
  HELD: { label: 'Held', color: 'text-danger bg-danger/10' },
};

const TABS = [
  { value: 'payslips', label: 'Payslips' },
  { value: 'comp', label: 'Comp Statement' },
  { value: 'tax', label: 'Tax Declaration' },
  { value: 'claims', label: 'Claims' },
  { value: 'loans', label: 'Loans' },
  { value: 'forms', label: 'Tax Forms' },
] as const;

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

function PayslipCard({
  payslip,
  onView,
}: {
  payslip: PayslipSummary;
  onView: (payslip: PayslipSummary) => void;
}) {
  const status = PAYSLIP_STATUS_CONFIG[payslip.status];
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle bg-surface p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{payslip.periodLabel}</p>
        {payslip.paymentDate && (
          <p className="mt-0.5 text-xs text-fg-muted">
            Paid {format(parseISO(payslip.paymentDate), 'dd MMM yyyy')}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="text-base font-semibold tabular-nums text-fg">
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

function PayslipsTab({ employeeId }: { employeeId: string }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState<PayslipSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useEmployeePayslips(employeeId, { year });

  function handleView(payslip: PayslipSummary) {
    setSelected(payslip);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="year-select" className="text-sm font-medium text-fg-muted">
          Year
        </label>
        <Select value={String(year)} onValueChange={(v) => v && setYear(Number(v))}>
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

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <ErrorState
          message="Failed to load your payslips. Please try again."
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState
          title="No payslips yet"
          description="Once payroll is processed, your payslips will appear here."
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((payslip) => (
            <PayslipCard key={payslip.id} payslip={payslip} onView={handleView} />
          ))}
        </div>
      )}

      <PayslipDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        payslipId={selected?.id ?? null}
        employeeId={employeeId}
      />
    </div>
  );
}

export function MyPayslipsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('payslips'));

  const isHrOrAdmin = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';

  // HR/Admin should not be on the self-service page — redirect to /payroll
  useEffect(() => {
    if (isHrOrAdmin) router.replace('/payroll');
  }, [isHrOrAdmin, router]);

  if (isHrOrAdmin) return null;

  const employeeId = user?.employeeId ?? null;
  const active = TABS.some((t) => t.value === tab) ? tab : 'payslips';

  return (
    <div className="flex flex-col">
      <PageHeader
        title="My Pay"
        description="Your payslips, compensation statement, tax declaration, claims, loans, and annual tax forms."
        breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'My Pay' }]}
      />

      <div className="p-6">
        {!employeeId ? (
          <EmptyState
            title="No employee profile"
            description="Your account is not linked to an employee profile, so pay details are unavailable."
          />
        ) : (
          <Tabs value={active} onValueChange={(v) => setTab(v)}>
            <TabsList className="mb-4">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="payslips">
              <PayslipsTab employeeId={employeeId} />
            </TabsContent>
            <TabsContent value="comp">
              <CompStatementCard employeeId={employeeId} />
            </TabsContent>
            <TabsContent value="tax">
              <TaxDeclarationCard employeeId={employeeId} mode="employee" />
            </TabsContent>
            <TabsContent value="claims">
              <ClaimsCard employeeId={employeeId} mode="employee" />
            </TabsContent>
            <TabsContent value="loans">
              <LoansCard employeeId={employeeId} mode="employee" />
            </TabsContent>
            <TabsContent value="forms">
              <TaxFormsCard employeeId={employeeId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
