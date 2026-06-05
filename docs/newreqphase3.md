# newreqphase3.md — Phase 3 net-new API contracts

> These endpoints are **NOT yet on the backend**.
> The frontend implements MSW handlers that match these shapes exactly.
> When the backend ships an endpoint: disable the MSW handler (flip
> `NEXT_PUBLIC_USE_MOCKS=false` or delete the handler entry from
> `src/mocks/handlers/index.ts`). **No app code changes required.**
>
> **Conventions:**
>
> - All field names: **camelCase**
> - List envelope: `{ "success": true, "data": { "<collection>": [...], "pagination": { "page", "limit", "total", "totalPages" } } }`
> - Single-object envelope: `{ "success": true, "data": { ... } }`
> - Error envelope (consistent across all endpoints):
>   ```json
>   {
>     "success": false,
>     "error": { "code": "...", "message": "...", "details": [], "requestId": "..." }
>   }
>   ```
> - Roles: `SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE | AUDITOR`
> - Date reads: full ISO strings. Date writes: `YYYY-MM-DD`.

---

## Domain A — Recruitment

> Screens: `/recruitment` — Pipeline, Openings, Candidates tabs.
> MSW handler file: `src/mocks/handlers/recruitment.ts`

### GET /recruitment/summary

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER (read-only)
**Query params:** none
**Success response:**

```json
{
  "success": true,
  "data": {
    "openRequisitions": 6,
    "activeCandidates": 242,
    "interviewsThisWeek": 9,
    "avgDaysToHire": 28,
    "closingThisWeek": 2,
    "interviewsToday": 3
  }
}
```

---

### GET /recruitment/openings

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Query params:** `page` (default 1), `limit` (default 20), `status` (optional: `Open|Closing|On hold|Closed`)
**Success response:**

```json
{
  "success": true,
  "data": {
    "openings": [
      {
        "id": "ENG-198",
        "title": "Senior Backend Engineer",
        "department": "Engineering",
        "location": "Bengaluru",
        "employmentType": "FULL_TIME",
        "applicantCount": 38,
        "currentStage": "Interviewing",
        "status": "Open",
        "createdAt": "2026-04-15T00:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 6, "totalPages": 1 }
  }
}
```

**Status values:** `Open` | `Closing` | `On hold` | `Closed`
**Employment types:** `FULL_TIME` | `PART_TIME` | `CONTRACT` | `INTERNSHIP`

---

### GET /recruitment/candidates

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Query params:** `openingId` (optional), `stage` (optional), `page` (default 1), `limit` (default 50)
**Success response:**

```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": "cand_1",
        "name": "Fatima Noor",
        "role": "Senior Backend Engineer",
        "openingId": "ENG-198",
        "stage": "interview",
        "rating": 4,
        "daysInStage": 6,
        "isReferral": true,
        "tag": "ENG-198",
        "email": "fatima.noor@example.com",
        "appliedAt": "2026-05-20T00:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 11, "totalPages": 1 }
  }
}
```

**Stage values:** `applied` | `screening` | `interview` | `offer` | `hired`
**Rating:** integer 0–5 (0 = not yet rated)

---

### POST /recruitment/candidates/:id/advance

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:** `{ "stage": "interview" }` (the target stage, must be the next stage in sequence)
**Success response:**

```json
{ "success": true, "data": { "id": "cand_1", "stage": "interview", "daysInStage": 0 } }
```

**Error codes:**

- `409` — candidate already at `hired` stage (cannot advance further)
- `422` — invalid stage value or skipping stages

---

### POST /recruitment/openings

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:**

```json
{
  "title": "Frontend Engineer",
  "department": "Engineering",
  "location": "Remote",
  "employmentType": "FULL_TIME"
}
```

**Success response:** `{ "success": true, "data": { <opening object> } }`
**Error codes:**

- `422` — validation failure (missing required fields)

---

### PATCH /recruitment/openings/:id

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:** any subset of `{ title, department, location, employmentType, status }`
**Success response:** `{ "success": true, "data": { <updated opening object> } }`
**Error codes:**

- `404` — opening not found
- `422` — validation failure

---

### GET /recruitment/recruiters

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Query params:** none
**Success response:**

```json
{
  "success": true,
  "data": {
    "recruiters": [
      { "id": "rec_1", "name": "Ananya Sharma", "email": "ananya@acme.test" },
      { "id": "rec_2", "name": "Rohan Mehta", "email": "rohan@acme.test" }
    ]
  }
}
```

---

### PATCH /recruitment/candidates/:id/rating

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Request body:** `{ "rating": 4 }` — integer 1–5
**Success response:** `{ "success": true, "data": { "id": "cand_1", "rating": 4 } }`
**Error codes:**

- `422` — rating out of range (must be 1–5)
- `404` — candidate not found

---

## Domain B — Performance

> Screens: `/performance` — Reviews, Goals, Calibration tabs.
> MSW handler file: `src/mocks/handlers/performance.ts`

### GET /performance/cycles/active

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Query params:** none
**Success response:**

```json
{
  "success": true,
  "data": {
    "id": "cycle_h1_2026",
    "name": "H1 2026 Review Cycle",
    "selfReviewDue": "2026-06-07",
    "managerReviewDue": "2026-06-14",
    "calibrationDate": "2026-06-21",
    "progressPct": 58,
    "status": "In progress",
    "startedAt": "2026-05-15T00:00:00Z"
  }
}
```

