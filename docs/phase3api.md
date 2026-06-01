# Phase 3 API Specification

> **For the backend team.** This file defines the endpoints needed by the four
> new Phase 3 frontend modules: Recruitment, Performance, Assets, Announcements.
> All endpoints follow the same envelope as the existing API:
>
> Success: `{ "success": true, "data": <payload>, "meta": {} }`
> Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": {} } }`
>
> Auth: cookie-based (`accessToken` httpOnly). No `X-Tenant-Key` header needed after login.
> Base path: `/api/v1` (same as all other endpoints).

---

## Domain 1 — Recruitment

### Roles

| Operation            | Minimum role          |
| -------------------- | --------------------- |
| Read jobs/candidates | HR_ADMIN, SUPER_ADMIN |
| Create/update jobs   | HR_ADMIN, SUPER_ADMIN |
| Advance candidates   | HR_ADMIN, SUPER_ADMIN |

### Enums

```
RecruitStage:  APPLIED | SCREENING | INTERVIEW | OFFER | HIRED | REJECTED
OpeningStatus: OPEN | CLOSING | ON_HOLD | CLOSED
EmploymentType: FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP
```

---

### `GET /recruitment/jobs`

**Query params:** `page` (default 1), `limit` (default 20), `status` (OpeningStatus), `departmentId`, `search`

**Response `data`:**

```json
{
  "jobs": [
    {
      "id": "cuid",
      "requisitionCode": "ENG-204",
      "title": "Frontend Engineer",
      "departmentId": "cuid",
      "department": { "id": "cuid", "name": "Engineering" },
      "location": "Bengaluru",
      "employmentType": "FULL_TIME",
      "applicantCount": 64,
      "currentStage": "Sourcing",
      "status": "OPEN",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-27T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 6, "pages": 1 }
}
```

---

### `GET /recruitment/jobs/:id`

**Response `data`:** Full job object as above, plus:

```json
{
  "stageCounts": {
    "APPLIED": 4,
    "SCREENING": 3,
    "INTERVIEW": 2,
    "OFFER": 1,
    "HIRED": 1,
    "REJECTED": 2
  }
}
```

---

### `POST /recruitment/jobs`

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Body:**

```json
{
  "title": "Frontend Engineer",
  "departmentId": "cuid",
  "location": "Bengaluru",
  "employmentType": "FULL_TIME",
  "description": "Optional job description"
}
```

**Response:** 201, `data` = full job object.

**Error codes:**
| Code | Status | When |
|------|--------|------|
| `VALIDATION_ERROR` | 422 | Missing required fields |
| `DEPARTMENT_NOT_FOUND` | 404 | departmentId doesn't exist |

---

### `PATCH /recruitment/jobs/:id`

**Body:** any subset of `{ title, location, employmentType, status, description }`

**Response:** 200, `data` = updated job.

**Error codes:** `JOB_NOT_FOUND` (404), `VALIDATION_ERROR` (422)

---

### `GET /recruitment/candidates`

**Query params:** `page`, `limit`, `stage` (RecruitStage), `jobOpeningId`, `search`

**Response `data`:**

```json
{
  "candidates": [
    {
      "id": "cuid",
      "name": "Ishaan Verma",
      "email": "ishaan.verma@email.com",
      "role": "Frontend Engineer",
      "jobOpeningId": "cuid",
      "jobOpening": { "id": "cuid", "requisitionCode": "ENG-204", "title": "Frontend Engineer" },
      "currentStage": "APPLIED",
      "rating": 0,
      "daysInStage": 1,
      "isReferral": false,
      "createdAt": "2026-05-26T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 16, "pages": 1 }
}
```

---

### `POST /recruitment/candidates`

**Body:**

```json
{
  "name": "Candidate Name",
  "email": "candidate@email.com",
  "role": "Role applied for",
  "jobOpeningId": "cuid",
  "isReferral": false
}
```

**Response:** 201, `data` = full candidate object.

**Error codes:** `JOB_NOT_FOUND` (404), `DUPLICATE_CANDIDATE_EMAIL` (409), `VALIDATION_ERROR` (422)

---

### `PATCH /recruitment/candidates/:id/stage`

**Body:**

```json
{ "stage": "SCREENING" }
```

**Response:** 200, `data` = updated candidate object.

