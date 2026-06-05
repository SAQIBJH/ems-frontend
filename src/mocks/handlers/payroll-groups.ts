import { http, HttpResponse } from 'msw';
import type {
  PayGroup,
  PayGroupComponentInput,
  PayScheduleRecord,
} from '@/modules/payroll/types/payroll.types';
import { getComponentById } from './payroll-components';

let groups: PayGroup[] = [
  {
    id: 'pg-001',
    name: 'Standard India — Engineering',
    code: 'STANDARD_IND_ENG',
    currency: 'INR',
    paySchedule: 'MONTHLY',
    description: 'Standard compensation for engineering band',
    active: true,
    employeeCount: 12,
    components: [
      {
        componentId: 'comp-001',
        componentCode: 'BASIC',
        componentName: 'Basic Salary',
        componentType: 'EARNING',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        componentId: 'comp-002',
        componentCode: 'HRA',
        componentName: 'House Rent Allowance',
        componentType: 'EARNING',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        componentId: 'comp-003',
        componentCode: 'LTA',
        componentName: 'Leave Travel Allowance',
        componentType: 'EARNING',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        componentId: 'comp-004',
        componentCode: 'SPECIAL_ALLOW',
        componentName: 'Special Allowance',
        componentType: 'EARNING',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        componentId: 'comp-005',
        componentCode: 'PF',
        componentName: 'Provident Fund',
        componentType: 'DEDUCTION',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        componentId: 'comp-006',
        componentCode: 'PROF_TAX',
        componentName: 'Professional Tax',
        componentType: 'DEDUCTION',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        componentId: 'comp-007',
        componentCode: 'TDS',
        componentName: 'TDS (Income Tax)',
        componentType: 'DEDUCTION',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        componentId: 'comp-009',
        componentCode: 'PF_ER',
        componentName: 'Provident Fund (Employer)',
        componentType: 'EMPLOYER_CONTRIBUTION',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        // Benefit-in-kind: a taxable non-cash perquisite (employer cost only).
        componentId: 'comp-016',
        componentCode: 'CAR_PERK',
        componentName: 'Company Car Perquisite',
        componentType: 'BENEFIT',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
      {
        // Scheduled earning: 13th-month pay, emitted only in December (payInPeriods).
        componentId: 'comp-017',
        componentCode: 'THIRTEENTH',
        componentName: '13th Month Pay',
        componentType: 'EARNING',
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      },
    ],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'pg-002',
    name: 'US Hourly',
    code: 'US_HOURLY',
    currency: 'USD',
    paySchedule: 'BIWEEKLY',
    description: 'Bi-weekly hourly compensation',
    active: true,
    employeeCount: 3,
    components: [
      {
        componentId: 'comp-001',
        componentCode: 'BASIC',
        componentName: 'Basic Salary',
        componentType: 'EARNING',
        overrideCalculationType: 'FLAT',
        overrideValue: 3500,
        overrideFormula: null,
      },
    ],
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-02-01T10:00:00.000Z',
  },
];

const schedules: PayScheduleRecord[] = [
  {
    id: 'sched-001',
    name: 'Bi-weekly US',
    frequency: 'BIWEEKLY',
    startDate: '2024-01-01',
    timezone: 'America/New_York',
    nextRunDate: '2024-06-28',
    active: true,
  },
];

function enrichComponents(inputs: Array<PayGroupComponentInput>) {
  return inputs.map((gc) => {
    const base = getComponentById(gc.componentId);
    return {
      componentId: gc.componentId,
      componentCode: base?.code ?? gc.componentId,
      componentName: base?.name ?? gc.componentId,
      componentType: base?.type ?? 'EARNING',
      overrideCalculationType: gc.overrideCalculationType ?? null,
      overrideValue: gc.overrideValue ?? null,
      overrideFormula: gc.overrideFormula ?? null,
    };
  });
}

let idCounter = 100;

export function getGroupById(id: string): PayGroup | undefined {
  return groups.find((g) => g.id === id);
}

export const payrollGroupHandlers = [
  http.get('/api/payroll/groups', () => {
    return HttpResponse.json({ success: true, data: groups });
  }),

  http.post('/api/payroll/groups', async ({ request }) => {
    const body = (await request.json()) as Omit<
      PayGroup,
      'id' | 'employeeCount' | 'createdAt' | 'updatedAt'
    >;
    if (groups.some((g) => g.code === body.code)) {
      return HttpResponse.json(
        { success: false, error: { code: 'CODE_EXISTS', message: 'Code already taken' } },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    const created: PayGroup = {
      ...body,
      components: enrichComponents(body.components as unknown as PayGroupComponentInput[]),
      id: `pg-${++idCounter}`,
      employeeCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    groups = [...groups, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch('/api/payroll/groups/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<PayGroup>;
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Pay group not found' } },
        { status: 404 },
      );
    }
    const updated: PayGroup = {
      ...groups[idx],
      ...body,
      components: body.components
        ? enrichComponents(body.components as unknown as PayGroupComponentInput[])
        : groups[idx].components,
      id,
      updatedAt: new Date().toISOString(),
    };
    groups = [...groups.slice(0, idx), updated, ...groups.slice(idx + 1)];
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.delete('/api/payroll/groups/:id', ({ params }) => {
    const { id } = params as { id: string };
    const group = groups.find((g) => g.id === id);
    if (!group) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Pay group not found' } },
        { status: 404 },
      );
    }
    if (group.employeeCount > 0) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'GROUP_HAS_EMPLOYEES',
            message: 'Cannot delete a pay group with assigned employees',
            details: [{ employeeCount: group.employeeCount }],
          },
        },
        { status: 409 },
      );
    }
    groups = groups.filter((g) => g.id !== id);
    return HttpResponse.json({ success: true, data: { deleted: true } });
  }),

  http.get('/api/payroll/schedules', () => {
    return HttpResponse.json({ success: true, data: schedules });
  }),
];
