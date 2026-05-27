import { PlaceholderPanel } from '@/modules/settings/components/PlaceholderPanel';

export const metadata = { title: 'Webhooks — Settings' };

export default function IntegrationWebhooksPage() {
  return (
    <PlaceholderPanel
      title="Webhooks"
      description="Register endpoints to receive real-time event notifications for employee changes, leave approvals, and more."
      phase2
    />
  );
}
