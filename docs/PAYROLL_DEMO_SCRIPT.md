# Payroll — Exact Demo Data & Rehearsal Script

> The precise data already loaded in the app, and the exact click-path to rehearse
> the live walkthrough: **which user to log in as, which run to open, which numbers
> appear.** Pair this with `PAYROLL_TRAINING_MANUAL.md` (the click-by-click guide).

---

## 0. Pre-flight (do this once before the meeting)

1. Make sure mocks are **ON** — in `.env.local`: `NEXT_PUBLIC_USE_MOCKS=true`.
   💡 Login hits the **real backend**; all payroll data is **mock (MSW)**.
2. Run `pnpm dev`, open the app.
3. ⚠️ **The mock data lives in browser memory.** When you click through a demo
   (e.g. calculate a run), the state **changes and stays changed** until you do a
   **full page reload (F5)** — a reload **resets everything to the starting state**
   below. So: rehearse → **F5 to reset** → present.

---

## 1. Login cheat-sheet — who to be for each journey

**Password for all four:** `Password123!`

| Log in as              | Role                               | Use them to demo…                                                        |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `hr@acme.test`         | **HR Admin**                       | The whole payroll engine: run, calculate, adjust, disburse, all settings |
| `superadmin@acme.test` | **Super Admin**                    | **Approving** a run that HR started (see the maker≠checker rule below)   |
| `priya@acme.test`      | **Employee** (Priya Sharma, E0004) | "My Pay" — payslips, comp statement, tax declaration, claims, loans      |
| `aman@acme.test`       | **Manager** (Aman Kumar, E0001)    | Manager sees only his own pay (same as employee)                         |

