import { PageHeader } from '@/shared/layouts/PageHeader';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening."
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <div className="px-6 py-6">
        <div className="rounded-xl border border-subtle bg-surface p-8 text-center">
          <p className="text-sm text-fg-muted">Dashboard content coming in Step 18.</p>
        </div>
      </div>
    </>
  );
}
