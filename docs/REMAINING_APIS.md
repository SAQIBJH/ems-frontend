# Remaining APIs — Pending Backend Implementation

> **Last updated:** 2026-05-27 (Step 46 added §3)  
> **Status:** Frontend is running against MSW mocks for all endpoints below.  
> When each endpoint ships, delete the corresponding MSW handler and this entry.
>
> **Contract rules (must match exactly):**
>
> - Envelope: `{ success: true, data: <payload>, meta: {} }`
> - Auth: `accessToken` + `ems_session` cookies (no `Authorization` header, no `x-tenant-key`)
> - Date writes: `YYYY-MM-DD` strings. Server returns full ISO on reads.
> - Field casing: `camelCase` for holidays/auth; `snake_case` for settings/audit
> - Status codes: 200 GET/PATCH/DELETE · 201 POST create · 202 POST queued/accepted · 422 validation

---

## 1. Auth — MFA OTP Initiate

**MSW file:** `src/mocks/handlers/auth.ts`

### `POST /api/v1/auth/otp/initiate`

Used on the OTP verification screen when login returns `mfaRequired: true`.  
Sends (or re-sends) the OTP email to the user.

**Required roles:** unauthenticated (the challenge proves identity)

**Request body:**

```json
{ "challengeId": "chal_xxxxxxxxxxxx" }
```

**Success response — 200:**

```json
{
  "success": true,
  "data": {
    "challengeId": "chal_xxxxxxxxxxxx",
    "deliveryMethod": "EMAIL",
    "expiresAt": "2026-05-27T10:10:00.000Z",
    "resendAvailableAt": "2026-05-27T10:01:00.000Z"
  },
  "meta": {}
}
```

**Error responses:**
| HTTP | Code | When |
|------|------|------|
| 404 | `CHALLENGE_NOT_FOUND` | `challengeId` is invalid or expired |
| 429 | `RESEND_TOO_SOON` | Called again before `resendAvailableAt` |
| 429 | `MAX_RESENDS` | More than 3 resend attempts on same challenge |

---

### Login response change — MFA branch

When a user has MFA enabled, `POST /auth/login` must **not** set cookies. Instead respond:

```json
{
  "success": true,
  "data": {
    "mfaRequired": true,
    "challengeId": "chal_xxxxxxxxxxxx",
    "deliveryMethod": "EMAIL"
  },
  "meta": {}
}
```

The frontend routes the user to `/otp-verification?challengeId=chal_xxx`. Then `POST /auth/verify-otp` (already live) issues the cookies on success.

> **Note:** MFA is currently disabled for all seed users. This flow only activates when `mfaEnabled = true` on the user record.

---

## 2. Holidays — .ics Calendar Import

**MSW file:** `src/mocks/handlers/holidays.ts`

The import is a 3-step flow: upload → preview → commit.  
All three endpoints are needed together — the frontend calls them in sequence.

---

### `POST /api/v1/holidays/import`

Upload an `.ics` (iCalendar) file. Parse it server-side and create a job for preview.

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Request:** `multipart/form-data`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File (`.ics`) | Yes | iCalendar format, max 1 MB |

**Success response — 202 (accepted, not yet committed):**

```json
{
  "success": true,
  "data": {
    "jobId": "imp_abc123",
    "previewUrl": "/api/v1/holidays/import/imp_abc123/preview"
  },
  "meta": {}
}
```

**Error responses:**
| HTTP | Code | When |
|------|------|------|
| 400 | `INVALID_ICS_FILE` | File is not valid iCalendar format |
| 413 | `FILE_TOO_LARGE` | File exceeds 1 MB |
| 422 | `VALIDATION_ERROR` | Missing `file` field |

---

### `GET /api/v1/holidays/import/:jobId/preview`

Fetch the parsed candidates from the uploaded `.ics` file.  
Shows which holidays would be created and which would overwrite an existing record.

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Path params:**

- `jobId` — the ID returned by `POST /holidays/import`

**Success response — 200:**

```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "name": "Republic Day",
        "date": "2026-01-26",
        "isOptional": false,
        "willOverwrite": false
      },
      {
        "name": "Independence Day",
        "date": "2026-08-15",
        "isOptional": false,
        "willOverwrite": true
      },
      {
        "name": "Good Friday",
        "date": "2026-04-03",
        "isOptional": true,
        "willOverwrite": false
      }
    ],
    "summary": {
      "new": 2,
      "overwrites": 1,
      "skipped": 0
    }
  },
  "meta": {}
}
```

**Field notes:**

- `candidates[].date` — `YYYY-MM-DD` format
- `candidates[].willOverwrite` — `true` if a holiday already exists on that date for this tenant
- `summary.new` — count of candidates that will create a new holiday record
- `summary.overwrites` — count that will update an existing record on the same date
- `summary.skipped` — count of candidates the parser could not map to a usable date

**Error responses:**
| HTTP | Code | When |
|------|------|------|
| 404 | `IMPORT_JOB_NOT_FOUND` | `jobId` is invalid or expired (jobs expire after 30 min) |

---

### `POST /api/v1/holidays/import/:jobId/commit`

Persist the parsed candidates. Creates new holidays and optionally overwrites existing ones.

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Path params:**

- `jobId` — the same ID from the upload step

**Request body:**

```json
{ "overwriteExisting": true }
```

- `overwriteExisting: true` — update holidays that already exist on a matching date
- `overwriteExisting: false` — skip candidates where `willOverwrite` is `true`

