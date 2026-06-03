# Performance Module — End-to-End Flow

> This document covers the complete working flow of the `/performance` module:
> system architecture, component tree, per-feature interaction flows, state
> management, API contract summary, and what is still outstanding.

---

## 1. System Architecture

Every request the browser makes goes through three layers before reaching data.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER  (Next.js client bundle)                                       │
│                                                                         │
│  React Component                                                        │
│       │  calls hook                                                     │
│  TanStack Query Hook  (useReviews, useGoals, useActiveCycle …)         │
│       │  calls service                                                  │
│  Axios API Client  (src/lib/api-client.ts)                              │
│       │  baseURL = "/api"  (same origin — never the backend directly)   │
└───────┼─────────────────────────────────────────────────────────────────┘
        │  HTTP  GET /api/performance/reviews
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MSW SERVICE WORKER  (browser, dev only)                                │
│                                                                         │
│  NEXT_PUBLIC_USE_MOCKS=true ?                                           │
│       ├── YES  →  handler in src/mocks/handlers/performance.ts          │
│       │           returns JSON fixture, request never leaves browser    │
│       └── NO   →  request passes through to Next.js server below       │
└───────┼─────────────────────────────────────────────────────────────────┘
        │  (only when MSW misses or mocks=false)
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  NEXT.JS BFF  (server-side, src/app/api/[...path]/route.ts)            │
│                                                                         │
│  • Reads API_BASE_URL from server-only env (never in browser bundle)   │
│  • Forwards browser cookies (accessToken, refreshToken) unchanged       │
│  • Relays response back to browser                                      │
│       │                                                                 │
│       ▼                                                                 │
│  RENDER BACKEND  https://employee-management-system-2b9q.onrender.com  │
│  /api/v1/performance/*   (not yet live — all intercepted by MSW)       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key rule:** The browser never knows the backend URL. It always calls `/api/*`
on its own origin. The BFF is the only code that knows the real backend address.

---

## 2. Module File Map

```
src/
├── app/(dashboard)/performance/
│   └── page.tsx                   ← thin RSC shell, renders <PerformanceScreen>
│
├── modules/performance/
│   ├── index.ts                   ← public barrel (exports types, hooks, components)
│   ├── types/
│   │   └── performance.types.ts   ← all TypeScript types (Review, Goal, ActiveCycle …)
│   ├── services/
│   │   └── performance.api.ts     ← Axios calls, each method unwraps its own envelope
│   ├── hooks/
│   │   └── usePerformance.ts      ← TanStack Query hooks + mutation hooks
│   ├── constants/
│   │   └── index.ts               ← status color maps, department list, goal statuses
│   ├── validations/
│   │   └── add-goal.schema.ts     ← Zod schema for the Add Goal form
│   └── components/
│       ├── PerformanceScreen.tsx  ← root client component; owns tab state + export
│       ├── ActiveCycleBanner.tsx  ← banner card above the tabs
│       ├── ReviewsTab.tsx         ← dept select + status filter popover + table
│       ├── ReviewDetailSheet.tsx  ← slide-over for View / Review / Open actions
│       ├── GoalsTab.tsx           ← status select + goals table
│       ├── AddGoalDialog.tsx      ← modal form to create a goal
│       ├── CalibrationTab.tsx     ← distribution bars + notes cards + sheet dialog
│       ├── PerfProgressBar.tsx    ← reusable 6px progress bar
│       └── StartReviewDialog.tsx  ← modal form to start a new cycle
│
└── mocks/handlers/
    └── performance.ts             ← MSW fixture data + 8 endpoint handlers
```

---

## 3. Component Tree

```
page.tsx  (RSC, no client state)
└── PerformanceScreen  [client]
    │   owns: activeTab, startReviewOpen
    │   fetches: useActiveCycle, usePerformanceSummary, useReviews*, useGoals*
    │   (* prefetched here so Export can see the data without re-fetching)
    │
    ├── PageHeader
    │   ├── Export button  →  downloadCSV()  (reads prefetched query cache)
    │   └── Start a Review button  →  opens StartReviewDialog
    │
    ├── ActiveCycleBanner  (shows cycle name, due dates, progress bar, status badge)
    │
    ├── StatsCards row  (4 cards from usePerformanceSummary)
    │
    ├── Tabs  (Reviews | Goals | Calibration)
    │   │
    │   ├── ReviewsTab  [client]
    │   │   │   owns: department, statusFilters[], selectedReview, sheetOpen
    │   │   │   fetches: useReviews({ departmentId? })
    │   │   │
    │   │   ├── Department Select
    │   │   ├── Filter Popover  (status checkboxes, applied client-side)
    │   │   ├── Reviews table
    │   │   │   └── Action button (Open / Review / View)  →  opens ReviewDetailSheet
    │   │   └── ReviewDetailSheet  [client]
    │   │           owns: selectedRating
    │   │           mutates: useSubmitReview  →  PATCH /performance/reviews/:employeeId
    │   │
    │   ├── GoalsTab  [client]
    │   │   │   owns: statusFilter, addOpen
    │   │   │   fetches: useGoals({ status? })
    │   │   │
    │   │   ├── Status Select
    │   │   ├── Add Goal button  →  opens AddGoalDialog
    │   │   ├── Goals table  (progress bar + status badge per row)
    │   │   └── AddGoalDialog  [client]
    │   │           fetches: usePerformanceEmployees
    │   │           mutates: useAddGoal  →  POST /performance/goals
    │   │
    │   └── CalibrationTab  [client]
    │           owns: sheetOpen
    │           fetches: useCalibration
    │           ├── Rating distribution card  (horizontal bars)
    │           ├── Calibration notes card    (left-border accent cards)
    │           │   └── Open calibration sheet  →  opens CalibrationTab Dialog
    │           └── Calibration Sheet Dialog  (full distribution table + notes)
    │
    └── StartReviewDialog  [client]
            owns: cycleName, selfDue, managerDue, calibrationDate, submitting
            (no MSW mutation yet — see §7 Outstanding)
```

---

## 4. Request Lifecycle — Step by Step

### 4a. Page load (initial data fetch)

```
1. Browser navigates to /performance
2. Next.js renders page.tsx (RSC) → returns <PerformanceScreen /> shell
3. React hydrates client bundle; PerformanceScreen mounts
4. TanStack Query fires all 4 initial queries in parallel:

   useActiveCycle     →  GET /api/performance/cycles/active
   usePerformanceSummary  →  GET /api/performance/summary
   useReviews         →  GET /api/performance/reviews
   useGoals           →  GET /api/performance/goals

5. Each Axios call hits the MSW service worker (MOCKS=true)
6. MSW returns JSON fixture immediately (no network round-trip)
7. TanStack Query stores responses in its cache under these keys:
      ['performance', 'activeCycle']
      ['performance', 'summary']
      ['performance', 'reviews', undefined]
      ['performance', 'goals',   undefined]
8. Components re-render with real data; skeletons replaced by content
```

### 4b. Filtering reviews by department

```
User selects "Engineering" from the dept dropdown
        │
        ▼
ReviewsTab sets department = "Engineering"
        │
        ▼
useReviews({ departmentId: "Engineering" }) fires
  →  GET /api/performance/reviews?departmentId=Engineering
        │
        ▼
MSW filters REVIEWS fixture:  r.department === "Engineering"
  →  returns 3 rows (Priya, Vikram, Devansh)
        │
        ▼
TanStack Query stores under key:
  ['performance', 'reviews', { departmentId: 'Engineering' }]
  (separate cache slot — dept=All remains cached)
        │
        ▼
Table re-renders with filtered rows
```

### 4c. Status filter (client-side — no new request)

```
User clicks Filter button  →  Popover opens
User checks "Manager review"
        │
        ▼
ReviewsTab: statusFilters = ["Manager review"]
        │
        ▼
Client-side filter applied to already-fetched allReviews array
  (NO new API call — filter is local state only)
        │
        ▼
Table shows 2 rows (Rohan, Nisha)
Filter button turns filled/primary; shows "(1)"
```

### 4d. Submitting a manager review (mutation)

```
User clicks "Review" on Rohan Mehta's row
        │
        ▼
ReviewDetailSheet opens with review = { employeeId: "emp_2", status: "Manager review" … }
        │
User selects "Meets" from rating chips
        │
User clicks "Submit review"
        │
        ▼
useSubmitReview.mutate({ employeeId: "emp_2", input: { rating: "Meets" } })
  →  PATCH /api/performance/reviews/emp_2
     body: { "rating": "Meets" }
        │
        ▼
MSW handler:
  finds review where employeeId === "emp_2"
  sets review.rating = "Meets"
  sets review.status = "Calibrated"
  sets review.managerComplete = true
  returns updated review object
        │
        ▼
onSuccess:
  toast.success("Review submitted — Rohan Mehta rated Meets")
  selectedRating reset to null
  Sheet closes
  queryClient.invalidateQueries(['performance', 'reviews'])
  queryClient.invalidateQueries(['performance', 'summary'])
        │
        ▼
TanStack Query refetches  GET /performance/reviews
MSW returns updated fixture (Rohan now Calibrated, rating Meets)
Table row updates: "Manager review" → "Calibrated", "—" → "Meets"
```

### 4e. Adding a goal (mutation)

```
User clicks "Add goal"
        │
        ▼
AddGoalDialog opens
  usePerformanceEmployees fires  →  GET /api/performance/employees
  MSW returns EMPLOYEES fixture (7 names + departments)
  Employee Select populates
        │
User selects "Nisha Iyer · Product"
User types goal title, picks due date
User clicks "Add goal"
        │
        ▼
useAddGoal.mutate({ employeeId: "emp_3", title: "…", dueDate: "…", progressPct: 0 })
  →  POST /api/performance/goals
     body: { employeeId, title, dueDate, progressPct }
        │
        ▼
MSW handler:
  looks up employee name from EMPLOYEES fixture  →  "Nisha Iyer"
  creates goal object with id = "goal_<timestamp>"
  prepends to GOALS array
  returns new goal
        │
        ▼
onSuccess:
  toast.success("Goal added")
  form.reset(); dialog closes
  queryClient.invalidateQueries(['performance', 'goals'])
  queryClient.invalidateQueries(['performance', 'summary'])
        │
        ▼
Goals table refetches; new row appears at top
```

### 4f. Export CSV

```
User is on the Reviews tab
User clicks "Export"
        │
        ▼
PerformanceScreen.handleExport()
  activeTab === 'reviews'
        │
        ▼
reads reviewsQuery.data.reviews  (already in React Query cache — NO new request)
builds 2D array:
  [ ["Employee","Department","Reviewer","Self Complete","Manager Complete","Status","Rating"],
    ["Priya Sharma", "Engineering", "Aman Khanna", "Yes", "Yes", "Calibrated", "Exceeds"],
    …7 rows ]
        │
        ▼
downloadCSV("performance-reviews.csv", rows)
  creates Blob (text/csv)
  URL.createObjectURL → triggers browser "Save file" dialog
  URL revoked after click
        │
toast.success("Reviews exported")
```

---

## 5. State Management Map

```
┌────────────────────────────────────────────────────────────┐
│  TanStack Query Cache                                       │
│                                                            │
│  Key                               Source      Stale after │
│  ─────────────────────────────     ─────────   ─────────── │
│  ['performance','activeCycle']     MSW GET     5 min       │
│  ['performance','summary']         MSW GET     5 min       │
│  ['performance','reviews', …]      MSW GET     5 min       │
│  ['performance','goals',   …]      MSW GET     5 min       │
│  ['performance','calibration']     MSW GET     5 min       │
│  ['performance','employees']       MSW GET     5 min       │
│                                                            │
│  Invalidated by mutations:                                 │
│  useSubmitReview  →  ['performance','reviews']             │
│                      ['performance','summary']             │
│  useAddGoal       →  ['performance','goals']               │
│                      ['performance','summary']             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  React Local State  (useState)                             │
│                                                            │
│  PerformanceScreen   activeTab          (which tab shown)  │
│                      startReviewOpen    (dialog open/shut) │
│                                                            │
│  ReviewsTab          department         (dept filter)      │
│                      statusFilters[]    (status checkboxes)│
│                      selectedReview     (open in sheet)    │
│                      sheetOpen                             │
│                                                            │
│  ReviewDetailSheet   selectedRating     (rating chip)      │
│                                                            │
│  GoalsTab            statusFilter       (status dropdown)  │
│                      addOpen            (dialog open/shut) │
│                                                            │
│  CalibrationTab      sheetOpen          (dialog open/shut) │
│                                                            │
│  AddGoalDialog       watchedEmployeeId  (via useWatch)     │
│                                                            │
│  StartReviewDialog   cycleName, selfDue,                   │
│                      managerDue, calibrationDate,          │
│                      submitting                            │
└────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoint Summary

All endpoints below are MSW-backed. When the backend ships an endpoint, delete
its handler from `src/mocks/handlers/performance.ts` — no app code changes needed.

| Method  | Path                               | Role                           | Purpose                                           | Consuming component |
| ------- | ---------------------------------- | ------------------------------ | ------------------------------------------------- | ------------------- |
| `GET`   | `/performance/cycles/active`       | HR_ADMIN, SUPER_ADMIN, MANAGER | Active cycle info (name, due dates, progress %)   | ActiveCycleBanner   |
| `GET`   | `/performance/summary`             | HR_ADMIN, SUPER_ADMIN, MANAGER | Stats cards data                                  | StatsCards row      |
| `GET`   | `/performance/reviews`             | HR_ADMIN, SUPER_ADMIN, MANAGER | Paginated review list, filter by dept+status      | ReviewsTab          |
| `PATCH` | `/performance/reviews/:employeeId` | HR_ADMIN, SUPER_ADMIN, MANAGER | Submit manager rating → transitions to Calibrated | ReviewDetailSheet   |
| `GET`   | `/performance/goals`               | HR_ADMIN, SUPER_ADMIN, MANAGER | Paginated goals, filter by status                 | GoalsTab            |
| `POST`  | `/performance/goals`               | HR_ADMIN, SUPER_ADMIN, MANAGER | Create a new goal                                 | AddGoalDialog       |
| `GET`   | `/performance/calibration`         | HR_ADMIN, SUPER_ADMIN          | Rating distribution + notes                       | CalibrationTab      |
| `GET`   | `/performance/employees`           | HR_ADMIN, SUPER_ADMIN, MANAGER | Employee list for pickers                         | AddGoalDialog       |

> **Not yet in MSW** (see §7): `POST /performance/cycles` — start a new review cycle.

---

## 7. What Is Complete vs What Is Outstanding

### ✅ Complete

- [x] Active cycle banner — name, due dates (mono), progress bar, status badge
- [x] 4 stats cards — Reviews complete (X/Y), Goals on track %, Avg rating, Overdue
- [x] Reviews tab — dept Select filter, status checkbox filter popover (client-side), table with all 7 columns
- [x] Reviews — View / Review / Open buttons all open the `ReviewDetailSheet`
- [x] ReviewDetailSheet — shows employee, dept, reviewer, self/manager status, and (for "Manager review") a rating selector chip grid + Submit button that PATCHes the MSW and invalidates the cache
- [x] Goals tab — status Select filter, table with owner avatar, progress bar + %, due date (mono), status badge
- [x] Add Goal dialog — employee name Select (populated from `/performance/employees`), goal title, due date, POSTs to MSW, refetches table
- [x] Calibration tab — rating distribution (horizontal bars, count + pct), calibration notes (left-border accent cards)
- [x] Open calibration sheet — opens a Dialog with a full distribution table + notes in bordered cards
- [x] Export button — downloads `performance-reviews.csv` or `performance-goals.csv` from the React Query cache; info toast on the Calibration tab
- [x] Start a Review button — opens `StartReviewDialog` with cycle name + 3 date fields; shows success toast
- [x] All four component states: loading (skeletons), empty, error (with retry), success
- [x] Dark mode compatible (all colors via CSS variables)
- [x] TypeScript strict: no errors
- [x] ESLint: no errors (pre-existing warnings in other modules only)

### ⚠️ Outstanding / Known Gaps

| Gap                                         | Detail                                                                                                                                                                        | What's needed                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Start a Review — no persistence**         | `StartReviewDialog` uses `setTimeout` to simulate submit. There is no `POST /performance/cycles` in the MSW or `newreqphase3.md`.                                             | Add endpoint to `newreqphase3.md`, add MSW handler, wire mutation in `StartReviewDialog`                   |
| **"Open" / "Self review" rows — read-only** | Clicking Open/View on a `Not started` or `Self review` row opens the sheet in info-only mode. There is no action to initiate or complete a self-review from the manager view. | Decide product behaviour: should the manager be able to nudge the employee? Or is this expected read-only? |
| **Goal progress update**                    | Users can add goals and see their progress %, but cannot edit the progress from the UI.                                                                                       | `PATCH /performance/goals/:id` endpoint + edit row action or inline slider                                 |
| **No pagination UI**                        | Both the reviews and goals tables render all rows (MSW returns max 50). No page controls are shown.                                                                           | Add `<Pagination>` component to both tables when `totalPages > 1`                                          |
| **Export for Calibration tab**              | The Export button shows an info toast instead of a download when on the Calibration tab.                                                                                      | Generate a CSV of the distribution table (`rating, count, pct`)                                            |
| **`POST /performance/cycles` missing**      | The Start a Review dialog has no backend contract and no MSW handler.                                                                                                         | Document in `newreqphase3.md` and implement MSW handler                                                    |
| **Calibration sheet — dynamic cycle name**  | The dialog title is hardcoded to `"H1 2026 Calibration Sheet"`.                                                                                                               | Read from `useActiveCycle().data.name`                                                                     |

---

## 8. Backend Handoff Checklist

When the backend team is ready to implement, they should:

1. Read `docs/newreqphase3.md` Domain B — every endpoint, field, envelope, and error code is specified there.
2. Implement endpoints in order: `GET /cycles/active` → `GET /summary` → `GET /reviews` → `GET /goals` → `GET /calibration` → `POST /goals` → `GET /employees` → `PATCH /reviews/:employeeId`.
3. For each endpoint that goes live:
   - Delete its handler from `src/mocks/handlers/performance.ts`
   - Verify the app still works with `NEXT_PUBLIC_USE_MOCKS=false`
   - No TypeScript or service-layer changes are needed — the wire shapes match exactly.
4. Auth: all endpoints require a valid `accessToken` cookie. The BFF forwards it automatically.
5. Tenant: the JWT carries tenant identity — no `x-tenant-key` header is needed.
