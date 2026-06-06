import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workersApi } from '../services/workers.api';
import type {
  WorkerClassification,
  ContractorInvoiceInput,
  ContractorInvoiceStatus,
  CostGroupBy,
} from '../types/payroll.types';

export const WORKERS_KEY = ['payroll', 'workers'] as const;
export const INVOICES_KEY = ['payroll', 'contractor-invoices'] as const;
export const COST_SUMMARY_KEY = ['payroll', 'cost-summary'] as const;

export function useWorkers(classification?: WorkerClassification) {
  return useQuery({
    queryKey: [...WORKERS_KEY, classification ?? 'all'],
    queryFn: () => workersApi.listWorkers(classification),
  });
}

export function useUpdateWorkerClassification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, classification }: { id: string; classification: WorkerClassification }) =>
      workersApi.updateClassification(id, classification),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKERS_KEY });
      qc.invalidateQueries({ queryKey: COST_SUMMARY_KEY });
    },
  });
}

export function useContractorInvoices(params?: {
  workerId?: string;
  status?: ContractorInvoiceStatus;
}) {
  return useQuery({
    queryKey: [...INVOICES_KEY, params ?? {}],
    queryFn: () => workersApi.listInvoices(params),
  });
}

export function useCreateContractorInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractorInvoiceInput) => workersApi.createInvoice(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVOICES_KEY }),
  });
}

export function useDecideContractorInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      payoutRef,
    }: {
      id: string;
      status: ContractorInvoiceStatus;
      payoutRef?: string;
    }) => workersApi.decideInvoice(id, { status, payoutRef }),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVOICES_KEY }),
  });
}

export function useCostSummary(groupBy: CostGroupBy) {
  return useQuery({
    queryKey: [...COST_SUMMARY_KEY, groupBy],
    queryFn: () => workersApi.getCostSummary(groupBy),
  });
}
