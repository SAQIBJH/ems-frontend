import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../services/search.api';

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => searchApi.search(q),
    enabled: q.trim().length >= 2,
    staleTime: 15_000,
  });
}
