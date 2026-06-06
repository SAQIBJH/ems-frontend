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
  Timer,
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
  UserPlus,
  Star,
  Box,
  Megaphone,
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

type NavItemDef = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavEntry = NavItemDef | { separator: true };

const NAV_ITEMS: NavEntry[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/employees', icon: Users },
  { label: 'Departments', href: '/departments', icon: Building2 },
  { label: 'Attendance', href: '/attendance', icon: Clock },
  { label: 'Timesheets', href: '/timesheets', icon: Timer },
  { label: 'Leave', href: '/leave', icon: CalendarOff },
  { label: 'Holidays', href: '/holidays', icon: Calendar },
  { label: 'Payroll', href: '/payroll', icon: DollarSign },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
  { label: 'Analytics', href: '/analytics', icon: TrendingUp },
  { label: 'Permissions', href: '/permissions', icon: Shield },
  { label: 'Settings', href: '/settings', icon: Settings },
  { separator: true },
  { label: 'Recruitment', href: '/recruitment', icon: UserPlus },
  { label: 'Performance', href: '/performance', icon: Star },
  { label: 'Assets', href: '/assets', icon: Box },
  { label: 'Announcements', href: '/announcements', icon: Megaphone },
];

/* ── NavItem ─────────────────────────────────────────────────────────────── */

function NavItem({
  item,
  collapsed,
  onNavClick,
}: {
  item: NavItemDef;
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

  const linkClasses = cn(
    'flex items-center rounded-lg text-sm font-medium',
    'transition-colors duration-[120ms]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive ? 'bg-brand-50 text-brand' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
    collapsed ? 'justify-center size-10 mx-auto' : 'gap-3 px-3 py-2',
  );

  return (
    <Link
      href={item.href}
      className={linkClasses}
      onClick={onNavClick}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {!collapsed && <span>{item.label}</span>}
    </Link>
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
        className={cn(
          'h-16 flex items-center border-b border-subtle shrink-0',
          collapsed ? 'justify-center px-4' : 'px-5',
        )}
      >
        {collapsed ? (
          <span className="text-lg font-bold text-brand">E</span>
        ) : (
          <span className="text-base font-bold tracking-tight text-fg">
            <span className="text-brand">E</span>MS
          </span>
        )}
      </div>

      {/* Nav */}
      <nav
        className={cn('flex-1 overflow-y-auto py-4 space-y-0.5', collapsed ? 'px-2' : 'px-3')}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((entry, i) => {
          if ('separator' in entry) {
            return (
              <div
                key={`sep-${i}`}
                className={cn('border-t border-subtle', collapsed ? 'mx-1 my-2' : 'mx-0 my-2')}
                role="separator"
              />
            );
          }
          return (
            <NavItem key={entry.href} item={entry} collapsed={collapsed} onNavClick={onNavClick} />
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      {showToggle && (
        <div className="shrink-0 border-t border-subtle p-3">
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
    // Wipe the in-memory query cache, then hard-navigate so the page reloads
    // from scratch. A client-side push() keeps AuthProvider mounted and it
    // would immediately refetch /auth/me, re-authenticating if the cookie is
    // still alive. window.location destroys the entire JS heap and query cache.
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
          className={cn(
            'hidden lg:flex flex-col shrink-0 h-screen border-r border-subtle bg-surface',
            'transition-[width] duration-[180ms] ease-out overflow-hidden',
            sidebarCollapsed ? 'w-16' : 'w-60',
          )}
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
          <main id="main-content" className="flex-1 min-h-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
