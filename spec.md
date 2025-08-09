# Sinking Funds Manager – Product & Tech Specification

**Stack:** SvelteKit • Skeleton UI • Prisma ORM • SQLite (file-based)

**Audience:** solo household finance users (initially single-user), later multi-user shared households.

**Primary Goal:** Allow a monthly deposit to be split across multiple sinking funds; track spend and remaining balances; roll over unspent balances into the next month; support transfers between funds; keep the UI friendly, clean, and fast.

---

## 1) Product Overview

### 1.1 Problem & Outcome

* **Problem:** Spreadsheets become messy when funds roll over, allocations change, or money needs to be moved between funds.
* **Outcome:** Simple web app that automates monthly allocations/rollovers and gives at-a-glance visibility into each fund’s balance and activity.

### 1.2 Core Concepts

* **Fund:** A named envelope with a running balance (e.g., Car Maintenance, Gifts, Travel).
* **Monthly Deposit:** A recurring amount split across funds by rules (percentages or fixed amounts with optional priority waterfall).
* **Transaction:** Any activity affecting a fund: **Expense**, **Income** (manual top-up), or **Transfer** (between funds).
* **Period (Month):** Accounting boundary (e.g., August 2025). End-of-month rolls balances forward; start-of-month runs deposit allocation.

### 1.3 Non-Goals (v1)

* Bank connections/auto-import from financial institutions.
* Multi-currency and complex exchange handling.
* Mobile apps (use responsive web in v1; native wrappers later if desired).

---

## 2) Functional Requirements

### 2.1 Funds

* Create, edit, archive funds.
* Attributes: name, description, color/icon, active flag, **target balance** (optional), **min reserve** (optional), **category** (optional), **order** for display.
* Prevent deleting funds with non-zero balance (archive instead), or force a zeroing transfer.

### 2.2 Allocations (Monthly Split Rules)

* Global **Monthly Deposit** amount defined in Settings.
* Allocation strategies per fund:

  1. **Percentage** of the monthly deposit
  2. **Fixed amount** (cap at target balance if set)
  3. **Priority waterfall**: apply fixed amounts in priority order until deposit is exhausted, then percentages for the remainder (optional hybrid).
* Allocation preview page shows expected distribution for next month.
* Changes to allocation rules take effect next month (unless the user runs a manual re-allocation for current month and confirms).

### 2.3 Transactions

* Types: **Expense**, **Income**, **Transfer**.
* Fields: date, fund, amount (positive), merchant/payee (optional), note, tags, attachment (receipt image/file – v1 optional), createdBy.
* **Transfer** is double-entry: fromFund (credit), toFund (debit), same date/time, single user action.
* Validation: cannot spend past current fund balance **if overspend prevention is enabled** (toggle in Settings). If disabled, allow negative balance but warn.
* Backdating allowed inside an open or past month; changing a past month after close triggers re-open warning (see Period Management).

### 2.4 Period (Month) Management

* **Start-of-month job** (manual or scheduled):

  * Creates the new Period record.
  * **Auto-rollover:** carry each fund’s ending balance to next month’s starting balance.
  * **Auto-deposit allocation:** split the monthly deposit into Allocation Transactions according to rules.
* **End-of-month close:** lock the period to prevent accidental changes; can be re-opened with confirmation and a reason (audit logged).
* Idempotency: Rerunning start-of-month for the same period should not duplicate allocations (detect and no-op).

### 2.5 Reporting & Views

* Dashboard: total funds balance, deposit progress bar, largest funds, burn rate per fund.
* Fund details: running balance, transactions list, monthly trend sparkline, % to target.
* Transactions list: filters by date range, fund, type, tag; CSV export.
* Allocation report: see how the monthly deposit was split and what changed since last month.

### 2.6 Settings

* Household currency (default AUD), number formatting, timezone (default **Australia/Melbourne**).
* Monthly deposit amount & cycle day (default 1st of month); **manual trigger** for off-cycle pay periods.
* Overspend prevention (on/off), rounding mode for allocations (banker’s rounding; last fund gets remainder).
* Backups: export/import JSON of core data (funds, allocations, transactions, periods).

### 2.7 Users & Auth (v1 minimal)

* Single user local auth (email + password or passkey via WebAuthn).
* Optional later: multi-user with roles (Owner, Editor, Viewer) and household sharing.

### 2.8 Auditability

* System-created allocation entries marked as such and linked to a Period.
* Re-opens and edits of closed periods require a reason; capture in an audit log table.

---

## 3) Business Rules & Calculations

### 3.1 Balance Formula (per Fund, per Period)