**Cycle statuses:** `Upcoming` | `In progress` | `Calibrating` | `Closed`
Returns `null` in `data` if no active cycle exists.

---

### GET /performance/summary

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Query params:** none
**Success response:**

```json
{
  "success": true,
  "data": {
    "reviewsComplete": 42,
    "reviewsTotal": 73,
    "goalsOnTrackPct": 81,
    "goalsOnTrackDelta": 6,
    "avgRating": 3.4,
    "overdueReviews": 7
  }
}
```

---

### GET /performance/reviews

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Query params:** `departmentId` (optional), `status` (optional), `page` (default 1), `limit` (default 50)
**Success response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "employeeId": "emp_1",
        "employeeName": "Priya Sharma",
        "department": "Engineering",
        "reviewerName": "Aman Khanna",
        "status": "Calibrated",
        "rating": "Exceeds",
        "selfComplete": true,
        "managerComplete": true
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 7, "totalPages": 1 }
  }
}
```

**Review statuses:** `Not started` | `Self review` | `Manager review` | `Calibrated`
**Rating values:** `Exceeds` | `Strong` | `Meets` | `Developing` | `Below` | `null`

---

### GET /performance/goals

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Query params:** `status` (optional: `On track|At risk|Done`), `page` (default 1), `limit` (default 50)
**Success response:**

```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "goal_1",
        "employeeId": "emp_1",
        "employeeName": "Priya Sharma",
        "title": "Ship design-system v2 to all squads",
        "progressPct": 80,
        "dueDate": "2026-06-30",
        "status": "On track"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 6, "totalPages": 1 }
  }
}
```

**Goal statuses:** `On track` | `At risk` | `Done`

---

### GET /performance/calibration

**Role:** HR_ADMIN, SUPER_ADMIN
**Query params:** none
**Success response:**

```json
{
  "success": true,
  "data": {
    "totalReviewed": 73,
    "distribution": [
      { "rating": "Exceeds", "count": 8, "pct": 11 },
      { "rating": "Strong", "count": 19, "pct": 26 },
      { "rating": "Meets", "count": 33, "pct": 45 },
      { "rating": "Developing", "count": 10, "pct": 14 },
      { "rating": "Below", "count": 3, "pct": 4 }
    ],
    "notes": [
      {
        "tone": "warning",
        "title": "Engineering skews high",
        "body": "41% rated Strong or above vs 37% org-wide. Flagged for review on Jun 21."
      },
      {
        "tone": "success",
        "title": "Distribution within band",
        "body": "Below + Developing held under 20% target."
      }
    ]
  }
}
```

**Note tones:** `warning` | `success` | `danger` | `info`

---

### GET /performance/employees

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Query params:** none
**Purpose:** Returns the list of employees enrolled in the current (or most recent) review cycle. Used to populate the employee picker in the Add Goal dialog and the Review Detail Sheet.
**Success response:**

```json
{
  "success": true,
  "data": {
    "employees": [
      { "id": "emp_1", "name": "Priya Sharma", "department": "Engineering" },
      { "id": "emp_2", "name": "Rohan Mehta", "department": "Sales" }
    ]
  }
}
```

---

### PATCH /performance/reviews/:employeeId

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Purpose:** Submit or update the manager rating for a review. Automatically transitions the review `status` to `Calibrated` and sets `managerComplete: true`.
**URL param:** `employeeId` — the employee whose review is being rated.
**Request body:**

```json
{ "rating": "Exceeds" }
```

**Rating values:** `Exceeds` | `Strong` | `Meets` | `Developing` | `Below`

**Success response:** `200`, `data` = full updated review object

```json
{
  "success": true,
  "data": {
    "employeeId": "emp_2",
    "employeeName": "Rohan Mehta",
    "department": "Sales",
    "reviewerName": "Sneha Rao",
    "status": "Calibrated",
    "rating": "Meets",
    "selfComplete": true,
    "managerComplete": true
  }
}
```

**Error codes:**

| Code               | Status | When                                                            |
| ------------------ | ------ | --------------------------------------------------------------- |
| `NOT_FOUND`        | 404    | `employeeId` does not exist in the active cycle                 |
| `VALIDATION_ERROR` | 422    | `rating` is missing or not one of the allowed values            |
| `CONFLICT`         | 409    | Review is already `Calibrated` and locked (backend may enforce) |

---

### POST /performance/goals

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER
**Request body:**

```json
{
  "employeeId": "emp_1",
  "title": "Reduce p95 API latency below 200ms",
  "dueDate": "2026-06-30",
  "progressPct": 0
}
```

**Success response:** `{ "success": true, "data": { <goal object> } }`
**Error codes:**

- `422` — validation failure

---

## Domain C — Assets

> Screens: `/assets` — Inventory, Assigned, Requests tabs.
> MSW handler file: `src/mocks/handlers/assets.ts`

### GET /assets/summary

**Role:** HR_ADMIN, SUPER_ADMIN
**Query params:** none
**Success response:**

```json
{
  "success": true,
  "data": {
    "totalAssets": 248,
    "assigned": 201,
    "available": 38,
    "inRepair": 9,
    "utilizationPct": 81,
    "avgRepairDays": 6
  }
}
```

---

### GET /assets

**Role:** HR_ADMIN, SUPER_ADMIN
**Query params:** `type` (optional: `Laptop|Monitor|Phone|Other`), `status` (optional), `page` (default 1), `limit` (default 20)
**Success response:**

```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "asset_1",
        "tag": "LAP-0192",
        "name": "MacBook Pro 14\" M3",
        "type": "Laptop",
        "status": "Assigned",
        "assignedTo": {
          "employeeId": "emp_1",
          "name": "Priya Sharma"
        },
        "assignedSince": "2025-01-15",
        "createdAt": "2025-01-10T00:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 8, "totalPages": 1 }
  }
}
```

**Asset types:** `Laptop` | `Monitor` | `Phone` | `Other`
**Asset statuses:** `Assigned` | `Available` | `Repair` | `Retired`
`assignedTo` is `null` when status is not `Assigned`.

---

### GET /assets/requests

**Role:** HR_ADMIN, SUPER_ADMIN
**Query params:** `status` (optional), `page` (default 1), `limit` (default 20)
**Success response:**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "req_1",
        "requestedBy": {
          "employeeId": "emp_3",
          "name": "Nisha Iyer"
        },
        "item": "Monitor — 27\" 4K",
        "reason": "New hire setup",
        "requestedAt": "2026-05-27",
        "status": "Pending"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 4, "totalPages": 1 }
  }
}
```

