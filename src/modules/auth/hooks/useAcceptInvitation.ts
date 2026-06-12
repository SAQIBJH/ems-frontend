import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types/api';
import { authApi } from '../services/auth.api';
import type { AcceptInvitationResult } from '../types/auth.types';

interface AcceptInvitationPayload {
  token: string;
  password: string;
}

export function useAcceptInvitation() {
  return useMutation<AcceptInvitationResult, AxiosError<ApiError>, AcceptInvitationPayload>({
    mutationFn: ({ token, password }) => authApi.acceptInvitation(token, password),
  });
}
