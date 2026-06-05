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

export interface LegalEntity {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
  /** ISO 4217 default pay currency */
  currency: string;
  fiscalYearStartMonth: number;
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
  timezone: string;
  locale: string;
  registrationIds: Record<string, string>;
  active: boolean;
}
