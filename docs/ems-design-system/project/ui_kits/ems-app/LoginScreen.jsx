/**
 * LoginScreen — replicates src/app/(auth)/login + LoginForm.
 * Single centered card, 400px wide, no marketing flourish.
 */

function LoginScreen({ onLogin }) {
  const { Button, Input, Field, Checkbox } = window.UI;
  const [email, setEmail] = React.useState('aman@acme.test');
  const [password, setPassword] = React.useState('Password123!');
  const [remember, setRemember] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onLogin?.({ email, name: 'Aman Khanna' }); }, 600);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Top-left logo (per AuthShell spec) */}
      <div style={{ padding: '24px 32px' }}>
        <span style={{ font: '700 16px/22px var(--font-sans)', letterSpacing: '-0.01em' }}>
          <span style={{ color: 'var(--brand-500)' }}>E</span>MS
        </span>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
        {/* Form */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 32px' }}>
          <form onSubmit={submit} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h1 style={{ font: '600 24px/32px var(--font-sans)', letterSpacing: '-0.015em', margin: 0 }}>Welcome back</h1>
              <p style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                Sign in to your EMS workspace.
              </p>
            </div>

            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
            </Field>

            <Field label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ font: '500 13px/18px var(--font-sans)' }}>Password</span>
                <a href="#" style={{ font: '500 12px/16px var(--font-sans)', color: 'var(--brand-500)', textDecoration: 'none' }}>Forgot password?</a>
              </div>
            }>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, font: '400 13px/18px var(--font-sans)', cursor: 'pointer' }}>
              <Checkbox checked={remember} onChange={setRemember} />
              Remember me on this device
            </label>

            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Trouble signing in? <a href="#" style={{ color: 'var(--brand-500)' }}>Contact your HR admin</a>.
            </div>
          </form>
        </div>

        {/* Right product-highlight panel — bordered tile, no flourish */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 32px' }}>
          <div style={{ width: '100%', maxWidth: 440, border: '1px solid var(--border-subtle)', borderRadius: 16, background: 'var(--bg-surface)', padding: 28 }}>
            <span className="badge badge-secondary" style={{ marginBottom: 16 }}>v1.4 · Mar 2026</span>
            <h2 style={{ font: '600 20px/28px var(--font-sans)', letterSpacing: '-0.01em', margin: 0 }}>Bulk approvals are here.</h2>
            <p style={{ font: '400 14px/20px var(--font-sans)', color: 'var(--text-secondary)', margin: '8px 0 20px' }}>
              Managers can now approve up to 20 leave requests in a single action, with optional reason copy.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Pending leave queue with bulk select', 'Optional approval reason on action', 'Audit log entry per item, not per action'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, font: '400 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 9999, background: 'var(--brand-50)', color: 'var(--brand-500)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px', font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
        <span>© 2026 EMS</span>
        <span>Terms · Privacy</span>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
