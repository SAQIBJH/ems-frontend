/**
 * LeaveScreen — manager approvals queue + leave balance breakdown.
 * Replicates the /(dashboard)/leave route and the BulkApproveModal interaction.
 */

const LEAVE_TYPE_META = {
  Casual:      { color: 'var(--leave-casual)',      label: 'Casual' },
  Sick:        { color: 'var(--leave-sick)',        label: 'Sick' },
  Earned:      { color: 'var(--leave-earned)',      label: 'Earned' },
  Parental:    { color: 'var(--leave-parental)',    label: 'Parental' },
  Bereavement: { color: 'var(--leave-bereavement)', label: 'Bereavement' },
  CompOff:     { color: 'var(--leave-comp-off)',    label: 'Comp off' },
  Unpaid:      { color: 'var(--leave-unpaid)',      label: 'Unpaid' },
};

const STATUS_META = {
  Pending:   { color: 'var(--status-pending)',   label: 'Pending' },
  Approved:  { color: 'var(--status-approved)',  label: 'Approved' },
  Rejected:  { color: 'var(--status-rejected)',  label: 'Rejected' },
  Withdrawn: { color: 'var(--status-withdrawn)', label: 'Withdrawn' },
};

function ColorPill({ color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: `color-mix(in oklab, ${color} 14%, transparent)`,
      color, font: '500 12px/16px var(--font-sans)',
      padding: '2px 8px', borderRadius: 9999,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'currentColor' }} />
      {children}
    </span>
  );
}

