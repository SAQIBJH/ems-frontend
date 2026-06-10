import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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
    // The export is a server-side job: queue it, then poll for the server-generated
    // file. We download only a real file produced by the backend — never a CSV built
    // from client data (which a user could tamper with via devtools before saving).
    mutationFn: async (
      req: ReportExportRequest,
    ): Promise<{ blob: Blob | null; req: ReportExportRequest }> => {
      const job = await reportsApi.requestExport(req);
      for (let attempt = 0; attempt < 6; attempt++) {
        const blob = await reportsApi.downloadExport(job.jobId);
        if (blob) return { blob, req };
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      // Still preparing after the poll window — don't fake a download or success.
      return { blob: null, req };
    },
    onSuccess: ({ blob, req }) => {
      if (!blob) {
        toast.info(
          'Your export is being prepared on the server. Please try again in a moment to download it.',
        );
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = req.reportType.replace('/', '-');
      a.download = `${slug}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported');
    },
    onError: () => {
      toast.error('Export failed. Please try again.');
    },
  });
}
