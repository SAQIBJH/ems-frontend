import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsApi } from '../services/reports.api';
import type { ReportCommonParams, ReportExportRequest } from '../types/reports.types';

export const WORKFORCE_REPORTS_KEY = ['reports', 'workforce'] as const;

export function useHeadcountReport(params?: ReportCommonParams) {
  return useQuery({
    queryKey: [...WORKFORCE_REPORTS_KEY, 'headcount', params],
    queryFn: () => reportsApi.getHeadcount(params),
  });
}

export function useTurnoverReport(params?: ReportCommonParams) {
  return useQuery({
    queryKey: [...WORKFORCE_REPORTS_KEY, 'turnover', params],
    queryFn: () => reportsApi.getTurnover(params),
  });
}

export function useDemographicsReport(params?: Pick<ReportCommonParams, 'departmentId'>) {
  return useQuery({
    queryKey: [...WORKFORCE_REPORTS_KEY, 'demographics', params],
    queryFn: () => reportsApi.getDemographics(params),
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: (req: ReportExportRequest) => reportsApi.exportReport(req),
    onSuccess: (blob, req) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = req.reportType.replace('/', '-');
      a.download = `${slug}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
