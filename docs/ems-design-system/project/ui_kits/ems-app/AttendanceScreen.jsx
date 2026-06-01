/**
 * AttendanceScreen — replicates src/app/(dashboard)/attendance.
 * Summary cards, toolbar with filters + month nav + view toggle, calendar grid.
 */

function AttendanceScreen() {
  const { Button, Badge, SelectTrigger } = window.UI;
  const I = window.Icons;
  const StatsCard = window.StatsCard;

  const [view, setView] = React.useState('calendar');
  const [month, setMonth] = React.useState({ year: 2026, m: 4 }); // May = idx 4
  const monthLabel = new Date(month.year, month.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build calendar grid for May 2026
  const firstDay = new Date(month.year, month.m, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(month.year, month.m + 1, 0).getDate();
  const cells = [];
  // Fill blanks before
  for (let i = 0; i < firstDay; i++) cells.push({ out: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDay + d - 1) % 7;
    let status = 'present';
    if (dow === 0 || dow === 6) status = 'weekend';
    if (d === 1) status = 'holiday';      // May 1 — Labour Day
    if (d === 11 || d === 18) status = 'wfh';
    if (d === 14) status = 'absent';
    if (d === 22 || d === 25) status = 'leave';
    if (d > 27) status = null;            // future days
    cells.push({ d, dow, status, today: d === 27 });
  }
  while (cells.length % 7 !== 0) cells.push({ out: true });

  const STATUS_LABELS = {
    present: 'Present', absent: 'Absent', leave: 'Leave',
    wfh: 'WFH', weekend: '', holiday: 'Holiday',
  };

  return (
    <>
      <window.PageHeader
        title="Attendance"
        description="Track check-in, check-out, and monthly records."
        breadcrumbs={[{ label: 'Attendance' }]}
        actions={<Button variant="outline" icon={<I.FileEdit />}>Request Regularization</Button>}
      />

      <div className="ems-page">
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatsCard label="Working days" value="20" icon={<I.Calendar />} sub="May 2026" />
          <StatsCard label="Present" value="17" icon={<I.CalendarCheck />} sub="85% attendance" tone="positive" />
          <StatsCard label="Leave" value="2" icon={<I.CalendarOff />} sub="1 sick · 1 casual" />
          <StatsCard label="Avg hours" value="08:14" icon={<I.Clock />} sub="vs 08:00 target" tone="positive" />
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <SelectTrigger placeholder="All departments" style={{ width: 180 }} />
          <SelectTrigger placeholder="All employees" style={{ width: 180 }} />
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Button variant="ghost" size="icon-sm" aria-label="Previous month"><I.ChevronLeft /></Button>
            <span style={{ minWidth: 140, textAlign: 'center', font: '500 14px/20px var(--font-sans)' }}>{monthLabel}</span>
            <Button variant="ghost" size="icon-sm" aria-label="Next month"><I.ChevronRight /></Button>
          </div>
          <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={window.UI.cx('btn', 'btn-xs', view === 'calendar' ? 'btn-secondary' : 'btn-ghost')}
              style={{ borderRadius: 0 }}
            ><I.Calendar />Calendar</button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={window.UI.cx('btn', 'btn-xs', view === 'table' ? 'btn-secondary' : 'btn-ghost')}
              style={{ borderRadius: 0, borderLeft: '1px solid var(--border-subtle)' }}
            ><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>Table</button>
          </div>
        </div>

        {/* Grid layout: check-in card + calendar */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Check-in/out card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
            <div style={{ font: '600 32px/40px var(--font-mono)', color: 'var(--text-primary)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>09:02:14</div>
            <div style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 2 }}>Checked in · Wed, May 27</div>
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hours today</div>
                <div style={{ font: '600 16px/22px var(--font-mono)', color: 'var(--text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>06h 47m</div>
              </div>
              <div>
                <div style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</div>
                <div style={{ font: '600 16px/22px var(--font-mono)', color: 'var(--text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>08h 00m</div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button style={{ width: '100%' }}>Check out</Button>
              <Button variant="outline" style={{ width: '100%' }}>Take a break</Button>
            </div>
          </div>

          {/* Calendar */}
          <div className="card" style={{ padding: 20 }}>
            <div className="cal">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} className="cal-head">{d}</div>
              ))}
              {cells.map((c, i) => (
                <div key={i} className={window.UI.cx('cal-day', c.out && 'out', c.today && 'today')}>
                  {c.out ? null : (
                    <>
                      <div className="num">{c.d}</div>
                      {c.status && c.status !== 'weekend' && (
                        <span className={`status-pill status-${c.status}`}>{STATUS_LABELS[c.status]}</span>
                      )}
                      {c.status === 'weekend' && <span style={{ font: '500 10px/14px var(--font-sans)', color: 'var(--text-disabled)', marginTop: 'auto' }}>—</span>}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
              <Badge variant="success" dot>Present</Badge>
              <Badge variant="info" dot>WFH</Badge>
              <Badge variant="warning" dot>Leave</Badge>
              <Badge variant="danger" dot>Absent</Badge>
              <span className="badge" style={{ background: 'hsla(280, 60%, 55%, 0.12)', color: 'hsl(280 60% 50%)' }}><span className="dot" />Holiday</span>
              <span style={{ marginLeft: 'auto', font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>Click a day to see details</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.AttendanceScreen = AttendanceScreen;
