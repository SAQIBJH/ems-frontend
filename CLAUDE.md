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

### How the frontend reaches the backend — BFF proxy

The browser **never** calls the Render backend directly and **never** sees the
real backend URL. All backend traffic flows through a server-side BFF
(Backend-for-Frontend) layer inside this Next.js app:

```
browser  ──►  Next.js /api/*  (same origin)  ──►  Render backend
                    │
                    └─ BFF route handler hides the backend URL and
                       forwards Authorization header (if present) +
                       cookies unchanged. No tenant key is added —
                       the JWT itself carries the tenant identity.
```

- The browser-side Axios client (`src/lib/api-client.ts`) has `baseURL: "/api"`.
  Every request goes to our own Next.js origin.
- The BFF route handler at `src/app/api/[...path]/route.ts` catches `/api/*`,
  reads `API_BASE_URL` from **server-only** env, forwards the request with the
  browser's cookies and any Authorization header, and relays the response back.
- `API_BASE_URL` is server-only. It must never carry the `NEXT_PUBLIC_` prefix —
  that would inline the backend URL into the browser bundle. Server env is
  validated in `src/lib/env.server.ts` (which imports `server-only`); public env
  stays in `src/lib/env.ts`.
- Auth is **cookie-based** (see §10). The browser's httpOnly `accessToken` and
  `refreshToken` cookies are forwarded by the BFF to the backend automatically.
  There is no `x-tenant-key` — the JWT carries tenant identity.

### What's LIVE on the backend

All of the following are implemented, deployed, and return real data
(verified against the live Render API on 2026-05-25). `docs/API_MAPPING.md`
is the authoritative source for every response shape.

```
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
GET    /api/v1/auth/me
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:id
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-otp       # verify-otp field is "code", NOT "otp"

# Employees (read + write)
GET    /api/v1/employees
GET    /api/v1/employees/:id
POST   /api/v1/employees
PATCH  /api/v1/employees/:id
DELETE /api/v1/employees/:id          # soft-delete — sets employmentStatus=TERMINATED

# Departments (read + write)
GET    /api/v1/departments
POST   /api/v1/departments
PATCH  /api/v1/departments/:id
DELETE /api/v1/departments/:id

# Analytics (HR_ADMIN / SUPER_ADMIN)
GET    /api/v1/analytics/summary
GET    /api/v1/analytics/attendance?range=7d|30d|90d
GET    /api/v1/analytics/headcount-by-department
GET    /api/v1/analytics/recent-activity?limit=N
GET    /api/v1/analytics/leave-summary?range=30d

# Employee self-service
GET    /api/v1/employee/dashboard
GET    /api/v1/employee/team

# Leave
GET    /api/v1/leave/types
GET    /api/v1/leave/balance
GET    /api/v1/leave/requests
POST   /api/v1/leave/requests
POST   /api/v1/leave/requests/:id/approve
POST   /api/v1/leave/requests/:id/reject
POST   /api/v1/leave/requests/:id/withdraw

# Attendance
GET    /api/v1/attendance/today
GET    /api/v1/attendance/records?month=YYYY-MM
GET    /api/v1/attendance/summary
POST   /api/v1/attendance/check-in
POST   /api/v1/attendance/check-out
POST   /api/v1/attendance/regularization
PATCH  /api/v1/attendance/regularization/:id/approve
PATCH  /api/v1/attendance/regularization/:id/deny

# Holidays (read + write)
GET    /api/v1/holidays?year=YYYY
POST   /api/v1/holidays
PATCH  /api/v1/holidays/:id
DELETE /api/v1/holidays/:id

# Manager
GET    /api/v1/manager/dashboard
GET    /api/v1/manager/team
GET    /api/v1/manager/approvals

# Audit logs
GET    /api/v1/audit-logs
GET    /api/v1/admin/logs

# Settings
GET    /api/v1/settings/tenant
PATCH  /api/v1/settings/tenant
GET    /api/v1/settings/roles-permissions
PATCH  /api/v1/settings/roles-permissions

# Email templates
GET    /api/v1/email-templates
PATCH  /api/v1/email-templates/:id

# Reports & export
GET    /api/v1/reports
GET    /api/v1/export

# Notifications (live as of 2026-05-25)
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/:id/read   # POST is a backend alias; prefer PATCH
PATCH  /api/v1/notifications/read-all   # POST is a backend alias; prefer PATCH

# Search (live as of 2026-05-25)
GET    /api/v1/search?q=&type=&page=&limit=
```

