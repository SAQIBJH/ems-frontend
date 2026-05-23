import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '../services/departments.api';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
    staleTime: 60_000,
  });
}
