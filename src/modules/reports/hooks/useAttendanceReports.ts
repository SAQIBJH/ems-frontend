import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/reports.api';
import type { ReportCommonParams, AttendanceSummaryParams } from '../types/reports.types';

export const ATTENDANCE_REPORTS_KEY = ['reports', 'attendance'] as const;

export function useAttendanceSummaryReport(params?: AttendanceSummaryParams) {
  return useQuery({
    queryKey: [...ATTENDANCE_REPORTS_KEY, 'summary', params],
    queryFn: () => reportsApi.getAttendanceSummary(params),
  });
}

export function useAbsenteeismReport(params?: ReportCommonParams) {
  return useQuery({
    queryKey: [...ATTENDANCE_REPORTS_KEY, 'absenteeism', params],
    queryFn: () => reportsApi.getAbsenteeism(params),
  });
}
