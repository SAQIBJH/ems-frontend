'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  LayoutGridIcon,
  ListIcon,
  UploadIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { NoHolidaysIllustration } from '@/components/feedback/illustrations';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';
import { cn } from '@/lib/utils';
import type { ApiError } from '@/types/api';

import { useHolidays } from '../hooks/useHolidays';
import { useDeleteHoliday } from '../hooks/useHolidayMutations';
import type { Holiday } from '../types/holiday.types';
import { HolidayYearGrid } from './HolidayYearGrid';
import { HolidayFormDialog } from './HolidayFormDialog';
import { MonthDetailModal } from './MonthDetailModal';
import { IcsImportDialog } from './IcsImportDialog';

type View = 'grid' | 'list';

export function HolidayScreen() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [view, setView] = useState<View>('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useHolidays(year);
  const deleteMutation = useDeleteHoliday(year);

  const canManage = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';

  function openAdd() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(holiday: Holiday) {
    setEditTarget(holiday);
    setFormOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Holiday deleted');
        setDeleteTarget(null);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to delete holiday');
        setDeleteTarget(null);
      },
    });
  }

  function handleMonthClick(month: number) {
    setSelectedMonth(month);
    setMonthModalOpen(true);
  }

  const holidays = data?.holidays ?? [];

  const sortedHolidays = [...holidays].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Holidays"
        description="Public and optional holidays for the year."
        breadcrumbs={[{ label: 'Holidays' }]}
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="default" onClick={() => setImportOpen(true)}>
                <UploadIcon className="size-4 mr-1.5" />
                Import .ics
              </Button>
              <Button size="default" onClick={openAdd}>
                <PlusIcon className="size-4 mr-1.5" />
                Add Holiday
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="p-6 space-y-6">
        {/* Toolbar: year navigator + view toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-semibold text-fg w-12 text-center">{year}</span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          {data && (
            <span className="text-xs text-fg-subtle">
              {data.total} holiday{data.total !== 1 ? 's' : ''}
            </span>
          )}

          {/* View toggle — right-aligned */}
          <div className="ml-auto flex items-center rounded-md border border-subtle p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                view === 'grid'
                  ? 'bg-surface-raised text-fg shadow-xs'
                  : 'text-fg-subtle hover:text-fg',
              )}
              aria-pressed={view === 'grid'}
            >
              <LayoutGridIcon className="size-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                view === 'list'
                  ? 'bg-surface-raised text-fg shadow-xs'
                  : 'text-fg-subtle hover:text-fg',
              )}
              aria-pressed={view === 'list'}
            >
              <ListIcon className="size-3.5" />
              List
            </button>
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'space-y-2'
            }
          >
            {Array.from({ length: view === 'grid' ? 12 : 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg border border-subtle bg-surface animate-pulse',
                  view === 'grid' ? 'h-44' : 'h-10',
                )}
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <ErrorState message="Failed to load holidays." onRetry={() => void refetch()} />
        )}

        {/* Grid view — default */}
        {!isLoading && !isError && view === 'grid' && (
          <HolidayYearGrid year={year} holidays={holidays} onMonthClick={handleMonthClick} />
        )}

        {/* List view */}
        {!isLoading && !isError && view === 'list' && (
          <section>
            {holidays.length === 0 ? (
              <EmptyState
                illustration={<NoHolidaysIllustration />}
                title="No holidays defined"
                description={`No holidays have been added for ${year} yet.`}
                action={
                  canManage ? (
                    <Button size="default" onClick={openAdd}>
                      <PlusIcon className="size-4 mr-1.5" />
                      Add Holiday
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="rounded-lg border border-subtle overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-subtle bg-surface-raised">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-fg-subtle">
                        Date
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-fg-subtle">
                        Name
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-fg-subtle">
                        Location
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-fg-subtle">
                        Type
                      </th>
                      {canManage && (
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-fg-subtle">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHolidays.map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-subtle last:border-0 hover:bg-surface-raised/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-fg-subtle tabular-nums">
                          {format(parseISO(h.holidayDate), 'dd MMM')}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-fg">{h.name}</td>
                        <td className="px-4 py-2.5 text-fg-subtle">{h.location ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          {h.isOptional ? (
                            <Badge
                              variant="outline"
                              className="text-info border-info/30 bg-info/10 text-xs"
                            >
                              Optional
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-success border-success/30 bg-success/10 text-xs"
                            >
                              Public
                            </Badge>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => openEdit(h)}
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-danger hover:text-danger"
                                onClick={() => setDeleteTarget(h)}
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Add / Edit dialog */}
      <HolidayFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        year={year}
        holiday={editTarget ?? undefined}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Holiday"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}" on ${format(parseISO(deleteTarget.holidayDate), 'dd MMM yyyy')}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />

      {/* Month detail modal */}
      <MonthDetailModal
        open={monthModalOpen}
        onOpenChange={setMonthModalOpen}
        year={year}
        month={selectedMonth}
        holidays={holidays}
      />

      {/* .ics import dialog */}
      {canManage && (
        <IcsImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={() => void refetch()}
        />
      )}
    </div>
  );
}
