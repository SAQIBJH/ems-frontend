# EMS Frontend — Screen-by-Screen QA Sweep

> **Single source of truth for this initiative.** If you are a new session, read this
> file top to bottom before doing anything. §4 (Progress) tells you exactly where to
> pick up. §5 (Cross-cutting memory) is the accumulated knowledge that links screens.

_Last updated: 2026-06-10 · Status: **Departments swept — clean (0 issues). Next: Attendance.**_

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

| Decision                  | Choice                                                                                                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Roles**                 | SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE. **No AUDITOR.**                                                                                                                                                                        |
| **Writes**                | **Full end-to-end, incl. irreversible** (test DB). Approve/mark-paid/terminate/delete are all fair game.                                                                                                                         |
| **Destructive-test data** | Use **throwaway tagged records** (prefix `ZZZ E2E`) for terminate/delete so the **seed role accounts stay intact** (we need aman/priya to keep logging in).                                                                      |
| **Cadence**               | Sweep one screen (all roles) → log all findings here → **fix that screen's issues** (`pnpm typecheck` + `pnpm lint`, commit each) → update §4/§5/§8 (+ **§6B** for any backend-side issue) → **pause for review** → next screen. |
| **Doc**                   | This file (`docs/testing/SCREEN_SWEEP.md`).                                                                                                                                                                                      |

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

**Current screen:** Departments — ✅ done (clean)
**Next action:** run the **Attendance** sweep (today/check-in-out, records grid, summary, regularization + approve/deny), all roles, then pause for review.

| #   | Screen      | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE | Fixes done | Status      |
| --- | ----------- | ----------- | -------- | ------- | -------- | ---------- | ----------- |
| 1   | Dashboard   | ✅          | ✅       | ✅      | ✅       | 0          | swept+clean |
| 2   | Employees   | ✅          | ✅       | ✅      | ✅       | 2          | fixed       |
| 3   | Departments | ✅          | ✅       | ✅      | ✅       | 0          | swept+clean |
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
- **CC-7 · API omits array fields the TS type marks as required → `.length`/`.map` crashes.**
  Detail endpoints drop empty collections (e.g. `GET /employees/:id` omits `documents` &
  `leaveBalances` for new employees), but types declared them required arrays → runtime
  `Cannot read properties of undefined (reading 'length')`, caught by the error boundary.
  _Fix pattern: mark the field optional in the type + default `?? []` at every consumer._
  **On every detail/profile screen, create a fresh/empty record and open it** — that's when the
  omitted-array crash surfaces. _(First seen: Employee profile OverviewTab — fixed, commit on `main`.)_
- **CC-8 · Write routes gated only by hiding the button, not the route.** `/employees/new` &
  `/employees/[id]/edit` rendered the full form to MANAGER/EMPLOYEE via direct URL (server
  enforces with 403 on submit, so not a security hole — but bad UX). _Fix pattern: wrap the page
  in the new **`RequirePermission`** guard (`src/shared/guards/RequirePermission.tsx`) which shows
  an access-denied state._ **Check every create/edit/delete route** (Departments, Holidays,
  Settings panels, Payroll, Timesheets, Leave-types, etc.) for the same gap and reuse the guard.

### Shared engines/components (note which screens depend on each as we go)

- `DynamicTable` — _used by: **Employees** (list), Departments, Payroll runs, Reports tables, …_
- `DynamicForm` + RHF + Zod — _used by: **Employees edit** (`EmployeeForm`). NOTE: Employee **create**
  uses a separate 4-step wizard `EmployeeFormStepper` (not DynamicForm) — fields share `#df-<name>` ids._
- `RequirePermission` (NEW, `shared/guards`) — route-level permission guard with access-denied state.
  _used by: **Employees** new/edit. Apply to other write routes (CC-8)._
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

## 6B. 🟠 FOR THE BACKEND TEAM — handoff list

> **Hand this section to the backend developer.** These are issues whose root cause is in the
> **backend**, not this frontend. Where the frontend has a workaround it is noted, but the proper
> fix is backend-side. Keep appending as the sweep continues. (FE-side bugs are tracked in §8.)

