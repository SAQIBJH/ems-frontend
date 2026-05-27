'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BuildingIcon,
  PaletteIcon,
  GlobeIcon,
  ClockIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  ShieldIcon,
  MonitorIcon,
  FileTextIcon,
  MailIcon,
  BellIcon,
  PlugIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  ReceiptIcon,
  CircleDollarSignIcon,
  UsersIcon,
  CalendarClockIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers';

const ALL_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE', 'AUDITOR'];

interface NavItem {
  label: string;
  icon: React.ElementType;
  slug?: string;
  href?: string;
  roles?: string[];
  phase2?: boolean;
  external?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      {
        label: 'Company Profile',
        slug: 'company-profile',
        icon: BuildingIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Branding',
        slug: 'branding',
        icon: PaletteIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        label: 'Locale & Timezone',
        slug: 'locale',
        icon: GlobeIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Working Hours',
        slug: 'working-hours',
        icon: ClockIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        label: 'Leave Types',
        slug: 'leave-types',
        icon: CalendarIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Holiday Calendar',
        href: '/holidays',
        icon: CalendarDaysIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
        external: true,
      },
      {
        label: 'Attendance Rules',
        slug: 'attendance-rules',
        icon: ClipboardListIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
  {
    label: 'Pay & Compliance',
    items: [
      {
        label: 'Salary Components',
        slug: 'pay/components',
        icon: CircleDollarSignIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
        phase2: true,
      },
      {
        label: 'Pay Groups',
        slug: 'pay/groups',
        icon: UsersIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
        phase2: true,
      },
      {
        label: 'Pay Schedules',
        slug: 'pay/schedules',
        icon: CalendarClockIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
        phase2: true,
      },
    ],
  },
  {
    label: 'Security',
    items: [
      {
        label: 'Authentication',
        slug: 'authentication',
        icon: ShieldIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        label: 'Sessions & Devices',
        slug: 'sessions',
        icon: MonitorIcon,
        roles: ALL_ROLES,
      },
      {
        label: 'Audit Log',
        slug: 'audit-log',
        icon: FileTextIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
  {
    label: 'Notifications',
    items: [
      {
        label: 'Email Templates',
        slug: 'email-templates',
        icon: MailIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'In-app Preferences',
        slug: 'notifications',
        icon: BellIcon,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    label: 'Integrations',
    items: [
      {
        label: 'Email',
        slug: 'integration-email',
        icon: PlugIcon,
        roles: ['SUPER_ADMIN'],
        phase2: true,
      },
      {
        label: 'Storage',
        slug: 'integration-storage',
        icon: PlugIcon,
        roles: ['SUPER_ADMIN'],
        phase2: true,
      },
      {
        label: 'Webhooks',
        slug: 'integration-webhooks',
        icon: PlugIcon,
        roles: ['SUPER_ADMIN'],
        phase2: true,
      },
    ],
  },
  {
    label: 'Billing',
    items: [
      {
        label: 'Plan',
        slug: 'billing-plan',
        icon: CreditCardIcon,
        roles: ['SUPER_ADMIN'],
        phase2: true,
      },
      {
        label: 'Invoices',
        slug: 'billing-invoices',
        icon: ReceiptIcon,
        roles: ['SUPER_ADMIN'],
        phase2: true,
      },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.memberType ?? '';

  return (
    <aside className="w-52 shrink-0 border-r border-subtle bg-surface-raised/40 overflow-y-auto p-3 space-y-4">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(role));
        if (visibleItems.length === 0) return null;

        return (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[0.625rem] font-semibold uppercase tracking-widest text-fg-disabled">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const href = item.href ?? `/settings/${item.slug ?? ''}`;
                const isActive = !item.external && pathname === href;

                return (
                  <Link
                    key={item.slug ?? item.href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                      isActive
                        ? 'bg-brand/10 text-brand'
                        : 'text-fg-subtle hover:bg-surface-raised hover:text-fg',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.external && (
                      <ExternalLinkIcon className="size-3 text-fg-disabled shrink-0" />
                    )}
                    {item.phase2 && (
                      <span className="text-[0.6rem] font-semibold px-1 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 leading-none">
                        P2
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