* **Start Balance** (carried from prior period end) + **Income** + **Allocated Deposit** + **Incoming Transfers** − **Expenses** − **Outgoing Transfers** = **End Balance**.
* Current fund balance is the end balance of the latest **open** or **current** period plus any in-period transactions.

### 3.2 Allocation Engine

* Compute per-fund allocation according to rules, applying caps (target) and min reserves when relevant.
* Handle decimals by rounding to cents; push any remainder to a designated **Remainder Fund** or the highest-priority fund.
* If total fixed allocations > monthly deposit, warn and require a change or automatically scale fixed amounts proportionally (user setting).

### 3.3 Transfers

* Create paired leg entries atomically; never allow a half-transfer state.
* Disallow same-fund transfers.

### 3.4 Period Edits

* If user edits a transaction in a **closed** period, app prompts to re-open period (audit). Recalculate derived balances for that and subsequent periods.

---

## 4) Data Model (Prisma)

```prisma
// schema.prisma
Datasource db {
  provider = "sqlite"
  url      = "file:./sinkingfunds.db"
}

Generator client {
  provider = "prisma-client-js"
}

enum TransactionType {
  EXPENSE
  INCOME
  TRANSFER_OUT
  TRANSFER_IN
  ALLOCATION
}

enum PeriodStatus {
  OPEN
  CLOSED
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  passwordHash String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // Future: household sharing
}

model Fund {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  description String?
  color       String?  // hex
  icon        String?  // e.g., lucide icon name
  active      Boolean  @default(true)
  targetCents Int?     // optional cap/goal
  minReserveCents Int? // optional floor
  displayOrder Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  allocationRules AllocationRule[]
  transactions   Transaction[]
}

model Period {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  year        Int
  month       Int      // 1–12
  status      PeriodStatus @default(OPEN)
  startedAt   DateTime
  closedAt    DateTime?
  notes       String?

  allocations AllocationRun[]

  @@unique([userId, year, month])
}

model AllocationRule {
  id          String  @id @default(cuid())
  userId      String
  user        User    @relation(fields: [userId], references: [id])
  fundId      String
  fund        Fund    @relation(fields: [fundId], references: [id])
  mode        String  // "PERCENT", "FIXED", "PRIORITY"
  percentBp   Int?    // basis points for percentage (e.g., 1250 = 12.50%)
  fixedCents  Int?
  priority    Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AllocationRun {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  periodId    String
  period      Period   @relation(fields: [periodId], references: [id])
  depositCents Int
  executedAt  DateTime @default(now())
  hash        String   // idempotency key for reruns

  lines       AllocationLine[]
}

model AllocationLine {
  id          String   @id @default(cuid())
  allocationRunId String
  allocationRun  AllocationRun @relation(fields: [allocationRunId], references: [id])
  fundId      String
  fund        Fund     @relation(fields: [fundId], references: [id])
  amountCents Int
}

model Transaction {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  periodId    String?
  period      Period?  @relation(fields: [periodId], references: [id])
  fundId      String?
  fund        Fund?    @relation(fields: [fundId], references: [id])
  type        TransactionType
  amountCents Int      // positive integer cents
  date        DateTime
  payee       String?
  note        String?
  tags        String[]
  // Transfer pairing
  transferGroupId String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, date])
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  action      String
  context     String?
  createdAt   DateTime @default(now())
}
```

**Notes:**

* `Transaction.type = ALLOCATION` for system-created allocations; linked to `AllocationRun` via `note`/`context` or add a join table if needed.
* Balances are computed on the fly or cached via materialized views in future versions if performance requires.

---

## 5) API & Server (SvelteKit Endpoints)

**Auth**

* `POST /api/auth/signup` – create user
* `POST /api/auth/login` – session cookie/JWT
* `POST /api/auth/logout`

**Funds**

* `GET /api/funds` – list
* `POST /api/funds` – create
* `PATCH /api/funds/:id` – edit/archive
* `DELETE /api/funds/:id` – delete (only if zero)

**Allocations**

* `GET /api/allocations/rules` – list
* `POST /api/allocations/rules` – upsert rule
* `POST /api/allocations/preview?month=YYYY-MM` – run preview (no writes)

**Periods**

* `POST /api/periods/start?month=YYYY-MM` – idempotent start-of-month; creates allocations & rollover
* `POST /api/periods/:id/close` – close
* `POST /api/periods/:id/reopen` – reopen with reason
* `GET /api/periods/:id/summary` – balances

**Transactions**

* `GET /api/transactions` – filters: date range, fund, type
* `POST /api/transactions` – create expense/income
* `POST /api/transactions/transfer` – atomic double-entry
* `PATCH /api/transactions/:id` – edit
* `DELETE /api/transactions/:id` – delete (with period recalculation if needed)

