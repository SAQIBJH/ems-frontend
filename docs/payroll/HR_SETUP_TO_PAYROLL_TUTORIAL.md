# Setup → Payroll: HR Admin Tutorial

> A hands-on, field-by-field guide for the HR admin. We build payroll for **one
> employee — Aman, ₹12,00,000/yr CTC, India** — from a blank slate to a finished,
> paid payslip. Every field is explained: what it does, what happens when you
> enable vs disable it, and **exactly which key connects to which**.
>
> Roles: everything here is **HR_ADMIN / SUPER_ADMIN**. Where a step needs a
> specific payroll permission, it's called out.

---

## The big picture — what we're building

```
Step 1  Salary Components   →  the building blocks (BASIC, HRA, PF, TDS…)
Step 2  Pay Group           →  bundle the blocks into a reusable template ("India Staff")
Step 3  Assign Compensation →  give Aman that pay group + ₹12L CTC
Step 4  Run Payroll         →  calculate → review → approve → pay → publish
```

A useful mental model of how the pieces connect (read this once before starting):

```
EARNINGS (BASIC, HRA…)              STATUTORY PACK (country rules)
   │  carry a statutoryTag             │  contributionSchemes[].wageBaseTag
   │  e.g. BASIC.statutoryTag="PF_WAGE"┘  e.g. IN_EPF.wageBaseTag="PF_WAGE"
   │
   └──► the engine sums earnings whose tag == a scheme's wageBaseTag
        = that scheme's WAGE BASE  →  rate% →  posts to the scheme's
        employee.component (e.g. "PF")  and  employer.component (e.g. "PF_ER")
```

**One rule to remember:** a `statutoryTag` goes on the **earnings that form a base**
(Basic), _not_ on the deduction itself. The deduction component (PF) is just where the
computed amount **lands**, matched by its **code**.

---

## Before you start (one-time, already done in the demo)

These exist once per company and you normally don't touch them per payroll:

- **Legal entity** — your company in a country (currency, fiscal year). _Settings → Pay & Compliance → Legal Entities._
- **Statutory pack** — the country's tax slabs, PF/ESI rates, professional-tax bands. _Settings → Pay & Compliance → Statutory Packs._ This is the data the engine reads; you only **confirm** the rates are right.

Everything below is what you do to onboard people and pay them.

---

# Step 1 — Salary Components

> _Settings → Pay & Compliance → **Salary Components** → **New component**._
> A component is one line that can appear on a payslip. We'll create six.

Each component opens a drawer. Here is **every field**, what it does, and the
enable/disable effect of each toggle.

### Identity

| Field             | What it does                                                                                 | Notes / "what if wrong"                                                                |
| ----------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Name**          | Human label shown on the payslip (e.g. "Basic Salary").                                      | Free text.                                                                             |
| **Code**          | The machine key other things reference (formulas, the pack, pay groups). `UPPER_SNAKE_CASE`. | **Immutable after creation.** If a formula says `BASIC`, this must be exactly `BASIC`. |
| **Display order** | Position of the line on the payslip (low = top).                                             | Cosmetic only.                                                                         |

### Type — which bucket the line falls into

| Type                      | Meaning                                                                | Affects net pay?                                          |
| ------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| **Earning**               | Money paid to the employee (Basic, HRA).                               | ✅ adds to GROSS                                          |
| **Deduction**             | Money withheld from the employee (PF employee, TDS, professional tax). | ✅ reduces NET                                            |
| **Employer Contribution** | Employer-side **cost** (employer PF).                                  | ❌ **never** reduces net — it's company cost, part of CTC |
| **Benefit**               | Non-cash benefit / perquisite.                                         | ❌ employer cost (may still be taxable)                   |
| **Reimbursement**         | Expense paid back (claims).                                            | Paid, not part of statutory base                          |
| **Variable**              | Amount entered **per run** (incentive, commission).                    | ✅ added at run time, 0 in the structure                  |

> **Why Employer Contribution is separate:** it lets the system prove
> `CTC = net pay + employee deductions + employer cost`. Employer PF is a cost to the
> company, so it must never be subtracted from the employee's take-home.

### Calculation type — how the amount is worked out

| Calculation     | Extra fields it shows                    | Example                          |
| --------------- | ---------------------------------------- | -------------------------------- |
| **Flat amount** | **Amount (per month)**                   | A fixed ₹2,000 allowance         |
| **Percentage**  | **Percentage (%)** + **Basis component** | HRA = 50% **of BASIC**           |
| **Formula**     | **Formula** (+ live preview)             | `CTC * 0.4`, `CTC - BASIC - HRA` |