**Request statuses:** `Pending` | `Approved` | `Fulfilled` | `Declined`

---

### PATCH /assets/requests/:id/approve

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:** `{}` (empty)
**Success response:**

```json
{ "success": true, "data": { "id": "req_1", "status": "Approved" } }
```

**Error codes:**

- `409` — request is not in `Pending` state

---

### PATCH /assets/requests/:id/decline

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:** `{ "reason": "string (optional)" }`
**Success response:**

```json
{ "success": true, "data": { "id": "req_1", "status": "Declined" } }
```

**Error codes:**

- `409` — request is not in `Pending` state

---

### GET /assets/employees

**Role:** HR_ADMIN, SUPER_ADMIN
**Query params:** none
**Purpose:** Returns a lightweight employee list for the "Assign to" dropdown (AddAssetDialog, AssetDetailSheet).
**Success response:**

```json
{
  "success": true,
  "data": [
    { "employeeId": "emp_1", "name": "Priya Sharma" },
    { "employeeId": "emp_2", "name": "Rohan Mehta" }
  ]
}
```

---

### PATCH /assets/:id/status

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:**

```json
{ "status": "Available" }
```

**Allowed status values:** `Available` | `Repair` | `Retired`
(Setting `Assigned` is not allowed via this endpoint — use `/assets/:id/assign` instead.)
When status is not `Assigned`, `assignedTo` and `assignedSince` are cleared to `null`.
**Success response:** `{ "success": true, "data": { <full asset object> } }`
**Error codes:**

- `404` — asset not found

---

### PATCH /assets/:id/assign

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:**

```json
{
  "employeeId": "emp_1",
  "name": "Priya Sharma",
  "since": "2026-06-01"
}
```

Sets `status → Assigned`, `assignedTo`, and `assignedSince`.
**Success response:** `{ "success": true, "data": { <full asset object> } }`
**Error codes:**

- `404` — asset not found
- `409` — asset is `Retired` and cannot be assigned

---

### PATCH /assets/:id/recall

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:** `{}` (empty)
Sets `status → Available`, clears `assignedTo` and `assignedSince`.
**Success response:** `{ "success": true, "data": { <full asset object> } }`
**Error codes:**

- `404` — asset not found

---

### POST /assets

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:**

```json
{
  "tag": "LAP-0210",
  "name": "MacBook Pro 14\" M4",
  "type": "Laptop",
  "assignedTo": { "employeeId": "emp_1", "name": "Priya Sharma" },
  "assignedSince": "2026-06-01"
}
```

`assignedTo` and `assignedSince` are optional. When both are provided the asset is created with `status: Assigned`; otherwise `status: Available`.
**Success response:** `{ "success": true, "data": { <full asset object> } }` — `201`
**Error codes:**

- `409` — asset tag already exists
- `422` — validation failure; `error.details[]` maps to `tag`, `name`, `type` fields

---

## Domain D — Announcements

> Screens: `/announcements` — feed + channels + events sidebar.
> MSW handler file: `src/mocks/handlers/announcements.ts`

### GET /announcements

**Role:** All authenticated roles (filtered by audience server-side)
**Query params:** `channelId` (optional), `page` (default 1), `limit` (default 20)
**Success response:**

