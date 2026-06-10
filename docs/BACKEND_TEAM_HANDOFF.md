# Backend Team — Handoff (from the Frontend QA sweep)

> **From:** Frontend team · **Date:** 2026-06-10
> **Source:** a screen-by-screen QA sweep of the whole app, driven against the **live
> production backend** (`https://employee-management-system-2b9q.onrender.com/api/v1`)
> with **mocks OFF**, as all four seed roles (SUPER_ADMIN / HR_ADMIN / MANAGER / EMPLOYEE).
> Every item below is a **backend-side** issue (or a docs drift). Frontend-side bugs found
> in the same sweep are already fixed and are **not** in this list.
>
> Full QA log (for context): `docs/testing/SCREEN_SWEEP.md` §6B/§6C.
> Frontend→backend endpoint requests & shapes: `docs/BACKEND_API_REQUESTS.md`.

Each row says whether the frontend has a **workaround** in place. "Yes" means the feature
works today despite the bug; "No / needs backend" means the feature is **blocked or
degraded** until you fix it.

---

## Priority summary

| Priority             | Items                                                                                      | Why                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **P1 — fix first**   | **BE-9** (reports export unusable), **BE-2** (payroll write 500s without input validation) | A user-facing feature is broken end-to-end / a write 500s.                     |
| **P2 — should fix**  | **BE-1**, **BE-5**, **BE-7**, **BE-10**                                                    | Wrong status code, role inconsistencies, a created role loses its permissions. |
| **P3 — nice to fix** | **BE-3**, **BE-4**, **BE-6**, **BE-8**, **BE-11**                                          | Edge cases / cosmetic response-shape gaps.                                     |
| **Feature request**  | Analytics filter params                                                                    | New optional query params the FE already sends (see end).                      |

---

## P1 — fix first

### BE-9 · `POST /reports/export` — async job started, but no way to retrieve it

- **Problem:** the export endpoint went **async** — it returns `202 { jobId, status:"PENDING", message:"Use /export/:job_id/download once ready." }` — but the **download/status routes don't exist**. `GET /reports/export/:jobId/download`, `…/:jobId`, `…/:jobId/status`, and `/export/:jobId/*` **all 404**. So a report export can be **queued but never downloaded** — the feature is unusable end-to-end.
- **Expected:** implement the job **status** + **download** routes. Return the generated file as `text/csv` (with `Content-Disposition`) once the job is ready.
- **Repro:** as HR → `POST /reports/export {reportType, format:"CSV"}` → `202 {jobId}`; then `GET /reports/export/:jobId/download` → **404** (every status-path variant 404s too).
- **FE status:** **Ready & waiting.** The FE already queues the job and polls `GET /reports/export/:jobId/download`; it works the moment that route returns a file. No FE change needed.

### BE-2 · `POST` / `PATCH /payroll/groups` — 500 on a `null` component override (no input validation)

- **Problem:** **`500 INTERNAL_ERROR`** (`prisma.payGroup.create()` invalid invocation) when a component override field is `null` — the backend coerces `null → ""`/`0` and feeds it to a Prisma **enum** column **without validating the body**.
- **Expected:** validate/normalise the request body; accept omitted/`null` override fields and store `NULL` instead of 500ing. (Likely affects other write endpoints too — worth an input-validation pass.)
- **Repro:** `POST /payroll/groups` with `components:[{ componentId, overrideCalculationType:null, … }]` → **500**; with `{ componentId }` only → **201**.
- **FE status:** Worked around (FE omits null override fields) — but the **missing input validation is still a backend risk** elsewhere.

---

## P2 — should fix

### BE-1 · `GET /auth/me` (and tenant-scoped routes) — returns `400 INVALID_TENANT` instead of `401`

- **Problem:** when the access token is **missing or expired**, these return **`400 INVALID_TENANT`** instead of `401`. Causes a red console error on **every** page load and would break standard silent-refresh logic.
- **Expected:** return **`401 Unauthorized`** for absent/expired/invalid tokens; reserve `400 INVALID_TENANT` for a genuinely bad tenant.
- **Repro:** `GET /auth/me` with no cookie → `400 {code:INVALID_TENANT}`; with a garbage token → same `400`; with a valid cookie → `200`.
- **FE status:** Worked around (interceptor treats `400 INVALID_TENANT` like `401`). Still noisy — please fix server-side so the workaround can be removed.

### BE-5 · `GET /leave/team/requests`, `GET /leave/team/calendar` — `400 NO_EMPLOYEE_ID` for SUPER_ADMIN

