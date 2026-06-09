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
}

export interface TaxSurcharge {
  /** Annual taxable income above which the surcharge applies, minor units. */
  thresholdAnnual: number;
  rate: number;
}

export interface TaxRegime {
  code: string;
  /** e.g. "2026-27" (IN) or "2026" (US). */
  fiscalYear: string;
  /** ISO 4217. */
  currency: string;
  /** Minor units. */
  standardDeduction: number;
  slabs: TaxSlab[];
  surcharge?: TaxSurcharge[];
  cess?: { rate: number } | null;
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
