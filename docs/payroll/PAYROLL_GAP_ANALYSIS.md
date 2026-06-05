# Payroll — Gap Analysis (Current vs. Target)

> **Status:** Analysis (Phase 2 / Step 86 input). No code in this document.
> **Reads against:** the actual code in `src/modules/payroll/`, `src/mocks/handlers/payroll-*.ts`,
> and the contract in `docs/phase2api.md` Domains 1–3.
> **Target:** [`PAYROLL_SYSTEM_DESIGN.md`](./PAYROLL_SYSTEM_DESIGN.md).
> **Verdict in one line:** We have a solid, well-architected **single-country (India),
> happy-path** payroll skeleton with a working component/formula engine and a
> run→approve→pay lifecycle — but it is **not yet a statutory engine, not multi-country,
> and the calculation is mocked rather than driven by real inputs.**

---

## 1. Method

I inventoried the implemented payroll surface and compared each capability in the
target design (`PAYROLL_SYSTEM_DESIGN.md`) against what the code/types/handlers
actually do. Status values:

- ✅ **Built** — present and functionally complete for the demo.
- 🟡 **Partial** — exists but shallow, mocked, or India-only.
- ❌ **Missing** — no model, no handler, no UI.

---

## 2. What exists today (inventory)

**Module:** `src/modules/payroll/` — clean module anatomy (components, hooks,
services, types, validations, utils, constants, barrel). Mirrored MSW handlers in
`src/mocks/handlers/payroll-{components,groups,employee,runs}.ts`.

**Data model (`types/payroll.types.ts`):**

- `SalaryComponent` — `EARNING | DEDUCTION | BENEFIT | REIMBURSEMENT`,
  `FLAT | PERCENTAGE | FORMULA`, `value`, `basisCode`, `formula`, `taxable`, `active`,
  `displayOrder`.
- `PayGroup` — components with group-level overrides, `currency`, `paySchedule`
  (`MONTHLY | BIWEEKLY | WEEKLY`), `employeeCount`.
- `PayScheduleRecord` — frequency, startDate, timezone, nextRunDate.
- `EmployeeSalary` — `payGroupId`, `annualCtc`, `effectiveFrom/To`, **India bank
  fields** (`bankIfscCode`), `calculatedComponents[]`, monthly gross/deductions/net,
  `history[]`.
- `Payslip` — earnings[], deductions[], oneTimeAdditions/Deductions[], gross/net,
  workingDays/presentDays/leaveDays/lopDays, status, paymentDate/reference.
- `PayrollRun` — period, status, totals, `summary.byDepartment`, `summary.warnings`.

**Formula engine (`utils/formula.utils.ts`):** `expr-eval`-based; `evaluateFormula`,
`validateFormula` (checks unknown vars against `CTC/GROSS/NET` + known codes),
`resolveComponentOrder` (topological sort, cycle-safe), `computeComponentBreakdown`
(FLAT/PERCENTAGE/FORMULA → monthly amounts, derives GROSS/NET). **Client-side, real,
and good.**

**UI:** `PayrollScreen` (Runs tab; employees redirected to `MyPayslipsPage`),
`PayrollRunsTab`, `PayrollRunDetail`, `InitiateRunDialog`, `PayslipDrawer`,
`AdjustmentDialog`, and the settings panels `SalaryComponentsPanel`, `PayGroupsPanel`
(+`PayGroupDrawer`), `PaySchedulesPanel`, `SalaryComponentDrawer`. Employee profile
Compensation tab (CLAUDE.md §23).

**Lifecycle:** initiate → calculate → review → approve → mark-paid → cancel, all
wired through hooks/services to MSW.

---

## 3. Capability matrix

