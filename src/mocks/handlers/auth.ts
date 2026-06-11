import { http, HttpResponse, passthrough } from 'msw';

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

// Explicit SUPER_ADMIN permission list — identical to GET /settings/roles-permissions
// (API_MAPPING.md). The register mock and the /auth/me mock both return this.
const SUPER_ADMIN_PERMISSIONS = [
  'employees:read',
  'employees:write',
  'employees:delete',
  'employees:export',
  'departments:read',
  'departments:write',
  'attendance:read',
  'attendance:write',
  'leave:read',
  'leave:request',
  'leave:approve',
  'analytics:read',
  'permissions:manage',
  'audit:read',
];

// Fixed conflict fixture so the 409 path is testable.
export const MOCK_REGISTER_CONFLICT_EMAIL = 'taken@acme.test';

// Cookie that scopes a mock-registered session to the browser context that created
// it via POST /auth/register. GET /auth/me only serves the mock user when this
// cookie is present and maps to a stored record; everything else passes through.
const MOCK_SESSION_COOKIE = 'ems_mock_session';
const MOCK_SESSION_ID = 'usr_mock_admin';

interface MockRegisteredUser {
  id: string;
  email: string;
  memberType: 'SUPER_ADMIN';
  employeeId: null;
  status: string;
  employee: null;
  permissions: string[];
}

// Holds users created by mock POST /auth/register, keyed by the mock session id
// stored in the ems_mock_session cookie. Empty/missing → /auth/me passes through.
const mockRegisteredUsers = new Map<string, MockRegisteredUser>();

function parseMockSessionId(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName === MOCK_SESSION_COOKIE) {
      return rawValue.join('=') || null;
    }
  }
  return null;
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

  // POST /api/auth/register — LIVE on backend (verified 2026-06-11). This mock is an
  //   offline/demo fallback mirroring the live 201/409/422 shapes (BACKEND_API_REQUESTS.md §3).
  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as {
      companyName?: string;
      fullName?: string;
      email?: string;
      password?: string;
    };

    // Fixed conflict fixture so the 409 path is testable.
    if (body.email?.toLowerCase() === MOCK_REGISTER_CONFLICT_EMAIL) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Email already registered',
            details: [],
            requestId: 'mock-register',
          },
        },
        { status: 409 },
      );
    }

    // Validation — mirror the live backend's 422 VALIDATION_ERROR + details[]
    // (companyName ≥ 2, valid email, password ≥ 8). Verified live 2026-06-11.
    const details: { field: string; message: string }[] = [];
    if (!body.companyName || body.companyName.trim().length < 2) {
      details.push({ field: 'companyName', message: 'must NOT have fewer than 2 characters' });
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      details.push({ field: 'email', message: 'must match format "email"' });
    }
    if (!body.password || body.password.length < 8) {
      details.push({ field: 'password', message: 'must NOT have fewer than 8 characters' });
    }
    if (details.length > 0) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details,
            requestId: 'mock-register',
          },
        },
        { status: 422 },
      );
    }

    const mockUser: MockRegisteredUser = {
      id: MOCK_SESSION_ID,
      email: body.email ?? 'admin@acme.com',
      memberType: 'SUPER_ADMIN',
      employeeId: null,
      status: 'ACTIVE',
      employee: null,
      permissions: SUPER_ADMIN_PERMISSIONS,
    };
    mockRegisteredUsers.set(MOCK_SESSION_ID, mockUser);

    return HttpResponse.json(
      {
        success: true,
        data: {
          accessToken: 'mock-access-token',
          sessionId: 'sess_mock',
          tenant: {
            id: 'ten_mock',
            name: body.companyName ?? 'New Company',
            country: null,
            currency: null,
            timezone: null,
          },
          user: {
            id: mockUser.id,
            email: mockUser.email,
            memberType: 'SUPER_ADMIN',
            employeeId: null,
            employee: null,
          },
          permissions: SUPER_ADMIN_PERMISSIONS,
        },
        meta: {},
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': `${MOCK_SESSION_COOKIE}=${MOCK_SESSION_ID}; Path=/; SameSite=Lax`,
        },
      },
    );
  }),

  // GET /api/auth/me — under mocks, only return the just-registered admin to the
  // exact browser context that registered (identified by the ems_mock_session
  // cookie). All other sessions defer to the live backend.
  http.get('/api/auth/me', ({ request }) => {
    const sessionId = parseMockSessionId(request.headers.get('cookie'));
    const mockUser = sessionId ? mockRegisteredUsers.get(sessionId) : undefined;
    if (!mockUser) return passthrough();
    return HttpResponse.json({ success: true, data: mockUser, meta: {} });
  }),

  // POST /api/auth/logout — demo-mode mock: clears the mock session cookie and
  // the stored registered user so a later login in demo mode isn't shadowed.
  http.post('/api/auth/logout', ({ request }) => {
    const sessionId = parseMockSessionId(request.headers.get('cookie'));
    if (sessionId) mockRegisteredUsers.delete(sessionId);

    return HttpResponse.json(
      { success: true, data: {}, meta: {} },
      {
        headers: {
          'Set-Cookie': `${MOCK_SESSION_COOKIE}=; Path=/; Max-Age=0`,
        },
      },
    );
  }),
];
