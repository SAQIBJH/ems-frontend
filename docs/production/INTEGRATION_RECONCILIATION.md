# EMS — Frontend ↔ Live API Reconciliation

> **Purpose:** a complete, **no-code** diff between what the **frontend expects** and what
> the **live backend actually returns**, so flipping `NEXT_PUBLIC_USE_MOCKS=false` is a
> controlled, domain-by-domain cutover instead of a surprise. This is the map; the fixes
> are a separate follow-up.
>
> **Sources compared:** live shapes in `docs/API_MAPPING.md` ↔ frontend
> `src/modules/<m>/services/*.api.ts` (unwrap logic) + `types/*.ts` + `src/mocks/handlers/*`.
>
> **Status:** ✅ **COMPLETE — all 23 domains (A–W) reconciled.** Cross-cutting (§2) + every
> per-domain drift table (§4) filled. Ready to drive the §5 cutover.

## How to read a drift row

| Symbol | Meaning                                                                      |
| ------ | ---------------------------------------------------------------------------- |
| ✅     | FE expectation matches the live shape — flip the mock off, no change         |
| ⚠️     | Shape/field/units/enum differs — needs a small FE adapter or a backend tweak |
| ❌     | Endpoint missing on live, or a behaviour conflict — backend gap to file      |
| ❔     | Doc is ambiguous/self-contradictory — **verify against the running API**     |

**Action** column = `flip` (turn mock off as-is) · `adapt-FE` (map at the service boundary) ·
`backend` (file a backend gap) · `verify` (confirm against live before deciding).

---

## 1. Executive summary (filled as domains complete)

The high-risk surface is the **newly-live** modules (Payroll, Timesheets, Recruitment,
Performance, Assets, Announcements) — built against mocks, never yet run against the real
responses. The **Phase-1** modules (auth, employees, departments, attendance, leave,
holidays, settings, analytics, notifications, dashboards) have been live for weeks and the
app already works against them → low drift, sanity-sweep only.

**Payroll sub-domain verdicts (§4 A–G, all reconciled):** **A** runs — list-envelope rename
(`runs`/`pages`→`items`/`totalPages`) + inputs/roster remap block the flip; run money is
already major-correct. **B** components/groups — envelopes match; §26 config fields
(`statutoryTag`/`prorate`/`payInPeriods`) may not round-trip (verify). **C** localization —
⛔ **the `StatutoryPack` is a structural mismatch** (object-vs-string policies, nested-vs-flat
contribution schemes, minor-vs-major slab units, `packData` wrapper) → pack screen throws on
live; pay-calendars/`/payroll/countries` likewise unaligned/absent. **D** salary — bank model
is hardcoded-flat live vs schema-driven `Record` in FE; tax-declaration items
`section/description` vs `code/proofStatus`. **E** loans/claims/garnishments — the **money
100× zone** (`toMinor` submits, minor-unit reads) + flat-vs-nested shapes (loan `amount`,
garnishment `amountKind`, claim `data.claim` nesting). **F** disbursement/compliance —
pay-equity/template/tax-form key remaps; `audit-pack`/`data-policy` have no live route. **G**
workforce/migration — ✅ **closest to flip** (workers/cost/invoices near-exact, minor-unit
money correct); only migration status keys + mocked migration sub-routes lag.
**Net: G is near-ready; A/B/D/F need service-boundary adapters; C/E are the blockers
(structural pack + money 100×). No sub-domain is a zero-change flag-flip yet.**

**Two payroll-wide money rules to remember at cutover:** run totals, salary CTC, statutory
slabs, claims, loans → **major** units live; workers `monthlyCost` + cost-summary → **minor**
units live. The FE is inconsistent (some `formatMoney`/minor, some `formatMajor`/major), so
the unit is a **per-screen** decision, not a global one — see each domain's money row.

**Whole-app verdict (all A–W done).** The split is sharp:

- **🟢 Flip-ready / near-ready (most of the app):** the Phase-1 🟡 sweep (N–U, already live),
  the four frontend-first modules (I–L Recruitment/Performance/Assets/Announcements), Timesheets
  (H), Reports reads (M), and payroll workforce (G). These flip as-is or with one shared
  one-liner each.
- **🟠 Needs a service-boundary adapter (mechanical):** payroll runs list-envelope (A),
  components config-fields (B), salary/tax (D), pay-equity/templates/tax-forms (F), Reports
  **export** async flow (M), and the **`next-code` field bug** (O — breaks Create-Employee on
  live today).
- **🔴 True blockers (real engineering or backend work):** payroll **localization/StatutoryPack**
  (C — structural rewrite or backend reshape) and **loans/claims/garnishments** (E — the money
  **100×** zone + flat/nested shapes). Plus **W** run-types (backend feature gap) and the
  no-live-route endpoints filed throughout C/D/F/G.

So "the whole app" reconciles cleanly **except payroll C and E**, which are the two areas that
must not be flipped without code changes. Nothing outside payroll is a hard blocker.

**Cross-cutting issues found so far (read §2 — they affect every domain):**

1. ❔ **Validation status code 400 vs 422** — the FE maps field errors only on **422**, but
   `API_MAPPING.md` is self-contradictory (status table says **400**, envelope example says
   **422**). If live returns 400, **inline form errors won't render app-wide**. Must verify.
2. ⚠️ **Refresh cookie name** — live sets `ems_session`; our docs (`CLAUDE.md §3/§10`) say
   `refreshToken`. Harmless at runtime (httpOnly, browser auto-sends) but a doc/contract
   mismatch to align.
3. ⚠️ **Seed credentials drift** — live HR_ADMIN is now `mohammadsaeedafri9@gmail.com`, and
   `superadmin@acme.test` has **no employee record** (dashboard/attendance/leave 404 for it).
   Our demo/training docs use `hr@acme.test` — update them or confirm both work.
4. ❔ **Payroll auth** — Domain F says "Bearer token required"; our app is cookie-based
   (no `Authorization` header). Cookies should work via the BFF, but verify payroll
   endpoints don't 401 on cookie auth.
5. ⚠️ **Money units** — live payroll is **major units**; our newer payroll code uses **minor
   units** in places (already bit us: variable pay, loan EMI, claims). Per-domain detail in
   the Payroll section.

---

## 2. Cross-cutting contract reconciliation (applies to ALL domains)

| Concern                    | Frontend expectation                                                      | Live (`API_MAPPING.md`)                                        | Drift           | Action                |
| -------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------- | --------------------- |
| **Base URL**               | Browser → `/api` (BFF), `withCredentials: true` (`lib/api-client.ts`)     | BFF → `…/api/v1`; cookies auto-send                            | ✅              | flip                  |
| **Success envelope**       | services unwrap `data` (and nested `data.data` etc. per endpoint)         | `{ success, data, meta }`                                      | ✅              | flip                  |
| **Error envelope**         | `error.code/message/details`                                              | `{ success, error:{ code, message, details, requestId } }`     | ✅              | flip                  |
| **422 validation details** | FE maps `error.details[]` → `form.setError(field)`                        | `details` = array of `{field,message}` on validation           | ✅ shape        | flip                  |
| **Validation status code** | FE branches on `err.status === 422`                                       | status table says **400**; envelope says **422**               | ❔              | **verify**            |
| **Auth model**             | cookie-based, no `Authorization` header                                   | `accessToken` + `ems_session` httpOnly cookies                 | ✅ (name aside) | flip                  |
| **Refresh cookie name**    | docs say `refreshToken`                                                   | `ems_session`                                                  | ⚠️ doc          | align docs            |
| **401 → refresh → retry**  | Axios interceptor calls `POST /auth/refresh`                              | refresh rotates cookies                                        | ✅              | verify once           |
| **Dates (write)**          | `YYYY-MM-DD` via `formatDateForApi`                                       | `YYYY-MM-DD` everywhere; `holidayDate` rejects full ISO        | ✅              | flip                  |
| **Dates (read)**           | parse ISO with `parseISO`                                                 | server returns full ISO                                        | ✅              | flip                  |
| **Field casing**           | per-endpoint (camelCase mostly; snake_case on audit-logs/settings-tenant) | same per `API_MAPPING`                                         | ✅              | per-domain check      |
| **Money (non-payroll)**    | plain numbers                                                             | plain numbers                                                  | ✅              | flip                  |
| **Money (payroll)**        | **minor units** in newer code                                             | **major units**                                                | ⚠️              | adapt-FE (per-domain) |
| **Pagination**             | `{ page, limit, total, totalPages }`                                      | same                                                           | ✅              | per-domain check      |
| **Seed creds (demo docs)** | `hr@acme.test`                                                            | HR = `mohammadsaeedafri9@gmail.com`; SA has no employee record | ⚠️              | update docs / verify  |
| **MFA**                    | OTP only in forgot-password                                               | MFA disabled; OTP only in forgot-password                      | ✅              | flip                  |

