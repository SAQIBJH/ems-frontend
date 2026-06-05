import { http, HttpResponse } from 'msw';
import type { StatutoryPack, StatutoryPackInput } from '@/modules/payroll/types/statutory.types';

/**
 * Versioned, country-scoped statutory packs. The pack is the single source of
 * tax slabs / contribution rates / local taxes — no rate ever lives in code.
 * Seeded with starter packs for India and the US; a tenant clones + adjusts.
 */
let packs: StatutoryPack[] = [
  {
    id: 'pack_in_2026',
    country: 'IN',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    effectiveTo: null,
    rounding: { mode: 'NEAREST', precision: 0 },
    proration: { basis: 'CALENDAR_DAYS' },
    taxRegimes: [
      {
        code: 'IN_NEW_REGIME',
        fiscalYear: '2026-27',
        currency: 'INR',
        standardDeduction: 7500000,
        slabs: [
          { from: 0, to: 40000000, rate: 0 },
          { from: 40000000, to: 80000000, rate: 5 },
          { from: 80000000, to: 120000000, rate: 10 },
          { from: 120000000, to: 160000000, rate: 15 },
          { from: 160000000, to: 200000000, rate: 20 },
          { from: 200000000, to: 240000000, rate: 25 },
          { from: 240000000, to: null, rate: 30 },
        ],
        surcharge: [{ thresholdAnnual: 500000000, rate: 10 }],
        cess: { rate: 4 },
        // New regime: concessional rates, but exemptions are not allowed.
        allowedExemptions: ['STD_DEDUCTION'],
      },
      {
        code: 'IN_OLD_REGIME',
        fiscalYear: '2026-27',
        currency: 'INR',
        standardDeduction: 5000000,
        slabs: [
          { from: 0, to: 25000000, rate: 0 },
          { from: 25000000, to: 50000000, rate: 5 },
          { from: 50000000, to: 100000000, rate: 20 },
          { from: 100000000, to: null, rate: 30 },
        ],
        surcharge: [{ thresholdAnnual: 500000000, rate: 10 }],
        cess: { rate: 4 },
        // Old regime: higher rates, but investment/HRA exemptions are allowed.
        allowedExemptions: ['STD_DEDUCTION', '80C', '80D', 'HRA', 'LTA'],
      },
    ],
    contributionSchemes: [
      {
        code: 'IN_EPF',
        name: "Employees' Provident Fund",
        wageBaseTag: 'PF_WAGE',
        wageCeiling: 1500000,
        employee: { rate: 12, component: 'PF' },
        employer: { rate: 12, component: 'PF_ER', split: { EPS: 8.33, EPF: 3.67 } },
        applicability: 'GROSS_BELOW_CEILING_OPTIONAL',
      },
      {
        code: 'IN_ESI',
        name: 'Employees State Insurance',
        wageBaseTag: 'ESI_WAGE',
        wageCeiling: 2100000,
        employee: { rate: 0.75, component: 'ESI_EE' },
        employer: { rate: 3.25, component: 'ESI_ER' },
        applicability: 'GROSS_BELOW_CEILING_MANDATORY',
      },
    ],
    localTaxes: [
      {
        code: 'IN_MH_PT',
        name: 'Professional Tax (Maharashtra)',
        jurisdiction: 'IN-MH',
        component: 'PROF_TAX',
        slabs: [
          { from: 0, to: 750000, amount: 0 },
          { from: 750000, to: 1000000, amount: 17500 },
          { from: 1000000, to: null, amount: 20000 },
        ],
      },
      {
        code: 'IN_KA_PT',
        name: 'Professional Tax (Karnataka)',
        jurisdiction: 'IN-KA',
        component: 'PROF_TAX',
        slabs: [
          { from: 0, to: 2500000, amount: 0 },
          { from: 2500000, to: null, amount: 20000 },
        ],
      },
    ],
    gratuity: { daysPerYear: 15, monthDivisor: 26, minYears: 5 },
    minimumWages: [
      { jurisdiction: 'IN-MH', monthlyFloor: 1500000 },
      { jurisdiction: 'IN-KA', monthlyFloor: 1400000 },
    ],
    statutoryComponents: ['PF', 'PF_ER', 'ESI_EE', 'ESI_ER', 'PROF_TAX', 'TDS'],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'pack_in_2025',
    country: 'IN',
    version: '2025.1',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    rounding: { mode: 'NEAREST', precision: 0 },
    proration: { basis: 'CALENDAR_DAYS' },
    taxRegimes: [
      {
        code: 'IN_NEW_REGIME',
        fiscalYear: '2025-26',
        currency: 'INR',
        standardDeduction: 5000000,
        slabs: [
          { from: 0, to: 30000000, rate: 0 },
          { from: 30000000, to: 70000000, rate: 5 },
          { from: 70000000, to: 100000000, rate: 10 },
          { from: 100000000, to: 120000000, rate: 15 },
          { from: 120000000, to: 150000000, rate: 20 },
          { from: 150000000, to: null, rate: 30 },
        ],
        surcharge: [{ thresholdAnnual: 500000000, rate: 10 }],
        cess: { rate: 4 },
        allowedExemptions: ['STD_DEDUCTION', '80C', '80D', 'HRA', 'LTA'],
      },
    ],
    contributionSchemes: [
      {
        code: 'IN_EPF',
        name: "Employees' Provident Fund",
        wageBaseTag: 'PF_WAGE',
        wageCeiling: 1500000,
        employee: { rate: 12, component: 'PF' },
        employer: { rate: 12, component: 'PF_ER', split: { EPS: 8.33, EPF: 3.67 } },
        applicability: 'GROSS_BELOW_CEILING_OPTIONAL',
      },
    ],
    localTaxes: [
      {
        code: 'IN_MH_PT',
        name: 'Professional Tax (Maharashtra)',
        jurisdiction: 'IN-MH',
        component: 'PROF_TAX',
        slabs: [
          { from: 0, to: 750000, amount: 0 },
          { from: 750000, to: null, amount: 20000 },
        ],
      },
    ],
    gratuity: { daysPerYear: 15, monthDivisor: 26, minYears: 5 },
    statutoryComponents: ['PF', 'PF_ER', 'ESI_EE', 'ESI_ER', 'PROF_TAX', 'TDS'],
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'pack_us_2026',
    country: 'US',
    version: '2026.1',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    rounding: { mode: 'NEAREST', precision: 0 },
    proration: { basis: 'CALENDAR_DAYS' },
    taxRegimes: [
      {
        code: 'US_FEDERAL_SINGLE',
        fiscalYear: '2026',
        currency: 'USD',
        standardDeduction: 1500000,
        slabs: [
          { from: 0, to: 1160000, rate: 10 },
          { from: 1160000, to: 4715000, rate: 12 },
          { from: 4715000, to: 10052500, rate: 22 },
          { from: 10052500, to: null, rate: 24 },
        ],
        cess: null,
        allowedExemptions: ['STD_DEDUCTION', '401K'],
      },
    ],
    contributionSchemes: [
      {
        code: 'US_SOCIAL_SECURITY',
        name: 'Social Security (OASDI)',
        wageBaseTag: 'FICA_WAGE',
        wageCeiling: 16820000,
        employee: { rate: 6.2, component: 'SS_EE' },
        employer: { rate: 6.2, component: 'SS_ER' },
        applicability: 'GROSS_BELOW_CEILING',
      },
      {
        code: 'US_MEDICARE',
        name: 'Medicare',
        wageBaseTag: 'FICA_WAGE',
        wageCeiling: null,
        employee: { rate: 1.45, component: 'MED_EE' },
        employer: { rate: 1.45, component: 'MED_ER' },
        applicability: 'ALL_WAGES',
      },
    ],
    localTaxes: [],
    statutoryComponents: ['SS_EE', 'SS_ER', 'MED_EE', 'MED_ER', 'FIT'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

/** Lower bound of a pack's effective window (YYYY-MM-DD strings sort lexically). */
function rangesOverlap(
  aFrom: string,
  aTo: string | null,
  bFrom: string,
  bTo: string | null,
): boolean {
  const aEnd = aTo ?? '9999-12-31';
  const bEnd = bTo ?? '9999-12-31';
  return aFrom <= bEnd && bFrom <= aEnd;
}

/**
 * Resolve the pack version in force for a country at a given period (YYYY-MM).
 * The run pins this so recompute is reproducible. Exported for the runs handler.
 */
export function resolveActivePack(country: string, period: string): StatutoryPack | null {
  const onDate = `${period}-01`;
  const candidates = packs
    .filter(
      (p) =>
        p.country === country &&
        p.effectiveFrom <= onDate &&
        (p.effectiveTo === null || p.effectiveTo >= onDate),
    )
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  return candidates[0] ?? null;
}

let idCounter = 100;

export const payrollStatutoryHandlers = [
  http.get('/api/payroll/statutory-packs', ({ request }) => {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    const data = country ? packs.filter((p) => p.country === country.toUpperCase()) : packs;
    return HttpResponse.json({ success: true, data });
  }),

  http.get('/api/payroll/statutory-packs/:id', ({ params }) => {
    const { id } = params as { id: string };
    const pack = packs.find((p) => p.id === id);
    if (!pack) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Statutory pack not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: pack });
  }),

  http.post('/api/payroll/statutory-packs', async ({ request }) => {
    const body = (await request.json()) as StatutoryPackInput;
    const country = body.country.toUpperCase();

    if (packs.some((p) => p.country === country && p.version === body.version)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'PACK_VERSION_EXISTS',
            message: `A ${country} pack with version ${body.version} already exists`,
          },
        },
        { status: 409 },
      );
    }

    const effectiveTo = body.effectiveTo ?? null;
    const overlap = packs.find(
      (p) =>
        p.country === country &&
        rangesOverlap(p.effectiveFrom, p.effectiveTo, body.effectiveFrom, effectiveTo),
    );
    if (overlap) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PACK',
            message: `Effective range overlaps version ${overlap.version}`,
          },
        },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();
    const created: StatutoryPack = {
      ...body,
      country,
      effectiveTo,
      id: `pack_${country.toLowerCase()}_${++idCounter}`,
      createdAt: now,
      updatedAt: now,
    };
    packs = [...packs, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch('/api/payroll/statutory-packs/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<StatutoryPackInput>;
    const idx = packs.findIndex((p) => p.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Statutory pack not found' } },
        { status: 404 },
      );
    }
    const updated: StatutoryPack = {
      ...packs[idx],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    packs = [...packs.slice(0, idx), updated, ...packs.slice(idx + 1)];
    return HttpResponse.json({ success: true, data: updated });
  }),
];
