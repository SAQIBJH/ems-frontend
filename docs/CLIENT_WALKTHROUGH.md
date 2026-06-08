# EMS — Client Walkthrough (Explain-Like-I'm-5)

> A simple, step-by-step script for the client meeting. Walk top to bottom.
> Everything here is **actually built and working** in the app today.

---

## 1. The big picture — what is this thing?

Imagine a company is like a **school**. A school has students, teachers, a
principal, class timings, holidays, report cards, and a fee office.

**EMS (Employee Management System) is the "school office" for a company** — but
instead of students it has **employees**, and it keeps track of everything about
them in one place:

- Who works here?
- Which team are they on?
- Did they come to work today?
- Did they ask for a day off?
- How much do we pay them?
- Are they doing a good job?

Before this, companies kept all this in messy Excel sheets and WhatsApp
messages. **EMS puts it all in one tidy, locked, organized place** that you open
in a web browser — no installing anything.

**One-line pitch for the client:** _"It's the single home for everything about
your people — hiring them, paying them, tracking their time off, and seeing how
the company is doing — with the right locks so each person only sees what they're
allowed to."_

---

## 2. The 5 types of people (this is the most important part)

Not everyone is allowed to touch everything. Think of it like a house with keys.
**Everyone gets a key, but each key opens different doors.** We call this
**"roles."** There are 5:

| Role            | Think of them as…       | What their key opens                                                                                                               |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Employee**    | A student               | Their **own** stuff only — their attendance, their leave, their payslips, their tasks. They can't see other people's private info. |
| **Manager**     | A class teacher         | Their **own** stuff **+ their team's** stuff. They approve their team's leave and timesheets.                                      |
| **HR Admin**    | The school office staff | **Almost everything** — add/remove employees, run payroll, set holidays, manage leave. The day-to-day boss of the system.          |
| **Super Admin** | The principal           | **Everything**, including the master settings, billing, integrations, and who-can-do-what. The highest key.                        |
| **Auditor**     | A government inspector  | **Read-only.** Can look at everything to check records, but can't change a single thing.                                           |

**Why this matters:** If a regular employee could open payroll and see everyone's
salary, that's a disaster. The role system is the set of locks that prevents
that. _The app shows each person a different set of menu items and buttons based
on their key._

> Quick analogy for the client: _"In an ATM you can see your own balance, not
> your neighbor's. EMS works the same way — your role decides what you're allowed
> to see and do."_

---

## 3. The front door — logging in (the very first step)

Before anyone sees anything, they have to prove who they are. This is the
**login flow**:

1. **Login page** — You type your **email and password**. (Like the lock on the
   front door of the office.)
2. **OTP / extra code** _(optional second lock)_ — For extra safety, the system
   can ask for a **one-time code** (OTP). Like when your bank texts you a number
   to confirm it's really you.
3. **Forgot password** — If you forget your password, you click "Forgot
   password," and the system emails you a link to make a new one. Then on the
   **Reset password** page you set the new one.

**Why we have it:** So that **only the real, invited people** get in — not
strangers. Once you're in, the system quietly remembers you (a secure "wristband"
called a cookie) so you don't have to log in on every page.

**Who:** Everyone goes through this door. What they see _after_ the door depends
on their role (Section 2).

---

## 4. Once you're inside — the menu on the left

After logging in, there's a **menu bar down the left side** (the "sidebar"). Each
item is a different room. Let's walk through every room, top to bottom, exactly
in the order it appears.

---

### 4.1 Dashboard 🏠 — "the welcome room"

- **What it is:** The first screen you land on. A summary page with cards and
  charts — like the front page of a newspaper made just for you.
