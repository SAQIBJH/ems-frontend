/**
 * SettingsScreen — Company Profile pane, with a left sub-nav and right form.
 * Mirrors src/app/(dashboard)/settings/* layout.
 */

const SETTINGS_NAV = [
  { section: 'Organization', items: [
    { id: 'company',   icon: 'Building2', label: 'Company profile' },
    { id: 'branding',  icon: 'Briefcase', label: 'Branding' },
    { id: 'locale',    icon: 'Calendar',  label: 'Locale & time zone' },
    { id: 'working',   icon: 'Clock',     label: 'Working hours' },
    { id: 'leavetypes',icon: 'CalendarOff', label: 'Leave types' },
    { id: 'rules',     icon: 'Shield',    label: 'Attendance rules' },
  ]},
  { section: 'Account', items: [
    { id: 'auth',      icon: 'Shield',    label: 'Authentication' },
    { id: 'sessions',  icon: 'Clock',     label: 'Active sessions' },
    { id: 'notif',     icon: 'Bell',      label: 'Notifications' },
  ]},
  { section: 'Workspace', items: [
    { id: 'email',     icon: 'Mail',      label: 'Email templates' },
    { id: 'integ',     icon: 'ExternalLink', label: 'Integrations' },
    { id: 'audit',     icon: 'ClipboardList', label: 'Audit log' },
    { id: 'billing',   icon: 'Briefcase', label: 'Billing & plan' },
  ]},
];

function FormRow({ label, help, children }) {
  return (
    <div className="form-row">
      <div>
        <div className="form-row-label">{label}</div>
        {help && <div className="form-row-help">{help}</div>}
      </div>
      <div className="form-row-field">{children}</div>
    </div>
  );
}

