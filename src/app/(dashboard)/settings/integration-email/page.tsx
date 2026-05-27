import { PlaceholderPanel } from '@/modules/settings/components/PlaceholderPanel';

export const metadata = { title: 'Email Integration — Settings' };

export default function IntegrationEmailPage() {
  return (
    <PlaceholderPanel
      title="Email Integration"
      description="Connect a custom SMTP provider or transactional email service (SendGrid, Resend) for outbound notifications."
      phase2
    />
  );
}
