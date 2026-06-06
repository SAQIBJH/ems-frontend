'use client';

import { useState } from 'react';
import { FlaskConicalIcon, RocketIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { StatsCard } from '@/components/data-display/StatsCard';
import { cn } from '@/lib/utils';

import { useMigrationStatus, useUpdateMigrationStatus } from '@/modules/payroll';

export function GoLivePanel({ canManage }: { canManage: boolean }) {
  const { data: status, isLoading, isError, refetch } = useMigrationStatus();
  const update = useUpdateMigrationStatus();
  const [goLive, setGoLive] = useState('');

  function toggleSandbox(sandboxMode: boolean) {
    update.mutate(
      { sandboxMode },
      {
        onSuccess: () =>
          toast.success(sandboxMode ? 'Sandbox mode enabled.' : 'Sandbox mode disabled — live.'),
        onError: () => toast.error('Failed to update migration status'),
      },
    );
  }

  function saveGoLive() {
    const period = goLive.trim() || null;
    update.mutate(
      { goLivePeriod: period },
      {
        onSuccess: () => toast.success('Go-live period saved.'),
        onError: () => toast.error('Failed to save go-live period'),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }
  if (isError || !status) {
    return <ErrorState message="Failed to load migration status" onRetry={() => refetch()} />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-fg">Go-live</h2>
        <p className="text-xs text-fg-muted">
          Validate configuration in a sandbox, then set the cutover period and go live.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatsCard label="Opening balances" value={status.openingBalancesCount} />
        <StatsCard label="Historical payslips" value={status.historicalPayslipsCount} />
        <StatsCard
          label="Last reconciled run"
          value={status.lastReconciledRunId ? 'Done' : 'None'}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle bg-surface p-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex size-9 items-center justify-center rounded-lg',
              status.sandboxMode ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success',
            )}
          >
            {status.sandboxMode ? (
              <FlaskConicalIcon className="size-4" aria-hidden />
            ) : (
              <RocketIcon className="size-4" aria-hidden />
            )}
          </span>
          <div>
            <p className="text-sm font-medium text-fg">
              {status.sandboxMode ? 'Sandbox (test) mode' : 'Production mode'}
            </p>
            <p className="text-xs text-fg-muted">
              {status.sandboxMode
                ? 'Runs are for validation only — not the system of record.'
                : 'This tenant is the live system of record for payroll.'}
            </p>
          </div>
        </div>
        <Switch
          checked={status.sandboxMode}
          onCheckedChange={toggleSandbox}
          disabled={!canManage || update.isPending}
          aria-label="Sandbox mode"
        />
      </div>

      <div className="space-y-2 rounded-lg border border-subtle bg-surface p-4">
        <Label htmlFor="golive-period">Go-live period</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="golive-period"
            type="month"
            value={goLive || (status.goLivePeriod ?? '')}
            onChange={(e) => setGoLive(e.target.value)}
            disabled={!canManage}
            className="w-44"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={saveGoLive}
            disabled={!canManage || update.isPending}
          >
            Save
          </Button>
          {status.goLivePeriod && (
            <span className="text-xs text-fg-muted">Current: {status.goLivePeriod}</span>
          )}
        </div>
        <p className="text-xs text-fg-muted">
          The first live cycle. Opening balances must be imported before this period for correct
          year-to-date tax.
        </p>
      </div>
    </section>
  );
}