- **Problem:** these are employee-scoped and **SUPER_ADMIN has no employee profile** (`employeeId: null`), so they return **`400 NO_EMPLOYEE_ID`** ("User does not have an employee profile"). SUPER_ADMIN's Leave **Approvals + Team Calendar** tabs show an error. **Inconsistent:** `GET /manager/approvals` **does** work for SUPER_ADMIN (200).
- **Expected:** either support a profile-less SUPER_ADMIN on these endpoints (return all/empty like `/manager/approvals`), **or** confirm SUPER_ADMIN isn't meant to use them (then the FE will hide those tabs).
- **Repro:** as SUPER_ADMIN: `GET /leave/team/requests` → `400 {code:NO_EMPLOYEE_ID}`; `GET /leave/team/calendar` → same. As HR/MANAGER (have a profile) → 200.
- **FE status:** Pending your decision (error state renders, no crash).

### BE-7 · `POST /payroll/runs/:id/cancel` — requires SUPER_ADMIN, rest of the run lifecycle allows HR_ADMIN

- **Problem:** initiate / approve / mark-paid / publish are all allowed for **HR_ADMIN**, but **cancel requires SUPER_ADMIN** → HR clicking "Cancel Run" gets **403**.
- **Expected:** decide the intended role. If HR may cancel (e.g. before approval), relax to HR_ADMIN; else confirm super-admin-only.
- **Repro:** as HR: `POST /payroll/runs/:id/cancel {reason}` → `403 {requiredRoles:["SUPER_ADMIN"], userRole:"HR_ADMIN"}`.
- **FE status:** FE currently gates the Cancel button to SUPER_ADMIN to match the backend. If you relax it, the FE gate relaxes too.

### BE-10 · `POST /settings/roles` — silently DROPS the `permissions` field

- **Problem:** the create body is `{ name, key, permissions[] }` and returns `201`, but the role is created with **`[]` permissions** (the selected perms are ignored), and the `201` response body **omits `permissions`**. So a custom role created with permissions ends up with **none**.
- **Expected:** persist the `permissions[]` sent on create (and echo them in the response) so a role is created with its intended access in one call.
- **Repro:** as SUPER_ADMIN → `POST /settings/roles {name,key,permissions:["employees:read","leave:approve"]}` → `201` (no `permissions` in the body); then `GET /settings/roles-permissions` → `matrix[key]` is **`[]`**.
- **FE status:** **No workaround (by the team's choice — we're waiting for this fix).** The FE still **sends** `permissions` in the POST, so it works the moment you persist them. Until then, an admin must grant the role's access via the permissions matrix + Save (that `PATCH /settings/roles-permissions` **does** persist, including for custom keys).

---

## P3 — nice to fix

### BE-3 · `GET /employees/:id` after Terminate → `404`

- **Problem:** a terminated (soft-deleted, `employmentStatus=TERMINATED`) employee returns **`404 NOT_FOUND`** from `GET /employees/:id`, so their profile is **inaccessible** — HR can't view or **reverse** a termination from the UI (the terminate dialog promises "can be reversed by an administrator").
- **Expected:** keep terminated employees retrievable via `GET /employees/:id`, or expose a documented `?includeTerminated=true`.
- **Repro:** create → `DELETE /employees/:id` (200, status→TERMINATED) → `GET /employees/:id` → **404**.

### BE-4 · Payroll salary history / effective-dating looks off

- **Problem:** salary-history rows come back with **`effectiveTo` _before_ `effectiveFrom`** and **duplicate same-day records** after re-assignments. Suggests effective-dating/overlap handling is wrong — payroll date math can't be fully trusted.
- **Expected:** ordered ranges (`effectiveFrom ≤ effectiveTo`); superseding an assignment should close the prior range without dupes.
- **Repro:** re-assign an employee's pay group on the same day; inspect `GET /payroll/employees/:id/salary` → `history[]`.

### BE-6 · `PATCH /leave/requests/:id/{approve,reject}` — response omits `approverComment`

- **Problem:** the approve/reject **response body omits `approverComment`** even when the value was accepted and **persisted** (a follow-up `GET /leave/requests` shows it). Misleading — looks like the comment was dropped.
- **Expected:** echo the saved `approverComment` in the approve/reject response, matching the `LeaveRequest` shape from `GET`.
- **Repro:** reject with `{approverComment:"X"}` → 200, response `approverComment: undefined`; then `GET /leave/requests` → `approverComment: "X"`.

### BE-8 · `GET /payroll/payslip-templates` — HR-only, but self-service payslips need it

- **Problem:** HR-only, but the self-service **my-payslips** page needs the template to render an employee's own payslip → **403** for MANAGER/EMPLOYEE.
- **Expected:** expose a read-only payslip template to self-service users (or a dedicated `…/self` endpoint) so self-service payslips render with the configured layout.
- **Repro:** as an EMPLOYEE/MANAGER on `/payroll/my-payslips`: `GET /payroll/payslip-templates` → 403.
- **FE status:** FE currently **skips** this fetch for self-service roles (so no 403 spam); the self-service payslip just doesn't use the configured template until you expose one.

