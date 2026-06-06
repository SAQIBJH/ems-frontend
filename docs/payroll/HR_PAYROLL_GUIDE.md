# HR Payroll Portal — User Guide

> A step-by-step brief for the HR team on running payroll end-to-end in the EMS
> portal. Covers every stage from setup to employee self-service, plus the
> hold/cancel controls and who has access to what.
>
> **Note:** Payroll currently runs on mock data (a fixed demo roster) for
> demonstration. The workflow and screens are exactly what the live system will use.

---

## 0. Who can do what (access matrix)

Payroll uses **four separate permissions** so that no single person can both run
_and_ pay payroll (segregation of duties). `HR_ADMIN` and `SUPER_ADMIN` have all four
by default; in production each can be assigned to a different person.

| Permission         | Lets the holder…                                                        |
| ------------------ | ----------------------------------------------------------------------- |
| `payroll:initiate` | Create a run, **Calculate**, **Dry Run**, **Cancel a run**              |
| `payroll:adjust`   | Add a payslip adjustment, Recalculate a payslip, **Hold / Release** pay |
| `payroll:approve`  | Approve each approval level, **Publish** payslips to employees          |
| `payroll:disburse` | **Mark as Paid**, generate the bank file & reconcile payouts            |

| Role          | Access                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| `SUPER_ADMIN` | Everything (all four payroll permissions + settings)                   |
| `HR_ADMIN`    | Everything in payroll + Pay & Compliance settings                      |
| `MANAGER`     | No payroll admin; sees own team only                                   |
| `EMPLOYEE`    | **My Pay** self-service only (own payslips, comp statement, tax, etc.) |
| `AUDITOR`     | Read-only                                                              |

A typical real-world split: **HR** initiates + adjusts + holds, a **Finance approver**
approves, and a **Finance/treasury** user disburses.

---

## Stage 0 — One-time setup (before the first run)

| Do this                                                                                    | Where                                                 |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Define salary components (Basic, HRA, PF, TDS…)                                            | Settings → Pay & Compliance → **Salary Components**   |
| Bundle components into pay groups                                                          | Settings → Pay & Compliance → **Pay Groups**          |
| Assign each employee a pay group + Annual CTC                                              | Employee profile → **Compensation** tab               |
| Confirm the country statutory pack (tax/PF/ESI rates)                                      | Settings → Pay & Compliance → **Statutory Packs**     |
| Set legal entity, pay calendar & cutoffs                                                   | Settings → Pay & Compliance + **Payroll → Migration** |
| Data residency & retention per country                                                     | Settings → Pay & Compliance → **Data Policy**         |
| (Mid-year go-live) opening balances, historical payslips, **parallel run**, sandbox toggle | **Payroll → Migration** wizard                        |

> **Sandbox first.** In the Migration → Go-Live tab, keep **Sandbox mode ON** while you
> validate config; runs are for testing only until you switch it off and set the
> go-live period.

---

## Stage 1 — Start the run _(needs `payroll:initiate`)_

Sidebar → **Payroll** → **Run Payroll** → choose the period and pay groups → creates a
run in **DRAFT**.

## Stage 2 — Enter inputs

Open the run → **Inputs** panel. Enter per-employee: LOP / leave days, overtime / shift /
on-call hours, variable pay, and one-time additions/deductions. Approved reimbursement
**claims** for the period attach automatically. You can also bulk-import via CSV.

## Stage 3 — Calculate _(needs `payroll:initiate`)_

Click **Calculate Payroll**. The engine computes each payslip (earnings → statutory
deductions → income tax with year-to-date true-up → net). The run moves to **REVIEW**.

## Stage 4 — Review — the control gate _(review needs `payroll:adjust` to change anything)_

Nothing is paid yet. Use this stage to verify the numbers:

- **Variance Review** — employees whose net pay swings vs last period, flagged
  (`HIGH_VARIANCE`, `NEGATIVE_NET`, `ZERO_PAY`, `NEW_JOINER`).
- **Dry Run** — recomputes totals + anomalies **without saving**, so you can sanity-check.
- **Warnings** — e.g. "no salary config", "below minimum wage".
- **Per-payslip actions** (the `⋯` menu on each employee row):
  - **Add adjustment** — one-time bonus/deduction.
  - **Recalculate payslip** — recompute a single employee.
  - **Hold payment** — see Stage 4a.

### Stage 4a — Hold one employee's payment _(needs `payroll:adjust`)_

If one person's pay is disputed or under investigation but everyone else should be paid:

1. On that employee's row, open the `⋯` menu → **Hold payment**.
2. The row shows a red **HELD** badge. That payslip is **excluded from disbursement**
   (it won't appear in the bank file or payment batch) until you release it.
3. To pay them later, `⋯` → **Release hold** — they re-enter the run.

> Holding is allowed only while the run is in **Review** or **Approved** (not after it's
> Paid). Every hold/release is recorded in the audit trail.

## Stage 5 — Approve _(needs `payroll:approve`)_

Approve each level in the chain (e.g. HR review → Finance approval for large runs). The
person who approves a level **cannot be the same** person on a conflicting maker step —
this is enforced. The run becomes **APPROVED** only when all levels sign off.

## Stage 6 — Pay _(needs `payroll:disburse`)_

Click **Mark as Paid**, enter the payment date and reference → status **PAID**.

## Stage 7 — Disburse _(needs `payroll:disburse`)_

On the **Disbursement** panel: generate the country **bank file** (NACH / ACH / SEPA /
BACS), then **Reconcile** to track each payout (PAID / FAILED / RETURNED). Held payslips
from Stage 4a are not in this file.

## Stage 8 — Publish to employees _(needs `payroll:approve`)_

Click **Publish Payslips**. Each employee can now see their payslip under **My Pay**.

## Stage 9 — Post-payroll outputs

From the run-detail screen and **Reports → Payroll**:

- **Accounting Journal** + export (CSV / Tally / QuickBooks).
- **Statutory returns** — PF ECR / TDS 24Q / UK RTI.
- **Registers** — Salary / Statutory / Bank-advice / Variance (Reports → Payroll).
- **Pay Equity** report (Reports → Payroll).
- **Annual tax forms** — Form 16 / W-2 / P60.
- **Audit assurance pack** — JSON with run history, approval chain, pinned config
  version, and the full override log (hold/cancel/adjust included).

## Cancelling a run _(needs `payroll:initiate`)_

If a run was started in error, open it and click **Cancel Run** (top-right). Enter a
reason and confirm. A run can be cancelled **only before approval/payment**
(Draft / Calculating / Review) — once Approved or Paid it can't be voided. The action
is permanent and logged in the audit trail.

---

## Stage 10 — Employees self-serve _(any `EMPLOYEE`)_

**Payroll → My Pay** tabs: **Payslips · Comp Statement · Tax Declaration · Claims ·
Loans · Tax Forms**. Employees see only their own data.

## Stage 11 — Ongoing / global

- **Payroll → Global Workforce** — employees, contractors, EOR workers + consolidated
  cost. (The _Compliance_ column flags possible misclassification risk; remediate by
  changing the worker's **Type**.)
- **Payroll → Migration** — onboarding tools and go-live.
- **Reports → Payroll** — registers, pay equity, summaries.

---

## Quick reference — run lifecycle

```
DRAFT ──Calculate──► CALCULATING ──► REVIEW ──Approve(all levels)──► APPROVED ──Mark Paid──► PAID
   │                                   │                                │
   └──────────── Cancel Run ───────────┘ (only before approval)         └── Publish → employees see payslips
                                       │
                                       └── Hold / Release a single employee's payment
```