| #   | Capability (target)                                                           | Status | Notes                                                                                            |
| --- | ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| 1   | Salary components CRUD                                                        | ✅     | Solid. Missing `EMPLOYER_CONTRIBUTION` + `VARIABLE` types.                                       |
| 2   | Formula engine (graph + functions)                                            | ✅     | Real client-side engine. No `SLAB()`, no YTD/LOP built-ins.                                      |
| 3   | Pay groups / overrides                                                        | ✅     | Good. No CTC-composition logic, no FBP.                                                          |
| 4   | Pay schedules                                                                 | 🟡     | Record exists; not deeply wired to period boundaries / pay-date rules.                           |
| 5   | Employee salary assignment + history                                          | 🟡     | Works, but India-only bank fields; annual-CTC only (no hourly/daily).                            |
| 6   | Run lifecycle (DRAFT→PAID)                                                    | ✅     | State machine present and wired.                                                                 |
| 7   | Payslip model + viewer                                                        | 🟡     | Present, but **no employer-contribution block, no YTD block**.                                   |
| 8   | One-time adjustments                                                          | ✅     | `AdjustmentDialog` + PATCH payslip.                                                              |
| 9   | Export (CSV)                                                                  | 🟡     | Static CSV string; not a real register.                                                          |
| 10  | **Calculation from real inputs**                                              | ❌     | **Run totals are hardcoded in MSW** (`4800000` etc.); attendance/LOP/leave/OT not wired.         |
| 11  | **Statutory/tax engine (slabs, regimes)**                                     | ❌     | Only approximable via `IF()` formulas; no slabs/regimes/YTD/true-up.                             |
| 12  | **Employer vs employee contribution split**                                   | ❌     | No `EMPLOYER_CONTRIBUTION` type; CTC≠net+EE+ER not provable.                                     |
| 13  | **Multi-country / legal entity**                                              | ❌     | No country/entity model; currency is a free string on pay group.                                 |
| 14  | **Per-country bank schema**                                                   | ❌     | Hardcoded `bankIfscCode` (India IFSC) in type + UI.                                              |
| 15  | **Currency as minor-units**                                                   | ❌     | Plain `number`; float risk; no FX table.                                                         |
| 16  | **Proration / pay-basis config**                                              | ❌     | `lopDays` field exists but no proration rule applied in compute.                                 |
| 17  | **Tax declarations / exemptions / proofs**                                    | ❌     | No declaration model; `taxable` is a flat boolean.                                               |
| 18  | **YTD ledger**                                                                | ❌     | Not modeled anywhere.                                                                            |
| 19  | **Loans & advances (EMI)**                                                    | ❌     | Only as ad-hoc one-time deduction.                                                               |
| 20  | **Reimbursement claims workflow**                                             | ❌     | `REIMBURSEMENT` type only; no submit/approve/settle lifecycle.                                   |
| 21  | **Variable pay / bonus / commission**                                         | 🟡     | Only via one-time additions; no structured variable comp.                                        |
| 22  | **Run types (off-cycle/bonus/arrears/FnF/reversal)**                          | ❌     | Regular run only.                                                                                |
| 23  | **Multi-level approvals / maker-checker**                                     | 🟡     | Single approve; no enforced SoD, no N-level.                                                     |
| 24  | **Variance / anomaly checks**                                                 | ❌     | `summary.warnings` shape exists but unused/empty.                                                |
| 25  | **Disbursement / bank files / payouts**                                       | ❌     | `mark-paid` is a manual status flip.                                                             |
| 26  | **Payment status reconciliation**                                             | ❌     | `PayslipStatus` has `PAID/HELD/PENDING` but no payment lifecycle.                                |
| 27  | **Payslip templates (configurable/multi-lang)**                               | ❌     | Fixed React rendering.                                                                           |
| 28  | **Tax forms (Form 16 / W-2 / P60)**                                           | ❌     | None.                                                                                            |
| 29  | **Accounting / GL / cost-center export**                                      | ❌     | No journal, no GL mapping on components.                                                         |
| 30  | **Statutory filing/returns (ECR/24Q/RTI)**                                    | ❌     | None.                                                                                            |
| 31  | **Full & final settlement**                                                   | ❌     | No gratuity, leave encashment, notice recovery.                                                  |
| 32  | **Granular payroll permissions**                                              | 🟡     | Role gate HR_ADMIN/SUPER_ADMIN only; no initiate/approve/disburse split.                         |
| 33  | **Audit trail on payroll**                                                    | 🟡     | Generic audit-logs exist; payroll transitions not specifically logged.                           |
| 34  | Employee self-service payslips                                                | ✅     | `MyPayslipsPage`.                                                                                |
| 35  | Self-service declarations/claims/loans                                        | ❌     | None.                                                                                            |
| 36  | **Multi-jurisdiction tax per employee**                                       | ❌     | Single national rule assumed; no residence/work-location jurisdictions (target §3.6).            |
| 37  | **Country pay practices** (13th/14th month, holiday allowance, shift/on-call) | ❌     | None; no scheduled/input-driven premium components (target §4.6).                                |
| 38  | **Minimum-wage compliance check**                                             | ❌     | No post-compute floor check (target §4.6).                                                       |
| 39  | **Benefits-in-kind / perquisites taxation**                                   | ❌     | `BENEFIT` type exists but no taxable-value-to-income link (target §4.6).                         |
| 40  | **Garnishments / court orders**                                               | ❌     | No priority/protected-earnings model (target §5.7).                                              |
| 41  | **Idempotent compute / single-employee reprocess / dry run**                  | ❌     | `calculate` is a one-shot mock; no reprocess, no test run (target §7.5).                         |
| 42  | **Global employment models (EOR / contractor)**                               | ❌     | Employee-only; no classification, contractor invoices, or multi-entity aggregation (target §18). |
| 43  | **Onboarding / opening YTD balances / parallel run**                          | ❌     | No migration tooling; mid-year go-live tax would be wrong (target §19).                          |
| 44  | **Notifications / webhook events**                                            | ❌     | No payroll lifecycle events or publish workflow (target §20).                                    |
| 45  | **Pay-equity / compliance assurance reporting**                               | ❌     | None (target §21).                                                                               |

