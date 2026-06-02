import { PageHeader } from '@/shared/layouts/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';

export default function PerformancePage() {
  return (
    <>
      <PageHeader title="Performance" />
      <div className="p-6">
        <EmptyState title="Performance" description="Building in a later step." />
      </div>
    </>
  );
}
