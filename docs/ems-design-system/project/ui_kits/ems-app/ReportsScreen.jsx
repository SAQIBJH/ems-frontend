/**
 * ReportsScreen — Phase 2. Analytics + export hub. KPI strip, a CSS-bar
 * headcount-trend chart, a department breakdown, and a downloadable
 * report library. Static click-thru fidelity (no live charting lib).
 * Tabs: Overview · Library
 */

function ReportsScreen() {
  const { Button, Badge, SelectTrigger } = window.UI;
  const I = window.Icons;
  const StatsCard = window.StatsCard;
  const [tab, setTab] = React.useState('overview');

  // Headcount over the last 8 months
  const trend = [
    { m: 'Oct', v: 198 }, { m: 'Nov', v: 206 }, { m: 'Dec', v: 209 },
    { m: 'Jan', v: 221 }, { m: 'Feb', v: 228 }, { m: 'Mar', v: 234 },
    { m: 'Apr', v: 240 }, { m: 'May', v: 248 },
  ];
  const maxV = Math.max(...trend.map((t) => t.v));
  const minV = Math.min(...trend.map((t) => t.v)) - 12;

  const deptBreakdown = [
    { dept: 'Engineering', count: 96, color: 'var(--dept-engineering)' },
    { dept: 'Sales',       count: 52, color: 'var(--dept-sales)' },
    { dept: 'Product',     count: 34, color: 'var(--dept-product)' },
    { dept: 'Operations',  count: 31, color: 'var(--dept-operations)' },
    { dept: 'Finance',     count: 19, color: 'var(--info-500)' },
    { dept: 'People',      count: 16, color: 'var(--dept-people)' },
  ];
  const totalHc = deptBreakdown.reduce((s, d) => s + d.count, 0);

  const library = [
    { name: 'Monthly headcount summary',  cat: 'Headcount', updated: 'May 28', rows: '248', schedule: 'Monthly' },
    { name: 'Attendance & leave register', cat: 'Attendance', updated: 'May 27', rows: '4,812', schedule: 'Weekly' },
    { name: 'Payroll cost by department',  cat: 'Payroll',   updated: 'May 25', rows: '6',   schedule: 'Monthly' },
    { name: 'Attrition & retention',       cat: 'Headcount', updated: 'May 20', rows: '32',  schedule: 'Quarterly' },
    { name: 'Diversity & inclusion',       cat: 'People',    updated: 'May 18', rows: '248', schedule: 'Quarterly' },
    { name: 'Open requisitions pipeline',  cat: 'Recruiting', updated: 'May 28', rows: '6',  schedule: 'On demand' },
  ];

  const CAT_VARIANT = {
    Headcount: 'info', Attendance: 'success', Payroll: 'warning',
    People: 'secondary', Recruiting: 'info',
  };

  return (
    <>
      <window.PageHeader
        title="Reports"
        description="Org analytics and scheduled exports for headcount, attendance, and pay."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={
          <>
            <SelectTrigger value="Last 8 months" style={{ width: 160 }} />
            <Button size="sm" icon={<I.Download />}>Export all</Button>
          </>
        }
      />

      <div className="ems-page">
        <div className="tabs">
          {[['overview', 'Overview'], ['library', 'Library']].map(([k, l]) => (
            <button key={k} type="button" className={window.UI.cx('tab', tab === k && 'active')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatsCard label="Total headcount" value="248" icon={<I.Users />}     accent="var(--brand-500)" delta={3.3} sub="vs Apr" tone="positive" />
          <StatsCard label="Attrition (TTM)" value="8.1%" icon={<I.TrendingDown />} accent="var(--success-500)" delta={-1.4} sub="vs last yr" tone="positive" />
          <StatsCard label="Avg tenure"      value="2.7y" icon={<I.Clock />}     accent="var(--dept-product)" sub="median 2.1y" />
          <StatsCard label="Payroll / mo"    value="₹3.9Cr" icon={<I.Wallet />}  accent="var(--warning-500)" delta={2.0} sub="vs Apr" />
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            {/* Headcount trend */}
            <div className="section-card">
              <div className="section-card-head">
                <div className="title">Headcount trend</div>
                <span style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Oct — May</span>
              </div>
              <div className="section-card-body">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, paddingTop: 8 }}>
                  {trend.map((t) => {
                    const h = ((t.v - minV) / (maxV - minV)) * 100;
                    const isLast = t.m === 'May';
                    return (
                      <div key={t.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ font: '600 11px/14px var(--font-mono)', color: isLast ? 'var(--brand-500)' : 'var(--text-tertiary)' }}>{t.v}</span>
                        <div style={{
                          width: '100%', maxWidth: 34, height: `${h}%`,
                          background: isLast ? 'var(--brand-500)' : 'var(--bg-surface-2)',
                          border: isLast ? 'none' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                          transition: 'height 200ms var(--ease-out)',
                        }} />
                        <span style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)' }}>{t.m}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Department breakdown */}
            <div className="section-card">
              <div className="section-card-head">
                <div className="title">By department</div>
                <span style={{ font: '500 11px/14px var(--font-mono)', color: 'var(--text-tertiary)' }}>{totalHc}</span>
              </div>
              <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {deptBreakdown.map((d) => (
                  <div key={d.dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: 9999, background: d.color }} />{d.dept}
                      </span>
                      <span style={{ font: '500 12px/16px var(--font-mono)', color: 'var(--text-secondary)' }}>{d.count}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-surface-2)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(d.count / deptBreakdown[0].count) * 100}%`, background: d.color, borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'library' && (
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Report library · {library.length}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <SelectTrigger value="All categories" style={{ width: 170 }} />
                <Button variant="outline" size="xs" icon={<I.Plus />}>New report</Button>
              </div>
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Rows</th>
                    <th>Schedule</th>
                    <th>Updated</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {library.map((r) => (
                    <tr key={r.name}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                            <I.BarChart2 size={16} />
                          </span>
                          <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{r.name}</span>
                        </div>
                      </td>
                      <td><Badge variant={CAT_VARIANT[r.cat] || 'secondary'}>{r.cat}</Badge></td>
                      <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.rows}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.schedule}</td>
                      <td className="mono" style={{ color: 'var(--text-tertiary)' }}>{r.updated}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Button variant="ghost" size="icon-xs" aria-label="View"><I.ExternalLink size={14} /></Button>
                          <Button variant="outline" size="xs" icon={<I.Download size={13} />}>CSV</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

window.ReportsScreen = ReportsScreen;
