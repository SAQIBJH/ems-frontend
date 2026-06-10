'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobeIcon, Loader2Icon, AlertTriangleIcon, PlusIcon } from 'lucide-react';
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
import { StatsCard } from '@/components/data-display/StatsCard';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/providers';
import { cn } from '@/lib/utils';

import {
  useWorkers,
  useUpdateWorkerClassification,
  useContractorInvoices,
  useCreateContractorInvoice,
  useDecideContractorInvoice,
  useCostSummary,
  usePayrollPermissions,
  formatMoney,
  toMinor,
} from '@/modules/payroll';
import type {
  WorkerClassification,
  ContractorInvoice,
  ContractorInvoiceStatus,
  CostGroupBy,
} from '@/modules/payroll';

const CLASSIFICATION_STYLES: Record<WorkerClassification, string> = {
  EMPLOYEE: 'bg-info/10 text-info',
  CONTRACTOR: 'bg-warning/10 text-warning',
  EOR: 'bg-brand/10 text-brand',
};

const CLASSIFICATION_LABELS: Record<WorkerClassification, string> = {
  EMPLOYEE: 'Employee',
  CONTRACTOR: 'Contractor',
  EOR: 'EOR',
};

const INVOICE_STYLES: Record<ContractorInvoiceStatus, string> = {
  SUBMITTED: 'bg-surface-raised text-fg-muted',
  APPROVED: 'bg-info/10 text-info',
  PAID: 'bg-success/10 text-success',
};

const GROUP_BY_LABELS: Record<CostGroupBy, string> = {
  classification: 'Worker type',
  entity: 'Legal entity',
  currency: 'Currency',
};

/* ── Cost aggregation ─────────────────────────────────────────────────────── */

