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

  // ── Employee invitation / account activation (LIVE on backend; mock kept as
  //    a fallback until the final emailed-link live proof). Dev convenience:
  //    ?token=expired|used|invalid|notfound exercise each state; any other
  //    token is treated as VALID. ───────────────────────────────────────────

  // GET /api/auth/invitation?token= — always 200, state in data.status
  http.get('/api/auth/invitation', ({ request }) => {
    const token = new URL(request.url).searchParams.get('token') ?? '';
    const status =
      token === 'expired'
        ? 'EXPIRED'
        : token === 'used'
          ? 'USED'
          : !token || token === 'invalid' || token === 'notfound'
            ? 'NOT_FOUND'
            : 'VALID';
    return HttpResponse.json({
      success: true,
      data: {
        status,
        employee: status === 'VALID' ? { firstName: 'Jane', companyName: 'Acme Corp' } : null,
        expiresAt:
          status === 'VALID' ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() : null,
      },
      meta: {},
    });
  }),

  // POST /api/auth/accept-invitation
  http.post('/api/auth/accept-invitation', async ({ request }) => {
    const body = (await request.json()) as { token?: string; password?: string };
    const token = body?.token ?? '';
    const password = body?.password ?? '';

    const err = (status: number, code: string, message: string, details?: unknown) =>
      HttpResponse.json({ success: false, error: { code, message, details } }, { status });

    if (token === 'expired') return err(410, 'INVITE_EXPIRED', 'This invitation has expired.');
    if (token === 'used')
      return err(409, 'INVITE_ALREADY_USED', 'This invitation has already been used.');
    if (!token || token === 'invalid' || token === 'notfound')
      return err(404, 'INVALID_TOKEN', 'Invalid invitation token.');

    const strong =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password);
    if (!strong) {
      return err(422, 'WEAK_PASSWORD', 'Password does not meet policy', [
        {
          field: 'password',
          message: 'Password must be at least 8 characters with upper, lower, and a number.',
        },
      ]);
    }

    return HttpResponse.json({ success: true, data: { activated: true }, meta: {} });
  }),

  // POST /api/auth/invitation/resend — generic no-leak response
  http.post('/api/auth/invitation/resend', () =>
    HttpResponse.json({
      success: true,
      data: { message: 'If an invite exists, a new link was sent' },
      meta: {},
    }),
  ),
];
