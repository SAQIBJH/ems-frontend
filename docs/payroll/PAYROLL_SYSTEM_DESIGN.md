# Payroll System — End-to-End Design

> **Status:** Design reference (Phase 2 / Step 86 input). No code in this document.
> **Scope:** The complete, globally-configurable payroll platform we are building
> toward — modeled on the depth of Zoho Payroll, RazorpayX Payroll, Gusto, Deel,
> and ADP, adapted to this EMS.
> **Companion:** [`PAYROLL_GAP_ANALYSIS.md`](./PAYROLL_GAP_ANALYSIS.md) — what exists
> today vs. this target, and the roadmap to close the gap.
> **Field casing:** camelCase on the wire (consistent with `phase2api.md` payroll
> domains). **Dates:** `YYYY-MM-DD` on writes (CLAUDE.md §4).

---

## 0. The one rule: configuration over code

Every payroll behaves differently by country, by company, and over time as laws
change. We will **never** hardcode a country rule, a tax slab, a contribution
rate, a rounding policy, or a payslip layout into application logic. All of it is
**data** — authored through admin UI or seeded from a **statutory pack**, stored
per tenant + legal entity, versioned with effective dates, and consumed by a
generic calculation engine.

The litmus test for any feature: _"Could a tenant operating in a country we have
never seen run correct payroll by only entering configuration — no engineering
change?"_ If the answer is no, the rule has leaked into code and must be moved to
configuration.

What this forbids:

- `if (country === 'IN') pf = basic * 0.12` → ❌ rate, cap, and applicability are config.
- A fixed payslip template per country → ❌ templates are configurable, multi-language.
- Hardcoded `bankIfscCode` on the salary record → ❌ bank fields are a per-country schema.
- A `taxAmount = slab(income)` function with Indian slabs baked in → ❌ slabs are a versioned table.

What this requires (the four pillars):

1. **A generic calculation engine** that resolves components by dependency graph
   and evaluates formulas — already partially built (`formula.utils.ts`).
2. **A statutory/tax engine** that reads versioned, country-scoped tables (slabs,
   rates, caps, thresholds) — _not yet built_.
3. **A localization layer** (country, currency, locale, bank schema, pay calendar,
   fiscal year) — _not yet built_.
4. **A data-driven document layer** (payslip templates, statutory forms) — _not yet built_.

---

## 1. Design principles

| Principle                                | Meaning                                                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Statutory-as-data**                    | Tax slabs, contribution rates, caps, thresholds, rounding live in versioned config tables, scoped by country + effective date.      |
| **Multi-everything**                     | Multi-country, multi-currency, multi-legal-entity, multi-pay-frequency, multi-language — all within one tenant.                     |
| **Effective-dated & immutable history**  | Comp, statutory tables, and pay structures are versioned. Past payslips never change; corrections are arrears/off-cycle, not edits. |
| **Compute is pure & reproducible**       | Given the same inputs + config snapshot, a run reproduces identical numbers. Each run **pins** the config version it used.          |
| **Gross-to-net is an explicit pipeline** | Earnings → statutory/tax → deductions → net, with a deterministic, inspectable order.                                               |
| **Employer cost is first-class**         | CTC, employer contributions, and net pay are distinct concepts, modeled separately — not conflated.                                 |
| **Audit-first**                          | Every state transition, override, and approval is logged with actor, timestamp, before/after.                                       |
| **Separation of duties**                 | Maker ≠ checker. Initiating, adjusting, approving, and disbursing are distinct permissions.                                         |
| **Self-service by default**              | Employees manage declarations, claims, and documents; HR reviews exceptions.                                                        |

---

## 2. Domain model (entity map)

```
Tenant
 └─ LegalEntity (country, currency, fiscalYear, registrationIds)
     ├─ StatutoryPack (versioned, country-scoped)   ← tax slabs, contribution schemes
     ├─ PayCalendar (frequency, period boundaries, payDate rules, holidays)
     ├─ SalaryComponent[] (earning/deduction/employer-contribution/benefit/reimbursement/variable)
     ├─ PayStructure / PayGroup[] (bundle of components + overrides)
     │
     ├─ Employee
     │   ├─ CompensationAssignment (payStructure, annualCtc/rate, effectiveFrom)  ← versioned history
     │   ├─ BankAccount (per-country schema)
     │   ├─ StatutoryProfile (PF#, UAN, SSN, NI#, tax regime, exemption eligibility)
     │   ├─ TaxDeclaration (per fiscal year: investments, HRA, exemptions, proofs)
     │   ├─ Loan/Advance[] (principal, EMI schedule, recovery)
     │   └─ ReimbursementClaim[] (category, amount, proof, approval)
     │
     └─ PayrollRun (period, type, status, configSnapshotRef)
         ├─ PayrollInput[] (attendance/LOP, OT, variable, one-time) per employee
         ├─ Payslip[] (earnings[], deductions[], employerContributions[], YTD, net)
         ├─ Approval[] (level, actor, decision)
         ├─ PaymentBatch (bank file, gateway payout, status)
         └─ AccountingPosting (GL journal lines, cost centers)
```

