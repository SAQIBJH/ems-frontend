import { PageHeader } from '@/shared/layouts/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';

export default function RecruitmentPage() {
  return (
    <>
      <PageHeader title="Recruitment" />
      <div className="p-6">
        <EmptyState title="Recruitment" description="Building in a later step." />
      </div>
    </>
  );
}
