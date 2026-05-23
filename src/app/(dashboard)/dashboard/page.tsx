import { PageHeader } from '@/shared/layouts/PageHeader';
import { DashboardRouter } from '@/modules/dashboard';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening."
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <DashboardRouter />
    </>
  );
}
