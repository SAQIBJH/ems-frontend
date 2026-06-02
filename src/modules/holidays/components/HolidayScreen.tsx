'use client';

import { useState } from 'react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

/* ── Type config ─────────────────────────────────────────────────────────── */

const TYPE_PUBLIC = { label: 'Public', color: 'var(--brand-500)' };
const TYPE_OPTIONAL = { label: 'Optional', color: 'var(--info-500)' };

function holidayTypeMeta(h: Holiday) {
  return h.isOptional ? TYPE_OPTIONAL : TYPE_PUBLIC;
}

/* ── Type badge ──────────────────────────────────────────────────────────── */

function TypeBadge({ holiday }: { holiday: Holiday }) {
  const meta = holidayTypeMeta(holiday);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium leading-[16px]"
      style={{
        background: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
        color: meta.color,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: 'currentColor' }} aria-hidden />
      {meta.label}
    </span>
  );
}

/* ── Selected holiday detail card ────────────────────────────────────────── */

function HolidayDetailCard({
  holiday,
  canManage,
  onEdit,
  onDelete,
}: {
  holiday: Holiday;
  canManage: boolean;
  onEdit: (h: Holiday) => void;
  onDelete: (h: Holiday) => void;
}) {
  const meta = holidayTypeMeta(holiday);
  const date = parseISO(holiday.holidayDate);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div
        className="rounded-xl border p-5 text-center"
        style={{
          background: `color-mix(in oklab, ${meta.color} 10%, transparent)`,
          borderColor: `color-mix(in oklab, ${meta.color} 22%, transparent)`,
        }}
      >
        <p
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: meta.color }}
        >
          {meta.label}
        </p>
        <h2 className="text-[22px] font-semibold leading-[30px] tracking-tight text-fg">
          {holiday.name}
        </h2>
        <p className="mt-1.5 font-mono text-sm text-fg-muted">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Info */}
      {holiday.location && (
        <p className="text-[13px] leading-[20px] text-fg-muted">
          Applies to <strong className="font-medium text-fg">{holiday.location}</strong>. Eligible
          employees will see this as a non-working day on their attendance calendar.
        </p>
      )}

      {/* Actions */}
      {canManage && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(holiday)}>
            <PencilIcon className="mr-1.5 size-3.5" aria-hidden />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-danger hover:bg-danger/10 hover:text-danger border-danger/20"
            onClick={() => onDelete(holiday)}
          >
            <Trash2Icon className="mr-1.5 size-3.5" aria-hidden />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Loading skeleton ────────────────────────────────────────────────────── */

function YearGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}

/* ── Main screen ─────────────────────────────────────────────────────────── */

