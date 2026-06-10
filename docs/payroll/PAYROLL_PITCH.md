# 💸 Payroll, Explained Like You're Five — The Founder's Pitch

> **What this is:** the story of our payroll system told in the simplest possible
> way — with a single picture in your head (a **Salary Kitchen**) — and then a
> minute-by-minute walkthrough of **exactly what every type of person does**, what
> they can touch, what they can't, and why that keeps everyone's money safe.
>
> Read the first three sections to "get it." Read the role sections to see **every
> detail**.

---

## 1. The big problem (why this matters)

Paying people looks easy. It is not.

Every month a company has to take each person's salary, subtract the right taxes,
add the right benefits, follow the **rules of that person's country**, put the
exact right number into the exact right bank account, on the exact right day — and
keep a perfect record of it forever. Get it wrong and you either **break the law**,
**underpay a human being's rent**, or **lose money you can't get back**.

And here's the killer: **every country has different rules**, and those rules
**change every year**. Most payroll software is built for one country. The moment
you hire someone abroad, it falls apart.

> **One-line pitch:** _We built payroll as **settings you can change**, not code a
> programmer has to rewrite. So the same system runs payroll correctly in India
> today, the UAE tomorrow, and a country we've never seen next year — without a
> single line of new code._

---

## 2. The one idea that makes it special: **"No magic numbers in the code"**

Imagine a vending machine where the prices are **painted onto the glass**. To change
a price, you'd have to repaint the whole machine. That's how most payroll software
works — the tax rates are "painted on."

Ours is a vending machine where prices are **little cards you slide in and out**.
Change a card, the price changes. No repainting.

In payroll language: tax rates, benefit percentages, rounding rules, bank-form
layouts — **none of them are written into the program**. They're all **cards**
(we call them _configuration_) that an admin slides in. That's the whole moat. 🪄

---

## 3. The picture to keep in your head: the **Salary Kitchen** 🍳

Think of payroll as a **kitchen that cooks everyone's pay, once a month.**

| In the kitchen…           | In payroll it's called…     | What it means (for a 5-year-old)                                          |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| 🥕 Ingredients            | **Salary Components**       | The building blocks of pay: Basic, House Rent, Tax, Provident Fund…       |
| 📖 A recipe               | **Formula**                 | "House Rent = 40% of Basic." The kitchen follows recipes, never guesses.  |
| 🍱 A lunchbox menu        | **Pay Group**               | A bundle of ingredients given to a group of people.                       |
| 📕 The country's rulebook | **Statutory Pack**          | The government's "how much tax & benefits" book — one per country, dated. |
| 🗓️ The wall calendar      | **Pay Calendar**            | "Payday is the last working day of the month."                            |
| 🧒 Each kid's order       | **Compensation Assignment** | This person gets _this_ lunchbox, and it costs ₹X a year (their CTC).     |
| 👩‍🍳 Cooking day            | **Payroll Run**             | The day we actually make everyone's pay for the month.                    |
| 📝 Notes for the cook     | **Inputs**                  | "Aman was off 2 days," "Priya did overtime." Real-life adjustments.       |
| 👅 Tasting before serving | **Review**                  | Check every plate looks right _before_ anyone eats.                       |
| ✅ The boss says "serve"  | **Approve**                 | A second person signs off. The cook can't serve their own food.           |
| 🚚 The waiter delivers    | **Disburse / Mark Paid**    | Money actually leaves the company and lands in bank accounts.             |
| 🧾 The receipt            | **Payslip**                 | Each person's proof of what they got and why.                             |

**That's the entire system.** Everything below is just _who stands where in the
kitchen._

---

## 4. The golden safety rule: **the cook can't serve their own food** 🔒

The most important idea in the whole pitch. We split the work so that **no single
person can both create the pay and send the money.** It's like a bank vault that
needs **two different keys** turned by **two different people.**

There are **four keys** (we call them permissions):