- **Basis component** (Percentage only) → the **code** of another component. `50` + basis `BASIC` = half of Basic.
- **Formula** can reference: `CTC`, `GROSS`, `NET`, and any other component **code**. The drawer shows a live preview on a sample ₹12,00,000 CTC and validates syntax on blur. Components are auto-ordered by dependency, so HRA can safely reference BASIC.

### The toggles — enable vs disable (this is the part people get wrong)

| Toggle             | **Enabled**                                                 | **Disabled**                                                                                                                |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Taxable**        | The amount **counts toward taxable income** → raises TDS.   | Excluded from taxable income (e.g. a tax-free reimbursement).                                                               |
| **Active**         | The component is **available** to pay groups and runs.      | **Kept but ignored** — hidden from new pay groups, not calculated. Use this to retire a component without deleting history. |
| **Prorate on LOP** | Reduced for unpaid-leave days (½ month LOP → ½ the amount). | **Always paid in full**, regardless of LOP (typical for fixed reimbursements).                                              |

### Statutory tag — the key that wires a component to the country's rules

| Field                        | What it does                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Statutory tag** (optional) | Names the **wage base** this earning belongs to. The engine sums every earning carrying a given tag and that sum becomes a contribution scheme's base. |

- **Put it on EARNINGS only**, and only when the earning should form a statutory base. Example: `BASIC.statutoryTag = "PF_WAGE"` → Basic counts toward Provident Fund.
- **Leave it blank** on earnings that shouldn't (in our example HRA and Special have no tag → they don't inflate PF).
- **Do NOT put it on the deduction itself.** PF (the deduction) is the _output_; it's wired by its **code**, not a tag (see the cheat sheet at the end).

> **Which key talks to which:** `component.statutoryTag` ("PF_WAGE") must equal the
> pack's `contributionSchemes[].wageBaseTag` ("PF_WAGE"). Same spelling, or the base is ₹0
> and the contribution silently doesn't apply.

### Other fields

| Field                            | What it does                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Pay in months**                | Restrict to specific months (e.g. `12` = December only, for a 13th-month bonus). Blank = every period. |
| **Description**                  | Internal note.                                                                                         |
| **GL account** / **Cost center** | Accounting: which ledger account the line posts to, and whether cost is split by department.           |

---

### Now build the six components for our example

| #   | Name                      | Code      | Type                  | Calculation                 | Taxable | Statutory tag |
| --- | ------------------------- | --------- | --------------------- | --------------------------- | ------- | ------------- |
| 1   | Basic Salary              | `BASIC`   | Earning               | Formula `CTC * 0.4`         | ✅      | **`PF_WAGE`** |
| 2   | House Rent Allowance      | `HRA`     | Earning               | Percentage `50` of `BASIC`  | ✅      | _(blank)_     |
| 3   | Special Allowance         | `SPECIAL` | Earning               | Formula `CTC - BASIC - HRA` | ✅      | _(blank)_     |
| 4   | Provident Fund (Employee) | `PF`      | Deduction             | Flat `0`\*                  | —       | _(blank)_     |
| 5   | Provident Fund (Employer) | `PF_ER`   | Employer Contribution | Flat `0`\*                  | —       | _(blank)_     |
| 6   | Income Tax (TDS)          | `TDS`     | Deduction             | Flat `0`\*                  | —       | _(blank)_     |

> _\*Why Flat 0 for PF/PF_ER/TDS:_ these are **placeholders the engine fills**. Their
> amount comes from the **statutory pack**, not from the component — the engine
> overwrites the 0 with the real computed figure at calculation time. You create them so
> the payslip line has a proper **name**, and so the pack's references resolve.
> Professional Tax (`PROF_TAX`) works the same way and is created for you in the seed.

The codes `PF`, `PF_ER`, `TDS`, `PROF_TAX` are exactly what the India pack's
`statutoryComponents` list expects — **they must match.**

---

# Step 2 — Pay Group

> _Settings → Pay & Compliance → **Pay Groups** → **New pay group**._
> A pay group is a reusable bundle of components you assign to many employees.

| Field                   | What it does                                                                                                                                                           | Enable/disable                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Name**                | Label, e.g. "India Staff — Engineering".                                                                                                                               | —                                                                        |
| **Code**                | Machine key, `UPPER_SNAKE_CASE`. **Immutable.**                                                                                                                        | —                                                                        |
| **Currency (ISO 4217)** | The pay currency, e.g. `INR`.                                                                                                                                          | —                                                                        |
| **Pay schedule**        | How often it's paid (e.g. **Monthly**).                                                                                                                                | —                                                                        |
| **Description**         | Internal note.                                                                                                                                                         | —                                                                        |
| **Active** toggle       | **Enabled:** selectable when assigning salary. **Disabled:** retired, can't be newly assigned.                                                                         |                                                                          |
| **Salary Components**   | Tick the components to include. **Only EARNINGS need to be ticked** — the statutory deductions (PF/TDS/PROF_TAX) are applied automatically by the pack, not the group. | Expand a ticked row to **override** its calculation for this group only. |