function CostSummarySection() {
  const [groupBy, setGroupBy] = useState<CostGroupBy>('classification');
  const { data, isLoading, isError, refetch } = useCostSummary(groupBy);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-fg">Consolidated People Cost</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Group by</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as CostGroupBy)}>
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue>{(v) => GROUP_BY_LABELS[v as CostGroupBy] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(['classification', 'entity', 'currency'] as CostGroupBy[]).map((g) => (
                <SelectItem key={g} value={g}>
                  {GROUP_BY_LABELS[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatsCard
          label={`Total Monthly Cost (${data?.baseCurrency ?? 'INR'})`}
          value={data ? formatMoney(data.totalBaseCost, data.baseCurrency) : '—'}
          loading={isLoading}
        />
        <StatsCard label="Total Workers" value={data?.totalWorkers ?? 0} loading={isLoading} />
        <StatsCard label="Cost Groups" value={data?.groups.length ?? 0} loading={isLoading} />
      </div>

      <div className="rounded-lg border border-subtle bg-surface">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="p-4">
            <ErrorState message="Failed to load cost summary" onRetry={() => refetch()} />
          </div>
        ) : (
          <ul className="divide-y divide-subtle">
            {data.groups.map((g) => {
              const pct = data.totalBaseCost > 0 ? (g.baseAmount / data.totalBaseCost) * 100 : 0;
              return (
                <li key={g.key} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-fg">
                      {GROUP_BY_LABELS[groupBy] === 'Worker type'
                        ? (CLASSIFICATION_LABELS[g.key as WorkerClassification] ?? g.key)
                        : g.key}
                      <span className="ml-2 text-xs text-fg-muted">
                        {g.workerCount} worker{g.workerCount === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="tabular-nums font-semibold text-fg">
                      {formatMoney(g.baseAmount, data.baseCurrency)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {data && (
        <p className="text-xs text-fg-muted">
          Consolidated to {data.baseCurrency} via FX:{' '}
          {Object.entries(data.fxRates)
            .filter(([c]) => c !== data.baseCurrency)
            .map(([c, r]) => `1 ${c} = ${r} ${data.baseCurrency}`)
            .join(' · ')}
        </p>
      )}
    </section>
  );
}

/* ── Workers ──────────────────────────────────────────────────────────────── */

function WorkersSection({ canManage }: { canManage: boolean }) {
  const { data: workers = [], isLoading, isError, refetch } = useWorkers();
  const update = useUpdateWorkerClassification();

  function handleClassify(id: string, classification: WorkerClassification) {
    update.mutate(
      { id, classification },
      {
        onSuccess: () => toast.success('Worker classification updated.'),
        onError: () => toast.error('Failed to update classification'),
      },
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-fg">Workers</h2>
      <div className="rounded-lg border border-subtle bg-surface">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="Failed to load workers" onRetry={() => refetch()} />
          </div>
        ) : workers.length === 0 ? (
          <EmptyState title="No workers" description="No workers are on file for this tenant." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                  <th className="px-4 py-2 font-medium">Worker</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Entity</th>
                  <th className="px-3 py-2 font-medium">Monthly cost</th>
                  <th className="px-3 py-2 font-medium">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-subtle last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-fg">{w.name}</div>
                      <div className="text-xs text-fg-muted">{w.country}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      {canManage ? (
                        <Select
                          value={w.classification}
                          onValueChange={(v) => handleClassify(w.id, v as WorkerClassification)}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue>
                              {(v) => CLASSIFICATION_LABELS[v as WorkerClassification] ?? v}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(['EMPLOYEE', 'CONTRACTOR', 'EOR'] as WorkerClassification[]).map(
                              (c) => (
                                <SelectItem key={c} value={c}>
                                  {CLASSIFICATION_LABELS[c]}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                            CLASSIFICATION_STYLES[w.classification],
                          )}
                        >
                          {CLASSIFICATION_LABELS[w.classification]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-fg-muted">{w.legalEntityName}</td>
                    <td className="px-3 py-2.5 tabular-nums text-fg">
                      {formatMoney(w.monthlyCost, w.currency)}
                    </td>
                    <td className="px-3 py-2.5">
                      {w.riskFlag ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-warning"
                          title={w.riskFlag}
                        >
                          <AlertTriangleIcon className="size-3.5 shrink-0" aria-hidden />
                          Risk
                        </span>
                      ) : (
                        <span className="text-xs text-fg-subtle">—</span>
                      )}
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

/* ── Contractor invoices ──────────────────────────────────────────────────── */

function NewInvoiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: workers = [] } = useWorkers('CONTRACTOR');
  const create = useCreateContractorInvoice();
  const [workerId, setWorkerId] = useState('');
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const [withholding, setWithholding] = useState('0');

  const worker = workers.find((w) => w.id === workerId);

  async function handleSubmit() {
    if (!worker) return;
    try {
      await create.mutateAsync({
        workerId: worker.id,
        period,
        amount: toMinor(Number(amount), worker.currency),
        currency: worker.currency,
        withholdingPct: Number(withholding) || 0,
      });
      toast.success('Invoice submitted.');
      onOpenChange(false);
      setWorkerId('');
      setAmount('');
    } catch {
      toast.error('Failed to submit invoice');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New contractor invoice</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Contractor</Label>
            <Select value={workerId} onValueChange={(v) => setWorkerId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select contractor…">
                  {(v) => workers.find((w) => w.id === v)?.name ?? 'Select contractor…'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {workers.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-period">Period</Label>
            <Input
              id="inv-period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-amount">Amount ({worker?.currency ?? '—'})</Label>
            <Input
              id="inv-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-wht">Withholding (%)</Label>
            <Input
              id="inv-wht"
              type="number"
              min={0}
              max={100}
              value={withholding}
              onChange={(e) => setWithholding(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending || !worker || Number(amount) <= 0}
          >
            {create.isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoicesSection({ canApprove, canPay }: { canApprove: boolean; canPay: boolean }) {
  const { data: invoices = [], isLoading, isError, refetch } = useContractorInvoices();
  const decide = useDecideContractorInvoice();
  const [newOpen, setNewOpen] = useState(false);

  function handleDecide(inv: ContractorInvoice, status: ContractorInvoiceStatus) {
    decide.mutate(
      { id: inv.id, status },
      {
        onSuccess: () => toast.success(status === 'PAID' ? 'Invoice paid.' : 'Invoice approved.'),
        onError: () => toast.error('Failed to update invoice'),
      },
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-fg">Contractor Invoices</h2>
        {canApprove && (
          <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
            <PlusIcon className="size-3.5" aria-hidden />
            New Invoice
          </Button>
        )}
      </div>
      <div className="rounded-lg border border-subtle bg-surface">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="Failed to load invoices" onRetry={() => refetch()} />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices"
            description="Contractor invoices will appear here once submitted."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                  <th className="px-4 py-2 font-medium">Contractor</th>
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">WHT</th>
                  <th className="px-3 py-2 font-medium">Net payable</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-subtle last:border-0">
                    <td className="px-4 py-2.5 font-medium text-fg">{inv.workerName}</td>
                    <td className="px-3 py-2.5 text-fg-muted">{inv.period}</td>
                    <td className="px-3 py-2.5 tabular-nums text-fg">
                      {formatMoney(inv.amount, inv.currency)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-fg-muted">
                      {inv.withholdingPct > 0 ? `${inv.withholdingPct}%` : '—'}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-medium text-fg">
                      {formatMoney(inv.netPayable, inv.currency)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                          INVOICE_STYLES[inv.status],
                        )}
                      >
                        {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {inv.status === 'SUBMITTED' && canApprove && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => handleDecide(inv, 'APPROVED')}
                          disabled={decide.isPending}
                        >
                          Approve
                        </Button>
                      )}
                      {inv.status === 'APPROVED' && canPay && (
                        <Button
                          size="sm"
                          className="h-7"
                          onClick={() => handleDecide(inv, 'PAID')}
                          disabled={decide.isPending}
                        >
                          Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <NewInvoiceDialog open={newOpen} onOpenChange={setNewOpen} />
    </section>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export function GlobalWorkforceScreen() {
  const perms = usePayrollPermissions();
  const { user } = useAuth();
  const router = useRouter();

  // Global Workforce is HR_ADMIN / SUPER_ADMIN only (all its data endpoints 403
  // otherwise). Mirror PayrollScreen/MigrationScreen: send self-service roles to
  // their payslips instead of rendering a page full of 403 error states.
  const isHrOrAdmin = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';
  useEffect(() => {
    if (user && !isHrOrAdmin) router.replace('/payroll/my-payslips');
  }, [user, isHrOrAdmin, router]);
  if (user && !isHrOrAdmin) return null;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Global Workforce"
        description="Employees, contractors, and EOR workers — with FX-consolidated cost."
        breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Global Workforce' }]}
        actions={<GlobeIcon className="size-5 text-fg-muted" aria-hidden />}
      />
      <div className="space-y-8 p-6">
        <CostSummarySection />
        <WorkersSection canManage={perms.canAdjust} />
        <InvoicesSection canApprove={perms.canAdjust} canPay={perms.canDisburse} />
      </div>
    </div>
  );
}
