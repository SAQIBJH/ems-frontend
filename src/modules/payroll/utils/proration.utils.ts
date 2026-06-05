/**
 * Proration determines how much of a period an employee is paid for, based on a
 * configurable basis. Loss-of-pay (LOP) days reduce the payable days. The basis is
 * a per-statutory-pack policy (§3.2); the engine never hardcodes "30 days" or
 * "working days" — it reads the basis.
 */

export type ProrationBasis = 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_30';

/** Calendar days in a month (month is 1–12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Mon–Fri days in a month (month is 1–12). */
export function workingDaysInMonth(year: number, month: number): number {
  const total = daysInMonth(year, month);
  let count = 0;
  for (let day = 1; day <= total; day += 1) {
    const dow = new Date(year, month - 1, day).getDay();
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count;
}

/** Total payable-base days for a month under a given basis. */
export function totalDaysForBasis(basis: ProrationBasis, year: number, month: number): number {
  switch (basis) {
    case 'FIXED_30':
      return 30;
    case 'WORKING_DAYS':
      return workingDaysInMonth(year, month);
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
}

/**
 * Fraction of the period an employee is paid for (0–1). With no LOP this is 1.
 */
export function prorationFactor({ basis, year, month, lopDays = 0 }: ProrationInput): number {
  const total = totalDaysForBasis(basis, year, month);
  if (total <= 0) return 1;
  const payable = Math.max(0, total - lopDays);
  return Math.min(1, payable / total);
}
