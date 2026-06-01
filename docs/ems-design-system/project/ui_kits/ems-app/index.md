# EMS App — UI Kit

> Click-through prototype of the EMS Employee Management System.
> Built with React 18 (UMD via CDN) + Babel Standalone. No build step required.
> Open `index.html` directly in a browser to run it.

---

## Entry point

`index.html` mounts a React `<App>` component that:

- Reads/writes state to `localStorage` key `ems-uikit-state` (auth, user, route, openEmployee, dark).
- Applies `data-theme="dark"` on `<html>` when dark mode is toggled.
- Routes between all screens via an `activeKey` string prop on `<AppShell>`.

### Load order (matters — each file adds to `window`)

```
Icons.jsx         → window.Icons
UIPrimitives.jsx  → window.UI
AppShell.jsx      → window.AppShell, window.PageHeader, window.StatsCard
LoginScreen.jsx   → window.LoginScreen
HRDashboard.jsx   → window.HRDashboard
EmployeesScreen.jsx → window.EmployeesScreen
EmployeeProfileScreen.jsx → window.EmployeeProfileScreen
AttendanceScreen.jsx → window.AttendanceScreen
DepartmentsScreen.jsx → window.DepartmentsScreen
LeaveScreen.jsx   → window.LeaveScreen
HolidaysScreen.jsx → window.HolidaysScreen
PermissionsScreen.jsx → window.PermissionsScreen
SettingsScreen.jsx → window.SettingsScreen
PayrollScreen.jsx → window.PayrollScreen
RecruitmentScreen.jsx → window.RecruitmentScreen
PerformanceScreen.jsx → window.PerformanceScreen
AssetsScreen.jsx  → window.AssetsScreen
ReportsScreen.jsx → window.ReportsScreen
AnnouncementsScreen.jsx → window.AnnouncementsScreen
```

---

## Routing

| Route key        | Screen                        | Component                      |
| ---------------- | ----------------------------- | ------------------------------ |
| `dashboard`      | HR Dashboard                  | `window.HRDashboard`           |
| `employees`      | Employee directory + table    | `window.EmployeesScreen`       |
| _(openEmployee)_ | Employee profile              | `window.EmployeeProfileScreen` |
| `attendance`     | Attendance calendar           | `window.AttendanceScreen`      |
| `departments`    | Org tree + details            | `window.DepartmentsScreen`     |
| `leave`          | Leave queue + balance         | `window.LeaveScreen`           |
| `holidays`       | Year calendar                 | `window.HolidaysScreen`        |
| `permissions`    | Role × permission matrix      | `window.PermissionsScreen`     |
| `settings`       | Settings sub-nav + forms      | `window.SettingsScreen`        |
| `payroll`        | Run payroll + history         | `window.PayrollScreen`         |
| `recruitment`    | Pipeline kanban               | `window.RecruitmentScreen`     |
| `performance`    | Reviews + goals + calibration | `window.PerformanceScreen`     |
| `assets`         | IT asset register             | `window.AssetsScreen`          |
| `reports`        | Analytics + report library    | `window.ReportsScreen`         |
| `announcements`  | Company announcements feed    | `window.AnnouncementsScreen`   |

---

## CSS files

