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
  it('counts Mon–Fri by default', () => {
    const wd = workingDaysInMonth(2026, 6);
    expect(wd).toBeGreaterThanOrEqual(20);
    expect(wd).toBeLessThanOrEqual(23);
  });

  it('counts more days for a Mon–Sat (6-day) week than Mon–Fri', () => {
    const monFri = workingDaysInMonth(2026, 6, ['MON', 'TUE', 'WED', 'THU', 'FRI']);
    const monSat = workingDaysInMonth(2026, 6, ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
    expect(monSat).toBeGreaterThan(monFri);
  });

  it('honours an arbitrary week (UAE Sun–Thu) — counts Sundays, excludes Fridays', () => {
    const uae = ['SUN', 'MON', 'TUE', 'WED', 'THU'] as const;
    // June 2026: count Sun–Thu days directly and compare.
    const wd = workingDaysInMonth(2026, 6, [...uae]);
    let manual = 0;
    for (let d = 1; d <= 30; d += 1) {
      const dow = new Date(2026, 5, d).getDay(); // 0=Sun..6=Sat
      if (dow !== 5 && dow !== 6) manual += 1; // exclude Fri(5)+Sat(6)
    }
    expect(wd).toBe(manual);
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
