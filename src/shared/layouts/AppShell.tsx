'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarOff,
  Calendar,
  Shield,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  User,
  DollarSign,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import { GlobalSearch } from '@/modules/search';
import { NotificationBell } from '@/modules/notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useUIStore } from '@/store/ui.store';
import { useAuth } from '@/providers';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/* ── Nav definition ──────────────────────────────────────────────────────── */

type NavItem = {
  kind: 'item';
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavDivider = {
  kind: 'divider';
  label: string;
};

type NavEntry = NavItem | NavDivider;

const NAV_ITEMS: NavEntry[] = [
  { kind: 'item', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { kind: 'item', label: 'Employees', href: '/employees', icon: Users },
  { kind: 'item', label: 'Departments', href: '/departments', icon: Building2 },
  { kind: 'item', label: 'Attendance', href: '/attendance', icon: Clock },
  { kind: 'item', label: 'Leave', href: '/leave', icon: CalendarOff },
  { kind: 'item', label: 'Holidays', href: '/holidays', icon: Calendar },
  { kind: 'item', label: 'Permissions', href: '/permissions', icon: Shield },
  { kind: 'item', label: 'Settings', href: '/settings', icon: Settings },
  { kind: 'divider', label: 'Phase 2' },
  { kind: 'item', label: 'Payroll', href: '/payroll', icon: DollarSign },
  { kind: 'item', label: 'Reports', href: '/reports', icon: BarChart2 },
  { kind: 'item', label: 'Analytics', href: '/analytics', icon: TrendingUp },
];

/* ── NavItem ─────────────────────────────────────────────────────────────── */

function NavItemLink({
  item,
  collapsed,
  onNavClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

  return (
    <Link
      href={item.href}
      onClick={onNavClick}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center rounded-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive ? 'bg-brand-50 text-brand' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        collapsed ? 'justify-center' : 'gap-3',
      )}
      style={{
        font: '500 14px/20px var(--font-sans)',
        padding: collapsed ? 10 : '8px 12px',
        borderRadius: 8,
        transition: 'background-color 120ms, color 120ms',
      }}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

/* ── SidebarDivider ──────────────────────────────────────────────────────── */

function SidebarDivider({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 4px' }} />;
  }
  return (
    <div
      style={{
        font: '500 10px/14px var(--font-sans)',
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: '14px 12px 4px',
      }}
    >
      {label}
    </div>
  );
}

/* ── SidebarContent ──────────────────────────────────────────────────────── */

function SidebarContent({
  collapsed,
  onToggle,
  onNavClick,
  showToggle = true,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
  showToggle?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid var(--border-subtle)',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <span style={{ font: '700 18px/24px var(--font-sans)', color: 'var(--brand-500)' }}>
            E
          </span>
        ) : (
          <span
            style={{
              font: '700 16px/22px var(--font-sans)',
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ color: 'var(--brand-500)' }}>E</span>MS
          </span>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{ padding: collapsed ? '12px 8px' : '12px' }}
        aria-label="Main navigation"
      >
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((entry, i) => {
            if (entry.kind === 'divider') {
              return (
                <SidebarDivider key={`divider-${i}`} label={entry.label} collapsed={collapsed} />
              );
            }
            return (
              <NavItemLink
                key={entry.href}
                item={entry}
                collapsed={collapsed}
                onNavClick={onNavClick}
              />
            );
          })}
        </div>
      </nav>

      {/* Collapse toggle — desktop only */}
      {showToggle && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: 12, flexShrink: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              'w-full text-fg-muted hover:text-fg hover:bg-surface-2',
              collapsed ? 'justify-center px-0' : 'justify-start gap-2',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <>
                <ChevronLeft className="size-4" aria-hidden />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── UserMenu ────────────────────────────────────────────────────────────── */

function UserMenu() {
  const { user } = useAuth();
  const { push } = useRouter();
  const queryClient = useQueryClient();

  const initials = user
    ? user.employee
      ? `${user.employee.firstName[0]}${user.employee.lastName[0]}`.toUpperCase()
      : user.email[0].toUpperCase()
    : '?';

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      /* best effort — server clears the httpOnly cookie even on network errors */
    }
    queryClient.clear();
    window.location.href = '/login';
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring hover:ring-2 hover:ring-ring/30 transition-shadow"
        aria-label="Open user menu"
      >
        <Avatar className="size-8 pointer-events-none">
          <AvatarImage src={undefined} alt={user?.employee?.firstName ?? user?.email} />
          <AvatarFallback className="text-xs bg-brand text-on-primary">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {user && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-fg">
                  {user.employee
                    ? `${user.employee.firstName} ${user.employee.lastName}`
                    : user.email}
                </span>
                <span className="text-xs text-fg-muted truncate">{user.email}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" onClick={() => push('/settings')}>
            <User className="mr-2 h-4 w-4" aria-hidden />
            Profile &amp; settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── ThemeToggle ─────────────────────────────────────────────────────────── */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-fg-muted"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
    </Button>
  );
}

/* ── Topbar ──────────────────────────────────────────────────────────────── */

function Topbar({ onMobileMenuClick }: { onMobileMenuClick: () => void }) {
  return (
    <header className="h-16 shrink-0 flex items-center gap-3 border-b border-subtle bg-surface/80 backdrop-blur-sm px-4 z-40">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-fg-muted"
        onClick={onMobileMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden />
      </Button>

      {/* Global search */}
      <div className="flex-1 flex justify-center px-4">
        <GlobalSearch />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

/* ── AppShell ────────────────────────────────────────────────────────────── */

export function AppShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Skip link — visible on focus for keyboard/AT users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-subtle focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-fg focus:shadow-md"
      >
        Skip to main content
      </a>
      <div className="flex h-screen bg-canvas overflow-hidden">
        {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col shrink-0 h-screen overflow-hidden"
          style={{
            width: sidebarCollapsed ? 64 : 240,
            transition: 'width 180ms var(--ease-out)',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
          }}
        >
          <SidebarContent collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </aside>

        {/* ── Mobile sidebar Sheet ─────────────────────────────────────────── */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-60 bg-surface border-r border-subtle">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onNavClick={() => setMobileOpen(false)}
              showToggle={false}
            />
          </SheetContent>
        </Sheet>

        {/* ── Main area ────────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar onMobileMenuClick={() => setMobileOpen(true)} />
          <main id="main-content" className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
