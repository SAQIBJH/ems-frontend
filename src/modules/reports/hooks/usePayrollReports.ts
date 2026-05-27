import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/reports.api';
import type { ReportCommonParams, CtcAnalysisParams } from '../types/reports.types';

export const PAYROLL_REPORTS_KEY = ['reports', 'payroll'] as const;

export function usePayrollSummaryReport(params?: ReportCommonParams) {
  return useQuery({
    queryKey: [...PAYROLL_REPORTS_KEY, 'summary', params],
    queryFn: () => reportsApi.getPayrollSummary(params),
  });
}

export function useCtcAnalysisReport(params?: CtcAnalysisParams) {
  return useQuery({
    queryKey: [...PAYROLL_REPORTS_KEY, 'ctc-analysis', params],
    queryFn: () => reportsApi.getCtcAnalysis(params),
  });
}
