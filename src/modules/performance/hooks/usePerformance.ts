import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { performanceApi } from '../services/performance.api';
import type {
  ReviewsParams,
  GoalsParams,
  AddGoalInput,
  SubmitReviewInput,
} from '../types/performance.types';

export const PERFORMANCE_KEYS = {
  activeCycle: ['performance', 'activeCycle'] as const,
  summary: ['performance', 'summary'] as const,
  reviews: (params?: ReviewsParams) => ['performance', 'reviews', params] as const,
  goals: (params?: GoalsParams) => ['performance', 'goals', params] as const,
  calibration: ['performance', 'calibration'] as const,
  employees: ['performance', 'employees'] as const,
};

export function useActiveCycle() {
  return useQuery({
    queryKey: PERFORMANCE_KEYS.activeCycle,
    queryFn: () => performanceApi.getActiveCycle(),
  });
}

export function usePerformanceSummary() {
  return useQuery({
    queryKey: PERFORMANCE_KEYS.summary,
    queryFn: () => performanceApi.getSummary(),
  });
}

export function useReviews(params?: ReviewsParams) {
  return useQuery({
    queryKey: PERFORMANCE_KEYS.reviews(params),
    queryFn: () => performanceApi.getReviews(params),
  });
}

export function useGoals(params?: GoalsParams) {
  return useQuery({
    queryKey: PERFORMANCE_KEYS.goals(params),
    queryFn: () => performanceApi.getGoals(params),
  });
}

export function useCalibration() {
  return useQuery({
    queryKey: PERFORMANCE_KEYS.calibration,
    queryFn: () => performanceApi.getCalibration(),
  });
}

export function useAddGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddGoalInput) => performanceApi.addGoal(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['performance', 'goals'] });
      void qc.invalidateQueries({ queryKey: ['performance', 'summary'] });
    },
  });
}

export function usePerformanceEmployees() {
  return useQuery({
    queryKey: PERFORMANCE_KEYS.employees,
    queryFn: () => performanceApi.getEmployees(),
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: SubmitReviewInput }) =>
      performanceApi.submitReview(employeeId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['performance', 'reviews'] });
      void qc.invalidateQueries({ queryKey: ['performance', 'summary'] });
    },
  });
}