Relationships that matter:

- A **Payslip** belongs to exactly one **PayrollRun** and one **Employee**, and
  references the **CompensationAssignment** + **StatutoryPack version** in force
  for that period. It is **immutable** once the run is `PAID`.
- A **CompensationAssignment** is never edited in place — a revision closes the
  prior record (`effectiveTo = newEffectiveFrom − 1`) and opens a new one. Mid-period
  revisions generate **arrears** in the next run.
- **Employer contributions** (e.g. employer PF, employer social security, gratuity
  accrual) are **not** deductions from the employee — they are cost components that
  roll into CTC and the accounting posting, but never reduce net pay.

---

## 3. Country & localization layer

> _This entire section is **not yet built** and is the single biggest gap for going global._

### 3.1 LegalEntity

A tenant can operate multiple legal entities, each in a country with its own
currency, fiscal year, registrations, and statutory pack.

```jsonc
{
  "id": "le_...",
  "name": "Acme India Pvt Ltd",
  "country": "IN", // ISO 3166-1 alpha-2
  "currency": "INR", // ISO 4217 — default pay currency
  "fiscalYearStartMonth": 4, // India: April; US/UK config differs
  "timezone": "Asia/Kolkata",
  "locale": "en-IN",
  "registrationIds": {
    // free-form, country-defined keys
    "PF": "MHBAN1234567",
    "ESI": "12345678901234",
    "PAN": "AAAAA1234A",
    "TAN": "MUMA12345B",
  },
  "statutoryPackId": "pack_in_2026",
  "payCalendarId": "cal_in_monthly",
}
```

### 3.2 StatutoryPack (versioned, country-scoped)

The heart of "no hardcode." A pack is a **versioned bundle of statutory rules** for
a country, effective-dated so a mid-year law change is a new version — past runs
keep using the version they pinned.

```jsonc
{
  "id": "pack_in_2026",
  "country": "IN",
  "version": "2026.1",
  "effectiveFrom": "2026-04-01",
  "effectiveTo": null,
  "taxRegimes": [
    /* §5.1 */
  ],
  "contributionSchemes": [
    /* §5.3 — PF, ESI, gratuity */
  ],
  "localTaxes": [
    /* §5.4 — professional tax, LWF, city tax */
  ],
  "rounding": { "mode": "NEAREST", "precision": 0 },
  "proration": { "basis": "CALENDAR_DAYS" }, // or WORKING_DAYS / FIXED_30
  "statutoryComponents": ["PF_EE", "PF_ER", "ESI_EE", "ESI_ER", "PROF_TAX", "TDS"],
}
```

A pack is **seedable**: we ship starter packs for India, US, UK, UAE, Singapore,
etc., and a tenant clones+adjusts. A country we have never seen = author a pack
from the generic primitives, zero code.

### 3.3 Currency & FX

- Each legal entity has a default currency; pay groups may override.
- Multi-currency tenants store a **FX rate table** (date-effective) for reporting
  consolidation. Employees are always paid in their entity/contract currency.
- Money is stored as integer **minor units** (paise/cents) + ISO currency code to
  avoid float drift. Display formatting is locale-driven.

### 3.4 Bank account schema (per country)

Bank fields are **not** a fixed set — they are a country-defined schema. The current
model hardcodes India's `bankIfscCode`; this must become:

```jsonc
// IN
{ "accountName": "...", "accountNumber": "...", "ifsc": "..." }
// US
{ "accountName": "...", "routingNumber": "...", "accountNumber": "...", "accountType": "CHECKING" }
// UK
{ "accountName": "...", "sortCode": "...", "accountNumber": "..." }
// SEPA / intl
{ "accountName": "...", "iban": "...", "bic": "..." }
```

The bank-account form is rendered from the country's field schema (label, regex,
required) — a `DynamicForm` config, not a hardcoded React form.

### 3.5 Pay calendar