function LeaveScreen() {
  const { Button, Avatar, Checkbox } = window.UI;
  const I = window.Icons;
  const StatsCard = window.StatsCard;

  const [selected, setSelected] = React.useState(new Set());
  const [tab, setTab] = React.useState('pending');

  const requests = [
    { id: 'lr-001', who: 'Rohan Mehta',    dept: 'Sales',       type: 'Casual',   from: 'May 28', to: 'May 30', days: 3,  reason: 'Family wedding', status: 'Pending', created: '2 days ago' },
    { id: 'lr-002', who: 'Nisha Iyer',     dept: 'Product',     type: 'Sick',     from: 'May 27', to: 'May 27', days: 1,  reason: 'Fever',          status: 'Pending', created: 'today' },
    { id: 'lr-003', who: 'Devansh Patel',  dept: 'Engineering', type: 'Earned',   from: 'Jun 2',  to: 'Jun 6',  days: 5,  reason: 'Vacation',       status: 'Pending', created: '4 days ago' },
    { id: 'lr-004', who: 'Maya Rangan',    dept: 'Legal',       type: 'Parental', from: 'Jun 15', to: 'Aug 14', days: 60, reason: 'Maternity leave',status: 'Pending', created: '1 week ago' },
    { id: 'lr-005', who: 'Karan Mehra',    dept: 'Sales',       type: 'CompOff',  from: 'Jun 3',  to: 'Jun 3',  days: 1,  reason: 'Worked Sat May 24', status: 'Pending', created: '3 days ago' },
  ];

  const recent = [
    { id: 'lr-100', who: 'Asha Joshi',     type: 'Earned',  from: 'May 12', to: 'May 16', days: 5, status: 'Approved' },
    { id: 'lr-101', who: 'Vikram Singh',   type: 'Casual',  from: 'May 8',  to: 'May 8',  days: 1, status: 'Approved' },
    { id: 'lr-102', who: 'Sneha Rao',      type: 'Sick',    from: 'May 5',  to: 'May 6',  days: 2, status: 'Approved' },
    { id: 'lr-103', who: 'Karan Mehra',    type: 'Unpaid',  from: 'Apr 28', to: 'Apr 30', days: 3, status: 'Rejected' },
  ];

  const rows = tab === 'pending' ? requests : recent;
  const allSelected = rows.length && rows.every((r) => selected.has(r.id));
  function toggle(id) {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n);
  }
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  // Balance breakdown (donut)
  const balance = [
    { type: 'Casual',   used: 4,  total: 12, color: 'var(--leave-casual)' },
    { type: 'Sick',     used: 2,  total: 8,  color: 'var(--leave-sick)' },
    { type: 'Earned',   used: 6,  total: 20, color: 'var(--leave-earned)' },
    { type: 'Parental', used: 0,  total: 60, color: 'var(--leave-parental)' },
  ];

  return (
    <>
      <window.PageHeader
        title="Leave"
        description="Requests, approvals, and balance breakdown for your team."
        breadcrumbs={[{ label: 'Leave' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<I.ExternalLink />}>Export</Button>
            <Button size="sm" icon={<I.CalendarPlus />}>Request leave</Button>
          </>
        }
      />

      <div className="ems-page">
        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatsCard label="Pending approvals" value="5"  icon={<I.ClipboardList />} accent="var(--warning-500)" sub="2 over 48h" tone="warning" />
          <StatsCard label="On leave today"    value="42" icon={<I.CalendarOff />}   accent="var(--leave-casual)" sub="3.4% of team" />
          <StatsCard label="Avg approval time" value="7h" icon={<I.Clock />}         accent="var(--success-500)" sub="−2h vs last month" tone="positive" />
          <StatsCard label="Comp-off pending"  value="3"  icon={<I.Check />}         accent="var(--leave-comp-off)" sub="from May weekend work" />
        </div>

        {/* Layout: queue + balance */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          {/* Queue */}
          <div className="section-card">
            <div className="section-card-head" style={{ padding: '0 20px' }}>
              <div className="tabs" style={{ border: 'none', margin: 0 }}>
                <button type="button" className={window.UI.cx('tab', tab === 'pending' && 'active')} onClick={() => { setTab('pending'); setSelected(new Set()); }}>
                  Pending <span className="badge badge-warning" style={{ marginLeft: 6 }}>5</span>
                </button>
                <button type="button" className={window.UI.cx('tab', tab === 'recent' && 'active')} onClick={() => { setTab('recent'); setSelected(new Set()); }}>
                  Recent
                </button>
              </div>
              {selected.size > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                  <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-secondary)' }}>{selected.size} selected</span>
                  <Button variant="outline" size="sm">Reject</Button>
                  <Button size="sm" icon={<I.Check />}>Approve all</Button>
                </div>
              ) : <div />}
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    {tab === 'pending' && <th style={{ width: 40 }}><Checkbox checked={allSelected} onChange={toggleAll} /></th>}
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    {tab === 'pending'
                      ? <th style={{ width: 180, textAlign: 'right' }}>Actions</th>
                      : <th>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const typeMeta = LEAVE_TYPE_META[r.type] || { color: 'var(--text-tertiary)', label: r.type };
                    const statusMeta = STATUS_META[r.status];
                    return (
                      <tr key={r.id}>
                        {tab === 'pending' && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                          </td>
                        )}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar size="sm" name={r.who} />
                            <div>
                              <div style={{ font: '500 13px/18px var(--font-sans)' }}>{r.who}</div>
                              {r.dept && <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>{r.dept}</div>}
                            </div>
                          </div>
                        </td>
                        <td><ColorPill color={typeMeta.color}>{typeMeta.label}</ColorPill></td>
                        <td>
                          <div style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{r.from} – {r.to}</div>
                          <div style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)' }}>{r.days} {r.days === 1 ? 'day' : 'days'}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.reason || '—'}</td>
                        {tab === 'pending' ? (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <Button variant="outline" size="xs">Deny</Button>
                              <Button size="xs" icon={<I.Check />}>Approve</Button>
                            </div>
                          </td>
                        ) : (
                          <td><ColorPill color={statusMeta.color}>{statusMeta.label}</ColorPill></td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance */}
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">My balance</div>
              <span style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2026</span>
            </div>
            <div className="section-card-body">
              {balance.map((b) => {
                const left = b.total - b.used;
                return (
                  <div key={b.type} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: b.color }} />
                        <span style={{ font: '500 13px/18px var(--font-sans)' }}>{b.type}</span>
                      </span>
                      <span style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{left}</strong> / {b.total} days
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-surface-2)', borderRadius: 9999, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(b.used / b.total) * 100}%`, background: b.color, borderRadius: 9999 }} />
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" style={{ width: '100%', marginTop: 4 }} icon={<I.CalendarPlus />}>
                Request leave
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.LeaveScreen = LeaveScreen;
