import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  EmployeeSalary,
  EmployeeSalaryInput,
  PayslipsPage,
  Payslip,
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
};
