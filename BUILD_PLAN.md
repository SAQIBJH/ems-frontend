# BUILD_PLAN.md — Execute one step at a time

> **For Claude Code.** This is an ordered build runbook. Execute it ONE STEP AT A TIME, top to bottom.
>
> **The rules of this file (do not violate):**
>
> 1. Read `CLAUDE.md` fully before starting any step. Re-read the referenced sections at each step.
> 2. Do exactly ONE step per turn. Never jump ahead. Never batch steps.
> 3. After building a step, run its **Test Gate**. Show me the command output.
> 4. If the Test Gate fails, FIX IT before moving on. Do not proceed with a failing gate.
> 5. If the Test Gate passes, commit with the given message, then STOP and tell me the step is done. Wait for me to say "next" before starting the following step.
> 6. If a step is ambiguous or you must make an assumption, state the assumption and ask before building. Do not invent backend endpoints — only auth is real (CLAUDE.md §3).
> 7. Keep each step's work scoped to that step. Do not refactor unrelated code.
>
> **How I (the user) drive this:** I will say "start step N" or "next". You execute that one step, test it, commit it, and stop. We repeat until the plan is done.

---

## Progress tracker

Mark each step as you complete it (change `[ ]` to `[x]`):

- [x] Step 1 — Foundations: tokens, providers, API client, auth
- [x] Step 2 — Layout shell (AppShell + AuthShell)
- [x] Step 3 — Login screen (real backend auth)
- [x] Step 4 — Auth guard + route protection
- [x] Step 5 — MSW infrastructure + first mock
- [x] Step 6 — Feedback components (Skeleton, EmptyState, ErrorState)
- [x] Step 7 — Employees module skeleton
- [x] Step 8 — Employees list screen
- [x] Step 9 — Employee profile screen
- [x] Step 10 — Employee create/edit form
- [x] Step 11 — Departments module + screen
- [x] Step 12 — Extract DynamicTable + DynamicForm engines
- [x] Step 13 — Attendance module + screen
- [ ] Step 14 — Leave module + screen
- [ ] Step 15 — Holidays module + screen
- [ ] Step 16 — Permissions matrix screen
- [ ] Step 17 — Settings screen
- [ ] Step 18 — HR / Manager / Employee dashboards
- [ ] Step 19 — Global polish: error boundaries, dark mode, a11y pass
- [ ] Step 20 — Final verification + demo readiness
- [ ] Step 21 — Security gate (DO NOT SKIP — B1 tenant test + B2 secrets are non-negotiable)

---

## Standard Test Gate (applies to every step unless overridden)

```bash
pnpm typecheck      # must be clean — zero errors
pnpm lint           # must be clean — zero errors
```

For any step that adds a screen or visible UI, ALSO:

```bash
pnpm dev            # boots without errors; the new route renders
```

