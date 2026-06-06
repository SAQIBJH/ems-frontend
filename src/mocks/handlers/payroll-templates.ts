import { http, HttpResponse } from 'msw';
import type { PayslipTemplate, PayslipTemplateInput } from '@/modules/payroll/types/payroll.types';
import { DEFAULT_PAYSLIP_TEMPLATE } from '@/modules/payroll/constants';

/* ── Single tenant-level payslip template ──────────────────────────────────── */

// The payslip layout is data (§10). One template per tenant; PATCH merges fields.
let template: PayslipTemplate = structuredClone(DEFAULT_PAYSLIP_TEMPLATE);

export const payrollTemplateHandlers = [
  http.get('/api/payroll/payslip-templates', () => {
    return HttpResponse.json({ success: true, data: template });
  }),

  http.patch('/api/payroll/payslip-templates', async ({ request }) => {
    const body = (await request.json()) as PayslipTemplateInput;
    template = {
      ...template,
      ...body,
      // Preserve identity; only the editable fields are merged.
      id: template.id,
      sections: body.sections ?? template.sections,
      fields: body.fields ?? template.fields,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ success: true, data: template });
  }),
];
