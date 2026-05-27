import { http, HttpResponse } from 'msw';
import type { SalaryComponent } from '@/modules/payroll/types/payroll.types';

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
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
];

let idCounter = 100;

export function getComponentById(id: string) {
  return components.find((c) => c.id === id);
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
