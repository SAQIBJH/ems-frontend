# EMS Payroll (Phase 3) — Client Walkthrough, Explain-Like-I'm-5

> Everything we built for **Payroll**: the Payroll menu, the Payroll reports, and
> the **Settings → Pay & Compliance** panels. Every meaningful button explained —
> what it is, why it exists, how it works, and who can use it. Read top to bottom.
> All of this is **actually built and working** in the app today.

---

## PART 0 — How the "brain" works (read this first, it makes everything click)

Before the screens, understand the **5 big ideas**. If the client gets these,
every button afterwards makes sense.

### Idea 1 — "Salary is built out of LEGO blocks (components)"

A salary is **not one number**. It's lots of little pieces added together:
Basic, House Rent Allowance (HRA), Provident Fund, Tax, Bonus, etc. Each piece is
a **salary component** — a LEGO block. You build any salary by snapping blocks
together. _Why?_ Because every company and every country slices pay differently,
so we never hardcode "salary = X." We let you build it from blocks.

### Idea 2 — "Blocks can do math about each other (the formula engine)"

A block's value can be:

- a **flat** number ("₹50,000"), or
- a **percentage** of another block ("HRA = 40% of Basic"), or
- a **formula** ("Basic × 0.4", or even progressive tax slabs).

The app has a little **calculator brain** (`formula.utils.ts`) that:

1. Figures out the **right order** to calculate blocks (HRA needs Basic first, so
   Basic is computed first). This is an automatic "what-depends-on-what" sort.
2. **Rejects loops** — if block A needs B and B needs A, that's impossible, so
   it's blocked.
3. Can do **tax slabs** (`SLAB()`) — "first ₹3 lakh = 0%, next ₹3 lakh = 5%…" —
   as _data you type in_, not code we write.

_Why it matters:_ HR can invent a brand-new pay rule by **typing a formula**, no
programmer needed.

### Idea 3 — "Never hardcode a country — everything is configuration"

This is the golden rule of the whole phase. There is **no place in the code that
says `if (country === 'India')`**. Instead, every country's tax rates, contribution
rates, ceilings, and bank fields live in **data** (a "Statutory Pack"). _Why?_ So
the same app can run payroll for India, UK, UAE, anywhere — a new country is just
new data, not new software.

### Idea 4 — "Money is counted in the smallest coin, with a currency label"

The computer stores money as **whole paise/cents** (e.g. 123450 = ₹1,234.50), not
as decimals. _Why?_ Computers are bad at decimals (0.1 + 0.2 ≠ 0.3), and that's
unacceptable for salaries. It's also **currency-aware**: Japanese Yen has no
cents, Kuwaiti Dinar has three — the app knows. (`money.utils.ts`)

### Idea 5 — "History is frozen; you never erase the past"

Once a payroll is **PAID**, it can never be edited. A mid-year tax-rule change is a
**new version** of the pack, and each payroll run **pins** (remembers) the exact
version it used. _Why?_ So if you re-run last March, you get the **same numbers**
as last March — auditors love this. Corrections go into a **new** run (arrears),
never by changing old ones.

> **One sentence for the client:** _"Salaries are built from configurable LEGO
> blocks that can do math, with all country rules stored as data, money counted in
> exact coins, and the past frozen forever for audit."_

---

## PART 1 — The Payroll menu (the screens behind the 💵 Payroll sidebar item)

### What you see first depends on WHO you are

- **An employee or manager** clicking "Payroll" is sent to **My Pay** (their own
  payslips) — they never see the company-wide payroll engine.
- **HR Admin / Super Admin** see the real **Payroll** control room.

---

### 1.1 Payroll home (`/payroll`) — "the control room"

The main HR screen. Top to bottom:

**Header buttons (top-right):**

- **Migration** → opens the onboarding tool (Section 1.4). _Why:_ setting up
  payroll for the very first time.
- **Global Workforce** → opens the worldwide cost view (Section 1.3).
- **Run Payroll** (the blue one) → opens the "Run Payroll" box to start a new
  month (Section 1.2).

**Four summary cards:** Total Paid This Year · Last Run Net · Employees on Payroll
· Pending Runs (turns into a "Needs attention" warning if any run is unfinished).
_Why:_ a one-glance health check.

**The runs table:** every past and current payroll cycle — Period, Status, #
Employees, Gross, Deductions, Net, and when it was processed. Click any row to open
it. The "⋯" menu on each row lets you **View**, and if a run is waiting in REVIEW,
**Approve** it (only if you have the approve key).

