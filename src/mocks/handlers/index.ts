import { healthMockHandlers } from './health-mock';
import { authHandlers } from './auth';

// MSW intercepts ONLY endpoints not yet live on the backend.
// When NEXT_PUBLIC_USE_MOCKS=true and no handler matches, the request passes
// through MSW → BFF (Next.js /api/*) → real Render backend unchanged.
//
// ── Still mocked (backend not yet built — 2026-05-26) ──────────────────────
//   POST /auth/otp/initiate          — MFA challenge initiation
//   POST /holidays/import            — .ics import + preview + commit
//
// ── Live — no handler here; all requests pass through ──────────────────────
//   Employees   GET/POST/PATCH/DELETE, bulk/deactivate, bulk/export, next-code
//   Departments GET/POST/PATCH/DELETE, :id/employees, reassign-and-delete
//   Leave       requests CRUD, bulk approve/reject, team/calendar, coverage
//   Attendance  records, summary, check-in/out, regularization, team/weekly
//   Holidays    CRUD, upcoming
//   Analytics   summary (+deltas), attendance, headcount, recent-activity
//   Dashboards  /employee/dashboard, /manager/dashboard (both extended)
//   Notifications GET, PATCH read, PATCH read-all
//   Search      GET /search
//   Settings    tenant, branding, attendance-rules, security/auth,
//               notifications/preferences, leave-types CRUD, roles CRUD
//   Documents   presign, confirm, GET, DELETE, download (Cloudinary multipart)
//   Audit logs  GET /audit-logs
//
// ── Shape deviations from BACKEND_API_REQUESTS.md to watch ─────────────────
//   GET /employees/next-code       → response field is "nextCode", not "code"
//   POST /employees/:id/documents/presign → uploadUrl is our own multipart
//                                     endpoint (not an S3 presign URL)
//   GET /leave/team/calendar       → members[].leaves[] (range objects),
//                                     not members[].days[] (per-day status grid)

export const handlers = [...healthMockHandlers, ...authHandlers];
