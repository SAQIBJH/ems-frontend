# Performance Module — User Interaction & State Flow

> Audience: anyone who wants to understand exactly what a user does, what they
> see change on screen, and which state variables update as a result.
> This is NOT a technical architecture doc — it is a screen-by-screen
> user-journey map with state transition diagrams.

---

## Who Uses This Module

| Role                   | What they can do                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **HR Admin**           | Full access — all tabs, submit ratings, add goals, start cycles, export |
| **Manager**            | Same as HR Admin for their team                                         |
| **Super Admin**        | Same as HR Admin org-wide                                               |
| **Employee / Auditor** | No access — redirected by permission gate                               |

---

## Screen Layout (what the user sees on load)

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER                                          [Export] [Start a Review] │
│  Performance                                                      │
│  "Run review cycles, track goals…"                               │
├──────────────────────────────────────────────────────────────────┤
│  ACTIVE CYCLE BANNER                                             │
│  ⭐ H1 2026 Review Cycle                                         │
│     Manager reviews due 2026-06-14 · calibration 2026-06-21     │
│     ████████████░░░░░░░░  58%              [In progress]        │
├──────────────────────────────────────────────────────────────────┤
│  STATS CARDS                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Reviews  │ │ Goals on │ │   Avg    │ │ Overdue  │           │
│  │ 42 / 73  │ │  track   │ │  rating  │ │ reviews  │           │
│  │          │ │   81%    │ │   3.4    │ │    7     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├──────────────────────────────────────────────────────────────────┤
│  TABS:  [Reviews]  Goals  Calibration                            │
├──────────────────────────────────────────────────────────────────┤
│  (tab content — see each section below)                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Feature 1 — Reviews Tab

### What the user sees (default state)

```
[All departments ▼]  [Filter]

 Employee            Reviewer      Self  Manager  Status           Rating   Actions
 ─────────────────────────────────────────────────────────────────────────────────
 PS  Priya Sharma    Aman Khanna   ✓     ✓        ● Calibrated     Exceeds  [View]
     Engineering
 ─────────────────────────────────────────────────────────────────────────────────
 RM  Rohan Mehta     Sneha Rao     ✓     —        ● Manager review  —       [Review]
     Sales
 ─────────────────────────────────────────────────────────────────────────────────
 NI  Nisha Iyer      Aman Khanna   ✓     —        ● Manager review  —       [Review]
     Product
 ─────────────────────────────────────────────────────────────────────────────────
 VS  Vikram Singh    Aman Khanna   ✓     ✓        ● Calibrated     Strong   [View]
     Engineering
 ─────────────────────────────────────────────────────────────────────────────────
 AJ  Asha Joshi      Maya Rangan   —     —        ● Self review     —       [Open]
     Finance
 ─────────────────────────────────────────────────────────────────────────────────
 DP  Devansh Patel   Aman Khanna   ✓     ✓        ● Calibrated     Meets    [View]
     Engineering
 ─────────────────────────────────────────────────────────────────────────────────
 KM  Karan Mehra     Sneha Rao     —     —        ● Not started     —       [Open]
     Sales
```

---

### Flow 1A — Filter by Department

```
USER ACTION                    STATE CHANGE                    SCREEN CHANGE
──────────────                 ────────────                    ─────────────
Clicks dept dropdown           department: "All departments"   Dropdown opens
  ↓
Selects "Engineering"          department: "Engineering"       New API call fires:
                                                               GET /performance/reviews
                                                               ?departmentId=Engineering

                               reviewsQuery.isLoading: true    Table shows row skeletons

                               reviewsQuery.data: {            Table shows 3 rows only:
                                 reviews: [                      Priya Sharma
                                   Priya, Vikram, Devansh         Vikram Singh
                                 ]                               Devansh Patel
                               }

                               TanStack cache gains new slot:
                               ['performance','reviews',
                                {departmentId:'Engineering'}]
```

**To reset:** User re-selects "All departments" → original 7-row query is still
cached, no new request needed, table snaps back instantly.

---

### Flow 1B — Filter by Status (Filter Popover)

