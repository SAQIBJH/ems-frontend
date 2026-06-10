# EMS Frontend — Screen-by-Screen QA Sweep

> **Single source of truth for this initiative.** If you are a new session, read this
> file top to bottom before doing anything. §4 (Progress) tells you exactly where to
> pick up. §5 (Cross-cutting memory) is the accumulated knowledge that links screens.

_Last updated: 2026-06-10 · Status: **Settings swept (scoped — Notifications/Integrations/Billing deferred per user). All in-scope panels load clean for HR/SUPER; company-profile + leave-types saves fire (PATCH/POST 200); no CC-1/CC-9/CC-10 in saves. 1 FE fix (SET-1+SET-2 in one: /settings redirected everyone to an HR/SUPER-only panel + panel routes were unguarded → manager/employee hit 403 walls; added a layout SettingsAccessGuard + role-aware redirect, both driven by the nav role config). ALL 12 SWEEP SCREENS DONE.**_

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

**Current screen:** Settings — ✅ done (scoped). In-scope panels swept all roles; SET-1+SET-2 fixed (one
layout guard + role-aware redirect). **The 12-screen sweep is now COMPLETE.**
**Next action:** **Remaining work = the DEFERRED Settings panels only** (user's call, "do it later"):
**Notifications** (in-app prefs), **Integrations** (email / storage / webhooks), **Billing** (plan /
invoices). These are likely **MSW-only → 404 with mocks off** (CLAUDE.md §24) — when picked up, probe each
endpoint first (they may need MSW on, or the backend to ship them). They're already route-gated by the new
`SettingsAccessGuard` (SUPER-only per nav config), so direct-URL access is safe. Otherwise: optional deeper
write-pass on payroll run-detail / migration forms (Payroll §8 "still not driven"), and clear the BE-team
handoff (§6B / §6C) with the backend dev.

| #   | Screen      | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE | Fixes done | Status                                       |
| --- | ----------- | ----------- | -------- | ------- | -------- | ---------- | -------------------------------------------- |
| 1   | Dashboard   | ✅          | ✅       | ✅      | ✅       | 0          | swept+clean                                  |
| 2   | Employees   | ✅          | ✅       | ✅      | ✅       | 2          | fixed                                        |
| 3   | Departments | ✅          | ✅       | ✅      | ✅       | 0          | swept+clean                                  |
| 4   | Attendance  | ✅          | ✅       | ✅      | ✅       | 1          | fixed                                        |
| 5   | Timesheets  | ✅          | ✅       | ✅      | ✅       | 2          | fixed                                        |
| 6   | Leave       | 🐞          | ✅       | ✅      | ✅       | 1          | fixed (1 BE open)                            |
| 7   | Holidays    | ✅          | ✅       | ✅      | ✅       | 1          | fixed                                        |
| 8   | Payroll     | ✅          | ✅       | ✅      | ✅       | 4          | fixed (writes: deep pass deferred)           |
| 9   | Reports     | ✅          | ✅       | ✅      | ✅       | 1          | fixed (1 BE open)                            |
| 10  | Analytics   | ✅          | ✅       | ✅      | ✅       | 2          | fixed                                        |
| 11  | Permissions | ✅          | ✅       | ✅      | ✅       | 2          | fixed (2 BE open)                            |
| 12  | Settings    | ✅          | ✅       | ✅      | ✅       | 1          | fixed (scoped: Notif/Integ/Billing deferred) |

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
- **CC-9 · Service sends the wrong field name → 400 (required) or silently dropped (optional).**
  The FE sent `{ comment }` to regularization approve/deny, but the backend field is
  **`reviewerComment`** — **deny** (where it's required) 400'd every time = fully broken; **approve**
  (optional) silently dropped the note. _Fix pattern: match the live request body field names exactly._
  **For every write, diff the FE request body keys against a real successful request** — don't trust
  the FE's own naming. _(First seen: attendance regularization approve/deny — fixed, commit on `main`.
  **Seen again: Leave approve/reject** — FE sent `comment`, backend requires **`approverComment`**;
  reject 400'd every time (required field) = fully broken, approve silently dropped the note. Fixed,
  verified live 200 + the reason persists on a follow-up GET.)_ **This is now the #1 recurring bug
  class — the `approverComment` vs `comment` split specifically.** On any approve/reject/deny/review
  write, POST a real request and confirm the field name **and** that the value persists (the
  approve/reject _response_ may omit `approverComment` even when it saved — check via a follow-up GET).
- **CC-10 · Bodyless `apiClient.post(url)` 400s against the LIVE backend.** The axios client
  defaults `Content-Type: application/json` (`api-client.ts`), so a POST with **no body** still
  sends that header with an empty payload — backend routes that JSON-parse a required body then
  choke on `""` → **400 with an empty response body** (the empty body is the tell it's a real-backend
  passthrough, not MSW, which always returns JSON). This was **invisible while the endpoint was
  MSW-backed** (MSW ignores the empty body) and only appeared once the backend went live.
  _Fix pattern: pass an explicit `{}` as the body for action POSTs._ **Audit every bodyless
  `apiClient.post(`…`)`/`.patch(`…`)` for endpoints that are (or are about to go) live.** Known
  remaining candidates to verify when their screens are swept: **`POST /payroll/runs/:id/inputs/from-timesheets`**
  (`payroll-runs.api.ts:208`, bodyless — same risk) and **`PATCH /notifications/:id/read`**
  (`notifications.api.ts`, bodyless — unverified). Auth `logout`/`refresh`/`logout-all` and
  `PATCH /leave/requests/:id/withdraw` are also bodyless but **verified to tolerate** an empty body
  live (200). _(First seen: timesheet **submit-week** — POST `/timesheets/:id/submit` 400'd every
  time; fixed by sending `{}`, verified 200.)_ _(Seen again: payroll **`POST /payroll/runs/:id/inputs/from-timesheets`**
  — bodyless → 400 `VALIDATION_ERROR {field:"unknown","must be object"}`; with `{}` → 200. Fixed. PR-1.)_
  - **Same default-header trap bites FILE UPLOADS.** A `FormData` (multipart) upload posted through the
    shared client carries the default `Content-Type: application/json`, so the browser never sets
    `multipart/form-data; boundary=…` → backend rejects it (**406 `FST_INVALID_MULTIPART_CONTENT_TYPE`**).
    _Fix pattern: pass `headers: { 'Content-Type': undefined }` on the upload request so the browser sets
    the boundaried multipart header._ **Audit every `FormData`/file POST** (`.ics` import, employee
    document upload/presign, avatar, payroll imports). _(Seen: Holidays **.ics import** — fully broken,
    406; fixed + verified end-to-end start 202 → preview 200 → commit 200. HD-1.)_
- **CC-11 · `const { data: x = [] } = useQuery(...)` as a `useEffect` dep → infinite render loop.**
  When a query's `data` is `undefined` (loading/disabled), the `= []` default mints a **new array
  every render**; using it as a `useEffect` dependency makes the effect re-run each render, and if the
  effect calls `setState`/`setValue`/`setDraft` **unconditionally** it re-renders → new `[]` → loops
  until React throws **"Maximum update depth exceeded"** (caught by the error boundary → whole screen
  crashes). _Fix pattern: `const x = useMemo(() => data ?? [], [data])` for a stable ref, **and** guard
  the effect's writes to only fire when the value actually changed (and only act on the array once
  `data` is defined, so a loading `[]` doesn't wipe valid state)._ **Grep every module for
  `data: <name> = []`/`= {}` that feeds a `useEffect`/`useMemo` dep array.** _(First seen: timesheet
  `TimerBar` + `TimeEntryDialog` — `useTasks` tasks array; crashed on project-select / timer-restore. Fixed.)_
- **CC-8 · Write routes gated only by hiding the button, not the route.** `/employees/new` &
  `/employees/[id]/edit` rendered the full form to MANAGER/EMPLOYEE via direct URL (server
  enforces with 403 on submit, so not a security hole — but bad UX). _Fix pattern: wrap the page
  in the new **`RequirePermission`** guard (`src/shared/guards/RequirePermission.tsx`) which shows
  an access-denied state._ **Check every create/edit/delete route** (Departments, Holidays,
  Settings panels, Payroll, Timesheets, Leave-types, etc.) for the same gap and reuse the guard.
- **CC-12 · HR-only data screen with NO role guard → wall of 403s for non-HR roles.** A whole-screen
  dashboard whose every widget hits an HR/SUPER-only endpoint, but the **route/page itself isn't gated**
  and the **nav item isn't role-filtered** (`NAV_ITEMS` in `AppShell.tsx` shows every item to every role).
  A MANAGER/EMPLOYEE clicks it and fires N HR-only endpoints that all **403** — ×3 React Query retries =
  **dozens of failed requests + console errors**, the page a grid of "Failed to load" error states.
  _Fix pattern: wrap the route page in `RoleGate roles={[...]}` with an `ErrorState` fallback (the
  `permissions/page.tsx` pattern) — gated roles then fire **zero** calls and see a clean access-denied._
  **Audit every read-only HR/admin screen** (Analytics done; check Settings sub-panels, any future
  admin-only dashboard). _(First seen: Payroll `/payroll/global` — PR-4, but that one **redirects** rather
  than gates. Seen again: **Analytics `/analytics`** — manager/employee fired 9 endpoints ×3 = 17–27 403s;
  fixed with RoleGate → 0 calls. AN-1.)_ Contrast: **Payroll screens redirect** self-service to
  `/my-payslips`; **Reports/Permissions/Analytics show an access-denied state** — both are acceptable, pick
  per screen (redirect when there's a self-service home; access-denied when there isn't).
- **CC-13 · Decorative filter control that drives no query (silent no-op).** A filter (Select, date range,
  toggle) is rendered and its state updates on change, but that state is **never read by any query** — so
  using the control **fires no network call and changes nothing on screen**. Looks functional, does nothing
  — the silent-failure class this sweep hunts, applied to filters not forms. _Detection: in the browser,
  change the control and assert a refetch actually fires; in code, grep the state var — if it's only in the
  control's own `value`/`onChange` and never in a `queryKey`/`params`, it's dead._ _Fix: either wire it
  through the consuming queries, or remove it so the UI is honest._ _(First seen: **Analytics** top filter
  bar — the **Department Select** and **Custom date range** (`from`/`to`) updated state but no analytics hook
  consumed `departmentId`/`from`/`to`; only the 7d/30d/90d preset worked, and only for the attendance chart.
  **AN-2 — FIXED by wiring** (your call: keep the controls): threaded an optional `AnalyticsFilters`
  `{ departmentId, range, from, to }` through all 9 analytics endpoints; verified the dept-select refetches
  all 9 with `departmentId` (200) and custom range sends `from`/`to` to the short-window widgets (200). The
  **backend currently ignores** these params (returns the unfiltered result) — the filter contract is handed
  off in `docs/BACKEND_API_REQUESTS.md`; data filters with no FE change once the backend honours them. So
  "wire it" is a valid fix even when the backend hasn't implemented filtering yet — the control becomes
  honest immediately (it refetches) and gains data later.)_
- **CC-14 · "Save" that writes the React Query cache but never calls the API (optimistic-only no-op).** A
  mutation handler updates local state via `queryClient.setQueryData(...)` and pops a success toast, but for
  some branch **never issues the network write** — so the change looks saved and **vanishes on the next
  refetch/refresh**. The tell: a code path that `setQueryData`s instead of `mutateAsync`/`apiClient.*`, often
  justified by a stale "this isn't live yet / MSW-only" assumption. _Detection: for every Save, assert a real
  PATCH/POST fires (not just a toast); in code, grep mutation success handlers for `setQueryData` with **no**
  accompanying API call._ _Fix: issue the real write; only keep an optimistic cache update **alongside** it._
  **Audit every Save/mutation for a branch that skips the API** (settings panels, matrices, bulk editors).
  _(First seen: **Permissions** `handleConfirmSave` — built-in roles were PATCHed but **custom roles were
  saved to the cache only** (no API call), so custom-role permission edits vanished on refresh; the backend
  PATCH **does** accept custom keys (verified 200). Fixed: PATCH all non-SUPER_ADMIN roles. PERM-2.)_
- **CC-9 extension · A create/write endpoint silently DROPS a field it accepts in the body.** Beyond wrong
  field **names** (CC-9), an endpoint can accept the right-named field and **ignore it** — no error, the value
  just isn't persisted. _Detection: after any create/update, GET the record back and diff **every** field you
  sent against what persisted (don't trust the write's own 2xx response — it may echo nothing)._ _(Seen:
  **Permissions** `POST /settings/roles` accepts `permissions` but creates the role with `[]` — the perms the
  user selected are dropped. PERM-1 / BE-10. **Resolution: left to the backend** (user's call — no FE
  workaround); a follow-up-PATCH workaround was prototyped then backed out. The FE still **sends** the field so
  it works once the backend persists it.)_

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
- `PendingApprovalsPanel` / `BulkApproveModal` / `TeamWeeklyAttendanceGrid` — _used by: **Dashboard** (HR/Manager) + Leave/Attendance approvals_ — **regularization approve/deny lives ONLY here** (no approval UI on the Attendance page)
- `RegularizationDialog` / `CheckInOutCard` / `AttendanceCalendar` / `AttendanceTableView` — _used by: **Attendance** page_ (CheckInOutCard also on Dashboard)
- `TimerBar` / `WeeklyGrid` / `TimeEntryDialog` / `TimesheetSubmitBar` / `ApprovalsTab` / `ProjectsPanel`+`ProjectDrawer` — _used by: **Timesheets** page only._ TimerBar timer state is the module's only Zustand slice (`store/timer.slice.ts`, sessionStorage-persisted, survives refresh). `useTasks` (`hooks/useProjects.ts`) feeds both TimerBar & TimeEntryDialog — the CC-11 loop source.
- `LeaveRequestsTable` / `LeaveApprovalsTable` (+ Deny/Bulk dialogs) / `LeaveTeamCalendar` / `NewLeaveRequestDialog` — _used by: **Leave** page._ Approve/reject go through `leave.api.ts` → backend wants **`approverComment`** (LV-1/CC-9). Team views (`useTeamLeaveRequests`/`useTeamLeaveCalendar`) are employee-scoped → 400 for profile-less SUPER_ADMIN (LV-2); the calendar query is `enabled` only for MANAGER/HR/SUPER (employee never fetches it).
- `HolidayScreen` / `HolidayFormDialog` / `IcsImportDialog` / `MonthDetailModal` — _used by: **Holidays** page._ Modal CRUD gated by `canManage` (HR/SUPER) + server 403. `IcsImportDialog` → `holidaysApi.startImport` is a **multipart upload** → must send `Content-Type: undefined` (HD-1/CC-10 upload sub-case), else 406. The MSW `/holidays/import*` handler is **dead** (mocks off).
- `ReportShell` / `ReportsNav` / 15 lazy report panels / `ChartEngine` — _used by: **Reports** page._ All 15 GETs live (200); HR/SUPER only (manager/employee → access-denied + 403). `useExportReport` (`hooks/useWorkforceReports.ts`) drives the **secure async server-export** (RP-1: request job → poll `GET /reports/export/:jobId/download` → download the server file; never client-built CSV). 4 register panels export via the separate `payrollRunsApi.exportRegister` blob path.
- `AnalyticsPage` (single screen) — _used by: **Analytics** page._ Reuses the **dashboard** analytics hooks (`useAnalyticsSummary`/`useAttendanceAnalytics`/`useHeadcountByDepartment`/`useLeaveSummaryAnalytics`/`useRecentActivity`) + 4 analytics-module hooks. All hooks now take an optional `AnalyticsFilters` (AN-2) — **keep params optional** so the Dashboard (which passes none) is unaffected. Route gated by `RoleGate` HR/SUPER (AN-1, CC-12).
- `SettingsAccessGuard` (NEW, `modules/settings/components`) — _used by: **Settings** `layout.tsx`._ Route-level
  config-driven gate: looks up the current `/settings/<slug>` path's allowed roles in `NAV_GROUPS` (the same
  source that hides nav items) via `settingsPanelRoles()` and renders a clean access-denied before the panel
  (and its queries) mount. Reusable CC-12 pattern for any nav-hidden-but-route-reachable multi-panel screen.
  Pairs with `firstAccessibleSettingsPath(role)` (the `/settings` redirect target). SET-1/SET-2.
