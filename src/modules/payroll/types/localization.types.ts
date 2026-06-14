/* ── Country & Legal Entity (localization layer) ──────────────────────────── */

export interface Country {
  /** ISO 3166-1 alpha-2 */
  code: string;
  name: string;
  /** ISO 4217 default pay currency */
  currency: string;
  locale: string;
  /** 1–12; the month the fiscal/tax year begins (India = 4, US/UK = 1). */
  fiscalYearStartMonth: number;
}

/** A day of the week (ISO-ish, Sunday-first to match calendar grids). */
export type WeekDay = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

/**
 * Legacy coarse work-week enum shipped by older backends. Superseded by the fully
 * configurable `workWeekDays[]`; retained only to derive days on back-compat reads
 * and to send a best-effort value to a backend that still expects it.
 */
export type WorkWeekPattern = 'MON-FRI' | 'MON-SAT';

export interface LegalEntity {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
  /** ISO 4217 default pay currency */
  currency: string;
  fiscalYearStartMonth: number;
  /** The working days for this entity — ANY pattern (UAE Sun–Thu, 4-day, …). Proration denominator. */
  workWeekDays: WeekDay[];
  /** Standard paid hours per working day — OT hourly rate + proration. */
  hoursPerDay: number;
  /** Legacy coarse enum from older backends; kept only for back-compat reads. */
  workWeekPattern?: WorkWeekPattern;
  timezone: string;
  locale: string;
  /** Country-defined registration identifiers (PF, ESI, PAN, EIN, …). */
  registrationIds: Record<string, string>;
  statutoryPackId: string | null;
  payCalendarId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LegalEntityInput {
  name: string;
  country: string;
  currency: string;
  fiscalYearStartMonth: number;
  /** The working days for this entity — ANY pattern. */
  workWeekDays: WeekDay[];
  hoursPerDay: number;
  timezone: string;
  locale: string;
  registrationIds: Record<string, string>;
  active: boolean;
}

/* ── Per-country bank account schema ──────────────────────────────────────── */

export interface BankField {
  key: string;
  label: string;
  type: 'text';
  required: boolean;
  /** Optional validation regex (source string). */
  regex?: string;
  placeholder?: string;
}
