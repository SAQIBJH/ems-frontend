'use client';

import { useState } from 'react';
import { Building2Icon, PencilIcon, PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useLegalEntities } from '../hooks/useLocalization';
import { usePayrollStore } from '@/store/payroll.store';
import { LegalEntityDrawer } from './LegalEntityDrawer';
import type { LegalEntity } from '../types/localization.types';

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function LegalEntitiesPanel() {
  const { data: entities = [], isLoading, isError, refetch } = useLegalEntities();
  const activeId = usePayrollStore((s) => s.activeLegalEntityId);
  const setActive = usePayrollStore((s) => s.setActiveLegalEntity);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LegalEntity | null>(null);

  // Until the user explicitly picks one, the first entity is treated as active.
  const effectiveActiveId = activeId ?? entities[0]?.id ?? null;

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(entity: LegalEntity) {
    setEditing(entity);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-prose text-sm text-fg-muted">
          Each legal entity operates in a country with its own currency, fiscal year, and statutory
          registrations. The <span className="font-medium text-fg">active</span> entity scopes
          payroll configuration and runs.
        </p>
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <PlusIcon className="size-3.5" aria-hidden />
          Add Entity
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load legal entities" onRetry={() => refetch()} />
      ) : entities.length === 0 ? (
        <EmptyState
          title="No legal entities"
          description="Add a legal entity to run payroll for a country."
          icon={<Building2Icon className="size-6 text-fg-muted" />}
          action={
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-3.5" aria-hidden />
              Add Entity
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-raised/40">
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Entity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Country</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Currency</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">FY start</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Work week</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-fg-muted">Status</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-fg-muted" />
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => {
                const isActive = entity.id === effectiveActiveId;
                return (
                  <tr key={entity.id} className="border-b border-subtle last:border-0">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-fg">{entity.name}</span>
                        {isActive && (
                          <span className="inline-flex items-center rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-fg-muted">{entity.country}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-fg-muted">
                      {entity.currency}
                    </td>
                    <td className="px-3 py-2.5 text-fg-muted">
                      {MONTH_SHORT[entity.fiscalYearStartMonth - 1] ?? entity.fiscalYearStartMonth}
                    </td>
                    <td className="px-3 py-2.5 text-fg-muted">
                      {entity.workWeekPattern === 'MON-SAT' ? 'Mon–Sat' : 'Mon–Fri'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                          entity.active
                            ? 'bg-success/10 text-success'
                            : 'bg-surface-raised text-fg-muted',
                        )}
                      >
                        {entity.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {!isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setActive(entity.id)}
                          >
                            Set active
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Edit ${entity.name}`}
                          onClick={() => openEdit(entity)}
                        >
                          <PencilIcon className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <LegalEntityDrawer open={drawerOpen} onOpenChange={setDrawerOpen} entity={editing} />
    </div>
  );
}
