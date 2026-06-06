import { http, HttpResponse } from 'msw';
import type {
  Worker,
  WorkerClassification,
  ContractorInvoice,
  ContractorInvoiceInput,
  ContractorInvoiceStatus,
  CostGroupBy,
  CostSummary,
  CostSummaryGroup,
} from '@/modules/payroll/types/payroll.types';

/**
 * Global employment models (§18). One tenant pays salaried employees (own entity),
 * invoice-based contractors (no statutory withholding, optional WHT-at-source), and
 * EOR workers (paid through a partner entity abroad). Cost is consolidated to a base
 * currency via a date-effective FX table (§3.3). Money is minor units throughout.
 */

const BASE_CURRENCY = 'INR';
// FX rates → base currency (major-per-major; minor-unit-safe for 2-decimal currencies).
const FX_RATES: Record<string, number> = {
  INR: 1,
  USD: 83,
  EUR: 90,
  GBP: 105,
};

let workers: Worker[] = [
  {
    id: 'wrk-emp-001',
    name: 'Aman Kumar',
    classification: 'EMPLOYEE',
    country: 'IN',
    currency: 'INR',
    legalEntityId: 'le-in',
    legalEntityName: 'Acme India Pvt Ltd',
    monthlyCost: 22000000, // ₹2,20,000 (gross + employer cost)
    riskFlag: null,
    active: true,
  },
  {
    id: 'wrk-emp-006',
    name: 'Nisha Iyer',
    classification: 'EMPLOYEE',
    country: 'IN',
    currency: 'INR',
    legalEntityId: 'le-in',
    legalEntityName: 'Acme India Pvt Ltd',
    monthlyCost: 16500000, // ₹1,65,000
    riskFlag: null,
    active: true,
  },
  {
    id: 'wrk-emp-200',
    name: 'Jordan Blake',
    classification: 'EMPLOYEE',
    country: 'US',
    currency: 'USD',
    legalEntityId: 'le-us',
    legalEntityName: 'Acme USA Inc',
    monthlyCost: 950000, // $9,500
    riskFlag: null,
    active: true,
  },
  {
    id: 'wrk-con-001',
    name: 'Diego Ramirez',
    classification: 'CONTRACTOR',
    country: 'US',
    currency: 'USD',
    legalEntityId: 'le-us',
    legalEntityName: 'Acme USA Inc',
    monthlyCost: 600000, // $6,000 typical monthly invoice
    riskFlag: 'Works full-time hours, single client — review classification',
    active: true,
  },
  {
    id: 'wrk-con-002',
    name: 'Sana Khalid',
    classification: 'CONTRACTOR',
    country: 'IN',
    currency: 'INR',
    legalEntityId: 'le-in',
    legalEntityName: 'Acme India Pvt Ltd',
    monthlyCost: 18000000, // ₹1,80,000
    riskFlag: null,
    active: true,
  },
  {
    id: 'wrk-eor-001',
    name: 'Lena Fischer',
    classification: 'EOR',
    country: 'DE',
    currency: 'EUR',
    legalEntityId: 'eor-de',
    legalEntityName: 'Remote Partner GmbH (EOR)',
    monthlyCost: 720000, // €7,200 (partner handles local statutory)
    riskFlag: null,
    active: true,
  },
];

let invoices: ContractorInvoice[] = [
  {
    id: 'cinv-001',
    workerId: 'wrk-con-001',
    workerName: 'Diego Ramirez',
    period: '2026-05',
    amount: 600000,
    currency: 'USD',
    withholdingPct: 10,
    netPayable: 540000,
    status: 'PAID',
    payoutRef: 'WISE/2026/05/DR',
    submittedAt: '2026-05-28T00:00:00.000Z',
    decidedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'cinv-002',
    workerId: 'wrk-con-001',
    workerName: 'Diego Ramirez',
    period: '2026-06',
    amount: 640000,
    currency: 'USD',
    withholdingPct: 10,
    netPayable: 576000,
    status: 'SUBMITTED',
    payoutRef: null,
    submittedAt: '2026-06-02T00:00:00.000Z',
    decidedAt: null,
  },
  {
    id: 'cinv-003',
    workerId: 'wrk-con-002',
    workerName: 'Sana Khalid',
    period: '2026-06',
    amount: 18000000,
    currency: 'INR',
    withholdingPct: 0,
    netPayable: 18000000,
    status: 'APPROVED',
    payoutRef: null,
    submittedAt: '2026-06-01T00:00:00.000Z',
    decidedAt: '2026-06-03T00:00:00.000Z',
  },
];

let invoiceCounter = 100;

