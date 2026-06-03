/**
 * AppShell — 240px (or 64px collapsed) sidebar + 64px topbar + scrolling main.
 * Matches src/shared/layouts/AppShell.tsx in the EMS frontend.
 */

const NAV_ITEMS = [
  { key: 'dashboard',     label: 'Dashboard',     icon: 'LayoutDashboard' },
  { key: 'employees',     label: 'Employees',     icon: 'Users' },
  { key: 'departments',   label: 'Departments',   icon: 'Building2' },
  { key: 'attendance',    label: 'Attendance',    icon: 'Clock' },
  { key: 'leave',         label: 'Leave',         icon: 'CalendarOff' },
  { key: 'holidays',      label: 'Holidays',      icon: 'Calendar' },
  { key: 'permissions',   label: 'Permissions',   icon: 'Shield' },
  { key: 'settings',      label: 'Settings',      icon: 'Settings' },
  { divider: 'Phase 2' },
  { key: 'payroll',       label: 'Payroll',       icon: 'Wallet' },
  { key: 'recruitment',   label: 'Recruitment',   icon: 'UserPlus' },
  { key: 'performance',   label: 'Performance',   icon: 'Star' },
  { key: 'assets',        label: 'Assets',        icon: 'Box' },
  { key: 'reports',       label: 'Reports',       icon: 'BarChart2' },
  { key: 'announcements', label: 'Announcements', icon: 'Megaphone' },
];

function NavItem({ item, active, collapsed, onClick }) {
  const Icon = window.Icons[item.icon];
  return (
    <button
      type="button"
      className={window.UI.cx('nav-item', active && 'active')}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
    >
      <Icon />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

function Sidebar({ activeKey, onNavigate, collapsed, onToggleCollapse }) {
  const { ChevronLeft, ChevronRight } = window.Icons;
  return (
    <aside
      className="ems-sidebar"
      style={{ width: collapsed ? 64 : 240, transition: 'width 180ms var(--ease-out)' }}
    >
      <div className="ems-sidebar-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        {collapsed ? (
          <span style={{ font: '700 18px/24px var(--font-sans)', color: 'var(--brand-500)' }}>E</span>
        ) : (
          <span style={{ font: '700 16px/22px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--brand-500)' }}>E</span>MS
          </span>
        )}
      </div>
      <nav
        className="ems-sidebar-nav"
        style={{ padding: collapsed ? '12px 8px' : '12px' }}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item, i) => {
          if (item.divider) {
            if (collapsed) {
              return <div key={`d-${i}`} style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 4px' }} />;
            }
            return (
              <div key={`d-${i}`} style={{ font: '500 10px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 12px 4px' }}>
                {item.divider}
              </div>
            );
          }
          return (
            <NavItem
              key={item.key}
              item={item}
              active={item.key === activeKey}
              collapsed={collapsed}
              onClick={() => onNavigate?.(item.key)}
            />
          );
        })}
      </nav>
      <div className="ems-sidebar-toggle">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onToggleCollapse} style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          {collapsed ? <ChevronRight /> : <><ChevronLeft /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ onSearch, dark, onToggleDark, user, notifications = 3 }) {
  const { Search, Bell, Sun, Moon } = window.Icons;
  const initials = (user?.name || 'A K').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <header className="ems-topbar">
      <div className="ems-search" onClick={onSearch}>
        <Search />
        <span style={{ flex: 1, color: 'var(--text-disabled)' }}>Search employees, departments…</span>
        <span className="kbd">⌘</span><span className="kbd">K</span>
      </div>
      <button type="button" className="btn btn-ghost btn-icon-sm" onClick={onToggleDark} aria-label="Toggle theme">
        {dark ? <Sun /> : <Moon />}
      </button>
      <button type="button" className="btn btn-ghost btn-icon-sm" aria-label="Notifications" style={{ position: 'relative' }}>
        <Bell />
        {notifications > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 9999, background: 'var(--danger-500)', border: '1.5px solid var(--bg-surface)' }} />
        )}
      </button>
      <div className="avatar avatar-brand" style={{ width: 32, height: 32, marginLeft: 4, cursor: 'pointer' }}>{initials}</div>
    </header>
  );
}

function AppShell({ activeKey, onNavigate, dark, onToggleDark, user, children }) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className="ems-shell" data-theme={dark ? 'dark' : undefined}>
      <Sidebar
        activeKey={activeKey}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className="ems-main">
        <Topbar dark={dark} onToggleDark={onToggleDark} user={user} />
        <main className="ems-main-scroll">{children}</main>
      </div>
    </div>
  );
}

window.AppShell = AppShell;

/* ── PageHeader ─────────────────────────────────────────────────────────── */

function PageHeader({ title, description, breadcrumbs = [], actions }) {
  const { ChevronRight } = window.Icons;
  return (
    <div className="ems-pageheader">
      <div style={{ minWidth: 0, flex: 1 }}>
        {breadcrumbs.length > 0 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            {breadcrumbs.map((c, i) => (
              <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-disabled)' }} />}
                <span style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-secondary)' }}>{c.label}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 style={{ font: '600 20px/28px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
        {description && <p style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

window.PageHeader = PageHeader;

/* ── StatsCard ──────────────────────────────────────────────────────────── */

function StatsCard({ label, value, icon, sub, delta, tone = 'neutral', accent }) {
  const { TrendingUp, TrendingDown } = window.Icons;
  const toneColor = { positive: 'var(--success-500)', negative: 'var(--danger-500)', warning: 'var(--warning-500)', neutral: 'var(--text-tertiary)' }[tone];
  // accent: a CSS color (or var()) used for the icon chip. Falls back to brand.
  const accentColor = accent || 'var(--brand-500)';
  return (
    <div className="card" style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
      {accent && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor, opacity: 0.85 }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-secondary)' }}>{label}</span>
        {icon && (
          <div style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${accentColor} 14%, transparent)`, color: accentColor, borderRadius: 8 }}>{icon}</div>
        )}
      </div>
      <div style={{ font: '600 24px/32px var(--font-sans)', letterSpacing: '-0.015em', color: 'var(--text-primary)', marginTop: 10, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {delta != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          {delta >= 0 ? <TrendingUp size={14} style={{ color: 'var(--success-500)' }} /> : <TrendingDown size={14} style={{ color: 'var(--danger-500)' }} />}
          <span style={{ font: '500 12px/16px var(--font-sans)', color: delta >= 0 ? 'var(--success-500)' : 'var(--danger-500)' }}>{delta >= 0 ? '+' : ''}{delta}</span>
          {sub && <span style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>{sub}</span>}
        </div>
      )}
      {delta == null && sub && (
        <div style={{ font: '500 12px/16px var(--font-sans)', color: toneColor, marginTop: 10 }}>{sub}</div>
      )}
    </div>
  );
}

window.StatsCard = StatsCard;
