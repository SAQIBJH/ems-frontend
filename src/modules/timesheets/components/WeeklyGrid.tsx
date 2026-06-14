'use client';

import { useMemo, useState } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { useQueries } from '@tanstack/react-query';
import { format, isWithinInterval, parseISO } from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  LockIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import type { ApiError } from '@/types/api';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { StatsCard } from '@/components/data-display/StatsCard';
import { cn } from '@/lib/utils';

import { useMyProjects, TIMESHEET_KEYS } from '../hooks/useProjects';
import { projectsApi } from '../services/projects.api';
import { useWeekTimesheet, useDeleteTimeEntry, useCopyWeek } from '../hooks/useTimesheets';
import {
  getWeekStart,
  getWeekDays,
  getWeekEnd,
  shiftWeek,
  rollupRows,
  rollupByDay,
  type GridRow,
} from '../utils/rollups';
import { useTimesheetPermissions } from '../hooks/useTimesheetPermissions';
import type { Task, TimeEntry } from '../types/timesheet.types';
import { TimeEntryDialog } from './TimeEntryDialog';
import { TimesheetStatusBadge } from './TimesheetStatusBadge';
import { TimesheetSubmitBar } from './TimesheetSubmitBar';

interface WeeklyGridProps {
  /** Employee whose week this is; omit for the signed-in user (self). */
  employeeId?: string;
}

