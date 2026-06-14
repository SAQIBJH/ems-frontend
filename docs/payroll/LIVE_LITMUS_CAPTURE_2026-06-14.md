# Live Payroll Litmus — Capture Runbook (India · Philippines · USA)

> **Purpose.** Validate the **live Render backend** computes the same full-payroll numbers the
> config-driven engine litmus proved (`PAYROLL_ENGINE_LITMUS_2026-06-14.md`). You run this; it can't
> be driven headlessly. Where the live number ≠ the expected number, that's a **backend gap** → record
> it in a consolidated backend contract.
>
> **Two paths:** **A — UI** (recommended; uses the screens already built) and **B — API/curl**
> (advanced). Do Path A unless you specifically want scripted capture.

---

## 0. Safety FIRST (read before touching anything)

- **Use a QA / sandbox tenant**, not a production customer tenant. Payroll config is largely
  **immutable**: assigning a pay group makes it + its components **undeletable**, statutory packs in
  use can't be deleted (`PACK_IN_USE`), and salary changes write immutable history. You will leave
  residue.
- **Cancel every run you create** when done: `POST /payroll/runs/:id/cancel` (there is no
  `DELETE /payroll/runs/:id`).
- A `REGULAR` run computes **all active salaries** in the tenant. On a shared tenant, scope to one
  subject with `type: OFF_CYCLE` + `employeeIds: [<id>]` instead, so you don't recompute everyone.

## Setup

```bash
# .env.local
NEXT_PUBLIC_USE_MOCKS=false      # hit the live backend through the BFF
pnpm dev                          # http://localhost:3000
```

Log in as a **SUPER_ADMIN** on the QA tenant (e.g. `superadmin@acme.test` / `Password123!`).
Backend base (behind the BFF): `https://employee-management-system-2b9q.onrender.com/api/v1`.

---

## 1. Expected results — compare the live payslip against THIS

Monthly figures (₹/₱/$ in major units). Annual income tax shown for reference; the live monthly tax
should be ≈ annual ÷ 12 (the backend may apply a YTD true-up, so allow small per-period variance).

| Country         | Monthly gross | Income-tax line (code) | Monthly tax | Employee contributions       | Employer contributions   | **Net (monthly)** |
| --------------- | ------------: | ---------------------- | ----------: | ---------------------------- | ------------------------ | ----------------: |
| **India**       |     ₹2,00,000 | `TDS` (or WITHHOLDING) |     ₹24,375 | PF_EE ₹1,800 · PROF_TAX ₹200 | PF_ER ₹1,800             |     **₹1,73,625** |
| **Philippines** |      ₱100,000 | `WITHHOLDING_TAX`      |     ₱16,875 | SSS_EE ₱1,750                | SSS_ER ₱3,500            |       **₱81,375** |
| **USA**         |       $10,000 | `FEDERAL_TAX`          |   $1,503.92 | SS_EE $620 · MED_EE $145     | SS_ER $620 · MED_ER $145 |     **$7,731.08** |

Inputs that produce these (annual taxable / CTC): India ₹24,00,000 (basic ₹1,00,000/mo); Philippines
₱1,200,000; USA $120,000 (single). Full rule sources + slab math: `PAYROLL_ENGINE_LITMUS_2026-06-14.md`.

> **The single most important live check** is that each country's **net** matches. If India shows ₹ on
> a PH payslip, or a PH payslip's tax line is `TDS` and reads 0, or net is ~2× on a sub-monthly run —
> those are the exact gaps prior live runs surfaced.

---

## 2. Path A — UI capture (recommended)

Repeat this per country. **Settings → Pay & Compliance** has every config screen.

1. **Statutory Pack** → _Statutory Packs_ → **New pack**:
   - Country (IN/PH/US), version, effective-from, **currency**, **rounding** + **proration** (set
     objects, not blank), and the **tax regime** (slabs + standard deduction + cess for IN) and
     **contribution schemes** (PF / SSS / FICA with their rates + wage ceilings). Use the slab/rate
     tables in the engine-litmus doc.
   - For India, optionally add the **§87A** rebate as a tax credit with `maxIncome 1200000` +
     marginal relief (the engine supports it — confirm the live backend accepts those fields).
2. **Legal Entities** → **New entity**: country, currency, fiscal-year start, **work week**
   (Mon–Fri), and link the **statutory pack** from step 1.
3. **Pay Calendars** → **New**: a **MONTHLY** calendar for that entity — remember **`code`** is
   required.
4. **Salary Components** → ensure the components the group needs exist (e.g. `BASIC`, and the
   statutory components the pack posts to: `PF_EE/PF_ER`, `SSS_EE/SSS_ER`, etc.).
5. **Pay Groups** → **New**: currency, schedule **Monthly**, add the components (e.g. `BASIC` flat =
   the monthly basic).
6. **Employee → Compensation tab → Assign Salary**:
   - **Pick the Legal Entity** from step 2 (this sends `legalEntityId` — load-bearing; without it
     sub-monthly statutory doubles), the pay group, and the **annual CTC** from §1.
7. **Payroll → Run Payroll**:
   - Pick the **Pay Calendar** for that entity. For a shared tenant use **Off-cycle** + select only
     this employee; on a clean QA tenant **Regular** is fine.
   - **Calculate** (the dialog handles the empty-body requirement).
8. **Open the payslip** (run detail → the employee row). Record, into the §4 table:
   gross · the tax line **code + amount** · each deduction · each employer contribution · **net** ·
   the **currency** shown · the **YTD/fiscal year**.
9. **Compare to §1.** Note any mismatch.
10. **Cancel the run** (run detail → Cancel / `POST /payroll/runs/:id/cancel`).

