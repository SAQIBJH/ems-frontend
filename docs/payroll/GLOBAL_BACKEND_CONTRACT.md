# Payroll Global-Readiness — Backend Contract & Fix Spec

> **Audience:** the backend team (separate repo).
> **Status:** defect spec. Nothing here is implemented yet.
> **Author context:** produced after a **live end-to-end test on the staging
> backend** (`employee-management-system-2b9q.onrender.com`) on 2026-06-13.
> **Goal:** make payroll _truly_ global — "any company in any country runs correct
> payroll by entering configuration only, with no engineering change"
> (`CLAUDE.md §26`, `PAYROLL_SYSTEM_DESIGN §16`).

---

## 0. TL;DR

The **config storage layer is already global** — the backend accepts a brand-new
country's statutory pack / legal entity / components / pay group / salary as pure
data, and payslip **currency is config-driven** (a PHP employee gets a PHP payslip).

The **compute / resolution layer is NOT global**. For an employee configured as
Philippines, the live payslip still applied **India's statutory pack** (`PF_ER`,
`ESI_ER`, Apr–Mar fiscal year). The statutory pack is **not resolved from the
employee's country / legal entity** — it falls back to the tenant's India pack, and
the worker's `country` is effectively hardwired to `IN` and cannot be changed.

Net: **"any country, no code" does not hold server-side today.** The fixes below are
bounded (resolution + assignment wiring + one additive schema field), **not** a
rearchitecture, and they must **not** change any existing India number.

---

## 1. How this was found (reproduction)

Ran the full lifecycle on staging as `superadmin@acme.test`. All creates succeeded;
the run computed; the payslip was inspected; the data was cleaned up afterwards.

```
1. POST /payroll/statutory-packs        → 201   (Philippines pack, see §6)
2. POST /payroll/components             → 201   (FLAT 100000, taxable, statutoryTag SSS_BASE, currency-agnostic)
3. POST /payroll/groups                 → 201   (currency PHP, MONTHLY, [that component])
4. POST /employees                      → 201   (HR employee, code E0095)
5. POST /payroll/employees/:id/salary   → 201   (payGroupId, annualCtc 1200000, country "PH", workLocations PH, bankAccount)
6. POST /payroll/legal-entities         → 201   (country PH, currency PHP, fiscalYearStartMonth 1)
   PATCH /payroll/legal-entities/:id     → 200   (statutoryPackId = the PH pack)
7. PATCH /payroll/workers/:id           → 200   (BUT country/currency/legalEntityId silently dropped — see §4.2)
8. POST /payroll/runs                   → 201   (period, payGroupIds:[PH group])
9. POST /payroll/runs/:id/calculate     → 202   → run status REVIEW
10. GET /payroll/employees/:id/payslips/:psId → 200  (inspected — see §2)
```

The employee was correctly included in the run and the roster. The salary, group,
component, pack and legal entity were all stored exactly as sent.

---

## 2. Expected vs Actual (the PH employee's payslip)

Sample salary: monthly gross **₱100,000** (`annualCtc 1,200,000`, single fully-taxable
component), period month-1 of the fiscal year, no LOP.

| Field                              | **Expected (Philippines)**                            | **Actual (live backend)**                    | Verdict              |
| ---------------------------------- | ----------------------------------------------------- | -------------------------------------------- | -------------------- |
| Payslip currency                   | PHP                                                   | **PHP**                                      | ✅ correct           |
| Statutory deductions/contributions | **SSS** (employee 5% / employer 10%, MSC cap ₱35,000) | **`PF_ER`, `ESI_ER`** (India PF/ESI)         | ❌ wrong pack        |
| `ytd.fiscalYear`                   | calendar **2027**                                     | **`2026-27` / `2027-28`** (India Apr–Mar)    | ❌ wrong fiscal year |
| Income tax (annual ₱1,200,000)     | **₱202,500** → monthly **₱16,875**                    | not evaluable (amounts 0)                    | ❌ blocked           |
| SSS employee / employer (monthly)  | **₱1,750 / ₱3,500**                                   | absent (India PF instead)                    | ❌ wrong pack        |
| Component / gross amount           | ₱100,000                                              | **0** (`monthlyAmount: 0`, `presentDays: 0`) | ❌ see §4.3–4.4      |

