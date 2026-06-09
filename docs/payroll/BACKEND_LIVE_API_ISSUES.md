# Payroll Live API — Issues for the Backend Team

> **Status: mostly resolved.** Backend shipped P1–P5 (commit `fe13d18`, see
> `docs/PAYROLL_PHASE3_CONTRACT_FIXES.md`). The frontend **re-verified every fix directly
> against the live Render API on 2026-06-09** (logged in as `superadmin@acme.test`).
> **P1, P3, P4, P5 are confirmed fixed. Two items remain open** — see below.
>
> **Reading convention:** the frontend **ignores extra fields**, so an endpoint returning
> _more_ than we use is fine. An issue is only raised when the live response is **missing a
> field the FE needs**, **renames it**, **changes its type**, or **changes the envelope**.
> A `200` alone does **not** mean an endpoint is correct — only the shape comparison does.

---

## 🔴 OPEN — still needs the backend team (2 items)

### O1 — `pay-calendars.periodAnchor` is a string enum; FE needs an integer

Live returns `periodAnchor: "MONTH_START"` (a **string**) on every calendar. The frontend
`PayCalendar` contract models it as a **day-of-month number (1–28)** — `PayCalendarPanel`
renders `Day {periodAnchor}` and the edit form treats it numerically.

**Impact on the FE today:**

- Displays literally **"Day MONTH_START"**.
- Editing does `Number("MONTH_START") || 1` → silently **coerces the value to `1`**.

**Fix:** return `periodAnchor` as the **integer day-of-month the period starts on**
(`MONTH_START` → `1`). Everything else in the pay-calendar shape is correct
(`frequency`, `payDay`, `cutoffDay`, `payDateRule`, `legalEntityId`, `holidayCalendarId`).
This is the only remaining response-shape mismatch.

### O2 — Wire `statutoryTag` into the PF/ESI calculation engine

This is the backend's own follow-up #1, and it's the **most important remaining item for
correct live payroll**. The field is now stored and returned perfectly (P1 ✅), but the
calculation engine does **not consume it yet** — so a **live payroll run does not compute
PF/ESI from component tags**, and payslip numbers won't reflect the statutory wiring.

**Fix:** in the run calculation, build each contribution scheme's wage base from the
earnings whose `component.statutoryTag` equals the scheme's `wageBaseTag` (e.g. earnings
tagged `PF_WAGE` form the EPF base), then apply the pack's rate/ceiling. The configuration
side is complete; only the runtime computation is missing.

**Reference implementation — the exact algorithm already exists on the frontend.** The
mock calculation engine the UI was built against implements this correctly; the backend
engine can mirror it 1:1. See **`src/mocks/data/payroll-engine.ts`** (the wage-base loop)
and the pure helpers in **`src/modules/payroll/utils/formula.utils.ts`**
(`computeContribution`, `evaluateSlab`). The core wiring:

```ts
// For each contribution scheme in the active statutory pack:
for (const scheme of pack.contributionSchemes) {
  // wage base = sum of earnings whose component.statutoryTag matches the
  // scheme's wageBaseTag (e.g. PF_WAGE). Untagged earnings never enter the base.
  const rawBase = earnings
    .filter((e) => componentByCode.get(e.code)?.statutoryTag === scheme.wageBaseTag)
    .reduce((s, e) => s + e.amount, 0);
  if (rawBase <= 0) continue; // no tagged earnings → scheme not applicable

  // cap at the scheme's wageCeiling, then apply employee/employer rates
  const base = scheme.wageCeiling != null ? Math.min(rawBase, scheme.wageCeiling) : rawBase;
  const employee = Math.round((base * scheme.employee.rate) / 100); // → posts to scheme.employee.component
  const employer = Math.round((base * scheme.employer.rate) / 100); // → posts to scheme.employer.component (employer cost)
}
```

> This is mock/demo code (MSW, runs only with `NEXT_PUBLIC_USE_MOCKS=true`) and is **not**
> the production calculator — payroll must be computed server-side for trust,
> reproducibility, and config-version pinning. It is provided purely as the **authoritative
> spec** for O2: match this logic in the backend engine.

> _Low-priority confirm (not blocking):_ the FE reads payment batches from the **run-scoped**
> endpoint `GET /payroll/runs/:runId/payment-batch` (which should include `lines`), **not**
> the bare `GET /payroll/payment-batches` list — so the list omitting `lines` does not affect
> the FE. Just confirm the run-scoped detail returns `lines`.

---

## Frontend status

- **No FE change required** for P1/P3/P4/P5 — they all align with existing FE types.
  (The earlier defensive `prorate ?? true` guard in the component drawer is now a harmless
  no-op since the backend returns the real value.)
- **O1 is the only FE-affecting item, and it's conditional:** if the backend returns
  `periodAnchor` as an integer, **zero FE change**; if it keeps the string enum, the FE must
  change the type to a string enum and rework the PayCalendar input/display. Waiting on the
  backend decision before touching FE code.

---

## Summary

