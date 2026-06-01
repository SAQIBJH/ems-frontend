/**
 * HRDashboard — replicates src/modules/dashboard/components/HRDashboard.tsx.
 * Greeting, 4 stats cards, attendance trend (bar chart placeholder), donut
 * by department, recent activity table.
 */

function HRDashboard({ onNavigate }) {
  const { Button, Avatar } = window.UI;
  const I = window.Icons;
  const StatsCard = window.StatsCard;

  const [range, setRange] = React.useState('30d');

  const stats = [
    { label: 'Total Employees', value: '1,240', icon: <I.Users />,         accent: 'var(--brand-500)',     delta: 12, sub: 'this month' },
    { label: 'Active Today',    value: '1,184', icon: <I.CalendarCheck />, accent: 'var(--success-500)',   delta: 3,  sub: '95.4% present' },
    { label: 'On Leave Today',  value: '42',    icon: <I.CalendarX />,     accent: 'var(--warning-500)',   sub: '12 sick · 30 planned', tone: 'neutral' },
    { label: 'Open Requests',   value: '17',    icon: <I.ClipboardList />, accent: 'var(--dept-product)',  sub: '3 urgent', tone: 'warning' },
  ];

  // Fake 14-day attendance bars
  const bars = Array.from({ length: 14 }, (_, i) => {
    const present = 78 + Math.round(Math.sin(i * 0.7) * 14 + Math.random() * 6);
    return { date: `May ${14 + i}`, present, absent: 100 - present };
  });

  const depts = [
    { name: 'Engineering', count: 412, color: 'var(--dept-engineering)' },
    { name: 'Operations',  count: 248, color: 'var(--dept-operations)' },
    { name: 'Sales',       count: 186, color: 'var(--dept-sales)' },
    { name: 'Product',     count: 142, color: 'var(--dept-product)' },
    { name: 'Finance',     count: 104, color: 'var(--dept-finance)' },
    { name: 'People Ops',  count: 88,  color: 'var(--dept-people)' },
    { name: 'Legal',       count: 60,  color: 'var(--dept-legal)' },
  ];
  const totalEmps = depts.reduce((s, d) => s + d.count, 0);

  // Donut math
  let acc = 0;
  const donutSegments = depts.map((d) => {
    const start = (acc / totalEmps) * 360;
    acc += d.count;
    const end = (acc / totalEmps) * 360;
    return { ...d, start, end };
  });
  const donutGradient = donutSegments
    .map((s) => `${s.color} ${s.start}deg ${s.end}deg`)
    .join(', ');

  const activity = [
    { who: 'Priya Sharma',  action: 'approved leave request for',  resource: 'Rohan Mehta',    when: 'May 27 · 2:14 PM' },
    { who: 'Aman Khanna',   action: 'created employee profile',   resource: 'Nisha Iyer',     when: 'May 27 · 11:08 AM' },
    { who: 'HR Bot',        action: 'imported 6 holidays from',   resource: 'india-2026.ics', when: 'May 27 · 09:21 AM' },
    { who: 'Vikram Singh',  action: 'updated department',          resource: 'Engineering',    when: 'May 26 · 4:55 PM' },
    { who: 'Priya Sharma',  action: 'rejected leave request for',  resource: 'Karan Mehra',    when: 'May 26 · 3:40 PM' },
    { who: 'Sneha Rao',     action: 'enabled MFA for',             resource: 'finance team',   when: 'May 26 · 11:02 AM' },
    { who: 'Aman Khanna',   action: 'changed manager for',         resource: 'Asha Joshi',     when: 'May 26 · 10:30 AM' },
  ];

  return (
    <>
      <window.PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <div className="ems-page">
        {/* Greeting */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ font: '600 24px/32px var(--font-sans)', letterSpacing: '-0.015em', margin: 0 }}>Welcome back, Aman</h1>
            <p style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Wednesday, May 27, 2026
            </p>
          </div>
          <Button icon={<I.Plus />} onClick={() => onNavigate?.('employees')}>Add Employee</Button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {stats.map((s) => <StatsCard key={s.label} {...s} />)}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          {/* Attendance trend */}
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Attendance — last 30 days</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['7d', '30d', '90d'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={window.UI.cx('btn', 'btn-xs', range === r ? 'btn-default' : 'btn-ghost')}
                    onClick={() => setRange(r)}
                  >{r}</button>
                ))}
              </div>
            </div>
            <div className="section-card-body">
              <div className="minibar">
                {bars.map((b, i) => (
                  <div key={i} title={`${b.date}: ${b.present}% present`} style={{ height: `${b.present * 2}px` }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)' }}>
                <span>May 14</span><span>May 21</span><span>May 27</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, font: '400 12px/16px var(--font-sans)', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--brand-500)', borderRadius: 2 }} />Present rate</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>Daily average · <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>94.2%</span></span>
              </div>
            </div>
          </div>

          {/* Headcount donut */}
          <div className="section-card">
            <div className="section-card-head"><div className="title">Headcount by department</div></div>
            <div className="section-card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{
                width: 140, height: 140, borderRadius: 9999,
                background: `conic-gradient(${donutGradient})`,
                display: 'grid', placeItems: 'center', position: 'relative',
                flexShrink: 0,
              }}>
                <div style={{ width: 86, height: 86, borderRadius: 9999, background: 'var(--bg-surface)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                  <div>
                    <div style={{ font: '600 18px/22px var(--font-sans)', color: 'var(--text-primary)' }}>{totalEmps.toLocaleString()}</div>
                    <div style={{ font: '500 10px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                  </div>
                </div>
              </div>
              <div className="donut-legend">
                {depts.map((d) => (
                  <div key={d.name}>
                    <span className="swatch" style={{ background: d.color }} />
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{d.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="section-card">
          <div className="section-card-head"><div className="title">Recent activity</div></div>
          <div className="section-card-body" style={{ paddingTop: 4 }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Who</th><th>Action</th><th>Resource</th><th style={{ width: 160 }}>When</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar size="sm" name={row.who} />
                        <span style={{ font: '500 13px/18px var(--font-sans)' }}>{row.who}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.action}</td>
                    <td>
                      <a href="#" style={{ color: 'var(--brand-500)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {row.resource}
                        <I.ExternalLink size={12} />
                      </a>
                    </td>
                    <td style={{ font: '500 12px/16px var(--font-mono)', color: 'var(--text-tertiary)' }}>{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

window.HRDashboard = HRDashboard;
