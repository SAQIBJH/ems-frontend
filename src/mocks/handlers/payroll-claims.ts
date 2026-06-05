import { http, HttpResponse } from 'msw';
import type {
  ReimbursementCategory,
  ReimbursementClaim,
  ReimbursementClaimInput,
} from '@/modules/payroll/types/payroll.types';

// Reimbursement categories with per-period caps (config — no hardcoded country rule).
const CATEGORIES: ReimbursementCategory[] = [
  { code: 'FUEL', label: 'Fuel', monthlyCap: 1500000 },
  { code: 'TELEPHONE', label: 'Telephone', monthlyCap: 300000 },
  { code: 'INTERNET', label: 'Internet', monthlyCap: 200000 },
  { code: 'MEAL', label: 'Meal', monthlyCap: 220000 },
];

let claims: ReimbursementClaim[] = [
  {
    id: 'claim-001',
    employeeId: 'emp-004',
    category: 'FUEL',
    amount: 800000,
    currency: 'INR',
    description: 'Client visits — March',
    proofUrl: null,
    status: 'SUBMITTED',
    runId: null,
    submittedAt: '2026-05-04T09:00:00.000Z',
    decidedAt: null,
  },
  {
    id: 'claim-002',
    employeeId: 'emp-001',
    category: 'INTERNET',
    amount: 150000,
    currency: 'INR',
    description: 'Home broadband',
    proofUrl: null,
    status: 'APPROVED',
    runId: null,
    submittedAt: '2026-05-02T09:00:00.000Z',
    decidedAt: '2026-05-03T09:00:00.000Z',
    decidedBy: 'hr@acme.test',
  },
];

let idCounter = 100;

/** Approved claims attached to a run, grouped by employee (consumed by the engine). */
export function getClaimsForRun(runId: string): Record<string, ReimbursementClaim[]> {
  const map: Record<string, ReimbursementClaim[]> = {};
  for (const c of claims) {
    if (c.runId === runId) (map[c.employeeId] ??= []).push(c);
  }
  return map;
}

/** Attach all approved, unattached claims to the run being calculated. */
export function attachApprovedClaimsToRun(runId: string): void {
  claims = claims.map((c) => (c.status === 'APPROVED' && !c.runId ? { ...c, runId } : c));
}

/** Mark a run's attached claims as paid once the run is paid. */
export function markRunClaimsPaid(runId: string): void {
  claims = claims.map((c) =>
    c.runId === runId && c.status === 'APPROVED' ? { ...c, status: 'PAID' } : c,
  );
}

export const payrollClaimHandlers = [
  http.get('/api/payroll/reimbursement-categories', () => {
    return HttpResponse.json({ success: true, data: CATEGORIES });
  }),

  http.get('/api/payroll/reimbursement-claims', ({ request }) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    const status = url.searchParams.get('status');
    let result = claims;
    if (employeeId) result = result.filter((c) => c.employeeId === employeeId);
    if (status) result = result.filter((c) => c.status === status);
    return HttpResponse.json({ success: true, data: result });
  }),

  http.post('/api/payroll/reimbursement-claims', async ({ request }) => {
    const body = (await request.json()) as ReimbursementClaimInput & { employeeId: string };
    const category = CATEGORIES.find((c) => c.code === body.category);
    if (category && body.amount > category.monthlyCap) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CLAIM_OVER_CAP',
            message: `${category.label} claims are capped at this period's limit`,
          },
        },
        { status: 422 },
      );
    }
    const created: ReimbursementClaim = {
      id: `claim-${++idCounter}`,
      employeeId: body.employeeId,
      category: body.category,
      amount: body.amount,
      currency: body.currency ?? 'INR',
      description: body.description,
      proofUrl: body.proofUrl ?? null,
      status: 'SUBMITTED',
      runId: null,
      submittedAt: new Date().toISOString(),
      decidedAt: null,
    };
    claims = [...claims, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  // Approve / reject a claim.
  http.patch('/api/payroll/reimbursement-claims/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { status: 'APPROVED' | 'REJECTED' };
    const idx = claims.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Claim not found' } },
        { status: 404 },
      );
    }
    claims[idx] = {
      ...claims[idx],
      status: body.status,
      decidedAt: new Date().toISOString(),
      decidedBy: 'hr@acme.test',
    };
    return HttpResponse.json({ success: true, data: claims[idx] });
  }),
];