**Error codes:** `CANDIDATE_NOT_FOUND` (404), `INVALID_STAGE_TRANSITION` (409), `VALIDATION_ERROR` (422)

---

### `GET /recruitment/stats`

**Response `data`:**

```json
{
  "openReqs": 6,
  "activeCandidates": 242,
  "interviewsThisWeek": 9,
  "avgTimeToHireDays": 28
}
```

---

## Domain 2 — Performance

### Roles

| Operation                    | Minimum role                   |
| ---------------------------- | ------------------------------ |
| Read cycles, reviews, goals  | HR_ADMIN, SUPER_ADMIN, MANAGER |
| Create cycles / manage goals | HR_ADMIN, SUPER_ADMIN          |
| Submit self-review           | EMPLOYEE (own record only)     |
| Submit manager review        | MANAGER (own reports only)     |
| Calibrate ratings            | HR_ADMIN, SUPER_ADMIN          |

### Enums

```
CycleStatus:   DRAFT | ACTIVE | CLOSED
ReviewStatus:  NOT_STARTED | SELF_REVIEW | MANAGER_REVIEW | CALIBRATED
Rating:        EXCEEDS | STRONG | MEETS | DEVELOPING | BELOW
GoalStatus:    ON_TRACK | AT_RISK | DONE | CANCELLED
```

---

### `GET /performance/cycles`

**Response `data`:**

```json
[
  {
    "id": "cuid",
    "name": "H1 2026 Review Cycle",
    "status": "ACTIVE",
    "selfReviewDue": "2026-06-07T00:00:00.000Z",
    "managerReviewDue": "2026-06-14T00:00:00.000Z",
    "calibrationDate": "2026-06-21T00:00:00.000Z",
    "progressPercent": 58,
    "createdAt": "2026-04-01T00:00:00.000Z"
  }
]
```

---

### `GET /performance/cycles/active`

Returns the single currently-active cycle or `null` if none.

**Response `data`:** single cycle object (same shape as above) or `null`.

---

### `GET /performance/cycles/:id/reviews`

**Query params:** `page`, `limit`, `status` (ReviewStatus), `departmentId`

**Response `data`:**

```json
{
  "reviews": [
    {
      "id": "cuid",
      "cycleId": "cuid",
      "employee": {
        "id": "cuid",
        "firstName": "Priya",
        "lastName": "Sharma",
        "department": { "id": "cuid", "name": "Engineering" }
      },
      "reviewer": { "id": "cuid", "firstName": "Aman", "lastName": "Khanna" },
      "status": "CALIBRATED",
      "rating": "EXCEEDS",
      "selfSubmitted": true,
      "managerSubmitted": true,
      "updatedAt": "2026-06-10T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 7, "pages": 1 }
}
```

---

### `PATCH /performance/reviews/:id`

**Body:**

```json
{ "status": "CALIBRATED", "rating": "STRONG", "managerComment": "Consistent delivery." }
```

All fields optional. Response: 200, `data` = updated review.

**Error codes:** `REVIEW_NOT_FOUND` (404), `CYCLE_NOT_ACTIVE` (409), `VALIDATION_ERROR` (422)

---

### `GET /performance/goals`

**Query params:** `page`, `limit`, `status` (GoalStatus), `employeeId`, `cycleId`

**Response `data`:**

```json
{
  "goals": [
    {
      "id": "cuid",
      "cycleId": "cuid",
      "employee": { "id": "cuid", "firstName": "Priya", "lastName": "Sharma" },
      "title": "Ship design-system v2 to all squads",
      "progressPercent": 80,
      "dueDate": "2026-06-30T00:00:00.000Z",
      "status": "ON_TRACK",
      "createdAt": "2026-04-15T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 6, "pages": 1 }
}
```

---

### `POST /performance/goals`

**Body:**

```json
{
  "cycleId": "cuid",
  "employeeId": "cuid",
  "title": "Reduce API p95 latency to under 200ms",
  "dueDate": "2026-06-30",
  "progressPercent": 0
}
```

**Response:** 201, `data` = full goal object.

**Error codes:** `CYCLE_NOT_FOUND` (404), `EMPLOYEE_NOT_FOUND` (404), `VALIDATION_ERROR` (422)

---

### `PATCH /performance/goals/:id`

