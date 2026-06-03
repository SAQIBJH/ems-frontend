/**
 * AnnouncementsScreen — Phase 2. Company-wide comms feed. A pinned card,
 * a chronological feed with category accents + read counts, and a sidebar
 * of channels / upcoming events. Static click-thru fidelity.
 */

const ANNC_CAT = {
  Company:  { color: 'var(--brand-500)' },
  People:   { color: 'var(--dept-people)' },
  Product:  { color: 'var(--dept-product)' },
  IT:       { color: 'var(--dept-engineering)' },
  Office:   { color: 'var(--dept-operations)' },
};

function AnnouncementsScreen() {
  const { Button, Badge, Avatar } = window.UI;
  const I = window.Icons;

  const pinned = {
    cat: 'Company', title: 'Q2 All-Hands — Thursday 4 PM IST',
    body: 'Join the leadership team for the Q2 business review, product roadmap, and a live Q&A. Calendar invites are out; the session will be recorded for those who can\u2019t attend live.',
    author: 'Aman Khanna', role: 'Chief People Officer', when: '2h ago', reads: 182, audience: 'All employees',
  };

  const feed = [
    { cat: 'IT',      title: 'Mandatory password rotation by Jun 5', body: 'Single sign-on credentials must be rotated before June 5. You\u2019ll be prompted at next login — enable the authenticator app if you haven\u2019t.', author: 'Security Team', when: 'Yesterday', reads: 211, audience: 'All employees' },
    { cat: 'People',  title: 'New parental leave policy now live', body: 'We\u2019ve extended paid parental leave to 26 weeks effective this quarter. Full details and eligibility are on the People portal.', author: 'Sneha Rao', when: '2 days ago', reads: 168, audience: 'All employees' },
    { cat: 'Office',  title: 'Bengaluru office closed May 30 (maintenance)', body: 'The Bengaluru HQ will be closed Friday for electrical maintenance. Please plan to work remotely; meeting rooms are unavailable.', author: 'Facilities', when: '3 days ago', reads: 96, audience: 'Bengaluru' },
    { cat: 'Product', title: 'EMS v2.4 ships Monday', body: 'The new Performance and Recruitment modules go live for all admins Monday morning. Release notes and a short walkthrough are attached.', author: 'Nisha Iyer', when: '4 days ago', reads: 74, audience: 'Managers' },
  ];

  const channels = [
    { name: 'Company-wide', count: 142, color: 'var(--brand-500)' },
    { name: 'People & Culture', count: 38, color: 'var(--dept-people)' },
    { name: 'Product updates', count: 51, color: 'var(--dept-product)' },
    { name: 'IT & Security', count: 24, color: 'var(--dept-engineering)' },
    { name: 'Office & Facilities', count: 17, color: 'var(--dept-operations)' },
  ];

  const events = [
    { date: 'Jun 02', title: 'Q2 All-Hands', meta: '4:00 PM · Main hall + Zoom' },
    { date: 'Jun 06', title: 'New-hire orientation', meta: '10:00 AM · 7 joining' },
    { date: 'Jun 14', title: 'Manager review deadline', meta: 'H1 2026 cycle' },
  ];

  const Card = ({ a, pinned: isPinned }) => {
    const meta = ANNC_CAT[a.cat];
    return (
      <article className="section-card" style={{ borderLeft: `3px solid ${meta.color}` }}>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 11px/14px var(--font-sans)', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: meta.color }} />{a.cat}
            </span>
            {isPinned && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '600 11px/14px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <I.Pin size={12} />Pinned
              </span>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>{a.when}</span>
          </div>

          <h3 style={{ font: `600 ${isPinned ? '18px/24px' : '15px/20px'} var(--font-sans)`, color: 'var(--text-primary)', margin: 0 }}>{a.title}</h3>
          <p style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--text-secondary)', margin: 0, maxWidth: '68ch', textWrap: 'pretty' }}>{a.body}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="sm" name={a.author} />
              <div>
                <div style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--text-primary)' }}>{a.author}</div>
                {a.role && <div style={{ font: '400 11px/14px var(--font-sans)', color: 'var(--text-tertiary)' }}>{a.role}</div>}
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>
              <I.Users size={13} />{a.audience}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>
              <I.Check size={13} />{a.reads} read
            </span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      <window.PageHeader
        title="Announcements"
        description="Company-wide updates, policy changes, and events."
        breadcrumbs={[{ label: 'Announcements' }]}
        actions={<Button size="sm" icon={<I.Plus />}>New Announcement</Button>}
      />

      <div className="ems-page">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
          {/* Feed column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Composer entry */}
            <div className="section-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size="sm" name="Aman Khanna" />
              <button type="button" style={{
                flex: 1, textAlign: 'left', cursor: 'pointer',
                font: '400 13px/1 var(--font-sans)', color: 'var(--text-tertiary)',
                background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
              }}>Share an update with the company…</button>
              <Button size="sm" icon={<I.Megaphone size={14} />}>Post</Button>
            </div>

            <Card a={pinned} pinned />
            {feed.map((a) => <Card key={a.title} a={a} />)}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 0 }}>
            <div className="section-card">
              <div className="section-card-head"><div className="title">Channels</div></div>
              <div className="section-card-body" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {channels.map((c, i) => (
                  <button key={c.name} type="button" className="annc-channel" style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                    padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    background: i === 0 ? 'var(--bg-surface-2)' : 'transparent', border: 'none',
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: 9999, background: c.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ font: '500 12px/16px var(--font-mono)', color: 'var(--text-tertiary)' }}>{c.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="section-card">
              <div className="section-card-head"><div className="title">Upcoming</div></div>
              <div className="section-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {events.map((e) => (
                  <div key={e.title} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flexShrink: 0, width: 44, textAlign: 'center' }}>
                      <div style={{ font: '700 16px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{e.date.split(' ')[1]}</div>
                      <div style={{ font: '500 10px/12px var(--font-sans)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{e.date.split(' ')[0]}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 12 }}>
                      <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{e.title}</div>
                      <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>{e.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.AnnouncementsScreen = AnnouncementsScreen;
