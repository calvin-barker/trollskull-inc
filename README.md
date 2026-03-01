# Trollskull Inc.

A local web app for managing Trollskull Manor's business operations during a *Waterdeep: Dragon Heist* D&D campaign. Displayed on a shared screen at the table — no deployment, no auth.

## Setup

```sh
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Commands

```sh
make dev          # Start dev server
make test         # Run tests
make test-watch   # Tests in watch mode (for TDD)
make check        # Type-check
make build        # Production build
make backup       # Back up the database
make clean        # Reset database (re-created on next dev start)
```

## What it does

Tracks finances, equity, loans, assets, and hospitality for a player-run tavern using in-game Forgotten Realms dates.

| Page | Purpose |
|------|---------|
| Dashboard | Current date, cash balance, advance time, recent activity |
| Ledger | Full transaction log with filters |
| Reports | P&L with depreciation and interest memos |
| Equity | Shareholders, ownership %, NAV, dividends |
| Loans | Amortization schedules, payment recording |
| Assets | Capital asset register with straight-line depreciation |
| Hospitality | Rooms, bookings, checkout, events |
