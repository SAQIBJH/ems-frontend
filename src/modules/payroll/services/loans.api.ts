import { apiClient } from '@/lib/api-client';
import type { Loan, LoanInput } from '../types/payroll.types';

export const loansApi = {
  list: async (employeeId: string): Promise<Loan[]> => {
    const { data } = await apiClient.get<{ data: Loan[] }>(
      `/payroll/employees/${employeeId}/loans`,
    );
    return data.data;
  },

  create: async (employeeId: string, input: LoanInput): Promise<Loan> => {
    const { data } = await apiClient.post<{ data: Loan }>(
      `/payroll/employees/${employeeId}/loans`,
      input,
    );
    return data.data;
  },

  foreclose: async (employeeId: string, loanId: string): Promise<Loan> => {
    const { data } = await apiClient.patch<{ data: Loan }>(
      `/payroll/employees/${employeeId}/loans/${loanId}`,
      { action: 'foreclose' },
    );
    return data.data;
  },
};