**Backups**

* `GET /api/export` – JSON
* `POST /api/import` – JSON (validates in dry-run first)

---

## 6) Period & Allocation Algorithms (Pseudocode)

### 6.1 Start of Month

```text
function startMonth(userId, year, month, depositCents):
  if Period(userId, year, month) exists:
    return existing (idempotent)

  prev = previous Period (if any)
  create Period OPEN(year, month)

  // Rollover
  for each fund in user funds:
    startBal = (prev ? prev.endBalance(fund) : 0)
    if startBal != 0:
      create Transaction(type=INCOME, fund=fund, amount=startBal, note="Rollover", period=current)

  // Allocation
  lines = computeAllocationLines(userId, depositCents)
  run = create AllocationRun(period=current, depositCents, hash=sha(...))
  for each line in lines:
    create AllocationLine(run, fund, amount)
    create Transaction(type=ALLOCATION, fund=fund, amount=amount, period=current)
```

### 6.2 Transfer

```text
function transfer(userId, fromFund, toFund, amount, date, note):
  assert fromFund != toFund
  begin txn
    create Transaction(type=TRANSFER_OUT, fund=fromFund, amount, date, transferGroupId=gid)
    create Transaction(type=TRANSFER_IN,  fund=toFund,   amount, date, transferGroupId=gid)
  commit
```

### 6.3 Balances

```text
function balance(fund, period):
  sum(INCOME + ALLOCATION + TRANSFER_IN) - sum(EXPENSE + TRANSFER_OUT)
```

---

## 7) UI/UX Specification (Skeleton + Tailwind-like utilities)

### 7.1 Design Principles

* **Calm, clear, compact:** essential info above the fold.
* **Rounded, modern UI:** cards with `rounded-2xl`, soft shadows, generous spacing.
* **Accessible:** color contrast, keyboard-friendly, ARIA labels, focus states.
* **Responsive:** mobile-first; grid-based layouts for desktop.

### 7.2 Global Layout

* **Top App Bar:** app name, month selector (left/right chevrons + dropdown), quick actions (Add Transaction, Transfer, Start Month, Close Month), user menu.
* **Sidebar (collapsible):** Dashboard, Funds, Transactions, Allocations, Reports, Settings.
* **Content Area:** cards and tables; sticky subheader with current period info.

### 7.3 Components

* **Fund Card:** name + color/icon; current balance; chip for % to target; tiny sparkline. Click opens Fund Details.
* **Allocation Editor:** table with rows per fund; columns: Mode (select), % / Fixed, Priority, Target, Preview Amount (for next month). Save validates conflicts.
* **Transactions Table:** virtualized list, inline edit; filters across top; pill tags; bulk CSV export.
* **Transfer Dialog:** dual fund picker, amount, date, note; live validation (no same fund).
* **Start Month Wizard:** review rollover totals and allocation preview; confirm to execute.
* **Close/Reopen Dialogs:** require confirmation and optional notes.

### 7.4 Dashboard Layout (Desktop)

* **Row 1:**

  * Card: **Total Balance** & **This Month’s Deposit** (progress bar of allocations applied)
  * Card: **Largest Funds** (top 5 list)
  * Card: **Burn Rate** (expenses vs income this month)
* **Row 2:**

  * Grid of **Fund Cards** (wrap)
* **Row 3:**

  * **Recent Activity** table

**Mobile:** single-column; action FAB bottom-right for Add Transaction/Transfer.

### 7.5 Styling with Skeleton

* Use Skeleton’s **Card**, **Button**, **Input**, **Select**, **Chip**, **Modal**, **Toast**.
* **Radiuses:** 1rem–1.25rem (rounded-xl/2xl).
* **Spacing:** content padding ≥ 16px; card gap ≥ 12px.
* **Icons:** lucide-svelte (consistent stroke width).
* **Feedback:** toast on success/error; inline validation messages.

### 7.6 Empty/Loading/Errors

* Empty states with illustrations and short guidance (e.g., “Create your first fund”).
* Skeleton loaders on cards and tables.
* Clear error banners with retry and “Report Issue” mailto.

---

## 8) Development Plan & Milestones

**M0 – Project Setup (0.5–1 day)**

* SvelteKit app, Skeleton UI, Prisma + SQLite.
* Auth scaffolding (local email/password, bcrypt). Env config, linting, Prettier, Vitest/Playwright.

**M1 – Data Model & CRUD (1–2 days)**

* Prisma schema + migrations. Funds CRUD. Basic Transactions CRUD (expense/income only). Dashboard stub.

