import type { WeekDay, WorkWeekPattern } from '../types/localization.types';

/** The seven days, Sunday-first (matches calendar grids and lets UAE Sun–Thu read naturally). */
export const WEEK_DAYS: WeekDay[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const DAY_LABEL: Record<WeekDay, string> = {
  SUN: 'Sun',
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
};

/** Expand the legacy coarse enum into a day-set (back-compat reads from older backends). */
export function deriveWorkWeekDays(pattern: WorkWeekPattern): WeekDay[] {
  return pattern === 'MON-SAT'
    ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    : ['MON', 'TUE', 'WED', 'THU', 'FRI'];
}

/**
 * Best-effort collapse of a day-set into the legacy coarse enum, for a backend that still
 * only stores `workWeekPattern`. Lossy for non-Mon-based weeks (e.g. UAE Sun–Thu → MON-FRI):
 * the faithful `workWeekDays[]` is sent alongside for backends that accept it.
 */
export function deriveWorkWeekPattern(days: WeekDay[]): WorkWeekPattern {
  return days.includes('SAT') ? 'MON-SAT' : 'MON-FRI';
}

/** Order an arbitrary day-set into canonical Sunday-first order. */
function ordered(days: WeekDay[]): WeekDay[] {
  return WEEK_DAYS.filter((d) => days.includes(d));
}

/** Human label: a single contiguous run renders as a range ("Sun–Thu"), else a comma list. */
export function formatWorkWeek(days: WeekDay[]): string {
  const list = ordered(days);
  if (list.length === 0) return '—';
  if (list.length === 1) return DAY_LABEL[list[0]];
  const idxs = list.map((d) => WEEK_DAYS.indexOf(d));
  const contiguous = idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
  return contiguous
    ? `${DAY_LABEL[list[0]]}–${DAY_LABEL[list[list.length - 1]]}`
    : list.map((d) => DAY_LABEL[d]).join(', ');
}