**Status words you'll see** (this is the life-cycle of one month's payroll):
`DRAFT → CALCULATING → REVIEW → APPROVED → PAID` (and `CANCELLED` if voided).

---

### 1.2 "Run Payroll" box — starting a new cycle

When HR clicks **Run Payroll**, a small box asks:

- **Run Type** — what kind of run:
  - **Regular** (the normal monthly one),
  - **Off-cycle** (an extra mid-month run),
  - **Bonus**, **Arrears** (back-pay),
  - **Full & final settlement** (FnF — paying out someone who's leaving),
  - **Reversal** (undo).
    _Why so many?_ Real payroll isn't just monthly — bonuses, leavers, and
    corrections all need their own run so they don't mess up the regular one.
- **Payroll Period** — pick the **month** and **year**.
- **Include all active employees** — a tick box (on by default).
- **If "Full & final" is chosen**, extra fields appear: which employee, their last
  working day, years of service, leave balance, and notice shortfall — the engine
  uses these to compute gratuity, leave encashment, and recoveries.

Press **Calculate Payroll**. The box shows a spinner ("Calculating…"), waits while
the brain does the math for everyone, then drops you onto the run's detail page.
_Why a wait:_ it's computing every component for every employee.

---

### 1.3 Run detail (`/payroll/[runId]`) — "the worksheet for one month"

This is the busiest screen. It only shows the panels that make sense for the run's
current stage. Top to bottom:

**Header (top-right) — the action buttons (they appear/disappear by stage):**

- **Export Register** — download the whole run as a CSV (Excel) file. Always
  available.
- **Dry Run** — a "what-if" calculation that **saves nothing**. It tells you the
  net total, how many anomalies, how many warnings — so you can sanity-check before
  committing. _Why:_ practice swing before the real one.
- **Calculate Payroll** — (DRAFT stage) actually compute the payslips.
- **Publish Payslips** — (after approval) make payslips visible to employees.
  Before this, employees can't see them.
- **Mark as Paid** — (APPROVED stage) record that the money has gone out — asks for
  a payment date and a bank reference number.
- **Cancel Run** — (before approval) void the whole run, with a reason. Can't be
  undone.

**Four stat cards:** Total Employees · Gross Earnings · Total Deductions · Net Pay.

**Warnings panel** (yellow, collapsible) — lists employees with issues the engine
spotted (e.g. "negative net pay"). _Why:_ catch mistakes before money moves.

**Approval Chain** (in REVIEW/APPROVED) — payroll uses **"maker ≠ checker"**: the
person who started the run **cannot** approve it; someone else must. It shows each
approval level, who signed, and an **Approve** button for the next approver. _Why:_
the #1 fraud control in payroll — no single person can pay themselves.

**Variance Review** (in REVIEW) — flags people whose pay jumped unusually vs last
month: "High variance / Negative net / Zero pay / New joiner." _Why:_ a big
unexpected change is usually an error — review before paying.

**Audit Trail** (collapsible) — every action taken on this run (who did what,
when). **Events** (collapsible) — the lifecycle signals fired (for notifications /
other systems).

**By Department** — net pay totalled per department.

**Disbursement panel** (once APPROVED) — the "send the money" section:

- Pick a **bank file format** (NACH, etc.) and **Download bank file** — the file
  you hand to the bank to pay everyone at once.
- **Generate payment batch** — creates the list of payouts.
- **Send to bank → Reconcile from bank** — tracks each person's payout from
  "sent" to "settled," including any failures.

**Accounting Journal** (collapsible) — the **double-entry bookkeeping** for
finance: debits and credits that must **balance** (it shows a green "Balanced"
badge). **Export** to CSV or **Tally** format for the accounting team. _Why:_
payroll is also an accounting event; finance needs the journal.

**Statutory Returns** — pick a government filing (PF ECR, TDS 24Q, UK RTI…) and
**Export** the file to submit to authorities. _Why:_ every country requires you to
report payroll to the government; this generates those files from the pinned pack.

**Audit Assurance Pack** — one button, **Export pack** — downloads a sealed JSON
bundle: the frozen history + approvals + the exact config version used + every
override. _Why:_ hand this to an auditor and they can re-prove the whole run.

**Period Inputs** (DRAFT only, editable before calculating) — a grid where HR
enters, per employee: **LOP days** (loss of pay / unpaid days), **Leave days**,
**OT/Shift/On-call hours**, and **Variable pay** (one-time bonus/commission). Two
import shortcuts: **Import from timesheets** (pull approved overtime automatically)
and **Import CSV** (paste a spreadsheet). _Why:_ these numbers change each month
and feed the math.

**Payslips table** — every employee's slip: code, name (with a red "HELD" tag if
held), present/working days, LOP, gross, deductions, net, and an "ADJ" tag if
adjusted. The "⋯" menu per row (in REVIEW/APPROVED, if you can adjust):