### What still needs MSW

The backend team shipped all previously-mocked endpoints as of 2026-05-26.
The following endpoints remain unimplemented on the backend and are still
served by MSW:

**Auth / Holidays (original MSW set):**

- **`POST /auth/otp/initiate`** — MFA challenge initiation
- **`POST /holidays/import`** (+ preview + commit) — `.ics` file import flow

**Phase 2 — Payroll, Reports & Analytics** (see `docs/phase2api.md` Domains 1–6):

- All `/payroll/*` endpoints
- All `/reports/*` endpoints
- `GET /analytics/workforce-trend`, `/analytics/attrition`, `/analytics/payroll-cost`, `/analytics/department-performance`

**Phase 2.5 — Settings: Integrations & Billing** (see `docs/phase2api.md` Domains 7–8):

- `GET /settings/integrations/email`, `PATCH /settings/integrations/email`, `POST /settings/integrations/email/test`
- `GET /settings/integrations/storage`, `PATCH /settings/integrations/storage`, `POST /settings/integrations/storage/test`
- `GET /settings/webhooks`, `POST /settings/webhooks`, `PATCH /settings/webhooks/:id`, `DELETE /settings/webhooks/:id`, `GET /settings/webhooks/:id/deliveries`, `POST /settings/webhooks/:id/test`
- `GET /billing/subscription`, `GET /billing/plans`
- `GET /billing/invoices`

All other requests pass through MSW unmatched → BFF → real Render backend.

### Shape deviations from `BACKEND_API_REQUESTS.md` (do NOT mock these — use live shape)

The backend shipped some endpoints with shapes that differ from what was
documented. Frontend code uses the actual live shapes below:

| Endpoint                                | Documented shape                          | Actual live shape                                                     |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `GET /employees/next-code`              | `data.code`                               | `data.nextCode`                                                       |
| `POST /employees/:id/documents/presign` | `uploadUrl` = S3 presign, `method: "PUT"` | `uploadUrl` = our own Cloudinary multipart endpoint, `method: "POST"` |
| `GET /leave/team/calendar`              | `members[].days[]` per-day status grid    | `members[].leaves[]` range objects                                    |

### MSW discipline (unchanged)

**Use MSW for every endpoint not listed above.** The mock IS the contract — the
frontend defines what it expects, and the backend dev implements to match. When a
real endpoint ships, delete the mock for that endpoint and the rest of the app
keeps working.

Do NOT:

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

### Headers

```
Content-Type:  application/json                   # always
Cookie:        accessToken=...; refreshToken=...  # set by server; browser sends automatically
```

There is **no** `Authorization: Bearer` header — auth is cookie-based (§10).
There is **no** `x-tenant-key` — the JWT carries tenant identity.

### Auth flow

1. `POST /auth/login` with `{ email, password }`. Server sets two httpOnly cookies:
   `accessToken` (15-min TTL) and `refreshToken` (7-day TTL).
   The response body includes `{ accessToken }` — **ignore in browser code**; it is
   present for Postman/Swagger only.
2. Browser sends both cookies automatically on every subsequent request
   (`withCredentials: true` on the Axios instance).
3. The Axios client does **not** attach an `Authorization` header. No token is
   stored or managed client-side.
4. On app boot, `AuthProvider` calls `GET /auth/me`. If 200 → user is signed in
   (React Query cache populated). If 401 → not authenticated.
5. `AuthGuard` (in `(dashboard)/layout.tsx`) redirects to `/login?next=<path>`
   when not authenticated.
6. Axios 401 interceptor: queue the original request → `POST /auth/refresh`
   (refreshToken cookie sent automatically) → server rotates both cookies → drain
   queue (all pending requests retry with the new cookie active) → if refresh fails,
   redirect to `/login?next=<path>`.
