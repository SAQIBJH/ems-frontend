# EMS — Production Readiness & Go-Live Plan

> **Owner:** Product · **Status:** Draft for go-live · **Last updated:** 2026-06-08
>
> This is the master checklist for taking EMS production-live. It states the **current
> state** honestly, breaks the remaining work into **workstreams with owners**, and
> defines the **gates** that must be green before launch. Nothing here is aspirational —
> every item maps to something concrete in the codebase or a real dependency.

---

## 1. Executive summary

EMS is **feature-complete on the frontend**: every module is built with all four states
(loading/empty/error/success), dark mode, and permission gating. The product is fully
usable end-to-end in a demo.

The path to **production-live** is not more UI — it is four things:

1. **Backend delivery** — most advanced modules are served by MSW mocks today; the backend
   team implements them to the documented contracts (they own this and are on track).
2. **Persistence** — mocked data is in-memory and resets on reload; real persistence comes
   with the live backends.
3. **Server-side enforcement** — permissions are a UI affordance today; the backend must
   enforce RBAC and tenant isolation on every endpoint.
4. **Real artifacts** — payslip PDFs, statutory filings, and bank files must be real,
   validated documents, not stubs.

Everything else (deploy, monitoring, hardening, QA) is standard launch engineering.

**Verdict:** With the backend team delivering the documented APIs, a **phased production
launch is achievable** — go live with the live-backed Phase-1 core first, then switch each
advanced module from mock → live as its backend ships (zero frontend change required —
just flip `NEXT_PUBLIC_USE_MOCKS` / remove the handler).

---

## 2. Module readiness matrix

Legend: **Live** = real backend today · **Mock** = MSW, backend pending · **Gap** = work
beyond the API.

| Module                                                                                                                                             | Backend  | Frontend | Go-live notes                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | :------: | ------------------------------------------ |
| Auth / sessions / RBAC                                                                                                                             | **Live** |    ✅    | `otp/initiate` (MFA) still mock            |
| Employee directory / profile / CRUD                                                                                                                | **Live** |    ✅    | Ready                                      |
| Departments (org tree)                                                                                                                             | **Live** |    ✅    | Ready                                      |
| Attendance + regularization                                                                                                                        | **Live** |    ✅    | Ready                                      |
| Leave (requests/approvals/balances)                                                                                                                | **Live** |    ✅    | Ready                                      |
| Holidays                                                                                                                                           | **Live** |    ✅    | `.ics` import still mock                   |
| Permissions matrix                                                                                                                                 | **Live** |    ✅    | Ready                                      |
| Settings — company/tenant/roles                                                                                                                    | **Live** |    ✅    | Ready                                      |
| Analytics (core widgets)                                                                                                                           | **Live** |    ✅    | 4 trend endpoints mock                     |
| Notifications / Search                                                                                                                             | **Live** |    ✅    | Ready                                      |
| **Payroll** (runs, components, pay groups, disbursement, journal, statutory, FnF, bonus, arrears, off-cycle, reversal, my-pay, claims, loans, tax) | **Mock** |    ✅    | Largest backend build; see §3.W1 + Gaps §4 |
| **Reports** (workforce/attendance/leave/payroll/timesheet)                                                                                         | **Mock** |    ✅    | On-demand compute endpoints                |
| **Timesheets**                                                                                                                                     | **Mock** |    ✅    | Domain G                                   |
| **Recruitment**                                                                                                                                    | **Mock** |    ✅    | Phase-3 net-new                            |
| **Performance**                                                                                                                                    | **Mock** |    ✅    | Phase-3 net-new                            |
| **Assets**                                                                                                                                         | **Mock** |    ✅    | Phase-3 net-new                            |
| **Announcements**                                                                                                                                  | **Mock** |    ✅    | Phase-3 net-new                            |
| Settings — Integrations (email/storage/webhooks)                                                                                                   | **Mock** |    ✅    | Must actually connect/send                 |
| Settings — Billing (plan/invoices)                                                                                                                 | **Mock** |    ✅    | Read-only dashboards today                 |

---

## 3. Go-live workstreams

Each workstream has a **goal**, the **work**, an **owner**, and an **exit criterion**.

### W1 — Backend API delivery (mock → live)

- **Goal:** every mocked endpoint has a real, contract-matching implementation.
- **Work:** backend implements to `BACKEND_API_SPECIFICATION.md`; per endpoint, FE flips the
  MSW intercept off and moves the shape into `API_MAPPING.md`. Order of delivery:
  Payroll → Timesheets → Reports → Recruitment/Performance/Assets/Announcements →
  Integrations/Billing.
