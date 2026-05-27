import { http, HttpResponse } from 'msw';
import type { EmployeeSalary, PayslipsPage } from '@/modules/payroll/types/payroll.types';

const SALARY_RECORDS: Record<string, EmployeeSalary> = {
  'emp-001': {
    id: 'esal-001',
    employeeId: 'emp-001',
    payGroupId: 'pg-001',
    payGroup: {
      id: 'pg-001',
      name: 'Standard India — Engineering',
      code: 'STANDARD_IND_ENG',
      currency: 'INR',
      paySchedule: 'MONTHLY',
    },
    annualCtc: 1800000,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    bankAccountName: 'Aman Kumar',
    bankAccountNumber: 'XXXX5678',
    bankIfscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
    calculatedComponents: [
      { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', monthlyAmount: 75000, taxable: true },
      {
        code: 'HRA',
        name: 'House Rent Allowance',
        type: 'EARNING',
        monthlyAmount: 30000,
        taxable: false,
      },
      {
        code: 'LTA',
        name: 'Leave Travel Allowance',
        type: 'EARNING',
        monthlyAmount: 5000,
        taxable: false,
      },
      {
        code: 'SPECIAL_ALLOW',
        name: 'Special Allowance',
        type: 'EARNING',
        monthlyAmount: 27000,
        taxable: true,
      },
      {
        code: 'PF',
        name: 'Provident Fund',
        type: 'DEDUCTION',
        monthlyAmount: 9000,
        taxable: false,
      },
      {
        code: 'PROF_TAX',
        name: 'Professional Tax',
        type: 'DEDUCTION',
        monthlyAmount: 200,
        taxable: false,
      },
      {
        code: 'TDS',
        name: 'TDS (Income Tax)',
        type: 'DEDUCTION',
        monthlyAmount: 9900,
        taxable: false,
      },
    ],
    monthlyGross: 150000,
    monthlyDeductions: 19100,
    monthlyNet: 130900,
    history: [
      {
        id: 'esal-001h',
        annualCtc: 1500000,
        effectiveFrom: '2023-01-01',
        effectiveTo: '2023-12-31',
        payGroupCode: 'STANDARD_IND_ENG',
      },
    ],
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
  },
  'emp-004': {
    id: 'esal-002',
    employeeId: 'emp-004',
    payGroupId: 'pg-001',
    payGroup: {
      id: 'pg-001',
      name: 'Standard India — Engineering',
      code: 'STANDARD_IND_ENG',
      currency: 'INR',
      paySchedule: 'MONTHLY',
    },
    annualCtc: 1200000,
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    bankAccountName: 'Priya Sharma',
    bankAccountNumber: 'XXXX1234',
    bankIfscCode: 'SBIN0001234',
    bankName: 'State Bank of India',
    calculatedComponents: [
      { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', monthlyAmount: 50000, taxable: true },
      {
        code: 'HRA',
        name: 'House Rent Allowance',
        type: 'EARNING',
        monthlyAmount: 20000,
        taxable: false,
      },
      {
        code: 'LTA',
        name: 'Leave Travel Allowance',
        type: 'EARNING',
        monthlyAmount: 5000,
        taxable: false,
      },
      {
        code: 'SPECIAL_ALLOW',
        name: 'Special Allowance',
        type: 'EARNING',
        monthlyAmount: 20000,
        taxable: true,
      },
      {
        code: 'PF',
        name: 'Provident Fund',
        type: 'DEDUCTION',
        monthlyAmount: 6000,
        taxable: false,
      },
      {
        code: 'PROF_TAX',
        name: 'Professional Tax',
        type: 'DEDUCTION',
        monthlyAmount: 200,
        taxable: false,
      },
      {
        code: 'TDS',
        name: 'TDS (Income Tax)',
        type: 'DEDUCTION',
        monthlyAmount: 6600,
        taxable: false,
      },
    ],
    monthlyGross: 100000,
    monthlyDeductions: 12800,
    monthlyNet: 87200,
    history: [],
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
  },
};

const PAYSLIP_DATA: Record<string, PayslipsPage> = {
  'emp-001': {
    items: [
      {
        id: 'slip-001',
        period: '2026-04',
        periodLabel: 'April 2026',
        currency: 'INR',
        grossEarnings: 150000,
        totalDeductions: 19100,
        netPay: 130900,
        status: 'PAID',
        paymentDate: '2026-04-30',
        payrollRunId: 'run-003',
      },
      {
        id: 'slip-002',
        period: '2026-03',
        periodLabel: 'March 2026',
        currency: 'INR',
        grossEarnings: 150000,
        totalDeductions: 19100,
        netPay: 130900,
        status: 'PAID',
        paymentDate: '2026-03-31',
        payrollRunId: 'run-002',
      },
      {
        id: 'slip-003',
        period: '2026-02',
        periodLabel: 'February 2026',
        currency: 'INR',
        grossEarnings: 150000,
        totalDeductions: 19100,
        netPay: 130900,
        status: 'PAID',
        paymentDate: '2026-02-28',
        payrollRunId: 'run-001',
      },
    ],
    pagination: { page: 1, limit: 12, total: 3, totalPages: 1 },
  },
  'emp-004': {
    items: [
      {
        id: 'slip-004',
        period: '2026-04',
        periodLabel: 'April 2026',
        currency: 'INR',
        grossEarnings: 100000,
        totalDeductions: 12800,
        netPay: 87200,
        status: 'PAID',
        paymentDate: '2026-04-30',
        payrollRunId: 'run-003',
      },
      {
        id: 'slip-005',
        period: '2026-03',
        periodLabel: 'March 2026',
        currency: 'INR',
        grossEarnings: 100000,
        totalDeductions: 12800,
        netPay: 87200,
        status: 'PAID',
        paymentDate: '2026-03-31',
        payrollRunId: 'run-002',
      },
    ],
    pagination: { page: 1, limit: 12, total: 2, totalPages: 1 },
  },
};

export const payrollEmployeeHandlers = [
  http.get('/api/payroll/employees/:employeeId/salary', ({ params }) => {
    const { employeeId } = params as { employeeId: string };
    const record = SALARY_RECORDS[employeeId];
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'No salary config found for employee' },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: record });
  }),

  http.post('/api/payroll/employees/:employeeId/salary', async ({ params, request }) => {
    const { employeeId } = params as { employeeId: string };
    const body = (await request.json()) as Partial<EmployeeSalary>;
    const now = new Date().toISOString();
    const existing = SALARY_RECORDS[employeeId];
    const created: EmployeeSalary = {
      id: `esal-${Date.now()}`,
      employeeId,
      payGroupId: (body as Record<string, string>).payGroupId ?? 'pg-001',
      payGroup: {
        id: 'pg-001',
        name: 'Standard India — Engineering',
        code: 'STANDARD_IND_ENG',
        currency: 'INR',
        paySchedule: 'MONTHLY',
      },
      annualCtc: (body as Record<string, number>).annualCtc ?? 1200000,
      effectiveFrom: (body as Record<string, string>).effectiveFrom ?? now.slice(0, 10),
      effectiveTo: null,
      bankAccountName: (body as Record<string, string>).bankAccountName ?? '',
      bankAccountNumber: (body as Record<string, string>).bankAccountNumber ?? '',
      bankIfscCode: (body as Record<string, string>).bankIfscCode ?? '',
      bankName: (body as Record<string, string>).bankName ?? '',
      calculatedComponents: existing?.calculatedComponents ?? [],
      monthlyGross: existing?.monthlyGross ?? 100000,
      monthlyDeductions: existing?.monthlyDeductions ?? 12800,
      monthlyNet: existing?.monthlyNet ?? 87200,
      history: existing
        ? [
            {
              id: existing.id,
              annualCtc: existing.annualCtc,
              effectiveFrom: existing.effectiveFrom,
              effectiveTo: (body as Record<string, string>).effectiveFrom ?? now.slice(0, 10),
              payGroupCode: existing.payGroup.code,
            },
          ]
        : [],
      createdAt: now,
      updatedAt: now,
    };
    SALARY_RECORDS[employeeId] = created;
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch('/api/payroll/employees/:employeeId/salary', async ({ params, request }) => {
    const { employeeId } = params as { employeeId: string };
    const body = (await request.json()) as Partial<EmployeeSalary>;
    const existing = SALARY_RECORDS[employeeId];
    const now = new Date().toISOString();
    const updated: EmployeeSalary = {
      ...(existing ?? {
        id: `esal-${Date.now()}`,
        employeeId,
        payGroupId: 'pg-001',
        payGroup: {
          id: 'pg-001',
          name: 'Standard India — Engineering',
          code: 'STANDARD_IND_ENG',
          currency: 'INR',
          paySchedule: 'MONTHLY',
        },
        annualCtc: 1200000,
        effectiveFrom: now.slice(0, 10),
        effectiveTo: null,
        bankAccountName: '',
        bankAccountNumber: '',
        bankIfscCode: '',
        bankName: '',
        calculatedComponents: [],
        monthlyGross: 0,
        monthlyDeductions: 0,
        monthlyNet: 0,
        history: [],
        createdAt: now,
      }),
      ...body,
      updatedAt: now,
    };
    SALARY_RECORDS[employeeId] = updated;
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.get('/api/payroll/employees/:employeeId/payslips', ({ params }) => {
    const { employeeId } = params as { employeeId: string };
    const page = PAYSLIP_DATA[employeeId] ?? {
      items: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    };
    return HttpResponse.json({ success: true, data: page });
  }),

  http.get('/api/payroll/employees/:employeeId/payslips/:payslipId', ({ params }) => {
    const { employeeId, payslipId } = params as { employeeId: string; payslipId: string };
    const page = PAYSLIP_DATA[employeeId];
    const summary = page?.items.find((s) => s.id === payslipId);
    if (!summary) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } },
        { status: 404 },
      );
    }
    const salary = SALARY_RECORDS[employeeId];
    const detail = {
      ...summary,
      employee: {
        id: employeeId,
        firstName: 'Employee',
        lastName: '',
        employeeCode: 'E0001',
        designation: 'Engineer',
        departmentName: 'Engineering',
      },
      company: { name: 'Acme Corp', address: '123 Tech Park, Pune 411001', logoUrl: null },
      earnings:
        salary?.calculatedComponents
          .filter((c) => c.type === 'EARNING')
          .map((c) => ({
            code: c.code,
            name: c.name,
            amount: c.monthlyAmount,
            taxable: c.taxable,
          })) ?? [],
      deductions:
        salary?.calculatedComponents
          .filter((c) => c.type === 'DEDUCTION')
          .map((c) => ({ code: c.code, name: c.name, amount: c.monthlyAmount })) ?? [],
      oneTimeAdditions: [],
      oneTimeDeductions: [],
      workingDays: 22,
      presentDays: 22,
      leaveDays: 0,
      lopDays: 0,
      paymentReference: null,
      generatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ success: true, data: detail });
  }),
];