**M2 – Period Engine (2–3 days)**

* Period model + Start-of-month (rollover + allocation) idempotent implementation.
* Allocation Rules UI + Preview. Allocation execution writes ALLOCATION transactions.

**M3 – Transfers & Balances (1–2 days)**

* Transfer API (double-entry). Accurate balance calculations. Fund details page with history and sparkline.

**M4 – Close/Reopen & Audit (1 day)**

* Period closing, reopen with audit log. Recalc pipeline for edited past periods.

**M5 – Reporting & Export (1 day)**

* Transactions filters, CSV export, Allocation report.

**M6 – Polish & Accessibility (1–2 days)**

* Responsive tuning, keyboard nav, empty states, error handling, toasts, confirmations.

**M7 – Optional Enhancements**

* Import JSON, attachments (receipts), passkeys, PWA offline mode, multi-user households, bank CSV import.

---

## 9) Implementation Notes

### 9.1 Directory Structure (SvelteKit)

```
src/
  lib/components/
  lib/stores/
  lib/server/
  routes/
    +layout.svelte
    +layout.server.ts
    +page.svelte (Dashboard)
    funds/
      +page.svelte
      +page.server.ts
    transactions/
      +page.svelte
    allocations/
      +page.svelte
    settings/
      +page.svelte
    api/
      funds/+server.ts
      transactions/+server.ts
      allocations/preview/+server.ts
      periods/start/+server.ts
```

### 9.2 Time & Currency

* Use `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`.
* Store cents as integers; display as dollars.
* Default timezone `Australia/Melbourne`; month boundaries based on that tz.

### 9.3 Rounding Strategy

* Round each fund’s allocation to cents; accumulate remainder and assign to a configured **Remainder Fund** (or the highest priority fund).

### 9.4 Idempotency

* `AllocationRun.hash = sha256(userId + period + deposit + rulesetVersion)` prevents duplicates.
* `POST /periods/start` returns existing run if hash matches.

### 9.5 Security

* Session cookies `HttpOnly`, `Secure`, `SameSite=Lax`.
* Rate-limit auth endpoints; hash passwords with bcrypt.
* CSRF protection on POST forms.

### 9.6 Testing

* Unit: allocation calculations, transfer pairing, period close/reopen.
* Integration: start-of-month idempotency, editing past period reflows balances.
* E2E (Playwright): create funds → start month → add expense → transfer → report.

### 9.7 Deployment

* Dev: SQLite file in `./data/sinkingfunds.db` (gitignored).
* Prod: SvelteKit adapter-node or adapter-vercel; mount persistent volume for SQLite. Nightly JSON export to `/backups`.

---

## 10) Acceptance Criteria (v1)

* Create ≥1 fund; set monthly deposit; define allocation rules; run **Start Month**.
* App creates a Period with rollover (0 if first month) and ALLOCATION transactions totaling the deposit.
* Adding expenses reduces the correct fund balance; transfers move money atomically.
* End-of-month close locks, reopen requires reason and recalculates balances.
* Dashboard shows accurate totals; transactions can be filtered and exported.

---

## 11) Future Roadmap Ideas

* Goal tracking (ETA to reach target given allocation rate).
* Notifications (e.g., “Gifts fund will hit target next month”).
* Bank CSV import with rules engine for auto-categorisation.
* Multi-currency and currency hedging per fund.
* Household sharing with per-user permissions.
# Sinking Funds Manager – Product & Tech Specification

**Stack:** SvelteKit • Skeleton UI • Prisma ORM • SQLite

---

## 1) Purpose & Overview

The application is designed to help users **track spending** and provide **clear visibility** into where money goes each month, enabling better control over spending habits. The “sinking” aspect of the funds rewards underspending by allowing unspent balances to roll over, building up a cumulative amount that can be used in future months.

To encourage consistent use, the UI incorporates **gamification elements** such as progress achievements, streak rewards for logging transactions, and celebratory animations when targets are met or savings grow.

### Key Features

* Define multiple sinking funds with names, colors, icons, and optional targets.
* Set a global monthly deposit amount.
* Allocate deposits to funds by fixed amounts, percentages, or priority rules.
* Track transactions (expenses, incomes, transfers) against funds.
* Rollover remaining balances each month to reward underspending.
* Transfer between funds for flexibility.
* Lock/unlock monthly periods to prevent accidental changes.
* **Gamification:** badges for hitting savings milestones, streak counters for regular use, and level-up indicators for funds as they grow.

---

## 2) Functional Requirements

**Funds**

* CRUD operations, archive instead of delete when non-zero.
* Optional target and minimum reserve values.

