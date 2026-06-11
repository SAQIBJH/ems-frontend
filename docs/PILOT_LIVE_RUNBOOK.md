# Pilot Live Runbook — build the workflow one step at a time

> **Purpose:** Stand up a real, working payroll workflow on the **live backend** by
> entering data **through the UI, in dependency order** — not by bulk-seeding the DB.
> Each step is a **pass/fail gate** that tests the exact flow your pilot customer
> will use. Where a step breaks, **stop and fix it before moving on** — that is the
> whole point.
>
> **Author:** FE · **Date:** 2026-06-11 · **Audience:** paying pilot (correctness
> non-negotiable). Companion to `docs/BILLING_BACKEND_REQUIREMENTS.md`.

---

## Ground rules (read first)

1. **Mocks OFF.** `NEXT_PUBLIC_USE_MOCKS=false` in `.env.local`, dev server restarted.
   Confirm: the browser console shows **no** `[MSW] Mocking enabled` line. If you see
   it, you're testing fake data — stop and fix the flag.
2. **One clean tenant.** Ideally a fresh tenant that mirrors the pilot (or the pilot's
   own). Don't mix with old test data.
3. **Small real set.** 5–10 employees is enough to prove the flow. Volume/load testing
   comes later — it is a _different_ exercise.
4. **Tell the backend team to PAUSE the bulk seed.** Ask them instead to: (a) confirm
   the **reference config** (country + statutory pack + tax slabs) is loaded for the
   pilot's jurisdiction, and (b) be on standby to fix whatever the UI flow exposes.
5. **Every step has two checks:** "did the form submit?" is **not** pass. Pass =
   **the data persisted on live** (re-open the screen, and/or the live API GET returns it).
6. **Roles:** do all setup as **HR_ADMIN** or **SUPER_ADMIN** (Pay & Compliance panels
   and the Compensation tab are HR/SA-only).

> **Jurisdiction:** this runbook defaults to **India (IN)** because the shipped
> statutory packs/components are India-based. **If your pilot is in another country,
> tell me and I'll re-scope steps 4–6** (statutory pack, components, currency).

---

## Pre-flight

| #   | Check                                           | How                                                                                                        | Pass                  |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------- |
| P1  | Mocks are off                                   | Console has no `[MSW] Mocking enabled`                                                                     | ✅ / ❌               |
| P2  | You can log in                                  | Login as HR_ADMIN / SUPER_ADMIN                                                                            | lands on dashboard    |
| P3  | Reference config exists for the pilot's country | `/settings/pay/statutory-packs` lists a pack for the country; `/settings/pay/legal-entities` has an entity | pack + entity present |

> If **P3** fails, that's a backend/config task (load the statutory pack for the
> jurisdiction) — **not** something the customer types by hand. Resolve before step 5.

---

## The dependency chain (why this order)

```
Company settings → Departments → Employees → [Payroll config: legal entity,
statutory pack, pay calendar] → Salary components → Pay groups →
Assign salary to employees → Run payroll → Period Inputs → Calculate → Review →
Approve → Payslips
```

Each arrow is a real data dependency: you **cannot** create an employee without a
department, **cannot** assign salary without a pay group, **cannot** get Period
Inputs without salaried employees. That's what makes this a true end-to-end test.

---

## Step 1 — Company settings

- **Goal:** tenant basics in place.
- **UI:** `/settings/company-profile` (+ `/settings/working-hours`, `/settings/locale`).
- **Enter:** company name, timezone, working hours, fiscal-year start, currency/locale.
- **Persist check:** reload the page — values stick. Live: `GET /settings/tenant`.
- **Pass:** settings reload with your values.

## Step 2 — Departments

- **Goal:** org structure (employees attach to a department).
- **UI:** `/departments` → create.
- **Enter:** name, department code, (optional head, parent).
- **Persist check:** the new department appears in the tree on reload. Live:
  `GET /departments` includes it.
- **Pass:** at least 1–2 departments persisted.
- **If it breaks:** note the exact error envelope (`error.code`) and which field.

## Step 3 — Employees

- **Goal:** real people in the directory.
- **UI:** `/employees` → **New** (`/employees/new`).
- **Required fields** (validated): `firstName`, `lastName`, `workEmail`,
  `employmentType` (`FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP`), `joinedOn`
  (**YYYY-MM-DD**), `designation`, `departmentId`. `employeeCode` is optional
  (auto-generated if blank).
- **Enter:** add 5–10 employees across your departments.
- **Persist check:** they appear in `/employees`; open one — profile loads. Live:
  `GET /employees` (double-nested: `data.data[]`) shows them.
- **Pass:** all entered employees persist and open without error.

## Step 4 — Payroll config (verify, don't hand-type)

- **Goal:** the country-scoped config the engine needs.
- **UI (Settings → Pay & Compliance):**
  - `/settings/pay/legal-entities` — a legal entity for the country.
  - `/settings/pay/statutory-packs` — the tax/contribution pack (e.g. IN).
  - `/settings/pay/schedules` — a monthly pay calendar/schedule.
- **Check:** each exists for your jurisdiction. Live: `GET /payroll/legal-entities`,
  `/payroll/statutory-packs`, `/payroll/schedules` all return your data.
- **Pass:** legal entity + statutory pack + pay schedule present for the country.
- **Note:** statutory pack/tax slabs are **product config** — pre-loaded, not customer-entered.

