# Company Onboarding — Validation & Security Hardening Roadmap

> **Date:** 2026-06-11
> **Status:** Forward-looking plan. **Not implemented yet** — the live signup is the
> minimal version (see `BACKEND_API_REQUESTS.md §3`).
> **Owners:** Frontend + Backend (security enforcement is **server-side**; the
> frontend provides UX affordances only).
>
> ## Why this exists
>
> The first `/auth/register` ships **deliberately minimal** to unblock the E2E
> company-creation path: 4 fields, no real validation, **no duplicate-company
> protection**. That is fine for testing and early pilots, but it is **not safe for
> open public signup**. This document is the agreed plan to harden it — so "we'll add
> validation later" is a concrete roadmap, not a vague promise.

---

## 1. Guiding principles

1. **Server is the security boundary.** Every rule here MUST be enforced by the
   backend. Frontend validation is UX only (fast feedback) and can be bypassed.
2. **Don't kill the frictionless front door.** Hardening must not turn a 4-field
   signup into a 12-field form. Prefer **async/background** checks (email
   verification, domain detection) over **upfront** fields.
3. **Progressive rollout.** Ship in phases (below); each phase is independently
   valuable and shippable. No big-bang.
4. **Contract-first (`CLAUDE.md §22`).** Every new rule or endpoint is documented in
   `BACKEND_API_REQUESTS.md` first, MSW-mocked, then implemented to match.

---

## 2. Phased rollout

| Phase  | Theme                           | Headline outcome                                                          |
| ------ | ------------------------------- | ------------------------------------------------------------------------- |
| **P0** | Basic onboarding (**LIVE NOW**) | Create company + admin, instant login. No validation, no dup-check.       |
| **P1** | Field & password validation     | Real client + server validation; password strength; Terms acceptance.     |
| **P2** | Email verification              | Double opt-in — prove email ownership before/just-after tenant activates. |
| **P3** | Duplicate-company prevention    | Unique workspace identity + "join existing company" flow. **(§5)**        |
| **P4** | Abuse & bot protection          | CAPTCHA, rate limiting, disposable-email blocking.                        |
| **P5** | Breach, audit & compliance      | Breached-password check, signup audit log, data-residency handling.       |

Phases can overlap; **P3 (duplication)** is the one you called out as important, so it
should not slip past P2.

---

## 3. Field validation (P1)

Enforced **both** client (RHF + Zod) and server. Server is authoritative.

| Field         | Rule                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `companyName` | required; trimmed; 2–100 chars; printable Unicode; collapse internal whitespace                |
| `fullName`    | required; trimmed; 2–100 chars                                                                 |
| `email`       | required; RFC 5322 shape; lowercased; **not a disposable domain** (P4); globally unique        |
| `password`    | required; **min 12 chars**; strength scored via `zxcvbn` (reject score < 3); not breached (P5) |
| `acceptTerms` | required `true`; record **terms version + timestamp + IP** server-side (audit)                 |

UX notes: inline password strength meter; show rules as you type; 422 `details[]` map
to fields via `form.setError` (already the pattern in `CLAUDE.md §11`).

---

## 4. Email verification — double opt-in (P2)

Goal: prove the signer controls the email **before** the workspace is fully usable.

Two viable models (pick one in P2):

- **Verify-then-activate** (stricter): `POST /auth/register` creates a **pending**
  tenant, emails a code/link, no login cookies yet. `POST /auth/verify-registration`
  activates + sets cookies. Safer, but adds a screen and a test-inbox dependency.
- **Activate-then-verify** (gentler): keep today's instant-login, but mark the tenant
  `emailVerified: false`, show a persistent "verify your email" banner, and gate
  sensitive actions (inviting users, payroll) until verified. Lower friction.

**Recommendation:** **activate-then-verify** — preserves the frictionless signup while
still forcing verification before the company does anything that matters.

---

## 5. Duplicate-company prevention (P3) — the key concern

Today company **name is not unique** (two tenants may share a name). That is wrong for
production: it lets the same real company be created twice (e.g. two colleagues sign up
independently), splitting their data into two workspaces. Fixing this needs a **stable,
unique workspace identity** — a name string alone is too fuzzy.

**Three building blocks (use 1 + 3 together; 2 is the strongest signal):**

1. **Unique workspace slug / subdomain (hard constraint).**
   During signup the admin picks (or we derive) a `slug` → `acme.emsapp.com`. The slug
   is **globally unique** and is the real tenant identity. Cheap, standard SaaS, easy to
   enforce with a live availability check (`GET /auth/check-slug?slug=acme` → `{available}`).