```
USER ACTION                    STATE CHANGE                    SCREEN CHANGE
──────────────                 ────────────                    ─────────────
Clicks [Filter] button         —                               Popover opens showing:
                                                                 □  ● Not started
                                                                 □  ● Self review
                                                                 □  ● Manager review
                                                                 □  ● Calibrated

Clicks "Manager review"        statusFilters:                  Row "Manager review"
                                 ["Manager review"]              checkbox turns filled
                                                               Filter button becomes
                                                               [Filter (1)] (filled style)

                               NO API CALL — client-side       Table filters in memory:
                               filter on cached rows             Rohan Mehta   [Review]
                                                                 Nisha Iyer    [Review]

Clicks "Calibrated"            statusFilters:                  Calibrated checkbox fills
  (adds second filter)           ["Manager review",            Table now shows 4 rows:
                                  "Calibrated"]                  Rohan, Nisha (Mgr review)
                                                                 Priya, Vikram, Devansh
                                                               Filter shows [Filter (2)]

Clicks "Clear filters"         statusFilters: []               All 7 rows return
                                                               Filter resets to [Filter]
```

**Key point:** Status filter is purely local state — it never fires a new API
request. It slices the already-fetched `allReviews` array in the component.

---

### Flow 1C — Submit a Manager Review ("Review" button)

This is the most important interaction — it's how a manager actually rates an employee.

```
BEFORE:
  Row state:  Rohan Mehta | Sneha Rao | ✓ | — | ● Manager review | — | [Review]

USER ACTION                    STATE CHANGE                    SCREEN CHANGE
──────────────                 ────────────                    ─────────────
Clicks [Review] on Rohan       selectedReview: {               Review Detail Sheet
                                 employeeId: "emp_2"           slides in from right:
                                 employeeName: "Rohan Mehta"
                                 status: "Manager review"      ┌────────────────────┐
                                 selfComplete: true            │ RM  Rohan Mehta    │
                                 managerComplete: false        │     Sales          │
                               }                              │ ────────────────── │
                               sheetOpen: true                │ ● Manager review   │
                                                              │ ────────────────── │
                                                              │ Reviewer  Sneha Rao│
                                                              │ ────────────────── │
                                                              │ Review progress    │
                                                              │ ✓ Self review      │
                                                              │ ○ Manager review   │
                                                              │ ────────────────── │
                                                              │ Submit rating      │
                                                              │ [Exceeds][Strong]  │
                                                              │ [Meets][Developing]│
                                                              │ [Below]            │
                                                              │                    │
                                                              │ [Submit review]    │
                                                              └────────────────────┘

Clicks "Meets" chip            selectedRating: "Meets"         "Meets" chip highlights:
                                                               border + bg tinted green
                                                               [Submit review] enabled

Clicks [Submit review]         submitReview.isPending: true    Button → "Submitting…"
                                                               Button disabled

                               PATCH /performance/reviews/emp_2
                               body: { rating: "Meets" }

                               MSW updates in-memory fixture:
                                 review.rating = "Meets"
                                 review.status = "Calibrated"
                                 review.managerComplete = true

                               submitReview.isPending: false   toast: "Review submitted —
                               selectedRating: null              Rohan Mehta rated Meets"
                               sheetOpen: false                Sheet slides out

                               queryClient.invalidateQueries   GET /performance/reviews
                               (['performance','reviews'])        refires automatically

                               reviewsQuery.data updates       Row in table updates:
                               with new fixture state            Self ✓ | Manager ✓
                                                                 ● Calibrated | Meets
                                                                 [View]  ← button changes

AFTER:
  Row state:  Rohan Mehta | Sneha Rao | ✓ | ✓ | ● Calibrated | Meets | [View]
```

**State update chain:** User click → mutation → MSW fixture mutation → cache
invalidation → refetch → React re-render → table row updates in place.

---

### Flow 1D — View a Calibrated Review ("View" button)

```
Clicks [View] on Priya         selectedReview: { …Priya data }   Sheet opens:
                               sheetOpen: true                   Read-only view showing:
                                                                   ● Calibrated
                                                                   Reviewer: Aman Khanna
                                                                   Rating: Exceeds (green)
                                                                   ✓ Self review
                                                                   ✓ Manager review
                                                                   (no rating form shown —
                                                                    already calibrated)

Clicks ✕ or outside sheet     sheetOpen: false                   Sheet closes
                               selectedReview: null
```

---

## Feature 2 — Goals Tab

### What the user sees (default state)

```
[All statuses ▼]  [+ Add goal]

 Owner            Goal                                Progress        Due       Status
 ──────────────────────────────────────────────────────────────────────────────────────
 PS Priya Sharma  Ship design-system v2 to all squads ████████░░ 80%  Jun 30   ● On track
 RM Rohan Mehta   Close ₹2.4Cr in net-new pipeline   ██████░░░░ 62%  Jun 30   ● On track
 NI Nisha Iyer    Launch self-serve onboarding flow   ████░░░░░░ 45%  Jun 30   ● At risk
 VS Vikram Singh  Reduce p95 API latency below 200ms  █████████░ 90%  Jun 30   ● On track
 AJ Asha Joshi    Automate monthly close to 2 days    ███░░░░░░░ 30%  Jul 15   ● At risk
 DP Devansh Patel Migrate 8 services to new auth gw   ██████████100%  May 31   ● Done
```

