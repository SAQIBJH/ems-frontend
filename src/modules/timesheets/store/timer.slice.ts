import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Client-only timer state (§27 — the timer is the ONLY client-only state in this
 * module; everything else is server state via TanStack Query). Persisted to
 * sessionStorage so a running timer survives client-side navigation AND a full page
 * refresh within the same browser session (it clears when the session ends).
 * Consumers must gate rendering on `useIsClient()` to avoid a hydration mismatch.
 *
 * The timer holds no hours of its own — on **stop** the elapsed duration is posted
 * as an ordinary `TimeEntry` (`source: TIMER`). There is no separate timer hours
 * store, so nothing is ever double-counted.
 */
export interface TimerDraft {
  projectId: string;
  taskId: string;
  note: string;
  billable: boolean;
}

const EMPTY_DRAFT: TimerDraft = { projectId: '', taskId: '', note: '', billable: true };

interface TimerState {
  running: boolean;
  /** Epoch ms when the timer was started; null when idle. */
  startedAt: number | null;
  draft: TimerDraft;
  setDraft: (patch: Partial<TimerDraft>) => void;
  /** Begin timing (caller passes Date.now() and ensures a project/task is chosen). */
  start: (startedAt: number) => void;
  /** Stop without clearing the draft (caller reads `startedAt` first to log the entry). */
  stop: () => void;
  /** Clear everything back to idle. */
  reset: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      running: false,
      startedAt: null,
      draft: EMPTY_DRAFT,
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      start: (startedAt) => set({ running: true, startedAt }),
      stop: () => set({ running: false, startedAt: null }),
      reset: () => set({ running: false, startedAt: null, draft: EMPTY_DRAFT }),
    }),
    {
      name: 'ems-timesheet-timer',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.sessionStorage : (undefined as unknown as Storage),
      ),
    },
  ),
);
