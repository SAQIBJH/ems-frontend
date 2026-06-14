/**
 * Proration determines how much of a period an employee is paid for, based on a
 * configurable basis. Loss-of-pay (LOP) days reduce the payable days. The basis is
 * a per-statutory-pack policy (§3.2); the engine never hardcodes "30 days" or
 * "working days" — it reads the basis.
 */

import type { WeekDay } from '../types/localization.types';

export type ProrationBasis = 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_30';

/** JS `Date.getDay()` (0=Sun..6=Sat) → our WeekDay code. */
const DOW_NAME: WeekDay[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DEFAULT_WORK_WEEK: WeekDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

/** Calendar days in a month (month is 1–12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Count working days in a month for a given work week (any pattern — UAE Sun–Thu,
 * Mon–Sat, 4-day, …). Defaults to Mon–Fri when no week is supplied (back-compat).
 */
export function workingDaysInMonth(
  year: number,
  month: number,
  workWeekDays: WeekDay[] = DEFAULT_WORK_WEEK,
): number {
  const total = daysInMonth(year, month);
  const week = new Set(workWeekDays);
  let count = 0;
  for (let day = 1; day <= total; day += 1) {
    if (week.has(DOW_NAME[new Date(year, month - 1, day).getDay()])) count += 1;
  }
  return count;
}

/** Total payable-base days for a month under a given basis (and work week, for WORKING_DAYS). */
export function totalDaysForBasis(
  basis: ProrationBasis,
  year: number,
  month: number,
  workWeekDays?: WeekDay[],
): number {
  switch (basis) {
    case 'FIXED_30':
      return 30;
    case 'WORKING_DAYS':
      return workingDaysInMonth(year, month, workWeekDays);
    case 'CALENDAR_DAYS':
    default:
      return daysInMonth(year, month);
  }
}

export interface ProrationInput {
  basis: ProrationBasis;
  year: number;
  /** 1–12 */
  month: number;
  /** Loss-of-pay days in the period (default 0). */
  lopDays?: number;
  /** Work week for WORKING_DAYS basis (defaults to Mon–Fri). */
  workWeekDays?: WeekDay[];
}

/**
 * Fraction of the period an employee is paid for (0–1). With no LOP this is 1.
 */
export function prorationFactor({
  basis,
  year,
  month,
  lopDays = 0,
  workWeekDays,
}: ProrationInput): number {
  const total = totalDaysForBasis(basis, year, month, workWeekDays);
  if (total <= 0) return 1;
  const payable = Math.max(0, total - lopDays);
  return Math.min(1, payable / total);
}
