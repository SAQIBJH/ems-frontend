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
- [x] Step 14 — Leave module + screen
- [x] Step 15 — Holidays module + screen
- [x] Step 16 — Permissions matrix screen
- [x] Step 17 — Settings screen
- [x] Step 18 — HR / Manager / Employee dashboards
- [x] Step 19 — Global polish: error boundaries, dark mode, a11y pass
- [x] Step 20 — Final verification + demo readiness
- [x] Step 21 — Security gate (Phase 1 demo shipped)

---

### PHASE 1.5 — Wireframe parity + missing functionality (post-demo)

> Phase 1 demo is over. Stakeholder feedback: **match `docs/WIREFRAMES.pdf` exactly**
> and fill in the functionality gaps. Steps below are self-contained — each
> re-establishes context from cold so a fresh session can pick up at any step.
>
> Every step ends with the same protocol:
>
> 1. Run `pnpm typecheck` and `pnpm lint`. Show the output.
> 2. Commit with the conventional-format message in the step.
> 3. **STOP** and wait for the user to say "next".

#### Foundation primitives (UI fixes that touch shared files — do these first)

- [x] Step 22 — Tokens: fix dark-mode `--accent` invisibility
- [x] Step 23 — Button primitive: sizing, cursor, breathing space
- [x] Step 24 — Select primitive: render label by value (no more IDs) + cursor
- [x] Step 25 — Dropdown / context menus: cursor + dark-mode hover audit

#### Layout shell parity

- [x] Step 26 — Topbar: global search input (MSW → LIVE 2026-05-25)
- [x] Step 27 — Topbar: notification bell + popover (MSW → LIVE 2026-05-25; PATCH not POST)
- [x] Step 28 — PageHeader: breadcrumbs + personalized greeting on dashboards

#### Auth flows that are missing entirely

- [x] Step 29 — Forgot password + Reset password screens (MSW → LIVE 2026-05-25)
- [x] Step 30 — OTP verification screen (otp/initiate still MSW; verify-otp LIVE)

#### Dashboard wireframe parity

- [x] Step 31 — HR Admin Dashboard: rebuild to wireframe screen 04
- [x] Step 32 — Manager Dashboard: rebuild to wireframe screen 05
- [x] Step 33 — Employee Dashboard: rebuild to wireframe screen 06

#### Employees screens parity

- [x] Step 34 — Employees List: Code + Joined columns, Density/Columns menus, Export button
- [x] Step 35 — Employees List: bulk deactivate + bulk export (MSW)
- [x] Step 36 — Employee Profile: Documents tab — live API (Cloudinary multipart, HR-only upload/delete)
- [x] Step 37 — Employee Profile: populate Attendance / Leave / Activity tabs
- [x] Step 38 — Employee Profile: Deactivate with type-employee-code confirmation
- [x] Step 39 — Employee Create: 4-step stepper (Personal / Job / Documents / Access)

#### Departments parity

- [x] Step 40 — Department detail: employee list table + reassign-and-delete (LIVE API)

#### Attendance parity

- [x] Step 41 — Attendance: Calendar/Table view toggle + dept/employee filter
- [x] Step 42 — Attendance: Day-detail drawer + regularization supporting doc

#### Leave parity

- [x] Step 43 — Leave: Team Calendar tab (real month grid via MSW)
- [x] Step 44 — Leave: Bulk approve modal + coverage warning chip (MSW)

#### Holidays parity

- [x] Step 45 — Holidays: year overview default + `.ics` import flow (MSW)

#### Permissions parity

- [x] Step 46 — Permissions: Add custom role + "X users affected" preview (MSW)

#### Settings restructure (biggest gap from demo)

- [x] Step 47 — Settings: restructure left nav into 6 groups + sub-routes
- [x] Step 48 — Settings: Sessions & devices + Audit log (live APIs)
- [x] Step 49 — Settings: Branding + Leave types CRUD (live API)
- [x] Step 50 — Settings: Attendance rules + Authentication + Notification prefs (live API)
- [x] Step 51 — Settings: Integrations / Billing placeholders ("Phase 2" cards)

#### Final polish

- [x] Step 52 — EmptyState illustrations + a11y dark-mode sweep
- [x] Step 53 — Wireframe parity verification walk-through (all 15 screens)
- [x] Step 54 — Production build + demo redeploy

### PHASE 2 — Payroll, Reports & Analytics

- [x] Step 55 — Payroll module skeleton: types, MSW, services, hooks, route registration
- [x] Step 56 — Settings: Pay & Compliance → Salary Components CRUD
- [x] Step 57 — Settings: Pay Groups CRUD (payroll templates)
- [x] Step 58 — Employee Profile: Compensation tab (salary assignment + live preview)
- [x] Step 59 — Payroll: Run payroll flow (initiate → calculate → review)
- [x] Step 60 — Payroll: Run detail page + payslip viewer
- [x] Step 61 — Payroll: Employee self-service payslip history
- [x] Step 62 — Reports: Module skeleton + page layout + MSW
- [x] Step 63 — Reports: Workforce reports (Headcount + Turnover + Demographics)
- [x] Step 64 — Reports: Attendance & Leave reports
- [x] Step 65 — Reports: Payroll reports + Export
- [x] Step 66 — Analytics: Dedicated /analytics page (existing endpoints)
- [x] Step 67 — Analytics: Workforce trend + attrition + payroll-cost charts (MSW)

### PHASE 2.5 — Settings: Integrations & Billing (functional screens)

- [x] Step 68 — Settings: Email Integration panel (provider config + test send)
- [x] Step 69 — Settings: Storage Integration panel (provider config + retention rules + test)
- [ ] Step 70 — Settings: Webhooks panel (full CRUD + delivery log)
- [ ] Step 71 — Settings: Plan & Subscription panel (current plan + usage + plan comparison)
- [ ] Step 72 — Settings: Invoices panel (invoice table + CSV export)

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
4. `src/lib/api-client.ts` — Axios instance with `baseURL: '/api'` and `withCredentials: true`. **No** `Authorization` header, **no** `x-tenant-key` — auth is cookie-based, tenant is resolved from the JWT (see `CLAUDE.md §3, §4, §10`). Response interceptor: on 401, queue + attempt one refresh via `/auth/refresh`, drain queue on success, else clear cache and redirect to `/login?next=<path>`.
5. (Removed — there is no `src/lib/auth.ts`; cookies are the only token store.)
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

---

# PHASE 1.5 — Wireframe parity + missing functionality

> **Each step below is self-contained for cold-start resumption.** A fresh
> Claude session should be able to read one step in full and execute it
> without external context. Each step ends with the same close protocol:
>
> 1. Run `pnpm typecheck` and `pnpm lint`. Show me the output.
> 2. For UI changes, also `pnpm dev` and confirm the affected route renders
>    in both light and dark mode with no console errors.
> 3. Commit with the exact conventional-format message in the step.
> 4. **STOP.** Wait for the user to say "next".
>
> **Hard rules** (apply to every step):
>
> - Wireframe parity is non-negotiable — see `CLAUDE.md §21`.
> - Backend endpoints we don't have: mock via MSW exactly per
>   `docs/BACKEND_API_REQUESTS.md`. Types + service unwrap must mirror the
>   spec shape so the live endpoint drops in unchanged.
> - Don't introduce a new state library, UI kit, or styling solution
>   (`CLAUDE.md §2`).
> - Don't reach into another module's internals. Use the module's barrel
>   `index.ts` (`CLAUDE.md §6`).

---

## STEP 22 — Tokens: fix dark-mode `--accent` invisibility

**Goal:** Hovered dropdown / select items must be legible in dark mode.

**Read first:** `CLAUDE.md §12`; this whole step.

**Current bug (confirmed):**

- `src/app/globals.css:104` defines `--accent: var(--brand-50);`
- `src/styles/tokens.css` does **not** redefine `--brand-50` (or `--accent`) for `[data-theme='dark']`.
- In dark mode `--accent` stays `hsl(222 100% 97%)` (near-white) while `--accent-foreground` → `var(--text-primary)` flips to `hsl(220 14% 96%)` (also near-white).
- Result: hovered `SelectItem` / `DropdownMenuItem` shows white-on-white text. Affects every dropdown.

**Build:**

1. In `src/styles/tokens.css` under `[data-theme='dark']`, add the dark-mode accent block:
   ```css
   --accent: hsl(222 16% 18%); /* tonal subtle hover bg */
   --accent-foreground: hsl(220 14% 96%);
   ```
   Define both as raw HSL inside the `[data-theme='dark']` block (since `--accent` is consumed via `--color-accent` in `globals.css @theme inline`).
