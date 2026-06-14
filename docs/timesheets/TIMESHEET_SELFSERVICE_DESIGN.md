# Timesheets — Self-Service Entry & Timer Workflow Redesign

> **Status:** DESIGN — awaiting approval. No code until signed off.
> **Author:** prepared 2026-06-14 from a live in-browser regression + cited competitive research.
> **Related:** `backendtimesheetbug.md`, memory `timesheet-workflow-overhaul-initiative`,
> `docs/newreqphase3.md` Domain G (timesheets contract), CLAUDE.md §27.

---

## 1. Goal

Fix the **broken timer/entry workflow** and make **employee self-service timesheet
filling** match industry table-stakes, without breaking the existing approve/reject
lifecycle or the payroll-overtime integration.

Two user asks this serves:

1. _"If I select a project + task then Start — what does it do? The workflow is broken."_
2. _"Users should be able to fill their own timesheet themselves."_

---

## 2. Competitive grounding (verified)

From cited research (Toggl/Harvest/Rippling/Zoho support docs; verification vote phase
was cut short by a rate limit but the **sourced claims stand**):

| Behavior                                           | Toggl                    | Clockify | Harvest                           | Zoho/Rippling  | Verdict          |
| -------------------------------------------------- | ------------------------ | -------- | --------------------------------- | -------------- | ---------------- |
| Start timer with **no project/task**, assign later | ✅                       | ✅       | ❌ (needs project+task)           | —              | **Common**       |
| Log against project with **task optional**         | ✅ (tasks paid/optional) | ✅       | ❌                                | mixed          | **Common**       |
| **Backfill** arbitrary past days                   | ✅                       | ✅       | ✅ (unless locked)                | ✅             | **Table-stakes** |
| Stopped entry **fully editable**                   | ✅                       | ✅       | ✅ (autosave)                     | ✅             | **Table-stakes** |
| **Copy previous week** / duplicate timesheet       | ✅                       | ✅       | ✅ ("copy rows from most recent") | ✅             | **Table-stakes** |
| Employee **recall/unsubmit** before approval       | ✅                       | ✅       | ✅                                | ✅             | **Table-stakes** |
| Submit **reminders**                               | ✅                       | ✅       | ✅                                | ✅ (automated) | **Table-stakes** |
| Keyboard grid entry (N / Tab / ESC)                | ✅                       | ✅       | ✅                                | —              | Common           |
| Favorites / "continue" prior entry                 | ✅                       | ✅       | ✅ (persisted rows)               | —              | Nice-to-have     |

**Key insight:** No mainstream tool ships a timer that _requires_ a task while giving
_no way to create one_. That exact combination is our core defect.

---

## 3. Current state (what we have / what's broken)

**Have (keep):** weekly grid (Project/Task × Mon–Sun) with inline cell edit + notes;
`DRAFT/SUBMITTED/APPROVED/REJECTED` lifecycle; manager approve / **reject-with-reason**;
settings (standard week, OT threshold, rounding, unlogged-hours policy, require-approval);
utilization report; payroll OT import (Step T6).

**Broken / missing (verified live):**

| #   | Defect                                                                                                                                                   | Evidence                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| B1  | **Timer dead-ends on task-less projects** — Start hard-disabled unless project **and** task chosen (`TimerBar.tsx:228`), but most projects have no tasks | live: picked "Test" project → no task → Start stayed disabled |
| B2  | **No UI to create a task** — `useCreateTask`/`createTask` exist, wired to nothing; endpoint live (201)                                                   | `backendtimesheetbug.md` §2                                   |
| B3  | **Timer only logs to today/current week** — `date: today` hardcoded (`TimerBar.tsx:117`)                                                                 | code                                                          |
| B4  | **Stopped timer entry is not reviewable** — posts straight through, no edit/confirm                                                                      | code                                                          |
| B5  | **Self-entry is state-fragile** — "Log time" only renders on an editable week; locked/approved week shows no entry affordance                            | live: employee on Approved week had no Log-time button        |
| B6  | **No copy-previous-week**                                                                                                                                | grep: none                                                    |
| B7  | **No employee recall/unsubmit** — once `SUBMITTED`, only a manager Return reopens                                                                        | code                                                          |
| B8  | **No submit reminders**                                                                                                                                  | grep: none                                                    |

