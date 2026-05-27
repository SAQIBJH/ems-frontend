# EMS Frontend — Complete UI Specification & Wireframe Reference

> **Audience:** Claude Design and any engineer picking up Phase 2 work.
> This document is the single source of truth for layout rules, design tokens,
> component contracts, and every screen built in Phase 1 / 1.5. Phase 2 planned
> screens are listed at the end with wireframe-level detail so they can be built
> at the same visual quality as Phase 1.
>
> **Rule:** Match this document before adding taste. Deviate only with an explicit
> reason documented here.

---

## 1. Product Identity

**EMS** — Employee Management System. B2B SaaS. HR teams, managers, and employees inside a company.

**Visual personality:** Linear / Vercel / Stripe Dashboard. Confident, dense, calm. Enterprise tooling. No gradient-heavy landing-page aesthetics. No Bootstrap admin templates. Every pixel earns its place.

---

## 2. Design Tokens — Complete Reference

All tokens live in `src/styles/tokens.css`. Every component consumes them via Tailwind utilities. No raw hex codes in JSX ever.

### 2.1 Color System (HSL, light mode)

#### Surfaces

| Token (CSS var)       | Tailwind utility    | Value              | Use                            |
| --------------------- | ------------------- | ------------------ | ------------------------------ |
| `--bg-canvas`         | `bg-canvas`         | `hsl(220 14% 98%)` | Page background                |
| `--bg-surface`        | `bg-surface`        | `hsl(0 0% 100%)`   | Cards, sidebar, topbar         |
| `--bg-surface-raised` | `bg-surface-raised` | `hsl(220 14% 97%)` | Table headers, elevated cards  |
| `--bg-surface-2`      | `bg-surface-2`      | `hsl(220 14% 96%)` | Hover states, secondary panels |
| `--bg-overlay`        | `bg-overlay`        | `hsl(220 30% 8%)`  | Modal backdrops                |

#### Borders

| Token              | Tailwind         | Value              | Use                             |
| ------------------ | ---------------- | ------------------ | ------------------------------- |
| `--border-subtle`  | `border-subtle`  | `hsl(220 13% 91%)` | Default dividers, card outlines |
| `--border-default` | `border-default` | `hsl(220 13% 84%)` | Input borders                   |
| `--border-strong`  | `border-strong`  | `hsl(220 13% 65%)` | Focused inputs, emphasis        |

#### Text

| Token               | Tailwind           | Value              | Use                         |
| ------------------- | ------------------ | ------------------ | --------------------------- |
| `--text-primary`    | `text-fg`          | `hsl(222 47% 11%)` | Body text, headings         |
| `--text-secondary`  | `text-fg-muted`    | `hsl(220 9% 38%)`  | Labels, captions, secondary |
| `--text-tertiary`   | `text-fg-subtle`   | `hsl(220 9% 55%)`  | Placeholder, hint text      |
| `--text-disabled`   | `text-fg-disabled` | `hsl(220 9% 72%)`  | Disabled form elements      |
| `--text-on-primary` | `text-on-primary`  | `hsl(0 0% 100%)`   | Text on brand backgrounds   |

#### Brand (blue)

| Token         | Tailwind                  | Value               | Use                            |
| ------------- | ------------------------- | ------------------- | ------------------------------ |
| `--brand-50`  | `bg-brand-50`             | `hsl(222 100% 97%)` | Active nav bg, accent hover bg |
| `--brand-100` | `bg-brand-100`            | `hsl(222 95% 92%)`  | Subtle brand tint              |
| `--brand-500` | `bg-brand` / `text-brand` | `hsl(222 80% 52%)`  | Primary buttons, active states |
| `--brand-600` | `bg-brand-hover`          | `hsl(222 75% 46%)`  | Button hover                   |
| `--brand-700` | `bg-brand-dark`           | `hsl(222 70% 40%)`  | Button active/pressed          |

#### Semantic

| Token           | Tailwind                      | Value              | Use                                 |
| --------------- | ----------------------------- | ------------------ | ----------------------------------- |
| `--success-500` | `text-success` / `bg-success` | `hsl(152 60% 40%)` | Positive actions, present status    |
| `--warning-500` | `text-warning` / `bg-warning` | `hsl(38 92% 50%)`  | Warnings, cautions                  |
| `--danger-500`  | `text-danger` / `bg-danger`   | `hsl(0 75% 50%)`   | Destructive, absent, error          |
| `--info-500`    | `text-info` / `bg-info`       | `hsl(210 90% 50%)` | Informational, neutral              |
| `--focus-ring`  | (ring color)                  | `hsl(222 90% 56%)` | Focus rings on interactive elements |

### 2.2 Color System (dark mode overrides)

Applied via `[data-theme='dark']` on `<html>`. Every token automatically swaps.

| Category              | Dark value                                              |
| --------------------- | ------------------------------------------------------- |
| `--bg-canvas`         | `hsl(222 20% 8%)`                                       |
| `--bg-surface`        | `hsl(222 18% 11%)`                                      |
| `--bg-surface-raised` | `hsl(222 17% 15%)`                                      |
| `--bg-surface-2`      | `hsl(222 16% 14%)`                                      |
| `--border-subtle`     | `hsl(222 14% 18%)`                                      |
| `--border-default`    | `hsl(222 14% 24%)`                                      |
| `--border-strong`     | `hsl(222 12% 38%)`                                      |
| `--text-primary`      | `hsl(220 14% 96%)`                                      |
| `--text-secondary`    | `hsl(220 10% 72%)`                                      |
| `--text-tertiary`     | `hsl(220 9% 58%)`                                       |
| `--text-disabled`     | `hsl(220 8% 40%)`                                       |
| `--brand-50`          | `hsl(222 20% 16%)` — dark tinted, avoids white-on-white |
| `--brand-100`         | `hsl(222 18% 20%)`                                      |
| `--brand-500`         | `hsl(222 85% 62%)` — brighter in dark                   |
| `--brand-600`         | `hsl(222 80% 55%)`                                      |

### 2.3 Typography

**Fonts:** Inter (variable) for all UI. JetBrains Mono for codes, reference numbers, monospace values.

| Scale name | Size | Weight | Use                               |
| ---------- | ---- | ------ | --------------------------------- |
| `display`  | 32px | 700    | Hero headings                     |
| `h1`       | 24px | 600    | Page titles                       |
| `h2`       | 20px | 600    | Section headings                  |
| `h3`       | 16px | 600    | Card headings, sub-sections       |
| `body`     | 14px | 400    | Default body text                 |
| `body-sm`  | 13px | 400    | Dense tables, secondary info      |
| `caption`  | 12px | 400    | Labels, metadata                  |
| `overline` | 11px | 500    | ALL CAPS labels, category headers |

### 2.4 Spacing Scale

`0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96` px. No arbitrary values.

### 2.5 Border Radius

| Token                            | Value  | Use                          |
| -------------------------------- | ------ | ---------------------------- |
| `--radius-sm` / `rounded-sm`     | 4px    | Badges, chips, small pills   |
| `--radius-md` / `rounded-md`     | 8px    | Inputs, buttons, table cells |
| `--radius-lg` / `rounded-lg`     | 12px   | Cards, panels                |
| `--radius-xl` / `rounded-xl`     | 16px   | Modals, drawers, large cards |
| `--radius-full` / `rounded-full` | 9999px | Avatar, circular badges      |