| Key 🔑             | Lets you…                                                 | Kitchen meaning             |
| ------------------ | --------------------------------------------------------- | --------------------------- |
| `payroll:initiate` | Start a run, **Calculate**, **Dry-Run**, **Cancel** a run | 👩‍🍳 Cook the food            |
| `payroll:adjust`   | Tweak a payslip, recalc one person, **Hold/Release** pay  | 🧂 Season individual plates |
| `payroll:approve`  | **Approve** each level, **Publish** payslips              | ✅ Boss signs off           |
| `payroll:disburse` | **Mark as Paid**, make the bank file, reconcile payouts   | 🚚 Send the money           |

In a real company these go to **different people**: HR cooks, a Finance manager
signs off, and Treasury sends the money. So a mistake (or fraud) needs three people
to collude — which is exactly the point. Every action is also **written in a diary
that can never be erased** (the audit trail). 📔

---

## 5. The cast of characters (the 5 roles)

| Who 🎭          | In one sentence                                                          | Keys they hold by default                   |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| **Super Admin** | The owner of the whole building. Can do anything, sets the rules.        | All four keys + every setting               |
| **HR Admin**    | The kitchen manager. Sets up recipes and runs payroll day-to-day.        | All four keys + Pay & Compliance settings   |
| **Manager**     | A team lead. Cares about their team, but **does not touch payroll**.     | None for payroll (sees their own team only) |
| **Employee**    | Gets paid. Can look at **their own** money, claim expenses, declare tax. | "My Pay" self-service only                  |
| **Auditor**     | The inspector. Looks at everything, **changes nothing**.                 | Read-only                                   |

> In production you can hand the four keys to four _different_ people even within
> HR/Finance. By default HR Admin and Super Admin hold all four so a small company
> can start instantly.

---

## 6. The monthly story — minute by minute 🎬

Here's one full month, start to finish, with the kitchen running. Follow the
hand-offs between people.

### Act 0 — One-time setup (only the first time) — _HR Admin / Super Admin_

Before the very first cooking day, HR stocks the kitchen. This happens once, then
rarely changes.

1. **Create the ingredients** — _Settings → Pay & Compliance → Salary Components._
   Basic, House Rent, Provident Fund, Tax… Each one says _how_ it's calculated
   (a fixed number, a percentage, or a recipe like `BASIC * 0.4`).
   - 🧒 _ELI5:_ you write down every kind of "money piece" a salary can have.
   - There's a **live preview**: as you type a recipe, it shows the result on a
     sample salary, so you can't save a broken recipe.
2. **Bundle them into a menu** — _Pay Groups._ "All full-time engineers get this
   set of ingredients." 🍱
3. **Confirm the country rulebook** — _Statutory Packs._ The tax slabs and benefit
   rates for the country, stamped with a **start date**. If the law changes mid-year,
   you add a **new dated version** — old payslips keep using the old rulebook. 📕
4. **Set the legal entity, pay calendar & cutoffs** — which company, which currency,
   when payday is. 🗓️
5. **Set data rules** — how long we keep records per country (Data Policy).
6. **Give each employee their order** — _Employee profile → Compensation tab._ Pick
   their pay group + type their **Annual CTC**; the kitchen works out every
   ingredient amount automatically from the recipes. 🧒
7. **(If moving from an old system)** — _Payroll → Migration:_ load opening balances
   and past payslips, do a **parallel run** (cook the month twice — once here, once
   the old way — and compare), all while **Sandbox mode is ON** so no real money
   moves. Flip Sandbox **off** only when the numbers match. 🧪

> **Why Sandbox matters (ELI5):** it's a play-kitchen. You can cook pretend meals to
> check the recipes, and nobody actually eats until you say "we're live."

---

### Act 1 — Cooking day arrives — _HR Admin (needs `payroll:initiate`)_

