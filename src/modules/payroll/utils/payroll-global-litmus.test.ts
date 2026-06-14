/**
 * FULL-PAYROLL GLOBAL LITMUS — India · Philippines · USA, real 2025/2026 statutory data.
 *
 * Drives the SHIPPED config-driven engine primitives (`formula.utils` / `money.utils`)
 * with each country expressed as pure DATA — no engine code is imported beyond its public
 * API and nothing is special-cased per country. Every expected figure is hand-derived from
 * the cited published rules; the test asserts the engine reproduces them. The numbers it
 * prints are transcribed into `docs/payroll/PAYROLL_ENGINE_LITMUS_2026-06-14.md`.
 *
 * Sources:
 *  - India FY2025-26 new-regime slabs + ₹75,000 std deduction + 4% cess (Union Budget 2025 /
 *    Income Tax Dept); EPF 12% on basic, statutory wage ceiling ₹15,000 (EPFO); Maharashtra
 *    Professional Tax ₹200/mo above ₹10,000.
 *  - Philippines TRAIN graduated income tax (RA 10963, 2023-onward table); SSS 2025 — 15%
 *    total (employee 5% / employer 10%), max MSC ₱35,000.
 *  - USA 2025 federal brackets, single filer (IRS Rev. Proc. 2024-40); standard deduction
 *    $15,000; FICA — Social Security 6.2% to the $176,100 wage base, Medicare 1.45% (no cap).
 */
import { describe, it, expect } from 'vitest';
import { computeRegimeTax, computeContribution, evaluateLocalTax } from './formula.utils';
import { toMinor, fromMinor, formatMoney } from './money.utils';
import type { TaxRegime, ContributionScheme, LocalTaxSlab } from '../types/statutory.types';

/* ── helpers ─────────────────────────────────────────────────────────────────── */

const INR = (n: number) => toMinor(n, 'INR');
const PHP = (n: number) => toMinor(n, 'PHP');
const USD = (n: number) => toMinor(n, 'USD');

interface LitmusLine {
  label: string;
  amount: number; // minor units
}
interface LitmusResult {
  country: string;
  currency: string;
  monthlyGross: number; // minor
  annualTax: number; // minor
  monthlyTax: number; // minor
  employeeDeductions: LitmusLine[]; // minor (excl. tax)
  employerContributions: LitmusLine[]; // minor
  netMonthly: number; // minor
}

function logResult(r: LitmusResult): void {
  const f = (m: number) => formatMoney(m, r.currency);

  console.log(`\n=== ${r.country} (${r.currency}) ===`);
  console.log(`Monthly gross      : ${f(r.monthlyGross)}`);
  console.log(`Income tax (annual): ${f(r.annualTax)}  → monthly ${f(r.monthlyTax)}`);
  for (const l of r.employeeDeductions)
    console.log(`Employee deduction : ${l.label} ${f(l.amount)}`);
  for (const l of r.employerContributions)
    console.log(`Employer contrib.  : ${l.label} ${f(l.amount)}`);
  console.log(`NET (monthly)      : ${f(r.netMonthly)}`);
}

/* ── India ─────────────────────────────────────────────────────────────────────── */

const IN_NEW_REGIME: TaxRegime = {
  code: 'IN_NEW',
  name: 'India New Regime FY2025-26',
  taxCode: 'TDS',
  taxName: 'Income Tax (TDS)',
  fiscalYear: '2025-26',
  currency: 'INR',
  standardDeduction: INR(75_000),
  slabs: [
    { from: INR(0), to: INR(400_000), rate: 0 },
    { from: INR(400_000), to: INR(800_000), rate: 5 },
    { from: INR(800_000), to: INR(1_200_000), rate: 10 },
    { from: INR(1_200_000), to: INR(1_600_000), rate: 15 },
    { from: INR(1_600_000), to: INR(2_000_000), rate: 20 },
    { from: INR(2_000_000), to: INR(2_400_000), rate: 25 },
    { from: INR(2_400_000), to: null, rate: 30 },
  ],
  cess: { rate: 4 },
};

const IN_EPF: ContributionScheme = {
  code: 'EPF',
  name: 'Employees Provident Fund',
  wageBaseTag: 'PF_WAGE',
  wageCeiling: INR(15_000), // statutory monthly ceiling
  employee: { rate: 12, component: 'PF_EE' },
  employer: { rate: 12, component: 'PF_ER' },
};

