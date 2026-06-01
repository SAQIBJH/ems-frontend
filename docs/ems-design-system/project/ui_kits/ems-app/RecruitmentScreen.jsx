/**
 * RecruitmentScreen — Phase 2. Applicant tracking: pipeline board, open
 * requisitions, and the candidate list. Mirrors the shell + primitives used
 * across the EMS app; pipeline is a static kanban (cards don't drag).
 * Tabs: Pipeline · Openings · Candidates
 */

const RECRUIT_STAGES = [
  { key: 'applied',   label: 'Applied',     color: 'var(--dept-engineering)' },
  { key: 'screening', label: 'Screening',   color: 'var(--info-500)' },
  { key: 'interview', label: 'Interview',   color: 'var(--warning-500)' },
  { key: 'offer',     label: 'Offer',       color: 'var(--dept-product)' },
  { key: 'hired',     label: 'Hired',       color: 'var(--success-500)' },
];

function RecruitDot({ color }) {
  return <span style={{ width: 7, height: 7, borderRadius: 9999, background: color, flexShrink: 0 }} />;
}

function Rating({ value }) {
  const I = window.Icons;
  return (
    <span style={{ display: 'inline-flex', gap: 1 }} title={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <I.Star
          key={n}
          size={12}
          style={{
            color: n <= value ? 'var(--warning-500)' : 'var(--border-strong)',
            fill: n <= value ? 'var(--warning-500)' : 'none',
          }}
        />
      ))}
    </span>
  );
}

function CandidateCard({ c }) {
  const { Avatar } = window.UI;
  const I = window.Icons;
  return (
    <div
      className="recruit-card"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        transition: 'border-color 120ms var(--ease-out), background 120ms var(--ease-out)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Avatar size="sm" name={c.name} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{c.name}</div>
          <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Rating value={c.rating} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '500 11px/14px var(--font-sans)', color: 'var(--text-tertiary)' }}>
          <I.Clock size={12} />{c.days}d
        </span>
      </div>
      {c.tag && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            font: '500 11px/14px var(--font-mono)', color: 'var(--text-secondary)',
            background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)', padding: '2px 6px',
          }}>{c.tag}</span>
          {c.referred && (
            <span style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--brand-500)' }}>Referral</span>
          )}
        </div>
      )}
    </div>
  );
}

