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

  exportReport: async (req: ReportExportRequest): Promise<Blob> => {
    const response = await apiClient.post('/reports/export', req, { responseType: 'blob' });
    return response.data as Blob;
  },
};
