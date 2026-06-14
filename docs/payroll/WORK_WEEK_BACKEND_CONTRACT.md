# Payroll Global-Readiness — Work-Week / Working-Days Backend Contract

> **Audience:** backend team (separate repo).
> **Status:** **FE IMPLEMENTED (2026-06-14), backend still owes the array.** The backend
> shipped only a coarse `workWeekPattern: 'MON-FRI' | 'MON-SAT'` enum — which cannot express
> a UAE Sun–Thu, a 4-day week, etc. The frontend is now fully configurable: the Legal Entity
> form edits `workWeekDays: WeekDay[]` (7-day toggle) + `hoursPerDay`, and **sends both
> `workWeekDays` + `hoursPerDay` AND a best-effort derived `workWeekPattern`** so today's
> backend keeps working. \*\*Backend ask (unchanged): accept + persist + return `workWeekDays[]`
>
> - `hoursPerDay` per §2.1 and compute working days from them (§2.2).** Until then, arbitrary
>   weeks (e.g. UAE Sun–Thu) cannot round-trip against live — the coarse enum loses them.
>   **Found via:** live staging test, 2026-06-13 (`superadmin@acme.test`).
>   **Depends on / blocks:\*\* this is a prerequisite for sub-monthly payroll
>   (`SUBMONTHLY_PAYROLL_BACKEND_CONTRACT.md`) — the cycle proration denominator needs it.

---

## 0. TL;DR

Payroll computes **working days from a hardcoded Mon–Fri** week. It ignores both the
tenant `settings/attendance-rules.work_week_days` **and** any per-entity calendar. So a
Middle-East legal entity (Sun–Thu work week, Fri–Sat weekend) gets the **wrong**
working-days → wrong proration (LOP, mid-period join/exit, OT rate). The work week must
become **per-legal-entity configuration**.

---

## 1. Reproduction (live, verified)

```
1. GET  /settings/attendance-rules            → work_week_days = [MON..FRI]
2. POST /payroll/runs (period 2053-03) + calculate
   → India employee payslip workingDays = 21  (= Mon–Fri weekdays in Mar 2053) ✓
3. PATCH /settings/attendance-rules  work_week_days = [MON..SAT]   (add Saturday)
4. POST /payroll/runs (period 2053-04) + calculate
   → workingDays = 22  (= Mon–Fri weekdays in Apr 2053)   ✗  (Mon–Sat would be 26)
```

**Expected:** after the work week includes Saturday, working days should rise (Mon–Sat).
**Actual:** working days stayed Mon–Fri → payroll is hardcoded Mon–Fri, decoupled from
any work-week setting.

Also confirmed from the data model: `PayCalendar` has **no work-week field** (only
`frequency`, `periodAnchor`, `cutoffDay`, `payDay`, `holidayCalendarId`); the legal
entity has none either. There is nowhere per-entity to express the work week today.

---

## 2. Required fix

### 2.1 Add the work pattern to the per-entity Pay Calendar

```jsonc
// PayCalendar — new fields
"workWeekDays": ["MON","TUE","WED","THU","FRI"],   // the working days for this entity
"hoursPerDay": 8                                   // standard paid hours/day (OT rate, hourly workers)
```

Rationale: the Pay Calendar is already **per legal entity** and is the natural home for
"when + how many days count." UAE entity → `["SUN","MON","TUE","WED","THU"]`; India →
Mon–Fri. (`hoursPerDay` replaces the hardcoded `STD_HOURS_PER_DAY` for the OT hourly rate.)

### 2.2 Engine computes working days from the entity calendar, not a constant

For each employee+period:

- Resolve the employee's **legal entity → its Pay Calendar → `workWeekDays`**.
- `workingDays(period)` = count of `workWeekDays` dates in the period **minus** holidays
  from the calendar's `holidayCalendarId` that fall on working days.
- Use this as the **proration denominator** (`pay = monthly × (workingDays − lopDays) /
workingDays`) and for the OT hourly rate (`basic ÷ (workingDays × hoursPerDay)`).
- **No hardcoded Mon–Fri, no `STD_WORKING_DAYS = 22`.**

### 2.3 Source-of-truth rule

Do **not** read `settings/attendance-rules.work_week_days` in the payroll engine — it's
tenant-wide and single-country. The tenant Attendance Rules may **seed the default**
`workWeekDays` when a Pay Calendar is created, but the per-entity Pay Calendar is the
authoritative source for payroll working days. Fallback to Mon–Fri only if a calendar
has no `workWeekDays` (back-compat).

---

## 3. Acceptance test

- [ ] India entity (Mon–Fri) run → working days **unchanged** from today (no regression).
- [ ] UAE entity (`workWeekDays = SUN..THU`) run → working days reflect **Sun–Thu**, and
      a Friday/Saturday is **not** a working day; LOP/proration use that denominator.
- [ ] A holiday on a working day reduces working days by 1; a holiday on a non-working
      day has no effect.
- [ ] OT hourly rate uses the entity's `hoursPerDay`.

## 4. Must-not-change

- Existing India payroll numbers identical (default Mon–Fri when `workWeekDays` unset).
- Tenant `settings/attendance-rules` keeps its current role for **attendance** (presence);
  it does not drive payroll directly.
