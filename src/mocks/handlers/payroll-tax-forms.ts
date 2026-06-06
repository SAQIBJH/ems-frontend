import { http, HttpResponse } from 'msw';
import {
  computeEmployeeYtd,
  currentPeriodString,
  ytdThroughPeriodForFy,
  getRosterSummary,
} from '../data/payroll-engine';
import { resolveTaxForm, isTaxFormType } from '../data/tax-forms';

// The demo roster operates under the India legal entity (INR).
const FORM_COUNTRY = 'IN';
const FORM_CURRENCY = 'INR';

export const payrollTaxFormHandlers = [
  http.get('/api/payroll/employees/:employeeId/tax-form', ({ params, request }) => {
    const { employeeId } = params as { employeeId: string };
    const url = new URL(request.url);
    const type = url.searchParams.get('type') ?? 'FORM16';
    const fy = url.searchParams.get('fy');

    if (!isTaxFormType(type)) {
      return HttpResponse.json(
        { success: false, error: { code: 'UNKNOWN_FORM_TYPE', message: 'Unknown tax-form type' } },
        { status: 422 },
      );
    }

    const employee = getRosterSummary().find((e) => e.employeeId === employeeId);
    const through = fy ? ytdThroughPeriodForFy(FORM_COUNTRY, fy) : currentPeriodString();
    const ytd = computeEmployeeYtd(employeeId, through);
    if (!employee || !ytd) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No payroll data for employee' } },
        { status: 404 },
      );
    }

    const document = resolveTaxForm({
      type,
      employeeName: employee.employeeName,
      employeeCode: employee.employeeCode,
      ytd,
      currency: FORM_CURRENCY,
    });
    return HttpResponse.json({ success: true, data: document });
  }),
];
