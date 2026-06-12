import { http, HttpResponse } from 'msw';

/**
 * Employees is a LIVE domain — this intercepts ONLY the one path the backend has
 * shipped but not yet given final emailed-link live proof for:
 * POST /employees/:id/invite (send/resend). It does not touch the live employee
 * CRUD endpoints. Remove once the invite flow is fully live-verified.
 */
export const employeeInviteHandlers = [
  http.post('/api/employees/:id/invite', () =>
    HttpResponse.json({
      success: true,
      data: {
        sent: true,
        sentTo: 'PERSONAL',
        email: 'j****@gmail.com',
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
      meta: {},
    }),
  ),
];
