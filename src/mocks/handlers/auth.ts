import { http, HttpResponse } from 'msw';

// In-memory OTP challenges for the forgot-password flow
// POST /auth/otp/initiate is NOT yet built on the backend — only this mock serves it.
// All other auth endpoints (forgot-password, reset-password, verify-otp) are LIVE.
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
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    resendAvailableAt: new Date(Date.now() + 60 * 1000),
    resendCount: 0,
  };
}

export const authHandlers = [
  // POST /api/auth/otp/initiate — NOT built on backend yet (API_MAPPING.md "Not Yet Implemented")
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
      meta: {},
    });
  }),
];
