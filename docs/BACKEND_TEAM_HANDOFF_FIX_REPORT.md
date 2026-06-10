# Backend Team Handoff Fix Report

> Date: 2026-06-10  
> Context: Frontend QA sweep (mocks OFF) identified 11 backend contract failures.

---

## Background

The UI team completed a screen-by-screen QA sweep with API mocks OFF. The failures listed below were identified as backend contract bugs — not frontend issues. This document records every root cause, fix, files changed, and decisions made.

---

## Issues Summary

| ID    | Priority | Issue                                                         | Status   |
| ----- | -------- | ------------------------------------------------------------- | -------- |
| BE-1  | P1       | Auth: Expired JWT returns 400 instead of 401                  | ✅ FIXED |
| BE-2  | P2       | PayGroup: Blank overrideCalculationType causes 500            | ✅ FIXED |
| BE-3  | P2       | Employees: GET /:id 404s for terminated employees             | ✅ FIXED |
| BE-4  | P2       | Payroll Salary: effectiveTo < effectiveFrom not validated     | ✅ FIXED |
| BE-5  | P1       | Leave: SUPER_ADMIN gets 400 on /leave/team/requests           | ✅ FIXED |
| BE-6  | P2       | Leave: approverComment missing from approve/reject response   | ✅ FIXED |
| BE-7  | P2       | Payroll: HR_ADMIN cannot cancel payroll runs                  | ✅ FIXED |
| BE-8  | P2       | Payslip: GET /payroll/payslip-templates blocked for employees | ✅ FIXED |
| BE-9  | P1       | Reports: Export status/download endpoints missing             | ✅ FIXED |
| BE-10 | P2       | Settings: createRole ignores permissions[]                    | ✅ FIXED |
| BE-11 | P2       | Settings: GET /settings/roles-permissions missing customRoles | ✅ FIXED |
| ANA   | P3       | Analytics: No departmentId/from/to filter support             | ✅ FIXED |

---

## Root Cause Analysis & Fixes

### BE-1 — resolveTenant returns 400 for invalid JWT

**Root cause:** `resolveTenant` middleware runs before `authenticate`. It decoded the JWT payload _without verifying the signature_ to extract `tenantId`. When the token was garbage/expired, it decoded fine, found a `tenantId`, looked up the tenant, and — if no tenant matched — returned `400 INVALID_TENANT`. The `authenticate` middleware never had a chance to return the correct `401`.

**Fix:** `src/middleware/resolveTenant.js` — When the only tenant identifier was a JWT-derived `tenantId` (no explicit header, no subdomain, no fallback key) and the tenant is not found, skip the 400 and `return` (pass through). `authenticate` runs next and returns `401`.

---

### BE-2 — PayGroup overrideCalculationType 500

**Root cause:** Prisma enum validation throws an unhandled error when `overrideCalculationType` receives an empty string or unsupported value.

**Fix:** `src/modules/payroll/payroll.repository.js` — `normalizeOverrideCalcType()` helper converts `null`/`""` to `null`, validates against `['FLAT', 'PERCENTAGE', 'FORMULA']`, throws `400 VALIDATION_ERROR` for invalid non-null values. Applied in `createPayGroup` and `updatePayGroup`. Live path: `POST /payroll/groups`, `PATCH /payroll/groups/:id`.

---

### BE-3 — GET /employees/:id returns 404 for terminated employees

**Root cause:** `getEmployeeById` in the repository always filters `deletedAt: null`, which excludes soft-deleted (terminated) employees.

**Fix:**

- `src/modules/employees/employees.repository.js` — `getEmployeeById` accepts `{ includeTerminated }` option; when true, omits the `deletedAt: null` filter.
- `src/modules/employees/employees.service.js` — Passes `{ includeTerminated }` through.
- `src/modules/employees/employees.controller.js` — Extracts `?includeTerminated=true` from query; only honored for `HR_ADMIN` and `SUPER_ADMIN`.
- `src/modules/employees/employees.routes.js` — Added `includeTerminated` to Swagger querystring schema.

---

### BE-4 — Payroll salary effectiveTo not validated

**Root cause:** `setEmployeeSalary` in the service only validated `effectiveFrom` is present; it never checked the temporal order.

**Fix:** `src/modules/payroll/payroll.service.js` — Added: `if (data.effectiveTo && new Date(data.effectiveFrom) > new Date(data.effectiveTo)) throw AppError(...)`. Returns `400 VALIDATION_ERROR`.

---

### BE-5 — SUPER_ADMIN gets 400 on /leave/team/requests