**Per-group override (optional):** expand a component inside the group to change its
`calculationType` / value / formula **for this group only** — e.g. Special Allowance
computed differently for Engineering vs Sales, without touching the global component.

**For our example:** create **"India Staff"** (INR, Monthly), tick `BASIC`, `HRA`,
`SPECIAL`. No overrides.

---

# Step 3 — Assign Compensation to the employee

> _Employees → open **Aman** → **Compensation** tab → **Assign salary**._
> This links the person to a pay group and sets their pay.

| Field                          | What it does                                                                                                   | Notes                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Pay Group**                  | The bundle Aman is paid on. Lists **active** groups only.                                                      | Pick **"India Staff"**.                                                            |
| **Annual CTC**                 | The single number everything is derived from.                                                                  | Enter **`1200000`**. The formula engine turns this into BASIC, HRA, etc.           |
| **Effective From**             | When this compensation starts (`YYYY-MM-DD`).                                                                  | A change later creates a **new history record** — salary is never edited in place. |
| **Tax residence** (ISO 3166-2) | Drives **local taxes**. e.g. `IN-MH` → Maharashtra professional tax from the pack.                             | If blank, professional tax can't be matched. Set **`IN-MH`**.                      |
| **Bank Details**               | Fields are **rendered from the country schema** (India shows account no., IFSC; the US shows routing/account). | Needed for the disbursement bank file.                                             |

Enter: Pay Group **India Staff**, Annual CTC **1200000**, Effective From **today**,
Tax residence **IN-MH**, fill the India bank fields → **Assign**.

> **What just got wired:** `annualCtc ÷ 12` becomes the monthly `CTC` variable the
> formulas use; `tax residence` becomes the jurisdiction the engine uses to find
> professional tax; the pay group decides which components apply.

---

# Step 4 — Run Payroll (full lifecycle)

> _Sidebar → **Payroll** → **Run Payroll**._ Payroll uses **four separate
> permissions** so no one person can both run and pay it (segregation of duties):
> `payroll:initiate`, `payroll:adjust`, `payroll:approve`, `payroll:disburse`.
> HR_ADMIN / SUPER_ADMIN hold all four by default.

```
DRAFT ──Calculate──► REVIEW ──Approve(all levels)──► APPROVED ──Mark Paid──► PAID ──► Publish
```

### 4.1 — Start the run _(payroll:initiate)_

In the **Run Payroll** dialog:

| Field                            | What it does                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Run Type**                     | **Regular** (the normal monthly roster). Others: Off-cycle (a subset of people), Bonus / Arrears (pay only an entered amount), Full & Final (exit settlement), Reversal (undo an approved/paid run). |
| **Payroll Period**               | The month + year to pay (e.g. **June 2026**).                                                                                                                                                        |
| **Include all active employees** | On for a normal roster run.                                                                                                                                                                          |

Click **Calculate Payroll**. The run goes **DRAFT → CALCULATING → REVIEW**.

### 4.2 — Period Inputs (before or after calculate) _(payroll:adjust)_

On the run's **Inputs** panel, per employee:

| Column                          | Meaning                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| **LOP days**                    | Loss-of-pay (unpaid) days → prorates the components that have **Prorate on LOP** enabled. |
| **Leave days**                  | Paid leave taken (informational / policy).                                                |
| **OT hours**                    | Overtime → priced as `hours × hourly rate × the OT component's multiplier`.               |
| **Shift hours / On-call hours** | Same hours-based pricing for those components.                                            |
| **Variable pay**                | One-time incentive/commission amounts for VARIABLE components.                            |

You can also **paste CSV** (`employeeCode,lopDays,otHours,shiftHours,onCallHours,leaveDays`)
or **import overtime from timesheets**. For Aman's first clean run, leave inputs at 0.

### 4.3 — Calculate

**Calculate Payroll** computes each payslip in this order (all from data, no country
code): **earnings → statutory contributions → local taxes → income tax (with year-to-date
true-up) → net**. The run lands in **REVIEW** — nothing is paid yet.

### 4.4 — Review (the control gate) _(changes need payroll:adjust)_

