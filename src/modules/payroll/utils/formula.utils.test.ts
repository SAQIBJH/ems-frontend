import { describe, it, expect } from 'vitest';
import {
  computeComponentBreakdown,
  computeComponentTotals,
  validateFormula,
  evaluateFormula,
  evaluateSlab,
  computeRegimeTax,
  projectPeriodTax,
  computeContribution,
  computeGratuity,
  registerSlabTables,
} from './formula.utils';
import type { SalaryComponent } from '../types/payroll.types';
import type { ContributionScheme, TaxRegime, TaxSlab } from '../types/statutory.types';

/** Build a SalaryComponent with sensible defaults for the new required fields. */
function comp(
  partial: Partial<SalaryComponent> &
    Pick<SalaryComponent, 'code' | 'name' | 'type' | 'calculationType'>,
): SalaryComponent {
  return {
    id: partial.code,
    value: null,
    basisCode: null,
    formula: null,
    taxable: true,
    active: true,
    displayOrder: 1,
    description: null,
    statutoryTag: null,
    prorate: true,
    createdAt: '',
    updatedAt: '',
    ...partial,
  };
}

const ANNUAL_CTC = 1_200_000; // monthly CTC = 100,000

describe('computeComponentBreakdown', () => {
  it('resolves FLAT and PERCENTAGE (of basis) amounts', () => {
    const components = [
      comp({
        code: 'BASIC',
        name: 'Basic',
        type: 'EARNING',
        calculationType: 'FLAT',
        value: 50000,
      }),
      comp({
        code: 'HRA',
        name: 'HRA',
        type: 'EARNING',
        calculationType: 'PERCENTAGE',
        value: 40,
        basisCode: 'BASIC',
      }),
    ];
    const result = computeComponentBreakdown(components, ANNUAL_CTC);
    expect(result.find((r) => r.code === 'BASIC')?.monthlyAmount).toBe(50000);
    expect(result.find((r) => r.code === 'HRA')?.monthlyAmount).toBe(20000);
  });

  it('resolves a FORMULA referencing other component codes in dependency order', () => {
    const components = [
      comp({
        code: 'BASIC',
        name: 'Basic',
        type: 'EARNING',
        calculationType: 'FLAT',
        value: 50000,
      }),
      comp({
        code: 'SPECIAL',
        name: 'Special',
        type: 'EARNING',
        calculationType: 'FORMULA',
        formula: 'CTC - BASIC',
      }),
    ];
    const result = computeComponentBreakdown(components, ANNUAL_CTC);
    // monthly CTC 100,000 − BASIC 50,000 = 50,000
    expect(result.find((r) => r.code === 'SPECIAL')?.monthlyAmount).toBe(50000);
  });

  it('resolves VARIABLE components to 0 (input-driven, supplied per run)', () => {
    const components = [
      comp({
        code: 'INCENTIVE',
        name: 'Incentive',
        type: 'VARIABLE',
        calculationType: 'FLAT',
        value: 9999, // base value is ignored for VARIABLE
      }),
    ];
    const result = computeComponentBreakdown(components, ANNUAL_CTC);
    expect(result.find((r) => r.code === 'INCENTIVE')?.monthlyAmount).toBe(0);
  });
});

describe('computeComponentTotals', () => {
  const components = [
    comp({ code: 'BASIC', name: 'Basic', type: 'EARNING', calculationType: 'FLAT', value: 50000 }),
    comp({
      code: 'HRA',
      name: 'HRA',
      type: 'EARNING',
      calculationType: 'PERCENTAGE',
      value: 40,
      basisCode: 'BASIC',
    }),
    comp({
      code: 'PF_EE',
      name: 'PF (employee)',
      type: 'DEDUCTION',
      calculationType: 'PERCENTAGE',
      value: 12,
      basisCode: 'BASIC',
    }),
    comp({
      code: 'PF_ER',
      name: 'PF (employer)',
      type: 'EMPLOYER_CONTRIBUTION',
      calculationType: 'PERCENTAGE',
      value: 12,
      basisCode: 'BASIC',
    }),
  ];

  it('sums gross from earnings only', () => {
    expect(computeComponentTotals(components, ANNUAL_CTC).monthlyGross).toBe(70000); // 50000 + 20000
  });

  it('subtracts only employee deductions from net — employer contribution never reduces net', () => {
    const totals = computeComponentTotals(components, ANNUAL_CTC);
    expect(totals.monthlyDeductions).toBe(6000); // PF_EE
    expect(totals.monthlyNet).toBe(64000); // 70000 − 6000 (PF_ER excluded)
  });

  it('rolls employer contributions into employer cost', () => {
    expect(computeComponentTotals(components, ANNUAL_CTC).monthlyEmployerCost).toBe(6000); // PF_ER
  });
});

