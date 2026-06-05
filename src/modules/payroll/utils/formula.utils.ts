import { Parser } from 'expr-eval';
import type { SalaryComponent, CalculatedComponent } from '../types/payroll.types';
import type { ContributionScheme, TaxRegime, TaxSlab } from '../types/statutory.types';

const parser = new Parser();

/* ── Progressive slab evaluation (config-driven, no country logic) ─────────── */

/**
 * Apply a configured bracket table progressively to a value. Slabs are
 * `{ from, to, rate% }`, sorted ascending and contiguous; the last slab may have
 * `to: null` (no ceiling). Each band is taxed only on the portion of `value`
 * that falls inside it — this is what replaces nested `IF()` chains.
 */
export function evaluateSlab(value: number, slabs: TaxSlab[]): number {
  if (value <= 0 || slabs.length === 0) return 0;
  let tax = 0;
  for (const slab of slabs) {
    if (value <= slab.from) break;
    const upper = slab.to ?? Infinity;
    const inBand = Math.min(value, upper) - slab.from;
    if (inBand > 0) tax += inBand * (slab.rate / 100);
  }
  return tax;
}

// Named slab tables that the SLAB() formula function can reference by code. The
// engine registers a run's regime tables here before evaluating component
// formulas — so a tenant could author `SLAB(TAXABLE_ANNUAL, "IN_NEW_REGIME")`.
const slabTables: Record<string, TaxSlab[]> = {};

/** Register (replace) the named slab tables available to the SLAB() function. */
export function registerSlabTables(tables: Record<string, TaxSlab[]>): void {
  for (const [code, slabs] of Object.entries(tables)) {
    slabTables[code] = slabs;
  }
}

/** Drop all registered slab tables (test isolation). */
export function clearSlabTables(): void {
  for (const code of Object.keys(slabTables)) delete slabTables[code];
}

// Formula-language extensions (§4.2): progressive tax + bounding, as data.
parser.functions.SLAB = (value: number, tableCode: string): number =>
  evaluateSlab(value, slabTables[tableCode] ?? []);
parser.functions.CLAMP = (value: number, lo: number, hi: number): number =>
  Math.min(Math.max(value, lo), hi);

/* ── Income-tax regime computation (annual projection + true-up hook) ──────── */

/**
 * Annual income tax for a regime: standard deduction → progressive slabs →
 * surcharge (highest applicable band, on tax) → health/education cess (on
 * tax + surcharge). All inputs come from the regime data — no rate literals.
 */
export function computeRegimeTax(taxableAnnual: number, regime: TaxRegime): number {
  const afterStd = Math.max(0, taxableAnnual - (regime.standardDeduction ?? 0));
  let tax = evaluateSlab(afterStd, regime.slabs);

  if (regime.surcharge && regime.surcharge.length > 0) {
    const band = regime.surcharge
      .filter((s) => taxableAnnual > s.thresholdAnnual)
      .sort((a, b) => b.thresholdAnnual - a.thresholdAnnual)[0];
    if (band) tax += tax * (band.rate / 100);
  }

  if (regime.cess) tax += tax * (regime.cess.rate / 100);
  return tax;
}

export interface PeriodTaxArgs {
  /** Projected full-year taxable income, minor units. */
  annualTaxable: number;
  regime: TaxRegime;
  /** Tax already withheld earlier in the fiscal year (YTD). Wired in Step 100. */
  ytdTaxPaid?: number;
  /** Periods left in the fiscal year, including the current one. */
  periodsRemaining?: number;
}

/**
 * Per-period withholding: project the annual tax, subtract what was already
 * withheld (YTD), and spread the remainder across the remaining periods. With
 * `ytdTaxPaid = 0` and `periodsRemaining = 12` this is simply annualTax / 12 —
 * the YTD true-up arrives in Step 100.
 */
export function projectPeriodTax({
  annualTaxable,
  regime,
  ytdTaxPaid = 0,
  periodsRemaining = 12,
}: PeriodTaxArgs): number {
  const annualTax = computeRegimeTax(annualTaxable, regime);
  const remaining = Math.max(0, annualTax - ytdTaxPaid);
  return remaining / Math.max(1, periodsRemaining);
}

/* ── Statutory contributions (employee + employer split, wage base, ceiling) ── */

export interface ContributionResult {
  /** The wage base actually used, after applying the scheme's ceiling. */
  base: number;
  /** Employee-side deduction, minor units. */
  employee: number;
  /** Employer-side contribution (employer cost, never reduces net), minor units. */
  employer: number;
}

/**
 * Compute one contribution scheme over a wage base. The base is capped at the
 * scheme's `wageCeiling` (if any); employee and employer amounts are each the
 * configured rate of the capped base. Rates/ceilings are data — no `if (country)`.
 */
export function computeContribution(
  rawBase: number,
  scheme: ContributionScheme,
): ContributionResult {
  const base = scheme.wageCeiling != null ? Math.min(rawBase, scheme.wageCeiling) : rawBase;
  return {
    base,
    employee: Math.round((base * scheme.employee.rate) / 100),
    employer: Math.round((base * scheme.employer.rate) / 100),
  };
}