/** Hours are pre-rounded to 2 dp by the rollups; render the number as-is. */
function fmtHours(h: number): string {
  return String(h);
}

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function WeeklyGrid({ employeeId }: WeeklyGridProps) {
  // Seed the week from a `?week=` deep-link (e.g. a reminder notification) once on
  // mount; week-arrow navigation thereafter is local state. Falls back to this week.
  const [weekParam] = useQueryState('week', parseAsString);
  const [week, setWeek] = useState(() =>
    getWeekStart(weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekParam : todayStr()),
  );
  const { data: timesheet, isLoading, isError, refetch } = useWeekTimesheet(week, employeeId);
  const { data: projects = [] } = useMyProjects(employeeId);
  const deleteEntry = useDeleteTimeEntry(week, employeeId);
  const copyWeek = useCopyWeek(week, employeeId);

  const [dialog, setDialog] = useState<{
    open: boolean;
    existing: TimeEntry | null;
    prefill?: { projectId?: string; taskId?: string | null; date?: string };
  }>({ open: false, existing: null });

  const weekDays = useMemo(() => getWeekDays(week), [week]);
  const entries = useMemo(() => timesheet?.entries ?? [], [timesheet]);
  const rows = useMemo(() => rollupRows(entries), [entries]);
  const dayTotals = useMemo(() => rollupByDay(entries), [entries]);

  // Resolve task names for every project that appears in the grid.
  const projectIds = useMemo(() => [...new Set(rows.map((r) => r.projectId))], [rows]);
  const taskQueries = useQueries({
    queries: projectIds.map((pid) => ({
      queryKey: TIMESHEET_KEYS.tasks(pid),
      queryFn: () => projectsApi.listTasks(pid),
    })),
  });
  const taskMap = useMemo(() => {
    const m = new Map<string, Task>();
    taskQueries.forEach((q) => q.data?.forEach((t) => m.set(t.id, t)));
    return m;
  }, [taskQueries]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const perms = useTimesheetPermissions();
  const status = timesheet?.status ?? 'DRAFT';
  const editable = status === 'DRAFT' || status === 'REJECTED';

  const weekLabel = `${format(parseISO(week), 'MMM d')} – ${format(parseISO(getWeekEnd(week)), 'MMM d, yyyy')}`;

  function openNew() {
    const inWeek = isWithinInterval(parseISO(todayStr()), {
      start: parseISO(week),
      end: parseISO(getWeekEnd(week)),
    });
    setDialog({
      open: true,
      existing: null,
      prefill: { date: inWeek ? todayStr() : weekDays[0] },
    });
  }
  function openCell(row: GridRow, day: string) {
    if (!editable) return;
    const existing = row.entryByDay[day] ?? null;
    setDialog({
      open: true,
      existing,
      prefill: existing ? undefined : { projectId: row.projectId, taskId: row.taskId, date: day },
    });
  }
  function handleDelete(entry: TimeEntry) {
    deleteEntry.mutate(entry.id, {
      onSuccess: () => toast.success('Entry removed'),
      onError: () => toast.error('Failed to remove entry'),
    });
  }
  function handleCopyLastWeek() {
    copyWeek.mutate(
      { fromWeekStart: shiftWeek(week, -1), toWeekStart: week },
      {
        onSuccess: () => toast.success("Copied last week's rows — fill in the hours"),
        onError: (err: unknown) => {
          const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
          toast.error(apiErr?.message ?? "Couldn't copy last week");
        },
      },
    );
  }

  /* ── Week navigation bar (shared across states) ─────────────────────────────── */
  const nav = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => setWeek((w) => shiftWeek(w, -1))}
          aria-label="Previous week"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setWeek(getWeekStart(todayStr()))}
        >
          This week
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => setWeek((w) => shiftWeek(w, 1))}
          aria-label="Next week"
        >
          <ChevronRightIcon className="size-4" aria-hidden />
        </Button>
        <span className="ml-1 text-sm font-medium text-fg">{weekLabel}</span>
        <TimesheetStatusBadge status={status} />
      </div>
      {editable && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLastWeek}
            disabled={copyWeek.isPending}
          >
            <CopyIcon className="size-3.5" aria-hidden />
            {copyWeek.isPending ? 'Copying…' : 'Copy last week'}
          </Button>
          <Button size="sm" onClick={openNew}>
            <PlusIcon className="size-3.5" aria-hidden />
            Log time
          </Button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {nav}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        {nav}
        <ErrorState message="We couldn't load this week's timesheet." onRetry={() => refetch()} />
      </div>
    );
  }

  const total = timesheet?.totalHours ?? 0;
  const billable = timesheet?.billableHours ?? 0;
  const overtime = timesheet?.overtimeHours ?? 0;
  const standard = timesheet?.standardHours ?? 0;

  return (
    <div className="space-y-4">
      {nav}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard label="Total hours" value={`${fmtHours(total)}h`} accent="var(--brand-500)" />
        <StatsCard label="Billable" value={`${fmtHours(billable)}h`} accent="var(--success-500)" />
        <StatsCard label="Overtime" value={`${fmtHours(overtime)}h`} accent="var(--warning-500)" />
        <StatsCard label="Standard week" value={`${fmtHours(standard)}h`} />
      </div>

      {/* Submit / decision state */}
      {timesheet && (
        <TimesheetSubmitBar
          timesheet={timesheet}
          week={week}
          employeeId={employeeId}
          canWrite={perms.canWrite}
        />
      )}

      {/* Read-only clarity (B5): locked weeks disable cells — say why so clicks aren't a mystery. */}
      {!editable && rows.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <LockIcon className="size-3.5" aria-hidden />
          {status === 'APPROVED'
            ? 'This week is approved and read-only.'
            : 'This week is submitted for approval and read-only until a decision is made.'}
        </p>
      )}

      {/* Grid */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-subtle bg-surface">
          <EmptyState
            title="No time logged this week"
            description={
              editable
                ? 'Log hours against a project to start building your timesheet.'
                : 'This week has no entries.'
            }
            illustration={<ClockIcon className="size-8 text-fg-muted" />}
            action={
              editable ? (
                <Button size="sm" onClick={openNew}>
                  <PlusIcon className="size-3.5" aria-hidden />
                  Log time
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-subtle bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-4 py-3 text-left font-medium text-fg-muted">Project / Task</th>
                {weekDays.map((d) => (
                  <th key={d} className="px-2 py-3 text-center font-medium text-fg-muted">
                    <div>{format(parseISO(d), 'EEE')}</div>
                    <div className="text-xs font-normal">{format(parseISO(d), 'd')}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-fg-muted">Total</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const project = projectMap.get(row.projectId);
                const task = row.taskId ? taskMap.get(row.taskId) : undefined;
                const rowEntryForDelete = Object.values(row.entryByDay)[0];
                return (
                  <tr
                    key={`${row.projectId}::${row.taskId ?? ''}`}
                    className="border-b border-subtle last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-fg">{project?.name ?? 'Project'}</div>
                      <div className="text-xs text-fg-muted">
                        {row.taskId ? (task?.name ?? 'Task') : 'No task'}
                      </div>
                    </td>
                    {weekDays.map((d) => {
                      const hours = row.byDay[d];
                      return (
                        <td key={d} className="px-2 py-2.5 text-center">
                          <button
                            type="button"
                            disabled={!editable}
                            onClick={() => openCell(row, d)}
                            className={cn(
                              'mx-auto flex h-8 w-12 items-center justify-center rounded-md text-sm transition-colors',
                              hours
                                ? 'font-medium text-fg hover:bg-surface-raised'
                                : 'text-fg-subtle hover:bg-surface-raised',
                              !editable && 'cursor-default hover:bg-transparent',
                            )}
                            aria-label={
                              hours
                                ? `Edit ${fmtHours(hours)}h`
                                : `Add time for ${format(parseISO(d), 'EEE')}`
                            }
                          >
                            {hours ? fmtHours(hours) : editable ? '+' : '—'}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-right font-medium text-fg">
                      {fmtHours(row.total)}h
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      {editable && rowEntryForDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-fg-muted hover:text-danger"
                          onClick={() => handleDelete(rowEntryForDelete)}
                          disabled={deleteEntry.isPending}
                          aria-label="Remove row"
                        >
                          <Trash2Icon className="size-3.5" aria-hidden />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-subtle bg-surface-raised/40">
                <td className="px-4 py-3 text-left font-medium text-fg-muted">Daily total</td>
                {weekDays.map((d) => (
                  <td key={d} className="px-2 py-3 text-center font-medium text-fg">
                    {dayTotals[d] ? `${fmtHours(dayTotals[d])}` : '—'}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold text-fg">{fmtHours(total)}h</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {dialog.open && (
        <TimeEntryDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
          week={week}
          employeeId={employeeId}
          weekDays={weekDays}
          existing={dialog.existing}
          prefill={dialog.prefill}
        />
      )}
    </div>
  );
}