```jsonc
{
  "id": "cal_in_monthly",
  "frequency": "MONTHLY", // MONTHLY | SEMI_MONTHLY | BIWEEKLY | WEEKLY
  "periodAnchor": "CALENDAR_MONTH",
  "payDateRule": { "type": "LAST_WORKING_DAY", "offset": 0 },
  "cutoffDay": 25, // attendance/input cutoff
  "holidayCalendarId": "hol_in_2026",
}
```

Frequency drives period boundaries and annual→period divisor (e.g. monthly /12,
biweekly /26, weekly /52, semi-monthly /24).

### 3.6 Work location & multi-jurisdiction tax

An employee is not always taxed in one place. The model must support a **residence
jurisdiction** plus one or more **work-location jurisdictions**, each mapping to a
tax authority:

- **US:** federal + state + sometimes local/city tax; an employee working across
  state lines triggers reciprocity rules.
- **Cross-border / remote:** residence country vs. work country, double-taxation
  treaties, split payroll.
- **India:** professional tax + LWF are **state**-scoped (sub-national).

```jsonc
{
  "employeeId": "...",
  "residenceJurisdiction": "IN-MH", // ISO 3166-2
  "workLocations": [{ "jurisdiction": "IN-KA", "allocationPct": 100 }],
  "taxTreaty": null,
}
```

The statutory engine resolves the **applicable jurisdiction set** for each employee
and applies each jurisdiction's slabs/local taxes from its pack — never assuming a
single national rule.

---

## 4. Compensation building blocks

### 4.1 Salary components — taxonomy

The current model has `EARNING | DEDUCTION | BENEFIT | REIMBURSEMENT`. To model
real payroll correctly we need an explicit **employer-contribution** class and a
**variable** class:

| `type`                  | Affects net?                 | Affects CTC? | Affects employer cost? | Example                                     |
| ----------------------- | ---------------------------- | ------------ | ---------------------- | ------------------------------------------- |
| `EARNING`               | + adds to gross              | yes          | yes                    | Basic, HRA, Special Allowance               |
| `DEDUCTION`             | − reduces gross→net          | no           | no                     | Employee PF, TDS, loan EMI                  |
| `EMPLOYER_CONTRIBUTION` | no                           | yes          | yes                    | Employer PF, employer ESI, gratuity accrual |
| `BENEFIT`               | no (informational)           | yes          | yes                    | Insurance premium, ESOP value               |
| `REIMBURSEMENT`         | + (non-taxable, claim-based) | optional     | yes                    | Fuel, telephone, internet                   |
| `VARIABLE`              | + (period-specific)          | partial      | yes                    | Incentive, commission, bonus                |

> **Why this matters:** today employer PF would have to be miscoded as a DEDUCTION
> (wrong — it would reduce net pay) or a BENEFIT (loses contribution semantics).
> A first-class `EMPLOYER_CONTRIBUTION` type makes CTC = net + employee deductions
>
> - employer contributions provable.

### 4.2 Calculation types & formula language

Already implemented (keep + extend): `FLAT | PERCENTAGE | FORMULA`.

**Formula language** (per `phase2api.md §1.1`, implemented in `formula.utils.ts`):

- **Variables:** any component `code` (uppercase), plus built-ins `CTC` (monthly),
  `GROSS`, `NET`. Extend with: `LOP_DAYS`, `PAID_DAYS`, `TOTAL_DAYS`, `WORKING_DAYS`,
  `YTD_<CODE>` (year-to-date), `OT_HOURS`, and statutory built-ins (`PF_WAGE_CEILING`).
- **Functions:** `MIN, MAX, IF, ROUND(n[,d]), FLOOR, CEIL, ABS`. Extend with
  `SLAB(value, tableCode)` to evaluate a configured bracket table (so progressive
  tax is config, not nested `IF`s), and `CLAMP(v, lo, hi)`.
- **Order:** topological sort by dependency graph; cycles rejected
  (`400 CIRCULAR_DEPENDENCY`). Already implemented via `resolveComponentOrder`.

### 4.3 Component attributes that must be configurable

Beyond today's fields, each component needs:

- `prorate: boolean` + `prorationBasis` override (does LOP reduce this component?).
- `taxable: boolean` (have) **plus** `taxabilityRule` (e.g. HRA exemption is
  conditional, not a flat boolean) and `exemptionScheme` reference.
- `statutoryTag` (e.g. `PF_WAGE`, `ESI_WAGE`) so the statutory engine knows which
  earnings form each contribution's wage base — _the missing link between earnings
  and statutory calculation._
