# Payroll Engine Litmus — India · Philippines · USA (real 2025/2026 data)

> **What this is.** A deterministic test of the **frontend payroll calculation engine**
> (`src/modules/payroll/utils/formula.utils.ts` + `money.utils.ts`) — the config-driven core
> that computes income tax, statutory contributions, and proration. Each country is expressed
> as **pure configuration** (tax regime + contribution schemes + local taxes) fed to the
> **same** engine; nothing is special-cased per country. Every expected number is hand-derived
> from the cited published rules, and the engine is asserted to reproduce it.
>
> **Scope / honesty.** This exercises the **calculation engine**, not the live Render backend
> end-to-end (that needs the running app + a headed browser). It proves the _math_ is correct
> and _config-only_. Money is integer **minor units** (paise / centavos / cents); displayed here
> in major units.
>
> **Source test:** `src/modules/payroll/utils/payroll-global-litmus.test.ts` — **14/14 PASS**
> (re-run: `pnpm test payroll-global-litmus`). Generated 2026-06-14.

---

## Verdict

| Country     | Currency | Income tax     | Statutory (EE)          | Net (monthly) | Result |
| ----------- | -------- | -------------- | ----------------------- | ------------- | ------ |
| India       | INR      | ₹2,92,500 / yr | PF ₹1,800 + PT ₹200     | **₹1,73,625** | ✅     |
| Philippines | PHP      | ₱202,500 / yr  | SSS ₱1,750              | **₱81,375**   | ✅     |
| USA         | USD      | $18,047 / yr   | FICA $765 ($620 + $145) | **$7,731.08** | ✅     |

**The one generic engine produced correct payroll for three structurally different countries
(progressive slabs + cess + capped PF + local tax; graduated tax + capped SSS; bracketed tax +
standard deduction + wage-base-capped FICA) with ZERO engine code changes — only configuration.**

---

## 1. India — New Regime FY2025-26, Maharashtra

**Scenario:** monthly gross ₹2,00,000 (₹24,00,000 CTC); basic ₹1,00,000/mo; annual taxable ₹24,00,000.
**Sources:** new-regime slabs + ₹75,000 standard deduction + 4% health & education cess (Union
Budget 2025 / Income Tax Dept); EPF 12% of basic, statutory wage ceiling ₹15,000 (EPFO);
Maharashtra Professional Tax ₹200/mo above ₹10,000.

### Income tax (on ₹23,25,000 after the ₹75,000 standard deduction)

| Band (₹)                | Rate | Tax                          |
| ----------------------- | ---- | ---------------------------- |
| 0 – 4,00,000            | 0%   | 0                            |
| 4,00,000 – 8,00,000     | 5%   | 20,000                       |
| 8,00,000 – 12,00,000    | 10%  | 40,000                       |
| 12,00,000 – 16,00,000   | 15%  | 60,000                       |
| 16,00,000 – 20,00,000   | 20%  | 80,000                       |
| 20,00,000 – 23,25,000   | 25%  | 81,250                       |
| **Subtotal**            |      | **2,81,250**                 |
| Health & education cess | 4%   | 11,250                       |
| **Annual income tax**   |      | **₹2,92,500** → ₹24,375 / mo |

### Contributions & local tax

| Item                  | Basis                                            | Employee | Employer |
| --------------------- | ------------------------------------------------ | -------- | -------- |
| EPF                   | 12% of basic, **capped at ₹15,000** wage ceiling | ₹1,800   | ₹1,800   |
| Professional Tax (MH) | flat band (gross > ₹10,000)                      | ₹200     | —        |

### Net

`200,000 − 24,375 (tax) − 1,800 (PF) − 200 (PT)` = **₹1,73,625 / month** ✅

> Income chosen above ₹12,00,000 so the §87A rebate doesn't apply, and below ₹50,00,000 so no
> surcharge — keeps the litmus on the core slab + cess path (both rebate and surcharge are
> separately supported by the engine via `taxCredits` and `surcharge`).

