/**
 * PayrollScreen — Phase 2. HR run-payroll workflow + payslip table.
 * Tabs: Run Payroll · History · Employee Payslips · Settings
 */

function PayFormRow({ label, help, children }) {
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

function PayrollSettings() {
  const { Button, Badge, Input, SelectTrigger, Switch, Checkbox } = window.UI;
  const I = window.Icons;

  const components = [
    { name: 'Basic',              type: 'Earning',   calc: '% of CTC',   value: '50%',  ctc: true,  system: true },
    { name: 'House Rent (HRA)',   type: 'Earning',   calc: '% of Basic', value: '40%',  ctc: true,  system: false },
    { name: 'Special Allowance',  type: 'Earning',   calc: 'Balancing',  value: 'Auto', ctc: true,  system: false },
    { name: 'Conveyance',         type: 'Earning',   calc: 'Flat',       value: '₹1,600', ctc: true, system: false },
    { name: 'Provident Fund',     type: 'Deduction', calc: '% of Basic', value: '12%',  ctc: false, system: true },
    { name: 'Professional Tax',   type: 'Deduction', calc: 'Slab',       value: '₹200', ctc: false, system: true },
    { name: 'TDS',                type: 'Deduction', calc: 'Computed',   value: 'Auto', ctc: false, system: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Salary structure */}
      <div className="section-card">
        <div className="section-card-head">
          <div className="title">Salary structure · {components.length} components</div>
          <Button variant="outline" size="xs" icon={<I.Plus />}>Add component</Button>
        </div>
        <div className="section-card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Type</th>
                <th>Calculation</th>
                <th style={{ textAlign: 'right' }}>Value</th>
                <th style={{ textAlign: 'center' }}>In CTC</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{c.name}</span>
                      {c.system && <span className="badge badge-secondary" style={{ fontSize: 10 }}>System</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 12px/16px var(--font-sans)', color: c.type === 'Earning' ? 'var(--success-500)' : 'var(--danger-500)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'currentColor' }} />{c.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.calc}</td>
                  <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.value}</td>
                  <td style={{ textAlign: 'center' }}>
                    {c.ctc ? <I.Check size={15} style={{ color: 'var(--success-500)' }} /> : <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-icon-xs" disabled={c.system} style={c.system ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
                      <I.MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory & tax */}
      <div className="section-card">
        <div className="section-card-head"><div className="title">Statutory & tax</div></div>
        <div className="section-card-body" style={{ paddingTop: 4 }}>
          <PayFormRow label="Provident Fund (EPF)" help="Employer + employee contribution at 12% of basic.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Switch checked />
              <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--success-500)' }}>Enabled</span>
              <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>· UAN linked</span>
            </div>
          </PayFormRow>
          <PayFormRow label="Employee State Insurance" help="Applies to employees earning ≤ ₹21,000/month.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Switch checked />
              <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--success-500)' }}>Enabled</span>
            </div>
          </PayFormRow>
          <PayFormRow label="Professional Tax" help="State-specific. Deducted per the Karnataka slab.">
            <SelectTrigger value="Karnataka" style={{ maxWidth: 220 }} />
          </PayFormRow>
          <PayFormRow label="TDS computation" help="Income-tax deducted at source each cycle.">
            <SelectTrigger value="New regime (default)" style={{ maxWidth: 260 }} />
          </PayFormRow>
          <PayFormRow label="Gratuity provision" help="Accrue 4.81% of basic toward gratuity.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Switch checked={false} />
              <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-tertiary)' }}>Off</span>
            </div>
          </PayFormRow>
        </div>
      </div>

      {/* Processing rules */}
      <div className="section-card">
        <div className="section-card-head"><div className="title">Processing rules</div></div>
        <div className="section-card-body" style={{ paddingTop: 4 }}>
          <PayFormRow label="Pay frequency">
            <SelectTrigger value="Monthly" style={{ maxWidth: 200 }} />
          </PayFormRow>
          <PayFormRow label="Pay day" help="Day of month salaries are credited.">
            <SelectTrigger value="Last working day" style={{ maxWidth: 220 }} />
          </PayFormRow>
          <PayFormRow label="Payment method">
            <SelectTrigger value="Bank transfer (NEFT)" style={{ maxWidth: 240 }} />
          </PayFormRow>
          <PayFormRow label="Net pay rounding" help="Round each payslip's net to the nearest rupee.">
            <SelectTrigger value="Nearest ₹1" style={{ maxWidth: 180 }} />
          </PayFormRow>
          <PayFormRow label="Auto-release payslips" help="Publish to employees once a cycle is locked.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '400 13px/18px var(--font-sans)' }}><Checkbox checked />Email payslip PDF</label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '400 13px/18px var(--font-sans)' }}><Checkbox checked />Notify in-app</label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '400 13px/18px var(--font-sans)' }}><Checkbox />Require employee acknowledgement</label>
            </div>
          </PayFormRow>
          <PayFormRow label="Lock after processing" help="Prevent edits to a cycle once it's processed.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Switch checked />
              <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--success-500)' }}>On</span>
            </div>
          </PayFormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 20 }}>
            <Button variant="outline" size="sm">Cancel</Button>
            <Button size="sm">Save settings</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayrollScreen() {
  const { Button, Badge, Avatar, SelectTrigger } = window.UI;
  const I = window.Icons;
  const StatsCard = window.StatsCard;
  const [tab, setTab] = React.useState('run');

  const fmt = (n) => '₹' + n.toLocaleString('en-IN');

  const payroll = [
    { name: 'Priya Sharma',   dept: 'Engineering', basic: 50000, allow: 8000, deduc: 6500, status: 'Processed' },
    { name: 'Aman Khanna',    dept: 'Engineering', basic: 60000, allow: 9000, deduc: 7600, status: 'Processed' },
    { name: 'Rohan Mehta',    dept: 'Sales',       basic: 42000, allow: 7000, deduc: 5700, status: 'Processed' },
    { name: 'Nisha Iyer',     dept: 'Product',     basic: 55000, allow: 9000, deduc: 7100, status: 'Pending' },
    { name: 'Vikram Singh',   dept: 'Engineering', basic: 85000, allow: 14000, deduc: 11400, status: 'Processed' },
    { name: 'Asha Joshi',     dept: 'Finance',     basic: 48000, allow: 7500, deduc: 6300, status: 'Processed' },
    { name: 'Sneha Rao',      dept: 'Operations',  basic: 62000, allow: 9500, deduc: 8200, status: 'Hold' },
  ];
  const totals = payroll.reduce((a, r) => ({
    gross: a.gross + r.basic + r.allow,
    net:   a.net + r.basic + r.allow - r.deduc,
  }), { gross: 0, net: 0 });

  const STATUS = {
    Processed: { color: 'var(--status-approved)', label: 'Processed' },
    Pending:   { color: 'var(--status-pending)',  label: 'Pending' },
    Hold:      { color: 'var(--status-rejected)', label: 'Hold' },
  };

  return (
    <>
      <window.PageHeader
        title="Payroll"
        description="Run monthly payroll, manage payslips, and configure components."
        breadcrumbs={[{ label: 'Payroll' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<I.Download />}>Export</Button>
            <Button size="sm" icon={<I.Wallet />}>Run payroll</Button>
          </>
        }
      />
      <div className="ems-page">
        <div className="tabs">
          {[
            ['run', 'Run payroll'],
            ['history', 'History'],
            ['slips', 'Payslips'],
            ['settings', 'Settings'],
          ].map(([k, l]) => (
            <button key={k} type="button" className={window.UI.cx('tab', tab === k && 'active')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'run' && (
          <>
            {/* Month selector */}
            <div className="toolbar">
              <span style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-secondary)' }}>Cycle</span>
              <SelectTrigger value="June 2026" style={{ width: 200 }} />
              <span className="badge badge-warning" style={{ marginLeft: 4 }}>Draft</span>
              <div style={{ flex: 1 }} />
              <Button variant="outline" size="sm">Hold cycle</Button>
              <Button size="sm" icon={<I.Check />}>Process & lock</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <StatsCard label="Employees in cycle" value={payroll.length} icon={<I.Users />} accent="var(--brand-500)" />
              <StatsCard label="Total gross"        value={fmt(totals.gross)} icon={<I.Wallet />} accent="var(--success-500)" sub="−1.2% vs May" />
              <StatsCard label="Total net"          value={fmt(totals.net)} icon={<I.Download />} accent="var(--dept-finance)" />
              <StatsCard label="Pending review"     value={payroll.filter((r) => r.status !== 'Processed').length} icon={<I.ClipboardList />} accent="var(--warning-500)" sub="2 to resolve" tone="warning" />
            </div>

            <div className="section-card">
              <div className="section-card-head">
                <div className="title">June 2026 payroll · {payroll.length} employees</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="xs">Recalculate</Button>
                  <Button variant="outline" size="xs" icon={<I.Filter />}>Filter</Button>
                </div>
              </div>
              <div className="section-card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'right' }}>Basic</th>
                      <th style={{ textAlign: 'right' }}>Allowances</th>
                      <th style={{ textAlign: 'right' }}>Deductions</th>
                      <th style={{ textAlign: 'right' }}>Net pay</th>
                      <th>Status</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.map((r) => {
                      const net = r.basic + r.allow - r.deduc;
                      const meta = STATUS[r.status];
                      return (
                        <tr key={r.name}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar size="sm" name={r.name} />
                              <span style={{ font: '500 13px/18px var(--font-sans)' }}>{r.name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{r.dept}</td>
                          <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmt(r.basic)}</td>
                          <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success-500)' }}>+{fmt(r.allow)}</td>
                          <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger-500)' }}>−{fmt(r.deduc)}</td>
                          <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{fmt(net)}</td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: meta.color, font: '500 12px/16px var(--font-sans)' }}>
                              <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'currentColor' }} />
                              {meta.label}
                            </span>
                          </td>
                          <td><button className="btn btn-ghost btn-icon-xs"><I.MoreHorizontal size={14} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="section-card">
            <div className="section-card-head"><div className="title">Past cycles</div></div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead><tr><th>Cycle</th><th>Run on</th><th>Employees</th><th style={{ textAlign: 'right' }}>Net paid</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {[
                    ['May 2026', 'May 31, 2026', 7,  fmt(396200), 'Closed'],
                    ['Apr 2026', 'Apr 30, 2026', 7,  fmt(394800), 'Closed'],
                    ['Mar 2026', 'Mar 31, 2026', 6,  fmt(338500), 'Closed'],
                    ['Feb 2026', 'Feb 28, 2026', 6,  fmt(338500), 'Closed'],
                  ].map(([cycle, when, emp, net, status]) => (
                    <tr key={cycle}>
                      <td style={{ font: '500 13px/18px var(--font-sans)' }}>{cycle}</td>
                      <td className="mono" style={{ color: 'var(--text-secondary)' }}>{when}</td>
                      <td className="num">{emp}</td>
                      <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{net}</td>
                      <td><Badge variant="success" dot>{status}</Badge></td>
                      <td><Button variant="link" size="xs">View report</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'slips' && (
          <div className="section-card">
            <div className="section-card-head"><div className="title">My payslips</div></div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead><tr><th>Cycle</th><th style={{ textAlign: 'right' }}>Net pay</th><th>Issued</th><th style={{ textAlign: 'right' }}></th></tr></thead>
                <tbody>
                  {['Jun 2026','May 2026','Apr 2026','Mar 2026','Feb 2026'].map((m, i) => (
                    <tr key={m}>
                      <td style={{ font: '500 13px/18px var(--font-sans)' }}>{m}</td>
                      <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(51500 + i * 200)}</td>
                      <td className="mono" style={{ color: 'var(--text-tertiary)' }}>PSL-2026-{6 - i}-A19</td>
                      <td style={{ textAlign: 'right' }}><Button variant="outline" size="xs" icon={<I.Download />}>PDF</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && <PayrollSettings />}
      </div>
    </>
  );
}

window.PayrollScreen = PayrollScreen;