- `roundingOverride`, `displayGroup` (payslip section), `glAccountCode`,
  `costCenterRule`.
- `frequency` (per-run vs annual vs one-time) and `payInPeriods` (e.g. bonus only
  in month 12).

### 4.4 Pay structures / pay groups / CTC templates

`PayGroup` exists (bundle of components + group overrides + currency + schedule).
Extend toward a **CTC template** concept:

- A pay group defines the component set and the **CTC composition logic** (how an
  `annualCtc` is split into components — e.g. Basic = 40% CTC, HRA = 50% Basic,
  Special Allowance = balancing figure).
- Support **Flexible Benefit Plans (FBP)**: a pool amount the employee allocates
  across declared components (e.g. choose LTA vs. more Special Allowance) within
  caps — a global best practice for tax optimization.

### 4.5 Employee compensation assignment & history

`EmployeeSalary` exists with `annualCtc`, `effectiveFrom/To`, `history[]`. Keep, and:

- Store **rate type** (annual / monthly / hourly / daily) — hourly is essential for
  many countries/contractors; today only annual CTC is modeled.
- Every revision is a new effective-dated record (already the contract). A revision
  with a **past** `effectiveFrom` must flag **arrears** for the next run.

### 4.6 Country pay practices (configurable, not assumed)

Real countries have pay constructs that must be **configuration**, switched on per
legal entity — never hardcoded or assumed absent:

| Practice                               | Where common                                | Model as                                                                                     |
| -------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **13th / 14th month pay**              | Philippines, Brazil, much of LATAM & Europe | A `VARIABLE`/scheduled component paid in configured periods, with its own accrual + tax rule |
| **Holiday allowance** (e.g. 8%)        | Netherlands, parts of EU                    | Accrued % of gross, paid on a configured month                                               |
| **Shift differential / night premium** | Manufacturing, healthcare, global           | Input-driven component: hours × differential rate                                            |
| **On-call / standby pay**              | Ops, healthcare                             | Flat or hourly component from input                                                          |
| **Overtime variants**                  | Everywhere                                  | Configurable multipliers (1.5×, 2×, weekend, holiday) on an hourly base                      |
| **Minimum-wage compliance**            | Everywhere                                  | A post-compute **check** that flags/raises pay below the jurisdiction floor                  |
| **Benefits-in-kind / perquisites**     | India (perquisites), UK (P11D), global      | Non-cash `BENEFIT` with a **taxable value** that adds to taxable income but not net          |
| **Allowances** (meal, transport, WFH)  | Global                                      | Earnings with per-country exemption caps                                                     |

The point: a tenant in a new country enables the practices that apply via config —
the engine already supports the primitives (scheduled components, input-driven
components, post-compute checks).

---

## 5. Statutory & tax engine (configurable)

> _Not yet built — this is the largest functional gap. Today, statutory items can
> only be approximated as `FORMULA` components with `IF()`, which does not scale to
> progressive slabs, YTD cumulative tax, regimes, or employer/employee splits._

### 5.1 Tax regimes & progressive slabs

A regime is a named, versioned set of brackets + applicable exemptions/deductions.
Example (India new vs old regime; US federal brackets; UK PAYE bands — all the same shape):

```jsonc
{
  "code": "IN_NEW_REGIME",
  "fiscalYear": "2026-27",
  "currency": "INR",
  "standardDeduction": 75000,
  "slabs": [
    { "from": 0, "to": 400000, "rate": 0 },
    { "from": 400000, "to": 800000, "rate": 5 },
    { "from": 800000, "to": 1200000, "rate": 10 },
    { "from": 1200000, "to": null, "rate": 30 },
  ],
  "surcharge": [{ "thresholdAnnual": 5000000, "rate": 10 }],
  "cess": { "rate": 4 },
  "allowedExemptions": ["HRA", "LTA", "80C", "80D", "STD_DEDUCTION"],
}
```

The engine computes **annual projected tax** → divides across remaining periods →
trues up using **YTD** actuals each run (so tax is smooth and self-correcting). The
`SLAB()` formula function reads these tables; no Indian/US logic in code.

### 5.2 Exemptions, declarations & proofs

- **TaxDeclaration** per employee per fiscal year: HRA (rent paid, metro flag),
  LTA, Section 80C/80D investments (or US W-4 allowances, UK tax code), with proof
  upload + verification status.
- Engine applies declared exemptions to reduce taxable income; unverified proofs
  can be ignored in the final quarter ("proof window") — a configurable policy.