> The contribution **codes** and **fiscal year** alone prove which pack ran —
> independent of the zeroed amounts. The backend ran the **India** pack on a
> **Philippine** employee.

---

## 3. The litmus test (acceptance bar)

> Could a tenant in a country we have **never seen** run correct payroll by entering
> **configuration only**, with no code change?

Today the answer is **no**. After the fixes in §4, re-running §1 must produce the
**Expected** column in §2.

---

## 4. Required fixes

### 4.1 Resolve the statutory pack from the employee's country / legal entity — **(primary)**

**Problem:** pack resolution ignores the employee's `country` (stored on the salary)
and the legal entity's `statutoryPackId`. It falls back to the tenant's (India) pack.

**Required:** the engine must resolve the active pack for each employee, in this order
of precedence, **effective-dated** to the run period:

1. the employee's **legal entity** → its `statutoryPackId` (the entity's country pack);
2. else the employee's **salary `country`** → the active pack for that country;
3. else the tenant default (only as a last resort, and it must be logged as a warning).

Runs **pin** the resolved pack version (reproducibility) — keep that behaviour.
No `if (country === 'IN')` anywhere; resolution is data lookups only.

### 4.2 Make the worker/employee assignable to a country + legal entity — **(primary)**

**Problem:** `PATCH /payroll/workers/:id` returns `200` but **silently drops**
`country`, `currency`, and `legalEntityId` (the worker stays `country: "IN",
currency: "INR", legalEntityId: null`). The salary's `country` field is stored but
never used for resolution. There is **no shipped path** to place an employee in a
non-India legal entity.

**Required:** one authoritative, persisted assignment of an employee to a **country +
legal entity**. Either:

- accept and persist `legalEntityId` (and derive `country`/`currency` from it) on
  `POST/PATCH /payroll/employees/:id/salary`, **or**
- honour `country` + `legalEntityId` on `PATCH /payroll/workers/:id`.

Whichever is chosen, after assignment `GET /payroll/workers` must reflect the new
`country` / `currency` / `legalEntityId`, and pack resolution (§4.1) must use it.

### 4.3 Source the fiscal year from the country / legal entity

**Problem:** `ytd.fiscalYear` is India Apr–Mar (`2026-27`) for a PH employee.

**Required:** fiscal-year start month comes from the country / legal entity
(`fiscalYearStartMonth`, already stored on the legal entity — PH = 1 = calendar).
The YTD window, tax projection periods, and payslip `fiscalYear` label must use it.
No hardcoded Apr–Mar.

### 4.4 FLAT component value must apply

**Problem:** a `FLAT`, taxable salary component with `value: 100000` produced
`monthlyAmount: 0` on the payslip (gross 0 even before proration).