function SettingsScreen() {
  const { Button, Input, Field, SelectTrigger, Switch, Badge, Checkbox } = window.UI;
  const I = window.Icons;
  const [active, setActive] = React.useState('company');

  // Settings state (mock)
  const [emailNotif, setEmailNotif] = React.useState(true);
  const [pushNotif, setPushNotif]   = React.useState(false);
  const [mfa, setMfa]               = React.useState(true);
  const [accent, setAccent]         = React.useState('var(--brand-500)');

  const accentSwatches = [
    { name: 'Indigo (default)', value: 'var(--brand-500)' },
    { name: 'Emerald', value: 'var(--dept-operations)' },
    { name: 'Amber',   value: 'var(--dept-sales)' },
    { name: 'Purple',  value: 'var(--dept-product)' },
    { name: 'Teal',    value: 'var(--dept-finance)' },
    { name: 'Magenta', value: 'var(--dept-people)' },
  ];

  return (
    <>
      <window.PageHeader
        title="Settings"
        breadcrumbs={[{ label: 'Settings' }]}
      />
      <div className="ems-page" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Sub-nav */}
        <div className="card" style={{ padding: 0 }}>
          {SETTINGS_NAV.map((s) => (
            <div key={s.section} className="settings-nav" style={{ padding: 0 }}>
              <div className="settings-nav-section">{s.section}</div>
              <div style={{ padding: '0 8px 8px' }}>
                {s.items.map((it) => {
                  const Icon = window.Icons[it.icon] || I.Settings;
                  return (
                    <button key={it.id}
                      type="button"
                      className={window.UI.cx('settings-nav-item', active === it.id && 'active')}
                      onClick={() => setActive(it.id)}
                    >
                      <Icon />{it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Content pane */}
        <div className="card" style={{ padding: '4px 28px 28px' }}>
          {/* Header */}
          <div style={{ padding: '24px 0 4px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization</div>
            <h2 style={{ font: '600 20px/28px var(--font-sans)', letterSpacing: '-0.01em', margin: '4px 0 6px' }}>
              {active === 'company' && 'Company profile'}
              {active === 'branding' && 'Branding'}
              {active === 'locale' && 'Locale & time zone'}
              {active === 'working' && 'Working hours'}
              {active === 'leavetypes' && 'Leave types'}
              {active === 'rules' && 'Attendance rules'}
              {active === 'auth' && 'Authentication'}
              {active === 'sessions' && 'Active sessions'}
              {active === 'notif' && 'Notifications'}
              {active === 'email' && 'Email templates'}
              {active === 'integ' && 'Integrations'}
              {active === 'audit' && 'Audit log'}
              {active === 'billing' && 'Billing & plan'}
            </h2>
            <p style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              {active === 'company' && 'How your company appears across the platform.'}
              {active === 'branding' && 'Logo, accent color, favicon. Shown to all employees.'}
              {active === 'notif' && 'Choose when and how the platform contacts you.'}
              {active === 'auth' && 'Sign-in methods, password rules, MFA enforcement.'}
              {!['company','branding','notif','auth'].includes(active) && 'Configure how this area works for your workspace.'}
            </p>
          </div>

          {/* Pane content */}
          {active === 'company' && (
            <>
              <FormRow label="Company name" help="Shown in invitations, emails, and the login page.">
                <Input defaultValue="Acme Holdings Pvt. Ltd." />
              </FormRow>
              <FormRow label="Short name" help="Used where space is tight, e.g. the topbar logo.">
                <Input defaultValue="Acme" />
              </FormRow>
              <FormRow label="Legal entity" help="Appears on payslips and offer letters.">
                <Input defaultValue="Acme Holdings Pvt. Ltd." />
              </FormRow>
              <FormRow label="Primary domain">
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input defaultValue="acme.test" />
                  <Badge variant="success" dot>Verified</Badge>
                </div>
              </FormRow>
              <FormRow label="Headquarters">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                  <Input defaultValue="Bengaluru, KA" />
                  <SelectTrigger value="India (UTC+5:30)" />
                </div>
              </FormRow>
              <FormRow label="Industry">
                <SelectTrigger value="Software · B2B SaaS" />
              </FormRow>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 20 }}>
                <Button variant="outline" size="sm">Cancel</Button>
                <Button size="sm">Save changes</Button>
              </div>
            </>
          )}

          {active === 'branding' && (
            <>
              <FormRow label="Logo" help="PNG or SVG. Min 64px tall. Auto-fits the sidebar header.">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--bg-surface-2)', border: '1px dashed var(--border-default)', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)', font: '600 24px/30px var(--font-sans)' }}>
                    <span><span style={{ color: 'var(--brand-500)' }}>A</span>cme</span>
                  </div>
                  <Button variant="outline" size="sm">Upload logo</Button>
                  <Button variant="ghost" size="sm">Remove</Button>
                </div>
              </FormRow>
              <FormRow label="Accent color" help="Used for primary buttons, links, and the active nav item.">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {accentSwatches.map((s) => {
                    const sel = accent === s.value;
                    return (
                      <button key={s.name} type="button" onClick={() => setAccent(s.value)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px',
                        border: `1px solid ${sel ? s.value : 'var(--border-subtle)'}`,
                        borderRadius: 9999,
                        background: sel ? `color-mix(in oklab, ${s.value} 10%, transparent)` : 'var(--bg-surface)',
                        cursor: 'pointer',
                        font: '500 12px/16px var(--font-sans)',
                        color: sel ? s.value : 'var(--text-primary)',
                      }}>
                        <span style={{ width: 14, height: 14, borderRadius: 9999, background: s.value }} />
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </FormRow>
              <FormRow label="Favicon" help="Shown in the browser tab. 32×32 px PNG.">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img src="../../assets/favicon.ico" width="32" height="32" alt="favicon" style={{ borderRadius: 6, border: '1px solid var(--border-subtle)' }} />
                  <Button variant="outline" size="sm">Replace</Button>
                </div>
              </FormRow>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 20 }}>
                <Button variant="outline" size="sm">Cancel</Button>
                <Button size="sm">Save changes</Button>
              </div>
            </>
          )}

          {active === 'notif' && (
            <>
              {[
                ['Leave approval requests', 'When a team member submits a leave request.', true],
                ['Pending regularization',  'When a team member asks to fix an attendance gap.', true],
                ['Holiday updates',         'When the company holiday calendar changes.', false],
                ['Birthday & anniversary',  'Weekly digest every Monday morning.', true],
                ['Audit log highlights',    'Sensitive actions in your team. Daily digest.', false],
              ].map(([label, desc, on]) => (
                <FormRow key={label} label={label} help={desc}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '400 13px/18px var(--font-sans)' }}>
                      <Switch checked={on} />Email
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '400 13px/18px var(--font-sans)' }}>
                      <Switch checked={false} />Push
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '400 13px/18px var(--font-sans)' }}>
                      <Switch checked={false} />Slack
                    </label>
                  </div>
                </FormRow>
              ))}
            </>
          )}

          {active === 'auth' && (
            <>
              <FormRow label="Password policy" help="Minimum requirements for all employees.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '400 13px/18px var(--font-sans)' }}><Checkbox checked />At least 12 characters</label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '400 13px/18px var(--font-sans)' }}><Checkbox checked />Mix of letters, digits, symbols</label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '400 13px/18px var(--font-sans)' }}><Checkbox />Rotate every 90 days</label>
                </div>
              </FormRow>
              <FormRow label="Multi-factor auth" help="Require a second factor at every sign-in.">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Switch checked={mfa} onChange={setMfa} />
                  <span style={{ font: '500 13px/18px var(--font-sans)', color: mfa ? 'var(--success-500)' : 'var(--text-tertiary)' }}>
                    {mfa ? 'Enforced for all roles' : 'Optional'}
                  </span>
                </div>
              </FormRow>
              <FormRow label="Session length" help="Sign-out after this period of inactivity.">
                <SelectTrigger value="8 hours" style={{ maxWidth: 200 }} />
              </FormRow>
              <FormRow label="Allowed sign-in methods">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Email + password', true,  'success'],
                    ['Google Workspace', true,  'success'],
                    ['Microsoft Entra',  false, 'tertiary'],
                    ['SAML SSO',         false, 'tertiary'],
                  ].map(([n, on, tone]) => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Switch checked={on} />
                      <span style={{ font: '400 13px/18px var(--font-sans)', flex: 1 }}>{n}</span>
                      {on && <Badge variant="success" dot>Active</Badge>}
                    </div>
                  ))}
                </div>
              </FormRow>
            </>
          )}

          {!['company','branding','notif','auth'].includes(active) && (
            <div style={{ padding: '40px 0' }}>
              <window.UI.EmptyState
                illustration={
                  <svg viewBox="0 0 64 64" width="64" height="64" fill="none" style={{ color: 'var(--text-tertiary)' }}>
                    <rect x="10" y="8" width="44" height="48" rx="3" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
                    <line x1="18" y1="32" x2="46" y2="32" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" strokeLinecap="round" strokeDasharray="5 3"/>
                  </svg>
                }
                title="Settings pane"
                description={`This pane configures ${active.replace(/-/g, ' ')} — the form schema follows the same FormRow pattern shown in Company Profile, Branding, Notifications, and Authentication.`}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

window.SettingsScreen = SettingsScreen;
