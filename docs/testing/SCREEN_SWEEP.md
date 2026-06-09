# EMS Frontend — Screen-by-Screen QA Sweep

> **Single source of truth for this initiative.** If you are a new session, read this
> file top to bottom before doing anything. §4 (Progress) tells you exactly where to
> pick up. §5 (Cross-cutting memory) is the accumulated knowledge that links screens.

_Last updated: 2026-06-10 · Status: **Dashboard swept — clean (0 issues). Next: Employees.**_

---

## 1. Mission

Drive every screen in the sidebar (Dashboard → Settings) **and all of its sub-panels**
through the real app against the **live test backend**, as each role, executing every
form/flow **end-to-end**. Log every error into this doc, then fix them **one by one**
(per-screen cadence). The goal is to flush out silent-failure bugs (forms that submit
nothing, saves that no-op, 500s from missing backend validation, broken states) of the
same class already found and fixed (see §6).

---

## 2. Scope

**In scope — 12 top-level screens, sidebar order:**

1. Dashboard
2. Employees (list + profile tabs + new/edit)
3. Departments
4. Attendance
5. Timesheets
6. Leave
7. Holidays
8. Payroll (runs, run-detail panels, global, migration, my-payslips)
9. Reports (15 report types)
10. Analytics (widgets + range toggles)
11. Permissions (matrix)
12. Settings (~24 sub-panels)

**Out of scope (for now):** Recruitment, Performance, Assets, Announcements (post-Settings
nav items); the **AUDITOR** role (no creds available).

Real unit count is ~80+ testable panels (each report type, profile tab, run-detail panel,
settings panel, drawer counts as its own unit). See each screen's section in §7.

---

## 3. Rules of engagement (agreed)

| Decision                  | Choice                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Roles**                 | SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE. **No AUDITOR.**                                                                                                                                 |
| **Writes**                | **Full end-to-end, incl. irreversible** (test DB). Approve/mark-paid/terminate/delete are all fair game.                                                                                  |
| **Destructive-test data** | Use **throwaway tagged records** (prefix `ZZZ E2E`) for terminate/delete so the **seed role accounts stay intact** (we need aman/priya to keep logging in).                               |
| **Cadence**               | Sweep one screen (all roles) → log all findings here → **fix that screen's issues** (`pnpm typecheck` + `pnpm lint`, commit each) → update §4/§5/§8 → **pause for review** → next screen. |
| **Doc**                   | This file (`docs/testing/SCREEN_SWEEP.md`).                                                                                                                                               |

### Environment & access

- **Live test backend** via BFF. `NEXT_PUBLIC_USE_MOCKS` is **off**.
- Dev server usually already running at `http://localhost:3000` (a 2nd `pnpm dev` just exits — reuse 3000).
- Backend base (for direct API verification): `https://employee-management-system-2b9q.onrender.com/api/v1`
- **Seed creds** (password `Password123!`):
  - `superadmin@acme.test` — SUPER_ADMIN
  - `hr@acme.test` — HR_ADMIN
  - `aman@acme.test` — MANAGER
  - `priya@acme.test` — EMPLOYEE
- **Verify discipline:** trust the **live API**, not docs (`API_MAPPING.md`/`CLAUDE.md` can be stale). Confirm a real response before changing FE code.

### Test method (Playwright)

Playwright is **not** a project dep — resolve from the npx cache via `createRequire`:

```js
import { createRequire } from 'module';
const require = createRequire(
  'C:/Users/mohds/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/_.js',
);
const { chromium } = require('playwright'); // v1.60.0, chromium build 1223 installed
```

Login by driving the form (`input[type=email]` / `input[type=password]` / `button[type=submit]`),
or for API verification log in via `POST /auth/login` and reuse the `set-cookie` in a single
`.mjs` (the Bash sandbox does not persist `/tmp` across calls). Put throwaway probe scripts in
`scripts/` (gitignored/untracked — delete when done; do **not** commit them).

**What to capture per screen, per role:**

- [ ] Console **errors/warnings** + unhandled promise rejections (on load + on interaction)
- [ ] Network **4xx/5xx** — record method, path, response body
- [ ] **Four states** render: loading / empty / error / success
- [ ] **Every form/drawer/dialog submitted** end-to-end — and assert a real network call **actually fired** (the silent-failure catch)
- [ ] **Permission/role gating** correct (right actions shown/hidden/enforced per role)
- [ ] Obvious dark-mode / responsive breakage (light touch)

