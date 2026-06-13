# Payroll Global-Readiness — Bi-Weekly & Semi-Monthly Backend Contract

> **Audience:** backend team (separate repo).
> **Status:** feature spec. Not implemented. **This is the heaviest remaining payroll
> item — it touches the run-engine core (period model + frequency-aware compute +
> contribution apportionment). Scope as weeks, not days.**
> **Found via:** live staging litmus, 2026-06-13 (`superadmin@acme.test`).
> **Depends on:** `WORK_WEEK_BACKEND_CONTRACT.md` (the cycle proration denominator needs
> the per-entity work pattern). Build that first.

---

## 0. TL;DR

Payroll compute is **monthly-only**. The frequency tags exist as metadata but the engine
ignores them. Customers paying **bi-weekly** (US — every 2 weeks, 26/yr) and
**semi-monthly** (PH / LatAm — "quincena", twice a month, 24/yr) cannot be run correctly.
This must ship before those customers go live.

---

## 1. Reproduction (live, verified)

```
PART 1 — create capability
  POST /payroll/groups paySchedule=MONTHLY/BIWEEKLY/WEEKLY → 201
  POST /payroll/groups paySchedule=SEMI_MONTHLY           → 422 (not in enum)

PART 2 — run period format
  POST /payroll/runs period="2057-01"     → 201 (label "January 2057")
  POST /payroll/runs period="2057-01-H1"  → 422 VALIDATION_ERROR
  POST /payroll/runs period="2057-01-1"   → 422
  POST /payroll/runs period="2057-W01"    → 422
  POST /payroll/runs period="2057-01-16"  → 422
  → only YYYY-MM (monthly) is accepted.

PART 3 — A/B compute (same component, same run)
  MONTHLY-group employee : gross 100000, workingDays 23
  BIWEEKLY-group employee: gross 100000, workingDays 23   ← IDENTICAL
  → paySchedule=BIWEEKLY is a label; the engine computes a full month.
```

**Conclusion:** bi-weekly/semi-monthly is **not supported in compute**. `BIWEEKLY`/`WEEKLY`
are cosmetic on the pay group; `SEMI_MONTHLY` can't even be set; the run period is
month-grained; a sub-monthly group pays a full month.

---

## 2. Required fixes (7 parts)

### 2.1 Enum — add `SEMI_MONTHLY`

Add `SEMI_MONTHLY` to the pay-group `paySchedule` enum (today: `MONTHLY|BIWEEKLY|WEEKLY`).
Align with `PayFrequency` (`MONTHLY|SEMI_MONTHLY|BIWEEKLY|WEEKLY`).

### 2.2 Period model — sub-monthly period identifier

The run `period` must express a sub-monthly cycle. Proposed canonical formats (backend to
confirm):

- Semi-monthly: `YYYY-MM-H1` (1st–15th), `YYYY-MM-H2` (16th–EOM).
- Bi-weekly: `YYYY-Wnn` (ISO week pair) or a cycle id with explicit `startDate`/`endDate`.
- Weekly: `YYYY-Wnn`.
  `POST /payroll/runs` must accept these; the response `periodLabel` reflects the cycle
  ("1–15 Jan 2057"). A run is scoped to one cycle.

### 2.3 Frequency-aware compute

The engine derives **periods-per-year** from the employee's pay group / calendar frequency
(12 / 24 / 26 / 52) — no `if (frequency)` hardcode; read it as data. A cycle's base pay is
the per-cycle share (e.g. monthly ÷ 2 for semi-monthly), then prorated.

### 2.4 Tax — project across the right number of periods

Annual tax projection must divide by the **periods-per-year** (÷24 semi-monthly, ÷26
bi-weekly, ÷52 weekly), not ÷12, with per-cycle YTD true-up. (Reuse the existing YTD
true-up logic, parameterized by periods-per-year.)

### 2.5 Monthly-capped statutory contributions — apportion (the doubling trap)

**Critical correctness item.** Many statutory contributions are **monthly-capped** (SSS
MSC ceiling, EPF/PF ceiling, etc.). Taking the full percentage of the capped base in
**each** sub-monthly cycle **double-charges** the employee/employer. The engine must
apportion the **monthly** contribution across the month's cycles (e.g. compute the monthly
contribution once on the monthly wage base, then split across the 2 semi-monthly cycles),
or otherwise guarantee the month's total equals the monthly-capped amount. Define and
document the apportionment rule per scheme; it must be **config-driven**, not per-country.

### 2.6 Proration denominator — cycle working days

Working days for proration are the **cycle's** working days, computed from the per-entity
work pattern (`WORK_WEEK_BACKEND_CONTRACT.md`) over the cycle's date range — not a full
month. (This is why the work-week contract ships first.)

### 2.7 Pay calendar — generate cycles, cutoffs, pay dates

The Pay Calendar must generate the correct **cycles** for its frequency, each with its own
`cutoffDay`/`payDay`, so runs and inputs align to the cycle (not the calendar month).

---

## 3. Acceptance test

Semi-monthly (PH) employee, monthly gross ₱100,000, two cycles `2057-01-H1` / `2057-01-H2`:

- [ ] Each cycle pays ≈ **₱50,000** (per-cycle share + cycle proration), not ₱100,000.
- [ ] Income tax across the two cycles **sums to the correct monthly tax** (₱16,875),
      projected on a 24-period basis.
- [ ] **SSS is NOT doubled** — the month's SSS_EE totals ₱1,750 (apportioned across the
      two cycles), employer ₱3,500.
- [ ] Cycle working days come from the entity work pattern over the cycle's date range.
- [ ] A monthly-frequency employee is **byte-identical** to today (no regression).
- [ ] Bi-weekly (US) employee over 26 periods: tax projected ÷26; monthly-capped
      contributions apportioned so a calendar month's total matches the monthly cap.

## 4. Must-not-change

- Existing **monthly** payroll is identical (the monthly path is the default).
- No hardcoded country/frequency branches — periods-per-year and apportionment are data.
- PAID runs immutable; corrections via arrears/off-cycle.
