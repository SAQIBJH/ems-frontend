/**
 * Runtime verification of Step 118 run-type compute (Bonus / Arrears / Off-cycle /
 * Reversal). Exercises the exact engine functions the UI calls, against the seeded
 * roster + statutory pack. Locks the variable-pay units fix (minor → major) as a
 * regression test.
 */
import { describe, it, expect } from 'vitest';
import {
  computeExtraPayRun,
  computeRun,
  negateComputedRun,
  BONUS_COMPONENT_CODES,
  ARREARS_COMPONENT_CODES,
} from './payroll-engine';
import type { PayrollInput } from '@/modules/payroll/types/payroll.types';
import { toMinor } from '@/modules/payroll/utils/money.utils';

const PERIOD = '2026-06';

/** Build a run input the way the inputs UI does — variable pay in MINOR units. */
function vpInput(employeeId: string, variablePayMajor: Record<string, number>): PayrollInput {
  const variablePay: Record<string, number> = {};
  for (const [code, major] of Object.entries(variablePayMajor)) {
    variablePay[code] = toMinor(major, 'INR');
  }
  return {
    employeeId,
    employeeCode: '',
    employeeName: '',
    lopDays: 0,
    leaveDays: 0,
    otHours: 0,
    shiftHours: 0,
    onCallHours: 0,
    variablePay,
    oneTime: [],
  };
}

describe('Step 118 — run-type compute (runtime)', () => {
  it('Bonus: pays the entered amount in MAJOR units (not 100×) and withholds tax', () => {
    const inputs = { 'emp-004': vpInput('emp-004', { BONUS: 50000 }) }; // Priya — ₹50,000
    const run = computeExtraPayRun('run-t-bonus', PERIOD, 'PENDING', inputs, BONUS_COMPONENT_CODES);

    expect(run.items).toHaveLength(1);
    const slip = run.items[0];
    expect(slip.employeeId).toBe('emp-004');
    // The fix: gross == 50,000 — NOT 5,000,000 (the minor-units bug).
    expect(slip.grossEarnings).toBe(50000);
    expect(slip.netPay).toBeGreaterThanOrEqual(0);
    expect(slip.netPay).toBeLessThanOrEqual(50000);
    expect(slip.totalDeductions).toBe(50000 - slip.netPay);
  });

  it('Bonus: only includes employees who were given an amount', () => {
    const inputs = { 'emp-001': vpInput('emp-001', { BONUS: 100000 }) };
    const run = computeExtraPayRun(
      'run-t-bonus2',
      PERIOD,
      'PENDING',
      inputs,
      BONUS_COMPONENT_CODES,
    );
    expect(run.items.map((i) => i.employeeId)).toEqual(['emp-001']);
    expect(run.items[0].grossEarnings).toBe(100000);
  });

  it('Arrears: pays only the ARREARS component, ignoring a stray BONUS amount', () => {
    const inputs = { 'emp-004': vpInput('emp-004', { ARREARS: 20000, BONUS: 99999 }) };
    const run = computeExtraPayRun('run-t-arr', PERIOD, 'PENDING', inputs, ARREARS_COMPONENT_CODES);
    expect(run.items).toHaveLength(1);
    expect(run.items[0].grossEarnings).toBe(20000); // BONUS ignored by an arrears run
  });

  it('Off-cycle: computes only the selected employees, with full payslips', () => {
    const all = computeRun('run-t-reg', PERIOD, 'PENDING');
    const subset = computeRun('run-t-oc', PERIOD, 'PENDING', undefined, undefined, [
      'emp-005',
      'emp-006',
    ]);
    expect(subset.items.map((i) => i.employeeId).sort()).toEqual(['emp-005', 'emp-006']);
    expect(subset.items.length).toBeLessThan(all.items.length);
    // A real salary payslip (not a tiny bonus) — gross is well above zero.
    expect(subset.items[0].grossEarnings).toBeGreaterThan(10000);
  });

  it('Reversal: negates every total of the target run', () => {
    const original = computeRun('run-003', '2026-04', 'PAID');
    const reversal = negateComputedRun('run-t-rev', original, 'PENDING');

    expect(reversal.items.length).toBe(original.items.length);
    expect(reversal.totals.totalGross).toBe(-original.totals.totalGross);
    expect(reversal.totals.totalNet).toBe(-original.totals.totalNet);
    expect(reversal.totals.totalDeductions).toBe(-original.totals.totalDeductions);
    for (const it of reversal.items) {
      expect(it.netPay).toBeLessThanOrEqual(0); // each payslip is offset to negative
    }
  });
});
