# Trollskull Inc. — Operations Tool Design

**Date:** 2026-02-28
**Status:** Approved

## Context

The players in a *Waterdeep: Dragon Heist* campaign own and operate Trollskull Manor as a tavern and inn. Their finance-nerd tendencies will drive complex business dealings: equity splits, loans with interest, capital investments with depreciation, and hospitality revenue from room rentals and events. This tool manages all of it and is displayed on a shared screen at the table during sessions.

## Stack

- **SvelteKit** — full-stack framework, frontend and backend in one process
- **better-sqlite3** — server-side SQLite, all DB access in SvelteKit load functions and form actions
- **Tailwind CSS** — styling
- **SQLite file at `data/trollskull.db`** — committed to git after sessions as a save point

Single command: `npm run dev`. No auth, no deployment, local only.

## Calendar

The Forgotten Realms Calendar of Harptos is modeled as a **YYYY-MM-DD equivalent with 17 month-slots** — 12 regular months (30 days each) and 5 single-day festival "months" inserted between them:

| # | Name | Days |
|---|------|------|
| 01 | Hammer | 1–30 |
| 02 | Midwinter | 01 (festival) |
| 03 | Alturiak | 1–30 |
| 04 | Ches | 1–30 |
| 05 | Tarsakh | 1–30 |
| 06 | Greengrass | 01 (festival) |
| 07 | Mirtul | 1–30 |
| 08 | Kythorn | 1–30 |
| 09 | Flamerule | 1–30 |
| 10 | Midsummer | 01 (festival) |
| 11 | Eleasis | 1–30 |
| 12 | Eleint | 1–30 |
| 13 | Highharvestide | 01 (festival) |
| 14 | Marpenoth | 1–30 |
| 15 | Uktar | 1–30 |
| 16 | Feast of the Moon | 01 (festival) |
| 17 | Nightal | 1–30 |

Stored as `YYYY-MM-DD` strings (e.g. `1492-09-14` = 14 Flamerule, 1492 DR). Naturally sortable. Festival days are always day `01` of their slot. Campaign starts 1492 DR.

## Data Model

### `game_state`
Key/value store for global config: current in-game date, any campaign-wide settings.

```sql
CREATE TABLE game_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### `transactions`
Master ledger — every gold piece in or out. Single source of truth for cash.

```sql
CREATE TABLE transactions (
  id          INTEGER PRIMARY KEY,
  date_dr     TEXT    NOT NULL,  -- YYYY-MM-DD in FR calendar
  description TEXT    NOT NULL,
  amount      INTEGER NOT NULL,  -- positive = income, negative = expense (in gold pieces)
  category    TEXT    NOT NULL,
  booking_id  INTEGER REFERENCES bookings(id),
  loan_id     INTEGER REFERENCES loans(id),
  event_id    INTEGER REFERENCES events(id),
  notes       TEXT
);
```

### `shareholders`
Equity holders. Percentage computed at query time from total shares outstanding.

```sql
CREATE TABLE shareholders (
  id     INTEGER PRIMARY KEY,
  name   TEXT    NOT NULL,
  shares INTEGER NOT NULL DEFAULT 0
);
```

### `loans`
Loan records. Interest rate per in-game month (30-day period).

```sql
CREATE TABLE loans (
  id            INTEGER PRIMARY KEY,
  lender        TEXT    NOT NULL,
  principal     INTEGER NOT NULL,   -- gold pieces
  interest_rate REAL    NOT NULL,   -- monthly rate, e.g. 0.05 = 5%
  start_date    TEXT    NOT NULL,
  term_days     INTEGER NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'active'  -- active | paid
);

CREATE TABLE loan_payments (
  id                 INTEGER PRIMARY KEY,
  loan_id            INTEGER NOT NULL REFERENCES loans(id),
  transaction_id     INTEGER NOT NULL REFERENCES transactions(id),
  principal_portion  INTEGER NOT NULL,
  interest_portion   INTEGER NOT NULL
);
```

### `assets`
Capital investments. Straight-line depreciation computed at query time.

```sql
CREATE TABLE assets (
  id              INTEGER PRIMARY KEY,
  name            TEXT    NOT NULL,
  purchase_date   TEXT    NOT NULL,
  cost            INTEGER NOT NULL,   -- gold pieces
  useful_life_days INTEGER NOT NULL,
  salvage_value   INTEGER NOT NULL DEFAULT 0,
  description     TEXT
);
```

### `rooms`
Rentable rooms in the manor.

```sql
CREATE TABLE rooms (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  floor       INTEGER,
  rate        INTEGER NOT NULL,  -- gold pieces per night
  description TEXT
);
```

### `bookings`
Guest reservations. Checking out auto-posts an income transaction.

```sql
CREATE TABLE bookings (
  id         INTEGER PRIMARY KEY,
  room_id    INTEGER NOT NULL REFERENCES rooms(id),
  guest_name TEXT    NOT NULL,
  check_in   TEXT    NOT NULL,
  check_out  TEXT    NOT NULL,
  rate       INTEGER NOT NULL,  -- agreed rate (may differ from room default)
  paid       INTEGER NOT NULL DEFAULT 0,  -- boolean
  notes      TEXT
);
```

### `events`
Planned events at the tavern (tournaments, performances, private hire, etc.).

```sql
CREATE TABLE events (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  date_dr     TEXT    NOT NULL,
  revenue     INTEGER NOT NULL DEFAULT 0,
  cost        INTEGER NOT NULL DEFAULT 0,
  description TEXT
);
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | **Dashboard** — current date, cash balance, recent P&L sparkline, next 3 bookings, advance-date control |
| `/ledger` | Full transaction log, filterable by date range and category; new manual transaction form |
| `/reports` | P&L statement for a selected in-game date range: revenue by category, expenses, net income, depreciation memo, accrued loan interest memo |
| `/equity` | Shareholder table (%, computed net asset value), issue/transfer shares, record dividend distributions |
| `/loans` | Active and historical loans with expandable amortization schedules; new loan and payment forms |
| `/assets` | Capital asset register: cost, in-game age, accumulated depreciation, book value; new asset form |
| `/hospitality` | Rooms with occupancy status, bookings list, check-in/check-out actions (auto-post to ledger), event management |

## Error Handling & Data Integrity

- **Hard constraints** enforced at the database layer: no overlapping bookings for the same room, loan payments cannot exceed outstanding principal, share transfers cannot exceed shares held. Violations surface as inline form errors.
- **Overdraft warnings** shown on the dashboard when cash balance is negative, but transactions are not blocked.
- **No undo** — git commits of `data/trollskull.db` after sessions serve as save points.
- **No automated test suite** — TypeScript types on SvelteKit load functions and form actions provide sufficient safety for a local tool of this scope.
