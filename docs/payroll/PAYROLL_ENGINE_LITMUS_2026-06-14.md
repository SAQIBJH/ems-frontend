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
> **Source test:** `src/modules/payroll/utils/payroll-global-litmus.test.ts` — **23/23 PASS**
> (3 base countries + 4 depth cases; re-run: `pnpm test payroll-global-litmus`). Generated 2026-06-14.

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

## Depth additions (2026-06-14)

Four harder cases were added to stress the engine further. **23/23 PASS.**

### 4. India — surcharge (high earner, ₹60,00,000)

Income > ₹50L triggers the 10% surcharge band (on tax), before cess:

| Step                                    | Amount            |
| --------------------------------------- | ----------------- |
| Slab tax on ₹59,25,000 (after ₹75k std) | ₹13,57,500        |
| + 10% surcharge (income > ₹50L)         | ₹1,35,750         |
| + 4% cess on (tax + surcharge)          | ₹59,730           |
| **Total**                               | **₹15,52,980** ✅ |

The engine's `surcharge` bands (10% / 15% / 25%) pick the highest applicable and apply it before cess — correct.

### 5. India — §87A rebate ✅ … and a real ENGINE GAP ⚠️

- **Inside the rebate zone (₹10,00,000):** a configured §87A credit floors tax to **₹0** ✅ — correct.
- **GAP — the flat credit can't turn §87A _off_ above ₹12L.** At ₹15,00,000 the correct tax (no §87A) is **₹97,500**, but the same flat ₹60,000 credit yields **₹37,500**. §87A is **income-conditional** and carries **marginal relief** just above the threshold — neither is expressible with the current unconditional `taxCredits` primitive.
  - **Recommended engine enhancement:** a _threshold-capped / conditional_ credit (e.g. `taxCredits[].appliesUpToIncome` + a marginal-relief rule), or a `REBATE()` formula function. Until then, India §87A can only be modelled correctly for the ≤₹12L population.

> This is the one genuine finding from the whole litmus — worth a backend/engine ticket. Everything else is correct as configured.

### 6. USA — federal + Pennsylvania state tax (two regimes)

A pack can hold multiple tax regimes; federal and state compute independently and stack:

| Tax       | Basis                                               | Annual              |
| --------- | --------------------------------------------------- | ------------------- |
| Federal   | brackets on $105,000 (after $15,000 std)            | $18,047             |
| PA State  | flat 3.07% of $120,000 compensation (no deductions) | $3,684              |
| FICA (EE) | SS $7,440 + Medicare $1,740                         | $9,180              |
| **Net**   | `120,000 − 30,911`                                  | **$89,089 / yr** ✅ |

Demonstrates a second, structurally different regime (flat, no deduction) layered on the federal one — config-only.

### 7. Philippines — semi-monthly cycle (H1) apportionment

A single ₱100,000/mo employee paid on a **semi-monthly** calendar (24 periods/yr):

| Per-cycle item | Value          | Rule                                                              |
| -------------- | -------------- | ----------------------------------------------------------------- |
| Gross          | ₱50,000        | monthly × 12/24                                                   |
| Income tax     | ₱8,437.50      | annual ₱202,500 ÷ **24** (not ÷12)                                |
| SSS (EE)       | ₱875           | monthly ₱1,750 **÷ 2** — the monthly cap is **not** charged twice |
| **Net**        | **₱40,687.50** | ✅ **matches the live backend H1 payslip (₱40,688)**              |

This is the crux of the sub-monthly fix: base splits per cycle, tax projects over 24 periods, and the monthly-capped contribution apportions instead of doubling. The engine's `projectPeriodTax(periodsRemaining: 24)` + monthly-total apportionment reproduce the live figure exactly.

---

## What this proves (and what it doesn't)

**Proves:**

- The engine's progressive-slab evaluation, standard deduction, cess, wage-ceiling caps, and
  flat local-tax bands are all **correct against real published rates** for three very different
  systems.
- It is **genuinely config-over-code**: the test imports only the public engine API; switching
  countries is switching _data_. A new country is a new config object, not new code.

**Now also covered (depth additions §4–§7):** India surcharge, India §87A (in-zone), US state tax
(second regime), and a Philippines semi-monthly cycle (per-cycle base + ÷24 tax + apportioned SSS,
matching the live backend).

**Open finding:** India **§87A above ₹12L** — the flat `taxCredits` primitive can't express the
income-conditional cut-off + marginal relief (§5 above). Needs a conditional/threshold-capped credit.

**Still NOT covered (by design / scope):**

- Live-backend end-to-end (run → calculate → payslip render against Render). A separate live litmus
  script is available on request.
- US additional-Medicare surtax (0.9% over $200k) and a progressive _bracketed_ state (only a flat
  state was exercised; the engine handles brackets — see India/PH/federal).
- Full YTD true-up across many periods (the single-cycle snapshot uses `projectPeriodTax` with a
  fixed `periodsRemaining`; the YTD-paid carry-forward isn't exercised here).