### BE-11 · `GET /settings/roles-permissions` — omits created custom roles from `customRoles[]`

- **Problem:** after `POST /settings/roles`, the new key appears in `data.roles[]` and `data.matrix`, but `data.customRoles` is **`undefined`/empty** — so a client can't tell the role is custom (no friendly name).
- **Expected:** return every non-built-in role in `customRoles[] = [{ key, name }]`.
- **Repro:** create a role → `GET /settings/roles-permissions` → `roles` includes the key but `customRoles` is `undefined`; `matrix[key]` is present.
- **FE status:** Worked around (FE derives "is custom" from the known built-in set, so the delete button/badge still work). The custom role's **friendly name** stays degraded to its raw key after a refresh until you return `customRoles[]`.

---

## Feature request — Analytics filter parameters (optional query params)

The Analytics screen's filter bar (department dropdown + custom date range) now **sends**
`departmentId` and `from`/`to` to the live analytics endpoints. The backend currently
**accepts and ignores** them (verified — still `200`), so the FE ships with no risk; the
filters start working the moment you honour the params, with **zero FE change**.

**Two optional params** (both omittable; omitting yields today's unfiltered result):

| Param          | Type                    | Meaning                                                                                     |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `departmentId` | `string`                | Scope the metric to a single department (the `id` from `GET /departments`).                 |
| `from` + `to`  | `string` (`YYYY-MM-DD`) | Custom date window. When **both** are present they take precedence over any preset `range`. |

**Which endpoint receives which param (exactly what the FE sends today):**

| Endpoint                                 | `departmentId` | date window                                  |
| ---------------------------------------- | :------------: | -------------------------------------------- |
| `GET /analytics/summary`                 |       ✅       | `range` **or** `from`+`to`                   |
| `GET /analytics/attendance`              |       ✅       | `range` **or** `from`+`to` (overrides range) |
| `GET /analytics/leave-summary`           |       ✅       | `range` (default `30d`) **or** `from`+`to`   |
| `GET /analytics/headcount-by-department` |       ✅       | — (point-in-time; no date window)            |
| `GET /analytics/recent-activity`         |       ✅       | — (uses `limit` only)                        |
| `GET /analytics/workforce-trend`         |       ✅       | own `range` (`6m\|12m\|2y`) — unchanged      |
| `GET /analytics/attrition`               |       ✅       | own `range` (`6m\|12m\|2y`) — unchanged      |
| `GET /analytics/payroll-cost`            |       ✅       | own `range` (`6m\|12m`) — unchanged          |
| `GET /analytics/department-performance`  |       ✅       | own `range` (`30d\|90d`) — unchanged         |

**Contract requirements:**

1. **Response shape is unchanged** — same envelope/fields as today; only the rows are filtered to the requested department / window.
2. **Backward compatible** — when `departmentId`/`from`/`to` are absent, return the current org-wide result (the Dashboard widgets call these with no filters and must keep working).
3. **Do not 400 on these params** (you don't today — please keep it that way).
4. `departmentId` should match the department `id` issued by `GET /departments`.
5. Filtering `headcount-by-department` by `departmentId` should return just that department's row(s) (a single-slice breakdown is acceptable).

Examples the FE issues:

```
GET /analytics/summary?range=30d&departmentId=cmq6w2fct001g19wgvelknhcm
GET /analytics/attendance?from=2026-03-01&to=2026-05-31&departmentId=cmq6w2...
GET /analytics/workforce-trend?range=6m&departmentId=cmq6w2...
```

_(This same contract also lives in `docs/BACKEND_API_REQUESTS.md` — keep the two in sync.)_

---

## Docs drift to confirm (not bugs — just so our docs agree)

- **Leave actions are `PATCH`, not `POST`** — `PATCH /leave/requests/:id/{approve,reject,withdraw}` is what's live and correct (`CLAUDE.md §3` / `BACKEND_API_REQUESTS.md` list them as `POST`).
- **Timesheets are LIVE** — `GET /timesheets`, `/timesheets/entries`, `/timesheets/:id/{submit,approve,reject}`, `/timesheets/approvals`, `/timesheets/projects(/:id/tasks)`, `/timesheets/settings`, `/timesheets/summary` all answer from the real backend (our docs §27 still said "MSW-backed").
- **Custom-role endpoints are LIVE** — `POST /settings/roles` (`201`) and `DELETE /settings/roles/:key` (`200 {key,status:"deleted"}`) are live and verified.
- **`POST /timesheets/:id/submit` 400s on an empty body** — minor inconsistency: other action routes (`/auth/logout`, `PATCH …/withdraw`) tolerate an empty body and return `200`; `submit` requires a non-empty JSON body. Consider making action endpoints tolerate an empty body for consistency. (FE now always sends `{}`.)