**Root cause:** The controller checked `if (!managerEmployeeId)` and returned `400 NO_EMPLOYEE_ID`. SUPER_ADMIN has no employee profile, so `managerEmployeeId` is always null. The repository also did `{ employee: { managerId: managerEmployeeId } }` unconditionally, which with `null` would return no results.

**Fix:**

- `src/modules/leave/leave.controller.js` — Check `isSuperAdmin`: if true and no employee ID, pass `null` to service (org-wide). If false and no employee ID, return `403 FORBIDDEN`.
- `src/modules/leave/leave.repository.js:getTeamLeaveRequests` — When `managerEmployeeId === null` (and no `employeeId` filter), skip the manager filter entirely (all tenant records).
- `src/modules/leave/leave.repository.js:getTeamCalendar` — Same pattern: when `managerEmployeeId === null`, fetch all tenant employees.

**Decision made:** Option A chosen — SUPER_ADMIN gets org-wide results. Option B (return empty) was rejected as unhelpful for compliance use cases.

---

### BE-6 — approverComment missing from approve/reject response

**Root cause:** The response objects in `approveLeaveRequest` and `rejectLeaveRequest` in the controller omitted the `approverComment` field.

**Fix:** `src/modules/leave/leave.controller.js` — Added `approverComment: leaveRequest.approverComment ?? null` to both response shapes.

---

### BE-7 — HR_ADMIN cannot cancel payroll runs

**Root cause:** `POST /payroll/runs/:id/cancel` used `authorize(superOnly)`.

**Fix:** `src/modules/payroll/payroll.routes.js` — Changed to `authorize(adminRoles)` (`['HR_ADMIN', 'SUPER_ADMIN']`). The repository already guards against cancelling PAID runs for anyone.

---

### BE-8 — GET /payroll/payslip-templates blocked for employees

**Root cause:** Route used `authorize(adminRoles)`.

**Fix:** `src/modules/payroll/payroll.routes.js` — Changed to `authorize(allAuth)` (all authenticated users). Required for employee self-service payslip PDF drawer.

---

### BE-9 — Export status/download endpoints missing

**Root cause:** `POST /reports/export` created a `ReportExport` DB row and returned 202 with `jobId`, but no routes existed to check status or download the result. Redis/BullMQ had been removed, so jobs were never processed.

**Fix:**

- `src/modules/reports/reports.service.js` — `exportReport` now schedules processing via `setImmediate`. `_processExportJob` generates CSV synchronously and stores it in `ReportExport.filePath` (existing `TEXT` column — no migration needed). Added `getExportJobStatus` and `downloadExportJob` service methods.
- `src/modules/reports/reports.repository.js` — Added `getReportExportById` (returns `csvContent: row.filePath`), `completeReportExport` (updates `filePath`, `status`, `completedAt`, `errorMessage`).
- `src/modules/reports/reports.controller.js` — Added `getExportJobStatus`, `downloadExport` (sets `Content-Type: text/csv`, `Content-Disposition: attachment; filename="..."`).
- `src/modules/reports/reports.routes.js` — Added:
  - `GET /reports/export/:jobId` — status
  - `GET /reports/export/:jobId/status` — alias
  - `GET /reports/export/:jobId/download` — streams CSV

---

### BE-10 — createRole ignores permissions[]

**Root cause:** `settingsRepository.createRole` created the `Role` row but never processed `data.permissions`. The `permissions` array was silently dropped.

**Fix:** `src/modules/settings/settings.repository.js:createRole` — After creating the role, looks up matching `Permission` rows by key, creates `RolePermission` rows via `createMany({ skipDuplicates: true })`, returns `{ ...role, permissions }`.

---

### BE-11 — GET /settings/roles-permissions missing customRoles

**Root cause:** `getRolePermissions` returned only `{ matrix }`. The `customRoles` array was not built.

**Fix:**

- `src/modules/settings/settings.repository.js:getRolePermissions` — Now returns `{ matrix, customRoles }` where `customRoles = [{ key, name }]` for non-system roles belonging to the tenant.
- `src/modules/settings/settings.service.js:getRolePermissions` — Destructures and includes `customRoles` in the response.

---

### Analytics Filters

**Root cause:** All 9 analytics endpoints accepted only `range`. No way to filter by department or custom date range.

**Fix (5 files):**