- `PermissionsMatrix` / `AddRoleDialog` — _used by: **Permissions** page only._ Route gated `RoleGate roles={['SUPER_ADMIN']}` (server also 403s GET for non-super). `GET/PATCH /settings/roles-permissions` + `POST/DELETE /settings/roles` all **live**. PATCH persists **built-in AND custom** role keys (PERM-2). `POST /settings/roles` **drops `permissions`** (BE-10) → left to the backend (no FE workaround); FE still sends the field, set perms via the matrix + Save meanwhile (PERM-1). GET **omits created roles from `customRoles[]`** → `isCustom` is derived from the built-in label set, not the server array (PERM-3/BE-11). `SUPER_ADMIN` column locked in UI + backend `CANNOT_LOCK_OUT_SUPER_ADMIN` (403).

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
>
> **📤 A clean, self-contained, prioritised version of this list (ready to send to the backend dev)
> lives at `docs/BACKEND_TEAM_HANDOFF.md`** — keep it in sync when BE-rows change.
>
> **✅ UPDATE 2026-06-10 — backend shipped fixes; live-verified.** The backend team returned
> `docs/BACKEND_TEAM_HANDOFF_FIX_REPORT.md`. We re-verified every item against the **live** API:
> **BE-2…BE-11 + analytics filters = FIXED ✅** (BE-9 reports export now works end-to-end; custom roles
> fully work). **BE-1 = PARTIAL ⚠️** — a decodable-but-invalid JWT now 401s, but **no-cookie / garbage
> token still return `400 INVALID_TENANT`** (the common expired-cookie case), so **keep the FE workaround**.
> Full evidence + the now-unblocked FE follow-ups (BE-7 relax Cancel gate, BE-8 un-gate payslip template):
> **`docs/BACKEND_FIX_VERIFICATION.md`**.

