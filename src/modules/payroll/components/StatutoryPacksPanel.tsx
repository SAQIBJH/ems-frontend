'use client';

import { useState } from 'react';
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, ScaleIcon, Trash2Icon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useStatutoryPacks, useDeleteStatutoryPack } from '../hooks/useLocalization';
import { StatutoryPackEditor } from './StatutoryPackEditor';
import { StatutoryPackDetailSheet } from './StatutoryPackDetailSheet';
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

  const [detailPack, setDetailPack] = useState<StatutoryPack | null>(null);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [editorPack, setEditorPack] = useState<StatutoryPack | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StatutoryPack | null>(null);
  const deleteMutation = useDeleteStatutoryPack();

  // Country, then newest effective date first.
  const sorted = [...packs].sort((a, b) =>
    a.country !== b.country
      ? a.country.localeCompare(b.country)
      : a.effectiveFrom < b.effectiveFrom
        ? 1
        : -1,
  );

  function openCreate() {
    setEditorMode('create');
    setEditorPack(null);
    setEditorOpen(true);
  }

  function openClone(source: StatutoryPack) {
    setEditorMode('clone');
    setEditorPack(source);
    setEditorOpen(true);
  }

  function openEdit(pack: StatutoryPack) {
    setEditorMode('edit');
    setEditorPack(pack);
    setEditorOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const label = `${deleteTarget.country} ${deleteTarget.version}`;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`Deleted statutory pack ${label}`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        const apiErr = (err as AxiosError<{ error: { code: string; message: string } }>).response
          ?.data?.error;
        if (apiErr?.code === 'PACK_IN_USE') {
          toast.error('This pack is referenced by a legal entity and cannot be deleted.');
        } else {
          toast.error(apiErr?.message ?? 'Failed to delete pack');
        }
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-prose text-sm text-fg-muted">
          A statutory pack bundles a country&apos;s tax regimes, contribution schemes, and local
          taxes into a <span className="font-medium text-fg">versioned, effective-dated</span>{' '}
          record. A mid-year rule change is a new version — each payroll run{' '}
          <span className="font-medium text-fg">pins</span> the version in force for its period, so
          recalculation always reproduces the same numbers.
        </p>
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <PlusIcon className="size-3.5" aria-hidden />
          New pack
        </Button>
      </div>

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
          description="Create a country pack to configure its tax and contribution rules."
          icon={<ScaleIcon className="size-6 text-fg-muted" />}
          action={
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-3.5" aria-hidden />
              New pack
            </Button>
          }
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
                <th className="px-3 py-2 text-right text-xs font-medium text-fg-muted" />
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
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`View ${pack.country} ${pack.version}`}
                          onClick={() => setDetailPack(pack)}
                        >
                          <EyeIcon className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Edit ${pack.country} ${pack.version}`}
                          onClick={() => openEdit(pack)}
                        >
                          <PencilIcon className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Clone ${pack.country} ${pack.version}`}
                          onClick={() => openClone(pack)}
                        >
                          <CopyIcon className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-fg-muted hover:text-danger"
                          aria-label={`Delete ${pack.country} ${pack.version}`}
                          onClick={() => setDeleteTarget(pack)}
                        >
                          <Trash2Icon className="size-3.5" aria-hidden />
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

      <StatutoryPackEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        pack={editorPack}
        allPacks={packs}
      />
      <StatutoryPackDetailSheet
        open={detailPack !== null}
        onOpenChange={(o) => !o && setDetailPack(null)}
        pack={detailPack}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && !deleteMutation.isPending && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.country} {deleteTarget?.version}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the statutory pack. Payroll runs that already pinned this
              version keep their numbers, but it can no longer be selected for new runs. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