- **What you see:** A friendly greeting ("Welcome back, Aman"), key numbers (how
  many employees, who's on leave today, pending approvals), and small graphs.
- **Why we have it:** So that the moment you log in, you see the most important
  stuff without searching.
- **Who:** Everyone — but **the dashboard changes per role.** An employee sees
  _their_ day; a manager sees _their team_; HR sees the _whole company_.

---

### 4.2 Employees 👥 — "the people directory"

- **What it is:** The full list of everyone who works at the company. Like a phone
  book with photos.
- **What you can do:** Search for a person, click them to see their **profile**
  (job title, department, contact, documents, salary tab for HR), **add a new
  employee**, **edit** details, or **remove** someone who left.
- **Why we have it:** It's the heart of the system — the master record of every
  person.
- **Who:**
  - **Employee:** can view the directory (basic info).
  - **HR Admin / Super Admin:** can **add, edit, and remove** people. (Regular
    employees cannot.)

---

### 4.3 Departments 🏢 — "the org chart / teams"

- **What it is:** The company's structure — which teams exist (Engineering, Sales,
  HR…) and who reports to whom. Shown as a **tree**, like a family tree.
- **Why we have it:** So everyone knows how the company is organized and who sits
  in which team.
- **Who:** Everyone can look; **HR Admin / Super Admin** can create and rename
  teams.

---

### 4.4 Attendance ⏰ — "the daily roll-call"

- **What it is:** Tracks **who showed up and when.** Employees **check in** when
  they start work and **check out** when they leave. There's a calendar grid
  showing each day.
