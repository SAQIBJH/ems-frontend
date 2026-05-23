import { useQuery } from '@tanstack/react-query';
import { holidaysApi } from '../services/holidays.api';

export function useHolidays(year: number) {
  return useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidaysApi.list(year),
    staleTime: 5 * 60_000,
  });
}