- **Variance Review** — flags employees whose net pay swings (`HIGH_VARIANCE`, `NEGATIVE_NET`, `ZERO_PAY`, `NEW_JOINER`).
- **Dry Run** — recomputes totals + anomalies **without saving**, to sanity-check.
- **Warnings** — e.g. "no salary config", "below minimum wage".
- **Per-payslip `⋯` menu:** **Add adjustment** (one-time bonus/deduction), **Recalculate** a single payslip, **Hold payment** (excludes one person from disbursement until released — useful for a dispute).

Open Aman's payslip here and confirm the lines (see the worked numbers below).

### 4.5 — Approve _(payroll:approve)_

Approve each level in the chain. **Maker ≠ checker is enforced** — whoever calculated
can't approve their own run. Run becomes **APPROVED**.

### 4.6 — Pay & Disburse _(payroll:disburse)_

**Mark as Paid** (enter date + reference) → **PAID**. Then on **Disbursement**, generate
the country **bank file** (India = NACH) and **Reconcile** payouts. A **PAID run is
immutable** — fixes go to an arrears/off-cycle run, never an edit.

### 4.7 — Publish _(payroll:approve)_

**Publish Payslips** → Aman sees his payslip under **Payroll → My Pay**.

---

## Aman's payslip — the worked numbers

Monthly CTC = ₹12,00,000 ÷ 12 = **₹1,00,000**.

**Earnings (from the components + CTC):**

| Line      | How                 | Amount        |
| --------- | ------------------- | ------------- |
| BASIC     | `CTC * 0.4`         | ₹40,000       |
| HRA       | `50% of BASIC`      | ₹20,000       |
| SPECIAL   | `CTC - BASIC - HRA` | ₹40,000       |
| **GROSS** | sum of earnings     | **₹1,00,000** |

**Statutory deductions (from the pack — the `statutoryTag` payoff):**

| Line             | How                                                                                                    | Amount          |
| ---------------- | ------------------------------------------------------------------------------------------------------ | --------------- |
| PF (employee)    | PF base = earnings tagged `PF_WAGE` = **BASIC ₹40,000**, capped at the pack ceiling **₹15,000**, × 12% | **₹1,800**      |
| Professional Tax | flat band for `IN-MH` at this wage                                                                     | ₹200            |
| TDS              | new-regime slabs on annual taxable, spread over the year                                               | engine-computed |

**Employer cost (never reduces net):** PF (employer) ₹1,800.

```
NET = GROSS 1,00,000 − PF 1,800 − Prof.Tax 200 − TDS  = ₹98,000 − TDS
CTC = NET + employee deductions + employer cost          ✅ balances
```

Notice: **HRA and Special did not raise PF** — only BASIC carried `PF_WAGE`. That single
tag is the whole difference. Want PF on HRA too? Add `PF_WAGE` to HRA. Want a lower PF?
Change the rate/ceiling in the **statutory pack**. Neither needs a code change.

---

## Cheat sheet — which key connects to which

| This key…                                             | …must match this key                                   | Result                                 |
| ----------------------------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| `component.statutoryTag` = `"PF_WAGE"` (on **BASIC**) | pack `contributionSchemes[].wageBaseTag` = `"PF_WAGE"` | Basic forms the PF **wage base**       |
| pack `scheme.employee.component` = `"PF"`             | a component **code** = `"PF"`                          | employee PF **deduction** lands here   |
| pack `scheme.employer.component` = `"PF_ER"`          | a component **code** = `"PF_ER"`                       | employer PF **cost** lands here        |
| pack `localTaxes[].component` = `"PROF_TAX"`          | a component **code** = `"PROF_TAX"`                    | professional tax lands here            |
| pack `statutoryComponents` = `["PF","PF_ER","TDS"]`   | components with those **codes** exist                  | pack's expected components are present |
| component **Percentage** `basisCode` = `"BASIC"`      | a component **code** = `"BASIC"`                       | HRA = % of Basic                       |
| employee `tax residence` = `"IN-MH"`                  | pack `localTaxes[].jurisdiction` = `"IN-MH"`           | Maharashtra professional tax applies   |
| formula references `BASIC`, `CTC`, `GROSS`, `NET`     | component **codes** + built-ins                        | formula evaluates                      |

> **Golden rule:** earnings carry the **tag** (which base they feed); deductions/employer
> components are matched by **code** (where the computed amount lands). Get the spelling
> exactly right on both sides — a mismatch silently produces ₹0, not an error.

---

## Quick checklist for onboarding a new employee later

1. Components already exist? ✅ (one-time)
2. Pick or create the right **pay group**.
3. Employee → **Compensation → Assign salary**: pay group + annual CTC + tax residence + bank.
4. Next **Run Payroll** for the period includes them automatically.
