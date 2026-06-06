'use client';

import { useState } from 'react';
import { Loader2Icon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';

import { useDataPolicy, useUpdateDataPolicy } from '../hooks/useCompliance';
import type { DataPolicy, DataResidencyPolicy } from '../types/payroll.types';

function DataPolicyForm({ initial }: { initial: DataPolicy }) {
  const update = useUpdateDataPolicy();
  const [defaultRetention, setDefaultRetention] = useState(String(initial.defaultRetentionYears));
  const [policies, setPolicies] = useState<DataResidencyPolicy[]>(initial.policies);

  function patchPolicy(country: string, patch: Partial<DataResidencyPolicy>) {
    setPolicies((prev) => prev.map((p) => (p.country === country ? { ...p, ...patch } : p)));
  }

  function handleSave() {
    update.mutate(
      {
        defaultRetentionYears: Math.max(1, Number(defaultRetention) || 7),
        policies,
      },
      {
        onSuccess: () => toast.success('Data policy saved.'),
        onError: () => toast.error('Failed to save data policy'),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-fg">Data Policy</h2>
        <p className="mt-0.5 text-sm text-fg-muted">Residency & retention by country.</p>
      </div>
      <p className="max-w-prose text-sm text-fg-muted">
        Where each country&apos;s payroll data is stored and how long it is retained. Some
        jurisdictions require data to <span className="font-medium text-fg">stay in-country</span>;
        a <span className="font-medium text-fg">statutory hold</span> overrides retention-based
        deletion.
      </p>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-subtle bg-surface p-4">
        <div className="space-y-1.5">
          <Label htmlFor="default-retention">Default retention (years)</Label>
          <Input
            id="default-retention"
            type="number"
            min={1}
            max={30}
            value={defaultRetention}
            onChange={(e) => setDefaultRetention(e.target.value)}
            className="w-32"
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <ShieldCheckIcon className="size-3.5" aria-hidden />
          Applied to countries without a specific policy.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-subtle">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-surface-raised/40">
              <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Country</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">
                Residency region
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">
                Retention (yrs)
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">
                Statutory hold
              </th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.country} className="border-b border-subtle last:border-0">
                <td className="px-3 py-2.5 font-medium text-fg">{p.country}</td>
                <td className="px-3 py-2.5">
                  <Input
                    value={p.residencyRegion}
                    onChange={(e) => patchPolicy(p.country, { residencyRegion: e.target.value })}
                    className="h-8 w-40"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={p.retentionYears}
                    onChange={(e) =>
                      patchPolicy(p.country, { retentionYears: Number(e.target.value) || 1 })
                    }
                    className="h-8 w-24"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Switch
                    checked={p.statutoryHold}
                    onCheckedChange={(v) => patchPolicy(p.country, { statutoryHold: v })}
                    aria-label={`Statutory hold for ${p.country}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={update.isPending}>
          {update.isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

export function DataPolicyPanel() {
  const { data, isLoading, isError, refetch } = useDataPolicy();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }
  if (isError || !data) {
    return <ErrorState message="Failed to load data policy" onRetry={() => refetch()} />;
  }

  // Key on updatedAt so a save (which bumps it) reseeds the form with server truth.
  return <DataPolicyForm key={data.updatedAt} initial={data} />;
}
