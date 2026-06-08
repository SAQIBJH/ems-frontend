# Payroll — Click-by-Click Training Manual

> A hands-on "do this, then this happens" guide for Payroll. Each journey says
> **who can do it**, **where to start**, and walks the buttons one tap at a time:
> 👆 = a click, → = what happens next. Everything here is live in the app today.

**How to read the icons**

- 👆 **Click** something
- → **Result** (what happens / which screen opens)
- 💡 **What this is for / what the component does**
- 👀 **What's different for other roles**

---

## 0. Before any journey — who sees what

When **anyone** logs in and clicks **💵 Payroll** in the left sidebar:

- **Employee or Manager** → automatically redirected to **My Pay**
  (`/payroll/my-payslips`). They never see the company payroll engine.
- **HR Admin or Super Admin** → land on the **Payroll control room**
  (`/payroll`), with the runs table and the **Run Payroll** button.
- **Auditor** → can open and read screens/reports but every action button is
  hidden or disabled (look-only).

💡 The app decides this from your **role**. Nothing to configure — it just routes
you to the right place.

---

# PART A — HR / SUPER ADMIN JOURNEYS

These journeys are for **HR Admin** and **Super Admin** only. (A Manager or
Employee cannot reach these screens.)

---

## Journey 1 — Set up a salary "building block" (Salary Component)

**Who:** HR Admin / Super Admin · **Start:** Settings → Pay & Compliance →
**Salary Components**

1. 👆 Click **Add Component** (top-right).
   → A drawer slides in from the right titled **"New Salary Component."**
2. 👆 Type a **Name** (e.g. "House Rent Allowance").
   → The **Code** field auto-fills ("HOUSE_RENT_ALLOWANCE"). 💡 The code is the
   block's ID that formulas refer to; it **locks** once you save.
3. 👆 Set the **Display Order** (where it appears on the payslip).
4. 👆 Choose the **Type**: Earning / Deduction / **Employer Contribution** /
   Benefit / Reimbursement / Variable.
   💡 _Earning_ adds to pay, _Deduction_ subtracts, _Employer Contribution_ is a
   company cost that **never** reduces take-home, _Variable_ has no fixed value
   (you type the amount each month).
5. 👆 Toggle **Taxable** and **Active**. 👆 (Optional) toggle **Prorate on LOP**
   💡 = should this shrink for unpaid days?