- **View payslip** — opens the full breakdown.
- **Add adjustment** — a one-time addition (bonus) or deduction for that person.
- **Recalculate payslip** — recompute just this one slip.
- **Hold payment / Release hold** — exclude one person from this payout (e.g. a
  dispute), then put them back later.

**For a Full & Final run**, instead of the payslips table you see a single
**settlement statement**: what's payable, what's recovered, and the net to pay the
leaver.

---

### 1.4 Global Workforce (`/payroll/global`) — "everyone, everywhere, one currency"

For companies with people in multiple countries. Three sections:

- **Consolidated People Cost** — total monthly cost of your whole workforce,
  converted into **one base currency** using FX rates (shown at the bottom). You
  can **Group by** Worker type / Legal entity / Currency, with a bar for each
  group's share. _Why:_ "what do all our people cost us, in one number?"
- **Workers** — every worker with their **type**: **Employee**, **Contractor**, or
  **EOR** (Employer of Record — hired through a local partner). HR can change a
  worker's type from a dropdown. A "Risk" flag warns about misclassification.
  _Why:_ mixing employees and contractors is a legal minefield; this makes it
  visible.
- **Contractor Invoices** — contractors don't get payslips, they **send invoices**.
  **New Invoice** records one (with withholding tax %); then **Approve** → **Pay**.
  _Why:_ one place to handle both salaried staff and invoiced contractors.

---

### 1.5 Onboarding & Migration (`/payroll/migration`) — "moving in from your old system"

The wizard for switching to this payroll from an old one, **without losing
history**. Five tabs:

1. **Pay Calendar** — define the pay rhythm per legal entity: frequency (monthly/
   bi-weekly/weekly), which day the period starts, the **input cutoff day**, and the
   **pay date rule**. **New calendar / Edit**. _Why:_ the app needs to know your pay
   dates and deadlines.
2. **Opening Balances** — paste a CSV of each employee's **year-to-date** figures
   (gross, taxable, tax already paid, net) so the very first run computes correct
   cumulative tax. "Load roster template" pre-fills the employee list. _Why:_ if you
   go live in the middle of a tax year, the app must know what's already happened.
3. **Historical Payslips** — paste prior payslips (period, gross, deductions, net)
   so employees keep their old pay history and year-end forms are accurate.
4. **Parallel Run** — the **safety check before cutover**: paste your **old
   system's** net-pay figures, set a tolerance, press **Reconcile**, and the app
   compares person-by-person — **Matched / Mismatched / Missing** — so you trust the
   new numbers before relying on them.
5. **Go-Live** — a **Sandbox (test) mode** switch (runs are practice only) vs
   **Production mode** (the real system of record), plus the **Go-live period** (the
   first real cycle). _Why:_ practise safely, then flip the switch deliberately.

---

### 1.6 My Pay (`/payroll/my-payslips`) — "the employee's own pay corner"

What a regular employee sees. Six tabs:

- **Payslips** — pick a **year**, see each month's slip with net pay and status,
  **View** to open the full breakdown.
- **Comp Statement** — their full **annual CTC breakup**: Annual CTC, monthly
  gross, monthly net, and every component, read-only. _Why:_ "where does my package
  go?"
- **Tax Declaration** — declare investments/exemptions (80C, HRA, etc.), pick a
  **tax regime**, and instantly see **projected annual tax under each regime** so
  they choose the cheaper one. (HR sees a version where they **verify proofs**.)
- **Claims** — submit **reimbursement claims** (fuel, internet…) up to a category
  cap; approved claims pay with the next run. (HR sees Approve/Reject.)
- **Loans** — request a **loan or salary advance**, see the full **EMI schedule**
  (each month's principal/interest/balance); EMIs auto-recover each payroll. (HR can
  **Foreclose**.)
- **Tax Forms** — generate the annual statement (e.g. **Form 16**) for a chosen
  fiscal year and download it.

---

## PART 2 — Payroll reports (the 📊 Reports page → "PAYROLL" group)

The Reports page is a two-pane screen: a list of reports on the left, the chosen
report on the right. Under the **PAYROLL** heading there are **seven** reports.
Each one has the same shape: a **filter bar** (usually "pick a payroll run"),
**summary cards**, a **table**, and an **Export** button (downloads CSV). They only
work on runs that have reached REVIEW/APPROVED/PAID (nothing to report on a draft).

