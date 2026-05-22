import { healthMockHandlers } from './health-mock';
import { employeeHandlers } from './employees';

// MSW intercepts these when NEXT_PUBLIC_USE_MOCKS=true.
// Auth endpoints always pass through to the real backend (no handler defined here).
// When NEXT_PUBLIC_USE_MOCKS=false, all requests bypass MSW entirely.

export const handlers = [...healthMockHandlers, ...employeeHandlers];