```json
{
  "success": true,
  "data": {
    "pinned": {
      "id": "ann_0",
      "category": "Company",
      "channelId": "ch_1",
      "title": "Q2 All-Hands — Thursday 4 PM IST",
      "body": "Join the leadership team for the Q2 business review, product roadmap, and a live Q&A. Calendar invites are out; the session will be recorded for those who can't attend live.",
      "author": {
        "name": "Aman Khanna",
        "role": "Chief People Officer"
      },
      "audience": "All employees",
      "readCount": 182,
      "postedAt": "2026-06-02T07:00:00Z",
      "isPinned": true
    },
    "feed": [
      {
        "id": "ann_1",
        "category": "IT",
        "channelId": "ch_4",
        "title": "Mandatory password rotation by Jun 5",
        "body": "Single sign-on credentials must be rotated before June 5. You'll be prompted at next login — enable the authenticator app if you haven't.",
        "author": {
          "name": "Security Team",
          "role": null
        },
        "audience": "All employees",
        "readCount": 211,
        "postedAt": "2026-06-01T14:00:00Z",
        "isPinned": false
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

**Category values:** `Company` | `People` | `Product` | `IT` | `Office`
`pinned` is `null` when no announcement is pinned.

---

### GET /announcements/channels

**Role:** All authenticated roles
**Query params:** none
**Success response:**

```json
{
  "success": true,
  "data": {
    "channels": [
      { "id": "ch_1", "name": "Company-wide", "postCount": 142, "category": "Company" },
      { "id": "ch_2", "name": "People & Culture", "postCount": 38, "category": "People" },
      { "id": "ch_3", "name": "Product updates", "postCount": 51, "category": "Product" },
      { "id": "ch_4", "name": "IT & Security", "postCount": 24, "category": "IT" },
      { "id": "ch_5", "name": "Office & Facilities", "postCount": 17, "category": "Office" }
    ]
  }
}
```

---

### GET /announcements/events

**Role:** All authenticated roles
**Query params:** none
**Success response:**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "ev_1",
        "date": "2026-06-02",
        "title": "Q2 All-Hands",
        "meta": "4:00 PM · Main hall + Zoom"
      },
      {
        "id": "ev_2",
        "date": "2026-06-06",
        "title": "New-hire orientation",
        "meta": "10:00 AM · 7 joining"
      },
      {
        "id": "ev_3",
        "date": "2026-06-14",
        "title": "Manager review deadline",
        "meta": "H1 2026 cycle"
      }
    ]
  }
}
```

---

### POST /announcements/events

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:**

```json
{
  "date": "2026-07-01",
  "title": "Q3 All-Hands",
  "meta": "4:00 PM · Main hall + Zoom"
}
```

`date` must be `YYYY-MM-DD`. Event is inserted into the list sorted by date.
**Success response:** `{ "success": true, "data": { <event object> } }` — `201`
**Error codes:**

- `422` — validation failure; `error.details[]` maps to `date`, `title`, `meta`

---

### POST /announcements

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER (scoped to own team channel)
**Request body:**

```json
{
  "title": "New policy: flexible Friday hours",
  "body": "Starting July 1, all employees may flex their Friday end time by up to 2 hours.",
  "category": "People",
  "channelId": "ch_2",
  "audience": "All employees",
  "isPinned": false
}
```

**Success response:** `{ "success": true, "data": { <announcement object> } }`
**Error codes:**

- `403` — EMPLOYEE role cannot create announcements
- `422` — validation failure (missing title / body / category)

---

### PATCH /announcements/:id/pin

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:** none (empty body `{}`)

Promotes the target announcement to the pinned slot. If another announcement is
already pinned, it is demoted back to the feed (with `isPinned: false`) before
the new one is pinned.

**Success response:**

```json
{ "success": true, "data": { <announcement object with isPinned: true> } }
```

**Error codes:**

- `404` — announcement not found

---

### PATCH /announcements/:id/unpin

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:** none (empty body `{}`)

Demotes the currently pinned announcement back to the feed (prepended, `isPinned: false`).

**Success response:**

```json
{ "success": true, "data": { "unpinned": true } }
```

**Error codes:**

- `409` — announcement is not currently pinned

---

## Domain E — Departments (existing endpoint extensions)

> These are **changes to existing live endpoints**, not new routes.
> The backend must be updated to accept the `headEmployeeId` field.
> MSW is not needed — the existing handlers pass through to the live backend.
> When the backend ships support, the frontend will work automatically (the field
> is already sent in the request payload).

### PATCH /departments/:id — add headEmployeeId

**Change:** Accept `headEmployeeId` in the request body (already in the response shape).

**Role:** HR_ADMIN, SUPER_ADMIN
**Updated body (any subset — existing fields unchanged):**

```json
{
  "name": "Engineering",
  "departmentCode": "ENG",
  "parentId": null,
  "headEmployeeId": "emp_abc123",
  "headEmployeeFirstName": "Aman",
  "headEmployeeLastName": "Khanna"
}
```

`headEmployeeFirstName` and `headEmployeeLastName` are sent alongside `headEmployeeId` for
denormalization / audit purposes. The backend should treat them as informational — the
authoritative name is always resolved from the employee record via `headEmployeeId`.

Setting `headEmployeeId: null` clears the department head (send `headEmployeeFirstName: null,
headEmployeeLastName: null` in the same call).
The employee must exist and be `ACTIVE`; otherwise return `422` with field error `headEmployeeId`.

**Success response:** `200`, `data` = updated department object (unchanged shape — `headEmployeeId` and `headEmployee` already present)

**New error codes:**

| Code                    | Status | When                             |
| ----------------------- | ------ | -------------------------------- |
| `INVALID_HEAD_EMPLOYEE` | 422    | Employee not found or not ACTIVE |

---

### POST /departments — add headEmployeeId

**Change:** Accept optional `headEmployeeId` on create (same validation as PATCH above).

**Role:** HR_ADMIN, SUPER_ADMIN
**Updated body:**

```json
{
  "name": "Design",
  "departmentCode": "DES",
  "parentId": "dept_engineering_id",
  "headEmployeeId": "emp_abc123"
}
```

`headEmployeeId` is optional — omit or pass `null` to create with no head.

**Success response:** `201`, `data` = created department object

---

## Domain F — Payroll Global Implementation

