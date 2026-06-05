import { apiClient } from '@/lib/api-client';
import type {
  ClaimStatus,
  ReimbursementCategory,
  ReimbursementClaim,
  ReimbursementClaimInput,
} from '../types/payroll.types';

export const claimsApi = {
  listCategories: async (): Promise<ReimbursementCategory[]> => {
    const { data } = await apiClient.get<{ data: ReimbursementCategory[] }>(
      '/payroll/reimbursement-categories',
    );
    return data.data;
  },

  list: async (params?: {
    employeeId?: string;
    status?: ClaimStatus;
  }): Promise<ReimbursementClaim[]> => {
    const { data } = await apiClient.get<{ data: ReimbursementClaim[] }>(
      '/payroll/reimbursement-claims',
      { params },
    );
    return data.data;
  },

  submit: async (
    employeeId: string,
    input: ReimbursementClaimInput,
  ): Promise<ReimbursementClaim> => {
    const { data } = await apiClient.post<{ data: ReimbursementClaim }>(
      '/payroll/reimbursement-claims',
      { ...input, employeeId },
    );
    return data.data;
  },

  decide: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<ReimbursementClaim> => {
    const { data } = await apiClient.patch<{ data: ReimbursementClaim }>(
      `/payroll/reimbursement-claims/${id}`,
      { status },
    );
    return data.data;
  },
};
