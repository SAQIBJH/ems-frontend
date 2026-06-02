import { PageHeader } from '@/shared/layouts/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';

export default function AnnouncementsPage() {
  return (
    <>
      <PageHeader title="Announcements" />
      <div className="p-6">
        <EmptyState title="Announcements" description="Building in a later step." />
      </div>
    </>
  );
}