2. Sanity-check other paired tokens at `globals.css:96-128` for the same bug pattern (one half flips, the other doesn't):
   - `--popover` / `--popover-foreground` — should be fine because both reference `--bg-surface` and `--text-primary`, both flip. Confirm.
   - `--secondary` / `--secondary-foreground` — confirm both flip.
   - `--muted` / `--muted-foreground` — confirm.
3. Do **not** change the light-mode values. Light-mode is correct.

**Definition of done:**

- In dark mode, open the user-menu dropdown in the topbar, the dept filter in the employees list, the timezone selector in Settings → Company Profile. Each hovered/focused item shows readable text.
- Light mode unchanged.

**Files to modify:** `src/styles/tokens.css`, possibly `src/app/globals.css` (only if a paired token is broken).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus: `pnpm dev`, toggle dark mode, hover three dropdowns.

**Commit:** `fix(tokens): redefine --accent for dark mode so dropdown hover is legible`

**STOP.** Wait for "next".

---

## STEP 23 — Button primitive: sizing, cursor, breathing space

**Goal:** Buttons feel like Linear / Vercel — bigger, breathable, with a pointer cursor.

**Read first:** `CLAUDE.md §13, §20`; this step.

**Current state (file:line):**

- `src/components/ui/button.tsx:6` — base classes have **no** `cursor-pointer` (Base UI's `<Button>` element gets browser-default pointer on `<button>` but not when used as link via `buttonVariants(...)`).
- `src/components/ui/button.tsx:22-34` — size scale is tight:
  - `default = h-8 px-2.5` (32 px tall, 10 px H pad)
  - `sm = h-7 px-2.5`
  - `lg = h-9 px-2.5`
  - Same horizontal padding for every size → no hierarchy.
  - `gap-1.5` (6 px) between icon and label feels cramped.

**Target scale (matches enterprise B2B feel):**
| size | height | horizontal pad | icon gap | text |
|---|---|---|---|---|
| `xs` | h-7 | px-2.5 | gap-1.5 | text-xs |
| `sm` | h-8 | px-3 | gap-2 | text-[0.8125rem] |
| `default` | h-9 | px-4 | gap-2 | text-sm |
| `lg` | h-10 | px-5 | gap-2 | text-sm |
| `icon` | size-9 | — | — | — |
| `icon-sm` | size-8 | — | — | — |
| `icon-xs` | size-7 | — | — | — |
| `icon-lg` | size-10 | — | — | — |

**Build:**

1. In `src/components/ui/button.tsx`, edit the `buttonVariants` base:
   - Add `cursor-pointer disabled:cursor-not-allowed` to the base class string.
   - Keep all existing focus/aria/transition classes.
2. Update the size variant map to the table above.
3. Adjust `has-data-[icon=inline-end]` / `has-data-[icon=inline-start]` pads so they balance with the new horizontal pads (e.g. `default` size with leading icon → `pl-3` instead of `pl-2`).
4. **Audit call sites.** A lot of code calls `size="sm"` expecting "default-sized button". After this change `sm` is now genuinely smaller. Search for `size="sm"` and decide per call site whether it should now be `default`. Likely flips to `default`:
   - Header action buttons (`page.tsx` files for employees, departments, holidays, leave, settings)
   - Form submit buttons in `CompanyProfilePanel.tsx`, `PermissionsMatrix.tsx`
   - Keep `sm` for: row actions, dropdown menu triggers, inline cell buttons.
5. Don't introduce variant changes that aren't covered above. Don't refactor unrelated styles.

**Definition of done:**

- Every primary action button feels at least ~36 px tall.
- Hovering any button shows pointer cursor.
- No visual regression on icon-only / sized buttons.

**Files to modify:** `src/components/ui/button.tsx`, plus the call-site fixups (likely 5-10 files).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus: `pnpm dev`, click through dashboard / employees / settings, confirm buttons look right in light + dark.

**Commit:** `refactor(button): bigger default size, breathing space, cursor-pointer`

**STOP.** Wait for "next".

---

## STEP 24 — Select primitive: render label by value (no more IDs) + cursor

**Goal:** When a department / manager / leave-type is selected, the trigger shows the **name**, not the CUID.

**Read first:** `CLAUDE.md §6, §13`; this step.

**Current bug (confirmed):**

- `src/components/ui/select.tsx:21-29` — `SelectValue` is a thin wrapper around Base UI's `<Select.Value>`.
- Base UI's `<Select.Value>` renders the **stored value** unless either (a) `items={...}` is passed to `<Select.Root>` with `{ value, label }` pairs, or (b) a `children` render function is passed.
- Every call site passes `value={d.id}` and label as children of `SelectItem`. So after selection, the trigger shows the ID.
- Affected: `EmployeeForm.tsx:213-225` (department), `EmployeeTable.tsx:264-277` (department filter), `LeaveRequestsTable.tsx`, `NewLeaveRequestDialog.tsx`, `DepartmentForm.tsx`.

**Approach (chosen):** extend `SelectValue` to accept a `children` render function `(value: string) => ReactNode`. Each call site passes a mapper that resolves value → label from the same array it iterates for `SelectItem`s. Minimal blast radius; no Base UI items-prop migration needed.

**Build:**

1. In `src/components/ui/select.tsx`, change `SelectValue` to:
   ```tsx
   function SelectValue({
     className,
     children,
     placeholder,
     ...props
   }: Omit<SelectPrimitive.Value.Props, 'children'> & {
     children?: (value: string) => React.ReactNode;
     placeholder?: string;
   }) {
     return (
       <SelectPrimitive.Value
         data-slot="select-value"
         className={cn('flex flex-1 text-left', className)}
         {...props}
       >
         {(value: unknown) => {
           if (value == null || value === '') return placeholder ?? '';
           const v = String(value);
           return children ? children(v) : v;
         }}
       </SelectPrimitive.Value>
     );
   }
   ```
   (Adjust the exact prop signature to match the installed `@base-ui/react` Select.Value typings. The point is: render via a function that calls the passed `children(value)`, defaulting to the value if no mapper is given.)
2. Replace `cursor-default` with `cursor-pointer` at `src/components/ui/select.tsx:114` (`SelectItem` base classes).
3. Update every call site that has `value=id, label=name` to pass the mapper:
   ```tsx
   <SelectValue placeholder="Select department">
     {(v) => flatDepts.find((d) => d.id === v)?.name ?? v}
   </SelectValue>
   ```
   Files to touch:
   - `src/modules/employees/components/EmployeeForm.tsx:213-225` (department) — also the manager picker if it's a Select.
   - `src/modules/employees/components/EmployeeTable.tsx:264-277` (department filter).
   - `src/modules/leave/components/LeaveRequestsTable.tsx` (status / leave-type filters).
   - `src/modules/leave/components/NewLeaveRequestDialog.tsx` (leave-type).
   - `src/modules/departments/components/DepartmentForm.tsx` (parent picker).
4. Leave selects where `value === label` (timezone in `CompanyProfilePanel.tsx`, employment type, gender, status) unchanged — they happen to work but won't break with the new render path.

**Definition of done:**

- Open Employee → Create / Edit → pick a department → trigger shows the dept name, not the ID. Same in the Employees List department filter.
- Cursor is pointer on every select item.

**Files to modify:** `src/components/ui/select.tsx` + 5 call sites listed above.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus: `pnpm dev`, manual test department-pick flow.

**Commit:** `fix(select): render label by value (was showing ids) + cursor-pointer on items`

**STOP.** Wait for "next".

---

## STEP 25 — Dropdown / context menus: cursor + dark-mode hover audit

**Goal:** Every dropdown menu item shows pointer cursor and stays legible in dark mode.

**Read first:** Step 22's output; this step.

**Current state (file:line):**

- `src/components/ui/dropdown-menu.tsx:91, 116, 151, 165, 201` — `DropdownMenuItem`, `DropdownMenuSubTrigger`, scroll buttons, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem` all use `cursor-default`.
- After Step 22 the `--accent` token is correct in dark mode; this step just makes sure the cursor is right and the focus state on these primitives uses the corrected token.

**Build:**

1. In `src/components/ui/dropdown-menu.tsx` replace `cursor-default` with `cursor-pointer` in each of: `DropdownMenuItem`, `DropdownMenuSubTrigger`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`. Keep scroll buttons at `cursor-default` (they're auto-scroll, not click targets).
2. Confirm the focus styles all use `focus:bg-accent focus:text-accent-foreground` (they do already) — no change needed, Step 22 fixed the token.
3. Also fix `src/modules/settings/components/SettingsScreen.tsx:51` — left-nav `<button>`s should be `cursor-pointer` (they're plain buttons, not the shared primitive). Easiest: add `cursor-pointer` to the `cn(...)` string.

**Definition of done:**

- Every dropdown menu item (topbar user menu, row actions on Employees / Departments / Holidays, leave approve dropdown) hovers with pointer + readable text in both themes.

**Files to modify:** `src/components/ui/dropdown-menu.tsx`, `src/modules/settings/components/SettingsScreen.tsx`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `fix(dropdown): cursor-pointer on items + settings left-nav buttons`

**STOP.** Wait for "next".

---

## STEP 26 — Topbar: global search input (with MSW handler)

**Goal:** Topbar in every authenticated screen has a search input with ⌘/Ctrl + / keyboard shortcut and a results popover.

**Read first:** `docs/WIREFRAMES.pdf` screens 04–15 (every screen shows the topbar with Search…); `docs/BACKEND_API_REQUESTS.md §3`; `CLAUDE.md §22`.

**API contract (mock now, real endpoint later):**

- `GET /search?q=&types=&limit=8` — see `BACKEND_API_REQUESTS.md §3` for the exact response.

**Build:**

1. Add MSW handler `src/mocks/handlers/search.ts` returning the spec shape. Reuse existing fixture data from `src/mocks/data/employees.ts`, `src/mocks/data/departments.ts` for the substring match.
2. Wire into `src/mocks/handlers/index.ts`.
3. New module `src/modules/search/` with the standard module anatomy (`services/`, `hooks/`, `types/`, `index.ts`). Service unwraps the documented shape.
4. New component `src/modules/search/components/GlobalSearch.tsx`:
   - Renders an `<Input>` with a `SearchIcon`.
   - On focus or ⌘/Ctrl + `/`, opens a `Popover` with the results.
   - Debounce 250 ms.
   - Group results by `type`, each group with a header chip ("Employees · 3", "Departments · 1").
   - Arrow-key navigation, Enter selects, Esc closes.
   - On select, navigate to `result.url`.
5. Place in `src/shared/layouts/AppShell.tsx` Topbar — between the mobile-menu button and the right-side actions. Spacer no longer needed.
6. Keyboard shortcut: register a `keydown` listener (mounted while topbar is mounted) for `e.key === '/'` (when target is body, not input) → focuses the search input. Also handle ⌘/Ctrl+K for the same.

**Definition of done:**

- On any authenticated screen, the topbar shows a Search input occupying the middle horizontal space.
- Press `/` (when not focused in an input) — search focuses.
- Type "pri" — popover lists matching employees (from mock).
- Click a result — navigates to the URL.
- Empty query → popover hidden.

**Files to create:** `src/mocks/handlers/search.ts`, `src/modules/search/**`.
**Files to modify:** `src/mocks/handlers/index.ts`, `src/shared/layouts/AppShell.tsx`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` and manual test.

**Commit:** `feat(search): topbar global search with MSW-backed /search endpoint`

**STOP.** Wait for "next".

---

## STEP 27 — Topbar: notification bell + popover (MSW)

**Goal:** Bell shows unread badge + opens a list popover. Polls for new notifications.

**Read first:** `docs/WIREFRAMES.pdf` screens 04, 05, 12; `docs/BACKEND_API_REQUESTS.md §2`; `CLAUDE.md §22`.

**API contract (mock now):** see `BACKEND_API_REQUESTS.md §2` — `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`, plus polling via `?since=` parameter.

**Build:**

1. MSW handler `src/mocks/handlers/notifications.ts` with seed notifications (8-10 of varied types). Implement the list, mark-read, and mark-all-read endpoints exactly per spec.
2. Wire into `src/mocks/handlers/index.ts`.
3. New module `src/modules/notifications/` standard anatomy + a `useNotifications()` hook that polls every 30 s with `refetchInterval`.
4. New component `src/modules/notifications/components/NotificationBell.tsx`:
   - Bell icon + red badge with `unreadCount` if > 0.
   - Click → `Popover` with list (avatar by `type` color, title, body excerpt, relative time).
   - "Mark all as read" link at the bottom.
   - Item click → navigate to `actionUrl`, mark that one as read.
   - Empty state inside popover: "You're all caught up."
5. Replace the bare `<Bell />` button in `AppShell.tsx:282-284` with the new `NotificationBell`.

**Definition of done:**

- Bell shows badge with count.
- Click → popover shows 8 mocked notifications.
- "Mark all as read" clears the badge.
- Clicking a notification navigates to the URL.

**Files to create:** `src/mocks/handlers/notifications.ts`, `src/modules/notifications/**`.
**Files to modify:** `src/mocks/handlers/index.ts`, `src/shared/layouts/AppShell.tsx`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` manual.

**Commit:** `feat(notifications): bell with unread badge + MSW-backed list`

**STOP.** Wait for "next".

---

## STEP 28 — PageHeader: breadcrumbs + personalized greeting on dashboards

**Goal:** Every authenticated screen shows a breadcrumb trail (wireframe shows "Home / X" on every page). Dashboards show personalized greeting ("Welcome back, Aman" / "Hi Priya").

**Read first:** Wireframe screens 04, 05, 06 (greeting copy varies); `src/shared/layouts/PageHeader.tsx`.

**Current state:**

- `PageHeader` supports `breadcrumbs` but Leave, Holidays, Settings screens don't pass it.
- Dashboard pages show a generic `<PageHeader title="Dashboard" description="Welcome back. Here's what's happening." />` — not personalized.

**Build:**

1. Audit every page-level component for `breadcrumbs` prop:
   - `LeaveScreen.tsx:33-36` — add `breadcrumbs={[{ label: 'Leave' }]}`.
   - `HolidayScreen.tsx:64-77` — add breadcrumbs.
   - `SettingsScreen.tsx:43` — add breadcrumbs.
   - Department pages already have it; verify.
2. In `src/app/(dashboard)/dashboard/page.tsx`, remove the generic `PageHeader`. Let `DashboardRouter` render the role-specific dashboard, **which renders its own personalized greeting** as the first element.
3. In each role dashboard component, add a personalized greeting block at the top:
   - `HRDashboard.tsx` — `Welcome back, {firstName}` (use `useAuth()` → `user.employee.firstName`, fallback to email-local-part).
   - `ManagerDashboard.tsx` — `My Team` heading (wireframe screen 05 shows "My Team", not personalized).
   - `EmployeeDashboard.tsx` — `Hi {firstName}`.
4. Greeting is a `<h1 className="text-2xl font-semibold tracking-tight text-fg">`. Sub-line stays as today's date for HR / "Manage your team's day-to-day" for Manager / motivational for Employee — match wireframe copy where shown.

**Definition of done:**

- Login as HR → `/dashboard` shows "Welcome back, HR" + breadcrumb.
- Login as Manager → "My Team".
- Login as Employee → "Hi Priya".
- All non-dashboard screens have breadcrumbs.

**Files to modify:** `src/app/(dashboard)/dashboard/page.tsx`, the three dashboard components, `LeaveScreen.tsx`, `HolidayScreen.tsx`, `SettingsScreen.tsx`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` cycle through the four seed users.

**Commit:** `feat(layout): breadcrumbs everywhere + personalized greetings on dashboards`

**STOP.** Wait for "next".

---

## STEP 29 — Forgot password + Reset password screens (MSW)

**Goal:** Working forgot-password and reset-password flows behind MSW.

**Read first:** `docs/WIREFRAMES.pdf` screen 02; `docs/BACKEND_API_REQUESTS.md §1` (`POST /auth/forgot-password`, `POST /auth/reset-password`).

**Current state:** `src/app/(auth)/forgot-password/` directory exists but has **no** `page.tsx` → route 404s. No reset-password route at all.

**Build:**

1. MSW handlers for `POST /auth/forgot-password` and `POST /auth/reset-password` in `src/mocks/handlers/auth.ts` (or add the file if absent). Match spec shapes — always 202 for forgot-password regardless of email.
2. Schemas in `src/modules/auth/validations/forgot-password.schema.ts` and `reset-password.schema.ts`.
3. Service methods in `src/modules/auth/services/auth.api.ts`: `forgotPassword(email)`, `resetPassword(token, password)`.
4. Hooks: `useForgotPassword`, `useResetPassword` (React Query mutations).
5. `src/modules/auth/components/ForgotPasswordForm.tsx` — RHF + Zod, single email field, submit shows success card with copy from wireframe: "If an account exists, we have sent a link." Both states (idle, submitting, success, error).
6. `src/modules/auth/components/ResetPasswordForm.tsx` — RHF + Zod, password + confirm-password fields. Reads `token` from query string. On success, redirect to `/login` with a banner.
7. Pages: `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx` — both inside the `(auth)` route group so they get the `AuthShell`.
8. Wire "Forgot password?" link in `LoginForm.tsx` (already points to `/forgot-password` — verify).

**Definition of done:**

- `/forgot-password` renders the wireframe layout: heading "Forgot your password?", subtitle, email field, "Send reset link" button, "Back to sign in" link.
- Submit → 202 → success card.
- `/reset-password?token=abc` renders password + confirm fields, submit → 200 → redirect to login with toast.
- Invalid token → inline error.

**Files to create:** Forgot/Reset pages + components + schemas; MSW handlers.
**Files to modify:** `src/modules/auth/services/auth.api.ts`, `src/mocks/handlers/auth.ts` (or new), `src/mocks/handlers/index.ts`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev`, walk both forms in light + dark mode.

**Commit:** `feat(auth): forgot-password and reset-password screens (MSW)`

**STOP.** Wait for "next".

---

## STEP 30 — OTP verification screen (MSW)

**Goal:** 6-cell OTP input screen with resend cooldown and lockout-after-5 behaviors.

**Read first:** Wireframe screen 03; `docs/BACKEND_API_REQUESTS.md §1` (`POST /auth/otp/initiate`, `POST /auth/verify-otp`).

**Current state:** `src/app/(auth)/otp-verification/` directory empty.

**Build:**

1. MSW handler for `POST /auth/otp/initiate` and the existing `POST /auth/verify-otp` (already in `API_MAPPING.md` — verify MSW or live). Match spec shape, include the resend cooldown timestamps.
2. Custom OTP input component `src/modules/auth/components/OtpInput.tsx`:
   - 6 cells (one digit each).
   - Auto-advance on type, backspace moves left, paste-aware (pasting "123456" fills all six).
   - Aria-labeled, keyboard navigable.
3. `src/modules/auth/components/OtpVerificationForm.tsx`:
   - Reads `challengeId` from query string.
   - Calls `/auth/otp/initiate` on mount to get `expiresAt` and `resendAvailableAt`.
   - 60-sec resend countdown ("Didn't get the code? Resend in 0:45").
   - 5-failure lockout (local counter — server enforces too).
   - "Verify and continue" submit button.
4. Page `src/app/(auth)/otp-verification/page.tsx` inside the `(auth)` group.
5. Update `useLogin` hook to handle the `mfaRequired` branch: on a login response with `{ mfaRequired: true, challengeId }`, redirect to `/otp-verification?challengeId=...`.

**Definition of done:**

- Hitting the MFA branch redirects to the OTP screen.
- Paste a 6-digit code → cells fill, auto-submit.
- Successful verify → app boots like normal login.
- After 5 failures → "Too many attempts. Start over." with a link to `/login`.

**Files to create:** OtpInput, OtpVerificationForm, page; MSW handler for `/auth/otp/initiate`.
**Files to modify:** `src/modules/auth/hooks/useLogin.ts`, `src/modules/auth/services/auth.api.ts`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev`, simulate MFA branch by editing the MSW `auth/login` handler to return `mfaRequired: true` for one seed account.

**Commit:** `feat(auth): OTP verification screen with resend cooldown + MSW`

**STOP.** Wait for "next".

---

## STEP 31 — HR Admin Dashboard: rebuild to wireframe screen 04

**Goal:** Field-level parity with wireframe screen 04.

**Read first:** Wireframe screen 04 in full; `CLAUDE.md §21`; `docs/BACKEND_API_REQUESTS.md §11` (analytics deltas + activity feed entity labels).

**Wireframe checklist (acceptance criteria):**

- [ ] Personalized greeting: "Welcome back, {firstName}" (done in Step 28 — re-verify).
- [ ] **Top-right "Add Employee" button** — currently missing on dashboard. Render only if `permissions.includes('employees:write')`.
- [ ] 4 stats cards with **delta sub-line**:
  - Total Employees · "12 vs last month"
  - Active Today · "3.1%" percentage delta
  - On Leave · "2" delta
  - Open Requests · "5 urgent" (warning-coloured sub-line)
- [ ] Attendance — last 30 days: **line/area chart**, not bar. Range tabs 7d / 30d / 90d.
- [ ] Headcount by Department: **donut chart**, not horizontal bar. Legend labels visible.
- [ ] Recent Activity: table with columns **Who / Action / Resource / When**. User avatars in the Who column. Resource clickable to `entity_url`.
- [ ] **Remove** the "Leave Summary (30d)" panel currently in `HRDashboard.tsx:258-264` (not in wireframe — scope creep).

**API gaps (mock now per `BACKEND_API_REQUESTS.md §11`):**

- Extend `useAnalyticsSummary` to read the optional `deltas` block; render the delta sub-line only if present.
- Extend MSW handler for `/analytics/summary` to return the proposed extended shape.
- Extend `useRecentActivity` + the audit-logs MSW handler to include `entity_label` and `entity_url` per `BACKEND_API_REQUESTS.md §12`.

**Build:**

1. `MSW`: update `src/mocks/handlers/audit-logs.ts` (or `analytics.ts`) so `/analytics/summary` and `/analytics/recent-activity` return the new extended shapes.
2. Types: add the optional `deltas` block to `AnalyticsSummary` in `src/modules/dashboard/types/dashboard.types.ts`. Add `entity_label?: string; entity_url?: string | null` to the activity item type.
3. `StatsCard`: add an optional `delta?: { value: string; tone?: 'positive'|'negative'|'warning' }` prop. Render sub-line if present.
4. `src/shared/engines/ChartEngine/`:
   - Add a `LineChart` (or `AreaChart`) wrapper for time-series.
   - Add a `DonutChart` wrapper for the headcount widget.
   - Both are thin wrappers around Recharts (`CLAUDE.md §2`). Same prop shape as the existing `BarChart` / `HorizontalBarChart` for consistency.
5. Rewrite `HRDashboard.tsx`:
   - Drop the `LeaveSummaryPanel` section.
   - Use `LineChart` (replaces `BarChart`) for attendance trend.
   - Use `DonutChart` (replaces `HorizontalBarChart`) for headcount.
   - Convert Recent Activity feed into a table layout matching the wireframe: 4 columns. Avatar in Who column. Resource is a `<Link>` to `entity_url` if present.
   - Header actions slot: `<Link href="/employees/new">` styled as a primary button via `buttonVariants({ size: 'default' })`.

**Definition of done:** every wireframe checklist box ticks. Light + dark verified.

**Files to create:** `src/shared/engines/ChartEngine/LineChart.tsx`, `DonutChart.tsx`.
**Files to modify:** `HRDashboard.tsx`, dashboard types, dashboard MSW handlers, `StatsCard.tsx`, audit-logs MSW handler.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev`, login as HR, visually compare against wireframe screen 04.

**Commit:** `feat(hr-dashboard): wireframe parity — line + donut charts, deltas, activity table`

**STOP.** Wait for "next".

---

## STEP 32 — Manager Dashboard: rebuild to wireframe screen 05

**Goal:** Field-level parity with wireframe screen 05.

**Read first:** Wireframe screen 05; `docs/BACKEND_API_REQUESTS.md §11` (`approvalBreakdown`, `GET /attendance/team/weekly`).

**Wireframe checklist:**

- [ ] Heading "My Team" (handled in Step 28 — re-verify).
- [ ] Top-right header buttons: **"Bulk approve"** (opens modal with multi-select) and **"View team"** (routes to `/employees?manager=me` or similar filter).
- [ ] 4 stats: Team size · Present today (`+1` delta) · Pending approvals (`3 leave, 2 reg.` sub-line, from `approvalBreakdown`) · Avg. attendance (`this month` period).
- [ ] Pending Approvals panel: rows with avatar + name + leave type + days + reason + **inline Deny / Approve buttons per row**. Empty state "No pending approvals" with illustration.
- [ ] Team Attendance — This Week: weekly grid (rows = team members, columns = M T W T F). Cell content = P/A/L/W/H letter, color-coded.

**API gaps (mock per spec):**

- Extend `/manager/dashboard` MSW response with `approvalBreakdown`, `presentToday`, `avgAttendancePercent`.
- New MSW endpoint `/attendance/team/weekly?weekStart=YYYY-MM-DD` per `BACKEND_API_REQUESTS.md §11`.

**Build:**

1. Extend `src/mocks/handlers/manager.ts` (or wherever `/manager/dashboard` is handled) to return the augmented shape.
2. Add MSW handler for `/attendance/team/weekly`.
3. New types in `src/modules/dashboard/types/dashboard.types.ts` and `src/modules/attendance/types/attendance.types.ts`.
4. New hook `useTeamWeeklyAttendance(weekStart)` in attendance or dashboard module.
5. New components in `src/modules/dashboard/components/`:
   - `PendingApprovalsPanel.tsx` — reads `/manager/approvals`, renders rows with inline Approve/Deny that call the existing leave-approve / reject mutations. Optimistic with rollback.
   - `TeamWeeklyAttendanceGrid.tsx` — renders the grid. Tooltip on cell hover ("WFH · Jun 25").
6. Rewrite `ManagerDashboard.tsx`:
   - Header actions slot: two buttons.
   - 4 StatsCards with sub-lines.
   - Two-column layout below: Pending Approvals (left) + Team Weekly Grid (right).

**Definition of done:** wireframe checklist boxes tick.

**Files to create:** `PendingApprovalsPanel.tsx`, `TeamWeeklyAttendanceGrid.tsx`, MSW for `/attendance/team/weekly`.
**Files to modify:** `ManagerDashboard.tsx`, manager dashboard hooks, types, manager MSW handler.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev`, login as Aman (manager seed), visually compare to wireframe.

**Commit:** `feat(manager-dashboard): wireframe parity — pending approvals + weekly team grid`

**STOP.** Wait for "next".

---

## STEP 33 — Employee Dashboard: rebuild to wireframe screen 06

**Goal:** Field-level parity with wireframe screen 06.

**Read first:** Wireframe screen 06; `docs/BACKEND_API_REQUESTS.md §11` (`todayAttendance`, `leaveBalanceSummary`).

**Wireframe checklist:**

- [ ] Heading "Hi {firstName}" (Step 28 — re-verify).
- [ ] Top-right "Request leave" button — opens `NewLeaveRequestDialog`.
- [ ] **Today's Attendance** clock card: large clock display, status pill ("Checked in — WFH"), "Check out" button (or "Check in" if not yet), "View history" link. Respect `prefers-reduced-motion` on the clock.
- [ ] **Leave Balance** card: per-type breakdown (Casual / Sick / Earned). Each shows available number.
- [ ] **Upcoming Holidays** list: 3 nearest upcoming holidays from `GET /holidays?year=<current>`. Item format: "25 Jun · Eid".
- [ ] **My Documents** list: each doc with verification pill (Verified / Pending / Rejected).
- [ ] **My Team** list with manager flagged and peers under.
- [ ] **Remove** the placeholder "Quick Actions" panel (not in wireframe).

**API gaps:**

- Extend `/employee/dashboard` MSW to include `todayAttendance` + `leaveBalanceSummary` per spec.
- `My Documents`: live `GET /employee/documents` if implemented, else MSW.

**Build:**

1. MSW updates per spec.
2. New / repositioned components in `src/modules/dashboard/components/`:
   - Reuse `src/modules/attendance/components/CheckInOutCard.tsx` if compatible; if not, build `TodayAttendanceCard.tsx` here. It hits `/attendance/today`, `/attendance/check-in`, `/attendance/check-out`.
   - `LeaveBalanceMiniCard.tsx` — three-column number layout reading `leaveBalanceSummary`.
   - `UpcomingHolidaysCard.tsx` — reads `useHolidays(currentYear)` and slices to next 3 future holidays.
   - `MyDocumentsCard.tsx` — reads `/employee/documents`, lists with status badge.
3. Wire `<Link>`/button "Request leave" in header to open `NewLeaveRequestDialog` (open-state in local component).
4. Rewrite `EmployeeDashboard.tsx`:
   - Drop the StatsCard row (it doesn't match wireframe).
   - Grid layout: row 1 = Today's Attendance (1/3) + Leave Balance (1/3) + Upcoming Holidays (1/3). Row 2 = My Documents (1/2) + My Team (1/2).
   - Drop "Quick Actions" panel.

**Definition of done:** wireframe checklist ticks. `prefers-reduced-motion` honoured on the clock.

**Files to create:** the four cards above.
**Files to modify:** `EmployeeDashboard.tsx`, MSW handlers for `/employee/dashboard` and possibly `/employee/documents`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev`, login as Priya, visually compare to wireframe.

**Commit:** `feat(employee-dashboard): wireframe parity — clock + balance + holidays + documents`

**STOP.** Wait for "next".

---

## STEP 34 — Employees List: Code + Joined columns, Density/Columns menus, Export

**Goal:** Wireframe screen 07 column parity + table tools.

**Read first:** Wireframe screen 07; `EmployeeTable.tsx` current state.

**Wireframe checklist:**

- [ ] Add **Employee Code** column (mono, after employee name).
- [ ] Add **Joined date** column (after Type).
- [ ] **Columns menu** (top-right toolbar) toggles column visibility, persists per-user in `localStorage`.
- [ ] **Density menu** (Comfortable / Compact / Cozy) — adjusts row height.
- [ ] **Export** button (HR only) → calls existing `GET /employees/export/csv` (live).

**Build:**

1. Extend the columns array in `EmployeeTable.tsx` with `employeeCode` and `joinedOn` columns.
2. Add Columns / Density buttons to the filter bar — use `DropdownMenu` + `DropdownMenuCheckboxItem` for columns.
3. Persist visibility + density in `localStorage` keyed by user ID.
4. Density is a wrapper class applied to rows: `py-1` / `py-2` / `py-3`.
5. Export button calls `employees.api.exportCsv()` (add to service) → triggers a browser download (return `response.data` as Blob, `URL.createObjectURL`, click hidden anchor).

**Definition of done:** wireframe ticks. Column visibility persists across page reloads.

**Files to modify:** `EmployeeTable.tsx`, `src/modules/employees/services/employees.api.ts`, `src/modules/employees/types/employee.types.ts` (if needed).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(employees-list): code + joined columns, density / columns menus, csv export`

**STOP.** Wait for "next".

---

## STEP 35 — Employees List: bulk deactivate + bulk export (MSW)

**Goal:** Row selection + bulk actions per wireframe screen 07 annotations.

**Read first:** Wireframe screen 07 annotations; `BACKEND_API_REQUESTS.md §5`.

**API gaps (MSW):**

- `POST /employees/bulk/deactivate` — see spec.
- `POST /employees/bulk/export` — see spec.

**Build:**

1. MSW handlers per spec.
2. Extend `EmployeeTable` with selection state (Set<id>); add a checkbox column on the left. Header checkbox toggles all on current page.
3. Floating action bar appears above the table when ≥ 1 selected:
   - "X selected" + Bulk deactivate (HR only) + Bulk export.
   - Confirmation modal with summary of will-be-affected rows.
4. Show per-id failures in a result modal (succeeded vs failed list).

**Definition of done:** select 3 rows → Bulk deactivate → confirm → some succeed, some fail → result modal lists both.

**Files to modify:** `EmployeeTable.tsx`, employees service, employees hooks; new MSW handlers.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(employees-list): bulk deactivate + bulk export with MSW backing`

**STOP.** Wait for "next".

---

## STEP 36 — Employee Profile: Documents tab ✅

**Implemented:** Live Cloudinary-backed API (no MSW). Direct `POST /employees/:id/documents` multipart upload. Upload + delete gated to `employees:write` / `employees:delete` (HR_ADMIN, SUPER_ADMIN only — employees are read-only viewers).

**Files:**

- `src/modules/employees/types/employee.types.ts` — `EmployeeDocument`, `DocumentType`, `DocumentVerificationStatus`
- `src/modules/employees/services/documents.api.ts` — `list`, `upload`, `remove`
- `src/modules/employees/hooks/useDocuments.ts` — `useEmployeeDocuments`, `useUploadDocument`, `useRemoveDocument`
- `src/modules/employees/components/DocumentsTab.tsx`

**Commits:** `feat(employee-profile): documents tab with upload (live API)`, `fix(employee-profile): documents list handles both response shapes + fix multipart upload`, `fix(employee-profile): restrict document upload/delete to HR_ADMIN+ only`

---

## STEP 37 — Employee Profile: populate Attendance / Leave / Activity tabs

**Goal:** Each tab shows real data for that employee. All tabs read-only — no approve/reject/withdraw actions here.

**Read first:** `docs/API_MAPPING.md` — "GET /attendance/records", "GET /attendance/team/records", "GET /leave/requests", "GET /audit-logs".

---

### Attendance tab

**Two endpoints depending on viewer:**

| Viewer   | Endpoint                                                     | Detection                        |
| -------- | ------------------------------------------------------------ | -------------------------------- |
| Self     | `GET /attendance/records?month=YYYY-MM`                      | `user.employeeId === employeeId` |
| HR/Admin | `GET /attendance/team/records?employeeId=<id>&month=YYYY-MM` | Otherwise                        |

**Response shape (both endpoints):** `{ data: { records: [...], pagination: {} } }` — unwrap as `data.data.records`.

**Record fields:** `id`, `referenceNo`, `attendanceDate` (ISO), `checkInAt` (ISO|null), `checkOutAt` (ISO|null), `status`, `workMode`, `totalMinutes`, `notes`.

**Status badge colours** are already defined in `src/modules/attendance/constants/index.ts` via `STATUS_CONFIG` — reuse them.

**What to add:**

1. `employeeId?: string` to `AttendanceRecordsParams` in `src/modules/attendance/types/attendance.types.ts`.
2. `getTeamRecords(params?: AttendanceRecordsParams)` method to `attendanceApi` (`/attendance/team/records`) in `src/modules/attendance/services/attendance.api.ts`.
3. `useAttendanceTeamRecords(params?)` hook in `src/modules/attendance/hooks/useAttendance.ts`.
4. `src/modules/employees/components/AttendanceTab.tsx` — month navigator (prev/next buttons, current month label) + flat table of records: date, check-in time, check-out time, duration (totalMinutes → "Xh Ym"), status badge. Skeleton / empty / error states. **Do NOT reuse `AttendanceCalendar`** — that component is not designed for read-only embedded use.

---

### Leave tab

**What stays:** The existing leave balance cards already rendered from `employee.leaveBalances` are fine. Keep them.

**What to add — self only:** A "Leave requests" section below the balance cards showing `GET /leave/requests?limit=10`.

- Self detection: `user.employeeId === employeeId`.
- Use existing `leaveApi.getRequests(params)` + `useLeaveRequests(params)` — no changes to those files.
- **HR viewing another employee:** the API has no `employeeId` filter on `/leave/requests` or `/leave/team/requests`, so show balance cards only — no request history section.

**Request history row:** `referenceNo`, leave type name (`leaveTypeName`), date range (`startDate` – `endDate`, formatted `dd MMM`), `totalDays`, `LeaveStatusBadge` (existing component). No action buttons.

**What to add:**

- `src/modules/employees/components/LeaveTab.tsx` — replaces the inline `LeaveTab` function in `EmployeeProfile.tsx`. Props: `{ balances: LeaveBalance[], employeeId: string }`.

---

### Activity tab

**HR_ADMIN / SUPER_ADMIN only.** Employees and Managers see an `EmptyState` with message "Activity log is visible to HR administrators only."

**Endpoint:** `GET /audit-logs?entity=Employee&entityId=<employeeId>&limit=20`

**Response:** `{ data: { logs: [...], pagination: {} } }` — unwrap as `data.data.logs`.

**Log fields are snake_case:** `id`, `user_email`, `action` (`CREATE | UPDATE | DELETE`), `entity_type`, `entity_id`, `created_at`. (`old_value`, `new_value`, `ip_address`, `user_agent` are present but not needed for display.)

**Permission check:** `permissions.includes('audit-logs:read')` OR `['HR_ADMIN','SUPER_ADMIN'].includes(user.memberType)`.

**What to add:**

1. `src/modules/employees/services/auditLogs.api.ts` — one method: `listForEmployee(employeeId: string)` calling `GET /audit-logs?entity=Employee&entityId=<id>&limit=20`, unwraps `data.data.logs`. Define `AuditLogEntry` type inline (snake_case fields).
2. `src/modules/employees/hooks/useEmployeeAuditLogs.ts` — `useEmployeeAuditLogs(employeeId, enabled)` query.
3. `src/modules/employees/components/ActivityTab.tsx` — vertical list: actor email, action badge (CREATE green, UPDATE blue, DELETE red), relative date (`formatDistanceToNow` from date-fns). Skeleton / empty / error states.

---

### Wiring into EmployeeProfile

Replace the three inline placeholder components with the new imported ones. Pass these props:

- `<AttendanceTab employeeId={id} />` — tab manages its own month state
- `<LeaveTab balances={employee.leaveBalances} employeeId={id} />` — replaces old `<LeaveTab balances=.../>` signature
- `<ActivityTab employeeId={id} />` — tab handles its own permission check internally

Remove the old inline `AttendanceTab`, `LeaveTab`, `ActivityTab` function declarations from `EmployeeProfile.tsx`.

---

### What NOT to do

- Do NOT reuse `AttendanceCalendar` — not designed for profile embedding.
- Do NOT reuse `LeaveRequestsTable` — it uses `nuqs` URL state, unsuitable inside a profile tab.
- Do NOT add `next/dynamic` lazy loading — all three are client components inside an already-client component.
- Do NOT add pagination UI — `limit=10` / `limit=20` caps are sufficient for profile view.
- Do NOT add approve / reject / withdraw buttons anywhere in these tabs.

---

### Files to create

- `src/modules/employees/components/AttendanceTab.tsx`
- `src/modules/employees/components/LeaveTab.tsx`
- `src/modules/employees/components/ActivityTab.tsx`
- `src/modules/employees/services/auditLogs.api.ts`
- `src/modules/employees/hooks/useEmployeeAuditLogs.ts`

### Files to modify

- `src/modules/attendance/types/attendance.types.ts` — add `employeeId?` to `AttendanceRecordsParams`
- `src/modules/attendance/services/attendance.api.ts` — add `getTeamRecords`
- `src/modules/attendance/hooks/useAttendance.ts` — add `useAttendanceTeamRecords`
- `src/modules/employees/components/EmployeeProfile.tsx` — import new tab components, update `<LeaveTab>` props, remove three inline placeholder functions

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(employee-profile): attendance / leave / activity tabs populated`

**STOP.** Wait for "next".

---

## STEP 38 — Employee Profile: Deactivate with type-employee-code confirmation

**Goal:** Wireframe screen 08 "Deactivate" with safe confirmation.

**Read first:** Wireframe screen 08; existing `ConfirmDialog`.

**Build:**

1. New `TypeToConfirmDialog.tsx` in `src/components/feedback/` — extends ConfirmDialog with a required text-input matching a target string before the confirm button enables.
2. Replace existing terminate action in `EmployeeProfile` header with this dialog: require typing the employee code (E0042). Maps to existing `DELETE /employees/:id`.
3. Show resulting status banner on the profile.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(employee-profile): deactivate with type-to-confirm safeguard`

**STOP.** Wait for "next".

---

## STEP 39 — Employee Create: 4-step stepper (Personal / Job / Documents / Access)

**Goal:** Wireframe screen 09 stepper layout.

**Read first:** Wireframe screen 09; `EmployeeForm.tsx` current; `BACKEND_API_REQUESTS.md §5` (`GET /employees/next-code`).

**Wireframe checklist:**

- [x] 4-step indicator at top of the form.
- [x] Step 1 Personal · Step 2 Job · Step 3 Documents · Step 4 Access.
- [x] "Auto / E20XX" + Generate code button calls `/employees/next-code` (live — no MSW needed; shape deviation: `nextCode` field).
- [x] Auto-save draft to localStorage every 30 s.
- [x] Documents step uses Step 36's upload flow (queued locally, uploaded after employee creation).
- [x] Access step: role select + "Send invite email" toggle (UI-only — no API today).

**Build:**

1. ~~MSW handler for `GET /employees/next-code`~~ — live endpoint; `getNextCode()` + `useNextEmployeeCode` hook already shipped.
2. `src/modules/employees/components/EmployeeFormStepper.tsx` — new wrapper with step state, validation per step, back/next navigation. Uses RHF (one shared form, multiple step views).
3. Migrate the existing flat form sections into the stepper steps. Step 3 (Documents) and Step 4 (Access) are new.
4. localStorage draft auto-save — debounce 30 s, key `ems:emp-create-draft:<userId>`.
5. Final "Create employee" only enabled when all required steps validate.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(employee-create): 4-step stepper with auto-save + documents + access`

**STOP.** Wait for "next".

---

## STEP 40 — Department detail: employee list table + reassign-and-delete (LIVE API)

**Goal:** Wireframe screen 10 right panel + safe delete with reassign.

**Read first:** Wireframe screen 10; `API_MAPPING.md` (GET /departments/:id/employees, POST /departments/:id/reassign-and-delete).

> **Both endpoints are LIVE** (shipped 2026-05-26) — no MSW needed.
> Response shape: `GET /departments/:id/employees` → `data.data[]` + `data.pagination` (double-nested).
> `POST /departments/:id/reassign-and-delete` → body `{ reassignEmployeesTo: "dep_id" }`.

**Build:**

1. ~~MSW handlers~~ — use live endpoints directly.
2. Department detail panel: add a paginated employee table using the live `GET /departments/:id/employees` endpoint.
3. Delete flow upgrade: if `dept._count.employees > 0`, show a "Reassign and delete" dialog with a target-department picker instead of the simple ConfirmDialog. Submit calls the live `POST /departments/:id/reassign-and-delete` endpoint.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(departments): per-dept employee table + reassign-and-delete flow`

**STOP.** Wait for "next".

---

## STEP 41 — Attendance: Calendar/Table view toggle + dept/employee filter

**Goal:** Wireframe screen 11 toolbar.

**Read first:** Wireframe screen 11.

**Build:**

1. Toolbar above calendar with view toggle (Calendar / Table) — URL state via `nuqs` `?view=calendar|table`.
2. Department dropdown (HR/Manager only) and Employee dropdown (HR sees all; Manager sees their team).
3. Table view = a DynamicTable of records for the selected month + employee.
4. Calendar view = the existing component.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(attendance): calendar/table view toggle + scope filters`

**STOP.** Wait for "next".

---

## STEP 42 — Attendance: Day-detail drawer + regularization supporting doc

**Goal:** Click a day → drawer with details. Regularization can attach a supporting document.

**Read first:** Wireframe screen 11 (cell click → day detail drawer; regularization "supporting doc").

**Build:**

1. `DayDetailDrawer.tsx` — uses `Sheet`. Shows clock-in/out, hours, location, notes, status. Has "Regularize" CTA if applicable.
2. Hook the day-cell `onClick` in `AttendanceCalendar.tsx`.
3. Extend `RegularizationDialog.tsx` with optional document upload (reuses Step 36's upload flow). Document is linked to the regularization request id.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(attendance): day-detail drawer + supporting doc on regularization`

**STOP.** Wait for "next".

---

## STEP 43 — Leave: Team Calendar tab (real month grid via MSW)

**Goal:** Wireframe screen 12 "Team Calendar" — actual month view, not a list.

**Read first:** Wireframe screen 12; `BACKEND_API_REQUESTS.md §7` (`GET /leave/team/calendar`).

**Build:**

1. MSW handler for `/leave/team/calendar?month=YYYY-MM` per spec.
2. Rewrite `LeaveTeamCalendar.tsx`:
   - Rows = team members, columns = days of month.
   - Cell color/letter encodes `LEAVE | WFH | HOLIDAY | WEEKEND | WORKING`.
   - Hover tooltip with details.
   - Month-prev / month-next toolbar.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(leave): team calendar month grid (MSW)`

**STOP.** Wait for "next".

---

## STEP 44 — Leave: Bulk approve modal + coverage warning chip (MSW)

**Goal:** Wireframe screen 12 "Bulk approve" + coverage warning chip.

**Read first:** Wireframe screen 12; `BACKEND_API_REQUESTS.md §7`.

**Build:**

1. MSW for `/leave/requests/bulk/approve`, `/bulk/reject`, `/leave/team/coverage`.
2. Row selection in `LeaveApprovalsTable` + floating bulk bar (Bulk approve / Bulk deny). Confirmation modal with optional shared comment field.
3. Per-row inline warning chip when `coveragePercent < thresholdPercent` for that date (call `/leave/team/coverage?date=` lazily on hover or on mount).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(leave): bulk approve/reject + coverage warning chips (MSW)`

**STOP.** Wait for "next".

---

## STEP 45 — Holidays: year overview default + `.ics` import flow (MSW)

**Goal:** Wireframe screen 13.

**Read first:** Wireframe screen 13; `BACKEND_API_REQUESTS.md §8`.

**Build:**

1. MSW for `/holidays/import` (multipart accepted), `/holidays/import/:jobId/preview`, `/holidays/import/:jobId/commit`.
2. Make the year overview grid the default view. Toggle button switches to the existing list table.
3. Click a month tile → expanded month view with names/details (modal or in-page).
4. "Import .ics" header button:
   - File picker → POST presign → preview dialog (shows candidates, "willOverwrite" flag) → commit button.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(holidays): year overview default + .ics import flow (MSW)`

**STOP.** Wait for "next".

---

## STEP 46 — Permissions: Add custom role + "X users affected" preview (MSW)

**Goal:** Wireframe screen 14 "Add role" + impact preview.

**Read first:** Wireframe screen 14; `BACKEND_API_REQUESTS.md §10`.

**Build:**

1. MSW handlers for `POST /settings/roles`, `DELETE /settings/roles/:key`.
2. "Add role" header button (Super Admin only) → dialog with name + key + initial permissions multi-select.
3. Show custom roles as additional columns in the matrix.
4. On Save Changes, show a confirm dialog: "X users will gain access, Y users will lose access" (compute client-side from current matrix).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(permissions): custom role create + impact preview on save`

**STOP.** Wait for "next".

---

## STEP 47 — Settings: restructure left nav into 6 groups + sub-routes

**Goal:** Wireframe screen 15 left-nav grouping.

**Read first:** Wireframe screen 15.

**Build:**

1. Refactor `SettingsScreen.tsx` to support grouped nav. Items become route segments under `/settings/<group>/<item>`.
2. Groups (with placeholder panels — actual content filled in subsequent steps):
   - **Workspace**: Company profile (existing), Branding, Locale & timezone, Working hours.
   - **People**: Leave types, Holiday calendar (link out), Attendance rules.
   - **Security**: Authentication, Sessions & devices, Audit log.
   - **Notifications**: Email templates (existing), In-app preferences.
   - **Integrations**: Email, Storage, Webhooks.
   - **Billing**: Plan, Invoices.
3. Each item is a sub-route at `src/app/(dashboard)/settings/<slug>/page.tsx`.
4. Permission-gate items (hide entirely if user lacks the permission, per CLAUDE.md §10).
5. Render placeholder cards for items not yet built: "Coming soon" + link to spec.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `refactor(settings): 6-group left nav + sub-routes (placeholders for new items)`

**STOP.** Wait for "next".

---

## STEP 48 — Settings: Sessions & devices + Audit log (live APIs)

**Goal:** Wire two settings items to existing live endpoints.

**Read first:** `API_MAPPING.md` (`GET /auth/sessions`, `DELETE /auth/sessions/:id`, `GET /audit-logs`).

**Build:**

1. `SessionsAndDevicesPanel.tsx` — list `/auth/sessions`, show device, IP, location, last-seen, "Revoke" action. Current session marked.
2. `AuditLogPanel.tsx` — paginated `/audit-logs` table. Filters: entity, action, user. (Snake_case fields — `CLAUDE.md §4`.)
3. Wire into the Step 47 routes.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(settings): sessions & devices, audit log panels (live API)`

**STOP.** Wait for "next".

---

## STEP 49 — Settings: Branding + Leave types CRUD (MSW)

**Goal:** Two settings items.

**Read first:** `BACKEND_API_REQUESTS.md §9`.

**Build:**

1. MSW for `PATCH /settings/branding` (multipart), `POST/PATCH/DELETE /settings/leave-types`.
2. `BrandingPanel.tsx` — logo upload, primary color hex picker.
3. `LeaveTypesPanel.tsx` — DynamicTable + Drawer form for create/edit.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(settings): branding + leave types CRUD (MSW)`

**STOP.** Wait for "next".

---

## STEP 50 — Settings: Attendance rules + Authentication + Notification prefs (MSW)

**Goal:** Three settings items.

**Read first:** `BACKEND_API_REQUESTS.md §9`.

**Build:**

1. MSW for `GET/PATCH /settings/attendance-rules`, `GET/PATCH /settings/security/auth`, `GET/PATCH /settings/notifications/preferences`.
2. Three panels with RHF + Zod. Snake_case payloads per spec.
3. Each respects the role gating defined in the spec.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(settings): attendance rules, authentication, notification prefs (MSW)`

**STOP.** Wait for "next".

---

## STEP 51 — Settings: Integrations / Billing placeholders

**Goal:** Wireframe screen 15 listed these — render as "Coming in Phase 2" cards so the nav doesn't break.

**Build:**

1. Static placeholder panels under Settings → Integrations (Email, Storage, Webhooks).
2. Static placeholder panels under Settings → Billing (Plan, Invoices).
3. Each shows a "Phase 2" badge + short description.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `feat(settings): integrations + billing phase-2 placeholders`

**STOP.** Wait for "next".

---

## STEP 52 — EmptyState illustrations + a11y dark-mode sweep

**Goal:** Empty states get illustrations (wireframe annotates them). Final keyboard + dark-mode pass.

**Build:**

1. Extend `src/components/feedback/EmptyState.tsx` with an `illustration?: ReactNode` slot above the title.
2. Add 5–7 small inline SVG illustrations under `src/components/feedback/illustrations/` (no external assets — inline so they theme via `currentColor`).
3. Apply to key empties: employees list empty, no pending approvals, no holidays, no documents, no team members, no search results.
4. Sweep every screen in dark mode: confirm no `bg-brand-50` / `bg-accent` invisibility lingering after Step 22. Run `react-doctor` for any new findings.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus manual dark-mode pass.

**Commit:** `feat(polish): empty-state illustrations + dark-mode sweep`

**STOP.** Wait for "next".

---

## STEP 53 — Wireframe parity verification walk-through

**Goal:** Walk every screen in the wireframe one more time, head-to-head with the running app.

**Build:**

1. No code by default. Click through each of the 15 wireframe screens.
2. For each screen produce a one-line pass/fail report.
3. Fix any final visual drift that's small enough to be done inline (typo in copy, missing chip, off-by-one icon).
4. For anything substantial, propose it as a new step appended to this file.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

**Commit:** `chore(parity): final walk-through verification report`

**STOP.** Wait for "next".

---

## STEP 54 — Production build + demo redeploy

**Goal:** Ship the parity build to Vercel.

**Build:**

1. `pnpm build` must succeed.
2. Deploy to Vercel (existing project).
3. Smoke-click the 5 demo screens on the deployed URL: Login → HR Dashboard → Employees list → Profile → Leave approval.
4. Confirm no console errors in production.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
pnpm build
```

**Commit:** `chore: phase 1.5 — wireframe-parity build ready for demo`

**STOP.** Wait for "next".

---

# PHASE 2 — Payroll, Reports & Analytics

> **Each step below is self-contained for cold-start resumption.** A fresh
> Claude session should be able to read one step in full and execute it without
> external context.
>
> **Close protocol for every step:**
>
> 1. Run `pnpm typecheck` and `pnpm lint`. Show me the full output.
> 2. For UI steps, also run `pnpm dev` and confirm the affected route renders
>    in both light and dark mode with no console errors.
> 3. Commit with the exact message in the step.
> 4. **STOP.** Wait for the user to say "next".
>
> **Hard rules:**
>
> - `docs/phase2api.md` is the authoritative API spec. MSW handlers must match
>   it exactly. Types must mirror it. Never invent shapes.
> - `CLAUDE.md §23` describes the global-first payroll design. Read it before
>   touching any payroll file.
> - No new state libraries, UI kits, or chart libraries. The only new npm
>   package permitted in Phase 2 is `expr-eval` (installed in Step 55).
> - Module barrel discipline (`CLAUDE.md §6`) applies. Other modules import
>   from `modules/payroll` (via index.ts), not from internal paths.
> - All four component states (loading, empty, error, success) required on
>   every data-fetching component.
> - `pnpm typecheck` and `pnpm lint` must be clean before committing each step.

---

## Progress tracker (Phase 2)

- [x] Step 55 — Payroll module skeleton: types, MSW, services, hooks, route registration
- [x] Step 56 — Settings: Pay & Compliance → Salary Components CRUD
- [x] Step 57 — Settings: Pay Groups CRUD (payroll templates)
- [x] Step 58 — Employee Profile: Compensation tab (salary assignment + live preview)
- [x] Step 59 — Payroll: Run payroll flow (initiate → calculate → review)
- [x] Step 60 — Payroll: Run detail page + payslip viewer
- [x] Step 61 — Payroll: Employee self-service payslip history
- [x] Step 62 — Reports: Module skeleton + page layout + MSW
- [x] Step 63 — Reports: Workforce reports (Headcount + Turnover + Demographics)
- [x] Step 64 — Reports: Attendance & Leave reports
- [x] Step 65 — Reports: Payroll reports + Export
- [x] Step 66 — Analytics: Dedicated /analytics page (existing endpoints)
- [x] Step 67 — Analytics: Workforce trend + attrition + payroll-cost charts (MSW)

---

## STEP 55 — Payroll: module skeleton + MSW + route registration

**Goal:** All payroll plumbing in place — types, services, hooks, MSW handlers,
and route stubs. Zero screens rendered yet. The payroll nav items and settings
group appear but link to placeholder pages.

**Read first:** `CLAUDE.md §23` (full Phase 2 section); `docs/phase2api.md`
Domains 1–3; `CLAUDE.md §6` (module anatomy).

**Build:**

1. **Install `expr-eval`:**

   ```bash
   pnpm add expr-eval
   pnpm add -D @types/expr-eval
   ```

2. **AppShell nav** — add three items to `NAV_ITEMS` in
   `src/shared/layouts/AppShell.tsx` between Holidays and Permissions:

   ```ts
   { label: 'Payroll',   href: '/payroll',   icon: DollarSign  }
   { label: 'Reports',   href: '/reports',   icon: BarChart2   }
   { label: 'Analytics', href: '/analytics', icon: TrendingUp  }
   ```

   Import the three new Lucide icons at the top of the file.

3. **Route stubs** — create placeholder `page.tsx` files (just
   `<div>Coming soon</div>` inside `AppShell` layout) for:
   - `src/app/(dashboard)/payroll/page.tsx`
   - `src/app/(dashboard)/payroll/[runId]/page.tsx`
   - `src/app/(dashboard)/payroll/my-payslips/page.tsx`
   - `src/app/(dashboard)/reports/page.tsx`
   - `src/app/(dashboard)/analytics/page.tsx`

4. **Settings nav** — add "Pay & Compliance" group to settings left nav. Update
   `src/modules/settings/constants/index.ts` (wherever the nav groups are
   defined) with the new group containing: Salary Components
   (`/settings/pay/components`), Pay Groups (`/settings/pay/groups`), Pay
   Schedules (`/settings/pay/schedules`). Add placeholder panels for each.

5. **Module folder** — create `src/modules/payroll/` with full anatomy:

   ```
   src/modules/payroll/
   ├── components/       (empty for now)
   ├── hooks/
   │   ├── usePayrollComponents.ts
   │   ├── usePayGroups.ts
   │   ├── usePayrollRuns.ts
   │   └── useEmployeeSalary.ts
   ├── services/
   │   ├── payroll-components.api.ts
   │   ├── pay-groups.api.ts
   │   ├── payroll-runs.api.ts
   │   └── employee-salary.api.ts
   ├── types/
   │   └── payroll.types.ts
   ├── validations/
   │   ├── salary-component.schema.ts
   │   ├── pay-group.schema.ts
   │   └── payroll-run.schema.ts
   ├── constants/
   │   └── index.ts
   ├── utils/
   │   └── formula.utils.ts
   └── index.ts
   ```

6. **Types** (`src/modules/payroll/types/payroll.types.ts`) — define ALL types
   from `docs/phase2api.md` Appendix A:
   `SalaryComponent`, `PayGroup`, `PayGroupComponent`, `EmployeeSalary`,
   `CalculatedComponent`, `SalaryHistory`, `PayrollRun`, `PayrollRunSummary`,
   `PayrollRunWarning`, `Payslip`, `PayslipLine`, `ComponentType`,
   `CalculationType`, `PaySchedule`, `PayrollRunStatus`, `PayslipStatus`.

7. **Formula utils** (`src/modules/payroll/utils/formula.utils.ts`):

   ```ts
   import { Parser } from 'expr-eval';
   // evaluateFormula(formula: string, variables: Record<string, number>): number | null
   // validateFormula(formula: string, knownCodes: string[]): { valid: boolean; error?: string }
   // resolveComponentOrder(components: SalaryComponent[]): SalaryComponent[] (topological sort)
   // computeComponentBreakdown(components: SalaryComponent[], annualCtc: number): CalculatedComponent[]
   ```

   These are pure functions — no React, no API calls.

8. **Services** — implement all service methods per `docs/phase2api.md`. Each
   method unwraps its specific response shape per `CLAUDE.md §4`. Do not write
   a generic unwrap utility.

9. **Hooks** — React Query hooks for all CRUD operations. Follow the pattern
   established by `useEmployees.ts` and `useHolidays.ts`:
   - Query hooks: `usePayrollComponents()`, `usePayGroups()`, `usePayrollRuns(params)`, `usePayrollRun(id)`, `useEmployeeSalary(employeeId)`, `useEmployeePayslips(employeeId, params)`
   - Mutation hooks: `useCreateComponent()`, `useUpdateComponent()`, `useDeleteComponent()`, `useCreatePayGroup()`, `useUpdatePayGroup()`, `useDeletePayGroup()`, `useAssignSalary()`, `useInitiatePayrollRun()`, `useCalculatePayrollRun()`, `useApprovePayrollRun()`, `useAdjustPayslip()`

10. **MSW handlers** — create these files matching `docs/phase2api.md` exactly:
    - `src/mocks/handlers/payroll-components.ts` — seed 8 components
      (BASIC flat, HRA percentage of BASIC, LTA flat, SPECIAL_ALLOW formula,
      PF deduction percentage, PROF_TAX formula, TDS formula, MEDICAL flat)
    - `src/mocks/handlers/payroll-groups.ts` — seed 2 groups
      ("Standard India" with INR/MONTHLY, "US Hourly" with USD/BIWEEKLY)
    - `src/mocks/handlers/payroll-employee.ts` — salary configs for the 4 seed employees
    - `src/mocks/handlers/payroll-runs.ts` — 3 past runs (PAID) + 1 DRAFT for current month
    - Wire all four into `src/mocks/handlers/index.ts`

11. **Constants** (`src/modules/payroll/constants/index.ts`):

    ```ts
    COMPONENT_TYPE_CONFIG: Record<ComponentType, { label; color; icon }>;
    CALCULATION_TYPE_CONFIG: Record<CalculationType, { label; description }>;
    RUN_STATUS_CONFIG: Record<PayrollRunStatus, { label; color }>;
    ```

12. **Barrel** (`src/modules/payroll/index.ts`) — export all public types, hooks, services.

**Definition of done:**

- `pnpm dev` boots, sidebar shows Payroll / Reports / Analytics nav items.
- All three routes render (with placeholder text — no crash).
- Settings → Pay & Compliance group visible with placeholder panels.
- No TypeScript errors on the new types and services.
- MSW handlers return the correct shape (verify in browser Network tab).

**Files to create:**
`src/modules/payroll/**` (full module), 4 MSW handler files,
`src/app/(dashboard)/payroll/page.tsx`,
`src/app/(dashboard)/payroll/[runId]/page.tsx`,
`src/app/(dashboard)/payroll/my-payslips/page.tsx`,
`src/app/(dashboard)/reports/page.tsx`,
`src/app/(dashboard)/analytics/page.tsx`.

**Files to modify:**
`src/shared/layouts/AppShell.tsx` (nav items),
`src/modules/settings/constants/index.ts` (Pay & Compliance group),
`src/mocks/handlers/index.ts` (wire new handlers).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus: `pnpm dev` — sidebar shows 3 new items, routes load without crash, no console errors.

**Commit:** `feat(payroll): module skeleton — types, MSW, services, hooks, route stubs`

**STOP.** Wait for "next".

---

## STEP 56 — Settings: Pay & Compliance → Salary Components CRUD

**Goal:** The core Phase 2 differentiator. HR can create, edit, delete fully
configurable salary components with live formula preview.

**Read first:** `CLAUDE.md §23` (formula engine + expr-eval); `docs/phase2api.md §1.1` (full component spec, formula language, validation rules).

**Wireframe checklist:**

- [ ] Settings left nav → Pay & Compliance → Salary Components (active state)
- [ ] DynamicTable: columns Code (mono) / Name / Type (badge) / Calculation / Value preview / Taxable (icon) / Active (toggle) / Actions
- [ ] Filter bar: [🔍 Search...] [Type ▾] [Active ▾]
- [ ] [+ Add Component] button (HR only)
- [ ] Drawer form (right side, `Sheet`) for create/edit — NOT a modal
- [ ] Form dynamically changes based on `calculationType`: FLAT shows amount input; PERCENTAGE shows % + basis picker; FORMULA shows formula textarea + live preview table
- [ ] Formula live preview: table showing `{ component: "HRA", formula: "BASIC * 0.4", result: "₹20,000" }` using a sample CTC of ₹12,00,000 with all current components resolved
- [ ] Inline error on formula field if syntax is invalid (show on blur, not on keystroke)
- [ ] Reorder handle (drag to change displayOrder) — OR numeric displayOrder input (simpler, prefer this)
- [ ] Delete confirmation: `ConfirmDialog` for components with no dependents; blocked with toast for components in use

**Build:**

1. **ComponentsPanel** at `src/modules/payroll/components/SalaryComponentsPanel.tsx`:
   - Uses `usePayrollComponents()` for data.
   - `DynamicTable` with columns defined above.
   - "Add Component" button opens `SalaryComponentDrawer` (create mode).
   - Row actions: Edit (opens drawer in edit mode), Delete (confirm or block).

2. **SalaryComponentDrawer** at `src/modules/payroll/components/SalaryComponentDrawer.tsx`:
   - `Sheet` sliding in from the right.
   - Form powered by React Hook Form + Zod (`salary-component.schema.ts`).
   - Section 1 — Basic info: Name, Code (auto-slugified from name for new components, readonly after creation), Type (EARNING/DEDUCTION/BENEFIT/REIMBURSEMENT), Taxable toggle, Active toggle, Display order, Description.
   - Section 2 — Calculation: `calculationType` radio group. Conditionally renders:
     - FLAT: Amount input (number, 2 decimal places, currency symbol prefix from tenant)
     - PERCENTAGE: Percentage input (0–100) + "Basis" combobox (lists existing component codes + "BASIC" as default)
     - FORMULA: Formula textarea + syntax reference accordion (shows available variables: component codes + CTC, GROSS, NET) + `FormulaPreviewTable`
   - Submit: `useCreateComponent()` or `useUpdateComponent()`. Map 422 errors to fields.

3. **FormulaPreviewTable** (sub-component inside the drawer):
   - Uses `computeComponentBreakdown()` from `formula.utils.ts`.
   - Sample CTC: ₹12,00,000 / $100,000 (tenant currency).
   - Evaluates ALL components (including the one being edited, using the current formula field value).
   - Renders a mini table: Component Code / Name / Type / Monthly Amount.
   - Updates on formula field change (debounced 300ms).
   - Shows an error row if formula is invalid instead of crashing.

4. **Zod schema** (`salary-component.schema.ts`):
   - `code`: uppercase letters, numbers, underscores only, required, max 30
   - `formula`: custom refine — validates with `validateFormula()` from `formula.utils.ts` when `calculationType === 'FORMULA'`
   - `value`: required when calculationType is FLAT or PERCENTAGE
   - `basisCode`: required when calculationType is PERCENTAGE

5. **Wire into settings route** at `src/app/(dashboard)/settings/pay/components/page.tsx`. Replace the placeholder.

6. **Column: "Value preview"** — custom render that calls `computeComponentBreakdown()` inline with sample CTC to show the calculated value for PERCENTAGE and FORMULA types, or the flat amount for FLAT. Shows `—` while loading.

**Definition of done:**

- Create a FLAT component → appears in table with correct badge.
- Create a PERCENTAGE component → basis picker works, preview shows correct calculation.
- Create a FORMULA component → live preview updates as formula is typed; invalid formula shows error, not a crash.
- Edit existing component → form pre-fills correctly; code field is readonly.
- Delete unused component → confirms and removes. Delete used component → blocked with toast showing dependents.
- Dark mode verified on drawer.

**Files to create:**
`src/modules/payroll/components/SalaryComponentsPanel.tsx`,
`src/modules/payroll/components/SalaryComponentDrawer.tsx`,
`src/modules/payroll/validations/salary-component.schema.ts`,
`src/app/(dashboard)/settings/pay/components/page.tsx`.

**Files to modify:**
`src/modules/payroll/utils/formula.utils.ts` (implement the stubs from Step 55).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → Settings → Pay & Compliance → Salary Components. Create components of each type; verify preview. Light + dark.

**Commit:** `feat(settings): salary components CRUD with live formula preview`

**STOP.** Wait for "next".

---

## STEP 57 — Settings: Pay Groups CRUD

**Goal:** HR can create named pay group templates that bundle salary components,
with group-level overrides per component.

**Read first:** `docs/phase2api.md §1.2`; the `PayGroup` and `PayGroupComponent` types from Step 55.

**Wireframe checklist:**

- [ ] Two-panel layout: left = list of pay groups (card list, not full table) / right = detail + component list for selected group
- [ ] [+ New Pay Group] button in list panel header
- [ ] Detail panel shows: name, code, currency, pay schedule badge, employee count, description
- [ ] Component list in detail panel: sortable by displayOrder; each row shows component name, type badge, override indicator (if overridden from default), calculated preview amount
- [ ] [Edit] button on detail panel opens `PayGroupDrawer` (create/edit)
- [ ] [Delete] button: blocked if `employeeCount > 0` (show count in error toast)
- [ ] [Add/Remove components] within detail panel: multi-select from existing components + set override per selected component
- [ ] Override drawer: when clicking a component in the group, can override its calculationType/value/formula for this group only

**Build:**

1. **PayGroupsPanel** (`src/modules/payroll/components/PayGroupsPanel.tsx`):
   - Left: `usePayGroups()` list rendered as cards (name, currency, employeeCount, paySchedule badge). Click to select.
   - Right: selected group detail. Uses `usePayGroups()` data (no separate detail fetch needed if full data is in list).
   - Uses `useState` for selected group ID.

2. **PayGroupDrawer** (`src/modules/payroll/components/PayGroupDrawer.tsx`):
   - `Sheet` from right.
   - Form: Name, Code (slugified from name, readonly after creation), Currency (text input — ISO 4217 code, e.g. "INR"), Pay schedule (MONTHLY / BIWEEKLY / WEEKLY select), Description.
   - Component selection: `usePayrollComponents()` list with checkboxes. Selected components appear in a drag-sortable list (just use `displayOrder` numeric inputs — no drag library needed).
   - Per-component override section: expandable row per selected component — shows "Override?" toggle, and if on: override calculationType + value/formula inputs.

3. **Preview column** in the component list: same `computeComponentBreakdown()` utility, using the group's overrides applied on top of component defaults. Sample CTC: 1,200,000.

4. **Wire into route** `src/app/(dashboard)/settings/pay/groups/page.tsx`.

5. **Pay Schedules panel** (simple placeholder for Step 55's stub route) — replace with a basic read-only list of schedules from `usePaySchedules()`. No CRUD needed for demo. Just shows the list from MSW.
   Route: `src/app/(dashboard)/settings/pay/schedules/page.tsx`.

**Definition of done:**

- Create a pay group → appears in list.
- Select group → detail panel shows components with calculated preview amounts.
- Override a component's percentage → preview updates.
- Delete group with 0 employees → works. Delete with employees → toast shows count.

**Files to create:**
`src/modules/payroll/components/PayGroupsPanel.tsx`,
`src/modules/payroll/components/PayGroupDrawer.tsx`,
`src/modules/payroll/validations/pay-group.schema.ts`,
`src/app/(dashboard)/settings/pay/groups/page.tsx`,
`src/app/(dashboard)/settings/pay/schedules/page.tsx`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → Settings → Pay Groups → create, select, override. Light + dark.

**Commit:** `feat(settings): pay groups CRUD with component overrides and preview`

**STOP.** Wait for "next".

---

## STEP 58 — Employee Profile: Compensation tab

**Goal:** HR can view and assign salary configuration to an employee from their
profile. Live formula breakdown shows what each component calculates to.

**Read first:** `docs/phase2api.md §2.1`; `CLAUDE.md §23` ("Compensation tab"); the `EmployeeSalary` type from Step 55; `src/modules/employees/components/EmployeeProfile.tsx` (tab list location).

**Wireframe checklist:**

- [ ] New tab "Compensation" inserted between "Job" and "Documents" tabs in `EmployeeProfile`
- [ ] Tab visible to HR_ADMIN and SUPER_ADMIN only (hide for EMPLOYEE and MANAGER viewing another's profile)
- [ ] Tab content — not-assigned state: `EmptyState` with "No salary config assigned. Assign one to run payroll for this employee." + [Assign Salary] button
- [ ] Tab content — assigned state:
  - Summary row: Pay Group name (link to `/settings/pay/groups`) | Annual CTC | Effective from date | [Edit] button
  - Component breakdown table: Component Name / Type badge / Calculation (how it's computed, shown as text e.g. "40% of BASIC") / Monthly Amount
  - Totals row: Gross Earnings / Total Deductions / Net Pay
  - History section: collapsible "Previous salary records" list (effectiveFrom – effectiveTo, CTC, payGroup name)
  - Bank details section (masked account number): Account Name / Bank / IFSC / masked account number. [Edit bank details] button.
- [ ] [Assign Salary] / [Edit] opens `SalaryAssignmentDrawer`
- [ ] `SalaryAssignmentDrawer`: fields = Pay Group (select), Annual CTC (number input), Effective From (date), bank details fields

**Build:**

1. **CompensationTab** (`src/modules/employees/components/CompensationTab.tsx`):
   - `useEmployeeSalary(employeeId)` for data.
   - Permission check: show tab only if `user.memberType` is HR_ADMIN or SUPER_ADMIN.
   - Not-assigned state: `EmptyState` + button.
   - Assigned state: the layout described in checklist. Component breakdown uses `computeComponentBreakdown()` from `formula.utils.ts` — client-side computation from the salary config's `calculatedComponents` array returned by the API.
   - "History" section: expandable with `useState`.

2. **SalaryAssignmentDrawer** (`src/modules/employees/components/SalaryAssignmentDrawer.tsx`):
   - Sheet from right.
   - Form fields: Pay Group (select — `usePayGroups()` data), Annual CTC (number), Effective From (date picker), Bank Account Name, Bank Account Number, Bank IFSC, Bank Name.
   - On submit: `useAssignSalary(employeeId)`. On success, invalidate `['employees', 'salary', employeeId]` query.

3. **Wire into EmployeeProfile tabs** — add "Compensation" between "Job" and "Documents" in the `tabs` array. Conditionally render based on role check.

**Definition of done:**

- Login as HR → view employee → Compensation tab visible → shows EmptyState → Assign salary → drawer opens → fill in form → save → breakdown table renders with correct amounts.
- Login as EMPLOYEE → own profile → Compensation tab NOT visible.
- Formula-based components (PROF_TAX, SPECIAL_ALLOW) show correct computed amounts.

**Files to create:**
`src/modules/employees/components/CompensationTab.tsx`,
`src/modules/employees/components/SalaryAssignmentDrawer.tsx`.

**Files to modify:**
`src/modules/employees/components/EmployeeProfile.tsx` (add tab + import).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → Employee profile → Compensation tab in both roles. Light + dark.

**Commit:** `feat(employee-profile): compensation tab with salary assignment and breakdown`

**STOP.** Wait for "next".

---

## STEP 59 — Payroll: Run payroll flow (`/payroll`)

**Goal:** HR can initiate, calculate, and review a payroll run for any period.
The `/payroll` route becomes the operational payroll screen.

**Read first:** `docs/phase2api.md §3`; `PayrollRun` and `PayrollRunStatus` types; `CLAUDE.md §23` (payroll run status machine).

**Wireframe checklist:**

- [ ] PageHeader: "Payroll" + [Run Payroll] button (HR only)
- [ ] 2 tabs: "Runs" (default) | "My Payslips" (EMPLOYEE role — redirect to this tab; hidden for HR)
- [ ] **Runs tab** (HR view):
  - 4 stats cards: Total Paid (this year) / Last Run Net / Employees on Payroll / Pending Runs
  - DynamicTable of runs: Period / Status badge / Employees / Gross / Deductions / Net / Processed On / Actions
  - Status badges: DRAFT=gray, CALCULATING=info (spinner), REVIEW=warning, APPROVED=brand, PAID=success, CANCELLED=danger
  - Actions per row: View (all statuses), Approve (REVIEW only, SUPER_ADMIN), Mark Paid (APPROVED only)
- [ ] [Run Payroll] button opens `InitiateRunDialog`
- [ ] **InitiateRunDialog**: Period picker (month/year — current month pre-selected), "Include all active employees" checkbox (default on), optional pay group filter. [Cancel] [Calculate Payroll]
- [ ] After initiating: status shows CALCULATING. Auto-poll `usePayrollRun(id)` every 3 seconds until status ≠ CALCULATING. Then show toast "Payroll calculated — review before approving."
- [ ] Clicking a run row navigates to `/payroll/[runId]`

**Build:**

1. **PayrollScreen** (`src/modules/payroll/components/PayrollScreen.tsx`):
   - Client component. Tab state via `nuqs` (`?tab=runs|my-payslips`).
   - Role-aware: HR sees "Runs" tab; EMPLOYEE is redirected to `/payroll/my-payslips`.

2. **PayrollRunsTab** (`src/modules/payroll/components/PayrollRunsTab.tsx`):
   - `usePayrollRuns(params)` for data. Pass `?year=<currentYear>` default.
   - 4 `StatsCard`s above the table (computed from run list).
   - `DynamicTable` with the columns above.
   - Row click → `router.push('/payroll/' + run.id)`.
   - "Approve" action → `useApprovePayrollRun()` (SUPER_ADMIN gate via `<PermissionWrapper>`).

3. **InitiateRunDialog** (`src/modules/payroll/components/InitiateRunDialog.tsx`):
   - Dialog (medium size).
   - Period: two selects (Month + Year). Validates not in future, not already a PAID run.
   - On submit: `useInitiatePayrollRun()` → on success immediately call `useCalculatePayrollRun(run.id)`.
   - After calculating: poll via `refetchInterval: 3000` on `usePayrollRun(id)` until status ≠ CALCULATING. Show inline spinner in the dialog while polling. Navigate to run detail on completion.

4. **`/payroll/page.tsx`** — replace placeholder with `<PayrollScreen />`.

**Definition of done:**

- Runs table shows seed runs with correct status badges.
- [Run Payroll] opens dialog, fills period, submits → DRAFT run appears in table → CALCULATING spinner → REVIEW (toast fires) → clicking row navigates to detail.
- HR can see the Runs tab; EMPLOYEE is redirected.

**Files to create:**
`src/modules/payroll/components/PayrollScreen.tsx`,
`src/modules/payroll/components/PayrollRunsTab.tsx`,
`src/modules/payroll/components/InitiateRunDialog.tsx`.

**Files to modify:**
`src/app/(dashboard)/payroll/page.tsx` (replace placeholder).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → /payroll. Initiate a run, follow status through to REVIEW. Light + dark.

**Commit:** `feat(payroll): run payroll flow — initiate, calculate, review table`

**STOP.** Wait for "next".

---

## STEP 60 — Payroll: Run detail page + payslip viewer

**Goal:** HR can review all payslips in a run, add one-time adjustments, and
navigate to individual payslip detail.

**Read first:** `docs/phase2api.md §3.2`; `Payslip` and `PayslipLine` types.

**Wireframe checklist:**

- [ ] PageHeader: "Payroll / June 2024" breadcrumb + status badge inline + [Approve] button (SUPER_ADMIN, REVIEW status only) + [Mark as Paid] button (APPROVED status only)
- [ ] 4 stats cards: Total Employees / Gross Earnings / Total Deductions / Net Pay
- [ ] Warning panel: if `run.summary.warnings.length > 0`, show collapsible list ("2 employees skipped — no salary config")
- [ ] Department summary table: Department / Employees / Net Pay — from `run.summary.byDepartment`
- [ ] Payslip table (DynamicTable): Employee Code / Name / Department / Present Days / LOP Days / Gross / Deductions / Net / Adjustments indicator / Actions
- [ ] Row actions: [View payslip] (opens PayslipDrawer), [Add adjustment] (opens AdjustmentDialog)
- [ ] **PayslipDrawer** (Sheet): full payslip detail — company header, employee info, earnings table, deductions table, one-time additions/deductions, totals row, working days summary
- [ ] **AdjustmentDialog**: adds one-time addition or deduction. Fields: type (Addition/Deduction), description, amount. Calls `useAdjustPayslip()`. Row in payslip table shows adjustment indicator after save.
- [ ] [Export Register] button → calls `GET /payroll/runs/:id/export` → CSV download

**Build:**

1. **PayrollRunDetailPage** (`src/modules/payroll/components/PayrollRunDetail.tsx`):
   - `usePayrollRun(runId)` + `usePayrollRunPayslips(runId, params)`.
   - 4 stats cards.
   - `DynamicTable` for payslips.
   - Export button triggers Blob download (same pattern as employees CSV export).

2. **PayslipDrawer** (`src/modules/payroll/components/PayslipDrawer.tsx`):
   - Full payslip layout.
   - Earnings section: table with Name / Amount / Taxable indicator.
   - Deductions section: table with Name / Amount.
   - One-time sections (if any).
   - Totals: Gross / Deductions / **Net Pay** (bold, larger text).
   - Working days summary bar: Working Days / Present / LOP.

3. **AdjustmentDialog** (`src/modules/payroll/components/AdjustmentDialog.tsx`):
   - Small dialog.
   - Type radio (Addition / Deduction), Description input, Amount input.
   - `useAdjustPayslip(runId, payslipId)`.

4. **`/payroll/[runId]/page.tsx`** — replace placeholder with `<PayrollRunDetail runId={params.runId} />`.

**Definition of done:**

- Navigate to a REVIEW run → see all payslips.
- Open a payslip → full breakdown renders.
- Add an adjustment → indicator appears on row, adjustment shows in payslip.
- Export → CSV downloads.
- Approve button visible for SUPER_ADMIN on REVIEW status run.

**Files to create:**
`src/modules/payroll/components/PayrollRunDetail.tsx`,
`src/modules/payroll/components/PayslipDrawer.tsx`,
`src/modules/payroll/components/AdjustmentDialog.tsx`.

**Files to modify:**
`src/app/(dashboard)/payroll/[runId]/page.tsx` (replace placeholder).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → open a seeded PAID run → view payslip detail. Light + dark.

**Commit:** `feat(payroll): run detail page with payslip viewer and adjustments`

**STOP.** Wait for "next".

---

## STEP 61 — Payroll: Employee self-service payslip history

**Goal:** Employees can view their own past payslips. HR can also browse any
employee's payslip history via the Compensation tab (added in Step 58).

**Read first:** `docs/phase2api.md §2.2`; `CLAUDE.md §10` (auth & permissions).

**Wireframe checklist:**

- [ ] Route `/payroll/my-payslips` — EMPLOYEE role only (redirect HR to `/payroll`)
- [ ] PageHeader: "My Payslips"
- [ ] Year filter: [2024 ▾] (year select, defaults to current year)
- [ ] Payslip list (card list, not table): Period label / Net Pay (large) / Status badge / [View] button per card
- [ ] [View] opens `PayslipDrawer` (same component from Step 60 — reuse)
- [ ] Empty state: "No payslips yet. Once payroll is processed, your payslips will appear here."
- [ ] PDF download button inside `PayslipDrawer`: `[Download PDF ↓]` — shows a browser-print-based PDF for now (use `window.print()` with a print-only CSS block that formats the payslip). No external PDF library needed.

**Build:**

1. **MyPayslipsPage** (`src/modules/payroll/components/MyPayslipsPage.tsx`):
   - `useEmployeePayslips(user.employeeId, { year })` for data.
   - If user is not EMPLOYEE (i.e., HR), redirect to `/payroll`.
   - Year select using `useState`.
   - Card list (not DynamicTable — cards feel more personal for self-service).
   - Reuses `PayslipDrawer` from Step 60.

2. **Print CSS** — add a `@media print` block to `src/app/globals.css`:

   ```css
   @media print {
     .no-print {
       display: none !important;
     }
     .payslip-print-root {
       display: block !important;
     }
   }
   ```

   The `PayslipDrawer` root wraps the payslip content in a div with `className="payslip-print-root"` and adds `className="no-print"` to the close button and action buttons. The [Download PDF] button calls `window.print()`.

3. **`/payroll/my-payslips/page.tsx`** — replace placeholder with `<MyPayslipsPage />`.

**Definition of done:**

- Login as Priya (EMPLOYEE) → /payroll → redirects to /payroll/my-payslips.
- Payslip cards appear for the current year.
- Click View → full payslip detail in drawer.
- Click Download PDF → browser print dialog opens with payslip-formatted layout.
- Login as HR → /payroll/my-payslips → redirects back to /payroll.

**Files to create:** `src/modules/payroll/components/MyPayslipsPage.tsx`.
**Files to modify:** `src/app/(dashboard)/payroll/my-payslips/page.tsx`, `src/app/globals.css`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → login as each seed role, verify redirect behavior, verify payslip view + print.

**Commit:** `feat(payroll): employee self-service payslip history with print-to-PDF`

**STOP.** Wait for "next".

---

## STEP 62 — Reports: Module skeleton + page layout + MSW

**Goal:** All reports plumbing in place — module, types, services, MSW, and the
page layout with left-nav. Zero actual report data rendered yet (all panels show
placeholder "loading soon" state).

**Read first:** `docs/phase2api.md §4`; `CLAUDE.md §23` (reports design).

**Build:**

1. **Module folder** `src/modules/reports/` with full anatomy:

   ```
   src/modules/reports/
   ├── components/
   │   ├── ReportsPage.tsx
   │   ├── ReportsNav.tsx
   │   └── ReportShell.tsx          # wrapper: filter bar + chart + table + export
   ├── hooks/
   │   ├── useWorkforceReports.ts
   │   ├── useAttendanceReports.ts
   │   ├── useLeaveReports.ts
   │   └── usePayrollReports.ts
   ├── services/
   │   └── reports.api.ts
   ├── types/
   │   └── reports.types.ts
   ├── constants/
   │   └── index.ts
   └── index.ts
   ```

2. **Types** — define all types from `docs/phase2api.md §4`:
   `ReportMeta`, `ReportData<TSummary, TChartItem, TTableItem>` (generic),
   `HeadcountChartItem`, `HeadcountTableItem`, `HeadcountSummary`,
   `TurnoverSummary`, `TurnoverChartItem`, `TurnoverTableItem`,
   `DemographicsData`, `AttendanceSummaryItem`, `AbsenteeismChartItem`,
   `LeaveUtilizationSummary`, `LeaveUtilizationChartItem`, `LeaveUtilizationTableItem`,
   `PayrollSummaryChartItem`, `PayrollSummaryTableItem`, `CtcAnalysisData`,
   `ReportExportRequest`.

3. **Services** — one service method per endpoint in `docs/phase2api.md §4`. Each unwraps its specific shape. Include `exportReport(req: ReportExportRequest): Promise<Blob>`.

4. **Hooks** — one hook per report, plus `useExportReport()` mutation.

5. **MSW handlers** — `src/mocks/handlers/reports.ts` with all report endpoints returning realistic fixture data matching the spec shapes. Wire into `src/mocks/handlers/index.ts`.

6. **ReportsPage** (`src/modules/reports/components/ReportsPage.tsx`):
   - Left nav (`ReportsNav`, w-56, sticky) with 4 sections:
     ```
     WORKFORCE
       Headcount
       Turnover
       Demographics
     ATTENDANCE
       Monthly Summary
       Absenteeism Trend
     LEAVE
       Utilization
       Pending Requests
     PAYROLL
       Payroll Summary
       CTC Analysis
     ```
   - Right content area (`flex-1`) shows the selected report panel.
   - Active report tracked in URL via `nuqs` `?report=workforce/headcount` (default).
   - Each panel is a lazy-loaded component (use `React.lazy` + `<Suspense>` here — each report is its own chunk).

7. **ReportShell** (`src/modules/reports/components/ReportShell.tsx`):
   - Common wrapper used by every report panel. Props: `title`, `description`, `filterBar` (ReactNode), `chart` (ReactNode), `table` (ReactNode), `onExport` (callback), `isLoading`, `isError`, `onRetry`.
   - Renders: page title + description + filter bar row + [Export CSV] button (right) + chart section + table section.
   - Loading state: chart skeleton (h-48) + table skeleton rows.
   - Error state: `ErrorState` spanning full width.

8. **`/reports/page.tsx`** — replace placeholder with `<ReportsPage />`.

**Definition of done:**

- `/reports` renders left nav + placeholder content for each section.
- Nav switching updates the URL param and shows the correct panel placeholder.
- MSW handlers return fixture data (verify in Network tab).
- No TypeScript errors.

**Files to create:** Full `src/modules/reports/` module + `src/mocks/handlers/reports.ts`.
**Files to modify:** `src/app/(dashboard)/reports/page.tsx`, `src/mocks/handlers/index.ts`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → /reports. Nav works, no crash. Network tab shows MSW responses.

**Commit:** `feat(reports): module skeleton, page layout, left nav, and MSW handlers`

**STOP.** Wait for "next".

---

## STEP 63 — Reports: Workforce reports (Headcount + Turnover + Demographics)

**Goal:** Three working workforce report panels replacing placeholders from Step 62.

**Read first:** `docs/phase2api.md §4.1`; `src/shared/engines/ChartEngine/` (use existing wrappers — `BarChart`, `AreaChart`, `LineChart`).

**Build (one panel per report — all in this step):**

**Headcount Report** (`src/modules/reports/components/HeadcountReport.tsx`):

- Filter bar: Date range (start + end month pickers), Department (select, `useDepartments()`).
- Chart: `BarChart` — x=month, bars for `hires` (success) and `exits` (danger), line for `headcount` (use dual-axis or overlay — choose the cleaner option).
- Summary cards row: Current Headcount / Net Change / Net Hires / Net Exits.
- Table: `DynamicTable` with columns from `data.tableData.items`.
- Export: calls `exportReport({ reportType: 'workforce/headcount', format: 'CSV', filters })`.

**Turnover Report** (`src/modules/reports/components/TurnoverReport.tsx`):

- Filter bar: Date range, Department.
- Summary cards: Total Exits / Voluntary / Involuntary / Attrition Rate.
- Chart: `LineChart` — x=month, y=attritionRate.
- Table: employees who exited in the period.

**Demographics Report** (`src/modules/reports/components/DemographicsReport.tsx`):

- No date range needed — reflects current state.
- Filter: Department.
- Three `DonutChart`s side by side: By Employment Type / By Department / By Gender.
- No table (data is fully in charts).

**Wiring:**

- Update `ReportsPage` to lazy-import and render each component when selected via nav.

**Definition of done:**

- Headcount: filter changes trigger re-fetch; chart + table update; export downloads CSV.
- Turnover: same.
- Demographics: three donuts render with correct data from MSW.
- All three handle loading / empty / error states.

**Files to create:**
`src/modules/reports/components/HeadcountReport.tsx`,
`src/modules/reports/components/TurnoverReport.tsx`,
`src/modules/reports/components/DemographicsReport.tsx`.

**Files to modify:** `src/modules/reports/components/ReportsPage.tsx` (wire lazy imports).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → each of the three reports. Change filters; verify re-fetch. Export CSV.

**Commit:** `feat(reports): workforce reports — headcount, turnover, demographics`

**STOP.** Wait for "next".

---

## STEP 64 — Reports: Attendance & Leave reports

**Goal:** Four more working report panels — attendance summary, absenteeism,
leave utilization, and pending requests.

**Read first:** `docs/phase2api.md §4.2`, `§4.3`.

**Build:**

**Attendance Summary Report** (`AttendanceSummaryReport.tsx`):

- Filter bar: Month picker (YYYY-MM), Department.
- Summary cards: Working Days / Avg Attendance % / Total Present / Total Absent / Total Leave.
- Table: per-employee rows with attendancePercent column + conditional color (green ≥ 90%, yellow 75–90%, red < 75%).
- No chart (data is tabular).

**Absenteeism Trend Report** (`AbsenteeismReport.tsx`):

- Filter bar: Date range, Department.
- Chart: `LineChart` — x=month, y=absenteeismRate.
- Table: top-N employees by absenteeism rate.

**Leave Utilization Report** (`LeaveUtilizationReport.tsx`):

- Filter bar: Year (select), Department, Leave Type (select, `useLeaveTypes()`).
- Summary cards: Total Allocated / Total Taken / Total Pending / Utilization Rate.
- Chart: `BarChart` — one bar group per leave type (allocated vs taken).
- Table: per-employee leave balance breakdown.

**Pending Leave Report** (`PendingLeaveReport.tsx`):

- No date range (shows current state).
- Filter: Department, Leave Type.
- Table only: DynamicTable with employee / leave type / duration / days pending / days in queue (today - appliedAt). Sorted by oldest pending first.
- Summary: total pending requests count + total pending days.

**Wire into ReportsPage** — lazy import all four.

**Definition of done:** All four panels render, filters work, export works for panels that have it. All four states handled.

**Files to create:** Four report component files.
**Files to modify:** `src/modules/reports/components/ReportsPage.tsx`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → cycle through all four panels; change filters; verify.

**Commit:** `feat(reports): attendance and leave report panels`

**STOP.** Wait for "next".

---

## STEP 65 — Reports: Payroll reports + Export

**Goal:** Payroll Summary and CTC Analysis reports. Harden the export flow
across all reports.

**Read first:** `docs/phase2api.md §4.4`, `§4.5`.

**Build:**

**Payroll Summary Report** (`PayrollSummaryReport.tsx`):

- Filter bar: Date range (month granularity), Department.
- Summary cards: Total Payroll Cost / Avg Monthly / Total Employees / Currency.
- Chart: `AreaChart` — x=month, y=totalNet (area fill) + `totalGross` (line overlay for comparison).
- Table: by-department breakdown (DynamicTable).
- Export: CSV of the table data.

**CTC Analysis Report** (`CtcAnalysisReport.tsx`):

- Filter: Department, As-of date.
- Three-panel layout: DonutChart (CTC band distribution) + percentile table (P25 / P50 / P75 / P90) + employee CTC table (HR only, masked for non-HR).
- No export (sensitive data — HR only at UI level; server enforces at API level).

**Export hardening** — ensure every report panel with a table has a working [Export CSV] button that:

1. Calls `exportReport({ reportType, format: 'CSV', filters: currentFilters })`.
2. Shows loading spinner on the button while downloading.
3. Triggers `URL.createObjectURL(blob)` download with `Content-Disposition` filename.
4. Shows `toast.success("Report exported")` on success, `toast.error("Export failed")` on error.

**Wire into ReportsPage** — lazy import both.

**Definition of done:** Both payroll reports render. Export downloads CSV with correct filename. All reports in Steps 63–65 now have working export buttons.

**Files to create:** Two payroll report component files.
**Files to modify:** `src/modules/reports/components/ReportsPage.tsx`, `ReportShell.tsx` (export button loading state).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → Payroll Summary → change filters → export CSV → verify download.

**Commit:** `feat(reports): payroll summary, CTC analysis, and hardened CSV export`

**STOP.** Wait for "next".

---

## STEP 66 — Analytics: Dedicated `/analytics` page (existing endpoints)

**Goal:** A full-screen analytics dashboard using the existing live endpoints.
This is a richer, more filterable version of the dashboard widgets.

**Read first:** `CLAUDE.md §23` (analytics design); `CLAUDE.md §3` (existing live analytics endpoints: `/analytics/summary`, `/analytics/attendance`, `/analytics/headcount-by-department`, `/analytics/recent-activity`, `/analytics/leave-summary`).

**Wireframe checklist:**

- [ ] PageHeader: "Analytics"
- [ ] Filter bar (sticky below PageHeader): [Date Range: Last 30 days ▾ (7d / 30d / 90d / Custom)] [Department ▾]
- [ ] Row 1: 4 stats cards with deltas — same as HR dashboard but always visible here; update when date range changes
- [ ] Row 2: Attendance trend (AreaChart, full width, date range from filter)
- [ ] Row 3: Headcount by department (DonutChart, 5-col) + Leave summary (BarChart per type, 7-col)
- [ ] Row 4: Recent Activity table (full width, same as HR dashboard but paginated — [Load more] button)
- [ ] Custom date range: When "Custom" is selected, show a date range popover with two date pickers; selected range is reflected in all chart queries

**Build:**

1. **AnalyticsPage** (`src/modules/analytics/components/AnalyticsPage.tsx`):
   - Create new `src/modules/analytics/` module (minimal — just the page component + hook + service + types).
   - Date range state: `nuqs` param `?range=7d|30d|90d` + custom range stored as `?from=YYYY-MM-DD&to=YYYY-MM-DD`.
   - Department filter: `?departmentId=`.
   - Re-uses existing hooks: `useAnalyticsSummary()`, `useAnalyticsAttendance(range)`, `useHeadcountByDepartment()`, `useRecentActivity(limit)`, `useLeaveSummary(range)` from the dashboard module. Pass the filter params.
   - Passes `departmentId` to the hooks that support it (some endpoints don't — that's fine for now; filter silently has no effect and note this).

2. **RangeSelector component** (`src/modules/analytics/components/RangeSelector.tsx`):
   - Segmented control: [7d] [30d] [90d] [Custom]. When Custom selected, shows a `Popover` with two `Calendar` date pickers.
   - On custom range apply → updates URL params.

3. **Analytics-specific layout**: two-column row 3, paginated activity in row 4 (load more via `limit` param incrementing).

4. **`/analytics/page.tsx`** — replace placeholder with `<AnalyticsPage />`.

5. **Module** `src/modules/analytics/index.ts` — export the page component.

**Definition of done:**

- `/analytics` renders all four rows with live endpoint data.
- Changing the date range re-fetches attendance chart and summary cards.
- Department filter passes to endpoints that support it.
- Custom date range popover works and updates charts.
- Load more in Recent Activity appends rows.

**Files to create:** `src/modules/analytics/` module (minimal anatomy: component, hook reuse, index).
**Files to modify:** `src/app/(dashboard)/analytics/page.tsx`.

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → /analytics → change range → charts update. Custom range works.

**Commit:** `feat(analytics): dedicated analytics page with range + department filters`

**STOP.** Wait for "next".

---

## STEP 67 — Analytics: Workforce trend + attrition + payroll-cost charts (MSW)

**Goal:** Three new analytics charts using the new MSW-backed endpoints from
`docs/phase2api.md §5`.

**Read first:** `docs/phase2api.md §5.1`, `§5.2`, `§5.3`, `§5.4`.

**Wireframe checklist:**

- [ ] Row 5 (new, below existing rows): Workforce Trend chart (LineChart with dual series: headcount + new hires/exits bars — use Recharts ComposedChart wrapper) spanning full width
- [ ] Row 6: Attrition Rate (LineChart, 6-col) + Payroll Cost Trend (AreaChart, 6-col)
- [ ] Row 7: Department Performance table (full width) — headcount / attendance rate / leave rate / pending approvals / avg tenure

**Build:**

1. **MSW handlers** (`src/mocks/handlers/analytics.ts` — extend the existing file):
   - `GET /analytics/workforce-trend?range=` → return 6 months of data.
   - `GET /analytics/attrition?range=` → return trend + current rate.
   - `GET /analytics/payroll-cost?range=` → return monthly cost trend.
   - `GET /analytics/department-performance?range=` → return per-dept metrics.

2. **New hooks** in analytics module:
   - `useWorkforceTrend(range)`
   - `useAttritionTrend(range)`
   - `usePayrollCostTrend(range)`
   - `useDepartmentPerformance(range)`

3. **New services** in analytics module — each method unwraps its specific shape per `docs/phase2api.md §5`.

4. **New chart components** in `AnalyticsPage.tsx` (or extracted to sub-components):
   - `WorkforceTrendChart`: Recharts `ComposedChart` with `Bar` for hires/exits + `Line` for headcount. Use `ChartEngine`'s existing Recharts setup for consistent styling.
   - `AttritionChart`: `LineChart` wrapper.
   - `PayrollCostChart`: `AreaChart` wrapper.
   - `DeptPerformanceTable`: `DynamicTable` with conditional cell coloring (attendanceRate: green/yellow/red).

5. Add all four rows to `AnalyticsPage` below the existing content. Pass the same `range` and `departmentId` filter params.

**Definition of done:**

- All four new widgets render with MSW data.
- Changing the date range filter updates all charts including the new ones.
- Department Performance table shows conditional color on attendance rate.
- Light + dark verified.

**Files to create:** 4 MSW endpoints in `analytics.ts`, 4 hooks, 4 service methods.
**Files to modify:** `src/modules/analytics/components/AnalyticsPage.tsx` (add rows 5–7), `src/mocks/handlers/analytics.ts`, `src/modules/analytics/` (hooks + services + types).

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → /analytics → scroll to new rows → verify all four render and respond to filter changes.

**Commit:** `feat(analytics): workforce trend, attrition, payroll-cost, dept-performance charts`

**STOP.** Wait for "next".

---

## STEP 68 — Settings: Email Integration panel

**Goal:** Replace the Phase2Panel placeholder at `/settings/integration-email` with a
functional provider-configuration form backed by MSW. SUPER_ADMIN only. No backend
endpoint exists yet — all requests are served by `src/mocks/handlers/settings-integrations.ts`.

**Read first:** `docs/phase2api.md §7.1` for the full API contract.

**Acceptance criteria:**

- [ ] `SettingsNav` item "Email" in Integrations group: `phase2: true` badge **removed**
- [ ] Provider picker (radio/tab group): **Resend · SendGrid · AWS SES · Custom SMTP**; selecting a different provider swaps the form fields below
- [ ] **Resend / SendGrid form**: API Key (password input + show/hide toggle) · From Address · From Name
- [ ] **AWS SES form**: Access Key ID · Secret Access Key (password + toggle) · AWS Region (select: us-east-1, ap-south-1, eu-west-1, us-west-2) · From Address · From Name
- [ ] **Custom SMTP form**: Host · Port (number) · Username · Password (password + toggle) · Encryption (select: TLS / STARTTLS / None) · From Address · From Name
- [ ] Connection status pill below the form: `Not configured` (grey) / `Connected` (green) / `Error` (red) — loaded from GET, updated after successful save
- [ ] Last tested timestamp shown when `lastTestedAt` is not null
- [ ] **[Save Configuration]** button: calls `PATCH`, shows spinner while pending, toast on success/error, updates status pill
- [ ] **[Send test email]** button (disabled if `status === 'unconfigured'`): opens a small Dialog with a "To" email input + [Send] button; calls `POST /test`; toast `"Test email sent to <address>"` on success, toast error on `502`
- [ ] Loading skeleton (3 field rows)
- [ ] Error state with retry

**Build:**

1. **MSW handler** — create `src/mocks/handlers/settings-integrations.ts`:
   - `GET /settings/integrations/email` → return mock with `provider: 'resend'`, `status: 'connected'`, `lastTestedAt: <ISO>`, `config.apiKey: '••••••••4f2a'`, `fromAddress: 'noreply@acme.com'`, `fromName: 'Acme HR'`
   - `PATCH /settings/integrations/email` → merge body into in-memory state, return updated object (redact full secret → show last 4 chars only)
   - `POST /settings/integrations/email/test` → if body.to is valid email, return `{ messageId: 'msg_mock_01', sentAt: new Date().toISOString() }`; otherwise return 422
   - Export `settingsIntegrationHandlers`

2. **Register handler** — add `import { settingsIntegrationHandlers }` and spread into `handlers` array in `src/mocks/handlers/index.ts`. Add comment noting these are Phase 2.5 settings endpoints.

3. **Types** — in `src/modules/settings/types/settings.types.ts` add:

   ```ts
   export type EmailProvider = 'resend' | 'sendgrid' | 'ses' | 'smtp';
   export type IntegrationStatus = 'connected' | 'error' | 'unconfigured';
   export type SmtpEncryption = 'tls' | 'starttls' | 'none';

   export interface EmailIntegrationConfig {
     apiKey: string | null;
     region: string | null;
     accessKeyId: string | null;
     host: string | null;
     port: number | null;
     username: string | null;
     encryption: SmtpEncryption | null;
   }

   export interface EmailIntegration {
     provider: EmailProvider | null;
     fromAddress: string;
     fromName: string;
     status: IntegrationStatus;
     lastTestedAt: string | null;
     config: EmailIntegrationConfig;
   }

   export interface EmailIntegrationUpdateInput {
     provider: EmailProvider;
     fromAddress: string;
     fromName: string;
     config: Partial<EmailIntegrationConfig> & { secretAccessKey?: string; password?: string };
   }
   ```

4. **Service** — add to `src/modules/settings/services/settings.api.ts`:

   ```ts
   getEmailIntegration: async (): Promise<EmailIntegration> => { ... }
   updateEmailIntegration: async (input: EmailIntegrationUpdateInput): Promise<EmailIntegration> => { ... }
   testEmailIntegration: async (to: string): Promise<{ messageId: string; sentAt: string }> => { ... }
   ```

5. **Hooks** — add `useEmailIntegration()` to `useSettings.ts` and `useUpdateEmailIntegration()` / `useTestEmailIntegration()` to `useSettingsMutations.ts`. Query key: `['settings', 'integrations', 'email']`.

6. **Component** — create `src/modules/settings/components/EmailIntegrationPanel.tsx`:
   - `'use client'` — form is interactive
   - Use `useEmailIntegration()` for initial data; pre-fill form on load
   - `providerWatch` state drives conditional field rendering (use `useWatch` from RHF)
   - Password fields use `<Input type="password">` with a show/hide toggle button (`EyeIcon`/`EyeOffIcon`)
   - Status pill rendered as `<Badge variant="outline">` with appropriate color class
   - Test email dialog uses `useState` for open/to value; mutation on submit
   - All four component states: loading skeleton, error+retry, empty (unconfigured — show prompt to select provider), configured form
   - Zod schema per provider (discriminated union or superRefine based on `provider` value)

7. **Page** — replace `Phase2Panel` in `src/app/(dashboard)/settings/integration-email/page.tsx`:

   ```tsx
   import { EmailIntegrationPanel } from '@/modules/settings/components/EmailIntegrationPanel';
   export const metadata = { title: 'Email Integration — Settings' };
   export default function IntegrationEmailPage() {
     return <EmailIntegrationPanel />;
   }
   ```

8. **Nav badge** — in `src/modules/settings/components/SettingsNav.tsx`, remove `phase2: true` from the `{ label: 'Email', slug: 'integration-email' }` item.

**Definition of done:**

- `/settings/integration-email` renders the provider form (not Phase2Panel).
- Switching provider tab/radio swaps field set instantly.
- Save calls PATCH; status pill updates to `Connected` on success.
- Test email button opens dialog; [Send] calls POST /test; success toast appears.
- No "P2" badge on the Settings nav item.
- Loading skeleton visible on first load.
- Light + dark modes verified.
- TypeScript strict + ESLint clean.

**Files to create:** `src/mocks/handlers/settings-integrations.ts`, `src/modules/settings/components/EmailIntegrationPanel.tsx`
**Files to modify:** `src/mocks/handlers/index.ts`, `src/modules/settings/types/settings.types.ts`, `src/modules/settings/services/settings.api.ts`, `src/modules/settings/hooks/useSettings.ts`, `src/modules/settings/hooks/useSettingsMutations.ts`, `src/app/(dashboard)/settings/integration-email/page.tsx`, `src/modules/settings/components/SettingsNav.tsx`

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → `/settings/integration-email` → verify provider tabs switch form fields → Save → status updates → Test email dialog opens and toasts.

**Commit:** `feat(settings): email integration panel — provider config + test send`

**STOP.** Wait for "next".

---

## STEP 69 — Settings: Storage Integration panel

**Goal:** Replace the Phase2Panel placeholder at `/settings/integration-storage` with a
functional cloud-storage configuration form. Extends `settings-integrations.ts` MSW handler
(created in Step 68). SUPER_ADMIN only.

**Read first:** `docs/phase2api.md §7.2`.

**Acceptance criteria:**

- [ ] `SettingsNav` item "Storage" in Integrations group: `phase2: true` badge **removed**
- [ ] Provider picker: **AWS S3 · Google Cloud Storage · Azure Blob**
- [ ] **AWS S3 form**: Bucket Name · Region (select: common AWS regions) · Access Key ID · Secret Access Key (password + toggle)
- [ ] **Google Cloud Storage form**: Bucket Name · Project ID · Service Account JSON (textarea, monospace font, placeholder shows expected JSON structure)
- [ ] **Azure Blob form**: Account Name · Container Name · Connection String (password + toggle)
- [ ] Connection status pill (same design as Step 68)
- [ ] **[Test Connection]** button: calls `POST /settings/integrations/storage/test`; displays result inline below button — `Latency: 142 ms · Bucket: acme-ems-documents` on success, error message on `502`
- [ ] **[Save Configuration]** button: calls `PATCH`, toast on success/error
- [ ] **Retention Policies** section (below provider form, always visible):
  - Table: Document Type | Retention (days) [editable number input per row]
  - Rows: Employee Records · Payslips · Contracts · ID Proof · Other
  - **[Save Policies]** button: calls `PATCH` with only `retentionPolicies` in body
- [ ] Loading skeleton; error state with retry

**Build:**

1. **MSW handler** — add to `src/mocks/handlers/settings-integrations.ts`:
   - `GET /settings/integrations/storage` → return `{ provider: null, status: 'unconfigured', lastTestedAt: null, config: { all null }, retentionPolicies: [default 5 rows] }`
   - `PATCH /settings/integrations/storage` → merge and return updated object
   - `POST /settings/integrations/storage/test` → if provider is saved, return `{ provider, bucket: config.bucket ?? config.accountName ?? config.bucket, latencyMs: 142 }`; if unconfigured, return `400`

2. **Types** — add to `settings.types.ts`:

   ```ts
   export type StorageProvider = 's3' | 'gcs' | 'azure';
   export type DocumentType = 'EMPLOYEE_RECORD' | 'PAYSLIP' | 'CONTRACT' | 'ID_PROOF' | 'OTHER';

   export interface RetentionPolicy {
     documentType: DocumentType;
     retentionDays: number;
   }

   export interface StorageIntegrationConfig {
     bucket: string | null;
     region: string | null;
     accessKeyId: string | null;
     projectId: string | null;
     accountName: string | null;
     containerName: string | null;
   }

   export interface StorageIntegration {
     provider: StorageProvider | null;
     status: IntegrationStatus;
     lastTestedAt: string | null;
     config: StorageIntegrationConfig;
     retentionPolicies: RetentionPolicy[];
   }

   export interface StorageIntegrationUpdateInput {
     provider?: StorageProvider;
     config?: Partial<StorageIntegrationConfig> & {
       secretAccessKey?: string;
       serviceAccountJson?: string;
       connectionString?: string;
     };
     retentionPolicies?: RetentionPolicy[];
   }

   export interface StorageTestResult {
     provider: StorageProvider;
     bucket: string;
     latencyMs: number;
   }
   ```

3. **Service** — add `getStorageIntegration`, `updateStorageIntegration`, `testStorageIntegration` to `settings.api.ts`.

4. **Hooks** — `useStorageIntegration()`, `useUpdateStorageIntegration()`, `useTestStorageIntegration()`. Query key: `['settings', 'integrations', 'storage']`.

5. **Component** — `src/modules/settings/components/StorageIntegrationPanel.tsx`:
   - Two separate RHF forms: one for provider config, one for retention policies (separate Save buttons)
   - Test connection result stored in local `useState`; cleared on provider change
   - `DOCUMENT_TYPE_LABELS` constant: `{ EMPLOYEE_RECORD: 'Employee Records', PAYSLIP: 'Payslips', ... }`
   - Retention policy inputs: `<Input type="number" min={1} max={36500} />` per row
   - All four component states

6. **Page** — replace Phase2Panel in `src/app/(dashboard)/settings/integration-storage/page.tsx`.

7. **Nav badge** — remove `phase2: true` from the Storage nav item in `SettingsNav.tsx`.

**Files to create:** `src/modules/settings/components/StorageIntegrationPanel.tsx`
**Files to modify:** `src/mocks/handlers/settings-integrations.ts`, `settings.types.ts`, `settings.api.ts`, `useSettings.ts`, `useSettingsMutations.ts`, `src/app/(dashboard)/settings/integration-storage/page.tsx`, `SettingsNav.tsx`

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → `/settings/integration-storage` → switch providers → Test Connection → inline result → Save policies → toast.

**Commit:** `feat(settings): storage integration panel — provider config + retention policies`

**STOP.** Wait for "next".

---

## STEP 70 — Settings: Webhooks panel

**Goal:** Replace the Phase2Panel placeholder at `/settings/integration-webhooks` with a
full webhook manager: list, create, edit, delete, delivery log, and test delivery.
SUPER_ADMIN only. Extends `settings-integrations.ts` MSW handler.

**Read first:** `docs/phase2api.md §7.3`.

**Acceptance criteria:**

- [ ] `SettingsNav` item "Webhooks" in Integrations group: `phase2: true` badge **removed**
- [ ] **Header row**: title "Webhooks" + description line + `[+ Add Webhook]` button (right-aligned)
- [ ] **Table columns**: URL (truncated with tooltip) · Events (first event + `+N more` badge) · Status (Active / Disabled badge) · Last delivery (relative time + status dot) · Actions menu
- [ ] **Actions menu per row** (DropdownMenu): Edit · View delivery log · Test delivery · separator · Delete
- [ ] **Add/Edit — Sheet drawer** (right side, 480 px wide):
  - URL field (required, must start with `https://`)
  - Description field (optional, 100 char max)
  - Events — multi-select checkboxes grouped by domain:
    ```
    Employees:   EMPLOYEE_CREATED, EMPLOYEE_UPDATED, EMPLOYEE_TERMINATED
    Leave:       LEAVE_REQUESTED, LEAVE_APPROVED, LEAVE_REJECTED, LEAVE_WITHDRAWN
    Attendance:  ATTENDANCE_REGULARIZED, ATTENDANCE_REGULARIZATION_APPROVED, ATTENDANCE_REGULARIZATION_DENIED
    Departments: DEPARTMENT_CREATED, DEPARTMENT_UPDATED, DEPARTMENT_DELETED
    Payroll:     PAYROLL_RUN_APPROVED, PAYSLIP_GENERATED
    ```
  - Active toggle (default: true on create)
  - On **create success**: show a one-time-secret banner inside the Sheet: `"Copy your webhook secret — it won't be shown again"` with the secret value in a monospace box and a copy button
  - [Save] button; spinner while pending
- [ ] **Delivery log — nested Sheet** (opens from Actions menu):
  - Title: `Delivery log — <url>`
  - Table: Event · Response · Duration · Timestamp · [Replay] button
  - Response shown as status code badge (200 = green, 4xx = orange, 5xx = red)
  - Pagination (20 per page)
  - Empty state if no deliveries yet
- [ ] **Test delivery**: calls `POST /settings/webhooks/:id/test`; toast with result status code and duration
- [ ] **Delete**: `ConfirmDialog` — "Delete webhook?" with URL shown; calls DELETE; toast + row removed
- [ ] **Empty state**: `EmptyState` title "No webhooks yet" description "Register an HTTPS endpoint to start receiving real-time event notifications." + [+ Add Webhook] action button
- [ ] Loading skeleton (3 table row skeletons); error state with retry

**Build:**

1. **MSW handler** — add to `settings-integrations.ts`:
   - In-memory `let webhooks: Webhook[] = [/* 1 seed item */]`
   - `GET /settings/webhooks` → return `{ success: true, data: webhooks }`
   - `POST /settings/webhooks` → push new item (generate ID, generate secret `whsec_<random32>`), return item with full secret
   - `PATCH /settings/webhooks/:id` → merge, return updated item (secret redacted)
   - `DELETE /settings/webhooks/:id` → filter out, return 204
   - `GET /settings/webhooks/:id/deliveries` → return 10 mock delivery rows with mixed success/failure statuses
   - `POST /settings/webhooks/:id/test` → return `{ delivery: { id, event: 'PING', responseStatus: 200, success: true, durationMs: 98, timestamp: now } }`

2. **Types** — add to `settings.types.ts`:

   ```ts
   export type WebhookEvent = 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | ... (all 15 events)
   export type WebhookStatus = 'active' | 'disabled';

   export interface WebhookLastDelivery {
     timestamp: string; statusCode: number; success: boolean; durationMs: number;
   }
   export interface Webhook {
     id: string; url: string; description: string | null;
     events: WebhookEvent[]; status: WebhookStatus;
     secret: string; lastDelivery: WebhookLastDelivery | null; createdAt: string;
   }
   export interface WebhookCreateInput {
     url: string; events: WebhookEvent[]; description?: string; active?: boolean;
   }
   export type WebhookUpdateInput = Partial<WebhookCreateInput>;

   export interface WebhookDelivery {
     id: string; webhookId: string; event: string; url: string;
     requestBody: string; responseStatus: number; responseBody: string;
     durationMs: number; success: boolean; timestamp: string;
   }
   export interface WebhookDeliveriesResponse {
     deliveries: WebhookDelivery[];
     pagination: { page: number; limit: number; total: number; totalPages: number };
   }
   ```

3. **Constants** — add `WEBHOOK_EVENTS` grouped constant and `WEBHOOK_EVENT_LABELS` map to `src/modules/settings/constants/index.ts` (or new `webhook.constants.ts`).

4. **Service** — add `getWebhooks`, `createWebhook`, `updateWebhook`, `deleteWebhook`, `getWebhookDeliveries`, `testWebhookDelivery` to `settings.api.ts`.

5. **Hooks** — `useWebhooks()`, `useWebhookDeliveries(id)`, `useCreateWebhook()`, `useUpdateWebhook()`, `useDeleteWebhook()`, `useTestWebhookDelivery()`. Query keys: `['settings', 'webhooks']`, `['settings', 'webhooks', id, 'deliveries']`.

6. **Component** — `src/modules/settings/components/WebhooksPanel.tsx`:
   - Two Sheets managed with `useState`: `drawerMode: 'add' | 'edit' | null`, `deliveryLogTarget: Webhook | null`
   - One-time-secret state: `newSecret: string | null` — shown in post-create banner inside the Sheet; cleared when Sheet closes
   - Use `DynamicTable` for the webhook list
   - Delivery log Sheet fetches `useWebhookDeliveries(id)` lazily when `deliveryLogTarget` is set
   - URL validation in Zod: `z.string().url().startsWith('https://')`
   - Zod `events` field: `z.array(z.enum([...all events])).min(1, 'Select at least one event')`
   - All four component states

7. **Page** — replace Phase2Panel in `src/app/(dashboard)/settings/integration-webhooks/page.tsx`.

8. **Nav badge** — remove `phase2: true` from Webhooks nav item.

**Files to create:** `src/modules/settings/components/WebhooksPanel.tsx`
**Files to modify:** `settings-integrations.ts`, `settings.types.ts`, `settings.api.ts`, `useSettings.ts`, `useSettingsMutations.ts`, `src/modules/settings/constants/` (add webhook event constants), `src/app/(dashboard)/settings/integration-webhooks/page.tsx`, `SettingsNav.tsx`

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → `/settings/integration-webhooks` → Add webhook → see table row → Actions → View delivery log → test delivery toast.

**Commit:** `feat(settings): webhooks panel — CRUD, delivery log, test delivery`

**STOP.** Wait for "next".

---

## STEP 71 — Settings: Plan & Subscription panel

**Goal:** Replace the Phase2Panel placeholder at `/settings/billing-plan` with a functional
subscription dashboard showing the tenant's current plan, seat/usage metrics, and a plan
comparison grid. SUPER_ADMIN only. New MSW handler file `billing.ts`.

**Read first:** `docs/phase2api.md §8.1`.

**Acceptance criteria:**

- [ ] `SettingsNav` item "Plan" in Billing group: `phase2: true` badge **removed**
- [ ] **Current Plan card** (top section):
  - Plan name + status badge (Active / Trialing / Cancelled)
  - Price line: `₹999 / month` (Enterprise shows `Custom pricing — contact sales`)
  - Seats: progress bar `25 / 50 seats used` with label `25 available`
  - Renewal line: `Renews 1 Jun 2026` (or trial end date if trialing)
  - Active modules row: `Payroll ✓ · Recruitment — · Performance —` (checkmark = active, dash = inactive)
- [ ] **Usage section** (two horizontal progress bars):
  - API Calls: `12,450 / 50,000 this month` with percentage bar
  - Storage: `4.2 GB / 20 GB` with percentage bar (format bytes to human-readable)
- [ ] **Available Plans grid** (3 cards: Starter / Professional / Enterprise):
  - Current plan card has distinct highlight border (brand color)
  - Each card shows: plan name · price · seats included · features list (checkmarks)
  - Enterprise card shows "Contact sales" button instead of price; others show "Upgrade" or "Current plan" (disabled)
  - Recommended plan has a "Recommended" badge
- [ ] Loading skeleton (plan card + 2 usage bars + 3 plan cards); error state with retry
- [ ] No interactive seat management or actual billing actions (those require payment integration); [Manage seats] and [Upgrade] buttons show a toast: `"Contact your account manager to change your plan."`

**Build:**

1. **MSW handler** — create `src/mocks/handlers/billing.ts`:
   - `GET /billing/subscription` → return the `data` shape from `docs/phase2api.md §8.1`
   - `GET /billing/plans` → return 3-plan array from `docs/phase2api.md §8.1`
   - Export `billingHandlers`

2. **Register** — import `billingHandlers` in `src/mocks/handlers/index.ts` and spread into `handlers`.

3. **Types** — add to `settings.types.ts`:

   ```ts
   export type PlanCode = 'starter' | 'professional' | 'enterprise';
   export type PlanInterval = 'monthly' | 'annual';
   export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'past_due';

   export interface BillingPlan {
     code: PlanCode;
     name: string;
     price: number | null;
     currency: string;
     interval: PlanInterval;
     seatsIncluded: number | null;
     recommended: boolean;
     features: string[];
     modules: { payroll: boolean; recruitment: boolean; performance: boolean };
   }

   export interface BillingSubscription {
     plan: {
       code: PlanCode;
       name: string;
       price: number;
       currency: string;
       interval: PlanInterval;
     };
     status: SubscriptionStatus;
     seats: { total: number; used: number; available: number };
     usage: {
       apiCalls: { used: number; limit: number };
       storage: { usedBytes: number; limitBytes: number };
     };
     modules: { payroll: boolean; recruitment: boolean; performance: boolean };
     currentPeriod: { start: string; end: string };
     nextRenewalDate: string;
     trialEndsAt: string | null;
   }
   ```

4. **Service** — add `getBillingSubscription` and `getBillingPlans` to `settings.api.ts`.
   - `getBillingSubscription: async (): Promise<BillingSubscription>`
   - `getBillingPlans: async (): Promise<BillingPlan[]>`

5. **Hooks** — `useBillingSubscription()` and `useBillingPlans()` in `useSettings.ts`. Query keys: `['billing', 'subscription']`, `['billing', 'plans']`.

6. **Utility** — add `formatBytes(bytes: number): string` helper in `src/modules/settings/utils/` — returns `"4.2 GB"`, `"512 MB"`, etc.

7. **Component** — `src/modules/settings/components/PlanPanel.tsx`:
   - `'use client'`
   - Uses `useBillingSubscription()` and `useBillingPlans()` in parallel (`Promise.all` — both are independent)
   - Progress bar component (inline, reusable within this file): `<ProgressBar value={pct} />` using a plain `<div>` with width style — no external dependency
   - `formatDate(iso)` for renewal date using `date-fns format`
   - Plan card grid: `grid grid-cols-1 md:grid-cols-3 gap-4`
   - Enterprise card: `price === null` → show "Custom pricing" + "Contact sales" button
   - [Manage seats] and [Upgrade] → `toast.info('Contact your account manager to change your plan.')`
   - All four component states (loading: skeleton matching card layout; error: retry; empty: unlikely but handle; success: full UI)

8. **Page** — replace Phase2Panel in `src/app/(dashboard)/settings/billing-plan/page.tsx`.

9. **Nav badge** — remove `phase2: true` from "Plan" nav item in `SettingsNav.tsx`.

**Files to create:** `src/mocks/handlers/billing.ts`, `src/modules/settings/components/PlanPanel.tsx`, `src/modules/settings/utils/formatBytes.ts`
**Files to modify:** `src/mocks/handlers/index.ts`, `settings.types.ts`, `settings.api.ts`, `useSettings.ts`, `src/app/(dashboard)/settings/billing-plan/page.tsx`, `SettingsNav.tsx`

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → `/settings/billing-plan` → verify current plan card, usage bars, plan comparison grid → Upgrade button shows toast.

**Commit:** `feat(settings): plan & subscription panel — current plan, usage, plan comparison`

**STOP.** Wait for "next".

---

## STEP 72 — Settings: Invoices panel

**Goal:** Replace the Phase2Panel placeholder at `/settings/billing-invoices` with a
functional invoice list — paginated table with status badges, PDF download, and CSV export.
SUPER_ADMIN only. Extends `billing.ts` MSW handler (created in Step 71).

**Read first:** `docs/phase2api.md §8.2`.

**Acceptance criteria:**

- [ ] `SettingsNav` item "Invoices" in Billing group: `phase2: true` badge **removed**
- [ ] **Header row**: title "Invoices" + `[Export CSV]` button (right, SUPER_ADMIN only)
- [ ] **Table columns**: Invoice # (mono font) · Description · Date · Amount (right-aligned, formatted `₹999`) · Status · Download
- [ ] **Status badges**: `Paid` (success/green) · `Pending` (warning/yellow) · `Failed` (danger/red) · `Void` (muted)
- [ ] **Download column**: `[PDF ↓]` button — opens `downloadUrl` in a new tab (`window.open(url, '_blank')`); disabled + tooltip `"Not available"` when `downloadUrl === '#'` (MSW) or status is `void`
- [ ] **Export CSV** button: triggers a browser download of a CSV generated client-side from the full invoice list (all pages pre-fetched or first page); filename `invoices-<YYYY-MM-DD>.csv`; columns: Invoice#, Description, Date, Amount, Status
- [ ] Pagination (20 per page, standard prev/next controls)
- [ ] **Empty state**: title "No invoices yet" description "Your first invoice will appear after the first billing cycle." (no action button)
- [ ] Loading skeleton (5 table row skeletons); error state with retry

**Build:**

1. **MSW handler** — add to `src/mocks/handlers/billing.ts`:
   - `GET /billing/invoices` → return 5 mock invoices with statuses: `paid, paid, paid, paid, pending`; newest first; pagination `{ page:1, limit:20, total:5, totalPages:1 }`
   - Each invoice's `downloadUrl` set to `"#"` (MSW limitation)

2. **Types** — add to `settings.types.ts`:

   ```ts
   export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'void';

   export interface Invoice {
     id: string;
     number: string;
     description: string;
     date: string;
     dueDate: string;
     period: { start: string; end: string };
     amount: number;
     currency: string;
     status: InvoiceStatus;
     downloadUrl: string;
   }

   export interface InvoicesResponse {
     invoices: Invoice[];
     pagination: { page: number; limit: number; total: number; totalPages: number };
   }
   ```

3. **Service** — add `getInvoices(params: { page?: number; limit?: number }): Promise<InvoicesResponse>` to `settings.api.ts`.

4. **Hooks** — `useInvoices(page: number)` in `useSettings.ts`. Query key: `['billing', 'invoices', page]`. `keepPreviousData: true` for smooth pagination.

5. **Component** — `src/modules/settings/components/InvoicesPanel.tsx`:
   - `'use client'`
   - Pagination state: `useState<number>(1)`
   - `INVOICE_STATUS_BADGE` map: `{ paid: 'success', pending: 'warning', failed: 'destructive', void: 'secondary' }` — maps to `<Badge variant=...>` or colored `<span>`
   - Currency formatter: `new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })` — renders `₹999`
   - Date formatter: `format(parseISO(date), 'd MMM yyyy')` from `date-fns`
   - CSV export: build string in-memory from `invoices` array; `URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))` → create anchor → click → revoke URL; no server round-trip
   - Download button: `<a href={invoice.downloadUrl} target="_blank" rel="noopener noreferrer">` wrapped in `<Button variant="ghost" size="sm">`; disabled if `downloadUrl === '#'` or `status === 'void'`
   - All four component states

6. **Page** — replace Phase2Panel in `src/app/(dashboard)/settings/billing-invoices/page.tsx`.

7. **Nav badge** — remove `phase2: true` from "Invoices" nav item in `SettingsNav.tsx`.

**Files to create:** `src/modules/settings/components/InvoicesPanel.tsx`
**Files to modify:** `src/mocks/handlers/billing.ts`, `settings.types.ts`, `settings.api.ts`, `useSettings.ts`, `src/app/(dashboard)/settings/billing-invoices/page.tsx`, `SettingsNav.tsx`

**Test Gate:**

```bash
pnpm typecheck
pnpm lint
```

Plus `pnpm dev` → `/settings/billing-invoices` → verify table rows, status badges, pagination controls → Export CSV → file downloads → PDF button disabled (MSW `#` URL).

**Commit:** `feat(settings): invoices panel — invoice table, status badges, CSV export`

**STOP.** Wait for "next".
