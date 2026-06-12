# Backend API Requests — From Frontend Team

> **From:** Frontend team
> **To:** Backend team
> **Status:** 2 endpoints + 1 flow (employee invitation) still pending (updated 2026-06-12)
> **Last updated:** 2026-06-12
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
3. [Employee invitation & set-password](#3-employee-invitation--set-password) ← **Implemented & live; FE wired; final emailed-link proof pending**

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

## 3. Employee invitation & set-password

> **Status: IMPLEMENTED & LIVE on backend (2026-06-12).** Frontend is wired
> (MSW-first with live fallback). Two items still open — see §3.10 (activation-link
> base + production sender domain) — and the §"Live-proof" emailed-link round-trip is
> the only remaining signoff before the FE removes its mock fallback. Design rationale:
> `docs/superpowers/specs/2026-06-12-employee-invitation-set-password-design.md`.
> Field casing **camelCase** for auth/employees; **snake_case** for the settings field.

**Why:** New employees cannot set their own password. The create stepper's "Send
invite email" toggle is currently a no-op. This flow: HR creates → employee gets an
emailed link → lands on `/set-password` → activates (`INVITED → ACTIVE`).

### ⚠️ Backend confirmations required before building the create-side

1. Does `POST /employees` create a login user today, or only an employee profile?
2. If it creates a user, does it accept `memberType`, and what default status?
3. Can `POST /employees` support `sendInvite` and trigger the invite **atomically**?
4. Is there an `ACCOUNT_INVITE` activation email template, or must one be added?

### Locked product decisions (FE side)

- **Invite TTL = 72h** (configurable), server-enforced. Reset stays short.
- **Email-send failure → do NOT roll back the create.** Persist employee + user +
  token atomically; email is a side-effect. On failure return `invite.sent: false`
  with a reason — HR resends. A transient SMTP outage must not block a valid create.
- **After accept → frontend redirects to `/login`** (no auto-login). The optional
  auto-login response is **not needed** — return `{ "activated": true }`.

### 3.1 Modified — `POST /employees` (optional invite)

Roles: HR_ADMIN, SUPER_ADMIN. **Body additions:**

```json
{ "memberType": "EMPLOYEE", "sendInvite": true, "emailTarget": "PERSONAL" }
```

- `memberType` defaults `EMPLOYEE` if omitted; `sendInvite` defaults `false`;
  `emailTarget` (`PERSONAL | WORK`) defaults from the tenant setting if omitted.
- If `sendInvite=true`: create employee + link user in `INVITED`, issue a single-use
  invite token, send the email — atomically (see no-rollback rule above).

**Response 201 `data`** (gains `user` + `invite`):

```json
{
  "id": "emp_123",
  "employeeCode": "EMP-0082",
  "firstName": "Jane",
  "lastName": "Doe",
  "workEmail": "jane.doe@company.com",
  "personalEmail": "jane.personal@gmail.com",
  "user": {
    "id": "usr_123",
    "email": "jane.doe@company.com",
    "memberType": "EMPLOYEE",
    "status": "INVITED"
  },
  "invite": {
    "sent": true,
    "sentTo": "PERSONAL",
    "email": "j****@gmail.com",
    "expiresAt": "2026-06-16T10:30:00.000Z"
  }
}
```

> On email-send failure: `"invite": { "sent": false, "reason": "EMAIL_SEND_FAILED" }`
> while the employee + user records still persist.

### 3.2 New — `POST /employees/:id/invite` (send / resend)

Roles: HR_ADMIN, SUPER_ADMIN. Body: optional `{ "emailTarget": "PERSONAL"|"WORK" }`.
Invalidates prior unused tokens, issues a fresh one, sends a new email.

**Response 200 `data`:** `{ "sent": true, "sentTo": "PERSONAL", "email": "p****@gmail.com", "expiresAt": "<ISO>" }`

| Status | Code                  | When                                   |
| -----: | --------------------- | -------------------------------------- |
|    404 | `EMPLOYEE_NOT_FOUND`  | Employee does not exist                |
|    409 | `ALREADY_ACTIVE`      | User already active                    |
|    409 | `EMPLOYEE_TERMINATED` | Employee terminated / soft-deleted     |
|    422 | `NO_DELIVERY_EMAIL`   | Selected target has no email           |
|    429 | `RATE_LIMITED`        | Too many invite sends (~3/hr/employee) |

### 3.3 New — `GET /auth/invitation?token=<raw>` (public, validate)

Always **HTTP 200** so the page renders the right state. No auth.

```json
{
  "status": "VALID",
  "employee": { "firstName": "Jane", "companyName": "Acme" },
  "expiresAt": "<ISO>"
}
```

`status` ∈ `VALID | EXPIRED | USED | NOT_FOUND`. **No** email/tenant/token metadata leaked.

### 3.4 New — `POST /auth/accept-invitation` (public)

Body: `{ "token": "<raw>", "password": "NewPass123!" }`. Validates (constant-time hash
compare) → sets password → `INVITED → ACTIVE` → consumes token.

**Response 200 `data`:** `{ "activated": true }` _(no auto-login — see decisions)._

| Status | Code                  | When                            |
| -----: | --------------------- | ------------------------------- |
|    410 | `INVITE_EXPIRED`      | Token expired                   |
|    409 | `INVITE_ALREADY_USED` | Token already consumed          |
|    404 | `INVALID_TOKEN`       | Token not found / invalid       |
|    422 | `WEAK_PASSWORD`       | Fails policy; `error.details[]` |

### 3.5 New — `POST /auth/invitation/resend` (public, self-serve)

Body: `{ "email": "..." }`. **Generic no-leak 200:**
`{ "message": "If an invite exists, a new link was sent" }`. Rate limit **5/15min**
(`429 RATE_LIMITED`).

### 3.6 Tenant setting — `invite_email_target`

`GET/PATCH /settings/tenant` gains `"invite_email_target": "PERSONAL" | "WORK"`
(**snake_case**, default `PERSONAL`).

### 3.7 Token security (required)

≥256-bit random; **stored hashed** (raw only in the email URL); single-use; single
active unused token per user (resend invalidates prior); server-enforced TTL (72h
default); constant-time compare; rate-limited; audit `INVITE_SENT/RESENT/ACCEPTED/failed`;
**no raw token in logs**. Suggested model `UserInvitation(tokenHash, emailTarget,
email, expiresAt, usedAt, revokedAt, createdById, …)`.

### 3.8 Email template

Add/confirm `ACCOUNT_INVITE` template. Variables: `employeeFirstName`, `companyName`,
`activationUrl`, `expiresAt`, `supportEmail`. Subject e.g. _"Activate your account for
{{companyName}}"_. `activationUrl` = `${APP_URL}/set-password?token=<raw>`.

### 3.9 Login behavior for `INVITED`

Login attempt before activation → `403 ACCOUNT_NOT_ACTIVATED`.

### 3.10 Email / link confirmations (from live test 2026-06-12)

A live test email (via Resend) confirmed delivery, the `ACCOUNT_INVITE` template, the
72h expiry, and `companyName` / `employeeFirstName` interpolation. Two items still
need backend confirmation:

1. **Activation link target** — the "Activate Account" button MUST point to the
   **frontend**: `${FRONTEND_APP_URL}/set-password?token=<rawToken>`. Query param must
   be exactly `token`; base must be our deployed origin **per environment** (local
   `http://localhost:3000`, production = our Vercel URL), **not** a backend URL. Please
   paste the exact `href` used so we can verify base + token param.
2. **Production sender** — the test used `onboarding@resend.dev`, which is Resend's
   **sandbox** sender and can only deliver to the Resend account owner's address; it
   cannot email arbitrary new-hire inboxes. Before real invites, configure a **verified
   sending domain** (e.g. `no-reply@<company>`) and make the "Need help?" address a real
   `supportEmail` (not `resend.dev`).
3. **Optional** — confirm reply-to, and whether the subject stays
   _"Welcome to {{companyName}}"_ (fine) or the contracted
   _"Activate your account for {{companyName}}"_.

### Live-proof before FE removes mocks

create+`sendInvite` → `201` + `user.status=INVITED` + invite object · resend → new
expiry · validate → `VALID` · accept → `activated:true` · login after accept → `200` ·
reused/expired token → correct state · missing delivery email → `422` · already-active
→ `409` · public resend unknown email → generic `200` · email actually delivered.

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

### Departments — bulk add members (shipped 2026-06-13)

- `POST /departments/:id/members` — bulk-assign existing employees to a
  department / sub-department. Idempotent (already-members → `skipped`). Live
  shape in `docs/API_MAPPING.md`. Errors: `VALIDATION_ERROR` (422),
  `DEPARTMENT_NOT_FOUND` (404), `EMPLOYEE_NOT_FOUND` (404), `FORBIDDEN` (403).

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