**Tally:** ✅ 8 · 🟡 9 · ❌ 28.

---

## 4. Detailed gaps (grouped)

### 4.1 🔴 Critical — the core is mocked, not computed

The single most important gap: **`POST /payroll/runs/:id/calculate` does not
calculate.** In `payroll-runs.ts` it flips status to `REVIEW` and assigns
**hardcoded** `totalGross: 4800000`, `totalDeductions: 614400`, etc. via
`setTimeout`. Payslip earnings/deductions in the detail handler are fixed literals
(`BASIC 50000`, `HRA 20000`, `PF 6000`, `TDS 6600`) regardless of the employee's
actual salary config or attendance.

Consequence: the formula engine (`computeComponentBreakdown`) is only used for the
**preview** in salary-component/pay-group UI, **not** for actual run computation.
There is no server-side (or mock-server-side) pipeline that: pulls each included
employee's comp assignment → applies proration from attendance/LOP → runs the
component graph → computes statutory/tax → produces real payslip lines and run totals.

**This must be built first** — everything statutory/global depends on a real compute path.

### 4.2 🔴 Critical — India is hardcoded into the model

- `EmployeeSalary.bankIfscCode` (and `bankName/bankAccountNumber`) bake India's bank
  schema into the **type** and the assignment form. A US/UK/EU employee cannot be
  represented.
- Currency is a free-text `string` on `PayGroup`/`EmployeeSalary`, with amounts as
  plain `number` (rupee-assumed). No legal entity, no country, no FX.
- Statutory items (PF, ESI, PT, TDS) appear only as **example seed components** with
  `IF()` formulas (`phase2api.md`). That is a clever stopgap but **cannot** express
  progressive income-tax slabs, YTD cumulative ceilings, regimes, or the
  employer/employee contribution split.

### 4.3 🟠 Statutory & tax engine — entirely absent

No tax regime, no slab table, no contribution scheme, no exemption/declaration model,
no YTD. `taxable: boolean` on a component is the **only** tax-awareness in the system,
and nothing consumes it. See target §5.

### 4.4 🟠 Employer cost / CTC integrity

Without an `EMPLOYER_CONTRIBUTION` component type, employer PF/insurance/gratuity
either get miscoded as DEDUCTION (wrongly reducing net) or BENEFIT (losing
contribution math). CTC = net + employee deductions + employer contributions is not
representable, so true cost reporting and accurate payslips are impossible. See target §4.1.

### 4.5 🟠 Payroll inputs not wired

