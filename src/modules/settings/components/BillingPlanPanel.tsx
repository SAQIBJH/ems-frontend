'use client';

import { format, parseISO } from 'date-fns';
import {
  CheckIcon,
  XIcon,
  UsersIcon,
  HardDriveIcon,
  ZapIcon,
  CreditCardIcon,
  CalendarIcon,
  SparklesIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';

import { useSubscription, usePlans } from '../hooks/useSettings';
import type { BillingPlan, PlanCode, SubscriptionStatus } from '../types/settings.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_024).toFixed(1)} KB`;
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return 'Custom';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

const STATUS_BADGE: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  trialing: { label: 'Trial', className: 'bg-info/10 text-info border-info/20' },
  cancelled: { label: 'Cancelled', className: 'bg-danger/10 text-danger border-danger/20' },
  past_due: { label: 'Past Due', className: 'bg-warning/10 text-warning border-warning/20' },
};

const PLAN_HIGHLIGHT: Record<PlanCode, string> = {
  starter: 'border-subtle',
  professional: 'border-brand ring-1 ring-brand/20',
  enterprise: 'border-subtle',
};

function ProgressBar({
  used,
  total,
  className,
}: {
  used: number;
  total: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  const danger = pct >= 90;
  const warn = pct >= 75;
  return (
    <div
      className={`h-1.5 w-full rounded-full bg-surface-raised overflow-hidden ${className ?? ''}`}
    >
      <div
        className={`h-full rounded-full transition-all ${danger ? 'bg-danger' : warn ? 'bg-warning' : 'bg-brand'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ContactToast() {
  toast.info('Contact your account manager to change your plan.');
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, isCurrent }: { plan: BillingPlan; isCurrent: boolean }) {
  return (
    <div
      className={`relative flex flex-col rounded-lg border p-5 gap-4 ${PLAN_HIGHLIGHT[plan.code]}`}
    >
      {plan.recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-brand text-white whitespace-nowrap">
          Recommended
        </span>
      )}

      <div>
        <p className="text-sm font-semibold text-fg">{plan.name}</p>
        <p className="text-2xl font-bold text-fg mt-0.5">
          {formatPrice(plan.price, plan.currency)}
          {plan.price !== null && (
            <span className="text-sm font-normal text-fg-muted">/{plan.interval}</span>
          )}
        </p>
        {plan.seatsIncluded !== null && (
          <p className="text-xs text-fg-muted mt-0.5">{plan.seatsIncluded} seats included</p>
        )}
      </div>

      <ul className="space-y-1.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-fg-subtle">
            <CheckIcon className="size-3.5 text-success shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        size="sm"
        variant={isCurrent ? 'outline' : plan.recommended ? 'default' : 'outline'}
        className="w-full"
        disabled={isCurrent}
        onClick={isCurrent ? undefined : ContactToast}
      >
        {isCurrent ? 'Current plan' : plan.price === null ? 'Contact sales' : 'Upgrade'}
      </Button>
    </div>
  );
}

// ── Module badge ──────────────────────────────────────────────────────────────

function ModuleBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${enabled ? 'border-success/30 bg-success/5 text-success' : 'border-subtle bg-surface-raised/50 text-fg-disabled'}`}
    >
      {enabled ? <CheckIcon className="size-4 shrink-0" /> : <XIcon className="size-4 shrink-0" />}
      <span className="font-medium">{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BillingPlanPanel() {
  const {
    data: sub,
    isLoading: subLoading,
    isError: subError,
    refetch: refetchSub,
  } = useSubscription();
  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = usePlans();

  if (subLoading || plansLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (subError || plansError) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load billing information."
          onRetry={() => {
            refetchSub();
            refetchPlans();
          }}
        />
      </div>
    );
  }

  if (!sub || !plans) return null;

  const statusBadge = STATUS_BADGE[sub.status];
  const seatPct = Math.round((sub.seats.used / sub.seats.total) * 100);
  const storagePct = Math.round((sub.usage.storage.usedBytes / sub.usage.storage.limitBytes) * 100);
  const apiPct = Math.round((sub.usage.apiCalls.used / sub.usage.apiCalls.limit) * 100);

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* ── Trial banner ── */}
      {sub.trialEndsAt && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-warning/30 bg-warning/5 text-warning text-sm">
          <SparklesIcon className="size-4 shrink-0" />
          <span>
            Trial ends on <strong>{format(parseISO(sub.trialEndsAt), 'MMM d, yyyy')}</strong>. Add a
            payment method to continue after your trial.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-warning/40 text-warning hover:bg-warning/10"
            onClick={ContactToast}
          >
            Add payment method
          </Button>
        </div>
      )}

      {/* ── Current plan card ── */}
      <div className="rounded-lg border border-subtle bg-surface p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <CreditCardIcon className="size-5 text-brand" />
            </div>
            <div>
              <p className="font-semibold text-fg">{sub.plan.name} Plan</p>
              <p className="text-sm text-fg-muted">
                {formatPrice(sub.plan.price, sub.plan.currency)}/{sub.plan.interval}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
            <Button size="sm" variant="outline" onClick={ContactToast}>
              Manage plan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-fg-muted">
            <CalendarIcon className="size-4 text-fg-disabled" />
            <span>
              Current period:{' '}
              <span className="text-fg">
                {format(parseISO(sub.currentPeriod.start), 'MMM d')} –{' '}
                {format(parseISO(sub.currentPeriod.end), 'MMM d, yyyy')}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-fg-muted">
            <CalendarIcon className="size-4 text-fg-disabled" />
            <span>
              Renews on:{' '}
              <span className="text-fg">
                {format(parseISO(sub.nextRenewalDate), 'MMM d, yyyy')}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Usage metrics ── */}
      <div className="rounded-lg border border-subtle bg-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-fg">Usage</h3>

        <div className="space-y-4">
          {/* Seats */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-fg-muted">
                <UsersIcon className="size-4 text-fg-disabled" />
                <span>Seats</span>
              </div>
              <span className="text-fg font-medium">
                {sub.seats.used} / {sub.seats.total}{' '}
                <span className="text-fg-muted font-normal">({seatPct}%)</span>
              </span>
            </div>
            <ProgressBar used={sub.seats.used} total={sub.seats.total} />
            <p className="text-xs text-fg-muted">{sub.seats.available} seats available</p>
          </div>

          {/* Storage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-fg-muted">
                <HardDriveIcon className="size-4 text-fg-disabled" />
                <span>Storage</span>
              </div>
              <span className="text-fg font-medium">
                {formatBytes(sub.usage.storage.usedBytes)} /{' '}
                {formatBytes(sub.usage.storage.limitBytes)}{' '}
                <span className="text-fg-muted font-normal">({storagePct}%)</span>
              </span>
            </div>
            <ProgressBar used={sub.usage.storage.usedBytes} total={sub.usage.storage.limitBytes} />
          </div>

          {/* API calls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-fg-muted">
                <ZapIcon className="size-4 text-fg-disabled" />
                <span>API calls</span>
              </div>
              <span className="text-fg font-medium">
                {sub.usage.apiCalls.used.toLocaleString()} /{' '}
                {sub.usage.apiCalls.limit.toLocaleString()}{' '}
                <span className="text-fg-muted font-normal">({apiPct}%)</span>
              </span>
            </div>
            <ProgressBar used={sub.usage.apiCalls.used} total={sub.usage.apiCalls.limit} />
          </div>
        </div>

        <div className="pt-1">
          <Button size="sm" variant="outline" onClick={ContactToast}>
            Add seats
          </Button>
        </div>
      </div>

      {/* ── Modules ── */}
      <div className="rounded-lg border border-subtle bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Modules</h3>
          <Button size="sm" variant="outline" onClick={ContactToast}>
            Unlock modules
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ModuleBadge label="Payroll" enabled={sub.modules.payroll} />
          <ModuleBadge label="Recruitment" enabled={sub.modules.recruitment} />
          <ModuleBadge label="Performance" enabled={sub.modules.performance} />
        </div>
      </div>

      {/* ── Plan comparison ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-fg">All plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.code} plan={plan} isCurrent={plan.code === sub.plan.code} />
          ))}
        </div>
      </div>
    </div>
  );
}
