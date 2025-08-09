# Sinking Funds Manager

Prototype SvelteKit application implementing features from the product specification. It uses Skeleton UI for styling and Prisma ORM with a SQLite database.

## Getting Started

```sh
npm install
npx prisma db push
npm run dev
```

## Current Features

- Dashboard with total balance, largest funds and recent transactions
- Create and list funds with running balances
- View individual fund details with recent transaction history
- Archive funds once their balance reaches zero
- Record expense and income transactions against funds
- Transfer money between funds with double-entry bookkeeping
- Define allocation rules for distributing the monthly deposit
- Start a new period which allocates the monthly deposit according to rules
- Close and reopen periods with audit log entries
- Configure monthly deposit and overspend-prevention settings
- Export all core data as a JSON backup and restore from a previous export
- Download transactions as a CSV file for offline analysis
- Track fund "levels" based on saved balance and celebrate when targets are reached

More capabilities such as reports and advanced settings will be built in future milestones.