6. In **Calculation**, 👆 pick one:
   - **Flat** → a box appears for a fixed monthly amount.
   - **Percentage** → boxes appear for the **%** and the **Basis** block (e.g.
     "40% of BASIC").
   - **Formula** → a text box appears.
     - 👆 Type a formula like `BASIC * 0.4`.
     - → A **live preview table** appears below showing the calculated monthly
       value on a sample ₹12,00,000 salary, recalculating **as you type**.
     - 👆 Click **"Available variables"** to see what you can use (CTC, GROSS, NET,
       and every other block's code).
     - → When you click away (blur), the app **validates** the formula; a typo or
       a circular reference (A needs B needs A) shows a **red error** immediately.
7. 👆 (Optional) In **Accounting**, set the **GL account** and **cost center**
   💡 = how finance books this in the ledger.
8. 👆 Click **Create Component**.
   → The drawer closes, a green "Component created" toast appears, and the new
   block shows in the table with its sample monthly amount.

**To edit:** 👆 the **⋯** menu on a row → **Edit** → same drawer (code is locked).
**To delete:** 👆 **⋯** → **Delete** → confirm. → If another block or pay group
**depends** on it, the app **blocks the delete** and tells you which ones. 💡 You
can't remove a LEGO that others are standing on.

---

## Journey 2 — Bundle blocks into a Pay Group

**Who:** HR Admin / Super Admin · **Start:** Settings → Pay & Compliance →
**Pay Groups**

1. 👆 Click **New** (top-left of the group list).
   → A drawer opens to create a pay group.
2. 👆 Name it (e.g. "India Full-Time"), pick its **components**, and 👆 optionally
   **override** a component just for this group (e.g. a higher HRA %).
   💡 An override changes the block **only inside this group**, not everywhere.
3. 👆 Save.
   → The new group appears in the left list and is auto-selected.
4. → The right panel shows every component in the group, each tagged **Default**
   or **Overridden**, with its **live monthly amount** on the sample salary.

**Edit:** 👆 **Edit** (top-right of the detail panel). **Delete:** 👆 the trash
icon → confirm. → Blocked if employees are assigned (it tells you how many). 💡
You can't delete the kit people are wearing.

---

## Journey 3 — Add a country you operate in (Legal Entity)

**Who:** HR Admin / Super Admin · **Start:** Settings → Pay & Compliance →
**Legal Entities**

1. 👆 Click **Add Entity** → a drawer opens.
2. 👆 Type the entity **name** (e.g. "Acme India Pvt Ltd").
3. 👆 Pick the **Country**.
   → Currency, locale, and fiscal-year month **auto-fill** with sensible defaults
   (you can still override). 💡 Less typing, fewer mistakes.
4. 👆 Fill **timezone** and **Registration IDs** (typed one per line as
   `PF=...`, `PAN=...`).
5. 👆 Click **Create Entity** → green toast, entity appears in the table.
6. 👆 On any other entity, click **Set active** → that entity becomes the one all
   payroll config and runs apply to (marked **Active**). 💡 Switches which "legal
   self" you're working on.

💡 **Statutory Packs** (the country tax rule-books) and **Pay Schedules** are
**view-only** lists in the current build — they show what's configured; an admin
seeds them. **Payslip Template** and **Data Policy** are editable (see Journey 13).

---

## Journey 4 — Run the monthly payroll (THE big one)

**Who:** HR Admin / Super Admin · **Start:** **Payroll** (`/payroll`)

### Step 1 — Start the run

1. 👆 Click **Run Payroll** (blue, top-right).
   → A box pops up titled **"Run Payroll."**
2. 👆 Leave **Run Type** = **Regular**. 💡 (Other types in Journey 8.)
3. 👆 Pick the **month** and **year**. 👆 Leave **"Include all active employees"**
   ticked.
4. 👆 Click **Calculate Payroll**.
   → The box shows a spinner **"Calculating…"**, the brain computes every
   employee's slip from the blocks, then **automatically opens the run's detail
   page** in **REVIEW** status. 💡 You don't navigate — it takes you there.

### Step 2 — Read the run page (top to bottom)

- → **Four stat cards**: Total Employees, Gross, Deductions, Net.
- → **Warnings** (yellow box, if any): 👆 click to expand → lists employees with
  issues (e.g. negative net). 💡 Fix-before-you-pay alerts.
- → **Variance Review**: people whose pay jumped vs last month, tagged "High
  variance / Zero pay / New joiner." 💡 A big surprise change is usually an error.

### Step 3 — (Optional) sanity check

- 👆 Click **Dry Run** (header) → a toast reports the net total, # anomalies, #
  warnings — and **saves nothing**. 💡 A practice swing.

### Step 4 — Approve (needs a SECOND person)

- → The **Approval Chain** panel lists approval levels.
- 👆 The next approver clicks **Approve**.
  → ⚠️ **The person who started the run canNOT approve it** — the button says "You
  initiated this run." A different HR/Admin must approve. 💡 This is the #1 fraud
  control: no one can pay themselves unchecked.
  → After all levels approve, status flips to **APPROVED**.

### Step 5 — Pay the money out (Disbursement)

- → The **Disbursement** panel appears (only after APPROVED).
- 👆 Pick a **bank file format** (e.g. NACH) → 👆 **Download bank file**. 💡 Hand
  this file to your bank to pay everyone at once.
- 👆 **Generate payment batch** → the per-person payout list appears.
- 👆 **Send to bank** → later 👆 **Reconcile from bank** → each payout moves from
  "sent" to "settled" (failures are flagged).

### Step 6 — Record payment & publish slips

- 👆 Click **Mark as Paid** (header) → a box asks the **payment date** and a
  **bank reference** → 👆 **Confirm Payment** → status flips to **PAID**.
- 👆 Click **Publish Payslips** → green toast. 💡 **Until you click this,
  employees cannot see their slips.** Now they can.

✅ **Done.** The run is **PAID + Published**. A PAID run is **frozen** — it can
never be edited (corrections go to a new run; see Journey 8).

---

## Journey 5 — Enter the month's variable numbers (Period Inputs)

**Who:** HR Admin / Super Admin · **Start:** open a run that is still in **DRAFT**

1. → A **Period Inputs** grid shows every employee with editable boxes: **LOP
   days** (unpaid days), **Leave days**, **OT / Shift / On-call hours**, and a
   **Variable pay** button.
2. 👆 Click into a number box, type, click away → it **saves on blur**
   automatically (no Save button per cell). 💡 These numbers feed the math.
3. 👆 Click the **Variable pay** cell for someone → a box opens to add a one-time
   incentive/commission/bonus → 👆 **Save**.
4. **Two shortcuts (top-right of the panel):**
   - 👆 **Import from timesheets** → pulls **approved** overtime/LOP automatically
     from the Timesheets module → toast says how many employees were updated.
   - 👆 **Import CSV** → paste a spreadsheet of inputs → **Import**.

💡 Inputs **lock** the moment calculation starts — you can't change history mid-run.

---

## Journey 6 — Fix one person's payslip (Adjust / Recalculate / Hold)

**Who:** HR Admin / Super Admin (needs _adjust_) · **Start:** a run in **REVIEW**
or **APPROVED**, scroll to the **Payslips** table

1. 👆 Click the **⋯** menu on an employee's row. You'll see:
   - 👆 **View payslip** → a drawer opens with the full earnings/deductions
     breakdown for that person.
   - 👆 **Add adjustment** → a box: choose **Addition** (bonus) or **Deduction**,
     type a description + amount → 👆 **Add**. → The row gets an **"ADJ"** tag.
   - 👆 **Recalculate payslip** → recomputes just that one slip.
   - 👆 **Hold payment** → the row gets a red **"HELD"** tag and that person is
     **excluded** from the bank payout. 💡 Use for a dispute. 👆 **Release hold**
     puts them back.

---

## Journey 7 — Give finance & the government their files

**Who:** HR Admin / Super Admin · **Start:** an open run (calculated)

- 👆 **Export Register** (header) → downloads the whole run as a CSV (Excel).
- 👆 Expand **Accounting Journal** → shows debits/credits that must **balance**
  (green "Balanced" badge). 👆 pick **CSV** or **Tally** → 👆 **Export**. 💡 For
  the accounting team.
- 👆 In **Statutory Returns**, 👆 pick a filing (PF ECR / TDS 24Q / UK RTI) → 👆
  **Export**. 💡 The file you submit to the government.
- 👆 **Export pack** (Audit Assurance Pack) → downloads a sealed JSON of the frozen
  history + approvals + the exact config version used. 💡 Hand to an auditor and
  they can re-prove the run.

---

## Journey 8 — Special runs (Bonus / Arrears / Off-cycle / Full-and-Final / Reversal)

**Who:** HR Admin / Super Admin · **Start:** **Payroll** → **Run Payroll** → change the
**Run Type** dropdown (the first field). 💡 Any of these can run in the **same month** as
the Regular run — only a second _Regular_ run for a month is blocked. Each is a real,
separate compute (not a relabelled normal run).

**Bonus** — pays _only_ the bonus, never a second salary:

1. 👆 Run Type → **Bonus** → 👆 pick the period → 👆 **Create Run**.
   → It opens the run page as **DRAFT** (it does _not_ calculate yet).
2. 👆 Scroll to **Period Inputs** → for each person, 👆 the **Variable pay** cell →
   enter a **Bonus** (or Incentive / Commission) amount → 👆 **Save**.
3. 👆 **Calculate Payroll** (header).
   → Only employees you gave a bonus appear; each slip = **bonus − income tax**, where
   the tax is the _incremental_ tax on that bonus. Then approve/pay/publish as usual.

**Arrears** — identical flow to Bonus, for **back-pay owed**:

1. 👆 Run Type → **Arrears** → 👆 **Create Run** (opens DRAFT).
2. 👆 Period Inputs → **Variable pay** → enter the **Arrears** amount per employee → Save.
3. 👆 **Calculate** → pays only the arrears + incremental tax.

**Off-cycle** — an unscheduled run for **specific people**:

1. 👆 Run Type → **Off-cycle**.
   → A **checklist of employees** appears → 👆 tick the people to pay.
2. 👆 **Calculate Payroll** → a normal payslip is computed **only** for those selected.

**Full & final settlement (FnF)** — for someone leaving:

1. 👆 Run Type → **Full & final settlement** → extra fields appear: **employee**, **last
   working day**, **years of service**, **leave balance**, **notice shortfall**.
2. 👆 **Calculate Settlement** → the run shows a **single settlement statement** (payable
   vs recovered vs net): prorated salary, gratuity, leave encashment, notice & loan
   recovery.

**Reversal** — cancels a prior run:

1. 👆 Run Type → **Reversal**.
   → A **"Run to reverse"** dropdown appears (only **approved/paid** runs) → 👆 pick one.
2. 👆 **Calculate Payroll**.
   → Creates an **offsetting run with negative amounts** that cancels the original. The
   header shows **"Reverses <month>"**. 💡 The original run is **never changed** — this is
   a separate reversing entry (correct for audit).

---

## Journey 9 — Cancel a run

**Who:** HR Admin / Super Admin · **Start:** a run in DRAFT / CALCULATING / REVIEW

1. 👆 Click **Cancel Run** (header).
   → A box asks for a **reason**.
2. 👆 Type the reason → 👆 **Cancel run** → status flips to **CANCELLED**. 💡 Only
   possible **before** approval/payment, and **cannot be undone**.

---

## Journey 10 — Global workforce (multi-country cost, contractors)

**Who:** HR Admin / Super Admin · **Start:** **Payroll** → **Global Workforce**

- → **Consolidated People Cost**: total monthly cost in one currency. 👆 change
  **Group by** (Worker type / Legal entity / Currency) → the bars regroup.
- → **Workers** table. 👆 change a worker's **type** dropdown (Employee /
  Contractor / EOR) → toast confirms. 💡 A "Risk" flag warns of misclassification.