8. **Start the run** — _Payroll → Run Payroll →_ pick the month + pay groups. This
   creates a run in **DRAFT** (the kitchen is prepped but nothing's cooked). 👩‍🍳

9. **Add the notes for the cook (Inputs)** — open the run → **Inputs** panel. Per
   person: days of unpaid leave (LOP), overtime/shift/on-call hours, variable pay
   (commissions/bonuses), and one-time add/subtract. Approved expense **claims** for
   the month attach themselves automatically. You can also bulk-paste from a CSV.
   - 🧒 _ELI5:_ you tell the cook "Aman missed 2 days, Priya worked extra."
   - 🔌 _Behind the glass:_ overtime hours can be **pulled straight from approved
     timesheets** with one click — no re-typing.

10. **Calculate** — click **Calculate Payroll**. Now the kitchen cooks. For **each**
    person, in a strict, repeatable order:
    1. Find their pay deal + lock the rulebook version for this month.
    2. Work out the **part-month factor** if they joined/left/were absent.
    3. Cook the **earnings** (following the recipes, in the right order).
    4. Work out **statutory benefits** (Provident Fund, social security…) — both the
       employee's share **and** the employer's share.
    5. Work out **income tax** using the country's slabs + what the employee declared
       - their year-to-date total (so tax evens out across the year).
    6. Subtract **deductions** (taxes, loan EMIs, voluntary bits).
    7. Add **variable pay, reimbursements, one-time extras**; subtract one-time cuts.
    8. Produce the final four numbers: **Gross, Total Deductions, Employer Cost, Net Pay.**
    9. Note any **warnings** ("no salary set up", "pay came out negative", "missing
       bank details").
    10. Save the payslip **frozen with the exact rulebook version it used.**
    - The run moves to **REVIEW**. **No money has moved. Nobody's been paid.** 🧊
    - 🧒 _ELI5:_ the food is cooked and on the counter, but **nobody eats yet.**

> **Reproducible:** same inputs + same rulebook = **exactly the same numbers**, every
> time. Like a recipe that always tastes identical. 🔁

---

### Act 2 — Tasting before serving (the control gate) — _HR Admin (needs `payroll:adjust` to change anything)_

This is the safety stage. Look hard before anyone eats.

11. **Variance Review** — the system flags anyone whose pay jumped strangely vs last
    month, tagged `HIGH_VARIANCE`, `NEGATIVE_NET`, `ZERO_PAY`, `NEW_JOINER`. 🚩
12. **Dry Run** — recomputes the totals + warnings **without saving**, so you can
    sanity-check freely.
13. **Per-person fixes** (the `⋯` menu on each row):
    - **Add adjustment** — a one-time bonus or deduction for that person.
    - **Recalculate payslip** — re-cook just _one_ plate after a fix (not the whole
      kitchen).
    - **Hold payment** — see next.
14. **Hold one person's pay (Stage 4a)** — if someone's pay is disputed but everyone
    else is fine: `⋯` → **Hold payment**. Their row gets a red **HELD** badge and is
    **left out of the money transfer** until you **Release** it. Holding is only
    allowed before the money's gone, and every hold/release is in the diary. ✋

---

### Act 3 — The boss signs off — _Approver (needs `payroll:approve`)_

15. **Approve.** A **different person** from the cook reviews and approves. Big runs
    can need **several** approvals in a chain (HR → Finance → CEO over a threshold).
    The run becomes **APPROVED** only when **every** level signs. The system **stops
    the same person** from being both cook and approver. ✍️

---

### Act 4 — Send the money — _Treasury (needs `payroll:disburse`)_

16. **Mark as Paid** — enter the payment date + reference → status **PAID.** From this
    moment the run is **frozen forever** — you can never edit a paid run (fixes go
    into a _new_ correction run). 🧊🔒
17. **Disburse** — on the **Disbursement** panel, generate the **bank file** in the
    right country format (India NACH / US ACH / EU SEPA / UK BACS), then **Reconcile**
    to track each payout as `PAID / FAILED / RETURNED`. Held people aren't in the file. 🚚

---

### Act 5 — Give everyone their receipt — _Approver (needs `payroll:approve`)_

18. **Publish Payslips.** Now — and only now — each employee can open **My Pay** and
    see their payslip. 🧾

---

### Act 6 — The paperwork the company needs — _HR Admin / Finance_

From the run screen and **Reports → Payroll**:

- **Accounting Journal** + export (CSV / Tally / QuickBooks). 📒
- **Statutory returns** — the forms the government wants (PF ECR / TDS 24Q / UK RTI…).
- **Registers** — Salary / Statutory / Bank-advice / Variance.
- **Pay Equity** report (are we paying fairly?).
- **Annual tax forms** — Form 16 / W-2 / P60.
- **Audit Pack** — one file with the full run history, who approved, the exact
  rulebook version used, and every override. The inspector's dream. 🕵️

---

## 7. Every role, in full detail (the part you asked for)

Now the same kitchen, but standing in each person's shoes. **What they see, every
button they can press, and — just as important — what they cannot.**

---

### 🦸 Super Admin — _the owner of the building_

**Mental model:** holds **every key** and owns **every rulebook**. The only role that
can change the deep rules of the system itself.

**What they can do (everything HR can, plus):**

- Owns **Settings → Pay & Compliance** end-to-end: Salary Components, Pay Groups, Pay
  Schedules, **Statutory Packs** (the country rulebooks), **Legal Entities**, **Payslip
  Template**, **Data Policy**.
- Holds all four payroll keys → can initiate, adjust, approve, **and** disburse.
- Is the only role allowed to **cancel a run that's already moving** in some setups,
  and to change the deepest security settings.
- Manages who gets which key (the Permissions matrix).

**What they cannot do:** nothing is hidden from them — which is _exactly why_ a
careful company gives this role to very few people and still routes day-to-day
payroll through the four-key split so no one shortcut bypasses the checks.

**ELI5:** the principal of the school. Can walk into any room, but smart enough to
let the kitchen run its two-key system anyway.

---

### 👩‍🍳 HR Admin — _the kitchen manager (the star of the show)_

**Mental model:** runs payroll **every month**. Sets up the recipes, presses the
buttons, watches the warnings.

**Their screens & every action:**

1. **Setup (Settings → Pay & Compliance):**
   - **Salary Components** — create/edit ingredients; each has a type (earning,
     deduction, employer-contribution, benefit, reimbursement, variable) and a
     calculation (flat / percentage / **recipe formula** with a live preview).
   - **Pay Groups** — bundle components; can override one component for the whole group.
   - **Pay Schedules / Pay Calendar** — when payday and cutoffs are.
   - **Statutory Packs** — confirm/clone the country rulebook; add a new dated version
     when the law changes.
   - **Legal Entities, Payslip Template, Data Policy** — the company, the receipt
     layout, the retention rules.
2. **Assign pay** — on each **Employee → Compensation tab**: pick pay group + Annual
   CTC; the breakdown is computed live. Salary changes create a **new history record**
   (never an edit) — mid-month raises become **arrears** next run.
3. **Run payroll** (the monthly cycle, Acts 1–6 above): Initiate → Inputs → Calculate
   → Review (variance, dry-run, adjust, **hold/release**) → Approve → Mark Paid →
   Disburse → Publish.
4. **Cancel a run** (`payroll:initiate`) — only before approval/payment; permanent +
   logged.
5. **Outputs** — journals, statutory returns, registers, pay-equity, tax forms, audit
   pack.
6. **Global Workforce** — _Payroll → Global Workforce:_ employees + contractors + EOR
   workers with consolidated cost; a **Compliance** column flags possible worker
   **misclassification** (fix by changing the worker's Type).
7. **Migration** — _Payroll → Migration:_ onboarding from an old system, opening
   balances, historical payslips, **parallel run**, and the **Sandbox / Go-Live** toggle.

**What they cannot do:** nothing within payroll by default — but in a strict company
the four keys are split, so a "pure HR" person might initiate + adjust but **not**
approve or disburse their own run.

**ELI5:** the grown-up running the kitchen. Cooks the food, tastes it, fixes plates —
but in a careful house, someone _else_ says "serve" and someone _else_ carries it out.

---

### 🧑‍💼 Manager — _the team lead who stays out of the money_

**Mental model:** cares about **their team's work**, but payroll is **none of their
business** — on purpose.

**What they can do:**

- See their **own** team (in the team/attendance/leave areas).
- Approve their team's **leave** and **timesheets** (which _feed_ payroll — e.g.
  approved overtime can be imported into a run — but the manager never sees or runs
  payroll itself).
- See **their own** pay under **My Pay**, exactly like any employee.

**What they cannot do:**

- No payroll admin at all. If a manager tries to open the payroll runs screen, the
  system **redirects them to their own My Pay** page. The roster/run endpoints
  **refuse** them server-side (not just a hidden button — actually blocked). 🚫
- Cannot see anyone else's salary.

**ELI5:** the team captain. Decides who plays, but **never touches the cash box.**

---

### 🧑 Employee — _the person getting paid (self-service)_

**Mental model:** can see and manage **only their own** money. Never anyone else's.

**Their screens — _Payroll → My Pay_ tabs:**

- **Payslips** — list + detail + PDF download of their own payslips (only after HR
  **publishes** the run).
- **Comp Statement** — their annual CTC broken down, ingredient by ingredient.
- **Tax Declaration** — declare investments/exemptions, upload proofs, see projected
  tax under each regime, and **choose** their regime.
- **Claims** — submit an expense with a proof and track its status (approved claims
  flow back into payroll automatically).
- **Loans** — request an advance/loan, view the EMI schedule and remaining balance.
- **Tax Forms** — download year-end forms (Form 16 / W-2 / P60).

**What they cannot do:**

- Cannot see **anyone else's** payslip, salary, or data.
- Cannot run, change, approve, or pay anything.
- Their payslip is **read-only** and only appears once the run is published.

**ELI5:** you can open **your own** lunchbox and read **your own** receipt, ask for
snack money back, and tell the cook about your allergies — but you can't go into the
kitchen or peek at anyone else's lunch.

---

### 🕵️ Auditor — _the inspector who changes nothing_

**Mental model:** **read-only** across payroll. Built for trust and compliance.

**What they can do:**

- View runs, payslips, the approval chain, the pinned rulebook version, and the full
  **override/audit log**.
- Pull the **Audit Pack** and the compliance/assurance reports.

**What they cannot do:**

- Press **no** buttons that change anything — no initiate, adjust, approve, disburse,
  or edit. Ever.

**ELI5:** the health inspector with a clipboard. Looks in every pot, writes notes,
but is **not allowed to cook or serve.**

---

## 8. Why money can't go wrong here (the trust story) 🛡️

Four promises, each in one breath:

1. **Two-key vault** — making pay and sending money are different keys held by
   different people (§4). No one person can do both.
2. **Frozen history** — a paid run can **never** be edited. Mistakes become a new,
   tracked correction run. The past is set in stone. 🧊
3. **Pinned rulebook** — every run remembers the **exact** version of the country's
   rules it used, so it can be re-cooked years later and produce the identical
   number. 🔁
4. **Unerasable diary** — every start, edit, hold, approval, and payment is logged
   with _who_, _when_, and _before/after_. The Auditor sees all of it. 📔

---

## 9. Why it's a category winner (the moat) 🏰

- **Global from day one.** Same engine, any country — because rules are _cards_, not
  _code_. Hire in a new country = add a rulebook, not a release.
- **Configuration over code.** Tax slabs, benefit rates, rounding, bank formats,
  payslip layouts — all data. Litmus test we hold ourselves to: _could a company in a
  country we've never seen run correct payroll with **settings alone**?_ The answer is
  **yes**.
- **Employer cost is honest.** We model **CTC = net pay + employee deductions +
  employer contributions** separately, so "what the company really spends" is always
  provable — not fudged.
- **Built-in trust.** Separation of duties, immutability, reproducibility, and full
  audit aren't add-ons — they're the foundation. That's what enterprises and
  regulators actually buy.

---

## 10. The close 🎤

Payroll is the one thing a company **cannot** get wrong — it's people's rent, their
groceries, their trust. Most tools treat it as a single-country spreadsheet with the
rules painted on. **We built a kitchen where the recipes are cards you can change, the
cook can't serve their own food, the past can never be rewritten, and the same meal
comes out perfect in every country on Earth.**

Stock the kitchen once. Then every payday is just: **cook → taste → sign → serve →
receipt.** Safe, global, and provable.

That's the pitch. 🍳💸
