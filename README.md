# Sinking Funds Manager

A demo SvelteKit application that implements the full product specification for managing sinking funds. It uses Skeleton UI for styling and Prisma ORM with a SQLite database.

## Setup

1. Copy `.env.example` to `.env` if needed to configure the `DATABASE_URL`.
2. Install dependencies and initialize the database:

```sh
npm install
npx prisma db push
```

3. Start the development server:

```sh
npm run dev
```

## Features

- Landing dashboard showing total balance, top funds, and recent activity
- CRUD for funds with running balances and detailed per-fund views
- Archive funds once their balance reaches zero
- Record income and expense transactions against funds
- Transfer money between funds with double-entry bookkeeping
- Define allocation rules to split the monthly deposit
- Start a new period which applies the rules and logs an allocation run
- Close and reopen periods with audit trail entries
- Configure per-user settings for monthly deposit and overspend prevention
- Export and restore all core data as a JSON backup
- Download transactions as a CSV file for offline analysis
- Track fund "levels" based on saved balance and celebrate when targets are reached

Milestone progress is tracked in [status.md](status.md).