---

## 3. Path B — API capture (advanced, curl)

Use only if you want scripted capture. **Config-creation bodies vary — confirm shapes against
`docs/API_MAPPING.md` and `docs/newreqphase3.md` Domain F before relying on them.** The calls below
are the **verified-live** ones for the run → payslip leg.

```bash
BASE=https://employee-management-system-2b9q.onrender.com/api/v1

# Auth — login returns an accessToken in the body (Postman/Swagger style); use it as a Bearer.
TOKEN=$(curl -s "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@acme.test","password":"Password123!"}' | jq -r '.data.accessToken')
auth=(-H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json')

# (Build pack/entity/calendar/group/salary first — UI or per Domain F bodies. Then:)

# Create a REGULAR monthly run (or OFF_CYCLE + employeeIds for one subject)
RUN=$(curl -s "$BASE/payroll/runs" "${auth[@]}" -d '{
  "period":"2026-06","type":"REGULAR","includeAllActiveEmployees":true
}' | jq -r '.data.id')

# Calculate — EMPTY OBJECT body is required (no body → 422)
curl -s "$BASE/payroll/runs/$RUN/calculate" "${auth[@]}" -d '{}' | jq '.data.status'

# Capture: list payslips, then fetch one and read the lines
PS=$(curl -s "$BASE/payroll/runs/$RUN/payslips" "${auth[@]}" | jq -r '.data[0].id')
curl -s "$BASE/payroll/runs/$RUN/payslips/$PS" "${auth[@]}" | jq '{
  currency, grossEarnings, totalDeductions, netPay,
  deductions, employerContributions, ytd: .ytd.fiscalYear
}'

# Cleanup
curl -s "$BASE/payroll/runs/$RUN/cancel" "${auth[@]}" -d '{}' | jq '.data.status'
```

Contract reminders (from prior live runs): cycles unwrap is **`data.cycles`** (nested);
run-header `currency` may be the non-ISO sentinel **`"MULTI"`** but **per-payslip currency is always
ISO**; `POST /payroll/pay-calendars` requires `code`; statutory-pack create needs `rounding` /
`proration` as objects.

---

## 4. Capture tables — fill these in

### India

| Field                  | Expected            | **Live** | Match? |
| ---------------------- | ------------------- | -------- | ------ |
| Currency               | INR                 |          |        |
| Gross                  | ₹2,00,000           |          |        |
| Income tax line (code) | `TDS` / WITHHOLDING |          |        |
| Income tax (monthly)   | ₹24,375             |          |        |
| PF_EE                  | ₹1,800              |          |        |
| Professional tax       | ₹200                |          |        |
| PF_ER                  | ₹1,800              |          |        |
| **Net**                | **₹1,73,625**       |          |        |
| Fiscal year            | 2025-26 (Apr–Mar)   |          |        |

### Philippines

| Field                     | Expected                  | **Live** | Match? |
| ------------------------- | ------------------------- | -------- | ------ |
| Currency                  | PHP                       |          |        |
| Gross                     | ₱100,000                  |          |        |
| Income tax line (code)    | `WITHHOLDING_TAX`         |          |        |
| Income tax (monthly)      | ₱16,875                   |          |        |
| SSS_EE                    | ₱1,750                    |          |        |
| SSS_ER                    | ₱3,500                    |          |        |
| PF/ESI/TDS lines present? | **NO** (should be absent) |          |        |
| **Net**                   | **₱81,375**               |          |        |

### USA

| Field                 | Expected      | **Live** | Match? |
| --------------------- | ------------- | -------- | ------ |
| Currency              | USD           |          |        |
| Gross                 | $10,000       |          |        |
| Federal tax (monthly) | $1,503.92     |          |        |
| SS_EE                 | $620          |          |        |
| MED_EE                | $145          |          |        |
| SS_ER / MED_ER        | $620 / $145   |          |        |
| **Net**               | **$7,731.08** |          |        |

### (Optional) Philippines semi-monthly H1 cycle

| Field                | Expected    | **Live** | Match? |
| -------------------- | ----------- | -------- | ------ |
| Per-cycle gross      | ₱50,000     |          |        |
| Tax                  | ₱8,437.50   |          |        |
| SSS_EE (apportioned) | ₱875        |          |        |
| **Net**              | **₱40,688** |          |        |

---

## 5. Pass criteria & what to flag

A country **passes** when:

- [ ] **Net** matches the expected figure (±1 unit for rounding).
- [ ] **Currency** on the payslip is the country's **ISO code** (PHP/USD/INR) — never `INR` for a
      non-India employee, never `MULTI` on a payslip.
- [ ] The **income-tax line code** is the country's (`WITHHOLDING_TAX`, `FEDERAL_TAX`, …) and is
      **non-zero** — not a hardcoded `TDS` reading 0.
- [ ] **No `PF_ER`/`ESI_ER`** appear on a non-India payslip (the India-leak defect).
- [ ] Fiscal year is the country's (India Apr–Mar; PH/US calendar).
- [ ] (Sub-monthly) each cycle ≈ ½ the month — gross/tax/statutory **not doubled**.

Any unticked box = a **backend gap**. Record it (endpoint, expected vs live, repro) and roll all
findings into one backend contract — same format as `SUBMONTHLY_PAYROLL_DEFECTS_BACKEND_CONTRACT.md`.

## 6. Cleanup checklist

- [ ] All test runs **cancelled** (`POST /payroll/runs/:id/cancel`).
- [ ] You used a **QA tenant** (packs/groups/salary you created are not fully deletable).
- [ ] Note any created artifacts (pack codes, entity ids, group ids) so the tenant owner knows.