- → **Contractor Invoices**: 👆 **New Invoice** → pick contractor, period, amount,
  withholding % → 👆 **Submit**. Then 👆 **Approve** → 👆 **Pay**. 💡 Contractors
  invoice; they don't get payslips.

---

## Journey 11 — Go live from an old system (Migration)

**Who:** HR Admin / Super Admin · **Start:** **Payroll** → **Migration** (5 tabs)

1. **Pay Calendar** tab → 👆 **New calendar** → set frequency, period start,
   cutoff day, pay-date rule → 👆 **Create**.
2. **Opening Balances** tab → 👆 **Load roster template** → fill YTD numbers → 👆
   **Import**. 💡 So the first run knows what tax was already paid this year.
3. **Historical Payslips** tab → paste old slips → 👆 **Import**.
4. **Parallel Run** tab → 👆 pick a run, paste your **old system's** net-pay,
   set tolerance → 👆 **Reconcile** → shows **Matched / Mismatched / Missing**
   per person. 💡 Prove the new numbers before trusting them.
5. **Go-Live** tab → 👆 toggle **Sandbox** off (= Production), 👆 set the
   **Go-live period** → 👆 **Save**. 💡 Flip the switch deliberately.

---

## Journey 12 — Run a Payroll report

**Who:** HR Admin / Super Admin (Auditor can view) · **Start:** **📊 Reports**

