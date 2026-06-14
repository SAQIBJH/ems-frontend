# Timesheets — Frontend: what's left

> **Source of truth: live API, not docs.** Compiled 2026-06-15 from a read-only
> authenticated sweep (`hr@acme.test`) of the production backend, plus the state of
> branch `feat/timesheet-selfservice-overhaul` (PR #1). Mutating paths were **not** run
> against prod (deferred). Companion file: `BACKEND_REMAINING.md`.

## Status in one line

The self-service overhaul (M1–M7) and the post-backend FE integration are **built,
gate-green, and pushed to PR #1**. What's left is one verification pass, one shape
confirmation, a merge, and explicitly-deferred accelerators.

## Done (no action)

- M1 task CRUD UI · M2 task-optional (Hybrid) · M3 timer stop-confirm + backfill ·
  M4 read-only locked weeks + persistent "Log time" · M5 copy-week button · M6 recall ·
  M7 instant in-page reminder banner.
- Settings surface for `submitReminderDay` + `requireTaskOnEntry` (types, schema, panel
  UI, MSW parity) — `GET /timesheets/settings` live-confirmed to return both fields.
- `requireTaskOnEntry` enforcement: server `422 TASK_REQUIRED` mapped inline for **all**
  roles; admins also get upfront UX (no "No task", required marker, timer gated).
- Hybrid reminder integration: `NotificationBell` recognises the two reminder types and
  deep-links; `WeeklyGrid` honors a `?week=` deep-link.
- MSW entry lock code reverted to `WEEK_LOCKED` (parity with reference + aligned backend).

## Remaining FE work

### 1. The authorized live-verify pass — ✅ DONE (2026-06-15, all green)

Ran once, self-cleaning, on a throwaway future week (`2027-01-04`) against live. Every
assertion passed and all created data was deleted (`requireTaskOnEntry` reverted to
`false`):

- **Lock code** — no-op `PATCH` on a `SUBMITTED` entry → `422` **`WEEK_LOCKED`** ✅
  (confirms the value; the `TIMESHEET_LOCKED` doc was stale).
- **`taskId:null`** — `POST /entries` `taskId:null` → `201`, stored `null` (no 500) ✅
- **`TASK_REQUIRED`** — `requireTaskOnEntry:true` → no-task `POST` → `422 TASK_REQUIRED`
  → reverted ✅
- **copy-week** — `201`, `meta.copied=1`, rows `hours:0`; re-run `copied=0` (idempotent) ✅
- **recall** — `200 SUBMITTED→DRAFT`; re-call → `422 NOT_RECALLABLE` ✅

**The self-service contract is live-verified end-to-end. PR #1 is ready to merge.**

### 2. Reminder notification shape — confirm (defensive code already shipped)

The bell renders the two reminder types defensively (`body || message`, deep-link via
`actionUrl` else derived from `metadata.weekStart`). The **actual payload is unverified**
— reminders are cron-gated and `submitReminderDay` is currently `null`, so none exist to
observe. Confirm the field names + whether `actionUrl` is set once a real reminder fires
(or inject one). Depends on `BACKEND_REMAINING.md` §1.

### 3. Upfront task-required for employees — blocked on backend

`GET /timesheets/settings` is HR-only (employees `403`), so the employee entry UI can't
show "task required" until submit (server `422` catches it). When the backend exposes
`requireTaskOnEntry` to non-admin roles (`BACKEND_REMAINING.md` §2), wire upfront
enforcement for employees the same way it works for admins today.

## Deferred (explicitly out of this pass)

- **Tier 1 accelerator** — inline keyboard multi-day grid fill (type hours across Mon–Sun,
  Tab/Enter/ESC). Biggest UX gap vs top players; risky `WeeklyGrid` rewrite. Decide if
  in-scope for launch.
- **Tier 3 / roadmap** — favorites / "continue last entry", calendar drag-to-create,
  recurring weekly templates.
- **SSE** — not wired; the 30s notifications poll covers the reminder refresh signal.

## Out of scope (not doing)

Native mobile, offline, idle/activity tracking, changing the approval model or the
payroll-OT import contract.