> Drives BUILD_PLAN "PHASE: Payroll Global Implementation" (Steps 93–117). Standing
> rules: `CLAUDE.md §26`. Design: `docs/payroll/PAYROLL_SYSTEM_DESIGN.md`.
> **Money:** all amounts are **integer minor units** + an ISO 4217 `currency` field
> (zero-decimal-currency aware). **Casing:** camelCase. **MSW-first** — no live
> payroll backend exists.

### F.0 — API_MAPPING.md analysis (what changes on the live contract)

- **`API_MAPPING.md` contains NO payroll endpoints.** Payroll (and `/reports/payroll`)
  is entirely MSW-backed (`docs/phase2api.md` Domains 1–3). Therefore **no live
  payroll API changes** — every payroll endpoint is net-new or an MSW-contract extension.
- **`/employees` (live) is NOT changed.** Decision locked (CLAUDE.md §26): country,
  legal entity, work location, bank account, statutory profile, and salary all live
  under `/payroll/*`. Do **not** add payroll fields to the employees endpoint.
- **Existing MSW payroll contract (`phase2api.md`) evolves** — documented as
  "extensions" below (component types, `EmployeeSalary` bank/country shape, run `type`,
  computed payslip fields). When a real backend ships, these supersede the
  `phase2api.md` versions.

Endpoints are grouped P0→P3 (matching the steps). **Foundational endpoints (P0/P1)
carry full shapes; later endpoints carry method/path/role/purpose + key fields and are
finalized in their BUILD_PLAN step per §22.**

---

### F.1 — Localization (Step 94–95)

#### `GET /payroll/countries`

**Roles:** HR_ADMIN, SUPER_ADMIN. Returns supported countries.

```json
{
  "success": true,
  "data": [
    {
      "code": "IN",
      "name": "India",
      "currency": "INR",
      "locale": "en-IN",
      "fiscalYearStartMonth": 4
    },
    {
      "code": "US",
      "name": "United States",
      "currency": "USD",
      "locale": "en-US",
      "fiscalYearStartMonth": 1
    }
  ]
}
```

#### `GET/POST/PATCH /payroll/legal-entities`

**Roles:** SUPER_ADMIN (write), HR_ADMIN (read).

