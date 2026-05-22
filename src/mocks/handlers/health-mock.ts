import { http, HttpResponse } from 'msw';

export const healthMockHandlers = [
  http.get('/api/health-mock', () => {
    return HttpResponse.json({ success: true, data: { status: 'msw-ok' }, meta: {} });
  }),
];
