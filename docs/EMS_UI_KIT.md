# EMS Design System & UI Kit

> Visual identity: Enterprise luxury — calm, dense, confident.  
> Closer to Linear, Vercel, and Stripe than to a Bootstrap admin template.

This document describes the EMS design system and click-through UI kit located at
`docs/ems-design-system/`. It is the canonical visual reference for implementing
any screen in the EMS frontend.

---

## Contents of the design system bundle

```
docs/ems-design-system/
├── README.md                         ← handoff instructions for coding agents
└── project/
    ├── README.md                     ← full design system specification
    ├── SKILL.md                      ← agent-skill manifest
    ├── colors_and_type.css           ← CSS design tokens (copy of tokens.css)
    ├── assets/
    │   ├── favicon.ico
    │   └── illustrations/            ← empty-state SVGs (6 variants)
    ├── preview/                      ← isolated component specimen cards
    │   ├── colors-surfaces.html
    │   ├── colors-brand.html
    │   ├── colors-semantic.html
    │   ├── colors-text.html
    │   ├── colors-departments.html
    │   ├── colors-leave-types.html
    │   ├── colors-statuses.html
    │   ├── type-scale.html
    │   ├── type-mono.html
    │   ├── spacing-scale.html
    │   ├── radii.html
    │   ├── shadows.html
    │   ├── motion.html
    │   ├── buttons.html
    │   ├── badges.html
    │   ├── form-inputs.html
    │   ├── stats-card.html
    │   ├── empty-state.html
    │   ├── nav-item.html
    │   └── illustrations.html
    ├── screenshots/                  ← reference screenshots
    └── ui_kits/
        └── ems-app/                  ← full click-through app
            ├── index.html            ← open in browser to run the UI kit
            ├── index.md              ← this kit's documentation (markitdown output + enriched)
            ├── tokens.css            ← design tokens
            ├── ui.css                ← component styles
            ├── shell.css             ← layout styles
            ├── Icons.jsx             ← Lucide icon subset
            ├── UIPrimitives.jsx      ← Button, Badge, Avatar, Input, Card, Skeleton…
            ├── AppShell.jsx          ← Sidebar, Topbar, PageHeader, StatsCard
            ├── LoginScreen.jsx
            ├── HRDashboard.jsx
            ├── EmployeesScreen.jsx
            ├── EmployeeProfileScreen.jsx
            ├── AttendanceScreen.jsx
            ├── DepartmentsScreen.jsx
            ├── LeaveScreen.jsx
            ├── HolidaysScreen.jsx
            ├── PermissionsScreen.jsx
            ├── SettingsScreen.jsx
            ├── PayrollScreen.jsx
            ├── RecruitmentScreen.jsx
            ├── PerformanceScreen.jsx
            ├── AssetsScreen.jsx
            ├── ReportsScreen.jsx
            └── AnnouncementsScreen.jsx
```

---

## 1. Design tokens

All tokens are CSS custom properties defined in `tokens.css` (also at `src/styles/tokens.css` in the production app).
Two layers: base tokens → semantic aliases.

### 1.1 Color — Surfaces

| Token                 | Light              | Dark               | Use                     |
| --------------------- | ------------------ | ------------------ | ----------------------- |
| `--bg-canvas`         | `hsl(220 14% 98%)` | `hsl(222 20% 8%)`  | Page background         |
| `--bg-surface`        | `hsl(0 0% 100%)`   | `hsl(222 18% 11%)` | Card                    |
| `--bg-surface-raised` | `hsl(220 14% 97%)` | `hsl(222 17% 15%)` | Table header / elevated |
| `--bg-surface-2`      | `hsl(220 14% 96%)` | `hsl(222 16% 14%)` | Hover row / nested card |

### 1.2 Color — Borders

| Token              | Light              | Dark               |
| ------------------ | ------------------ | ------------------ |
| `--border-subtle`  | `hsl(220 13% 91%)` | `hsl(222 14% 18%)` |
| `--border-default` | `hsl(220 13% 84%)` | `hsl(222 14% 24%)` |
| `--border-strong`  | `hsl(220 13% 65%)` | `hsl(222 12% 38%)` |

### 1.3 Color — Text

| Token               | Light              | Use              |
| ------------------- | ------------------ | ---------------- |
| `--text-primary`    | `hsl(222 47% 11%)` | Headings, body   |
| `--text-secondary`  | `hsl(220 9% 38%)`  | Labels           |
| `--text-tertiary`   | `hsl(220 9% 55%)`  | Captions         |
| `--text-disabled`   | `hsl(220 9% 72%)`  | Disabled         |
| `--text-on-primary` | `hsl(0 0% 100%)`   | Text on brand bg |

### 1.4 Color — Brand

