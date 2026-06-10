'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/analytics.api';
import type { WorkforceTrendRange, DeptPerfRange } from '../types/analytics.types';

export function useWorkforceTrend(range: WorkforceTrendRange, departmentId?: string) {
  return useQuery({
    queryKey: ['analytics', 'workforce-trend', range, departmentId ?? null],
    queryFn: () => analyticsApi.getWorkforceTrend(range, departmentId),
    staleTime: 60_000,
  });
}

export function useAttritionTrend(range: WorkforceTrendRange, departmentId?: string) {
  return useQuery({
    queryKey: ['analytics', 'attrition', range, departmentId ?? null],
    queryFn: () => analyticsApi.getAttrition(range, departmentId),
    staleTime: 60_000,
  });
}

export function usePayrollCostTrend(
  range: Exclude<WorkforceTrendRange, '2y'>,
  departmentId?: string,
) {
  return useQuery({
    queryKey: ['analytics', 'payroll-cost', range, departmentId ?? null],
    queryFn: () => analyticsApi.getPayrollCostTrend(range, departmentId),
    staleTime: 60_000,
  });
}

export function useDepartmentPerformance(range: DeptPerfRange, departmentId?: string) {
  return useQuery({
    queryKey: ['analytics', 'department-performance', range, departmentId ?? null],
    queryFn: () => analyticsApi.getDepartmentPerformance(range, departmentId),
    staleTime: 60_000,
  });
}
