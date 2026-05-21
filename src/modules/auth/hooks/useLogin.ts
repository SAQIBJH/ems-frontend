import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryClient } from '@/lib/query-client';
import { setAccessToken } from '@/lib/auth';
import type { ApiError } from '@/types/api';
import { authApi } from '../services/auth.api';
import type { LoginInput } from '../validations/login.schema';
import type { LoginResponse } from '../types/auth.types';

export function useLogin() {
  return useMutation<LoginResponse, AxiosError<ApiError>, LoginInput>({
    mutationFn: authApi.login,
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
