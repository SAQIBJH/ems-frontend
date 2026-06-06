'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { PlayIcon, SquareIcon, TimerIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

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
import type { ApiError } from '@/types/api';

import { useMyProjects, useTasks } from '../hooks/useProjects';
import { useUpsertTimeEntry } from '../hooks/useTimesheets';
import { getWeekStart } from '../utils/rollups';
import { useTimerStore } from '../store/timer.slice';

interface TimerBarProps {
  /** Employee whose entry the timer logs; omit for the signed-in user (self). */
  employeeId?: string;
}

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
  const { running, startedAt, draft, setDraft, start, reset } = useTimerStore();
  const [nowTick, setNowTick] = useState(0);

  const today = format(new Date(), 'yyyy-MM-dd');
  const week = getWeekStart(today);
  const upsert = useUpsertTimeEntry(week, employeeId);

  const { data: projects = [] } = useMyProjects(employeeId);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(draft.projectId || null);
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
  useEffect(() => {
    if (!draft.projectId) return;
    if (draft.taskId && !tasks.some((t) => t.id === draft.taskId)) setDraft({ taskId: '' });
    const proj = projects.find((p) => p.id === draft.projectId);
    if (proj) setDraft({ billable: proj.billable });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.projectId, tasks]);

  const elapsedMs = running && startedAt ? nowTick - startedAt : 0;

  function handleStart() {
    if (!draft.projectId || !draft.taskId) {
      toast.error('Pick a project and task to start the timer');
      return;
    }
    const now = Date.now();
    setNowTick(now);
    start(now);
  }

  function handleStop() {
    if (!startedAt) return;
    const hours = Math.round((Date.now() - startedAt) / 36_000) / 100; // ms → hours, 2 dp
    if (hours < 0.01) {
      toast.info('Timer too short to log');
      reset();
      return;
    }
    upsert.mutate(
      {
        input: {
          weekStart: week,
          projectId: draft.projectId,
          taskId: draft.taskId,
          date: today,
          hours,
          billable: draft.billable,
          note: draft.note,
          source: 'TIMER',
        },
      },
      {
        onSuccess: () => {
          toast.success(`Logged ${hours}h`);
          reset();
        },
        onError: (err: unknown) => {
          // Keep the timer running so the user can retry (e.g. week got locked).
          const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
          toast.error(apiErr?.message ?? 'Failed to log timer entry');
        },
      },
    );
  }

  return (
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
          <SelectValue placeholder="Project" />
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
        value={draft.taskId}
        onValueChange={(v) => setDraft({ taskId: v ?? '' })}
        disabled={running || !draft.projectId || tasksLoading}
      >
        <SelectTrigger className="h-8 w-[150px]" aria-label="Task">
          <SelectValue
            placeholder={!draft.projectId ? 'Task' : tasksLoading ? 'Loading…' : 'Task'}
          />
        </SelectTrigger>
        <SelectContent>
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
          <Button size="sm" className="h-8" onClick={handleStop} disabled={upsert.isPending}>
            <SquareIcon className="size-3.5" aria-hidden />
            {upsert.isPending ? 'Saving…' : 'Stop'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-fg-muted hover:text-danger"
            onClick={reset}
            disabled={upsert.isPending}
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
          disabled={!draft.projectId || !draft.taskId}
        >
          <PlayIcon className="size-3.5" aria-hidden />
          Start
        </Button>
      )}
    </div>
  );
}
