import { healthMockHandlers } from './health-mock';
import { authHandlers } from './auth';
import { employeeSelfServiceHandlers } from './employee-self-service';
import { attendanceHandlers } from './attendance';
import { holidaysHandlers } from './holidays';
import { permissionsHandlers } from './permissions';
import { payrollComponentHandlers } from './payroll-components';
import { payrollGroupHandlers } from './payroll-groups';
import { payrollEmployeeHandlers } from './payroll-employee';
import { payrollRunHandlers } from './payroll-runs';
import { reportsHandlers } from './reports';
import { analyticsHandlers } from './analytics';
// Phase 2.5 — Settings: Integrations & Billing
import { settingsIntegrationHandlers } from './settings-integrations';

// MSW intercepts ONLY endpoints not yet live on the backend.
// When NEXT_PUBLIC_USE_MOCKS=true and no handler matches, the request passes
// through MSW → BFF (Next.js /api/*) → real Render backend unchanged.
//
// ── Still mocked (backend not yet built — 2026-05-26) ──────────────────────
//   POST /auth/otp/initiate          — MFA challenge initiation
//   POST /holidays/import            — .ics import + preview + commit
//   GET  /employee/dashboard         — leaveBalanceSummary not yet on live backend
//   GET  /employee/documents         — no live endpoint yet
//   POST /attendance/regularization/:id/documents — supporting doc upload not yet live
//   POST /settings/roles             — create custom role (Step 46)
//   DELETE /settings/roles/:key      — delete custom role (Step 46)
//   All  /payroll/*                  — Phase 2 payroll (not yet built)
//   All  /reports/*                  — Phase 2 reports (not yet built)
//   GET  /analytics/workforce-trend  — Phase 2 analytics (MSW)
//   GET  /analytics/attrition        — Phase 2 analytics (MSW)
//   GET  /analytics/payroll-cost     — Phase 2 analytics (MSW)
//   GET  /analytics/department-performance — Phase 2 analytics (MSW)
//
// ── Live — no handler here; all requests pass through ──────────────────────
//   Employees   GET/POST/PATCH/DELETE, bulk/deactivate, bulk/export, next-code
//   Departments GET/POST/PATCH/DELETE, :id/employees, reassign-and-delete
//   Leave       requests CRUD, bulk approve/reject, team/calendar, coverage
//   Attendance  records, summary, check-in/out, regularization, team/weekly
//   Holidays    CRUD, upcoming
//   Analytics   summary (+deltas), attendance, headcount, recent-activity
//   Dashboards  /manager/dashboard (extended)
//   Employee    /employee/team (live)
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

export const handlers = [
  ...healthMockHandlers,
  ...authHandlers,
  ...employeeSelfServiceHandlers,
  ...attendanceHandlers,
  ...holidaysHandlers,
  ...permissionsHandlers,
  ...payrollComponentHandlers,
  ...payrollGroupHandlers,
  ...payrollEmployeeHandlers,
  ...payrollRunHandlers,
  ...reportsHandlers,
  ...analyticsHandlers,
  ...settingsIntegrationHandlers,
];
