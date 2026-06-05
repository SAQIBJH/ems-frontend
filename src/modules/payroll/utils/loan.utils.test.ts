import { describe, it, expect } from 'vitest';
import { addMonths, buildSchedule, computeEmi } from './loan.utils';

describe('addMonths', () => {
  it('advances a YYYY-MM period, rolling over the year', () => {
    expect(addMonths('2026-04', 0)).toBe('2026-04');
    expect(addMonths('2026-11', 3)).toBe('2027-02');
  });
});

describe('computeEmi', () => {
  it('splits principal evenly for an interest-free advance', () => {
    expect(computeEmi(120000, 0, 12, 'ZERO')).toBe(10000);
  });

  it('adds flat interest across the tenure', () => {
    // 1,200,000 + 10% × 1yr (120,000) = 1,320,000 / 12 = 110,000
    expect(computeEmi(1200000, 10, 12, 'FLAT')).toBe(110000);
  });

  it('produces a higher EMI for reducing balance than zero-interest', () => {
    expect(computeEmi(1200000, 10, 12, 'REDUCING')).toBeGreaterThan(100000);
  });
});

describe('buildSchedule', () => {
  it('has one entry per month and clears the balance to zero', () => {
    const schedule = buildSchedule(1200000, 10, 12, 'REDUCING', '2026-04');
    expect(schedule).toHaveLength(12);
    expect(schedule[0].period).toBe('2026-04');
    expect(schedule[11].period).toBe('2027-03');
    expect(schedule[11].balanceAfter).toBe(0);
    // Principal components sum back to the original principal.
    const principalPaid = schedule.reduce((s, e) => s + e.principalComponent, 0);
    expect(principalPaid).toBe(1200000);
  });

  it('zero-interest schedule has no interest component', () => {
    const schedule = buildSchedule(120000, 0, 12, 'ZERO', '2026-01');
    expect(schedule.every((e) => e.interestComponent === 0)).toBe(true);
    expect(schedule[11].balanceAfter).toBe(0);
  });
});
