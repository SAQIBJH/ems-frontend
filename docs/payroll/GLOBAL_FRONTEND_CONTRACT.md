# Payroll Global-Readiness — Frontend Changes Spec

> **Audience:** us (this repo).
> **Status:** change spec. **Nothing implemented yet.** Decision unchanged: do ONE FE
> integration pass — BUT it is now **gated** on the backend closing the sub-monthly
> defects below (see `SUBMONTHLY_PAYROLL_DEFECTS_BACKEND_CONTRACT.md`).
> **Pairs with:** `GLOBAL_BACKEND_CONTRACT.md` (done), `WORK_WEEK_BACKEND_CONTRACT.md`
> (shipped — coarsened, see §8), `SUBMONTHLY_PAYROLL_BACKEND_CONTRACT.md` (shipped — but
> **defective**, see §9 + the new defects contract).
> **Refreshed 2026-06-14** after a full **live E2E regression** (monthly + semi-monthly,
> real PH data) on the live backend. Findings are in §13; raw evidence is summarised in the
> `payroll-submonthly-live-litmus-2026-06-14` memory.

---

## 0. Backend status snapshot (what the FE integrates against)

| Backend item                                                           | Status                         | FE impact               |
| ---------------------------------------------------------------------- | ------------------------------ | ----------------------- |
| Multi-country pack resolution (currency, SSS, fiscal year, components) | ✅ shipped + **live-verified** | integrate (§2–§4)       |
| Income tax (`WITHHOLDING_TAX`), `taxCode`/`taxName`/`taxCredits`       | ✅ shipped + verified          | types + preview (§1,§3) |
| override-null no longer coerced; partial salary PATCH                  | ✅ shipped                     | §4, §5                  |
| **Monthly multi-country payroll (INR/PHP/ZAR side-by-side)**           | ✅ **live-verified correct**   | §6 (render as-is)       |
| **Per-entity work week → working days**                                | ◐ shipped **coarsened**        | §8 (as-shipped)         |
| **Bi-weekly / semi-monthly compute**                                   | ⚠️ shipped **but DEFECTIVE**   | §9 (**gated** on fixes) |

**Regression rule:** every change below is additive or reads existing config — existing
India numbers must stay identical. Keep `global-conformance.test.ts` green.

---

## 1. `TaxRegime` type — align to the backend's shipped shape

`src/modules/payroll/types/statutory.types.ts` — the backend now returns/accepts:

```ts
export interface TaxCredit { code: string; amount: number; }   // minor units, annual
export interface TaxRegime {
  code: string;
  name?: string;            // NEW (e.g. "Philippines TRAIN")
  fiscalYear: string;
  currency: string;
  standardDeduction: number;
  slabs: TaxSlab[];         // TaxSlab may carry optional `base?: number` (precomputed)
  surcharge?: ...;          // backend example sends a number; confirm shape vs our TaxSurcharge[]
  cess?: ...;               // backend example sends a number; confirm vs our {rate}
  taxCredits?: TaxCredit[]; // NEW (SA primary rebate, KE personal relief)
  taxCode?: string;         // NEW — the deduction line code (e.g. "WITHHOLDING_TAX")
  taxName?: string;         // NEW — the deduction line name
  allowedExemptions?: string[];
}
```

