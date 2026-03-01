# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Trollskull Inc.** — a local web app for managing Trollskull Manor's business operations during a *Waterdeep: Dragon Heist* D&D campaign. Displayed on a shared screen at the table. No deployment, no auth — purely local.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm test             # Run unit tests once (vitest run)
npm run test:watch   # Unit tests in watch mode (vitest)
npm run test:e2e     # Run e2e tests (Playwright + Chromium)
npm run check        # Type-check (svelte-check + tsc)
npm run build        # Production build
make test-all        # Unit tests + type-check + e2e tests
make install         # Install deps + Playwright browsers
```

Verify with `npm test && npm run check` before committing. Run `npm run test:e2e` to validate UI behavior. Use TDD: write a failing test first, then implement.

## Tech Stack

- **SvelteKit 2** (Svelte 5) — full-stack, file-based routing
- **TypeScript** — strict mode
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin, no config file
- **better-sqlite3** — server-side only, SQLite at `data/trollskull.db`
- **Playwright** — e2e tests in `e2e/` directory, Chromium only

## Architecture

All database access is server-side via SvelteKit load functions and form actions in `+page.server.ts` files. No API layer. The client receives rendered HTML + Svelte reactivity.

### Key modules

- `src/lib/server/db.ts` — SQLite singleton (WAL mode, foreign keys ON). Runs `schema.sql` on startup.
- `src/lib/server/schema.sql` — 11 tables: `game_state`, `transactions`, `shareholders`, `loans`, `loan_payments`, `assets`, `rooms`, `bookings`, `events`, `staff`, `faction_postings`
- `src/lib/calendar.ts` — Forgotten Realms (Harptos) calendar utilities. Dates stored as `YYYY-MM-DD` with months 01–17 (12 regular months + 5 festival days). `formatDateDR()`, `advanceDate()`, `daysBetween()`.
- `src/lib/finance.ts` — Pure financial computation functions: `buildAmortization()`, `computeDepreciation()`, `computeOutstandingDebt()`, `distributeDividend()`, `computePeriodDepreciation()`, `computeAccruedInterest()`. Shared types: `Loan`, `Payment`, `Asset`, `Shareholder`.
- `src/lib/moon.ts` — Selûne 30-day moon cycle. `getMoonPhase()` returns phase + emoji on 8 exact days per cycle, `null` otherwise.

### Routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — current date, cash balance, advance date, recent transactions, upcoming bookings |
| `/ledger` | Full transaction log with filters, add transaction form |
| `/reports` | P&L for selected date range with depreciation and interest memos |
| `/equity` | Shareholders, ownership %, NAV, transfers, dividends |
| `/loans` | Loan management with amortization, payment recording |
| `/assets` | Capital asset register with straight-line depreciation |
| `/balances` | Assets and liabilities overview |
| `/hospitality` | Rooms, bookings (with overlap check), checkout, events |
| `/workforce` | Staff roster (hire, pay, dismiss) and faction job board |
| `/settings` | Seed sample data, clear all data |

### Data flow

- **Transactions table is the single source of truth** for cash. All financial actions (checkout, loan receipt, dividend, asset purchase) post entries here.
- Amounts: positive = income, negative = expense. All in gold pieces.
- Computed values (depreciation, equity %, accrued interest) are calculated at query time, never stored.

## Campaign Reference

`docs/` contains D&D source PDFs (deed, chapter text, business options) and tactical grid maps split into `dm-rooms/` (with hidden markers) and `player-rooms/` (safe to share at the table).

## Worktrees

Project-local worktrees go in `.worktrees/` (gitignored).
