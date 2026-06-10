# Backend API Requests — From Frontend Team

> **From:** Frontend team
> **To:** Backend team
> **Status:** 2 endpoints still pending (updated 2026-05-26)
> **Last updated:** 2026-05-26
>
> ## Purpose
>
> This document lists endpoints the **frontend needs** that do **not yet exist** in
> `docs/API_MAPPING.md`.
>
> The frontend is building against these exact response shapes via **MSW mocks
> today**. When you ship the real endpoint with the response shape below, our
> code keeps working — we just flip the MSW handler off. **If you must deviate
> from a documented shape, please ping the frontend team before merging.**
>
> ## Authoritative references
>
> - **API source of truth (live endpoints):** `docs/API_MAPPING.md`
> - **UI source of truth (what each endpoint feeds):** `docs/WIREFRAMES.pdf`
> - **Architecture notes:** `CLAUDE.md` (§3, §4, §10)

---

## ⚠️ Shape deviations — shipped but different from what was documented

The following endpoints shipped with shapes that differ from what was originally
documented here. Frontend code is already updated to use the actual live shapes.
**Do not revert these on the backend — the frontend tracks the actual wire format.**

| Endpoint                                | Documented shape                              | Actual live shape                                             | Impact                                 |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| `GET /employees/next-code`              | `data.code`                                   | `data.nextCode`                                               | Frontend reads `nextCode`              |
| `POST /employees/:id/documents/presign` | `uploadUrl` = S3 presign URL, `method: "PUT"` | `uploadUrl` = Cloudinary multipart endpoint, `method: "POST"` | Frontend POSTs to our own endpoint     |
| `GET /leave/team/calendar`              | `members[].days[]` per-day status grid        | `members[].leaves[]` range objects                            | Frontend renders ranges not daily grid |

---

## Conventions (must match these — same as existing live endpoints)

- **Envelope:** `{ success, data, meta }` — see `API_MAPPING.md` "Response Envelope".
- **Auth:** cookie-based (`accessToken` + `ems_session`). **No** `Authorization` header is sent from the browser. **No** `x-tenant-key` — tenant is resolved from the JWT.
- **Date writes:** `YYYY-MM-DD` strings on POST/PATCH bodies. Server returns full ISO on reads.
- **Field casing per domain (match existing conventions):**
  - `camelCase` — employees, departments, leave, attendance, holidays, notifications, search
  - `snake_case` — settings/tenant, settings/branding, attendance-rules, auth-settings, notification-preferences, audit-logs
- **Status codes:** 200 (GET/PATCH/DELETE), 201 (POST create), 202 (queued), 400/401/403/404/409/422 per `API_MAPPING.md` "HTTP Status Code Rules".
- **Error envelope:** same as `API_MAPPING.md` — `{ success: false, error: { code, message, details, requestId } }`.

---

## Table of Contents — Pending

