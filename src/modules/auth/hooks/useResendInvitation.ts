import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types/api';
import { authApi } from '../services/auth.api';

export function useResendInvitation() {
  return useMutation<{ message: string }, AxiosError<ApiError>, string>({
    mutationFn: (email) => authApi.resendInvitation(email),
  });
}
