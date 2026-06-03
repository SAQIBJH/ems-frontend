/**
 * AssetsScreen — Phase 2. IT asset register: what's assigned to whom,
 * what's in stock, and what's due for return. Static click-thru fidelity.
 * Tabs: Inventory · Assigned · Requests
 */

const ASSET_STATUS = {
  Assigned:   { variant: 'info',      dot: true },
  Available:  { variant: 'success',   dot: true },
  Repair:     { variant: 'warning',   dot: true },
  Retired:    { variant: 'secondary', dot: true },
};

const ASSET_ICONS = {
  Laptop: 'Laptop', Monitor: 'Monitor', Phone: 'Smartphone', Other: 'Box',
};

function AssetGlyph({ kind }) {
  const I = window.Icons;
  const Cmp = I[ASSET_ICONS[kind] || 'Box'];
  return (
    <span style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', flexShrink: 0 }}>
      <Cmp size={16} />
    </span>
  );
}

function AssetsScreen() {
  const { Button, Badge, Avatar, SelectTrigger } = window.UI;
  const I = window.Icons;
  const StatsCard = window.StatsCard;
  const [tab, setTab] = React.useState('inventory');

  const inventory = [
    { tag: 'LAP-0192', name: 'MacBook Pro 14" M3',   kind: 'Laptop',  status: 'Assigned',  holder: 'Priya Sharma',  since: 'Jan 2025' },
    { tag: 'LAP-0188', name: 'MacBook Air 13" M2',    kind: 'Laptop',  status: 'Assigned',  holder: 'Rohan Mehta',   since: 'Nov 2024' },
    { tag: 'MON-0451', name: 'Dell U2723QE 27"',      kind: 'Monitor', status: 'Assigned',  holder: 'Vikram Singh',  since: 'Mar 2025' },
    { tag: 'LAP-0205', name: 'ThinkPad X1 Carbon',    kind: 'Laptop',  status: 'Available', holder: null,            since: '—' },
    { tag: 'PHN-0077', name: 'iPhone 15 Pro',         kind: 'Phone',   status: 'Assigned',  holder: 'Sneha Rao',     since: 'Feb 2025' },
    { tag: 'MON-0460', name: 'LG 32UN880 32"',        kind: 'Monitor', status: 'Repair',    holder: null,            since: '—' },
    { tag: 'LAP-0150', name: 'MacBook Pro 16" M1',    kind: 'Laptop',  status: 'Retired',   holder: null,            since: '—' },
    { tag: 'PHN-0070', name: 'Pixel 8',               kind: 'Phone',   status: 'Available', holder: null,            since: '—' },
  ];

  const assigned = inventory.filter((a) => a.status === 'Assigned');

  const requests = [
    { who: 'Nisha Iyer',    item: 'Monitor — 27" 4K',       reason: 'New hire setup',      date: 'May 27', status: 'Pending' },
    { who: 'Karan Mehra',   item: 'Laptop — MacBook Pro 14"', reason: 'Device end-of-life',  date: 'May 26', status: 'Pending' },
    { who: 'Asha Joshi',    item: 'Phone — iPhone 15',       reason: 'Field role',          date: 'May 24', status: 'Approved' },
    { who: 'Devansh Patel', item: 'Dock — Thunderbolt 4',    reason: 'Desk upgrade',        date: 'May 22', status: 'Fulfilled' },
  ];

  const REQ_STATUS = {
    Pending:   { variant: 'warning',   dot: true },
    Approved:  { variant: 'info',      dot: true },
    Fulfilled: { variant: 'success',   dot: true },
  };

  return (
    <>
      <window.PageHeader
        title="Assets"
        description="Track company hardware — what's assigned, available, and in for repair."
        breadcrumbs={[{ label: 'Assets' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<I.Download />}>Export</Button>
            <Button size="sm" icon={<I.Plus />}>Add Asset</Button>
          </>
        }
      />

      <div className="ems-page">
        <div className="tabs">
          {[
            ['inventory', 'Inventory'],
            ['assigned', 'Assigned'],
            ['requests', 'Requests'],
          ].map(([k, l]) => (
            <button key={k} type="button" className={window.UI.cx('tab', tab === k && 'active')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatsCard label="Total assets"    value="248" icon={<I.Box />}        accent="var(--brand-500)" sub="across 4 sites" />
          <StatsCard label="Assigned"        value="201" icon={<I.Laptop />}     accent="var(--dept-engineering)" sub="81% utilization" />
          <StatsCard label="Available"       value="38"  icon={<I.Check />}      accent="var(--success-500)" sub="ready to deploy" tone="positive" />
          <StatsCard label="In repair"       value="9"   icon={<I.AlertCircle />} accent="var(--warning-500)" sub="avg 6d turnaround" tone="warning" />
        </div>

        {tab === 'inventory' && (
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Asset register · {inventory.length}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <SelectTrigger value="All types" style={{ width: 150 }} />
                <SelectTrigger value="All statuses" style={{ width: 160 }} />
                <Button variant="outline" size="xs" icon={<I.Filter />}>Filter</Button>
              </div>
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Tag</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Assigned to</th>
                    <th>Since</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((a) => {
                    const st = ASSET_STATUS[a.status];
                    return (
                      <tr key={a.tag}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <AssetGlyph kind={a.kind} />
                            <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{a.name}</span>
                          </div>
                        </td>
                        <td className="mono" style={{ color: 'var(--text-tertiary)' }}>{a.tag}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{a.kind}</td>
                        <td><Badge variant={st.variant} dot={st.dot}>{a.status}</Badge></td>
                        <td>
                          {a.holder
                            ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar size="sm" name={a.holder} /><span style={{ font: '400 13px/18px var(--font-sans)' }}>{a.holder}</span></div>
                            : <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{a.since}</td>
                        <td><button className="btn btn-ghost btn-icon-xs"><I.MoreHorizontal size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'assigned' && (
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Assigned hardware · {assigned.length}</div>
              <Button variant="outline" size="xs" icon={<I.Filter />}>Filter</Button>
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Asset</th>
                    <th>Tag</th>
                    <th>Assigned since</th>
                    <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assigned.map((a) => (
                    <tr key={a.tag}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar size="sm" name={a.holder} />
                          <span style={{ font: '500 13px/18px var(--font-sans)' }}>{a.holder}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <AssetGlyph kind={a.kind} />
                          <span style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{a.name}</span>
                        </div>
                      </td>
                      <td className="mono" style={{ color: 'var(--text-tertiary)' }}>{a.tag}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{a.since}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Button variant="outline" size="xs">Recall</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'requests' && (
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Asset requests · {requests.length}</div>
              <SelectTrigger value="All statuses" style={{ width: 160 }} />
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Requested by</th>
                    <th>Item</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ width: 160, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const st = REQ_STATUS[r.status];
                    return (
                      <tr key={r.who + r.item}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar size="sm" name={r.who} />
                            <span style={{ font: '500 13px/18px var(--font-sans)' }}>{r.who}</span>
                          </div>
                        </td>
                        <td style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{r.item}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.reason}</td>
                        <td className="mono" style={{ color: 'var(--text-secondary)' }}>{r.date}</td>
                        <td><Badge variant={st.variant} dot={st.dot}>{r.status}</Badge></td>
                        <td style={{ textAlign: 'right' }}>
                          {r.status === 'Pending'
                            ? <div style={{ display: 'inline-flex', gap: 6 }}>
                                <Button variant="outline" size="xs">Decline</Button>
                                <Button size="xs">Approve</Button>
                              </div>
                            : <Button variant="ghost" size="xs">View</Button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

window.AssetsScreen = AssetsScreen;