| File         | Contents                                                                                                                                                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.css` | All CSS custom properties: surfaces, borders, text, brand, semantic, dept, leave, status, chart palette, focus, radii, shadows, motion, spacing, fonts. Light + dark (`[data-theme='dark']`). Typography class utilities.                                            |
| `ui.css`     | Component styles: `.btn`, `.badge`, `.input`, `.checkbox`, `.switch`, `.avatar`, `.card`, `.skeleton`, `.table`, `.menu`, `.kbd`, `.glass`.                                                                                                                          |
| `shell.css`  | Layout styles: `.ems-shell`, `.ems-sidebar`, `.ems-topbar`, `.ems-pageheader`, `.ems-page`, `.section-card`, `.toolbar`, `.tabs`, `.cal`, `.minibar`, `.donut-legend`, `.perm-cell`, `.settings-nav`, `.form-row`, `.dept-row`, `.recruit-board`, `.activity-table`. |

---

## Component inventory

### `Icons.jsx`

Lucide-compatible SVG icon components (2px stroke, `currentColor`). Assigned to `window.Icons`.

```js
window.Icons = {
  Users,
  Building2,
  Clock,
  CalendarOff,
  Calendar,
  Shield,
  Settings,
  LayoutDashboard,
  Plus,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  CalendarCheck,
  CalendarX,
  ClipboardList,
  FileEdit,
  FileText,
  LogOut,
  ExternalLink,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  CalendarPlus,
  Briefcase,
  Mail,
  Phone,
  Wallet,
  UserPlus,
  Star,
  Box,
  BarChart2,
  Megaphone,
  Download,
  Upload,
  MapPin,
  Target,
  AlertCircle,
  Pin,
  Laptop,
  Monitor,
  Smartphone,
};
```

Usage: `<window.Icons.Users size={16} />` — all icons accept `size` prop (default 16) and any SVG attribute.

### `UIPrimitives.jsx`

Assigned to `window.UI`.

| Export          | Props                                                   | Notes                                                           |
| --------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `Button`        | `variant`, `size`, `icon`, `className`, `...rest`       | variants: default/outline/secondary/ghost/destructive/link      |
| `Badge`         | `variant`, `dot`, `className`                           | variants: default/secondary/outline/success/warning/danger/info |
| `Avatar`        | `name`, `size`, `variant`                               | sizes: sm/default/lg/xl; variants: tint/brand                   |
| `Input`         | `className`, `error`, `...rest`                         | HTML input with .input class                                    |
| `Field`         | `label`, `help`, `error`, `children`                    | Wraps Input with label/help                                     |
| `SelectTrigger` | `value`, `placeholder`, `onClick`, `className`, `style` | Visual only — no dropdown                                       |
| `Checkbox`      | `checked`, `onChange`                                   | Custom CSS checkbox                                             |
| `Switch`        | `checked`, `onChange`                                   | CSS toggle switch                                               |
| `Card`          | `className`, `children`                                 | `.card` wrapper                                                 |
| `CardHeader`    | `title`, `action`                                       | `.card-header` with title+action                                |
| `CardBody`      | `tight`, `className`, `children`                        | `.card-body` (tight = 12px pad)                                 |
| `Skeleton`      | `className`, `style`                                    | Shimmer loading placeholder                                     |
| `EmptyState`    | `illustration`, `title`, `description`, `action`        | Centered empty state                                            |
| `cx`            | `...classNames`                                         | classnames joiner utility                                       |

### `AppShell.jsx`

**`AppShell`** — `window.AppShell`

Props: `activeKey`, `onNavigate`, `dark`, `onToggleDark`, `user`, `children`

Renders: 240px (or 64px collapsed) sidebar + 64px topbar + scrolling main area.

Sidebar nav items:

- Phase 1: Dashboard, Employees, Departments, Attendance, Leave, Holidays, Permissions, Settings
- Phase 2 (divider): Payroll, Recruitment, Performance, Assets, Reports, Announcements

**`PageHeader`** — `window.PageHeader`

Props: `title`, `description`, `breadcrumbs[]`, `actions`

Sticky frosted-glass header beneath topbar. Breadcrumb chevron → title → description, primary action top-right.

**`StatsCard`** — `window.StatsCard`

Props: `label`, `value`, `icon`, `sub`, `delta`, `tone`, `accent`

Card with: accent top border, label + icon chip, large value, trend delta or sub-label.

---

## Screen inventory

### Phase 1

**`LoginScreen`** — Two-column: left = form (email + password + remember me), right = feature callout card. Logo top-left. Footer with copyright.

**`HRDashboard`** — Greeting + date, 4 stats cards (Total Employees, Active Today, On Leave, Open Requests), attendance bar chart (14-day), headcount donut by department, recent activity table.

**`EmployeesScreen`** — Toolbar (search + 3 SelectTrigger filters + bulk actions), data table with checkboxes (Code, Employee name+role, Department, Type badge, Status badge, Joined date), pagination footer.

**`EmployeeProfileScreen`** — PageHeader with Back/Edit/Send message actions, identity band (XL avatar + name + badges + contact info), tabs (Overview / Attendance / Leave / Documents / Activity), Overview tab: 2-col layout with personal details table + leave balance bars + documents list.

**`AttendanceScreen`** — 4 stats cards, toolbar (filters + month nav + calendar/table toggle), 280px check-in/out card (time + hours today + CTA buttons) + month calendar grid (status pills: Present/WFH/Leave/Absent/Weekend/Holiday).

**`DepartmentsScreen`** — 340px tree panel (expandable dept nodes with color dots + headcount) + details panel (hero card with colored top border + sub-teams grid + members table).

**`LeaveScreen`** — 4 stats cards, 2-col layout: left = Pending/Recent tabbed table (bulk approve/deny), right = leave balance bars with progress tracks.

**`HolidaysScreen`** — Type legend pills, 4-col × 3-row year grid of mini-month calendars (holidays shown as colored date cells), holiday list table + selected holiday detail card.

**`PermissionsScreen`** — 5-col role chip cards (with member count), legend, permissions matrix table (groups as section headers, cells cycle write/read/none with semantic colors).

**`SettingsScreen`** — Left 240px sub-nav (Organization / Account / Workspace sections), right content pane with `FormRow` components. Implemented panes: Company profile, Branding (logo + accent swatches), Notifications (switch grid), Authentication (password policy + MFA + sign-in methods).

### Phase 2

**`PayrollScreen`** — Tabs: Run Payroll (month selector + 4 stats + employee payroll table with basic/allowances/deductions/net), History (closed cycles), Payslips (employee slip list with PDF download), Settings (salary components table + statutory settings + processing rules).

**`RecruitmentScreen`** — Tabs: Pipeline (kanban board across 5 stages: Applied/Screening/Interview/Offer/Hired), Openings (requisition table), Candidates (all candidates across stages). Shared stats: open reqs, active candidates, interviews this week, avg time to hire.

**`PerformanceScreen`** — Active cycle banner + tabs: Reviews (progress table with self/manager checkmarks + status + rating), Goals (owner + goal + progress bar + status), Calibration (rating distribution bars + calibration notes).

**`AssetsScreen`** — Tabs: Inventory (asset register with type glyph icons), Assigned (hardware-to-employee table), Requests (pending/approved/fulfilled requests).

**`ReportsScreen`** — Tabs: Overview (headcount trend bar chart + department breakdown bars), Library (report table with CSV download). Shared stats: total headcount, attrition TTM, avg tenure, payroll/mo.

**`AnnouncementsScreen`** — Feed column (composer entry, pinned announcement card, chronological feed with category accent borders) + sidebar (Channels list + Upcoming events).

---

## Design tokens quick reference

See `tokens.css` for the full list. Key variables:

```css
/* Surfaces */
--bg-canvas         /* page background */
--bg-surface        /* card background */
--bg-surface-2      /* table hover row / nested */

/* Borders */
--border-subtle     /* card borders */
--border-default    /* inputs */

/* Text */
--text-primary      /* headings + body */
--text-secondary    /* labels */
--text-tertiary     /* captions */

/* Brand */
--brand-500         /* primary action color */
--brand-600         /* hover */
--brand-50          /* active nav tint */

/* Semantic */
--success-500  --warning-500  --danger-500  --info-500

/* Radii */
--radius-sm: 4px   --radius-md: 8px   --radius-lg: 12px  --radius-xl: 16px

/* Motion */
--dur-fast: 120ms  --dur-base: 180ms  --dur-slow: 280ms
```

---

## Extending the kit

1. **New screen** — create `XScreen.jsx`, export to `window.XScreen`, add a `<script type="text/babel" src="XScreen.jsx">` tag in `index.html`, add a route branch in `App`.
2. **New icon** — add a Lucide-style `const MyIcon = (p) => <Icon {...p}>...</Icon>` in `Icons.jsx` and export it from `window.Icons`.
3. **New color** — add a CSS var to `tokens.css`. Never write a hex value in JSX.
4. **New component** — add to `UIPrimitives.jsx` and expose via `window.UI`.
