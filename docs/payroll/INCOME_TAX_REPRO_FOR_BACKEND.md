# Backend follow-up: income tax not computing for a self-built country pack

> **For:** the backend team.
> **Re:** the "Payroll Global Readiness — PASS" signoff.
> **TL;DR:** The multi-country fix is verified working for **currency, statutory
> contributions, fiscal year, and component application** — thank you, the
> India-fallback is genuinely gone. But in an **independent live re-verification on
> staging**, the **income-tax line (`WITHHOLDING_TAX`) does not compute** for a
> Philippines pack created via the public API. SSS computes correctly; income tax is
> simply absent. We could not reproduce your verified `WITHHOLDING_TAX 16875`.
> **One question: what config/step makes the tax line appear?**

---

## What passed (verified live, staging, `superadmin@acme.test`)

PH employee, monthly gross **₱100,000**, single fully-taxable component:

| Signal                                   | Result                 |
| ---------------------------------------- | ---------------------- |
| Payslip currency                         | **PHP** ✅             |
| `SSS_EE` (employee 5%, MSC cap ₱35,000)  | **₱1,750** ✅          |
| `SSS_ER` (employer 10%)                  | **₱3,500** ✅          |
| India `PF_ER` / `ESI_ER` present?        | **absent** ✅          |
| `ytd.fiscalYear`                         | **calendar (2046)** ✅ |
| `presentDays == workingDays`             | ✅                     |
| `grossEarnings` (FLAT component applied) | **₱100,000** ✅        |

## What failed

| Expected                                               | Actual                           |
| ------------------------------------------------------ | -------------------------------- |
| `WITHHOLDING_TAX` = **₱16,875** (annual ₱202,500 / 12) | **absent — no tax line at all**  |
| `netPay` = **₱81,375**                                 | **₱98,250** (= gross − SSS only) |

`deductions` contained only `SSS_EE`. No income-tax deduction was generated.

---

## Reproduction (public API, staging)

```
1. POST /payroll/statutory-packs        # PH pack, regime PH_TRAIN (payload below)
2. POST /payroll/legal-entities         # country PH, statutoryPackId = the pack
3. POST /payroll/components             # FLAT 100000, taxable, statutoryTag SSS_BASE
4. POST /payroll/groups                 # PHP, MONTHLY, [component]   (override keys OMITTED — see gotcha #1)
5. POST /employees                      # HR employee
6. POST /payroll/employees/:id/salary   # payGroupId, annualCtc 1200000, legalEntityId, country PH, currency PHP
7. POST /payroll/runs                   # period 2046-01, type REGULAR, payGroupIds:[group]
8. POST /payroll/runs/:id/calculate
9. GET  /payroll/employees/:id/payslips/:psId
   → currency PHP, gross 100000, SSS_EE 1750, SSS_ER 3500, NO WITHHOLDING_TAX
```

### The regime we sent (income tax expected from this)

```jsonc
{
  "code": "PH_TRAIN",
  "name": "Philippines TRAIN",
  "fiscalYear": "2046", // also tried matching the run year exactly
  "currency": "PHP",
  "standardDeduction": 0,
  "taxCode": "WITHHOLDING_TAX", // persisted on CREATE (confirmed via GET)
  "taxName": "Withholding Tax",
  "surcharge": 0,
  "cess": 0,
  "taxCredits": [],
  "slabs": [
    { "from": 0, "to": 25000000, "rate": 0 },
    { "from": 25000000, "to": 40000000, "rate": 15 },
    { "from": 40000000, "to": 80000000, "rate": 20 },
    { "from": 80000000, "to": 200000000, "rate": 25 },
    { "from": 200000000, "to": 800000000, "rate": 30 },
    { "from": 800000000, "to": null, "rate": 35 },
  ],
  "allowedExemptions": [],
}
// statutoryComponents included "WITHHOLDING_TAX" alongside "SSS_EE","SSS_ER"
```

Slabs are minor units (centavos). `evaluateSlab(1,200,000)` = ₱202,500/yr → ₱16,875/mo.

---

## Things we already tried (none produced the tax line)

1. `taxCode` / `taxName` on the regime — confirmed **persisted** when sent on `POST`
   create (GET shows them). Still no tax line.
2. `WITHHOLDING_TAX` added to `statutoryComponents`. No effect.
3. Regime `fiscalYear` set to **match the run's fiscal year** exactly. No effect.
4. Filed a **tax declaration**: `POST /payroll/employees/:id/tax-declaration`
   `{ "fiscalYear": "2046", "regime": "PH_TRAIN", "items": [] }` → 200. Still no tax.

SSS computed correctly in every one of these. Only income tax is missing.

## The question for you

**What makes the `WITHHOLDING_TAX` line compute?** Specifically:

- Is a particular field required on the regime that we're omitting?
- Does income tax require a specific statutory **component** record to exist (and if
  so, with what `code` / `type` / config)?
- Did your verified `WITHHOLDING_TAX 16875` use a seeded/internal pack rather than one
  created through `POST /payroll/statutory-packs`? If so, can the same be produced via
  the public API?

Please reply with the exact create payload (pack + component + salary) that yields a
non-zero `WITHHOLDING_TAX`, and we'll re-verify.

---

## Minor API issues found along the way (low priority, but FYI)

1. **`POST /payroll/groups` coerces `overrideValue: null` → `0`** (and
   `overrideFormula: null` → `""`), which silently **zeroes the component's value**
   (we got gross 0 until we OMITTED the override keys entirely). Seeded groups store
   `null` correctly — only API-created ones get coerced. Either stop coercing, or
   document that override keys must be omitted when not overriding.
2. **`PATCH /payroll/statutory-packs/:id` drops `taxCode` / `taxName`** — they persist
   only on `POST` create, not on PATCH.
3. **`PATCH /payroll/employees/:id/salary` requires a full body** (`annualCtc is
required`) — it does not behave as a partial patch.
