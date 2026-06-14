/* ── Timesheet rollups (§27) ───────────────────────────────────────────────────
 * Pure, side-effect-free helpers for the weekly grid: week math + day/week/billable/
 * overtime rollups. Hours are decimal numbers; a week is identified by its Monday
 * (weekStart, YYYY-MM-DD). No I/O here — these are unit-tested in rollups.test.ts.
 */
import { addDays, format, parseISO, startOfWeek } from 'date-fns';

import type { TimeEntry } from '../types/timesheet.types';

/** Round to 2 decimals so floating-point sums stay clean (7.1 + 0.2 → 7.3). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Monday of the week containing `date`, as YYYY-MM-DD. Weeks start on Monday. */
export function getWeekStart(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

/** The 7 day strings (Mon→Sun) for a week identified by its Monday. */
export function getWeekDays(weekStart: string): string[] {
  const monday = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'));
}

/** Sunday of the week (weekEnd), as YYYY-MM-DD. */
export function getWeekEnd(weekStart: string): string {
  return format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd');
}

/** Shift a week's Monday by ±N weeks, returning the new Monday. */
export function shiftWeek(weekStart: string, weeks: number): string {
  return format(addDays(parseISO(weekStart), weeks * 7), 'yyyy-MM-dd');
}

/** Total hours across all entries. */
export function sumHours(entries: TimeEntry[]): number {
  return round2(entries.reduce((acc, e) => acc + e.hours, 0));
}

/** Total hours on billable entries only. */
export function sumBillableHours(entries: TimeEntry[]): number {
  return round2(entries.filter((e) => e.billable).reduce((acc, e) => acc + e.hours, 0));
}

/** Overtime = hours logged beyond the standard week (never negative). */
export function overtimeHours(totalHours: number, standardHours: number): number {
  return round2(Math.max(0, totalHours - standardHours));
}

/** Hours per calendar day: { 'YYYY-MM-DD': hours }. */
export function rollupByDay(entries: TimeEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of entries) {
    map[e.date] = round2((map[e.date] ?? 0) + e.hours);
  }
  return map;
}

/** One grid row per project+task, with per-day hours and the entry that backs each cell. */
export interface GridRow {
  projectId: string;
  /** Null when the row's entries have no task (logged against the project directly). */
  taskId: string | null;
  /** Hours per day keyed by YYYY-MM-DD. */
  byDay: Record<string, number>;
  /** The entry backing each day cell (so a cell click can edit it). */
  entryByDay: Record<string, TimeEntry>;
  /** Row total across the week. */
  total: number;
  /** True if any entry in the row is billable. */
  billable: boolean;
}

/** Group entries into project/task rows with per-day hours and totals. */
export function rollupRows(entries: TimeEntry[]): GridRow[] {
  const rows = new Map<string, GridRow>();
  for (const e of entries) {
    const key = `${e.projectId}::${e.taskId ?? ''}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        projectId: e.projectId,
        taskId: e.taskId,
        byDay: {},
        entryByDay: {},
        total: 0,
        billable: false,
      };
      rows.set(key, row);
    }
    row.byDay[e.date] = round2((row.byDay[e.date] ?? 0) + e.hours);
    row.entryByDay[e.date] = e;
    row.total = round2(row.total + e.hours);
    row.billable = row.billable || e.billable;
  }
  return [...rows.values()];
}