```json
{
  "id": "le_in",
  "name": "Acme India Pvt Ltd",
  "country": "IN",
  "currency": "INR",
  "fiscalYearStartMonth": 4,
  "timezone": "Asia/Kolkata",
  "locale": "en-IN",
  "registrationIds": { "PF": "MHBAN1234567", "ESI": "12345678901234", "PAN": "AAAAA1234A" },
  "statutoryPackId": "pack_in_2026",
  "payCalendarId": "cal_in_monthly",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

#### `GET /payroll/countries/:code/bank-schema`

**Roles:** HR_ADMIN, SUPER_ADMIN. Field defs to render the bank form via `DynamicForm`.

```json
{
  "success": true,
  "data": {
    "country": "IN",
    "fields": [
      { "key": "accountName", "label": "Account holder name", "type": "text", "required": true },
      {
        "key": "accountNumber",
        "label": "Account number",
        "type": "text",
        "required": true,
        "regex": "^[0-9]{9,18}$"
      },
      {
        "key": "ifsc",
        "label": "IFSC code",
        "type": "text",
        "required": true,
        "regex": "^[A-Z]{4}0[A-Z0-9]{6}$"
      }
    ]
  }
}
```

> US returns `routingNumber + accountNumber + accountType`; UK `sortCode + accountNumber`;
> SEPA `iban + bic`. Same envelope, country-specific `fields`.

---

### F.2 — Salary component extensions (Step 93)

**Extends** `phase2api.md §1.1`. `POST/PATCH /payroll/components` and the list item gain:

```jsonc
{
  "type": "EMPLOYER_CONTRIBUTION", // new: EARNING | DEDUCTION | EMPLOYER_CONTRIBUTION | BENEFIT | REIMBURSEMENT | VARIABLE
  "statutoryTag": "PF_WAGE", // string|null — which wage base this earning feeds (for §F.3)
  "prorate": true, // boolean — does LOP reduce this component
  "payInPeriods": null, // number[]|null — for scheduled comps (13th-month, etc.); null = every period
}
```

- `EMPLOYER_CONTRIBUTION` is an employer **cost** — included in CTC/employerCost,
  **never** reduces `netPay`.
- New error: `400 INVALID_STATUTORY_TAG` — `statutoryTag` not known to the active pack.

---

### F.3 — Statutory & tax engine (Step 97–99)

#### `GET/POST/PATCH /payroll/statutory-packs`

**Roles:** SUPER_ADMIN (write), HR_ADMIN (read). Versioned, effective-dated, country-scoped.

```jsonc
{
  "id": "pack_in_2026",
  "country": "IN",
  "version": "2026.1",
  "effectiveFrom": "2026-04-01",
  "effectiveTo": null,
  "rounding": { "mode": "NEAREST", "precision": 0 },
  "proration": { "basis": "CALENDAR_DAYS" }, // CALENDAR_DAYS | WORKING_DAYS | FIXED_30
  "taxRegimes": [
    {
      "code": "IN_NEW_REGIME",
      "fiscalYear": "2026-27",
      "currency": "INR",
      "standardDeduction": 7500000, // minor units
      "slabs": [
        { "from": 0, "to": 40000000, "rate": 0 },
        { "from": 40000000, "to": 80000000, "rate": 5 },
        { "from": 80000000, "to": null, "rate": 30 },
      ],
      "surcharge": [{ "thresholdAnnual": 500000000, "rate": 10 }],
      "cess": { "rate": 4 },
      "allowedExemptions": ["HRA", "LTA", "80C", "80D", "STD_DEDUCTION"],
    },
  ],
  "contributionSchemes": [
    {
      "code": "IN_EPF",
      "name": "Employees' Provident Fund",
      "wageBaseTag": "PF_WAGE",
      "wageCeiling": 1500000, // minor units
      "employee": { "rate": 12, "component": "PF" }, // component code is tenant-defined
      "employer": { "rate": 12, "component": "PF_ER", "split": { "EPS": 8.33, "EPF": 3.67 } },
      "applicability": "GROSS_BELOW_CEILING_OPTIONAL",
    },
  ],
  "localTaxes": [
    {
      "code": "IN_MH_PT",
      "name": "Professional Tax (Maharashtra)",
      "jurisdiction": "IN-MH",
      "component": "PROF_TAX",
      "slabs": [
        { "from": 0, "to": 750000, "amount": 0 },
        { "from": 750000, "to": null, "amount": 20000 },
      ],
    },
  ],
  "statutoryComponents": ["PF_EE", "PF_ER", "ESI_EE", "ESI_ER", "PROF_TAX", "TDS"],
}
```

- Errors: `409 PACK_VERSION_EXISTS`, `422 INVALID_PACK` (overlapping effective ranges,
  unknown component codes).
- **List:** `GET /payroll/statutory-packs[?country=IN]` → `{ success, data: StatutoryPack[] }`.
  `GET /payroll/statutory-packs/:id` → `{ success, data: StatutoryPack }`. Seeds: `pack_in_2026`
  (IN, 2026.1) and `pack_us_2026` (US, 2026.1).
- **Run pinning:** `PayrollRun` gains `configSnapshotRef` — the pack id+version pinned at
  `calculate` time, resolved by the run's entity country + period. Recompute uses the pinned
  version (reproducibility). Shape:

```jsonc
{
  "statutoryPackId": "pack_in_2026",
  "country": "IN",
  "version": "2026.1",
  "effectiveFrom": "2026-04-01",
  "pinnedAt": "2026-06-06T10:00:00.000Z",
}
```

> `tax-regimes` and `contribution-schemes` may also be exposed as standalone CRUD
> (`GET/POST/PATCH /payroll/tax-regimes`, `/payroll/contribution-schemes`) scoped to a
> pack version — finalized in Steps 98–99.

**Tax computation (Step 98 — engine behavior, no new route).** Income tax is computed
from the pinned pack's `taxRegimes[0]`, never a flat rate in code:

- The engine projects full-year taxable income (taxable earnings × 12), applies the
  regime: `standardDeduction` → progressive `slabs` (each band taxes only its own
  portion) → highest applicable `surcharge` band (on tax) → `cess` (on tax + surcharge),
  then spreads the annual tax across the year (÷ remaining periods). YTD true-up is
  wired in Step 100.
- Progressive brackets are evaluated by the `SLAB(value, tableCode)` formula function
  (with `CLAMP(v, lo, hi)`); a tenant can reference a regime's table by code in any
  component formula. No `IF()` chains, no per-country code.
- The computed amount overrides the `TDS` payslip line; recompute is reproducible
  (same pinned pack → same numbers).

**Statutory contributions (Step 99 — engine behavior, no new route).** For each
`contributionScheme` in the pinned pack, the engine builds the **wage base** from
earnings whose component `statutoryTag` matches the scheme's `wageBaseTag`, caps it at
`wageCeiling`, then posts the employee `rate` as a **deduction** (`employee.component`)
and the employer `rate` as an **employer contribution** (`employer.component`, an
employer cost — never reduces net). Schemes with no tagged earnings (zero base) are not
applicable and emit nothing. Component codes referenced by a scheme are tenant-defined
(the IN seed uses `PF` / `PF_ER`).

---

### F.4 — Employee payroll (Step 95, 100, 102, 103)

#### `EmployeeSalary` extension (Step 95)

Replaces the hardcoded India bank fields (`bankIfscCode`, …) with:

```jsonc
{
  "country": "IN",
  "currency": "INR",
  "annualCtc": 120000000, // minor units
  "rateType": "ANNUAL", // ANNUAL | MONTHLY | HOURLY | DAILY
  "bankAccount": { "accountName": "...", "accountNumber": "...", "ifsc": "..." }, // shape from §F.1 bank-schema
  "residenceJurisdiction": "IN-MH", // Step 106
  "workLocations": [{ "jurisdiction": "IN-MH", "allocationPct": 100 }], // Step 106
}
```

#### `GET /payroll/employees/:id/ytd?fy=YYYY-YY` (Step 100)

Per-employee, per-fiscal-year cumulative ledger, accumulated from the fiscal-year
start through the current period (the fiscal-year start month comes from the
employee's country — IN = April). Omitting `fy` returns the current fiscal year.
The same shape is embedded on each computed payslip as `payslip.ytd`.

```json
{
  "success": true,
  "data": {
    "fiscalYear": "2026-27",
    "monthsElapsed": 3,
    "grossEarnings": 60000000,
    "taxableIncome": 52000000,
    "taxDeducted": 3960000,
    "totalDeductions": 5760000,
    "netPay": 54240000,
    "contributions": { "PF": 360000, "PF_ER": 360000 }
  }
}
```

> The income-tax `taxDeducted` uses a **YTD true-up**: each period withholds the
> remaining projected annual tax over the periods left, so withholding is smooth and
> self-correcting (component codes follow the tenant's seed — IN uses `PF` / `PF_ER`).

#### `GET/POST/PATCH /payroll/employees/:id/tax-declaration` (Step 102)

`GET ?fy=YYYY-YY` returns the stored declaration, or a default
`{ employeeId, fiscalYear, regime: <pack's first regime>, items: [] }`. `POST` replaces
the declaration; `PATCH` merges `regime` / `items` (HR uses it to set `proofStatus`).

```jsonc
{
  "employeeId": "emp-004",
  "fiscalYear": "2026-27",
  "regime": "IN_NEW_REGIME", // chosen from the pack's taxRegimes
  "items": [
    { "code": "80C", "amount": 15000000, "proofStatus": "PENDING" },
    {
      "code": "HRA",
      "amount": 30000000,
      "meta": { "rentPaid": 30000000, "metro": true },
      "proofStatus": "VERIFIED", // PENDING | VERIFIED | REJECTED
    },
  ],
}
```

> **Engine effect:** the run picks the declaration's `regime` (falling back to the pack's
> first) and reduces annual taxable income by the sum of **VERIFIED** items whose `code` is
> in that regime's `allowedExemptions` (excluding `STD_DEDUCTION`). The IN pack now ships
> two regimes — `IN_NEW_REGIME` (concessional rates, exemptions disallowed) and
> `IN_OLD_REGIME` (higher rates, exemptions allowed) — so regime choice is meaningful.