`workingDays/presentDays/leaveDays/lopDays` exist on the payslip type but are static
mock values. Attendance LOP, leave, and overtime from those modules do not feed the
run. No bulk input import. No structured variable pay. See target §6.

### 4.6 🟡 Lifecycle depth

- Only a **regular monthly** run. No off-cycle, bonus, arrears, reversal, or FnF.
- **Single-step approval**; no maker-checker enforcement, no multi-level, no
  variance/anomaly review (the `summary.warnings` array is returned empty).
- `mark-paid` is a status flip with a free-text reference — no bank file, no payout,
  no per-payslip payment status reconciliation.

### 4.7 🟡 Documents, accounting, filing — none

No configurable payslip templates / multi-language, no PDF/email distribution, no tax
forms (Form 16/W-2/P60), no GL journal or cost-center export, no statutory returns
(ECR/ESI/24Q/RTI). See target §10–§12.

### 4.8 🟡 Loans, claims, declarations, FnF

No loan/advance EMI module, no reimbursement claim lifecycle, no employee tax
declaration/proofs, no full-and-final settlement. See target §5.6, §6.1, §6.2, §13.

### 4.9 🟠 Global-completeness domains (every-aspect)

Required for a true global system, none present today:

- **Multi-jurisdiction tax** per employee (residence + work locations) — target §3.6.
- **Country pay practices**: 13th/14th-month pay, holiday allowance, shift/on-call
  premiums, overtime multipliers, minimum-wage checks, benefits-in-kind — target §4.6.
- **Garnishments / court orders** with priority ordering + protected-earnings floor — target §5.7.
- **Idempotency, single-employee reprocess, dry/test runs** — target §7.5.
- **Global employment models**: contractor (invoice/payout) and **EOR**, worker
  classification, multi-entity cost aggregation — target §18.
- **Onboarding & migration**: opening **YTD balances**, historical import,
  **parallel run** reconciliation, pay-run calendar/cutoffs — target §19.
- **Notifications & webhook events** + payslip publish workflow — target §20.
- **Pay-equity / compliance assurance reporting** + data residency/retention — target §21.

### 4.10 🟢 Minor / polish

- Pay schedules aren't deeply tied to period-boundary and pay-date computation.
- Export is a static CSV string, not a real payroll register.
- Payroll-specific actions aren't separately permissioned or specifically audited.

---

## 5. Risks & implications

| Risk                               | Impact                                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Going live with **mocked compute** | Numbers shown are not derived from inputs; any real demo with a non-default employee breaks the illusion.                                           |
| **India-baked types**              | Adding a second country later forces a breaking migration of `EmployeeSalary`, `PayGroup`, and the bank/assignment UI. Cheaper to de-Indianize now. |
| **Float money**                    | Rounding drift across components/statutory; reconciliation failures. Move to minor-units before volume.                                             |
| **No employer-contribution type**  | CTC/payslip math is structurally wrong for any statutory country; retrofitting the type touches every payslip surface.                              |
| **No config versioning**           | A mid-year statutory change would rewrite history; need effective-dated packs + run pinning before real statutory data lands.                       |

---

## 6. Recommended roadmap (sequenced for Step 86+)

Ordered so each phase unblocks the next; every endpoint is **MSW-first** per
CLAUDE.md §22 (author in `phase2api.md`/`newreqphase3.md`, then handler, then types).

### P0 — De-Indianize & make compute real _(foundation — do first)_

1. **Real calculation pipeline in MSW:** `calculate` actually iterates included
   employees, runs `computeComponentBreakdown` per their comp assignment, applies a
   proration factor, and produces real payslip lines + run totals. _(Reuses the
   existing engine — mostly handler work.)_
2. **`EMPLOYER_CONTRIBUTION` + `VARIABLE` component types** (type + constants + UI badge + payslip block).
3. **Country / LegalEntity + currency minor-units**: introduce `country`, default
   currency per entity, store money as integer minor units; format via locale.
4. **Per-country bank schema**: replace hardcoded `bankIfscCode` with a country-driven
   bank-field schema rendered by `DynamicForm`.
5. **Config-driven proration** (calendar/working-days/fixed-30) applied in compute.

### P1 — Statutory engine

