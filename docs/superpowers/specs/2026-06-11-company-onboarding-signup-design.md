# Company Onboarding — Self-Serve Signup (Design)

> **Date:** 2026-06-11
> **Status:** Approved design — ready for implementation plan
> **Author:** Frontend (with backend team building the endpoint in parallel)

## 1. Purpose & context

The E2E test journey needs a starting point: a way to create a **brand-new company
from scratch**. Today the app has no signup — the `(auth)` group only has login,
forgot-password, reset-password, and OTP, and there is no registration endpoint in
`API_MAPPING.md`.

This adds a **public, self-serve signup screen** that creates a new tenant + its
first SUPER_ADMIN in one step and logs the user straight in (instant login, no email
verification). It follows the **frontend-first contract workflow** (`CLAUDE.md §22`):
the contract is defined here + in `docs/BACKEND_API_REQUESTS.md §3`, MSW serves it
today, and the backend implements to match.

### Decisions locked during brainstorming

| Decision        | Choice                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Meaning         | **Self-serve signup** (create new company), not a post-login wizard                                 |
| Auth outcome    | **Instant login** — 201 sets cookies, redirect to `/dashboard`                                      |
| Field set       | **Minimal** — `companyName, fullName, email, password` only                                         |
| Validation      | **Deferred** (agreed with backend team) — minimal guardrails only; strict rules later               |
| Deferred fields | `country` / `currency` / `timezone` are **not** at signup — set later in Settings → Company Profile |
| Name field      | Single `fullName` (backend may split)                                                               |
| Permissions     | **Explicit** SUPER_ADMIN list returned (no `["*"]` wildcard)                                        |

## 2. The endpoint contract

Authoritative copy lives in **`docs/BACKEND_API_REQUESTS.md §3`**. Summary:

- **`POST /auth/register`** — public, no auth, camelCase.
- Request: `{ companyName, fullName, email, password }` (minimal; validation deferred).
- Success **201**: sets `accessToken` (15m) + `refreshToken` (7d) httpOnly cookies;
  body mirrors the login envelope plus a `tenant` block (`country/currency/timezone`
  returned `null`), `user.memberType = "SUPER_ADMIN"` with `employeeId/employee =
null`, and the explicit SUPER_ADMIN `permissions[]`.
- Errors: `409 EMAIL_IN_USE`, `422 VALIDATION` (`details[]` → form fields).

## 3. Screen design

**Route:** `src/app/(auth)/signup/page.tsx` — reuses `AuthShell` (same chrome as
login). Client component form.

**Component:** `src/modules/auth/components/RegisterForm.tsx` (RHF + `zodResolver`).

**Fields & controls — minimal, no Selects:**

| Field         | Control        | Notes                                          |
| ------------- | -------------- | ---------------------------------------------- |
| `companyName` | text input     | required, non-empty                            |
| `fullName`    | text input     | required, non-empty                            |
| `email`       | email input    | required, valid email shape                    |
| `password`    | password input | required, non-empty (no length/complexity yet) |

No country/currency/timezone Selects, no Terms checkbox — deliberately stripped for a
low-friction signup. (If later phases reintroduce Selects, they follow `CLAUDE.md §13`
— shadcn `Select`, never native, render option name not value.)

**Four states (`CLAUDE.md §13`):**

- **Idle:** the form.
- **Submitting:** submit button shows spinner + disabled; debounced against
  double-click (`§11`).
- **Error:** 422 → `form.setError(field, …)` per `error.details[]`; 409
  `EMAIL_IN_USE` → error on the email field; any other → toast.
- **Success:** 201 → invalidate/seed the `auth.me` query as login does, then
  `router.push('/dashboard')`.

**Cross-links:** "Already have an account? Sign in" → `/login`. The login page gets
a reciprocal "Create a company workspace" → `/signup`.

## 4. Module wiring (`modules/auth`)

New/changed files, following existing module anatomy (`CLAUDE.md §6`):

- `validations/register.schema.ts` — Zod schema, minimal: `companyName`/`fullName`
  non-empty, `email` valid shape, `password` non-empty (no length/complexity rule yet).
- `types/auth.types.ts` — add `RegisterInput`-adjacent types and
  `RegisterResponse` (= `LoginResponse` + `tenant: { id, name, country, currency,
timezone }` where the last three are `string | null`).
- `services/auth.api.ts` — add `register(input): Promise<RegisterResponse>`
  unwrapping `data.data`.
- `hooks/useRegister.ts` — `useMutation` mirroring `useLogin` (same cache
  population + redirect-on-success behaviour).
- `components/RegisterForm.tsx` — the form (4 text inputs, no Selects).
- `index.ts` — export the public surface (`RegisterForm`, `useRegister`,
  `registerSchema`, types) as needed.
- `app/(auth)/signup/page.tsx` — the route.

(No `constants/signup-options.ts` — there are no dropdowns in this version.)

## 5. E2E / MSW story

Per `CLAUDE.md §3` + `§22`, while the backend builds the endpoint:

- Add an MSW handler for `POST /auth/register` in `src/mocks/handlers/auth.ts`
  (or a dedicated handler), registered in `src/mocks/handlers/index.ts`, returning
  the exact 201 shape above and setting mock cookies / a successful `auth/me`
  follow-up so the redirect-to-dashboard path works under `NEXT_PUBLIC_USE_MOCKS=true`.
- Mock conflict path: a fixed "already-taken" email (e.g. `taken@acme.test`) returns
  `409 EMAIL_IN_USE` so the error state is testable.
- When the backend ships `/auth/register` live, remove the handler — no app-code
  change (`§22`).

## 6. Definition of done (per `CLAUDE.md §15`)

- Renders at 1280/1440/1920, acceptable at 768; light + dark mode.
- Keyboard navigable; Selects are shadcn (never native).
- All four states implemented; handles 409, 422, 500.
- TypeScript strict clean (no `any`); ESLint clean.
- No raw hex in JSX (tokens only).
- MSW flow demonstrably creates a "company" and lands on the dashboard.

## 7. Out of scope (YAGNI for now — deferred by design)

> Hardening is planned, not abandoned — full phased plan in
> `docs/COMPANY_ONBOARDING_VALIDATION_ROADMAP.md` (P1 validation → P2 email
> verification → **P3 duplicate-company prevention** → P4 abuse protection → P5
> breach/audit).

- **Strict validation** (password length/complexity, field-length limits) — agreed
  with backend team to come in a later phase.
- **Duplicate-company prevention** — today's signup does **not** stop the same company
  being created twice; that's roadmap P3 (unique workspace slug + domain-based "join
  existing company" flow).
- **`country` / `currency` / `timezone`** — captured later in Settings → Company
  Profile, not at signup.
- Email/MFA verification (instant login only).
- Subdomain/`slug`, company size, industry, phone, Terms checkbox.
- Captcha / rate-limiting UI.
- A post-signup setup wizard (departments/holidays seeding) — separate future work.