1. **Payroll Summary** — the high-level totals for a run (gross, deductions, net,
   headcount). _Why:_ the one-page "what did this month cost?"
2. **CTC Analysis** — breaks down cost-to-company across the workforce. _Why:_
   understand the shape of total compensation.
3. **Salary Register** — the classic line-by-line register: every employee, every
   component, every amount. _Why:_ the standard payroll record finance expects.
4. **Statutory Register** — the contributions/taxes owed to authorities (PF, ESI,
   TDS…). _Why:_ what you must remit to the government.
5. **Bank Advice** — the list of who-gets-paid-how-much-to-which-account. _Why:_ the
   instruction set for the bank.
6. **Variance Register** — month-over-month changes per employee, flagging big
   swings. _Why:_ spot errors and explain why pay moved.
7. **Pay Equity** — compares pay across groups to surface fairness gaps. _Why:_
   detect and defend against unequal-pay issues.

> All of these are **read-only views** computed on demand; the **Export** button is
> the action, producing a spreadsheet finance/auditors can keep.

---

## PART 3 — Settings → Pay & Compliance (the ⚙️ Settings panels that power payroll)

This is the **rule-book** behind payroll. Setting it up correctly is what lets the
engine run. These panels live under the **"Pay & Compliance"** group in Settings
and are **HR Admin / Super Admin only**. There are seven.

### 3.1 Salary Components — "the LEGO block workshop"

The master list of pay pieces (Idea 1 + 2). It's a searchable, filterable table
(filter by **type** and **active/inactive**). Each row shows the code, name, type,
how it's calculated, a **sample monthly amount** (computed live on a ₹12,00,000
sample salary so you see real numbers), whether it's taxable, and active status.

- **Add Component / Edit** opens a side drawer with three sections:
  - **Basic Info** — name, code (auto-generated, locked after creation), display
    order, **type** (Earning / Deduction / **Employer Contribution** / Benefit /
    Reimbursement / Variable), **Taxable** and **Active** switches, an optional
    **statutory tag** (which wage base it feeds), a **Prorate on LOP** switch (does
    it shrink for unpaid days?), and **Pay in months** (e.g. a 13th-month bonus paid
    only in December).
  - **Calculation** — choose **Flat** (fixed amount), **Percentage** (X% of another
    block), or **Formula**. For a formula you get a **live preview table** that
    recalculates as you type, a list of **available variables** (CTC, GROSS, NET,
    and every other block's code), and **on-blur validation** that catches typos and
    circular references.
  - **Accounting** — which **GL account** it posts to and how cost is split
    (by department / none) — so the journal is correct.
- **Delete** is blocked if another block or pay group depends on it (it tells you
  which) — you can't pull out a LEGO that others are standing on.

> **Why "Employer Contribution" is special:** it's a cost the _company_ pays (like
> employer PF) — it rolls into total cost but **never reduces the employee's take-
> home**. This is what makes "CTC = net + employee deductions + employer
> contributions" provably correct.

### 3.2 Pay Groups — "pre-built salary kits"

