/**
 * EmployeeProfileScreen — replicates src/modules/employees/components/EmployeeProfile.tsx.
 * Header band with avatar + identity + actions, tabs, two-column overview.
 */

function EmployeeProfileScreen({ employee, onBack }) {
  const { Button, Badge, Avatar } = window.UI;
  const I = window.Icons;
  const [tab, setTab] = React.useState('overview');

  // Fallback so it works when opened directly
  const emp = employee || {
    code: 'EMP-04217', name: 'Aman Khanna', dept: 'Engineering',
    role: 'Senior Engineer', type: 'FULL_TIME', status: 'Active',
    joined: '2022-04-12', email: 'aman@acme.test',
  };

  const overview = [
    ['Employee code', <span className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{emp.code}</span>],
    ['Email', <a href={`mailto:${emp.email}`} style={{ color: 'var(--brand-500)' }}>{emp.email}</a>],
    ['Phone', <span className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>+91 98201 47280</span>],
    ['Department', emp.dept],
    ['Designation', emp.role],
    ['Employment type', <Badge variant="outline">{emp.type}</Badge>],
    ['Manager', <a href="#" style={{ color: 'var(--brand-500)' }}>Vikram Singh</a>],
    ['Joined', <span style={{ fontVariantNumeric: 'tabular-nums' }}>{emp.joined}</span>],
    ['Tenure', '4y 1m'],
    ['Reports to', '2 direct reports'],
  ];

  return (
    <>
      <window.PageHeader
        title={emp.name}
        breadcrumbs={[
          { label: 'Employees' },
          { label: emp.code },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={onBack}>Back to list</Button>
            <Button variant="outline" size="sm" icon={<I.FileEdit />}>Edit</Button>
            <Button size="sm">Send message</Button>
          </>
        }
      />

      <div className="ems-page">
        {/* Identity band */}
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar size="xl" name={emp.name} variant="brand" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ font: '600 20px/28px var(--font-sans)', letterSpacing: '-0.01em', margin: 0 }}>{emp.name}</h2>
              <Badge variant="success" dot>{emp.status}</Badge>
              <Badge variant="outline">{emp.type}</Badge>
            </div>
            <div style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 4 }}>
              {emp.role} · {emp.dept}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, font: '400 13px/18px var(--font-sans)', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.Mail size={14} />{emp.email}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.Phone size={14} />+91 98201 47280</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I.Briefcase size={14} />Reports to Vikram Singh</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {['overview','attendance','leave','documents','activity'].map((t) => (
            <button key={t} type="button" className={window.UI.cx('tab', tab === t && 'active')} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div className="section-card">
              <div className="section-card-head"><div className="title">Personal details</div></div>
              <div className="section-card-body" style={{ padding: 0 }}>
                <table className="table" style={{ borderRadius: 0 }}>
                  <tbody>
                    {overview.map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ width: 200, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{k}</td>
                        <td style={{ borderBottom: '1px solid var(--border-subtle)' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="section-card">
                <div className="section-card-head"><div className="title">Leave balance</div></div>
                <div className="section-card-body">
                  {[
                    ['Casual',  8, 12],
                    ['Sick',    4,  8],
                    ['Earned', 14, 20],
                  ].map(([type, used, total]) => (
                    <div key={type} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 13px/18px var(--font-sans)' }}>
                        <span>{type}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{total - used} / {total} days</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-surface-2)', borderRadius: 9999, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(used / total) * 100}%`, background: 'var(--brand-500)', borderRadius: 9999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-card">
                <div className="section-card-head"><div className="title">Documents</div></div>
                <div className="section-card-body" style={{ padding: 0 }}>
                  {[
                    ['ID Proof (Aadhaar)', 'verified'],
                    ['PAN card', 'verified'],
                    ['Offer letter', 'verified'],
                    ['Joining KYC', 'pending'],
                  ].map(([n, s]) => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ font: '400 13px/18px var(--font-sans)' }}>{n}</span>
                      {s === 'verified'
                        ? <Badge variant="success">Verified</Badge>
                        : <Badge variant="warning">Pending</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab !== 'overview' && (
          <window.UI.EmptyState
            illustration={
              <svg viewBox="0 0 64 64" width="64" height="64" fill="none" style={{ color: 'var(--text-tertiary)' }}>
                <rect x="10" y="8" width="44" height="48" rx="3" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
                <rect x="10" y="8" width="44" height="13" rx="3" fill="currentColor" fillOpacity="0.1"/>
                <line x1="18" y1="32" x2="46" y2="32" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" strokeLinecap="round" strokeDasharray="5 3"/>
                <line x1="18" y1="41" x2="40" y2="41" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" strokeDasharray="5 3"/>
              </svg>
            }
            title={`${tab[0].toUpperCase() + tab.slice(1)} tab`}
            description={`This tab would show ${tab} records for ${emp.name}. Wire up the API to populate.`}
          />
        )}
      </div>
    </>
  );
}

window.EmployeeProfileScreen = EmployeeProfileScreen;