### 5.3 Statutory contribution schemes (employer + employee split)

```jsonc
{
  "code": "IN_EPF",
  "name": "Employees' Provident Fund",
  "wageBaseTag": "PF_WAGE", // which earnings form the base (§4.3)
  "wageCeiling": 15000, // configurable cap
  "employee": { "rate": 12, "component": "PF_EE" },
  "employer": { "rate": 12, "component": "PF_ER", "split": { "EPS": 8.33, "EPF": 3.67 } },
  "applicability": "GROSS_BELOW_CEILING_OPTIONAL",
}
```

Covers India (PF, ESI, gratuity), US (Social Security, Medicare, FUTA/SUTA, 401k),
UK (NI employee/employer, pension auto-enrolment), UAE (GPSSA for nationals), etc.
— all the **same shape**, different data.

### 5.4 Local / sub-national taxes

Professional Tax (India, state slabs), Labour Welfare Fund, US state income tax,
city tax — modeled as `localTaxes[]` with their own slab/flat tables, scoped by a
sub-jurisdiction code on the employee's work location.

### 5.5 Year-to-date (YTD) ledger

The engine maintains per-employee, per-fiscal-year cumulative totals (gross,
taxable, each statutory contribution, tax deducted). Required for correct tax
true-up, statutory ceilings ("PF only on first ₹X cumulatively"), and tax forms.
**Not modeled today** — payslips have no YTD block.

### 5.6 Full & final settlement (FnF)

On exit: pro-rated salary to last working day, **leave encashment**, **gratuity**
payout (eligibility + formula), **notice-period recovery**, recovery of outstanding
**loan** balances, and final tax recompute. A dedicated FnF run type.

### 5.7 Garnishments, court orders & statutory recoveries

Legally-mandated deductions that are **not** voluntary and follow strict rules:

- **Types:** child/spousal support, court attachment of earnings, tax authority
  levies, defaulted-loan recovery orders.
- **Priority ordering:** when net pay can't cover all orders, country rules dictate
  which order is satisfied first — modeled as a configurable **priority + protected-
  earnings floor** (a minimum take-home the employee must retain).
- **Caps:** percentage-of-disposable-income caps (e.g. US CCPA limits).

```jsonc
{
  "type": "CHILD_SUPPORT",
  "priority": 1,
  "amount": { "kind": "PERCENT_OF_DISPOSABLE", "value": 20 },
  "protectedEarningsFloor": 25000,
  "effectiveFrom": "2026-04-01",
  "effectiveTo": null,
  "reference": "COURT/2026/1234",
}
```

The engine applies these **after statutory deductions, before voluntary ones**,
honoring priority and the floor.

---

## 6. Payroll inputs

Everything that varies per period per employee. Today the run uses **hardcoded
totals** — none of these are actually wired.

| Input                    | Source                 | Effect                                             |
| ------------------------ | ---------------------- | -------------------------------------------------- |
| **Attendance / LOP**     | Attendance module      | Loss-of-pay days → proration of payable components |
| **Leave**                | Leave module           | Paid leave vs LOP; leave encashment balance        |
| **Overtime**             | Attendance / manual    | OT hours × OT rate (configurable multiplier)       |
| **Variable pay**         | Manual / import        | Incentives, commission, performance pay            |
| **Reimbursement claims** | Claims workflow (§6.1) | Approved, non-taxable payouts                      |
| **Loan/advance EMI**     | Loan module (§6.2)     | Scheduled recovery deduction                       |
| **One-time adjustments** | Run UI                 | Ad-hoc bonus/deduction (exists)                    |
| **Bulk import**          | CSV/Excel              | Mass variable inputs per period                    |

### 6.1 Reimbursement claims

`REIMBURSEMENT` type exists, but no **claim lifecycle**: submit → approve → attach
to next run → pay → mark settled, with category caps and proof. Needed for a real
reimbursement experience.

### 6.2 Loans & advances

Principal, interest method, **EMI schedule**, per-run recovery, foreclosure,
outstanding balance carried to FnF. Today "salary advance recovery" can only appear
as a manual one-time deduction with no schedule or balance tracking.

---

## 7. Payroll processing engine

### 7.1 Run lifecycle (state machine)

Existing: `DRAFT → CALCULATING → REVIEW → APPROVED → PAID | CANCELLED`. Keep, and
make explicit the guarded transitions + who can perform them:

