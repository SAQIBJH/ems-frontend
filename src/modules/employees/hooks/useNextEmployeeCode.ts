import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../services/employees.api';

export function useNextEmployeeCode() {
  return useQuery({
    queryKey: ['employees', 'next-code'],
    queryFn: employeesApi.getNextCode,
    enabled: false,
    staleTime: 0,
  });
}
