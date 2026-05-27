'use client';

import { useState, useMemo } from 'react';
import { PlusIcon, PencilIcon, Trash2Icon, CalendarIcon, CoinsIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { cn } from '@/lib/utils';

import {
  usePayGroups,
  useDeletePayGroup,
  usePayrollComponents,
  COMPONENT_TYPE_CONFIG,
  computeComponentBreakdown,
} from '../index';
import type { PayGroup, SalaryComponent, PayGroupComponent } from '../types/payroll.types';
import { PayGroupDrawer } from './PayGroupDrawer';

const SAMPLE_CTC = 1_200_000;

const PAY_SCHEDULE_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  BIWEEKLY: 'Bi-weekly',
  WEEKLY: 'Weekly',
};

function mergeGroupComponents(
  allComponents: SalaryComponent[],
  groupComponents: PayGroupComponent[],
): SalaryComponent[] {
  return groupComponents
    .map((gc) => {
      const base = allComponents.find((c) => c.id === gc.componentId);
      if (!base) return null;
      return {
        ...base,
        calculationType: gc.overrideCalculationType ?? base.calculationType,
        value: gc.overrideValue ?? base.value,
        formula: gc.overrideFormula ?? base.formula,
      };
    })
    .filter((x): x is SalaryComponent => x !== null);
}