```
DRAFT ──initiate──▶ CALCULATING ──(engine)──▶ REVIEW
REVIEW ──adjust──▶ REVIEW (re-calc deltas)
REVIEW ──approve(L1..Ln)──▶ APPROVED
APPROVED ──disburse/markPaid──▶ PAID
any(≠PAID) ──cancel──▶ CANCELLED
PAID ──correction──▶ (new OFF_CYCLE/ARREARS run; never edit a paid run)
```

### 7.2 Run types

`REGULAR | OFF_CYCLE | BONUS | ARREARS | FNF | REVERSAL`. Today only the regular
monthly run exists. Off-cycle/bonus/FnF are first-class needs.

### 7.3 Calculation pipeline (per employee, deterministic order)

1. Resolve compensation assignment + pinned config snapshot for the period.
2. Compute **proration factor** from attendance/LOP (basis from pay calendar).
3. Evaluate **earnings** (component graph, topological order) × proration.
4. Compute **statutory wage bases** from tagged earnings; evaluate **contributions**
   (employee + employer) against schemes + ceilings.
5. Compute **income tax** via regime engine using YTD + declarations + projection.
6. Apply **deductions** (statutory employee + loans + voluntary).
7. Add **variable pay, reimbursements, one-time additions**; subtract one-time deductions.
8. Compute `grossEarnings`, `totalDeductions`, `employerCost`, `netPay`.
9. Update **YTD ledger**; emit **warnings** (no salary config, negative net, ceiling
   breaches, missing bank details).
10. Persist payslip immutably with `configSnapshotRef`.

### 7.4 Reproducibility & locking

A run **pins** the statutory pack version, comp assignments, and inputs at
calculation time. Re-running with the same snapshot yields identical numbers. Once
`PAID`, the run and its payslips are locked.

### 7.5 Idempotency, partial reprocessing & dry runs

- **Idempotent calculation:** re-running `calculate` on the same run+snapshot
  replaces results deterministically; it never double-applies.
- **Single-employee reprocess:** after fixing one employee's input/config, recompute
  **just that payslip** without re-running the whole batch.
- **Partial-failure isolation:** if one employee errors (e.g. missing config), the
  run still completes for everyone else and lists the failure in `warnings` — never
  an all-or-nothing crash.
- **Dry run / test run:** compute a run in a sandbox mode that produces numbers and
  variance output **without** moving money or publishing payslips — essential for
  verification and parallel runs (§19).

---

## 8. Review, approvals & controls

- **Maker-checker:** the initiator cannot approve their own run (configurable).
- **Multi-level approval:** N configurable levels (e.g. HR → Finance → CEO above a
  threshold). Today: single `approve`.
- **Variance / anomaly checks:** flag employees whose net moved >X% vs last period,
  new joiners, terminations, negative net, zero-pay — surfaced in REVIEW.
- **Segregation of duties:** distinct permissions for `payroll:initiate`,
  `payroll:adjust`, `payroll:approve`, `payroll:disburse`.
- **Audit trail:** every transition/override/approval logged (actor, time, before/after).

---

## 9. Disbursement & payments

> _Not built — `mark-paid` is a manual status flip with a free-text reference._

- **Bank file generation** per country format: India **NACH/H2H**, US **ACH (NACHA)**,
  EU **SEPA pain.001**, UK **Bacs**, intl **SWIFT MT103**. Format is config-driven.
- **Payout integration** (optional): RazorpayX/Stripe/wise-style payout APIs with
  per-employee status + reconciliation.
- **Payment status lifecycle:** `PENDING → PROCESSING → PAID | FAILED | RETURNED`
  per payslip, reconciled back from bank/gateway.
- **Multi-currency disbursement** for global teams (entity/contract currency).

---

## 10. Payslips & documents

- **Payslip model** (exists): earnings[], deductions[], one-time[], gross/net,
  working/present/leave/LOP days, status, payment ref. **Add:** employer
  contributions block, **YTD block**, exemption breakup, currency minor-units.
- **Templates:** payslip layout is **configurable** (sections, logo, fields,
  multi-language), not a fixed React component per country.
- **Distribution:** generate PDF, email to employee, self-service download, bulk
  publish on run approval.
- **Statutory forms:** **Form 16 / Form 12BA** (India), **W-2 / 1099** (US),
  **P60 / P45** (UK), **payslip + EOSB statement** (UAE) — generated from YTD + pack.

---

## 11. Accounting & cost integration

- **GL journal posting:** each run produces double-entry journal lines (salary
  expense, statutory payable, net payable to bank), mapped via component
  `glAccountCode` + `costCenterRule`.
