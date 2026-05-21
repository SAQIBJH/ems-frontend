---
description: Build a screen end-to-end following CLAUDE.md conventions. Includes all four states (loading, empty, error, success), permission gating, and a matching skeleton.
argument-hint: <route-path> <description>
---

# /build-screen $1

**Route:** `$1`
**Brief:** $2

## What to do

Read CLAUDE.md sections 5, 6, 8, 11, 13, 15 before writing any code. Then build this screen end-to-end.

1. **Identify the module(s) involved.** If the relevant module doesn't exist yet, stop and tell me — I'll run `/new-module` first.

2. **Create the route file** at `src/app/(dashboard)$1/page.tsx`. Default to RSC unless the screen needs interactivity (see CLAUDE.md §8 for the table).

3. **Use `<Suspense>` boundaries around each independently-loadable widget.** Pass a matching skeleton as the fallback. Slow widgets must not block fast ones.

4. **For each interactive component:** put it in `src/modules/<name>/components/` as a client component. Export it AND its `Skeleton` variant from the same file.

5. **Forms:** RHF + Zod with `zodResolver`. Schema lives in `src/modules/<name>/validations/`. Map 422 errors to field errors per CLAUDE.md §11.

6. **Tables:** if the module already uses `DynamicTable`, reuse it with a column config. If not, defer the `DynamicTable` refactor unless this is the 3rd or later list screen built (CLAUDE.md §7).

7. **Permission gating:** wrap any action button or sensitive UI in `<PermissionWrapper permission="...">`. Determine the right permission slug from CLAUDE.md §10 conventions (`<module>:read`, `<module>:write`, etc.).

8. **All four states required:**
   - Loading → skeleton matching the shape of the content
   - Empty → `<EmptyState title="..." description="..." action={...} />`
   - Error → `<ErrorState message="..." onRetry={...} />`
   - Success → the real content

9. **Verify before declaring done** (CLAUDE.md §15):
   - `pnpm typecheck` clean
   - `pnpm lint` clean
   - Renders in light and dark mode
   - Keyboard navigable

## Apply react-best-practices

While building, consult the `vercel-react-best-practices` skill in `.claude/skills/`. Specifically:

- Use `Promise.all` for parallel data fetches in RSC
- Pass minimal data across the server/client boundary
- Avoid `useEffect` for state derivation — compute at render time
- Don't import barrel files for icons/UI libraries

## Output

When done, list every file you created or modified, and the four states you handled per component.
