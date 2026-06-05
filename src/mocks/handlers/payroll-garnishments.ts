import { http, HttpResponse } from 'msw';
import type { Garnishment, GarnishmentInput } from '@/modules/payroll/types/payroll.types';

/**
 * Court-ordered garnishments (child/spousal support, tax levies, attachment of
 * earnings, defaulted-loan recovery). Legally mandated, effective-dated, and applied
 * by the engine **after** statutory deductions and **before** voluntary ones, honoring
 * priority + a protected-earnings floor. Money fields are minor units. See §5.7.
 */
const garnishmentsByEmployee: Record<string, Garnishment[]> = {
  'emp-001': [
    {
      id: 'garn-001',
      employeeId: 'emp-001',
      type: 'CHILD_SUPPORT',
      priority: 1,
      amount: { kind: 'PERCENT_OF_DISPOSABLE', value: 20 },
      protectedEarningsFloor: 2500000, // ₹25,000 minimum take-home
      cap: null,
      reference: 'COURT/2026/1234',
      effectiveFrom: '2026-04-01',
      effectiveTo: null,
      createdAt: '2026-03-15T00:00:00.000Z',
    },
  ],
};

/**
 * Active garnishments for an employee in a period (consumed by the run engine).
 * Effective-dated: included when the period falls within [effectiveFrom, effectiveTo].
 */
export function getActiveGarnishments(employeeId: string, period: string): Garnishment[] {
  const onDate = `${period}-01`;
  return (garnishmentsByEmployee[employeeId] ?? []).filter(
    (g) => g.effectiveFrom <= onDate && (g.effectiveTo === null || g.effectiveTo >= onDate),
  );
}

let idCounter = 100;

export const payrollGarnishmentHandlers = [
  http.get('/api/payroll/employees/:employeeId/garnishments', ({ params }) => {
    const { employeeId } = params as { employeeId: string };
    const data = (garnishmentsByEmployee[employeeId] ?? [])
      .slice()
      .sort((a, b) => a.priority - b.priority);
    return HttpResponse.json({ success: true, data });
  }),

  http.post('/api/payroll/employees/:employeeId/garnishments', async ({ params, request }) => {
    const { employeeId } = params as { employeeId: string };
    const input = (await request.json()) as GarnishmentInput;
    if (input.amount.value <= 0 || input.priority < 1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'INVALID_GARNISHMENT', message: 'Invalid amount or priority' },
        },
        { status: 422 },
      );
    }
    const created: Garnishment = {
      id: `garn-${++idCounter}`,
      employeeId,
      type: input.type,
      priority: input.priority,
      amount: input.amount,
      protectedEarningsFloor: input.protectedEarningsFloor,
      cap: input.cap ?? null,
      reference: input.reference,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo ?? null,
      createdAt: new Date().toISOString(),
    };
    garnishmentsByEmployee[employeeId] = [...(garnishmentsByEmployee[employeeId] ?? []), created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch(
    '/api/payroll/employees/:employeeId/garnishments/:garnishmentId',
    async ({ params, request }) => {
      const { employeeId, garnishmentId } = params as {
        employeeId: string;
        garnishmentId: string;
      };
      const body = (await request.json()) as Partial<GarnishmentInput>;
      const list = garnishmentsByEmployee[employeeId] ?? [];
      const idx = list.findIndex((g) => g.id === garnishmentId);
      if (idx === -1) {
        return HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Garnishment not found' } },
          { status: 404 },
        );
      }
      const updated: Garnishment = {
        ...list[idx],
        ...body,
        id: garnishmentId,
        employeeId,
        cap: body.cap === undefined ? list[idx].cap : (body.cap ?? null),
        effectiveTo:
          body.effectiveTo === undefined ? list[idx].effectiveTo : (body.effectiveTo ?? null),
      };
      list[idx] = updated;
      return HttpResponse.json({ success: true, data: updated });
    },
  ),

  http.delete('/api/payroll/employees/:employeeId/garnishments/:garnishmentId', ({ params }) => {
    const { employeeId, garnishmentId } = params as { employeeId: string; garnishmentId: string };
    const list = garnishmentsByEmployee[employeeId] ?? [];
    if (!list.some((g) => g.id === garnishmentId)) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Garnishment not found' } },
        { status: 404 },
      );
    }
    garnishmentsByEmployee[employeeId] = list.filter((g) => g.id !== garnishmentId);
    return HttpResponse.json({ success: true, data: { deleted: true } });
  }),
];
