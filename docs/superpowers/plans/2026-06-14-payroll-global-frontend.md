# Payroll Global-Readiness — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the frontend to the now-multi-country payroll backend so payslips, salary config, and the tax engine are 100% config-driven (no India-isms), and ship the correctness-critical `legalEntityId` salary fix — without changing any existing India numbers.

**Architecture:** Two waves. **Wave 0 (non-gated)** is safe to run now — it aligns types to the backend's shipped shape, adds `taxCredits` to the tax engine, sends `legalEntityId`/`currency` on salary (the FE half of sub-monthly statutory Bug #2), and sweeps India literals out of the UI. **Wave 1 (gated)** is the cycle-based sub-monthly run UI; it ships only after the backend closes the 3 defects in `SUBMONTHLY_PAYROLL_DEFECTS_BACKEND_CONTRACT.md` and a live re-verify passes. Every change is additive or reads existing config; `global-conformance.test.ts` stays green as the India regression gate.

**Tech Stack:** Next.js 15 (App Router) · TypeScript strict · TanStack Query v5 · React Hook Form + Zod · shadcn/ui · Vitest + RTL · MSW. Money is integer minor units (statutory) / major units (component values + CTC). Dates `YYYY-MM-DD`.

**Source of truth:** `docs/payroll/GLOBAL_FRONTEND_CONTRACT.md` (the change spec this plan executes) and `docs/payroll/SUBMONTHLY_PAYROLL_DEFECTS_BACKEND_CONTRACT.md` (the backend gate for Wave 1). Live evidence: the `payroll-submonthly-live-litmus-2026-06-14` memory.

> **UPDATE 2026-06-14 — backend shipped the 3-bug fix (live, 17/17 acceptance, commit `1401977`). Wave 1 is now UNGATED.** No payload **shapes** changed — only values (per-cycle FLAT share; statutory resolves from pay group/calendar independent of `legalEntityId`; empty `employerContributions[]` when a pack has no schemes). The handoff also surfaced a **new live FE crash** — fixed below as **Task 0**.
>
> **Backend contract notes confirmed in the handoff (code against these):**
>
> - **Run-header `currency` may be the non-ISO sentinel `"MULTI"`** (a run spanning multiple pay-group currencies). **Per-payslip `currency` is always a valid ISO code.** Never feed a run-header currency to `Intl.NumberFormat({style:'currency'})` unguarded — see Task 0.
> - `POST /payroll/runs/:id/calculate` requires an **empty object `{}`** body (no body → 422). Synchronous server-side; payslips ready when it returns 202.
> - **Run scoping:** `REGULAR` runs compute **all** active salaries; only `OFF_CYCLE`/`FNF` honour `employeeIds`.
> - Cycles unwrap is `data.cycles` (nested), `POST /payroll/pay-calendars` requires `code`, statutory-pack create needs `rounding`/`proration` objects, salary `legalEntityId`+`currency` accepted on write — all already in Tasks 3/4/11.

---

## Task 0: Guard the non-ISO `currency: "MULTI"` run-header sentinel — ✅ DONE 2026-06-14

**Status:** COMPLETE (TDD). Backend's end-to-end test crashed the whole `/payroll` list + `/payroll/[runId]` with `RangeError: Invalid currency code : MULTI` — a multi-currency run returns `currency: "MULTI"` on the run header, which `Intl.NumberFormat({style:'currency'})` rejects.

- [x] **RED:** added 5 tests to `src/modules/payroll/utils/money.utils.test.ts` reproducing the exact `RangeError` on `formatMajor(_, 'MULTI')` / `formatMoney(_, 'MULTI')` + `isFormattableCurrency` cases.
- [x] **GREEN:** added `isFormattableCurrency(code)` (rejects non-`/^[A-Z]{3}$/` codes incl. `"MULTI"`) and made `formatMajor` fall back to `style:'decimal'` + code suffix (e.g. `"50,000 MULTI"`) for non-ISO codes. `formatMoney` inherits the guard. `src/modules/payroll/utils/money.utils.ts`.
- [x] **Routed the 4 components that had their own raw `toLocaleString('en-IN',{style:'currency'})` helper** through the guarded `formatMajor` (they each take a run-header currency): `PayrollRunDetail.tsx` (`fmtCurrency`), `DisbursementPanel.tsx` (`fmtCurrency`), `JournalPanel.tsx` (`fmtCurrency`), `CompStatementCard.tsx` (`fmtMoney`). `PayrollRunsTab.tsx`'s `fmtInr` already routed through `formatMajor` → fixed by the central guard.
- [x] **Gate:** `pnpm typecheck` clean · `pnpm lint` 0 errors · `pnpm test src/modules/payroll` 72/72.
- [ ] **Commit (pending user):** `fix(payroll): guard non-ISO "MULTI" run-header currency before Intl.NumberFormat`
- Deferred to Task 6 sweep (not MULTI crash sites — payslip currency is always ISO): `PayslipDrawer.tsx`, `MyPayslipsPage.tsx` still use raw `en-IN`/`style:'currency'`.

