# EMS Frontend — Project Setup

> Human-readable setup guide for the frontend repo. The companion `CLAUDE.md` is what AI assistants (Claude Code, Cursor) read every session.

---

## 1. Quick facts

- **Standalone repo.** Backend lives separately at `github.com/saeedafri/Employee-management-system`.
- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query + RHF + Zod.
- **Approach:** Auth integrates with the real backend. Everything else uses MSW (Mock Service Worker) until those endpoints exist. The mock IS the contract.

---

## 2. Prerequisites

```bash
node --version    # v20+ (v22 LTS preferred)
pnpm --version    # v9+
git --version
```

If you don't have pnpm: `corepack enable && corepack prepare pnpm@latest --activate`.

---

## 3. First-time setup

```bash
# 1. Create the project
pnpm dlx create-next-app@latest ems-frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack

cd ems-frontend

# 2. Core deps
pnpm add axios @tanstack/react-query @tanstack/react-table \
  react-hook-form @hookform/resolvers zod \
  zustand nuqs \
  date-fns date-fns-tz \
  lucide-react recharts \
  sonner

# 3. Dev deps
pnpm add -D msw @types/node

# 4. shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label form dialog \
  dropdown-menu tabs table select popover calendar sheet \
  toast skeleton badge avatar separator card

# 5. MSW setup
pnpm dlx msw init public/ --save

# 6. Quality tooling
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
pnpm dlx husky init
```

---

## 4. Project structure

After the install, create these directories (CLAUDE.md §5 has the full tree):

```
src/
├── app/                  # Routes (created by Next.js)
├── modules/              # Feature domains
├── shared/
│   ├── engines/          # DynamicTable, DynamicForm, etc.
│   ├── guards/
│   └── layouts/
├── components/
│   ├── ui/               # shadcn (created by shadcn init)
│   ├── feedback/
│   ├── data-display/
│   └── forms/
├── lib/
├── providers/
├── hooks/
├── store/
├── styles/
├── types/
└── mocks/                # MSW handlers
```

---

## 5. Environment variables

Create `.env.local` (gitignored) at the repo root:

```
NEXT_PUBLIC_API_BASE_URL=https://employee-management-system-2b9q.onrender.com/api/v1
NEXT_PUBLIC_TENANT_KEY=<get from backend dev>
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Also commit a `.env.example` with the keys but no values, for other devs.

---

## 6. Running locally

```bash
pnpm dev
```

Open `http://localhost:3000`. Login page should appear. Use these seed users (live backend, password `Password123!`):

- `superadmin@acme.test` → SUPER_ADMIN
- `hr@acme.test` → HR_ADMIN
- `aman@acme.test` → MANAGER
- `priya@acme.test` → EMPLOYEE

After login, anything that hits a non-auth endpoint will be served by MSW (mock data). Switch `NEXT_PUBLIC_USE_MOCKS=false` to point at the real backend — most endpoints will 404 until the backend dev ships them.

---

## 7. Adding a new feature module

Example: adding the "departments" module.

```bash
mkdir -p src/modules/departments/{components,hooks,services,validations,types,constants,utils}
touch src/modules/departments/index.ts
```

Inside the module:

1. `validations/department.schema.ts` — Zod schemas (this is the contract).
2. `types/department.types.ts` — TypeScript types derived from Zod (`z.infer<>`).
3. `services/departments.api.ts` — axios calls. No business logic.
4. `hooks/useDepartments.ts` — React Query wrappers.
5. `components/DepartmentTree.tsx` etc.
6. `index.ts` — export only the public API.

Then add an MSW handler at `src/mocks/handlers/departments.ts` that matches the API contract you defined in step 1's schema. Add fixture data at `src/mocks/data/departments.ts`.

The page itself lives in `src/app/(dashboard)/departments/page.tsx` and is thin — it imports from the module.

---

## 8. Working with MSW (the part most people get wrong)

**The mock IS the contract.** Treat MSW handlers as the spec your backend dev must implement. Write them as if they were the real API:

```ts
// src/mocks/handlers/employees.ts
import { http, HttpResponse } from 'msw';
import { employees } from '../data/employees';

export const employeesHandlers = [
  http.get('*/employees', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '25');
    const start = (page - 1) * pageSize;
    const slice = employees.slice(start, start + pageSize);

    return HttpResponse.json({
      success: true,
      data: slice,
      meta: { page, pageSize, total: employees.length },
    });
  }),

  http.post('*/employees', async ({ request }) => {
    const body = await request.json();
    // Simulate validation
    if (!body?.email) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required',
            details: [{ field: 'email', message: 'Required' }],
          },
        },
        { status: 422 },
      );
    }
    return HttpResponse.json({ success: true, data: { id: 'new-id', ...body } }, { status: 201 });
  }),
];
```

**Rules:**

- Always return the real envelope shape (`{ success, data, meta }` or `{ success, error }`).
- Always return realistic status codes (201 on create, 422 on validation error, 401 on unauthorized).
- Add a 200–500ms delay to mimic real network latency — UI must show loading states.
- Add at least one fixture that triggers each error state (validation error, empty list, server error).

When the real backend ships an endpoint, just delete its mock handler. The component code doesn't change.

---

## 9. Quality gates

`package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Husky pre-commit (auto-installed by `husky init`):

```bash
# .husky/pre-commit
pnpm lint-staged
```

`package.json` add:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

This forces every commit to pass lint and format on staged files. Don't disable it.

---

## 10. Deployment

- Frontend → **Vercel.** Connect the repo, set env vars in the Vercel dashboard, done.
- Backend → already on Render (separate repo).
- CORS: backend dev needs to whitelist `http://localhost:3000`, the Vercel preview URL pattern (`*.vercel.app`), and the production domain.

---

## 11. Working with Claude Code

Drop `CLAUDE.md` at the repo root. When you start a Claude Code session in this folder, it will read that file first. Patterns:

**Good prompts:**

- "Build the employees list page following CLAUDE.md §16 step 7. Use MSW for data."
- "Refactor `EmployeeTable` and `DepartmentTable` into a `DynamicTable` engine per CLAUDE.md §7."
- "Add a permission gate to the 'Add Employee' button. Required permission: `employees:write`."

**Bad prompts (will produce drift):**

- "Build everything."
- "Make it look nice." (Specify what — design tokens are in `tokens.css`.)
- "Use Redux for state." (Violates §2. Claude will follow CLAUDE.md and push back, but don't.)

If Claude proposes something off-spec, the answer is "no, follow CLAUDE.md." If CLAUDE.md is wrong, update CLAUDE.md first, then ask.

---

## 12. What to NOT do (lessons from this project so far)

- Don't trust "100% complete" or "all endpoints working" claims without checking the source. The backend README's own feature list shows only auth is done.
- Don't ship without testing the multi-tenant boundary. If `x-tenant-key` from user A can read user B's data, you have a data leak. This is the single highest-priority thing to verify before any pilot.
- Don't build all 15 screens for a demo. Five tell the story: Login → HR Dashboard → Employee List → Employee Profile → Leave Approval. The rest can wait.
- Don't keep the "production-ready" framing if it's actually a demo. Pick a mode (demo / pilot / production) and be honest about which one with the team.

---

## 13. Reference docs (from earlier in the project)

If they exist in your folder:

- `WIREFRAMES.pdf` — 15-screen wireframes with annotations.
- `DESIGN_SYSTEM.md` — full design token spec, engine APIs.
- `STITCH_PROMPTS.md` — prompts to generate UI in Stitch (if you go that route).

These should be in a `/docs` folder at the repo root, not in `src/`. Claude Code will find them.
