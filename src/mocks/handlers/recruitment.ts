import { http, HttpResponse } from 'msw';
import type {
  RecruitmentSummary,
  OpeningsPage,
  CandidatesPage,
  AdvanceCandidateResult,
  Opening,
  Candidate,
  RecruitmentStage,
} from '@/modules/recruitment/types/recruitment.types';

const BASE = '/api/recruitment';

// ── Fixture data ─────────────────────────────────────────────────────────────

const SUMMARY: RecruitmentSummary = {
  openRequisitions: 6,
  activeCandidates: 242,
  interviewsThisWeek: 9,
  avgDaysToHire: 28,
  closingThisWeek: 2,
  interviewsToday: 3,
};

const OPENINGS: Opening[] = [
  {
    id: 'ENG-198',
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    location: 'Bengaluru',
    employmentType: 'FULL_TIME',
    applicantCount: 38,
    currentStage: 'Interviewing',
    status: 'Open',
    createdAt: '2026-04-15T00:00:00Z',
  },
  {
    id: 'ENG-201',
    title: 'Backend Engineer',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    applicantCount: 52,
    currentStage: 'Screening',
    status: 'Open',
    createdAt: '2026-04-20T00:00:00Z',
  },
  {
    id: 'ENG-204',
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Bengaluru',
    employmentType: 'FULL_TIME',
    applicantCount: 64,
    currentStage: 'Sourcing',
    status: 'Open',
    createdAt: '2026-04-25T00:00:00Z',
  },
  {
    id: 'DES-118',
    title: 'Product Designer',
    department: 'Product',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    applicantCount: 29,
    currentStage: 'Interviewing',
    status: 'Open',
    createdAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'SAL-077',
    title: 'Sales Development Rep',
    department: 'Sales',
    location: 'Mumbai',
    employmentType: 'FULL_TIME',
    applicantCount: 41,
    currentStage: 'Offer',
    status: 'Closing',
    createdAt: '2026-05-05T00:00:00Z',
  },
  {
    id: 'FIN-052',
    title: 'Financial Analyst',
    department: 'Finance',
    location: 'Mumbai',
    employmentType: 'CONTRACT',
    applicantCount: 18,
    currentStage: 'Sourcing',
    status: 'On hold',
    createdAt: '2026-05-10T00:00:00Z',
  },
];

const CANDIDATES: Candidate[] = [
  // Applied
  {
    id: 'cand_1',
    name: 'Ishaan Verma',
    role: 'Frontend Engineer',
    openingId: 'ENG-204',
    stage: 'applied',
    rating: 0,
    daysInStage: 1,
    isReferral: false,
    tag: 'ENG-204',
    email: 'ishaan.verma@example.com',
    appliedAt: '2026-06-02T00:00:00Z',
  },
  {
    id: 'cand_2',
    name: 'Tara Krishnan',
    role: 'Frontend Engineer',
    openingId: 'ENG-204',
    stage: 'applied',
    rating: 0,
    daysInStage: 2,
    isReferral: true,
    tag: 'ENG-204',
    email: 'tara.krishnan@example.com',
    appliedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'cand_3',
    name: 'Omar Sheikh',
    role: 'Product Designer',
    openingId: 'DES-118',
    stage: 'applied',
    rating: 0,
    daysInStage: 1,
    isReferral: false,
    tag: 'DES-118',
    email: 'omar.sheikh@example.com',
    appliedAt: '2026-06-02T00:00:00Z',
  },
  {
    id: 'cand_4',
    name: 'Leah Goldberg',
    role: 'Frontend Engineer',
    openingId: 'ENG-204',
    stage: 'applied',
    rating: 0,
    daysInStage: 3,
    isReferral: false,
    tag: 'ENG-204',
    email: 'leah.goldberg@example.com',
    appliedAt: '2026-05-31T00:00:00Z',
  },
  // Screening
  {
    id: 'cand_5',
    name: 'Diego Alvarez',
    role: 'Backend Engineer',
    openingId: 'ENG-201',
    stage: 'screening',
    rating: 3,
    daysInStage: 4,
    isReferral: false,
    tag: 'ENG-201',
    email: 'diego.alvarez@example.com',
    appliedAt: '2026-05-29T00:00:00Z',
  },
  {
    id: 'cand_6',
    name: 'Hana Sato',
    role: 'Product Designer',
    openingId: 'DES-118',
    stage: 'screening',
    rating: 4,
    daysInStage: 2,
    isReferral: false,
    tag: 'DES-118',
    email: 'hana.sato@example.com',
    appliedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'cand_7',
    name: 'Mateo Rossi',
    role: 'Backend Engineer',
    openingId: 'ENG-201',
    stage: 'screening',
    rating: 3,
    daysInStage: 5,
    isReferral: false,
    tag: 'ENG-201',
    email: 'mateo.rossi@example.com',
    appliedAt: '2026-05-28T00:00:00Z',
  },
  // Interview
  {
    id: 'cand_8',
    name: 'Fatima Noor',
    role: 'Senior Backend Engineer',
    openingId: 'ENG-198',
    stage: 'interview',
    rating: 4,
    daysInStage: 6,
    isReferral: true,
    tag: 'ENG-198',
    email: 'fatima.noor@example.com',
    appliedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'cand_9',
    name: 'Yuki Tanaka',
    role: 'Product Designer',
    openingId: 'DES-118',
    stage: 'interview',
    rating: 5,
    daysInStage: 3,
    isReferral: false,
    tag: 'DES-118',
    email: 'yuki.tanaka@example.com',
    appliedAt: '2026-05-30T00:00:00Z',
  },
  // Offer
  {
    id: 'cand_10',
    name: 'Carlos Mendez',
    role: 'Senior Backend Engineer',
    openingId: 'ENG-198',
    stage: 'offer',
    rating: 5,
    daysInStage: 2,
    isReferral: false,
    tag: 'ENG-198',
    email: 'carlos.mendez@example.com',
    appliedAt: '2026-05-25T00:00:00Z',
  },
  // Hired
  {
    id: 'cand_11',
    name: 'Anika Bose',
    role: 'Sales Development Rep',
    openingId: 'SAL-077',
    stage: 'hired',
    rating: 5,
    daysInStage: 0,
    isReferral: false,
    tag: 'SAL-077',
    email: 'anika.bose@example.com',
    appliedAt: '2026-05-20T00:00:00Z',
  },
];

