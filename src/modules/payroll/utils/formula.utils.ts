import { Parser } from 'expr-eval';
import type { SalaryComponent, CalculatedComponent } from '../types/payroll.types';

const parser = new Parser();

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