| Token         | Value               | Use                           |
| ------------- | ------------------- | ----------------------------- |
| `--brand-50`  | `hsl(222 100% 97%)` | Active nav tint, chip fill    |
| `--brand-100` | `hsl(222 95% 92%)`  | Avatar tint                   |
| `--brand-500` | `hsl(222 80% 52%)`  | Primary buttons, links, focus |
| `--brand-600` | `hsl(222 75% 46%)`  | Button hover                  |
| `--brand-700` | `hsl(222 70% 40%)`  | Press / text on brand         |

### 1.5 Color — Semantic

| Token           | Hue        | Use                           |
| --------------- | ---------- | ----------------------------- |
| `--success-500` | mint green | Active status, positive delta |
| `--warning-500` | amber      | On leave, pending             |
| `--danger-500`  | red        | Errors, rejected, absent      |
| `--info-500`    | cyan-blue  | WFH, informational            |

### 1.6 Color — Department palette (stable per domain)

| Token                | Color   |
| -------------------- | ------- |
| `--dept-engineering` | indigo  |
| `--dept-operations`  | green   |
| `--dept-sales`       | amber   |
| `--dept-product`     | purple  |
| `--dept-finance`     | teal    |
| `--dept-people`      | magenta |
| `--dept-legal`       | red     |
| `--dept-marketing`   | lime    |
| `--dept-it`          | sky     |

### 1.7 Color — Leave types (stable per type)

| Token                 | Hue    | Semantics         |
| --------------------- | ------ | ----------------- |
| `--leave-casual`      | amber  | Flexible time off |
| `--leave-sick`        | red    | Recovery          |
| `--leave-earned`      | green  | Banked / accrued  |
| `--leave-parental`    | purple | Long, planned     |
| `--leave-bereavement` | slate  | Somber            |
| `--leave-comp-off`    | teal   | Earned back       |
| `--leave-unpaid`      | grey   | No balance        |

### 1.8 Status tokens

```css
--status-active: var(--success-500) --status-onleave: var(--warning-500)
  --status-terminated: var(--text-tertiary) --status-approved: var(--success-500)
  --status-pending: var(--warning-500) --status-rejected: var(--danger-500)
  --status-withdrawn: var(--text-tertiary);
```

### 1.9 Radii

| Token           | Value  | Use                       |
| --------------- | ------ | ------------------------- |
| `--radius-sm`   | 4px    | Badges, chips, code pills |
| `--radius-md`   | 8px    | Inputs, buttons           |
| `--radius-lg`   | 12px   | **Cards**, nav items      |
| `--radius-xl`   | 16px   | Modals, drawers           |
| `--radius-full` | 9999px | Avatars, status dots      |

### 1.10 Shadows

Cards use **borders**, not shadows. Shadows are for floating layers only.

| Token            | Use             |
| ---------------- | --------------- |
| `--shadow-xs`    | Hover state     |
| `--shadow-sm`    | Dropdowns       |
| `--shadow-md`    | Popovers        |
| `--shadow-lg`    | Modals, drawers |
| `--shadow-focus` | 3px focus ring  |

### 1.11 Motion

| Token           | Value                            | Use                     |
| --------------- | -------------------------------- | ----------------------- |
| `--dur-fast`    | 120ms                            | Color/hover transitions |
| `--dur-base`    | 180ms                            | Layout, route, modal    |
| `--dur-slow`    | 280ms                            | Complex entrance        |
| `--ease-out`    | `cubic-bezier(0.16, 1, 0.3, 1)`  | Entries                 |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Layout transitions      |

### 1.12 Spacing scale

```
0 → 2 → 4 → 6 → 8 → 12 → 16 → 20 → 24 → 32 → 40 → 48 → 64 → 80 → 96 px
```

Section gap = 24px. Card padding = 16–20px. Page gutter = 24px desktop.

---

## 2. Typography

Single typeface: **Inter** (variable weight). Mono: **JetBrains Mono** for codes, IDs, timestamps.

| Class            | Size / LH | Weight | Tracking | Use                      |
| ---------------- | --------- | ------ | -------- | ------------------------ |
| `.text-display`  | 32/40px   | 600    | -0.02em  | Hero headings            |
| `.text-h1`       | 24/32px   | 600    | -0.015em | Page titles              |
| `.text-h2`       | 20/28px   | 600    | -0.01em  | Section headings         |
| `.text-h3`       | 16/24px   | 600    | —        | Card titles              |
| `.text-body`     | 14/20px   | 400    | —        | Primary body text        |
| `.text-body-sm`  | 13/18px   | 400    | —        | Dense forms, table cells |
| `.text-caption`  | 12/16px   | 500    | —        | Secondary labels         |
| `.text-overline` | 11/14px   | 600    | +0.05em  | UPPERCASE section labels |
| `.text-mono`     | 12/16px   | 500    | —        | Codes, IDs, timestamps   |

