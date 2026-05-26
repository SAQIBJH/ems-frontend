import { useQuery } from '@tanstack/react-query';
import { leaveApi } from '../services/leave.api';
import type { LeaveListParams } from '../types/leave.types';

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave', 'types'],
    queryFn: leaveApi.getTypes,
    staleTime: 5 * 60_000,
  });
}

export function useLeaveBalance() {
  return useQuery({
    queryKey: ['leave', 'balance'],
    queryFn: leaveApi.getBalance,
  });
}

export function useLeaveRequests(params?: LeaveListParams) {
  return useQuery({
    queryKey: ['leave', 'requests', params ?? {}],
    queryFn: () => leaveApi.getRequests(params),
  });
}

export function useTeamLeaveRequests(params?: LeaveListParams, enabled = true) {
  return useQuery({
    queryKey: ['leave', 'team-requests', params ?? {}],
    queryFn: () => leaveApi.getTeamRequests(params),
    enabled,
  });
}

export function useTeamLeaveCalendar(month: string, enabled = true) {
  return useQuery({
    queryKey: ['leave', 'team-calendar', month],
    queryFn: () => leaveApi.getTeamCalendar(month),
    enabled,
    staleTime: 60_000,
  });
}
