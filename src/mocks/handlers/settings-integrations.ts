import { http, HttpResponse } from 'msw';

import type {
  EmailDeliveryStats,
  EmailIntegration,
  EmailIntegrationUpdateInput,
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
];
