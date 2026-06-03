import { http, HttpResponse } from 'msw';
import type {
  AssetsSummary,
  AssetsPage,
  Asset,
  AssetType,
  AssetStatus,
  RequestsPage,
  AssetRequest,
  RequestStatus,
} from '@/modules/assets/types/assets.types';

const BASE = '/api/assets';

// ── Fixture data ─────────────────────────────────────────────────────────────

const SUMMARY: AssetsSummary = {
  totalAssets: 248,
  assigned: 201,
  available: 38,
  inRepair: 9,
  utilizationPct: 81,
  avgRepairDays: 6,
};

let ASSETS: Asset[] = [
  {
    id: 'asset_1',
    tag: 'LAP-0192',
    name: 'MacBook Pro 14" M3',
    type: 'Laptop',
    status: 'Assigned',
    assignedTo: { employeeId: 'emp_1', name: 'Priya Sharma' },
    assignedSince: '2025-01-15',
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'asset_2',
    tag: 'LAP-0188',
    name: 'MacBook Air 13" M2',
    type: 'Laptop',
    status: 'Assigned',
    assignedTo: { employeeId: 'emp_2', name: 'Rohan Mehta' },
    assignedSince: '2024-11-01',
    createdAt: '2024-10-28T00:00:00Z',
  },
  {
    id: 'asset_3',
    tag: 'MON-0451',
    name: 'Dell U2723QE 27"',
    type: 'Monitor',
    status: 'Assigned',
    assignedTo: { employeeId: 'emp_4', name: 'Vikram Singh' },
    assignedSince: '2025-03-01',
    createdAt: '2025-02-25T00:00:00Z',
  },
  {
    id: 'asset_4',
    tag: 'LAP-0205',
    name: 'ThinkPad X1 Carbon',
    type: 'Laptop',
    status: 'Available',
    assignedTo: null,
    assignedSince: null,
    createdAt: '2025-04-01T00:00:00Z',
  },
  {
    id: 'asset_5',
    tag: 'PHN-0077',
    name: 'iPhone 15 Pro',
    type: 'Phone',
    status: 'Assigned',
    assignedTo: { employeeId: 'emp_8', name: 'Sneha Rao' },
    assignedSince: '2025-02-10',
    createdAt: '2025-02-05T00:00:00Z',
  },
  {
    id: 'asset_6',
    tag: 'MON-0460',
    name: 'LG 32UN880 32"',
    type: 'Monitor',
    status: 'Repair',
    assignedTo: null,
    assignedSince: null,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'asset_7',
    tag: 'LAP-0150',
    name: 'MacBook Pro 16" M1',
    type: 'Laptop',
    status: 'Retired',
    assignedTo: null,
    assignedSince: null,
    createdAt: '2023-06-01T00:00:00Z',
  },
  {
    id: 'asset_8',
    tag: 'PHN-0070',
    name: 'Pixel 8',
    type: 'Phone',
    status: 'Available',
    assignedTo: null,
    assignedSince: null,
    createdAt: '2025-01-20T00:00:00Z',
  },
];

const REQUESTS: AssetRequest[] = [
  {
    id: 'req_1',
    requestedBy: { employeeId: 'emp_3', name: 'Nisha Iyer' },
    item: 'Monitor — 27" 4K',
    reason: 'New hire setup',
    requestedAt: '2026-05-27',
    status: 'Pending',
  },
  {
    id: 'req_2',
    requestedBy: { employeeId: 'emp_7', name: 'Karan Mehra' },
    item: 'Laptop — MacBook Pro 14"',
    reason: 'Device end-of-life',
    requestedAt: '2026-05-26',
    status: 'Pending',
  },
  {
    id: 'req_3',
    requestedBy: { employeeId: 'emp_5', name: 'Asha Joshi' },
    item: 'Phone — iPhone 15',
    reason: 'Field role',
    requestedAt: '2026-05-24',
    status: 'Approved',
  },
  {
    id: 'req_4',
    requestedBy: { employeeId: 'emp_6', name: 'Devansh Patel' },
    item: 'Dock — Thunderbolt 4',
    reason: 'Desk upgrade',
    requestedAt: '2026-05-22',
    status: 'Fulfilled',
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export const assetsHandlers = [
  // GET /assets/summary
  http.get(`${BASE}/summary`, () => {
    return HttpResponse.json({ success: true, data: SUMMARY });
  }),

  // GET /assets
  http.get(`${BASE}`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as AssetType | null;
    const status = url.searchParams.get('status') as AssetStatus | null;

    let filtered = ASSETS;
    if (type) filtered = filtered.filter((a) => a.type === type);
    if (status) filtered = filtered.filter((a) => a.status === status);

    const response: AssetsPage = {
      assets: filtered,
      pagination: { page: 1, limit: 20, total: filtered.length, totalPages: 1 },
    };
    return HttpResponse.json({ success: true, data: response });
  }),

  // GET /assets/requests
  http.get(`${BASE}/requests`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as RequestStatus | null;

    const filtered = status ? REQUESTS.filter((r) => r.status === status) : REQUESTS;

    const response: RequestsPage = {
      requests: filtered,
      pagination: { page: 1, limit: 20, total: filtered.length, totalPages: 1 },
    };
    return HttpResponse.json({ success: true, data: response });
  }),

  // PATCH /assets/requests/:id/approve
  http.patch(`${BASE}/requests/:id/approve`, ({ params }) => {
    const { id } = params as { id: string };
    const req = REQUESTS.find((r) => r.id === id);

    if (!req) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } },
        { status: 404 },
      );
    }
    if (req.status !== 'Pending') {
      return HttpResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Request is not pending' } },
        { status: 409 },
      );
    }

    req.status = 'Approved';
    return HttpResponse.json({ success: true, data: { id: req.id, status: req.status } });
  }),

  // PATCH /assets/requests/:id/decline
  http.patch(`${BASE}/requests/:id/decline`, ({ params }) => {
    const { id } = params as { id: string };
    const req = REQUESTS.find((r) => r.id === id);

    if (!req) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } },
        { status: 404 },
      );
    }
    if (req.status !== 'Pending') {
      return HttpResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Request is not pending' } },
        { status: 409 },
      );
    }

    req.status = 'Declined';
    return HttpResponse.json({ success: true, data: { id: req.id, status: req.status } });
  }),

  // POST /assets
  http.post(`${BASE}`, async ({ request }) => {
    const body = (await request.json()) as { tag: string; name: string; type: AssetType };

    if (!body.tag || !body.name || !body.type) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 422 },
      );
    }

    if (ASSETS.some((a) => a.tag === body.tag)) {
      return HttpResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Asset tag already exists' } },
        { status: 409 },
      );
    }

    const newAsset: Asset = {
      id: `asset_${Date.now()}`,
      tag: body.tag,
      name: body.name,
      type: body.type,
      status: 'Available',
      assignedTo: null,
      assignedSince: null,
      createdAt: new Date().toISOString(),
    };

    ASSETS = [newAsset, ...ASSETS];
    return HttpResponse.json({ success: true, data: newAsset }, { status: 201 });
  }),
];
