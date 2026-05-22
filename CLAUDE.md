# CLAUDE.md

> **For Claude (and any AI coding assistant) working in this repository.**
> Read this file end-to-end before writing any code. Do not skip sections.

---

## 1. What this project is

This is the **frontend** of an Employee Management System (EMS) — a B2B SaaS used by HR teams, managers, and employees inside a company. The backend lives in a **separate repository** owned by another developer.

The product covers (Phase 1):

- Authentication, sessions, RBAC
- Employee directory, profile, create/edit
- Departments (org tree)
- Attendance (records, regularization)
- Leave (requests, approvals, balances)
- Holidays
- Roles & permissions matrix
- Settings

Phase 2 (deferred, but the architecture must not block it): Payroll, Recruitment, Performance, Asset Management.

The primary near-term goal is a **working demo** that can be shown to stakeholders. Architecture should not block the production version that follows.

---

## 2. Tech stack — LOCKED. Do not substitute without asking.

| Concern              | Choice                                      |
| -------------------- | ------------------------------------------- |
| Framework            | Next.js 15 (App Router)                     |
| Language             | TypeScript (strict)                         |
| Styling              | Tailwind CSS v4 + CSS variables             |
| Component primitives | shadcn/ui (Radix under the hood)            |
| Server state         | TanStack Query v5                           |
| Client state         | Zustand (only where truly client-only)      |
| Forms                | React Hook Form + Zod resolver              |
| Tables               | TanStack Table v8 (headless)                |
| Charts               | Recharts                                    |
| Icons                | Lucide React                                |
| HTTP client          | Axios (with interceptors)                   |
| Date/time            | date-fns + date-fns-tz                      |
| Mocking              | MSW (Mock Service Worker)                   |
| Linting              | ESLint flat config + Prettier               |
| Testing              | Vitest + React Testing Library + Playwright |

**Forbidden without explicit approval:**

- Redux, Recoil, Jotai (use Zustand)
- styled-components, Emotion, CSS-in-JS (use Tailwind + CSS variables)
- Material UI, Chakra, Ant Design (use shadcn/ui)
- moment.js (use date-fns)
- Any UI kit not on this list

---

## 3. Backend reality — read carefully

This frontend talks to a backend that is **partially built**. Status as of repo creation:

### How the frontend reaches the backend — BFF proxy

The browser **never** calls the Render backend directly and **never** sees the
tenant key or the real backend URL. All backend traffic flows through a
server-side BFF (Backend-for-Frontend) layer inside this Next.js app:

```
browser  ──►  Next.js /api/*  (same origin)  ──►  Render backend
                    │                                   ▲
                    └─ BFF route handler attaches ───────┘
                       x-tenant-key here, server-side
```

- The browser-side Axios client (`src/lib/api-client.ts`) has `baseURL: "/api"`.
  Every request goes to our own Next.js origin.
- The BFF route handler at `src/app/api/[...path]/route.ts` catches `/api/*`,
  reads `API_BASE_URL` and `TENANT_KEY` from **server-only** env, attaches the
  `x-tenant-key` header, forwards the request, and relays the response back.
- `API_BASE_URL` and `TENANT_KEY` are server-only. They are **not** prefixed
  `NEXT_PUBLIC_` and must never be — that would inline them into the browser
  bundle and leak the tenant key. Server env is validated in `src/lib/env.server.ts`
  (which imports `server-only`); public env stays in `src/lib/env.ts`.
- The `Authorization` bearer token still lives client-side and is passed
  through the BFF unchanged — that is correct and intended.

### What's REAL on the backend

Only the auth surface is implemented and deployed. These are the only endpoints that exist:

```
POST   /api/v1/auth/login
POST   /api/v1/auth/admin/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
GET    /api/v1/auth/me
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:id
```

### What's NOT YET built on the backend

Everything else. Employees, departments, attendance, leave, holidays, permissions, settings — none of these endpoints exist yet on the live API. Calling them will return 404.