1. 👆 In the left list, under **PAYROLL**, click a report (e.g. **Salary
   Register**).
2. → It opens on the right with a **filter bar**.
3. 👆 In the filter, **pick a payroll run** (only runs in REVIEW/APPROVED/PAID
   appear). → Summary cards + a table fill in.
4. 👆 Click **Export** → downloads a CSV. 💡 The seven payroll reports: Summary,
   CTC Analysis, Salary Register, Statutory Register, Bank Advice, Variance
   Register, Pay Equity.

---

## Journey 13 — Tune the payslip look & data rules

**Who:** HR Admin / Super Admin

**Payslip Template** (Settings → Pay & Compliance → Payslip Template):

- 👆 Edit the **name**, 👆 pick a **Language**, 👆 paste a **Logo URL**.
- 👆 Use the **up/down arrows** to reorder sections, 👆 the **switch** to show/hide
  each, 👆 rename them inline. Same for **Header fields**.
- 👆 Click **Save template** (only enabled when you've changed something). 💡 The
  payslip layout is configuration — no engineer needed.

**Data Policy** (Settings → Pay & Compliance → Data Policy):

- 👆 Set **default retention years**; per country set **residency region**,
  **retention**, and the **Statutory hold** switch → 👆 **Save changes**. 💡
  Where data lives and how long you keep it (privacy law).

---

## Journey 14 — HR handling employee pay requests

**Who:** HR Admin / Super Admin · **Start:** an employee's payroll area (HR view)

- **Verify tax proofs:** open **Tax Declaration** (HR mode) → 👆 set each item's
  **proof status** (Pending / Verified / Rejected) → 👆 **Update proofs**.
- **Approve a claim:** **Claims** → on a SUBMITTED claim 👆 **Approve** or
  **Reject**. 💡 Approved claims pay with the next run.
- **Foreclose a loan:** **Loans** → on an ACTIVE loan 👆 **Foreclose**. 💡 Closes
  it early.

---

# PART B — EMPLOYEE JOURNEYS

These are what a **regular Employee** does. **Start everywhere:** click **💵
Payroll** → you land on **My Pay** (six tabs).

---

## Journey 15 — View and download my payslip

1. 👆 Open the **Payslips** tab.
2. 👆 Pick a **Year** from the dropdown → your monthly slips list with net pay +
   status (Pending / Paid / Held).
3. 👆 Click **View** on a slip → a drawer opens with the full breakdown (earnings,
   deductions, net). 💡 You only see slips **after HR publishes** them.

---

## Journey 16 — See my full package (Comp Statement)

1. 👆 Open the **Comp Statement** tab.
   → Three cards (Annual CTC, Monthly Gross, Monthly Net) + a full component
   breakdown table, read-only. 💡 "Where does my CTC go?"

---

## Journey 17 — Declare investments & pick the cheaper tax regime

1. 👆 Open the **Tax Declaration** tab.
2. 👆 Choose a **Regime** from the dropdown.
3. 👆 Type amounts for exemptions (80C, HRA, etc.).
   → A **Projected annual tax** box updates live, showing tax **under each
   regime** side by side, so you pick the cheaper one. 💡 Real numbers, instantly.
4. 👆 Click **Save declaration**. 💡 Editing an amount resets its proof to
   "Pending" for HR to re-verify.

---

## Journey 18 — Submit a reimbursement claim

1. 👆 Open the **Claims** tab → 👆 **New claim**.
2. 👆 Pick a **category** (shows its cap), 👆 type **amount** + **description** →
   👆 **Submit**. → Status shows **Submitted** until HR approves. 💡 You can't
   exceed the category's monthly cap.

---

## Journey 19 — Request a loan or salary advance

1. 👆 Open the **Loans** tab → 👆 **Request**.
2. 👆 Choose **Loan** or **Salary advance**, 👆 set principal, interest method,
   rate, tenure, first-EMI month → 👆 **Submit**.
3. 👆 Click a loan row → expands the full **EMI schedule** (each month's
   principal/interest/balance). 💡 EMIs auto-deduct each payroll run.

---

## Journey 20 — Generate my annual tax form (e.g. Form 16)

1. 👆 Open the **Tax Forms** tab.
2. 👆 Pick the **form** and **fiscal year** → 👆 **Generate form** → a drawer
   produces it from your year-to-date records, ready to download.

---

# PART C — MANAGER & AUDITOR (short)

- **Manager:** For their **own pay**, identical to an Employee (Journeys 15–20).
  The payroll **engine** (running/approving payroll) is **HR-only** — a Manager
  does not run payroll. (Managers approve **timesheets/leave** in those modules,
  which can _feed_ payroll, but they don't operate payroll itself.)
- **Auditor:** Can **open and read** any payroll screen and **run/export reports**,
  but every action button (run, approve, pay, edit) is hidden or disabled.
  Look-only.

---

# PART D — The "what unlocks what" cheat-sheet

Buttons appear based on **run status** AND your **permission key**:

| Button                              | Appears when run is…         | Needs key                           |
| ----------------------------------- | ---------------------------- | ----------------------------------- |
| Calculate Payroll                   | DRAFT                        | initiate                            |
| Dry Run                             | DRAFT / REVIEW               | initiate                            |
| Cancel Run                          | DRAFT / CALCULATING / REVIEW | initiate                            |
| Approve                             | REVIEW                       | approve (and **not** the initiator) |
| Publish Payslips                    | APPROVED / PAID              | approve                             |
| Generate bank file / Mark as Paid   | APPROVED                     | disburse                            |
| Add adjustment / Hold / Recalculate | REVIEW / APPROVED            | adjust                              |
| Export Register / Journal / Pack    | any calculated run           | (view)                              |

💡 **HR Admin & Super Admin hold all four keys** by default, so they see every
button. The keys exist so a company _can_ split them across different people
(segregation of duties).

---

## The one rule to repeat in training

> **The person who starts a payroll run can never approve it.** A second person
> must. That single rule is what keeps payroll honest — teach it first.