- **Owner:** Backend lead.
- **Exit:** `NEXT_PUBLIC_USE_MOCKS=false` and the full app works end-to-end against real APIs.

### W2 — Persistence & data integrity

- **Goal:** data survives sessions, is tenant-scoped, and is consistent across modules.
- **Work:** real DB behind the live APIs; **resolve the salary↔payroll-run seam** (see Gap
  G1) so assigned `EmployeeSalary` drives runs (not a fixed roster); effective-dated history
  for salary/statutory is immutable (revisions create rows).
- **Owner:** Backend lead.
- **Exit:** create → reload → data persists; a salary change assigned in the profile appears
  in the next run.

### W3 — Security & RBAC enforcement (server-side)

- **Goal:** every endpoint enforces authentication, tenant isolation, and permission keys.
- **Work:** server-side `can(user, permission)` equivalent on all routes (FE `PermissionWrapper`
  is UI-only); JWT/tenant checks; rate limiting; the payroll **maker ≠ checker** rule enforced
  server-side; audit logging on every mutating payroll/settings action.
- **Owner:** Backend lead + Security.
- **Exit:** a security review passes; permission bypass attempts are rejected by the API.

### W4 — Documents & file generation

- **Goal:** real, validated documents — not stubs.
- **Work:** payslip **PDF** (from the configurable template), **Form-16 / tax forms** PDF,
  statutory filings (**PF ECR, TDS 24Q, UK RTI**) in the authorities' exact formats, and
  **bank files** (NACH/SEPA/ACH) validated against bank specs. (Today these download as
  text/JSON.)
- **Owner:** Backend lead (generation) + Payroll SME (format validation).
- **Exit:** generated files import cleanly into the target systems (bank portal, tax portal).

### W5 — Notifications & integrations

- **Goal:** email/webhooks/storage actually send/connect.
- **Work:** wire the email provider (templates already exist), real webhook delivery with
  retries/signatures, file storage (Cloudinary/S3) for documents; test buttons hit real
  services.
- **Owner:** Backend lead.
- **Exit:** a real email arrives; a webhook delivers to an external URL; a file uploads and
  re-downloads.

### W6 — Quality assurance

- **Goal:** confidence the app behaves under real conditions.
- **Work:** E2E (Playwright) for the critical journeys (login, run payroll end-to-end,
  employee self-service, leave approval); expand unit tests beyond payroll utils; cross-browser
  - responsive (768/1280/1440/1920) + dark-mode sweep; load test the payroll calculate path.
- **Owner:** QA + Frontend.
- **Exit:** green E2E suite in CI; no P1/P2 defects open.

### W7 — Deployment & operations

- **Goal:** repeatable deploys and observability.
- **Work:** Vercel (frontend) + backend hosting; environment config (`API_BASE_URL` server-only,
  `NEXT_PUBLIC_USE_MOCKS=false` in prod); logging/metrics/alerting; error tracking (Sentry);
  DB backups; uptime monitoring; CI/CD with the test gate (`typecheck`/`lint`/`test`/`build`).
- **Owner:** DevOps.
- **Exit:** one-command deploy; dashboards live; rollback tested.

### W8 — Compliance & data governance

- **Goal:** legally safe to process payroll and personal data.
- **Work:** statutory accuracy sign-off per supported country; **data residency & retention**
  enforced (the Data Policy panel must drive real storage placement/retention); GDPR-style data
  subject rights (export/delete); audit-trail completeness; payroll **immutability** (a PAID run
  can never be edited) enforced server-side.
- **Owner:** Legal/Compliance + Payroll SME.
- **Exit:** compliance sign-off for the launch countries.

---

## 4. Known gaps beyond "build the API" (must be explicitly closed)

