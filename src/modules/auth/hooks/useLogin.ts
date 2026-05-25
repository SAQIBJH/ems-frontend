import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryClient } from '@/lib/query-client';
import type { ApiError } from '@/types/api';
import { authApi } from '../services/auth.api';
import type { LoginInput } from '../validations/login.schema';
import type { LoginResponse, MfaRequiredResponse } from '../types/auth.types';

export function useLogin() {
  return useMutation<LoginResponse | MfaRequiredResponse, AxiosError<ApiError>, LoginInput>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if ('mfaRequired' in data) return; // cookies not issued yet — caller handles redirect
      // The server has already set the accessToken cookie. Invalidate the
      // /auth/me cache so AuthProvider refetches the canonical user object.
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
