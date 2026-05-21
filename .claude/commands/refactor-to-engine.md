---
description: Extract a duplicated pattern across modules into a shared engine. Use only when the pattern appears 3+ times.
argument-hint: <pattern-name> (e.g. DynamicTable, DynamicForm, FilterEngine)
---

# /refactor-to-engine $1

Per CLAUDE.md §7: **build engines at the third duplicate, not the first.** Before doing anything, verify the pattern actually appears in at least 3 modules.

## Steps

1. **Survey.** Use `Grep` to find all places that implement the `$1` pattern. List them with file paths and a one-line summary of each variant's variations (different columns, different validation, different filters).

2. **Stop if fewer than 3.** Tell me which modules use it, and recommend waiting until a third use case appears. Do NOT extract prematurely — the wrong abstraction is more expensive than the duplication.

3. **If 3+, propose the engine API.** Write a TypeScript interface for the engine's props in a code block. Pause and let me approve before building.

4. **Once approved:**
   - Create `src/shared/engines/$1/` with `$1.tsx`, `$1.types.ts`, and `index.ts`.
   - Build the engine to match the proposed API.
   - Refactor each existing usage one module at a time, running `pnpm typecheck` after each.
   - Commit each refactored module separately for easier review.

5. **Apply react-best-practices** from `.claude/skills/`:
   - Avoid prop drilling — use composition or context where appropriate.
   - Use `React.memo` only when measured to help, not by default.
   - Keep the engine generic over the row/data type with TypeScript generics.

6. **Document the engine** in CLAUDE.md if it's a new entry not already listed in §5. Update only the relevant section — don't expand other sections.

## Constraints

- An engine that knows about specific domain entities (e.g. `Employee`, `Department`) is wrong. It must be generic.
- An engine with more than ~10 props is wrong. Prefer slots/render props at that point.
- An engine that requires its consumers to import its internal types is wrong. Export everything needed from `index.ts`.
