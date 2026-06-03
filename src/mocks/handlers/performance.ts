import { http, HttpResponse } from 'msw';
import type {
  ActiveCycle,
  PerformanceSummary,
  ReviewsPage,
  GoalsPage,
  CalibrationData,
  Goal,
} from '@/modules/performance/types/performance.types';

const BASE = '/api/performance';

// ── Fixture data ─────────────────────────────────────────────────────────────

const ACTIVE_CYCLE: ActiveCycle = {
  id: 'cycle_h1_2026',
  name: 'H1 2026 Review Cycle',
  selfReviewDue: '2026-06-07',
  managerReviewDue: '2026-06-14',
  calibrationDate: '2026-06-21',
  progressPct: 58,
  status: 'In progress',
  startedAt: '2026-05-15T00:00:00Z',
};

const SUMMARY: PerformanceSummary = {
  reviewsComplete: 42,
  reviewsTotal: 73,
  goalsOnTrackPct: 81,
  goalsOnTrackDelta: 6,
  avgRating: 3.4,
  overdueReviews: 7,
};

const REVIEWS: ReviewsPage['reviews'] = [
  {
    employeeId: 'emp_1',
    employeeName: 'Priya Sharma',
    department: 'Engineering',
    reviewerName: 'Aman Khanna',
    status: 'Calibrated',
    rating: 'Exceeds',
    selfComplete: true,
    managerComplete: true,
  },
  {
    employeeId: 'emp_2',
    employeeName: 'Rohan Mehta',
    department: 'Sales',
    reviewerName: 'Sneha Rao',
    status: 'Manager review',
    rating: null,
    selfComplete: true,
    managerComplete: false,
  },
  {
    employeeId: 'emp_3',
    employeeName: 'Nisha Iyer',
    department: 'Product',
    reviewerName: 'Aman Khanna',
    status: 'Manager review',
    rating: null,
    selfComplete: true,
    managerComplete: false,
  },
  {
    employeeId: 'emp_4',
    employeeName: 'Vikram Singh',
    department: 'Engineering',
    reviewerName: 'Aman Khanna',
    status: 'Calibrated',
    rating: 'Strong',
    selfComplete: true,
    managerComplete: true,
  },
  {
    employeeId: 'emp_5',
    employeeName: 'Asha Joshi',
    department: 'Finance',
    reviewerName: 'Maya Rangan',
    status: 'Self review',
    rating: null,
    selfComplete: false,
    managerComplete: false,
  },
  {
    employeeId: 'emp_6',
    employeeName: 'Devansh Patel',
    department: 'Engineering',
    reviewerName: 'Aman Khanna',
    status: 'Calibrated',
    rating: 'Meets',
    selfComplete: true,
    managerComplete: true,
  },
  {
    employeeId: 'emp_7',
    employeeName: 'Karan Mehra',
    department: 'Sales',
    reviewerName: 'Sneha Rao',
    status: 'Not started',
    rating: null,
    selfComplete: false,
    managerComplete: false,
  },
];

let GOALS: Goal[] = [
  {
    id: 'goal_1',
    employeeId: 'emp_1',
    employeeName: 'Priya Sharma',
    title: 'Ship design-system v2 to all squads',
    progressPct: 80,
    dueDate: '2026-06-30',
    status: 'On track',
  },
  {
    id: 'goal_2',
    employeeId: 'emp_2',
    employeeName: 'Rohan Mehta',
    title: 'Close ₹2.4Cr in net-new pipeline',
    progressPct: 62,
    dueDate: '2026-06-30',
    status: 'On track',
  },
  {
    id: 'goal_3',
    employeeId: 'emp_3',
    employeeName: 'Nisha Iyer',
    title: 'Launch self-serve onboarding flow',
    progressPct: 45,
    dueDate: '2026-06-30',
    status: 'At risk',
  },
  {
    id: 'goal_4',
    employeeId: 'emp_4',
    employeeName: 'Vikram Singh',
    title: 'Reduce p95 API latency below 200ms',
    progressPct: 90,
    dueDate: '2026-06-30',
    status: 'On track',
  },
  {
    id: 'goal_5',
    employeeId: 'emp_5',
    employeeName: 'Asha Joshi',
    title: 'Automate monthly close to 2 days',
    progressPct: 30,
    dueDate: '2026-07-15',
    status: 'At risk',
  },
  {
    id: 'goal_6',
    employeeId: 'emp_6',
    employeeName: 'Devansh Patel',
    title: 'Migrate 8 services to new auth gateway',
    progressPct: 100,
    dueDate: '2026-05-31',
    status: 'Done',
  },
];

const CALIBRATION: CalibrationData = {
  totalReviewed: 73,
  distribution: [
    { rating: 'Exceeds', count: 8, pct: 11 },
    { rating: 'Strong', count: 19, pct: 26 },
    { rating: 'Meets', count: 33, pct: 45 },
    { rating: 'Developing', count: 10, pct: 14 },
    { rating: 'Below', count: 3, pct: 4 },
  ],
  notes: [
    {
      tone: 'warning',
      title: 'Engineering skews high',
      body: '41% rated Strong or above vs 37% org-wide. Flagged for review on Jun 21.',
    },
    {
      tone: 'success',
      title: 'Distribution within band',
      body: 'Below + Developing held under 20% target.',
    },
  ],
};

// ── Handlers ──────────────────────────────────────────────────────────────────

export const performanceHandlers = [
  // GET /performance/cycles/active
  http.get(`${BASE}/cycles/active`, () => {
    return HttpResponse.json({ success: true, data: ACTIVE_CYCLE });
  }),

  // GET /performance/summary
  http.get(`${BASE}/summary`, () => {
    return HttpResponse.json({ success: true, data: SUMMARY });
  }),

  // GET /performance/reviews
  http.get(`${BASE}/reviews`, ({ request }) => {
    const url = new URL(request.url);
    const department = url.searchParams.get('departmentId') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;

    let filtered = REVIEWS;
    if (department) filtered = filtered.filter((r) => r.department === department);
    if (status) filtered = filtered.filter((r) => r.status === status);

    const response: ReviewsPage = {
      reviews: filtered,
      pagination: { page: 1, limit: 50, total: filtered.length, totalPages: 1 },
    };
    return HttpResponse.json({ success: true, data: response });
  }),

  // GET /performance/goals
  http.get(`${BASE}/goals`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? undefined;

    const filtered = status ? GOALS.filter((g) => g.status === status) : GOALS;

    const response: GoalsPage = {
      goals: filtered,
      pagination: { page: 1, limit: 50, total: filtered.length, totalPages: 1 },
    };
    return HttpResponse.json({ success: true, data: response });
  }),

  // GET /performance/calibration
  http.get(`${BASE}/calibration`, () => {
    return HttpResponse.json({ success: true, data: CALIBRATION });
  }),

  // POST /performance/goals
  http.post(`${BASE}/goals`, async ({ request }) => {
    const body = (await request.json()) as {
      employeeId: string;
      title: string;
      dueDate: string;
      progressPct: number;
    };

    if (!body.title || !body.employeeId || !body.dueDate) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 422 },
      );
    }

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      employeeId: body.employeeId,
      employeeName: 'New Employee',
      title: body.title,
      progressPct: body.progressPct ?? 0,
      dueDate: body.dueDate,
      status: 'On track',
    };

    GOALS = [newGoal, ...GOALS];
    return HttpResponse.json({ success: true, data: newGoal }, { status: 201 });
  }),
];