- **Cost center / department allocation** of payroll cost.
- **Employer cost (true CTC) reporting:** net + employee deductions + employer
  contributions + benefits, per employee/department/entity.
- **Accounting export:** Tally / QuickBooks / Xero / NetSuite / generic CSV+journal.

---

## 12. Statutory filing & reports

- **Returns/challans per country:** India **PF ECR**, **ESI return**, **PT return**,
  **TDS 24Q / Form 26Q**, **Form 16**; US **941/940, W-2**; UK **RTI FPS/EPS** — each
  an exporter driven by the statutory pack, not bespoke code.
- **Registers/MIS:** payroll register, salary register, statutory register,
  bank-advice, variance report, headcount-cost, CTC vs net reconciliation.
- Wire into the existing **Reports** module (payroll category already scaffolded).

---

## 13. Employee self-service

- **Payslips:** list + detail + PDF (exists: `MyPayslipsPage`).
- **Tax declarations:** submit/edit investments & exemptions, upload proofs, see
  projected tax under each regime, choose regime.
- **Reimbursement claims:** submit with proof, track status.
- **Loan requests:** request, view EMI schedule & balance.
- **Comp statement:** annual CTC breakup; **tax forms** download (Form 16/W-2/P60).

---

## 14. Security, permissions & data privacy

- **RBAC:** `SUPER_ADMIN`, `HR_ADMIN` configure; `MANAGER` limited; `EMPLOYEE`
  self-only; `AUDITOR` read-only. Plus granular payroll permissions (§8).
- **Field-level sensitivity:** bank details, PAN/SSN, salary — access-logged, masked
  by default, revealed on explicit permission.
- **PII & retention:** payroll data retention policy per country; right-to-erasure
  with statutory-retention exceptions.
- **Payslip access audit:** who viewed/downloaded which payslip.

---

## 15. Target API surface

Existing (MSW, `phase2api.md` Domains 1–3) — keep:

```
# Settings
GET/POST/PATCH/DELETE /payroll/components
GET/POST/PATCH/DELETE /payroll/groups
GET                   /payroll/schedules

# Employee
GET/POST/PATCH        /payroll/employees/:id/salary
GET                   /payroll/employees/:id/payslips[/:payslipId]

# Operations
GET/POST              /payroll/runs
POST                  /payroll/runs/:id/calculate | approve | cancel
PATCH                 /payroll/runs/:id/mark-paid
GET/PATCH             /payroll/runs/:id/payslips[/:slipId]
GET                   /payroll/runs/:id/export
```

New (to author in `phase2api.md` / `newreqphase3.md`, MSW-first per CLAUDE.md §22):

```
# Localization
GET/POST/PATCH        /payroll/legal-entities
GET/POST/PATCH        /payroll/statutory-packs   (versioned)
GET/POST/PATCH        /payroll/pay-calendars
GET                   /payroll/countries/:code/bank-schema

# Statutory & tax
GET/POST/PATCH        /payroll/tax-regimes
GET/POST/PATCH        /payroll/contribution-schemes
GET/POST/PATCH        /payroll/employees/:id/tax-declaration
GET                   /payroll/employees/:id/ytd?fy=

# Inputs
GET/POST              /payroll/employees/:id/loans
GET/POST/PATCH        /payroll/reimbursement-claims
POST                  /payroll/runs/:id/inputs/import

# Run types & approvals
POST                  /payroll/runs (type=OFF_CYCLE|BONUS|ARREARS|FNF|REVERSAL)
POST                  /payroll/runs/:id/approvals/:level
GET                   /payroll/runs/:id/variance

# Disbursement
POST                  /payroll/runs/:id/payment-batch
GET                   /payroll/runs/:id/bank-file?format=NACH|ACH|SEPA|BACS
GET                   /payroll/payment-batches/:id/status

# Documents & accounting
GET                   /payroll/employees/:id/tax-form?fy=&type=FORM16|W2|P60
GET                   /payroll/runs/:id/journal
GET                   /payroll/runs/:id/statutory-return?type=ECR|24Q|RTI
```

---

## 16. The no-hardcode contract (checklist)

Any payroll PR must satisfy:

- [ ] No country code branches in calculation/UI logic (`if country === …`).
- [ ] No tax rate, slab, ceiling, or contribution % literal in code — all from pack.
- [ ] Bank/statutory ID fields rendered from a country schema, not a fixed form.
- [ ] Payslip/tax-form layout from a template, not a per-country component.
- [ ] Run pins a config version; recompute is reproducible.
- [ ] Money is minor-units + currency; formatting is locale-driven.
- [ ] Employer contributions modeled distinctly from employee deductions.
- [ ] New statutory rule = new pack data + (if needed) a generic primitive, not a special case.

