import { http, HttpResponse } from 'msw';

// In-memory store of valid reset tokens (token → email mapping)
const pendingResets = new Map<string, string>();

export const authHandlers = [
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