export function evaluateFormula(formula: string, variables: Record<string, number>): number | null {
  try {
    const expr = parser.parse(formula);
    const result = expr.evaluate(variables);
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function validateFormula(
  formula: string,
  knownCodes: string[],
): { valid: boolean; error?: string } {
  try {
    const expr = parser.parse(formula);
    // Check that all variables in the expression are known codes or built-ins
    const vars = expr.variables();
    const builtins = new Set(['CTC', 'GROSS', 'NET', ...knownCodes]);
    const unknown = vars.filter((v: string) => !builtins.has(v));
    if (unknown.length > 0) {
      return { valid: false, error: `Unknown variable(s): ${unknown.join(', ')}` };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid formula syntax' };
  }
}

export function resolveComponentOrder(components: SalaryComponent[]): SalaryComponent[] {
  const byCode = new Map(components.map((c) => [c.code, c]));
  const visited = new Set<string>();
  const result: SalaryComponent[] = [];

  function visit(code: string) {
    if (visited.has(code)) return;
    visited.add(code);
    const comp = byCode.get(code);
    if (!comp) return;
    // Visit dependencies first
    if (comp.calculationType === 'PERCENTAGE' && comp.basisCode) {
      visit(comp.basisCode);
    } else if (comp.calculationType === 'FORMULA' && comp.formula) {
      try {
        const expr = parser.parse(comp.formula);
        const vars = expr.variables() as string[];
        for (const v of vars) {
          if (byCode.has(v)) visit(v);
        }
      } catch {
        /* invalid formula — skip dep resolution */
      }
    }
    result.push(comp);
  }

  for (const comp of components) {
    visit(comp.code);
  }

  return result;
}

export function computeComponentBreakdown(
  components: SalaryComponent[],
  annualCtc: number,
): CalculatedComponent[] {
  const monthly = annualCtc / 12;
  const ordered = resolveComponentOrder(components);
  const values: Record<string, number> = { CTC: monthly };
  const results: CalculatedComponent[] = [];

  for (const comp of ordered) {
    let amount = 0;
    // VARIABLE components are input-driven (incentive/commission/bonus) — they have no
    // base value in the structure; their amount is supplied per run (Step 101). In the
    // structural breakdown they resolve to 0.
    if (comp.type === 'VARIABLE') {
      amount = 0;
    } else if (comp.calculationType === 'FLAT') {
      amount = comp.value ?? 0;
    } else if (comp.calculationType === 'PERCENTAGE') {
      const basis = comp.basisCode ? (values[comp.basisCode] ?? 0) : monthly;
      amount = ((comp.value ?? 0) / 100) * basis;
    } else if (comp.calculationType === 'FORMULA' && comp.formula) {
      amount = evaluateFormula(comp.formula, values) ?? 0;
    }

    values[comp.code] = amount;
    results.push({
      code: comp.code,
      name: comp.name,
      type: comp.type,
      monthlyAmount: amount,
      taxable: comp.taxable,
    });
  }

  // GROSS = employee earnings (EARNING + VARIABLE). NET subtracts only employee
  // DEDUCTIONs — EMPLOYER_CONTRIBUTION and BENEFIT never reduce net pay.
  const grossEarnings = results.filter((r) => r.type === 'EARNING' || r.type === 'VARIABLE');
  const deductions = results.filter((r) => r.type === 'DEDUCTION');
  values.GROSS = grossEarnings.reduce((s, r) => s + r.monthlyAmount, 0);
  values.NET = values.GROSS - deductions.reduce((s, r) => s + r.monthlyAmount, 0);

  return results;
}

export interface ComponentTotals {
  monthlyGross: number;
  monthlyDeductions: number;
  /** Employer-side cost that rolls into CTC but never reduces net pay. */
  monthlyEmployerCost: number;
  monthlyNet: number;
}

/**
 * Roll a component breakdown up into the four payroll totals. Employer
 * contributions and (non-cash) benefits form employer cost — they are excluded
 * from gross and never reduce net pay.
 */
export function computeComponentTotals(
  components: SalaryComponent[],
  annualCtc: number,
): ComponentTotals {
  const breakdown = computeComponentBreakdown(components, annualCtc);
  const sumOf = (...types: SalaryComponent['type'][]) =>
    breakdown.filter((r) => types.includes(r.type)).reduce((s, r) => s + r.monthlyAmount, 0);

  const monthlyGross = sumOf('EARNING', 'VARIABLE');
  const monthlyDeductions = sumOf('DEDUCTION');
  const monthlyEmployerCost = sumOf('EMPLOYER_CONTRIBUTION', 'BENEFIT');
  const monthlyNet = monthlyGross - monthlyDeductions;

  return { monthlyGross, monthlyDeductions, monthlyEmployerCost, monthlyNet };
}