| Endpoint                                                                                                                                                                              | Verdict                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `GET/POST/PATCH /payroll/components`                                                                                                                                                  | ✅ **P1 RESOLVED** — statutory fields returned & typed |
| `GET /payroll/pay-calendars`                                                                                                                                                          | 🟠 **O1 OPEN** — `periodAnchor` string vs FE number    |
| `GET/POST/PATCH /payroll/legal-entities`                                                                                                                                              | ✅ **P3 RESOLVED** — `active` returned (true/false)    |
| `GET /payroll/employees`                                                                                                                                                              | ✅ **P4 RESOLVED** — `200`, array[70]                  |
| `GET /payroll/migration`                                                                                                                                                              | ✅ **P4 RESOLVED** — matches `MigrationStatus`         |
| `GET /payroll/payment-batches`                                                                                                                                                        | ✅ **P4 RESOLVED** — `200` (FE uses run-scoped detail) |
| `GET /payroll/reports`                                                                                                                                                                | ✅ **P4 RESOLVED** — `200`                             |
| `GET /payroll/settings`                                                                                                                                                               | ✅ **P4 RESOLVED** — `200`                             |
| `GET /payroll/contractor-invoices`                                                                                                                                                    | ✅ **P5 RESOLVED** — seeded, shape matches             |
| `GET /payroll/opening-balances`                                                                                                                                                       | ✅ **P5 RESOLVED** — seeded, shape matches             |
| `statutoryTag` in PF/ESI calculation                                                                                                                                                  | 🔴 **O2 OPEN** — stored/returned but not computed      |
| `GET /payroll/statutory-packs`                                                                                                                                                        | ✅ Fixed & verified (earlier round)                    |
| `countries`, `groups`, `schedules`, `runs`, `roster`, `event-catalogue`, `events`, `payslip-templates`, `reimbursement-categories`, `reimbursement-claims`, `workers`, `cost-summary` | ✅ Verified clean                                      |

---

## Verification evidence (live, 2026-06-09)

**P1 — components** — `GET /payroll/components`, first item:
`statutoryTag:"PF_WAGE"` · `prorate:true` · `payInPeriods:[3,9]` ·
`glAccountCode:null` · `costCenterRule:"DEPARTMENT"` · `createdAt`/`updatedAt` present. ✅

**P3 — legal-entities** — two entities returned: `Acme India Pvt Ltd → active:true`,
`Acme Legacy Entity → active:false`. ✅

**P4 — base paths** — all `200`:
`employees` (array[70], rich shape), `migration` (object matching `MigrationStatus`
exactly), `payment-batches` (array[3]), `reports` (`{reports,recentRuns}`),
`settings` (`{defaultCountry,defaultCurrency,sandboxMode,dataPolicy,features,updatedAt}`). ✅

**P5 — seeded & shape-matched:**

- `contractor-invoices[1]` → `id, workerId, workerName, period, amount, currency, withholdingPct, netPayable, status, payoutRef, submittedAt, decidedAt` ✅
- `opening-balances[1]` → `employeeId, employeeCode, employeeName, fiscalYear, grossEarnings, taxableIncome, taxDeducted, totalDeductions, netPay, contributions, importedAt` ✅

**O1 — pay-calendars** — keys all present, but `periodAnchor:"MONTH_START"` (string) on all
6 calendars; FE expects an integer day-of-month. 🟠

---

## Historical detail (resolved P1–P5)

The original issue write-ups are retained below for reference; all are now **RESOLVED**
except the `periodAnchor` type (O1).

### P1 — `GET /payroll/components` missing statutory fields — ✅ RESOLVED

Was missing `statutoryTag`, `prorate`, `payInPeriods`, `createdAt`, `updatedAt`. Backend now
returns all of them (and accepts them on POST/PATCH); `payInPeriods` is a real `number[]`,
not a JSON string. **Note:** the field is stored/returned but not yet used by the calc engine
— tracked as **O2**.

### P2 — `pay-calendars` shape — ✅ MOSTLY RESOLVED (→ O1)

The scheduling fields (`legalEntityId`, `frequency`, `periodAnchor`, `payDateRule`, `payDay`,
`cutoffDay`, `holidayCalendarId`) are now returned. The **only remaining problem** is the
**type of `periodAnchor`** (string enum vs integer) — see **O1**.

### P3 — `legal-entities.active` — ✅ RESOLVED

`active` is returned on list/create/update; seed includes an active and an inactive entity.

### P4 — base path 404s — ✅ RESOLVED

`/payroll/employees`, `/migration`, `/payment-batches`, `/reports`, `/settings` all return
`200` with contract-aligned shapes. `migration` matches the FE `MigrationStatus` exactly.
(The FE consumes payment batches via the run-scoped detail endpoint, not the bare list.)

### P5 — contractor-invoices & opening-balances — ✅ RESOLVED

Both seeded and reading from their Prisma models; item shapes match the FE
`ContractorInvoice` / `OpeningBalance` types exactly.