- **Regularization:** If you forgot to check in, you can **request a correction**,
  and your manager approves it. (Like telling the teacher "I was here, I just
  forgot to sign the register.")
- **Why we have it:** To know who's at work, and to feed accurate days into
  payroll.
- **Who:** Employees mark their own attendance; managers/HR review and approve
  corrections.

---

### 4.5 Timesheets ⏱️ — "what did your hours go to?"

- **What it is:** Different from attendance! Attendance asks _"Were you here?"_
  Timesheets ask _"What did you spend your hours **on**?"_ — which **project or
  task.** You fill a weekly grid (or use a start/stop **timer**), then **submit
  the week**.
- **Why we have it:** So the company knows how much time went into each project —
  useful for billing clients and seeing if people are over/under-loaded.
- **Who:**
  - **Employee:** logs their own hours and submits.
  - **Manager / HR:** **approves or rejects** the submitted week.

---

### 4.6 Leave 🌴 — "asking for time off"

- **What it is:** Where employees **request holidays / sick days**, see their
  **leave balance** (how many days they have left), and managers **approve or
  deny** requests.
- **Why we have it:** A clean, fair way to handle time-off instead of WhatsApp
  messages that get lost.
- **Who:**
  - **Employee:** requests leave, sees their own balance.
  - **Manager / HR:** approves or denies the team's requests.

---

### 4.7 Holidays 📅 — "the official day-off calendar"

- **What it is:** The list of **company-wide holidays** (Diwali, New Year, etc.)
  shown on a year calendar.
- **Why we have it:** So everyone knows which days the office is officially closed,
  and so payroll doesn't count them as absences.
- **Who:** Everyone can see; **HR Admin** sets and edits the holiday list.

---

### 4.8 Payroll 💵 — "the salary engine" (the big one)

- **What it is:** The part that **calculates and pays salaries.** This is the most
  powerful piece. It has several rooms:
  - **Payroll (main):** Run payroll for a month — it goes through stages: _Draft →
    Calculating → Review → Approved → Paid._ HR checks everything before money
    moves.
  - **My Payslips:** Each employee can download **their own** payslips.
  - **Global / Migration:** Settings for **multi-country payroll** — the system
    isn't hardcoded to one country. Tax rules, currencies, and salary parts are
    all **configurable**, so it can pay people in any country.
- **Why we have it:** Paying people correctly, on time, with the right taxes, is
  the hardest and riskiest job in any company. This automates it.
- **Who:**
  - **Employee:** sees **only their own payslips.**
  - **HR Admin / Super Admin:** runs payroll, reviews, and approves it. (This is
    locked tight — most people can't open this room.)

---

### 4.9 Reports 📊 — "printable summaries"

- **What it is:** On-demand reports — pick a date range and a team, and it builds a
  summary table + chart you can **export to a CSV file** (open in Excel).
- **Why we have it:** For sharing numbers with leadership, finance, or auditors.
- **Who:** Mainly **HR Admin / Super Admin**; **Auditor** can view.

---

### 4.10 Analytics 📈 — "the company health dashboard"

- **What it is:** A big-picture dashboard of trends — headcount over time, who's
  leaving (attrition), payroll cost, etc. Charts, not raw lists.
- **Why we have it:** So leadership can **spot trends and make decisions** ("we're
  losing too many people in Sales").
- **Who:** **HR Admin / Super Admin** (people allowed to see company-wide numbers).

---

### 4.11 Permissions 🛡️ — "the key-cutting room"

- **What it is:** The screen where you decide **which role can do what** — a grid
  of roles vs. abilities (View, Create, Delete, Approve…).
- **Why we have it:** So the company can fine-tune the locks themselves without a
  programmer.
- **Who:** **Super Admin only** (and HR Admin). This is the master control of the
  whole locking system from Section 2.

---

### 4.12 Settings ⚙️ — "the control panel"

- **What it is:** The big back-office area where the system is configured. Many
  panels grouped together, for example:
  - **Company profile & branding** — name, logo, colors.
  - **Authentication & sessions** — security, who's logged in.
  - **Leave types, working hours, attendance rules** — the rules of the company.
  - **Pay & Compliance** — salary parts, pay groups, schedules, legal entities,
    tax packs, payslip design.
  - **Integrations** — connect email, file storage, webhooks.
  - **Billing** — the company's own subscription plan and invoices for using EMS.
  - **Email templates, notifications, audit log.**
- **Why we have it:** Every company is different. Settings is where you **tune the
  system to fit your company** without code.
- **Who:** Mostly **HR Admin**; the sensitive parts (billing, integrations,
  security) are **Super Admin only.**

---

## 5. The extra modules (below the line in the menu)

These four are newer feature areas, grouped separately at the bottom:

### 5.1 Recruitment 🧑‍💼 — "the hiring board"

- **What:** A board to track job candidates as they move through stages (Applied →
  Interview → Offer → Hired), like a to-do board.
- **Why:** To organize hiring instead of losing CVs in email.
- **Who:** HR Admin / Super Admin.

### 5.2 Performance ⭐ — "report cards for employees"

- **What:** Track goals, reviews, and ratings for each employee.
- **Why:** So managers and HR can fairly measure and grow people.
- **Who:** Managers (their team) and HR.

### 5.3 Assets 📦 — "company property tracker"

- **What:** Tracks **company items** given to employees — laptops, phones, ID
  cards — and who has what.
- **Why:** So nothing gets lost, and items come back when someone leaves.
- **Who:** HR Admin / Super Admin.

### 5.4 Announcements 📣 — "the company noticeboard"

- **What:** A place to post company-wide messages everyone sees.
- **Why:** One official channel for news, instead of scattered messages.
- **Who:** HR posts; everyone reads.

---

## 6. The two things working in the background (mention if asked)

1. **Notifications 🔔** — A bell at the top tells you when something needs you ("3
   leave requests waiting"). So you don't miss things.
2. **Search 🔍** — A search box at the top to instantly find any employee,
   department, etc.

---

## 7. Putting it together — three quick example journeys

Tell these as **stories** — clients remember stories, not feature lists.

**Story A — Priya the Employee wants a day off:**

1. Priya logs in → lands on her **Dashboard**.
2. Goes to **Leave** → sees she has 8 days left → requests Friday off.
3. Her manager gets a **notification**, opens **Leave**, clicks **Approve**.
4. Done. Payroll will automatically know not to dock her pay.

**Story B — Aman the Manager starts his day:**

1. Aman logs in → **Dashboard** shows his team and "2 approvals pending."
2. He opens **Timesheets**, reviews his team's submitted hours, approves them.
3. He checks **Attendance** to see who's in today.

**Story C — HR runs the month's payroll:**

1. HR logs in → opens **Payroll**.
2. Starts a new run → system **calculates** every salary using the configured
   rules.
3. HR **reviews** it, makes any one-off adjustments, then **approves** → marked
   **Paid.**
4. Every employee can now open **My Payslips** and download theirs.

---

## 8. One-sentence summary to close the meeting

> _"EMS is one secure home for your whole company's people-operations — hiring,
> directory, attendance, time, leave, payroll, performance, and reporting — and
> every person sees exactly what their role allows, nothing more."_
