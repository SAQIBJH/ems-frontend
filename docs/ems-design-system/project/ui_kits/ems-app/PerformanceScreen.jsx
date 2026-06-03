/**
 * PerformanceScreen — Phase 2. Review-cycle tracking, goals/OKRs, and a
 * calibration view (rating distribution). Static, click-thru fidelity only.
 * Tabs: Reviews · Goals · Calibration
 */

const REVIEW_STATUS = {
  'Not started': { color: 'var(--text-tertiary)' },
  'Self review': { color: 'var(--info-500)' },
  'Manager review': { color: 'var(--warning-500)' },
  'Calibrated': { color: 'var(--success-500)' },
};

const RATING_META = {
  'Exceeds':         { color: 'var(--success-500)' },
  'Strong':          { color: 'var(--dept-engineering)' },
  'Meets':           { color: 'var(--info-500)' },
  'Developing':      { color: 'var(--warning-500)' },
  'Below':           { color: 'var(--danger-500)' },
};

function PerfDot({ color }) {
  return <span style={{ width: 7, height: 7, borderRadius: 9999, background: color, flexShrink: 0 }} />;
}

function ProgressBar({ value, color = 'var(--brand-500)' }) {
  return (
    <div style={{ height: 6, background: 'var(--bg-surface-2)', borderRadius: 9999, overflow: 'hidden', minWidth: 120 }}>
      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 9999 }} />
    </div>
  );
}

