# EMS — Employee Management System (Frontend)

The frontend of a B2B SaaS Employee Management System for HR teams, managers, and
employees. Built with **Next.js 15 (App Router)** and TypeScript. The backend lives
in a separate repository; the browser never calls it directly — all traffic flows
through a server-side **BFF proxy** in this app (`/api/*`).

> **Architecture & conventions are defined in [`CLAUDE.md`](./CLAUDE.md).** Read it
> before contributing — it is the source of truth for the stack, module structure,
> API contracts, and the "definition of done". This README only covers getting the
> app running locally.

---

## Tech stack (locked)

Next.js 15 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · TanStack Query v5 ·
Zustand · React Hook Form + Zod · TanStack Table v8 · Recharts · Axios · date-fns ·
MSW · Vitest + Playwright. See `CLAUDE.md §2` for the full list and what's forbidden.

---

## Prerequisites

- **Node.js ≥ 20** (22 LTS recommended — pinned in `.nvmrc`). The only hard
  prerequisite.
- **Git**.
- **pnpm** — you do **not** install this manually. The exact version is pinned in
  `package.json` (`packageManager` field) and activated via **Corepack** (bundled
  with Node 20+). The setup script handles it.

---

## Quick start

```bash
git clone <repo-url> ems-frontend
cd ems-frontend
node scripts/setup.mjs   # checks Node, enables Corepack/pnpm, creates .env.local, installs deps
pnpm dev                 # → http://localhost:3000
```

`node scripts/setup.mjs` is cross-platform (Windows / macOS / Linux) and idempotent —
safe to re-run. It never overwrites an existing `.env.local`.

### Manual setup (if you prefer)

```bash
corepack enable          # makes the pinned pnpm available (no global install)
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

---

## Environment variables

Copy `.env.example` → `.env.local` (the setup script does this). Variables:

| Variable                | Scope           | Purpose                                                                                                                             |
| ----------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `API_BASE_URL`          | **server-only** | Real backend base URL. Read **only** by the BFF route handler — never sent to the browser. Must **not** be prefixed `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_USE_MOCKS` | public          | `true` → MSW intercepts not-yet-live endpoints; `false` → everything hits the live backend through the BFF.                         |
| `NEXT_PUBLIC_APP_URL`   | public          | The app's own origin (e.g. `http://localhost:3000`).                                                                                |

The committed `.env.example` defaults `API_BASE_URL` to the deployed Render backend
with `NEXT_PUBLIC_USE_MOCKS=false`, so a fresh clone talks to the **live** API out of
the box. Set `NEXT_PUBLIC_USE_MOCKS=true` to develop against MSW mocks.

> There is **no** `TENANT_KEY` — the JWT cookie carries tenant identity. Auth is
> fully cookie-based (see `CLAUDE.md §10`).

### Seed logins (live backend)

Password for all: `Password123!` — demo credentials for the test tenant.

| Email                  | Role        |
| ---------------------- | ----------- |
| `superadmin@acme.test` | SUPER_ADMIN |
| `hr@acme.test`         | HR_ADMIN    |
| `aman@acme.test`       | MANAGER     |
| `priya@acme.test`      | EMPLOYEE    |

---

## Scripts

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Start the dev server (with MSW when enabled) |
| `pnpm build`        | Production build                             |
| `pnpm start`        | Serve the production build                   |
| `pnpm lint`         | ESLint                                       |
| `pnpm lint:fix`     | ESLint with autofix                          |
| `pnpm typecheck`    | `tsc --noEmit` (strict)                      |
| `pnpm format`       | Prettier write                               |
| `pnpm format:check` | Prettier check                               |
| `pnpm test`         | Vitest (watch)                               |
| `pnpm test:run`     | Vitest (single run, CI)                      |
| `pnpm bootstrap`    | Re-run the setup script                      |

Before opening a PR, the gate is: **`pnpm typecheck` clean + `pnpm lint` clean**
(see `CLAUDE.md §15`). Husky runs lint-staged on commit.

---

## Mocks vs. live backend

This app uses **MSW (Mock Service Worker)** for endpoints the backend hasn't shipped
yet. When `NEXT_PUBLIC_USE_MOCKS=true`, MSW intercepts those paths and everything
else passes through the BFF to the real backend. When a backend endpoint goes live,
its mock handler is deleted and the app keeps working unchanged. The currently-mocked
endpoints are listed in `src/mocks/handlers/index.ts` and `CLAUDE.md §3`.

---

## Project structure (high level)

```
src/
├── app/         # App Router routes (thin) + the BFF proxy at api/[...path]
├── modules/     # Feature domains (auth, employees, departments, leave, …)
├── shared/      # engines/, guards/, layouts/
├── components/  # ui/ (shadcn), feedback/, data-display/, forms/
├── lib/         # api-client, permissions, query-client, env
├── providers/   # Theme, Query, Auth
└── mocks/       # MSW browser/server + handlers
```

Each `modules/<name>` is self-contained (`components/ hooks/ services/ validations/
types/ index.ts`) and exposes a public API via its barrel `index.ts`. Full rules in
`CLAUDE.md §5–§6`.

---

## Deploy

Deployed on **Vercel**. `API_BASE_URL` and the `NEXT_PUBLIC_*` vars are configured in
the Vercel project settings (server vars stay server-only). Push to the default
branch to trigger a deployment.
