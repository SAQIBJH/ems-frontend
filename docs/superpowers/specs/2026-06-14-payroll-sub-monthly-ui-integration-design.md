# Payroll Sub-Monthly UI Integration — Design

**Date:** 2026-06-14
**Status:** Approved design → ready for implementation plan
**Source contract:** backend handoff `PASS_RENDER_E2E_VERIFIED` (commit `dda9585`,
Render deploy `dep-d8mopocm0tmc73au9a8g`, QA tenant `Submonthly Payroll QA Inc
20260613-234919`). Evidence: `docs/payroll-submonthly-e2e-evidence/`.

---

## 1. Goal

The backend now computes **sub-monthly payroll** for real (SEMI_MONTHLY, BIWEEKLY,
WEEKLY) with cycle-aware periods, per-entity work-week, and month-capped statutory
apportionment. This closes the gap our `payroll-period-work-pattern-and-controls`
memory flagged as "compute is MONTHLY-ONLY." This effort wires the **frontend UI** to
consume that contract.

It is a **UI integration**, not an engine rewrite. The FE does **not** reimplement
sub-monthly compute, cap-splitting, or working-day math — the backend owns all of it
and the UI renders backend-returned values as-is.

## 2. Posture (locked)

**UI consumes live + MSW shells.** All UI wires to the backend contract. We add
_lightweight_ MSW handlers that return the contract **shape** (cycles endpoint, new
fields) so mock-mode still renders, but we do **not** reimplement sub-monthly compute
or `MONTHLY_TOTAL` apportionment in MSW — real sub-monthly numbers come from the live
backend (`NEXT_PUBLIC_USE_MOCKS=false`). This matches CLAUDE.md §26 ("when backend
ships a documented endpoint, the only change is flipping `USE_MOCKS`").

## 3. Non-negotiables (carried from CLAUDE.md §26 / §13 / §12 / §10)

- **No `country ===` branches**; no hardcoded statutory labels (PF/ESI/TDS/SSS).
  Render whatever `deductions[]` / `employerContributions[]` the backend sends, by `name`.
- **No FE working-day computation** for display — render backend `workingDays` as-is.
- Tokens only, no raw hex. Never a native `<select>` — always shadcn `Select`.
- All four states (loading / empty / error / success). Dark mode + responsive
  (768/1280/1440/1920). Permission gates on sensitive actions. No `any`.

---

## 4. Architecture / data flow

```
Pay Calendar ──(GET /pay-calendars/:id/cycles?from&to)──► [PayCalendarCycle[]]
                                                                │
Run create (Approach B):                                        │
  pick calendar ──► fetch cycles ──► pick cycle ───────────────┘
        │                                  │
        └─ no calendar → month/year → period=YYYY-MM (legacy monthly path)
                                           │
                                           ▼
   POST /payroll/runs { period, paySchedule?, startDate?, endDate?, payDate?, ... }
                                           │
                                           ▼
   PayrollRun { period, periodLabel, paySchedule?, startDate?, endDate?, payDate?, currency }
                                           │
                                           ▼
   GET /runs/:id/payslips ─► Payslip { periodLabel, workingDays, presentDays,
                                       deductions[], employerContributions[], currency }
```

Backend owns cycle generation, compute, cap-splitting, working days. FE selects a
cycle and **renders returned values**.

---

## 5. Work items

### 5.1 Types (`src/modules/payroll/types/`)

| Type                                                         | Change                                                                                                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `PaySchedule` (`payroll.types.ts:13`)                        | `'MONTHLY' \| 'SEMI_MONTHLY' \| 'BIWEEKLY' \| 'WEEKLY'` (add `SEMI_MONTHLY`; now matches `PayFrequency`)                                     |
| **new** `PayCalendarCycle`                                   | `{ period: string; periodLabel: string; startDate: string; endDate: string; payDate: string; cutoffDate: string; paySchedule: PaySchedule }` |
| `PayrollRun`                                                 | `+ startDate?: string; endDate?: string; payDate?: string; paySchedule?: PaySchedule`                                                        |
| `PayrollRunInput`                                            | `+ payCalendarId?: string; startDate?: string; endDate?: string; payDate?: string; paySchedule?: PaySchedule`                                |
| `LegalEntity` + `LegalEntityInput` (`localization.types.ts`) | `+ workWeekPattern: 'MON-FRI' \| 'MON-SAT'` (new `WorkWeekPattern` union; default `'MON-FRI'`)                                               |
| `ContributionScheme` (`statutory.types.ts:64`)               | `+ apportionmentMode?: 'MONTHLY_TOTAL'` (optional; absent = per-cycle, the default)                                                          |

`PaySchedule` vs `PayFrequency`: keep both names (PayGroup uses `PaySchedule`,
PayCalendar uses `PayFrequency`); after the edit they have identical members. Do **not**
merge in this effort — out of scope churn.

### 5.2 Service + hooks (`src/modules/payroll/services`, `/hooks`)

- `getPayCalendarCycles(id: string, params: { from: string; to: string })` →
  `GET /payroll/pay-calendars/:id/cycles` — unwrap `data[]` (its own unwrap; §4 discipline).
- `usePayCalendarCycles(id, range, { enabled })` query hook.
- Run-create service/hook: pass the new optional cycle fields through to `POST /runs`.

### 5.3 MSW shells (`src/mocks/handlers/payroll-*.ts`) — shape only

- **`GET /payroll/pay-calendars/:id/cycles`**: generate contract-shaped cycles from the
  calendar's `frequency` over `[from,to]`:
  - `MONTHLY` → one `YYYY-MM` cycle/month;
  - `SEMI_MONTHLY` → `YYYY-MM-H1` (1–15), `YYYY-MM-H2` (16–end);
  - `WEEKLY` → `YYYY-Wnn` ISO weeks;
  - `BIWEEKLY` → two-week cycles with explicit `startDate/endDate`.
    This is **period scaffolding**, not compute. A small unit test covers the generator's
    period strings + labels (e.g. PH semi-monthly Jan 2057 → `2057-01-H1`, `2057-01-H2`).
- **Run-create handler**: accept and **echo back** `startDate/endDate/payDate/paySchedule`
  on the created run + a derived `periodLabel`. Compute path stays monthly (mock numbers
  unchanged) — no sub-monthly math in MSW.
- **Legal-entity handler**: persist/echo `workWeekPattern` (default `MON-FRI`).
- **Statutory-pack handler**: persist/echo `apportionmentMode` on contribution schemes.

### 5.4 UI (6 screens, each owes all four states + dark/responsive + gates)

1. **Pay Group drawer** (`PayGroupDrawer.tsx`): the schedule `Select` lists all four
   (labels already exist in `constants/index.ts`); the type change makes `SEMI_MONTHLY`
   assignable.
2. **Pay Calendar screen**: a **"Generated cycles"** table for a selected calendar —
   columns `period, periodLabel, startDate, endDate, cutoffDate, payDate, paySchedule`.
   Loading skeleton / empty ("no cycles in range") / error+retry / success. A small
   from/to range control (default: current month → +1) drives `usePayCalendarCycles`.
3. **Run create** (`InitiateRunDialog.tsx`) — **Approach B (progressive disclosure)**:
   - For `REGULAR` / `OFF_CYCLE`: an optional **"Pay calendar"** `Select` above the
     period control. When a calendar is picked → load its cycles → show a **cycle**
     `Select` (renders `periodLabel`); the chosen cycle supplies
     `period/startDate/endDate/payDate/paySchedule` to `POST /runs`.
   - When no calendar is picked → existing month/year → `YYYY-MM` monthly path (unchanged).
   - `BONUS/ARREARS/FNF/REVERSAL` paths unchanged.
4. **Run list + detail** (`PayrollRunsTab.tsx`, `PayrollRunDetail.tsx`): surface
   `periodLabel`, `paySchedule`, `startDate`, `endDate`, `payDate`, `currency`
   (gracefully omit the date/schedule chips when absent — legacy monthly runs).
5. **Payslip** (`PayslipDrawer.tsx`, `MyPayslipsPage.tsx`): **verify** `deductions[]` and
   `employerContributions[]` render dynamically by `name` with **no** hardcoded
   country labels; show `periodLabel`, `startDate/endDate` (when present),
   `workingDays`, `presentDays`. Fix any hardcoded label found.
6. **Legal Entity form**: add a `workWeekPattern` `Select` (`MON-FRI` / `MON-SAT`,
   default `MON-FRI`) to create/edit. Display the value on the entity read view.
   **Statutory pack contribution editor**: add an `apportionmentMode` control
   (e.g. a "Cap as monthly total (split across cycles)" toggle → `MONTHLY_TOTAL` vs unset).

### 5.5 Docs

Append to `docs/newreqphase3.md` **Domain F**: the `GET /pay-calendars/:id/cycles`
endpoint (params, `data[]` cycle shape) and the new run / legal-entity / contribution
fields, cross-referencing this contract and the evidence folder. (§26 frontend-first
record-keeping; here it documents an already-live backend.)

---

## 6. Acceptance (maps to the contract's §11 checklist)

- [ ] `SEMI_MONTHLY` selectable in pay-schedule dropdowns.
- [ ] Pay-calendar cycles endpoint populates selectable periods (no FE period construction).
- [ ] Sub-monthly run create sends `startDate/endDate/payDate/paySchedule` from the cycle.
- [ ] Run list/detail + payslip display `periodLabel/startDate/endDate/payDate/paySchedule`.
- [ ] `deductions[]` and `employerContributions[]` render dynamically — no PF/ESI/TDS/SSS
      hardcoding, no `country ===`.
- [ ] Legal entity `workWeekPattern` create/edit/display.
- [ ] `workingDays` rendered from backend, never computed in FE.
- [ ] `ytd.contributions` NOT used for statutory labels (payslip-level arrays only).
- [ ] Against live backend: PH semi-monthly H1+H2 totals match evidence — gross 100,000,
      tax 16,875, SSS_EE 1,750, SSS_ER 3,500, net 81,375.
- [ ] Each screen: 4 states, dark mode, responsive, permission gates, typecheck + lint clean.

## 7. Out of scope

- Reimplementing sub-monthly compute / `MONTHLY_TOTAL` cap-splitting / work-week
  working-day math in MSW (backend owns it; posture A).
- Merging `PaySchedule` and `PayFrequency` into one type.
- `ytd.contributions` statutory-label rendering (contract says defer; payslip arrays only).
- Any change to the live `/employees`, `/auth`, `/attendance` contracts (§26 data boundary).

## 8. Testing

- `pnpm typecheck` + `pnpm lint` clean per the per-step gate (§26).
- Unit test for the MSW **cycle-period generator** (period strings + labels for
  monthly / semi-monthly / weekly / biweekly). No compute test — FE adds no compute.
- Manual live-backend verification of the PH semi-monthly totals above
  (`NEXT_PUBLIC_USE_MOCKS=false`).
