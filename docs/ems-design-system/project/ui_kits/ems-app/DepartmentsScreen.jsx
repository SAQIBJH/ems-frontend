/**
 * DepartmentsScreen — tree of org units with stable dept colors.
 * Layout: left tree (340px) + right details panel (employees + sub-teams).
 */

const DEPT_TREE = [
  { id: 'eng', name: 'Engineering', color: 'var(--dept-engineering)', head: 'Vikram Singh', count: 412,
    children: [
      { id: 'eng-platform', name: 'Platform',    head: 'Riya Sen',     count: 96 },
      { id: 'eng-product',  name: 'Product Eng', head: 'Anand Kapoor', count: 184 },
      { id: 'eng-data',     name: 'Data',        head: 'Hari Iyer',    count: 72 },
      { id: 'eng-qa',       name: 'QA',          head: 'Pooja Nair',   count: 60 },
    ]},
  { id: 'ops',  name: 'Operations',  color: 'var(--dept-operations)',  head: 'Sneha Rao',     count: 248, children: [
      { id: 'ops-fac',  name: 'Facilities',     head: 'Ravi Verma',   count: 88  },
      { id: 'ops-supp', name: 'Customer Supp.', head: 'Ankit Joshi',  count: 160 },
  ]},
  { id: 'sales', name: 'Sales',      color: 'var(--dept-sales)',      head: 'Karan Mehra',    count: 186, children: [
      { id: 'sales-ae', name: 'Account Exec',   head: 'Rohan Mehta',  count: 92 },
      { id: 'sales-cs', name: 'Customer Succ.', head: 'Asha Joshi',   count: 94 },
  ]},
  { id: 'prod', name: 'Product',     color: 'var(--dept-product)',     head: 'Nisha Iyer',    count: 142, children: [] },
  { id: 'fin',  name: 'Finance',     color: 'var(--dept-finance)',     head: 'Anita Pillai',  count: 104, children: [] },
  { id: 'hr',   name: 'People Ops',  color: 'var(--dept-people)',      head: 'Priya Sharma',  count: 88,  children: [] },
  { id: 'legal', name: 'Legal',      color: 'var(--dept-legal)',       head: 'Maya Rangan',   count: 60,  children: [] },
];

function DepartmentsScreen() {
  const { Button, Badge, Avatar } = window.UI;
  const I = window.Icons;
  const [activeId, setActiveId] = React.useState('eng');
  const [expanded, setExpanded] = React.useState({ eng: true });

  const allDepts = DEPT_TREE.flatMap((d) => [d, ...d.children.map((c) => ({ ...c, parent: d.name, color: d.color }))]);
  const active = allDepts.find((d) => d.id === activeId) || DEPT_TREE[0];

  const sampleMembers = [
    { name: 'Aman Khanna',    role: 'Senior Engineer',   code: 'EMP-04217' },
    { name: 'Vikram Singh',   role: 'Engineering Lead',  code: 'EMP-04261' },
    { name: 'Devansh Patel',  role: 'Junior Engineer',   code: 'EMP-04304' },
    { name: 'Riya Sen',       role: 'Staff Engineer',    code: 'EMP-04102' },
    { name: 'Anand Kapoor',   role: 'Engineering Manager', code: 'EMP-04088' },
  ];

  return (
    <>
      <window.PageHeader
        title="Departments"
        description="Org tree and team rosters."
        breadcrumbs={[{ label: 'Departments' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<I.ExternalLink />}>Export tree</Button>
            <Button size="sm" icon={<I.Plus />}>Add department</Button>
          </>
        }
      />
      <div className="ems-page" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Tree */}
        <div className="card" style={{ padding: 12 }}>
          {DEPT_TREE.map((d) => {
            const isOpen = expanded[d.id];
            const isActive = activeId === d.id;
            return (
              <div key={d.id}>
                <button
                  type="button"
                  onClick={() => { setActiveId(d.id); setExpanded({ ...expanded, [d.id]: !isOpen }); }}
                  className="dept-row"
                  style={{
                    background: isActive ? `color-mix(in oklab, ${d.color} 10%, transparent)` : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-primary)',
                  }}
                >
                  <I.ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : '', transition: 'transform 120ms', color: 'var(--text-tertiary)' }} />
                  <span style={{ width: 10, height: 10, borderRadius: 9999, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left', font: '500 13px/18px var(--font-sans)' }}>{d.name}</span>
                  <span style={{ font: '500 12px/16px var(--font-mono)', color: 'var(--text-tertiary)' }}>{d.count}</span>
                </button>
                {isOpen && d.children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className="dept-row"
                    style={{
                      background: activeId === c.id ? `color-mix(in oklab, ${d.color} 10%, transparent)` : 'transparent',
                      paddingLeft: 40,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 9999, background: d.color, opacity: 0.65, flexShrink: 0 }} />
                    <span style={{ flex: 1, textAlign: 'left', font: '400 13px/18px var(--font-sans)', color: 'var(--text-secondary)' }}>{c.name}</span>
                    <span style={{ font: '500 12px/16px var(--font-mono)', color: 'var(--text-tertiary)' }}>{c.count}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero */}
          <div className="card" style={{ padding: 24, borderTop: `3px solid ${active.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 9999, background: `color-mix(in oklab, ${active.color} 14%, transparent)`, color: active.color, font: '500 12px/16px var(--font-sans)', marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'currentColor' }} />
                  {active.parent ? `${active.parent} · sub-team` : 'Department'}
                </div>
                <h2 style={{ font: '600 22px/30px var(--font-sans)', letterSpacing: '-0.01em', margin: 0 }}>{active.name}</h2>
                <div style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Headed by <strong style={{ color: 'var(--text-primary)' }}>{active.head}</strong> · {active.count} people
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="sm">Reassign head</Button>
                <Button variant="outline" size="sm" icon={<I.MoreHorizontal />} />
              </div>
            </div>
          </div>

          {/* Sub-team grid */}
          {active.children && active.children.length > 0 && (
            <div className="section-card">
              <div className="section-card-head"><div className="title">Sub-teams · {active.children.length}</div></div>
              <div className="section-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {active.children.map((c) => (
                  <div key={c.id} className="card" style={{ padding: 14, cursor: 'pointer', borderLeft: `3px solid ${active.color}` }} onClick={() => setActiveId(c.id)}>
                    <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)', marginTop: 2 }}>{c.head}</div>
                    <div style={{ font: '600 18px/24px var(--font-sans)', color: 'var(--text-primary)', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{c.count} <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>people</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Members</div>
              <Button variant="outline" size="xs">View all {active.count}</Button>
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th><th>Role</th><th>Code</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {sampleMembers.map((m) => (
                    <tr key={m.code}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar size="sm" name={m.name} />
                          <span style={{ font: '500 13px/18px var(--font-sans)' }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.role}</td>
                      <td className="mono">{m.code}</td>
                      <td><button className="btn btn-ghost btn-icon-xs"><I.MoreHorizontal size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.DepartmentsScreen = DepartmentsScreen;