7. Refresh tokens **rotate** on each use. Reusing a revoked token revokes the whole
   session.

### Login response shape

`POST /auth/login` → `data` payload:

```json
{
  "accessToken": "<ignore in browser — cookie-based>",
  "sessionId": "string",
  "user": {
    "id": "string",
    "email": "string",
    "memberType": "HR_ADMIN",
    "employeeId": "string | null",
    "employee": { "firstName": "...", "lastName": "...", "designation": "...", "..." } | null
  },
  "permissions": ["employees:read", "employees:write", "..."]
}
```

> `employeeId` and `employee` are **null for SUPER_ADMIN** — they have no employee profile.

### Response envelopes — INCONSISTENT per endpoint

**`docs/API_MAPPING.md` is the authoritative source.** Consult each endpoint's
exact entry before writing its service or hook. Never guess the unwrap path.
Never write a generic unwrap utility.

Key quirks (see the full Quirks Summary table in `API_MAPPING.md`):

| Endpoint                    | List/data lives at                                    |
| --------------------------- | ----------------------------------------------------- |
| `GET /employees`            | `data.data[]` + `data.pagination` — **double-nested** |
| `GET /departments`          | `data[]` — nested tree; each node has `children[]`    |
| `GET /leave/requests`       | `data.requests[]` + `data.pagination`                 |
| `GET /attendance/records`   | `data.records[]` + `data.pagination`                  |
| `GET /audit-logs`           | `data.logs[]` + `data.pagination`                     |
| `GET /leave/balance`        | `data.balances[]`                                     |
| `GET /holidays`             | `data.holidays[]` + `data.total`                      |
| All analytics arrays        | `data[]` directly                                     |
| All single-object responses | `data` object directly                                |