## Step 5 — Salary components

- **Goal:** the building blocks of pay.
- **UI:** `/settings/pay/components`.
- **Enter:** the pilot's real components, e.g. `BASIC` (FLAT/percentage), `HRA`
  (e.g. `BASIC * 0.4`), `PF` (DEDUCTION), employer PF (EMPLOYER_CONTRIBUTION), etc.
  Use the **live formula preview** to sanity-check each formula.
- **Persist check:** components list reloads with them. Live: `GET /payroll/components`.
- **Pass:** the component set the pilot actually uses exists, formulas valid (no cycle errors).

## Step 6 — Pay groups

- **Goal:** bundle components into a structure to assign to employees.
- **UI:** `/settings/pay/groups`.
- **Enter:** create a pay group, attach the components from step 5, set any group-level
  overrides.
- **Persist check:** group reloads with its components. Live: `GET /payroll/groups`.
- **Pass:** at least one pay group with the right components.

## Step 7 — Assign salary to employees ⟵ _the prerequisite everyone forgets_

- **Goal:** turn directory employees into **salaried** employees. **This is what
  makes Period Inputs populate.**
- **UI:** `/employees/:id` → **Compensation** tab → **Assign Salary** (opens the
  Salary Assignment drawer). Pick the **pay group** + enter **annual CTC**.
- **Do it for every employee** you want in the payroll run.
- **Persist check:** the Compensation tab now shows the assigned pay group, CTC, and a
  live component breakdown. Live: `GET /payroll/employees/:id/salary` returns `200`
  with the structure (a `404` here means _not assigned yet_).
- **Pass:** every target employee has a salary config (no `404` on their salary).
- **Why this matters:** the empty Period Inputs you saw earlier was almost certainly
  _because this step hadn't been done on live_ — no salaried employees, nothing to put
  in the grid. Proving this step is the heart of the whole exercise.

## Step 8 — Run payroll (the moment of truth)

- **Goal:** a real run, with Period Inputs populated from your salaried employees.
- **UI:** `/payroll` → **Run Payroll** → Run Type **Regular** → pick the period →
  keep **"Include all active employees"** → **Calculate Payroll**.
- **Period Inputs check:** _Before_ it auto-calculates (Regular runs calculate in one
  shot), the run is built from your salaried roster. Open the run (`/payroll/:id`).
  Live: `GET /payroll/runs/:id/inputs` should now return **N inputs = your salaried
  employee count** (not 0).
- **Then verify the numbers** on each payslip: gross, each component, statutory
  deductions, tax, net. Open a payslip via **View payslip**.
- **Pass:**
  - inputs count = number of employees you assigned salary to in step 7, **and**
  - payslip math is correct for at least a couple of employees you can check by hand.
- **If inputs are still 0 with salaried employees present:** _that_ is the real
  backend gap (DRAFT runs not seeding inputs from salaried employees) — capture it
  precisely (run id, employee count, the `/inputs` response) and it goes to the
  backend as a defect. We'll know it's a genuine code gap, not missing data.

---

## Step 9 — Reconciliation (the trust-builder, before any real payment)

Run **your** payroll output alongside the pilot's **existing** payroll for the same
period. Compare per employee: gross, each deduction, tax, **net**. Do **not** let the
pilot pay anyone off your numbers until they **match their trusted source**. Repeat for
1–2 cycles. This converts the pilot from a leap of faith into a verification exercise.

---

## Out of scope for the pilot (hide / don't test now)

Per the founder plan, keep the pilot narrow. **Hide or defer** until the hero flow is
proven: **Billing** (not built — `/billing/*` 404s), **Bonus / Off-cycle / Arrears /
Reversal / FnF** runs, multi-country, **Recruitment / Performance / Assets /
Announcements**, **Timesheets → OT import**. Each one hidden is one less thing that can
break in front of the customer.

---

## Pass/fail tracker (fill as we go)

| Step             | Screen                        | Result | Live check                                              | Notes / defect |
| ---------------- | ----------------------------- | ------ | ------------------------------------------------------- | -------------- |
| P1 mocks off     | console                       | ⬜     | —                                                       |                |
| P2 login         | /login                        | ⬜     | —                                                       |                |
| P3 ref config    | /settings/pay/\*              | ⬜     | statutory-packs, legal-entities                         |                |
| 1 company        | /settings/company-profile     | ⬜     | GET /settings/tenant                                    |                |
| 2 departments    | /departments                  | ⬜     | GET /departments                                        |                |
| 3 employees      | /employees/new                | ⬜     | GET /employees                                          |                |
| 4 payroll config | /settings/pay/\*              | ⬜     | GET /payroll/legal-entities,/statutory-packs,/schedules |                |
| 5 components     | /settings/pay/components      | ⬜     | GET /payroll/components                                 |                |
| 6 pay groups     | /settings/pay/groups          | ⬜     | GET /payroll/groups                                     |                |
| 7 assign salary  | /employees/:id → Compensation | ⬜     | GET /payroll/employees/:id/salary                       |                |
| 8 run payroll    | /payroll                      | ⬜     | GET /payroll/runs/:id/inputs (count = salaried)         |                |
| 9 reconcile      | —                             | ⬜     | per-employee net vs pilot's source                      |                |

> **Definition of pilot-ready:** every row above is ✅, and step 9 reconciles to the
> rupee for a full cycle — _then_ set the launch date, not before.
