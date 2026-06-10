'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard.api';
import type { AnalyticsFilters, AttendanceRange } from '../types/dashboard.types';

/** Stable, serialisable key fragment for the optional analytics filters. */
const filterKey = (f?: AnalyticsFilters) => ({
  departmentId: f?.departmentId ?? null,
  range: f?.range ?? null,
  from: f?.from ?? null,
  to: f?.to ?? null,
});

export function useAnalyticsSummary(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'summary', filterKey(filters)],
    queryFn: () => dashboardApi.getAnalyticsSummary(filters),
    staleTime: 60_000,
  });
}

export function useAttendanceAnalytics(range: AttendanceRange, filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'attendance', range, filterKey(filters)],
    queryFn: () => dashboardApi.getAttendanceAnalytics(range, filters),
    staleTime: 60_000,
  });
}

export function useHeadcountByDepartment(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'headcount-by-department', filterKey(filters)],
    queryFn: () => dashboardApi.getHeadcountByDepartment(filters),
    staleTime: 60_000,
  });
}

export function useLeaveSummaryAnalytics(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'leave-summary', filterKey(filters)],
    queryFn: () => dashboardApi.getLeaveSummary(filters),
    staleTime: 60_000,
  });
}

export function useRecentActivity(limit = 10, filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'recent-activity', limit, filterKey(filters)],
    queryFn: () => dashboardApi.getRecentActivity(limit, filters),
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
    refetchOnWindowFocus: true,
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

export function useEmployeeDocuments() {
  return useQuery({
    queryKey: ['employee', 'documents'],
    queryFn: dashboardApi.getEmployeeDocuments,
    staleTime: 5 * 60_000,
  });
}
