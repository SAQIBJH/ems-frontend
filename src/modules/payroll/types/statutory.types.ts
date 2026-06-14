/* ── Statutory pack (versioned, country-scoped statutory/tax rules) ─────────── */
/**
 * The heart of "no hardcode": a pack is a versioned, effective-dated bundle of a
 * country's statutory rules (tax regimes, contribution schemes, local taxes,
 * rounding, proration). A mid-year law change is a new version — past runs keep
 * the version they pinned. The calculation engine reads rates/slabs from the
 * active pack, never from code. See `PAYROLL_SYSTEM_DESIGN.md §3.2, §5`.
 */

export type RoundingMode = 'NEAREST' | 'UP' | 'DOWN';

export interface RoundingPolicy {
  mode: RoundingMode;
  /** Decimal places in minor units to round to (0 = whole minor unit). */
  precision: number;
}

export type ProrationBasis = 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_30';

export interface ProrationPolicy {
  basis: ProrationBasis;
}

/* Progressive income-tax regime (consumed by the `SLAB()` function in Step 98). */
export interface TaxSlab {
  /** Annual lower bound, minor units (inclusive). */
  from: number;
  /** Annual upper bound, minor units (exclusive); `null` = no ceiling. */
  to: number | null;
  /** Marginal rate, percent. */
  rate: number;
  /** Precomputed cumulative tax up to `from`, minor units. Optional — backend may send it. */
  base?: number;
}

/** Annual tax credit / rebate (e.g. SA primary rebate, KE personal relief, India §87A). Minor units. */
export interface TaxCredit {
  code: string;
  /** Annual credit amount, minor units. */
  amount: number;
  /**
   * Income ceiling (taxable income, minor units) above which the credit does NOT apply —
   * an income-conditional rebate like India §87A. Omit for an unconditional credit (e.g. SA
   * primary rebate, which always applies).
   */
  maxIncome?: number;
  /**
   * Marginal relief: in the band just above `maxIncome`, cap the tax at `(income − maxIncome)`
   * so crossing the threshold never costs more tax than the income that exceeds it. Requires
   * `maxIncome`. (India §87A new-regime relief.)
   */
  marginalRelief?: boolean;
}

export interface TaxSurcharge {
  /** Annual taxable income above which the surcharge applies, minor units. */
  thresholdAnnual: number;
  rate: number;
}

export interface TaxRegime {
  code: string;
  /** Human label, e.g. "Philippines TRAIN". Optional — newer backend field. */
  name?: string;
  /** e.g. "2026-27" (IN) or "2026" (US). */
  fiscalYear: string;
  /** ISO 4217. */
  currency: string;
  /** Minor units. */
  standardDeduction: number;
  slabs: TaxSlab[];
  surcharge?: TaxSurcharge[];
  cess?: { rate: number } | null;
  /** Annual rebates/credits subtracted after slab+surcharge+cess (SA, KE). */
  taxCredits?: TaxCredit[];
  /** Deduction line code the tax posts to, e.g. "WITHHOLDING_TAX" (not hardcoded "TDS"). */
  taxCode?: string;
  /** Deduction line display name. */
  taxName?: string;
  allowedExemptions?: string[];
}

/* Employee/employer contribution scheme (PF/ESI, FICA, etc.). */
export interface ContributionParty {
  /** Percent of the wage base. */
  rate: number;
  /** Component code this party's amount posts to. */
  component: string;
  /** Optional sub-splits of the party's contribution (e.g. EPS/EPF), percent. */
  split?: Record<string, number>;
}

export interface ContributionScheme {
  code: string;
  name: string;
  /** Which earnings (by `statutoryTag`) form this scheme's wage base. */
  wageBaseTag: string;
  /** Monthly wage ceiling, minor units; `null` = uncapped. */
  wageCeiling: number | null;
  employee: ContributionParty;
  employer: ContributionParty;
  /**
   * Free-form applicability rule key, resolved by the engine. Optional — the live
   * backend may omit it (verified 2026-06-09 against the live statutory-packs API).
   */
  applicability?: string;
  /**
   * How a monthly-capped contribution apportions across sub-monthly cycles.
   * `MONTHLY_TOTAL` = the cap is monthly; cycles share it. Optional additive field
   * (absent on existing IN packs, verified live 2026-06-14).
   */
  apportionmentMode?: 'MONTHLY_TOTAL' | 'PER_CYCLE';
}

/* Sub-national / local flat-amount tax (professional tax, LWF, city tax). */
export interface LocalTaxSlab {
  /** Monthly wage lower bound, minor units (inclusive). */
  from: number;
  /** Monthly wage upper bound, minor units (exclusive); `null` = no ceiling. */
  to: number | null;
  /** Flat amount due in this band, minor units. */
  amount: number;
}

export interface LocalTax {
  code: string;
  name: string;
  /**
   * ISO 3166-2 jurisdiction this tax applies in. Optional — the live backend may
   * omit it (verified 2026-06-09 against the live statutory-packs API).
   */
  jurisdiction?: string;
  /** Component code the deduction posts to. */
  component: string;
  slabs: LocalTaxSlab[];
}

/** Gratuity accrual policy (e.g. India: 15 days' wage per year, /26, min 5 years). */
export interface GratuityPolicy {
  daysPerYear: number;
  monthDivisor: number;
  minYears: number;
}

/** Statutory minimum monthly wage floor, scoped to a jurisdiction (§4.6). */
export interface MinimumWage {
  /** ISO 3166-2 jurisdiction this floor applies in. */
  jurisdiction: string;
  /** Minimum monthly gross wage, minor units. */
  monthlyFloor: number;
}

export interface StatutoryPack {
  id: string;
  /** Backend-assigned tenant owner — present on live responses, not sent on writes. */
  tenantId?: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** Pack version label, e.g. "2026.1". */
  version: string;
  /** YYYY-MM-DD. */
  effectiveFrom: string;
  /** YYYY-MM-DD; `null` = open-ended (current). */
  effectiveTo: string | null;
  rounding: RoundingPolicy;
  proration: ProrationPolicy;
  taxRegimes: TaxRegime[];
  contributionSchemes: ContributionScheme[];
  localTaxes: LocalTax[];
  /** Gratuity accrual policy (used in full & final settlement). */
  gratuity?: GratuityPolicy | null;
  /** Per-jurisdiction minimum monthly wage floors (post-compute compliance check). */
  minimumWages?: MinimumWage[];
  /** Component codes this pack expects to exist for statutory postings. */
  statutoryComponents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StatutoryPackInput {
  country: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  rounding: RoundingPolicy;
  proration: ProrationPolicy;
  taxRegimes: TaxRegime[];
  contributionSchemes: ContributionScheme[];
  localTaxes: LocalTax[];
  minimumWages?: MinimumWage[];
  statutoryComponents: string[];
}

/**
 * The pinned reference a `PayrollRun` records at calculate time. Recompute
 * resolves the exact pack version from this ref, so numbers are reproducible
 * even after a newer pack version is published.
 */
export interface RunConfigSnapshotRef {
  statutoryPackId: string;
  country: string;
  version: string;
  effectiveFrom: string;
  pinnedAt: string;
}