(Manually confirm the route loads at http://localhost:3000, then stop the server.)

A step is DONE only when its Test Gate passes AND the step-specific "Definition of done" checklist is satisfied.

---

## STEP 1 — Foundations

**Goal:** Design tokens, providers, the API client with auth interceptor, and token storage. No screens yet.

**Read first:** CLAUDE.md §2, §4, §9, §10, §12.

**Build:**

1. `src/styles/tokens.css` — full token set from `docs/DESIGN_SYSTEM.md` §2 (colors light+dark, typography, spacing, radius, shadows, motion). Wire into Tailwind.
2. `src/lib/env.ts` — already created by bootstrap; verify it parses correctly.
3. `src/lib/query-client.ts` — TanStack Query client with sensible defaults: `retry: 2`, `staleTime: 30_000`, and a global error behavior so failed queries don't crash the UI.
4. `src/lib/api-client.ts` — Axios instance. Request interceptor attaches `x-tenant-key` (from env) and `Authorization: Bearer <token>`. Response interceptor: on 401, attempt one refresh via `/auth/refresh`, retry once, else clear auth and redirect to `/login`.
5. `src/lib/auth.ts` — in-memory access token storage (NOT localStorage), helpers to set/get/clear.
6. `src/providers/` — `QueryProvider`, `ThemeProvider` (data-theme attribute for dark mode), `AuthProvider` (calls `/auth/me` on mount). Compose them in `src/app/layout.tsx`.

**Definition of done:**

- Tokens render (a test element using `bg-surface text-primary` shows correct colors).
- `pnpm dev` boots with providers mounted, no console errors.
- No screen built yet — this is plumbing.

**Test Gate:** Standard (typecheck + lint + dev boots).

**Commit:** `feat: foundations — tokens, providers, api client, auth plumbing`

---

## STEP 2 — Layout shell

**Goal:** The visual frame every authenticated screen sits in, plus the auth frame.

**Read first:** CLAUDE.md §5; `docs/DESIGN_SYSTEM.md` §3; `docs/WIREFRAMES.pdf` (screens 1 and 4 show the shells).

**Build:**

1. `src/shared/layouts/AppShell.tsx` — sidebar (nav: Dashboard, Employees, Departments, Attendance, Leave, Holidays, Permissions, Settings) + topbar (search, notifications, user menu). Sidebar collapse state in Zustand, persisted.
2. `src/shared/layouts/AuthShell.tsx` — centered card layout for auth screens.
3. `src/shared/layouts/PageHeader.tsx` — breadcrumb + title + actions slot.
4. `src/app/(dashboard)/layout.tsx` — uses AppShell.
5. `src/app/(auth)/layout.tsx` — uses AuthShell.

**Definition of done:**

- Both layouts render with placeholder content inside.
- Sidebar nav items present (links can be dead for now).
- Responsive: sidebar collapses on narrow widths.
- Dark mode toggle works (even if just in user menu).

**Test Gate:** Standard. Manually confirm both `(dashboard)` and `(auth)` route groups render their shells.

**Commit:** `feat: AppShell, AuthShell, PageHeader layouts`

---

## STEP 3 — Login screen (real backend)

**Goal:** Working login against the REAL backend. This is the one screen that is not mocked.

**Read first:** CLAUDE.md §4, §10, §11; `docs/WIREFRAMES.pdf` screen 01.

**Build:**

1. `src/modules/auth/` module skeleton.
2. `src/modules/auth/validations/login.schema.ts` — Zod: email + password.
3. `src/modules/auth/services/auth.api.ts` — `login`, `refresh`, `logout`, `me`.
4. `src/modules/auth/hooks/useLogin.ts` — React Query mutation.
5. `src/app/(auth)/login/page.tsx` + `src/modules/auth/components/LoginForm.tsx` — RHF + Zod form, all four states (idle, submitting, error, success).

**Definition of done:**

- Submitting valid seed credentials (CLAUDE.md §4) logs in and redirects to `/dashboard`.
- Invalid credentials show an inline error, no crash.
- Network failure (e.g. backend cold-starting) shows a friendly error with retry, no crash.
- Loading state on the button while submitting.

**Test Gate:** Standard + manual login test with a real seed user. If the backend is asleep (Render cold start), the first attempt may be slow — confirm the loading state holds and it eventually succeeds or shows a clean error.

**Commit:** `feat: login screen with real backend auth`

---

## STEP 4 — Auth guard + route protection

**Goal:** Unauthenticated users can't reach dashboard routes.

**Read first:** CLAUDE.md §10.

**Build:**

1. Guard logic in `(dashboard)/layout.tsx` — if no valid session (via AuthProvider / `/auth/me`), redirect to `/login?next=<path>`.
2. `src/shared/guards/PermissionWrapper.tsx` — gates UI by permission; pulls abilities from `useAuth()`.
3. `src/shared/guards/RoleGate.tsx` — optional, gates by role.
4. After login, honor the `?next=` param.

**Definition of done:**

- Visiting `/employees` while logged out redirects to `/login`.
- After login, redirects back to the originally requested route.
- `<PermissionWrapper permission="x:write">` correctly hides/shows children.

**Test Gate:** Standard + manual: log out, try a deep link, confirm redirect; log in, confirm return.

**Commit:** `feat: auth guard and permission wrapper`

---

## STEP 5 — MSW infrastructure + first mock

**Goal:** Mock Service Worker wired up so all non-auth data is mocked realistically.

**Read first:** CLAUDE.md §3; `docs/PROJECT_SETUP_FRONTEND.md` §8.

**Build:**

1. `src/mocks/browser.ts`, `src/mocks/server.ts`, `src/mocks/handlers/index.ts`.
2. Conditional start: MSW runs only when `NEXT_PUBLIC_USE_MOCKS=true`.
3. One proof-of-life handler (e.g. `GET /health-mock`) returning the standard envelope.
4. Confirm auth requests PASS THROUGH to the real backend (not intercepted).

**Definition of done:**

- With mocks on, the proof-of-life endpoint resolves through React Query.
- Auth still hits the real backend.
- Envelope shape matches CLAUDE.md §4 exactly.

**Test Gate:** Standard. Confirm in browser network tab that the mock intercepts and auth passes through.

**Commit:** `feat: MSW infrastructure with passthrough auth`

---

## STEP 6 — Feedback components

**Goal:** The reusable state components every screen depends on.

**Read first:** CLAUDE.md §13; `docs/DESIGN_SYSTEM.md` §4.8.

**Build:**

1. `src/components/feedback/Skeleton.tsx` (or compose shadcn's).
2. `src/components/feedback/EmptyState.tsx` — title, description, optional action.
3. `src/components/feedback/ErrorState.tsx` — message, retry button, optional request id.
4. `src/components/data-display/StatsCard.tsx` — label, value, delta, loading state.
5. `src/components/feedback/ConfirmDialog.tsx`.

**Definition of done:**

- Each renders in isolation with sample props.
- All support dark mode via tokens.

**Test Gate:** Standard.

**Commit:** `feat: feedback and data-display primitives`

---

## STEP 7 — Employees module skeleton

**Goal:** Module scaffold + MSW handler + fixtures. No screen yet.

**Read first:** CLAUDE.md §6; the `/new-module` command.

**Build:** Run the equivalent of `/new-module employees`:

1. Module folders + `index.ts`.
2. `validations/employee.schema.ts` (Zod).
3. `types/employee.types.ts`.
4. `services/employees.api.ts` (list/get/create/update/delete).
5. `hooks/useEmployees.ts`, `useEmployee.ts`, mutations.
6. `src/mocks/handlers/employees.ts` matching the API contract.
7. `src/mocks/data/employees.ts` — 30 realistic fixtures.

**Definition of done:**

- `useEmployees()` returns mocked data through React Query.
- Mock returns the standard envelope with pagination.

**Test Gate:** Standard.

**Commit:** `feat: employees module skeleton with mocks`

---

## STEP 8 — Employees list screen

**Goal:** The directory screen. The most-used screen in the app.

**Read first:** CLAUDE.md §7, §8, §13; `docs/WIREFRAMES.pdf` screen 07.

**Build:**

1. `src/app/(dashboard)/employees/page.tsx`.
2. `src/modules/employees/components/EmployeeTable.tsx` — build DIRECTLY with TanStack Table (do not extract an engine yet — that's step 12).
3. Filter bar (search, department, status), pagination, status chips, row actions.
4. All four states.

**Definition of done:** CLAUDE.md §15 checklist. Loading skeleton, empty state, error state, success all work. Permission gate on "Add Employee".

**Test Gate:** Standard + manual: list renders, search filters, pagination works, simulate an error (toggle a mock to 500) and confirm the UI shows ErrorState, not a crash.

**Commit:** `feat: employees list screen`

---

## STEP 9 — Employee profile screen

**Read first:** CLAUDE.md §8; `docs/WIREFRAMES.pdf` screen 08.

**Build:** `employees/[id]/page.tsx` + profile header card + tabs (Overview, Job, Documents, Attendance, Leave, Activity). Overview tab fully built; others can be placeholder panels.

**Definition of done:** §15 checklist. Self/manager/HR permission differences respected per CLAUDE.md §10.

**Test Gate:** Standard + manual: click a row in the list → profile loads.

**Commit:** `feat: employee profile screen`

---

## STEP 10 — Employee create/edit form

**Read first:** CLAUDE.md §11; `docs/WIREFRAMES.pdf` screen 09.

**Build:** `employees/new/page.tsx` + `employees/[id]/edit/page.tsx` sharing an `EmployeeForm`. RHF + Zod. Map 422 errors to fields. Build directly (no DynamicForm engine yet).

**Definition of done:** §15. Validation works; server error mapping works; success redirects to the profile.

**Test Gate:** Standard + manual: create flow adds a row (in mock); validation errors display inline.

**Commit:** `feat: employee create and edit forms`

---

## STEP 11 — Departments module + screen

**Read first:** CLAUDE.md §6; `docs/WIREFRAMES.pdf` screen 10.

**Build:** `/new-module departments`, then the tree + detail screen.

**Definition of done:** §15. Tree renders nested; selecting a node loads detail.

**Test Gate:** Standard + manual.

**Commit:** `feat: departments module and screen`

---

## STEP 12 — Extract engines (DynamicTable + DynamicForm)

**Goal:** You now have 2+ tables and 2+ forms. Extract the shared engines. THIS is the right time (CLAUDE.md §7) — not earlier.

**Read first:** CLAUDE.md §7; `docs/DESIGN_SYSTEM.md` §4.1, §4.2; the `/refactor-to-engine` command.

**Build:**

1. `src/shared/engines/DynamicTable/` — generic, column-config driven.
2. `src/shared/engines/DynamicForm/` — generic, schema + field-config driven.
3. Refactor EmployeeTable and DepartmentTable to use DynamicTable.
4. Refactor EmployeeForm to use DynamicForm.

**Definition of done:** §15. Both screens still work identically after refactor. Engines are generic (no domain knowledge).

**Test Gate:** Standard + manual: employees list and departments still behave exactly as before.

**Commit:** `refactor: extract DynamicTable and DynamicForm engines`

---

## STEP 13 — Attendance module + screen

**Read first:** `docs/WIREFRAMES.pdf` screen 11.

**Build:** `/new-module attendance`, then the calendar grid + month summary screen. Use FilterEngine if you build one here.

**Test Gate:** Standard + manual.

**Commit:** `feat: attendance module and screen`

---

## STEP 14 — Leave module + screen

**Read first:** `docs/WIREFRAMES.pdf` screen 12.

**Build:** `/new-module leave`, then the approvals table (tabs: My Requests, Approvals, Team Calendar, Balances). Use DynamicTable.

**Test Gate:** Standard + manual: approve/deny updates the row optimistically; failure rolls back with a toast.

**Commit:** `feat: leave module and screen`

---

## STEP 15 — Holidays module + screen

**Read first:** `docs/WIREFRAMES.pdf` screen 13.

**Build:** `/new-module holidays`, then the 12-month year grid.

**Test Gate:** Standard + manual.

**Commit:** `feat: holidays module and screen`

---

## STEP 16 — Permissions matrix screen

**Read first:** CLAUDE.md §10; `docs/WIREFRAMES.pdf` screen 14.

**Build:** `permissions/page.tsx` — role × permission checkbox matrix. Custom component (not a generic engine). Super Admin only.

**Test Gate:** Standard + manual: toggling marks dirty; Save enabled only when dirty.

**Commit:** `feat: permissions matrix screen`

---

## STEP 17 — Settings screen

**Read first:** `docs/WIREFRAMES.pdf` screen 15.

**Build:** `settings/page.tsx` — left nav + Company Profile form panel.

**Test Gate:** Standard + manual.

**Commit:** `feat: settings screen`

---

## STEP 18 — Dashboards (HR, Manager, Employee)

**Read first:** CLAUDE.md §8; `docs/WIREFRAMES.pdf` screens 04, 05, 06.

**Build:** `/new-module dashboard`. Role-aware `dashboard/page.tsx` rendering the correct dashboard per role. Reuse StatsCard; build ChartEngine wrapping Recharts. Use Suspense boundaries with skeletons per CLAUDE.md §8.

**Test Gate:** Standard + manual: log in as each seed role, confirm the right dashboard renders.

**Commit:** `feat: role-aware dashboards`

---

## STEP 19 — Global polish

**Goal:** Make failures graceful and the app cohesive.

**Build:**

1. `src/app/error.tsx` and per-route `error.tsx` boundaries — friendly fallback, never a white screen.
2. Global query error handling: ensure every failed fetch shows ErrorState or a toast, never an unhandled throw.
3. Full dark mode pass on every screen.
4. a11y pass: keyboard nav, focus rings, aria labels, `prefers-reduced-motion`.
5. Loading skeletons audited on every data screen.
6. Clear deferred react-doctor findings from the Step 4 scan:
   - `size-N` shorthand (`w-N h-N → size-N`): AppShell, AuthGuard, AuthShell, LoginForm, PageHeader (~18 instances)
   - `p-N` shorthand (`px-6 py-6 → p-6`): dashboard/page.tsx
   - Destructure router methods (`const { push } = useRouter()`): AppShell, AuthGuard, LoginForm
   - `useContext` → `use(Context)`: AuthProvider
   - `bg-black` → `bg-gray-950`: app/page.tsx
   - Re-run react-doctor at end of Step 19; target 99–100.

**Definition of done:** Kill the backend (or set an invalid API URL) and click through the app — nothing crashes; every screen shows a clean error or empty state.

**Test Gate:** Standard + the "kill the backend" manual test above.

**Commit:** `feat: error boundaries, dark mode, and a11y polish`

---

## STEP 20 — Final verification + demo readiness

**Build:**

1. Run the full `/verify` checklist.
2. `pnpm build` — production build must succeed.
3. Click through the 5 demo-critical screens end to end: Login → HR Dashboard → Employees list → Profile → Leave approval.
4. Deploy to Vercel; set env vars there; confirm the deployed URL works.
5. Confirm CORS: the deployed frontend can reach the backend (backend dev must whitelist the Vercel URL).

**Definition of done:**

- `pnpm build` succeeds.
- All 5 demo screens work on the deployed URL.
- No console errors in production build.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Plus manual click-through on the deployed URL.

**Commit:** `chore: demo-ready build`

---

## STEP 21 — Security gate (DO NOT SKIP)

**Goal:** Find security problems before someone else does. This step is mostly NOT code Claude Code writes — it is checks a HUMAN must run and act on. Claude Code's job here is to run the automated parts, report findings honestly, and refuse to mark this step "done" if any CRITICAL check fails.

> **Read this first, out loud if you have to:** A passing checklist does not mean the app is secure. It means these specific things were checked. The two CRITICAL checks below (multi-tenant isolation and secret exposure) are the ones that, if failed, can leak real employee data. They are not optional. If either fails, this step BLOCKS the demo until fixed — no exceptions for deadlines.

### Part A — Automated frontend scan (Claude Code runs these)

```bash
# 1. React code health + frontend security lint
npx -y react-doctor@latest . --verbose

# 2. Dependency vulnerability audit
pnpm audit --audit-level=high

# 3. Confirm no secrets are committed or about to be
git log --all --full-history -p | grep -iE "tenant.key|api.key|secret|password|bearer " || echo "No obvious secrets in git history"
grep -rIn -E "(NEXT_PUBLIC_TENANT_KEY|Bearer |sk-|password.*=.*['\"])" src/ || echo "No hardcoded secrets in src/"
```

**Pass criteria for Part A:**

- react-doctor score ≥ 70, and ZERO error-severity findings in the `security` category.
- `pnpm audit` shows no HIGH or CRITICAL vulnerabilities (moderate is acceptable for a demo; note them).
- No secrets found in git history or source.

### Part B — CRITICAL manual checks (the human runs these; Claude Code cannot)

These are the checks that actually protect employee data. Claude Code: present these to the user as a checklist and require explicit confirmation of each before marking Step 21 done. Do NOT perform them yourself against the live backend without the user's involvement — they require two real tenant accounts.

**B1 — MULTI-TENANT ISOLATION BREACH TEST (highest priority in the whole project):**

1. Create or obtain two separate tenants: Tenant A and Tenant B, each with its own user and tenant key.
2. Log in as Tenant A. Create one employee. Note the employee's ID.
3. Log in as Tenant B. Get Tenant B's access token.
4. Attempt each of these and record the result:
   - `GET /employees/{tenant-A-employee-id}` with Tenant B's token + Tenant B's key → **MUST return 403 or 404, NOT the data.**
   - Same request with Tenant B's token + Tenant A's key in the header → **MUST be rejected.**
   - Same request with Tenant A's token but NO `x-tenant-key` header → **MUST be rejected.**
5. **If ANY of these returns Tenant A's employee data, you have a data leak. STOP. This blocks everything. Report it to the backend dev as a P0. Do not demo until fixed.**

**B2 — SECRET EXPOSURE:**

- Confirm `.env.local` is in `.gitignore` and was never committed: `git log --all -- .env.local` should return nothing.
- Confirm `.claude/settings.local.json` is gitignored.
- Confirm the tenant key / any credential has never appeared in a commit, screenshot shared publicly, or pushed branch.

**B3 — AUTH BEHAVIOR:**

- Access token actually expires (wait past the 15-min TTL, confirm a protected call then forces refresh).
- Logout invalidates the session (after logout, the old token is rejected by the backend).
- A protected route accessed with a tampered/garbage token returns 401, and the UI redirects to login rather than crashing.

**B4 — PERMISSION ENFORCEMENT IS SERVER-SIDE:**

- Pick one action an Employee role should NOT be able to do (e.g. delete an employee).
- Confirm the UI hides it (PermissionWrapper) AND that calling the endpoint directly (e.g. via curl with an Employee token) is rejected by the backend with 403.
- If the UI hides it but the API allows it, your permissions are theater. Report to backend dev.

**B5 — TRANSPORT & ERRORS:**

- All API calls are HTTPS (no mixed content).
- Error responses do not leak stack traces, SQL, or internal paths to the client.
- CORS allows only your known origins (localhost dev, Vercel preview, production domain) — not `*`.

### Definition of done

- Part A automated checks pass (or findings are documented and consciously accepted as non-blocking for a demo).
- Part B1 (tenant isolation) and B2 (secrets) are confirmed PASSING. **These two are non-negotiable. A failure here blocks the demo regardless of timeline.**
- B3, B4, B5 are either confirmed passing or logged as known issues with an owner and a date, AND none of the open issues involve cross-tenant data access.

### Test Gate

```bash
npx -y react-doctor@latest . --score
pnpm audit --audit-level=high
```

Plus the human's written confirmation of B1–B5. Claude Code: do not mark Step 21 complete on automated checks alone. Require the user to state the result of the B1 breach test explicitly.

**Commit:** `chore: security gate — automated scans clean, manual checks recorded`

> **Honest scope note for when this stops being a demo:** The checks above are the floor for showing this to stakeholders. Before real companies put real employee data in this system — especially "globally," across jurisdictions — you need more than this gate: a professional security review / penetration test, dependency supply-chain monitoring, rate-limit and brute-force protection verified under load, audit logging that's tamper-evident, data-retention and deletion flows, and legal/compliance work (GDPR, India DPDP Act, and the rules of every region you operate in). No markdown checklist replaces that. When you cross from demo to real customers, budget for it explicitly.

---

## If you (Claude Code) are unsure at any point

- Re-read the relevant CLAUDE.md section. The answer is usually there.
- If genuinely ambiguous, ask me. Do not guess at backend behavior.
- Never mark a step done with a failing Test Gate.
- Never proceed to the next step without me saying "next".
