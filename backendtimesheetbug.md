# Timesheets — Backend bug report & endpoint fix

> Found during a live browser regression of the Timesheets module on **2026-06-14**
> against the production backend (`NEXT_PUBLIC_USE_MOCKS=false`). Evidence captured by
> driving the real app in a headed Chromium and reading the actual network responses.

There is **one genuine backend bug** (Bug #1). The second issue everyone notices in the
UI — "there's Create Project but no Create Task" — was investigated and is **NOT a
backend bug**: the endpoint is live and works. Details in §2 so nobody fixes the wrong
layer.

> **LIVE STATUS UPDATE 2026-06-14** (re-verified against the production backend with an
> authenticated HR session — read-only probes, with a control route to confirm real hits):
> **Bug #1 is now FIXED** (`overtimeHours` returned, e.g. `2.75`). **§3a copy-week and
> §3b recall have SHIPPED** to the backend (no longer `404` — routes validate / look up
> live; response bodies not yet exercised on prod). The only items still outstanding are
> **§3c** (submit-reminder job + `submitReminderDay`, confirmed absent from live settings)
> and the low-priority **§3d** nuance. Per-item banners below carry the detail.

---

## 1. BUG #1 — `GET /timesheets/summary` omits `overtimeHours` (BACKEND fix)

> ✅ **RESOLVED ON LIVE 2026-06-14.** `GET /timesheets/summary?range=30d` (authed HR)
> now returns `overtimeHours` as a top-level **number** (observed `2.75`), alongside
> `totalHours, billableHours, nonBillableHours, utilizationPct, byProject, byEmployee`.
> The Overtime card renders `2.75h`, not `undefinedh`. The FE `?? 0` stopgap is no longer
> load-bearing (fine to keep as defense). The original bug write-up is retained below for
> history.

### Severity

Medium — visible data defect on a reporting screen. No crash, no data loss, but the UI
renders the literal broken string **`undefinedh`** to HR/admin users.

### Where it shows

`Reports → Timesheets → Utilization` → the **Overtime** stat card.
Component: `src/modules/reports/components/TimesheetUtilizationReport.tsx:96`

```ts
{ label: 'Overtime', value: `${data.overtimeHours}h`, cls: 'text-warning' },
```

When `data.overtimeHours` is `undefined`, JS template-stringifies it to
`"undefined"`, so the card reads **`undefinedh`**.

### Endpoint

```
GET /api/v1/timesheets/summary?range=30d|90d&employeeId=<optional>
Role: MANAGER / HR_ADMIN / SUPER_ADMIN (approvers/admins)
```

### Actual live response (captured 2026-06-14)

```jsonc
{
  "success": true,
  "data": {
    "totalHours": 2643.5,
    "billableHours": 2234,
    "nonBillableHours": 409.5,
    "utilizationPct": 85,
    // ❌ overtimeHours is MISSING
    "byProject": [ { "projectId": "...", "projectName": "...", "hours": 1284, "billableHours": 1284 }, ... ],
    "byEmployee": [ { "employeeId": "...", "employeeName": "...", "hours": 180, "utilizationPct": 85 }, ... ]
  }
}
```

### Expected response (the agreed contract)

`overtimeHours` is a **required, top-level number**. It was always part of the
frontend contract and is present in the MSW mock — so with `USE_MOCKS=true` the card
renders correctly; the bug only appears against the live backend (classic
mock-vs-live drift).

- FE type: `src/modules/timesheets/types/timesheet.types.ts` → `TimesheetSummary.overtimeHours: number` (line 111)
- API contract: `docs/newreqphase3.md` Domain G.4, line ~2020:
  `{ totalHours, billableHours, nonBillableHours, overtimeHours, utilizationPct, byProject, byEmployee }`
- MSW reference impl: `src/mocks/handlers/timesheets.ts:537` (already computes & returns it)

```jsonc
{
  "success": true,
  "data": {
    "totalHours": 2643.5,
    "billableHours": 2234,
    "nonBillableHours": 409.5,
    "overtimeHours": 0,        // ✅ ADD THIS — number, never null/undefined; default 0
    "utilizationPct": 85,
    "byProject": [ ... ],
    "byEmployee": [ ... ]
  }
}
```

### How to fix (backend)

`overtimeHours` is **derived**, not stored. Compute it the same way the per-week
timesheet does, then sum across every timesheet in scope (range + optional
`employeeId`):

```
per_timesheet_overtime = max(0, timesheet.totalHours - timesheet.standardHours)
summary.overtimeHours  = round2( Σ per_timesheet_overtime  over all in-scope timesheets )
```

- `standardHours` is the tenant's configured standard week
  (`Settings → Timesheets → Standard week`, default 40), **not** a hardcoded 40 —
  read it from timesheet settings (per `docs/newreqphase3.md` G.4: _"overtimeHours is
  derived server-side: `max(0, totalHours − standardHours)`"_).
- Only count **submitted/approved** weeks if the existing aggregates
  (`totalHours`, `billableHours`) already do — keep `overtimeHours` consistent with
  the same scope as the other totals so the numbers reconcile.
- Always return a number. If there are zero timesheets, return `0` — never omit the
  key and never return `null`.

Reference implementation (TypeScript, from the MSW mock at
`src/mocks/handlers/timesheets.ts:537`):

```ts
const overtimeHours = round2(
  scopedTimesheets.reduce((acc, t) => acc + Math.max(0, t.totalHours - t.standardHours), 0),
);
```

### Acceptance test

1. `GET /timesheets/summary?range=30d` (HR token) → `data.overtimeHours` is present and
   is a `number`.
2. A tenant whose employees logged > standard-week hours returns `overtimeHours > 0`.
3. A tenant with no logged time returns `overtimeHours: 0` (not missing, not null).
4. In the app, `Reports → Timesheets → Utilization` → the **Overtime** card shows e.g.
   `0h` / `6h` — never `undefinedh`.

### Optional FE stopgap (until the backend ships)

Defensive one-liner so a missing field degrades to `0h` instead of `undefinedh`
(`TimesheetUtilizationReport.tsx:96`):

```ts
{ label: 'Overtime', value: `${data.overtimeHours ?? 0}h`, cls: 'text-warning' },
```

This is a band-aid — it hides the symptom but the real value is still absent until the
backend returns `overtimeHours`.

---

## 2. "No Create Task option" — investigated: NOT a backend bug

The UI lets you create a **project** ("New project" drawer) but offers **no way to
create a task** for a project. The `Select a task` dropdown in the _Log time_ dialog is
populated from existing tasks only; a freshly created project has none and the user is
stuck.

**Verified live on 2026-06-14 — the endpoint is fully functional:**

```
POST /api/v1/timesheets/projects/:projectId/tasks
Body:    { "name": "Regression Probe Task", "billable": true, "active": true }
Result:  201 Created
Response:{ "success": true, "data": { "id": "...", "tenantId": "...", "projectId": "...",
           "name": "Regression Probe Task", "billable": true, "active": true,
           "createdAt": "...", "updatedAt": "..." }, "meta": {} }
```

`GET /timesheets/projects/:id/tasks` also returns `200` (the tested project returned
`data: []` — zero tasks, confirming new projects start task-less).

**Conclusion: the backend is correct. This is a FRONTEND gap.**

- Service exists: `projectsApi.createTask` — `src/modules/timesheets/services/projects.api.ts:39`
- Hook exists: `useCreateTask` — `src/modules/timesheets/hooks/useProjects.ts:70`
  (exported from the module barrel)
- **But neither is wired into any component** — `grep` for `useCreateTask`/`createTask`
  across `*.tsx` returns nothing. The `ProjectDrawer` manages name/code/client/billable/
  rate/members but has **no task management UI**.

**Fix (frontend, separate task — do not touch the backend):** add task CRUD to the
project flow — e.g. a "Tasks" section in `ProjectDrawer` (or a tasks sub-panel on the
Projects tab) that lists `useTasks(projectId)` and lets an admin add/edit tasks via the
already-built `useCreateTask` / `updateTask`. No new endpoint needed.

> ✅ **RESOLVED 2026-06-14 (frontend).** Shipped as **M1** of the self-service overhaul:
> `ProjectTasksSection.tsx` (list / add / active-toggle, all four states) wired into
> `ProjectDrawer` edit mode, on the existing `useCreateTask` / `updateTask` hooks. No
> backend change was needed. Left here for history.

---

## 3. Backend endpoints for the self-service overhaul — live status (BACKEND)

The self-service / timer workflow overhaul (M1–M7) was built **frontend-first** and is
fully functional with `NEXT_PUBLIC_USE_MOCKS=true`. These pieces were originally `404` on
the backend; a **re-verification on 2026-06-14** (authed HR session, read-only probes,
control route) found that **§3a copy-week and §3b recall have since SHIPPED** — only
**§3c** remains genuinely unbuilt, plus the **§3d** nuance. The authoritative contract is
`docs/newreqphase3.md` **Domain G.7 / G.8**; reference MSW implementations live in
`src/mocks/handlers/timesheets.ts`. Field casing is camelCase; envelope is the standard
`{ success, data, meta }`.

### 3a. `POST /timesheets/copy-week` (M5 — copy last week) — ✅ **SHIPPED (live)**

> ✅ **LIVE 2026-06-14.** Route is deployed — an authed `POST` with an empty body returns
> `422 VALIDATION_ERROR` (not the `404 "Route … not found"` a missing route gives). The
> **happy-path response body is not yet verified** (running it mutates prod data); confirm
> `meta.copied` + `hours: 0` rows on a non-prod tenant. Contract below stands as the spec.

```
POST /api/v1/timesheets/copy-week
Role: timesheets:write (own week)
Body:    { "fromWeekStart": "2026-06-01", "toWeekStart": "2026-06-08", "withNotes": false }
Returns: 201 → Timesheet (the target week), meta.copied = number of rows copied
```

- Copies each **unique `project`/`task` row** from the source week into the target week
  with **`hours: 0`** (the user then fills the numbers — Harvest behavior).
- **Idempotent:** skip any row the target week already has.
- `withNotes` (default `false`) carries the source entries' notes.
- `422 WEEK_LOCKED` if the target week is not `DRAFT`/`REJECTED`.

### 3b. `POST /timesheets/:id/recall` (M6 — employee recall/unsubmit) — ✅ **SHIPPED (live)**

> ✅ **LIVE 2026-06-14.** Route is deployed — an authed `POST` to a non-existent id returns
> `404 NOT_FOUND "Timesheet not found"` (it reached the lookup logic), distinct from the
> `404 "Route … not found"` a missing route gives. The **owner-only / state-machine
> behavior** (`SUBMITTED → DRAFT`, `422 NOT_RECALLABLE` on a non-`SUBMITTED` week) is not
> yet exercised on prod (mutating); verify on a non-prod tenant. Contract below stands.

```
POST /api/v1/timesheets/:id/recall
Role: timesheets:write — OWNER ONLY (the employee who submitted)
Body:    none
Returns: 200 → Timesheet (SUBMITTED → DRAFT; clears submittedAt + decision fields)
```

- `404` if the timesheet doesn't exist.
- `422 NOT_RECALLABLE` if the week isn't `SUBMITTED` (cannot recall an already
  `APPROVED`/`REJECTED` week).

### 3c. Submit reminders — email/push job (M7) — ❌ **still not built (live-confirmed)**

> ❌ **Confirmed outstanding 2026-06-14.** `GET /timesheets/settings` (live) returns
> `standardWeeklyHours, overtimeThresholdHours, roundingMinutes, approvalRequired,
> unloggedHoursPolicy, billableDefault` — **no `submitReminderDay`** (and no
> `requireTaskOnEntry`). The scheduled email/push job does not exist. This is the one real
> remaining backend ask in §3.

The **in-app** nudge banner is already shipped (FE-only, no endpoint). What's missing is
a **scheduled backend job** that emails/pushes:

- employees with an unsubmitted `DRAFT`/`REJECTED` prior week near the period cutoff, and
- managers with pending approvals.

Add a `submitReminderDay` knob to `TimesheetSettings` (`GET`/`PATCH /timesheets/settings`)
when implemented. No further frontend work until the backend exposes it.

### 3d. (nuance, not a blocker) `POST /timesheets/entries` 500s on `taskId: null` (M2)

The Hybrid model makes **`taskId` optional** — an entry may log against a project with no
task. The FE already works around the backend by **omitting** the `taskId` key when there
is no task (sending an explicit `taskId: null` returns a live **`500`** — a null FK). That
keeps the app working, but ideally the backend should **accept `taskId: null`/absent**
gracefully (store `null`, return `taskId: null` on reads) rather than 500. Low priority —
the omit-the-key contract is documented in Domain G.2 and the FE honors it.

---

## Summary

> Status column reflects **live re-verification on 2026-06-14** (authed HR, read-only).

| #   | Issue                                                                 | Layer        | Status                            | Action                                               |
| --- | --------------------------------------------------------------------- | ------------ | --------------------------------- | ---------------------------------------------------- |
| 1   | `GET /timesheets/summary` missing `overtimeHours` → `undefinedh` card | **Backend**  | ✅ Fixed live (`overtimeHours` #)  | Done — verified `2.75` returned (§1)                 |
| 2   | No Create-Task UI                                                     | **Frontend** | ✅ Resolved (M1 shipped)           | Done — `ProjectTasksSection` in `ProjectDrawer` (§2) |
| 3a  | `POST /timesheets/copy-week` (copy last week)                         | **Backend**  | ✅ Shipped live (body unverified)  | Verify happy-path on non-prod tenant (§3a)           |
| 3b  | `POST /timesheets/:id/recall` (employee recall)                       | **Backend**  | ✅ Shipped live (body unverified)  | Verify state-machine on non-prod tenant (§3b)        |
| 3c  | Submit-reminder email/push job + `submitReminderDay`                  | **Backend**  | ❌ Not built (live-confirmed)      | Scheduled job per Domain G.8 (§3c)                   |
| 3d  | `POST /timesheets/entries` 500s on `taskId: null`                     | **Backend**  | ⏸️ Unverified (mutating)          | Tolerate null/absent `taskId` — low priority (§3d)   |