---

### Flow 2A — Filter by Status

```
USER ACTION                    STATE CHANGE                    SCREEN CHANGE
──────────────                 ────────────                    ─────────────
Clicks status dropdown         —                               Dropdown opens:
                                                                 All statuses
                                                                 On track
                                                                 At risk
                                                                 Done

Selects "At risk"              statusFilter: "At risk"         New API call:
                                                               GET /performance/goals
                                                               ?status=At+risk

                               goalsQuery.data: {              Table shows 2 rows:
                                 goals: [Nisha, Asha]            Nisha Iyer
                               }                                 Asha Joshi

Re-selects "All statuses"      statusFilter: "All statuses"    params = undefined
                                                               Cache hit (no request)
                                                               All 6 rows return
```

---

### Flow 2B — Add a Goal

```
USER ACTION                    STATE CHANGE                    SCREEN CHANGE
──────────────                 ────────────                    ─────────────
Clicks [+ Add goal]            addOpen: true                   Dialog opens:

                               usePerformanceEmployees fires   ┌──────────────────────┐
                               GET /performance/employees      │ Add goal             │
                                                               │                      │
                               employeesQuery.data: [          │ Employee             │
                                 {id:emp_1, name:Priya…},      │ [Select employee… ▼] │
                                 {id:emp_2, name:Rohan…},      │                      │
                                 … 7 employees                 │ Goal                 │
                               ]                               │ [________________]   │
                                                               │                      │
                                                               │ Due date             │
                                                               │ [date picker]        │
                                                               │                      │
                                                               │ [Cancel] [Add goal]  │
                                                               └──────────────────────┘

Clicks Employee select         —                               Dropdown shows:
                                                                 Priya Sharma · Engineering
                                                                 Rohan Mehta  · Sales
                                                                 Nisha Iyer   · Product
                                                                 Vikram Singh · Engineering
                                                                 Asha Joshi   · Finance
                                                                 Devansh Patel· Engineering
                                                                 Karan Mehra  · Sales

Selects "Karan Mehra"          watchedEmployeeId: "emp_7"      Field shows "Karan Mehra"

Types "Improve demo close       form.values.title =            Input updates live
rate by 20%"                     "Improve demo close…"

Picks 2026-07-31               form.values.dueDate =           Date field fills
                                 "2026-07-31"

Clicks [Add goal]              addGoal.isPending: true         Button → "Adding…"
                               Zod validates all fields        (disabled while pending)

                               POST /performance/goals
                               body: {
                                 employeeId: "emp_7",
                                 title: "Improve demo…",
                                 dueDate: "2026-07-31",
                                 progressPct: 0
                               }

                               MSW handler:
                                 looks up emp_7 → "Karan Mehra"
                                 creates goal_<timestamp>
                                 prepends to GOALS array

                               addGoal.isPending: false        toast: "Goal added"
                               form.reset()                    Dialog closes
                               addOpen: false

                               queryClient.invalidateQueries   GET /performance/goals
                               (['performance','goals'])          refires

                               goalsQuery.data updates         New row appears at top:
                                                               KM Karan Mehra
                                                               Improve demo close…
                                                               ░░░░░░░░░░ 0%
                                                               Jul 31   ● On track

Clicks [Cancel] instead        addOpen: false                  Dialog closes
                               form.reset()                    No state changes
```

**Validation gate:** If user clicks Add goal without an employee or title, Zod
fires before any API call. Red error messages appear under the fields. No
request is sent until all required fields pass.

```
Empty submit attempt:
  employeeId error  →  "Employee is required"
  title error       →  "Goal title is required"
  dueDate error     →  "Due date is required"
  Button stays enabled (not pending), no toast, no API call
```

---

## Feature 3 — Calibration Tab

### What the user sees

