import { HardDriveIcon } from 'lucide-react';
import { Phase2Panel } from '@/modules/settings/components/Phase2Panel';

export const metadata = { title: 'Storage Integration — Settings' };

export default function IntegrationStoragePage() {
  return (
    <Phase2Panel
      icon={HardDriveIcon}
      title="Storage Integration"
      description="Bring your own cloud storage bucket for employee documents, payslips, and assets — with access controls baked in."
      capabilities={[
        'Connect AWS S3, Google Cloud Storage, or Azure Blob Storage',
        'Automatic document versioning with full audit trail',
        'Access-controlled pre-signed URLs — files never exposed publicly',
        'Configurable retention and auto-deletion policies per document type',
        'Virus scan on upload via ClamAV or third-party integration',
      ]}
      roadmapNote="Documents uploaded in Phase 1 are stored on the platform's managed Cloudinary account and can be migrated on Phase 2 launch."
    />
  );
}
