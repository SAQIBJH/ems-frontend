import { describe, it, expect } from 'vitest';
import { currencyDecimals, toMinor, fromMinor, formatMoney, formatMajor } from './money.utils';

describe('currencyDecimals', () => {
  it('defaults to 2 decimals', () => {
    expect(currencyDecimals('INR')).toBe(2);
    expect(currencyDecimals('USD')).toBe(2);
  });
  it('knows zero-decimal currencies', () => {
    expect(currencyDecimals('JPY')).toBe(0);
    expect(currencyDecimals('KRW')).toBe(0);
  });
  it('knows three-decimal currencies', () => {
    expect(currencyDecimals('KWD')).toBe(3);
  });
});

describe('toMinor / fromMinor', () => {
  it('round-trips a 2-decimal currency without drift', () => {
    expect(toMinor(1234.5, 'INR')).toBe(123450);
    expect(fromMinor(123450, 'INR')).toBe(1234.5);
  });
  it('treats zero-decimal currencies as whole units', () => {
    expect(toMinor(1000, 'JPY')).toBe(1000);
    expect(fromMinor(1000, 'JPY')).toBe(1000);
  });
  it('handles three-decimal currencies', () => {
    expect(toMinor(1.5, 'KWD')).toBe(1500);
    expect(fromMinor(1500, 'KWD')).toBe(1.5);
  });
});

describe('formatMoney (minor units)', () => {
  it('formats INR minor units with Indian grouping', () => {
    // 100,000,000 paise = ₹10,00,000.00
    expect(formatMoney(100_000_000, 'INR')).toContain('10,00,000');
  });
  it('formats zero-decimal currencies without a fraction', () => {
    expect(formatMoney(1000, 'JPY')).not.toContain('.');
  });
});

describe('formatMajor (major units)', () => {
  it('respects a fractionDigits override (hide paise)', () => {
    const out = formatMajor(4_800_000, 'INR', { locale: 'en-IN', fractionDigits: 0 });
    expect(out).toContain('48,00,000');
    expect(out).not.toContain('.00');
  });
});
