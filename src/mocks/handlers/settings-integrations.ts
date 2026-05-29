import { http, HttpResponse } from 'msw';

import type {
  EmailDeliveryStats,
  EmailIntegration,
  EmailIntegrationUpdateInput,
  RetentionPolicy,
  StorageIntegration,
  StorageIntegrationUpdateInput,
  VirusScanConfig,
  Webhook,
  WebhookCreateInput,
  WebhookDelivery,
  WebhookEvent,
  WebhookUpdateInput,
} from '@/modules/settings/types/settings.types';

// ── Static fixtures ───────────────────────────────────────────────────────────

const emailDeliveryStats: EmailDeliveryStats = {
  sent: 247,
  delivered: 241,
  opened: 183,
  bounced: 6,
  complained: 1,
  deliveryRate: 97.6,
  openRate: 75.9,
  period: 'last_30_days',
};

// ── In-memory state ──────────────────────────────────────────────────────────

let emailIntegration: EmailIntegration = {
  provider: 'resend',
  fromAddress: 'noreply@acme.com',
  fromName: 'Acme HR',
  status: 'connected',
  lastTestedAt: '2026-05-20T14:32:00.000Z',
  config: {
    apiKey: '••••••••4f2a',
    region: null,
    accessKeyId: null,
    host: null,
    port: null,
    username: null,
    encryption: null,
  },
};

let storageIntegration: StorageIntegration = {
  provider: null,
  status: 'unconfigured',
  lastTestedAt: null,
  config: {
    bucket: null,
    region: null,
    accessKeyId: null,
    projectId: null,
    accountName: null,
    containerName: null,
    versioningEnabled: false,
    presignedUrlTtlSeconds: 3600,
  },
  retentionPolicies: [
    { documentType: 'EMPLOYEE_RECORD', retentionDays: 2555, autoDeletionEnabled: false },
    { documentType: 'PAYSLIP', retentionDays: 2555, autoDeletionEnabled: false },
    { documentType: 'CONTRACT', retentionDays: 2555, autoDeletionEnabled: false },
    { documentType: 'ID_PROOF', retentionDays: 730, autoDeletionEnabled: false },
    { documentType: 'OTHER', retentionDays: 365, autoDeletionEnabled: false },
  ],
  virusScan: { enabled: false, provider: null, webhookUrl: null },
};

let webhooks: Webhook[] = [
  {
    id: 'wh_01',
    url: 'https://hooks.example.com/ems',
    description: 'Slack notifications',
    events: ['EMPLOYEE_CREATED', 'LEAVE_APPROVED'] as WebhookEvent[],
    status: 'active',
    secret: '••••••••a3f9',
    lastDelivery: {
      timestamp: '2026-05-20T14:32:00.000Z',
      statusCode: 200,
      success: true,
      durationMs: 87,
    },
    createdAt: '2026-04-10T09:00:00.000Z',
  },
];

