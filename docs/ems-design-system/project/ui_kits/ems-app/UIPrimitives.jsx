/**
 * EMS UI primitives.
 * Cosmetic React versions of shadcn/ui components used in the real EMS app.
 * Cut corners on accessibility plumbing; keep shapes pixel-faithful.
 */

const cx = (...args) => args.filter(Boolean).join(' ');

/* ── Button ─────────────────────────────────────────────────────────────── */
function Button({ variant = 'default', size = 'default', icon, className, children, ...rest }) {
  const sizeClass = {
    default: '',
    xs: 'btn-xs',
    sm: 'btn-sm',
    lg: 'btn-lg',
    icon: 'btn-icon',
    'icon-sm': 'btn-icon-sm',
    'icon-xs': 'btn-icon-xs',
  }[size];
  return (
    <button className={cx('btn', `btn-${variant}`, sizeClass, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

/* ── Badge ──────────────────────────────────────────────────────────────── */
function Badge({ variant = 'secondary', dot, className, children, ...rest }) {
  return (
    <span className={cx('badge', `badge-${variant}`, className)} {...rest}>
      {dot ? <span className="dot" /> : null}
      {children}
    </span>
  );
}

/* ── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 'default', variant = 'tint' }) {
  const initials = (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase();
  const sizeClass = { sm: 'avatar-sm', default: '', lg: 'avatar-lg', xl: 'avatar-xl' }[size];
  return (
    <span className={cx('avatar', sizeClass, variant === 'brand' && 'avatar-brand')}>
      {initials || '?'}
    </span>
  );
}

/* ── Input ──────────────────────────────────────────────────────────────── */
function Input({ className, error, ...rest }) {
  return <input className={cx('input', error && 'error', className)} {...rest} />;
}

function Field({ label, help, error, children }) {
  return (
    <div className="field">
      {label ? <label className="label">{label}</label> : null}
      {children}
      {error ? <div className="help" style={{ color: 'var(--danger-500)' }}>{error}</div> : help ? <div className="help">{help}</div> : null}
    </div>
  );
}

/* ── Select trigger (visual only; for click-thru screens we don't open) ─── */
function SelectTrigger({ value, placeholder = 'Select…', onClick, className, style }) {
  const { ChevronDown } = window.Icons;
  return (
    <button className={cx('select-trigger', className)} onClick={onClick} type="button" style={style}>
      <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-disabled)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || placeholder}
      </span>
      <ChevronDown />
    </button>
  );
}

/* ── Checkbox / Switch ──────────────────────────────────────────────────── */
function Checkbox({ checked, onChange }) {
  return (
    <span
      className={cx('checkbox', checked && 'checked')}
      onClick={() => onChange?.(!checked)}
      role="checkbox"
      aria-checked={!!checked}
    />
  );
}
function Switch({ checked, onChange }) {
  return (
    <span
      className={cx('switch', checked && 'on')}
      onClick={() => onChange?.(!checked)}
      role="switch"
      aria-checked={!!checked}
    />
  );
}

/* ── Card ───────────────────────────────────────────────────────────────── */
function Card({ className, children, ...rest }) {
  return <div className={cx('card', className)} {...rest}>{children}</div>;
}
function CardHeader({ title, action }) {
  return (
    <div className="card-header">
      <div className="card-title">{title}</div>
      {action}
    </div>
  );
}
function CardBody({ tight, className, children, ...rest }) {
  return <div className={cx('card-body', tight && 'tight', className)} {...rest}>{children}</div>;
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton({ className, style }) {
  return <div className={cx('skeleton', className)} style={style} />;
}

/* ── EmptyState ─────────────────────────────────────────────────────────── */
function EmptyState({ illustration, title, description, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '48px 24px', textAlign: 'center' }}>
      {illustration ? <div style={{ color: 'var(--text-tertiary)' }}>{illustration}</div> : null}
      <div>
        <div className="text-body" style={{ fontWeight: 500 }}>{title}</div>
        {description ? <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{description}</div> : null}
      </div>
      {action}
    </div>
  );
}

window.UI = {
  Button, Badge, Avatar, Input, Field, SelectTrigger,
  Checkbox, Switch, Card, CardHeader, CardBody,
  Skeleton, EmptyState, cx,
};