> **Two app-wide blockers to settle before any cutover:** the **validation status code**
> (#1 — affects every form) and the **payroll auth model** (#4). Both are one-request
> verifications against the running API; everything else is per-domain mechanical work.

---

## 3. Domain index & progress

Tiers: 🔴 deep field-level diff (newly live) · 🟡 sanity sweep (long-live) · ⚪ note only (still mocked).

| #   | Domain                                                                | Tier | FE service                                                          | Status                                          |
| --- | --------------------------------------------------------------------- | :--: | ------------------------------------------------------------------- | ----------------------------------------------- |
| A   | Payroll — runs & types                                                |  🔴  | `payroll-runs.api.ts`                                               | ✅ done — 5 blocking drifts                     |
| B   | Payroll — components / pay groups                                     |  🔴  | `payroll-components.api.ts`, `pay-groups.api.ts`                    | ✅ done — envelopes OK, config fields at risk   |
| C   | Payroll — localization (entities/packs/calendars)                     |  🔴  | `localization.api.ts`                                               | ✅ done — ⛔ statutory-pack structural mismatch |
| D   | Payroll — salary / YTD / tax declaration                              |  🔴  | `employee-salary.api.ts`                                            | ✅ done — bank-model + tax-item mismatch        |
| E   | Payroll — loans / claims / garnishments                               |  🔴  | `loans.api.ts`, `claims.api.ts`, `garnishments.api.ts`              | ✅ done — money 100× + flat/nested mismatch     |
| F   | Payroll — disbursement / journal / compliance / templates / tax forms |  🔴  | `compliance.api.ts`, `payslip-templates.api.ts`, `tax-forms.api.ts` | ✅ done — pay-equity/template/tax-form remaps   |
| G   | Payroll — global workforce / migration / roster                       |  🔴  | `workers.api.ts`, `migration.api.ts`                                | ✅ done — closest to flip-ready                 |
| H   | Timesheets                                                            |  🔴  | `timesheets.api.ts`, `projects.api.ts`                              | ✅ done — mostly flip-ready                     |
| I   | Recruitment                                                           |  🔴  | `recruitment.api.ts`                                                | ✅ done — clean (frontend-first)                |
| J   | Performance                                                           |  🔴  | `performance.api.ts`                                                | ✅ done — clean                                 |
| K   | Assets                                                                |  🔴  | `assets.api.ts`                                                     | ✅ done — clean                                 |
| L   | Announcements                                                         |  🔴  | `announcements.api.ts`                                              | ✅ done — clean                                 |
| M   | Reports (rich registers)                                              |  🔴  | `reports.api.ts`                                                    | ✅ done — reads flip; export async-broken       |
| N   | Auth / sessions                                                       |  🟡  | `auth.api.ts`                                                       | ✅ done — flip-ready; drop otp MSW              |
| O   | Employees / documents / audit-logs                                    |  🟡  | `employees.api.ts`, `documents.api.ts`, `auditLogs.api.ts`          | ✅ done — ❌ next-code field bug                |
| P   | Departments                                                           |  🟡  | `departments.api.ts`                                                | ✅ done — clean                                 |
| Q   | Attendance                                                            |  🟡  | `attendance.api.ts`                                                 | ✅ done — clean                                 |
| R   | Leave                                                                 |  🟡  | `leave.api.ts`                                                      | ✅ done — calendar deviation                    |
| S   | Holidays                                                              |  🟡  | `holidays.api.ts`                                                   | ✅ done — clean; drop import MSW                |
| T   | Settings / permissions                                                |  🟡  | `settings.api.ts`, `permissions.api.ts`                             | ✅ done — verify sub-endpoints                  |
| U   | Analytics / dashboard / notifications / search                        |  🟡  | `analytics.api.ts`, `dashboard.api.ts`, …                           | ✅ done — verify ext. analytics                 |
| V   | Integrations / Billing (still mocked)                                 |  ⚪  | `settings.api.ts` (integration), billing                            | ✅ note — keep mocked                           |
| W   | Payroll run-types (not on backend)                                    |  ⚪  | `payroll-runs.api.ts`                                               | ✅ note — split cutover                         |

---

## 4. Per-domain reconciliation

> _(Filled in domain by domain — each section is a drift table + a cutover note. Starting
> with the 🔴 newly-live domains where the risk lives.)_

<!-- DOMAINS APPENDED BELOW AS COMPLETED -->

### Domain A — Payroll: runs & types 🔴

**Sources:** `payroll-runs.api.ts`, `payroll.types.ts` (`PayrollRun`, `PayrollRunsPage`,
`PayrollInput*`, `RosterMember`) ↔ `API_MAPPING` F.9 (runs), F.13 (roster), F.14 (inputs),
Phase-3-Extended F.8 (approvals/variance/audit), plus the original "Payroll Runs" table.

| Endpoint                                                                         | FE expects                                                                                                   | Live returns                                                                                                                  | Drift                                                                                         | Action                                                          |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `GET /payroll/runs` (list envelope)                                              | `data.items[]` + `pagination.totalPages` (`PayrollRunsTab` reads `data.items`, maps `pagination.totalPages`) | `data.runs[]` + `pagination.pages`                                                                                            | ⚠️ **list renders empty + pager broken** — keys differ (`runs`→`items`, `pages`→`totalPages`) | adapt-FE (rename in `list()` unwrap)                            |
| run object fields                                                                | `periodLabel` **required**, `type: PayrollRunType` **required**, `createdAt` required                        | omits `periodLabel`, `type`; has `period, status, employeeCount, totalGross/Deductions/Net, currency, processedAt, createdAt` | ⚠️ run-type badge + period label render `undefined`                                           | adapt-FE (derive label from `period`; default `type='REGULAR'`) |
| `POST /payroll/runs`                                                             | body `{period, includeAllActiveEmployees, type?, fnf?, employeeIds?, reversalOfRunId?}`                      | accepts only `{period, includeAllActiveEmployees}`; 409 `RUN_EXISTS`                                                          | ⚠️ extra run-type fields **silently ignored** (see Domain W)                                  | flip for REGULAR; run-types = mock-only                         |
| `POST /payroll/runs/:id/calculate`                                               | returns `{status, estimatedSeconds}` (async-poll model); also calls `?dryRun=true`→`RunDryRunResult`         | 202 returns **full run object** (`status:REVIEW` + totals), synchronous; no `estimatedSeconds`; `dryRun` undocumented         | ⚠️ `estimatedSeconds` undefined; ❔ dryRun may 404                                            | adapt-FE + **verify** dryRun                                    |
| `POST /payroll/runs/:id/approve`                                                 | `{notes}`                                                                                                    | `{notes}`, REVIEW→APPROVED                                                                                                    | ✅                                                                                            | flip                                                            |
| `POST /payroll/runs/:id/approvals/:level`                                        | body `{approver, notes}`                                                                                     | body `{approvedBy, comment}`                                                                                                  | ⚠️ field names differ                                                                         | adapt-FE                                                        |
| `PATCH /payroll/runs/:id/mark-paid`                                              | `{paidAt, paymentReference}`                                                                                 | same, APPROVED→PAID                                                                                                           | ✅                                                                                            | flip                                                            |
| `POST /payroll/runs/:id/cancel`                                                  | `{reason}`, HR-callable                                                                                      | `{reason}`, **SA only**, cannot cancel PAID                                                                                   | ⚠️ role: HR cancel → 403                                                                      | verify gate                                                     |
| `GET /payroll/runs/:id/variance`, `/audit`                                       | `RunVariance`, `PayrollRunAuditEntry[]`                                                                      | live (F.8) — shapes undocumented in detail                                                                                    | ❔ shape                                                                                      | verify                                                          |
| `…/payslips/:id/hold` · `/release` · `/recalculate`                              | hold `{reason}`, recalc `{actor}`                                                                            | live (F.8); recalc body not specified                                                                                         | ❔ recalc body                                                                                | verify                                                          |
| `GET /payroll/roster`                                                            | bare `RosterMember[]` = `{employeeId, employeeCode, employeeName}`                                           | `data.employees[]` (+`total`), member = `{id, employeeCode, name, department, payGroup, annualCtc, currency}`                 | ⚠️ not an array at `data`; field names differ (`id`/`name`)                                   | adapt-FE (unwrap `.employees`, remap)                           |
| `GET /payroll/runs/:id/inputs`                                                   | `{runId, period, editable, inputs[]}`                                                                        | `data.inputs[]` only                                                                                                          | ⚠️ `editable` undefined → may lock input editing                                              | adapt-FE (default editable from run status)                     |
| input object                                                                     | `variablePay: Record<code,number>`, `oneTime[]`, `shiftHours`, `onCallHours`, `employeeCode`                 | `variablePay: number`, `oneTimeAdditions[]`+`oneTimeDeductions[]`; no shift/onCall/code                                       | ⚠️ structural mismatch on inputs grid                                                         | adapt-FE (non-trivial)                                          |
| `PATCH …/inputs/:employeeId`                                                     | `Partial<PayrollInput>` (incl. `oneTime`, Record `variablePay`)                                              | accepts `{lopDays, variablePay:number, oneTimeAdditions[]}`                                                                   | ⚠️ body shape mismatch                                                                        | adapt-FE                                                        |
| `GET /payroll/runs/:id/export` (CSV)                                             | blob download                                                                                                | live, `text/csv` register                                                                                                     | ✅                                                                                            | flip                                                            |
| `GET /payroll/runs/:id/register` (JSON), `/register/export`, `/statutory-return` | `PayrollRegister` / blobs                                                                                    | **not in `API_MAPPING`** (no live route) → 404                                                                                | ❌ backend gap, or keep MSW                                                                   | backend / keep-mock                                             |
| money on run totals                                                              | `PayrollRunsTab` uses `formatMajor(..., {fractionDigits:0})`                                                 | major units (`totalGross: 501200` = ₹5.01L)                                                                                   | ✅ **no 100× here** (runs tab is major-correct)                                               | flip                                                            |

**Cutover note (A):** not flip-ready. The **list-envelope rename** (`runs`/`pages`) and
the **inputs object remap** are blocking — both silently break screens (empty table,
malformed input grid) rather than erroring. `periodLabel`/`type` need FE-side defaults.
Run-types (`type`, `fnf`, `reversalOfRunId`) are accepted-but-ignored live → keep those
flows on MSW (Domain W). `register`/`statutory-return` JSON endpoints have **no live
route** — keep mocked or file a backend request. Run money is the one payroll area already
major-correct; do **not** "fix" it toward minor units.

---

### Domain B — Payroll: components & pay groups 🔴

**Sources:** `payroll-components.api.ts`, `pay-groups.api.ts`, types `SalaryComponent(Input)`,
`PayGroup(Component)(Input)`, `PayScheduleRecord` ↔ `API_MAPPING` F.1 / F.2 + `/payroll/schedules`.

| Endpoint                                       | FE expects                                                                                                            | Live returns                                                                                                      | Drift                                                                                                                           | Action                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `GET /payroll/components` (envelope)           | `data[]` → `SalaryComponent[]`                                                                                        | `data[]`                                                                                                          | ✅                                                                                                                              | flip                                               |
| component enums                                | `type` (6 incl `EMPLOYER_CONTRIBUTION`/`VARIABLE`), `calculationType` (FLAT/PERCENTAGE/FORMULA)                       | identical                                                                                                         | ✅                                                                                                                              | flip                                               |
| component object — **config-over-code fields** | requires `statutoryTag`, `prorate`, `payInPeriods` (+ `formula`, `createdAt`, `updatedAt`)                            | omits `statutoryTag`, `prorate`, `payInPeriods`, `updatedAt`; `formula` only on FORMULA; `createdAt` on POST only | ⚠️ statutory-tag / proration / scheduled-pay flags come back **undefined** → the §26 no-hardcode engine loses its config inputs | adapt-FE / **backend gap** (these must round-trip) |
| `POST` / `PATCH /payroll/components`           | sends `statutoryTag`, `prorate`, `payInPeriods`, `glAccountCode`, `costCenterRule`                                    | documented body omits all five                                                                                    | ❔ may be silently dropped (not persisted)                                                                                      | **verify** round-trip                              |
| component errors                               | `409 COMPONENT_CODE_EXISTS`, `422`                                                                                    | same                                                                                                              | ✅                                                                                                                              | flip                                               |
| `GET /payroll/groups` (envelope)               | `data[]` → `PayGroup[]`                                                                                               | `data[]`                                                                                                          | ✅                                                                                                                              | flip                                               |
| pay-group object                               | requires `employeeCount`, `description`, `createdAt`, `updatedAt`                                                     | omits `employeeCount`, `description`, timestamps                                                                  | ⚠️ `employeeCount` (shown on group card) → `undefined`/NaN                                                                      | adapt-FE (default 0)                               |
| pay-group `components[]` item                  | `{componentId, componentCode, componentName, componentType, overrideCalculationType, overrideValue, overrideFormula}` | `{componentId, code, name, type, calculationType, value, basisCode, overrideCalculationType, overrideValue}`      | ⚠️ name/code/type keys differ (`code`vs`componentCode` …); `overrideFormula` absent                                             | adapt-FE (remap keys)                              |
| `POST /payroll/groups`                         | `components[]` = `{componentId, override*}`                                                                           | accepts `{componentId, overrideValue?}` (subset)                                                                  | ✅ (extra fields tolerated)                                                                                                     | flip                                               |
| `GET /payroll/schedules`                       | `PayScheduleRecord[]` = `{id,name,frequency,startDate,timezone,nextRunDate,active}`                                   | live — derives BIWEEKLY/WEEKLY groups as schedule records; shape undocumented                                     | ❔ shape                                                                                                                        | verify                                             |

**Cutover note (B):** components & groups **list/CRUD envelopes match** and the basic
fields flip cleanly. The real risk is the **§26 config-over-code fields**
(`statutoryTag`, `prorate`, `payInPeriods`) — if the live GET/POST genuinely doesn't
carry them, statutory wage-base tagging, LOP proration, and 13th-month scheduling lose
their data source the moment mocks are off. That's a **one-component round-trip test**
(POST a component with `statutoryTag:"PF_WAGE"`, re-GET, check it's there) and should gate
the flip. The pay-group `components[]` key remap (`code`/`name`/`type`) is a small
service-boundary adapter but is needed or group rows show blank component names.

---

### Domain C — Payroll: localization (entities / packs / calendars) 🔴 ⛔ highest structural drift

**Sources:** `localization.api.ts` + `migration.api.ts` (calendars), types `Country`,
`LegalEntity(Input)`, `BankField`, `StatutoryPack(Input)`, `PayCalendar` ↔ `API_MAPPING`
F.3 (legal entities), F.4 (statutory packs), F.5 (pay calendars). `/payroll/countries*`
not in mapping.

| Endpoint                                     | FE expects                                                                                        | Live returns                                                                     | Drift                                                                                                      | Action                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `GET /payroll/countries`, `…/:c/bank-schema` | `Country[]`, `{fields: BankField[]}`                                                              | **not in `API_MAPPING`** → no live route (404)                                   | ❌ MSW-only — bank-field schema (the per-country DynamicForm source) has no backend                        | keep-mock / backend gap       |
| `GET /payroll/legal-entities` (envelope)     | `data[]` → `LegalEntity[]`                                                                        | `data[]`                                                                         | ✅                                                                                                         | flip                          |
| legal-entity object                          | requires `active`, `updatedAt`                                                                    | omits `active`, `updatedAt`                                                      | ⚠️ `active` undefined (falsy)                                                                              | adapt-FE (default true)       |
| `POST /payroll/legal-entities` body          | `LegalEntityInput` lacks `statutoryPackId`/`payCalendarId`                                        | accepts `statutoryPackId`, `payCalendarId`                                       | ⚠️ can't link pack/calendar at create                                                                      | adapt-FE (add fields)         |
| `GET /payroll/statutory-packs` (envelope)    | `data[]` → `StatutoryPack[]`                                                                      | `data[]`                                                                         | ✅ envelope only                                                                                           | —                             |
| pack `.rounding`                             | object `{mode:'NEAREST'\|'UP'\|'DOWN', precision}`                                                | **string** `"nearest_rupee"`                                                     | ❌ `.rounding.mode` on a string                                                                            | adapt-FE / backend            |
| pack `.proration`                            | object `{basis:'CALENDAR_DAYS'\|'WORKING_DAYS'\|'FIXED_30'}`                                      | **string** `"working_days"`                                                      | ❌ object vs string                                                                                        | adapt-FE / backend            |
| pack `.taxRegimes[]`                         | `{code, fiscalYear, currency, standardDeduction, slabs[], surcharge?, cess?}`                     | `{code, name, default, slabs[]}`                                                 | ❌ FE-required `fiscalYear`/`currency`/`standardDeduction` absent; live `name`/`default` unused            | adapt-FE / backend            |
| tax-slab units                               | `from/to` in **minor units** (per type comments)                                                  | **major units** (`300000`, `1500000`)                                            | ⚠️ 100× on every slab boundary → `SLAB()` mis-buckets income                                               | adapt-FE (units)              |
| pack `.contributionSchemes[]`                | nested `{wageBaseTag, wageCeiling, employee:{rate,component,split}, employer:{…}, applicability}` | flat `{code, name, employeeRate, employerRate, wageBase}`                        | ❌ **hard mismatch** — `.employee.rate` reads `undefined`; no `wageBaseTag`                                | adapt-FE / backend            |
| pack `.statutoryComponents`                  | `string[]` (codes)                                                                                | `object[]` `{code, name, type}`                                                  | ❌ array element type differs                                                                              | adapt-FE                      |
| pack `.localTaxes`                           | `LocalTax[]` **required**                                                                         | absent                                                                           | ⚠️ `undefined.map` if rendered                                                                             | adapt-FE (default [])         |
| `POST /payroll/statutory-packs` body         | flat top-level `rounding/proration/taxRegimes/…`                                                  | wrapped in **`packData: {…}`** (only country/version/effectiveFrom/To top-level) | ❌ POST body un-nested → backend ignores rules                                                             | adapt-FE (wrap in `packData`) |
| pack errors                                  | `409 PACK_VERSION_EXISTS`                                                                         | same                                                                             | ✅                                                                                                         | flip                          |
| `GET /payroll/pay-calendars` (envelope)      | `data[]` → `PayCalendar[]`                                                                        | `data[]`                                                                         | ✅ envelope                                                                                                | —                             |
| pay-calendar object                          | `{frequency, periodAnchor, payDateRule, payDay, cutoffDay, legalEntityId}`                        | `{code, country, paySchedule, firstPayDate, createdAt}`                          | ❌ near-total field mismatch — `PayCalendarPanel` shows "Day undefined", `PAY_DATE_RULE_CONFIG[undefined]` | adapt-FE / backend            |

**Cutover note (C):** **do not flip.** This is the worst structural gap in the codebase.
The **StatutoryPack** — the literal heart of the §26 "no-hardcode" engine — was typed
against a far richer mock (nested rounding/proration policies, `employee`/`employer`
contribution parties, minor-unit slabs) than the live backend returns (string policies,
flat rates, major-unit slabs, object-array `statutoryComponents`). The pack viewer/editor
**will throw** on live data (`.rounding.mode`, `.employee.rate`). Two viable paths: (a) a
substantial **service-boundary adapter** in `localization.api.ts` that normalizes the live
flat pack ↔ the FE rich type both ways (incl. minor/major unit conversion on slabs and the
`packData` POST wrapper), or (b) a **backend change** to emit the rich shape. Either is a
real engineering task, not a flag flip. `PayCalendar` has the same problem (live F.5 is a
thin `{code,paySchedule,firstPayDate}`; FE expects the full cutoff/anchor/pay-day model).
`/payroll/countries` + bank-schema have **no live route at all** — the per-country bank
DynamicForm stays on MSW until the backend ships them. Keep this whole domain mocked; it is
the largest single backend-alignment item to file.

---

### Domain D — Payroll: salary / YTD / tax declaration 🔴

**Sources:** `employee-salary.api.ts`, types `EmployeeSalary(Input)`, `PayslipYtd`,
`TaxDeclaration(Item)(Input)`, `PayslipsPage`/`PayslipSummary` ↔ `API_MAPPING` F.6 (salary
config), F.7 (YTD + tax declaration), F.10 (self-service payslips).

| Endpoint                                                | FE expects                                                                                                               | Live returns                                                                                         | Drift                                                                                     | Action                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `GET /payroll/employees/:id/salary` (envelope)          | `data` object → `EmployeeSalary`                                                                                         | `data` object                                                                                        | ✅ envelope                                                                               | —                                               |
| salary **bank fields**                                  | `bankAccount: Record<string,string>` (country-schema driven, §26 Step 95)                                                | flat `bankName, bankAccountNumber, bankIfscCode, bankAccountName` (hardcoded India)                  | ❌ live never adopted the schema-driven bank model; `bankAccount` reads `undefined`       | adapt-FE / backend                              |
| salary object extras                                    | requires `payGroup{}`, `monthlyGross/Deductions/Net`, `history[]`, `country`, `residenceJurisdiction`, `workLocations[]` | only `payGroupId` + `calculatedComponents[]`                                                         | ⚠️ salary summary totals, history timeline, multi-jurisdiction all blank/derived          | adapt-FE (sum components; default history `[]`) |
| salary `calculatedComponents[]`                         | `{code,name,type,monthlyAmount,taxable}`                                                                                 | identical                                                                                            | ✅                                                                                        | flip                                            |
| `POST`/`PATCH …/salary` body                            | `{…, bankAccount: Record, country, residenceJurisdiction, workLocations}`                                                | `{payGroupId, annualCtc, effectiveFrom, bankName, bankAccountNumber, bankIfscCode, bankAccountName}` | ❌ FE sends `bankAccount{}` (ignored), omits flat bank fields backend wants               | adapt-FE / backend                              |
| salary `annualCtc` money                                | numeric (form units)                                                                                                     | major (`1800000`)                                                                                    | ❔ confirm form isn't minor-unit                                                          | verify                                          |
| `GET /payroll/employees/:id/ytd`                        | `PayslipYtd` `{fiscalYear, monthsElapsed, gross/taxable/taxDeducted/totalDeductions/netPay, contributions: Record}`      | adds `employeeId`, `currency`; `contributions:{pf,esi}`                                              | ✅ shape (extras harmless; Record fits)                                                   | flip                                            |
| YTD money                                               | numbers                                                                                                                  | major units                                                                                          | ⚠️ if YTD card uses `formatMoney` (minor) → 100×                                          | verify formatter                                |
| `GET /payroll/employees/:id/tax-declaration` (envelope) | `data` → `TaxDeclaration`                                                                                                | `data` object                                                                                        | ✅ envelope                                                                               | —                                               |
| tax-declaration `items[]`                               | `{code, amount, meta?, proofStatus}`                                                                                     | `{section, description, amount}`                                                                     | ❌ live `section`/`description` vs FE `code`/`proofStatus` → item rows render `undefined` | adapt-FE (remap)                                |
| tax-declaration `regime`                                | `string` (form options may be `IN_NEW_REGIME`)                                                                           | `"NEW"` \| `"OLD"`                                                                                   | ❔ enum value drift                                                                       | verify form options                             |
| tax-declaration object                                  | requires `updatedAt`                                                                                                     | has `createdAt`, `proofStatus` (top-level)                                                           | ⚠️ minor                                                                                  | adapt-FE                                        |
| `POST`/`PATCH …/tax-declaration` body                   | `items: {code, amount, meta, proofStatus}`                                                                               | `items: {section, description, amount}`                                                              | ❌ body item shape mismatch → declaration won't save correctly                            | adapt-FE                                        |
| `GET /payroll/employees/:id/payslips`                   | `PayslipsPage` `{items[], pagination.totalPages}`                                                                        | `data.items[]` + `pagination.pages`                                                                  | ⚠️ `items` matches; `pages`→`totalPages` (as in Domain A)                                 | adapt-FE                                        |
| payslip summary item                                    | `{…, periodLabel, paymentDate, payrollRunId}`                                                                            | `{…, currency, documentUrl}` (no `periodLabel`/`paymentDate`/`payrollRunId`)                         | ⚠️ `periodLabel` undefined                                                                | adapt-FE                                        |
| payslip list money                                      | numbers                                                                                                                  | major (`grossEarnings: 71600`)                                                                       | ⚠️ 100× if `formatMoney` used                                                             | verify formatter                                |

**Cutover note (D):** not flip-ready. Two structural blockers: (1) **bank account model** —
the live salary endpoint still returns/accepts the _old hardcoded_ `bankName/…/bankIfscCode`
fields, while the FE moved to the §26 schema-driven `bankAccount: Record` keyed off the
per-country `BankField` schema (which itself has no live route, Domain C). Salary
assign/edit will neither read nor write bank details correctly. (2) **tax-declaration item
shape** — live `{section, description, amount}` vs FE `{code, …, proofStatus}` breaks both
the read table and the save body. YTD is the one near-clean sub-area (Record-based
`contributions` fits), pending a money-formatter check. The self-service payslip list shares
Domain A's `pages`→`totalPages` and `periodLabel`-missing issues. Verify the salary/payslip
**money formatter** (major vs `formatMoney` minor) before any cutover here.

---

### Domain E — Payroll: loans / claims / garnishments 🔴

**Sources:** `loans.api.ts`, `claims.api.ts`, `garnishments.api.ts`, types `Loan(Input)`,
`Reimbursement{Category,Claim,ClaimInput}`, `ClaimStatus`, `Garnishment(Input)`,
`GarnishmentAmount` ↔ `API_MAPPING` F.8 (loans) + Phase-3-Extended F.6 (claims) / F.7
(garnishments). This domain carries the documented **money 100× bugs** (§1 #5).

| Endpoint                                             | FE expects                                                                                                                   | Live returns                                                                                            | Drift                                                                                                                                                                                                            | Action             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `GET /payroll/employees/:id/loans` (envelope)        | `data[]` → `Loan[]`                                                                                                          | `data[]`                                                                                                | ✅ envelope                                                                                                                                                                                                      | —                  |
| loan object                                          | `{type, principal, currency, interestMethod, annualRatePct, tenureMonths, schedule: ScheduleEntry[], outstandingBalance, …}` | `{amount, balance, emiAmount, startPeriod, endPeriod, status, schedule:{frequency, deductFromPayroll}}` | ❌ `principal`vs`amount`, `outstandingBalance`vs`balance`; `schedule` is **object** not amortization array (`.schedule.map` breaks); FE interest model (`interestMethod/annualRatePct/tenureMonths`) absent live | adapt-FE / backend |
| loan money                                           | minor units (`principal`, `emiAmount`)                                                                                       | major (`amount:100000`, `emiAmount:5000`)                                                               | ⚠️ **100×** (the loan-EMI bug)                                                                                                                                                                                   | adapt-FE (units)   |
| `POST …/loans` body                                  | `{type, principal, currency, interestMethod, annualRatePct, tenureMonths, startPeriod}`                                      | `{amount, emiAmount, startPeriod, endPeriod}`                                                           | ❌ FE sends interest-model body; live wants `amount`+`emiAmount`+periods                                                                                                                                         | adapt-FE / backend |
| `PATCH …/loans/:id` foreclose                        | `{action:'foreclose'}`                                                                                                       | **not documented** (F.8 only GET/POST)                                                                  | ❔ may 404                                                                                                                                                                                                       | verify             |
| `GET /payroll/reimbursement-categories`              | `data[]` → `{code,label,monthlyCap}`                                                                                         | `data[]` with monthly caps                                                                              | ✅ (verify `monthlyCap` major units)                                                                                                                                                                             | verify money       |
| `GET /payroll/reimbursement-claims`                  | bare `data[]` → `ReimbursementClaim[]`                                                                                       | `?status&employeeId&page&limit` (paginated; doc shows single as `{claim:{…}}`)                          | ❔ list may be paginated / nested                                                                                                                                                                                | verify list shape  |
| claim unwrap (POST/PATCH)                            | `data` → `ReimbursementClaim`                                                                                                | `data.claim` (nested)                                                                                   | ❌ FE reads `data.data`, live nests under `.claim`                                                                                                                                                               | adapt-FE           |
| claim object                                         | `category: string`, `proofUrl`, `runId`, `decidedBy`                                                                         | `categoryId` + nested `category:{code,label,monthlyCap}`; no `runId`/`decidedBy`                        | ⚠️ `category` field maps to `categoryId`+`category{}`; FE extras undefined                                                                                                                                       | adapt-FE (remap)   |
| `POST …/reimbursement-claims` body                   | `{category(code), amount, currency, description, proofUrl, employeeId}`; `ClaimsCard` sends `toMinor(amount)`                | `{employeeId, categoryId, amount(major), currency, description, proofUrl}`                              | ❌ `category`vs`categoryId` + **amount 100×** (toMinor)                                                                                                                                                          | adapt-FE           |
| `GET /payroll/employees/:id/garnishments` (envelope) | `data[]` → `Garnishment[]`                                                                                                   | `data[]`                                                                                                | ✅ envelope                                                                                                                                                                                                      | —                  |
| garnishment `amount`                                 | nested `{kind, value}`                                                                                                       | flat `amountKind` + `amountValue`                                                                       | ❌ `.amount.value` undefined (`GarnishmentsCard` reads it)                                                                                                                                                       | adapt-FE           |
| garnishment `type` enum                              | `CHILD_SUPPORT\|SPOUSAL_SUPPORT\|TAX_LEVY\|COURT_ORDER\|DEFAULTED_LOAN`                                                      | `COURT_ORDER\|LOAN_RECOVERY\|TAX_LEVY\|CHILD_SUPPORT`                                                   | ⚠️ FE `SPOUSAL_SUPPORT`/`DEFAULTED_LOAN` absent; live `LOAN_RECOVERY` unmapped                                                                                                                                   | adapt-FE (enum)    |
| garnishment `amountKind` enum                        | `FLAT\|PERCENT_OF_DISPOSABLE`                                                                                                | `FLAT\|PERCENTAGE`                                                                                      | ⚠️ `PERCENT_OF_DISPOSABLE`vs`PERCENTAGE`                                                                                                                                                                         | adapt-FE (enum)    |
| garnishment money                                    | `protectedEarningsFloor`/`cap`/`value` minor                                                                                 | major                                                                                                   | ⚠️ 100×                                                                                                                                                                                                          | adapt-FE (units)   |
| `POST …/garnishments` body                           | `{…, amount:{kind,value}, …}`                                                                                                | `{type, amountKind, amountValue, effectiveFrom, …}`                                                     | ❌ FE sends nested `amount{}`; live wants flat                                                                                                                                                                   | adapt-FE           |
| `DELETE …/garnishments/:id`                          | matches                                                                                                                      | matches                                                                                                 | ✅                                                                                                                                                                                                               | flip               |

**Cutover note (E):** not flip-ready — this is where the **money 100× bugs** live, plus
several flat-vs-nested shape mismatches. **Loans:** the FE models an interest/amortization
engine (`principal`, `annualRatePct`, `schedule[]`) the live backend doesn't have (it stores
flat `amount`/`emiAmount` + a `{frequency,deductFromPayroll}` schedule object) — read remap +
unit fix + a different POST body. Foreclose (PATCH) isn't in the live contract → verify.
**Claims:** live nests the object under `data.claim` (FE unwraps `data.data`), uses
`categoryId` not a `category` code, and is **major units** while `ClaimsCard` submits
`toMinor()` → 100× over-submission. **Garnishments:** live is flat `amountKind`/`amountValue`
vs FE nested `amount{kind,value}`, with two enum-value mismatches (`DEFAULTED_LOAN`↔`LOAN_RECOVERY`,
`PERCENT_OF_DISPOSABLE`↔`PERCENTAGE`) and minor-unit money. Every write path here needs a
service-boundary adapter before the flip; do not enable on live with the current minor-unit
`toMinor()` calls or amounts go in 100× too large.

---

### Domain F — Payroll: disbursement / journal / compliance / templates / tax forms 🔴

**Sources:** `compliance.api.ts`, `payslip-templates.api.ts`, `tax-forms.api.ts` (+ the
disbursement/journal/events methods on `payroll-runs.api.ts`, already row-noted in Domain A)
↔ `API_MAPPING` F.16 (pay-equity), F.10-ext (templates), F.13-ext (tax forms), F.9/F.11/F.12-ext
(disbursement/journal/events). `audit-pack` + `data-policy` not in mapping.

| Endpoint                                                  | FE expects                                                                                                               | Live returns                                                                                                                                                    | Drift                                                                                                                           | Action              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `GET /payroll/reports/pay-equity` (envelope)              | `data` → `PayEquityReport`                                                                                               | `data` object                                                                                                                                                   | ✅ envelope                                                                                                                     | —                   |
| pay-equity group item                                     | `{group, headcount, meanPay, medianPay, meanGapPct, medianGapPct}`                                                       | `{key, count, meanCtc, medianCtc}`                                                                                                                              | ❌ every key differs; per-group gap pcts absent                                                                                 | adapt-FE (remap)    |
| pay-equity report-level                                   | `{referenceGroup, overallMeanGapPct, overallMedianGapPct, generatedAt}`                                                  | single `gapPct`                                                                                                                                                 | ⚠️ FE's reference-group gap model not provided                                                                                  | adapt-FE / backend  |
| pay-equity money                                          | major (`meanPay`)                                                                                                        | major (`meanCtc`)                                                                                                                                               | ✅ no 100×                                                                                                                      | flip                |
| `GET /payroll/reports/audit-pack`                         | `Blob` (AuditPack)                                                                                                       | **not in `API_MAPPING`** → no live route                                                                                                                        | ❌ MSW-only                                                                                                                     | keep-mock / backend |
| `GET`/`PATCH /payroll/settings/data-policy`               | `DataPolicy`                                                                                                             | **not in `API_MAPPING`** → no live route                                                                                                                        | ❌ MSW-only                                                                                                                     | keep-mock / backend |
| `GET /payroll/payslip-templates` (envelope)               | `data` → `PayslipTemplate`                                                                                               | `data` object (auto-creates)                                                                                                                                    | ✅ envelope                                                                                                                     | —                   |
| template `sections[]`                                     | `{key, label, enabled, order}`                                                                                           | `{id, label, visible, order}`                                                                                                                                   | ⚠️ `key`vs`id`, `enabled`vs`visible` → toggles read `undefined`                                                                 | adapt-FE (remap)    |
| template `fields[]`                                       | `{key, label, enabled}`                                                                                                  | `{key, label, visible}`                                                                                                                                         | ⚠️ `enabled`vs`visible`                                                                                                         | adapt-FE            |
| `PATCH /payroll/payslip-templates` body                   | sends `sections/fields` with `enabled`                                                                                   | expects `visible`                                                                                                                                               | ⚠️ write uses wrong toggle key                                                                                                  | adapt-FE            |
| `GET /payroll/employees/:id/tax-form` (envelope)          | `data` → `TaxFormDocument`                                                                                               | `data` object                                                                                                                                                   | ✅ envelope                                                                                                                     | —                   |
| tax-form object                                           | generic `{type, title, jurisdiction, authority, employer/employee: party{identifiers[]}, sections:[{title, rows[]}], …}` | fixed `{formType, fiscalYear, employee:{id,name,employeeCode,pan}, employer:{name,tan}, incomeDetails:{grossIncome,netTaxableIncome,taxDeducted}, downloadUrl}` | ❌ FE's template-rendered sections/rows model vs live's fixed 3-number + downloadUrl shape — `type` undefined, `sections` empty | adapt-FE / backend  |
| disbursement / journal / events / publish (Domain A rows) | live (F.9/F.11/F.12-ext)                                                                                                 | live; detailed shapes undocumented in mapping                                                                                                                   | ❔ shapes                                                                                                                       | verify              |

**Cutover note (F):** mixed. **Pay-equity** is live but the group/report shape differs on
every key (`key/count/meanCtc` ↔ `group/headcount/meanPay`) — a service remap, and the FE's
richer reference-group gap model isn't computed live (degrade to single `gapPct`).
**Payslip templates** + **tax-forms** are live but mis-shaped: templates use `visible`/`id`
where FE uses `enabled`/`key` (toggles silently no-op on both read and write), and the
tax-form viewer was built as a generic template renderer (`sections[].rows[]`,
`party.identifiers[]`) while live returns a fixed `{incomeDetails, downloadUrl}` — the form
body will render empty. **`audit-pack`** and **`data-policy`** have **no live route** → keep
mocked. Disbursement/journal/events endpoints are live (Domain A) but their exact payloads
aren't documented in `API_MAPPING` — verify against the running API before trusting those
screens. Net: remap pay-equity + templates; keep tax-forms/audit-pack/data-policy on the
adapter-or-mock path.

---

### Domain G — Payroll: global workforce / migration / roster 🔴 (most-aligned)

**Sources:** `workers.api.ts`, `migration.api.ts`, types `Worker`, `ContractorInvoice(Input)`,
`CostSummary(Group)`, `MigrationStatus`, `PayCalendar`, `OpeningBalance` ↔ `API_MAPPING`
F.12 (workforce), F.15 (migration), F.13 (roster, see Domain A).

| Endpoint                                                                                                      | FE expects                                                                                                           | Live returns                                                                                  | Drift                                                                    | Action                |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------- |
| `GET /payroll/workers` (envelope)                                                                             | `data[]` → `Worker[]`                                                                                                | `data[]`                                                                                      | ✅                                                                       | flip                  |
| worker object                                                                                                 | `{id, name, classification, country, currency, legalEntityId, legalEntityName, monthlyCost, riskFlag, active}`       | same + `employeeCode`; `legalEntityId/Name` = `null`                                          | ✅ (FE types entity fields non-null → may show "null")                   | flip (relax null)     |
| worker `monthlyCost` money                                                                                    | **minor units** (`formatMoney`)                                                                                      | **minor** (`15000000`=₹1.5L)                                                                  | ✅ correct — no 100×                                                     | flip                  |
| `PATCH /payroll/workers/:id`                                                                                  | returns full `Worker`                                                                                                | returns partial `{id, classification, employmentType}`                                        | ⚠️ cache set to partial until refetch                                    | adapt-FE (invalidate) |
| `GET /payroll/cost-summary`                                                                                   | `CostSummary` `{groupBy, baseCurrency, totalBaseCost, totalWorkers, groups:[{key,workerCount,baseAmount}], fxRates}` | identical                                                                                     | ✅                                                                       | flip                  |
| `GET /payroll/contractor-invoices` (envelope)                                                                 | `data[]` → `ContractorInvoice[]`                                                                                     | `data[]`, identical object                                                                    | ✅                                                                       | flip                  |
| invoice `status` enum                                                                                         | `SUBMITTED\|APPROVED\|PAID`                                                                                          | adds `VOIDED`                                                                                 | ⚠️ no badge mapping for `VOIDED`                                         | adapt-FE (enum)       |
| `POST /payroll/contractor-invoices` body                                                                      | `{workerId, period, amount, currency, withholdingPct}`                                                               | also accepts `workerName`                                                                     | ❔ `workerName` derived or required?                                     | verify                |
| `PATCH …/contractor-invoices/:id`                                                                             | `{status, payoutRef?}`                                                                                               | same                                                                                          | ✅                                                                       | flip                  |
| `GET /payroll/migration/status`                                                                               | `{sandboxMode, goLivePeriod, openingBalancesCount, historicalPayslipsCount, lastReconciledRunId, updatedAt}`         | `{sandboxMode, goLivePeriod, historicalPayslipsImported, openingBalancesSet, totalEmployees}` | ⚠️ count keys differ (`*Count` vs `*Set`/`*Imported`) → counts undefined | adapt-FE (remap)      |
| `GET /payroll/pay-calendars` (+ POST/PATCH)                                                                   | rich `PayCalendar`                                                                                                   | thin live shape                                                                               | ❌ see **Domain C**                                                      | adapt-FE / backend    |
| `/payroll/opening-balances`, `/payroll/migration/historical-payslips`, `/payroll/runs/:id/parallel-reconcile` | live data                                                                                                            | **not in `API_MAPPING`** → no live route                                                      | ❌ MSW-only                                                              | keep-mock / backend   |

**Cutover note (G):** **the closest payroll domain to flip-ready.** Workers, cost-summary,
and contractor-invoices match the live shapes almost exactly — and critically, worker
`monthlyCost` is **minor units on both sides** (`GlobalWorkforceScreen`'s `formatMoney` is
correct here; do **not** "fix" it). Only small adapters needed: relax `legalEntity*` to
nullable, add the `VOIDED` invoice status, invalidate after the partial `PATCH /workers`
response, and confirm whether POST invoice needs `workerName`. **Migration** is the rough
edge: status uses different count keys (`*Set`/`*Imported` vs FE `*Count`), pay-calendars
carry Domain C's structural mismatch, and opening-balances / historical-payslips /
parallel-reconcile have **no live route** (keep mocked). So: workforce sub-area → flip with
trivial adapters; migration sub-area → stays largely on MSW.

---

### Domain H — Timesheets 🔴

**Sources:** `timesheets.api.ts`, `projects.api.ts`, `timesheet.types.ts` ↔ `API_MAPPING`
Domain G (Timesheets, live 2026-06-07).

| Endpoint                                               | FE expects                                                              | Live returns                                                    | Drift                                                              | Action              |
| ------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------- |
| `GET /timesheets?week=&employeeId=`                    | `data` → `Timesheet` (auto-DRAFT)                                       | `data` object, auto-creates DRAFT                               | ✅                                                                 | flip                |
| timesheet object                                       | adds `employeeName`, `submittedAt`, `decidedBy`, `decidedAt`, `comment` | doc shape lists only `{…, standardHours, entries[]}`            | ⚠️ approval queue needs `employeeName`; decided-meta may be absent | verify              |
| `POST`/`PATCH`/`DELETE /timesheets/entries`            | `TimeEntry` w/ `employeeId`, required `taskId`                          | entry `{…, taskId?, …}` (no `employeeId`, `taskId` optional)    | ⚠️ `employeeId` undefined; untasked entries → `taskId` undefined   | adapt-FE (nullable) |
| `POST /timesheets/:id/submit` · `/approve` · `/reject` | `{comment}` → `Timesheet`                                               | DRAFT/REJECTED→SUBMITTED→APPROVED/REJECTED, `{comment}`         | ✅                                                                 | flip                |
| `GET /timesheets/approvals?status=`                    | `data[]` → `Timesheet[]`                                                | `data[]`                                                        | ✅ (pending `employeeName`)                                        | flip                |
| `GET /timesheets/projects?memberId=` (+ CRUD)          | `Project[]` w/ required `clientName`, `status`                          | POST `clientName`/`billable`/`defaultRate`/`memberIds` optional | ⚠️ `clientName` may be null on minimal projects                    | adapt-FE (nullable) |
| `GET /timesheets/projects/:id/tasks` (+ CRUD)          | `Task[]` `{id, projectId, name, billable, active}`                      | matches                                                         | ✅                                                                 | flip                |
| `GET /timesheets/summary?range=&employeeId=`           | `TimesheetSummary` `{…, byProject[], byEmployee[]}`                     | "utilization summary" — shape undocumented                      | ❔ shape                                                           | verify              |
| `GET`/`PATCH /timesheets/settings`                     | `{standardWeeklyHours, overtimeThresholdHours, roundingMinutes, …}`     | `{standardWeeklyHours, overtimeThreshold, …}`                   | ⚠️ `overtimeThreshold` vs FE `overtimeThresholdHours`              | verify key          |

**Cutover note (H):** **mostly flip-ready** — same camelCase domain pattern, envelopes and
core CRUD match. Confirm three things against live: (1) the **approval queue's `employeeName`**
(and decided-meta) actually come back, or the queue rows show blank; (2) the **settings key**
is `overtimeThreshold` vs the FE's `overtimeThresholdHours`; (3) the **summary** object shape
(`byProject`/`byEmployee`). Make entry `employeeId`/`taskId` and project `clientName` nullable
in the FE types. No money concerns (hours are plain decimals). Note the payroll bridge
`POST /payroll/runs/:id/inputs/from-timesheets` is live (Domain A row / F.8-ext).

---

### Domains I–L — Recruitment / Performance / Assets / Announcements 🔴 (frontend-first, backend-matched → cleanest)

These four net-new Phase-3 modules were authored **frontend-first** (`newreqphase3.md`,
camelCase) and the backend implemented to the mock. The FE page-wrapper keys, object fields,
and the (unusually human-readable, title-case) enums **match `API_MAPPING` Domains A–D
verbatim**. Verdict for all four: **expected clean flip**, with one shared thing to confirm.

| Domain              | Endpoints (FE ↔ live)                                                                                                                                                                                                           | Match | Drift / verify                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **I Recruitment**   | `summary`, `openings`(`{openings[],pagination}`), `candidates`(`{candidates[],pagination}`), `candidates/:id/advance`(`{stage}`), `openings`POST/PATCH, `candidates/:id/rating`(`{rating:1-5}`), `recruiters`(`{recruiters[]}`) | ✅    | enums `applied→hired`, `Open\|Closing\|On hold\|Closed` match; candidate `tag=openingId` (confirm FE reads it)                      |
| **J Performance**   | `cycles/active`(obj or **null**), `summary`, `reviews`(`{reviews[],pagination}`), `goals`(`{goals[],pagination}`), `calibration`(`{distribution[],notes[]}`), `employees`, `reviews/:employeeId`PATCH, `goals`POST              | ✅    | `RatingValue Exceeds\|Strong\|Meets\|Developing\|Below` matches; `getActiveCycle` already handles `null`                            |
| **K Assets**        | `summary`, `assets`(`{assets[],pagination}`), `assets`POST, `assets/requests`(`{requests[],pagination}`), `requests/:id/approve\|decline`, `:id/status\|assign\|recall`, `employees`                                            | ✅    | enums `Laptop\|…`, `Assigned\|Available\|Repair\|Retired`, `Pending\|Approved\|Fulfilled\|Declined` match; `assignedTo` nullable ✅ |
| **L Announcements** | `announcements`(`{pinned, feed[], pagination}`), POST, `channels`(`{channels[]}`), `events`(`{events[]}`)+POST, `:id/pin\|unpin`                                                                                                | ✅    | `author {name, role}` ✅; category `Company\|People\|Product\|IT\|Office` matches                                                   |

**Shared verify (I–L):** the **`pagination` inner key** — FE types and MSW use `totalPages`;
the live payroll list used `pages` (Domain A). These modules' live pagination field name
must be confirmed `totalPages` (one response inspection per module), or the pagers under-count.
No money in any of these four (hours/ratings/counts only).

**Cutover note (I–L):** **the green block of the cutover.** Flip these first as the
low-blast-radius proof that mocks-off works end-to-end, gated only on the `pagination.pages`
vs `totalPages` check. If live returns `pages`, it's a trivial one-line service remap shared
across all four; otherwise they flip as-is.

---

### Domain M — Reports (rich registers) 🔴

**Sources:** `reports.api.ts`, `reports.types.ts` ↔ `API_MAPPING` "Phase 2 Report Endpoints
(Domain 4)". All nine report endpoints + `/reports/export`.

| Endpoint                                                                                                     | FE expects                                                            | Live returns                                                                         | Drift                                              | Action                |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- | --------------------- |
| all 9 report GETs (envelope)                                                                                 | `data` → `{meta, summary, chartData, tableData:{items[],pagination}}` | exactly that shape                                                                   | ✅                                                 | flip                  |
| `workforce/headcount`, `turnover`, `attendance/summary`, `absenteeism`, `leave/utilization`, `leave/pending` | per-endpoint summary/chart/table fields                               | documented fields match (`currentHeadcount`, `attritionRate`, …)                     | ✅                                                 | flip                  |
| `workforce/demographics`                                                                                     | `{byEmploymentType[], byGender[], byDepartment[]}`                    | same                                                                                 | ✅                                                 | flip                  |
| `payroll/ctc-analysis`                                                                                       | `{bands[], percentiles}`                                              | same                                                                                 | ✅                                                 | flip                  |
| `payroll/summary` data quality                                                                               | real payroll numbers                                                  | **estimated from headcount** (FT 80k/mo, etc. — no live payroll feed)                | ⚠️ numbers are synthetic, not from Payroll module  | accept / note         |
| payroll report money                                                                                         | numbers                                                               | major units (`totalGross/Net`)                                                       | ⚠️ verify formatter major                          | verify                |
| `POST /reports/export`                                                                                       | **blob** (`responseType:'blob'`) → immediate CSV download             | **202 JSON** `{jobId, status, message}` → async; poll `GET /export/:job_id/download` | ❌ FE downloads the JSON job descriptor, not a CSV | adapt-FE (async flow) |
| report `pagination` inner                                                                                    | `ReportPagination`                                                    | shape undocumented                                                                   | ❔ `pages` vs `totalPages`                         | verify                |

**Cutover note (M):** **read paths flip cleanly** — the FE was built to the exact
`{meta, summary, chartData, tableData}` contract and the field names line up across all nine
registers. Two real items: (1) **export is broken on live** — the FE expects a synchronous
CSV blob but `POST /reports/export` returns a **202 job** to be polled at
`/export/:job_id/download`; the export button needs the two-step async flow before it works
against the backend. (2) **payroll/summary + ctc-analysis are headcount-_estimated_** server-side
(no live payroll wiring), so the figures are synthetic — fine for a register demo, but don't
present them as actual payroll. Confirm the report `pagination` inner key and the payroll
money formatter (major).

---

### Domains N–U — Phase-1 sanity sweep 🟡 (already live; app runs against them)

These eight domains have been live for weeks and the running app already consumes them, so
this is a **confirmation sweep**: every service unwraps `data.data` (or the documented nested
key) and matches `API_MAPPING`. Verdict: **flip-ready**, save a few specific drifts called out
per row.

| #     | Domain                                         | Confirmed ✅                                                                                                                                                                     | Real drift / verify                                                                                                                                                                                                             |
| ----- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **N** | Auth / sessions                                | login/me/sessions/logout/refresh all `data.data`; `verify-otp` sends `code` ✅; cookie flow ✅                                                                                   | `POST /auth/otp/initiate` is now **live** (API_MAPPING 2026-05-28) → its MSW handler can be dropped (CLAUDE §3 still lists it mocked)                                                                                           |
| **O** | Employees / documents / audit-logs             | `list` double-nest `data.data[]`+`pagination` ✅; get/CRUD ✅; `audit-logs` → `data.logs[]`, snake_case ✅; documents ✅                                                         | ❌ **`getNextCode` reads `data.data.code`; live returns `data.nextCode`** → Create-Employee code pre-fill is `undefined` on live (known §3 deviation, not adapted). ❔ `/employees/bulk/deactivate`+`/bulk/export` live?        |
| **P** | Departments                                    | `list` → `data[]` nested tree ✅; `getDepartmentEmployees` double-nest ✅                                                                                                        | ❔ `/departments/:id/reassign-and-delete` live? (verify route)                                                                                                                                                                  |
| **Q** | Attendance                                     | `records` → `data.records[]`+`pagination` ✅; `today` nullable ✅; summary ✅; regularization approve/deny ✅                                                                    | ✅ clean — flip                                                                                                                                                                                                                 |
| **R** | Leave                                          | `balance` → `data.balances[]` ✅; `requests`/`team/requests` → `data.requests[]` ✅; bulk approve/deny ✅                                                                        | ⚠️ `team/calendar` → `members[].leaves[]` range objects (**not** `days[]` grid) — documented §3 deviation, ensure FE renders ranges. ❔ `/leave/team/coverage` live?                                                            |
| **S** | Holidays                                       | `GET` → `data.holidays[]`+`data.total` ✅; CRUD ✅; `.ics` import preview/commit **live** ✅                                                                                     | ✅ clean — flip (drop import MSW per CLAUDE §3)                                                                                                                                                                                 |
| **T** | Settings / permissions                         | `settings/tenant` (snake_case `company_name`…) ✅; `email-templates` → `data.templates` ✅; `roles-permissions` ✅                                                               | ❔ `/settings/branding`, `/settings/attendance-rules`, `/settings/roles-permissions/custom` — live or still MSW? (verify each)                                                                                                  |
| **U** | Analytics / dashboard / notifications / search | core `analytics/{summary,attendance,headcount,leave-summary,recent-activity}` ✅; manager+employee dashboards ✅; notifications (PATCH read/read-all) live ✅; `/search` live ✅ | ⚠️ **4 extended analytics** (`workforce-trend`, `attrition`, `payroll-cost`, `department-performance`) — CLAUDE §3 lists them **MSW**, but `API_MAPPING` documents them live → resolve which before flipping the Analytics page |

**Cutover note (N–U):** **the safe block to flip first** (low blast radius, already exercised
live). Two concrete fixes regardless of cutover: the **`next-code` field bug**
(`code`→`nextCode`, Domain O — breaks the Create-Employee form on live today) and dropping the
now-redundant MSW handlers for **`otp/initiate`** and **holiday `.ics` import** (Domains N/S).
Before flipping the Analytics page, settle the **extended-analytics live-vs-MSW** contradiction
(Domain U) and the handful of settings sub-endpoints (Domain T). Everything else in N–U is a
clean flip. Field casing is per-endpoint as documented (camelCase except snake_case on
audit-logs + settings/tenant) — do **not** normalize.

---

### Domains V–W — note-only ⚪ (intentionally still mocked)

These two are **not cutover candidates** — they stay on MSW by design until the backend ships
the work. Listed for completeness so nobody flips them by accident.

| #     | Domain                 | Status                          | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | ---------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V** | Integrations / Billing | ⚪ MSW-only, no live backend    | Per CLAUDE §24: email/storage/webhook integration settings + billing (subscription/plans/invoices) are all MSW-backed; billing actions are read-only info dashboards. **Keep mocked.** No drift to file — there's nothing live to diff against. When the backend ships, diff then.                                                                                                                                                                                                                                                                                              |
| **W** | Payroll run-types      | ⚪ accepted-but-ignored on live | Step-118 run types (`BONUS`, `ARREARS`, `OFF_CYCLE`, `REVERSAL`, `FNF`) are **real in the MSW engine** but **not on the live backend**: live `POST /payroll/runs` accepts only `{period, includeAllActiveEmployees}` and silently ignores `type`/`fnf`/`employeeIds`/`reversalOfRunId` (Domain A). So even after Payroll-A flips, **only `REGULAR` runs compute correctly on live** — the other five must **stay routed through MSW** (or the backend must implement them) or they'll produce a `REGULAR` run regardless of the type chosen. The single functional payroll gap. |

**Cutover note (V–W):** leave both on MSW. **V** has no live counterpart yet (nothing to
reconcile). **W** is the one place where "flip the domain" and "feature works" diverge: the
Payroll runs list/CRUD can go live for regular monthly payroll while the four special run
types remain mock-served — a **split cutover within Domain A**. Track W as a backend feature
request, not a frontend adapter.

---

## 5. Cutover procedure (domain-by-domain)

For each domain, once its drift rows are all `flip`/resolved:

1. Set `NEXT_PUBLIC_USE_MOCKS=false` **in a preview env** (or unregister just that domain's
   MSW handler) — never big-bang the whole app.
2. Smoke-test the domain's key screens as each persona (HR / Manager / Employee).
3. Watch for: 401s (auth model), 400-vs-422 form errors, 100×/÷100 money, enum/`null` render
   gaps, pagination shape.
4. If clean → leave live; remove the MSW handler. If not → fix the drift row, re-test.

**Recommended order (now that all 23 are mapped — low-blast-radius first):**

1. **Settle the two app-wide blockers first** (one request each): validation **400 vs 422**
   (§2 #1) and **payroll cookie-auth** (§2 #4). These gate everything.
2. **Phase-1 🟡 sweep (N–U)** — already live; flip first as the proof. Ship the **`next-code`
   fix** (O) and drop the redundant `otp/initiate` + holiday-import MSW (N/S) as you go.
   Resolve the extended-analytics MSW-vs-live question (U) before the Analytics page.
3. **Frontend-first modules (I–L)** — Recruitment / Performance / Assets / Announcements.
   Gate only on the `pagination.pages`-vs-`totalPages` check; otherwise clean.
4. **Timesheets (H)** — confirm approval `employeeName`, settings key, summary shape.
5. **Reports (M)** — reads flip immediately; rebuild **export** as the async job→download flow.
6. **Payroll, sub-domain by sub-domain (A–G), in adapter-difficulty order:** **G** (near-ready)
   → **B** (verify config round-trip) → **A** (list-envelope + inputs remap; REGULAR runs only)
   → **D** / **F** (adapters) → **C** and **E** last (the real blockers: StatutoryPack rewrite,
   money-100× fixes). Do **not** flip C or E without the code changes.
7. **Keep on MSW:** Integrations/Billing (V), payroll special run-types (W), and every
   no-live-route endpoint filed in C/D/F/G (`/payroll/countries`, bank-schema, `audit-pack`,
   `data-policy`, opening-balances, historical-payslips, register/statutory-return).

Per-domain mechanics (unchanged): flip in a preview env → smoke-test as HR/Manager/Employee →
watch 401s, 400-vs-422, 100×/÷100 money, enum/`null` gaps, pagination shape → clean ⇒ remove
the handler; else fix the drift row and re-test.
