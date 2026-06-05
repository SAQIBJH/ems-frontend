import { http, HttpResponse } from 'msw';
import type { TaxDeclaration, TaxDeclarationInput } from '@/modules/payroll/types/payroll.types';
import { currentPeriodString } from '../data/payroll-engine';
import { resolveActivePack } from './payroll-statutory';

// employeeId:fiscalYear → declaration.
const declarations: Record<string, TaxDeclaration> = {};

function key(employeeId: string, fy: string): string {
  return `${employeeId}:${fy}`;
}

/** Default regime code for a country (first regime of the active pack). */
function defaultRegime(country: string): string {
  const pack = resolveActivePack(country, currentPeriodString());
  return pack?.taxRegimes[0]?.code ?? '';
}

/** Read a stored declaration (consumed by the run engine). */
export function getTaxDeclaration(employeeId: string, fy: string): TaxDeclaration | undefined {
  return declarations[key(employeeId, fy)];
}

export const payrollTaxDeclarationHandlers = [
  http.get('/api/payroll/employees/:employeeId/tax-declaration', ({ params, request }) => {
    const { employeeId } = params as { employeeId: string };
    const fy = new URL(request.url).searchParams.get('fy') ?? '';
    const existing = declarations[key(employeeId, fy)];
    const data: TaxDeclaration = existing ?? {
      employeeId,
      fiscalYear: fy,
      regime: defaultRegime('IN'),
      items: [],
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ success: true, data });
  }),

  http.post('/api/payroll/employees/:employeeId/tax-declaration', async ({ params, request }) => {
    const { employeeId } = params as { employeeId: string };
    const body = (await request.json()) as TaxDeclarationInput;
    const created: TaxDeclaration = {
      employeeId,
      fiscalYear: body.fiscalYear,
      regime: body.regime,
      items: body.items ?? [],
      updatedAt: new Date().toISOString(),
    };
    declarations[key(employeeId, body.fiscalYear)] = created;
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch('/api/payroll/employees/:employeeId/tax-declaration', async ({ params, request }) => {
    const { employeeId } = params as { employeeId: string };
    const body = (await request.json()) as Partial<TaxDeclarationInput> & { fiscalYear: string };
    const k = key(employeeId, body.fiscalYear);
    const existing =
      declarations[k] ??
      ({
        employeeId,
        fiscalYear: body.fiscalYear,
        regime: defaultRegime('IN'),
        items: [],
        updatedAt: new Date().toISOString(),
      } satisfies TaxDeclaration);
    const updated: TaxDeclaration = {
      ...existing,
      regime: body.regime ?? existing.regime,
      items: body.items ?? existing.items,
      updatedAt: new Date().toISOString(),
    };
    declarations[k] = updated;
    return HttpResponse.json({ success: true, data: updated });
  }),
];
