import { http, HttpResponse } from 'msw';

// MSW handler for POST /attendance/regularization/:id/documents
// This endpoint is not yet live on the backend (2026-05-26).
// All other attendance endpoints pass through to the real backend.
export const attendanceHandlers = [
  http.post('/api/attendance/regularization/:id/documents', ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json({
      success: true,
      data: {
        documentUrl: `https://res.cloudinary.com/demo/regularization/${id}/document.pdf`,
      },
    });
  }),
];
