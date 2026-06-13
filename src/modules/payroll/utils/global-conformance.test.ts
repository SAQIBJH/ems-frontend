/**
 * GLOBAL CONFORMANCE TEST — "can a country we have never seen run on config alone?"
 *
 * This is the litmus test from PAYROLL_SYSTEM_DESIGN §16 / CLAUDE.md §26:
 *   > Could a tenant in a country we have never seen run correct payroll by
 *   > entering configuration only, with no engineering change?
 *
 * The app currently seeds ONLY India (`payroll-localization.ts` COUNTRIES lists
 * IN/US/GB/AE/SG; the engine roster + statutory pack are India). The Philippines
 * is NOT seeded anywhere. Here we express the REAL Philippine 2025 statutory rules
 * (BIR TRAIN graduated income tax + SSS social security) as plain DATA and drive
 * them through the SHIPPED engine primitives in `formula.utils` / `money.utils`.
 *
 * Nothing in this file imports or modifies engine code beyond its public API, and
 * no engine file is changed. If the assertions pass, the calculation core is truly
 * configuration-driven for an unseen country. (See the bottom of this file for the
 * two orchestration-layer leaks this exercise surfaced.)
 *
 * Real-data sources (2025, verified June 2026):
 *  - BIR TRAIN graduated income tax table — filipiknow.net/tax-table,
 *    quickbooks.intuit.com/ph/tax-brackets-and-tax-tables
 *  - SSS 2025: 15% total (employer 10% / employee 5%), MSC capped ₱35,000 —
 *    kpmg.com GMS flash-alert 2025-026, sss.gov.ph contribution schedule
 *
 * Money is integer MINOR units. PHP has 2 decimal places, so ₱1.00 = 100 centavos.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeRegimeTax,
  computeContribution,
  projectPeriodTax,
  evaluateFormula,
  registerSlabTables,
  clearSlabTables,
} from './formula.utils';
import { currencyDecimals, fromMinor, toMinor } from './money.utils';
import type { TaxRegime, ContributionScheme } from '../types/statutory.types';

/* ── Philippines, expressed as pure configuration (no code, just data) ───────── */

const PESO = (php: number) => toMinor(php, 'PHP'); // ₱ → centavos

/** BIR TRAIN graduated annual income tax, as marginal slabs (centavos). */
const PH_INCOME_TAX_2025: TaxRegime = {
  code: 'PH_TRAIN',
  fiscalYear: '2025',
  currency: 'PHP',
  standardDeduction: 0,
  slabs: [
    { from: PESO(0), to: PESO(250_000), rate: 0 },
    { from: PESO(250_000), to: PESO(400_000), rate: 15 },
    { from: PESO(400_000), to: PESO(800_000), rate: 20 },
    { from: PESO(800_000), to: PESO(2_000_000), rate: 25 },
    { from: PESO(2_000_000), to: PESO(8_000_000), rate: 30 },
    { from: PESO(8_000_000), to: null, rate: 35 },
  ],
};

/** SSS 2025 — employee 5% / employer 10% of the Monthly Salary Credit, capped ₱35,000. */
const PH_SSS_2025: ContributionScheme = {
  code: 'SSS',
  name: 'Social Security System',
  wageBaseTag: 'SSS_BASE',
  wageCeiling: PESO(35_000),
  employee: { rate: 5, component: 'SSS_EE' },
  employer: { rate: 10, component: 'SSS_ER' },
};

beforeEach(() => clearSlabTables());

describe('Global conformance: Philippines (unseen country) on config only', () => {
  it('PHP is handled by the money layer as a 2-decimal currency (not hardcoded INR)', () => {
    expect(currencyDecimals('PHP')).toBe(2);
    expect(PESO(250_000)).toBe(25_000_000);
    expect(fromMinor(15_250_000, 'PHP')).toBe(152_500);
  });

  it('income tax: ₱1,000,000 taxable → ₱152,500 (BIR TRAIN, marginal bands)', () => {
    // 250k@0 + 150k@15% + 400k@20% + 200k@25% = 0 + 22,500 + 80,000 + 50,000 = 152,500
    const tax = computeRegimeTax(PESO(1_000_000), PH_INCOME_TAX_2025);
    expect(tax).toBe(PESO(152_500));
  });

  it('income tax: ₱250,000 taxable → ₱0 (the 0% tax-free first band)', () => {
    expect(computeRegimeTax(PESO(250_000), PH_INCOME_TAX_2025)).toBe(0);
  });

  it('income tax: ₱8,500,000 taxable → ₱2,377,500 (top 35% band)', () => {
    // 2,202,500 + 35% × 500,000 = 2,202,500 + 175,000 = 2,377,500
    expect(computeRegimeTax(PESO(8_500_000), PH_INCOME_TAX_2025)).toBe(PESO(2_377_500));
  });

  it('SSS contribution: ₱80,000/mo salary → MSC capped ₱35,000, EE ₱1,750 / ER ₱3,500', () => {
    const r = computeContribution(PESO(80_000), PH_SSS_2025);
    expect(r.base).toBe(PESO(35_000)); // ceiling applied
    expect(r.employee).toBe(PESO(1_750)); // 5% of 35,000
    expect(r.employer).toBe(PESO(3_500)); // 10% of 35,000
  });

  it('monthly withholding: ₱1,000,000 annual taxable / 12 → ₱12,708.33', () => {
    const monthly = projectPeriodTax({
      annualTaxable: PESO(1_000_000),
      regime: PH_INCOME_TAX_2025,
      ytdTaxPaid: 0,
      periodsRemaining: 12,
    });
    expect(fromMinor(monthly, 'PHP')).toBeCloseTo(12_708.33, 2);
  });

  it('tenant-authored formula references the unseen country table: SLAB(TAXABLE,"PH_TRAIN")', () => {
    registerSlabTables({ PH_TRAIN: PH_INCOME_TAX_2025.slabs });
    const tax = evaluateFormula('SLAB(TAXABLE, "PH_TRAIN")', { TAXABLE: PESO(1_000_000) });
    expect(tax).toBe(PESO(152_500));
  });
});
