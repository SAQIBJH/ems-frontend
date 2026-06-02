import { PageHeader } from '@/shared/layouts/PageHeader';
import { SettingsNav } from '@/modules/settings/components/SettingsNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Settings"
        description="Manage your organisation's configuration."
        breadcrumbs={[{ label: 'Settings' }]}
      />
      {/* Canvas background — content flows naturally; AppShell main handles scroll */}
      <div className="flex-1 bg-canvas p-6">
        <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
          {/* Nav card */}
          <aside className="rounded-xl border border-subtle bg-surface overflow-hidden">
            <SettingsNav />
          </aside>
          {/* Content card */}
          <div className="rounded-xl border border-subtle bg-surface p-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