### 2.6 Shadows

| Token            | Value                   | Use                                |
| ---------------- | ----------------------- | ---------------------------------- |
| `--shadow-xs`    | `0 1px 2px / 0.04`      | Subtle lift                        |
| `--shadow-sm`    | `0 2px 4px / 0.06`      | Inputs on focus, small cards       |
| `--shadow-md`    | `0 4px 12px / 0.08`     | Cards, table container             |
| `--shadow-lg`    | `0 12px 32px / 0.12`    | Modals, drawers                    |
| `--shadow-focus` | `0 0 0 3px ring / 0.25` | Focus ring on interactive elements |

Dark mode shadows are darker (higher opacity: 0.3–0.6 range).

### 2.7 Motion

| Token           | Value                            | Use                              |
| --------------- | -------------------------------- | -------------------------------- |
| `--ease-out`    | `cubic-bezier(0.16, 1, 0.3, 1)`  | Openings, entrances              |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Transitions between states       |
| `--dur-fast`    | `120ms`                          | Micro-interactions, hover states |
| `--dur-base`    | `180ms`                          | Default transition               |
| `--dur-slow`    | `280ms`                          | Large panel entries, modals      |

**Accessibility:** All animations disabled when `prefers-reduced-motion: reduce` is set.

---

## 3. Layout Architecture

### 3.1 AppShell (all authenticated routes)

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR  h-16  bg-surface/80 backdrop-blur border-b border-subtle    │
│  [☰ mobile]  [──── GlobalSearch (flex-1 centered) ────]  [🌙 🔔 👤] │
├──────────┬───────────────────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT                                             │
│ w-60     │  flex-1 overflow-y-auto                                   │
│ (w-16    │                                                           │
│  when    │  PageHeader (sticky, h-auto, px-6 py-4)                  │
│  collapsed)│  ├─ Breadcrumbs (text-fg-muted / text-sm)              │
│          │  ├─ Title (text-h1)                                       │
│ bg-surface│  └─ Actions slot (right-aligned buttons)                │
│ border-r │                                                           │
│ border-  │  Page content (px-6 py-4 or as specified per screen)     │
│ subtle   │                                                           │
│          │                                                           │
│ NAV ITEMS│                                                           │
│ (see §3.2)│                                                          │
│          │                                                           │
│ [Collapse]│                                                          │
└──────────┴───────────────────────────────────────────────────────────┘
```

**Sidebar behavior:**

- Desktop (≥ lg): always visible, can collapse to icon-only (`w-16`). State persisted in Zustand + localStorage.
- Mobile (< lg): hidden; hamburger in topbar opens as a `Sheet` drawer from the left.
- Sidebar transition: `transition-[width] duration-[180ms] ease-out`.

**Topbar items (left to right):**

1. Mobile hamburger (hidden on lg+)
2. `GlobalSearch` — centered, `flex-1`, keyboard shortcut `/` or `⌘K`
3. `ThemeToggle` — Sun/Moon icon button
4. `NotificationBell` — bell + unread badge, popover list
5. `UserMenu` — avatar (initials fallback), dropdown

### 3.2 Sidebar Navigation

```
EMS  (logo — "E" in brand-500, "MS" in text-fg)

[icon] Dashboard
[icon] Employees
[icon] Departments
[icon] Attendance
[icon] Leave
[icon] Holidays
[icon] Permissions
[icon] Settings

─────────────────
[icon] Collapse
```

**Active item:** `bg-brand-50 text-brand` + rounded-lg  
**Inactive item:** `text-fg-muted hover:bg-surface-2 hover:text-fg` + rounded-lg  
**Icon size:** `size-4` (16px), `aria-hidden`  
**Collapsed state:** icon only, `size-10` centered

### 3.3 AuthShell (login, forgot-password, reset, OTP)

```
┌──────────────────────────────────────────────────────────────────────┐
│                  LEFT PANEL (full width on mobile,  │  RIGHT PANEL  │
│                  max-w-480 card centered on desktop) │  brand tint   │
│                                                      │  feature list │
│  [EMS Logo top-left]                                │  (hidden on   │
│                                                      │   mobile)     │
│  ┌─────────────────────┐                            │               │
│  │  Auth Card          │                            │               │
│  │  (bg-surface,       │                            │               │
│  │   rounded-xl,       │                            │               │
│  │   shadow-lg,        │                            │               │
│  │   p-8)              │                            │               │
│  └─────────────────────┘                            │               │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.4 PageHeader

Sticky header inside each page. Structure:

```
breadcrumb-trail (text-sm text-fg-muted)    [action buttons — right]
Page Title (text-h1 text-fg font-semibold)
Optional subtitle (text-body text-fg-muted)
```

Breadcrumbs: `Home / Employees / E0042` — each segment except the last is a link.

---

## 4. Shared Component Library

### 4.1 Buttons

**Sizes:**
| Size | Height | H-pad | Gap | Text |
|---|---|---|---|---|
| `xs` | h-7 (28px) | px-2.5 | gap-1.5 | text-xs |
| `sm` | h-8 (32px) | px-3 | gap-2 | text-[0.8125rem] |
| `default` | h-9 (36px) | px-4 | gap-2 | text-sm |
| `lg` | h-10 (40px) | px-5 | gap-2 | text-sm |
| `icon` | size-9 | — | — | — |
| `icon-sm` | size-8 | — | — | — |
| `icon-xs` | size-7 | — | — | — |
| `icon-lg` | size-10 | — | — | — |

**Variants:**

- `default`: `bg-brand text-on-primary hover:bg-brand-hover` — primary actions
- `outline`: `border border-default text-fg hover:bg-surface-2` — secondary actions
- `secondary`: `bg-surface-2 text-fg hover:bg-surface-raised` — tertiary actions
- `ghost`: transparent, `hover:bg-surface-2` — icon buttons, nav items
- `destructive`: `bg-danger text-on-primary` — delete, revoke
- `link`: underline, no background — inline text actions

**Rules:**

- Always `cursor-pointer`, `disabled:cursor-not-allowed`
- Primary action on a page = `default` size
- Row-level inline actions = `sm` size
- Icon-only toolbar actions = `icon-sm` size

### 4.2 Inputs & Forms

- Input height: `h-9` default, matches button default
- `rounded-md` (8px), `border-subtle`, `focus:border-strong focus:ring-2 focus:ring-ring/25`
- Label: `text-sm font-medium text-fg`
- Error state: red border + `text-danger text-sm` below the field
- Helper text: `text-fg-muted text-sm` below the field
- Placeholder: `text-fg-subtle` (never used as a substitute for a label)

### 4.3 Cards

```
<Card>        rounded-lg bg-surface border border-subtle shadow-sm
<CardHeader>  px-6 pt-6 pb-0 flex items-center justify-between
<CardTitle>   text-h3 font-semibold text-fg
<CardContent> px-6 py-4
<CardFooter>  px-6 pb-6 pt-0
```

### 4.4 Badges / Status Chips

Small inline indicators. `rounded-full px-2 py-0.5 text-xs font-medium`.

Common patterns:

