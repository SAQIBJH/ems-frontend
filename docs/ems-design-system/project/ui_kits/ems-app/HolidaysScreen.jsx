/**
 * HolidaysScreen — year calendar of company holidays with type colors.
 * 12 mini-month grids; holidays light up by category.
 */

const HOLIDAY_TYPES = {
  National:  { color: 'var(--dept-engineering)', label: 'National' },
  Religious: { color: 'var(--dept-product)',     label: 'Religious' },
  Regional:  { color: 'var(--dept-finance)',     label: 'Regional' },
  Company:   { color: 'var(--dept-sales)',       label: 'Company' },
  Optional:  { color: 'var(--text-tertiary)',    label: 'Optional' },
};

const HOLIDAYS_2026 = [
  { date: '2026-01-26', name: 'Republic Day',         type: 'National',  region: 'India' },
  { date: '2026-03-06', name: 'Holi',                 type: 'Religious', region: 'India' },
  { date: '2026-04-03', name: 'Good Friday',          type: 'Religious', region: 'Worldwide' },
  { date: '2026-05-01', name: 'Labour Day',           type: 'National',  region: 'Worldwide' },
  { date: '2026-08-15', name: 'Independence Day',     type: 'National',  region: 'India' },
  { date: '2026-09-07', name: 'Ganesh Chaturthi',     type: 'Religious', region: 'India' },
  { date: '2026-10-02', name: 'Gandhi Jayanti',       type: 'National',  region: 'India' },
  { date: '2026-10-20', name: 'Diwali',               type: 'Religious', region: 'India' },
  { date: '2026-11-04', name: 'All-hands offsite',    type: 'Company',   region: 'All offices' },
  { date: '2026-11-27', name: 'Thanksgiving (US)',    type: 'Regional',  region: 'US office' },
  { date: '2026-12-24', name: 'Christmas Eve (opt.)', type: 'Optional',  region: 'Worldwide' },
  { date: '2026-12-25', name: 'Christmas Day',        type: 'Religious', region: 'Worldwide' },
  { date: '2026-12-31', name: 'New Year\u2019s Eve (half day)', type: 'Company', region: 'Worldwide' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MiniMonth({ year, monthIdx, holidays, onPick, today }) {
  const first = new Date(year, monthIdx, 1).getDay();
  const days = new Date(year, monthIdx + 1, 0).getDate();
  const holidayByDay = {};
  holidays.forEach((h) => {
    const [hy, hm, hd] = h.date.split('-').map(Number);
    if (hy === year && hm - 1 === monthIdx) holidayByDay[hd] = h;
  });
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ font: '600 13px/18px var(--font-sans)' }}>{MONTH_NAMES[monthIdx]} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{year}</span></div>
        <span style={{ font: '500 11px/14px var(--font-mono)', color: 'var(--text-tertiary)' }}>{Object.keys(holidayByDay).length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, font: '500 10px/14px var(--font-sans)' }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 2 }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />;
          const h = holidayByDay[d];
          const isToday = today.getFullYear() === year && today.getMonth() === monthIdx && today.getDate() === d;
          return (
            <button
              key={i}
              type="button"
              onClick={() => h && onPick(h)}
              disabled={!h}
              title={h?.name}
              style={{
                aspectRatio: '1',
                display: 'grid', placeItems: 'center',
                font: '500 11px/14px var(--font-sans)',
                border: isToday ? '1.5px solid var(--brand-500)' : '1px solid transparent',
                borderRadius: 6,
                color: h ? '#fff' : 'var(--text-secondary)',
                background: h ? HOLIDAY_TYPES[h.type].color : 'transparent',
                cursor: h ? 'pointer' : 'default',
                transition: 'transform 120ms',
                fontVariantNumeric: 'tabular-nums',
              }}
              onMouseOver={(e) => { if (h) e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = ''; }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HolidaysScreen() {
  const { Button, Avatar } = window.UI;
  const I = window.Icons;
  const [picked, setPicked] = React.useState(HOLIDAYS_2026.find((h) => h.date === '2026-05-01'));
  const today = new Date(2026, 4, 27);

  return (
    <>
      <window.PageHeader
        title="Holidays"
        description="Company holiday calendar for 2026."
        breadcrumbs={[{ label: 'Holidays' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<I.ExternalLink />}>Import .ics</Button>
            <Button size="sm" icon={<I.Plus />}>Add holiday</Button>
          </>
        }
      />
      <div className="ems-page">
        {/* Type legend */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(HOLIDAY_TYPES).map(([k, m]) => (
            <span key={k} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 12px', borderRadius: 9999,
              background: `color-mix(in oklab, ${m.color} 14%, transparent)`,
              color: m.color, font: '500 12px/16px var(--font-sans)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'currentColor' }} />
              {m.label}
              <span style={{ color: 'currentColor', opacity: 0.7, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {HOLIDAYS_2026.filter((h) => h.type === k).length}
              </span>
            </span>
          ))}
        </div>

        {/* Year grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <MiniMonth key={i} year={2026} monthIdx={i} holidays={HOLIDAYS_2026} onPick={setPicked} today={today} />
          ))}
        </div>

        {/* Holiday list */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="section-card">
            <div className="section-card-head"><div className="title">All holidays · 2026</div></div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>Date</th>
                    <th>Holiday</th>
                    <th>Type</th>
                    <th>Region</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {HOLIDAYS_2026.map((h) => {
                    const m = HOLIDAY_TYPES[h.type];
                    const d = new Date(h.date);
                    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const isPast = d < today;
                    return (
                      <tr key={h.date} style={{ opacity: isPast ? 0.55 : 1 }} onClick={() => setPicked(h)}>
                        <td>
                          <div style={{ font: '500 13px/18px var(--font-mono)', color: 'var(--text-primary)' }}>{formatted}</div>
                          <div style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)' }}>{dayOfWeek}</div>
                        </td>
                        <td>
                          <span style={{ font: '500 13px/18px var(--font-sans)' }}>{h.name}</span>
                          {isPast && <span style={{ marginLeft: 8, font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)' }}>past</span>}
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: m.color, font: '500 12px/16px var(--font-sans)' }}>
                            <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'currentColor' }} />
                            {m.label}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{h.region}</td>
                        <td><button className="btn btn-ghost btn-icon-xs"><I.MoreHorizontal size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail card for picked holiday */}
          <div className="section-card">
            <div className="section-card-head"><div className="title">Selected</div></div>
            <div className="section-card-body">
              {picked && (() => {
                const m = HOLIDAY_TYPES[picked.type];
                const d = new Date(picked.date);
                return (
                  <>
                    <div style={{
                      padding: '20px 16px',
                      borderRadius: 12,
                      background: `color-mix(in oklab, ${m.color} 12%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${m.color} 22%, transparent)`,
                      textAlign: 'center',
                    }}>
                      <div style={{ font: '500 11px/14px var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em', color: m.color, marginBottom: 6 }}>
                        {m.label}
                      </div>
                      <div style={{ font: '600 28px/34px var(--font-sans)', color: 'var(--text-primary)' }}>{picked.name}</div>
                      <div style={{ font: '500 14px/20px var(--font-mono)', color: 'var(--text-secondary)', marginTop: 6 }}>
                        {d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ marginTop: 16, font: '400 13px/20px var(--font-sans)', color: 'var(--text-secondary)' }}>
                      Applies to <strong style={{ color: 'var(--text-primary)' }}>{picked.region}</strong>. Eligible employees will see this as a non-working day on their attendance calendar.
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                      <Button variant="outline" size="sm" style={{ flex: 1 }}>Edit</Button>
                      <Button variant="outline" size="sm" style={{ flex: 1 }}>Remove</Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.HolidaysScreen = HolidaysScreen;
