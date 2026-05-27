import { apiClient } from '@/lib/api-client';
import type {
  WorkforceTrendPoint,
  AttritionData,
  PayrollCostPoint,
  DepartmentPerformanceRow,
  WorkforceTrendRange,
  DeptPerfRange,
} from '../types/analytics.types';

export const analyticsApi = {
  getWorkforceTrend: async (range: WorkforceTrendRange): Promise<WorkforceTrendPoint[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: WorkforceTrendPoint[] }>(
      '/analytics/workforce-trend',
      { params: { range } },
    );
    return data.data;
  },

  getAttrition: async (range: WorkforceTrendRange): Promise<AttritionData> => {
    const { data } = await apiClient.get<{ success: boolean; data: AttritionData }>(
      '/analytics/attrition',
      { params: { range } },
    );
    return data.data;
  },

  getPayrollCostTrend: async (
    range: Exclude<WorkforceTrendRange, '2y'>,
  ): Promise<PayrollCostPoint[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: PayrollCostPoint[] }>(
      '/analytics/payroll-cost',
      { params: { range } },
    );
    return data.data;
  },

  getDepartmentPerformance: async (range: DeptPerfRange): Promise<DepartmentPerformanceRow[]> => {
    const { data } = await apiClient.get<{
      success: boolean;
      data: DepartmentPerformanceRow[];
    }>('/analytics/department-performance', { params: { range } });
    return data.data;
  },
};