```
ACTIVE     → bg-success/10   text-success   border-success/20
INACTIVE   → bg-surface-2    text-fg-muted  border-subtle
PRESENT    → bg-success/10   text-success
ABSENT     → bg-danger/10    text-danger
ON LEAVE   → bg-info/10      text-info
WFH        → bg-warning/10   text-warning
PENDING    → bg-warning/10   text-warning
APPROVED   → bg-success/10   text-success
REJECTED   → bg-danger/10    text-danger
WITHDRAWN  → bg-surface-2    text-fg-muted
HOLIDAY    → bg-brand-100    text-brand
```

### 4.5 Avatars

- `size-8` (32px) default in lists and topbar
- `size-10` (40px) in profile headers
- `rounded-full`
- Fallback: initials (1–2 letters), `bg-brand text-on-primary text-xs`

### 4.6 StatsCard

```
┌────────────────────────────────┐
│ [Icon]   Label (text-sm       │
│          text-fg-muted)        │
│                                │
│  Value  (text-display font-   │
│           bold text-fg)        │
│                                │
│  ↑ Delta / Sub-line            │
│  (text-sm, tone: positive /   │
│   negative / warning /        │
│   neutral)                    │
└────────────────────────────────┘
```

### 4.7 Tables (DynamicTable engine)

Column types: `text`, `badge`, `date`, `avatar-text` (merged avatar + name column), `number`, `actions` (kebab/ellipsis dropdown), `custom` (render prop).

Table anatomy:

```
Filter bar (search input + filter dropdowns + Density menu + Columns menu + action button)
─────────────────────────────────────────────────────────
[ ] | Col 1   | Col 2   | Col 3   | Status  | Actions
─────────────────────────────────────────────────────────
[ ] | ...     | ...     | ...     | ●●●     | ⋯
────  (row hover: bg-surface-raised)
```

**Floating bulk action bar** (appears above table when ≥ 1 row selected):

```
[X selected]  [Bulk action 1]  [Bulk action 2]  [Deselect all]
```

States: loading (5 skeleton rows), empty (illustration + CTA), error (retry), success.

### 4.8 Modals (Dialog)

- `rounded-xl` (16px), `shadow-lg`, `bg-surface`
- Size variants: sm (400px), md (560px), lg (760px), xl (960px)
- Header: title (text-h3) + optional close button (top-right X)
- Footer: secondary action (outline/ghost, left or right) + primary action (right)
- ESC closes, click-outside closes (configurable), focus trapped

### 4.9 Drawers (Sheet)

- Slides from right (default)
- Full height, `w-[420px]` to `w-[640px]` depending on content
- `rounded-xl` on the near side only (left edge)
- Header: title + X button
- Content: scrollable
- Footer: sticky buttons

### 4.10 EmptyState

```
         [Illustration SVG — themed via currentColor]

         Title (text-h3 text-fg font-semibold)
         Description (text-body text-fg-muted max-w-xs centered)

         [Primary action button — optional]
```

Illustrations (inline SVG, theme via currentColor):

- `NoDataIllustration` — generic empty set
- `NoEmployeesIllustration` / `NoApprovalsIllustration`
- `NoDocumentsIllustration`
- `NoHolidaysIllustration`
- `NoTeamIllustration`
- `NoSearchResultsIllustration`

### 4.11 ErrorState

```
  ⚠ message (text-fg)
  [Try again]  (outline button, calls onRetry)
  requestId: xxxx  (caption, text-fg-muted — only if present)
```

### 4.12 Toast Notifications

Library: **Sonner**. Auto-dismiss 4s. Past-tense action description.

- `toast.success("Employee created")`
- `toast.error("Failed to create employee")`
- `toast.warning("Unsaved changes will be lost")`
- `toast.info("Export started")`

### 4.13 Confirm Dialogs

**ConfirmDialog** — generic destructive confirmation (title + description + Cancel + Confirm).

**TypeToConfirmDialog** — requires typing a specific string (e.g. employee code) before confirming. Used for irreversible actions (deactivate employee).

---

## 5. Screen-by-Screen Specification

### Screen 01 — Login (`/login`)

**Shell:** AuthShell  
**Route group:** `(auth)`

**Layout:**

```
[EMS logo top-left]

LEFT: Auth Card (max-w-[400px] mx-auto)
─────────────────────────────────────
Sign in to your account  (text-h1)
Welcome back. Enter your credentials  (text-body text-fg-muted)

Email address         [input]
Password              [input, type=password, show/hide toggle]

[Sign in]  (full-width primary button, shows spinner while loading)

Forgot your password?  (link, routes to /forgot-password)

RIGHT: Brand panel (hidden on mobile)
─────────────────────────────────────
Brand gradient + feature checklist bullets
```

**States:** idle, submitting (button spinner + disabled), error (inline error below form, red border on fields), success (redirect to /dashboard or ?next= param).

---

### Screen 02 — Forgot Password (`/forgot-password`)

**Shell:** AuthShell

```
Forgot your password?  (text-h1)
Enter your email and we'll send you a reset link.  (subtitle)

Email address         [input]

[Send reset link]  (full-width primary button)

← Back to sign in  (ghost link)
```

**Success state replaces form:**

```
Check your email  (text-h2)
If an account exists for that email, we've sent a reset link.
(No indication of whether the account exists — security best practice)

[Back to sign in]  (button)
```

---

### Screen 03 — OTP Verification (`/otp-verification`)

**Shell:** AuthShell

```
Two-factor verification  (text-h1)
Enter the 6-digit code sent to your email.  (subtitle)

[_] [_] [_] [_] [_] [_]    (6-cell OTP input, auto-advance, paste-aware)

[Verify and continue]  (full-width primary button)

Didn't get the code? Resend in 0:45  (caption with countdown)
(After countdown: "Resend code" link)

After 5 failures:
"Too many attempts. Please start over." + link to /login
```

---

### Screen 04 — HR Admin Dashboard (`/dashboard` when role = HR_ADMIN or SUPER_ADMIN)

**Shell:** AppShell  
**PageHeader:** `"Welcome back, {firstName}"` as h1 greeting (no separate PageHeader title — greeting IS the header). Today's date as subtitle. **[Add Employee]** button (brand, routes to `/employees/new`, gated by `employees:write`).

**Grid layout (12-column):**

```
Row 1: 4 × StatsCard
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total       │ │ Active      │ │ On Leave    │ │ Open        │
│ Employees   │ │ Today       │ │             │ │ Requests    │
│  [count]    │ │  [count]    │ │  [count]    │ │  [count]    │
│ ↑ 12 vs    │ │ ↑ 3.1%      │ │ ↑ 2         │ │ ⚠ 5 urgent │
│  last month │ │             │ │             │ │ (warning)   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Row 2: AreaChart (col-span-8) + DonutChart (col-span-4)
┌──────────────────────────────────────────┐ ┌──────────────┐
│ Attendance — Last 30 Days                │ │ Headcount by │
│ [7d] [30d] [90d]  (range tabs)           │ │ Department   │
│                                          │ │              │
│  ───────────── area/line chart ───────── │ │  [donut]     │
│  (x: dates, y: attendance %)            │ │  legend      │
└──────────────────────────────────────────┘ └──────────────┘

Row 3: Recent Activity table (full width)
┌────────────────────────────────────────────────────────────────┐
│ Recent Activity                                                │
│                                                                │
│ Who (avatar+name) │ Action     │ Resource (link) │ When       │
│ ────────────────────────────────────────────────────────────── │
│ [avatar] Priya    │ Created    │ Employee: E0042 │ 2 hrs ago  │
│ [avatar] Aman     │ Approved   │ Leave: LR-0023  │ 4 hrs ago  │
│ ...                                                            │
└────────────────────────────────────────────────────────────────┘
```