### How we deal with this

**Use MSW (Mock Service Worker) for every non-auth API call.** The mock IS the contract — the frontend defines what it expects, and the backend dev implements to match. When a real endpoint ships, we delete the mock for that endpoint and the rest of the app keeps working.

This is non-negotiable. Do NOT:

- Hardcode JSON inside components.
- `import data from './employees.json'` at the call site.
- Bypass the React Query layer with mocks.

DO:

- Define the endpoint in `src/mocks/handlers/*.ts` exactly as the future real API will look.
- Call it through the real API client and React Query.
- The component code is identical whether the mock or the real API serves the response.

---

## 4. Backend contract

### Base URL

The browser always calls our **own origin** at `/api/*`. It never addresses the
backend directly.

- Browser → `/api/*` (same origin as the app).
- BFF → backend:
  - Production: `https://employee-management-system-2b9q.onrender.com/api/v1`
  - Local backend (when running): `http://localhost:3000/api/v1`
- The backend base URL is the **server-only** `API_BASE_URL` env var (no
  `NEXT_PUBLIC_` prefix). See §3 "BFF proxy".

### Required headers on every request

```
x-tenant-key:   attached server-side by the BFF (TENANT_KEY env). Never set on the client.
Authorization:  Bearer <access token>      # client-side; passed through the BFF. Except /auth/login.
Content-Type:   application/json
```

The browser-side Axios client only sets `Authorization` and `Content-Type`.
`x-tenant-key` is added by the BFF route handler so the tenant key never
reaches the browser.

### Auth flow

1. `POST /auth/login` with `{ email, password }`. Server returns `{ accessToken }` and sets a refresh token in an `HttpOnly Secure SameSite=Strict` cookie.
2. Access token TTL: **15 minutes**. Refresh token TTL: **7 days**.
3. Axios interceptor on 401 → calls `POST /auth/refresh` (cookie is sent automatically) → retries the original request once with the new access token.
4. If refresh fails: clear state, redirect to `/login?next=<current path>`.
5. `GET /auth/me` returns the current user + their permissions. Frontend calls this on mount and caches via React Query.
6. Refresh tokens **rotate** on each use — old one is invalidated. Reuse of a revoked token revokes the whole session.

### Response envelope (success)

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 25, "total": 142 }
}
```

### Response envelope (error)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "requestId": "req-id"
  }
}
```

### Roles (from backend)

`SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`. Future role: `AUDITOR`.

### Seed test users (against live backend)

### Seed test users (against live backend)

Password for all: `Password123!`

- `superadmin@acme.test` — SUPER_ADMIN
- `hr@acme.test` — HR_ADMIN
- `aman@acme.test` — MANAGER
- `priya@acme.test` — EMPLOYEE

Alternate HR Admin account (different password): `admin@testorg.com` / `password123`

---

## 5. Repository layout

