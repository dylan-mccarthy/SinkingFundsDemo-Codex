# Sinking Funds Manager

Prototype SvelteKit application implementing features from the product specification. It uses Skeleton UI for styling and Prisma ORM with a SQLite database.

## Getting Started

```sh
npm install
npx prisma db push
npm run dev
```

## Current Features

- Create and list funds with running balances
- View individual fund details with recent transaction history
- Record expense and income transactions against funds
- Transfer money between funds with double-entry bookkeeping
- Define allocation rules for distributing the monthly deposit
- Start a new period which allocates the monthly deposit according to rules
- Close and reopen periods with audit log entries

More capabilities such as reports and advanced settings will be built in future milestones.