**Data sources:** `GET /analytics/summary` (stats + deltas), `GET /analytics/attendance?range=7d|30d|90d` (chart), `GET /analytics/headcount-by-department` (donut), `GET /analytics/recent-activity?limit=10` (table).

---

### Screen 05 — Manager Dashboard (`/dashboard` when role = MANAGER)

**Shell:** AppShell  
**PageHeader:** `"My Team"` as h1 heading. **[Bulk approve]** + **[View team]** buttons top-right.

```
Row 1: 4 × StatsCard
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Team Size   │ │ Present     │ │ Pending     │ │ Avg.        │
│  [count]    │ │ Today       │ │ Approvals   │ │ Attendance  │
│             │ │  [count]    │ │  [count]    │ │  [%]        │
│             │ │ ↑ +1        │ │ 3 leave,    │ │ this month  │
│             │ │             │ │ 2 reg.      │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Row 2: Two-column
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ Pending Approvals                │ │ Team Attendance — This Week       │
│                                  │ │                                   │
│ [avatar] Priya S.                │ │        M   T   W   T   F          │
│ Annual Leave · 3 days            │ │ Priya  P   P   L   P   P          │
│ "Family trip"                    │ │ Aman   P   A   P   P   WFH        │
│ [Deny] [Approve]  (inline btns)  │ │ Ravi   P   P   P   H   P          │
│ ─────────────────────────────── │ │                                   │
│ [avatar] Ravi M.                 │ │ Legend: P=Present A=Absent        │
│ Sick Leave · 1 day               │ │ L=Leave WFH=WFH H=Holiday         │
│ [Deny] [Approve]                 │ │                                   │
│                                  │ │ (cell hover tooltip: "WFH · Jun25")│
│ EmptyState: "No pending"        │ │                                   │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

**Data sources:** `GET /manager/dashboard` (stats + approvals), `GET /attendance/team/weekly?weekStart=YYYY-MM-DD` (grid), `GET /manager/approvals` (for inline actions).

---

### Screen 06 — Employee Dashboard (`/dashboard` when role = EMPLOYEE)

**Shell:** AppShell  
**PageHeader:** `"Hi {firstName}"` as h1 greeting. **[Request leave]** button top-right (opens `NewLeaveRequestDialog`).

```
Row 1: 3 columns
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│ Today's Attendance   │ │ Leave Balance        │ │ Upcoming Holidays    │
│                      │ │                      │ │                      │
│  🕐  09:31 AM        │ │ Casual   Sick  Earned│ │ 25 Jun · Eid         │
│  Status: Checked in  │ │   8       10    15   │ │ 15 Aug · Independence│
│  WFH (green pill)    │ │  (days remaining)    │ │ 2 Oct · Gandhi       │
│                      │ │                      │ │                      │
│  [Check out]         │ │                      │ │                      │
│  View history →      │ │                      │ │                      │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘

Row 2: 2 columns
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│ My Documents                     │ │ My Team                          │
│                                  │ │                                  │
│ 📄 Offer Letter      Verified ✓  │ │ Manager:                         │
│ 📄 PAN Card          Verified ✓  │ │ [avatar] Aman Kumar              │
│ 📄 Address Proof     Pending ●   │ │                                  │
│                                  │ │ Team members:                    │
│                                  │ │ [avatar] Priya S. (you)          │
│                                  │ │ [avatar] Ravi M.                 │
│                                  │ │ [avatar] Sara K.                 │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

**Data sources:** `GET /attendance/today` + `POST /attendance/check-in|check-out` (attendance card), `GET /leave/balance` (leave balance), `GET /holidays` (upcoming 3), `GET /employee/documents` (documents), `GET /employee/team` (team).

---

### Screen 07 — Employee Directory (`/employees`)

**Shell:** AppShell  
**PageHeader:** `"Employees"` + `[Add Employee]` button (gated by `employees:write`).

**Filter bar:**

```
[🔍 Search employees...]   [Department ▾]   [Status ▾]   | [Density ▾]  [Columns ▾]  [Export CSV]
```

**Table columns:**
| Column | Type | Notes |
|---|---|---|
| ☐ | Checkbox | Row selection |
| Employee | Avatar + Name + Code | Primary column |
| Code | Mono text | `E0042` format |
| Department | Text | Filterable |
| Type | Badge | Full-time / Part-time / Contract / Internship |
| Joined | Date | `dd MMM yyyy` |
| Status | Badge | Active (green) / Inactive (gray) |
| ⋯ | Actions | View profile, Edit, Deactivate (HR only) |

**Bulk action bar** (when rows selected):

```
[X employees selected]  [Deactivate selected (HR only)]  [Export selected]  [✕ Clear]
```

**States:** loading (5 skeleton rows), empty (`NoDataIllustration` + "Add your first employee"), error + retry, success.

---

### Screen 08 — Employee Profile (`/employees/[id]`)

**Shell:** AppShell  
**PageHeader:** `"Employees / E0042"` breadcrumb. Actions: `[Edit]` + `[Deactivate]` (HR only — triggers TypeToConfirmDialog requiring employee code).

**Profile header card (full width):**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Avatar lg]  Priya Sharma                               [Edit] [⋯] │
│              Software Engineer · Engineering                         │
│              priya@acme.com · +91 98765 43210                        │
│              ● ACTIVE   |  E0042   |  Joined 15 Jan 2024            │
└─────────────────────────────────────────────────────────────────────┘
```

**Tabs:** Overview · Job · Documents · Attendance · Leave · Activity

**Overview tab:**

- Personal details card (DOB, gender, blood group, address)
- Emergency contact card

**Job tab:**

- Employment details (type, designation, department, manager, reporting to)
- Compensation (if HR — salary band)
- Work schedule (shift, WFH eligibility)

**Documents tab (HR/Admin only — upload/delete gated):**

```
[Upload Document +]  (HR only)

📄 Offer Letter    .pdf   2.1 MB   ✓ Verified    [↓] [🗑 HR only]
📄 PAN Card        .jpg   0.8 MB   ● Pending     [↓] [🗑 HR only]
```

**Attendance tab:**

```
[< Jun 2024 >]   (month navigator)

Date        Check-in   Check-out   Duration   Status
────────────────────────────────────────────────────
12 Jun      09:02 AM   06:15 PM    9h 13m     ● Present
13 Jun      —          —           —          ● Absent
14 Jun      —          —           —          ● Holiday
```

**Leave tab:**

- Balance cards row (Casual / Sick / Earned)
- Leave request history (self only):
  ```
  Ref     Type      Duration       Status
  LR-023  Annual    5–8 Jun (3d)   ✓ Approved
  LR-019  Sick      2 Jun (1d)     ✓ Approved
  ```

**Activity tab (HR/SUPER_ADMIN only):**

```
[avatar] hr@acme.test  CREATED Employee E0042  •  3 days ago
[avatar] hr@acme.test  UPDATED Employee E0042  •  1 day ago
```

Non-HR sees: `EmptyState` "Activity log is visible to HR administrators only."

---

### Screen 09 — Employee Create (`/employees/new`)

**Shell:** AppShell  
**PageHeader:** `"Employees / New Employee"`.

**4-step stepper:**

```
  ①Personal  ──  ②Job  ──  ③Documents  ──  ④Access
  (filled)      (active)    (upcoming)      (upcoming)
