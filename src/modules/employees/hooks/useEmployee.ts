import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../services/employees.api';

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    // Pass includeTerminated so HR/SUPER can still open a terminated employee's
    // profile (the backend ignores it for other roles). Restores access to a
    // terminated profile that would otherwise 404 (BE-3).
    queryFn: () => employeesApi.get(id, true),
    enabled: !!id,
  });
}
