import { http, HttpResponse } from 'msw';

// MSW handlers for the .ics import flow — POST /holidays/import is not yet live on the backend.
// All other holiday endpoints (GET/POST/PATCH/DELETE) pass through to the real backend.
const MOCK_JOB_ID = 'imp_mock_demo_2026';

export const holidaysHandlers = [
  // POST /api/holidays/import — multipart .ics upload, returns jobId
  http.post('/api/holidays/import', async () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          jobId: MOCK_JOB_ID,
          previewUrl: `/api/v1/holidays/import/${MOCK_JOB_ID}/preview`,
        },
        meta: {},
      },
      { status: 202 },
    );
  }),

  // GET /api/holidays/import/:jobId/preview
  http.get('/api/holidays/import/:jobId/preview', () => {
    return HttpResponse.json({
      success: true,
      data: {
        candidates: [
          { name: 'Republic Day', date: '2026-01-26', isOptional: false, willOverwrite: false },
          { name: 'Holi', date: '2026-03-14', isOptional: false, willOverwrite: false },
          { name: 'Good Friday', date: '2026-04-03', isOptional: true, willOverwrite: false },
          { name: 'Independence Day', date: '2026-08-15', isOptional: false, willOverwrite: true },
          { name: 'Gandhi Jayanti', date: '2026-10-02', isOptional: false, willOverwrite: false },
          { name: 'Diwali', date: '2026-10-20', isOptional: false, willOverwrite: true },
          { name: 'Christmas Day', date: '2026-12-25', isOptional: false, willOverwrite: false },
          { name: "New Year's Eve", date: '2026-12-31', isOptional: true, willOverwrite: false },
        ],
        summary: { new: 6, overwrites: 2, skipped: 0 },
      },
      meta: {},
    });
  }),

  // POST /api/holidays/import/:jobId/commit
  http.post('/api/holidays/import/:jobId/commit', async () => {
    return HttpResponse.json({
      success: true,
      data: { imported: 6, overwritten: 2, skipped: 0 },
      meta: {},
    });
  }),
];