```

**Step 1 — Personal Information:**

- First name, Last name, Email, Phone, DOB, Gender, Blood group, Emergency contact (name, relation, phone)

**Step 2 — Job Information:**

- Employee code: `[E0042]  [Generate →]` (auto from API), or manual entry
- Designation, Department (select, shows name), Manager (select), Employment type (Full-time / Part-time / Contract / Internship), Join date, Salary band (optional, HR only), Work mode (Office / WFH / Hybrid)

**Step 3 — Documents:**

- Drag-drop or browse file upload
- Queued uploads (file name, size, progress bar) — uploaded after employee creation

**Step 4 — Access:**

- Role assignment (EMPLOYEE / MANAGER / HR_ADMIN)
- "Send invite email" toggle (UI only)
- Summary of all entered data

**Auto-save:** Every 30s to localStorage key `ems:emp-create-draft:{userId}`. Draft restored on page revisit.

**Navigation:** Back / Next buttons. Final step = "Create Employee" primary button.

---

### Screen 10 — Employee Edit (`/employees/[id]/edit`)

Same form as Create but flat (no stepper). All fields populated. "Save changes" CTA.

---

### Screen 11 — Departments (`/departments`)

**Shell:** AppShell  
**PageHeader:** `"Departments"` + `[New Department]` button.

**Two-panel layout:**

```
┌─────────────────────────────┬──────────────────────────────────────────┐
│ Department Tree (left)      │ Detail Panel (right)                     │
│                             │                                          │
│ ▼ Engineering (12)          │ Engineering                             │
│   ├─ Frontend (4)           │ ─────────────                           │
│   └─ Backend (8)            │ Head: Aman Kumar                         │
│                             │ Parent: None (root)                      │
│ ▼ HR (5)                    │ Created: 15 Jan 2024                    │
│   └─ Recruitment (2)        │                                          │
│                             │ Employees (12)                           │
│ ▶ Finance (7)               │ ─────────────                           │
│                             │ [Name]  [Role]  [Joined]                │
│ [+ Add Department]          │ Priya   Engineer  Jan 2024              │
│   (bottom of tree)          │ Ravi    Backend    Mar 2024             │
│                             │                                          │
│                             │ [Edit]  [Delete]                        │
└─────────────────────────────┴──────────────────────────────────────────┘
```

**Delete flow:**

- No employees: `ConfirmDialog` — "Delete Engineering?"
- Has employees: `ReassignAndDeleteDialog` — "Move X employees to: [target dept picker]" then delete.

**Tree rendering:** Server returns nested tree (`children[]`). Do not reconstruct from `parentId`.

---

### Screen 12 — Attendance (`/attendance`)

**Shell:** AppShell  
**PageHeader:** `"Attendance"`.

**Toolbar:**

```
[< Jun 2024 >]    [Department ▾]  [Employee ▾]  (HR/Manager only)    [📅 Calendar | ≡ Table]
```

**Calendar view (default):**

```
     Jun 2024
Mon  Tue  Wed  Thu  Fri  Sat  Sun
──────────────────────────────────
      1    2    3    4    5    6
      P    P    L    P    A    —
  ─────────────────────────────────
  7    8    9   10   11   12   13
  P    P    P   P    H    —    —
  ...
```

Cell colors: P=success, A=danger, L=info, WFH=warning, H=brand, weekend=surface-2.  
Click cell → `DayDetailDrawer` (Sheet).

**Day Detail Drawer:**

```
Thursday, 13 Jun 2024                                  [×]
─────────────────────────────────────────────────────────
Status:    ● Present
Work mode: Office
Check-in:  09:04 AM
Check-out: 06:31 PM
Duration:  9h 27m
Notes:     —

[Regularize this day ▸]   (only if applicable)
```

**Regularization Dialog:**

- Date (pre-filled), Reason (textarea), Expected check-in/check-out (time pickers), Work mode, Optional supporting document upload.

**Table view:**

```
Date        Check-in   Check-out   Duration   Work Mode   Status
────────────────────────────────────────────────────────────────
12 Jun      09:02 AM   06:15 PM    9h 13m     Office      Present
13 Jun      —          —           —          —           Absent
```

---

### Screen 13 — Leave Management (`/leave`)

**Shell:** AppShell  
**PageHeader:** `"Leave"` + `[New Request]` button (opens `NewLeaveRequestDialog`).

**4 tabs:** My Requests · Approvals (HR/Manager) · Team Calendar · Balances

**My Requests tab:**

```
Ref       Type     Start     End      Days  Status    Actions
──────────────────────────────────────────────────────────────
LR-024    Annual   20 Jun    22 Jun   3     Pending   [Withdraw]
LR-023    Sick     2 Jun     2 Jun    1     Approved  —
LR-020    Annual   15 May    18 May   4     Rejected  —
```

**Approvals tab (HR/Manager):**

```
[Row selection + Bulk approve bar]

Employee      Type     Duration      Days  Reason         Coverage  Actions
───────────────────────────────────────────────────────────────────────────
Priya S.      Annual   5-8 Jun       3d    Family trip    ⚠ 60%    [Deny] [Approve]
Ravi M.       Sick     2 Jun         1d    Not feeling    OK        [Deny] [Approve]
```

Coverage chip: `⚠ 60%` in warning color if team coverage drops below threshold.

**Bulk approve modal:**

```
Approve X requests?
───────────────────
[Checkbox list of selected requests]
Optional comment for all: [textarea]
[Cancel]  [Approve All]
```

**Team Calendar tab:**

```
[< Jun 2024 >]

            1  2  3  4  5  6  7  8 ...
Priya S.    P  P  L  L  L  —  —  P
Ravi M.     P  P  P  P  A  —  —  P
Sara K.     P  P  P  P  P  —  —  P
```

(P=Present, L=Leave, A=Absent, H=Holiday, —=Weekend)

**Balances tab:**

```
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Casual    │ │ Sick      │ │ Earned    │
│ 8 / 12   │ │ 10 / 12  │ │ 15 / 21  │
│ remaining │ │ remaining │ │ remaining │
│ 2 used    │ │ 1 used    │ │ 3 used   │
│ 2 pending │ │           │ │           │
└───────────┘ └───────────┘ └───────────┘
```

**New Leave Request Dialog:**

```
Leave Type:   [Annual ▾]
Start Date:   [date picker]
End Date:     [date picker]
Total days:   3 (auto-calculated, excluding weekends/holidays)
Reason:       [textarea]

