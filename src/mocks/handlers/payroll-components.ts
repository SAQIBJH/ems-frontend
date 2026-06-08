import { http, HttpResponse } from 'msw';
import type {
  SalaryComponent,
  ComponentType,
  CostCenterRule,
} from '@/modules/payroll/types/payroll.types';

let components: SalaryComponent[] = [
  {
    id: 'comp-001',
    name: 'Basic Salary',
    code: 'BASIC',
    type: 'EARNING',
    calculationType: 'FLAT',
    value: 50000,
    basisCode: null,
    formula: null,
    taxable: true,
    active: true,
    displayOrder: 1,
    description: 'Fixed base salary',
    statutoryTag: 'PF_WAGE',
    prorate: true,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-002',
    name: 'House Rent Allowance',
    code: 'HRA',
    type: 'EARNING',
    calculationType: 'PERCENTAGE',
    value: 40,
    basisCode: 'BASIC',
    formula: null,
    taxable: false,
    active: true,
    displayOrder: 2,
    description: '40% of basic salary',
    statutoryTag: null,
    prorate: true,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-003',
    name: 'Leave Travel Allowance',
    code: 'LTA',
    type: 'EARNING',
    calculationType: 'FLAT',
    value: 5000,
    basisCode: null,
    formula: null,
    taxable: false,
    active: true,
    displayOrder: 3,
    description: 'Annual LTA divided monthly',
    statutoryTag: null,
    prorate: true,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-004',
    name: 'Special Allowance',
    code: 'SPECIAL_ALLOW',
    type: 'EARNING',
    calculationType: 'FORMULA',
    value: null,
    basisCode: null,
    formula: 'CTC - BASIC - HRA - LTA - PF',
    taxable: true,
    active: true,
    displayOrder: 4,
    description: 'Fills remaining CTC after other components',
    statutoryTag: null,
    prorate: true,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-005',
    name: 'Provident Fund',
    code: 'PF',
    type: 'DEDUCTION',
    calculationType: 'PERCENTAGE',
    value: 12,
    basisCode: 'BASIC',
    formula: null,
    taxable: false,
    active: true,
    displayOrder: 10,
    description: 'Employee PF contribution at 12% of basic',
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-006',
    name: 'Professional Tax',
    code: 'PROF_TAX',
    type: 'DEDUCTION',
    calculationType: 'FORMULA',
    value: null,
    basisCode: null,
    formula: 'IF(BASIC > 15000, 200, 0)',
    taxable: false,
    active: true,
    displayOrder: 11,
    description: 'State professional tax (Maharashtra slab)',
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-007',
    name: 'TDS (Income Tax)',
    code: 'TDS',
    type: 'DEDUCTION',
    calculationType: 'FORMULA',
    value: null,
    basisCode: null,
    formula: 'BASIC * 0.132',
    taxable: false,
    active: true,
    displayOrder: 12,
    description: 'TDS based on estimated income tax',
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-008',
    name: 'Medical Allowance',
    code: 'MEDICAL',
    type: 'BENEFIT',
    calculationType: 'FLAT',
    value: 1250,
    basisCode: null,
    formula: null,
    taxable: false,
    active: true,
    displayOrder: 5,
    description: 'Monthly medical reimbursement',
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-009',
    name: 'Provident Fund (Employer)',
    code: 'PF_ER',
    type: 'EMPLOYER_CONTRIBUTION',
    calculationType: 'PERCENTAGE',
    value: 12,
    basisCode: 'BASIC',
    formula: null,
    taxable: false,
    active: true,
    displayOrder: 20,
    description: 'Employer PF contribution at 12% of basic (employer cost, not a deduction)',
    statutoryTag: 'PF_WAGE',
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-010',
    name: 'Overtime',
    code: 'OT',
    type: 'VARIABLE',
    calculationType: 'PERCENTAGE',
    // value = OT rate as a percent of the normal hourly rate (150 = 1.5×).
    value: 150,
    basisCode: null,
    formula: null,
    taxable: true,
    active: true,
    displayOrder: 6,
    description: 'Overtime — input hours priced at this configurable multiplier of hourly pay',
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-014',
    name: 'Shift Differential',
    code: 'SHIFT',
    type: 'VARIABLE',
    calculationType: 'PERCENTAGE',
    // value = night/shift rate as a percent of the normal hourly rate (130 = 1.3×).
    value: 130,
    basisCode: null,
    formula: null,
    taxable: true,
    active: true,
    displayOrder: 13,
    description: 'Night-shift differential — input hours priced at this multiplier of hourly pay',
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-015',
    name: 'On-call Allowance',
    code: 'ONCALL',
    type: 'VARIABLE',
    calculationType: 'PERCENTAGE',
    // value = standby rate as a percent of the normal hourly rate (50 = 0.5×).
    value: 50,
    basisCode: null,
    formula: null,
    taxable: true,
    active: true,
    displayOrder: 14,
    description: 'On-call / standby pay — input hours priced at this multiplier of hourly pay',
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-016',
    name: 'Company Car Perquisite',
    code: 'CAR_PERK',
    type: 'BENEFIT',
    calculationType: 'FLAT',
    // Non-cash perquisite: a taxable benefit-in-kind. Adds to taxable income,
    // never to gross or net pay (employer cost only).
    value: 1800,
    basisCode: null,
    formula: null,
    taxable: true,
    active: true,
    displayOrder: 21,
    description: 'Non-cash perquisite (benefit-in-kind) — taxable value, not paid in cash',
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'comp-017',
    name: '13th Month Pay',
    code: 'THIRTEENTH',
    type: 'EARNING',
    calculationType: 'FORMULA',
    value: null,
    basisCode: null,
    formula: 'BASIC',
    taxable: true,
    active: true,
    displayOrder: 15,
    description: 'Scheduled 13th-month pay (one month of basic) — paid in December only',
    statutoryTag: null,
    prorate: false,
    // Scheduled component: only emitted in calendar month 12 (December).
    payInPeriods: [12],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  ...(
    [
      ['comp-011', 'INCENTIVE', 'Incentive', 7],
      ['comp-012', 'COMMISSION', 'Commission', 8],
      ['comp-013', 'BONUS', 'Bonus', 9],
      ['comp-014', 'ARREARS', 'Arrears', 10],
    ] as const
  ).map(([id, code, name, displayOrder]) => ({
    id,
    name,
    code,
    type: 'VARIABLE' as const,
    calculationType: 'FLAT' as const,
    // Input-driven: the amount is supplied per run via variable-pay inputs.
    value: null,
    basisCode: null,
    formula: null,
    taxable: true,
    active: true,
    displayOrder,
    description: `${name} — variable pay entered per run`,
    statutoryTag: null,
    prorate: false,
    payInPeriods: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  })),
];

/* ── GL account seed (§11) — accounting config, editable per component ──────── */

// Per-component GL account. The chart of accounts is tenant config; the journal
// engine reads these — it never derives an account from a country rule.
const GL_SEED: Record<string, string> = {
  BASIC: '5000 — Salaries & wages',
  HRA: '5010 — House rent allowance',
  LTA: '5020 — Leave travel allowance',
  SPECIAL_ALLOW: '5030 — Special allowance',
  MEDICAL: '5040 — Employee benefits',
  OT: '5050 — Overtime & shift',
  SHIFT: '5050 — Overtime & shift',
  ONCALL: '5050 — Overtime & shift',
  THIRTEENTH: '5060 — Statutory bonus',
  INCENTIVE: '5070 — Incentives & bonus',
  COMMISSION: '5070 — Incentives & bonus',
  BONUS: '5070 — Incentives & bonus',
  CAR_PERK: '5080 — Perquisites',
  PF: '2200 — Provident fund payable',
  PROF_TAX: '2210 — Professional tax payable',
  TDS: '2300 — TDS payable',
  PF_ER: '5100 — Employer PF expense',
};

// Default account by type when a component has no explicit GL account configured.
const GL_DEFAULT: Record<ComponentType, string> = {
  EARNING: '5000 — Salaries & wages',
  DEDUCTION: '2390 — Other payables',
  EMPLOYER_CONTRIBUTION: '5100 — Employer contributions',
  BENEFIT: '5040 — Employee benefits',
  REIMBURSEMENT: '5090 — Reimbursements',
  VARIABLE: '5070 — Variable pay',
};

// Expense-side components are cost-centred by department; liabilities are not.
function defaultCostCenterRule(type: ComponentType): CostCenterRule {
  return type === 'DEDUCTION' ? 'NONE' : 'DEPARTMENT';
}

// Inject accounting config into every seed component (tenant config, overridable).
components = components.map((c) => ({
  ...c,
  glAccountCode: c.glAccountCode ?? GL_SEED[c.code] ?? GL_DEFAULT[c.type],
  costCenterRule: c.costCenterRule ?? defaultCostCenterRule(c.type),
}));

let idCounter = 100;

export function getComponentById(id: string) {
  return components.find((c) => c.id === id);
}

export function getComponentByCode(code: string) {
  return components.find((c) => c.code === code);
}

export const payrollComponentHandlers = [
  http.get('/api/payroll/components', ({ request }) => {
    const url = new URL(request.url);
    const active = url.searchParams.get('active');
    let result = components;
    if (active === 'true') result = result.filter((c) => c.active);
    if (active === 'false') result = result.filter((c) => !c.active);
    return HttpResponse.json({ success: true, data: result });
  }),

  http.post('/api/payroll/components', async ({ request }) => {
    const body = (await request.json()) as Omit<SalaryComponent, 'id' | 'createdAt' | 'updatedAt'>;
    if (components.some((c) => c.code === body.code)) {
      return HttpResponse.json(
        { success: false, error: { code: 'CODE_EXISTS', message: 'Code already taken' } },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    const created: SalaryComponent = {
      ...body,
      payInPeriods: body.payInPeriods ?? null,
      glAccountCode: body.glAccountCode ?? GL_DEFAULT[body.type],
      costCenterRule: body.costCenterRule ?? defaultCostCenterRule(body.type),
      id: `comp-${++idCounter}`,
      createdAt: now,
      updatedAt: now,
    };
    components = [...components, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch('/api/payroll/components/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<SalaryComponent>;
    const idx = components.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Component not found' } },
        { status: 404 },
      );
    }
    const updated: SalaryComponent = {
      ...components[idx],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    components = [...components.slice(0, idx), updated, ...components.slice(idx + 1)];
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.delete('/api/payroll/components/:id', ({ params }) => {
    const { id } = params as { id: string };
    const comp = components.find((c) => c.id === id);
    if (!comp) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Component not found' } },
        { status: 404 },
      );
    }
    // Check if any active component references this code
    const affectedComponents = components
      .filter((c) => c.id !== id && c.active)
      .filter(
        (c) => c.basisCode === comp.code || (c.formula != null && c.formula.includes(comp.code)),
      )
      .map((c) => c.code);
    if (affectedComponents.length > 0) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'COMPONENT_IN_USE',
            message: `${comp.code} is referenced by other components`,
            details: { affectedComponents, affectedPayGroups: [] },
          },
        },
        { status: 409 },
      );
    }
    components = components.filter((c) => c.id !== id);
    return HttpResponse.json({ success: true, data: { deleted: true } });
  }),
];
