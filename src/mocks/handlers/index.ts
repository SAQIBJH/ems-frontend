import { healthMockHandlers } from './health-mock';
import { employeeHandlers } from './employees';
import { authHandlers } from './auth';
import { employeeSelfServiceHandlers } from './employee-self-service';

// MSW intercepts these when NEXT_PUBLIC_USE_MOCKS=true.
//
// LIVE (no longer mocked — removed 2026-05-25):
//   GET/PATCH /notifications, POST /auth/forgot-password, POST /auth/reset-password,
//   GET /search — all pass through BFF to the real backend.
//
// Still mocked (backend not yet built):
//   POST /auth/otp/initiate
//   GET /employee/dashboard (todayAttendance + leaveBalanceSummary fields)
//   GET /employee/documents

export const handlers = [
  ...healthMockHandlers,
  ...authHandlers,
  ...employeeHandlers,
  ...employeeSelfServiceHandlers,
];