| ID    | Endpoint / area                                        | Sev | Problem                                                                                                                                                                                                                                                                                                                                                                                                                 | Expected                                                                                                                                                                                                                      | Evidence / repro                                                                                                                                                                           | FE workaround?                                                                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-1  | `GET /auth/me` (and tenant-scoped routes)              | P2  | Returns **`400 INVALID_TENANT`** when the access token is **missing or expired**, instead of `401`. Causes a red console error on **every** page load, and would break silent token-refresh.                                                                                                                                                                                                                            | Return **`401 Unauthorized`** for absent/expired/invalid tokens; reserve `400 INVALID_TENANT` for a genuinely bad tenant.                                                                                                     | `GET /auth/me` with no cookie → `400 {code:INVALID_TENANT}`; with a garbage token → same `400`; with valid cookie → `200`.                                                                 | Yes — axios interceptor treats `400 INVALID_TENANT` like `401` (`6640cbb`). Still noisy; please fix server-side.                                                                                                                                                             |
| BE-2  | `POST` / `PATCH /payroll/groups`                       | P1  | **500 `INTERNAL_ERROR`** (`prisma.payGroup.create()` invalid invocation) when a component override is `null` — backend coerces `null → ""`/`0` and feeds it to a Prisma **enum** column **without input validation**.                                                                                                                                                                                                   | Validate/normalise the request body; accept omitted/`null` override fields and store `NULL`, don't 500.                                                                                                                       | `POST /payroll/groups` with `components:[{componentId, overrideCalculationType:null,…}]` → 500; with `{componentId}` only → 201.                                                           | Yes — FE omits null override fields (`f9d42c9`). Backend still lacks input validation here (likely affects other write endpoints too).                                                                                                                                       |
| BE-3  | `GET /employees/:id` after Terminate                   | P3  | A **terminated** (soft-deleted) employee returns **`404 NOT_FOUND`**, so their profile is **inaccessible** — HR cannot view or **reverse** a termination from the UI, despite the dialog promising "can be reversed by an administrator".                                                                                                                                                                               | Either keep terminated employees retrievable via `GET /employees/:id`, or expose a documented param (e.g. `?includeTerminated=true`).                                                                                         | Create → `DELETE /employees/:id` (200, status→TERMINATED) → `GET /employees/:id` → **404**.                                                                                                | None — needs backend.                                                                                                                                                                                                                                                        |
| BE-4  | Payroll salary history / effective-dating              | P2  | Salary history rows come back with **`effectiveTo` _before_ `effectiveFrom`** and **duplicate same-day records** after re-assignments. Suggests effective-dating/overlap handling is off — payroll date math can't be trusted until verified.                                                                                                                                                                           | Effective ranges should be ordered (`effectiveFrom ≤ effectiveTo`); superseding an assignment should close the prior range correctly without dupes.                                                                           | Re-assign an employee's pay group on the same day; inspect `GET /payroll/employees/:id/salary` → `history[]`.                                                                              | N/A — observation; verify before relying on payroll figures.                                                                                                                                                                                                                 |
| BE-5  | `GET /leave/team/requests`, `GET /leave/team/calendar` | P2  | Return **`400 NO_EMPLOYEE_ID`** ("User does not have an employee profile") for **SUPER_ADMIN**, because these endpoints are employee-scoped and super_admin has **no** employee profile (`employeeId: null`). So super_admin's Leave **Approvals + Team Calendar** tabs show an error state. **Inconsistent**: `GET /manager/approvals` **does** work for super_admin (200).                                            | Support a profile-less SUPER_ADMIN on the team endpoints (return all/empty like `/manager/approvals`), **or** confirm super_admin isn't meant to use them (then the FE will hide the tabs).                                   | As super_admin: `GET /leave/team/requests` → `400 {code:NO_EMPLOYEE_ID}`; `GET /leave/team/calendar` → same. As HR/MANAGER (have a profile) → 200.                                         | Partial — error state renders (no crash). FE could hide team tabs for users without an `employeeId`, pending the product call (LV-2).                                                                                                                                        |
| BE-6  | `PATCH /leave/requests/:id/{approve,reject}` response  | P3  | The approve/reject **response body omits `approverComment`** even when the value was accepted and **persisted** (a follow-up `GET /leave/requests` shows it). Misleading — looks like the comment was dropped.                                                                                                                                                                                                          | Echo the saved `approverComment` in the approve/reject response, matching the `LeaveRequest` shape returned by `GET`.                                                                                                         | Reject with `{approverComment:"X"}` → 200, response `approverComment: undefined`; then `GET /leave/requests` → `approverComment: "X"`.                                                     | N/A — cosmetic/response-shape; the write itself works (LV-1 fixed).                                                                                                                                                                                                          |
| BE-7  | `POST /payroll/runs/:id/cancel`                        | P2  | Requires **SUPER_ADMIN** while the rest of the run lifecycle (initiate/approve/mark-paid/publish) is allowed for **HR_ADMIN**. The FE shows HR a "Cancel Run" button (dialog defaults reason to "Cancelled by HR") → HR gets **403**. FE intent ≠ backend rule.                                                                                                                                                         | Decide the intended role: if HR may cancel before approval, relax to HR_ADMIN; else confirm super_admin-only so the FE gates to match.                                                                                        | As HR: `POST /payroll/runs/:id/cancel {reason}` → `403 {requiredRoles:["SUPER_ADMIN"], userRole:"HR_ADMIN"}`.                                                                              | Pending decision (PR-2); FE could gate Cancel to super_admin.                                                                                                                                                                                                                |
| BE-8  | `GET /payroll/payslip-templates`                       | P3  | HR-only, but the **self-service my-payslips** page (PayslipDrawer) needs the template to render an employee's own payslip → **403** for MANAGER/EMPLOYEE, fired ×2 per load. Page still renders (handled).                                                                                                                                                                                                              | Expose a read-only payslip template to self-service users (or a dedicated `…/self` endpoint) so payslips render with the configured layout.                                                                                   | As priya/aman on `/payroll/my-payslips`: 2× `GET /payroll/payslip-templates` → 403.                                                                                                        | Pending decision (PR-3); FE could skip/guard the fetch for self-service.                                                                                                                                                                                                     |
| BE-9  | `POST /reports/export` async job + download            | P1  | The export endpoint went **async** — returns `202 {jobId, status:"PENDING", message:"Use /export/:job_id/download once ready."}` — but the promised **download/status routes don't exist**: `GET /reports/export/:jobId/download`, `…/:jobId`, `…/:jobId/status`, and top-level `/export/:jobId/*` **all 404**. So an export can be queued but **never retrieved** — the feature is half-built and unusable end-to-end. | Implement the job **status** + **download** endpoints (return the generated CSV as `text/csv` once `status` is ready). The FE already polls `GET /reports/export/:jobId/download` and will work the moment it returns a file. | HR: `POST /reports/export {reportType,format:"CSV"}` → 202 `{jobId}`; then `GET /reports/export/:jobId/download` → **404** (and every status-path variant → 404).                          | FE made safe (RP-1): no longer downloads the 202 stub / fakes success; shows "being prepared" and downloads only a real server file once available. **Needs the backend download route to function.**                                                                        |
| BE-10 | `POST /settings/roles`                                 | P2  | **Silently drops the `permissions` field.** The create body includes `{name, key, permissions[]}` and returns `201`, but the role is created with **`[]` permissions** (the selected perms are ignored); the `201` response body also **omits `permissions`**. So a custom role created with perms ends up with none.                                                                                                   | Persist the `permissions[]` sent on create (and echo them in the response), so a role is created with its intended access in one call.                                                                                        | Super: `POST /settings/roles {name,key,permissions:["employees:read","leave:approve"]}` → `201` (no `permissions` in body); `GET /settings/roles-permissions` → `matrix[key]` is **`[]`**. | **No (by the team's choice)** — a follow-up-`PATCH` workaround was prototyped then **backed out**; the proper fix is backend-side. The FE still **sends** `permissions` in the POST (works once you persist it); meanwhile users grant access via the matrix + Save. PERM-1. |
| BE-11 | `GET /settings/roles-permissions`                      | P3  | **Omits created custom roles from `customRoles[]`.** After `POST /settings/roles`, the new key appears in `data.roles[]` and `data.matrix`, but `data.customRoles` is **`undefined`/empty** — so the FE can't tell it's custom (no friendly name, and naïvely no Delete button / Custom badge).                                                                                                                         | Return every non-built-in role in `customRoles[] = [{key, name}]` so custom roles render with their name + delete affordance after a refresh.                                                                                 | Create a role → `GET` → `roles` includes the key but `customRoles` is `undefined`; `matrix[key]` is present.                                                                               | Yes — FE derives `isCustom` from the built-in label set (not `customRoles[]`), so the Delete button/badge survive; the **friendly name** still degrades to the raw key after a refresh until the backend returns `customRoles[]`. PERM-3.                                    |

### Contract / docs to update (not code bugs — backend **docs** are stale)

- **Leave actions are `PATCH`, not `POST`.** `PATCH /leave/requests/:id/{approve,reject,withdraw}` is
  what's live and correct; `CLAUDE.md §3` / `BACKEND_API_REQUESTS.md` list them as `POST`. Update the docs.
- **Timesheets are LIVE on the backend now (CLAUDE.md §27 says "MSW-backed" — stale).** `GET /timesheets`,
  `/timesheets/entries`, `/timesheets/:id/{submit,approve,reject}`, `/timesheets/approvals`,
  `/timesheets/projects(/:id/tasks)`, `/timesheets/settings`, `/timesheets/summary` all answer from the
  real backend (verified 2026-06-10). Move timesheets from "what still needs MSW" to the live list.
- **`POST /timesheets/:id/submit` 400s on an empty body (minor backend inconsistency).** Other action
  routes (`/auth/logout`, `PATCH …/withdraw`) tolerate an empty body and return 200; `submit` requires
  a non-empty JSON body or it 400s. FE now always sends `{}` (TS-2 fix), but consider making action
  endpoints tolerate empty bodies for consistency.
- **Custom-role endpoints are LIVE (`POST /settings/roles`, `DELETE /settings/roles/:key`).** The FE
  service comments said "MSW (not yet live)" — stale; both verified live 2026-06-10 (`201`; `200 {key,
status:"deleted"}`). Comments fixed; `CLAUDE.md §3` already lists them as shipped 2026-05-26.
- **Analytics filter params** (`departmentId`, `from`/`to`) are now sent by the FE to the live analytics
  endpoints (Analytics screen filter bar). The backend currently **accepts + ignores** them — see the new
  "Analytics filter parameters" section in `BACKEND_API_REQUESTS.md` for the contract to implement.
- (Append other `API_MAPPING.md` / `CLAUDE.md §3` drifts here as the sweep finds them.)

---

## 6C. 🔁 When the backend ships a fix — FE follow-up actions (remove / revisit)

> **The mirror image of §6B.** Some FE changes in this sweep exist **only because the backend
> behaves a certain way**. When the backend fix lands, the FE must be revisited. This table is the
> single checklist so nothing is left stranded. **Action types:**
>
> - **REMOVE** — delete the FE workaround; it's pure compensation for a backend bug.
> - **REVISIT** — a product/gating decision that the FE will need to re-align once the backend confirms intent.
> - **AUTO** — **no FE code change**; the feature starts working the moment the backend ships (the FE is already correct/forward-compatible). Listed so nobody mistakes it for broken FE or "fixes" it.
> - **KEEP** — the FE change is correct permanently; leave it even after the backend fix.

| When backend ships…                                                                                                         | FE location                                                                                                      | Action                         | What to do                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BE-1** — `/auth/me` returns **401** (not `400 INVALID_TENANT`) for absent/expired tokens                                  | `src/lib/api-client.ts` (401 interceptor) — commit `6640cbb`                                                     | **REMOVE** (optional)          | Delete the `400 INVALID_TENANT`→treat-as-401 special-case once the backend reliably 401s. Harmless to keep, but it's dead once BE-1 is fixed. Verify with a no-cookie `/auth/me` returning 401 before removing.                                     |
| **BE-2** — `POST/PATCH /payroll/groups` validates input (no 500 on `null` override)                                         | `src/modules/payroll/services/pay-groups.api.ts` — commit `f9d42c9`                                              | **KEEP** (or optional REVISIT) | Omitting null override fields is fine to keep (defensive). Only revisit if you ever need to send an explicit `null` to clear an override — then confirm the backend stores `NULL` instead of 500ing.                                                |
| **BE-7** — backend confirms who may **cancel a payroll run** (HR vs SUPER_ADMIN)                                            | `src/modules/payroll/hooks/usePayrollPermissions.ts` (`canCancel`), used by `PayrollRunDetail.tsx` (PR-2)        | **REVISIT**                    | FE currently gates Cancel to **SUPER_ADMIN only**. If the backend relaxes cancel to HR_ADMIN, change `canCancel` back to `canInitiate` (or the agreed role). If confirmed super-only, keep + close BE-7.                                            |
| **BE-8** — backend exposes a **self-service payslip template** (or relaxes `GET /payroll/payslip-templates`)                | `src/modules/payroll/hooks/usePayslipTemplate.ts`, used by `PayslipDrawer.tsx` (PR-3)                            | **REVISIT**                    | FE currently **skips** the template fetch for MANAGER/EMPLOYEE (so my-payslips doesn't 403-spam). Once a self-service template is available, un-gate the fetch so self-service payslips render with the configured layout.                          |
| **BE-9** — `GET /reports/export/:jobId/download` (+ status) ships                                                           | `src/modules/reports/hooks/useWorkforceReports.ts` (`useExportReport` → `requestExport`/`downloadExport`) (RP-1) | **AUTO**                       | **No FE change.** The FE already queues the job and polls the download route; it works the instant the route returns a `text/csv`. Do **not** revert to a client-built CSV. Just close BE-9.                                                        |
| **BE-10** — `POST /settings/roles` **persists `permissions`**                                                               | `src/modules/permissions/hooks/usePermissionsMutations.ts` (`useCreateRole`) (PERM-1)                            | **AUTO**                       | **No FE change.** The workaround was already backed out; the FE still **sends** `permissions` in the POST body, so a created role gets its perms the moment the backend persists them. Just close BE-10. (Until then: set perms via matrix + Save.) |
| **BE-11** — `GET /settings/roles-permissions` returns created roles in **`customRoles[]`**                                  | `src/modules/permissions/components/PermissionsMatrix.tsx` (`isCustomRole`) (PERM-3)                             | **KEEP** (AUTO benefit)        | **Keep** the built-in-set derivation (it's more robust than trusting the array). No removal. The only auto-benefit: the custom role's **friendly name** (instead of the raw key) reappears after a refresh once `customRoles[]` is returned.        |
| **Analytics filters** honoured (`departmentId`, `from`/`to`) — see `BACKEND_API_REQUESTS.md` "Analytics filter parameters"  | `src/modules/analytics/components/AnalyticsPage.tsx` + dashboard/analytics hooks (AN-2)                          | **AUTO**                       | **No FE change.** The FE already sends the params (backend ignores them today); the dashboard starts filtering the moment the backend honours them. Keep params **optional** so the Dashboard (passes none) stays unaffected.                       |
| **LV-2 / BE-5** — backend supports profile-less SUPER_ADMIN on `/leave/team/*` (or confirms super_admin shouldn't use them) | `src/modules/leave/*` (team tabs visibility)                                                                     | **REVISIT**                    | No FE workaround today (super_admin sees an error state). If backend supports it → nothing to do. If it confirms super_admin shouldn't approve leave → hide the team tabs for users without an `employeeId`.                                        |
| **EMP-3 / BE-3** — terminated employee retrievable (`GET /employees/:id` or `?includeTerminated`)                           | `src/modules/employees/*` (profile view)                                                                         | **REVISIT**                    | No FE workaround today. Once retrievable, add a "view/reverse terminated employee" path (the terminate dialog already promises reversal).                                                                                                           |

> **Permanent fixes that need NO revisit** (listed so they're not mistaken for workarounds): all
> **CC-9** field-name corrections (`approverComment`, `reviewerComment` — ATT-1/LV-1), all **CC-10**
> bodyless-`{}` / multipart `Content-Type: undefined` writes (TS-2, HD-1, PR-1), **CC-12** route guards
> (AN-1, PR-4), **CC-14** custom-role PATCH (PERM-2). These are correct against any sane backend — keep them.

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

### 4. Attendance `/attendance` — ✅ SWEPT, 1 issue fixed (2026-06-10)

- **Sub-units:** summary cards (`/attendance/summary`), dept/employee filters (HR/Manager), month nav,
  calendar ↔ table view toggle (`nuqs` URL state), `CheckInOutCard`, `RegularizationDialog` (request),
  `DayDetailDrawer`. **Regularization approve/deny is NOT on this page** — it lives in the dashboard
  `PendingApprovalsPanel` (tested there as part of this sweep).
- **Per role:**
  - **SUPER_ADMIN / HR_ADMIN / MANAGER:** summary + check-in card + **dept/employee filters** + reg
    button; table view fires `/attendance/records|team`. Clean.
  - **EMPLOYEE:** summary + check-in card + reg button, **no filters** (correct). Clean.
  - **Regularization request** (employee, via UI) → `POST /attendance/regularization` **201** ✓.
  - **Approve** (HR, dashboard panel) → `PATCH …/approve` **200** ✓.
- **Findings (FIXED):**
  - **ATT-1 (P1):** **Deny regularization was fully broken** — service sent `{ comment }` but the
    backend requires **`reviewerComment`** → `PATCH …/deny` **400** every time. Approve had the same
    wrong key (silently dropped the note). → CC-9. Fixed (both now send `reviewerComment`); deny
    verified **200** end-to-end via the dashboard.
- **Observations:** no console errors / no other 4xx-5xx for any role; check-in/out already verified
  (Dashboard). `nuqs` view/month/filter state all drive the right record fetches.
- **Carry-forward:** the `comment` vs `reviewerComment` mismatch (CC-9) — audit other approve/deny/review
  payloads (Leave reject uses `comment` too — **verify it's the right key when sweeping Leave**).

### 5. Timesheets `/timesheets` — ✅ SWEPT, 2 issues fixed (2026-06-10)

- **Sub-units / tabs (role-gated in `TimesheetScreen`):** **My Timesheet** (`canWrite` = all roles)
  — `TimerBar` (Zustand timer) + `WeeklyGrid` (`TimeEntryDialog`, submit bar); **Approvals**
  (`canApprove` = MANAGER + elevated) — `ApprovalsTab` approve/return; **Projects** (`canAdmin` =
  HR/SUPER only) — `ProjectsPanel` + `ProjectDrawer` CRUD. _(Utilization report lives in **Reports**;
  the timesheet **settings** panel lives in **Settings** — both swept with those screens, not here.)_
- **⚠️ Live/mock reality:** timesheets is **now LIVE on the backend** (not MSW as CLAUDE.md §27 says).
  Verified via direct BFF probe as priya: `GET /timesheets?week` returns real **cuid** ids + real
  entries; `POST /entries`, `/:id/submit`, `/approvals`, `/projects` all hit the backend. (`prj-seed-N`
  project ids are **backend** seed data, not MSW.) **CLAUDE.md §27 "MSW-backed" is stale — flag for docs.**
  _(Correction: `NEXT_PUBLIC_USE_MOCKS` is **OFF** for the whole sweep — MSW is **not running at all**.
  Holidays confirmed this: `POST /holidays/import` returns a Fastify **406**, not the MSW mock — if MSW
  were on it would have intercepted. So "the backend answers first" really means "MSW is off, everything
  is live." Any endpoint still only in MSW will **fail** in this config — see HD-1.)_
- **Per role:**
  - **SUPER_ADMIN / HR_ADMIN:** 3 tabs (My Timesheet, Approvals, Projects). Grid + projects load 200.
  - **MANAGER:** 2 tabs (My Timesheet, Approvals) — Projects correctly hidden. **Approve → POST
    `/:id/approve` 200 ✓; Return(reject) → POST `/:id/reject` 200 ✓** (both send `{ comment }`; reject
    requires it — no CC-9 mismatch). Seeded SUBMITTED week present in the approvals queue.
  - **EMPLOYEE (priya):** 1 tab (My Timesheet only) — Approvals/Projects correctly hidden, **and server
    enforces**: `GET /timesheets/approvals|settings|summary` → **403** for employee. Entry create →
    **POST /entries 201 ✓**; submit week → **POST /:id/submit 200 ✓** (after TS-2 fix); timer
    start/restore no longer crashes (after TS-1 fix).
- **Findings (both FIXED):**
  - **TS-1 (P1):** **`TimerBar` (and `TimeEntryDialog`) crashed with "Maximum update depth exceeded"**
    → error boundary takes down the whole timesheet view. Triggered by **selecting a project in the
    TimerBar** (or **restoring a running timer on refresh** — a documented feature of the timer slice).
    Root cause: `const { data: tasks = [] } = useTasks(...)` mints a new `[]` each render while the
    tasks query is loading, and that array is a `useEffect` dep whose body calls `setDraft`/`setValue`
    unconditionally → infinite loop. → **CC-11.** Fixed: memoize the array (`useMemo(() => data ?? [])`)
    - guard the writes + only clear a stale task once tasks are loaded. Verified no-crash on both paths.
  - **TS-2 (P1):** **Submit-week 400'd every time** — `timesheetsApi.submit` did
    `apiClient.post(`/timesheets/:id/submit`)` with **no body**; axios's default
    `Content-Type: application/json` + empty body → backend JSON-parse fails → **400 (empty body)**. The
    employee's core "submit my week" action was fully broken against the live backend (showed a "Failed
    to submit" toast). → **CC-10.** Fixed: send `{}`. Verified **200** end-to-end via the browser (was
    invisible while MSW-backed; only surfaced once timesheets went live).
- **Observations (not bugs):** no other console errors / 4xx-5xx for any role beyond the known
  CC-3 auth-boot 400/401 noise; role gating is correct in UI **and** enforced server-side (403s).
  `nuqs` `?tab=` state drives the right tab. Reject requires a comment (zod + backend 422) — correct.
- **Carry-forward:** CC-10 (bodyless POST) + CC-11 (loading-`[]` effect-dep loop) are now general
  patterns — apply on every remaining screen. **Verify the live/mock state of each remaining screen**
  (timesheets being live was a surprise). Next bodyless-POST to verify when swept: payroll
  `POST /runs/:id/inputs/from-timesheets`, `PATCH /notifications/:id/read`.
- **Test residue (harmless, test DB):** priya's current week + a future week were submitted; the
  seeded approvals week was approved + another returned. Seed accounts remain usable.

### 6. Leave `/leave` — ✅ SWEPT, 1 FE fix + 1 backend issue logged (2026-06-10)

- **Sub-units / tabs (`LeaveScreen`):** **My Requests** (all roles) — `LeaveRequestsTable` +
  `NewLeaveRequestDialog` (create) + inline **Withdraw** (confirm dialog); **Team Calendar** (all
  roles, but query `enabled` only for MANAGER/HR/SUPER); **Approvals** (`canApprove` = MANAGER/HR/SUPER)
  — `LeaveApprovalsTable` inline Approve / Deny-dialog / bulk approve+reject + coverage chip.
  **Live, not MSW** (no `mocks/handlers/leave.ts`; real cuid ids + real validation).
- **Per role:**
  - **HR_ADMIN:** 3 tabs, all load clean (approval queue happened to be empty at sweep time; the
    MANAGER run exercised the same shared approve/deny path → 200).
  - **MANAGER (aman):** 3 tabs. **Approve → PATCH `/approve` 200 ✓; Deny → dialog → PATCH `/reject`
    200 ✓** (after LV-1 fix). Team Calendar loads.
  - **EMPLOYEE (priya):** **2 tabs (no Approvals)** ✓. **Create → POST `/leave/requests` 201 ✓;
    Withdraw → PATCH `/withdraw` 200 ✓** (bodyless PATCH — CC-10 tolerated, re-confirms CC-6).
    Team Calendar tab fires **no** `/team/calendar` call (query disabled for employee → gated
    empty state, no 403 spam). Server also enforces: priya hitting `/leave/team/{requests,calendar}`
    directly → **403**.
  - **SUPER_ADMIN:** 3 tabs, but **Approvals + Team Calendar 400** — see LV-2.
- **Findings:**
  - **LV-1 (P1, FIXED):** **Leave reject was fully broken** — `leave.api.ts` sent `{ comment }` but
    the live backend requires **`approverComment`** → `PATCH /reject` **400 (VALIDATION_ERROR:
    approverComment required)** every time. **Approve** had the same wrong key → 200 but the note was
    **silently dropped**. → **CC-9** (same class as attendance ATT-1). Fixed both to send
    `approverComment`; verified live **200** + the reason **persists** on a follow-up GET, and via the
    UI (MANAGER approve+deny 200). _(Bulk approve/reject were fine — backend accepts any/no comment, 200.)_
  - **LV-2 (P2, backend — logged in §6B):** **SUPER_ADMIN's Approvals + Team Calendar tabs 400 with
    `NO_EMPLOYEE_ID` "User does not have an employee profile."** The `/leave/team/*` endpoints are
    employee-scoped and SUPER_ADMIN has **no employee profile** (employeeId null), so the tabs render an
    **error state** for super_admin only. Inconsistent with `/manager/approvals`, which **does** work
    for super_admin (200). FE shows the tabs to super_admin (`canApprove`/`canViewTeam` include
    SUPER_ADMIN). **Not FE-fixed** — it's a product/backend call (should super_admin approve leave? then
    backend must support profile-less super_admin on team endpoints; if not, FE should hide those tabs
    for users without an employeeId). Flagged for the user + backend.
- **Observations (not bugs):** withdraw/approve/reject are **PATCH** (CC-6, FE correct, docs stale);
  no console errors / no other 4xx-5xx for HR/MANAGER/EMPLOYEE; create maps date fields via
  `formatDateForApi` (YYYY-MM-DD) correctly.
- **Carry-forward:** the `approverComment` field is now the **#1 recurring bug** (attendance + leave) —
  audit every remaining approve/reject/deny/review write (Payroll run approve, Timesheets already
  checked — uses `comment` and that's what its backend wants). Verify field name **and** value
  persistence each time.
- **Test residue (harmless, test DB):** several `ZZZ E2E` leave requests for priya (far-future 2027
  dates) in various states (rejected/approved/withdrawn) from the API + UI probes. Seed accounts intact.

### 7. Holidays `/holidays` — ✅ SWEPT, 1 issue fixed (2026-06-10)

- **Sub-units (`HolidayScreen`, modal-based — no routes → CC-8 N/A):** year grid (`?year=` via local
  state) + month-detail modal; All-holidays list + selected detail card; **Add Holiday** / **Edit** /
  **Delete** (`HolidayFormDialog` + `ConfirmDialog`); **Import .ics** (`IcsImportDialog`: pick → preview
  → commit). All **live** (CRUD + import); MSW handler for `/holidays/import*` exists but is **dead code
  now** (mocks off — see below). Form fields: name, date (`type=date`), location, optional checkbox —
  **no numeric inputs (CC-1 N/A)**.
- **Per role:**
  - **HR_ADMIN / SUPER_ADMIN** (`canManage`): Add + Import .ics buttons + per-row action menus. Full
    CRUD verified — **create 201, edit 200, delete 200** (HR via UI; super_admin via API). `isOptional`
    - `location` persist correctly (**no CC-9**). **SUPER_ADMIN works fine** here (holidays are
      tenant-level, not employee-scoped — contrast Leave LV-2).
  - **MANAGER / EMPLOYEE:** year grid renders (read), but **no Add / no Import / no row menus** (correct
    `canManage` gating). Server also **enforces**: `POST /holidays` → **403**.
- **Findings (FIXED):**
  - **HD-1 (P1):** **`.ics` import was fully broken — `POST /holidays/import` 406
    `FST_INVALID_MULTIPART_CONTENT_TYPE` "the request is not multipart".** The multipart `FormData`
    upload was sent through the shared axios client, which carries the default
    `Content-Type: application/json`, so the browser never set `multipart/form-data; boundary=…`. The
    backend **does** implement import (proper multipart → 202 + jobId; preview 200; commit 200 — all
    verified live), so this was purely the FE content-type. → **CC-10 (file-upload sub-case).** Fixed by
    passing `headers: { 'Content-Type': undefined }` on `startImport`. Verified end-to-end in the
    browser: **start 202 → preview 200 → commit 200**, preview table renders, no console errors.
- **Observations (not bugs):** **this screen proved mocks are OFF** — the 406 is a Fastify error, not the
  MSW mock (MSW would have intercepted `/holidays/import`). So MSW isn't running; **any endpoint still
  only in MSW will fail** in this env. Create/update send `holidayDate` via `formatDateForApi`
  (YYYY-MM-DD) — correct.
- **Carry-forward:** **audit every other `FormData`/file upload** for the same content-type bug —
  employee **document upload/presign** (`employees` module, multipart per CLAUDE.md §3), avatar, any
  payroll import. The MSW `/holidays/import*` handler is now dead (mocks off) — could be deleted, or
  kept for a mocks-on demo; left as-is.
- **Test residue:** all `ZZZ E2E` holidays (created + imported, 2027) deleted at end of the run. Clean.

### 8. Payroll `/payroll` — 🐞 CORE SWEPT, 1 fix + 2 gating issues (2026-06-10) · panels partial

- **Live state (mocks OFF):** **every top-level payroll GET now returns 200** — `runs, roster, components,
groups, schedules, countries, legal-entities, statutory-packs, pay-calendars, payslip-templates,
event-catalogue, events, cost-summary, workers, contractor-invoices, opening-balances,
reimbursement-categories/-claims, migration, reports, settings, employees, payment-batches`. The §26
  "404s" (migration/reports/settings/employees/payment-batches) **have since shipped.** Runs page shape is
  **`{ items[], pagination }`** (FE type matches — `items`, not `runs`).
- **Gating:** HR_ADMIN / SUPER_ADMIN → runs screen ("Run Payroll" button). **MANAGER / EMPLOYEE →
  redirected to `/payroll/my-payslips`** (self-service). Server enforces: employee `GET /payroll/roster|runs`
  → **403**.
- **Run lifecycle (verified live, throwaway 2025 runs):** initiate `POST /runs` **201** → calculate
  `POST /runs/:id/calculate {}` **202 → REVIEW** → approve `POST /runs/:id/approve {notes}` **200 (APPROVED)**
  → mark-paid `PATCH /runs/:id/mark-paid {paidAt,paymentReference}` **200 (PAID)** → publish `POST .../publish {}`
  **200 (published)**. All these send a body and work.
- **Findings:**
  - **PR-1 (P1, FIXED):** **"Import from timesheets" was fully broken** —
    `POST /payroll/runs/:id/inputs/from-timesheets` was a **bodyless** POST → **400
    `VALIDATION_ERROR {field:"unknown","must be object"}`**; with `{}` → **200**. → **CC-10.** Fixed
    (`payroll-runs.api.ts` `importInputsFromTimesheets` now sends `{}`); API-verified 200 (one-line body
    add, same pattern as TS-2/HD-1).
  - **PR-2 (P2, gating — logged §6B BE-7):** the run-detail **"Cancel Run" button is shown to HR_ADMIN**
    (gated on `perms.canInitiate`), but the backend **requires SUPER_ADMIN** to cancel → HR clicking Cancel
    gets **403 FORBIDDEN** (`requiredRoles:["SUPER_ADMIN"]`). The cancel dialog even defaults the reason to
    "Cancelled by HR", so FE intent ≠ backend rule. **Not fixed pending your call** (gate FE to super_admin,
    or backend should allow HR) — like LV-2.
  - **PR-3 (P2/P3, gating — logged §6B BE-8):** the **self-service my-payslips page** (PayslipDrawer →
    `usePayslipTemplate`) fires **`GET /payroll/payslip-templates` → 403** for MANAGER/EMPLOYEE (the
    template endpoint is HR-only). Fires **2× on every load**; the page still renders (handled, no console
    error) but it's noisy and the self-service payslip can't use the configured template. **Not fixed
    pending your call** (FE skip/guard the template fetch for self-service, or backend allow read).
- **Observations:** `approve` sends `{notes}` — accepted (200), though the run's `approvals[]` came back
  empty (note may persist elsewhere; not blocking). No other bodyless payroll writes (the rest send `{}`/a
  body). FnF number inputs have no `step` (CC-1 N/A).
- **PR-2/PR-3 — FIXED (your call: gate FE).** PR-2: added a SUPER_ADMIN-only `canCancel` to
  `usePayrollPermissions`; the run-detail Cancel button now uses it (verified: HR no longer sees Cancel,
  super_admin does). PR-3: gated `usePayslipTemplate` to elevated roles so self-service doesn't fetch the
  HR-only template (verified: 0 template calls for an employee). BE-7/BE-8 stay flagged for the backend.
- **Panel follow-up pass (done):** `/payroll/global` (GlobalWorkforceScreen — cost summary, workers,
  contractor invoices) and `/payroll/migration` (all **5** panels: Pay Calendar / Opening Balances /
  Historical Payslips / Parallel Run / Go-Live) and a run-detail (all panels) **load clean for HR** — no
  4xx/5xx, no console errors. The editor panels (Salary Components / Pay Groups / Statutory Packs / Legal
  Entities / Payslip Template / Data Policy) live under **Settings → Pay & Compliance** and are swept with
  **screen 12 (Settings)**, not here. Migration/run-detail writes all send a body (no CC-10).
  - **PR-4 (P2, FIXED):** **`/payroll/global` had no role guard** — unlike `/payroll` (PayrollScreen) and
    `/payroll/migration` (MigrationScreen), which redirect self-service roles. An employee/manager opening
    `/payroll/global` by URL got a page whose every data endpoint (`workers`, `cost-summary`,
    `contractor-invoices`, `countries`) **403s** → all error states. Fixed: mirror the sibling guard
    (redirect non-HR/admin → `/payroll/my-payslips`). Verified: employee → my-payslips, HR still loads.
  - **Still not driven (lower priority):** individual run-detail **write actions** (create payment batch,
    adjust payslip, hold/release/reprocess payslip, journal/statutory/register exports) and the migration
    **write forms** (create pay calendar, save opening balance, import historical payslips, go-live toggle)
    — all load clean and their service calls send proper bodies; exercising each write E2E is a deeper pass.
- **Test residue (test DB, harmless):** throwaway 2025 runs left — `2025-01` PAID+published, `2025-02`
  DRAFT (cancel 403'd), `2025-03` REVIEW. All 2025 periods, won't affect seed accounts.

### 9. Reports `/reports` — ✅ SWEPT, 1 FE fix (2026-06-10)

- **Sub-units:** single route `/reports`; a sticky `ReportsNav` switches among **15 lazy panels** via
  `?report=`. Each panel = summary + chart (`ChartEngine`) and/or table + an **Export** button
  (`ReportShell`). Report GET endpoints (`/reports/workforce|attendance|leave|payroll/*`) all **live, 200**.
- **Per role:**
  - **HR_ADMIN / SUPER_ADMIN:** all **15 panels render clean** — chart and/or table per type, **no console
    errors, no 4xx/5xx** (headcount, turnover, demographics, attendance summary, absenteeism, leave
    utilization, leave pending, payroll summary, ctc-analysis, salary/statutory/bank-advice/variance
    registers, pay-equity, timesheets utilization).
  - **MANAGER / EMPLOYEE:** reach `/reports` but see an **access-denied UI**; server also enforces
    (`GET /reports/*` → **403**). Correct gating.
- **Findings (FIXED):**
  - **RP-1 (P1):** **Every report's CSV export was broken.** `POST /reports/export` is now an **async
    job** → `202 { jobId, status:"PENDING", message:"Use /export/:job_id/download once ready." }` (JSON),
    but the FE used `responseType:'blob'` and **downloaded that 202 JSON stub as `<report>-report.csv`**
    with a false **"Report exported"** toast — users got a ~158-byte JSON file, not the report. → contract
    drift (backend went async). **Per your call (security):** download must come **from the server**
    (a server-generated file can't be tampered with via devtools, unlike a client-built CSV). Fixed:
    `requestExport()` queues the job, `downloadExport()` polls `GET /reports/export/:jobId/download` and
    returns the **server** file; we download **only a real server file**, and show an honest "being
    prepared" message until it's ready (no fake download/success). Verified: POST 202 → polls /download →
    **no garbage file**, honest toast. **Backend-blocked to complete (BE-9):** the download route 404s
    today; when it ships, this works end-to-end with no FE change.
- **Observations (not bugs):** 4 panels show no Export button (demographics, leave/pending, ctc-analysis,
  pay-equity) — by design (no server export wired for those). The **4 payroll register** reports
  (Salary/Statutory/BankAdvice/Variance) export via a **separate** path —
  `payrollRunsApi.exportRegister` → `GET /payroll/runs/:id/register/export` (direct blob, needs a selected
  run) — **not** the `/reports/export` async flow; that path was **not** driven E2E (verify when convenient).
- **Carry-forward:** the `/reports/export` async pattern (202 job → poll server download) is the secure
  export model — reuse it if other screens add server exports. Don't build CSVs from client-loaded data.

### 10. Analytics `/analytics` — ✅ SWEPT, 2 FE fixes (AN-1 role gate + AN-2 filter wiring) (2026-06-10)

- **Sub-units (single page `AnalyticsPage`, no sub-routes):** top filter bar (`RangeSelector` 7d/30d/90d +
  custom range; Department `Select`); 7 rows — KPI cards (`/analytics/summary`), Attendance Trend
  (`/analytics/attendance?range=`), Headcount donut (`/headcount-by-department`) + Leave Summary bar
  (`/leave-summary`), Recent Activity (`/recent-activity?limit=` + Load-more), Workforce Trend
  (`/workforce-trend?range=6m|12m|2y`, own toggle), Attrition (`/attrition`, own toggle) + Payroll Cost
  (`/payroll-cost?range=6m|12m`, own toggle), Department Performance table (`/department-performance?range=30d|90d`,
  own toggle). Reuses dashboard analytics hooks + 4 analytics-module hooks (`useWorkforceTrend`/`useAttritionTrend`/
  `usePayrollCostTrend`/`useDepartmentPerformance`).
- **⚠️ Live reality (mocks OFF):** **all 11 analytics endpoints are LIVE + 200 for HR/SUPER** — including the
  4 the §4 pointer feared were "MSW-only → 404" (`workforce-trend`, `attrition`, `payroll-cost`,
  `department-performance`). **They've shipped** — no 404s. (Probe: `scripts/probe-analytics.mjs`.)
- **Per role:**
  - **SUPER_ADMIN / HR_ADMIN:** page renders **clean** — 9 analytics GETs on load all **200**, all 7 rows
    render (KPI cards, area/line/composed/donut/bar charts, activity table, dept table). **No console errors
    / no 4xx-5xx** beyond the known CC-3 auth-boot 400/401 noise. Interactions fire: per-chart **6m→12m
    toggle → `workforce-trend?range=12m` 200 ✓**; attendance 7d/30d/90d preset → `attendance?range=` refetch.
  - **MANAGER / EMPLOYEE (before fix):** **no role guard** → opened the page and fired **9 HR-only endpoints
    → all 403**, ×3 React Query retries = **17 (manager) / 27 (employee) failed requests** + console errors;
    the page a grid of "Failed to load" error states. (Manager incidentally got **200** on
    `department-performance` only; everything else 403; employee 403 on all 11. Server enforces — these are
    HR/SUPER-only endpoints.) → **CC-12.**
  - **MANAGER / EMPLOYEE (after fix):** clean **access-denied** state, **0 analytics calls fired**.
- **Findings:**
  - **AN-1 (P2, FIXED):** **`/analytics` route had no role guard** while every widget hits an HR/SUPER-only
    endpoint → manager/employee got a wall of 403s + console errors (CC-12). The nav item is also unfiltered
    (`NAV_ITEMS` shows Analytics to every role). Fixed: wrapped the route page in
    `RoleGate roles={['SUPER_ADMIN','HR_ADMIN']}` with an `ErrorState` fallback (the `permissions/page.tsx`
    pattern). Verified in-browser: employee/manager → 0 analytics calls + access-denied; HR/SUPER unchanged
    (9 calls, all 200). Commit `853c465`.
  - **AN-2 (P3, FIXED — your call: keep + wire):** **the top filter bar's Department `Select` and Custom date
    range were dead controls** — selecting a department or applying a custom range **fired no network call and
    changed nothing** (no analytics hook read `departmentId`/`from`/`to`; `range='custom'` even made the
    attendance chart fall back to 30d). → **CC-13.** Fixed by **wiring**, not removing: threaded an optional
    `AnalyticsFilters { departmentId, range, from, to }` (in `dashboard.types`) through the shared dashboard
    analytics service/hooks (summary, attendance, headcount, leave-summary, recent-activity) and the
    analytics-module trend hooks (workforce-trend, attrition, payroll-cost, department-performance). All params
    **optional** → the **Dashboard** screen (which passes none) is unaffected. `departmentId` scopes all 9;
    a custom `from`+`to` window drives the short-window widgets (summary/attendance/leave-summary, overriding
    the preset) while the 4 long-trend charts keep their own range + get `departmentId`. **Live endpoints
    accept+ignore these params today (probed — all still 200)**, so it shipped with no regression; the backend
    filter contract is handed off in `docs/BACKEND_API_REQUESTS.md` ("Analytics filter parameters") — data
    filters with zero FE change once the backend honours them. Verified in-browser: **dept-select → all 9
    refetch with `departmentId` (200); custom range → `from`/`to` on the short-window widgets (200); HR load
    unchanged; no non-auth 4xx/5xx.** Commit `04770b2`.
- **Observations (not bugs):** the per-chart range toggles (6m/12m/2y on workforce/attrition, 6m/12m on
  payroll-cost, 30d/90d on dept-perf) are **independent local state** and each **does** refetch correctly —
  these are fine; only the **top-bar** Department/Custom controls are dead. No bodyless writes (all-GET
  screen — CC-10 N/A); no `useEffect`-dep array loops observed (CC-11 N/A).
- **Carry-forward:** **CC-12** (unguarded HR-only screen → 403 wall) and **CC-13** (decorative no-op filter)
  are now general patterns — apply on Settings + any remaining admin dashboard. The nav (`NAV_ITEMS`) is
  **unfiltered by role** — every screen owes its own route-level gate (guard or redirect).

### 11. Permissions `/permissions` — ✅ SWEPT, 2 FE fixes (PERM-1 + PERM-2) + 2 BE logged (2026-06-10)

- **Sub-units (`PermissionsMatrix`, single screen — no sub-routes):** role-summary cards (member counts are
  `DEMO_USER_COUNTS`, static demo data — not from the API), legend, the **roles × permissions matrix**
  (`PermCell` toggle per role×permission; SUPER_ADMIN column **locked**), **Reset to defaults** (local only —
  clears overrides), **Save changes** → **impact-confirm dialog** → `PATCH /settings/roles-permissions` per
  changed role, **Add Role** (`AddRoleDialog` → `POST /settings/roles`), **Delete** custom role
  (`DELETE /settings/roles/:key`). All endpoints **live**. Toggling/Reset fire **no** network call (batched —
  correct); only Save/Add/Delete hit the API.
- **Gating (RoleGate `SUPER_ADMIN` only):**
  - **SUPER_ADMIN:** matrix renders; `GET /settings/roles-permissions` **200** (5 roles: HR_ADMIN, SUPER_ADMIN,
    AUDITOR, MANAGER, EMPLOYEE). Built-in toggle → Save → impact dialog → Confirm → **PATCH 200** + invalidate ✓.
  - **HR_ADMIN / MANAGER / EMPLOYEE:** clean **access-denied** state, matrix not rendered, **0 `settings/roles`
    calls** (RoleGate blocks the mount — no 403 spam). Server **also enforces**: `GET /settings/roles-permissions`
    → **403 FORBIDDEN** for all three. ✓ (super-only is correct here; holidays-style tenant data this is not.)
  - **SUPER_ADMIN column** can't be edited: locked in UI **and** backend rejects
    `PATCH {role:'SUPER_ADMIN'}` → **403 `CANNOT_LOCK_OUT_SUPER_ADMIN`**. ✓
- **Findings (both FIXED):**
  - **PERM-1 (P2, ⏳ backend — user's call: no FE workaround):** **Creating a custom role drops its
    permissions.** `AddRoleDialog` requires ≥1 permission and sends `{name, key, permissions[]}` to
    `POST /settings/roles`, but the backend **ignores `permissions`** (role lands with `[]`; the `201` body
    omits `permissions`) → a role created as "X: employees:read" has **zero** access. → **CC-9 extension**
    (endpoint silently drops an accepted field) + **BE-10**. _A FE workaround (follow-up `PATCH` after the
    POST, since PATCH persists custom keys) was implemented then **backed out per your decision** — the proper
    permanent fix is backend-side. The FE **still sends** `permissions` in the POST body, so it starts working
    the instant the backend persists them; until then the new role honestly shows its stored state (`[]`), and
    perms can be granted by editing the role's cells in the matrix + Save (that PATCH **does** persist —
    PERM-2)._ Verified the backed-out behaviour in-browser: Add Role → **POST 201 only** (no follow-up PATCH),
    `matrix[key]` honestly `[]`; then matrix toggle + Save → **PATCH 200** → perms persist.
  - **PERM-2 (P1):** **Custom-role permission edits in the matrix were never sent to the backend.**
    `handleConfirmSave` PATCHed built-in roles but routed **custom roles to `queryClient.setQueryData` only**
    (cache-only, no API call) — so toggling a custom role's cells + Save showed "Permissions saved" but the
    change **vanished on the next refetch**. The backend PATCH **accepts custom keys** (verified 200 + persists),
    so the cache-only branch was needless. → **CC-14.** Fixed: PATCH **all** non-SUPER_ADMIN roles identically
    (removed the dead branch + unused `queryClient`). Verified: custom-cell toggle + Save → **PATCH 200** →
    post-invalidation GET reflects the edit.
  - **PERM-3 (P3, backend — BE-11):** `GET /settings/roles-permissions` **omits created roles from
    `customRoles[]`** (they appear in `roles[]`/`matrix` only). The FE used `customRoles[]` to detect custom
    roles → after a refresh a custom role rendered as **built-in** (no Delete button, no Custom badge). FE
    robustness fix: derive `isCustom` from the built-in label set, not the server array (Delete button + badge
    now survive a refresh). The **friendly name** still degrades to the raw key after a refresh until the backend
    returns `customRoles[]`. Logged for backend (BE-11); FE no longer depends on the missing array.
- **Observations (not bugs):** member counts on the role cards are **static demo data** (`DEMO_USER_COUNTS`),
  not an API call — by design. The impact-confirm dialog computes gained/lost perms client-side. Save is a
  **per-role loop of PATCHes** (each invalidates) — pre-existing behaviour, not a regression. No bodyless
  writes (PATCH/POST all send a body — CC-10 N/A); no number inputs (CC-1 N/A).
- **Test residue (test DB, harmless):** all writes restored — a built-in role toggled during probing was
  PATCHed back to its original set; all `ZZZ_E2E_*` custom roles created during testing were deleted. Seed
  accounts intact (verified: HR_ADMIN/MANAGER/EMPLOYEE perm sets unchanged at end).
- **Carry-forward:** **CC-14** (cache-only "save" with no API call) + the **CC-9 extension** (endpoint drops an
  accepted field) are now general patterns — on every Settings panel Save, assert a real PATCH/POST fires
  **and** GET the record back to confirm **every** sent field persisted.

### 12. Settings `/settings` — ✅ SWEPT (scoped), 1 FE fix (SET-1+SET-2) (2026-06-10)

- **⏸️ SCOPE (user's call, 2026-06-10): DEFERRED — "do it later":** Notifications (in-app prefs),
  Integrations (email/storage/webhooks), Billing (plan/invoices). _(Likely MSW-only → 404 with mocks off,
  §24 — probe when picked up.)_ These are now route-gated by the new guard (SUPER-only per nav), so safe.
- **Architecture:** `settings/layout.tsx` = two-pane sticky nav-card (`SettingsNav`) + content card. Routes
  are **thin** (`page.tsx` → `<XPanel/>`, no per-route guard). `SettingsNav` (`NAV_GROUPS`) hides items by
  role. `/settings` index **redirected** to a panel. ~24 panels in 7 nav groups; pay/\* panels live in the
  **payroll** module, timesheet settings in the **timesheets** module.
- **In-scope panels swept (18):** company-profile, branding, locale, working-hours, leave-types,
  attendance-rules, timesheets(settings), authentication, sessions, audit-log, email-templates, + Pay &
  Compliance (pay/legal-entities, pay/statutory-packs, pay/components, pay/groups, pay/schedules,
  pay/payslip-template, pay/data-policy).
- **Live state (mocks OFF):** **every in-scope GET is live + 200 for SUPER/HR** (incl.
  `/payroll/settings/data-policy` — note the path is `/payroll/settings/data-policy`, not `/payroll/data-policy`).
  **Gating per endpoint:** tenant (company-profile/locale/working-hours), attendance-rules, timesheets/settings,
  email-templates, all payroll/\* + data-policy → **403 for MANAGER/EMPLOYEE**; `security/auth` (authentication)
  → **403 for HR too** (SUPER-only). **`/settings/branding` + `/audit-logs` return 200 for ALL roles** (no
  server enforcement — but `audit:read` is granted to all roles in the matrix, and branding read is
  non-sensitive; the new guard still gates these panels to the nav's roles).
- **Per role:**
  - **SUPER_ADMIN / HR_ADMIN:** all in-scope panels load **clean** — no 4xx/5xx, no console errors (HR's only
    miss was `authentication`, which is SUPER-only → now guarded). **Saves fire:** company-profile edit → Save
    → **PATCH /settings/tenant 200** (verified end-to-end + restored to "Acme Corp"); leave-type create →
    **POST /leave/types 201** (ZZZ throwaway, deleted). Save buttons are **disabled-until-dirty** (correct).
  - **MANAGER / EMPLOYEE:** nav shows only **Sessions & Devices** + **In-app Preferences** (+ Holidays
    external) — correct. **Before fix:** `/settings` → redirect to `company-profile` → `/settings/tenant`
    **403** + console error (a wall, reachable by just clicking Settings); direct URL to any HR/SUPER panel →
    same. **After fix:** `/settings` → `/settings/sessions`; direct URLs → clean **access-denied, 0 calls fired**.
- **Findings (FIXED in one change):**
  - **SET-1 (P2):** **`/settings` redirected ALL roles to `company-profile`** (HR/SUPER-only) → manager/
    employee landed on a panel whose `/settings/tenant` 403'd (console error), via a normal Settings click
    (AppShell nav is role-unfiltered). Fixed: `/settings` now redirects to `firstAccessibleSettingsPath(role)`
    — managers/employees → Sessions, admins → Company Profile.
  - **SET-2 (P2, CC-12):** **Settings panel routes were unguarded** — only `LeaveTypesPanel` +
    `AuthSettingsPanel` self-gated (and AuthSettingsPanel's query fired **before** its RoleGate → 403 console
    noise even for HR). All other HR/SUPER-only panels rendered + 403'd their endpoint for lower roles on
    direct URL. Fixed: new **`SettingsAccessGuard`** wraps the layout content and denies access cleanly
    **before** the panel (and its queries) mount, using the **same `NAV_GROUPS` role config** as the nav
    (single source of truth). Verified: 0 stray 403s for any role now. → **CC-12.**
- **Observations (not bugs):** number inputs (attendance-rules thresholds, auth password-length/timeout,
  data-policy retention) have **no `step`** (default integer step) → **CC-1 N/A**. Settings saves are
  standard RHF + mutation **with a body** (PATCH/POST) → **CC-10 N/A**; no cache-only saves seen (CC-14 N/A);
  field names matched live (CC-9 N/A on the panels driven). pay/\* panels were already swept under Payroll.
- **Test residue (test DB, harmless):** company-profile name restored to "Acme Corp"; the `ZZZ E2E` leave
  type created during the save test was deleted (8 standard leave types remain). Seed accounts intact.
- **Carry-forward:** the **`SettingsAccessGuard`** (config-driven route gate) is the clean pattern for any
  multi-panel screen where the nav hides items but routes stay reachable — reuse it if the deferred
  Notifications/Integrations/Billing panels are picked up (they're already covered by it). **CC-12** now has
  a reusable, DRY implementation (gate from the same role config that drives nav visibility).

---

## 8. Issue tracker

All issues across all screens. Fix status drives the per-screen cadence.

| ID     | Screen / panel                       | Sev | Summary                                                                                               | Root cause                                                                                                                                                                                    | Status     | Commit    |
| ------ | ------------------------------------ | --- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| —      | Dashboard (all roles)                | —   | **0 issues** — load + all interactions clean                                                          | —                                                                                                                                                                                             | ✅ swept   | —         |
| EMP-1  | Employees / profile Overview         | P1  | OverviewTab crash on new employee (`undefined.length`)                                                | API omits `documents`/`leaveBalances`; type said required (CC-7)                                                                                                                              | ✅ fixed   | `main`    |
| EMP-2  | Employees / new + edit routes        | P2  | create/edit form shown to MANAGER/EMPLOYEE via URL                                                    | routes unguarded; only list button gated (CC-8)                                                                                                                                               | ✅ fixed   | `main`    |
| EMP-3  | Employees / terminate                | P3  | terminated employee `GET /employees/:id` → 404, profile inaccessible                                  | **backend** soft-delete excludes from GET                                                                                                                                                     | ⏳ backend | —         |
| —      | Departments (all roles)              | —   | **0 issues** — load + gating + create/edit/sub/delete all clean                                       | —                                                                                                                                                                                             | ✅ swept   | —         |
| ATT-1  | Attendance / regularization deny     | P1  | denying a regularization 400'd every time (deny fully broken)                                         | FE sent `comment`; backend requires `reviewerComment` (CC-9)                                                                                                                                  | ✅ fixed   | `main`    |
| TS-1   | Timesheets / TimerBar + entry dialog | P1  | "Maximum update depth" crash on project-select / timer-restore                                        | loading-`[]` from `useTasks` used as `useEffect` dep + unconditional setState (CC-11)                                                                                                         | ✅ fixed   | `main`    |
| TS-2   | Timesheets / submit week             | P1  | submitting a week 400'd every time (core employee action broken)                                      | bodyless `apiClient.post` + default json content-type → live backend 400 (CC-10)                                                                                                              | ✅ fixed   | `main`    |
| LV-1   | Leave / approve + reject             | P1  | reject 400'd every time (fully broken); approve dropped the note                                      | FE sent `comment`; backend requires `approverComment` (CC-9)                                                                                                                                  | ✅ fixed   | `main`    |
| LV-2   | Leave / super_admin team tabs        | P2  | super_admin Approvals + Team Calendar 400 (NO_EMPLOYEE_ID)                                            | `/leave/team/*` employee-scoped; super_admin has no employee profile                                                                                                                          | ⏳ backend | —         |
| HD-1   | Holidays / .ics import               | P1  | `.ics` import 406 every time (feature fully broken)                                                   | multipart FormData sent with default `Content-Type: application/json` (CC-10 upload sub-case)                                                                                                 | ✅ fixed   | `main`    |
| PR-1   | Payroll / inputs from timesheets     | P1  | "Import from timesheets" 400'd every time (broken)                                                    | bodyless `apiClient.post` → backend "must be object" (CC-10)                                                                                                                                  | ✅ fixed   | `main`    |
| PR-2   | Payroll / run-detail Cancel Run      | P2  | HR sees Cancel Run; backend requires SUPER_ADMIN → 403                                                | FE gated on `canInitiate`; added super_admin-only `canCancel` (BE-7 flagged)                                                                                                                  | ✅ fixed   | `main`    |
| PR-3   | Payroll / self-service my-payslips   | P2  | manager/employee load fires `payslip-templates` → 403 (×2)                                            | gated `usePayslipTemplate` to elevated roles (BE-8 flagged)                                                                                                                                   | ✅ fixed   | `main`    |
| PR-4   | Payroll / `/payroll/global` route    | P2  | employee/manager open it by URL → page of 403 error states                                            | GlobalWorkforceScreen lacked the self-service redirect its siblings have                                                                                                                      | ✅ fixed   | `main`    |
| RP-1   | Reports / CSV export (all reports)   | P1  | export downloaded the async 202 JSON job-stub as `.csv` + faked success                               | backend `/reports/export` went async; FE expected a sync blob. Now polls server download (BE-9)                                                                                               | ✅ fixed   | `main`    |
| AN-1   | Analytics / `/analytics` route       | P2  | manager/employee open it → 9 HR-only endpoints 403 ×3 retries = wall of error states + console errors | route had no role guard; `NAV_ITEMS` unfiltered (CC-12). Wrapped in `RoleGate` HR/SUPER (access-denied)                                                                                       | ✅ fixed   | `853c465` |
| AN-2   | Analytics / top filter bar           | P3  | Department `Select` + Custom date range fired no query — selecting them did nothing                   | no analytics hook read `departmentId`/`from`/`to` (CC-13). Wired through all 9 endpoints; BE filter contract handed off                                                                       | ✅ fixed   | `04770b2` |
| PERM-1 | Permissions / Add Role               | P2  | creating a custom role with selected perms → role lands with `[]` (perms dropped)                     | backend `POST /settings/roles` ignores `permissions` (BE-10, CC-9 ext). **Per user's call: no FE workaround** — wait for backend; FE still sends perms + set them via matrix + Save meanwhile | ⏳ backend | —         |
| PERM-2 | Permissions / matrix Save            | P1  | custom-role permission edits "saved" (toast) but vanished on refresh                                  | `handleConfirmSave` wrote custom roles to RQ cache only, no API call (CC-14). Now PATCHes all non-super roles                                                                                 | ✅ fixed   | `9d559cf` |
| PERM-3 | Permissions / custom role render     | P3  | after refresh a custom role shows as built-in (no Delete button / friendly name)                      | backend `GET …/roles-permissions` omits created roles from `customRoles[]` (BE-11). FE derives `isCustom` from built-ins                                                                      | ✅ fixed\* | `9d559cf` |
| SET-1  | Settings / `/settings` index         | P2  | manager/employee clicking Settings → land on company-profile → `/settings/tenant` 403 + console error | `/settings` statically redirected ALL roles to an HR/SUPER-only panel. Now redirects to `firstAccessibleSettingsPath(role)`                                                                   | ✅ fixed   | `9f21415` |
| SET-2  | Settings / panel routes (CC-12)      | P2  | direct URL to an HR/SUPER panel by a lower role → panel renders + endpoint 403s (wall/console noise)  | routes unguarded (only 2 of ~18 self-gated); nav only hid items. Added `SettingsAccessGuard` (layout-level, nav-config-driven)                                                                | ✅ fixed   | `9f21415` |

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