export function PayGroupsPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PayGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PayGroup | null>(null);

  const { data: groups = [], isLoading, isError, refetch } = usePayGroups();
  const { data: allComponents = [] } = usePayrollComponents();
  const deleteMutation = useDeletePayGroup();

  const effectiveSelected = useMemo(
    () =>
      selectedId
        ? (groups.find((g) => g.id === selectedId) ?? groups[0] ?? null)
        : (groups[0] ?? null),
    [selectedId, groups],
  );

  const breakdown = useMemo(() => {
    if (!effectiveSelected || !allComponents.length) return new Map<string, number>();
    const merged = mergeGroupComponents(allComponents, effectiveSelected.components);
    const calc = computeComponentBreakdown(merged, SAMPLE_CTC);
    return new Map(calc.map((c) => [c.code, c.monthlyAmount]));
  }, [effectiveSelected, allComponents]);

  function openAdd() {
    setEditTarget(null);
    setDrawerOpen(true);
  }

  function openEdit(group: PayGroup) {
    setEditTarget(group);
    setDrawerOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.name} deleted`);
        if (effectiveSelected?.id === deleteTarget.id) setSelectedId(null);
        setDeleteTarget(null);
      },
      onError: (err) => {
        const apiErr = (
          err as AxiosError<{
            success: false;
            error: {
              code: string;
              message: string;
              details?: Array<{ employeeCount?: number }>;
            };
          }>
        ).response?.data?.error;
        if (apiErr?.code === 'GROUP_HAS_EMPLOYEES') {
          const count = apiErr.details?.[0]?.employeeCount;
          toast.error(
            `Cannot delete: ${count ?? 'some'} employee${count === 1 ? '' : 's'} assigned to this group`,
          );
        } else {
          toast.error(apiErr?.message ?? 'Failed to delete pay group');
        }
        setDeleteTarget(null);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex gap-4">
        <div className="w-72 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="flex-1">
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load pay groups" onRetry={() => refetch()} />;
  }

  return (
    <div className="flex gap-4 min-h-0">
      {/* Left: card list */}
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-fg">Pay Groups</span>
          <Button size="sm" onClick={openAdd}>
            <PlusIcon className="size-3.5" aria-hidden />
            New
          </Button>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            title="No pay groups yet"
            description="Create a pay group to bundle salary components and assign to employees."
            action={
              <Button size="default" onClick={openAdd}>
                <PlusIcon className="size-3.5" aria-hidden />
                New Pay Group
              </Button>
            }
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedId(group.id)}
                className={cn(
                  'w-full text-left rounded-lg border p-3 transition-colors cursor-pointer',
                  effectiveSelected?.id === group.id
                    ? 'border-ring bg-brand/5'
                    : 'border-subtle bg-surface hover:bg-surface-raised',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-fg truncate">{group.name}</p>
                  <span className="shrink-0 text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-surface-raised text-fg-muted">
                    {group.currency}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
                  <CalendarIcon className="size-3 shrink-0" />
                  <span>{PAY_SCHEDULE_LABELS[group.paySchedule] ?? group.paySchedule}</span>
                  <span>·</span>
                  <span>
                    {group.employeeCount} employee{group.employeeCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {!group.active && (
                  <span className="mt-1.5 inline-block text-xs px-1.5 py-0.5 rounded bg-surface-raised text-fg-disabled">
                    Inactive
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: detail panel */}
      <div className="flex-1 min-w-0">
        {effectiveSelected ? (
          <div className="rounded-lg border border-subtle bg-surface">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 border-b border-subtle">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-fg">{effectiveSelected.name}</h2>
                  <span className="font-mono text-xs bg-surface-raised px-1.5 py-0.5 rounded text-fg-muted">
                    {effectiveSelected.code}
                  </span>
                  {!effectiveSelected.active && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-surface-raised text-fg-disabled">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-fg-muted flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-3 shrink-0" />
                    {PAY_SCHEDULE_LABELS[effectiveSelected.paySchedule] ??
                      effectiveSelected.paySchedule}
                  </span>
                  <span className="flex items-center gap-1">
                    <CoinsIcon className="size-3 shrink-0" />
                    {effectiveSelected.currency}
                  </span>
                  <span>
                    {effectiveSelected.employeeCount} employee
                    {effectiveSelected.employeeCount !== 1 ? 's' : ''} assigned
                  </span>
                </div>
                {effectiveSelected.description && (
                  <p className="mt-2 text-sm text-fg-muted">{effectiveSelected.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(effectiveSelected)}>
                  <PencilIcon className="size-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(effectiveSelected)}
                  className="text-danger hover:text-danger hover:bg-danger/10"
                  aria-label={`Delete ${effectiveSelected.name}`}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Component list */}
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted mb-3">
                Components ({effectiveSelected.components.length}) — Sample CTC ₹12,00,000
              </p>

              {effectiveSelected.components.length === 0 ? (
                <EmptyState
                  title="No components"
                  description="Edit this group and select salary components to include."
                  className="py-8"
                />
              ) : (
                <div className="rounded-lg border border-subtle overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-subtle bg-surface-raised/40">
                        <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted">
                          Component
                        </th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted">
                          Type
                        </th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-fg-muted">
                          Override
                        </th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-fg-muted">
                          Monthly
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...effectiveSelected.components]
                        .sort((a, b) => {
                          const oa =
                            allComponents.find((c) => c.id === a.componentId)?.displayOrder ?? 0;
                          const ob =
                            allComponents.find((c) => c.id === b.componentId)?.displayOrder ?? 0;
                          return oa - ob;
                        })
                        .map((gc) => {
                          const cfg = COMPONENT_TYPE_CONFIG[gc.componentType];
                          const hasOverride =
                            gc.overrideCalculationType !== null ||
                            gc.overrideValue !== null ||
                            gc.overrideFormula !== null;
                          const amount = breakdown.get(gc.componentCode);

                          return (
                            <tr
                              key={gc.componentId}
                              className="border-b border-subtle last:border-0"
                            >
                              <td className="px-3 py-2.5">
                                <span className="font-medium text-fg">{gc.componentName}</span>
                                <span className="ml-2 font-mono text-xs text-fg-muted">
                                  {gc.componentCode}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                                    cfg.color,
                                  )}
                                >
                                  {cfg.label}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                {hasOverride ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                                    Overridden
                                  </span>
                                ) : (
                                  <span className="text-xs text-fg-muted">Default</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-fg whitespace-nowrap">
                                {amount !== undefined
                                  ? `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Create / Edit Drawer */}
      <PayGroupDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        group={editTarget}
        onSuccess={(id) => setSelectedId(id)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.name ?? 'pay group'}"?`}
        description="This pay group will be permanently deleted. Groups with employees assigned cannot be deleted."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