| ID   | Endpoint / area                           | Sev | Problem                                                                                                                                                                                                                                       | Expected                                                                                                                                            | Evidence / repro                                                                                                                 | FE workaround?                                                                                                                         |
| ---- | ----------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| BE-1 | `GET /auth/me` (and tenant-scoped routes) | P2  | Returns **`400 INVALID_TENANT`** when the access token is **missing or expired**, instead of `401`. Causes a red console error on **every** page load, and would break silent token-refresh.                                                  | Return **`401 Unauthorized`** for absent/expired/invalid tokens; reserve `400 INVALID_TENANT` for a genuinely bad tenant.                           | `GET /auth/me` with no cookie → `400 {code:INVALID_TENANT}`; with a garbage token → same `400`; with valid cookie → `200`.       | Yes — axios interceptor treats `400 INVALID_TENANT` like `401` (`6640cbb`). Still noisy; please fix server-side.                       |
| BE-2 | `POST` / `PATCH /payroll/groups`          | P1  | **500 `INTERNAL_ERROR`** (`prisma.payGroup.create()` invalid invocation) when a component override is `null` — backend coerces `null → ""`/`0` and feeds it to a Prisma **enum** column **without input validation**.                         | Validate/normalise the request body; accept omitted/`null` override fields and store `NULL`, don't 500.                                             | `POST /payroll/groups` with `components:[{componentId, overrideCalculationType:null,…}]` → 500; with `{componentId}` only → 201. | Yes — FE omits null override fields (`f9d42c9`). Backend still lacks input validation here (likely affects other write endpoints too). |
| BE-3 | `GET /employees/:id` after Terminate      | P3  | A **terminated** (soft-deleted) employee returns **`404 NOT_FOUND`**, so their profile is **inaccessible** — HR cannot view or **reverse** a termination from the UI, despite the dialog promising "can be reversed by an administrator".     | Either keep terminated employees retrievable via `GET /employees/:id`, or expose a documented param (e.g. `?includeTerminated=true`).               | Create → `DELETE /employees/:id` (200, status→TERMINATED) → `GET /employees/:id` → **404**.                                      | None — needs backend.                                                                                                                  |
| BE-4 | Payroll salary history / effective-dating | P2  | Salary history rows come back with **`effectiveTo` _before_ `effectiveFrom`** and **duplicate same-day records** after re-assignments. Suggests effective-dating/overlap handling is off — payroll date math can't be trusted until verified. | Effective ranges should be ordered (`effectiveFrom ≤ effectiveTo`); superseding an assignment should close the prior range correctly without dupes. | Re-assign an employee's pay group on the same day; inspect `GET /payroll/employees/:id/salary` → `history[]`.                    | N/A — observation; verify before relying on payroll figures.                                                                           |

### Contract / docs to update (not code bugs — backend **docs** are stale)

- **Leave actions are `PATCH`, not `POST`.** `PATCH /leave/requests/:id/{approve,reject,withdraw}` is
  what's live and correct; `CLAUDE.md §3` / `BACKEND_API_REQUESTS.md` list them as `POST`. Update the docs.
- (Append other `API_MAPPING.md` / `CLAUDE.md §3` drifts here as the sweep finds them.)

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

### 2. Employees `/employees` — ✅ SWEPT, 2 issues fixed (2026-06-10)

- **Sub-units:** list (search / dept / status filters, pagination, row actions), `/employees/new`
  (4-step wizard `EmployeeFormStepper`: Personal→Job→Documents→Access), `/employees/[id]` profile
  tabs (Overview, Job, **Compensation** [HR only], Documents, Attendance, Leave, Activity),
  `/employees/[id]/edit` (`EmployeeForm`/DynamicForm), Terminate (type-to-confirm).
- **Per role:**
  - **SUPER_ADMIN / HR_ADMIN:** list 20 rows + "Add Employee" ✓. Full write flow exercised:
    create via stepper → **POST /employees 201** ✓; all 7 profile tabs visited; edit →
    **PATCH 200** ✓; terminate → **DELETE 200** ✓.
  - **MANAGER:** sees list, **no "Add" button** (correct). After fix, `/new` + `/[id]/edit` → access-denied ✓.
  - **EMPLOYEE:** sees only own 1 row, no "Add" (correct). After fix, `/new` + `/[id]/edit` → access-denied ✓.
