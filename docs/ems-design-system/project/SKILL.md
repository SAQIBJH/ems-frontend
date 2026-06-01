---
name: ems-design
description: Use this skill to generate well-branded interfaces and assets for EMS (the Employee Management System), either for production or throwaway prototypes/mocks/demos. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

- **Tokens** — `colors_and_type.css` at the root. CSS variables for colors, type scale, spacing, radii, shadows, motion. Use these, never hex values.
- **UI kit** — `ui_kits/ems-app/` is a working click-thru of the real EMS app. Copy primitives from `UIPrimitives.jsx`, icons from `Icons.jsx`, shell pieces from `AppShell.jsx`. Open `index.html` to see what the product looks like.
- **Component cards** — `preview/*.html` show every token + component in isolation. Look here before inventing anything.
- **Visual rules** — flat fills only (no gradients), borders not shadows for cards, Inter + JetBrains Mono only, Lucide icons only, no emoji.
- **Voice** — direct and operational. _"Employee created"_, not _"Success!"_. Sentence case in copy; Title Case in primary actions.

## Building something new

1. Start from `ui_kits/ems-app/AppShell.jsx` — sidebar + topbar + page header is non-negotiable for authenticated views.
2. For each screen, sketch the empty/loading/error/success states. A component that handles only success is incomplete.
3. Always include a `<PageHeader>` with at least a title and breadcrumb.
4. One primary action per view. Everything else is `outline`, `ghost`, or in an overflow menu.
