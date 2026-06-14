'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { PlayIcon, SquareIcon, TimerIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useIsClient } from '@/hooks/useIsClient';

import { useMyProjects, useTasks } from '../hooks/useProjects';
import { useTimesheetSettings } from '../hooks/useTimesheets';
import { useTimesheetPermissions } from '../hooks/useTimesheetPermissions';
import { getWeekDays, getWeekStart } from '../utils/rollups';
import { useTimerStore } from '../store/timer.slice';
import { TimeEntryDialog } from './TimeEntryDialog';

interface TimerBarProps {
  /** Employee whose entry the timer logs; omit for the signed-in user (self). */
  employeeId?: string;
}

/** Sentinel for the "No task" Select option (Base UI Select disallows an empty value). */
const NO_TASK = '__none__';

/** Format a millisecond duration as HH:MM:SS. */
function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function TimerBar({ employeeId }: TimerBarProps) {
  const { running, startedAt, draft, setDraft, start, stop, reset } = useTimerStore();
  const isClient = useIsClient();
  // Lazily seed from the current time so a timer restored on refresh shows the
  // correct elapsed immediately; the interval keeps it ticking from there.
  const [nowTick, setNowTick] = useState(() => Date.now());
  // On Stop we freeze the clock and open a confirm dialog pre-filled with the elapsed
  // duration, so the user can correct hours / pick the day / discard before it's saved.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stoppedHours, setStoppedHours] = useState(0);

  const today = format(new Date(), 'yyyy-MM-dd');
  const week = getWeekStart(today);

  const { data: projects = [] } = useMyProjects(employeeId);
  // Settings are HR-only; gate the read (employees would 403). When unknown, the
  // stop→dialog→server path still enforces requireTaskOnEntry.
  const { canAdmin } = useTimesheetPermissions();
  const { data: settings } = useTimesheetSettings({ enabled: canAdmin });
  const requireTask = settings?.requireTaskOnEntry ?? false;
  const { data: tasksData, isLoading: tasksLoading } = useTasks(draft.projectId || null);
  // Keep a stable reference while tasks are loading: `?? []` inline would mint a new
  // array every render, and this array is a useEffect dependency below — an unstable
  // dep there causes the effect's setDraft to re-run forever (max-update-depth crash).
  const tasks = useMemo(() => tasksData ?? [], [tasksData]);
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
  const activeTasks = tasks.filter((t) => t.active);

  // Tick once a second while running so the elapsed display updates. The initial
  // value is set in handleStart (an event handler) to keep the first frame accurate.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Default billable from the chosen project and drop a task that no longer fits.
  // Both setDraft calls are guarded so the effect is a no-op once settled — without
  // the guards, an unconditional setState here re-triggers the effect indefinitely.
  useEffect(() => {
    if (!draft.projectId) return;
    // Only clear a stale task once tasks have actually loaded; the empty array during
    // loading must not wipe a valid selection (e.g. a timer restored on refresh).
    if (draft.taskId && tasksData && !tasks.some((t) => t.id === draft.taskId)) {
      setDraft({ taskId: '' });
    }
    const proj = projects.find((p) => p.id === draft.projectId);
    if (proj && draft.billable !== proj.billable) setDraft({ billable: proj.billable });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.projectId, tasks]);

  const elapsedMs = running && startedAt ? nowTick - startedAt : 0;

  // Gate on client hydration: the persisted timer state is only available on the
  // client, so render a stable placeholder until then (matches the server output).
  if (!isClient) {
    return <div className="h-[52px] rounded-xl border border-subtle bg-surface" aria-hidden />;
  }

  function handleStart() {
    if (!draft.projectId) {
      toast.error('Pick a project to start the timer');
      return;
    }
    if (requireTask && !draft.taskId) {
      toast.error('Pick a task to start the timer');
      return;
    }
    const now = Date.now();
    setNowTick(now);
    start(now);
  }

  function handleStop() {
    if (!startedAt) return;
    const hours = Math.round((Date.now() - startedAt) / 36_000) / 100; // ms → hours, 2 dp
    stop(); // freeze the clock; the draft is kept for the confirm dialog
    if (hours < 0.01) {
      toast.info('Timer too short to log');
      reset();
      return;
    }
    setStoppedHours(hours);
    setConfirmOpen(true);
  }

  return (
    <>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-xl border bg-surface px-3 py-2.5',
          running ? 'border-brand/40' : 'border-subtle',
        )}
      >
        <TimerIcon
          className={cn('size-4 shrink-0', running ? 'text-brand' : 'text-fg-muted')}
          aria-hidden
        />

        <Select
          value={draft.projectId}
          onValueChange={(v) => setDraft({ projectId: v ?? '', taskId: '' })}
          disabled={running}
        >
          <SelectTrigger className="h-8 w-[180px]" aria-label="Project">
            <SelectValue placeholder="Project">
              {(v) => activeProjects.find((p) => p.id === v)?.name ?? 'Project'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activeProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
                <span className="ml-1.5 font-mono text-xs text-fg-muted">{p.code}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={draft.taskId || NO_TASK}
          onValueChange={(v) => setDraft({ taskId: v === NO_TASK ? '' : (v ?? '') })}
          disabled={running || !draft.projectId || tasksLoading}
        >
          <SelectTrigger className="h-8 w-[150px]" aria-label="Task">
            <SelectValue
              placeholder={
                !draft.projectId
                  ? 'Task'
                  : tasksLoading
                    ? 'Loading…'
                    : requireTask
                      ? 'Select task'
                      : 'No task'
              }
            >
              {(v) =>
                v === NO_TASK || !v
                  ? requireTask
                    ? 'Select task'
                    : 'No task'
                  : (activeTasks.find((t) => t.id === v)?.name ??
                    (requireTask ? 'Select task' : 'No task'))
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {!requireTask && <SelectItem value={NO_TASK}>No task</SelectItem>}
            {activeTasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={draft.note}
          onChange={(e) => setDraft({ note: e.target.value })}
          placeholder="What are you working on?"
          className="h-8 min-w-[140px] flex-1"
          aria-label="Note"
        />

        <span
          className={cn(
            'min-w-[84px] text-center font-mono text-sm tabular-nums',
            running ? 'font-semibold text-fg' : 'text-fg-muted',
          )}
        >
          {fmtElapsed(elapsedMs)}
        </span>

        {running ? (
          <>
            <Button size="sm" className="h-8" onClick={handleStop}>
              <SquareIcon className="size-3.5" aria-hidden />
              Stop
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-fg-muted hover:text-danger"
              onClick={reset}
              aria-label="Discard timer"
            >
              <XIcon className="size-4" aria-hidden />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            className="h-8"
            onClick={handleStart}
            disabled={!draft.projectId || (requireTask && !draft.taskId)}
          >
            <PlayIcon className="size-3.5" aria-hidden />
            Start
          </Button>
        )}
      </div>

      {confirmOpen && (
        <TimeEntryDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            setConfirmOpen(open);
            if (!open) reset(); // closing the confirm (save or cancel) clears the draft
          }}
          week={week}
          employeeId={employeeId}
          weekDays={getWeekDays(week)}
          prefill={{
            projectId: draft.projectId,
            taskId: draft.taskId || null,
            date: today,
            hours: stoppedHours,
            billable: draft.billable,
            note: draft.note,
          }}
          source="TIMER"
          title="Log timed entry"
        />
      )}
    </>
  );
}