**Standing bar on every task (CLAUDE.md §12/§13/§15/§26):** `pnpm typecheck` + `pnpm lint` clean; no `any`; no raw hex; shadcn `Select` (never native); four states; dark mode + responsive; permission gates. Commit one functional change per task (user rule: one commit per feature).

---

## File Structure

**Wave 0 — types & engine (`src/modules/payroll/`):**

- `types/statutory.types.ts` — add `TaxCredit`, extend `TaxRegime` (`name`/`taxCode`/`taxName`/`taxCredits`), `TaxSlab.base?`, `ContributionScheme.apportionmentMode?`.
- `utils/formula.utils.ts` — `computeRegimeTax` subtracts `taxCredits`.
- `utils/formula.utils.test.ts`, `utils/global-conformance.test.ts` — taxCredits + South-Africa cases.
- `types/payroll.types.ts` — `PaySchedule += SEMI_MONTHLY`; `EmployeeSalary`/`EmployeeSalaryInput` add `legalEntityId`/`currency` + flat bank; `PayCalendarInput += code`; new `PayCalendarCycle`.
- `services/employee-salary.api.ts` — no logic change (spreads input); covered by the type change.

**Wave 0 — UI:**

- `src/modules/employees/components/SalaryAssignmentDrawer.tsx` — required Legal-entity `Select`; send `legalEntityId`+`currency`; `NO_ACTIVE_SALARY` handling.
- `src/modules/payroll/components/PayslipDrawer.tsx` — kill hardcoded `'TDS'` tax-summary lookup + `en-IN` default.
- India-literal sweep across ~15 components (enumerated in Task 7).
- `LegalEntityDrawer.tsx` — `workWeekPattern` `Select`.
- `StatutoryPackEditor.tsx` — `apportionmentMode` control + minor-units for new fields + drop `2026-27`/`INR` placeholders.
- `src/mocks/data/payroll-engine.ts` — currency/working-days/`taxCode` from config (demo correctness).

**Wave 1 — gated:**

- pay-calendar service — `getPayCalendarCycles` unwrapping `data.cycles`.
- `InitiateRunDialog.tsx` + run list/detail + payslip — cycle picker & cycle labels.

---

# WAVE 0 — NON-GATED (run now)

## Task 1: Align `TaxRegime` / `TaxSlab` / `ContributionScheme` to the shipped backend shape

**Files:**

- Modify: `src/modules/payroll/types/statutory.types.ts:25-52,64-78`

- [ ] **Step 1: Add `TaxCredit` and extend `TaxSlab`**

In `src/modules/payroll/types/statutory.types.ts`, replace the `TaxSlab` interface (lines 25-32) with:

```ts
/* Progressive income-tax regime (consumed by the `SLAB()` function in Step 98). */
export interface TaxSlab {
  /** Annual lower bound, minor units (inclusive). */
  from: number;
  /** Annual upper bound, minor units (exclusive); `null` = no ceiling. */
  to: number | null;
  /** Marginal rate, percent. */
  rate: number;
  /** Precomputed cumulative tax up to `from`, minor units. Optional — backend may send it. */
  base?: number;
}

/** Annual tax credit / rebate (SA primary rebate, KE personal relief). Minor units. */
export interface TaxCredit {
  code: string;
  /** Annual credit amount, minor units. */
  amount: number;
}
```

- [ ] **Step 2: Extend `TaxRegime`**

Replace the `TaxRegime` interface (lines 40-52) with:

```ts
export interface TaxRegime {
  code: string;
  /** Human label, e.g. "Philippines TRAIN". Optional — newer backend field. */
  name?: string;
  /** e.g. "2026-27" (IN) or "2026" (US). */
  fiscalYear: string;
  /** ISO 4217. */
  currency: string;
  /** Minor units. */
  standardDeduction: number;
  slabs: TaxSlab[];
  surcharge?: TaxSurcharge[];
  cess?: { rate: number } | null;
  /** Annual rebates/credits subtracted after slab+surcharge+cess (SA, KE). */
  taxCredits?: TaxCredit[];
  /** Deduction line code the tax posts to, e.g. "WITHHOLDING_TAX" (not hardcoded "TDS"). */
  taxCode?: string;
  /** Deduction line display name. */
  taxName?: string;
  allowedExemptions?: string[];
}
```

