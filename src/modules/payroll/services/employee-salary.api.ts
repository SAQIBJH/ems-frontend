import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  EmployeeSalary,
  EmployeeSalaryInput,
  PayslipsPage,
  Payslip,
  PayslipYtd,
  TaxDeclaration,
  TaxDeclarationInput,
} from '../types/payroll.types';

export const employeeSalaryApi = {
  get: async (employeeId: string): Promise<EmployeeSalary> => {
    const { data } = await apiClient.get<{ data: EmployeeSalary }>(
      `/payroll/employees/${employeeId}/salary`,
    );
    return data.data;
  },

  assign: async (employeeId: string, input: EmployeeSalaryInput): Promise<EmployeeSalary> => {
    const body = {
      ...input,
      effectiveFrom: formatDateForApi(input.effectiveFrom),
    };
    const { data } = await apiClient.post<{ data: EmployeeSalary }>(
      `/payroll/employees/${employeeId}/salary`,
      body,
    );
    return data.data;
  },

  update: async (
    employeeId: string,
    input: Partial<EmployeeSalaryInput>,
  ): Promise<EmployeeSalary> => {
    const body = {
      ...input,
      ...(input.effectiveFrom && { effectiveFrom: formatDateForApi(input.effectiveFrom) }),
    };
    const { data } = await apiClient.patch<{ data: EmployeeSalary }>(
      `/payroll/employees/${employeeId}/salary`,
      body,
    );
    return data.data;
  },

  listPayslips: async (
    employeeId: string,
    params?: { page?: number; limit?: number; year?: number },
  ): Promise<PayslipsPage> => {
    const { data } = await apiClient.get<{ data: PayslipsPage }>(
      `/payroll/employees/${employeeId}/payslips`,
      { params },
    );
    return data.data;
  },

  getPayslip: async (employeeId: string, payslipId: string): Promise<Payslip> => {
    const { data } = await apiClient.get<{ data: Payslip }>(
      `/payroll/employees/${employeeId}/payslips/${payslipId}`,
    );
    return data.data;
  },

  getYtd: async (employeeId: string, fy?: string): Promise<PayslipYtd> => {
    const { data } = await apiClient.get<{ data: PayslipYtd }>(
      `/payroll/employees/${employeeId}/ytd`,
      { params: fy ? { fy } : undefined },
    );
    return data.data;
  },

  getTaxDeclaration: async (employeeId: string, fy: string): Promise<TaxDeclaration> => {
    const { data } = await apiClient.get<{ data: TaxDeclaration }>(
      `/payroll/employees/${employeeId}/tax-declaration`,
      { params: { fy } },
    );
    return data.data;
  },

  saveTaxDeclaration: async (
    employeeId: string,
    input: TaxDeclarationInput,
  ): Promise<TaxDeclaration> => {
    const { data } = await apiClient.post<{ data: TaxDeclaration }>(
      `/payroll/employees/${employeeId}/tax-declaration`,
      input,
    );
    return data.data;
  },

  updateTaxDeclaration: async (
    employeeId: string,
    input: Partial<TaxDeclarationInput> & { fiscalYear: string },
  ): Promise<TaxDeclaration> => {
    const { data } = await apiClient.patch<{ data: TaxDeclaration }>(
      `/payroll/employees/${employeeId}/tax-declaration`,
      input,
    );
    return data.data;
  },
};