[Cancel]  [Submit Request]
```

---

### Screen 14 — Holidays (`/holidays`)

**Shell:** AppShell  
**PageHeader:** `"Holidays 2024"` + `[Import .ics]` + `[Add Holiday]` buttons (HR only).

**View toggle:** [Year] [List] in toolbar.

**Year view (default):**

```
        Jan          Feb          Mar          Apr
  ┌──────────────┐ ┌──────────────┐ ...
  │ 1  2  3  4   │ │              │
  │  ●26 Republic│ │ ●14 Holi     │
  │              │ │              │
  └──────────────┘ └──────────────┘
  ...
  (12-month tile grid, holiday dates shown as colored dots + tooltip)
  Click a tile → MonthDetailModal
```

**Month Detail Modal:**

```
March 2024                                            [×]
─────────────────────────────────────────────────────────
14 Mar    Thu    Holi                    [Edit] [Delete]
25 Mar    Mon    Ugadi                   [Edit] [Delete]
```

**List view (secondary):**

```
Date         Day      Name             Type           Actions
────────────────────────────────────────────────────────────
26 Jan 2024  Fri      Republic Day     National       [Edit] [Delete]
14 Mar 2024  Thu      Holi             National       [Edit] [Delete]
```

**Add/Edit Holiday Dialog:**

```
Holiday Name: [_______]
Date:         [date picker]
Type:         [National / Regional ▾]
[Cancel]  [Save]
```

**Import .ics Flow:**

1. File picker dialog — drag-drop or browse `.ics` file
2. Preview dialog:
   ```
   Found 12 holidays. 2 will overwrite existing.
   ─────────────────────────────────────────────
   ✓ 26 Jan  Republic Day          (new)
   ✓ 14 Mar  Holi                  (new)
   ⚠ 15 Aug  Independence Day      (will overwrite)
   [Cancel]  [Import 12 holidays]
   ```
3. Success toast.

---

### Screen 15 — Permissions Matrix (`/permissions`)

**Shell:** AppShell  
**PageHeader:** `"Roles & Permissions"` + `[Add Role]` button (SUPER_ADMIN only).

**Matrix layout (sticky column headers):**

```
Permission                      SUPER_ADMIN   HR_ADMIN   MANAGER   EMPLOYEE
──────────────────────────────────────────────────────────────────────────
Employees
  employees:read                    ●            ●          ●          ○
  employees:write                   ●            ●          ○          ○
  employees:delete                  ●            ●          ○          ○
Leave
  leave:read                        ●            ●          ●          ●
  leave:approve                     ●            ●          ●          ○
...

Built-in roles (●/○ locked)    Custom roles (checkboxes editable)
```

**Add Role Dialog:**

```
Role Name:  [_______]
Role Key:   [_______]  (auto-slugified)
Initial permissions: [multi-select checkboxes]
[Cancel]  [Create Role]
```

**Save Changes flow — impact preview:**

```
Confirm permission changes?
─────────────────────────────
12 users will gain new access.
3 users will lose access.
[Cancel]  [Confirm & Save]
```

---

### Screen 16 — Settings (`/settings`)

**Shell:** AppShell  
**Layout:** Two-panel — left nav (grouped) + right content panel.

**Left navigation (w-56, grouped):**

```
WORKSPACE
  ● Company Profile    (active)
    Branding
    Leave Types

PEOPLE
    Attendance Rules

SECURITY
    Authentication
    Sessions & Devices
    Audit Log

NOTIFICATIONS
    Email Templates
    Preferences

INTEGRATIONS  (Phase 2 placeholder)
    Email
    Storage
    Webhooks

BILLING  (Phase 2 placeholder)
    Plan
    Invoices