---

## 17. Phasing (build toward this)

See [`PAYROLL_GAP_ANALYSIS.md`](./PAYROLL_GAP_ANALYSIS.md) §6 for the sequenced
roadmap mapped to BUILD_PLAN Step 86+. In short:

- **P0 — De-Indianize the core:** employer-contribution component type, country/
  legal-entity + currency minor-units, per-country bank schema, config-driven
  proration. (Unblocks everything; no statutory depth yet.)
- **P1 — Statutory engine:** versioned packs, `SLAB()` function, regimes,
  contribution schemes, YTD ledger, real input wiring (attendance/LOP).
- **P2 — Inputs & lifecycle:** loans, claims, off-cycle/bonus/arrears/FnF, multi-level approvals.
- **P3 — Disbursement, documents, accounting, filing:** bank files, payslip
  templates, tax forms, GL export, statutory returns.

> The domains in §18–§21 below are **global-completeness** requirements; they slot
> into P2 (employment models, garnishments, country pay practices) and P3
> (migration tooling, events, compliance reporting). They are part of the
> every-aspect target even though earlier phases can ship without them.

---

## 18. Global employment models (EOR & contractors)

Going global means paying more than salaried local employees. The platform must
represent multiple **worker types** under one tenant:

| Worker type                  | Paid via                                                                        | Key differences                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Employee** (own entity)    | Full payroll run, statutory, payslip                                            | Everything in this doc                                                    |
| **Contractor / freelancer**  | Invoice-based payout, **no statutory/tax withholding** (usually)                | Classification, invoices, 1099/withholding-tax-at-source where applicable |
| **EOR (Employer of Record)** | Paid through a partner entity in a country where the tenant has no legal entity | Partner handles local statutory; we aggregate cost & reporting            |

Requirements:

- **Worker classification** field on the employee/worker record, driving which
  pipeline applies (full payroll vs. contractor payout).
- **Contractor invoices**: submit/approve/pay, optional withholding-tax-at-source,
  multi-currency payout.
- **Multi-entity aggregation**: a global view of total people cost across entities,
  currencies, and worker types (consolidated via the FX table, §3.3).
- **Misclassification guardrails**: surface risk flags (contractor working like an
  employee) — a compliance concern for global ops.

---

## 19. Onboarding, migration & parallel run

A real payroll is rarely greenfield — tenants migrate mid-year from another system.

- **Opening YTD balances:** import each employee's year-to-date gross, taxable,
  statutory contributions, and tax-deducted so the **first** run computes correct
  cumulative tax and ceilings (§5.5). Without this, mid-year go-live tax is wrong.
- **Historical payslip import:** load prior payslips for continuity and tax forms.
- **Parallel run:** process the first 1–2 cycles **alongside** the legacy system in
  dry-run mode (§7.5) and **reconcile** differences employee-by-employee before
  cutover — the standard payroll go-live safety net.
- **Pay-run calendar & cutoffs:** a published schedule of input cutoffs, processing,
  approval, and pay dates per entity, with reminders.
- **Sandbox/test entity:** a non-production space to validate config and packs.

---

## 20. Notifications, events & integrations

- **Lifecycle notifications:** input-cutoff reminders, run-ready-for-review,
  approval requests, payslip-published, payment-failed.
- **Payslip publish workflow:** payslips become visible to employees only when the
  run is approved/published — not before.
- **Event/webhook catalogue** (for downstream systems & the BFF):
  `payroll.run.created|calculated|approved|paid`, `payslip.published`,
  `payment.failed`, `salary.revised`, `claim.approved` — so accounting, BI, and
  HRIS integrations react without polling.
- **Integration targets:** accounting (§11), BI/Reports (§12), HRIS/attendance
  (inputs, §6), payout providers (§9).

---

## 21. Compliance & assurance reporting

Beyond statutory returns (§12), a global platform owes **assurance** outputs:

- **Pay-equity / gender pay-gap reporting** (UK gender pay gap, EU pay-transparency
  directive, US EEO-style) — computed from comp + demographics.
- **Diversity pay analysis** by department/level/location.
- **Data residency & retention** per country (some jurisdictions require payroll data
  to stay in-country); retention windows with statutory-hold exceptions (ties to §14).
- **Audit assurance pack:** immutable run history, approval chain, config-version
  pins, and override log — exportable for internal/external audit.

```

```
