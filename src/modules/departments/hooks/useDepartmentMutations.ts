'use client';

import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryClient } from '@/lib/query-client';
import type { ApiError } from '@/types/api';
import { departmentsApi } from '../services/departments.api';
import type {
  AddMembersResult,
  Department,
  DepartmentCreateInput,
  DepartmentDeleteResult,
  DepartmentUpdateInput,
  ReassignAndDeleteResult,
} from '../types/department.types';

export function useCreateDepartment() {
  return useMutation<Department, AxiosError<ApiError>, DepartmentCreateInput>({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartment() {
  return useMutation<Department, AxiosError<ApiError>, { id: string } & DepartmentUpdateInput>({
    mutationFn: departmentsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeleteDepartment() {
  return useMutation<DepartmentDeleteResult, AxiosError<ApiError>, string>({
    mutationFn: departmentsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useReassignAndDeleteDepartment() {
  return useMutation<
    ReassignAndDeleteResult,
    AxiosError<ApiError>,
    { id: string; reassignEmployeesTo: string }
  >({
    mutationFn: departmentsApi.reassignAndDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useAddDepartmentMembers() {
  return useMutation<AddMembersResult, AxiosError<ApiError>, { id: string; employeeIds: string[] }>(
    {
      mutationFn: departmentsApi.addMembers,
      onSuccess: (_result, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['departments'] });
        queryClient.invalidateQueries({ queryKey: ['departments', id, 'employees'] });
      },
    },
  );
}
