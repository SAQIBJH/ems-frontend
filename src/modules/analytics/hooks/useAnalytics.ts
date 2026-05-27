'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/analytics.api';
import type { WorkforceTrendRange, DeptPerfRange } from '../types/analytics.types';

export function useWorkforceTrend(range: WorkforceTrendRange) {
  return useQuery({
    queryKey: ['analytics', 'workforce-trend', range],
    queryFn: () => analyticsApi.getWorkforceTrend(range),
    staleTime: 60_000,
  });
}

export function useAttritionTrend(range: WorkforceTrendRange) {
  return useQuery({
    queryKey: ['analytics', 'attrition', range],
    queryFn: () => analyticsApi.getAttrition(range),
    staleTime: 60_000,
  });
}

export function usePayrollCostTrend(range: Exclude<WorkforceTrendRange, '2y'>) {
  return useQuery({
    queryKey: ['analytics', 'payroll-cost', range],
    queryFn: () => analyticsApi.getPayrollCostTrend(range),
    staleTime: 60_000,
  });
}

export function useDepartmentPerformance(range: DeptPerfRange) {
  return useQuery({
    queryKey: ['analytics', 'department-performance', range],
    queryFn: () => analyticsApi.getDepartmentPerformance(range),
    staleTime: 60_000,
  });
}
