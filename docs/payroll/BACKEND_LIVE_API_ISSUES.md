# Payroll Live API — Issues for the Backend Team

> **Verified directly against the live Render API on 2026-06-09** (logged in as
> `superadmin@acme.test`), comparing each endpoint's real response to the frontend's
> TypeScript types. This is wire-truth, not docs.
>
> **Reading convention:** the frontend **ignores extra fields**, so an endpoint returning
> _more_ than we use is fine. An issue is only raised when the live response is **missing
> a field the FE needs**, **renames it**, or **changes the envelope**. A `200` alone does
> **not** mean an endpoint is correct — only the shape comparison below does.

---

## Summary

| Endpoint                                                  | Verdict                               |
| --------------------------------------------------------- | ------------------------------------- |
| `GET /payroll/statutory-packs`                            | ✅ Fixed & verified (separate thread) |
| `GET /payroll/components`                                 | 🔴 **P1 — missing statutory fields**  |
| `GET /payroll/pay-calendars`                              | 🟠 **P2 — shape mismatch**            |
| `GET /payroll/legal-entities`                             | 🟡 **P3 — missing `active`**          |
| `GET /payroll/countries`                                  | ✅ Match                              |
| `GET /payroll/groups` (+ nested `components[]`)           | ✅ Match                              |
| `GET /payroll/schedules`                                  | ✅ Match (live returns a superset)    |
| `GET /payroll/runs`                                       | ✅ Match                              |
| `GET /payroll/roster`                                     | ✅ Match                              |
| `GET /payroll/event-catalogue`                            | ✅ Match (extra `color`)              |
| `GET /payroll/events`                                     | ✅ Match                              |
| `GET /payroll/payslip-templates`                          | ✅ Match                              |
| `GET /payroll/reimbursement-categories`                   | ✅ Match                              |
| `GET /payroll/reimbursement-claims` (+ nested `claims[]`) | ✅ Match (extra `categoryLabel`)      |
| `GET /payroll/workers`                                    | ✅ Match (extra `employeeCode`)       |
| `GET /payroll/cost-summary` (+ nested `groups[]`)         | ✅ Match                              |
| `GET /payroll/contractor-invoices`                        | ❔ Unverifiable — empty list          |
| `GET /payroll/opening-balances`                           | ❔ Unverifiable — empty list          |
| `/payroll/employees`                                      | ⛔ **404 — not implemented**          |
| `/payroll/migration`                                      | ⛔ **404 — not implemented**          |
| `/payroll/payment-batches`                                | ⛔ **404 — not implemented**          |
| `/payroll/reports`                                        | ⛔ **404 — not implemented**          |
| `/payroll/settings`                                       | ⛔ **404 — not implemented**          |

---

## 🔴 P1 — `GET /payroll/components` is missing the statutory fields

This is the most important one — it breaks the statutory wiring (PF/ESI/TDS) in the UI.

**Live returns (per component):**

```
id, name, code, type, calculationType, value, basisCode, formula,
taxable, active, displayOrder, description, color, amount
```

**Frontend requires (missing on live, on every component checked):**

| Missing field      | Type               | Why it matters                                                                                                                                                                                                                                        |
| ------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`statutoryTag`** | `string \| null`   | **Critical.** Links an earning to a contribution scheme's `wageBaseTag` (e.g. `BASIC.statutoryTag = "PF_WAGE"` → forms the PF wage base). Without it, HR can't see/set which earnings feed PF/ESI, and the base can't be computed from configuration. |
| **`prorate`**      | `boolean`          | Whether the component is reduced by loss-of-pay. Arrives `undefined` → the Prorate switch breaks (uncontrolled→controlled) and defaults off.                                                                                                          |
| **`payInPeriods`** | `number[] \| null` | Months a component is paid in (13th-month etc.).                                                                                                                                                                                                      |
| **`createdAt`**    | `string`           | Audit/sort.                                                                                                                                                                                                                                           |
| **`updatedAt`**    | `string`           | Audit/sort.                                                                                                                                                                                                                                           |

**Extra fields live adds (harmless, FE ignores):** `color`, `amount`.

**Fix:**

- Return `statutoryTag`, `prorate`, `payInPeriods`, `createdAt`, `updatedAt` on `GET` (list and by-id).
- Accept the same fields on `POST` / `PATCH`.
- **Confirm the backend _stores_ `statutoryTag`** (not just echoes it) so the calculation engine actually uses it for the PF/ESI wage base.
- Optional: also accept/return `glAccountCode`, `costCenterRule` (FE treats these as optional, so not blocking).

---

