import { apiClient } from '@/lib/api-client';
import type {
  WorkforceTrendPoint,
  AttritionData,
  PayrollCostPoint,
  DepartmentPerformanceRow,
  WorkforceTrendRange,
  DeptPerfRange,
} from '../types/analytics.types';

/** Drop an undefined departmentId so we never send `departmentId=undefined`. */
const deptParam = (departmentId?: string) => (departmentId ? { departmentId } : {});

export const analyticsApi = {
  getWorkforceTrend: async (
    range: WorkforceTrendRange,
    departmentId?: string,
  ): Promise<WorkforceTrendPoint[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: WorkforceTrendPoint[] }>(
      '/analytics/workforce-trend',
      { params: { range, ...deptParam(departmentId) } },
    );
    return data.data;
  },

  getAttrition: async (
    range: WorkforceTrendRange,
    departmentId?: string,
  ): Promise<AttritionData> => {
    const { data } = await apiClient.get<{ success: boolean; data: AttritionData }>(
      '/analytics/attrition',
      { params: { range, ...deptParam(departmentId) } },
    );
    return data.data;
  },

  getPayrollCostTrend: async (
    range: Exclude<WorkforceTrendRange, '2y'>,
    departmentId?: string,
  ): Promise<PayrollCostPoint[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: PayrollCostPoint[] }>(
      '/analytics/payroll-cost',
      { params: { range, ...deptParam(departmentId) } },
    );
    return data.data;
  },

  getDepartmentPerformance: async (
    range: DeptPerfRange,
    departmentId?: string,
  ): Promise<DepartmentPerformanceRow[]> => {
    const { data } = await apiClient.get<{
      success: boolean;
      data: DepartmentPerformanceRow[];
    }>('/analytics/department-performance', { params: { range, ...deptParam(departmentId) } });
    return data.data;
  },
};