---

## 2. Philippines — TRAIN + SSS (2025)

**Scenario:** monthly gross ₱100,000 (₱1,200,000 annual taxable); no standard deduction.
**Sources:** TRAIN graduated income tax (RA 10963, 2023-onward table); SSS 2025 — 15% total
(employee 5% / employer 10%), maximum Monthly Salary Credit ₱35,000.

### Income tax (TRAIN graduated, on ₱1,200,000)

| Band (₱)              | Rate | Tax                         |
| --------------------- | ---- | --------------------------- |
| 0 – 250,000           | 0%   | 0                           |
| 250,000 – 400,000     | 15%  | 22,500                      |
| 400,000 – 800,000     | 20%  | 80,000                      |
| 800,000 – 1,200,000   | 25%  | 100,000                     |
| **Annual income tax** |      | **₱202,500** → ₱16,875 / mo |

### Contributions

| Item | Basis                           | Employee    | Employer     |
| ---- | ------------------------------- | ----------- | ------------ |
| SSS  | gross **capped at ₱35,000 MSC** | ₱1,750 (5%) | ₱3,500 (10%) |

### Net

`100,000 − 16,875 (tax) − 1,750 (SSS)` = **₱81,375 / month** ✅
_(Identical to the figure independently verified against the live backend on 2026-06-14.)_

---

## 3. USA — Federal (single) + FICA (2025)

**Scenario:** monthly gross $10,000 ($120,000 annual); single filer.
**Sources:** 2025 federal brackets, single (IRS Rev. Proc. 2024-40); standard deduction $15,000;
FICA — Social Security 6.2% to the $176,100 wage base, Medicare 1.45% (no cap).

### Federal income tax (on $105,000 after the $15,000 standard deduction)

| Band ($)               | Rate | Tax                             |
| ---------------------- | ---- | ------------------------------- |
| 0 – 11,925             | 10%  | 1,192.50                        |
| 11,925 – 48,475        | 12%  | 4,386.00                        |
| 48,475 – 103,350       | 22%  | 12,072.50                       |
| 103,350 – 105,000      | 24%  | 396.00                          |
| **Annual federal tax** |      | **$18,047.00** → $1,503.92 / mo |

### FICA contributions

| Item                    | Basis                                        | Employee | Employer |
| ----------------------- | -------------------------------------------- | -------- | -------- |
| Social Security (OASDI) | 6.2%, monthly wage under the $14,675 ceiling | $620.00  | $620.00  |
| Medicare                | 1.45%, **uncapped**                          | $145.00  | $145.00  |

### Net

`10,000 − 1,503.92 (fed tax) − 620 (SS) − 145 (Medicare)` = **$7,731.08 / month**
Annual: `120,000 − 18,047 − 9,180 (FICA EE)` = **$92,773 / year** ✅

> Demonstrates a **wage-base-capped** contribution (Social Security) alongside an **uncapped**
> one (Medicare) and a **standard deduction** — none of which exist in the India or Philippines
> packs, yet the same engine handles them from config.

---

## What this proves (and what it doesn't)

**Proves:**

- The engine's progressive-slab evaluation, standard deduction, cess, wage-ceiling caps, and
  flat local-tax bands are all **correct against real published rates** for three very different
  systems.
- It is **genuinely config-over-code**: the test imports only the public engine API; switching
  countries is switching _data_. A new country is a new config object, not new code.

**Does NOT cover (by design / scope):**

- Live-backend end-to-end (run → calculate → payslip render against Render). Run a separate live
  litmus for that.
- India §87A rebate / surcharge and US additional-Medicare / state taxes (supported by the engine
  but out of these representative scenarios).
- Per-period withholding nuance: income tax here is the **annual liability ÷ 12**; real payroll
  applies a YTD true-up across periods (the engine's `projectPeriodTax` does this when wired to
  YTD — not exercised in this single-period snapshot).
- Sub-monthly per-cycle proration (covered separately; backend-side).
