import { http, HttpResponse } from 'msw';
import type { Notification } from '@/modules/notifications/types/notification.types';

const seed: Notification[] = [
  {
    id: 'n_01',
    type: 'LEAVE_APPROVED',
    title: 'Leave request approved',
    body: 'Aman Kumar approved your annual leave for Jun 15–17.',
    entityType: 'LeaveRequest',
    entityId: 'lr_99',
    actionUrl: '/leave?tab=my-requests',
    isRead: false,
    createdAt: '2026-05-25T09:12:00.000Z',
  },
  {
    id: 'n_02',
    type: 'LEAVE_REQUESTED',
    title: 'New leave request',
    body: 'Priya Sharma requested 3 days of sick leave (May 28–30).',
    entityType: 'LeaveRequest',
    entityId: 'lr_100',
    actionUrl: '/leave?tab=approvals',
    isRead: false,
    createdAt: '2026-05-24T14:30:00.000Z',
  },
  {
    id: 'n_03',
    type: 'ATTENDANCE_REGULARIZATION_REQUESTED',
    title: 'Regularization request',
    body: 'Rahul Verma submitted a regularization request for May 22.',
    entityType: 'AttendanceRecord',
    entityId: 'att_55',
    actionUrl: '/attendance?tab=regularization',
    isRead: false,
    createdAt: '2026-05-24T11:00:00.000Z',
  },
  {
    id: 'n_04',
    type: 'EMPLOYEE_CREATED',
    title: 'New employee added',
    body: 'Sneha Patel joined as Frontend Developer in Engineering.',
    entityType: 'Employee',
    entityId: 'emp-020',
    actionUrl: '/employees/emp-020',
    isRead: false,
    createdAt: '2026-05-23T10:45:00.000Z',
  },
  {
    id: 'n_05',
    type: 'LEAVE_REJECTED',
    title: 'Leave request declined',
    body: 'Your leave request for May 30 was declined. Reason: insufficient coverage.',
    entityType: 'LeaveRequest',
    entityId: 'lr_98',
    actionUrl: '/leave?tab=my-requests',
    isRead: true,
    createdAt: '2026-05-22T16:00:00.000Z',
  },
  {
    id: 'n_06',
    type: 'ATTENDANCE_REGULARIZATION_APPROVED',
    title: 'Regularization approved',
    body: 'Your regularization request for May 20 has been approved.',
    entityType: 'AttendanceRecord',
    entityId: 'att_50',
    actionUrl: '/attendance',
    isRead: true,
    createdAt: '2026-05-22T13:00:00.000Z',
  },
  {
    id: 'n_07',
    type: 'DOCUMENT_UPLOADED',
    title: 'Document uploaded',
    body: 'Aman Kumar uploaded a new document: Offer Letter.pdf.',
    entityType: 'Employee',
    entityId: 'emp-001',
    actionUrl: '/employees/emp-001',
    isRead: true,
    createdAt: '2026-05-21T09:20:00.000Z',
  },
  {
    id: 'n_08',
    type: 'SYSTEM',
    title: 'Scheduled maintenance',
    body: 'The system will be under maintenance on May 27, 2:00–4:00 AM IST.',
    entityType: 'System',
    entityId: 'sys_01',
    actionUrl: '/dashboard',
    isRead: true,
    createdAt: '2026-05-20T08:00:00.000Z',
  },
];

// In-memory mutable store (resets on page reload)
let store: Notification[] = seed.map((n) => ({ ...n }));

export const notificationHandlers = [
  http.get('/api/notifications', ({ request }) => {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(url.searchParams.get('limit')) || 20);

    const filtered = unreadOnly ? store.filter((n) => !n.isRead) : store;
    const paginated = filtered.slice((page - 1) * limit, page * limit);
    const unreadCount = store.filter((n) => !n.isRead).length;

    return HttpResponse.json({
      success: true,
      data: {
        notifications: paginated,
        unreadCount,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      },
      meta: {},
    });
  }),

  http.post('/api/notifications/:id/read', ({ params }) => {
    const { id } = params as { id: string };
    const n = store.find((x) => x.id === id);
    if (!n) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } },
        { status: 404 },
      );
    }
    n.isRead = true;
    return HttpResponse.json({ success: true, data: { id, isRead: true }, meta: {} });
  }),

  http.post('/api/notifications/read-all', () => {
    const count = store.filter((n) => !n.isRead).length;
    store = store.map((n) => ({ ...n, isRead: true }));
    return HttpResponse.json({ success: true, data: { markedRead: count }, meta: {} });
  }),
];
