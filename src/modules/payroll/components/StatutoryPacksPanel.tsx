'use client';

import { ScaleIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useStatutoryPacks } from '../hooks/useLocalization';
import type { StatutoryPack } from '../types/statutory.types';

type PackStatus = 'ACTIVE' | 'SCHEDULED' | 'SUPERSEDED';

const STATUS_STYLES: Record<PackStatus, string> = {
  ACTIVE: 'bg-success/10 text-success',
  SCHEDULED: 'bg-info/10 text-info',
  SUPERSEDED: 'bg-surface-raised text-fg-muted',
};

const STATUS_LABEL: Record<PackStatus, string> = {
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  SUPERSEDED: 'Superseded',
};

// YYYY-MM-DD strings compare lexically, so plain string comparison is correct.
function packStatus(pack: StatutoryPack, today: string): PackStatus {
  if (pack.effectiveFrom > today) return 'SCHEDULED';
  if (pack.effectiveTo !== null && pack.effectiveTo < today) return 'SUPERSEDED';
  return 'ACTIVE';
}

function fmtDate(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy');
}

function contentsSummary(pack: StatutoryPack): string {
  const count = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`;
  return [
    count(pack.taxRegimes.length, 'regime', 'regimes'),
    count(pack.contributionSchemes.length, 'scheme', 'schemes'),
    count(pack.localTaxes.length, 'local tax', 'local taxes'),
  ].join(' · ');
}

export function StatutoryPacksPanel() {
  const { data: packs = [], isLoading, isError, refetch } = useStatutoryPacks();
  const today = new Date().toISOString().slice(0, 10);

  // Country, then newest effective date first.
  const sorted = [...packs].sort((a, b) =>
    a.country !== b.country
      ? a.country.localeCompare(b.country)
      : a.effectiveFrom < b.effectiveFrom
        ? 1
        : -1,
  );

  return (
    <div className="space-y-4">
      <p className="max-w-prose text-sm text-fg-muted">
        A statutory pack bundles a country&apos;s tax regimes, contribution schemes, and local taxes
        into a <span className="font-medium text-fg">versioned, effective-dated</span> record. A
        mid-year rule change is a new version — each payroll run{' '}
        <span className="font-medium text-fg">pins</span> the version in force for its period, so
        recalculation always reproduces the same numbers.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load statutory packs" onRetry={() => refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No statutory packs"
          description="Seed a country pack to configure its tax and contribution rules."
          icon={<ScaleIcon className="size-6 text-fg-muted" />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-raised/40">
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Country</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Version</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Effective</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Contents</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((pack) => {
                const status = packStatus(pack, today);
                return (
                  <tr key={pack.id} className="border-b border-subtle last:border-0">
                    <td className="px-3 py-2.5 font-medium text-fg">{pack.country}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-fg-muted">{pack.version}</td>
                    <td className="px-3 py-2.5 text-fg-muted">
                      {fmtDate(pack.effectiveFrom)} →{' '}
                      {pack.effectiveTo ? fmtDate(pack.effectiveTo) : 'Open'}
                    </td>
                    <td className="px-3 py-2.5 text-fg-muted">{contentsSummary(pack)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                          STATUS_STYLES[status],
                        )}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
