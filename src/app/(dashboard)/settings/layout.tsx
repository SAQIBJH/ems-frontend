import { PageHeader } from '@/shared/layouts/PageHeader';
import { SettingsNav } from '@/modules/settings/components/SettingsNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      <PageHeader
        title="Settings"
        description="Manage your organisation's configuration."
        breadcrumbs={[{ label: 'Settings' }]}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SettingsNav />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