```
┌─────────────────────────────────────────┐  ┌────────────────────────────────┐
│ Rating distribution           73 reviewed│  │ Calibration notes              │
│ ─────────────────────────────────────── │  │ ─────────────────────────────  │
│ ● Exceeds          8  ·  11%            │  │ │ Engineering skews high        │
│ ██░░░░░░░░░░░░░░░░░░░░░░░              │  │   41% rated Strong or above vs │
│                                         │  │   37% org-wide. Flagged for    │
│ ● Strong          19  ·  26%            │  │   review on Jun 21.            │
│ █████░░░░░░░░░░░░░░░░░░░               │  │ ─────────────────────────────  │
│                                         │  │ │ Distribution within band      │
│ ● Meets           33  ·  45%            │  │   Below + Developing held      │
│ ████████████░░░░░░░░░░░                │  │   under 20% target.            │
│                                         │  │                                │
│ ● Developing      10  ·  14%            │  │ [📄 Open calibration sheet]    │
│ ███░░░░░░░░░░░░░░░░░░░░░               │  └────────────────────────────────┘
│                                         │
│ ● Below            3  ·   4%            │
│ █░░░░░░░░░░░░░░░░░░░░░░░               │
└─────────────────────────────────────────┘
```

---

### Flow 3A — Open Calibration Sheet

```
USER ACTION                    STATE CHANGE                    SCREEN CHANGE
──────────────                 ────────────                    ─────────────
Clicks [Open calibration       sheetOpen: true                 Dialog slides in:
sheet]
                               No API call (calibration        ┌────────────────────────────────┐
                               data already in cache)          │ H1 2026 Calibration Sheet      │
                                                               │ 73 employees reviewed.          │
                                                               │                                 │
                                                               │ RATING DISTRIBUTION             │
                                                               │ Rating    Count  %   Bar        │
                                                               │ ─────────────────────────────── │
                                                               │ ● Exceeds    8   11%  ██░░░░   │
                                                               │ ● Strong    19   26%  █████░   │
                                                               │ ● Meets     33   45%  ████████ │
                                                               │ ● Developing10   14%  ███░░░   │
                                                               │ ● Below      3    4%  █░░░░░   │
                                                               │                                 │
                                                               │ CALIBRATION NOTES               │
                                                               │ ┌─── Engineering skews high     │
                                                               │ │    41% rated Strong or…       │
                                                               │ ┌─── Distribution within band   │
                                                               │ │    Below + Developing…        │
                                                               │                                 │
                                                               │                      [✕ Close]  │
                                                               └────────────────────────────────┘

Clicks [Close] / backdrop      sheetOpen: false                Dialog closes
```

---

## Feature 4 — Export

```
USER ACTION                    STATE CHANGE                    SCREEN CHANGE
──────────────                 ────────────                    ─────────────

— Scenario A: Export on Reviews tab —

activeTab is "reviews"
(default when page loads)

Clicks [Export]                No state change                 Browser "Save file" dialog
                               Reads reviewsQuery.data           opens with filename:
                                 from React Query cache          "performance-reviews.csv"
                               (NO new API call)

                               CSV content:
                               Employee,Department,Reviewer,Self Complete,Manager Complete,Status,Rating
                               Priya Sharma,Engineering,Aman Khanna,Yes,Yes,Calibrated,Exceeds
                               Rohan Mehta,Sales,Sneha Rao,Yes,No,Manager review,—
                               …

                                                               toast: "Reviews exported"

— Scenario B: Export on Goals tab —

User clicked Goals tab first   activeTab: "goals"              Goals tab is active

Clicks [Export]                Reads goalsQuery.data           Browser downloads:
                               from cache                        "performance-goals.csv"

                               CSV content:
                               Employee,Goal,Progress %,Due Date,Status
                               Priya Sharma,Ship design-system v2…,80,2026-06-30,On track
                               …

                                                               toast: "Goals exported"

— Scenario C: Export on Calibration tab —

User clicked Calibration tab   activeTab: "calibration"

Clicks [Export]                —                               toast: "Export not available
                                                               for the Calibration tab"
                                                               (no download)
```

---

## Feature 5 — Start a Review Cycle

```
USER ACTION                    STATE CHANGE                    SCREEN CHANGE
──────────────                 ────────────                    ─────────────
Clicks [Start a Review]        startReviewOpen: true           Dialog opens:

                                                               ┌──────────────────────────┐
                                                               │ ⭐ Start a review cycle   │
                                                               │                          │
                                                               │ Cycle name               │
                                                               │ [e.g. H2 2026 Review…]   │
                                                               │                          │
                                                               │ Self-review due date     │
                                                               │ [date picker]            │
                                                               │                          │
                                                               │ Manager review due date  │
                                                               │ [date picker]            │
                                                               │                          │
                                                               │ Calibration date         │
                                                               │ [date picker]            │
                                                               │                          │
                                                               │ [Cancel] [Start cycle]   │
                                                               └──────────────────────────┘

Fills all fields               cycleName: "H2 2026…"
                               selfDue: "2026-12-07"
                               managerDue: "2026-12-14"
                               calibrationDate: "2026-12-21"

Clicks [Start cycle]           submitting: true                Button → "Starting…"

                               ⚠️  KNOWN GAP (see below):
                               setTimeout(600ms) — no real
                               API call or MSW mutation

                               submitting: false               toast: "Review cycle
                               startReviewOpen: false           'H2 2026…' started"
                               All fields reset                Dialog closes

                               ⚠️  Active cycle banner does NOT
                               update — no cache invalidation
                               because no real mutation exists
```