---

## 4. The one decision that shapes everything — TIMER & TASK model

**Question:** do we go _timer-first / task-optional_ (Toggl/Clockify) or _structured /
task-required_ (Harvest)?

**Recommendation — Hybrid (task OPTIONAL + creatable):**

- **Task becomes optional.** You can log/timer against a **project alone**. If a project
  has tasks, you may pick one; if it has none, you log to the project directly. This
  instantly un-breaks B1 with zero dependency on seeding tasks.
- **Tasks are also creatable** (B2) for teams that want the structure — admins on the
  Projects tab, and optionally inline "+ New task" in the entry/timer for `:admin`.

Why hybrid over either pure model: it matches our existing structured schema (we keep
`taskId`, just nullable), fixes the dead-end immediately, and lets structure-loving
tenants still enforce tasks later via a setting (`requireTaskOnEntry`, default `false`).

> ⛔ **This is the call I need from you.** Everything below assumes **Hybrid**. If you
> prefer "task always required," we instead make task-creation mandatory-and-prominent
> and skip the nullable-task change.

---

## 5. Scope — prioritized

### MUST-HAVE (the redesign)

**M1 — Task creation + management UI** (fixes B2)

- Add a **Tasks** section to `ProjectDrawer` (and/or a tasks sub-row on the Projects
  tab): list `useTasks(projectId)`, add via existing `useCreateTask`, toggle active via
  `updateTask`. `timesheets:admin` only.
- Endpoints already LIVE (`POST /timesheets/projects/:id/tasks` 201, `PATCH /tasks/:id` 200).

**M2 — Task optional** (fixes B1)

- `taskId` nullable on `TimeEntry` / `TimeEntryInput`; entry POST accepts missing task.
- Timer **Start** enabled with a project only; Task select shows "No task" + any tasks.
- Grid rows render task line as "—" when null.
- New tenant setting `requireTaskOnEntry` (default `false`) gates whether task is forced.

**M3 — Timer rework** (fixes B3, B4)

- On **Stop**, open a **confirm/edit dialog** (reuse `TimeEntryDialog`) pre-filled with
  project / task / **date (defaults today, editable)** / hours (from elapsed, editable) /
  billable / note → user confirms → POST. Discard still available.
- Allows backfill (pick any day) and correction before the entry is created.
- Keep the "no double-count" guarantee (timer holds no hours of its own).

**M4 — Robust self-service entry surface** (fixes B5)

- Entry is **always discoverable on an editable week**: a persistent "Add row" / "Log
  time" affordance in the grid header (not only the empty state).
- **Add row** = choose project (+ optional task) → a new grid row you can fill across
  **multiple days inline** (type hours per day), with a note per cell. Keyboard: Tab
  across days, Enter to commit, ESC to cancel (Harvest-style).
- **Locked/approved week** = explicit read-only banner ("This week was approved on … —
  read only"), no dead controls.

**M5 — Copy previous week** (fixes B6)

- Header action "Copy last week" → clones the prior week's **rows** (project/task pairs,
  billable) into the current DRAFT week with **zero hours** (Harvest behavior), so the
  user just fills numbers. Confirm dialog; no-op if current week not editable.

**M6 — Employee recall / unsubmit** (fixes B7)

- New `POST /timesheets/:id/recall` (owner only, `SUBMITTED → DRAFT`, blocked once
  `APPROVED`). Surface a "Recall" button on the submit bar while `SUBMITTED`.

**M7 — Submit reminders** (fixes B8) — _partial FE, backend-dependent_

- FE: a dismissible nudge banner on the dashboard `MyTimesheetCard` + Timesheets page
  when the current/last week is `DRAFT` past a cutoff (config: `submitReminderDay`).
- True email/push reminders are a **backend** job — documented as a backend request; FE
  ships the in-app nudge now.

### NICE-TO-HAVE (deferred unless you want them in-scope)

- Favorites / recents / "continue last entry" one-tap resume.
- Calendar / drag-to-create entry view.
- Templates (recurring weekly structure).
- Idle detection / desktop app / Pomodoro (out of scope for HR SaaS).