---

## 3. Component patterns

### Button variants

```
default      → brand-500 fill, white text
outline      → white bg, border-default border
secondary    → surface-2 bg
ghost        → transparent, hover surface-2
destructive  → danger tint bg, danger text
link         → brand text, no bg
```

Sizes: `xs` (28px), `sm` (32px), `default` (36px), `lg` (40px). Icon-only: `icon`, `icon-sm`, `icon-xs`.

### Badge variants

```
default   → brand fill
secondary → surface-2
outline   → border only
success   → mint tint + text
warning   → amber tint + text
danger    → red tint + text
info      → cyan tint + text
```

All badges are 20px height, pill-shaped (radius-full), optional dot prefix.

### Card pattern

```css
background: var(--bg-surface);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-lg); /* 12px */
padding: 16px (sm) or 20px (lg);
```

Cards use borders, not shadows. Hover only when clickable (`bg-surface-2` + `border-default`).

### StatsCard

Top accent bar (2px, full width) in the card's `accent` color. Label row with icon chip. Large tabular-nums value. Optional `delta` (TrendingUp/Down + signed number + sub label) or plain `sub` label.

### PageHeader

Sticky at top of content area. Frosted glass: `bg-canvas/95 + backdrop-blur-sm`. Breadcrumbs → H1 title → description. Primary action(s) top-right.

