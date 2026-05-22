import { healthMockHandlers } from './health-mock';

// MSW only covers endpoints not yet live on the backend:
//   - POST /employees/:id/documents  (document upload)
//   - /notifications  (any method)
//   - /resignations   (any method)
//
// All other endpoints pass through to the real backend via onUnhandledRequest: 'bypass'.
// When a real endpoint ships for documents/notifications/resignations, add its handler
// here and delete this comment line for that item.

export const handlers = [...healthMockHandlers];