**Allocations**

* Rules per fund: fixed, percent, or priority.
* Allocation preview for upcoming month.

**Transactions**

* Expense, Income, Transfer types.
* Transfer is atomic double-entry.
* Optional overspend prevention.

**Periods**

* Start-of-month job: rollover + allocations.
* End-of-month close and optional reopen with audit log.

**Reporting**

* Dashboard showing total balance, fund list, top funds, and recent transactions.
* Fund detail view with balance history to track spending patterns.
* CSV export for offline analysis.

**Settings**

* Currency (AUD default), timezone (Australia/Melbourne), monthly deposit day, overspend prevention.

**Gamification Features**

* **Savings Streaks:** consecutive months without overspending in a fund.
* **Achievement Badges:** hitting percentage-of-target milestones or savings goals.
* **Fund Level System:** funds “level up” as balances grow over time.
* **Visual Celebrations:** confetti or animations when major goals are achieved.

---

## 3) Data Model (Prisma)

```prisma
Datasource db { provider = "sqlite"; url = "file:./sinkingfunds.db" }
Generator client { provider = "prisma-client-js" }

enum TransactionType { EXPENSE INCOME TRANSFER_OUT TRANSFER_IN ALLOCATION }
enum PeriodStatus { OPEN CLOSED }

model User { id String @id @default(cuid()); email String @unique; passwordHash String; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model Fund { id String @id @default(cuid()); userId String; name String; description String?; color String?; icon String?; active Boolean @default(true); targetCents Int?; minReserveCents Int?; displayOrder Int @default(0); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model Period { id String @id @default(cuid()); userId String; year Int; month Int; status PeriodStatus @default(OPEN); startedAt DateTime; closedAt DateTime?; @@unique([userId, year, month]) }
model AllocationRule { id String @id @default(cuid()); userId String; fundId String; mode String; percentBp Int?; fixedCents Int?; priority Int @default(0); active Boolean @default(true); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model AllocationRun { id String @id @default(cuid()); userId String; periodId String; depositCents Int; executedAt DateTime @default(now()); hash String }
model AllocationLine { id String @id @default(cuid()); allocationRunId String; fundId String; amountCents Int }
model Transaction { id String @id @default(cuid()); userId String; periodId String?; fundId String?; type TransactionType; amountCents Int; date DateTime; payee String?; note String?; tags String[]; transferGroupId String?; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model AuditLog { id String @id @default(cuid()); userId String; action String; context String?; createdAt DateTime @default(now()) }
```

---

## 4) Algorithms

**Start of Month**

1. Create/open period.
2. Rollover balances to reward underspending.
3. Allocate deposit based on rules.

**Transfer**

* Create paired in/out transactions with same `transferGroupId`.

**Balance**

```
Start + ALLOCATION + INCOME + TRANSFER_IN - EXPENSE - TRANSFER_OUT
```

---

## 5) API Endpoints

* Auth: signup, login, logout.
* Funds: list, create, edit, archive/delete.
* Allocations: rules CRUD, preview.
* Periods: start, close, reopen.
* Transactions: list, add, transfer, edit, delete.
* Backup: export/import JSON.

---

## 6) UI/UX

**Top Bar:** month selector, quick actions, user menu.
**Sidebar:** dashboard, funds, transactions, allocations, reports, settings.
**Dashboard:** cards for total balance, deposit progress, top funds, recent activity, and spending vs. saving trends. Includes **gamification panel** showing active streaks, earned badges, and fund levels.
**Fund Cards:** balance, % to target, trend sparkline showing cumulative growth, current level, and progress toward next badge.
**Allocation Editor:** mode, value, priority, target, preview.
**Transactions List:** filters, CSV export, inline edit.
**Gamification UI:**

* Badge display with hover tooltips showing criteria.
* Progress bars for streaks.
* Level meter for each fund.
  **Styling:** rounded-2xl, soft shadows, accessible color contrast, celebratory animations.

---

## 7) Milestones

* **M0:** Project setup.
* **M1:** Funds & Transactions CRUD.
* **M2:** Period start (rollover + allocations), Allocation Editor.
* **M3:** Transfers, balances, fund detail.
* **M4:** Close/reopen period, audit log, CSV export.
* **M5:** UI polish, accessibility, gamification layer.

---

## 8) Acceptance Criteria

* Funds and allocation rules can be defined.
* Start Month runs rollover + allocations.
* Expenses and transfers adjust balances correctly.
* Periods can be closed/reopened with audit.
* Dashboard provides visibility of spending patterns and cumulative growth.
* Gamification features (streaks, badges, levels) update in real-time as criteria are met.