Add `base?: number` to `TaxSlab`. Confirm `surcharge`/`cess` wire shape against live
(backend's ZA example used plain numbers). **Live-verified 2026-06-14:** the PH pack
returns `taxRegimes[].taxCode = "WITHHOLDING_TAX"`, `taxName`, `taxCredits: []` exactly
as above — wire types to this.

## 2. Minor-units discipline (backend re-stressed this)

All statutory-pack monetary fields are sent in **minor units** (₱250,000 → `25000000`).
The pack-config UI must convert on write and display on read. Applies to:
`taxRegimes[].standardDeduction`, `slabs[].from/.to/.base`, `taxCredits[].amount`,
`contributionSchemes[].wageCeiling`, `minimumWages[].amount`. (Component values + CTC stay
**major** units — don't convert those.) **Also**, on statutory-pack create the backend
requires `rounding` and `proration` as **objects** (`{mode,precision}` / `{basis}`) even
though they read back as `null` — send objects on write.

> **FE-audit 2026-06-14 — mostly DONE:** minor-units conversion is **already implemented** in
> `StatutoryPackEditor.tsx` (19 `toMinor/fromMinor` sites). Remaining: extend it to
> `taxCredits[].amount` and `slabs[].base` once those fields are added (§1), and replace the
> `2026-27` (India-FY) / `INR` placeholders in that editor.

## 3. `computeRegimeTax` (`formula.utils.ts`) — `taxCredits` + line code

```ts
let tax = evaluateSlab(afterStd, regime.slabs); // + surcharge + cess
const credits = (regime.taxCredits ?? []).reduce((s, c) => s + c.amount, 0);
return Math.max(0, tax - credits); // floor at 0; inert when absent
```

Mirror the backend order exactly: `max(0, slabTax + surcharge + cess − Σ taxCredits)`.
**Emit the tax line code from `regime.taxCode`** (e.g. `WITHHOLDING_TAX`), **not** the
hardcoded `'TDS'` in `payroll-engine.ts`.

## 4. Salary shape — `legalEntityId` is the source of truth ⚠️ CORRECTNESS-CRITICAL

> **Reclassified 2026-06-14 from "nice alignment" to correctness-critical.** Live E2E
> proved that **without `legalEntityId` on the salary, sub-monthly statutory contributions
> DOUBLE** (SSS_EE billed 1,750 _per cycle_ instead of 1,750 _per month_). After
> `PATCH /payroll/employees/:id/salary {legalEntityId, currency}` the apportionment
> corrected itself (875/cycle). The backend **accepts** these fields today; the FE simply
> never sends them. This is not optional polish — it changes the money.

`src/modules/payroll/types/payroll.types.ts` + `services/employee-salary.api.ts`:

- `EmployeeSalaryInput`: add `legalEntityId` (**required for any multi-frequency tenant**),
  `currency`, and flat bank fields `bankName` / `bankAccountName` / `bankAccountNumber`
  (replacing/augmenting the old `bankAccount: Record`). Keep `country`.
- `EmployeeSalary` (response): add `currency`, `legalEntityId` — **already present on the
  live response** (verified: they come back `null` only because the FE omits them on write).
- **Salary-assignment UI:** a **Legal entity `Select`** (shadcn, never native) from
  `GET /payroll/legal-entities`; the entity is authoritative — backend derives
  country/currency/pay-calendar (→ periods-per-year) from it. Surface country/currency
  read-only on select. Gate on payroll-admin. **Make the entity required** when the tenant
  has any non-monthly pay group.
- **Partial PATCH** is supported (verified live) — the UI may PATCH single fields
  (`legalEntityId`, `bankName`, …) without resending the whole salary.

> **FE-audit 2026-06-14 — current state of the file to change:**
> `modules/employees/components/SalaryAssignmentDrawer.tsx` today sends
> `{payGroupId, annualCtc, effectiveFrom, country, residenceJurisdiction, workLocations, bankAccount}`
> — **no `legalEntityId`, no `currency`**, and the user picks `country` from a free `Select`
> (no legal-entity Select). **Good news:** it already imports `useLegalEntities()` +
> `usePayrollStore(activeLegalEntityId)` (used only to derive a default country today), so the
> scaffolding is present — the change is: add the entity `Select`, send `legalEntityId` +
> `currency`, and derive country from the chosen entity. This is the FE half of the
> sub-monthly statutory-doubling fix and should ship in the **non-gated** first wave.

## 5. Worker assignment + `NO_ACTIVE_SALARY`

`PATCH /payroll/workers/:id` requires an **active salary first**, else returns
`NO_ACTIVE_SALARY`. The UI must catch it and prompt "configure salary first" rather than
showing a generic error.

## 6. Payslip UI — fully dynamic, no India-isms

- Render `deductions` **and** `employerContributions` **dynamically from the response
  arrays** — never hardcode `PF` / `ESI` / `TDS` lines. **Live-verified:** PH payslips
  return `deductions:[SSS_EE, WITHHOLDING_TAX]`, `employerContributions:[SSS_ER]`; render
  them by `name`.
- Currency, `periodLabel`, and `ytd.fiscalYear` come **from the response** — never
  computed/formatted as INR or an India fiscal year in the FE. (Live: PH → currency `PHP`,
  FY `2029`; ZA → `ZAR`, FY `2029-30`. Both correct; just render what's sent.)
- Confirm no `PF`/`ESI`/`TDS`/`INR` literals leak into the global payroll UI.

> **FE-audit 2026-06-14 — the leak is real and bigger than one line.** Line rendering IS
> dynamic (`PayslipDrawer` maps `earnings/deductions/employerContributions`), BUT:
>
> - **`PayslipDrawer.tsx:112`** hardcodes `deductions.find(l => l.code === 'TDS')` for its tax
>   summary → **returns 0 for a PH `WITHHOLDING_TAX` payslip.** Replace with the regime/pack
>   tax code (or sum the deductions the pack tags as tax), not the literal `'TDS'`.
> - `PayslipDrawer` locale defaults `'en-IN'` (use `template.locale` / entity locale).
> - `'INR'` / `₹` / `en-IN` defaults appear across **~15 components** (MyPayslipsPage,
>   PayrollRunDetail, PayrollRunsTab, CompStatementCard, TaxDeclarationCard, Loans/Claims/
>   Garnishments cards) and `const CURRENCY='INR'` in 3 migration panels. Most pass the
>   response `currency` through (so live data is right) but fall back to INR/₹ when it's
>   missing — audit each and default to the response currency, never a literal.

- **Known backend leak (NOT an FE fix — see defects contract Bug 3):** a country whose pack
  has no contribution schemes (e.g. ZA) currently returns employer lines `PF_ER 0, ESI_ER 0`.
  The FE renders these faithfully, so they will appear on the payslip until the backend
  stops emitting them. Do not special-case/hide them in the FE — flagged to backend.

## 7. Mock-engine caveats (demo/offline correctness)

`src/mocks/data/payroll-engine.ts`:

- `CURRENCY = 'INR'` (~L51) → read currency from config (pay group/entity/regime),
  fallback INR.
- `STD_WORKING_DAYS = 22` / `STD_HOURS_PER_DAY = 8` (~L53/56) → from the pay calendar's
  **work pattern** (ties to §8). Default to constants when unset.
- Hardcoded `'TDS'` line (×4 sites) → emit from `regime.taxCode`.

> Note: per the agreed posture ("UI consumes live + MSW shells"), the mock engine is **not**
> being taught real sub-monthly compute. These fixes are only to keep the _monthly_ mock
> demo currency-correct and India-ism-free.

## 8. work-week UI — SHIPPED (coarsened from the original ask)

> **Reality check 2026-06-14:** the backend shipped a **narrower** model than
> `WORK_WEEK_BACKEND_CONTRACT.md` requested. What actually shipped:

- **`workWeekPattern: 'MON-FRI' | 'MON-SAT'`** — a coarse enum, on the **Legal Entity**
  (live-verified on read), **not** the `workWeekDays: string[]` + `hoursPerDay` on the Pay
  Calendar the contract asked for.
- **FE work to build:** add a `workWeekPattern` `Select` (`MON-FRI` / `MON-SAT`, default
  `MON-FRI`) to the Legal Entity create/edit form; display it on the entity read view.
  Render backend-returned `workingDays` as-is on payslips — never compute in the FE.
- **Still backend gaps (do NOT build FE for these — they don't exist):** arbitrary work
  weeks (e.g. UAE Sun–Thu), and `hoursPerDay` for the OT hourly rate. Tracked in the
  defects contract.

## 9. sub-monthly run UI — SHIPPED but ⚠️ GATED on backend defect fixes

> **Live E2E 2026-06-14 verdict:** the _capability_ is live (SEMI_MONTHLY enum, `YYYY-MM-H1`
> periods, cycles endpoint, cycle working days) **but compute is defective**: every cycle
> pays a full month → **gross, tax and (un-linked) statutory all DOUBLE**. See
> `SUBMONTHLY_PAYROLL_DEFECTS_BACKEND_CONTRACT.md`. **Do not ship the cycle-based run UI to
> users until those defects are fixed and re-verified** — it would let HR create
> pay-doubling runs.

What's confirmed live and how the FE consumes it:

- **`SEMI_MONTHLY`** is accepted on the pay group enum (was 422 pre-fix) → add it to the FE
  `PaySchedule` type (today `MONTHLY|BIWEEKLY|WEEKLY`).
- **Cycles endpoint** `GET /payroll/pay-calendars/:id/cycles?from=YYYY-MM&to=YYYY-MM`.
  **Unwrap is `data.cycles[]`** (a nested object with `payCalendarId` + `paySchedule`
  siblings) — **NOT** the bare `data[]` the handoff documented. Each cycle:
  `{ period, periodLabel, startDate, endDate, payDate, cutoffDate, paySchedule }`.
- **Run creation** accepts `period` as a cycle id (`YYYY-MM-H1`, `YYYY-Wnn`) plus
  `paySchedule`, `startDate`, `endDate`, `payDate`. Use the cycle picker (Approach B —
  progressive disclosure; see the sub-monthly UI integration spec) to source those from a
  selected cycle. The run response echoes `paySchedule`/`periodLabel`/dates/`currency`.
- **`PayCalendarInput` is missing `code`** — the backend **requires** `code` on pay-calendar
  create; add it to the FE type/form.
- Payslip/run labels render the cycle (`periodLabel`, dates) from the response.

**FE build order for this section (once backend is green):** (a) types + cycles service +
unwrap fix; (b) cycle picker in run-create; (c) run list/detail + payslip cycle display.

## 10. Tests

- Keep `global-conformance.test.ts` (FE-engine conformance, **not** a backend proof).
- Add a **South Africa** `taxCredits` (rebate) case (§3).
- Add a sub-monthly case once §9 unblocks.
- Full suite green — India unchanged (regression gate).

## 11. Files to touch (checklist)

> **All states below verified by reading the code on 2026-06-14.** "DONE" = already shipped,
> no work; "GAP" = confirmed missing. Wave = non-gated (safe now) vs gated (after backend).

| Item                                                                                                                                                                           | File(s)                                                                                                 | State                                 | Wave                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------- |
| `TaxRegime` `name`/`taxCode`/`taxName`/`taxCredits`; `TaxSlab.base?`; `ContributionScheme.apportionmentMode?`                                                                  | `types/statutory.types.ts`                                                                              | **GAP** (none present)                | non-gated                  |
| Apply `taxCredits`; emit tax line code from `regime.taxCode` (not `'TDS'`)                                                                                                     | `utils/formula.utils.ts`                                                                                | **GAP**                               | non-gated                  |
| `taxCredits` / South-Africa case                                                                                                                                               | `utils/formula.utils.test.ts`, `utils/global-conformance.test.ts`                                       | **GAP**                               | non-gated                  |
| `EmployeeSalaryInput`/`EmployeeSalary` (`legalEntityId`,`currency`,flat bank); `PaySchedule += SEMI_MONTHLY`; `PayCalendarInput += code`; `PayCalendarCycle`; run cycle fields | `types/payroll.types.ts`                                                                                | **GAP**                               | non-gated (types)          |
| **Send `legalEntityId` + `currency`** on assign/PATCH                                                                                                                          | `services/employee-salary.api.ts`                                                                       | **GAP**                               | non-gated                  |
| `getPayCalendarCycles` unwrapping **`data.cycles`**                                                                                                                            | pay-calendar service                                                                                    | **GAP** (no method)                   | gated                      |
| Salary form: add **required** Legal-entity `Select`, send `legalEntityId`+`currency`; `NO_ACTIVE_SALARY` handling                                                              | `modules/employees/components/SalaryAssignmentDrawer.tsx`                                               | **GAP** (scaffolding present, unused) | non-gated                  |
| Legal-entity form: `workWeekPattern` `Select`                                                                                                                                  | `LegalEntityDrawer.tsx` / `LegalEntitiesPanel.tsx`                                                      | **GAP**                               | non-gated                  |
| Pack editor: `apportionmentMode` control                                                                                                                                       | `StatutoryPackEditor.tsx`                                                                               | **GAP** (absent in FE)                | non-gated                  |
| Payslip: fix hardcoded `code==='TDS'` tax summary + `en-IN` locale default                                                                                                     | `PayslipDrawer.tsx:112,107`                                                                             | **GAP** (line render already dynamic) | non-gated                  |
| `INR`/`₹`/`en-IN`/`2026-27`/`PF`-placeholder sweep (~15 files)                                                                                                                 | run tabs, payslip, comp/tax/loans/claims/garnishment cards, migration panels, group/entity/pack drawers | **GAP**                               | non-gated                  |
| Minor-units conversion in pack-config UI                                                                                                                                       | `StatutoryPackEditor.tsx`                                                                               | **DONE** (19 `toMinor/fromMinor`)     | —                          |
| Payslip dynamic line rendering (earnings/deductions/employerContributions)                                                                                                     | `PayslipDrawer.tsx`                                                                                     | **DONE**                              | —                          |
| `mocks/data/payroll-engine.ts` — currency + working-days/hours from config; `taxCode` not `'TDS'`                                                                              | mock engine                                                                                             | **GAP**                               | non-gated (demo only)      |
| Run UI — cycle picker                                                                                                                                                          | `InitiateRunDialog.tsx` + run list/detail                                                               | **GAP**                               | **gated** on backend fixes |

## 12. Sequencing (per the "FE in one pass" decision, now gated)

1. **Backend first:** ship the fixes in `SUBMONTHLY_PAYROLL_DEFECTS_BACKEND_CONTRACT.md`
   (sub-monthly base proration + statutory apportionment robustness + India-line leak), then
   re-run the §13 acceptance numbers.
2. **FE pass (one go):** §1–§7 (now-stable shapes) + §8 (work-week as-shipped) + §9
   (sub-monthly UI) together, validated live. Ship the §9 cycle-run UI **only after** the
   backend acceptance numbers pass.
3. Standard bar on every change: typecheck + lint clean, four states, dark mode + responsive,
   permission gates, no `any`, no raw hex, shadcn `Select` (never native).

---

## 13. Live litmus findings (2026-06-14) — evidence behind this revision

Method: clean QA PH config on the live backend (QA statutory pack with PH TRAIN + SSS
`apportionmentMode: MONTHLY_TOTAL` → PH legal entity, PHP, FY Jan, MON-FRI → monthly +
semi-monthly calendars/groups → employee on ₱1.2M CTC ≈ ₱100k/mo). All QA runs cancelled
after. Full detail in the `payroll-submonthly-live-litmus-2026-06-14` memory.

**Monthly (PH) — PASS.** gross 100,000 → net **81,375**; deductions **SSS_EE 1,750 +
WITHHOLDING_TAX 16,875**; employer **SSS_ER 3,500**; currency **PHP**; FY **2029**
(calendar); **no PF/ESI/TDS**. One run computed INR/PHP/ZAR employees side-by-side. The
old India-fallback bug is fixed for a properly-configured employee.

**Semi-monthly (PH) — FAIL (backend).** H1+H2 each paid a full month → month totals **doubled**
(gross 200k, SSS_EE 3,500, SSS_ER 7,000, tax 43,542 vs expected 100k / 1,750 / 3,500 / ~16,875).
Linking `legalEntityId` fixed **statutory** apportionment (SSS_EE → 875/cycle) but **base pay
and tax stayed full-month** for a FLAT component. Cycle working days were correct (11/12).

**Gaps → owners:**

| #   | Gap                                                                       | Owner            | Where                  |
| --- | ------------------------------------------------------------------------- | ---------------- | ---------------------- |
| 1   | Sub-monthly base pay not per-cycle prorated (gross/tax double)            | Backend          | defects contract Bug 1 |
| 2   | Statutory apportionment silently doubles without `legalEntityId`          | Backend          | defects contract Bug 2 |
| 3   | India `PF_ER/ESI_ER` lines leak onto non-India payslips                   | Backend          | defects contract Bug 3 |
| 4   | Salary must send `legalEntityId` + `currency` (correctness)               | **FE**           | §4                     |
| 5   | Cycles unwrap is `data.cycles`, not `data[]`                              | **FE**           | §9                     |
| 6   | `PayCalendarInput` missing `code`                                         | **FE**           | §9                     |
| 7   | work-week shipped coarsened (enum on entity, no `hoursPerDay`/day-arrays) | Backend (future) | §8                     |
