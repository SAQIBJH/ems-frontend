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
import { payrollLocalizationHandlers } from './payroll-localization';
import { payrollStatutoryHandlers } from './payroll-statutory';
import { payrollInputHandlers } from './payroll-inputs';
import { payrollTaxDeclarationHandlers } from './payroll-tax-declaration';
import { payrollLoanHandlers } from './payroll-loans';
import { payrollGarnishmentHandlers } from './payroll-garnishments';
import { payrollWorkerHandlers } from './payroll-workers';
import { payrollClaimHandlers } from './payroll-claims';
import { payrollDisbursementHandlers } from './payroll-disbursement';
import { payrollEventHandlers } from './payroll-events';
import { payrollTemplateHandlers } from './payroll-templates';
import { payrollTaxFormHandlers } from './payroll-tax-forms';
import { payrollAccountingHandlers } from './payroll-accounting';
import { payrollRegisterHandlers } from './payroll-registers';
import { payrollMigrationHandlers } from './payroll-migration';
import { payrollComplianceHandlers } from './payroll-compliance';
import { reportsHandlers } from './reports';
import { analyticsHandlers } from './analytics';
// Phase 2.5 — Settings: Integrations & Billing
import { settingsIntegrationHandlers } from './settings-integrations';
// Phase 3 — Net-new modules
import { timesheetHandlers } from './timesheets';
import { recruitmentHandlers } from './recruitment';
import { performanceHandlers } from './performance';
import { assetsHandlers } from './assets';
import { announcementsHandlers } from './announcements';

// MSW is an OFFLINE / DEMO FALLBACK ONLY. It intercepts solely when
// NEXT_PUBLIC_USE_MOCKS=true (that is the only condition under which MSWProvider
// starts the worker). In normal runs the flag is `false`, the worker never
// starts, and EVERY request goes straight to the live Render backend through the
// BFF (Next.js /api/*). The handlers registered below are completely INERT
// unless you deliberately flip the flag on.
//
// ── Live verification sweep — 2026-06-11 ───────────────────────────────────
// A live HR_ADMIN sweep against production confirmed that essentially every
// endpoint these handlers mock is now LIVE (200 + expected shape): all
// /payroll/* (components, groups, schedules, countries, legal-entities,
// pay-calendars, statutory-packs, runs + run-scoped inputs/payslips/journal/
// variance/payment-batch/audit, roster, employees, events, event-catalogue,
// reimbursement-*, workers, payslip-templates, cost-summary, contractor-invoices,
// opening-balances, payment-batches, migration, employee loans/tax-form/
// garnishments), all /reports/*, the 4 Phase-2 /analytics/* (workforce-trend,
// attrition, payroll-cost, department-performance), /settings/integrations/* +
// /settings/webhooks, all /timesheets/*, and all four Phase-3 modules
// (recruitment, performance, assets, announcements). See
// memory/live-sweep-2026-06-11.md.
//
// ── Genuinely NOT on the backend (the only real reason to keep a mock) ─────
//   POST /auth/otp/initiate          — MFA challenge initiation (MFA disabled)
//   POST /holidays/import            — .ics import + preview + commit
//
// CAUTION: the live shapes have moved on since these mocks were written, so the
// mocks may now be STALE relative to the real backend. If you flip mocks back on
// for offline/demo use, treat their response shapes as potentially behind live.
//
// (The previous "Still mocked (2026-05-26)" list here claimed payroll/reports/
// analytics/timesheets/phase-3 were unbuilt — that is obsolete; they shipped.)
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
  ...payrollLocalizationHandlers,
  ...payrollStatutoryHandlers,
  ...payrollInputHandlers,
  ...payrollTaxDeclarationHandlers,
  ...payrollLoanHandlers,
  ...payrollGarnishmentHandlers,
  ...payrollWorkerHandlers,
  ...payrollClaimHandlers,
  ...payrollDisbursementHandlers,
  ...payrollEventHandlers,
  ...payrollTemplateHandlers,
  ...payrollTaxFormHandlers,
  ...payrollAccountingHandlers,
  ...payrollRegisterHandlers,
  ...payrollMigrationHandlers,
  ...payrollComplianceHandlers,
  ...reportsHandlers,
  ...analyticsHandlers,
  ...settingsIntegrationHandlers,
  ...timesheetHandlers,
  ...recruitmentHandlers,
  ...performanceHandlers,
  ...assetsHandlers,
  ...announcementsHandlers,
];
