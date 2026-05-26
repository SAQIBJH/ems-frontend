import { http, HttpResponse } from 'msw';

const DOCUMENTS = [
  {
    id: 'doc_1',
    filename: 'Aadhaar Card.pdf',
    category: 'AADHAAR',
    sizeBytes: 2_415_616,
    status: 'VERIFIED',
    uploadedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'doc_2',
    filename: 'PAN Card.pdf',
    category: 'PAN',
    sizeBytes: 1_048_576,
    status: 'PENDING',
    uploadedAt: '2026-03-20T14:30:00.000Z',
  },
  {
    id: 'doc_3',
    filename: 'Offer Letter.pdf',
    category: 'OFFER_LETTER',
    sizeBytes: 3_145_728,
    status: 'VERIFIED',
    uploadedAt: '2025-06-01T09:00:00.000Z',
  },
  {
    id: 'doc_4',
    filename: 'Degree Certificate.pdf',
    category: 'EDUCATION',
    sizeBytes: 5_242_880,
    status: 'REJECTED',
    uploadedAt: '2026-02-10T11:00:00.000Z',
  },
];

export const employeeSelfServiceHandlers = [
  /**
   * GET /api/employee/dashboard
   * Extended shape — includes leaveBalanceSummary (not yet on live backend).
   * todayAttendance is included here for completeness but the TodayAttendanceCard
   * reads directly from /attendance/today (live endpoint).
   */
  http.get('/api/employee/dashboard', () => {
    const checkedInAt = new Date();
    checkedInAt.setHours(9, 14, 0, 0);

    return HttpResponse.json({
      success: true,
      data: {
        employeeName: 'Priya Sharma',
        designation: 'Senior Engineer',
        department: 'Engineering',
        pendingLeaves: 1,
        todayAttendance: {
          checkedInAt: checkedInAt.toISOString(),
          checkedOutAt: null,
          workMode: 'WFH',
          status: 'PRESENT',
        },
        leaveBalanceSummary: [
          { code: 'CASUAL', name: 'Casual', available: 6 },
          { code: 'SICK', name: 'Sick', available: 4 },
          { code: 'ANNUAL', name: 'Earned', available: 12 },
        ],
      },
      meta: {},
    });
  }),

  /**
   * GET /api/employee/documents
   * MSW backed — no live backend endpoint yet.
   */
  http.get('/api/employee/documents', () => {
    return HttpResponse.json({
      success: true,
      data: { documents: DOCUMENTS },
      meta: {},
    });
  }),
];