**Required:** confirm how component amounts derive from `annualCtc` + the pay-group
structure for a **single-component** group, and ensure a `FLAT` component's `value`
is applied. (If the contract is "components must reconcile to CTC via a residual
component," document that so the FE/clients can build a valid structure.)

### 4.5 Present-days / proration default

**Problem:** every employee in a period with no attendance computed `presentDays: 0`
→ proration zeroed all pay (India employees too).

**Required:** define the default when no attendance exists for a period — almost
certainly **present = working days** (full pay) unless LOP/absence is recorded.
Proration should be driven by `lopDays` (and explicit absence), not by an empty
attendance table defaulting present-days to 0.

### 4.6 `PATCH /payroll/runs/:id/inputs/:employeeId` returns 500

**Problem:** patching a run input for an employee with no existing input row throws a
Prisma `upsert` error (`prisma.payrollInput.upsert()` invocation failed). This blocks
setting LOP / OT / worked-days.

**Required:** the upsert must succeed (create-or-update) for an employee that has no
prior input row in the run.

### 4.7 Additive: `TaxRegime.taxCredits` (flat tax credit / rebate)

**Problem (schema gap):** `TaxRegime` models `standardDeduction` (reduces income),
`surcharge`, and `cess` — but **not a flat tax credit** subtracted from _tax_ after
the slabs. Countries that need it: **South Africa** (primary rebate), **Kenya**
(personal relief). PH needs none (it fit perfectly).

**Required (additive, backward-compatible):**

```jsonc
// TaxRegime — new optional field
"taxCredits"?: { "code": string, "amount": number /* minor units, annual */ }[]
```

Compute order: `tax = max(0, slabTax + surcharge + cess − Σ taxCredits)`.
Existing packs omit it → **inert** → no change to any current number.

---

## 5. Contract changes (summary)

| Endpoint                                                      | Change                                                                                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `POST/PATCH /payroll/employees/:id/salary`                    | accept + persist `legalEntityId`; use `country`/`legalEntityId` for pack resolution                                                |
| `PATCH /payroll/workers/:id`                                  | persist `country` / `currency` / `legalEntityId` (stop silently dropping them)                                                     |
| `GET /payroll/workers`, `/payroll/employees/:id/payslips/:id` | reflect the resolved country, currency, pack, fiscal year                                                                          |
| `POST /payroll/statutory-packs` (TaxRegime)                   | **additive** `taxCredits[]` (optional)                                                                                             |
| `PATCH /payroll/runs/:id/inputs/:employeeId`                  | fix upsert 500                                                                                                                     |
| Engine                                                        | resolve pack by legal-entity/country (effective-dated); fiscal year from country; FLAT component application; present-days default |

---

## 6. Reference: the Philippine pack used in the test (real 2025 data)

All pack numeric fields are **minor units** (centavos; PHP has 2 decimals).
Sources: BIR TRAIN graduated table; SSS 2025 (15% total, EE 5% / ER 10%, MSC cap ₱35,000).

```jsonc
{
  "country": "PH",
  "version": "2025.1",
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null,
  "rounding": { "mode": "NEAREST", "precision": 0 },
  "proration": { "basis": "CALENDAR_DAYS" },
  "taxRegimes": [
    {
      "code": "PH_TRAIN",
      "fiscalYear": "2025",
      "currency": "PHP",
      "standardDeduction": 0,
      "slabs": [
        { "from": 0, "to": 25000000, "rate": 0 }, // ₱0–250k
        { "from": 25000000, "to": 40000000, "rate": 15 }, // ₱250k–400k
        { "from": 40000000, "to": 80000000, "rate": 20 }, // ₱400k–800k
        { "from": 80000000, "to": 200000000, "rate": 25 }, // ₱800k–2M
        { "from": 200000000, "to": 800000000, "rate": 30 }, // ₱2M–8M
        { "from": 800000000, "to": null, "rate": 35 }, // ₱8M+
      ],
      "cess": null,
      "allowedExemptions": [],
    },
  ],
  "contributionSchemes": [
    {
      "code": "SSS",
      "name": "Social Security System",
      "wageBaseTag": "SSS_BASE",
      "wageCeiling": 3500000, // ₱35,000 MSC cap
      "employee": { "rate": 5, "component": "SSS_EE" },
      "employer": { "rate": 10, "component": "SSS_ER" },
    },
  ],
  "localTaxes": [],
  "minimumWages": [],
  "statutoryComponents": ["SSS_EE", "SSS_ER"],
}
```

---

## 7. Acceptance test (definition of done)

Re-run the §1 flow for a PH employee at monthly gross **₱100,000** and assert the
payslip:

- [ ] currency = **PHP**
- [ ] statutory line = **SSS**, employee **₱1,750**, employer **₱3,500** (no PF/ESI)
- [ ] `ytd.fiscalYear` = **2027** (calendar), not Apr–Mar
- [ ] income tax annual = **₱202,500** → month-1 withholding **₱16,875**
- [ ] gross = **₱100,000** (not 0)
- [ ] **an India (`IN`) employee's payslip is byte-identical to before** (no regression)
- [ ] add a **South Africa** pack with a primary-rebate `taxCredits` entry → tax
      reflects the rebate (validates §4.7)

---

## 8. Must-not-change (backward compatibility)

- Existing India payroll numbers must be **identical** after these changes. All fixes
  are either resolve-from-existing-config or additive/optional fields that are inert
  for current packs.
- Runs already computed keep their pinned pack version.
- No new hardcoded country rule (`§16` no-hardcode checklist remains the PR bar).