describe('validateFormula', () => {
  it('accepts known component codes and built-ins', () => {
    expect(validateFormula('CTC - BASIC', ['BASIC']).valid).toBe(true);
  });

  it('rejects unknown variables', () => {
    const result = validateFormula('BASIC + UNKNOWN', ['BASIC']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('UNKNOWN');
  });

  it('accepts SLAB() and CLAMP() (functions + string-literal table code)', () => {
    expect(validateFormula("SLAB(BASIC, 'TEST') + CLAMP(NET, 0, 999)", ['BASIC']).valid).toBe(true);
  });
});

/* ── Progressive tax ──────────────────────────────────────────────────────── */

// IN-new-regime-shaped brackets (plain major units for readability).
const SLABS: TaxSlab[] = [
  { from: 0, to: 400000, rate: 0 },
  { from: 400000, to: 800000, rate: 5 },
  { from: 800000, to: 1200000, rate: 10 },
  { from: 1200000, to: null, rate: 30 },
];

describe('evaluateSlab', () => {
  it('returns 0 below the first taxable band', () => {
    expect(evaluateSlab(0, SLABS)).toBe(0);
    expect(evaluateSlab(300000, SLABS)).toBe(0);
  });

  it('taxes only the portion inside each band (progressive)', () => {
    // 400k–800k @ 5% on 200k = 10,000
    expect(evaluateSlab(600000, SLABS)).toBe(10000);
    // band2 full (20,000) + band3 200k @ 10% (20,000) = 40,000
    expect(evaluateSlab(1000000, SLABS)).toBe(40000);
    // + band4 800k @ 30% (240,000) = 300,000
    expect(evaluateSlab(2000000, SLABS)).toBe(300000);
  });

  it('handles a flat two-band (US-style) table', () => {
    const flat: TaxSlab[] = [
      { from: 0, to: 1000000, rate: 10 },
      { from: 1000000, to: null, rate: 22 },
    ];
    // 1m @ 10% (100,000) + 500k @ 22% (110,000) = 210,000
    expect(evaluateSlab(1500000, flat)).toBe(210000);
  });
});

describe('computeRegimeTax', () => {
  const regime: TaxRegime = {
    code: 'TEST_REGIME',
    fiscalYear: '2026-27',
    currency: 'INR',
    standardDeduction: 75000,
    slabs: SLABS,
    cess: { rate: 4 },
  };

  it('applies standard deduction → slabs → cess', () => {
    // 1,275,000 − 75,000 std = 1,200,000 → slab tax 60,000 → +4% cess = 62,400
    expect(computeRegimeTax(1275000, regime)).toBe(62400);
  });

  it('adds the highest applicable surcharge band before cess', () => {
    const withSurcharge: TaxRegime = {
      ...regime,
      standardDeduction: 0,
      surcharge: [{ thresholdAnnual: 5000000, rate: 10 }],
    };
    // slab tax on 6,000,000 = 1,500,000; +10% surcharge = 1,650,000; +4% cess = 1,716,000
    expect(computeRegimeTax(6000000, withSurcharge)).toBe(1716000);
  });
});

describe('projectPeriodTax', () => {
  const regime: TaxRegime = {
    code: 'TEST_REGIME',
    fiscalYear: '2026-27',
    currency: 'INR',
    standardDeduction: 75000,
    slabs: SLABS,
    cess: { rate: 4 },
  };

  it('spreads annual tax evenly with no YTD (annualTax / 12)', () => {
    expect(projectPeriodTax({ annualTaxable: 1275000, regime })).toBe(5200); // 62,400 / 12
  });

  it('trues up against YTD over the remaining periods', () => {
    // (62,400 − 12,400) / 4 = 12,500
    expect(
      projectPeriodTax({ annualTaxable: 1275000, regime, ytdTaxPaid: 12400, periodsRemaining: 4 }),
    ).toBe(12500);
  });
});

describe('computeContribution', () => {
  const epf: ContributionScheme = {
    code: 'IN_EPF',
    name: "Employees' Provident Fund",
    wageBaseTag: 'PF_WAGE',
    wageCeiling: 1500000,
    employee: { rate: 12, component: 'PF' },
    employer: { rate: 12, component: 'PF_ER' },
    applicability: 'GROSS_BELOW_CEILING_OPTIONAL',
  };

  it('applies the configured rate to the wage base (below ceiling)', () => {
    const r = computeContribution(50000, epf);
    expect(r.base).toBe(50000);
    expect(r.employee).toBe(6000); // 12% of 50,000
    expect(r.employer).toBe(6000);
  });

  it('caps the wage base at the ceiling', () => {
    const r = computeContribution(2000000, epf);
    expect(r.base).toBe(1500000); // capped
    expect(r.employee).toBe(180000); // 12% of 1,500,000
    expect(r.employer).toBe(180000);
  });

  it('supports asymmetric employee/employer rates and uncapped schemes', () => {
    const medicare: ContributionScheme = {
      code: 'US_MEDICARE',
      name: 'Medicare',
      wageBaseTag: 'FICA_WAGE',
      wageCeiling: null,
      employee: { rate: 1.45, component: 'MED_EE' },
      employer: { rate: 1.45, component: 'MED_ER' },
      applicability: 'ALL_WAGES',
    };
    const r = computeContribution(10000000, medicare);
    expect(r.base).toBe(10000000); // uncapped
    expect(r.employee).toBe(145000); // 1.45%
    expect(r.employer).toBe(145000);
  });
});

describe('computeGratuity', () => {
  const policy = { daysPerYear: 15, monthDivisor: 26, minYears: 5 };

  it('applies the configured formula (wage × days × years / divisor)', () => {
    // 52,000 × 15 × 10 / 26 = 300,000
    expect(computeGratuity(52000, 10, policy)).toBe(300000);
  });

  it('returns 0 below the eligibility floor', () => {
    expect(computeGratuity(52000, 4, policy)).toBe(0);
  });
});

describe('SLAB() / CLAMP() formula functions', () => {
  it('SLAB() evaluates a registered table by code', () => {
    registerSlabTables({ TEST: SLABS });
    expect(evaluateFormula("SLAB(INCOME, 'TEST')", { INCOME: 1000000 })).toBe(40000);
  });

  it('CLAMP() bounds a value to [lo, hi]', () => {
    expect(evaluateFormula('CLAMP(X, 0, 100)', { X: 150 })).toBe(100);
    expect(evaluateFormula('CLAMP(X, 0, 100)', { X: -5 })).toBe(0);
  });
});
