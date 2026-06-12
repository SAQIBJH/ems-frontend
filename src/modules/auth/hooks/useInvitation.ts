import { useQuery } from '@tanstack/react-query';
import { authApi } from '../services/auth.api';

/**
 * Validates an invitation token (GET /auth/invitation).
 * The endpoint always returns 200 with the state in `data.status`, so we don't
 * retry and treat the result as fresh each mount (token state can change).
 */
export function useInvitation(token: string) {
  return useQuery({
    queryKey: ['auth', 'invitation', token],
    queryFn: () => authApi.validateInvitation(token),
    enabled: !!token,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