#### `GET/POST/PATCH /payroll/employees/:id/loans` (Step 103)

`Loan` = `{ id, employeeId, type: LOAN|ADVANCE, principal, currency, interestMethod: REDUCING|FLAT|ZERO,
annualRatePct, tenureMonths, startPeriod, emiAmount, schedule[], outstandingBalance, status: ACTIVE|CLOSED|FORECLOSED, forecloseFromPeriod }`.
Each `schedule[]` entry is `{ installmentNo, period, emi, principalComponent, interestComponent, balanceAfter, status: PENDING|RECOVERED }`
(amounts minor units). Installment recovery + `outstandingBalance` are **derived from the calendar**
(installments with `period < now` are RECOVERED). `PATCH .../loans/:loanId { action: "foreclose" }`
stops EMIs from the current period; `422 INVALID_LOAN` on non-positive principal/tenure.

> **Engine effect:** for each active loan with a schedule entry for the run's period, the engine
> recovers the EMI as a **deduction** (`EMI_<loanId>`), reducing net pay. Foreclosed loans stop
> from `forecloseFromPeriod`. Outstanding balance carries to FnF (Step 105).

---

### F.5 — Payroll runs (Step 96, 101, 105, 108)

#### `POST /payroll/runs/:id/calculate` — **real compute** (Step 96)

**No new route** — behavior change. The engine iterates included employees, runs the
component graph per their salary config, applies proration, and persists **computed**
payslips. Response unchanged (`202` + `{ status, estimatedSeconds }`); subsequent
`GET /payroll/runs/:id` returns **derived** totals/summary (not hardcoded). Computed
payslip detail adds `employerContributions[]` and (Step 100) a `ytd` block.

#### Run inputs (Step 101)

- `GET /payroll/runs/:runId/inputs` → `{ runId, period, editable, inputs: PayrollInput[] }`.
  `editable` is true only while the run is `DRAFT`. `PayrollInput` =
  `{ employeeId, employeeCode, employeeName, lopDays, leaveDays, otHours, variablePay: Record<code,amount>, oneTime: { label, amount, kind: ADDITION|DEDUCTION }[] }`.
  Inputs are lazily seeded from the roster; **`lopDays` defaults from attendance**.
- `PATCH /payroll/runs/:runId/inputs/:employeeId` — partial update of one employee's input
  (`{ lopDays? , leaveDays? , otHours? , variablePay? , oneTime? }`). `404` if the employee
  is not in the run.
- `POST /payroll/runs/:runId/inputs/import` — body `{ csv }` (header row +
  `employeeCode,lopDays,otHours,leaveDays`); returns `{ updated, skipped, errors[] }`.
- **Effect on calculate:** the engine prorates payable components by `lopDays`, prices
  `otHours` at the OT component's configurable multiplier (× hourly rate), pulls
  `VARIABLE` component amounts from `variablePay`, and folds `oneTime` into net pay.
  Reads (`GET payslips` / run) reflect the stored inputs, so re-calculation is reproducible.

#### Run types (Step 105)

`POST /payroll/runs` body gains `type: REGULAR | OFF_CYCLE | BONUS | ARREARS | FNF | REVERSAL`
(default `REGULAR`) and, for FnF, `fnf: { employeeId, lastWorkingDay, yearsOfService, leaveBalanceDays, noticeShortfallDays }`.
`409 RUN_EXISTS` applies only to a second **REGULAR** run for a period (off-cycle/bonus/FnF
coexist); `422 INVALID_RUN_TYPE` on an unknown type. The run carries `type`, plus
`employeeId` + `fnfParams` for FnF.

