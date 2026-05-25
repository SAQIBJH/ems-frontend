import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types/api';
import { authApi } from '../services/auth.api';

interface ResetPasswordPayload {
  token: string;
  password: string;
}

export function useResetPassword() {
  return useMutation<void, AxiosError<ApiError>, ResetPasswordPayload>({
    mutationFn: ({ token, password }) => authApi.resetPassword(token, password),
  });
}