export function HolidayScreen() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useHolidays(year);
  const deleteMutation = useDeleteHoliday(year);

  const canManage = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';

  const holidays = data?.holidays ?? [];
  const sortedHolidays = [...holidays].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));
  const today = startOfDay(new Date());

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
        if (selectedHoliday?.id === deleteTarget.id) setSelectedHoliday(null);
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

  const publicCount = holidays.filter((h) => !h.isOptional).length;
  const optionalCount = holidays.filter((h) => h.isOptional).length;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Holidays"
        description="Company holiday calendar for the year."
        breadcrumbs={[{ label: 'Holidays' }]}
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <UploadIcon className="mr-1.5 size-4 shrink-0" aria-hidden />
                Import .ics
              </Button>
              <Button size="sm" onClick={openAdd}>
                <PlusIcon className="mr-1.5 size-4 shrink-0" aria-hidden />
                Add Holiday
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="space-y-6 px-6 pb-6">
        {/* Year navigation + type legend */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Year nav */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous year"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="w-12 text-center text-sm font-semibold text-fg">{year}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setYear((y) => y + 1)}
              aria-label="Next year"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
            {data && (
              <span className="ml-1 text-xs text-fg-muted">
                {data.total} holiday{data.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Type legend */}
          {(publicCount > 0 || optionalCount > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {publicCount > 0 && (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: `color-mix(in oklab, ${TYPE_PUBLIC.color} 14%, transparent)`,
                    color: TYPE_PUBLIC.color,
                  }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: 'currentColor' }}
                    aria-hidden
                  />
                  Public
                  <span className="font-mono text-[11px] opacity-70">{publicCount}</span>
                </span>
              )}
              {optionalCount > 0 && (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: `color-mix(in oklab, ${TYPE_OPTIONAL.color} 14%, transparent)`,
                    color: TYPE_OPTIONAL.color,
                  }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: 'currentColor' }}
                    aria-hidden
                  />
                  Optional
                  <span className="font-mono text-[11px] opacity-70">{optionalCount}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Year grid */}
        {isLoading && <YearGridSkeleton />}
        {isError && (
          <ErrorState message="Failed to load holidays." onRetry={() => void refetch()} />
        )}
        {!isLoading && !isError && (
          <HolidayYearGrid
            year={year}
            holidays={holidays}
            onMonthClick={handleMonthClick}
            onHolidayClick={setSelectedHoliday}
            selectedDate={
              selectedHoliday
                ? format(parseISO(selectedHoliday.holidayDate), 'yyyy-MM-dd')
                : undefined
            }
          />
        )}

        {/* Bottom: list + detail */}
        {!isLoading && !isError && (
          <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
            {/* Holiday list table */}
            <div className="rounded-xl border border-subtle bg-surface">
              <div className="border-b border-subtle px-4 py-3">
                <h3 className="text-sm font-semibold text-fg">All holidays &middot; {year}</h3>
              </div>
              {sortedHolidays.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No holidays defined"
                    description={`No holidays have been added for ${year} yet.`}
                    action={
                      canManage ? (
                        <button onClick={openAdd} className={cn(buttonVariants({ size: 'sm' }))}>
                          <PlusIcon className="mr-1.5 size-4" aria-hidden />
                          Add Holiday
                        </button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-subtle bg-surface-2">
                      <th className="w-28 px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                        Date
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                        Holiday
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                        Type
                      </th>
                      <th className="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted sm:table-cell">
                        Location
                      </th>
                      {canManage && <th className="w-14 px-4 py-2.5" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {sortedHolidays.map((h) => {
                      const date = parseISO(h.holidayDate);
                      const isPast = isBefore(date, today);
                      const isSelected = selectedHoliday?.id === h.id;

                      return (
                        <tr
                          key={h.id}
                          onClick={() => setSelectedHoliday(isSelected ? null : h)}
                          className={cn(
                            'cursor-pointer transition-colors',
                            isSelected ? 'bg-brand/5' : 'hover:bg-surface-2',
                            isPast && 'opacity-55',
                          )}
                        >
                          <td className="px-4 py-2.5">
                            <p className="font-mono text-[13px] font-medium text-fg tabular-nums">
                              {format(date, 'MMM d')}
                            </p>
                            <p className="text-[11px] text-fg-muted">{format(date, 'EEE')}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[13px] font-medium text-fg">{h.name}</span>
                            {isPast && <span className="ml-2 text-[11px] text-fg-muted">past</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <TypeBadge holiday={h} />
                          </td>
                          <td className="hidden px-4 py-2.5 text-[13px] text-fg-muted sm:table-cell">
                            {h.location ?? '—'}
                          </td>
                          {canManage && (
                            <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                                    'size-7',
                                  )}
                                  aria-label={`Actions for ${h.name}`}
                                >
                                  <MoreHorizontalIcon className="size-3.5" aria-hidden />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(h)}>
                                    <PencilIcon className="mr-2 size-3.5" aria-hidden />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-danger focus:text-danger"
                                    onClick={() => setDeleteTarget(h)}
                                  >
                                    <Trash2Icon className="mr-2 size-3.5" aria-hidden />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Detail panel */}
            <div className="rounded-xl border border-subtle bg-surface">
              <div className="border-b border-subtle px-4 py-3">
                <h3 className="text-sm font-semibold text-fg">Selected</h3>
              </div>
              <div className="p-4">
                {selectedHoliday ? (
                  <HolidayDetailCard
                    holiday={selectedHoliday}
                    canManage={canManage}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ) : (
                  <EmptyState
                    title="No holiday selected"
                    description="Click any holiday in the calendar or list to view details."
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <HolidayFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        year={year}
        holiday={editTarget ?? undefined}
      />

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

      <MonthDetailModal
        open={monthModalOpen}
        onOpenChange={setMonthModalOpen}
        year={year}
        month={selectedMonth}
        holidays={holidays}
      />

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
