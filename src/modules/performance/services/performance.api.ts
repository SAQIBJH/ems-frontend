import { apiClient } from '@/lib/api-client';
import type {
  ActiveCycle,
  PerformanceSummary,
  ReviewsPage,
  GoalsPage,
  CalibrationData,
  Goal,
  AddGoalInput,
  ReviewsParams,
  GoalsParams,
} from '../types/performance.types';

export const performanceApi = {
  getActiveCycle: async (): Promise<ActiveCycle | null> => {
    const { data } = await apiClient.get<{ data: ActiveCycle | null }>(
      '/performance/cycles/active',
    );
    return data.data;
  },

  getSummary: async (): Promise<PerformanceSummary> => {
    const { data } = await apiClient.get<{ data: PerformanceSummary }>('/performance/summary');
    return data.data;
  },

  getReviews: async (params?: ReviewsParams): Promise<ReviewsPage> => {
    const { data } = await apiClient.get<{ data: ReviewsPage }>('/performance/reviews', { params });
    return data.data;
  },

  getGoals: async (params?: GoalsParams): Promise<GoalsPage> => {
    const { data } = await apiClient.get<{ data: GoalsPage }>('/performance/goals', { params });
    return data.data;
  },

  getCalibration: async (): Promise<CalibrationData> => {
    const { data } = await apiClient.get<{ data: CalibrationData }>('/performance/calibration');
    return data.data;
  },

  addGoal: async (input: AddGoalInput): Promise<Goal> => {
    const { data } = await apiClient.post<{ data: Goal }>('/performance/goals', input);
    return data.data;
  },
};
