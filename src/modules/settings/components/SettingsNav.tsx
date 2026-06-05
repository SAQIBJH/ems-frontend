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
        label: 'Legal Entities',
        slug: 'pay/legal-entities',
        icon: BuildingIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Salary Components',
        slug: 'pay/components',
        icon: CircleDollarSignIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Pay Groups',
        slug: 'pay/groups',
        icon: UsersIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Pay Schedules',
        slug: 'pay/schedules',
        icon: CalendarClockIcon,
        roles: ['HR_ADMIN', 'SUPER_ADMIN'],
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
      },
      {
        label: 'Storage',
        slug: 'integration-storage',
        icon: PlugIcon,
        roles: ['SUPER_ADMIN'],
      },
      {
        label: 'Webhooks',
        slug: 'integration-webhooks',
        icon: PlugIcon,
        roles: ['SUPER_ADMIN'],
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
      },
      {
        label: 'Invoices',
        slug: 'billing-invoices',
        icon: ReceiptIcon,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.memberType ?? '';

  return (
    <aside className="overflow-y-auto h-[80vh]">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(role));
        if (visibleItems.length === 0) return null;

        return (
          <div key={group.label} className="px-2 pb-2">
            <p className="px-3 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-[0.05em] text-fg-subtle">
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
                      'flex items-center gap-[10px] rounded-lg px-3 py-[7px] text-[13px] transition-[background,color] duration-[120ms]',
                      isActive
                        ? 'bg-brand-50 font-medium text-brand'
                        : 'font-normal text-fg-muted hover:bg-surface-raised hover:text-fg',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
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
