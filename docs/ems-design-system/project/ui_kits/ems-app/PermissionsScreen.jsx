/**
 * PermissionsScreen — role × permission matrix.
 * Rows = permissions, cols = roles. Each cell: read/write/none with semantic color.
 */

const ROLES = [
  { id: 'SUPER_ADMIN', label: 'Super Admin', color: 'var(--dept-product)',     count: 2 },
  { id: 'HR_ADMIN',    label: 'HR Admin',    color: 'var(--brand-500)',         count: 8 },
  { id: 'MANAGER',     label: 'Manager',     color: 'var(--dept-finance)',      count: 84 },
  { id: 'EMPLOYEE',    label: 'Employee',    color: 'var(--text-tertiary)',     count: 1140 },
  { id: 'AUDITOR',     label: 'Auditor',     color: 'var(--dept-people)',       count: 6 },
];

const PERMISSION_GROUPS = [
  {
    name: 'Employees', icon: 'Users',
    perms: [
      { id: 'employees:read',    label: 'View directory',     levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'write', MANAGER: 'read',  EMPLOYEE: 'read',  AUDITOR: 'read' } },
      { id: 'employees:write',   label: 'Create / edit',      levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'write', MANAGER: 'none',  EMPLOYEE: 'none',  AUDITOR: 'none' } },
      { id: 'employees:delete',  label: 'Terminate',          levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'write', MANAGER: 'none',  EMPLOYEE: 'none',  AUDITOR: 'none' } },
      { id: 'employees:salary',  label: 'View salary band',   levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'write', MANAGER: 'read',  EMPLOYEE: 'none',  AUDITOR: 'read' } },
    ],
  },
  {
    name: 'Attendance & Leave', icon: 'Clock',
    perms: [
      { id: 'leave:approve',     label: 'Approve leave',      levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'write', MANAGER: 'write', EMPLOYEE: 'none',  AUDITOR: 'none' } },
      { id: 'attendance:regularize', label: 'Approve regularization', levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'write', MANAGER: 'write', EMPLOYEE: 'none', AUDITOR: 'none' } },
      { id: 'leave:configure',   label: 'Configure leave types', levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'write', MANAGER: 'none', EMPLOYEE: 'none',  AUDITOR: 'read' } },
    ],
  },
  {
    name: 'Settings & Admin', icon: 'Settings',
    perms: [
      { id: 'settings:tenant',   label: 'Company settings',   levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'write', MANAGER: 'none',  EMPLOYEE: 'none',  AUDITOR: 'read' } },
      { id: 'roles:write',       label: 'Manage roles',       levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'none',  MANAGER: 'none',  EMPLOYEE: 'none',  AUDITOR: 'none' } },
      { id: 'billing:read',      label: 'View billing',       levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'read',  MANAGER: 'none',  EMPLOYEE: 'none',  AUDITOR: 'read' } },
      { id: 'audit:read',        label: 'View audit log',     levels: { SUPER_ADMIN: 'write', HR_ADMIN: 'read',  MANAGER: 'none',  EMPLOYEE: 'none',  AUDITOR: 'write' } },
    ],
  },
];

const LEVEL_META = {
  write: { color: 'var(--success-500)', label: 'Write', symbol: '●' },
  read:  { color: 'var(--info-500)',    label: 'Read',  symbol: '◐' },
  none:  { color: 'var(--text-disabled)', label: '—',   symbol: '○' },
};

function PermissionsScreen() {
  const { Button, Badge } = window.UI;
  const I = window.Icons;

  return (
    <>
      <window.PageHeader
        title="Permissions"
        description="Role × permission matrix. UI affordance only — server enforces."
        breadcrumbs={[{ label: 'Permissions' }]}
        actions={
          <>
            <Button variant="outline" size="sm">Reset to defaults</Button>
            <Button size="sm">Save changes</Button>
          </>
        }
      />

      <div className="ems-page">
        {/* Role chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {ROLES.map((r) => (
            <div key={r.id} className="card" style={{ padding: 14, borderTop: `3px solid ${r.color}` }}>
              <div style={{ font: '600 14px/20px var(--font-sans)', color: 'var(--text-primary)' }}>{r.label}</div>
              <div style={{ font: '500 12px/16px var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 2 }}>{r.id}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
                <span style={{ font: '600 20px/26px var(--font-sans)', color: r.color, fontVariantNumeric: 'tabular-nums' }}>{r.count}</span>
                <span style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>members</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, font: '500 12px/16px var(--font-sans)', color: 'var(--text-secondary)' }}>
          <span>Permission levels:</span>
          {Object.entries(LEVEL_META).map(([k, m]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: m.color }}>
              <span style={{ fontSize: 14 }}>{m.symbol}</span>
              <span>{m.label}</span>
            </span>
          ))}
          <span style={{ marginLeft: 'auto', font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            Click a cell to cycle through levels.
          </span>
        </div>

        {/* Matrix */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '32%' }}>Permission</th>
                {ROLES.map((r) => (
                  <th key={r.id} style={{ textAlign: 'center' }}>
                    <div style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-primary)' }}>{r.label}</div>
                    <div style={{ font: '500 10px/14px var(--font-mono)', color: r.color, marginTop: 1 }}>{r.id}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => {
                const Icon = window.Icons[group.icon];
                return (
                  <React.Fragment key={group.name}>
                    <tr>
                      <td colSpan={ROLES.length + 1} style={{ background: 'var(--bg-surface-2)', padding: '10px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 11px/14px var(--font-sans)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <Icon size={12} />
                          {group.name}
                        </div>
                      </td>
                    </tr>
                    {group.perms.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{p.label}</div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.id}</div>
                        </td>
                        {ROLES.map((r) => {
                          const lvl = p.levels[r.id];
                          const m = LEVEL_META[lvl];
                          return (
                            <td key={r.id} style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="perm-cell"
                                style={{
                                  background: lvl === 'none' ? 'transparent' : `color-mix(in oklab, ${m.color} 14%, transparent)`,
                                  color: m.color,
                                  border: `1px solid ${lvl === 'none' ? 'var(--border-subtle)' : `color-mix(in oklab, ${m.color} 26%, transparent)`}`,
                                }}
                              >
                                {lvl !== 'none' && <span style={{ fontSize: 12, marginRight: 4 }}>{m.symbol}</span>}
                                {m.label}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

window.PermissionsScreen = PermissionsScreen;
