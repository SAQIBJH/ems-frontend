import { create } from 'zustand';

/**
 * Client-only timer state (§27 — the timer is the ONLY client-only state in this
 * module; everything else is server state via TanStack Query). It is an in-memory
 * Zustand singleton, so a running timer survives client-side navigation within the
 * session (it resets on a full page reload).
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

export const useTimerStore = create<TimerState>((set) => ({
  running: false,
  startedAt: null,
  draft: EMPTY_DRAFT,
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  start: (startedAt) => set({ running: true, startedAt }),
  stop: () => set({ running: false, startedAt: null }),
  reset: () => set({ running: false, startedAt: null, draft: EMPTY_DRAFT }),
}));