- [ ] **Step 3: Add `apportionmentMode` to `ContributionScheme`**

In the `ContributionScheme` interface (lines 64-78), add after `applicability?`:

```ts
  /**
   * How a monthly-capped contribution apportions across sub-monthly cycles.
   * `MONTHLY_TOTAL` = the cap is monthly; cycles share it. Optional — backend
   * additive field, absent on existing IN packs (verified live 2026-06-14).
   */
  apportionmentMode?: 'MONTHLY_TOTAL' | 'PER_CYCLE';
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (additive optional fields; no existing call site breaks).

- [ ] **Step 5: Commit**

```bash
git add src/modules/payroll/types/statutory.types.ts
git commit -m "feat(payroll): align TaxRegime/TaxSlab/ContributionScheme to shipped backend shape"
```

---

## Task 2: `computeRegimeTax` subtracts `taxCredits` (TDD)

**Files:**

- Test: `src/modules/payroll/utils/formula.utils.test.ts`
- Modify: `src/modules/payroll/utils/formula.utils.ts:64-77`

- [ ] **Step 1: Write the failing test**

Add to `src/modules/payroll/utils/formula.utils.test.ts` (import `computeRegimeTax` and `TaxRegime` if not already imported):

```ts
describe('computeRegimeTax — taxCredits', () => {
  const base: TaxRegime = {
    code: 'ZA',
    fiscalYear: '2029-30',
    currency: 'ZAR',
    standardDeduction: 0,
    slabs: [{ from: 0, to: null, rate: 10 }],
  };

  it('subtracts annual tax credits, floored at 0', () => {
    // slab tax = 100000 * 10% = 10000; credit 1700 -> 8300
    const r = computeRegimeTax(100000, {
      ...base,
      taxCredits: [{ code: 'PRIMARY_REBATE', amount: 1700 }],
    });
    expect(r).toBe(8300);
  });

  it('never returns negative when credits exceed tax', () => {
    const r = computeRegimeTax(10000, {
      ...base,
      taxCredits: [{ code: 'PRIMARY_REBATE', amount: 99999 }],
    });
    expect(r).toBe(0);
  });

  it('is inert when taxCredits is absent (India unchanged)', () => {
    const r = computeRegimeTax(100000, base);
    expect(r).toBe(10000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/modules/payroll/utils/formula.utils.test.ts`
Expected: the first two cases FAIL (current code ignores `taxCredits`); the third passes.

- [ ] **Step 3: Implement the credit subtraction**

In `src/modules/payroll/utils/formula.utils.ts`, replace the body of `computeRegimeTax` (lines 64-77) with:

```ts
export function computeRegimeTax(taxableAnnual: number, regime: TaxRegime): number {
  const afterStd = Math.max(0, taxableAnnual - (regime.standardDeduction ?? 0));
  let tax = evaluateSlab(afterStd, regime.slabs);

  if (regime.surcharge && regime.surcharge.length > 0) {
    const band = regime.surcharge
      .filter((s) => taxableAnnual > s.thresholdAnnual)
      .sort((a, b) => b.thresholdAnnual - a.thresholdAnnual)[0];
    if (band) tax += tax * (band.rate / 100);
  }

  if (regime.cess) tax += tax * (regime.cess.rate / 100);

  // Annual credits/rebates apply last, after slab+surcharge+cess; floor at 0.
  // Mirrors the backend order exactly. Inert when absent.
  const credits = (regime.taxCredits ?? []).reduce((sum, c) => sum + c.amount, 0);
  return Math.max(0, tax - credits);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/modules/payroll/utils/formula.utils.test.ts`
Expected: PASS (all three cases).

- [ ] **Step 5: Commit**

```bash
git add src/modules/payroll/utils/formula.utils.ts src/modules/payroll/utils/formula.utils.test.ts
git commit -m "feat(payroll): apply taxCredits in computeRegimeTax (floored at 0)"
```

---

## Task 3: Extend payroll types — `SEMI_MONTHLY`, salary `legalEntityId`/`currency`/flat bank, `PayCalendarInput.code`, `PayCalendarCycle`

**Files:**

- Modify: `src/modules/payroll/types/payroll.types.ts:13,163-196,1075-1084`

- [ ] **Step 1: Add `SEMI_MONTHLY` to `PaySchedule`**

Replace line 13:

```ts
export type PaySchedule = 'MONTHLY' | 'SEMI_MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
```

- [ ] **Step 2: Add `legalEntityId`/`currency`/flat bank to `EmployeeSalary` (response)**

In the `EmployeeSalary` interface (lines 163-186), add after `country` (line 172):

```ts
/** Authoritative legal entity — backend derives currency + pay calendar from it. */
legalEntityId: string | null;
/** ISO 4217 — present on the live response (null until the FE sends it on write). */
currency: string | null;
```

- [ ] **Step 3: Add the same to `EmployeeSalaryInput`**

Replace the `EmployeeSalaryInput` interface (lines 188-196) with:

```ts
export interface EmployeeSalaryInput {
  payGroupId: string;
  annualCtc: number;
  effectiveFrom: string;
  country: string;
  /** Required for any multi-frequency tenant — correctness-critical (statutory apportionment). */
  legalEntityId?: string;
  /** ISO 4217; defaults from the chosen legal entity. */
  currency?: string;
  residenceJurisdiction?: string;
  workLocations?: WorkLocation[];
  bankAccount: Record<string, string>;
}
```

> Note: the `bankAccount: Record` shape is retained — the country bank schema (`useBankSchema`) already drives the fields dynamically, so flat `bankName`/`bankAccountNumber` are just keys within the record. No separate flat fields needed.

- [ ] **Step 4: Add `code` to `PayCalendarInput`**

Replace the `PayCalendarInput` interface (lines 1075-1084) with:

```ts
export interface PayCalendarInput {
  name: string;
  /** Backend requires a unique code on create (verified live 2026-06-14). */
  code: string;
  legalEntityId: string | null;
  frequency: PayFrequency;
  periodAnchor: number;
  payDateRule: PayDateRule;
  payDay: number | null;
  cutoffDay: number;
  holidayCalendarId: string | null;
}
```

- [ ] **Step 5: Add `PayCalendarCycle` type (consumed in Wave 1)**

Add immediately after the `PayCalendar` interface (after line 1073):

```ts
/** One sub-monthly cycle from `GET /payroll/pay-calendars/:id/cycles` (unwrap `data.cycles`). */
export interface PayCalendarCycle {
  /** Cycle id used as a run `period`, e.g. "2057-01-H1" or "2057-W01". */
  period: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  payDate: string;
  cutoffDate: string;
  paySchedule: PaySchedule;
}
```

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: PASS. If `PayCalendarInput` now requires `code` and a form/builder omits it, fix that call site to pass `code` (slugify the name as a default) in this same task.

- [ ] **Step 7: Commit**

```bash
git add src/modules/payroll/types/payroll.types.ts
git commit -m "feat(payroll): add SEMI_MONTHLY, salary legalEntityId/currency, PayCalendar code + cycle types"
```

---

## Task 4: Salary form sends `legalEntityId` + `currency` (correctness-critical — FE half of Bug #2)

**Files:**

- Modify: `src/modules/employees/components/SalaryAssignmentDrawer.tsx`

- [ ] **Step 1: Add `legalEntityId` + `currency` to the Zod schema**

In `SalaryAssignmentDrawer.tsx`, replace the schema (lines 37-44) with:

```ts
const salaryAssignmentSchema = z.object({
  payGroupId: z.string().min(1, 'Pay group is required'),
  legalEntityId: z.string().min(1, 'Legal entity is required'),
  annualCtc: z.number().min(1, 'CTC must be greater than 0'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  country: z.string().min(2, 'Country is required'),
  currency: z.string().min(3, 'Currency is required'),
  residenceJurisdiction: z.string(),
  bankAccount: z.record(z.string(), z.string()),
});
```

- [ ] **Step 2: Default and reset the new fields from the chosen entity**

Add a helper above `form` and extend both `defaultValues` and the two `form.reset` calls so they carry `legalEntityId` and `currency`. Replace lines 71-111 with:

```ts
const defaultEntity = entities.find((e) => e.id === activeEntityId) ?? entities[0];
const defaultCountry = defaultEntity?.country ?? 'IN';
const defaultCurrency = defaultEntity?.currency ?? 'INR';

const form = useForm<FormValues>({
  resolver: zodResolver(salaryAssignmentSchema),
  defaultValues: {
    payGroupId: '',
    legalEntityId: '',
    annualCtc: 0,
    effectiveFrom: '',
    country: 'IN',
    currency: 'INR',
    residenceJurisdiction: '',
    bankAccount: {},
  },
});

const country = form.watch('country');
const { data: bankSchema = [], isLoading: schemaLoading } = useBankSchema(country);

/* Populate form when opening */
useEffect(() => {
  if (!open) return;
  if (existing) {
    form.reset({
      payGroupId: existing.payGroupId,
      legalEntityId: existing.legalEntityId ?? defaultEntity?.id ?? '',
      annualCtc: existing.annualCtc,
      effectiveFrom: existing.effectiveFrom,
      country: existing.country || defaultCountry,
      currency: existing.currency || defaultCurrency,
      residenceJurisdiction: existing.residenceJurisdiction ?? '',
      bankAccount: existing.bankAccount ?? {},
    });
  } else {
    form.reset({
      payGroupId: payGroups[0]?.id ?? '',
      legalEntityId: defaultEntity?.id ?? '',
      annualCtc: 0,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      country: defaultCountry,
      currency: defaultCurrency,
      residenceJurisdiction: '',
      bankAccount: {},
    });
  }
}, [open, existing, payGroups, defaultEntity, defaultCountry, defaultCurrency, form]);
```

- [ ] **Step 3: Add a required Legal-entity `Select` that drives country + currency**

Insert this block immediately after the Pay Group field (after line 197, before the Annual CTC field). It uses a `SelectValue` render function (the entity id ≠ the visible name, per CLAUDE.md §13):

```tsx
{
  /* Legal Entity — authoritative; backend derives currency + pay calendar */
}
<div className="space-y-1.5">
  <Label htmlFor="sal-entity">Legal Entity *</Label>
  <Controller
    control={form.control}
    name="legalEntityId"
    render={({ field }) => (
      <Select
        value={field.value || undefined}
        onValueChange={(v) => {
          const id = v ?? '';
          field.onChange(id);
          const ent = entities.find((e) => e.id === id);
          if (ent) {
            form.setValue('country', ent.country);
            form.setValue('currency', ent.currency);
            form.setValue('bankAccount', {});
            form.clearErrors('bankAccount');
          }
        }}
      >
        <SelectTrigger id="sal-entity" className="w-full cursor-pointer">
          <SelectValue placeholder="Select legal entity…">
            {(v) => entities.find((e) => e.id === v)?.name ?? 'Select legal entity…'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {entities.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name} ({e.country} · {e.currency})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  />
  {form.formState.errors.legalEntityId && (
    <p className="text-xs text-danger">{form.formState.errors.legalEntityId.message}</p>
  )}
  <p className="text-xs text-fg-muted">
    Determines currency and pay calendar — required for correct statutory apportionment.
  </p>
</div>;
```

- [ ] **Step 4: Make the bank-section country control read-only (entity is the source of truth)**

The bank-section currently has its own country `Select` (lines 251-271). Replace that `Controller`/`Select` with a read-only display so country can no longer diverge from the entity:

```tsx
<span className="text-xs font-medium text-fg-muted">
  {countries.find((c) => c.code === country)?.name ?? country}
</span>
```

Delete the now-unused `handleCountryChange` function (lines 113-117).

- [ ] **Step 5: Handle `NO_ACTIVE_SALARY` and send the new fields**

`onSubmit` already spreads `...values`, so `legalEntityId` + `currency` flow once they're in the form. Extend the catch (lines 149-152) to surface the worker-assignment precondition error clearly:

```tsx
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { code?: string; message: string } }>).response
        ?.data?.error;
      if (apiErr?.code === 'NO_ACTIVE_SALARY') {
        toast.error('Configure an active salary before assigning this worker to a run.');
      } else {
        toast.error(apiErr?.message ?? 'Failed to save salary configuration');
      }
    }
```

- [ ] **Step 6: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. Confirm `LegalEntity` has `country` and `currency` fields (it does — used elsewhere); if `currency` is missing on the type, add it in Task 3's file in this task.

- [ ] **Step 7: Manual verification (mocks on)**

Run: `pnpm dev`, open an employee → Assign Salary. Verify: Legal Entity select renders names (not ids); choosing one updates the country label + currency; submitting with no entity shows the required error; a successful assign appears in the network tab with `legalEntityId` + `currency` in the body.

- [ ] **Step 8: Commit**

```bash
git add src/modules/employees/components/SalaryAssignmentDrawer.tsx
git commit -m "feat(payroll): send legalEntityId + currency on salary assign (sub-monthly statutory fix)"
```

---

## Task 5: Payslip tax-summary — stop hardcoding `'TDS'` and `en-IN`

**Files:**

- Modify: `src/modules/payroll/components/PayslipDrawer.tsx` (audited hotspots ~line 112 `code === 'TDS'`, ~line 107 `en-IN` locale)

- [ ] **Step 1: Read the file to confirm current lines**

Run: open `src/modules/payroll/components/PayslipDrawer.tsx`; locate the `deductions.find((l) => l.code === 'TDS')` tax-summary lookup and the `'en-IN'` locale default.

- [ ] **Step 2: Replace the hardcoded tax lookup**

The tax line is whatever the pack tagged as tax — never the literal `'TDS'`. Replace the `find(l => l.code === 'TDS')` with a lookup against the payslip's regime tax code, falling back to summing any deduction the payslip marks as tax. Since the payslip response carries `deductions[]` and the run pins the regime, use the run/payslip `taxCode` if present, else match common tax codes by the response, not a literal:

```ts
// Tax line = the deduction the resolved regime posts to (payslip carries taxCode when global).
const taxCode = payslip.taxCode ?? regime?.taxCode;
const taxLine = taxCode
  ? payslip.deductions.find((l) => l.code === taxCode)
  : payslip.deductions.find((l) => /TAX|TDS|WITHHOLDING/i.test(l.code));
const taxAmount = taxLine?.amount ?? 0;
```

> If `Payslip` has no `taxCode` field, add `taxCode?: string;` to the `Payslip` interface in `payroll.types.ts` (additive). Prefer the regime/pack tax code; the regex fallback only guards a missing field so a PH `WITHHOLDING_TAX` slip never reads 0.

- [ ] **Step 3: Replace the locale default**

Replace the `'en-IN'` literal with the payslip/template/entity locale, defaulting to the browser locale, not India:

```ts
const locale = payslip.locale ?? template?.locale ?? undefined; // undefined => Intl uses runtime default
```

Use `locale` (which may be `undefined`) in every `Intl.NumberFormat`/`toLocaleString` call in this file. `undefined` is valid and resolves to the environment default — never hardcode `'en-IN'`.

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Manual verification**

With mocks on, open a payslip for a non-INR pay group and confirm the tax line shows the correct amount (not 0) and the currency is the response currency, not ₹.

- [ ] **Step 6: Commit**

```bash
git add src/modules/payroll/components/PayslipDrawer.tsx src/modules/payroll/types/payroll.types.ts
git commit -m "fix(payroll): derive payslip tax line from regime taxCode, drop en-IN default"
```

---

## Task 6: India-literal sweep across the payroll UI (~15 files)

**Files (audited 2026-06-14):**

- `src/modules/payroll/components/MyPayslipsPage.tsx`
- `src/modules/payroll/components/PayrollRunDetail.tsx`
- `src/modules/payroll/components/PayrollRunsTab.tsx`
- `src/modules/payroll/components/CompStatementCard.tsx`
- `src/modules/payroll/components/TaxDeclarationCard.tsx`
- Loans / Claims / Garnishments cards
- `src/modules/payroll/components/StatutoryPackEditor.tsx` (`2026-27`, `INR` placeholders)
- `PayGroupDrawer.tsx`, `LegalEntityDrawer.tsx` (`PF`/`Provident Fund`/`PF_ER` placeholders)
- 3 migration panels (`const CURRENCY = 'INR'`)

- [ ] **Step 1: Find every literal**

Run (Grep tool, not bash):

```
pattern: 'INR'|₹|en-IN|2026-27|PF_ER|Provident Fund   path: src/modules/payroll   output_mode: content
```

Expected: a list of every offending site. Record it as the task checklist.

- [ ] **Step 2: Replace currency/locale literals with response-driven values**

For each hit: if the surrounding data object carries a `currency`, format with that currency and pass `undefined` locale (runtime default). Only where no currency is reachable, fall back to a single shared constant — never a per-file `'INR'`. Pattern:

```ts
// before
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
// after
const fmt = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: row.currency ?? 'INR',
});
```

For the 3 migration panels' `const CURRENCY = 'INR'`: read currency from the migration batch/entity in scope; keep `'INR'` only as the final fallback argument.

- [ ] **Step 3: Replace `2026-27` / `PF`-placeholder copy**

In `StatutoryPackEditor.tsx`, the new-pack default `fiscalYear` placeholder `2026-27` becomes an empty string / `"YYYY"` placeholder (country-neutral). In `PayGroupDrawer.tsx`/`LegalEntityDrawer.tsx`, replace `PF`/`Provident Fund`/`PF_ER` example copy with country-neutral examples (e.g. "e.g. statutory contribution").

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Verify the sweep is complete**

Run the Step 1 Grep again. Expected: only intentional fallback-argument `'INR'` literals remain (each as the last arg of an `Intl.NumberFormat` with a response currency in front of it). No `en-IN`, no `₹`, no `2026-27`, no India contribution names in copy.

- [ ] **Step 6: Commit**

```bash
git add src/modules/payroll
git commit -m "refactor(payroll): sweep INR/₹/en-IN/India-placeholder literals out of the UI"
```

---

## Task 7: Legal-entity form — `workWeekPattern` Select (work-week as-shipped)

**Files:**

- Modify: `src/modules/payroll/components/LegalEntityDrawer.tsx` (+ `LegalEntitiesPanel.tsx` read view)
- Modify: `src/modules/payroll/types/payroll.types.ts` — add `workWeekPattern` to `LegalEntity` + its input

- [ ] **Step 1: Add the type field**

Add to the `LegalEntity` interface and its create/update input:

```ts
/** Coarse work-week (as shipped by backend); proration denominator. */
workWeekPattern: 'MON-FRI' | 'MON-SAT';
```

- [ ] **Step 2: Add the Select to the drawer**

In `LegalEntityDrawer.tsx`, add a shadcn `Select` (default `MON-FRI`; options `MON-FRI`, `MON-SAT`). Since value === label here, a plain `<SelectValue placeholder="Work week" />` is fine. Wire it into the form schema (`z.enum(['MON-FRI','MON-SAT']).default('MON-FRI')`) and submit body.

- [ ] **Step 3: Show it on the read view**

In `LegalEntitiesPanel.tsx`, display `workWeekPattern` on the entity row/detail.

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/payroll
git commit -m "feat(payroll): add workWeekPattern select to legal entity form"
```

---

## Task 8: Statutory-pack editor — `apportionmentMode` control + minor-units for new fields

**Files:**

- Modify: `src/modules/payroll/components/StatutoryPackEditor.tsx`

- [ ] **Step 1: Add the `apportionmentMode` Select per contribution scheme**

For each contribution scheme row in the editor, add a shadcn `Select` bound to `apportionmentMode` with options `MONTHLY_TOTAL` (default) and `PER_CYCLE`. Send it in the pack write body.

- [ ] **Step 2: Extend minor-units conversion to the new fields**

The editor already does 19 `toMinor/fromMinor` conversions. Apply the same to `taxCredits[].amount` and `slabs[].base` (read → `fromMinor` for display; write → `toMinor`). Do NOT convert component values or CTC (those stay major).

- [ ] **Step 3: Typecheck + lint + the pack-related tests**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/modules/payroll/components/StatutoryPackEditor.tsx
git commit -m "feat(payroll): apportionmentMode control + minor-units for taxCredits/slab base"
```

---

## Task 9: Mock engine — currency / working-days / `taxCode` from config (demo correctness)

**Files:**

- Modify: `src/mocks/data/payroll-engine.ts` (`CURRENCY` ~L51, `STD_WORKING_DAYS`/`STD_HOURS_PER_DAY` ~L53/56, `'TDS'` ×4 sites)

- [ ] **Step 1: Read currency from config**

Replace the `CURRENCY = 'INR'` constant usage: read currency from the pay group / entity / regime in scope, default `'INR'` only when unset.

- [ ] **Step 2: Read working-days/hours from the pay calendar work pattern**

Replace `STD_WORKING_DAYS = 22` / `STD_HOURS_PER_DAY = 8` with values derived from the calendar's `workWeekPattern` (MON-FRI vs MON-SAT) for the period, defaulting to the constants when unset.

- [ ] **Step 3: Emit the tax line code from the regime**

Replace all four hardcoded `'TDS'` line emissions with `regime.taxCode ?? 'TDS'`.

- [ ] **Step 4: Typecheck + lint + full payroll tests**

Run: `pnpm typecheck && pnpm lint && pnpm test src/modules/payroll`
Expected: PASS; India numbers unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/mocks/data/payroll-engine.ts
git commit -m "fix(mocks): payroll engine reads currency/working-days/taxCode from config"
```

---

## Task 10: South-Africa `taxCredits` conformance case (regression gate)

**Files:**

- Modify: `src/modules/payroll/utils/global-conformance.test.ts`

- [ ] **Step 1: Add a South-Africa case**

Add a SA pack fixture (ZAR, FY `2029-30`, a single 10% slab, a `PRIMARY_REBATE` tax credit) and assert the computed annual tax = slab tax − rebate, and that the deduction line code equals the regime `taxCode`. Keep the existing Philippines case (7/7) and India case untouched.

- [ ] **Step 2: Run the conformance suite**

Run: `pnpm test src/modules/payroll/utils/global-conformance.test.ts`
Expected: PASS (PH + SA + India all green).

- [ ] **Step 3: Full suite (regression gate)**

Run: `pnpm test`
Expected: PASS — India numbers byte-identical.

- [ ] **Step 4: Commit**

```bash
git add src/modules/payroll/utils/global-conformance.test.ts
git commit -m "test(payroll): add South Africa taxCredits conformance case"
```

---

# WAVE 1 — sub-monthly run UI (GATE LIFTED 2026-06-14)

> **Gate lifted:** the backend's §6 acceptance numbers now pass live (17/17): each sub-monthly cycle ≈ ½ month gross, monthly tax not doubled (H2 absorbs the rounding remainder), statutory apportioned with/without `legalEntityId`, ZA payslip has empty `employerContributions[]`. The cycle-run UI is safe to build. Verified payslip captures are in the backend handoff §3.3.
> **`calculate` body:** the run-create flow's calculate call must send `{}` (empty object), not an empty body. **Run scoping:** for a subset run use `type: OFF_CYCLE`/`FNF` with `employeeIds` — `REGULAR` always computes all active salaries.

## Task 11: `getPayCalendarCycles` service (unwrap `data.cycles`)

**Files:**

- Modify: the pay-calendar service (`src/modules/payroll/services/*pay-calendar*.ts`)
- Test: the matching `*.test.ts`

- [ ] **Step 1: Write the failing test** — mock a `{ data: { payCalendarId, paySchedule, cycles: [...] } }` response; assert the service returns `cycles[]` (the **`data.cycles`** path, NOT bare `data[]`).
- [ ] **Step 2: Run it — verify it fails** (`pnpm test <file>`).
- [ ] **Step 3: Implement `getPayCalendarCycles(id, { from, to })`** returning `data.cycles` typed as `PayCalendarCycle[]`.
- [ ] **Step 4: Run it — verify it passes.**
- [ ] **Step 5: Commit** — `feat(payroll): getPayCalendarCycles service unwrapping data.cycles`.

## Task 12: Cycle picker in run creation

**Files:**

- Modify: `src/modules/payroll/components/InitiateRunDialog.tsx`

- [ ] **Step 1:** When the selected pay group is non-monthly, fetch cycles for its calendar and show a cycle `Select` (Approach B / progressive disclosure per the sub-monthly UI integration spec); render `periodLabel`, not the raw `period` id.
- [ ] **Step 2:** On submit, source `period`, `paySchedule`, `startDate`, `endDate`, `payDate` from the chosen cycle.
- [ ] **Step 3:** Typecheck + lint + four states.
- [ ] **Step 4: Commit** — `feat(payroll): cycle picker for sub-monthly run creation`.

## Task 13: Run list / detail / payslip cycle labels

**Files:**

- Modify: run list, `PayrollRunDetail.tsx`, `PayslipDrawer.tsx`

- [ ] **Step 1:** Render the cycle (`periodLabel`, start/end dates) from the run/payslip response wherever a period is shown.
- [ ] **Step 2:** Typecheck + lint.
- [ ] **Step 3: Commit** — `feat(payroll): show pay cycle labels on run detail and payslip`.

## Task 14: Sub-monthly conformance + live re-verify

- [ ] **Step 1:** Add a sub-monthly case to `global-conformance.test.ts` (semi-monthly PH: each cycle ≈ ½ gross; month tax not doubled; SSS apportioned).
- [ ] **Step 2:** Run `pnpm test`; full suite green.
- [ ] **Step 3:** Live re-verify (`USE_MOCKS=false`) against the backend the §6 acceptance numbers; record results in the litmus memory.
- [ ] **Step 4: Commit** — `test(payroll): sub-monthly conformance case`.

---

## Self-Review notes

- **Spec coverage:** Wave 0 covers GLOBAL_FRONTEND_CONTRACT §1 (Task 1), §3 (Task 2), §4 (Tasks 3-4), §5 NO_ACTIVE_SALARY (Task 4), §6 (Tasks 5-6), §7 (Task 9), §8 (Task 7), §2/apportionmentMode (Task 8), §10 (Task 10). Wave 1 covers §9 (Tasks 11-13) + §10 sub-monthly (Task 14). §11 checklist rows all map to a task; "DONE" rows (minor-units base, dynamic line rendering) need no task.
- **Type consistency:** `TaxCredit`/`taxCredits` (Task 1) consumed in Task 2 & Task 10; `PayCalendarCycle` (Task 3) consumed in Tasks 11-13; `legalEntityId`/`currency` on `EmployeeSalaryInput` (Task 3) consumed in Task 4; `taxCode` on `TaxRegime` (Task 1) + optional `Payslip.taxCode` (Task 5) consumed in Tasks 5 & 9.
- **Gating:** Wave 0 is independent of the backend fix; Wave 1 is explicitly gated. The `legalEntityId` send (Task 4) is the one correctness item that helps mitigate Bug #2 from the FE side even before the backend ships — intentionally in Wave 0.
- **Open confirmations the executor must make live before relying on them:** `surcharge`/`cess` wire shape on the PH/ZA packs (Task 1 left as-is, matches current); whether `LegalEntity` already carries `currency` (Task 4 Step 6); exact `PayslipDrawer` line numbers (Task 5 Step 1).