### AppShell layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (240px / 64px collapsed)  │   Topbar (64px) │
│  ─────────────────────────────     │─────────────────│
│  Logo (64px tall)                  │                 │
│  Nav items (8px radius, brand-50   │  Search bar     │
│  tint when active)                 │  Theme toggle   │
│  ─ Phase 2 divider ─               │  Bell + Avatar  │
│  Phase 2 nav items                 │                 │
│  ─────────────────────────         │─────────────────│
│  Collapse toggle                   │   PageHeader    │
│                                    │─────────────────│
│                                    │                 │
│                                    │  Scrolling main │
│                                    │  content area   │
└─────────────────────────────────────────────────────┘
```

---

## 4. Screen-by-screen reference

### Login

Layout: 2 columns (form left, feature callout right). Logo top-left, footer bottom.  
Form: email + password + "Forgot password?" link + remember-me checkbox + submit button + help text.  
Right panel: bordered tile with version badge, headline, and 3 feature bullet points.

### HR Dashboard

Greeting: `"Welcome back, {name}"` + `"Day, Month DD, YYYY"`.  
Stats row: Total Employees / Active Today / On Leave Today / Open Requests (4 × StatsCard).  
Charts: Attendance trend bar chart (2fr) + Headcount donut by department (1fr).  
Footer: Recent activity table (Who / Action / Resource / When) with avatar + monospace timestamp.

### Employees

Toolbar: search input (280px) + 3 filter SelectTriggers + bulk-action buttons (when rows selected) + "Save view" button.  
Table columns: Checkbox / Code (mono) / Employee (avatar + name + role) / Department / Type (outline badge) / Status (semantic badge with dot) / Joined / Row actions.  
Pagination: "Showing 1–N of 1,240" + Prev/Page N of 124/Next.

### Employee Profile

Header band: XL brand avatar + name + status badge + type badge + email + phone + manager.  
Tabs: Overview / Attendance / Leave / Documents / Activity.  
Overview: 2-col — personal details key-value table (left) + leave balance bars + documents list (right).

### Attendance

Stats: Working days / Present / Leave / Avg hours.  
Toolbar: dept filter + employee filter + month navigator + calendar/table toggle.  
Layout: 280px check-in card (time + hours + CTA) + month calendar grid.  
Calendar cell status: present (mint), absent (red), leave (amber), WFH (cyan), holiday (purple), weekend (grey).

### Departments

Left 340px tree: expandable rows with color dot + dept name + count. Active row gets color tint.  
Right details: hero card (colored top border + dept label + name + head + count + actions), sub-teams grid, members table.

### Leave

Stats: Pending approvals / On leave today / Avg approval time / Comp-off pending.  
Left (2fr): Pending/Recent tabs. Pending tab has bulk approve/deny. Each row has Approve/Deny inline buttons.  
Right (1fr): My balance — per leave-type progress bars with remaining/total days.

### Holidays

Type legend: National / Religious / Regional / Company / Optional pill chips.  
Year grid: 4-col × 3 mini-month calendars. Holiday dates render as colored cells matching type.  
Below grid: holiday list table + selected holiday detail card with colored tint background.

### Permissions

Role cards: 5 chips (Super Admin / HR Admin / Manager / Employee / Auditor) with colored top border and member count.  
Legend: write (●, green) / read (◐, cyan) / none (○, grey).  
Matrix table: permission groups as section headers, role columns, cells cycle through levels on click.

### Settings

Left 240px sub-nav: Organization / Account / Workspace sections.  
Right content pane with `FormRow` (200px label + field, bottom border separator).  
Implemented: Company profile, Branding (logo + accent swatches), Notifications (3 × switch per row), Authentication (password policy + MFA + sign-in methods).

### Payroll

Tabs: Run Payroll / History / Payslips / Settings.  
Run Payroll: cycle selector + 4 stats (employees, gross, net, pending) + employee payroll table (basic / allowances / deductions / net pay).  
Settings: salary components table + statutory toggles + processing rules FormRows.

### Recruitment

Stats: Open reqs / Active candidates / Interviews this week / Avg time to hire.  
Tabs: Pipeline (kanban: Applied / Screening / Interview / Offer / Hired) / Openings / Candidates.  
Kanban cards: avatar + name + role + star rating + days in stage + req tag + referral flag.

### Performance

Active cycle banner with progress bar.  
Tabs: Reviews / Goals / Calibration.  
Reviews: self + manager checkmarks + status dot + rating label.  
Goals: owner + title + progress bar + due date + status badge.  
Calibration: rating distribution bars + calibration notes panel.

### Assets

Tabs: Inventory / Assigned / Requests.  
Inventory: asset glyph icon (Laptop/Monitor/Phone/Box) + name + tag (mono) + status badge + holder avatar.  
Assigned: employee → asset mapping.  
Requests: pending/approved/fulfilled with Approve/Decline inline actions.

### Reports

Stats: Total headcount / Attrition TTM / Avg tenure / Payroll/month.  
Tabs: Overview (headcount trend bar chart + department breakdown bars) / Library (report table with CSV download).

### Announcements

Feed column: composer entry bar + pinned card (bordered left with category color, 18px title) + chronological feed cards.  
Sidebar: Channels list (channel name + post count, first row highlighted) + Upcoming events (date block + title + meta).

---

## 5. Implementation rules (from CLAUDE.md)

When implementing any screen from this design system in the Next.js frontend:

1. **Never deviate from wireframes** — implement each screen top-to-bottom, left-to-right per the design.
2. **Use the token system** — `var(--brand-500)` in CSS vars maps to Tailwind classes like `bg-brand` in the production app. No raw hex codes.
3. **Component states** — every component must handle loading (skeleton), empty (`EmptyState`), error (`ErrorState`), and success states.
4. **Use design token equivalents** — `tokens.css` vars map to Tailwind theme extensions in the production app via `src/styles/tokens.css`.
5. **One typeface** — Inter for all UI text, JetBrains Mono only for codes, IDs, timestamps.
6. **No gradient backgrounds** — flat fills only on cards, sidebar, topbar, page background.
7. **Cards use borders not shadows** — `border: 1px solid var(--border-subtle)` + `border-radius: 12px`.
8. **Shadows only on floating layers** — dropdowns, popovers, modals, drawers.
9. **Icons from Lucide React only** — sizes 14/16/18/20/24px. Default 16px inline.
10. **Active nav item** — `bg-brand-50` fill + `text-brand` color. No left-side vertical bar.

---

## 6. Quick-start for a new screen

```tsx
// 1. Create src/app/(dashboard)/my-module/page.tsx
// 2. Create src/modules/my-module/components/MyModuleScreen.tsx

'use client';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { StatsCard } from '@/components/data-display/StatsCard';
// ...

export default function MyModuleScreen() {
  return (
    <>
      <PageHeader
        title="My Module"
        description="One sentence describing what this view does."
        breadcrumbs={[{ label: 'My Module' }]}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        }
      />
      <div className="p-6 flex flex-col gap-6">{/* content */}</div>
    </>
  );
}
```

Reference pattern in the UI kit: copy `HRDashboard.jsx` or `EmployeesScreen.jsx` and edit. Do not build bespoke layouts.

---

## 7. Related docs

| File                              | Contents                                           |
| --------------------------------- | -------------------------------------------------- |
| `docs/DESIGN_SYSTEM.md`           | Full production design system specification        |
| `docs/API_MAPPING.md`             | Backend endpoint shapes (authoritative)            |
| `docs/BACKEND_API_REQUESTS.md`    | Frontend-defined pending backend endpoints         |
| `docs/phase2api.md`               | Phase 2 API spec (payroll, reports, settings)      |
| `CLAUDE.md`                       | Engineering conventions and build rules            |
| `src/styles/tokens.css`           | Production CSS custom properties (source of truth) |
| `src/shared/layouts/AppShell.tsx` | Production app shell implementation                |