```
src/
├── app/                              # App Router routes — keep thin
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── otp-verification/page.tsx
│   │   └── layout.tsx                # AuthShell
│   ├── (dashboard)/
│   │   ├── layout.tsx                # AppShell + auth guard
│   │   ├── dashboard/page.tsx
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── departments/page.tsx
│   │   ├── attendance/
│   │   │   ├── page.tsx
│   │   │   └── leave/page.tsx
│   │   ├── holidays/page.tsx
│   │   ├── permissions/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx                    # Root: providers
│   ├── error.tsx
│   └── not-found.tsx
│
├── modules/                          # Feature domains. Each is self-contained.
│   ├── auth/
│   ├── dashboard/
│   ├── employees/
│   ├── departments/
│   ├── attendance/
│   ├── leave/
│   ├── holidays/
│   └── permissions/
│
├── shared/
│   ├── engines/                      # Build these BEFORE feature screens
│   │   ├── DynamicTable/
│   │   ├── DynamicForm/
│   │   ├── FilterEngine/
│   │   ├── ModalEngine/
│   │   ├── DrawerEngine/
│   │   └── ChartEngine/
│   ├── guards/                       # PermissionWrapper, RoleGate
│   └── layouts/                      # AppShell, AuthShell, PageHeader
│
├── components/
│   ├── ui/                           # shadcn-generated primitives
│   ├── feedback/                     # Toast, EmptyState, ErrorState, Skeleton
│   ├── data-display/                 # StatsCard, Badge, Avatar
│   └── forms/                        # FormField, FormSection, FormActions
│
├── lib/
│   ├── api-client.ts                 # Axios instance with auth interceptor
│   ├── auth.ts                       # Token storage, refresh logic
│   ├── permissions.ts                # can(user, action, resource)
│   ├── query-client.ts               # TanStack Query config
│   └── env.ts                        # Validated env (Zod)
│
├── providers/                        # ThemeProvider, QueryProvider, AuthProvider
├── hooks/                            # Cross-cutting: useDebounce, useMediaQuery
├── store/                            # Zustand slices (sparingly used)
├── styles/
│   ├── globals.css
│   └── tokens.css                    # CSS variables
├── types/                            # App-wide ambient types
└── mocks/                            # MSW
    ├── browser.ts
    ├── server.ts
    ├── handlers/
    │   ├── auth.ts                   # (passthrough — real backend handles)
    │   ├── employees.ts
    │   ├── departments.ts
    │   ├── attendance.ts
    │   ├── leave.ts
    │   ├── holidays.ts
    │   └── permissions.ts
    └── data/                         # Static fixture data
        ├── employees.ts
        ├── departments.ts
        └── ...
```

---

## 6. Module anatomy (every module MUST follow)

```
modules/<name>/
├── components/                       # Module-scoped components
├── hooks/                            # useThings, useThing, useThingMutation
├── services/                         # axios calls — pure I/O, no business logic
├── validations/                      # Zod schemas
├── types/                            # TypeScript types
├── constants/                        # Enums, badge colors, etc.
├── utils/                            # Pure helpers
└── index.ts                          # Barrel — module's PUBLIC API
```

**Rules:**

- Other modules import only from `modules/<x>` (which resolves to `index.ts`). Reaching into internals is **forbidden** and enforced via ESLint `no-restricted-imports`.
- A module's `index.ts` exports what is intentionally public. Everything else is private.
- Modules may not have circular imports. Shared cross-cutting code goes in `shared/`.

---

## 7. Engine-first discipline

The spec calls for configuration-driven UI. Interpret that as: **build engines before screen #5, not before screen #1**. Premature engines lock in the wrong abstraction.

Build sequence:

1. Auth flow + AppShell layout.
2. One feature module end-to-end (Employees). Build its table and form **directly** with TanStack Table and React Hook Form.
3. Departments module. Notice the duplication. Refactor pieces into `DynamicTable` and `DynamicForm` engines in `shared/engines/`.
4. Every subsequent module uses the engines.

A `DynamicTable` accepts a column config and a data array. A `DynamicForm` accepts a Zod schema and a field config array. Permission gating is a prop on every interactive element.

---

## 8. Rendering strategy

- **RSC (React Server Components) by default** for static and read-mostly pages.
- **Client components** for: forms, interactive tables, real-time widgets, anything using state.
- **Never** make a whole page a client component when only one widget needs to be interactive. Wrap just that widget.
- Use `<Suspense>` boundaries around server-fetched widgets so slow queries don't block fast ones.

| Screen                       | Render type                        |
| ---------------------------- | ---------------------------------- |
| Login, forgot, OTP           | RSC (form is client component)     |
| Dashboard initial load       | RSC + streamed Suspense per widget |
| Employee list (with filters) | Client component                   |
| Employee profile (read view) | RSC                                |
| Employee edit form           | Client component                   |
| Attendance grid              | Client component (interactive)     |
| Holiday calendar (read view) | RSC                                |
| Settings forms               | Client component                   |
| Permissions matrix           | Client component                   |

---

## 9. State management — pick the right tier