- `GET /payroll/runs/:id/fnf` → `FnfSettlement` `{ employeeId, employeeName, lastWorkingDay,
currency, earnings[], deductions[], grossPayable, totalRecovery, netSettlement }` (amounts
  minor units). Earnings = pro-rated salary + leave encashment + **gratuity** (from the pinned
  pack's `gratuity` policy: `daysPerYear`/`monthDivisor`/`minYears`); deductions = notice
  recovery + outstanding-**loan recovery** + final tax. Calculating an FnF run sets the run
  totals from the settlement.
- `GET /payroll/roster` → `{ employeeId, employeeCode, employeeName }[]` (run-subject picker).

> Arrears auto-detection from back-dated comp revisions is recorded via the `ARREARS` type;
> full arrears computation lands with the broader run-recompute work (Step 108).

#### Approvals, variance, dry-run (Step 108)

- `POST /payroll/runs/:id/approvals/:level` — multi-level; enforces maker ≠ checker (`403 SELF_APPROVAL`).
- `GET /payroll/runs/:id/variance` — anomaly list (net Δ% vs last period, negatives, zero-pay).
- `POST /payroll/runs/:id/calculate?dryRun=true` — compute without persisting/publishing.
- `POST /payroll/runs/:id/payslips/:slipId/recalculate` — single-employee reprocess.

---

### F.6 — Claims & variable pay (Step 104)

`GET/POST/PATCH /payroll/reimbursement-claims` — `{ id, employeeId, category, amount,
currency, description?, proofUrl, status: SUBMITTED|APPROVED|REJECTED|PAID, runId, submittedAt, decidedAt }`.
`GET ?employeeId=&status=` filters; `POST { ...input, employeeId }` (errors `422 CLAIM_OVER_CAP`);
`PATCH :id { status: APPROVED|REJECTED }` decides. `GET /payroll/reimbursement-categories`
→ `{ code, label, monthlyCap }[]` (per-category caps, minor units).

> **Run lifecycle:** on `calculate`, **approved, unattached** claims attach to the run
> (`runId` set) and the engine pays each as a **non-taxable one-time addition**; on
> `mark-paid` the attached claims become `PAID`. Structured **variable pay**
> (incentive/commission/bonus) is entered per employee in the run inputs (`variablePay`,
> §F.5) and the engine emits an earning line even when the component is not in the pay group.

---

### F.7 — Garnishments (Step 107)

`GET/POST/PATCH/DELETE /payroll/employees/:id/garnishments` —
`{ id, type, priority, amount: { kind: 'FLAT'|'PERCENT_OF_DISPOSABLE', value }, protectedEarningsFloor, cap, reference, effectiveFrom, effectiveTo }`.
Engine applies after statutory, before voluntary; honors priority + floor.

---

### F.8 — Global employment models (Step 109)

- Worker record gains `classification: EMPLOYEE | CONTRACTOR | EOR`.
- `GET/POST/PATCH /payroll/contractor-invoices` — `{ id, workerId, period, amount,
currency, withholdingPct, status, payoutRef }`.
- `GET /payroll/cost-summary?groupBy=entity|currency|classification` — FX-consolidated cost.

---

### F.9 — Disbursement (Step 110)

- `POST /payroll/runs/:id/payment-batch` → `{ id, runId, count, totalAmount, currency, status }`.
- `GET /payroll/runs/:id/bank-file?format=NACH|ACH|SEPA|BACS` → file download (format config-driven).
- `GET /payroll/payment-batches/:id/status` → per-payslip `PENDING|PROCESSING|PAID|FAILED|RETURNED`.

---

### F.10 — Documents & events (Step 111–112)

- `GET/PATCH /payroll/payslip-templates` — `{ id, name, locale, sections[], logoUrl, fields[] }`.
- `POST /payroll/runs/:id/publish` — make payslips visible to employees.
- `GET /payroll/employees/:id/tax-form?fy=&type=FORM16|W2|P60` — generated document (from YTD + pack).
- **Event catalogue** (webhooks/notifications): `payroll.run.created|calculated|approved|paid`,
  `payslip.published`, `payment.failed`, `salary.revised`, `claim.approved`.

---

### F.11 — Accounting (Step 113)

- `GET /payroll/runs/:id/journal` → double-entry lines
  `{ account, costCenter, debit, credit, currency }[]` (mapped via component `glAccountCode`/`costCenterRule`).
- `GET /payroll/runs/:id/journal/export?format=TALLY|QUICKBOOKS|CSV`.

---

### F.12 — Statutory filing & registers (Step 114)

- `GET /payroll/runs/:id/statutory-return?type=ECR|24Q|RTI` → exporter driven by the pack.
- Payroll **registers** (salary, statutory, bank-advice, variance) surface in the
  Reports module payroll category (reuse existing report shapes).

---

### F.13 — Onboarding & migration (Step 115)

- `POST /payroll/employees/:id/opening-balances` — opening YTD for mid-year go-live.
- `POST /payroll/migration/historical-payslips` — bulk import prior payslips.
- `POST /payroll/runs/:id/parallel-reconcile` — diff computed vs. legacy figures → reconciliation report.
- `GET/POST/PATCH /payroll/pay-calendars` — `{ frequency, periodAnchor, payDateRule, cutoffDay, holidayCalendarId }`.

---

### F.14 — Compliance reporting (Step 116)

- `GET /payroll/reports/pay-equity?groupBy=gender|level|location` → gap metrics.
- `GET /payroll/reports/audit-pack?runId=` → immutable run history + approval chain +
  config-version pins + override log (export).
- Data residency/retention config: `GET/PATCH /payroll/settings/data-policy`.
  **New error codes:** same `INVALID_HEAD_EMPLOYEE` (422) as PATCH above.