function PerformanceScreen() {
  const { Button, Badge, Avatar, SelectTrigger } = window.UI;
  const I = window.Icons;
  const StatsCard = window.StatsCard;
  const [tab, setTab] = React.useState('reviews');

  const reviews = [
    { who: 'Priya Sharma',   dept: 'Engineering', reviewer: 'Aman Khanna', status: 'Calibrated',     rating: 'Exceeds',    self: true,  mgr: true },
    { who: 'Rohan Mehta',    dept: 'Sales',       reviewer: 'Sneha Rao',   status: 'Manager review', rating: null,         self: true,  mgr: false },
    { who: 'Nisha Iyer',     dept: 'Product',     reviewer: 'Aman Khanna', status: 'Manager review', rating: null,         self: true,  mgr: false },
    { who: 'Vikram Singh',   dept: 'Engineering', reviewer: 'Aman Khanna', status: 'Calibrated',     rating: 'Strong',     self: true,  mgr: true },
    { who: 'Asha Joshi',     dept: 'Finance',     reviewer: 'Maya Rangan', status: 'Self review',    rating: null,         self: false, mgr: false },
    { who: 'Devansh Patel',  dept: 'Engineering', reviewer: 'Aman Khanna', status: 'Calibrated',     rating: 'Meets',      self: true,  mgr: true },
    { who: 'Karan Mehra',    dept: 'Sales',       reviewer: 'Sneha Rao',   status: 'Not started',    rating: null,         self: false, mgr: false },
  ];

  const goals = [
    { who: 'Priya Sharma',  title: 'Ship design-system v2 to all squads',  progress: 80, due: 'Jun 30', status: 'On track' },
    { who: 'Rohan Mehta',   title: 'Close ₹2.4Cr in net-new pipeline',      progress: 62, due: 'Jun 30', status: 'On track' },
    { who: 'Nisha Iyer',    title: 'Launch self-serve onboarding flow',     progress: 45, due: 'Jun 30', status: 'At risk' },
    { who: 'Vikram Singh',  title: 'Reduce p95 API latency below 200ms',    progress: 90, due: 'Jun 30', status: 'On track' },
    { who: 'Asha Joshi',    title: 'Automate monthly close to 2 days',      progress: 30, due: 'Jul 15', status: 'At risk' },
    { who: 'Devansh Patel', title: 'Migrate 8 services to new auth gateway', progress: 100, due: 'May 31', status: 'Done' },
  ];

  const GOAL_STATUS = {
    'On track': { color: 'var(--success-500)', variant: 'success' },
    'At risk':  { color: 'var(--warning-500)', variant: 'warning' },
    'Done':     { color: 'var(--brand-500)',   variant: 'info' },
  };

  // Calibration distribution
  const distribution = [
    { rating: 'Exceeds',    count: 8,  pct: 11 },
    { rating: 'Strong',     count: 19, pct: 26 },
    { rating: 'Meets',      count: 33, pct: 45 },
    { rating: 'Developing', count: 10, pct: 14 },
    { rating: 'Below',      count: 3,  pct: 4 },
  ];
  const maxCount = Math.max(...distribution.map((d) => d.count));

  return (
    <>
      <window.PageHeader
        title="Performance"
        description="Run review cycles, track goals, and calibrate ratings across the org."
        breadcrumbs={[{ label: 'Performance' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<I.Download />}>Export</Button>
            <Button size="sm" icon={<I.Plus />}>Start a Review</Button>
          </>
        }
      />

      <div className="ems-page">
        {/* Active cycle banner */}
        <div className="section-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-md)', background: 'color-mix(in oklab, var(--brand-500) 14%, transparent)', color: 'var(--brand-500)', flexShrink: 0 }}>
            <I.Star size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ font: '600 14px/20px var(--font-sans)', color: 'var(--text-primary)' }}>H1 2026 Review Cycle</div>
            <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-secondary)' }}>Manager reviews due <span className="mono">Jun 14</span> · calibration <span className="mono">Jun 21</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ProgressBar value={58} />
            <span style={{ font: '600 13px/18px var(--font-sans)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>58%</span>
          </div>
          <span className="badge badge-warning">In progress</span>
        </div>

        <div className="tabs">
          {[
            ['reviews', 'Reviews'],
            ['goals', 'Goals'],
            ['calibration', 'Calibration'],
          ].map(([k, l]) => (
            <button key={k} type="button" className={window.UI.cx('tab', tab === k && 'active')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatsCard label="Reviews complete"  value="42 / 73" icon={<I.ClipboardList />} accent="var(--brand-500)" sub="58% of cycle" />
          <StatsCard label="Goals on track"    value="81%"     icon={<I.Target />}        accent="var(--success-500)" delta={6} sub="vs H2 2025" />
          <StatsCard label="Avg rating"        value="3.4"     icon={<I.Star />}          accent="var(--warning-500)" sub="of 5.0" />
          <StatsCard label="Overdue reviews"   value="7"       icon={<I.Clock />}         accent="var(--danger-500)" sub="past Jun 14" tone="negative" />
        </div>

        {tab === 'reviews' && (
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Cycle progress · {reviews.length} reports</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <SelectTrigger value="All departments" style={{ width: 180 }} />
                <Button variant="outline" size="xs" icon={<I.Filter />}>Filter</Button>
              </div>
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Reviewer</th>
                    <th>Self</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => {
                    const sm = REVIEW_STATUS[r.status];
                    const rm = r.rating ? RATING_META[r.rating] : null;
                    return (
                      <tr key={r.who}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar size="sm" name={r.who} />
                            <div>
                              <div style={{ font: '500 13px/18px var(--font-sans)' }}>{r.who}</div>
                              <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>{r.dept}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.reviewer}</td>
                        <td>{r.self ? <I.Check size={15} style={{ color: 'var(--success-500)' }} /> : <span style={{ color: 'var(--text-disabled)' }}>—</span>}</td>
                        <td>{r.mgr ? <I.Check size={15} style={{ color: 'var(--success-500)' }} /> : <span style={{ color: 'var(--text-disabled)' }}>—</span>}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 12px/16px var(--font-sans)', color: sm.color }}>
                            <PerfDot color={sm.color} />{r.status}
                          </span>
                        </td>
                        <td>
                          {rm
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 13px/18px var(--font-sans)', color: rm.color }}>{r.rating}</span>
                            : <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button variant={r.status === 'Manager review' ? 'default' : 'outline'} size="xs">
                            {r.status === 'Calibrated' ? 'View' : r.status === 'Manager review' ? 'Review' : 'Open'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'goals' && (
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Team goals · H1 2026</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <SelectTrigger value="All statuses" style={{ width: 160 }} />
                <Button variant="outline" size="xs" icon={<I.Plus />}>Add goal</Button>
              </div>
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Goal</th>
                    <th style={{ width: 220 }}>Progress</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => {
                    const gs = GOAL_STATUS[g.status];
                    return (
                      <tr key={g.who}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar size="sm" name={g.who} />
                            <span style={{ font: '500 13px/18px var(--font-sans)' }}>{g.who}</span>
                          </div>
                        </td>
                        <td style={{ maxWidth: 320 }}>
                          <span style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{g.title}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ProgressBar value={g.progress} color={gs.color} />
                            <span style={{ font: '500 12px/16px var(--font-mono)', color: 'var(--text-secondary)', minWidth: 34, textAlign: 'right' }}>{g.progress}%</span>
                          </div>
                        </td>
                        <td className="mono" style={{ color: 'var(--text-secondary)' }}>{g.due}</td>
                        <td><Badge variant={gs.variant} dot>{g.status}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'calibration' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <div className="section-card">
              <div className="section-card-head">
                <div className="title">Rating distribution</div>
                <span style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>73 reviewed</span>
              </div>
              <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {distribution.map((d) => {
                  const meta = RATING_META[d.rating];
                  return (
                    <div key={d.rating}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>
                          <PerfDot color={meta.color} />{d.rating}
                        </span>
                        <span style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{d.count}</strong> · {d.pct}%
                        </span>
                      </div>
                      <div style={{ height: 10, background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(d.count / maxCount) * 100}%`, background: meta.color, borderRadius: 'var(--radius-sm)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="section-card">
              <div className="section-card-head"><div className="title">Calibration notes</div></div>
              <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 4, borderRadius: 9999, background: 'var(--warning-500)', flexShrink: 0 }} />
                  <div>
                    <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>Engineering skews high</div>
                    <div style={{ font: '400 12px/18px var(--font-sans)', color: 'var(--text-secondary)' }}>41% rated Strong or above vs 37% org-wide. Flagged for review on Jun 21.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 4, borderRadius: 9999, background: 'var(--success-500)', flexShrink: 0 }} />
                  <div>
                    <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>Distribution within band</div>
                    <div style={{ font: '400 12px/18px var(--font-sans)', color: 'var(--text-secondary)' }}>Below + Developing held under 20% target.</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" style={{ width: '100%', marginTop: 4 }} icon={<I.FileText />}>
                  Open calibration sheet
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

window.PerformanceScreen = PerformanceScreen;