| Kind of state                   | Tool                                                  |
| ------------------------------- | ----------------------------------------------------- |
| Server state                    | TanStack Query. The cache is the source of truth.     |
| URL state (filters, page, sort) | Search params via `nuqs`                              |
| Local UI state                  | `useState` / `useReducer`                             |
| Cross-component client state    | Zustand (sidebar collapsed, theme, multi-step wizard) |

**Never** copy server data into Zustand. **Never** put a form's draft into Zustand — use RHF.

---

## 10. Auth & permissions

- Access token lives in **memory only** (no localStorage). Refresh token lives in `HttpOnly` cookie set by the server.
- On app boot, attempt `GET /auth/me` — if 200, user is signed in. If 401, redirect to `/login`.
- The Axios instance has one interceptor:
  - On request: attach `x-tenant-key` and `Authorization: Bearer <token>`.
  - On 401: queue the request, call `/auth/refresh`, retry on success, redirect on fail.
- Wrap permission-sensitive UI with `<PermissionWrapper permission="employees:write">`. This is a **UI affordance**, not a security boundary. All real checks happen server-side.

---

## 11. Form conventions

- React Hook Form + `zodResolver`.
- Schemas live in `modules/<name>/validations/*.schema.ts`.
- On 422 from the server: map `error.details[]` → `form.setError(field, { message })`.
- Submit button shows a spinner while pending; disabled while pending; debounced against double-clicks.

```ts
const form = useForm<EmployeeInput>({
  resolver: zodResolver(employeeCreateSchema),
  defaultValues: { ... },
});

const mutation = useMutation({
  mutationFn: employeesApi.create,
  onError: (err) => {
    if (err.status === 422) {
      err.details.forEach(({ field, message }) => form.setError(field, { message }));
    } else {
      toast.error(err.message);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success('Employee created');
    router.push('/employees');
  },
});
```

---

## 12. Design tokens (must be used)

All defined in `src/styles/tokens.css`. Components consume them via Tailwind theme bindings. **No raw hex codes in JSX.**

Categories:

- Color: surfaces, borders, text, brand, semantic (success/warn/danger/info)
- Typography: display, h1–h3, body, body-sm, caption, overline
- Spacing: 0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- Radius: sm (4), md (8), lg (12), xl (16), full
- Shadows: xs, sm, md, lg, focus
- Motion: dur-fast (120), dur-base (180), dur-slow (280)

Full token file: see `src/styles/tokens.css`. Reference in Tailwind: `bg-surface`, `text-primary`, `border-subtle`, etc.

---

## 13. Component contracts

Every component MUST handle four states: **loading, empty, error, success**.

- Loading: skeleton matching the shape of the content (not a generic spinner).
- Empty: `<EmptyState title="..." description="..." action={...} />`.
- Error: `<ErrorState message="..." onRetry={...} />`.
- Success: the actual content.

A component that handles only the success path is **not done**.

---

## 14. What NOT to do

- Don't fabricate API endpoints. Only the auth endpoints listed in §4 are real. Everything else MUST go through MSW.
- Don't add a "while we wait for the backend, I'll just use localStorage to fake it" path. Use MSW.
- Don't create new top-level folders without updating this file.
- Don't import shadcn components directly into module components without first adding them to `components/ui/` via `npx shadcn add <name>`.
- Don't make every component a client component. Default to RSC.
- Don't put business logic in route handlers. Routes are thin.
- Don't add a `console.log` and leave it. Use `lib/logger.ts`.
- Don't introduce a new state library, UI kit, or styling solution. See §2.
- Don't claim work is complete unless: TypeScript passes, ESLint passes, all four component states are handled, and the screen renders correctly in light and dark mode.

---

## 15. Definition of done (per screen)