// Maharashtra Professional Tax (monthly): nil ≤7,500; ₹175 to 10,000; ₹200 above.
const MH_PT_SLABS: LocalTaxSlab[] = [
  { from: INR(0), to: INR(7_500), amount: INR(0) },
  { from: INR(7_500), to: INR(10_000), amount: INR(175) },
  { from: INR(10_000), to: null, amount: INR(200) },
];

describe('Litmus — India (new regime, Maharashtra)', () => {
  const monthlyGross = INR(200_000); // ₹24,00,000 CTC
  const annualTaxable = INR(2_400_000);
  const basicMonthly = INR(100_000);

  const annualTax = computeRegimeTax(annualTaxable, IN_NEW_REGIME);
  const pf = computeContribution(basicMonthly, IN_EPF);
  const pt = evaluateLocalTax(monthlyGross, MH_PT_SLABS);
  const monthlyTax = Math.round(annualTax / 12);
  const netMonthly = monthlyGross - monthlyTax - pf.employee - pt;

  it('income tax = ₹2,92,500/yr (slabs on 23,25,000 after ₹75k std + 4% cess)', () => {
    expect(annualTax).toBe(INR(292_500));
  });
  it('EPF is capped at the ₹15,000 wage ceiling → ₹1,800 EE / ₹1,800 ER', () => {
    expect(pf.employee).toBe(INR(1_800));
    expect(pf.employer).toBe(INR(1_800));
  });
  it('professional tax = ₹200 (local flat band, gross > ₹10,000)', () => {
    expect(pt).toBe(INR(200));
  });
  it('net monthly = ₹1,73,625', () => {
    expect(netMonthly).toBe(INR(173_625));
  });

  it('prints the breakdown', () => {
    logResult({
      country: 'India',
      currency: 'INR',
      monthlyGross,
      annualTax,
      monthlyTax,
      employeeDeductions: [
        { label: 'PF_EE', amount: pf.employee },
        { label: 'PROF_TAX', amount: pt },
      ],
      employerContributions: [{ label: 'PF_ER', amount: pf.employer }],
      netMonthly,
    });
    expect(fromMinor(netMonthly, 'INR')).toBe(173_625);
  });
});

/* ── Philippines ──────────────────────────────────────────────────────────────── */

const PH_TRAIN: TaxRegime = {
  code: 'PH_TRAIN',
  name: 'Philippines TRAIN',
  taxCode: 'WITHHOLDING_TAX',
  taxName: 'Withholding Tax',
  fiscalYear: '2025',
  currency: 'PHP',
  standardDeduction: 0,
  slabs: [
    { from: PHP(0), to: PHP(250_000), rate: 0 },
    { from: PHP(250_000), to: PHP(400_000), rate: 15 },
    { from: PHP(400_000), to: PHP(800_000), rate: 20 },
    { from: PHP(800_000), to: PHP(2_000_000), rate: 25 },
    { from: PHP(2_000_000), to: PHP(8_000_000), rate: 30 },
    { from: PHP(8_000_000), to: null, rate: 35 },
  ],
};

const PH_SSS: ContributionScheme = {
  code: 'SSS',
  name: 'Social Security System',
  wageBaseTag: 'SSS_WAGE',
  wageCeiling: PHP(35_000),
  employee: { rate: 5, component: 'SSS_EE' },
  employer: { rate: 10, component: 'SSS_ER' },
};