**Success response — 200:**

```json
{
  "success": true,
  "data": {
    "imported": 2,
    "overwritten": 1,
    "skipped": 0
  },
  "meta": {}
}
```

**Field notes:**

- `imported` — new holiday records created
- `overwritten` — existing records updated (0 if `overwriteExisting: false`)
- `skipped` — candidates that were skipped (unresolvable dates + overwrite-skipped)

**Error responses:**
| HTTP | Code | When |
|------|------|------|
| 404 | `IMPORT_JOB_NOT_FOUND` | `jobId` is invalid or expired |
| 409 | `JOB_ALREADY_COMMITTED` | This job was already committed |

**Side-effects:**

- Created / updated holidays should appear immediately on `GET /holidays?year=YYYY`
- No separate invalidation call is needed — the frontend refetches after a 200 response

---

## Frontend MSW reference shapes (for cross-check)

The frontend mocks return exactly these shapes. If any field name or structure differs when you ship, please ping the frontend team before merging so we can update the TypeScript types without a redeploy.

**Upload mock returns:**

```json
{ "success": true, "data": { "jobId": "imp_mock_demo_2026", "previewUrl": "..." }, "meta": {} }
```

**Preview mock returns 8 candidates** (mix of `willOverwrite: true/false`, `isOptional: true/false`), summary `{ "new": 6, "overwrites": 2, "skipped": 0 }`.

**Commit mock returns:** `{ "success": true, "data": { "imported": 6, "overwritten": 2, "skipped": 0 }, "meta": {} }`

---

---

## 3. Custom Roles CRUD

**MSW file:** `src/mocks/handlers/permissions.ts`  
**Used by:** Permissions screen (wireframe screen 14), Step 46  
**Field casing:** `camelCase` (matches permissions domain)

The frontend lets a SUPER_ADMIN or HR_ADMIN create custom roles beyond the five built-in ones and assign permissions to them. All three endpoints below are needed together.

---

### `POST /api/v1/settings/roles`

Create a new custom role for the tenant.

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Request body:**

```json
{
  "name": "Recruiter",
  "key": "RECRUITER",
  "permissions": ["employees:read", "departments:read"]
}
```

| Field         | Type     | Required | Notes                                                                                   |
| ------------- | -------- | -------- | --------------------------------------------------------------------------------------- |
| `name`        | string   | Yes      | Display label, 2–50 chars                                                               |
| `key`         | string   | Yes      | Internal identifier — uppercase letters, digits, underscores; must be unique per tenant |
| `permissions` | string[] | Yes      | Subset of the values returned by `GET /settings/roles-permissions` → `permissions[]`    |

**Success response — 201:**

```json
{
  "success": true,
  "data": {
    "key": "RECRUITER",
    "name": "Recruiter",
    "permissions": ["employees:read", "departments:read"]
  },
  "meta": {}
}
```

**Error responses:**

| HTTP | Code                 | When                                                 |
| ---- | -------------------- | ---------------------------------------------------- |
| 409  | `DUPLICATE_ROLE_KEY` | A role with this `key` already exists for the tenant |
| 422  | `VALIDATION_ERROR`   | Missing/invalid fields                               |

**Side-effects:** The new role key must appear in `GET /settings/roles-permissions` → `roles[]` and `matrix` immediately after creation (so the frontend's React Query cache, which is patched optimistically, stays in sync on a hard refresh).

---

### `DELETE /api/v1/settings/roles/:key`

Delete a custom role. Cannot delete built-in roles.

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Path params:**

- `key` — the role key to delete (e.g. `RECRUITER`)

**Success response — 200:**

```json
{
  "success": true,
  "data": { "key": "RECRUITER", "status": "deleted" },
  "meta": {}
}
```

**Error responses:**

| HTTP | Code          | When                                               |
| ---- | ------------- | -------------------------------------------------- |
| 404  | `NOT_FOUND`   | Role key does not exist                            |
| 409  | `ROLE_IN_USE` | One or more users are currently assigned this role |

---

### `POST /api/v1/settings/roles/:key/users`

Assign one or more users to a custom role. (Not yet used by the frontend — built for future user-assignment flow.)

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Request body:**

```json
{ "userIds": ["usr_a", "usr_b"] }
```

**Success response — 200:**

```json
{
  "success": true,
  "data": { "assigned": ["usr_a", "usr_b"] },
  "meta": {}
}
```

---

### How `GET /settings/roles-permissions` must change

Once custom roles exist, `GET /settings/roles-permissions` should include them in both `roles[]` and `matrix`. The current response shape already supports this — just append the custom role keys. No new fields or shape change needed.

---

## Implementation notes for the backend team

1. **Job TTL** — Import jobs (the parsed state between upload and commit) should expire after ~30 minutes. Store in Redis or a lightweight `ImportJob` table.
2. **iCalendar parsing** — Use a library like `node-ical` or `ical.js`. Extract `VEVENT` components; map `DTSTART` → `date`, `SUMMARY` → `name`. Mark `TRANSP:TRANSPARENT` events as optional (`isOptional: true`).
3. **Overwrite detection** — Compare `date` (YYYY-MM-DD) against existing `Holiday.holidayDate` for the same tenant and year.
4. **Atomicity on commit** — Wrap the upsert loop in a transaction so a partial failure doesn't leave the holiday table in an inconsistent state.
5. **Auth** — Same cookie-based auth as every other endpoint. Tenant resolved from the JWT.