A **pay group** bundles a set of components into a reusable template you assign to
employees (e.g. "India Full-Time"). Two-pane: a list of groups on the left (each
shows currency, pay schedule, # employees), the selected group's details on the
right.

- **New / Edit** (drawer) — name the group, pick its components, and optionally
  **override** a component just for this group (e.g. a higher HRA % for managers).
- The detail panel lists every component, marks **Overridden** vs **Default**, and
  shows the **live monthly amount** on the sample CTC.
- **Delete** is blocked if employees are assigned (it tells you how many). _Why:_
  you can't delete the kit people are wearing.

### 3.3 Pay Schedules — "the pay-day rhythm"

A read-only list of pay schedules (name, frequency, timezone, next run date,
active). Monthly groups follow the calendar month automatically; bi-weekly/weekly
groups need a schedule here. _Why:_ it tells the system **when** each group gets
paid.

### 3.4 Legal Entities — "your company's legal selves, one per country"

Each country you operate in is a **legal entity** with its own currency, fiscal
year, timezone, and government registration IDs. A table lists them; one is marked
**Active** (the active entity scopes all payroll config and runs).

- **Add Entity / Edit** (drawer) — name, **country** (picking a country
  **auto-fills** sensible currency/locale/fiscal-year defaults — but you can
  override), currency, fiscal year start month, timezone, **registration IDs**
  (typed as `KEY=value`, e.g. `PF=...`, `PAN=...`), and active switch.
- **Set active** — switch which entity you're configuring.

_Why:_ "Acme India Pvt Ltd" and "Acme UK Ltd" are different legal employers with
different rules — the app treats them separately.

### 3.5 Statutory Packs — "each country's rule-book, versioned" (Idea 3 + 5)

The read-only list of **statutory packs** — the bundles of a country's tax regimes,
contribution schemes, and local taxes. Each row shows country, **version**,
**effective dates**, a contents summary ("2 regimes · 3 schemes · 1 local tax"), and
a status:

- **Active** (in force now), **Scheduled** (a future rule change), **Superseded**
  (an old version kept for history).

_Why this is the heart of "no hardcoding":_ a mid-year tax change is just a **new
version** with a future start date. Each payroll run **pins** the version that
applied to its period, so re-running an old month always reproduces the old numbers.

### 3.6 Payslip Template — "design the payslip without code" (Idea 3)

The payslip layout is **configuration**, not a fixed design. One template applies
to every country. You can edit:

- **Template name** and **Language/locale** (controls number formatting and
  language).
- **Logo URL** — the logo printed on top.
- **Sections** — toggle on/off, **reorder** (up/down arrows), and **rename** each
  block of the slip.
- **Header fields** — toggle which employee details print at the top.
- **Save template** (enabled only when there are unsaved changes).
- Below it, a reference list of **Webhook events** payroll emits (for notifications
  and other systems).

_Why:_ different companies/countries want different slip layouts — change it by
clicking, not by asking an engineer.

### 3.7 Data Policy — "where data lives and how long we keep it" (compliance)

Per-country rules for **data residency** (some countries legally require payroll
data to **stay in-country**) and **retention** (how many years to keep it). You set
a **default retention** and, per country, the **residency region**, **retention
years**, and a **Statutory hold** switch (a legal hold that **overrides** automatic
deletion). **Save changes**. _Why:_ privacy/compliance laws (GDPR-style) demand it.

---

## PART 4 — Who can do what (payroll access in one table)

Payroll deliberately splits duties so no one person controls the whole money flow
(**"segregation of duties"**). The four payroll keys:

| Key                  | What it lets you do                                               |
| -------------------- | ----------------------------------------------------------------- |
| **payroll:initiate** | Start and calculate a run, edit inputs, cancel a draft            |
| **payroll:adjust**   | Add per-payslip adjustments, recalc, hold/release, manage workers |
| **payroll:approve**  | Sign off a run in REVIEW, publish payslips                        |
| **payroll:disburse** | Generate the bank file, mark as paid, pay contractor invoices     |

| Role            | Payroll access                                                                            |
| --------------- | ----------------------------------------------------------------------------------------- |
| **Employee**    | **My Pay only** — own payslips, comp statement, tax declaration, claims, loans, tax forms |
| **Manager**     | Same as employee for their own pay (the payroll engine is HR-only)                        |
| **HR Admin**    | The full control room: run, adjust, approve, disburse, all settings                       |
| **Super Admin** | Everything HR Admin has, plus the highest-level config                                    |
| **Auditor**     | Read-only — can view reports and records, change nothing                                  |

> **The golden control:** **the person who starts a run cannot approve it** — a
> second person must. That single rule is the backbone of payroll trust.

---

## PART 5 — Three stories to tell in the meeting

**Story A — HR runs March payroll:**

1. HR opens **Payroll → Run Payroll**, picks **March**, **Calculate**.
2. The brain builds every payslip from the LEGO blocks. HR lands on the run page in
   **REVIEW**.
3. HR checks the **Variance** and **Warnings** panels — all clear.
4. A **second** HR person **Approves** (maker ≠ checker).
5. HR **Generates the bank file**, hands it to the bank, **Marks as Paid**, and
   **Publishes payslips**.
6. Every employee opens **My Pay** and downloads their slip.

**Story B — A new tax law lands mid-year:**

1. We add a **new version** of the country's **Statutory Pack** with a future start
   date (it shows as **Scheduled**).
2. Runs before that date still pin the **old** version; runs after pin the **new**
   one — automatically. No code change, and old months still reproduce exactly.

**Story C — Switching from the old payroll system:**

1. HR opens **Migration**, sets the **Pay Calendar**, imports **Opening Balances**
   and **Historical Payslips**.
2. HR does a **Parallel Run** — pastes the old system's numbers, and the app
   confirms they **Match**.
3. HR flips **Go-Live** out of Sandbox. The new system is now the source of truth.

---

## One-sentence close

> _"Our payroll is a configurable engine: HR builds salaries from LEGO-block
> components, every country's rules live as versioned data (never code), money is
> exact, the past is frozen for audit, and the money flow is split across people so
> no one can pay themselves unchecked."_