---

## 6. API & contract changes (frontend-first, §22)

Document in `docs/newreqphase3.md` Domain G **before** wiring; MSW handler in
`src/mocks/handlers/timesheets.ts`; types mirror. Live-transition = flip mocks off.

| Change              | Endpoint                                                                                     | Status                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| M1 task CRUD        | `POST /timesheets/projects/:id/tasks`, `PATCH /timesheets/tasks/:id`                         | **LIVE** — UI only                                                             |
| M2 task optional    | `POST/PATCH /timesheets/entries` accept null `taskId`; `TimeEntry.taskId: string \| null`    | contract change → MSW-first, then backend                                      |
| M5 copy week        | `POST /timesheets/copy-week` body `{ fromWeekStart, toWeekStart, withNotes? }` → `Timesheet` | NEW → MSW-first (FE can also do client-side via existing GET+POST as fallback) |
| M6 recall           | `POST /timesheets/:id/recall` → `Timesheet` (`SUBMITTED → DRAFT`, owner only)                | NEW → MSW-first                                                                |
| M2 setting          | `requireTaskOnEntry: boolean` on timesheet settings                                          | extend existing settings                                                       |
| M7 reminder setting | `submitReminderDay` on timesheet settings; email job                                         | setting MSW-first; email = backend request                                     |

**Type changes** (`timesheet.types.ts`): `TimeEntry.taskId` and `TimeEntryInput.taskId`
→ `string | null`; add `requireTaskOnEntry`, `submitReminderDay` to `TimesheetSettings`.

---

## 7. Screen-by-screen (against existing engines)

- **`ProjectDrawer`** → add a **Tasks** subsection (list + add + active toggle). Reuse
  `Input`, `Switch`, shadcn primitives; destructive/remove in `text-danger` (per memory).
- **`TimerBar`** → Task select gains a "No task" option; Start enabled on project-only;
  Stop opens **`TimeEntryDialog`** in confirm mode (date/hours editable).
- **`WeeklyGrid`** → persistent header actions: **Add row**, **Copy last week**; inline
  multi-day fill; explicit read-only state when locked; keyboard nav.
- **`TimeEntryDialog`** → support null task ("No task"); used as the timer-stop confirm.
- **`TimesheetSubmitBar`** → **Recall** button while `SUBMITTED` (owner).
- **`MyTimesheetCard`** (dashboard) + Timesheets page → reminder nudge banner.
- **`TimesheetSettingsPanel`** → `requireTaskOnEntry`, `submitReminderDay` controls.

All per CLAUDE.md: four states (loading/empty/error/success §13), tokens only (§12),
dark mode + responsive (§15), permission gates (§10), never a native `<select>`, no `any`.

---

## 8. Suggested build phasing (each = build → typecheck/lint/test → commit → stop)

1. **TS-A — Task management UI** (M1). Endpoints live; smallest, unblocks everything.
2. **TS-B — Task optional** (M2): nullable task across types/MSW/grid/timer + setting.
3. **TS-C — Timer rework** (M3, M4): stop-confirm dialog, backfill, always-on Add row,
   read-only locked state, keyboard.
4. **TS-D — Copy last week** (M5).
5. **TS-E — Recall** (M6).
6. **TS-F — Reminders** (M7, in-app nudge; backend email documented).

Tests: extend the rollup/calculation test file where entry/optional-task math changes.

---

## 9. Out of scope / explicitly NOT doing now

- Native mobile app, offline mode, idle detection, screenshots/activity tracking.
- Changing the approval model or payroll OT import contract.
- The `overtimeHours` backend summary bug — tracked separately in `backendtimesheetbug.md`.

---

## 10. Open questions for sign-off

1. **Timer/task model — Hybrid (task optional + creatable)?** ← primary decision (§4).
2. Copy-week: dedicated endpoint vs client-side compose (I lean endpoint for atomicity).
3. Reminders: ship in-app nudge now + file backend email request — OK?
4. Build all six phases, or a subset first (e.g. M1–M4 = the "fix broken workflow", defer
   M5–M7)?
