import { WebhookIcon } from 'lucide-react';
import { Phase2Panel } from '@/modules/settings/components/Phase2Panel';

export const metadata = { title: 'Webhooks — Settings' };

export default function IntegrationWebhooksPage() {
  return (
    <Phase2Panel
      icon={WebhookIcon}
      title="Webhooks"
      description="Push real-time event notifications to any HTTP endpoint — connect EMS to your HRIS, payroll system, or custom automations."
      capabilities={[
        'Register multiple endpoints with per-event filtering',
        'HMAC-SHA256 signature on every delivery for authenticity verification',
        'Automatic retries with exponential back-off on non-2xx responses',
        'Full delivery log with request/response payloads and replay-on-demand',
        'Events: employee created/updated, leave approved/rejected, attendance regularized',
      ]}
      roadmapNote="Webhook delivery uses an event queue — bursts are smoothed and no events are dropped on transient endpoint failures."
    />
  );
}