- [ ] Renders correctly at 1280, 1440, 1920 px widths.
- [ ] Renders acceptably at 768 px (tablet).
- [ ] Light and dark mode both verified.
- [ ] Keyboard navigable.
- [ ] Loading, empty, error, success states all implemented.
- [ ] Permission gates on sensitive actions.
- [ ] Handles 401, 403, 404, 422, 500 from the API.
- [ ] No console errors or React warnings.
- [ ] TypeScript `strict` clean, no `any`.
- [ ] ESLint clean.

---

## 16. Build order for the demo

Follow this sequence. Do not skip ahead.

1. **Repo bootstrap.** Next.js 15 + TypeScript + Tailwind v4 + ESLint + Prettier + Husky + Vitest. Verify `pnpm dev` runs.
2. **Tokens + base layout.** `tokens.css`, `AppShell` (sidebar + topbar), `AuthShell`. Just static layout, no data.
3. **shadcn/ui setup.** Install primitives: button, input, label, dialog, dropdown-menu, tabs, table, select, popover, calendar, sheet, toast.
4. **MSW setup.** Install, configure for browser (dev) and Node (tests). Verify a mock endpoint resolves.
5. **API client + auth.** Axios instance, interceptor, token storage, refresh flow. Login page → real backend → AppShell.
6. **Auth-gated route group.** `(dashboard)/layout.tsx` enforces auth via `useAuth()`. Add `PermissionWrapper`.
7. **Employees module (canonical).** Build directly: `EmployeesPage`, `EmployeeTable` (TanStack Table), `EmployeeForm` (RHF + Zod), `EmployeeProfile`. MSW serves the data.
8. **Departments module.** Tree view. Refactor common bits with Employees into `DynamicTable`.
9. **Attendance module.** Calendar grid + summary. Add `FilterEngine` while you're at it.
10. **Leave module.** Approvals table. `DynamicTable` should now cover everything.
11. **Holidays module.** Year grid.
12. **Permissions matrix.** Custom component, not a generic engine.
13. **Settings (Company Profile).** Two-pane layout.
14. **Dashboards.** HR, Manager, Employee. Reuse `StatsCard`, `ChartEngine`.
15. **Polish.** Empty states, error states, loading skeletons, dark mode pass.

---

## 17. Environment variables

`.env.local` (gitignored):

```
# Server-only — NEVER prefixed NEXT_PUBLIC_, never sent to the browser.
# Read only by the BFF proxy (src/app/api/[...path]/route.ts).
API_BASE_URL=https://employee-management-system-2b9q.onrender.com/api/v1
TENANT_KEY=<obtained from backend dev>

# Public — exposed to the browser. No secrets here.
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`API_BASE_URL` and `TENANT_KEY` are **server-only**. They must never carry the
`NEXT_PUBLIC_` prefix — that would inline them into the browser bundle and leak
the tenant key. See §3 "BFF proxy".

When `NEXT_PUBLIC_USE_MOCKS=true`, MSW intercepts non-auth requests. When `false`, requests hit the real backend through the BFF (and most will 404 until those endpoints are built).

Env is validated at boot with Zod, split into two files: server vars in
`lib/env.server.ts` (imports `server-only`, so a client import is a build
error) and public vars in `lib/env.ts`. If a required var is missing, the app
fails fast.

---

## 18. Commands

```bash
pnpm install
pnpm dev                  # next dev with MSW
pnpm build                # next build
pnpm start                # next start
pnpm lint
pnpm typecheck
pnpm test                 # vitest
pnpm test:e2e             # playwright
pnpm shadcn add <name>    # add a shadcn primitive
```

---

## 19. When in doubt

- Read this file before asking the user.
- If something in this file conflicts with what you think is best practice, follow this file and flag the conflict to the user. Do not silently deviate.
- If something is unspecified, ask. Do not invent.
- If the user requests something that violates §2 (locked stack) or §4 (backend contract), confirm before doing it.

---

## 20. Visual reference

The product should feel like Linear, Vercel dashboard, or Stripe dashboard. Confident, dense, calm. Not Bootstrap admin templates. Not gradient-heavy SaaS landing pages. Enterprise tooling, not consumer.
