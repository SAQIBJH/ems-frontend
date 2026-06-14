/**
 * Money is handled as integer **minor units** (paise/cents) + an ISO 4217 currency
 * code, to avoid floating-point drift. Display formatting is locale-driven and
 * zero-decimal-currency aware (JPY, KRW, …) and three-decimal aware (KWD, BHD, …).
 */

// ISO 4217 currencies with 0 minor-unit digits.
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

// ISO 4217 currencies with 3 minor-unit digits.
const THREE_DECIMAL_CURRENCIES = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

const CURRENCY_LOCALE: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'en-IE',
  AED: 'en-AE',
  SGD: 'en-SG',
  JPY: 'ja-JP',
  KWD: 'ar-KW',
};

/** Number of minor-unit digits for a currency (defaults to 2). */
export function currencyDecimals(currency: string): number {
  const c = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(c)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(c)) return 3;
  return 2;
}

/** A sensible default display locale for a currency. */
export function localeForCurrency(currency: string): string {
  return CURRENCY_LOCALE[currency.toUpperCase()] ?? 'en-US';
}

/**
 * Whether a code is a real ISO 4217 currency that `Intl.NumberFormat({style:'currency'})`
 * can format. Guards the non-ISO run-header sentinel `"MULTI"` (a run spanning multiple
 * pay-group currencies) and any malformed code, which otherwise throw `RangeError`.
 */
export function isFormattableCurrency(code?: string | null): boolean {
  const c = (code ?? '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) return false; // 'MULTI' (5 chars), '', 'US' → false
  try {
    new Intl.NumberFormat('en', { style: 'currency', currency: c });
    return true;
  } catch {
    return false;
  }
}

/** Convert a major-unit amount (e.g. 1234.50) to integer minor units (123450). */
export function toMinor(major: number, currency: string): number {
  return Math.round(major * 10 ** currencyDecimals(currency));
}

/** Convert integer minor units (123450) back to a major-unit amount (1234.50). */
export function fromMinor(minor: number, currency: string): number {
  return minor / 10 ** currencyDecimals(currency);
}

export interface FormatMoneyOptions {
  locale?: string;
  /** Override the displayed fraction digits (e.g. 0 to hide paise/cents). */
  fractionDigits?: number;
}

/** Format a **major-unit** amount as currency (for legacy major-unit data). */
export function formatMajor(
  major: number,
  currency: string,
  opts: FormatMoneyOptions = {},
): string {
  const code = (currency ?? '').toUpperCase();
  const digits = opts.fractionDigits ?? currencyDecimals(code);
  const locale = opts.locale ?? localeForCurrency(code);
  // Non-ISO sentinels like the multi-currency run-header "MULTI" can't be formatted as a
  // currency (Intl throws RangeError) — fall back to a plain number suffixed with the code.
  if (!isFormattableCurrency(code)) {
    const n = new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(major);
    return code ? `${n} ${code}` : n;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(major);
}

/** Format integer **minor units** as currency — the canonical payroll formatter. */
export function formatMoney(
  minor: number,
  currency: string,
  opts: FormatMoneyOptions = {},
): string {
  return formatMajor(fromMinor(minor, currency), currency, opts);
}
