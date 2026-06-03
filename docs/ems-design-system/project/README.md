# EMS — Design System

> **Visual identity:** Enterprise luxury. Calm, dense, confident.
> Closer to Linear, Vercel, and Stripe than to a Bootstrap admin template.

This system was derived from the **EMS (Employee Management System)** frontend at
[github.com/SAQIBJH/ems-frontend](https://github.com/SAQIBJH/ems-frontend) — a
B2B SaaS used by HR teams, managers, and employees inside a company. The repo
ships a Next.js 15 + Tailwind v4 + shadcn/ui app with a thorough internal
design doc at `docs/DESIGN_SYSTEM.md`; this folder distills that into something
a design agent can consume directly.

If you have access, browse the original for deeper context:

- Repo root — https://github.com/SAQIBJH/ems-frontend
- Token source — [`src/styles/tokens.css`](https://github.com/SAQIBJH/ems-frontend/blob/main/src/styles/tokens.css)
- Full design doc — [`docs/DESIGN_SYSTEM.md`](https://github.com/SAQIBJH/ems-frontend/blob/main/docs/DESIGN_SYSTEM.md)
- Engineering guide — [`CLAUDE.md`](https://github.com/SAQIBJH/ems-frontend/blob/main/CLAUDE.md)
- App shell — [`src/shared/layouts/AppShell.tsx`](https://github.com/SAQIBJH/ems-frontend/blob/main/src/shared/layouts/AppShell.tsx)
- HR dashboard — [`src/modules/dashboard/components/HRDashboard.tsx`](https://github.com/SAQIBJH/ems-frontend/blob/main/src/modules/dashboard/components/HRDashboard.tsx)

---

## 1. Product context

EMS is a **multi-role HR platform** with one application surface (a
responsive web app) and four primary personas:

| Role          | What they see                                                        |
| ------------- | -------------------------------------------------------------------- |
| `SUPER_ADMIN` | Everything. Tenant settings, billing, integrations, role matrix.     |
| `HR_ADMIN`    | Employee directory, departments, analytics, leave/attendance global. |
| `MANAGER`     | Team dashboard, pending approvals, team attendance & leave.          |
| `EMPLOYEE`    | Personal dashboard, my attendance, my leave, my documents.           |
| `AUDITOR`     | Read-only audit log + reports.                                       |

Phase 1 modules: **auth, employees, departments, attendance, leave,
holidays, roles & permissions, settings**. Phase 2 (deferred but
architected for): payroll, recruitment, performance, asset management.

The product is **dense, enterprise, and screen-first** — designed for
1280–1920px workstations. Tablet (768px) works; mobile is a fallback.

---

## 2. Index of this design system

```
.
├── README.md                  ← you are here
├── colors_and_type.css        ← CSS tokens (colors, type, spacing, radii, shadows, motion)
├── SKILL.md                   ← agent-skill manifest (works in Claude Code, too)
├── assets/
│   └── favicon.ico            ← the only brand mark in the source repo
├── preview/                   ← cards rendered in the Design System tab
│   ├── colors-surfaces.html
│   ├── colors-brand.html
│   ├── colors-semantic.html
│   ├── colors-text.html
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
└── ui_kits/
    └── ems-app/               ← the EMS web app — recreated as a click-thru
        ├── README.md
        ├── index.html
        ├── tokens.css         ← copy of root colors_and_type.css for portability
        ├── AppShell.jsx
        ├── Sidebar.jsx
        ├── Topbar.jsx
        ├── PageHeader.jsx
        ├── StatsCard.jsx
        ├── DataTable.jsx
        ├── UIPrimitives.jsx   ← Button, Badge, Avatar, Input, Card, Skeleton
        ├── Icons.jsx          ← Lucide subset (currentColor SVGs, copied)
        ├── HRDashboard.jsx
        ├── EmployeesScreen.jsx
        ├── EmployeeProfileScreen.jsx
        ├── AttendanceScreen.jsx
        └── LoginScreen.jsx
```

---

## 3. Content fundamentals

> "Confident, dense, calm. Enterprise tooling, not consumer."
> — `CLAUDE.md §20`

**Voice.** Direct and operational. The user is a working professional, not a
visitor to be onboarded. Sentences are short and unornamented. No marketing
verbs ("Unleash", "Supercharge"), no friendly hedging ("just", "simply"),
no exclamation marks except in destructive confirmations.

**Person.** Second person ("you") only in onboarding and empty-state CTAs.
Inside the product itself, the UI speaks in the third person about objects —
"3 pending approvals", "Employee created" — not "You have…", "We've…".

**Casing.**

- **Title Case** for page titles and headings: _"Pending Approvals"_, _"Headcount by Department"_.
- **Sentence case** for body copy, descriptions, helper text, dropdown items: _"Track check-in, check-out, and monthly records."_
- **Buttons** use **Title Case for primary actions** (_"Add Employee"_, _"Request Regularization"_) and sentence case for ghost/text actions (_"Request leave"_, _"Sign out"_).
- **Overlines** (`text-overline`) are UPPERCASE with +0.05em tracking.

**Tone in copy — real examples from the codebase.**

| Surface                  | Example                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| Dashboard greeting       | _"Welcome back, Aman"_ / _"Hi, Priya"_ + dated subtitle                |
| Page header (Employees)  | _"Manage your organization's employee directory."_                     |
| Page header (Attendance) | _"Track check-in, check-out, and monthly records."_                    |
| Toast confirmation       | _"Employee created"_ — never _"Success!"_                              |
| Empty state              | Title + sentence-case description + one primary action                 |
| Confirm dialog (delete)  | _"This action is irreversible."_                                       |
| Permission denial        | _"You don't have permission to view this page."_                       |
| Error state              | _"Failed to load attendance data"_ with a **Retry** button + requestId |

**Numbers.** Always formatted. _1,240_ not _1240_. Percentages with a sign for deltas: _+12%_, _−3%_. Currency uses the user's locale.

**Dates.** Two registers:

- Human, in copy: _"EEEE, MMMM d, yyyy"_ → _"Tuesday, May 27, 2026"_.
- Compact, in tables: _"MMM d"_ → _"May 27"_. Mono font on timestamps.

**Emoji.** **No.** Not used anywhere in the source. Don't add them.

**Iconography in place of emoji.** When you'd reach for an emoji, reach for a
Lucide icon at 14–16px, inheriting `currentColor`. See §6.

---

## 4. Visual foundations

### 4.1 Color

- **Two surfaces, two borders, four text shades.** That's the whole palette before brand & semantic.
- **Surfaces:** `bg-canvas` (page) → `bg-surface` (card) → `bg-surface-raised` / `bg-surface-2` (table header, hover row, nested card). Three levels max.
- **Brand:** a single mid-blue (`hsl(222 80% 52%)`). Used **only** for: primary buttons, active nav item bg-tint + text, focus rings, links, the brand initial in the logo, the first chart series. Never as a card background. Never as a gradient.
- **Semantic:** `success` (mint green), `warning` (amber), `danger` (red), `info` (cyan-blue). Used as text + soft-tint backgrounds for badges, never as full-saturation surfaces.
- **Dark mode** is data-driven via `[data-theme='dark']`. The brand tints (`--brand-50`, `--brand-100`) are bumped up so accent surfaces stay legible; shadows get heavier-but-darker.

### 4.2 Type

- **One typeface: Inter** (variable). Numbers use `font-feature-settings: 'tnum'` in tables so columns align.
- **Mono: JetBrains Mono** — strictly for codes (employee IDs, payslip refs, audit timestamps, requestIds in error toasts).
- 8 sizes total, listed in §2 of `colors_and_type.css`. **No arbitrary sizes.**
- Headings use `letter-spacing: -0.01em → -0.02em` (tighter as size grows).
- Body sits at **14/20**, dense forms at **13/18**. Tables run at 13px.

### 4.3 Spacing

- Scale: `0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96` (px).
- Section gap = **24** (`space-8`). Card padding = **16–20**. Page gutter = **24** desktop, **16** tablet.
- **No `[13px]`-style arbitrary values.** If you reach for one, the layout is wrong or the design is.

### 4.4 Backgrounds

- **Flat fills only.** No gradient backgrounds on cards, the page, the sidebar, or the topbar.
- **No illustrations or full-bleed photography** as decoration. The only decorative SVGs in the source are 64px **empty-state line drawings** (NoData, NoTeam, NoHolidays, NoApprovals, NoDocuments, NoSearchResults), drawn in `currentColor` at 6–10% opacity.
- **No repeating patterns or texture.** The whole product is grid + type + thin borders.

### 4.5 Borders, dividers, separators

- **Borders carry the layout.** A card is defined by a 1px `--border-subtle` outline, not by shadow.
- Three border tokens: `subtle` (default), `default` (inputs), `strong` (rarely — emphasized dividers).
- Inside cards, use `divide-y border-subtle` for row separators rather than full borders on every child.
- Tables: header row gets a single bottom border; rows use a bottom border that disappears on `:last-child`.

### 4.6 Cards

The canonical card pattern (rendered in `preview/stats-card.html` and used everywhere):

```
rounded-lg     →  border-radius: var(--radius-lg);   /* 12px */
border         →  1px solid var(--border-subtle);
bg-surface     →  background: var(--bg-surface);
p-4 / p-5      →  padding: 16px (sm) / 20px (lg);
```

Hover only when the card is clickable: `hover:bg-surface-2 hover:border-default`.

### 4.7 Shadows

- **Four steps total.** `xs`, `sm`, `md`, `lg` (plus a 3px focus ring).
- Cards **do not get shadows.** They get borders.
- Shadows are reserved for **floating layers**: dropdowns (`sm`), popovers (`md`), modals + drawers (`lg`).
- Shadows in dark mode are darker, not lighter — the surface is darker than the background, so the shadow is below black.

### 4.8 Radii

| Token  | Value | Use                                                |
| ------ | ----- | -------------------------------------------------- |
| `sm`   | 4px   | Badges, chips, code pills, mini-tags               |
| `md`   | 8px   | Inputs, default buttons                            |
| `lg`   | 12px  | **Cards**, sidebar nav items                       |
| `xl`   | 16px  | Modals, drawers, sheets                            |
| `full` | 9999  | Avatars, status dots, the avatar fallback initials |

### 4.9 Motion

- **Three durations:** 120 / 180 / 280 ms. Almost everything is 120 (color/hover) or 180 (layout/route).
- **Two eases:** `ease-out` for entries, `ease-in-out` for layout transitions.
- Premade Framer Motion presets in the source: `fadeUp` (y 8 → 0, opacity 0 → 1, 180 ms), `scaleIn` (scale 0.96 → 1, 180 ms), `slideRight` (x 16 → 0, drawer enter).
- **Restraint rule:** no animation on data updates inside tables. Only on layout transitions (route, modal, drawer, accordion).
- Sidebar collapse is a `transition-[width]` over 180 ms.

### 4.10 Hover, focus, press

- **Hover (interactive surface):** `bg-surface-2`, no color shift, no shadow. Transitions in 120 ms.
- **Hover (primary button):** `--brand-500 → --brand-600`.
- **Focus:** 3px `box-shadow` ring at 25% opacity of the focus token, plus a 1px border swap to the focus color. Never `outline`.
- **Press:** Buttons translate down 1px (`translate-y-px`). No scale. No color flash.
- **Active nav item:** `bg-brand-50` fill + `text-brand` foreground. The vertical bar / left accent that admin templates love is **not used**.

### 4.11 Transparency & blur

- **Backdrop blur is reserved for two surfaces:** the sticky `PageHeader` (`bg-canvas/95 backdrop-blur-sm`) and the `Topbar` (`bg-surface/80 backdrop-blur-sm`). Both produce a "frosted glass" effect over scrolling content beneath.
- The optional `.glass` utility (16px blur + 140% saturate, surface @ 72% opacity) is reserved for **floating overlays only** — command palette, notification center, search dropdown. Never on cards, never on the sidebar, never on the page background.

### 4.12 Imagery

- The source repo ships **no photography, no illustration, no logo art** beyond a favicon.
- For dashboards and screens that look like a real product, use **placeholder rects with `bg-surface-2`** and a faded icon — that's the project's actual visual language.
- If a user supplies imagery later, treat it as **cool-toned, low-saturation, no grain**, with `border-radius: var(--radius-lg)` and a 1px subtle border.

### 4.13 Layout rules

- **AppShell:** 60px collapsed / 240px expanded sidebar, 64px topbar, max content `screen-2xl` (1536px) with `px-6 py-6` gutters.
- **Sticky `PageHeader`** beneath the topbar. Breadcrumb → title → description, with primary action top-right.
- **One primary action per view.** Everything else is `outline`, `ghost`, or in an overflow menu.
- **No floating action buttons.** No bottom bars.

---

## 5. Iconography

- **Library:** [Lucide React](https://lucide.dev) — declared explicitly in `package.json` and `components.json`. **One icon family for the entire app, no mixing.**
- **Format:** SVG, **inherits `currentColor` via stroke**. Never set `fill` directly.
- **Sizes:** 14, 16, 18, 20, 24 px. Default **16 inline**, **20 in icon-only buttons**, **24 in marketing/empty-state contexts**.
- **Stroke weight:** 2 (Lucide's default — do not change).
- **Pairing with labels:** icon goes **before** the label with an 8px gap.

**Where icons appear (real examples):**

| Icon              | Where                               |
| ----------------- | ----------------------------------- |
| `Users`           | Employees nav, Total Employees stat |
| `Building2`       | Departments nav                     |
| `Clock`           | Attendance nav                      |
| `CalendarOff`     | Leave nav                           |
| `Calendar`        | Holidays nav                        |
| `Shield`          | Permissions nav                     |
| `Settings`        | Settings nav                        |
| `Plus`            | "Add Employee" primary action       |
| `ChevronRight`    | Breadcrumb separators               |
| `TrendingUp/Down` | Stats card delta indicator          |
| `Sun` / `Moon`    | Theme toggle                        |
| `LogOut`          | User menu sign-out                  |
| `Bell`            | Notification center                 |
| `Search`          | Global search                       |

**Substitution note.** The Lucide React package is installed in the source app but
this design-system folder ships **SVG copies of the subset above** in
`ui_kits/ems-app/Icons.jsx`. They render identically to the React package.
For new icons not in the subset, **load from the Lucide CDN**:
`https://unpkg.com/lucide-static@latest/icons/<name>.svg` — same family, same
stroke, no substitution.

**No emoji. No unicode glyphs as icons.** The only Unicode characters in UI are
the en-dash in date ranges (_May 27 – Jun 3_) and the middle-dot separator
(_Engineering · Senior_).

**Logo.** The product mark in the sidebar is a typographic wordmark, **not a
graphic logo**. Expanded: a `<span>` reading `**E**MS` where the leading "E"
is `text-brand` and the rest is `text-fg`. Collapsed: just the brand-colored
`E` centered in the 64px sidebar. There is no separate logo SVG to ship.

---

## 6. Cards rendered in the Design System tab

See `preview/` — each file is a small, focused specimen. Cards are grouped:

- **Colors** — surfaces, brand, semantic, text shades
- **Type** — scale, mono usage
- **Spacing** — scale, radii, shadows, motion
- **Components** — buttons, badges, inputs, stats card, empty state, nav item
- **Brand** — empty-state illustrations (the only original art in the system)

---

## 7. Getting started as an agent

1. Read `colors_and_type.css` and the visual foundations above.
2. Open `ui_kits/ems-app/index.html` in a browser to see the full product reconstructed.
3. For any new screen, **start from `AppShell.jsx`** — sidebar + topbar + page-header are non-negotiable for authenticated views.
4. For a new screen's first cut, **copy `HRDashboard.jsx` or `EmployeesScreen.jsx`** and edit. Resist building bespoke layouts.
5. Buttons, badges, inputs, cards: import from `UIPrimitives.jsx`. Do not redo.
6. Icons: use `Icons.jsx` first; if you need a new one, drop it in there as a Lucide-style stroked SVG with `currentColor`.

---

## 8. What this folder does not have

- **No photography or illustrative art** beyond empty-state line drawings.
- **No logo SVG** — the product mark is typographic only.
- **No motion library wrapper** — animations are documented but not pre-bundled. If you need them, import Framer Motion presets matching the durations in `colors_and_type.css`.
- **No production data fixtures.** Sample data in UI kit screens is hand-written for visual fidelity.