function RecruitmentScreen() {
  const { Button, Badge, Avatar, SelectTrigger } = window.UI;
  const I = window.Icons;
  const StatsCard = window.StatsCard;
  const [tab, setTab] = React.useState('pipeline');

  // Candidates grouped by stage
  const pipeline = {
    applied: [
      { name: 'Ishaan Verma',  role: 'Frontend Engineer',     rating: 0, days: 1, tag: 'ENG-204' },
      { name: 'Tara Krishnan', role: 'Frontend Engineer',     rating: 0, days: 2, tag: 'ENG-204', referred: true },
      { name: 'Omar Sheikh',   role: 'Product Designer',      rating: 0, days: 1, tag: 'DES-118' },
      { name: 'Leah Goldberg',  role: 'Frontend Engineer',    rating: 0, days: 3, tag: 'ENG-204' },
    ],
    screening: [
      { name: 'Diego Alvarez', role: 'Backend Engineer',      rating: 3, days: 4, tag: 'ENG-201' },
      { name: 'Hana Sato',     role: 'Product Designer',      rating: 4, days: 2, tag: 'DES-118' },
      { name: 'Mateo Rossi',   role: 'Backend Engineer',      rating: 3, days: 5, tag: 'ENG-201' },
    ],
    interview: [
      { name: 'Fatima Noor',   role: 'Senior Backend Engineer', rating: 4, days: 6, tag: 'ENG-198', referred: true },
      { name: 'Yuki Tanaka',   role: 'Product Designer',      rating: 5, days: 3, tag: 'DES-118' },
    ],
    offer: [
      { name: 'Carlos Mendez', role: 'Senior Backend Engineer', rating: 5, days: 2, tag: 'ENG-198' },
    ],
    hired: [
      { name: 'Anika Bose',    role: 'Sales Development Rep',  rating: 5, days: 0, tag: 'SAL-077' },
    ],
  };

  const openings = [
    { id: 'ENG-198', title: 'Senior Backend Engineer', dept: 'Engineering', loc: 'Bengaluru',  type: 'Full-time', applicants: 38, stage: 'Interviewing', status: 'Open' },
    { id: 'ENG-201', title: 'Backend Engineer',        dept: 'Engineering', loc: 'Remote',     type: 'Full-time', applicants: 52, stage: 'Screening',    status: 'Open' },
    { id: 'ENG-204', title: 'Frontend Engineer',       dept: 'Engineering', loc: 'Bengaluru',  type: 'Full-time', applicants: 64, stage: 'Sourcing',     status: 'Open' },
    { id: 'DES-118', title: 'Product Designer',        dept: 'Product',     loc: 'Remote',     type: 'Full-time', applicants: 29, stage: 'Interviewing', status: 'Open' },
    { id: 'SAL-077', title: 'Sales Development Rep',   dept: 'Sales',       loc: 'Mumbai',     type: 'Full-time', applicants: 41, stage: 'Offer',        status: 'Closing' },
    { id: 'FIN-052', title: 'Financial Analyst',       dept: 'Finance',     loc: 'Mumbai',     type: 'Contract',  applicants: 18, stage: 'Sourcing',     status: 'On hold' },
  ];

  const OPENING_STATUS = {
    Open:      { variant: 'success', dot: true },
    Closing:   { variant: 'warning', dot: true },
    'On hold': { variant: 'secondary', dot: true },
  };

  const allCandidates = RECRUIT_STAGES.flatMap((s) =>
    pipeline[s.key].map((c) => ({ ...c, stage: s.key, stageLabel: s.label, stageColor: s.color }))
  );

  return (
    <>
      <window.PageHeader
        title="Recruitment"
        description="Track open requisitions and move candidates through the hiring pipeline."
        breadcrumbs={[{ label: 'Recruitment' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<I.Download />}>Export</Button>
            <Button size="sm" icon={<I.Plus />}>Post a Job</Button>
          </>
        }
      />

      <div className="ems-page">
        <div className="tabs">
          {[
            ['pipeline', 'Pipeline'],
            ['openings', 'Openings'],
            ['candidates', 'Candidates'],
          ].map(([k, l]) => (
            <button key={k} type="button" className={window.UI.cx('tab', tab === k && 'active')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* Stats are shared across tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatsCard label="Open requisitions" value="6"   icon={<I.Briefcase />}     accent="var(--brand-500)" sub="2 closing this week" />
          <StatsCard label="Active candidates" value="242" icon={<I.Users />}         accent="var(--dept-engineering)" delta={18} sub="vs last month" />
          <StatsCard label="Interviews this week" value="9" icon={<I.Calendar />}     accent="var(--warning-500)" sub="3 today" tone="warning" />
          <StatsCard label="Avg time to hire"  value="28d" icon={<I.Clock />}         accent="var(--success-500)" sub="−4d vs Q1" tone="positive" />
        </div>

        {tab === 'pipeline' && (
          <>
            <div className="toolbar">
              <span style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-secondary)' }}>Role</span>
              <SelectTrigger value="All openings" style={{ width: 200 }} />
              <SelectTrigger value="All recruiters" style={{ width: 180 }} />
              <div style={{ flex: 1 }} />
              <Button variant="outline" size="sm" icon={<I.Filter />}>Filter</Button>
            </div>

            <div className="recruit-board">
              {RECRUIT_STAGES.map((s) => {
                const cards = pipeline[s.key];
                return (
                  <div key={s.key} className="recruit-col">
                    <div className="recruit-col-head">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <RecruitDot color={s.color} />
                        <span style={{ font: '600 12px/16px var(--font-sans)', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                      </span>
                      <span style={{ font: '500 12px/16px var(--font-mono)', color: 'var(--text-tertiary)' }}>{cards.length}</span>
                    </div>
                    <div className="recruit-col-body">
                      {cards.map((c) => <CandidateCard key={c.name} c={c} />)}
                      {cards.length === 0 && (
                        <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-disabled)', textAlign: 'center', padding: '16px 0' }}>No candidates</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'openings' && (
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">Open requisitions · {openings.length}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="xs" icon={<I.Filter />}>Filter</Button>
                <Button variant="outline" size="xs" icon={<I.ArrowUpDown />}>Sort</Button>
              </div>
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Applicants</th>
                    <th>Stage</th>
                    <th>Status</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {openings.map((o) => {
                    const st = OPENING_STATUS[o.status] || { variant: 'secondary' };
                    return (
                      <tr key={o.id}>
                        <td>
                          <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{o.title}</div>
                          <div style={{ font: '400 11px/14px var(--font-mono)', color: 'var(--text-tertiary)' }}>{o.id}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{o.dept}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                            <I.MapPin size={13} style={{ color: 'var(--text-tertiary)' }} />{o.loc}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{o.type}</td>
                        <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{o.applicants}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{o.stage}</td>
                        <td><Badge variant={st.variant} dot={st.dot}>{o.status}</Badge></td>
                        <td><button className="btn btn-ghost btn-icon-xs"><I.MoreHorizontal size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'candidates' && (
          <div className="section-card">
            <div className="section-card-head">
              <div className="title">All candidates · {allCandidates.length}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="xs" icon={<I.Filter />}>Filter</Button>
              </div>
            </div>
            <div className="section-card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Applied for</th>
                    <th>Stage</th>
                    <th>Rating</th>
                    <th style={{ textAlign: 'right' }}>In stage</th>
                    <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allCandidates.map((c) => (
                    <tr key={c.name}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar size="sm" name={c.name} />
                          <div>
                            <div style={{ font: '500 13px/18px var(--font-sans)' }}>{c.name}</div>
                            {c.referred && <div style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--brand-500)' }}>Referral</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{c.role}</div>
                        <div style={{ font: '400 11px/14px var(--font-mono)', color: 'var(--text-tertiary)' }}>{c.tag}</div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 12px/16px var(--font-sans)', color: 'var(--text-secondary)' }}>
                          <RecruitDot color={c.stageColor} />{c.stageLabel}
                        </span>
                      </td>
                      <td>{c.rating > 0 ? <Rating value={c.rating} /> : <span style={{ color: 'var(--text-disabled)' }}>—</span>}</td>
                      <td className="num" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{c.days}d</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Button variant="ghost" size="icon-xs" aria-label="Email"><I.Mail size={14} /></Button>
                          <Button variant="outline" size="xs">Advance</Button>
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

window.RecruitmentScreen = RecruitmentScreen;
