import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '../services/departments.api';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
    staleTime: 60_000,
  });
}

export function useDepartmentEmployees(
  deptId: string | null,
  params?: { page?: number; limit?: number; search?: string },
) {
  return useQuery({
    queryKey: ['departments', deptId, 'employees', params],
    queryFn: () => departmentsApi.getDepartmentEmployees(deptId!, params),
    enabled: !!deptId,
    staleTime: 30_000,
  });
}
