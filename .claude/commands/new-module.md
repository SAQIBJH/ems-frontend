---
description: Create a new feature module skeleton following CLAUDE.md §6 conventions.
argument-hint: <module-name>
---

# /new-module $1

Create a new feature module at `src/modules/$1/` following CLAUDE.md §6 strictly. Do **not** add scope beyond what is specified here.

## Steps

1. Create the directory structure:

   ```
   src/modules/$1/
   ├── components/
   ├── hooks/
   ├── services/
   ├── validations/
   ├── types/
   ├── constants/
   ├── utils/
   └── index.ts
   ```

2. Create `src/modules/$1/validations/$1.schema.ts` with placeholder Zod schemas for the main entity. Use `z.object({...})` and export the inferred TypeScript type.

3. Create `src/modules/$1/types/$1.types.ts` re-exporting the inferred types from the schema.

4. Create `src/modules/$1/services/$1.api.ts` with placeholder axios calls for list/get/create/update/delete using the shared `apiClient` from `@/lib/api-client`. Endpoints follow the convention `/api/v1/$1`.

5. Create `src/modules/$1/hooks/use$1.ts` with TanStack Query `useQuery`/`useMutation` wrappers around the service functions. Query key prefix: `['$1']`.

6. Create `src/mocks/handlers/$1.ts` with MSW handlers that match the API contract exactly — same envelope shape (`{ success, data, meta }` / `{ success, error }`), same status codes. Register them in `src/mocks/handlers/index.ts`.

7. Create `src/mocks/data/$1.ts` with 10-20 realistic fixture records.

8. Create `src/modules/$1/index.ts` exporting only the public API (hooks, types, key components — never internals).

## Constraints

- Do **not** create any components yet. Only the module skeleton.
- Do **not** create the route in `src/app/(dashboard)/$1/`. That's a separate step.
- Do **not** invent backend endpoints beyond list/get/create/update/delete. If the spec needs more, ask.
- Use `kebab-case` for file names, `PascalCase` for type names, `camelCase` for hooks.

When done, summarize the files created and what's pending (route, components, page integration).
