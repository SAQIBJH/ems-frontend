# Backend Fix Report — Live Verification

> **Date:** 2026-06-10 · **Method:** verified each claim **against the live backend**
> (mocks OFF) as the real seed roles — not from the report text. Source of the claims:
> `docs/BACKEND_TEAM_HANDOFF_FIX_REPORT.md`.
> **Verdict: 11 of 12 fully verified ✅. BE-1 is only partially fixed ⚠️.**

---

## Scorecard

| ID    | Claim                                          | Live result                                                                                                              | Verdict                      |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| BE-1  | Expired JWT → 401 not 400                      | Decodable-but-invalid JWT (unknown tenant) → **401** ✅. **No cookie → 400**, **garbage token → 400** ❌                 | ⚠️ **PARTIAL**               |
| BE-2  | PayGroup null override no longer 500           | Full valid body + `null` override → **201** ✅; invalid (`"BOGUS"`) → **400 VALIDATION_ERROR** (not 500) ✅              | ✅ FIXED                     |
| BE-3  | Terminated employee retrievable                | `DELETE` → 200; `GET /:id` → **404**; `GET /:id?includeTerminated=true` → **200 TERMINATED** ✅                          | ✅ FIXED                     |
| BE-4  | Salary `effectiveFrom > effectiveTo` validated | valid dates → 201; `from>to` → **400 VALIDATION_ERROR** (not persisted) ✅                                               | ✅ FIXED                     |
| BE-5  | SUPER_ADMIN leave-team org-wide                | SUPER `/leave/team/requests` → **200**, `/leave/team/calendar` → **200**; EMPLOYEE → **403** ✅                          | ✅ FIXED                     |
| BE-6  | `approverComment` echoed in approve/reject     | reject response body now contains `approverComment` (verified value round-trips) ✅                                      | ✅ FIXED                     |
| BE-7  | HR_ADMIN can cancel non-PAID runs              | HR create run → 201; HR `…/cancel` → **200 CANCELLED** ✅                                                                | ✅ FIXED                     |
| BE-8  | Payslip templates for self-service             | EMPLOYEE + MANAGER `GET /payroll/payslip-templates` → **200** ✅                                                         | ✅ FIXED                     |
| BE-9  | Reports export status + download               | `POST` → 202 jobId → `GET /reports/export/:id` → **200 SUCCESS** → `…/download` → **200 `text/csv`** ✅                  | ✅ **FIXED**                 |
| BE-10 | createRole persists `permissions[]`            | `POST /settings/roles {permissions:[…]}` → `GET …/roles-permissions` `matrix[key]` has the perms ✅                      | ✅ FIXED                     |
| BE-11 | `customRoles[]` returned                       | `GET /settings/roles-permissions` now returns `customRoles:[{key,name}]` ✅                                              | ✅ FIXED                     |
| ANA   | Analytics `departmentId`/`from`/`to`           | `departmentId` **changes data** on headcount, attendance, recent-activity, leave-summary ✅ (5 others ignore, by design) | ✅ FIXED (partial by design) |

**Headline wins:** BE-9 (reports export) now works **end-to-end** — it was completely unusable before. BE-10/BE-11 mean **custom roles work fully** now (create with permissions + they show as custom).

---

## ⚠️ The one still-open issue: BE-1 (partial)

**What they fixed:** a JWT that _decodes_ to a `tenantId` which doesn't resolve now
passes through to `authenticate`, which returns the correct **401**. Verified:
`well-formed JWT, unknown tenant → 401 INVALID_TOKEN`.

**What's still broken:** when there is **no usable tenant identifier at all**, the
middleware still returns **`400 INVALID_TENANT`**:

```
GET /auth/me   (no cookie)        -> 400 INVALID_TENANT   ❌ (expected 401)
GET /auth/me   (garbage token)    -> 400 INVALID_TENANT   ❌ (expected 401)
GET /auth/me   (decodable bad JWT)-> 401 INVALID_TOKEN    ✅
```

**Why this still matters:** httpOnly cookies are **dropped by the browser once they
expire** — so the most common real expiry scenario is the app booting with **no
`accessToken` cookie at all**, which still hits the `400` path. So the practical
"token expired on a returning user" case is **not** resolved.

**Impact today:** **none functionally** — our axios interceptor still treats
`400 INVALID_TENANT` like `401` (commit `6640cbb`), so the app behaves correctly.
But the workaround **cannot be removed yet**, and there's still a `400` console line
on a logged-out boot.

**Ask for the backend:** in `resolveTenant`, also pass through (let `authenticate`
return `401`) when there is **no tenant identifier at all** (no cookie / unparseable
token), not only when a decoded `tenantId` fails to resolve.

---

## FE follow-ups — DONE (commit `f55c4bc`, verified in-browser)

Frontend changes that were **waiting** on the backend, now applied & verified:

| Backend fix | FE follow-up                                                                                                                                          | Status      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **BE-7**    | Run-detail **Cancel** gate relaxed (`usePayrollPermissions.canCancel` → `payroll:initiate` = HR_ADMIN + SUPER_ADMIN). Verified: HR sees "Cancel Run". | ✅ **DONE** |
| **BE-8**    | `usePayslipTemplate` un-gated (was HR/SUPER-only). Verified: employee my-payslips fetches `payslip-templates` → 200.                                  | ✅ **DONE** |
| **BE-3**    | Employee profile fetch passes `?includeTerminated=true`. Verified: HR opens a terminated profile → renders (TERMINATED), no 404 wall.                 | ✅ **DONE** |
| **BE-9**    | None — reports export auto-works now (FE already polls the download route).                                                                           | AUTO        |
| **BE-10**   | None — Add Role now persists permissions in one call (FE already sends them).                                                                         | AUTO        |
| **BE-11**   | None — keep `isCustom` from the built-in set; custom-role **friendly names** now populate after refresh.                                              | KEEP        |
| **BE-1**    | **Do NOT remove** the `400 INVALID_TENANT`→401 interceptor workaround — still needed (BE-1 partial).                                                  | KEEP        |
| **ANA**     | None — department filter now returns filtered data on 4 endpoints.                                                                                    | AUTO        |

> **Only remaining FE cleanup is backend-gated:** once BE-1's absent-token path returns `401`,
> the interceptor workaround can be removed. Nothing else is pending on the FE.

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