| ID     | Gap                                                                                                                                                                                                                      | Impact                                    | Owner                 | Target                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | --------------------- | ---------------------- |
| **G1** | **Salary assignment ↔ payroll run are disconnected.** HR can assign a CTC/pay group (Employee → Compensation → SalaryAssignmentDrawer), but the run engine uses a fixed roster — assigned salaries don't flow into runs. | High — payroll wouldn't reflect real comp | Backend + FE          | Before payroll go-live |
| **G2** | **Statutory Packs & Pay Schedules are view-only** (no in-app editor). A new country/rule can't be configured by users.                                                                                                   | Med — limits self-serve onboarding        | FE + Backend          | Phase 2 of rollout     |
| **G3** | **No real document generation** (payslip/Form-16/bank/statutory are stubs).                                                                                                                                              | High for payroll                          | Backend               | W4                     |
| **G4** | **Mock data is in-memory** (resets on reload).                                                                                                                                                                           | Blocker for pilot                         | Backend (persistence) | W2                     |
| **G5** | **RBAC is UI-only** on mocked modules.                                                                                                                                                                                   | Security blocker                          | Backend               | W3                     |
| **G6** | **Off-cycle deeper proration & auto-detected arrears** deferred (manual back-pay only).                                                                                                                                  | Low — acceptable v1                       | Backend               | Post-launch            |
| **G7** | **i18n** — UI is English-only (payslip locale exists, app UI not translated).                                                                                                                                            | Low for launch countries                  | FE                    | Post-launch            |
| **G8** | **Reversal** shows negative bank file/journal (cosmetic), and does not auto-claw bank payments.                                                                                                                          | Low — accounting-correct                  | Payroll SME           | Post-launch            |

---

## 5. Go-live gates (all must be green to launch)

- [ ] **G-1 Functional:** all launch-scope modules work end-to-end against **live** APIs
      (`NEXT_PUBLIC_USE_MOCKS=false`), no fake buttons.
- [ ] **G-2 Persistence:** data persists across sessions; salary↔run seam (G1) closed.
- [ ] **G-3 Security:** server-side auth + RBAC + tenant isolation on every endpoint; security
      review passed; maker≠checker enforced server-side.
- [ ] **G-4 Documents:** payslip PDF, tax forms, statutory filings, and bank files generate in
      valid formats and pass a real import test.
- [ ] **G-5 Compliance:** statutory accuracy + data residency/retention signed off for launch
      countries; PAID-run immutability enforced.
- [ ] **G-6 Quality:** E2E suite green in CI; responsive + dark-mode sweep done; no open P1/P2.
- [ ] **G-7 Ops:** monitoring, error tracking, backups, and tested rollback in place.
- [ ] **G-8 Docs:** this suite complete; runbook validated by a clean deploy.

---

## 6. Recommended phased rollout

Don't big-bang it. Ship in waves, flipping mocks → live per module.

- **Wave 0 — Internal/stakeholder demo (this week):** deployed build, Phase-1 live + rest on
  mocks (persisted), no fake buttons. _Not_ a customer pilot.
- **Wave 1 — Core HR live (Phase 1):** employees, departments, attendance, leave, holidays,
  permissions, settings, analytics. Already live-backed — hardens fastest.
- **Wave 2 — Payroll live:** after W1–W5 for payroll + G1/G3 closed. The highest-value,
  highest-risk module — launch it only behind real documents + persistence + RBAC.
- **Wave 3 — Time & talent:** Timesheets, Reports, Recruitment, Performance, Assets,
  Announcements as their backends ship.
- **Wave 4 — Platform:** Integrations (email/storage/webhooks) + Billing.

---

## 7. Top risks

| Risk                                                                    |   Likelihood   | Mitigation                                                                                                   |
| ----------------------------------------------------------------------- | :------------: | ------------------------------------------------------------------------------------------------------------ |
| Backend ships APIs whose shapes **drift** from the documented contracts |      Med       | `BACKEND_API_SPECIFICATION.md` is the contract; FE types mirror it; contract tests on key endpoints          |
| Payroll **statutory inaccuracy** at launch                              |      Med       | Country-by-country SME sign-off; parallel-run reconciliation (already built) before each country goes live   |
| **Data migration** from a client's old system                           |      Med       | Migration tooling already built (pay calendar, opening balances, historical payslips, parallel run, go-live) |
| Security/permission **bypass** on mocked-now-live endpoints             | High if rushed | W3 enforcement is a hard gate (G-3)                                                                          |
| Cold-start / availability on launch                                     |      Low       | Standard hosting + monitoring (W7)                                                                           |

---

## 8. What "done" looks like

A new tenant can sign up, configure their org and pay structure, import existing payroll,
run a real monthly payroll with two-person approval, disburse via a valid bank file,
publish payslips employees download as PDFs, and file statutory returns — **all on live,
persisted, secured, audited backends**, with the frontend unchanged from today except
`NEXT_PUBLIC_USE_MOCKS=false`.
