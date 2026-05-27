import { PlaceholderPanel } from '@/modules/settings/components/PlaceholderPanel';

export const metadata = { title: 'Authentication — Settings' };

export default function AuthenticationPage() {
  return (
    <PlaceholderPanel
      title="Authentication"
      description="Configure MFA requirements, password policies, and SSO integrations for your organisation."
    />
  );
}
