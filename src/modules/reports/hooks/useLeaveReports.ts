import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/reports.api';
import type { LeaveUtilizationParams, LeavePendingParams } from '../types/reports.types';

export const LEAVE_REPORTS_KEY = ['reports', 'leave'] as const;

export function useLeaveUtilizationReport(params?: LeaveUtilizationParams) {
  return useQuery({
    queryKey: [...LEAVE_REPORTS_KEY, 'utilization', params],
    queryFn: () => reportsApi.getLeaveUtilization(params),
  });
}

export function useLeavePendingReport(params?: LeavePendingParams) {
  return useQuery({
    queryKey: [...LEAVE_REPORTS_KEY, 'pending', params],
    queryFn: () => reportsApi.getLeavePending(params),
  });
}
