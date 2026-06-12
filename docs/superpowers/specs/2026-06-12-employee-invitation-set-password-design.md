# Employee invitation & set-password (account activation)

**Date:** 2026-06-12
**Module(s):** `auth`, `employees`, `settings`
**Status:** Design + contract **agreed with backend** (mirrored verbatim 2026-06-12).
**Pending backend implementation — NOT live.** Frontend implementation **deferred**
(decision: persist contract only, then wait). Exact wire shapes live in
`docs/BACKEND_API_REQUESTS.md §3` (canonical per CLAUDE.md §22).

## Problem

New employees have no way to set their own password. The create-employee stepper
has a **"Send invite email"** toggle, but it is a **no-op today** — it is not sent in
the `POST /employees` body and there is no invite endpoint. We need a secure,
production-grade flow: HR creates an employee → the employee receives an email with a
link → they land on a page in our app and set a password → their account activates.

## Decisions (locked)

1. **Dedicated invitation/activation flow** (not a reuse of password-reset). Account
   moves `INVITED → ACTIVE`. Built on the existing token-link machinery that already
   powers `/reset-password` (`forgot-password` / `reset-password`).
2. **Invite link TTL = 72h** (configurable), server-enforced. Password _reset_ stays
   short (30–60 min) — different purpose.
3. **Resend = both paths:** HR "Resend invite" from the employee profile **and**
   employee self-serve "request a new link" on the expired/used page.
4. **Email target = tenant setting** `invite_email_target: PERSONAL | WORK` (snake_case,
   on `/settings/tenant`). Default **`PERSONAL`** for test mode; flip to `WORK` later in
   Settings with no code change/redeploy. Optional per-request `emailTarget` override.
5. **After set-password → redirect to `/login`** with a success toast. **No auto-login**
   — backend can skip the optional auto-login response (avoids partial-session edges).
6. **Invite-email failure → do NOT roll back.** Create employee + user + token
   atomically; email is a side-effect. On send failure, records persist and the
   response returns `invite.sent: false` + reason; HR resends. A transient SMTP outage
   must never block creating a valid employee.

## Account-state model

A login/user is provisioned when an employee is created with a `memberType`. New users
start **`INVITED`** (no password, cannot log in) and become **`ACTIVE`** on first
password set via the invite link.

```
HR creates employee ─► user: INVITED ─► invite email sent
        employee clicks link ─► /set-password ─► sets password ─► user: ACTIVE ─► login
```

- Login while `INVITED` → `403 ACCOUNT_NOT_ACTIVATED`; login page shows _"Your account
  isn't activated yet — check your email for the invite or contact your admin."_

## End-to-end flow

**A. Create + invite (HR)** — `POST /employees` now includes `memberType` +
`sendInvite: true`. Backend (atomically) creates employee → provisions user `INVITED`
→ issues invite token → emails the set-password link to the target email. Create
response carries an `invite` summary (`sent`, masked `sentTo`/`email`, `expiresAt`).

**B. Employee accepts** — link → `/set-password?token=…` (public, in the `(auth)`
group). Page calls `GET /auth/invitation?token=…` to validate **before** showing the
form (renders VALID / EXPIRED / USED / NOT_FOUND; shows employee first name + company
for trust). `VALID` → set-password form (policy = reset-password schema) → `POST
/auth/accept-invitation { token, password }` → activates + consumes token → redirect
to `/login` with success toast. `EXPIRED|USED|NOT_FOUND` → "request a new link"
(self-serve resend).

## Token & security (required of backend)

≥256-bit random token; **stored hashed** (raw only in the email URL); single-use;
single active unused token per user (resend invalidates prior); server-enforced TTL
(72h default); constant-time compare; rate-limited send/resend/accept; generic no-leak
messages on self-serve; audit `INVITE_SENT / RESENT / ACCEPTED / failed`; no raw token
in logs. Suggested model `UserInvitation(tokenHash, emailTarget, email, expiresAt,
usedAt, revokedAt, …)`.

## Resend

- **HR:** `POST /employees/:id/invite` — invalidates old token, issues new, re-emails.
  Profile **"Resend invite"** button shown when `user.status === INVITED`, gated by
  `employees:write`, rate-limited (~3/hr/employee). Same endpoint create triggers.
- **Self-serve:** `POST /auth/invitation/resend { email }` — generic no-leak 200,
  rate-limited 5/15min.

## Edge cases

Re-invite already-`ACTIVE` user → `409 ALREADY_ACTIVE`; terminated/soft-deleted →
`409 EMPLOYEE_TERMINATED`; target has no email → fall back to work, else `422
NO_DELIVERY_EMAIL`; replay of consumed token → `USED`; concurrent resends → latest
token wins; email-send failure on create → `invite.sent:false` (no rollback, see
decision 6).

## Frontend surface (DEFERRED — build only when greenlit)

When implemented, **frontend-first behind MSW** matching `BACKEND_API_REQUESTS.md §3`,
flipped to live only after the backend's live-proof checklist passes:

- `(auth)/set-password` route + `SetPasswordForm` (mirrors `ResetPasswordForm`):
  validate token via `GET`, show employee/company, set password, handle
  expired/used → request-new-link.
- `auth.api`: `validateInvitation(token)`, `acceptInvitation(token, password)`,
  `resendInvitation(email)`.
- `employees`: `inviteEmployee(id)` + `useInviteEmployee`; profile "Resend invite"
  button (shown when `user.status === INVITED`); wire `sendInvite` + `memberType` into
  the create body + `employeeCreateSchema`.
- `settings`: `invite_email_target` control (People group); service + hook.
- `login`: handle `403 ACCOUNT_NOT_ACTIVATED`.
- All four states, dark mode, tokens, permission gates per §13/§15/§10/§12.

## Backend confirmations still required (lynchpin = #1/#2)

1. Does `POST /employees` create a login user today, or only a profile?
2. If so, does it accept `memberType`, and what default status?
3. Can `POST /employees` support `sendInvite` and trigger the invite atomically?
4. Does the email/template system have an `ACCOUNT_INVITE` activation template?

Until #1/#2 are confirmed, the **create-side** of the contract is unverified — do not
wire it.

## Live-proof before FE removes mocks

Backend must show live Render evidence: create with `sendInvite` → `201` +
`user.status=INVITED` + invite object; resend → new expiry; validate → `VALID`;
accept → `activated:true`; login after accept → `200`; reused/expired token →
correct state; missing delivery email → `422`; already-active → `409`; public resend
unknown email → generic `200`; email actually delivered.

## Out of scope (YAGNI)

Auto-login on accept (decided against); bulk-invite; invite analytics/dashboards;
SMS/other channels.
