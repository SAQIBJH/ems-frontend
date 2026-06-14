import { Parser } from 'expr-eval';
import type { SalaryComponent, CalculatedComponent } from '../types/payroll.types';
import type {
  ContributionScheme,
  GratuityPolicy,
  LocalTaxSlab,
  MinimumWage,
  TaxRegime,
  TaxSlab,
} from '../types/statutory.types';

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

  // Credits/rebates apply last, after slab+surcharge+cess, against taxable income (afterStd):
  //  - unconditional (no maxIncome): always subtract (e.g. SA primary rebate).
  //  - income-conditional (maxIncome set): subtract only at/below the ceiling (India §87A).
  //  - marginal relief: just above the ceiling, cap tax at (income − ceiling) so crossing the
  //    threshold never costs more tax than the income that exceeds it.
  let result = tax;
  for (const c of regime.taxCredits ?? []) {
    if (c.maxIncome == null || afterStd <= c.maxIncome) {
      result = Math.max(0, result - c.amount);
    } else if (c.marginalRelief) {
      result = Math.min(result, afterStd - c.maxIncome);
    }
  }
  return Math.max(0, result);
}

/**
 * Incremental income tax on an extra payment (bonus / arrears) layered on top of the
 * annual taxable base: `tax(base + extra) − tax(base)`. Config-driven via the regime —
 * the extra is taxed at the employee's marginal bands, never a flat rate. Never negative.
 */
export function computeBonusTax(annualTaxable: number, extra: number, regime: TaxRegime): number {
  if (extra <= 0) return 0;
  const base = Math.max(0, annualTaxable);
  return Math.max(0, computeRegimeTax(base + extra, regime) - computeRegimeTax(base, regime));
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
/**
 * Gratuity payout from a configured policy (e.g. India: monthlyWage × 15 × years / 26),
 * zero below the eligibility floor. All parameters are data — no country constant.
 */
export function computeGratuity(
  monthlyWage: number,
  yearsOfService: number,
  policy: GratuityPolicy,
): number {
  if (yearsOfService < policy.minYears) return 0;
  return Math.round((monthlyWage * policy.daysPerYear * yearsOfService) / policy.monthDivisor);
}

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

/* ── Sub-national / local flat taxes & multi-jurisdiction (§3.6, §4.6) ──────── */

/**
 * Resolve a flat local tax (professional tax, LWF, city tax) for a monthly wage
 * against a configured band table. Bands are `{ from, to, amount }`; the matching
 * band's flat `amount` is returned (0 if none matches). All values are data.
 */
export function evaluateLocalTax(monthlyWage: number, slabs: LocalTaxSlab[]): number {
  for (const slab of slabs) {
    const upper = slab.to ?? Infinity;
    if (monthlyWage >= slab.from && monthlyWage < upper) return slab.amount;
  }
  return 0;
}

/**
 * The applicable jurisdiction set for an employee: residence first, then each
 * work-location jurisdiction, de-duplicated. The engine applies every matching
 * jurisdiction's local taxes — never assuming a single national rule.
 */
export function resolveJurisdictions(
  residenceJurisdiction: string | null | undefined,
  workLocations: { jurisdiction: string }[] | null | undefined,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (j: string | null | undefined) => {
    if (j && !seen.has(j)) {
      seen.add(j);
      out.push(j);
    }
  };
  add(residenceJurisdiction);
  for (const wl of workLocations ?? []) add(wl.jurisdiction);
  return out;
}

/**
 * The highest minimum-wage floor that applies across an employee's jurisdiction
 * set (the most protective floor). Returns 0 when no configured floor applies.
 */
export function minimumWageFloor(jurisdictions: string[], minimumWages: MinimumWage[]): number {
  const set = new Set(jurisdictions);
  return minimumWages
    .filter((m) => set.has(m.jurisdiction))
    .reduce((max, m) => Math.max(max, m.monthlyFloor), 0);
}

/* ── Garnishments / court orders (§5.7) ────────────────────────────────────── */

export interface GarnishmentOrder {
  id: string;
  /** Lower number = satisfied first. */
  priority: number;
  kind: 'FLAT' | 'PERCENT_OF_DISPOSABLE';
  /** FLAT: amount in the same unit as `disposable`. PERCENT: percent (0–100). */
  value: number;
  /** Minimum take-home the employee must retain, same unit as `disposable`. */
  protectedEarningsFloor: number;
  /** Optional per-order maximum, same unit as `disposable`; null = uncapped. */
  cap: number | null;
}

export interface GarnishmentDeduction {
  id: string;
  /** Amount actually withheld, same unit as `disposable`. */
  amount: number;
}

/**
 * Apply court-ordered garnishments against disposable income. Orders are taken in
 * **priority order** (lowest first); each order's desired amount is a flat value or a
 * percent of the original disposable, optionally capped. An order can only take what
 * keeps running take-home at or above its `protectedEarningsFloor` — so when income is
 * insufficient, higher-priority orders are satisfied first and the floor is never
 * breached. All amounts share `disposable`'s unit; no country rule lives in code.
 */
export function applyGarnishments(
  disposable: number,
  orders: GarnishmentOrder[],
): GarnishmentDeduction[] {
  const sorted = [...orders].sort((a, b) => a.priority - b.priority);
  let remaining = disposable;
  const out: GarnishmentDeduction[] = [];
  for (const o of sorted) {
    let desired = o.kind === 'FLAT' ? o.value : Math.round((disposable * o.value) / 100);
    if (o.cap != null) desired = Math.min(desired, o.cap);
    const available = Math.max(0, remaining - o.protectedEarningsFloor);
    const actual = Math.max(0, Math.min(desired, available));
    if (actual > 0) {
      out.push({ id: o.id, amount: actual });
      remaining -= actual;
    }
  }
  return out;
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
