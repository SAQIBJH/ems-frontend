'use client';

import { useState } from 'react';
import { BuildingIcon, MailIcon, ShieldIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';
import { CompanyProfilePanel } from './CompanyProfilePanel';
import { EmailTemplatesPanel } from './EmailTemplatesPanel';

type SettingsSection = 'company-profile' | 'email-templates';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'company-profile',
    label: 'Company Profile',
    icon: BuildingIcon,
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'email-templates',
    label: 'Email Templates',
    icon: MailIcon,
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
  },
];

export function SettingsScreen() {
  const { user } = useAuth();
  const [active, setActive] = useState<SettingsSection>('company-profile');

  const visibleNav = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.memberType));

  return (
    <div className="flex flex-col min-h-0">
      <PageHeader
        title="Settings"
        description="Manage your organisation's configuration."
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <div className="flex flex-1 min-h-0">
        {/* Left nav */}
        <aside className="w-52 shrink-0 border-r border-subtle bg-surface-raised/40 p-3 space-y-0.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left',
                  active === item.id
                    ? 'bg-brand/10 text-brand'
                    : 'text-fg-subtle hover:bg-surface-raised hover:text-fg',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </button>
            );
          })}

          {user?.memberType === 'SUPER_ADMIN' && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-xs font-medium text-fg-disabled uppercase tracking-wide">
                  Admin
                </p>
              </div>
              <a
                href="/permissions"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left text-fg-subtle hover:bg-surface-raised hover:text-fg"
              >
                <ShieldIcon className="size-4 shrink-0" />
                Permissions
              </a>
            </>
          )}
        </aside>

        {/* Content panel */}
        <main className="flex-1 overflow-auto p-6">
          {active === 'company-profile' && <CompanyProfilePanel />}
          {active === 'email-templates' && <EmailTemplatesPanel />}
        </main>
      </div>
    </div>
  );
}
