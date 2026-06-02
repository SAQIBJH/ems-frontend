import { PageHeader } from '@/shared/layouts/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';

export default function AssetsPage() {
  return (
    <>
      <PageHeader title="Assets" />
      <div className="p-6">
        <EmptyState title="Assets" description="Building in a later step." />
      </div>
    </>
  );
}