- **Findings (both FIXED):**
  - **EMP-1 (P1):** OverviewTab crashed (`Cannot read properties of undefined (reading 'length')`)
    on a freshly-created employee — `GET /employees/:id` omits `documents`/`leaveBalances`. → CC-7. Fixed.
  - **EMP-2 (P2):** `/employees/new` + `/[id]/edit` not permission-guarded — MANAGER/EMPLOYEE could
    open the form by URL (server enforces 403 on submit). → CC-8. Fixed with `RequirePermission`.
- **Observations (not bugs):**
  - Server **enforces** employee writes: POST/PATCH/DELETE → **403** for MANAGER & EMPLOYEE (verified live).
  - Compensation tab `GET /payroll/employees/:id/salary` → **404** for unassigned employee = expected empty state (handled).
  - **Backend quirk (P3, backend-side):** after Terminate (soft-delete), `GET /employees/:id` → **404**,
    so a terminated employee's profile is **inaccessible** (can't review/reverse from the UI). Worth raising with backend.
- **Carry-forward:** create wizard ≠ edit form (separate components); `RequirePermission` guard now
  exists — apply to other write routes. Terminate-then-404 quirk may affect any "view terminated employee" flow.

### 3. Departments `/departments` — ✅ SWEPT, CLEAN (2026-06-10)

- **Sub-units:** org tree (nested `children[]`, 8 roots), detail panel (sub-teams grid + Members table
  `DepartmentEmployeesTable`), create/edit/add-sub/delete — **all modal-based** (`DepartmentForm` dialog,
  `ConfirmDialog`, reassign-and-delete dialog). **No `/new` or `/edit` routes → CC-8 N/A here.**
- **Per role:**
  - **SUPER_ADMIN / HR_ADMIN:** tree + "Add department" + 8 row action menus. Write flow all fire:
    create root **POST 201**, edit **PATCH 200**, add sub-dept **POST 201**, delete (root, via UI) **DELETE 200** ✓.
  - **MANAGER / EMPLOYEE:** can **view** the tree (8 items) but **"Add" hidden + 0 row menus** (correct
    `PermissionWrapper departments:write` gating). Server also **enforces**: POST/PATCH/DELETE → **403**.
- **Findings:** **none — 0 issues.** No console errors, no API 4xx/5xx for any role.
- **Not exercised:** reassign-and-delete (delete a dept that has employees → move-then-delete dialog) —
  skipped to avoid reassigning real employees; wiring mirrors the verified empty-delete path.
- **Carry-forward:** modal-based CRUD pattern (no routes) — gating via PermissionWrapper + server 403
  is the correct combo; contrast with Employees' route-based forms (which needed CC-8 RequirePermission).

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

| ID    | Screen / panel                | Sev | Summary                                                              | Root cause                                                       | Status     | Commit |
| ----- | ----------------------------- | --- | -------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------- | ------ |
| —     | Dashboard (all roles)         | —   | **0 issues** — load + all interactions clean                         | —                                                                | ✅ swept   | —      |
| EMP-1 | Employees / profile Overview  | P1  | OverviewTab crash on new employee (`undefined.length`)               | API omits `documents`/`leaveBalances`; type said required (CC-7) | ✅ fixed   | `main` |
| EMP-2 | Employees / new + edit routes | P2  | create/edit form shown to MANAGER/EMPLOYEE via URL                   | routes unguarded; only list button gated (CC-8)                  | ✅ fixed   | `main` |
| EMP-3 | Employees / terminate         | P3  | terminated employee `GET /employees/:id` → 404, profile inaccessible | **backend** soft-delete excludes from GET                        | ⏳ backend | —      |
| —     | Departments (all roles)       | —   | **0 issues** — load + gating + create/edit/sub/delete all clean      | —                                                                | ✅ swept   | —      |

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
(§8); add any backend-root-cause issue to the **For-the-backend-team** list (§6B);
update the cross-cutting memory (§5) and progress table (§4). Then FIX that
screen's issues (pnpm typecheck + pnpm lint clean, commit each with a
conventional message), tick them off, and PAUSE for my review before the next
screen.

It's a TEST database: full writes incl. irreversible (approve/mark-paid/
terminate/delete) are allowed, but use throwaway "ZZZ E2E" records for
destructive tests so the seed role accounts stay usable. Verify against the LIVE
API, not docs. Throwaway probe scripts go in scripts/ (untracked, delete after).
```
