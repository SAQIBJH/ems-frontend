'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard.api';
import type { AttendanceRange } from '../types/dashboard.types';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: dashboardApi.getAnalyticsSummary,
    staleTime: 60_000,
  });
}

export function useAttendanceAnalytics(range: AttendanceRange) {
  return useQuery({
    queryKey: ['analytics', 'attendance', range],
    queryFn: () => dashboardApi.getAttendanceAnalytics(range),
    staleTime: 60_000,
  });
}

export function useHeadcountByDepartment() {
  return useQuery({
    queryKey: ['analytics', 'headcount-by-department'],
    queryFn: dashboardApi.getHeadcountByDepartment,
    staleTime: 60_000,
  });
}

export function useLeaveSummaryAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'leave-summary'],
    queryFn: dashboardApi.getLeaveSummary,
    staleTime: 60_000,
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'recent-activity', limit],
    queryFn: () => dashboardApi.getRecentActivity(limit),
    staleTime: 30_000,
  });
}

export function useManagerDashboard() {
  return useQuery({
    queryKey: ['manager', 'dashboard'],
    queryFn: dashboardApi.getManagerDashboard,
    staleTime: 60_000,
  });
}

export function useManagerApprovals() {
  return useQuery({
    queryKey: ['manager', 'approvals'],
    queryFn: dashboardApi.getManagerApprovals,
    staleTime: 30_000,
  });
}

export function useTeamWeeklyAttendance(weekStart?: string) {
  return useQuery({
    queryKey: ['attendance', 'team-weekly', weekStart ?? 'current'],
    queryFn: () => dashboardApi.getTeamWeeklyAttendance(weekStart),
    staleTime: 60_000,
  });
}

export function useManagerTeam() {
  return useQuery({
    queryKey: ['manager', 'team'],
    queryFn: dashboardApi.getManagerTeam,
    staleTime: 60_000,
  });
}

export function useEmployeeDashboard() {
  return useQuery({
    queryKey: ['employee', 'dashboard'],
    queryFn: dashboardApi.getEmployeeDashboard,
    staleTime: 60_000,
  });
}

export function useEmployeeTeam() {
  return useQuery({
    queryKey: ['employee', 'team'],
    queryFn: dashboardApi.getEmployeeTeam,
    staleTime: 60_000,
  });
}
