# Trollskull Inc.

A local web app for managing Trollskull Manor's business operations during a *Waterdeep: Dragon Heist* D&D campaign. Displayed on a shared screen at the table — no deployment, no auth.

## Setup

```sh
make install      # Install dependencies + Playwright browsers
make dev          # Start dev server at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173). The database is created automatically on first run.

To start with sample data, visit **Settings** and click **Generate Sample Data**.

## Commands

```sh
make dev          # Start dev server
make test         # Run unit tests
make test-e2e     # Run end-to-end tests (Playwright)
make test-all     # Run unit tests, type-check, and e2e tests
make test-watch   # Unit tests in watch mode (for TDD)
make check        # Type-check
make build        # Production build
make backup       # Back up the database
make clean        # Reset database (re-created on next dev start)
```

## Pages

| Page | Purpose |
|------|---------|
| Dashboard | Current date, cash balance, advance time, recent activity |
| Ledger | Full transaction log with filters |
| Reports | P&L with depreciation and interest memos |
| Equity | Shareholders, ownership %, NAV, dividends |
| Loans | Amortization schedules, payment recording |
| Balances | Assets and liabilities overview |
| Hospitality | Rooms, bookings, checkout, events |
| Workforce | Staff roster (hire, pay, dismiss) and faction job board |
| Settings | Seed sample data, clear all data |

## Tech

SvelteKit 2 (Svelte 5), TypeScript, Tailwind CSS v4, better-sqlite3. All data lives in `data/trollskull.db` (SQLite). Dates use the Forgotten Realms (Harptos) calendar.