describe('Litmus — Philippines (TRAIN + SSS)', () => {
  const monthlyGross = PHP(100_000);
  const annualTaxable = PHP(1_200_000);

  const annualTax = computeRegimeTax(annualTaxable, PH_TRAIN);
  const sss = computeContribution(monthlyGross, PH_SSS);
  const monthlyTax = Math.round(annualTax / 12);
  const netMonthly = monthlyGross - monthlyTax - sss.employee;

  it('income tax = ₱202,500/yr (TRAIN graduated, no standard deduction)', () => {
    expect(annualTax).toBe(PHP(202_500));
  });
  it('SSS capped at ₱35,000 MSC → ₱1,750 EE / ₱3,500 ER', () => {
    expect(sss.employee).toBe(PHP(1_750));
    expect(sss.employer).toBe(PHP(3_500));
  });
  it('net monthly = ₱81,375 (matches the live-verified PH figure)', () => {
    expect(netMonthly).toBe(PHP(81_375));
  });

  it('prints the breakdown', () => {
    logResult({
      country: 'Philippines',
      currency: 'PHP',
      monthlyGross,
      annualTax,
      monthlyTax,
      employeeDeductions: [{ label: 'SSS_EE', amount: sss.employee }],
      employerContributions: [{ label: 'SSS_ER', amount: sss.employer }],
      netMonthly,
    });
    expect(fromMinor(netMonthly, 'PHP')).toBe(81_375);
  });
});

/* ── USA ──────────────────────────────────────────────────────────────────────── */

const US_FEDERAL: TaxRegime = {
  code: 'US_FED',
  name: 'US Federal (single, 2025)',
  taxCode: 'FEDERAL_TAX',
  taxName: 'Federal Income Tax',
  fiscalYear: '2025',
  currency: 'USD',
  standardDeduction: USD(15_000),
  slabs: [
    { from: USD(0), to: USD(11_925), rate: 10 },
    { from: USD(11_925), to: USD(48_475), rate: 12 },
    { from: USD(48_475), to: USD(103_350), rate: 22 },
    { from: USD(103_350), to: USD(197_300), rate: 24 },
    { from: USD(197_300), to: USD(250_525), rate: 32 },
    { from: USD(250_525), to: USD(626_350), rate: 35 },
    { from: USD(626_350), to: null, rate: 37 },
  ],
};

// Social Security: 6.2% up to the $176,100 annual wage base → monthly ceiling $14,675.
const US_SOCIAL_SECURITY: ContributionScheme = {
  code: 'FICA_SS',
  name: 'Social Security (OASDI)',
  wageBaseTag: 'FICA_WAGE',
  wageCeiling: USD(14_675), // 176,100 / 12
  employee: { rate: 6.2, component: 'SS_EE' },
  employer: { rate: 6.2, component: 'SS_ER' },
};

const US_MEDICARE: ContributionScheme = {
  code: 'FICA_MEDICARE',
  name: 'Medicare',
  wageBaseTag: 'FICA_WAGE',
  wageCeiling: null, // uncapped
  employee: { rate: 1.45, component: 'MED_EE' },
  employer: { rate: 1.45, component: 'MED_ER' },
};

describe('Litmus — USA (federal brackets + FICA)', () => {
  const monthlyGross = USD(10_000);
  const annualTaxable = USD(120_000);

  const annualTax = computeRegimeTax(annualTaxable, US_FEDERAL);
  const ss = computeContribution(monthlyGross, US_SOCIAL_SECURITY);
  const medicare = computeContribution(monthlyGross, US_MEDICARE);
  const monthlyTax = annualTax / 12;
  const netMonthly = monthlyGross - monthlyTax - ss.employee - medicare.employee;

  it('federal tax = $18,047/yr (brackets on $105,000 after $15,000 std deduction)', () => {
    expect(annualTax).toBe(USD(18_047));
  });
  it('Social Security = $620/mo EE (6.2%, under the wage base)', () => {
    expect(ss.employee).toBe(USD(620));
    expect(ss.employer).toBe(USD(620));
  });
  it('Medicare = $145/mo EE (1.45%, uncapped)', () => {
    expect(medicare.employee).toBe(USD(145));
  });
  it('net monthly = $7,731.08', () => {
    expect(fromMinor(netMonthly, 'USD')).toBeCloseTo(7_731.08, 2);
  });

  it('prints the breakdown', () => {
    logResult({
      country: 'USA',
      currency: 'USD',
      monthlyGross,
      annualTax,
      monthlyTax: Math.round(monthlyTax),
      employeeDeductions: [
        { label: 'SS_EE', amount: ss.employee },
        { label: 'MED_EE', amount: medicare.employee },
      ],
      employerContributions: [
        { label: 'SS_ER', amount: ss.employer },
        { label: 'MED_ER', amount: medicare.employer },
      ],
      netMonthly: Math.round(netMonthly),
    });
    expect(annualTax).toBe(USD(18_047));
  });
});
