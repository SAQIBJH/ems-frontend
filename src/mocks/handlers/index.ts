import { healthMockHandlers } from './health-mock';
import { employeeHandlers } from './employees';
import { searchHandlers } from './search';
import { notificationHandlers } from './notifications';
import { authHandlers } from './auth';

// MSW intercepts these when NEXT_PUBLIC_USE_MOCKS=true.
// Auth extras (forgot/reset password) are mocked here; login/logout/me pass through to the real backend.
// When NEXT_PUBLIC_USE_MOCKS=false, all requests bypass MSW entirely.

export const handlers = [
  ...healthMockHandlers,
  ...authHandlers,
  ...employeeHandlers,
  ...searchHandlers,
  ...notificationHandlers,
];