2. **Corporate email-domain ownership (strongest anti-duplication signal).**
   Treat the email domain (`@acme.com`) as the company's identity. On signup:
   - If a workspace already exists for that **verified** domain → **don't create a
     second one.** Instead offer **"Request to join the existing _Acme_ workspace"**
     (Slack/Notion pattern) → notifies that workspace's admins to approve.
   - Block/flag **free providers** (gmail, outlook, yahoo, …) from _creating_ a company
     (they can still be invited as members) — a free-email "company" is the #1 source of
     junk/duplicate tenants.

3. **Fuzzy name match → soft warning (assist, not block).**
   Normalize the company name (lowercase, strip `Inc/LLC/Ltd/Pvt`, punctuation) and, if a
   close match exists, **warn** ("A company called _Acme_ already exists — is this yours?")
   with a path to request-to-join. Never a hard block on name alone (legitimate distinct
   companies share names).

**Recommendation:** **slug uniqueness (1) as the hard rule + domain-based join flow (2)**
as the real duplicate-killer, with name fuzzy-match (3) as a soft assist. This is the
combination that actually stops "same company created twice" without false-blocking.

> **OPEN DECISION (needs you + backend):** do we adopt the **domain-ownership / join-
> existing-workspace** model (2)? It's the highest-value anti-duplication mechanism but
> it introduces a _join request_ sub-system (approvals, member invites). If that's too
> big for now, P3 can ship with **slug uniqueness only** and defer the join flow.

---

## 6. Abuse & bot protection (P4)

- **CAPTCHA / Turnstile** (Cloudflare Turnstile or hCaptcha) on the signup submit —
  invisible/low-friction variants preferred.
- **Rate limiting** (server): per-IP and per-email throttle on `/auth/register` and the
  availability-check endpoints; exponential backoff.
- **Disposable / temporary email blocking:** reject known throwaway domains
  (mailinator, 10minutemail, …) from creating a company.
- **Honeypot field** on the form (hidden input bots fill, humans don't).

---

## 7. Account enumeration & error messaging (cross-cutting)

- `409 EMAIL_IN_USE` necessarily reveals an email is registered — acceptable for signup,
  but pair it with a helpful path ("This email already has an account — **sign in** or
  **reset password**") rather than a dead error.
- Availability endpoints (`check-slug`, domain lookup) are enumeration surfaces → must be
  **rate-limited** (P4) and return minimal info.

---

## 8. Audit, breach & compliance (P5)

- **Breached-password check:** HaveIBeenPwned **k-anonymity** range API (send only a
  SHA-1 prefix) — reject known-breached passwords. Server-side.
- **Signup audit log:** record tenant-created events (who, when, IP, UA, terms version)
  into the existing audit-log system.
- **Password storage:** Argon2id (or bcrypt cost ≥ 12) — backend responsibility, noted
  here for completeness.
- **Cookie flags:** `httpOnly` + `Secure` + `SameSite=Lax`, short access-token TTL (the
  15-min TTL we already use). Confirm in P1.
- **Data residency / GDPR:** because tenants are multi-country, capture consent and be
  ready to honor region-based storage as the product globalizes.

---

## 9. Contract impact (what changes vs the P0 contract)

New / changed endpoints to author in `BACKEND_API_REQUESTS.md` when each phase starts:

| Phase | Endpoint / change                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------ |
| P1    | `POST /auth/register` gains real 422 validation + `acceptTerms` in body                                                  |
| P2    | `POST /auth/verify-registration` (or `emailVerified` flag + resend endpoint)                                             |
| P3    | `slug` added to register body; `GET /auth/check-slug`; domain lookup + `POST /auth/join-requests` (if join flow adopted) |
| P4    | CAPTCHA token in register body; server rate-limit headers; disposable-domain list                                        |
| P5    | Breached-password rejection (`422 PASSWORD_BREACHED`); audit event                                                       |

Each is MSW-mocked first, then implemented to match — same discipline as P0.

---

## 10. Summary

P0 (live) is intentionally bare for testing. The path to production-safe onboarding is
**P1 validation → P2 email verification → P3 duplicate-company prevention → P4 abuse
protection → P5 breach/audit**. The single most important upgrade for your stated concern
(no duplicate companies) is **P3**, built on a **unique workspace slug + a domain-based
"join the existing company" flow**. The one decision to make before P3 is whether to take
on that join-request sub-system now or defer it and ship slug-uniqueness alone.
