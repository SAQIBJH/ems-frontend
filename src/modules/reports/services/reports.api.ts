import { apiClient } from '@/lib/api-client';
import type {
  HeadcountReport,
  TurnoverReport,
  DemographicsData,
  AttendanceSummaryReport,
  AbsenteeismReport,
  LeaveUtilizationReport,
  LeavePendingReport,
  PayrollSummaryReport,
  CtcAnalysisData,
  ReportExportRequest,
  ReportExportJob,
  ReportCommonParams,
  AttendanceSummaryParams,
  LeaveUtilizationParams,
  LeavePendingParams,
  CtcAnalysisParams,
} from '../types/reports.types';

export const reportsApi = {
  getHeadcount: async (params?: ReportCommonParams): Promise<HeadcountReport> => {
    const { data } = await apiClient.get<{ data: HeadcountReport }>(
      '/reports/workforce/headcount',
      { params },
    );
    return data.data;
  },

  getTurnover: async (params?: ReportCommonParams): Promise<TurnoverReport> => {
    const { data } = await apiClient.get<{ data: TurnoverReport }>('/reports/workforce/turnover', {
      params,
    });
    return data.data;
  },

  getDemographics: async (
    params?: Pick<ReportCommonParams, 'departmentId'>,
  ): Promise<DemographicsData> => {
    const { data } = await apiClient.get<{ data: DemographicsData }>(
      '/reports/workforce/demographics',
      { params },
    );
    return data.data;
  },

  getAttendanceSummary: async (
    params?: AttendanceSummaryParams,
  ): Promise<AttendanceSummaryReport> => {
    const { data } = await apiClient.get<{ data: AttendanceSummaryReport }>(
      '/reports/attendance/summary',
      { params },
    );
    return data.data;
  },

  getAbsenteeism: async (params?: ReportCommonParams): Promise<AbsenteeismReport> => {
    const { data } = await apiClient.get<{ data: AbsenteeismReport }>(
      '/reports/attendance/absenteeism',
      { params },
    );
    return data.data;
  },

  getLeaveUtilization: async (params?: LeaveUtilizationParams): Promise<LeaveUtilizationReport> => {
    const { data } = await apiClient.get<{ data: LeaveUtilizationReport }>(
      '/reports/leave/utilization',
      { params },
    );
    return data.data;
  },

  getLeavePending: async (params?: LeavePendingParams): Promise<LeavePendingReport> => {
    const { data } = await apiClient.get<{ data: LeavePendingReport }>('/reports/leave/pending', {
      params,
    });
    return data.data;
  },

  getPayrollSummary: async (params?: ReportCommonParams): Promise<PayrollSummaryReport> => {
    const { data } = await apiClient.get<{ data: PayrollSummaryReport }>(
      '/reports/payroll/summary',
      { params },
    );
    return data.data;
  },

  getCtcAnalysis: async (params?: CtcAnalysisParams): Promise<CtcAnalysisData> => {
    const { data } = await apiClient.get<{ data: CtcAnalysisData }>(
      '/reports/payroll/ctc-analysis',
      { params },
    );
    return data.data;
  },

  /**
   * Queue a server-side export. Returns a job descriptor; the actual CSV is generated
   * and stored on the server and fetched with `downloadExport`. We deliberately do NOT
   * build the CSV from the client's already-loaded data — a server-generated file can't
   * be altered from the browser (devtools) before it's downloaded.
   */
  requestExport: async (req: ReportExportRequest): Promise<ReportExportJob> => {
    const { data } = await apiClient.post<{ data: ReportExportJob }>('/reports/export', req);
    return data.data;
  },

  /**
   * Fetch the server-generated export file for a queued job. Returns the Blob once the
   * server has produced the CSV, or `null` while it's still being prepared (the server
   * replies with JSON / 404 until the file is ready).
   */
  downloadExport: async (jobId: string): Promise<Blob | null> => {
    const res = await apiClient.get(`/reports/export/${jobId}/download`, {
      responseType: 'blob',
      validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
    });
    const contentType = String(res.headers['content-type'] ?? '');
    // A real file comes back as text/csv (or octet-stream); JSON means "not ready"/404.
    if (res.status >= 200 && res.status < 300 && !contentType.includes('application/json')) {
      return res.data as Blob;
    }
    return null;
  },
};
