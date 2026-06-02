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

### POST /assets

**Role:** HR_ADMIN, SUPER_ADMIN
**Request body:**

```json
{
  "tag": "LAP-0210",
  "name": "MacBook Pro 14\" M4",
  "type": "Laptop"
}
```

**Success response:** `{ "success": true, "data": { <asset object> } }`
**Error codes:**

- `409` — asset tag already exists
- `422` — validation failure

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
      { "id": "ch_1", "name": "Company-wide", "postCount": 142 },
      { "id": "ch_2", "name": "People & Culture", "postCount": 38 },
      { "id": "ch_3", "name": "Product updates", "postCount": 51 },
      { "id": "ch_4", "name": "IT & Security", "postCount": 24 },
      { "id": "ch_5", "name": "Office & Facilities", "postCount": 17 }
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
