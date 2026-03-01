CREATE TABLE IF NOT EXISTS game_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date_dr     TEXT    NOT NULL,
  description TEXT    NOT NULL,
  amount      INTEGER NOT NULL,  -- positive = income, negative = expense (gold pieces)
  category    TEXT    NOT NULL,
  person      TEXT,
  booking_id  INTEGER REFERENCES bookings(id),
  loan_id     INTEGER REFERENCES loans(id),
  event_id    INTEGER REFERENCES events(id),
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS shareholders (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT    NOT NULL UNIQUE,
  shares INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loans (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lender        TEXT    NOT NULL,
  principal     INTEGER NOT NULL,
  interest_rate REAL    NOT NULL,  -- monthly rate, e.g. 0.05 = 5% per 30-day period
  start_date    TEXT    NOT NULL,  -- YYYY-MM-DD (FR calendar)
  term_days     INTEGER NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS loan_payments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id           INTEGER NOT NULL REFERENCES loans(id),
  transaction_id    INTEGER NOT NULL REFERENCES transactions(id),
  principal_portion INTEGER NOT NULL,
  interest_portion  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  purchase_date    TEXT    NOT NULL,  -- YYYY-MM-DD (FR calendar)
  cost             INTEGER NOT NULL,
  useful_life_days INTEGER NOT NULL,
  salvage_value    INTEGER NOT NULL DEFAULT 0,
  description      TEXT
);

CREATE TABLE IF NOT EXISTS rooms (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  floor       INTEGER,
  rate        INTEGER NOT NULL,  -- gold pieces per night
  description TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id    INTEGER NOT NULL REFERENCES rooms(id),
  guest_name TEXT    NOT NULL,
  check_in   TEXT    NOT NULL,  -- YYYY-MM-DD (FR calendar)
  check_out  TEXT    NOT NULL,
  rate       INTEGER NOT NULL,
  paid       INTEGER NOT NULL DEFAULT 0,
  notes      TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  date_dr     TEXT    NOT NULL,  -- YYYY-MM-DD (FR calendar)
  revenue     INTEGER NOT NULL DEFAULT 0,
  cost        INTEGER NOT NULL DEFAULT 0,
  description TEXT
);

-- Seed initial state (idempotent)
INSERT OR IGNORE INTO game_state (key, value) VALUES ('current_date', '1492-01-01');
INSERT OR IGNORE INTO game_state (key, value) VALUES ('full_moon_date', '1492-01-01');