6. **Versioned StatutoryPack** model + run pinning.
7. **Tax regimes + `SLAB()` formula function** (progressive tax as data).
8. **Contribution schemes** (employee+employer split, wage-base tags, ceilings).
9. **YTD ledger** + payslip YTD block + tax true-up.
10. **Wire real inputs**: attendance LOP / leave / overtime → proration & OT pay.

### P2 — Inputs, lifecycle & controls

11. **Loans/advances** (EMI schedule + recovery + FnF carryover).
12. **Reimbursement claims** lifecycle; structured **variable pay/bonus**.
13. **Run types**: off-cycle, bonus, arrears, reversal, **FnF** (gratuity, leave
    encashment, notice recovery).
14. **Multi-level approvals + maker-checker + variance review**; granular
    `payroll:*` permissions; payroll-specific audit entries.
    14a. **Country pay practices** (13th/14th-month, holiday allowance, shift/on-call,
    OT multipliers, minimum-wage check, benefits-in-kind) + **multi-jurisdiction tax**.
    14b. **Garnishments / court orders** (priority + protected-earnings floor).
    14c. **Global employment models**: contractor invoices/payout, **EOR**, worker
    classification, multi-entity cost aggregation.
    14d. **Idempotency / single-employee reprocess / dry-run** in the compute engine.

### P3 — Disbursement, documents, accounting, filing

15. **Disbursement**: configurable bank-file formats + payout status + reconciliation.
16. **Configurable payslip templates** (multi-language, PDF, email distribution).
17. **Tax forms** (Form 16 / W-2 / P60) from YTD + pack.
18. **Accounting**: GL journal + cost centers + export (Tally/QB/Xero/CSV).
19. **Statutory returns/registers** wired into the Reports module.
20. **Employee self-service**: declarations, claims, loan requests, comp statement.
21. **Onboarding & migration tooling**: opening YTD balances, historical import,
    **parallel run** reconciliation, pay-run calendar/cutoffs, sandbox entity.
22. **Notifications & webhook events** + payslip publish workflow.
23. **Compliance assurance reporting**: pay-equity/gender pay gap, data residency/
    retention, audit assurance pack.

### Effort snapshot

| Item                                      | Effort | Leverage                                         |
| ----------------------------------------- | ------ | ------------------------------------------------ |
| Real compute pipeline (P0.1)              | **M**  | Unblocks every real demo; reuses existing engine |
| Employer-contribution type (P0.2)         | **S**  | Fixes CTC/payslip correctness                    |
| Country/entity + minor-units (P0.3)       | **L**  | Touches types broadly — cheapest done early      |
| Bank schema (P0.4)                        | **M**  | Removes the most visible India lock-in           |
| Statutory pack + regimes + YTD (P1)       | **XL** | The "real payroll" milestone                     |
| Disbursement/forms/accounting/filing (P3) | **XL** | Enterprise completeness                          |

---

## 7. Open questions for stakeholders / backend

1. **Demo target country/countries for Step 86?** India-only first, or prove
   multi-country (e.g. India + US) immediately? Determines whether P0.3/P0.4 are in scope now.
2. **Who owns statutory packs** — do we maintain seeded country packs, or is it the
   backend team's data responsibility? Affects how much of §5 we mock vs. defer.
3. **Disbursement scope** — generate bank files only, or integrate a payout provider
   (RazorpayX/Stripe)?
4. **Payslip PDF** — client-side generation vs. server-rendered document service?
5. **Accounting integrations** — which targets matter for the demo (Tally? QuickBooks? CSV only)?
6. Confirm the backend will adopt the **camelCase** payroll contract already in
   `phase2api.md` so MSW→live is a flag flip (CLAUDE.md §25).

---

## 8. Bottom line

The skeleton is **good** — clean module structure, a genuine formula/dependency
engine, a correct run lifecycle, and self-service payslips. The work ahead is not
re-architecture; it is **(a)** make calculation real instead of mocked, **(b)** lift
India-specific assumptions out of the core into configuration, and **(c)** add the
statutory, input, disbursement, and document layers that turn a payroll _skeleton_
into a payroll _system_. Start with **P0** — it is mostly handler/typing work that
reuses what already exists and unblocks everything else.
