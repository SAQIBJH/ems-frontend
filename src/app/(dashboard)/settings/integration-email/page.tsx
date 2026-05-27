import { MailIcon } from 'lucide-react';
import { Phase2Panel } from '@/modules/settings/components/Phase2Panel';

export const metadata = { title: 'Email Integration — Settings' };

export default function IntegrationEmailPage() {
  return (
    <Phase2Panel
      icon={MailIcon}
      title="Email Integration"
      description="Connect a transactional email provider for outbound notifications — leave decisions, password resets, and digest emails."
      capabilities={[
        'Connect SES, Resend, SendGrid, or any SMTP-compatible provider',
        'Override the sender address and display name per email template',
        'Bounce and complaint webhook handling with automatic suppression',
        'Delivery analytics — sent, opened, bounced per template',
        'Test-send to a specific address before activating',
      ]}
      roadmapNote="Until this is configured, the system sends via the platform's shared mail domain."
    />
  );
}
