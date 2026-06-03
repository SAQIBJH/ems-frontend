# EMS App — UI Kit

A click-through reconstruction of the [EMS Employee Management System](https://github.com/SAQIBJH/ems-frontend) web app, using the design tokens and component contracts from this design system.

## Layout

```
index.html              ← entry; mounts <App>, handles routing + localStorage persistence
tokens.css              ← copy of root colors_and_type.css (kept here so the kit is portable)
ui.css                  ← Button, Badge, Input, Avatar, Table, etc.
shell.css               ← Sidebar, Topbar, PageHeader, calendar grid, dashboard cards

Icons.jsx               ← Lucide-style stroked icons (subset, currentColor)
UIPrimitives.jsx        ← <Button>, <Badge>, <Input>, <Card>, <Skeleton>, <EmptyState>…
AppShell.jsx            ← <AppShell>, <PageHeader>, <StatsCard>

LoginScreen.jsx         ← /(auth)/login
HRDashboard.jsx         ← /dashboard (HR_ADMIN view)
EmployeesScreen.jsx     ← /employees (list + filter + bulk-select)
EmployeeProfileScreen.jsx ← /employees/[id] (overview tab + sidebar widgets)
AttendanceScreen.jsx    ← /attendance (summary + calendar + check-in card)
```

## Navigation

Use the sidebar to jump between modules. Clicking an employee row opens the profile screen. State is persisted to localStorage so a reload keeps your place — including dark mode.

Dashboard, Employees, Employee Profile, Attendance, Departments, Leave, Holidays, Permissions, Settings, Login, and the full Phase 2 suite — Payroll, Recruitment, Performance, Assets, Reports, and Announcements — are all rendered. Every sidebar route now resolves to a built screen.

## What this kit gets right (and where it cuts corners)

**Right** — token-driven colors and type, exact sidebar/topbar/page-header layout from `src/shared/layouts/`, the `StatsCard` shape from `src/components/data-display/StatsCard.tsx`, button variants matching `src/components/ui/button.tsx`, table density and hover behavior matching `src/components/ui/table.tsx`, badge tints matching the semantic palette.

**Cut corners** — no real form validation, no real data fetching, calendar status data is fabricated, the bar/donut "charts" are CSS placeholders for Recharts, dropdowns are static visual triggers (clicking does nothing). The point is high-fidelity _visual_ recreation, not a working app.

## How to extend

1. New screen → start a `XScreen.jsx`, wrap with `<PageHeader>`, fill with `<window.UI.Card>` and primitive components.
2. New icon → drop a Lucide path into `Icons.jsx`. Don't import another icon family.
3. New layout color → reach for a CSS var from `tokens.css`. **Never write a hex.**
