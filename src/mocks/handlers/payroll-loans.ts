import { http, HttpResponse } from 'msw';
import type { Loan, LoanInput } from '@/modules/payroll/types/payroll.types';
import { buildSchedule, computeEmi } from '@/modules/payroll/utils/loan.utils';
import { currentPeriodString } from '../data/payroll-engine';

function makeLoan(employeeId: string, id: string, input: LoanInput): Loan {
  const currency = input.currency ?? 'INR';
  const schedule = buildSchedule(
    input.principal,
    input.annualRatePct,
    input.tenureMonths,
    input.interestMethod,
    input.startPeriod,
  );
  return {
    id,
    employeeId,
    type: input.type,
    principal: input.principal,
    currency,
    interestMethod: input.interestMethod,
    annualRatePct: input.annualRatePct,
    tenureMonths: input.tenureMonths,
    startPeriod: input.startPeriod,
    emiAmount: computeEmi(
      input.principal,
      input.annualRatePct,
      input.tenureMonths,
      input.interestMethod,
    ),
    schedule,
    outstandingBalance: input.principal,
    status: 'ACTIVE',
    forecloseFromPeriod: null,
    createdAt: new Date().toISOString(),
  };
}

const loansByEmployee: Record<string, Loan[]> = {
  'emp-001': [
    makeLoan('emp-001', 'loan-001', {
      type: 'LOAN',
      principal: 30000000, // ₹3,00,000
      currency: 'INR',
      interestMethod: 'REDUCING',
      annualRatePct: 10,
      tenureMonths: 12,
      startPeriod: '2026-04',
    }),
  ],
};

/** Derive installment recovery + current outstanding from the calendar. */
function withDerived(loan: Loan): Loan {
  const now = currentPeriodString();
  const schedule = loan.schedule.map((e) => ({
    ...e,
    status:
      loan.status !== 'FORECLOSED' && e.period < now
        ? ('RECOVERED' as const)
        : ('PENDING' as const),
  }));
  let outstanding = loan.principal;
  if (loan.status === 'FORECLOSED') {
    outstanding = 0;
  } else {
    const recovered = schedule.filter((e) => e.status === 'RECOVERED');
    if (recovered.length) outstanding = recovered[recovered.length - 1].balanceAfter;
  }
  const status = loan.status === 'ACTIVE' && outstanding === 0 ? 'CLOSED' : loan.status;
  return { ...loan, schedule, outstandingBalance: outstanding, status };
}

/**
 * EMI lines to recover for an employee in a period (consumed by the run engine).
 * Foreclosed loans stop from their foreclosure period; closed loans recover nothing.
 */
export function loanEmiForPeriod(
  employeeId: string,
  period: string,
): { loanId: string; type: Loan['type']; emi: number }[] {
  const loans = loansByEmployee[employeeId] ?? [];
  const lines: { loanId: string; type: Loan['type']; emi: number }[] = [];
  for (const loan of loans) {
    if (loan.status === 'CLOSED') continue;
    if (
      loan.status === 'FORECLOSED' &&
      loan.forecloseFromPeriod &&
      period >= loan.forecloseFromPeriod
    )
      continue;
    const entry = loan.schedule.find((e) => e.period === period);
    if (entry) lines.push({ loanId: loan.id, type: loan.type, emi: entry.emi });
  }
  return lines;
}

let idCounter = 100;

export const payrollLoanHandlers = [
  http.get('/api/payroll/employees/:employeeId/loans', ({ params }) => {
    const { employeeId } = params as { employeeId: string };
    const loans = (loansByEmployee[employeeId] ?? []).map(withDerived);
    return HttpResponse.json({ success: true, data: loans });
  }),

  http.post('/api/payroll/employees/:employeeId/loans', async ({ params, request }) => {
    const { employeeId } = params as { employeeId: string };
    const input = (await request.json()) as LoanInput;
    if (input.principal <= 0 || input.tenureMonths <= 0) {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_LOAN', message: 'Invalid principal or tenure' } },
        { status: 422 },
      );
    }
    const loan = makeLoan(employeeId, `loan-${++idCounter}`, input);
    loansByEmployee[employeeId] = [...(loansByEmployee[employeeId] ?? []), loan];
    return HttpResponse.json({ success: true, data: withDerived(loan) }, { status: 201 });
  }),

  // Foreclose an active loan (stops EMIs from the current period onward).
  http.patch('/api/payroll/employees/:employeeId/loans/:loanId', async ({ params, request }) => {
    const { employeeId, loanId } = params as { employeeId: string; loanId: string };
    const body = (await request.json()) as { action?: string };
    const loans = loansByEmployee[employeeId] ?? [];
    const idx = loans.findIndex((l) => l.id === loanId);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Loan not found' } },
        { status: 404 },
      );
    }
    if (body.action === 'foreclose') {
      loans[idx] = {
        ...loans[idx],
        status: 'FORECLOSED',
        forecloseFromPeriod: currentPeriodString(),
      };
    }
    return HttpResponse.json({ success: true, data: withDerived(loans[idx]) });
  }),
];