Error envelope (this one IS consistent):

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [{ "field": "email", "message": "already in use" }],
    "requestId": "req-id"
  }
}
```

### Status codes

- `409 Conflict` — duplicate record, circular department reference, or department not empty on delete
- `404 Not Found` — resource does not exist
- `422 Unprocessable Entity` — validation failure; `error.details` is `{ field: string, message: string }[]`

### Field casing — varies by endpoint

Do NOT normalize. Write TypeScript types that match the wire format of each endpoint:

- **`camelCase`:** employees, departments (e.g. `firstName`, `departmentId`, `employmentType`)
- **`snake_case`:** audit-logs, settings/tenant (e.g. `user_email`, `company_name`, `created_at`)

### Roles (from backend) — all live

`SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`, `AUDITOR`

### Enums and date formats

**EmploymentType:** `FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP`
(not `INTERN` — use `INTERNSHIP`)

**Date writes:** All date fields on POST/PATCH endpoints must be written as
**`YYYY-MM-DD`** strings: `"2026-06-15"`. Do **not** send full ISO datetime strings —
`holidayDate` specifically rejects them. The server returns full ISO strings on reads;
convert on write with a helper:

```ts
// lib/date.ts
import { format, parseISO } from 'date-fns';
export const formatDateForApi = (date: Date | string) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd');
```

Use `formatDateForApi(value)` in every service method that sends a date field.
Parse incoming ISO strings from the server with `parseISO` from date-fns.

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
│   │   ├── layout.tsx                # AuthGuard + AppShell
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
│   ├── guards/                       # AuthGuard, PermissionWrapper, RoleGate
│   └── layouts/                      # AppShell, AuthShell, PageHeader
│
├── components/
│   ├── ui/                           # shadcn-generated primitives
│   ├── feedback/                     # Toast, EmptyState, ErrorState, Skeleton
│   ├── data-display/                 # StatsCard, Badge, Avatar
│   └── forms/                        # FormField, FormSection, FormActions
│
├── lib/
│   ├── api-client.ts                 # Axios instance with 401/refresh interceptor
│   ├── permissions.ts                # can(user, permission) pure helper
│   ├── query-client.ts               # TanStack Query config
│   └── env.ts                        # Validated public env (Zod)
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

**Auth is fully cookie-based.** Both `accessToken` and `refreshToken` are `httpOnly`
cookies set by the server. The browser sends them automatically on every request via
`withCredentials: true`. No token is stored or managed client-side.

- The `accessToken` in the login response body is **Postman/Swagger only** — never
  read or store it in browser code.
- The Axios client does **not** attach an `Authorization` header. There is no
  in-memory token store (`lib/auth.ts` does not exist).
- On app boot, `AuthProvider` calls `GET /auth/me`. If 200 → user is signed in and
  the React Query cache is populated. If 401 → not authenticated.
- `AuthGuard` (in `src/shared/guards/AuthGuard.tsx`, used by `(dashboard)/layout.tsx`)
  redirects unauthenticated users to `/login?next=<path>`.
- The Axios 401 interceptor: queues in-flight requests → calls `POST /auth/refresh`
  (cookie sent automatically) → server rotates both cookies → retries all queued
  requests. If refresh fails: redirect to `/login?next=<path>`.
- Wrap permission-sensitive UI with `<PermissionWrapper permission="employees:write">`.
  This is a **UI affordance**, not a security boundary. All real enforcement is
  server-side.
- `can(user, permission)` in `lib/permissions.ts` is the non-JSX equivalent for
  imperative checks.

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

- Don't fabricate API endpoints. All endpoints in `docs/API_MAPPING.md` are real
  (verified 2026-05-22). For any endpoint **not** listed there, use MSW.
- Don't add a "while we wait for the backend, I'll just use localStorage to fake it" path. Use MSW.
- Don't create new top-level folders without updating this file.
- Don't import shadcn components directly into module components without first adding them to `components/ui/` via `npx shadcn add <name>`.
- Don't make every component a client component. Default to RSC.
- Don't put business logic in route handlers. Routes are thin.
- Don't add a `console.log` and leave it. Use `lib/logger.ts`.
- Don't introduce a new state library, UI kit, or styling solution. See §2.
- Don't claim work is complete unless: TypeScript passes, ESLint passes, all four component states are handled, and the screen renders correctly in light and dark mode.
- Don't write a generic API response unwrap utility. Each service method unwraps its own endpoint's specific shape (see §4 Quirks Summary and `docs/API_MAPPING.md`).
- Don't build the departments tree client-side from `parentId`. `GET /departments` returns a nested tree with `children[]` — render what the server returns.

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

> **`BUILD_PLAN.md` is the authoritative step-by-step execution plan and supersedes
> this section.** Follow `BUILD_PLAN.md`. This section exists for context only.

1. **Repo bootstrap.** Next.js 15 + TypeScript + Tailwind v4 + ESLint + Prettier + Husky + Vitest. Verify `pnpm dev` runs.
2. **Tokens + base layout.** `tokens.css`, `AppShell` (sidebar + topbar), `AuthShell`. Just static layout, no data.
3. **shadcn/ui setup.** Install primitives: button, input, label, dialog, dropdown-menu, tabs, table, select, popover, calendar, sheet, toast.
4. **MSW setup.** Install, configure for browser (dev) and Node (tests). Verify a mock endpoint resolves.
5. **API client + auth.** Axios instance, interceptor, cookie-based flow. Login page → real backend → AppShell.
6. **Auth-gated route group.** `(dashboard)/layout.tsx` enforces auth via `AuthGuard`. Add `PermissionWrapper`.
7. **Employees module (canonical).** Build directly: `EmployeesPage`, `EmployeeTable` (TanStack Table), `EmployeeForm` (RHF + Zod), `EmployeeProfile`. All endpoints (read + write) are live.
8. **Departments module.** Tree view. Refactor common bits with Employees into `DynamicTable`. The server returns a nested tree — each node has a `children[]` array. Render what the server returns; do **not** reconstruct the tree client-side from `parentId`.
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

# Public — exposed to the browser. No secrets here.
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`API_BASE_URL` is **server-only** — it must never carry the `NEXT_PUBLIC_` prefix,
which would inline the backend URL into the browser bundle. See §3 "BFF proxy".

There is **no** `TENANT_KEY` — the backend derives the tenant from the JWT, not a
header. Do not add one.

When `NEXT_PUBLIC_USE_MOCKS=true`, MSW intercepts requests to endpoints not yet on
the live backend (see §3 "What still needs MSW"). When `false`, all requests hit
the real backend through the BFF.

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

---

## 21. Wireframe parity is non-negotiable

After the Phase 1 demo, stakeholder feedback was that the UI **must match
`docs/WIREFRAMES.pdf`** at the layout and control level. This supersedes
generic taste calls.

**Rules when building or modifying any screen:**

1. **Open the wireframe page for the screen before you write code.** Identify
   every:
   - Heading, including personalized greeting copy ("Welcome back, Aman", "Hi Priya")
   - Header-bar action button (label, icon, position)
   - Card / section in the order shown
   - Chart type (line vs bar vs donut — chart shape is **part of the spec**, not a free choice)
   - Interactive control on a row (inline Approve/Deny buttons, Verified pill, etc.)
2. **If something is in the wireframe and not yet built, build it. Do not
   silently omit it.** If it cannot be built (e.g. no API), build the
   shell with a loading or mocked state and call out the gap.
3. **If you have a "better" visual idea that diverges from the wireframe,
   ask first.** Do not deviate silently.
4. **Build order within a screen:** match wireframe top-to-bottom, left-to-right.
   That includes the order in which cards appear in a dashboard grid.
5. **Field-level diff:** when picking up any wireframe-parity step in
   `BUILD_PLAN.md`, the step lists the exact controls and copy expected.
   Treat that list as the acceptance criteria.

**What's still flexible (taste):**

- Visual identity (color, typography, density, spacing, motion) follows §20.
- Component-level micro-interactions (focus rings, hover states, transitions).
- Anything not pictured in the wireframe.

---

## 22. Adding new backend endpoints (frontend-first)

The backend ships behind the frontend in many cases. To stay unblocked
without painting ourselves into a corner:

1. **Define the endpoint in `docs/BACKEND_API_REQUESTS.md` first.** Include:
   method, path, role, request body, success response shape, error codes,
   why we need it (which screen).
2. **Implement the MSW handler in `src/mocks/handlers/<domain>.ts` to return
   exactly that shape.** No deviations.
3. **Define the TypeScript types in `modules/<x>/types/*.ts` to mirror the
   shape.** When the backend ships, types stay; we only flip the MSW
   intercept off.
4. **Service methods unwrap the documented shape** — same discipline as §4.
5. **When the backend confirms the endpoint is live**, delete the MSW
   handler for that path and remove the row from `BACKEND_API_REQUESTS.md`
   (or move to a "shipped" archive section). The endpoint then belongs in
   `API_MAPPING.md` going forward.

This is how `CLAUDE.md §3` already handles the live-vs-mocked split — this
section just formalizes the workflow for net-new endpoints driven from the
frontend side.

---

## 23. Phase 2 modules — Payroll, Reports, Analytics

> Read this section before working on any Phase 2 step.

### New routes (AppShell sidebar)

Phase 2 adds three top-level routes. Add them to `NAV_ITEMS` in
`src/shared/layouts/AppShell.tsx` in Step 55 and do not remove them:

```ts
{ label: 'Payroll',   href: '/payroll',   icon: DollarSign  }
{ label: 'Reports',   href: '/reports',   icon: BarChart2   }
{ label: 'Analytics', href: '/analytics', icon: TrendingUp  }
```

Insert them **between Holidays and Permissions** in the nav list.

### New settings group — Pay & Compliance

Settings left nav gains a fourth group. Insert it between "People" and
"Security" in `SettingsNav`:

```
PAY & COMPLIANCE
  Salary Components     /settings/pay/components
  Pay Groups            /settings/pay/groups
  Pay Schedules         /settings/pay/schedules
```

All three panels are HR_ADMIN / SUPER_ADMIN only.

### Payroll module — global-first design

The payroll module is the primary Phase 2 differentiator. The core design
principle: **no hardcoded country rules**. Everything is configuration.

**Salary Components** (`SalaryComponent`) are tenant-defined building blocks:

- `type`: EARNING | DEDUCTION | BENEFIT | REIMBURSEMENT
- `calculationType`: FLAT | PERCENTAGE | FORMULA
- A formula can reference any other component by its `code` (e.g. `BASIC * 0.4`).
- Calculation order is resolved by dependency graph (topological sort); cycles
  are rejected by the API.

**Pay Groups** (`PayGroup`) bundle components into a named template:

- Assigned to employees as their baseline compensation structure.
- Group-level overrides allow tweaking a single component for all members.

**Employee Salary Config** (`EmployeeSalary`) links an employee to a pay group:

- Stores `annualCtc` — the formula engine derives all component amounts.
- Salary changes create new history records — never edit in place.

**Payroll Runs** (`PayrollRun`) are period-level processing records:

- Status machine: DRAFT → CALCULATING → REVIEW → APPROVED → PAID.
- HR adjusts individual payslips (one-time bonuses/deductions) before approving.

**Client-side formula preview** (in Salary Components CRUD):

- Use the `expr-eval` npm package (safe, no `eval()`, 5 kB gzipped) for
  in-browser formula evaluation.
- Show a live preview table as HR types a formula: sample CTC of 1,200,000
  with all existing component values pre-filled.
- Validate formula syntax on blur; show inline error if invalid.

### Reports module — on-demand computation

All report endpoints are computed server-side on request. The frontend:

- Passes filter params (date range, department, etc.) via query string.
- Receives `{ meta, summary, chartData, tableData }` per endpoint.
- Renders chart from `chartData` using `ChartEngine` wrappers.
- Renders table from `tableData` using `DynamicTable`.
- Export button calls `POST /reports/export` and triggers a browser CSV download.

### Analytics module — dedicated page

`/analytics` is a full-screen analytics dashboard separate from the
dashboard widgets. It uses the existing live analytics endpoints plus four
new MSW-backed ones (see `docs/phase2api.md` §5).

### API spec source of truth

`docs/phase2api.md` is the authoritative spec for all Phase 2 endpoints.
All MSW handlers must match it exactly. All TypeScript types must mirror it.

### Formula evaluator — install once

In Step 55, add to `package.json`:

```
pnpm add expr-eval
```

`expr-eval` is the **only** new dependency permitted for Phase 2. Do not add
chart libs, state libs, or UI kits. `ChartEngine` already wraps Recharts for
all chart types needed (AreaChart, BarChart, DonutChart, LineChart).

### Employee profile — Compensation tab (added in Step 58)

A new "Compensation" tab is added to `EmployeeProfile.tsx` between "Job" and
"Documents". It is visible to HR_ADMIN and SUPER_ADMIN only. Shows:

- Assigned pay group + CTC
- Live formula-evaluated component breakdown (client-side)
- Salary history timeline

---

## 24. Phase 2.5 — Settings: Integrations & Billing

> Read this section before working on Steps 68–72.

These steps replace `Phase2Panel` placeholders in the Settings section with
fully functional screens. All endpoints are MSW-backed — no backend exists yet.
The API contract is in `docs/phase2api.md` Domains 7 and 8.

### Screens being built

| Step | Route                            | Screen              | Role        |
| ---- | -------------------------------- | ------------------- | ----------- |
| 68   | `/settings/integration-email`    | Email Integration   | SUPER_ADMIN |
| 69   | `/settings/integration-storage`  | Storage Integration | SUPER_ADMIN |
| 70   | `/settings/integration-webhooks` | Webhooks            | SUPER_ADMIN |
| 71   | `/settings/billing-plan`         | Plan & Subscription | SUPER_ADMIN |
| 72   | `/settings/billing-invoices`     | Invoices            | SUPER_ADMIN |

### MSW handler files

- `src/mocks/handlers/settings-integrations.ts` — email, storage, webhooks (Steps 68–70)
- `src/mocks/handlers/billing.ts` — subscription, plans, invoices (Steps 71–72)

Both must be registered in `src/mocks/handlers/index.ts`.

### Settings Nav

After each step, remove `phase2: true` from the corresponding item in
`src/modules/settings/components/SettingsNav.tsx`. The "P2" badge on a nav item
signals an unbuilt placeholder — once the screen is functional, the badge must go.

### No new top-level routes

These are settings sub-routes. No changes to `AppShell.tsx` NAV_ITEMS.

### No new dependencies

All functionality is built with existing dependencies. CSV export is done
client-side with `Blob` + `URL.createObjectURL`. No PDF generation — the
invoice download link opens a server-provided URL in a new tab.

### Billing actions are read-only

Upgrade/manage-seats/contact-sales actions show an info toast:
`"Contact your account manager to change your plan."` — no actual billing
integration is wired up. These screens are information dashboards only.

---

## 25. Phase 3 — Cosmetic UI Alignment + New Screens

> Read this section before working on Steps 73–99.

### Purpose

Steps 73–99 align the running application to the pixel-level design system
documented in `docs/EMS_UI_KIT.md`. That file is the **authoritative visual
spec** for Phase 3. Read the relevant section of `EMS_UI_KIT.md` at the start
of every Phase 3 step — it supersedes generic taste calls and the older
`docs/DESIGN_SYSTEM.md` wherever they conflict.

### Visual spec source of truth

```
docs/EMS_UI_KIT.md          ← primary reference for all Phase 3 work
docs/ems-design-system/     ← click-through HTML prototype (open index.html in browser)
```

Open `docs/ems-design-system/project/ui_kits/ems-app/index.html` in a browser
before implementing any screen. The running prototype is the ground truth for
spacing, colour, and interaction behaviour.

### Charts — Recharts styled to design tokens

Phase 3 keeps Recharts for all data charts. Style them to match the design
system tokens — do **not** replace with CSS placeholders:

- Bar fills: `var(--brand-500)` (primary series), then `--chart-2` through `--chart-8` for multi-series.
- No grid lines on bar charts. Y-axis ticks only; x-axis labels only.
- Custom `<Tooltip>` with `bg-surface border-subtle shadow-md` card style, `text-body-sm` font.
- Axis labels: `font-sans text-xs text-tertiary`.
- DonutChart: Recharts `PieChart` + `Pie` with `innerRadius` 60%, dept/leave-type colors from token vars.
- Remove all default Recharts borders and cartesian grid from dashboard widgets.

### New top-level routes (Steps 93–96)

Add these routes to `AppShell.tsx` NAV_ITEMS in **Step 97** (not before):

```ts
// Phase 2 section — insert between Holidays and Permissions
{ key: 'payroll',       label: 'Payroll',       icon: DollarSign  }
{ key: 'recruitment',   label: 'Recruitment',   icon: UserPlus    }
{ key: 'performance',   label: 'Performance',   icon: Target      }
{ key: 'assets',        label: 'Assets',        icon: Box         }
{ key: 'reports',       label: 'Reports',       icon: BarChart2   }
{ key: 'announcements', label: 'Announcements', icon: Megaphone   }
```

Do **not** add these items until Step 97 — the routes must exist first.

### New module anatomy (Steps 93–96)

Each new module follows the standard layout from §6:

```
src/modules/recruitment/
  components/   hooks/   services/   types/   constants/   index.ts

src/modules/performance/
  components/   hooks/   services/   types/   constants/   index.ts

src/modules/assets/
  components/   hooks/   services/   types/   constants/   index.ts

src/modules/announcements/
  components/   hooks/   services/   types/   constants/   index.ts
```

### MSW handlers for new modules

| Module        | Handler file                          |
| ------------- | ------------------------------------- |
| Recruitment   | `src/mocks/handlers/recruitment.ts`   |
| Performance   | `src/mocks/handlers/performance.ts`   |
| Assets        | `src/mocks/handlers/assets.ts`        |
| Announcements | `src/mocks/handlers/announcements.ts` |

All four must be registered in `src/mocks/handlers/index.ts`.
All MSW shapes must match `docs/phase3api.md` exactly.

### Cosmetic rules for Phase 3

1. **No raw hex values** in any JSX or CSS. Use CSS vars from `tokens.css`.
2. **`color-mix(in oklab, {var} 14%, transparent)`** for soft tint backgrounds
   on chips, role cards, dept badges. This is the universal tint formula.
3. **`font-variant-numeric: tabular-nums`** on all numeric cells in tables
   and all clock/financial displays.
4. **JetBrains Mono** for: employee codes, leave reference numbers, attendance
   reference numbers, payslip IDs, audit timestamps, financial values in payroll
   tables, the check-in clock display.
5. **Status dots** (6px, `border-radius: 9999px`, `background: currentColor`) on
   every Badge that represents a live/pending/rejected entity status.
6. **`backdrop-filter: blur(8px)`** on: AppShell topbar, PageHeader, any
   sticky surface that scrolls over content.
7. **Transition all colour/bg changes at `120ms`** and layout changes at `180ms`.
   Use the `--ease-out` and `--ease-in-out` motion tokens.
8. **Avoid `transition-all`** — be explicit: `transition: background-color 120ms, border-color 120ms, color 120ms`.

---

## 26. Phase 3 — New Screen Inventory

> These four screens exist in the click-through prototype but are not yet in
> the running app. Steps 93–96 build them with MSW data.

| Step | Route            | Screen        | Tabs                             | Role access           |
| ---- | ---------------- | ------------- | -------------------------------- | --------------------- |
| 93   | `/recruitment`   | Recruitment   | Pipeline / Openings / Candidates | HR_ADMIN, SUPER_ADMIN |
| 94   | `/performance`   | Performance   | Reviews / Goals / Calibration    | HR_ADMIN, SUPER_ADMIN |
| 95   | `/assets`        | Assets        | Inventory / Assigned / Requests  | HR_ADMIN, SUPER_ADMIN |
| 96   | `/announcements` | Announcements | Feed + Channels sidebar          | All roles             |

### Shared design pattern for new screens

All four screens follow the same structure:

```tsx
<PageHeader
  title="Screen Name"
  description="One sentence."
  breadcrumbs={[{ label: 'Screen Name' }]}
  actions={<PrimaryActionButton />}
/>
<div className="p-6 flex flex-col gap-6">
  {/* 4× StatsCards grid */}
  {/* Tab strip */}
  {/* Tab content */}
