import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../services/employees.api';
import type { EmployeeListParams } from '../types/employee.types';

export function useEmployees(params?: EmployeeListParams) {
  return useQuery({
    queryKey: ['employees', params ?? {}],
    queryFn: () => employeesApi.list(params),
  });
}
