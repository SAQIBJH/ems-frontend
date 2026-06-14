import { describe, it, expect } from 'vitest';
import {
  WEEK_DAYS,
  deriveWorkWeekDays,
  deriveWorkWeekPattern,
  formatWorkWeek,
} from './work-week.utils';

describe('WEEK_DAYS', () => {
  it('is the 7 days, Sunday-first', () => {
    expect(WEEK_DAYS).toEqual(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
  });
});

describe('deriveWorkWeekDays (legacy enum → day-set)', () => {
  it('MON-FRI → Mon..Fri', () => {
    expect(deriveWorkWeekDays('MON-FRI')).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  });
  it('MON-SAT → Mon..Sat', () => {
    expect(deriveWorkWeekDays('MON-SAT')).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
  });
});

describe('deriveWorkWeekPattern (day-set → best-effort legacy enum)', () => {
  it('a Saturday-inclusive week → MON-SAT', () => {
    expect(deriveWorkWeekPattern(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])).toBe('MON-SAT');
  });
  it('a standard week → MON-FRI', () => {
    expect(deriveWorkWeekPattern(['MON', 'TUE', 'WED', 'THU', 'FRI'])).toBe('MON-FRI');
  });
  it('UAE Sun–Thu (no Saturday) → MON-FRI (lossy; real days carried separately)', () => {
    expect(deriveWorkWeekPattern(['SUN', 'MON', 'TUE', 'WED', 'THU'])).toBe('MON-FRI');
  });
});

describe('formatWorkWeek (display)', () => {
  it('renders a contiguous run as a range', () => {
    expect(formatWorkWeek(['SUN', 'MON', 'TUE', 'WED', 'THU'])).toBe('Sun–Thu');
    expect(formatWorkWeek(['MON', 'TUE', 'WED', 'THU', 'FRI'])).toBe('Mon–Fri');
    expect(formatWorkWeek(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])).toBe('Mon–Sat');
  });
  it('renders a non-contiguous set as a comma list (input order normalized)', () => {
    expect(formatWorkWeek(['FRI', 'MON', 'WED'])).toBe('Mon, Wed, Fri');
  });
  it('renders a single day as itself, empty as a dash', () => {
    expect(formatWorkWeek(['MON'])).toBe('Mon');
    expect(formatWorkWeek([])).toBe('—');
  });
});
