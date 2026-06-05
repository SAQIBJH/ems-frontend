import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '../services/claims.api';
import type { ClaimStatus, ReimbursementClaimInput } from '../types/payroll.types';

export const CLAIMS_KEY = ['payroll', 'reimbursement-claims'] as const;
export const CLAIM_CATEGORIES_KEY = ['payroll', 'reimbursement-categories'] as const;

export function useClaimCategories() {
  return useQuery({
    queryKey: CLAIM_CATEGORIES_KEY,
    queryFn: () => claimsApi.listCategories(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useClaims(params?: { employeeId?: string; status?: ClaimStatus }) {
  return useQuery({
    queryKey: [...CLAIMS_KEY, params],
    queryFn: () => claimsApi.list(params),
  });
}

export function useSubmitClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: ReimbursementClaimInput }) =>
      claimsApi.submit(employeeId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAIMS_KEY }),
  });
}

export function useDecideClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      claimsApi.decide(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAIMS_KEY }),
  });
}