const deliveriesStore: Record<string, WebhookDelivery[]> = {
  wh_01: [
    {
      id: 'del_01',
      webhookId: 'wh_01',
      event: 'LEAVE_APPROVED',
      url: 'https://hooks.example.com/ems',
      requestBody: '{"event":"LEAVE_APPROVED","data":{"employeeId":"emp_01"}}',
      responseStatus: 200,
      responseBody: '{"ok":true}',
      durationMs: 87,
      success: true,
      timestamp: '2026-05-20T14:32:00.000Z',
    },
    {
      id: 'del_02',
      webhookId: 'wh_01',
      event: 'EMPLOYEE_CREATED',
      url: 'https://hooks.example.com/ems',
      requestBody: '{"event":"EMPLOYEE_CREATED","data":{"employeeId":"emp_42"}}',
      responseStatus: 200,
      responseBody: '{"ok":true}',
      durationMs: 112,
      success: true,
      timestamp: '2026-05-19T10:15:00.000Z',
    },
    {
      id: 'del_03',
      webhookId: 'wh_01',
      event: 'LEAVE_REJECTED',
      url: 'https://hooks.example.com/ems',
      requestBody: '{"event":"LEAVE_REJECTED","data":{"employeeId":"emp_07"}}',
      responseStatus: 503,
      responseBody: 'Service Unavailable',
      durationMs: 5002,
      success: false,
      timestamp: '2026-05-18T08:00:00.000Z',
    },
  ],
};

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateSecret() {
  return `whsec_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function redactSecret(value: string | undefined | null): string | null {
  if (!value) return null;
  if (value.startsWith('•')) return value; // already redacted
  const last4 = value.slice(-4);
  return `••••••••${last4}`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Handlers ──────────────────────────────────────────────────────────────────

export const settingsIntegrationHandlers = [
  // GET /settings/integrations/email/stats
  http.get('/api/settings/integrations/email/stats', () => {
    return HttpResponse.json({ success: true, data: emailDeliveryStats });
  }),

  // GET /settings/integrations/email
  http.get('/api/settings/integrations/email', () => {
    return HttpResponse.json({ success: true, data: emailIntegration });
  }),

  // PATCH /settings/integrations/email
  http.patch('/api/settings/integrations/email', async ({ request }) => {
    const body = (await request.json()) as EmailIntegrationUpdateInput;

    const updatedConfig = { ...emailIntegration.config };

    if (body.config) {
      const c = body.config as Record<string, string | number | null | undefined>;
      if ('apiKey' in c) updatedConfig.apiKey = redactSecret(c.apiKey as string | undefined);
      if ('accessKeyId' in c) updatedConfig.accessKeyId = c.accessKeyId as string | null;
      if ('secretAccessKey' in c)
        updatedConfig.apiKey = redactSecret(c.secretAccessKey as string | undefined);
      if ('region' in c) updatedConfig.region = c.region as string | null;
      if ('host' in c) updatedConfig.host = c.host as string | null;
      if ('port' in c) updatedConfig.port = c.port as number | null;
      if ('username' in c) updatedConfig.username = c.username as string | null;
      if ('password' in c) updatedConfig.apiKey = redactSecret(c.password as string | undefined);
      if ('encryption' in c)
        updatedConfig.encryption = c.encryption as EmailIntegration['config']['encryption'];
    }

    emailIntegration = {
      ...emailIntegration,
      provider: body.provider ?? emailIntegration.provider,
      fromAddress: body.fromAddress ?? emailIntegration.fromAddress,
      fromName: body.fromName ?? emailIntegration.fromName,
      status: 'connected',
      config: updatedConfig,
    };

    return HttpResponse.json({ success: true, data: emailIntegration });
  }),

  // POST /settings/integrations/email/test
  http.post('/api/settings/integrations/email/test', async ({ request }) => {
    const body = (await request.json()) as { to: string };

    if (!body.to || !EMAIL_REGEX.test(body.to)) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email address' } },
        { status: 422 },
      );
    }

    if (!emailIntegration.provider) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMAIL_NOT_CONFIGURED', message: 'No email provider configured' },
        },
        { status: 400 },
      );
    }

    emailIntegration = { ...emailIntegration, lastTestedAt: new Date().toISOString() };

    return HttpResponse.json({
      success: true,
      data: { messageId: 'msg_mock_01', sentAt: new Date().toISOString() },
    });
  }),

  // GET /settings/integrations/storage
  http.get('/api/settings/integrations/storage', () => {
    return HttpResponse.json({ success: true, data: storageIntegration });
  }),

  // PATCH /settings/integrations/storage
  http.patch('/api/settings/integrations/storage', async ({ request }) => {
    const body = (await request.json()) as StorageIntegrationUpdateInput;

    const updatedConfig = { ...storageIntegration.config };

    if (body.config) {
      const c = body.config as Record<string, unknown>;
      if ('bucket' in c) updatedConfig.bucket = c.bucket as string | null;
      if ('region' in c) updatedConfig.region = c.region as string | null;
      if ('accessKeyId' in c) updatedConfig.accessKeyId = c.accessKeyId as string | null;
      if ('secretAccessKey' in c) updatedConfig.accessKeyId = updatedConfig.accessKeyId; // redact — don't store plaintext
      if ('projectId' in c) updatedConfig.projectId = c.projectId as string | null;
      if ('accountName' in c) updatedConfig.accountName = c.accountName as string | null;
      if ('containerName' in c) updatedConfig.containerName = c.containerName as string | null;
      if ('versioningEnabled' in c)
        updatedConfig.versioningEnabled = c.versioningEnabled as boolean;
      if ('presignedUrlTtlSeconds' in c)
        updatedConfig.presignedUrlTtlSeconds = c.presignedUrlTtlSeconds as number;
    }

    // Merge retention policies (only supplied types updated)
    const updatedPolicies = [...storageIntegration.retentionPolicies];
    if (body.retentionPolicies) {
      for (const patch of body.retentionPolicies) {
        const idx = updatedPolicies.findIndex((p) => p.documentType === patch.documentType);
        if (idx >= 0) {
          updatedPolicies[idx] = { ...updatedPolicies[idx], ...patch } as RetentionPolicy;
        }
      }
    }

    // Merge virus scan config
    const updatedVirusScan: VirusScanConfig = body.virusScan
      ? { ...storageIntegration.virusScan, ...body.virusScan }
      : storageIntegration.virusScan;

    storageIntegration = {
      ...storageIntegration,
      provider: body.provider ?? storageIntegration.provider,
      status: 'connected',
      config: updatedConfig,
      retentionPolicies: updatedPolicies,
      virusScan: updatedVirusScan,
    };

    return HttpResponse.json({ success: true, data: storageIntegration });
  }),

  // POST /settings/integrations/storage/test
  http.post('/api/settings/integrations/storage/test', () => {
    if (!storageIntegration.provider) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'STORAGE_NOT_CONFIGURED', message: 'No storage provider configured' },
        },
        { status: 400 },
      );
    }

    storageIntegration = { ...storageIntegration, lastTestedAt: new Date().toISOString() };

    return HttpResponse.json({
      success: true,
      data: {
        provider: storageIntegration.provider,
        bucket: storageIntegration.config.bucket ?? '',
        latencyMs: Math.floor(Math.random() * 200) + 80,
      },
    });
  }),

  // GET /settings/webhooks
  http.get('/api/settings/webhooks', () => {
    return HttpResponse.json({ success: true, data: webhooks });
  }),

  // POST /settings/webhooks
  http.post('/api/settings/webhooks', async ({ request }) => {
    const body = (await request.json()) as WebhookCreateInput;

    if (!body.url?.startsWith('https://')) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'URL must use HTTPS' } },
        { status: 422 },
      );
    }
    if (!body.events || body.events.length === 0) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Select at least one event' },
        },
        { status: 422 },
      );
    }

    const secret = generateSecret();
    const newWebhook: Webhook = {
      id: generateId('wh'),
      url: body.url,
      description: body.description ?? null,
      events: body.events,
      status: body.active ? 'active' : 'disabled',
      secret,
      lastDelivery: null,
      createdAt: new Date().toISOString(),
    };

    webhooks = [...webhooks, newWebhook];
    deliveriesStore[newWebhook.id] = [];

    return HttpResponse.json({ success: true, data: newWebhook }, { status: 201 });
  }),

  // PATCH /settings/webhooks/:id
  http.patch('/api/settings/webhooks/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as WebhookUpdateInput;
    const idx = webhooks.findIndex((w) => w.id === id);

    if (idx < 0) {
      return HttpResponse.json(
        { success: false, error: { code: 'WEBHOOK_NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 },
      );
    }

    webhooks[idx] = {
      ...webhooks[idx],
      ...(body.url !== undefined && { url: body.url }),
      ...(body.events !== undefined && { events: body.events }),
      ...(body.description !== undefined && { description: body.description ?? null }),
      ...(body.active !== undefined && { status: body.active ? 'active' : 'disabled' }),
    };

    return HttpResponse.json({ success: true, data: webhooks[idx] });
  }),

  // DELETE /settings/webhooks/:id
  http.delete('/api/settings/webhooks/:id', ({ params }) => {
    const { id } = params as { id: string };
    const idx = webhooks.findIndex((w) => w.id === id);

    if (idx < 0) {
      return HttpResponse.json(
        { success: false, error: { code: 'WEBHOOK_NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 },
      );
    }

    webhooks = webhooks.filter((w) => w.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /settings/webhooks/:id/deliveries
  http.get('/api/settings/webhooks/:id/deliveries', ({ params, request }) => {
    const { id } = params as { id: string };
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '20');

    const all = deliveriesStore[id] ?? [];
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: {
        deliveries: items,
        pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) },
      },
    });
  }),

  // POST /settings/webhooks/:id/test
  http.post('/api/settings/webhooks/:id/test', ({ params }) => {
    const { id } = params as { id: string };
    const wh = webhooks.find((w) => w.id === id);

    if (!wh) {
      return HttpResponse.json(
        { success: false, error: { code: 'WEBHOOK_NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 },
      );
    }

    const durationMs = Math.floor(Math.random() * 200) + 60;
    const delivery: WebhookDelivery = {
      id: generateId('del'),
      webhookId: id,
      event: 'PING',
      url: wh.url,
      requestBody: '{"event":"PING"}',
      responseStatus: 200,
      responseBody: '{"ok":true}',
      durationMs,
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (!deliveriesStore[id]) deliveriesStore[id] = [];
    deliveriesStore[id] = [delivery, ...deliveriesStore[id]];

    // Update lastDelivery on the webhook
    const idx = webhooks.findIndex((w) => w.id === id);
    if (idx >= 0) {
      webhooks[idx] = {
        ...webhooks[idx],
        lastDelivery: {
          timestamp: delivery.timestamp,
          statusCode: 200,
          success: true,
          durationMs,
        },
      };
    }

    return HttpResponse.json({
      success: true,
      data: {
        delivery: {
          id: delivery.id,
          event: delivery.event,
          responseStatus: 200,
          success: true,
          durationMs,
          timestamp: delivery.timestamp,
        },
      },
    });
  }),
];
