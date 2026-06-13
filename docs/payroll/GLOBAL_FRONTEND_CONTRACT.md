# Payroll Global-Readiness — Frontend Changes Spec

> **Audience:** us (this repo).
> **Status:** change spec. **Nothing implemented. Decision: do ONE FE integration pass
> after the backend ships everything** (multi-country ✅ already shipped; work-week +
> sub-monthly still pending) — to avoid touching the FE twice. No commit until approved.
> **Pairs with:** `GLOBAL_BACKEND_CONTRACT.md` (done), `WORK_WEEK_BACKEND_CONTRACT.md`
> (pending), `SUBMONTHLY_PAYROLL_BACKEND_CONTRACT.md` (pending).
> **Refreshed 2026-06-13** after the backend's multi-country + income-tax signoff and the
> work-week / bi-weekly litmus findings.

---

## 0. Backend status snapshot (what the FE integrates against)

| Backend item                                                           | Status                | FE impact               |
| ---------------------------------------------------------------------- | --------------------- | ----------------------- |
| Multi-country pack resolution (currency, SSS, fiscal year, components) | ✅ shipped + verified | integrate (§2–§4)       |
| Income tax (`WITHHOLDING_TAX`), `taxCode`/`taxName`/`taxCredits`       | ✅ shipped + verified | types + preview (§1,§3) |
| override-null no longer coerced; partial salary PATCH                  | ✅ shipped            | §4, §5                  |
| **Per-entity work week → working days**                                | ❌ pending            | §6 (gated)              |
| **Bi-weekly / semi-monthly compute**                                   | ❌ pending            | §7 (gated)              |

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
(backend's ZA example used plain numbers).

## 2. Minor-units discipline (backend re-stressed this)

All statutory-pack monetary fields are sent in **minor units** (₱250,000 → `25000000`).
The pack-config UI must convert on write and display on read. Applies to:
`taxRegimes[].standardDeduction`, `slabs[].from/.to/.base`, `taxCredits[].amount`,
`contributionSchemes[].wageCeiling`, `minimumWages[].amount`. (Component values + CTC stay
**major** units — don't convert those.)

## 3. `computeRegimeTax` (`formula.utils.ts`) — `taxCredits` + line code

```ts
let tax = evaluateSlab(afterStd, regime.slabs); // + surcharge + cess
const credits = (regime.taxCredits ?? []).reduce((s, c) => s + c.amount, 0);
return Math.max(0, tax - credits); // floor at 0; inert when absent
```

Mirror the backend order exactly: `max(0, slabTax + surcharge + cess − Σ taxCredits)`.
**Emit the tax line code from `regime.taxCode`** (e.g. `WITHHOLDING_TAX`), **not** the
hardcoded `'TDS'` in `payroll-engine.ts`.

## 4. Salary shape — `legalEntityId` is the source of truth

`src/modules/payroll/types/payroll.types.ts` + `services/employee-salary.api.ts`:

- `EmployeeSalaryInput`: add `legalEntityId`, `currency`, and flat bank fields
  `bankName` / `bankAccountName` / `bankAccountNumber` (replacing/augmenting the old
  `bankAccount: Record`). Keep `country`.
- `EmployeeSalary` (response): add `currency`, `legalEntityId`.
- **Salary-assignment UI:** a **Legal entity `Select`** (shadcn, never native) from
  `GET /payroll/legal-entities`; the entity is authoritative — backend derives
  country/currency from it. Surface them read-only on select. Gate on payroll-admin.
- **Partial PATCH** is supported now — the UI may PATCH single fields (e.g. `bankName`)
  without resending the whole salary.

## 5. Worker assignment + `NO_ACTIVE_SALARY`

`PATCH /payroll/workers/:id` requires an **active salary first**, else returns
`NO_ACTIVE_SALARY`. The UI must catch it and prompt "configure salary first" rather than
showing a generic error.

## 6. Payslip UI — fully dynamic, no India-isms

- Render `deductions` **and** `employerContributions` **dynamically from the response
  arrays** — never hardcode `PF` / `ESI` / `TDS` lines.
- Currency, `periodLabel`, and `ytd.fiscalYear` come **from the response** — never
  computed/formatted as INR or an India fiscal year in the FE.
- Confirm no `PF`/`ESI`/`TDS`/`INR` literals leak into the global payroll UI.

## 7. Mock-engine caveats (demo/offline correctness)

`src/mocks/data/payroll-engine.ts`:

- `CURRENCY = 'INR'` (~L51) → read currency from config (pay group/entity/regime),
  fallback INR.
- `STD_WORKING_DAYS = 22` / `STD_HOURS_PER_DAY = 8` (~L53/56) → from the pay calendar's
  **work pattern** (ties to §8). Default to constants when unset.

## 8. NEW — work-week UI (gated on `WORK_WEEK_BACKEND_CONTRACT.md`)

When the backend adds `workWeekDays` + `hoursPerDay` to the Pay Calendar:

- Pay-calendar config UI gains a **work-week picker** + hours/day.
- The mock-engine working-days fix (§7) reads from it.
- Do **not** wire `settings/attendance-rules` into payroll UI logic.

## 9. NEW — sub-monthly run UI (gated on `SUBMONTHLY_PAYROLL_BACKEND_CONTRACT.md`)

When the backend ships bi-weekly/semi-monthly:

- Add `SEMI_MONTHLY` to FE `PaySchedule` (today `MONTHLY|BIWEEKLY|WEEKLY`).
- Run creation UI: **period/cycle picker** for the group's frequency (the run `period`
  is no longer always `YYYY-MM` — support the backend's cycle identifier, e.g.
  `YYYY-MM-H1`).
- Payslip/period labels render the cycle from the response.

## 10. Tests

- Keep `global-conformance.test.ts` (FE-engine conformance, **not** a backend proof).
- Add a **South Africa** `taxCredits` (rebate) case (§3).
- Add a sub-monthly case once §9 lands.
- Full suite green — India unchanged (regression gate).

## 11. Files to touch (checklist)

- [ ] `types/statutory.types.ts` — `TaxRegime` (`name`/`taxCode`/`taxName`/`taxCredits`), `TaxSlab.base?`
- [ ] `utils/formula.utils.ts` — apply `taxCredits`; line code from `regime.taxCode`
- [ ] `utils/formula.utils.test.ts` + `utils/global-conformance.test.ts` — `taxCredits` / SA case
- [ ] `types/payroll.types.ts` — `EmployeeSalaryInput`/`EmployeeSalary` (`legalEntityId`, `currency`, bank fields); add `SEMI_MONTHLY` to `PaySchedule`
- [ ] `services/employee-salary.api.ts` — send `legalEntityId`; support partial PATCH
- [ ] salary-assignment form — Legal-entity `Select` + `NO_ACTIVE_SALARY` handling
- [ ] payslip components — dynamic deductions/contributions; currency/FY from response; minor-unit handling in pack-config UI
- [ ] `mocks/data/payroll-engine.ts` — currency + working-days/hours from config
- [ ] pay-calendar UI — work-week picker (§8); run UI — cycle picker (§9)

## 12. Sequencing (per the "FE in one pass" decision)

1. **Wait** for backend work-week + sub-monthly to ship (multi-country/income-tax already done).
2. Then **one FE integration pass**: §1–§7 (now-stable shapes) + §8–§9 (the two new backend items) together, validated live against the fully-shipped backend.
3. Standard bar on every change: typecheck + lint clean, four states, dark mode + responsive, permission gates, no `any`, no raw hex, shadcn `Select` (never native).