---

## Active Cycle Banner — State

The banner is the one widget that is **read-only** — users cannot interact with
it directly. It reflects whatever `GET /performance/cycles/active` returns.

```
useActiveCycle query result      Banner renders as:
─────────────────────────────    ─────────────────────────────────────────
isLoading: true                  Row of skeletons (icon chip + 2 lines + bar)

data: null                       Banner hidden (no cycle active)

data: { status: "Upcoming" }     Shows cycle name + dates
                                 Progress bar at 0%
                                 Badge: "Upcoming"  (secondary style)

data: { status: "In progress" }  Progress bar partially filled (e.g. 58%)
                                 Badge: "In progress"  (warning/amber style)

data: { status: "Calibrating" }  Progress bar near full
                                 Badge: "Calibrating"  (info style)

data: { status: "Closed" }       Progress bar full (100%)
                                 Badge: "Closed"  (secondary style)

isError: true                    Banner hidden silently
                                 (non-critical — page still loads)
```

---

## Complete State Variable Reference

### PerformanceScreen

| Variable          | Type      | Default     | Changes when                             |
| ----------------- | --------- | ----------- | ---------------------------------------- |
| `activeTab`       | `string`  | `"reviews"` | User clicks a tab                        |
| `startReviewOpen` | `boolean` | `false`     | "Start a Review" clicked / dialog closed |

### ReviewsTab

| Variable         | Type             | Default             | Changes when                         |
| ---------------- | ---------------- | ------------------- | ------------------------------------ |
| `department`     | `string`         | `"All departments"` | Dept Select changes                  |
| `statusFilters`  | `ReviewStatus[]` | `[]`                | Checkbox toggled in Filter Popover   |
| `selectedReview` | `Review \| null` | `null`              | Action button clicked / sheet closed |
| `sheetOpen`      | `boolean`        | `false`             | Action button clicked / sheet closed |

### ReviewDetailSheet

| Variable         | Type                  | Default | Changes when                       |
| ---------------- | --------------------- | ------- | ---------------------------------- |
| `selectedRating` | `RatingValue \| null` | `null`  | Rating chip clicked / sheet closes |

### GoalsTab

| Variable       | Type      | Default          | Changes when                       |
| -------------- | --------- | ---------------- | ---------------------------------- |
| `statusFilter` | `string`  | `"All statuses"` | Status Select changes              |
| `addOpen`      | `boolean` | `false`          | "Add goal" clicked / dialog closed |

### AddGoalDialog

| Variable            | Type         | Default   | Changes when            |
| ------------------- | ------------ | --------- | ----------------------- |
| `watchedEmployeeId` | `string`     | `""`      | Employee Select changes |
| `form.values.*`     | `FormValues` | all empty | User types / picks      |

### CalibrationTab

| Variable    | Type      | Default | Changes when                                     |
| ----------- | --------- | ------- | ------------------------------------------------ |
| `sheetOpen` | `boolean` | `false` | "Open calibration sheet" clicked / dialog closed |

### StartReviewDialog

| Variable          | Type      | Default | Changes when              |
| ----------------- | --------- | ------- | ------------------------- |
| `cycleName`       | `string`  | `""`    | User types                |
| `selfDue`         | `string`  | `""`    | Date picker               |
| `managerDue`      | `string`  | `""`    | Date picker               |
| `calibrationDate` | `string`  | `""`    | Date picker               |
| `submitting`      | `boolean` | `false` | Submit clicked → response |

---

## Known Gaps (User-Visible)

| What user tries to do               | What happens today                        | What it should do                                |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| Start a new review cycle            | Toast fires after 600ms, nothing persists | Active cycle banner should update to new cycle   |
| Click "Open" on a "Not started" row | Info-only sheet opens, no action          | Should allow manager to send a nudge or initiate |
| Update a goal's progress %          | Not possible in the UI                    | Progress slider or inline edit on the row        |
| Export on the Calibration tab       | Info toast, no download                   | Download distribution table as CSV               |
| See pagination on large datasets    | All rows always shown                     | Page controls appear when `totalPages > 1`       |
