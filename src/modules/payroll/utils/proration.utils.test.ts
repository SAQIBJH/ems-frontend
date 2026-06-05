import { describe, it, expect } from 'vitest';
import {
  daysInMonth,
  workingDaysInMonth,
  totalDaysForBasis,
  prorationFactor,
} from './proration.utils';

describe('daysInMonth', () => {
  it('handles 30/31-day months and February', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28); // 2026 is not a leap year
    expect(daysInMonth(2024, 2)).toBe(29); // leap year
    expect(daysInMonth(2026, 4)).toBe(30);
  });
});

describe('workingDaysInMonth', () => {
  it('counts Mon–Fri only', () => {
    const wd = workingDaysInMonth(2026, 6);
    expect(wd).toBeGreaterThanOrEqual(20);
    expect(wd).toBeLessThanOrEqual(23);
  });
});

describe('totalDaysForBasis', () => {
  it('returns 30 for FIXED_30 regardless of month', () => {
    expect(totalDaysForBasis('FIXED_30', 2026, 2)).toBe(30);
  });
  it('returns calendar days for CALENDAR_DAYS', () => {
    expect(totalDaysForBasis('CALENDAR_DAYS', 2026, 2)).toBe(28);
  });
});

describe('prorationFactor', () => {
  it('is 1 with no LOP', () => {
    expect(prorationFactor({ basis: 'CALENDAR_DAYS', year: 2026, month: 6 })).toBe(1);
  });
  it('reduces proportionally to LOP days (FIXED_30)', () => {
    expect(prorationFactor({ basis: 'FIXED_30', year: 2026, month: 6, lopDays: 3 })).toBeCloseTo(
      0.9,
      5,
    );
  });
  it('never goes below 0', () => {
    expect(prorationFactor({ basis: 'CALENDAR_DAYS', year: 2026, month: 2, lopDays: 100 })).toBe(0);
  });
});