**Body:** any subset of `{ title, progressPercent, dueDate, status }`

**Response:** 200, `data` = updated goal.

**Error codes:** `GOAL_NOT_FOUND` (404), `VALIDATION_ERROR` (422)

---

### `GET /performance/calibration`

Returns rating distribution for a given cycle.

**Query params:** `cycleId` (required)

**Response `data`:**

```json
{
  "cycleId": "cuid",
  "totalReviewed": 73,
  "distribution": [
    { "rating": "EXCEEDS", "count": 8, "percentOfTotal": 11 },
    { "rating": "STRONG", "count": 19, "percentOfTotal": 26 },
    { "rating": "MEETS", "count": 33, "percentOfTotal": 45 },
    { "rating": "DEVELOPING", "count": 10, "percentOfTotal": 14 },
    { "rating": "BELOW", "count": 3, "percentOfTotal": 4 }
  ]
}
```

---

## Domain 3 — Assets

### Roles

| Operation               | Minimum role          |
| ----------------------- | --------------------- |
| View all assets         | HR_ADMIN, SUPER_ADMIN |
| Create / update assets  | HR_ADMIN, SUPER_ADMIN |
| Submit asset request    | EMPLOYEE (own only)   |
| Approve/decline request | HR_ADMIN, SUPER_ADMIN |

### Enums

```
AssetStatus:   ASSIGNED | AVAILABLE | REPAIR | RETIRED
AssetType:     LAPTOP | MONITOR | PHONE | OTHER
RequestStatus: PENDING | APPROVED | FULFILLED | DECLINED
```

---

### `GET /assets`

**Query params:** `page`, `limit`, `assetType` (AssetType), `status` (AssetStatus), `search`

**Response `data`:**

```json
{
  "assets": [
    {
      "id": "cuid",
      "assetTag": "LAP-0192",
      "name": "MacBook Pro 14\" M3",
      "assetType": "LAPTOP",
      "status": "ASSIGNED",
      "assignedTo": {
        "id": "cuid",
        "firstName": "Priya",
        "lastName": "Sharma"
      },
      "assignedSince": "2025-01-15T00:00:00.000Z",
      "createdAt": "2025-01-15T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8, "pages": 1 }
}
```

---

### `GET /assets/assigned`

Returns only assets with `status: ASSIGNED`. Same shape as `GET /assets` filtered.

---

### `POST /assets`

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Body:**

```json
{
  "assetTag": "LAP-0210",
  "name": "MacBook Pro 14\" M4",
  "assetType": "LAPTOP"
}
```

**Response:** 201, `data` = full asset object.

**Error codes:** `DUPLICATE_ASSET_TAG` (409), `VALIDATION_ERROR` (422)

---

### `PATCH /assets/:id`

**Body:** any subset of `{ name, status, assignedToId, assignedSince }`

**Response:** 200, `data` = updated asset.

**Error codes:** `ASSET_NOT_FOUND` (404), `EMPLOYEE_NOT_FOUND` (404), `VALIDATION_ERROR` (422)

---

### `GET /assets/requests`

**Query params:** `page`, `limit`, `status` (RequestStatus)

**Response `data`:**

```json
{
  "requests": [
    {
      "id": "cuid",
      "requestedBy": { "id": "cuid", "firstName": "Nisha", "lastName": "Iyer" },
      "item": "Monitor — 27\" 4K",
      "reason": "New hire setup",
      "requestDate": "2026-05-27T00:00:00.000Z",
      "status": "PENDING",
      "createdAt": "2026-05-27T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 4, "pages": 1 }
}
```

---

### `POST /assets/requests`

**Body:**

```json
{
  "item": "Monitor — 27\" 4K",
  "reason": "New hire setup"
}
```

**Response:** 201, `data` = full request object.

**Error codes:** `VALIDATION_ERROR` (422)

---

### `PATCH /assets/requests/:id/approve`

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Body:** `{}` (empty, or `{ "notes": "Approved. Will process by Friday." }`)

**Response:** 200, `data` = updated request (`status: "APPROVED"`).

**Error codes:** `REQUEST_NOT_FOUND` (404), `REQUEST_ALREADY_DECIDED` (409)

---

### `PATCH /assets/requests/:id/decline`

**Required roles:** HR_ADMIN, SUPER_ADMIN