1. [Auth — OTP initiate](#1-auth-otp-initiate) ← **Still pending**
2. [Holidays — .ics import](#2-holidays-ics-import) ← **Still pending**

---

## 1. Auth — OTP initiate

> **Status: STILL PENDING — MSW mock active**

### `POST /auth/otp/initiate`

**Why:** Wireframe screen 03 — login returned `MFA_REQUIRED`; UI starts a verification challenge.

**Body:**

```json
{ "challengeId": "<from-login-response>" }
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "challengeId": "chal_...",
    "deliveryMethod": "EMAIL",
    "expiresAt": "2026-05-25T10:10:00.000Z",
    "resendAvailableAt": "2026-05-25T10:01:00.000Z"
  },
  "meta": {}
}
```

**Errors:**
| Code | Status | When |
|---|---|---|
| `CHALLENGE_NOT_FOUND` | 404 | Bad/expired challengeId |
| `RESEND_TOO_SOON` | 429 | Resend before cooldown |
| `MAX_RESENDS` | 429 | More than 3 resends |

### Login response change — MFA branch

**Why:** Wireframe screen 03 — login flow forks when MFA is required.

When MFA is required, **don't** issue cookies on `POST /auth/login`. Instead respond:

```json
{
  "success": true,
  "data": {
    "mfaRequired": true,
    "challengeId": "chal_...",
    "deliveryMethod": "EMAIL"
  },
  "meta": {}
}
```

Frontend routes to `/otp-verification?challengeId=...`. Then `POST /auth/verify-otp` (already in `API_MAPPING.md`) issues the cookies on success — same shape as a successful login.

---

## 2. Holidays — .ics import

> **Status: STILL PENDING — MSW mock active**

### `POST /holidays/import` (multipart)

**Why:** Wireframe screen 13 — "Import .ics" button.

**Body:** `multipart/form-data` with field `file` = .ics file.

**Response 202:**

```json
{
  "success": true,
  "data": { "jobId": "imp_...", "previewUrl": "/api/v1/holidays/import/imp_.../preview" },
  "meta": {}
}
```

### `GET /holidays/import/:jobId/preview`

**Response `data`:**

```json
{
  "candidates": [
    { "name": "Diwali", "date": "2026-10-20", "isOptional": false, "willOverwrite": false },
    { "name": "Independence Day", "date": "2026-08-15", "isOptional": false, "willOverwrite": true }
  ],
  "summary": { "new": 8, "overwrites": 2, "skipped": 0 }
}
```

### `POST /holidays/import/:jobId/commit`

**Body:** `{ "overwriteExisting": true }`

**Response 200:** `{ "imported": 8, "overwritten": 2, "skipped": 0 }`

---

## Shipped — archived

> All endpoints below were shipped by the backend team as of 2026-05-26.
> MSW handlers for these have been removed. Live shapes are in `docs/API_MAPPING.md`.

### Auth (shipped 2026-05-25)

- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-otp` — note: field is `code`, not `otp`

### Notifications (shipped 2026-05-25)

- `GET /notifications`
- `GET /notifications/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

### Search (shipped 2026-05-25)

- `GET /search`

### Documents (shipped 2026-05-26)

- `POST /employees/:id/documents/presign` — ⚠️ shape deviation: see table above
- `POST /employees/:id/documents/:documentId/confirm`
- `GET /employees/:id/documents`
- `GET /employees/:id/documents/:documentId/download`
- `DELETE /employees/:id/documents/:documentId`

### Employees convenience (shipped 2026-05-26)

- `GET /employees/next-code` — ⚠️ shape deviation: returns `nextCode` not `code`
- `POST /employees/bulk/deactivate`
- `POST /employees/bulk/export`

### Departments (shipped 2026-05-26)

- `POST /departments/:id/reassign-and-delete`
- `GET /departments/:id/employees`

### Leave (shipped 2026-05-26)

- `POST /leave/requests/bulk/approve`
- `POST /leave/requests/bulk/reject`
- `GET /leave/team/calendar` — ⚠️ shape deviation: see table above
- `GET /leave/team/coverage`

### Settings (shipped 2026-05-26)

- `GET /settings/branding`, `PATCH /settings/branding`
- `POST /settings/leave-types`, `PATCH /settings/leave-types/:id`, `DELETE /settings/leave-types/:id`
- `GET /settings/attendance-rules`, `PATCH /settings/attendance-rules`
- `GET /settings/security/auth`, `PATCH /settings/security/auth`
- `GET /settings/notifications/preferences`, `PATCH /settings/notifications/preferences`

### Custom roles (shipped 2026-05-26)

- `POST /settings/roles`
- `DELETE /settings/roles/:key`
- `POST /settings/roles/:key/users`

### Dashboard analytics (shipped 2026-05-26)

- `GET /analytics/summary` — with `deltas` block
- `GET /attendance/team/weekly`
- `GET /manager/dashboard` — with `approvalBreakdown`
- `GET /employee/dashboard` — with `todayAttendance` + `leaveBalanceSummary`

### Activity feed (shipped 2026-05-26)

- `GET /analytics/recent-activity` — with `entity_label` + `entity_url`

---

## Analytics filter parameters — enhancement to existing LIVE endpoints (added 2026-06-10)

> **These endpoints already exist and are live.** This is a request to **honour
> two optional query parameters** the frontend now sends from the **Analytics
> screen** (`/analytics`) filter bar: a **department filter** and a **custom date
> window**. As of 2026-06-10 the live endpoints **accept and ignore** these params
> (verified — every one still returns `200`), so the frontend ships them now with
> **no risk**; the moment the backend filters by them, the Analytics screen's
> Department dropdown and Custom-range picker start working with **zero frontend
> change**.

**Two optional params (both omittable; omitting yields today's unfiltered result):**

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

1. **Response shape is unchanged** — same envelope/fields as today; only the rows
   are filtered to the requested department / window.
2. **Backward compatible** — when `departmentId`/`from`/`to` are absent, return the
   current org-wide result (the Dashboard widgets call these with no filters and
   must keep working).
3. **Do not 400 on these params** (you don't today — please keep it that way).
4. `departmentId` should match the department `id` issued by `GET /departments`.
5. Filtering `headcount-by-department` by `departmentId` should return just that
   department's row(s) (a single-slice breakdown is acceptable).

Examples the FE issues:

```
GET /analytics/summary?range=30d&departmentId=cmq6w2fct001g19wgvelknhcm
GET /analytics/attendance?from=2026-03-01&to=2026-05-31&departmentId=cmq6w2...
GET /analytics/workforce-trend?range=6m&departmentId=cmq6w2...
```

---

## Implementation note for the backend team

Frontend will ship UI for **every** endpoint listed in the "Still pending" sections
above against MSW mocks matching the response shapes documented there. **You can
implement these in any order.** Once a real endpoint goes live, the frontend's MSW
handler for that path is removed and the live endpoint serves the same data.

If a shape needs to change, please:

1. Update this doc with the new shape.
2. Ping the frontend team — we'll update the MSW handler and TypeScript
   types in lockstep.

Questions / clarifications: open a thread referencing the section number in
this doc.
