import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../services/employees.api';

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeesApi.get(id),
    enabled: !!id,
  });
}