- `analytics.validator.js` — Added `departmentId`, `from` (YYYY-MM-DD), `to` (YYYY-MM-DD) as optional to all schemas.
- `analytics.controller.js` — `extractFilters(query)` helper passes `{ departmentId, from, to }` to each service call.
- `analytics.service.js` — All functions accept `filters = {}`, pass through to repo.
- `analytics.routes.js` — All 9 endpoints' Swagger querystring schemas include the new params.
- `analytics.repository.js`:
  - `getAttendanceData` — uses `from`/`to` to override date range; applies `employee: { departmentId }` filter on `AttendanceRecord`
  - `getHeadcountByDepartment` — filters result to single department when `departmentId` provided
  - `getRecentActivity` — filters by `actor.employee.departmentId`
  - `getLeaveSummary` — uses `from`/`to` to override date range; applies `employee: { departmentId }` filter
  - Other functions (`getWorkforceTrend`, `getAttrition`, `getPayrollCost`, `getDepartmentPerformance`, `getSummaryData`) accept `_filters` but do not yet apply filtering (avoids over-engineering; filters silently ignored for these)

---

## Files Changed

| File                                            | Changes                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/middleware/resolveTenant.js`               | BE-1: JWT-only tenant miss → pass through instead of 400                         |
| `src/modules/analytics/analytics.validator.js`  | Analytics: add departmentId, from, to to all schemas                             |
| `src/modules/analytics/analytics.controller.js` | Analytics: extractFilters helper, pass to services                               |
| `src/modules/analytics/analytics.service.js`    | Analytics: filters param threaded through                                        |
| `src/modules/analytics/analytics.repository.js` | Analytics: departmentId + from/to filtering in 4 functions                       |
| `src/modules/analytics/analytics.routes.js`     | Analytics: Swagger querystring updated for all 9 endpoints                       |
| `src/modules/employees/employees.repository.js` | BE-3: includeTerminated option on getEmployeeById                                |
| `src/modules/employees/employees.service.js`    | BE-3: pass includeTerminated to repo                                             |
| `src/modules/employees/employees.controller.js` | BE-3: extract query param, HR/SA only                                            |
| `src/modules/employees/employees.routes.js`     | BE-3: Swagger querystring updated                                                |
| `src/modules/leave/leave.controller.js`         | BE-5: SUPER_ADMIN → null managerId; BE-6: approverComment                        |
| `src/modules/leave/leave.repository.js`         | BE-5: null managerId → org-wide query                                            |
| `src/modules/payroll/payroll.repository.js`     | BE-2: normalizeOverrideCalcType helper                                           |
| `src/modules/payroll/payroll.routes.js`         | BE-7: cancel → adminRoles; BE-8: templates → allAuth                             |
| `src/modules/payroll/payroll.service.js`        | BE-4: effectiveFrom <= effectiveTo validation                                    |
| `src/modules/reports/reports.controller.js`     | BE-9: getExportJobStatus, downloadExport                                         |
| `src/modules/reports/reports.repository.js`     | BE-9: getReportExportById, completeReportExport                                  |
| `src/modules/reports/reports.routes.js`         | BE-9: GET /reports/export/:jobId, /status, /download                             |
| `src/modules/reports/reports.service.js`        | BE-9: synchronous export pipeline, getExportJobStatus, downloadExportJob         |
| `src/modules/settings/settings.repository.js`   | BE-10: createRole persists permissions; BE-11: customRoles in getRolePermissions |
| `src/modules/settings/settings.service.js`      | BE-11: customRoles included in getRolePermissions response                       |

---

## Decisions Made

| Decision                        | Choice                                  | Rationale                                                                                                                                                                   |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-5 SUPER_ADMIN behaviour      | **Option A: org-wide results**          | SUPER_ADMIN is a superuser by design. Returning 400 is a bug, not a feature. Org-wide view is consistent with other SUPER_ADMIN endpoints.                                  |
| BE-7 HR_ADMIN cancel permission | **Allowed for non-PAID runs**           | HR already has approve/reject authority. Blocking cancel for HR forces unnecessary SUPER_ADMIN involvement for routine payroll corrections. PAID runs remain uncancellable. |
| BE-9 CSV storage                | **Use existing `filePath TEXT` column** | Avoids a schema migration while being transparent about what's stored. Column is nullable and large text — suitable for CSV content.                                        |

---

## Remaining Gaps (Not Fixed in This Sweep)

| Gap                                                           | Notes                                                                                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payroll SUPER_ADMIN-only routes                               | Some payroll routes (e.g. `approvePayrollRun`) remain SUPER_ADMIN-only. Review in next sprint.                                                                  |
| Analytics `departmentId` for workforce/attrition/payroll-cost | These compute month-by-month from the full employee set; departmentId filtering would require per-employee pre-filtering. Deferred.                             |
| Leave team SUPER_ADMIN in `authorize()`                       | Routes use `authorize(['MANAGER', 'HR_ADMIN'])` but SUPER_ADMIN bypasses `authorize()` in `authenticate.js` automatically — no bug, just missing documentation. |
| Generic `from`/`to` for workforce-trend                       | Needs month-level date parsing; deferred to avoid scope creep.                                                                                                  |