</div>
```

- 4 StatsCards above the tab strip (matches UI kit layout exactly).
- Each tab uses `DynamicTable` where the content is tabular; custom layout
  where it isn't (kanban board, calibration distribution, announcements feed).
- Loading state: Skeleton rows matching the table/card shape.
- Empty state: domain-appropriate illustration + description + primary CTA.
- Error state: `ErrorState` with retry.

### Recruitment — kanban specifics

The pipeline board is **not** `DynamicTable`. It is a custom CSS Grid:

```css
display: grid;
grid-template-columns: repeat(5, minmax(200px, 1fr));
gap: 12px;
align-items: start;
```

Each column header shows: stage dot (stage color) + stage name uppercase + count (mono).
Each candidate card shows: Avatar sm + name + role + star rating (5 × Star icons,
filled = warning-500, empty = border-strong) + days-in-stage + req tag pill.

### Performance — rating scale

| Rating     | Color                |
| ---------- | -------------------- |
| Exceeds    | `--success-500`      |
| Strong     | `--dept-engineering` |
| Meets      | `--info-500`         |
| Developing | `--warning-500`      |
| Below      | `--danger-500`       |

### Assets — type glyph icons

| Type    | Lucide icon  |
| ------- | ------------ |
| Laptop  | `Laptop`     |
| Monitor | `Monitor`    |
| Phone   | `Smartphone` |
| Other   | `Box`        |

Render each glyph in a 30×30 `bg-surface-2 rounded-md` chip with `text-secondary`.

### Announcements — card design

Each announcement card has:

- `border-left: 3px solid {category color}` (the only decoration — no card shadow).
- Category chip: uppercase 11px tracking-wide with color dot.
- "Pinned" label (Pin icon + text) when `pinned: true`.
- Author row: Avatar sm + name + role (if pinned), audience count, read count.
- Body text: max-width `68ch`, `text-pretty`.
