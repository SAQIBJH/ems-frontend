# Backend Fix Report — Live Verification

> **Date:** 2026-06-10 · **Method:** verified each claim **against the live backend**
> (mocks OFF) as the real seed roles — not from the report text. Source of the claims:
> `docs/BACKEND_TEAM_HANDOFF_FIX_REPORT.md`.
> **Verdict: ALL 12 verified fixed ✅.** _(Updated 2026-06-10 — BE-1's 2nd patch
> verified: every bad/missing-auth case on `/auth/me` now returns `401`, via the BFF and
> direct to the deployed backend. The FE `400 INVALID_TENANT`→401 workaround is now dead
> code and can be removed.)_

---

## Scorecard

| ID    | Claim                                          | Live result                                                                                                                                                                       | Verdict                      |
| ----- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| BE-1  | Expired JWT → 401 not 400                      | **2nd patch verified:** no-cookie → **401 UNAUTHORIZED**, garbage cookie/Bearer → **401 INVALID_TOKEN**, decodable bad JWT → **401** — all via BFF + direct; valid login → 200 ✅ | ✅ **FIXED**                 |
| BE-2  | PayGroup null override no longer 500           | Full valid body + `null` override → **201** ✅; invalid (`"BOGUS"`) → **400 VALIDATION_ERROR** (not 500) ✅                                                                       | ✅ FIXED                     |
| BE-3  | Terminated employee retrievable                | `DELETE` → 200; `GET /:id` → **404**; `GET /:id?includeTerminated=true` → **200 TERMINATED** ✅                                                                                   | ✅ FIXED                     |
| BE-4  | Salary `effectiveFrom > effectiveTo` validated | valid dates → 201; `from>to` → **400 VALIDATION_ERROR** (not persisted) ✅                                                                                                        | ✅ FIXED                     |
| BE-5  | SUPER_ADMIN leave-team org-wide                | SUPER `/leave/team/requests` → **200**, `/leave/team/calendar` → **200**; EMPLOYEE → **403** ✅                                                                                   | ✅ FIXED                     |
| BE-6  | `approverComment` echoed in approve/reject     | reject response body now contains `approverComment` (verified value round-trips) ✅                                                                                               | ✅ FIXED                     |
| BE-7  | HR_ADMIN can cancel non-PAID runs              | HR create run → 201; HR `…/cancel` → **200 CANCELLED** ✅                                                                                                                         | ✅ FIXED                     |
| BE-8  | Payslip templates for self-service             | EMPLOYEE + MANAGER `GET /payroll/payslip-templates` → **200** ✅                                                                                                                  | ✅ FIXED                     |
| BE-9  | Reports export status + download               | `POST` → 202 jobId → `GET /reports/export/:id` → **200 SUCCESS** → `…/download` → **200 `text/csv`** ✅                                                                           | ✅ **FIXED**                 |
| BE-10 | createRole persists `permissions[]`            | `POST /settings/roles {permissions:[…]}` → `GET …/roles-permissions` `matrix[key]` has the perms ✅                                                                               | ✅ FIXED                     |
| BE-11 | `customRoles[]` returned                       | `GET /settings/roles-permissions` now returns `customRoles:[{key,name}]` ✅                                                                                                       | ✅ FIXED                     |
| ANA   | Analytics `departmentId`/`from`/`to`           | `departmentId` **changes data** on headcount, attendance, recent-activity, leave-summary ✅ (5 others ignore, by design)                                                          | ✅ FIXED (partial by design) |

**Headline wins:** BE-9 (reports export) now works **end-to-end** — it was completely unusable before. BE-10/BE-11 mean **custom roles work fully** now (create with permissions + they show as custom).

---

## ✅ BE-1 — RESOLVED (2nd patch verified 2026-06-10)

The backend's follow-up patch (raw-token detection in `resolveTenant`, passing through
to `authenticate` when there's no usable tenant identifier) is **deployed and verified**.
All cases now return `401` — both through the BFF (the real browser path) and direct to
the backend:

```
GET /auth/me  (no cookie / no auth)                 -> 401 UNAUTHORIZED   ✅
GET /auth/me  (garbage cookie token)                -> 401 INVALID_TOKEN  ✅
GET /auth/me  (garbage Bearer token)                -> 401 INVALID_TOKEN  ✅
GET /auth/me  (decodable JWT, unknown tenant)        -> 401 INVALID_TOKEN  ✅
valid login  -> /auth/me                            -> 200               ✅ (happy path intact)
```

**FE consequence:** the axios interceptor's `400 INVALID_TENANT`→treat-as-401 special
case (`api-client.ts`, commit `6640cbb`) is now **dead code** — the backend returns `401`
directly. It can be removed (status === 401 alone now covers expiry). _(This is the last
remaining FE cleanup from the whole initiative.)_

---

## FE follow-ups — DONE (commit `f55c4bc`, verified in-browser)

Frontend changes that were **waiting** on the backend, now applied & verified:

| Backend fix | FE follow-up                                                                                                                                                                                                  | Status      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **BE-7**    | Run-detail **Cancel** gate relaxed (`usePayrollPermissions.canCancel` → `payroll:initiate` = HR_ADMIN + SUPER_ADMIN). Verified: HR sees "Cancel Run".                                                         | ✅ **DONE** |
| **BE-8**    | `usePayslipTemplate` un-gated (was HR/SUPER-only). Verified: employee my-payslips fetches `payslip-templates` → 200.                                                                                          | ✅ **DONE** |
| **BE-3**    | Employee profile fetch passes `?includeTerminated=true`. Verified: HR opens a terminated profile → renders (TERMINATED), no 404 wall.                                                                         | ✅ **DONE** |
| **BE-9**    | None — reports export auto-works now (FE already polls the download route).                                                                                                                                   | AUTO        |
| **BE-10**   | None — Add Role now persists permissions in one call (FE already sends them).                                                                                                                                 | AUTO        |
| **BE-11**   | None — keep `isCustom` from the built-in set; custom-role **friendly names** now populate after refresh.                                                                                                      | KEEP        |
| **BE-1**    | **Done** (commit `e7f29a2`) — removed the `400 INVALID_TENANT`→401 interceptor special case; auth-failure is now `status === 401`. Verified: login + silent refresh on expiry + no-session redirect all work. | ✅ **DONE** |
| **ANA**     | None — department filter now returns filtered data on 4 endpoints.                                                                                                                                            | AUTO        |

> **All FE cleanup complete.** Every backend fix is now either consumed by the FE or
> confirmed needs-nothing. Nothing is pending on the FE side.

---

## Their own deferred gaps (from the report — confirmed, acceptable)

- **`departmentId` for workforce-trend / attrition / payroll-cost / department-performance / summary** — accepted but ignored (these compute month-by-month over the full set). The FE already treats these as best-effort; not blocking.
- **`from`/`to` for workforce-trend** — deferred (needs month-level parsing).
- **Some payroll routes SUPER_ADMIN-only** (e.g. `approvePayrollRun`) — to review next sprint. _(Not in our original list; note if it bites self-service/HR.)_

---

## Minor housekeeping note

A leftover custom role **"Evidence Role"** (`evidence-role-…`) is present in the test
tenant — residue from the backend team's own verification. Harmless, but it shows as an
extra custom role in the Permissions matrix; delete it from the tenant when convenient.
