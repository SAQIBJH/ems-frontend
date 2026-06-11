import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryClient } from '@/lib/query-client';
import type { ApiError } from '@/types/api';
import { authApi } from '../services/auth.api';
import type { RegisterInput } from '../validations/register.schema';
import type { RegisterResponse } from '../types/auth.types';

export function useRegister() {
  return useMutation<RegisterResponse, AxiosError<ApiError>, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: () => {
      // Server has set the accessToken cookie on the 201. Invalidate the
      // /auth/me cache so AuthProvider refetches the canonical user object.
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