> 🔑 **The killer demo moment:** the draft run **was started by `hr@acme.test`**.
> If HR tries to approve it, the app **blocks it** ("The initiator cannot approve
> their own run"). So to approve, **log out and back in as `superadmin@acme.test`.**
> That visibly proves the "two different people" control — show it live.

---

## 2. The payroll runs already in the system

| Open this | Period            | Status           | Notes                                      |
| --------- | ----------------- | ---------------- | ------------------------------------------ |
| run-001   | **February 2026** | PAID · Published | Pins statutory pack **IN 2025.1** (old FY) |
| run-002   | **March 2026**    | PAID · Published | History                                    |
| run-003   | **April 2026**    | PAID · Published | Pins **IN 2026.1** (new FY)                |
| run-004   | **May 2026**      | **DRAFT** ⭐     | **Use this to demo the full lifecycle**    |

💡 **Two ways to demo "run a payroll":**

- **(A) Open the existing draft:** Payroll → click the **May 2026** row → on its
  page click **Calculate Payroll**. Best for showing the run detail page.
- **(B) Start fresh:** Payroll → **Run Payroll** → it defaults to **June 2026**
  (no run exists yet) → **Calculate Payroll**. Best for showing the start box.

Either way, after calculating you'll land in **REVIEW** with the numbers below.

---

## 3. The roster you'll see (10 paid + 1 deliberate warning)

When a run calculates, these are the employees and their annual CTC:

| Code  | Name             | Department                      | CTC (₹)   | Note                                     |
| ----- | ---------------- | ------------------------------- | --------- | ---------------------------------------- |
| E0001 | **Aman Kumar**   | Engineering · Senior Engineer   | 24,00,000 | = the **Manager** login                  |
| E0004 | **Priya Sharma** | Engineering · Software Engineer | 12,00,000 | = the **Employee** login · **1 LOP day** |
| E0005 | Rohan Mehta      | Sales                           | 10,80,000 |                                          |
| E0006 | Nisha Iyer       | Product                         | 18,00,000 |                                          |
| E0007 | Vikram Singh     | Engineering · Staff Engineer    | 30,00,000 | highest paid                             |
| E0008 | Asha Joshi       | Finance                         | 13,20,000 |                                          |
| E0009 | Sneha Rao        | Operations                      | 15,60,000 | 2 LOP days                               |
| E0010 | Karan Patel      | Sales                           | 16,80,000 |                                          |
| E0011 | Meera Nair       | Product                         | 11,40,000 |                                          |
| E0012 | Arjun Reddy      | Engineering                     | 12,60,000 |                                          |
| E0099 | **Ravi Verma**   | Engineering · Intern            | —         | ⚠️ **no salary set up**                  |

> 🎯 **Use Ravi Verma (E0099) as your "the system catches mistakes" moment.** He
> has no pay group, so every run shows a **yellow warning**: _"No salary config
> assigned — employee skipped."_ Expand the **Warnings** panel and point at it.

> 🎯 **Priya has 1 LOP (loss-of-pay) day** — when you open _her_ payslip you can
> show her pay is slightly prorated. She's also the employee login, so the numbers
> match end-to-end.

---

## 4. The configuration you'll show in Settings → Pay & Compliance

### Salary Components (the LEGO blocks)

| Code          | Name                   | Type      | Calculated as                |
| ------------- | ---------------------- | --------- | ---------------------------- |
| BASIC         | Basic Salary           | Earning   | **Flat**                     |
| HRA           | House Rent Allowance   | Earning   | **Percentage** of Basic      |
| LTA           | Leave Travel Allowance | Earning   | Flat                         |
| SPECIAL_ALLOW | Special Allowance      | Earning   | **Formula** (CTC − the rest) |
| PF            | Provident Fund         | Deduction | Percentage                   |
| PROF_TAX      | Professional Tax       | Deduction | Formula                      |
| TDS           | TDS (Income Tax)       | Deduction | Formula                      |

> 🎯 **Formula demo:** Add Component → Name "Test Bonus" → Type **Earning** →
> Calculation **Formula** → type `BASIC * 0.1` → watch the **preview table** fill
> in live on the **sample ₹12,00,000 CTC**. Then type a broken one like
> `BASIC * X` and click away → it shows a **red "Unknown variable" error**.
> (Cancel — don't actually save it for the demo.)

### Pay Groups

| Name                             | Currency | Schedule  | Employees |
| -------------------------------- | -------- | --------- | --------- |
| **Standard India — Engineering** | INR      | Monthly   | 12        |
| US Hourly                        | USD      | Bi-weekly | 3         |

> 🎯 Click **Standard India — Engineering** to show its component list with live
> monthly amounts. (Most of the roster is on this group.)

### Legal Entities

| Name                   | Country       | Currency |            |
| ---------------------- | ------------- | -------- | ---------- |
| **Acme India Pvt Ltd** | India         | INR      | **Active** |
| Acme USA Inc           | United States | USD      |            |

### Statutory Packs (the versioned country rule-books)

| Country       | Version    | Effective                | Status     |
| ------------- | ---------- | ------------------------ | ---------- |
| India         | **2026.1** | 1 Apr 2026 → open        | **Active** |
| India         | 2025.1     | 1 Apr 2025 → 31 Mar 2026 | Superseded |
| United States | 2026.1     | 1 Jan 2026 → open        | Active     |

> 🎯 **The "frozen history" story made real:** India has **two versions**. The
> **February 2026** run (run-001) pins **2025.1**; the **May 2026** run pins
> **2026.1** — automatically. Open each run's detail and the pinned version differs.
> Nobody changed code; the rule change was just new data with a start date.

---

## 5. The headline rehearsal — "Run May payroll end to end" (≈4 min)

Do this slowly; it's the centrepiece.

1. **Log in as `hr@acme.test`.** 👆 Sidebar **💵 Payroll**.
   → The control room: 4 cards + the runs table (Feb/Mar/Apr PAID, **May DRAFT**).
2. 👆 Click the **May 2026** row → its detail page opens, status **DRAFT**.
3. 👆 Click **Calculate Payroll** (header).
   → Status goes **CALCULATING** (spinner ~2s) → **REVIEW**, and the page fills:
   4 stat cards, the **Warnings** panel (👆 expand → **Ravi Verma** flagged), the
   **Approval Chain** ("HR review"), and the **Payslips** table of 10 people.
4. 👆 (Optional) In the payslips table, 👆 **⋯** on **Priya Sharma** → **View
   payslip** → show her earnings/deductions and the 1 LOP day. Close it.
5. 👆 Try **Approve** in the Approval Chain.
   → It shows **"You initiated this run"** — HR cannot approve. 🔑 _Explain: a
   second person must._
6. **Log out → log in as `superadmin@acme.test`.** 👆 Payroll → 👆 **May 2026**.
7. 👆 In the Approval Chain, click **Approve** → status flips to **APPROVED**.
   → The **Disbursement** panel now appears.
8. 👆 **Generate payment batch** → the payout list appears. 👆 pick **NACH** →
   **Download bank file** (a file downloads).
9. 👆 **Mark as Paid** → enter today's date + a reference like `NEFT/2026/05/B01`
   → **Confirm Payment** → status **PAID**.
10. 👆 **Publish Payslips** → toast confirms employees can now see them.
11. **Log out → log in as `priya@acme.test`** → 👆 **Payroll** (lands on **My
    Pay**) → **Payslips** tab → her May slip is now visible → 👆 **View**.

✅ You just showed: build → calculate → catch errors → two-person approval → bank
file → pay → publish → employee sees it. **Press F5 to reset for the real run.**

---

## 6. Quick data for the other journeys

- **Employee "My Pay" (login `priya@acme.test`):** Payslips for **Feb/Mar/Apr
  2026** are already published and visible. Comp Statement shows her **₹12,00,000**
  package. Tax Declaration lets her compare regimes live. Claims/Loans start empty
  — submit one live to show the flow.
- **Manager (login `aman@acme.test`):** identical "My Pay," his package is
  **₹24,00,000**. Point out he has **no** access to the payroll engine.
- **Full & Final demo (HR):** Run Payroll → Type **Full & final settlement** →
  pick e.g. **Rohan Mehta** → last working day, 5 years service, 12 leave days →
  **Calculate Settlement** → shows a single settlement statement (gratuity, leave
  encashment, recoveries).
- **Bonus demo (HR):** Run Payroll → Type **Bonus** → pick **June 2026** → **Create
  Run** (opens DRAFT) → in **Period Inputs** give e.g. **Priya** and **Aman** a Bonus
  amount → **Calculate** → only those two appear, each paying **bonus − tax**. (Arrears
  works the same with the **Arrears** type.)
- **Reversal demo (HR):** Run Payroll → Type **Reversal** → **Run to reverse** = e.g.
  **April 2026 (PAID)** → **Calculate** → an offsetting run with **negative** totals; the
  header reads **"Reverses April 2026."** The April run itself is unchanged.
- **Off-cycle demo (HR):** Run Payroll → Type **Off-cycle** → tick just **1–2
  employees** → **Calculate** → a normal run computed for only those people.
- **A payroll report:** Reports → **PAYROLL → Salary Register** → pick a **PAID**
  run (Feb/Mar/Apr) → table fills → **Export** downloads a CSV.
- **Global Workforce (HR):** Payroll → **Global Workforce** → shows consolidated
  cost; change **Group by** to see it regroup.

---

## 7. Reset & gotchas

- **Reset all demo data:** **full page reload (F5)**. Runs go back to Feb/Mar/Apr
  PAID + May DRAFT; any test run you created disappears.
- **Can't calculate a "Regular" run for a month that already has one** — Feb, Mar,
  Apr, May are taken. Use **June 2026** (the dialog's default) for a fresh start,
  or use a different **Run Type** (Bonus/Off-cycle) for the same month.
- **Don't actually save** the test salary component or the test pay group during a
  live demo unless you mean to — though F5 wipes them anyway.
- **Login fails?** The four seed users live on the **real backend**; if it's
  sleeping (Render free tier), the first login can take ~30s — log in once a few
  minutes before the meeting to wake it.

---

### The two lines to land with the client

> _"Everything you just saw — the salary blocks, the formulas, the country rule
> versions — is **data you configure**, not code. And no single person can run AND
> approve a payroll: that's the control that keeps the money honest."_