### Severity legend

- **P0** — blocker: screen unusable, data loss, security, hard crash
- **P1** — major: a primary action silently fails / 500s / wrong data
- **P2** — minor: edge-case failure, missing state, confusing-but-recoverable
- **P3** — cosmetic: styling, copy, dark-mode/responsive nit

---

## 4. Progress (THE resume pointer)

**Current screen:** Dashboard — ✅ done (clean)
**Next action:** run the **Employees** sweep (list + filters + new/edit + profile tabs + Terminate), all roles, then pause for review.

| #   | Screen      | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE | Fixes done | Status      |
| --- | ----------- | ----------- | -------- | ------- | -------- | ---------- | ----------- |
| 1   | Dashboard   | ✅          | ✅       | ✅      | ✅       | 0          | swept+clean |
| 2   | Employees   | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 3   | Departments | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 4   | Attendance  | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 5   | Timesheets  | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 6   | Leave       | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 7   | Holidays    | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 8   | Payroll     | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 9   | Reports     | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 10  | Analytics   | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 11  | Permissions | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |
| 12  | Settings    | ⬜          | ⬜       | ⬜      | ⬜       | —          | not started |

Legend: ⬜ pending · 🔄 in progress · ✅ swept+clean · 🐞 swept, issues open · 🔧 issues fixed

---

## 5. Cross-cutting memory (read before every screen)

Shared engines / components / contracts and the bug **patterns** found so far. When a new
screen uses one of these, check it against this list first.

### Known bug patterns to actively probe on every screen

- **CC-1 · Native number-input `step` silently blocks submit.** A `type="number"` input with a
  fixed `step` (e.g. `step={1000}`) makes the browser reject "round" values via HTML5
  validation; the `:invalid` input blocks the form's submit event **before RHF/Zod run**, so
  the form silently does nothing. _Fix pattern: `step="any"`._ **Audit every numeric input**
  (CTC, amounts, hours, counts, percentages) across DynamicForm and bespoke forms. _(First
  seen: Salary Assignment CTC — fixed, commit `cb01083`.)_
- **CC-2 · Backend coerces `null → ""`/`0` and feeds Prisma without validation.** Sending an
  explicit `null` for an enum/typed field can 500 the endpoint (`prisma.*.create()` invalid
  invocation). _Fix pattern: omit null optional fields in the service request body._ **Watch
  every create/update payload** that sends nullable enum/typed fields. _(First seen: pay-group
  component overrides — fixed, commit `f9d42c9`.)_
- **CC-3 · `/auth/me` returns `400 INVALID_TENANT`, not `401`, when the token is absent/expired.**
  Handled in the axios interceptor (commit `6640cbb`). If any flow mis-detects auth state,
  suspect non-401 auth failures.
- **CC-4 · Immutable salary history.** Once a pay group is assigned to an employee it (and its
  components) can't be DELETEd (`409 GROUP_HAS_EMPLOYEES` / `COMPONENT_IN_USE`) — only marked
  inactive. Plan payroll cleanup accordingly.
- **CC-5 · Backend effective-dating oddities.** Observed salary history with `effectiveTo`
  **before** `effectiveFrom`, and duplicate same-day records. Treat payroll date math with
  suspicion; verify against live.
