import { apiClient } from '@/lib/api-client';
import type { User } from '@/types/user';
import type { LoginInput } from '../validations/login.schema';
import type {
  AcceptInvitationResult,
  InvitationValidation,
  LoginResponse,
  MfaRequiredResponse,
  OtpInitiateResponse,
  Session,
} from '../types/auth.types';

export const authApi = {
  login: async (input: LoginInput): Promise<LoginResponse | MfaRequiredResponse> => {
    const { data } = await apiClient.post<{ data: LoginResponse | MfaRequiredResponse }>(
      '/auth/login',
      input,
    );
    return data.data;
  },

  otpInitiate: async (challengeId: string): Promise<OtpInitiateResponse> => {
    const { data } = await apiClient.post<{ data: OtpInitiateResponse }>('/auth/otp/initiate', {
      challengeId,
    });
    return data.data;
  },

  verifyOtp: async (challengeId: string, code: string): Promise<LoginResponse> => {
    // Field name is "code" on the live backend (NOT "otp") — API_MAPPING.md §Auth
    const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/verify-otp', {
      challengeId,
      code,
    });
    return data.data;
  },

  refresh: async (): Promise<void> => {
    // Under cookie auth the server rotates the accessToken cookie silently.
    // The 401 interceptor in api-client.ts calls this directly; callers
    // outside that interceptor should not need to inspect the response.
    await apiClient.post('/auth/refresh');
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  logoutAll: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all');
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ data: User }>('/auth/me');
    return data.data;
  },

  sessions: async (): Promise<Session[]> => {
    const { data } = await apiClient.get<{ data: Session[] }>('/auth/sessions');
    return data.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ data: { message: string } }>('/auth/forgot-password', {
      email,
    });
    return data.data;
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  // ── Employee invitation / account activation ──────────────────────────────

  /** GET /auth/invitation?token= — public; always 200, state is in `data.status`. */
  validateInvitation: async (token: string): Promise<InvitationValidation> => {
    const { data } = await apiClient.get<{ data: InvitationValidation }>('/auth/invitation', {
      params: { token },
    });
    return data.data;
  },

  /** POST /auth/accept-invitation — public; sets password, activates the user. */
  acceptInvitation: async (token: string, password: string): Promise<AcceptInvitationResult> => {
    const { data } = await apiClient.post<{ data: AcceptInvitationResult }>(
      '/auth/accept-invitation',
      { token, password },
    );
    return data.data;
  },

  /** POST /auth/invitation/resend — public; generic no-leak response. */
  resendInvitation: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ data: { message: string } }>(
      '/auth/invitation/resend',
      {
        email,
      },
    );
    return data.data;
  },
};
