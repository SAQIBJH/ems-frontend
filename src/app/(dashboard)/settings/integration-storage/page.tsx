import { PlaceholderPanel } from '@/modules/settings/components/PlaceholderPanel';

export const metadata = { title: 'Storage Integration — Settings' };

export default function IntegrationStoragePage() {
  return (
    <PlaceholderPanel
      title="Storage Integration"
      description="Configure a custom S3-compatible bucket or cloud storage provider for employee documents."
      phase2
    />
  );
}
