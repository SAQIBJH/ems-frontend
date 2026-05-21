---
description: Run the pre-PR verification checklist on the current branch. Catches the issues a human reviewer would catch.
---

# /verify

Run the full verification checklist on the current changes. Do NOT modify code unless a fix is trivially safe (e.g. unused imports). If anything fails, report it and stop — don't try to fix architectural issues unilaterally.

## Checklist

1. **TypeScript:**

   ```bash
   pnpm typecheck
   ```

   Report any errors. If clean, say "✓ TypeScript clean."

2. **ESLint:**

   ```bash
   pnpm lint
   ```

   Report warnings and errors separately.

3. **Tests:**

   ```bash
   pnpm test --run
   ```

   Report pass/fail counts.

4. **Build:**

   ```bash
   pnpm build
   ```

   If it fails, this is a blocker. Report the error.

5. **Module boundary audit.** Use `Grep` to find any import that reaches into another module's internals (i.e., paths like `@/modules/<x>/components/...` or `@/modules/<x>/hooks/...` instead of `@/modules/<x>`). Report each violation.

6. **CLAUDE.md compliance check.** Look at the files changed in the current branch (`git diff --name-only main`). For each changed `.tsx` file:
   - Does it handle loading, empty, error, success states (§13)?
   - Does it use design tokens, not raw hex (§12)?
   - If it has interactive actions, are they wrapped in `<PermissionWrapper>` (§10)?
   - If it's a route file, is it a thin shim that imports from a module (§5)?

7. **Forbidden imports** (CLAUDE.md §2). Use `Grep` to check for:
   - `from 'redux'` / `from '@reduxjs/'`
   - `from 'styled-components'` / `from '@emotion/'`
   - `from '@mui/'` / `from '@chakra-ui/'` / `from 'antd'`
   - `from 'moment'`
     Report any matches.

8. **Console logs and TODOs left behind.** `Grep` for `console.log(` and `// TODO`. Report counts and locations.

9. **Mock vs real API drift.** If `src/mocks/handlers/<name>.ts` exists for a module, check that its response shape matches the type definitions in `src/modules/<name>/types/`. Report any drift.

## Output format

```
TypeScript:        ✓ / ✗ <details>
ESLint:            ✓ / ✗ <details>
Tests:             ✓ / ✗ <pass>/<total>
Build:             ✓ / ✗ <details>
Module boundaries: ✓ / ✗ <list of violations>
CLAUDE.md states:  ✓ / ✗ <list of files missing states>
Forbidden imports: ✓ / ✗ <list>
Stray logs/TODOs:  <count>
Mock drift:        ✓ / ✗ <details>
```

End with a one-line summary: **READY FOR PR** or **NEEDS FIXES**.