## 🟠 P2 — `GET /payroll/pay-calendars` shape doesn't match

The pay-calendar screen reads scheduling rules that the live response doesn't contain.

**Live returns:**

```
id, tenantId, name, code, country, paySchedule, firstPayDate, createdAt, updatedAt
```

**Frontend `PayCalendar` requires:**

```
id, name, legalEntityId, frequency, periodAnchor, payDateRule,
payDay, cutoffDay, holidayCalendarId, createdAt, updatedAt
```

**Missing on live:** `legalEntityId`, `frequency`, `periodAnchor`, `payDateRule`, `payDay`,
`cutoffDay`, `holidayCalendarId`.
**Present on live but not used by FE:** `code`, `country`, `paySchedule`, `firstPayDate`.

> Note: the scheduling fields the FE wants (`periodAnchor`, `payDateRule`, `cutoffDay`)
> _do_ appear on **`GET /payroll/schedules`**, so the two concepts may have been modelled
> differently than the FE expects.

**Fix (please confirm intended design):** either return the scheduling fields on
`pay-calendars` (so the calendar screen has `frequency`, `periodAnchor`, `payDateRule`,
`payDay`, `cutoffDay`, `holidayCalendarId`, `legalEntityId`), **or** tell us the calendar
screen should source those from `/payroll/schedules` and we'll re-point the FE.

---

## 🟡 P3 — `GET /payroll/legal-entities` is missing `active`

**Live returns:** `id, tenantId, name, country, currency, fiscalYearStartMonth, timezone,
locale, registrationIds, statutoryPackId, payCalendarId, createdAt, updatedAt`

**Missing:** **`active`** (`boolean`). The FE shows an Active/Inactive status badge and
filters the entity picker by it; without it, entities render as inactive/blank.

**Fix:** include `active` on `GET` (and accept it on `POST`/`PATCH`). Extra `tenantId` is fine.

---

## ⛔ Not implemented (404) — these FE screens break with mocks off

| Path                           | Screen affected                                      |
| ------------------------------ | ---------------------------------------------------- |
| `GET /payroll/employees`       | (payroll employee list / salary roster base path)    |
| `GET /payroll/migration`       | Migration / go-live wizard                           |
| `GET /payroll/payment-batches` | Disbursement — bank file & reconciliation            |
| `GET /payroll/reports`         | Reports → Payroll (registers, pay equity, summaries) |
| `GET /payroll/settings`        | Payroll settings (data policy, etc.)                 |

**Fix / confirm:** implement these, **or** confirm whether they live under different
paths/sub-paths (e.g. `/payroll/employees/:id/salary`) so the FE can be re-pointed. Until
then these screens error when `NEXT_PUBLIC_USE_MOCKS=false`.

---

## ❔ Unverifiable — endpoint works but returned no data

Both responded `200` with an **empty array**, so the item shape couldn't be checked:

- `GET /payroll/contractor-invoices` → `[]`
- `GET /payroll/opening-balances` → `[]`

**Ask:** please seed at least one record (or share the serializer) so we can verify the
item shape. Expected fields:

- **ContractorInvoice:** `id, workerId, workerName, period, amount, currency, withholdingPct, netPayable, status, payoutRef, submittedAt, decidedAt`
- **OpeningBalance:** `employeeId, employeeCode, employeeName, fiscalYear, grossEarnings, taxableIncome, taxDeducted, totalDeductions, netPay, contributions, importedAt`

---

## ✅ Verified clean (no action needed)

These matched the FE types exactly (extra fields noted in parentheses are harmless):

`countries`, `groups` (+ nested `components[]`), `schedules` (live superset), `runs`,
`roster`, `event-catalogue` (extra `color`), `events`, `payslip-templates`,
`reimbursement-categories` (extra `id`/`tenantId`/`createdAt`/`color`),
`reimbursement-claims` (+ nested `claims[]`, extra `categoryLabel`),
`workers` (extra `employeeCode`), `cost-summary` (+ nested `groups[]`).

---

## Priority order to fix

1. **P1 `components.statutoryTag`** (+ `prorate`, `payInPeriods`, timestamps) — unblocks the core PF/ESI/TDS configuration.
2. **P2 `pay-calendars`** shape (or confirm it's `schedules`).
3. **P3 `legal-entities.active`**.
4. The five **404** endpoints (or confirm alternate paths).
5. Seed **contractor-invoices** / **opening-balances** so we can verify their shapes.

When each is fixed, the frontend needs **no code change** for the matched ones — we only
adapt where you tell us a field genuinely moved (e.g. pay-calendars → schedules).
