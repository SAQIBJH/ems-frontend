import { PageHeader } from '@/shared/layouts/PageHeader';
import { SettingsNav } from '@/modules/settings/components/SettingsNav';
import { SettingsAccessGuard } from '@/modules/settings/components/SettingsAccessGuard';

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
          {/* Nav card — sticky so it stays put while content scrolls */}
          <aside className="sticky top-[88px] self-start overflow-hidden rounded-xl border border-subtle bg-surface">
            <SettingsNav />
          </aside>
          {/* Content card */}
          <div className="rounded-xl border border-subtle bg-surface p-7">
            <SettingsAccessGuard>{children}</SettingsAccessGuard>
          </div>
        </div>
      </div>
    </div>
  );
}
