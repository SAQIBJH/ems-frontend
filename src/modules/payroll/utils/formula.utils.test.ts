import { describe, it, expect } from 'vitest';
import {
  computeComponentBreakdown,
  computeComponentTotals,
  validateFormula,
} from './formula.utils';
import type { SalaryComponent } from '../types/payroll.types';

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
});