```

**Settings panels (right side, each is a separate sub-route):**

**Company Profile panel:**

```
Company Information
─────────────────────────────────────────────
Company Name:     [Acme Corp]
Logo:             [Upload / drag-drop, preview]
Website:          [https://...]
Industry:         [Technology ▾]

Address
─────────────────────────────────────────────
Street:     [_______]
City:       [_______]
State:      [_______]
Country:    [India ▾]
Postal:     [_______]

Regional Settings
─────────────────────────────────────────────
Timezone:   [Asia/Kolkata ▾]
Date format:[DD/MM/YYYY ▾]
Fiscal year:[April ▾]

[Cancel]  [Save Changes]
```

**Branding panel:**

```
Logo:            [Upload / drag-drop]
Primary color:   [#3B5BDB]  [color swatch picker]
[Cancel]  [Save]
```

**Leave Types panel:**

```
[+ Add Leave Type]

Name          Days/year   Carry-forward   Paid   Actions
──────────────────────────────────────────────────────────
Annual Leave    21          Yes (max 5)    Yes    [Edit] [Delete]
Sick Leave      12          No             Yes    [Edit] [Delete]
Casual Leave    12          No             Yes    [Edit] [Delete]
```

**Attendance Rules panel:**

```
Working hours per day:    [8]  hours
Grace period:             [15] minutes
Check-in window:          [08:00] – [10:00]
Geo-fencing:              [toggle off/on]
Geo-fence radius:         [500] meters
[Save]
```

**Authentication panel:**

```
Session timeout:          [30] minutes
Multi-factor auth (MFA):  [toggle off/on]
Password policy:
  Minimum length:         [8]
  Require uppercase:      [✓]
  Require numbers:        [✓]
  Require symbols:        [✓]
  Password expiry:        [90] days
[Save]
```

**Sessions & Devices panel (live API):**

```
Active Sessions
──────────────────────────────────────────────────────────
Current session ★
Chrome · macOS   IP: 103.x.x.x   Last active: now      [Revoke ×]

Chrome · iPhone  IP: 45.x.x.x    Last active: 2h ago   [Revoke ×]
```

**Audit Log panel (live API):**

```
Filter: [Entity type ▾] [Action ▾] [User ▾] [Date range]

Who              Action    Entity           When
──────────────────────────────────────────────────────
hr@acme.test     CREATED   Employee E0042   3 days ago
hr@acme.test     UPDATED   Employee E0042   1 day ago
```

**Email Templates panel:**

```
[Welcome Email]  [Leave Approved]  [Leave Rejected]  [Password Reset]

Subject:  [___________]
Body:     [rich text editor]
Variables: {{first_name}}, {{company_name}}, ...
[Save template]
```

**Notification Preferences panel:**

```
               In-app    Email    SMS
Leave request   [✓]       [✓]     [ ]
Leave approved  [✓]       [✓]     [ ]
New hire        [✓]       [ ]     [ ]
Attendance miss [✓]       [ ]     [ ]
[Save]
```

**Integrations (Phase 2 card):**

```
🔌 Integrations — Coming in Phase 2

Connect your email provider, cloud storage,
and webhooks to automate workflows.

[Phase 2]  badge
```

**Billing (Phase 2 card):**

```
💳 Billing & Subscription — Coming in Phase 2

Manage your plan, view invoices, and update
payment methods.

[Phase 2]  badge
```

---

## 6. Interaction Patterns

### 6.1 Global Search

- Input: centered in topbar, `w-full max-w-md`, `bg-surface-2 rounded-lg`
- Shortcut: `/` (when not in input), `⌘K` / `Ctrl+K`
- Debounce: 250ms
- Results popover: grouped by type (Employees, Departments, etc.) with count chip
- Arrow-key navigation, Enter selects, Escape closes
- Result click → navigate to result URL

### 6.2 Notification Bell

- Bell icon + red badge (`unreadCount`, hidden if 0)
- Click → Popover list of notifications
- Each row: type-colored dot + title + excerpt + relative time
- "Mark all as read" link at bottom
- Empty state: "You're all caught up."
- Polling: every 30 seconds via `refetchInterval`

### 6.3 Theme Toggle

- Sun (switch to light) / Moon (switch to dark) icon button
- Sets `data-theme="dark"` on `<html>` via `next-themes`
- Persisted in user profile on server

### 6.4 Date Navigation (Attendance, Team Calendar, etc.)

```
[< Jun 2024 >]   (Chevron-Left + "Mon YYYY" + Chevron-Right)
```

URL state via `nuqs` (`?month=2024-06`). Shareable/bookmark-able.

### 6.5 View Toggles (Calendar / Table; Year / List)

```
[📅 Calendar] [≡ Table]   or   [Year] [List]
```

URL state via `nuqs` (`?view=calendar`). Active = brand bg.

### 6.6 Filter Bar Pattern

```
[🔍 Search...]  [Filter 1 ▾]  [Filter 2 ▾]  |  [Density ▾]  [Columns ▾]  [Action]
```

All filters → URL state via `nuqs`. Filters survive page reload and are shareable.

### 6.7 Optimistic Updates

Approve / Reject / Withdraw actions: UI updates immediately (optimistic), reverts on API error with a toast showing the reason.

---

## 7. Permission & Role Rules

| Role          | Dashboard                | Can see                             | Can do                                   |
| ------------- | ------------------------ | ----------------------------------- | ---------------------------------------- |
| `SUPER_ADMIN` | HR Dashboard             | Everything                          | Everything                               |
| `HR_ADMIN`    | HR Dashboard             | All employees, all leave/attendance | CRUD employees, approve leave/attendance |
| `MANAGER`     | Manager Dashboard        | Own team                            | Approve own team's leave/regularization  |
| `EMPLOYEE`    | Employee Dashboard       | Own data only                       | Request leave, check in/out              |
| `AUDITOR`     | HR Dashboard (read-only) | Audit logs only                     | Read only                                |

**UI gating:** `<PermissionWrapper permission="x:write">` — hides UI. Not a security boundary; server enforces.

**Role gating:** `<RoleGate roles={['SUPER_ADMIN']}>` — used for Permissions Matrix.

---

## 8. Component States (Required for Every Data Component)

Every component that fetches data MUST implement all four:

| State       | Implementation                                                                        |
| ----------- | ------------------------------------------------------------------------------------- |
| **Loading** | Skeleton matching the shape (rows for tables, bars for forms). `<Skeleton>` component |
| **Empty**   | `<EmptyState>` with illustration, title, description, optional CTA button             |
| **Error**   | `<ErrorState message={...} onRetry={refetch} />`                                      |
| **Success** | Actual content                                                                        |

---

## 9. Responsive Breakpoints

| Width          | Behavior                                              |
| -------------- | ----------------------------------------------------- |
| 1920px         | Full layout, comfortable density                      |
| 1440px         | Full layout                                           |
| 1280px         | Full layout (minimum supported desktop)               |
| 1024px (lg)    | Sidebar collapses to icon-only by default             |
| 768px (md)     | Sidebar becomes Sheet drawer; some table columns hide |
| 375px (mobile) | Single column, topbar simplified                      |

---

## 10. Accessibility Rules

- WCAG AA minimum: 4.5:1 for body text, 3:1 for large text
- All form fields have `<label>` — placeholder ≠ label
- Focus rings: 3px brand ring (`--shadow-focus`) on every interactive element
- Skip link: `<a href="#main-content">Skip to main content</a>` (visible on focus)
- Modals and drawers trap focus; ESC closes
- Tables: `scope` on headers, `aria-sort` on sortable columns
- Toast: `role="status"` for info, `role="alert"` for error
- Icons: `aria-hidden` when decorative; `aria-label` when interactive standalone
- `prefers-reduced-motion`: all animations/transitions disabled

---

## 11. Phase 2 — Planned Screens (Build to Same Standard)

The following screens are deferred but must use the same design system, tokens, layout shell, and component patterns as Phase 1. These specifications serve as the wireframe-level brief for Phase 2 implementation.

---

### P2-Screen 01 — Payroll (`/payroll`)

**Role:** HR_ADMIN, SUPER_ADMIN, EMPLOYEE (own slip only)

**PageHeader:** "Payroll" + [Run Payroll] button (HR only) + [Export] button

**HR view — tabs:** Run Payroll · History · Employee Payslips · Settings

**Run Payroll tab:**

```
[Select Month: Jun 2024 ▾]   [Run Payroll →]  (triggers confirmation dialog)

Status cards row:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Employees    │ │ Total        │ │ Processed    │ │ Pending      │
│ in payroll   │ │ Gross        │ │              │ │ Approval     │
│   48         │ │ ₹24,80,000  │ │   46         │ │   2          │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

Payroll table:
Employee        Department   Basic    Allowances   Deductions   Net Pay    Status
──────────────────────────────────────────────────────────────────────────────────
Priya Sharma    Engineering  50,000   8,000        6,500        51,500     Processed
Ravi Mehta      Backend      45,000   6,000        5,800        45,200     Pending
```

**Employee view (own payslip):**

```
My Payslips
──────────────────────────────────────────────────────
Jun 2024    ₹51,500 net    [Download PDF]
May 2024    ₹51,500 net    [Download PDF]
Apr 2024    ₹51,500 net    [Download PDF]
```

**Payslip detail modal:**

```
PAYSLIP — June 2024                                    [Download PDF ↓]
────────────────────────────────────────────────────────────────────────
Employee:    Priya Sharma (E0042)
Department:  Engineering
Month:       June 2024

Earnings                        Deductions
──────────────────────────      ──────────────────────────
Basic Salary      50,000        PF                  6,000
HRA               5,000         Professional Tax      200
Travel Allow      2,000         TDS                   300
Special Allow     1,000
──────────────                  ──────────────
Gross             58,000        Total Deductions    6,500

NET PAY:  ₹ 51,500
────────────────────────────────────────────────────────────────────────
```

---

### P2-Screen 02 — Recruitment (`/recruitment`)

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER (team positions)

**PageHeader:** "Recruitment" + [New Job Opening] button

**Tabs:** Job Openings · Applications · Interviews · Offers

**Job Openings tab:**

```
[🔍 Search jobs...]  [Department ▾]  [Status ▾]

Title                  Department    Openings  Applications  Status    Actions
──────────────────────────────────────────────────────────────────────────────
Senior Frontend Dev    Engineering   2         14            OPEN      [View] [Edit]
Backend Engineer       Backend       1         8             OPEN      [View] [Edit]
HR Coordinator         HR            1         3             DRAFT     [View] [Edit]
```

**Job Opening Detail (Sheet drawer):**

```
Senior Frontend Developer                         [Edit] [Close Position]
─────────────────────────────────────────────────────────────────────────
Department:   Engineering
Openings:     2
JD:           [rich text — requirements, responsibilities]
Posted:       15 May 2024

Applications (14)
──────────────────────────────────────────────────────
Candidate name  Applied    Stage         Rating  Actions
Ankit Patel     20 May     Technical     ★★★★☆   [Move] [Reject]
Sara Singh      18 May     HR Screen     ★★★☆☆   [Move] [Reject]
```

**Application Pipeline (Kanban or table with stage column):**
Stages: Applied → Screening → Technical → HR Interview → Offer → Hired / Rejected

**Interview Scheduling panel:**

```
[Candidate]  [Interviewer(s)]  [Date & Time]  [Mode: Video/In-person]  [Add to calendar]
```

**Offer Letter panel:**

```
Candidate:       Ankit Patel
Position:        Senior Frontend Developer
CTC:             ₹ [_________]
Join by:         [date picker]
[Generate offer letter PDF]  [Send via email]
```

---

### P2-Screen 03 — Performance (`/performance`)

**Role:** HR_ADMIN, MANAGER (for their team), EMPLOYEE (own review)

**PageHeader:** "Performance" + [New Review Cycle] button (HR only)

**Tabs:** Review Cycles · My Reviews · Team Reviews (Manager only)

**Review Cycles tab (HR):**

```
Cycle name          Period         Status     Participants   Actions
────────────────────────────────────────────────────────────────────
Annual Review 2024  Jan–Dec 2024   Active     48             [View]
Mid-year 2024       Jul 2024       Completed  48             [View]
```

**Review Form (Employee self-review):**

```
Annual Review 2024 — Self Assessment

Goal Achievement
────────────────────────────────────────────
Goal: Launch v2.0 of dashboard
Rating: ★★★★☆
Comments: [textarea]

Goal: Improve API response time by 30%
Rating: ★★★☆☆
Comments: [textarea]

Competencies
────────────────────────────────────────────
Communication:      [1  2  3  4  5]  rating scale
Problem solving:    [1  2  3  4  5]
Teamwork:           [1  2  3  4  5]

Overall comments:   [textarea]
[Save draft]  [Submit review]
```

**Manager review panel (same structure, adds section for manager rating override):**

```
Employee: Priya Sharma

[Employee self-assessment — read-only view]

Manager Rating Override:
Overall rating:  ★★★★☆
Comments:        [textarea]

Promotion recommendation:  [No ▾]
[Submit manager review]
```

**Team Reviews Summary (Manager):**

```
Employee       Self-submitted  Manager done   Final rating
──────────────────────────────────────────────────────────
Priya S.       ✓ 20 Jun       ✓ 22 Jun        ★★★★☆
Ravi M.        ✓ 19 Jun       Pending         —
```

---

### P2-Screen 04 — Asset Management (`/assets`)

**Role:** HR_ADMIN, SUPER_ADMIN, EMPLOYEE (own assets)

**PageHeader:** "Assets" + [Assign Asset] button (HR only)

**Tabs:** All Assets · My Assets (Employee view) · Requests

**All Assets tab:**

```
[🔍 Search assets...]  [Category ▾]  [Status ▾]

Asset ID    Name              Category    Assigned to    Status       Actions
─────────────────────────────────────────────────────────────────────────────
AST-001     MacBook Pro M3    Laptop      Priya S.       Assigned     [View]
AST-002     iPhone 15 Pro     Phone       —              Available    [Assign]
AST-003     Standing Desk     Furniture   Ravi M.        Assigned     [View]
```

**Assign Asset Dialog:**

```
Asset:          MacBook Pro M3 (AST-001)
Assign to:      [Employee search ▾]
Condition:      [Good ▾]
Notes:          [textarea]
Date:           [today, editable]
[Cancel]  [Assign]
```

**My Assets tab (Employee):**

```
Asset ID    Name           Category    Condition   Assigned      Actions
────────────────────────────────────────────────────────────────────────
AST-001     MacBook Pro    Laptop      Good        15 Jan 2024   [Request return]
```

**Asset Request (Employee):**

```
Request a new asset
────────────────────────
Category:    [Laptop ▾]
Description: [I need a laptop for remote work]
Priority:    [Medium ▾]
[Submit request]
```

---

### P2-Screen 05 — Reports (`/reports`)

**Role:** HR_ADMIN, SUPER_ADMIN, MANAGER (limited)

**PageHeader:** "Reports" + [Export] button

**Sidebar (left, within the page):**

```
Workforce
  Headcount report
  Turnover report
  Joining & exit trend

Attendance
  Monthly summary
  Late arrivals
  Absenteeism trend

Leave
  Leave utilization
  Pending leaves

Payroll (Phase 2)
  Payroll summary
  CTC breakdowns
```

**Report content area (right):**
Each report = filter bar + chart + data table.

**Headcount Report:**

```
Filters: [Date range]  [Department ▾]  [Employment type ▾]

[Bar chart: headcount per month]

Department       Count   Full-time   Part-time   Contract
──────────────────────────────────────────────────────────
Engineering      12      10          1            1
HR               5       4           1            0
Finance          7       7           0            0
```

---

### P2-Screen 06 — Announcements (`/announcements`) — optional

**Role:** HR_ADMIN, SUPER_ADMIN (create), all roles (read)

**PageHeader:** "Announcements" + [New Announcement] button (HR only)

**Feed layout:**

```
┌───────────────────────────────────────────────────────┐
│ 📢 Company Outing — Save the date!           2 days ago│
│ HR Team                                               │
│ We're organizing a team outing on July 15th...        │
│ [Read more]                                           │
├───────────────────────────────────────────────────────┤
│ 📋 New Leave Policy Update               1 week ago   │
│ HR Team                                               │
│ Effective July 1st, earned leave carry-forward...     │
│ [Read more]                                           │
└───────────────────────────────────────────────────────┘
```

---

## 12. Design Rules Summary (Enforced for Phase 2)

1. **No raw hex codes.** Use token utilities only (`text-brand`, `bg-surface`, etc.).
2. **Four states always.** Loading skeleton + empty state + error state + success. A component without all four is unfinished.
3. **Buttons have breathing room.** Default actions use `h-9 px-4` minimum.
4. **Labels, not placeholders.** Every form field has a visible label.
5. **Active nav item** = `bg-brand-50 text-brand`. No other styling for active state.
6. **Dark mode tested.** No white-on-white; no invisible borders. Check every screen.
7. **URL state for filters.** All filters/pagination/tabs via `nuqs`. Survives reload, shareable.
8. **Optimistic UI** for approval/rejection actions. Toast on error, rollback UI.
9. **No arbitrary Tailwind values.** Only spacing scale values (2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96).
10. **Tables** built with DynamicTable engine. Forms built with DynamicForm engine. No custom table implementations for new screens.
11. **Charts** built with ChartEngine (Recharts wrappers): `AreaChart`, `BarChart`, `HorizontalBarChart`, `DonutChart`, `LineChart`.
12. **Permission gates** on every sensitive action — hide UI with `<PermissionWrapper>`. Server enforces access.
13. **Module anatomy** — every new feature lives in `src/modules/<name>/` with services, hooks, types, validations, components, constants. No circular imports. Use barrel exports.
14. **Copy style** — toast messages past-tense ("Employee created"), headings sentence-case, no ALL CAPS in headings (only in `overline` labels).
15. **Icons** — Lucide React only, `size-4` default, `aria-hidden` on decorative icons.

---

_This document was generated from the live codebase at commit `c735b9b` (2026-05-27)._
_Update this file whenever a screen is added, removed, or significantly redesigned._
