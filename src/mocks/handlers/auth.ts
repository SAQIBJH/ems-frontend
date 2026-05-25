import { http, HttpResponse } from 'msw';

// In-memory store of valid reset tokens (token → email mapping)
const pendingResets = new Map<string, string>();

// In-memory OTP challenges: challengeId → { otp, expiresAt, resendAvailableAt, attempts }
interface OtpChallenge {
  otp: string;
  expiresAt: Date;
  resendAvailableAt: Date;
  resendCount: number;
}
const otpChallenges = new Map<string, OtpChallenge>();

function makeOtpChallenge(): OtpChallenge {
  return {
    otp: String(Math.floor(100000 + Math.random() * 900000)),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    resendAvailableAt: new Date(Date.now() + 60 * 1000), // 60 sec cooldown
    resendCount: 0,
  };
}

export const authHandlers = [
  // POST /api/auth/otp/initiate
  http.post('/api/auth/otp/initiate', async ({ request }) => {
    const body = (await request.json()) as { challengeId?: string };
    const challengeId = body?.challengeId ?? '';

    if (!challengeId) {
      return HttpResponse.json(
        { success: false, error: { code: 'CHALLENGE_NOT_FOUND', message: 'Challenge not found.' } },
        { status: 404 },
      );
    }

    const existing = otpChallenges.get(challengeId);

    if (existing) {
      if (existing.resendCount >= 3) {
        return HttpResponse.json(
          {
            success: false,
            error: { code: 'MAX_RESENDS', message: 'Maximum resend limit reached.' },
          },
          { status: 429 },
        );
      }
      if (Date.now() < existing.resendAvailableAt.getTime()) {
        return HttpResponse.json(
          { success: false, error: { code: 'RESEND_TOO_SOON', message: 'Wait before resending.' } },
          { status: 429 },
        );
      }
      existing.resendCount += 1;
      existing.resendAvailableAt = new Date(Date.now() + 60 * 1000);
      existing.otp = String(Math.floor(100000 + Math.random() * 900000));
    } else {
      otpChallenges.set(challengeId, makeOtpChallenge());
    }

    const challenge = otpChallenges.get(challengeId)!;
    return HttpResponse.json({
      success: true,
      data: {
        challengeId,
        deliveryMethod: 'EMAIL',
        expiresAt: challenge.expiresAt.toISOString(),
        resendAvailableAt: challenge.resendAvailableAt.toISOString(),
      },
    });
  }),

  // POST /api/auth/verify-otp
  http.post('/api/auth/verify-otp', async ({ request }) => {
    const body = (await request.json()) as { challengeId?: string; otp?: string };
    const { challengeId, otp } = body ?? {};

    const challenge = challengeId ? otpChallenges.get(challengeId) : undefined;

    if (!challenge) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'CHALLENGE_NOT_FOUND', message: 'Challenge not found or expired.' },
        },
        { status: 404 },
      );
    }

    if (Date.now() > challenge.expiresAt.getTime()) {
      otpChallenges.delete(challengeId!);
      return HttpResponse.json(
        { success: false, error: { code: 'OTP_EXPIRED', message: 'Code has expired.' } },
        { status: 400 },
      );
    }

    // Accept the challenge's generated OTP, or "000000" as a dev shortcut
    if (otp !== challenge.otp && otp !== '000000') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_OTP', message: 'Invalid code.' } },
        { status: 400 },
      );
    }

    otpChallenges.delete(challengeId!);

    // Return a minimal login-shaped response (real auth/me will be called after)
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        sessionId: `sess-${Date.now()}`,
        user: {
          id: 'mock-user-id',
          email: 'user@example.com',
          memberType: 'EMPLOYEE',
          employeeId: null,
          employee: null,
        },
        permissions: [],
      },
    });
  }),

  // POST /api/auth/forgot-password
  // Always responds with success to avoid email enumeration.
  http.post('/api/auth/forgot-password', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    const email = body?.email ?? '';

    if (!email) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required',
            details: [{ field: 'email', message: 'Email is required' }],
          },
        },
        { status: 422 },
      );
    }

    // Generate a mock token and store it
    const token = `mock-reset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pendingResets.set(token, email);

    return HttpResponse.json({
      success: true,
      data: { message: 'If an account exists, we have sent a link.' },
    });
  }),

  // POST /api/auth/reset-password
  http.post('/api/auth/reset-password', async ({ request }) => {
    const body = (await request.json()) as { token?: string; password?: string };
    const { token, password } = body ?? {};

    if (!token || !pendingResets.has(token)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Reset link is invalid or has expired.' },
        },
        { status: 400 },
      );
    }

    if (!password || password.length < 8) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 8 characters',
            details: [{ field: 'password', message: 'Password must be at least 8 characters' }],
          },
        },
        { status: 422 },
      );
    }

    pendingResets.delete(token);

    return HttpResponse.json({ success: true, data: null });
  }),
];
