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
      {/* Canvas background — matches design's bg-canvas on .ems-page */}
      <div className="flex-1 overflow-auto bg-canvas p-6">
        <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
          {/* Nav card */}
          <div className="rounded-xl border border-subtle bg-surface overflow-hidden">
            <SettingsNav />
          </div>
          {/* Content card */}
          <div className="rounded-xl border border-subtle bg-surface px-7 pt-1 pb-7 min-h-[600px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