const STAGE_SEQUENCE: RecruitmentStage[] = ['applied', 'screening', 'interview', 'offer', 'hired'];

// ── Handlers ──────────────────────────────────────────────────────────────────

export const recruitmentHandlers = [
  // GET /recruitment/summary
  http.get(`${BASE}/summary`, () => {
    return HttpResponse.json({ success: true, data: SUMMARY });
  }),

  // GET /recruitment/openings
  http.get(`${BASE}/openings`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? undefined;

    const filtered = status ? OPENINGS.filter((o) => o.status === status) : OPENINGS;

    const response: OpeningsPage = {
      openings: filtered,
      pagination: {
        page: 1,
        limit: 20,
        total: filtered.length,
        totalPages: 1,
      },
    };
    return HttpResponse.json({ success: true, data: response });
  }),

  // GET /recruitment/candidates
  http.get(`${BASE}/candidates`, ({ request }) => {
    const url = new URL(request.url);
    const openingId = url.searchParams.get('openingId') ?? undefined;
    const stage = url.searchParams.get('stage') ?? undefined;

    let filtered = CANDIDATES;
    if (openingId) filtered = filtered.filter((c) => c.openingId === openingId);
    if (stage) filtered = filtered.filter((c) => c.stage === stage);

    const response: CandidatesPage = {
      candidates: filtered,
      pagination: {
        page: 1,
        limit: 50,
        total: filtered.length,
        totalPages: 1,
      },
    };
    return HttpResponse.json({ success: true, data: response });
  }),

  // POST /recruitment/candidates/:id/advance
  http.post(`${BASE}/candidates/:id/advance`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { stage: string };
    const candidate = CANDIDATES.find((c) => c.id === id);

    if (!candidate) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Candidate not found' } },
        { status: 404 },
      );
    }

    if (candidate.stage === 'hired') {
      return HttpResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Candidate already hired' } },
        { status: 409 },
      );
    }

    const currentIdx = STAGE_SEQUENCE.indexOf(candidate.stage);
    const nextStage = STAGE_SEQUENCE[currentIdx + 1] as RecruitmentStage;

    // Mutate the in-memory fixture
    candidate.stage = (body.stage as RecruitmentStage) ?? nextStage;
    candidate.daysInStage = 0;

    const result: AdvanceCandidateResult = {
      id: candidate.id,
      stage: candidate.stage,
      daysInStage: 0,
    };
    return HttpResponse.json({ success: true, data: result });
  }),

  // POST /recruitment/openings
  http.post(`${BASE}/openings`, async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      department: string;
      location: string;
      employmentType: string;
    };

    const newOpening: Opening = {
      id: `NEW-${Math.floor(Math.random() * 900 + 100)}`,
      title: body.title,
      department: body.department,
      location: body.location,
      employmentType: body.employmentType as Opening['employmentType'],
      applicantCount: 0,
      currentStage: 'Sourcing',
      status: 'Open',
      createdAt: new Date().toISOString(),
    };

    OPENINGS.unshift(newOpening);
    return HttpResponse.json({ success: true, data: newOpening }, { status: 201 });
  }),
];
