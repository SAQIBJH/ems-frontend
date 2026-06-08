# EMS — Production Documentation

This folder holds the documentation that takes the Employee Management System from a
**feature-complete, mostly-mocked build** to a **production-live SaaS**. It is written for
three audiences: the **backend team** (who implement the live APIs), **engineering/DevOps**
(who deploy and operate it), and **stakeholders/PM** (who track go-live readiness).

## Document map

| Document                                                           | What it answers                                                                   | Status         |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------- | -------------- |
| [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)               | Are we ready to go live? What's left, who owns it, what gates the launch?         | ✅ Written     |
| [BACKEND_API_SPECIFICATION.md](./BACKEND_API_SPECIFICATION.md)     | Exactly what the backend team must build for every currently-mocked endpoint      | 🟡 In progress |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                               | How the system fits together (BFF, auth, frontend/backend split, deploy topology) | 🟡 Planned     |
| [DATA_MODEL.md](./DATA_MODEL.md)                                   | Core entities and their relationships across modules                              | 🟡 Planned     |
| [RBAC_PERMISSIONS.md](./RBAC_PERMISSIONS.md)                       | Roles, permission keys, and server-side enforcement requirements                  | 🟡 Planned     |
| [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)                   | How to deploy, configure env, turn mocks off, smoke-test                          | 🟡 Planned     |
| [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md) | Security, performance, accessibility, i18n, compliance, monitoring                | 🟡 Planned     |

## Existing source docs (already in the repo — inputs to the above)

- `CLAUDE.md` — engineering conventions, the live-vs-mocked split (§3), backend contract (§4).
- `docs/API_MAPPING.md` — authoritative response shapes for **already-live** endpoints.
- `docs/newreqphase3.md` — frontend-first API contracts authored for Phase-3 / mocked domains.
- `docs/BACKEND_API_REQUESTS.md` — net-new endpoints requested of the backend.
- `docs/phase2api.md` — Phase-2 payroll/reports/analytics/integrations contracts.

> **Single source of truth rule:** once an endpoint is live, its shape lives in
> `API_MAPPING.md`. While mocked, it lives in `newreqphase3.md` / `phase2api.md`. The
> `BACKEND_API_SPECIFICATION.md` here **consolidates** those into one build list for the
> backend team and points back to the detailed shape.

## How to use this during the go-live week

1. Track progress against **PRODUCTION_READINESS.md** — it's the master checklist.
2. Backend team builds against **BACKEND_API_SPECIFICATION.md**; as each endpoint ships,
   flip its MSW handler off and move its row to "Live" in `API_MAPPING.md`.
3. DevOps follows **DEPLOYMENT_RUNBOOK.md** to stand up environments.
4. Sign-off gates in PRODUCTION_READINESS.md must be green before launch.
