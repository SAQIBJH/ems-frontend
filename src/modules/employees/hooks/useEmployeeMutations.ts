'use client';

import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryClient } from '@/lib/query-client';
import type { ApiError } from '@/types/api';
import { employeesApi } from '../services/employees.api';
import type {
  BulkDeactivateResult,
  BulkExportResult,
  EmployeeCreateInput,
  EmployeeDeleteResult,
  EmployeeDetail,
  EmployeeUpdateInput,
} from '../types/employee.types';

export function useCreateEmployee() {
  return useMutation<EmployeeDetail, AxiosError<ApiError>, EmployeeCreateInput>({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  return useMutation<EmployeeDetail, AxiosError<ApiError>, { id: string } & EmployeeUpdateInput>({
    mutationFn: employeesApi.update,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.setQueryData(['employees', updated.id], updated);
    },
  });
}

export function useDeleteEmployee() {
  return useMutation<EmployeeDeleteResult, AxiosError<ApiError>, string>({
    mutationFn: employeesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useBulkDeactivate() {
  return useMutation<BulkDeactivateResult, AxiosError<ApiError>, string[]>({
    mutationFn: employeesApi.bulkDeactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useBulkExport() {
  return useMutation<BulkExportResult, AxiosError<ApiError>, string[]>({
    mutationFn: employeesApi.bulkExport,
  });
}