function withholdingNet(amount: number, withholdingPct: number): number {
  return amount - Math.round((amount * withholdingPct) / 100);
}

/** Consolidate worker monthly cost into the base currency, grouped by a dimension. */
function buildCostSummary(groupBy: CostGroupBy): CostSummary {
  const keyOf = (w: Worker) =>
    groupBy === 'entity'
      ? w.legalEntityName
      : groupBy === 'currency'
        ? w.currency
        : w.classification;

  const map = new Map<string, CostSummaryGroup>();
  let totalBaseCost = 0;
  for (const w of workers) {
    if (!w.active) continue;
    const base = Math.round(w.monthlyCost * (FX_RATES[w.currency] ?? 1));
    totalBaseCost += base;
    const key = keyOf(w);
    const g = map.get(key) ?? { key, workerCount: 0, baseAmount: 0 };
    g.workerCount += 1;
    g.baseAmount += base;
    map.set(key, g);
  }
  return {
    groupBy,
    baseCurrency: BASE_CURRENCY,
    totalBaseCost,
    totalWorkers: workers.filter((w) => w.active).length,
    groups: [...map.values()].sort((a, b) => b.baseAmount - a.baseAmount),
    fxRates: FX_RATES,
  };
}

export const payrollWorkerHandlers = [
  http.get('/api/payroll/workers', ({ request }) => {
    const classification = new URL(request.url).searchParams.get('classification');
    const data = classification
      ? workers.filter((w) => w.classification === classification)
      : workers;
    return HttpResponse.json({ success: true, data });
  }),

  http.patch('/api/payroll/workers/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { classification?: WorkerClassification };
    const idx = workers.findIndex((w) => w.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Worker not found' } },
        { status: 404 },
      );
    }
    workers = workers.map((w, i) =>
      i === idx ? { ...w, classification: body.classification ?? w.classification } : w,
    );
    return HttpResponse.json({ success: true, data: workers[idx] });
  }),

  http.get('/api/payroll/contractor-invoices', ({ request }) => {
    const url = new URL(request.url);
    const workerId = url.searchParams.get('workerId');
    const status = url.searchParams.get('status');
    let data = invoices;
    if (workerId) data = data.filter((i) => i.workerId === workerId);
    if (status) data = data.filter((i) => i.status === status);
    return HttpResponse.json({ success: true, data });
  }),

  http.post('/api/payroll/contractor-invoices', async ({ request }) => {
    const input = (await request.json()) as ContractorInvoiceInput;
    const worker = workers.find((w) => w.id === input.workerId);
    if (!worker || worker.classification !== 'CONTRACTOR') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'INVALID_WORKER', message: 'Invoices require a contractor worker' },
        },
        { status: 422 },
      );
    }
    const amount = input.amount;
    const withholdingPct = input.withholdingPct ?? 0;
    const created: ContractorInvoice = {
      id: `cinv-${++invoiceCounter}`,
      workerId: worker.id,
      workerName: worker.name,
      period: input.period,
      amount,
      currency: input.currency ?? worker.currency,
      withholdingPct,
      netPayable: withholdingNet(amount, withholdingPct),
      status: 'SUBMITTED',
      payoutRef: null,
      submittedAt: new Date().toISOString(),
      decidedAt: null,
    };
    invoices = [created, ...invoices];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  // Approve or pay an invoice. PAID requires a payout reference (multi-currency payout).
  http.patch('/api/payroll/contractor-invoices/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as {
      status?: ContractorInvoiceStatus;
      payoutRef?: string;
    };
    const idx = invoices.findIndex((i) => i.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 },
      );
    }
    const next: ContractorInvoice = {
      ...invoices[idx],
      status: body.status ?? invoices[idx].status,
      payoutRef:
        body.status === 'PAID' ? (body.payoutRef ?? `PAYOUT/${id}`) : invoices[idx].payoutRef,
      decidedAt:
        body.status && body.status !== 'SUBMITTED'
          ? new Date().toISOString()
          : invoices[idx].decidedAt,
    };
    invoices = invoices.map((i, k) => (k === idx ? next : i));
    return HttpResponse.json({ success: true, data: next });
  }),

  http.get('/api/payroll/cost-summary', ({ request }) => {
    const groupBy = (new URL(request.url).searchParams.get('groupBy') ??
      'classification') as CostGroupBy;
    const valid: CostGroupBy[] = ['entity', 'currency', 'classification'];
    return HttpResponse.json({
      success: true,
      data: buildCostSummary(valid.includes(groupBy) ? groupBy : 'classification'),
    });
  }),
];