**Body:** `{ "reason": "Budget not available this quarter." }` (optional)

**Response:** 200, `data` = updated request (`status: "DECLINED"`).

**Error codes:** `REQUEST_NOT_FOUND` (404), `REQUEST_ALREADY_DECIDED` (409)

---

## Domain 4 — Announcements

### Roles

| Operation            | Minimum role                   |
| -------------------- | ------------------------------ |
| Read announcements   | All authenticated roles        |
| Create announcements | HR_ADMIN, SUPER_ADMIN, MANAGER |
| Pin/unpin            | HR_ADMIN, SUPER_ADMIN          |
| Mark as read         | Any (own read status)          |

### Enums

```
AnnCategory: COMPANY | PEOPLE | PRODUCT | IT | OFFICE
```

---

### `GET /announcements`

**Query params:** `page` (default 1), `limit` (default 20), `category` (AnnCategory), `isPinned` (boolean)

**Response `data`:**

```json
{
  "announcements": [
    {
      "id": "cuid",
      "category": "COMPANY",
      "title": "Q2 All-Hands — Thursday 4 PM IST",
      "body": "Join the leadership team for the Q2 business review...",
      "authorName": "Aman Khanna",
      "authorRole": "Chief People Officer",
      "publishedAt": "2026-05-27T14:00:00.000Z",
      "readCount": 182,
      "audience": "All employees",
      "isPinned": true
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
}
```

> Pinned announcements should be returned first regardless of `publishedAt` order.

---

### `POST /announcements`

**Required roles:** HR_ADMIN, SUPER_ADMIN, MANAGER

**Body:**

```json
{
  "category": "COMPANY",
  "title": "Announcement title",
  "body": "Announcement body text.",
  "audience": "All employees",
  "isPinned": false
}
```

**Response:** 201, `data` = full announcement object.

**Error codes:** `VALIDATION_ERROR` (422)

---

### `PATCH /announcements/:id`

**Body:** any subset of `{ title, body, category, audience, isPinned }`

**Response:** 200, `data` = updated announcement.

**Error codes:** `ANNOUNCEMENT_NOT_FOUND` (404), `VALIDATION_ERROR` (422)

---

### `PATCH /announcements/:id/read`

Marks the announcement as read for the current user. Increments `readCount`.

**Body:** `{}`

**Response:** 200, `data` = `{ "id": "cuid", "readCount": 183 }`

**Error codes:** `ANNOUNCEMENT_NOT_FOUND` (404)

---

### `GET /announcements/channels`

Returns channel list with post counts.

**Response `data`:**

```json
[
  { "id": "cuid", "name": "Company-wide", "category": "COMPANY", "postCount": 142 },
  { "id": "cuid", "name": "People & Culture", "category": "PEOPLE", "postCount": 38 },
  { "id": "cuid", "name": "Product updates", "category": "PRODUCT", "postCount": 51 },
  { "id": "cuid", "name": "IT & Security", "category": "IT", "postCount": 24 },
  { "id": "cuid", "name": "Office & Facilities", "category": "OFFICE", "postCount": 17 }
]
```

---

### `GET /announcements/upcoming-events`

Returns company events in the next 30 days.

**Response `data`:**

```json
[
  {
    "id": "cuid",
    "title": "Q2 All-Hands",
    "date": "2026-06-02T16:00:00.000Z",
    "meta": "4:00 PM · Main hall + Zoom"
  },
  {
    "id": "cuid",
    "title": "New-hire orientation",
    "date": "2026-06-06T10:00:00.000Z",
    "meta": "10:00 AM · 7 joining"
  }
]
```

---

## Notes for the backend team

1. All four domains use the same cookie-based auth (`accessToken` httpOnly) and the same `{ success, data }` envelope.
2. Pagination shape is consistent with existing endpoints: `{ page, limit, total, pages }`.
3. `id` fields are CUIDs (same as the rest of the API).
4. Date fields are returned as full ISO strings (`"2026-06-02T16:00:00.000Z"`); write endpoints accept `"YYYY-MM-DD"`.
5. The frontend will use MSW mocks for all four domains until the backend ships. Exact MSW response shapes match this spec — no deviations needed.
6. There is no `X-Tenant-Key` header needed; tenant is resolved from the JWT cookie.