- **CC-6 · Leave approve/reject/withdraw are `PATCH`, not `POST` (FE is correct; docs stale).**
  `leave.api.ts` uses `PATCH /leave/requests/:id/{approve,reject,withdraw}` and these work live
  (withdraw → 200 verified). `CLAUDE.md §3` lists them as `POST` — that's stale. When testing
  Leave, use PATCH. _(Not a bug — noted so a future session doesn't "fix" the working FE.)_

### Shared engines/components (note which screens depend on each as we go)

- `DynamicTable` — _used by: TBD (Employees, Departments, Payroll runs, Reports tables, …)_
- `DynamicForm` + RHF + Zod — _used by: TBD_
- `FilterEngine`, `ChartEngine` (Recharts: `AreaChart`/`DonutChart`) — _used by: **Dashboard** (HR charts)_
- shadcn `Select` (Base UI — render label not value), `Sheet`/`Dialog`/`Tabs`/`Switch`
- `PageHeader`, `StatsCard`, `SectionCard`, `PermissionWrapper`/`RoleGate`, four-state components
  (`EmptyState`/`ErrorState`/`Skeleton`) — `StatsCard`/`SectionCard`/`PermissionWrapper` used by **Dashboard**
- `NewLeaveRequestDialog` — _used by: **Dashboard** (Employee "Request leave") + Leave screen_ — submit verified 201
- `TodayAttendanceCard` (check-in/out) — _used by: **Dashboard** (Employee) + Attendance screen_ — check-in verified 201
- `PendingApprovalsPanel` / `BulkApproveModal` / `TeamWeeklyAttendanceGrid` — _used by: **Dashboard** (HR/Manager) + Leave/Attendance approvals_

_(Fill the "used by" lists during the sweep so a fix in one engine flags every dependent screen.)_

---

## 6. Already fixed before the sweep (context)

These three were found/fixed leading into this sweep (investigating a stray 400 + the
payroll create-path E2E). All committed to `main`, local:

| Commit    | Fix                                                                             |
| --------- | ------------------------------------------------------------------------------- |
| `6640cbb` | auth: silent-refresh on `400 INVALID_TENANT`, not just 401                      |
| `f9d42c9` | payroll: drop null component overrides in pay-group writes (was 500)            |
| `cb01083` | employees: salary CTC input rejected round values, blocking save (`step="any"`) |

---

## 7. Per-screen findings

> Template per screen — fill during the sweep. Enumerate sub-panels on entry (routes below are
> the starting map; confirm against the live app).

### 1. Dashboard `/dashboard` — ✅ SWEPT, CLEAN (2026-06-10)

- **Sub-units / routing:** `DashboardRouter` picks by role → `HRDashboard` (SUPER_ADMIN + HR_ADMIN),
  `ManagerDashboard` (MANAGER), `EmployeeDashboard` (EMPLOYEE).
- **Tested per role (login → load → all widget endpoints → interactions):**
  - **SUPER_ADMIN / HR_ADMIN** → HRDashboard ("Welcome back, …"). Widgets all 200:
    `/analytics/summary`, `/analytics/attendance?range=30d`, `/analytics/headcount-by-department`,
    `/analytics/recent-activity?limit=8`, `/manager/approvals`. Interactions: range toggles
    **7d/90d** fire `/analytics/attendance?range=…` → 200 ✓; PendingApprovalsPanel renders 20
    approve buttons (approve **action deferred to Leave screen**).
  - **MANAGER** → ManagerDashboard ("My Team"). Widgets 200: `/manager/dashboard`,
    `/manager/approvals`, `/attendance/team/weekly?weekStart=…`. **Bulk-approve modal** opens &
    loads (9 pending pre-selected) ✓ (approve action deferred to Leave screen).
  - **EMPLOYEE** → EmployeeDashboard ("Hi, Priya"). Widgets 200: `/employee/dashboard`,
    `/attendance/today`, `/leave/types`, `/holidays?year=2026`, `/employee/documents`,
    `/employee/team`, `/timesheets?week=…`. Interactions: **Request-leave dialog** submit →
    `POST /leave/requests` **201** ✓; **check-in** → `POST /attendance/check-in` **201** ✓.
- **Findings:** **none — 0 issues.** Loads clean for all 4 roles (no console errors beyond the
  known CC-3 auth-boot 400/401 noise; no API 4xx/5xx). Every interactive control fires its
  network call (no silent failures).
- **Carry-forward notes:**
  - Leave withdraw is **PATCH** not POST (see CC-6) — confirmed live 200 while cleaning up.
  - HR/SUPER_ADMIN PendingApprovalsPanel reads `/manager/approvals` (shared with Manager).
  - **Deferred to later screens:** approve/deny (Leave), bulk-approve (Leave), team weekly grid
    (Attendance) — exercised "open + loaded" here, destructive approve tested on home screens.
  - **Test residue (harmless, test DB):** priya now has a check-in record for today; the test
    leave request was withdrawn (cleaned).

### 2. Employees `/employees`

- **Sub-units:** list (search / department / status filters, pagination, row actions), `/employees/new`,
  `/employees/[id]` profile tabs (Overview, Job, **Compensation**, Documents, Attendance, Leave),
  `/employees/[id]/edit`, Terminate flow.
- **Findings:** _none yet_

### 3. Departments `/departments`

- **Sub-units:** org tree (nested `children[]`), create / edit / delete drawer, move/reparent.
- **Findings:** _none yet_

### 4. Attendance `/attendance`

- **Sub-units:** today / check-in / check-out, records grid (`?month=`), summary, regularization
  (request + approve/deny).
- **Findings:** _none yet_

### 5. Timesheets `/timesheets`

- **Sub-units:** weekly grid (manual entry + **timer**, Zustand), submit week, approvals
  (approve/reject), projects/tasks admin, utilization report, settings panel.
- **Findings:** _none yet_

### 6. Leave `/leave`

- **Sub-units:** requests (create), balances, types, approvals (approve/reject/withdraw),
  team calendar.
- **Findings:** _none yet_

### 7. Holidays `/holidays`

- **Sub-units:** year grid (`?year=`), create / edit / delete, `.ics` import (MSW: preview + commit).
- **Findings:** _none yet_

### 8. Payroll `/payroll`

- **Sub-units:** Runs tab + stats, **InitiateRunDialog** (Regular / Off-cycle / Bonus / Arrears /
  FnF / Reversal), **run-detail** `/payroll/[runId]` (approval chain, variance, audit, events,
  department summary, disbursement, journal, statutory filing, audit pack, payslip drawer,
  adjustments, run inputs, calculate/dry-run/approve/mark-paid/publish/cancel), `/payroll/global`,
  `/payroll/migration` (opening balances, historical payslips, parallel reconcile, go-live, pay
  calendar), `/payroll/my-payslips`.
- **Findings:** _none yet_ (create-path E2E already partly covered — see §6; CC-4/CC-5 apply)

### 9. Reports `/reports`

- **Sub-units (15 report types, each summary + chart + table + export):** Workforce {Headcount,
  Turnover, Demographics}; Attendance {Monthly Summary, Absenteeism Trend}; Leave {Utilization,
  Pending Requests}; Payroll {Summary, CTC Analysis, Salary Register, Statutory Register, Bank
  Advice, Variance Register, Pay Equity}; Timesheets {Utilization}.
- **Findings:** _none yet_

### 10. Analytics `/analytics`

- **Sub-units:** dashboard widgets/charts + range toggles (7d/30d/90d) + any filters.
- **Findings:** _none yet_

### 11. Permissions `/permissions`

- **Sub-units:** roles × permissions matrix, toggle + save.
- **Findings:** _none yet_

### 12. Settings `/settings`

- **Sub-units (~24 panels):** company-profile, branding, locale, working-hours, attendance-rules,
  leave-types, notifications, email-templates, authentication, sessions, audit-log,
  integration-email, integration-storage, integration-webhooks, billing-plan, billing-invoices,
  pay/components, pay/groups, pay/schedules, pay/statutory-packs, pay/legal-entities,
  pay/payslip-template, pay/data-policy, timesheets.
- **Findings:** _none yet_

---

## 8. Issue tracker

All issues across all screens. Fix status drives the per-screen cadence.

| ID  | Screen / panel        | Sev | Summary                                      | Root cause | Status   | Commit |
| --- | --------------------- | --- | -------------------------------------------- | ---------- | -------- | ------ |
| —   | Dashboard (all roles) | —   | **0 issues** — load + all interactions clean | —          | ✅ swept | —      |

---

## 9. Resume prompt (paste into a new session)

```
Resume the EMS frontend screen-by-screen QA sweep. FIRST read
docs/testing/SCREEN_SWEEP.md end to end — it is the source of truth for scope,
rules of engagement, progress, cross-cutting memory, and the issue tracker.
Then continue from the "Next action" pointer in §4.

Cadence: sweep the next screen for ALL roles (superadmin@acme.test,
hr@acme.test, aman@acme.test=MANAGER, priya@acme.test=EMPLOYEE; password
Password123!; no AUDITOR). Drive it with Playwright (resolution path in §3),
capturing console errors, network 4xx/5xx, the four states, and — critically —
assert every form/drawer actually fires a network call on submit (silent-failure
catch). Log every finding into the per-screen section (§7) and the issue tracker
(§8); update the cross-cutting memory (§5) and progress table (§4). Then FIX that
screen's issues (pnpm typecheck + pnpm lint clean, commit each with a
conventional message), tick them off, and PAUSE for my review before the next
screen.

It's a TEST database: full writes incl. irreversible (approve/mark-paid/
terminate/delete) are allowed, but use throwaway "ZZZ E2E" records for
destructive tests so the seed role accounts stay usable. Verify against the LIVE
API, not docs. Throwaway probe scripts go in scripts/ (untracked, delete after).
```
