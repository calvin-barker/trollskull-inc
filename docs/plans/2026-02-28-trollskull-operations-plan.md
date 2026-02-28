# Trollskull Inc. Operations Tool — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local SvelteKit web app for managing Trollskull Manor's business operations — P&L, equity, loans, capital assets, and hospitality — displayed on a shared screen during D&D sessions.

**Architecture:** SvelteKit with TypeScript handles both frontend and backend in one process. All database access is strictly server-side via `src/lib/server/`, using better-sqlite3. UI state is minimal — pages load fresh data from SQLite on each navigation.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS v4, better-sqlite3, SQLite

> **Note on TDD:** No automated test suite (per design). Verification steps use `npm run check` (svelte-check + tsc) and explicit browser checks. Treat these as your test assertions.

---

### Task 1: Scaffold SvelteKit Project

**Files:**
- Create: project root files via CLI

**Step 1: Scaffold the project in the repo root**

```bash
npx sv create . --template minimal --types ts --no-add-ons
```

When prompted whether to overwrite — yes. When asked about package manager — npm.

**Step 2: Install Tailwind CSS v4**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

**Step 3: Update `vite.config.ts` to add Tailwind plugin**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

**Step 4: Replace `src/app.css` with Tailwind import**

```css
@import 'tailwindcss';
```

**Step 5: Install better-sqlite3**

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

**Step 6: Create `data/` directory with a gitkeep, add db file to .gitignore**

```bash
mkdir -p data
touch data/.gitkeep
```

Add to `.gitignore`:
```
data/trollskull.db
data/trollskull.db-shm
data/trollskull.db-wal
```

**Step 7: Verify it runs**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:5173`, browser shows skeleton page with no errors.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit + Tailwind + better-sqlite3"
```

---

### Task 2: Database Schema and Singleton

**Files:**
- Create: `src/lib/server/schema.sql`
- Create: `src/lib/server/db.ts`

**Step 1: Create `src/lib/server/schema.sql`**

```sql
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
```

**Step 2: Create `src/lib/server/db.ts`**

```ts
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { join } from 'path';

mkdirSync('data', { recursive: true });

const db = new Database('data/trollskull.db');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(join(process.cwd(), 'src/lib/server/schema.sql'), 'utf-8');
db.exec(schema);

export default db;
```

**Step 3: Type-check**

```bash
npm run check
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/lib/server/
git commit -m "feat: add SQLite schema and db singleton"
```

---

### Task 3: FR Calendar Utilities

**Files:**
- Create: `src/lib/calendar.ts`

**Step 1: Create `src/lib/calendar.ts`**

```ts
export const FR_MONTHS = [
  { num: 1,  name: 'Hammer',         days: 30, festival: false },
  { num: 2,  name: 'Midwinter',      days: 1,  festival: true  },
  { num: 3,  name: 'Alturiak',       days: 30, festival: false },
  { num: 4,  name: 'Ches',           days: 30, festival: false },
  { num: 5,  name: 'Tarsakh',        days: 30, festival: false },
  { num: 6,  name: 'Greengrass',     days: 1,  festival: true  },
  { num: 7,  name: 'Mirtul',         days: 30, festival: false },
  { num: 8,  name: 'Kythorn',        days: 30, festival: false },
  { num: 9,  name: 'Flamerule',      days: 30, festival: false },
  { num: 10, name: 'Midsummer',      days: 1,  festival: true  },
  { num: 11, name: 'Eleasis',        days: 30, festival: false },
  { num: 12, name: 'Eleint',         days: 30, festival: false },
  { num: 13, name: 'Highharvestide', days: 1,  festival: true  },
  { num: 14, name: 'Marpenoth',      days: 30, festival: false },
  { num: 15, name: 'Uktar',          days: 30, festival: false },
  { num: 16, name: 'Feast of Moon',  days: 1,  festival: true  },
  { num: 17, name: 'Nightal',        days: 30, festival: false },
] as const;

const YEAR_DAYS = 365;
const BASE_YEAR = 1492;

/** Convert 'YYYY-MM-DD' (FR, MM = 01–17) to an absolute day count from 1492-01-01 */
function dateToAbsDay(dateDR: string): number {
  const [year, month, day] = dateDR.split('-').map(Number);
  const yearOffset = (year - BASE_YEAR) * YEAR_DAYS;
  let monthOffset = 0;
  for (let i = 0; i < month - 1; i++) {
    monthOffset += FR_MONTHS[i].days;
  }
  return yearOffset + monthOffset + (day - 1);
}

/** Convert absolute day count back to 'YYYY-MM-DD' (FR) */
function absDayToDate(absDay: number): string {
  const year = BASE_YEAR + Math.floor(absDay / YEAR_DAYS);
  let remaining = absDay % YEAR_DAYS;
  for (let i = 0; i < FR_MONTHS.length; i++) {
    if (remaining < FR_MONTHS[i].days) {
      const month = String(i + 1).padStart(2, '0');
      const day = String(remaining + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    remaining -= FR_MONTHS[i].days;
  }
  throw new Error(`Cannot convert absDay ${absDay} to FR date`);
}

/** Format 'YYYY-MM-DD' (FR) for display: "14 Flamerule, 1492 DR" */
export function formatDateDR(dateDR: string): string {
  const [year, month, day] = dateDR.split('-').map(Number);
  const m = FR_MONTHS[month - 1];
  if (m.festival) return `${m.name}, ${year} DR`;
  return `${day} ${m.name}, ${year} DR`;
}

/** Add `days` in-game days to a FR date string */
export function advanceDate(dateDR: string, days = 1): string {
  return absDayToDate(dateToAbsDay(dateDR) + days);
}

/** Count in-game days between two FR date strings (to - from) */
export function daysBetween(from: string, to: string): number {
  return dateToAbsDay(to) - dateToAbsDay(from);
}

/** Return true if `date` is between `from` and `to` (inclusive) */
export function dateBetween(date: string, from: string, to: string): boolean {
  const d = dateToAbsDay(date);
  return d >= dateToAbsDay(from) && d <= dateToAbsDay(to);
}

/** Return list of { label, value } for building date-picker selects */
export function monthOptions() {
  return FR_MONTHS.map(m => ({ label: m.name, value: String(m.num).padStart(2, '0') }));
}
```

**Step 2: Verify type-check passes**

```bash
npm run check
```

Expected: 0 errors.

**Step 3: Quick sanity check in the browser console** (after `npm run dev`)

Open browser console on any page and run:
```js
// Not available client-side directly — just verify formatDateDR logic by
// reading the source. Visual checks come in Task 5 when the dashboard renders.
```

**Step 4: Commit**

```bash
git add src/lib/calendar.ts
git commit -m "feat: add FR calendar utilities"
```

---

### Task 4: App Layout and Navigation

**Files:**
- Modify: `src/routes/+layout.svelte`
- Create: `src/routes/+layout.server.ts`

**Step 1: Create `src/routes/+layout.server.ts`** (loads current date for nav display)

```ts
import db from '$lib/server/db';
import { formatDateDR } from '$lib/calendar';

export function load() {
  const row = db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string };
  return {
    currentDate: row.value,
    currentDateFormatted: formatDateDR(row.value)
  };
}
```

**Step 2: Replace `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: any } = $props();

  const navLinks = [
    { href: '/',             label: 'Dashboard'    },
    { href: '/ledger',       label: 'Ledger'       },
    { href: '/reports',      label: 'Reports'      },
    { href: '/equity',       label: 'Equity'       },
    { href: '/loans',        label: 'Loans'        },
    { href: '/assets',       label: 'Assets'       },
    { href: '/hospitality',  label: 'Hospitality'  },
  ];
</script>

<div class="min-h-screen flex bg-stone-950 text-stone-100 font-sans">
  <!-- Sidebar -->
  <aside class="w-56 shrink-0 bg-stone-900 border-r border-stone-800 flex flex-col">
    <div class="p-4 border-b border-stone-800">
      <h1 class="text-lg font-bold text-amber-400 leading-tight">Trollskull Inc.</h1>
      <p class="text-xs text-stone-400 mt-1">{data.currentDateFormatted}</p>
    </div>
    <nav class="flex-1 p-2 space-y-1">
      {#each navLinks as link}
        <a
          href={link.href}
          class="block px-3 py-2 rounded text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-400 transition-colors"
        >
          {link.label}
        </a>
      {/each}
    </nav>
  </aside>

  <!-- Main content -->
  <main class="flex-1 overflow-auto p-6">
    {@render children()}
  </main>
</div>
```

**Step 3: Verify**

```bash
npm run check
```

Expected: 0 errors. In the browser, the sidebar shows with the date "1 Hammer, 1492 DR" and nav links.

**Step 4: Commit**

```bash
git add src/routes/+layout.svelte src/routes/+layout.server.ts
git commit -m "feat: add app layout and navigation sidebar"
```

---

### Task 5: Dashboard

**Files:**
- Modify: `src/routes/+page.svelte`
- Create: `src/routes/+page.server.ts`

**Step 1: Create `src/routes/+page.server.ts`**

```ts
import db from '$lib/server/db';
import { formatDateDR, advanceDate } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const dateRow = db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string };
  const currentDate = dateRow.value;

  const balance = (db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM transactions').get() as { total: number }).total;

  const recentTx = db.prepare(
    'SELECT * FROM transactions ORDER BY date_dr DESC, id DESC LIMIT 10'
  ).all() as { id: number; date_dr: string; description: string; amount: number; category: string }[];

  const upcomingBookings = db.prepare(`
    SELECT b.*, r.name as room_name
    FROM bookings b
    JOIN rooms r ON r.id = b.room_id
    WHERE b.check_in >= ? AND b.paid = 0
    ORDER BY b.check_in ASC
    LIMIT 3
  `).all(currentDate) as { id: number; guest_name: string; room_name: string; check_in: string; check_out: string; rate: number }[];

  return {
    currentDate,
    currentDateFormatted: formatDateDR(currentDate),
    balance,
    recentTx: recentTx.map(t => ({ ...t, dateFormatted: formatDateDR(t.date_dr) })),
    upcomingBookings: upcomingBookings.map(b => ({
      ...b,
      checkInFormatted: formatDateDR(b.check_in),
      checkOutFormatted: formatDateDR(b.check_out),
    })),
  };
};

export const actions: Actions = {
  advance: async ({ request }) => {
    const form = await request.formData();
    const days = Number(form.get('days') ?? 1);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return fail(400, { error: 'Days must be between 1 and 365' });
    }
    const row = db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string };
    const newDate = advanceDate(row.value, days);
    db.prepare('UPDATE game_state SET value = ? WHERE key = ?').run(newDate, 'current_date');
    return { newDate, newDateFormatted: formatDateDR(newDate) };
  }
};
```

**Step 2: Replace `src/routes/+page.svelte`**

```svelte
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
  <!-- Header row -->
  <div class="flex items-start justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-400">{data.currentDateFormatted}</h2>
      <p class="text-stone-400 text-sm mt-1">Current in-game date</p>
    </div>
    <div class="text-right">
      <p class="text-3xl font-bold {data.balance < 0 ? 'text-red-400' : 'text-emerald-400'}">
        {data.balance < 0 ? '−' : ''}{Math.abs(data.balance)} gp
      </p>
      <p class="text-stone-400 text-sm mt-1">Cash balance</p>
    </div>
  </div>

  {#if data.balance < 0}
    <div class="bg-red-950 border border-red-800 rounded p-3 text-red-300 text-sm">
      Warning: Cash balance is negative.
    </div>
  {/if}

  <!-- Advance date -->
  <div class="bg-stone-900 rounded-lg p-4 border border-stone-800">
    <h3 class="text-sm font-semibold text-stone-300 mb-3">Advance Date</h3>
    <form method="POST" action="?/advance" class="flex gap-2 items-center">
      <input
        type="number"
        name="days"
        value="1"
        min="1"
        max="365"
        class="w-20 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100"
      />
      <span class="text-stone-400 text-sm">days</span>
      <button
        type="submit"
        class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-3 py-1 rounded text-sm transition-colors"
      >
        Advance
      </button>
    </form>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <!-- Recent transactions -->
    <div class="bg-stone-900 rounded-lg border border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300 px-4 py-3 border-b border-stone-800">Recent Transactions</h3>
      {#if data.recentTx.length === 0}
        <p class="text-stone-500 text-sm p-4">No transactions yet.</p>
      {:else}
        <ul class="divide-y divide-stone-800">
          {#each data.recentTx as tx}
            <li class="px-4 py-2 flex justify-between items-center">
              <div>
                <p class="text-sm text-stone-200">{tx.description}</p>
                <p class="text-xs text-stone-500">{tx.dateFormatted} · {tx.category}</p>
              </div>
              <span class="text-sm font-mono {tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}">
                {tx.amount > 0 ? '+' : ''}{tx.amount} gp
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Upcoming bookings -->
    <div class="bg-stone-900 rounded-lg border border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300 px-4 py-3 border-b border-stone-800">Upcoming Bookings</h3>
      {#if data.upcomingBookings.length === 0}
        <p class="text-stone-500 text-sm p-4">No upcoming bookings.</p>
      {:else}
        <ul class="divide-y divide-stone-800">
          {#each data.upcomingBookings as b}
            <li class="px-4 py-2">
              <p class="text-sm text-stone-200">{b.guest_name} — {b.room_name}</p>
              <p class="text-xs text-stone-500">{b.checkInFormatted} → {b.checkOutFormatted} · {b.rate} gp/night</p>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>
```

**Step 3: Verify**

```bash
npm run check
```

Browser: Dashboard loads showing "1 Hammer, 1492 DR", 0 gp balance, empty recent transactions, empty bookings. Clicking "Advance" with 1 day changes date to "2 Hammer, 1492 DR" and sidebar updates.

**Step 4: Commit**

```bash
git add src/routes/+page.svelte src/routes/+page.server.ts
git commit -m "feat: add dashboard with date advance and balance"
```

---

### Task 6: Ledger

**Files:**
- Create: `src/routes/ledger/+page.server.ts`
- Create: `src/routes/ledger/+page.svelte`

**Step 1: Create `src/routes/ledger/+page.server.ts`**

```ts
import db from '$lib/server/db';
import { formatDateDR } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const CATEGORIES = [
  'Ale & Drinks', 'Food', 'Room Rental', 'Event Revenue',
  'Staff Wages', 'Supplies', 'Maintenance', 'Loan Payment',
  'Investment', 'Dividend', 'Other Income', 'Other Expense'
];

export const load: PageServerLoad = ({ url }) => {
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';
  const category = url.searchParams.get('category') ?? '';

  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: string[] = [];

  if (from) { query += ' AND date_dr >= ?'; params.push(from); }
  if (to)   { query += ' AND date_dr <= ?'; params.push(to); }
  if (category) { query += ' AND category = ?'; params.push(category); }

  query += ' ORDER BY date_dr DESC, id DESC';

  const transactions = (db.prepare(query).all(...params) as {
    id: number; date_dr: string; description: string; amount: number; category: string; notes: string | null;
  }[]).map(t => ({ ...t, dateFormatted: formatDateDR(t.date_dr) }));

  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;

  return { transactions, categories: CATEGORIES, currentDate, filters: { from, to, category } };
};

export const actions: Actions = {
  add: async ({ request }) => {
    const form = await request.formData();
    const date_dr   = String(form.get('date_dr') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const amount    = Number(form.get('amount'));
    const type      = form.get('type') === 'expense' ? -1 : 1;
    const category  = String(form.get('category') ?? '').trim();
    const notes     = String(form.get('notes') ?? '').trim() || null;

    if (!date_dr || !description || !category || isNaN(amount) || amount <= 0) {
      return fail(400, { error: 'All fields required; amount must be positive.' });
    }

    db.prepare(
      'INSERT INTO transactions (date_dr, description, amount, category, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(date_dr, description, amount * type, category, notes);

    return { success: true };
  }
};
```

**Step 2: Create `src/routes/ledger/+page.svelte`**

```svelte
<script lang="ts">
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Ledger</h2>

  <!-- Filters -->
  <form method="GET" class="flex flex-wrap gap-3 items-end bg-stone-900 border border-stone-800 rounded-lg p-4">
    <div>
      <label class="block text-xs text-stone-400 mb-1">From (YYYY-MM-DD)</label>
      <input name="from" value={data.filters.from} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-36" />
    </div>
    <div>
      <label class="block text-xs text-stone-400 mb-1">To (YYYY-MM-DD)</label>
      <input name="to" value={data.filters.to} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-36" />
    </div>
    <div>
      <label class="block text-xs text-stone-400 mb-1">Category</label>
      <select name="category" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
        <option value="">All</option>
        {#each data.categories as cat}
          <option value={cat} selected={data.filters.category === cat}>{cat}</option>
        {/each}
      </select>
    </div>
    <button type="submit" class="bg-stone-700 hover:bg-stone-600 px-3 py-1 rounded text-sm transition-colors">Filter</button>
    <a href="/ledger" class="text-stone-400 hover:text-stone-200 text-sm py-1">Clear</a>
  </form>

  <!-- Add transaction -->
  <details class="bg-stone-900 border border-stone-800 rounded-lg">
    <summary class="px-4 py-3 text-sm font-semibold text-stone-300 cursor-pointer hover:text-amber-400">+ Add Transaction</summary>
    <form method="POST" action="?/add" class="p-4 pt-0 grid grid-cols-2 gap-3">
      {#if form?.error}
        <p class="col-span-2 text-red-400 text-sm">{form.error}</p>
      {/if}
      <div>
        <label class="block text-xs text-stone-400 mb-1">Date (YYYY-MM-DD)</label>
        <input name="date_dr" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div>
        <label class="block text-xs text-stone-400 mb-1">Type</label>
        <select name="type" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div class="col-span-2">
        <label class="block text-xs text-stone-400 mb-1">Description</label>
        <input name="description" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div>
        <label class="block text-xs text-stone-400 mb-1">Amount (gp)</label>
        <input name="amount" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div>
        <label class="block text-xs text-stone-400 mb-1">Category</label>
        <select name="category" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
          {#each data.categories as cat}
            <option>{cat}</option>
          {/each}
        </select>
      </div>
      <div class="col-span-2">
        <label class="block text-xs text-stone-400 mb-1">Notes (optional)</label>
        <input name="notes" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div class="col-span-2">
        <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">
          Add Transaction
        </button>
      </div>
    </form>
  </details>

  <!-- Transaction table -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
    <table class="w-full text-sm">
      <thead class="border-b border-stone-800 text-stone-400 text-xs uppercase">
        <tr>
          <th class="text-left px-4 py-2">Date</th>
          <th class="text-left px-4 py-2">Description</th>
          <th class="text-left px-4 py-2">Category</th>
          <th class="text-right px-4 py-2">Amount</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.transactions as tx}
          <tr class="hover:bg-stone-800/50">
            <td class="px-4 py-2 text-stone-400 whitespace-nowrap">{tx.dateFormatted}</td>
            <td class="px-4 py-2 text-stone-200">{tx.description}{#if tx.notes}<span class="text-stone-500 ml-1 text-xs">— {tx.notes}</span>{/if}</td>
            <td class="px-4 py-2 text-stone-400">{tx.category}</td>
            <td class="px-4 py-2 text-right font-mono {tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}">
              {tx.amount > 0 ? '+' : ''}{tx.amount} gp
            </td>
          </tr>
        {:else}
          <tr><td colspan="4" class="px-4 py-6 text-center text-stone-500">No transactions.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
```

**Step 3: Verify**

```bash
npm run check
```

Browser: Add a test income transaction (e.g., "Opening deposit", 500 gp, Other Income). It appears in the table. Dashboard balance updates to 500. Add an expense of 50 gp — balance shows 450.

**Step 4: Commit**

```bash
git add src/routes/ledger/
git commit -m "feat: add ledger with transaction log and add form"
```

---

### Task 7: P&L Reports

**Files:**
- Create: `src/routes/reports/+page.server.ts`
- Create: `src/routes/reports/+page.svelte`

**Step 1: Create `src/routes/reports/+page.server.ts`**

```ts
import db from '$lib/server/db';
import { formatDateDR, daysBetween } from '$lib/calendar';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;
  const from = url.searchParams.get('from') ?? '1492-01-01';
  const to   = url.searchParams.get('to') ?? currentDate;

  // Revenue by category
  const revenueRows = db.prepare(`
    SELECT category, SUM(amount) as total
    FROM transactions
    WHERE amount > 0 AND date_dr >= ? AND date_dr <= ?
    GROUP BY category
    ORDER BY total DESC
  `).all(from, to) as { category: string; total: number }[];

  // Expenses by category
  const expenseRows = db.prepare(`
    SELECT category, SUM(amount) as total
    FROM transactions
    WHERE amount < 0 AND date_dr >= ? AND date_dr <= ?
    GROUP BY category
    ORDER BY total ASC
  `).all(from, to) as { category: string; total: number }[];

  const totalRevenue = revenueRows.reduce((s, r) => s + r.total, 0);
  const totalExpenses = expenseRows.reduce((s, r) => s + r.total, 0);
  const netIncome = totalRevenue + totalExpenses; // expenses are negative

  // Depreciation memo: sum straight-line depreciation for period
  const assets = db.prepare('SELECT * FROM assets').all() as {
    id: number; name: string; purchase_date: string; cost: number; useful_life_days: number; salvage_value: number;
  }[];

  const periodDays = Math.max(0, daysBetween(from, to) + 1);
  const depreciationMemo = assets.reduce((sum, a) => {
    const dailyDep = (a.cost - a.salvage_value) / a.useful_life_days;
    // Only depreciate if asset was owned during this period
    if (a.purchase_date <= to) {
      const assetDays = Math.min(periodDays, daysBetween(a.purchase_date, to) + 1);
      return sum + dailyDep * assetDays;
    }
    return sum;
  }, 0);

  // Accrued interest memo: sum interest on active loans not yet paid
  const loans = db.prepare("SELECT * FROM loans WHERE status = 'active'").all() as {
    id: number; principal: number; interest_rate: number; start_date: string; term_days: number;
  }[];

  const paidInterest = db.prepare(`
    SELECT lp.loan_id, COALESCE(SUM(lp.interest_portion), 0) as paid
    FROM loan_payments lp
    JOIN transactions t ON t.id = lp.transaction_id
    WHERE t.date_dr >= ? AND t.date_dr <= ?
    GROUP BY lp.loan_id
  `).all(from, to) as { loan_id: number; paid: number }[];

  const paidMap = Object.fromEntries(paidInterest.map(r => [r.loan_id, r.paid]));

  const accruedInterestMemo = loans.reduce((sum, loan) => {
    // Simple: monthly rate * (periodDays / 30) * principal (approximate accrual)
    const months = periodDays / 30;
    return sum + loan.principal * loan.interest_rate * months - (paidMap[loan.id] ?? 0);
  }, 0);

  return {
    from, to,
    fromFormatted: formatDateDR(from),
    toFormatted: formatDateDR(to),
    revenueRows,
    expenseRows: expenseRows.map(r => ({ ...r, total: Math.abs(r.total) })),
    totalRevenue,
    totalExpenses: Math.abs(totalExpenses),
    netIncome,
    depreciationMemo: Math.round(depreciationMemo),
    accruedInterestMemo: Math.round(accruedInterestMemo),
  };
};
```

**Step 2: Create `src/routes/reports/+page.svelte`**

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">P&L Report</h2>

  <!-- Date range picker -->
  <form method="GET" class="flex flex-wrap gap-3 items-end bg-stone-900 border border-stone-800 rounded-lg p-4">
    <div>
      <label class="block text-xs text-stone-400 mb-1">From (YYYY-MM-DD)</label>
      <input name="from" value={data.from} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-36" />
    </div>
    <div>
      <label class="block text-xs text-stone-400 mb-1">To (YYYY-MM-DD)</label>
      <input name="to" value={data.to} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-36" />
    </div>
    <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-3 py-1.5 rounded text-sm transition-colors">
      Run Report
    </button>
  </form>

  <p class="text-stone-400 text-sm">{data.fromFormatted} → {data.toFormatted}</p>

  <div class="grid grid-cols-2 gap-4">
    <!-- Revenue -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg">
      <h3 class="px-4 py-3 text-sm font-semibold text-stone-300 border-b border-stone-800">Revenue</h3>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-stone-800">
          {#each data.revenueRows as row}
            <tr>
              <td class="px-4 py-2 text-stone-300">{row.category}</td>
              <td class="px-4 py-2 text-right text-emerald-400 font-mono">{row.total} gp</td>
            </tr>
          {:else}
            <tr><td colspan="2" class="px-4 py-4 text-stone-500 text-center">No revenue.</td></tr>
          {/each}
        </tbody>
        <tfoot class="border-t border-stone-700">
          <tr>
            <td class="px-4 py-2 font-semibold text-stone-200">Total Revenue</td>
            <td class="px-4 py-2 text-right font-bold text-emerald-400 font-mono">{data.totalRevenue} gp</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Expenses -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg">
      <h3 class="px-4 py-3 text-sm font-semibold text-stone-300 border-b border-stone-800">Expenses</h3>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-stone-800">
          {#each data.expenseRows as row}
            <tr>
              <td class="px-4 py-2 text-stone-300">{row.category}</td>
              <td class="px-4 py-2 text-right text-red-400 font-mono">({row.total} gp)</td>
            </tr>
          {:else}
            <tr><td colspan="2" class="px-4 py-4 text-stone-500 text-center">No expenses.</td></tr>
          {/each}
        </tbody>
        <tfoot class="border-t border-stone-700">
          <tr>
            <td class="px-4 py-2 font-semibold text-stone-200">Total Expenses</td>
            <td class="px-4 py-2 text-right font-bold text-red-400 font-mono">({data.totalExpenses} gp)</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- Net income and memos -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg p-4 space-y-2">
    <div class="flex justify-between text-lg font-bold">
      <span class="text-stone-200">Net Income</span>
      <span class="{data.netIncome < 0 ? 'text-red-400' : 'text-emerald-400'} font-mono">
        {data.netIncome < 0 ? '(' : ''}{Math.abs(data.netIncome)} gp{data.netIncome < 0 ? ')' : ''}
      </span>
    </div>
    <div class="border-t border-stone-800 pt-2 space-y-1 text-sm text-stone-400">
      <p>Memo — Depreciation (not in cash expenses): {data.depreciationMemo} gp</p>
      <p>Memo — Accrued loan interest (approximate): {data.accruedInterestMemo} gp</p>
    </div>
  </div>
</div>
```

**Step 3: Verify**

```bash
npm run check
```

Browser: With test transactions from Task 6, run the report. Revenue and expense totals should match the ledger entries. Memos show 0 until assets/loans are added.

**Step 4: Commit**

```bash
git add src/routes/reports/
git commit -m "feat: add P&L report page with depreciation and interest memos"
```

---

### Task 8: Equity

**Files:**
- Create: `src/routes/equity/+page.server.ts`
- Create: `src/routes/equity/+page.svelte`

**Step 1: Create `src/routes/equity/+page.server.ts`**

```ts
import db from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const shareholders = db.prepare('SELECT * FROM shareholders ORDER BY shares DESC').all() as {
    id: number; name: string; shares: number;
  }[];

  const totalShares = shareholders.reduce((s, sh) => s + sh.shares, 0);

  // Net asset value = cash balance + asset book values - outstanding loan principals
  const cash = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM transactions').get() as { total: number }).total;

  const loans = db.prepare("SELECT id, principal FROM loans WHERE status = 'active'").all() as { id: number; principal: number }[];
  const paidPrincipal = db.prepare('SELECT loan_id, SUM(principal_portion) as paid FROM loan_payments GROUP BY loan_id').all() as { loan_id: number; paid: number }[];
  const paidMap = Object.fromEntries(paidPrincipal.map(r => [r.loan_id, r.paid]));
  const outstandingDebt = loans.reduce((s, l) => s + l.principal - (paidMap[l.id] ?? 0), 0);

  const nav = cash - outstandingDebt;

  return {
    shareholders: shareholders.map(sh => ({
      ...sh,
      pct: totalShares > 0 ? ((sh.shares / totalShares) * 100).toFixed(1) : '0.0',
      value: totalShares > 0 ? Math.round((sh.shares / totalShares) * nav) : 0,
    })),
    totalShares,
    nav,
  };
};

export const actions: Actions = {
  addShareholder: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const shares = Number(form.get('shares'));
    if (!name || !Number.isInteger(shares) || shares < 1) {
      return fail(400, { error: 'Name required; shares must be a positive integer.' });
    }
    try {
      db.prepare('INSERT INTO shareholders (name, shares) VALUES (?, ?)').run(name, shares);
    } catch {
      return fail(400, { error: `Shareholder "${name}" already exists.` });
    }
    return { success: true };
  },

  transfer: async ({ request }) => {
    const form = await request.formData();
    const fromId = Number(form.get('from_id'));
    const toId   = Number(form.get('to_id'));
    const shares = Number(form.get('shares'));
    if (fromId === toId) return fail(400, { error: 'Cannot transfer to same shareholder.' });
    if (!Number.isInteger(shares) || shares < 1) return fail(400, { error: 'Shares must be a positive integer.' });

    const from = db.prepare('SELECT * FROM shareholders WHERE id = ?').get(fromId) as { id: number; shares: number } | undefined;
    if (!from || from.shares < shares) return fail(400, { error: 'Insufficient shares.' });

    db.transaction(() => {
      db.prepare('UPDATE shareholders SET shares = shares - ? WHERE id = ?').run(shares, fromId);
      db.prepare('UPDATE shareholders SET shares = shares + ? WHERE id = ?').run(shares, toId);
    })();
    return { success: true };
  },

  dividend: async ({ request }) => {
    const form = await request.formData();
    const totalAmount = Number(form.get('amount'));
    const date_dr = String(form.get('date_dr') ?? '').trim();
    if (isNaN(totalAmount) || totalAmount <= 0 || !date_dr) {
      return fail(400, { error: 'Amount and date required.' });
    }

    const shareholders = db.prepare('SELECT * FROM shareholders').all() as { id: number; name: string; shares: number }[];
    const totalShares = shareholders.reduce((s, sh) => s + sh.shares, 0);
    if (totalShares === 0) return fail(400, { error: 'No shareholders.' });

    db.transaction(() => {
      for (const sh of shareholders) {
        const amount = -Math.round((sh.shares / totalShares) * totalAmount);
        if (amount === 0) continue;
        db.prepare('INSERT INTO transactions (date_dr, description, amount, category) VALUES (?, ?, ?, ?)').run(
          date_dr, `Dividend to ${sh.name}`, amount, 'Dividend'
        );
      }
    })();
    return { success: true };
  }
};
```

**Step 2: Create `src/routes/equity/+page.svelte`**

```svelte
<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Equity</h2>

  <!-- Shareholder table -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
    <div class="px-4 py-3 border-b border-stone-800 flex justify-between items-center">
      <h3 class="text-sm font-semibold text-stone-300">Shareholders</h3>
      <span class="text-xs text-stone-500">Net Asset Value: <span class="text-stone-300 font-mono">{data.nav} gp</span></span>
    </div>
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Shareholder</th>
          <th class="text-right px-4 py-2">Shares</th>
          <th class="text-right px-4 py-2">Ownership</th>
          <th class="text-right px-4 py-2">Est. Value</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.shareholders as sh}
          <tr>
            <td class="px-4 py-2 text-stone-200">{sh.name}</td>
            <td class="px-4 py-2 text-right font-mono text-stone-300">{sh.shares}</td>
            <td class="px-4 py-2 text-right text-stone-300">{sh.pct}%</td>
            <td class="px-4 py-2 text-right font-mono text-amber-400">{sh.value} gp</td>
          </tr>
        {:else}
          <tr><td colspan="4" class="px-4 py-6 text-center text-stone-500">No shareholders yet.</td></tr>
        {/each}
      </tbody>
      <tfoot class="border-t border-stone-700 text-stone-400 text-xs">
        <tr>
          <td class="px-4 py-2">Total</td>
          <td class="px-4 py-2 text-right font-mono">{data.totalShares}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <!-- Add shareholder -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-stone-300 mb-3">Add Shareholder</h3>
      <form method="POST" action="?/addShareholder" class="space-y-2">
        {#if form?.error}<p class="text-red-400 text-xs">{form.error}</p>{/if}
        <input name="name" placeholder="Name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <input name="shares" type="number" min="1" placeholder="Shares" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <button class="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-1.5 rounded text-sm transition-colors">Add</button>
      </form>
    </div>

    <!-- Transfer shares -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-stone-300 mb-3">Transfer Shares</h3>
      <form method="POST" action="?/transfer" class="space-y-2">
        <select name="from_id" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
          {#each data.shareholders as sh}<option value={sh.id}>{sh.name} ({sh.shares})</option>{/each}
        </select>
        <select name="to_id" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
          {#each data.shareholders as sh}<option value={sh.id}>{sh.name}</option>{/each}
        </select>
        <input name="shares" type="number" min="1" placeholder="Shares to transfer" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <button class="w-full bg-stone-700 hover:bg-stone-600 py-1.5 rounded text-sm transition-colors">Transfer</button>
      </form>
    </div>

    <!-- Dividend -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-stone-300 mb-3">Distribute Dividend</h3>
      <form method="POST" action="?/dividend" class="space-y-2">
        <input name="date_dr" placeholder="YYYY-MM-DD" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <input name="amount" type="number" min="1" placeholder="Total (gp)" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <button class="w-full bg-stone-700 hover:bg-stone-600 py-1.5 rounded text-sm transition-colors">Distribute</button>
      </form>
    </div>
  </div>
</div>
```

**Step 3: Verify**

```bash
npm run check
```

Browser: Add two shareholders (e.g., "Aethon" 60 shares, "Mira" 40 shares). Ownership shows 60%/40%. NAV reflects cash balance. Distribute 100 gp dividend — check ledger for two negative transactions.

**Step 4: Commit**

```bash
git add src/routes/equity/
git commit -m "feat: add equity page with shareholders, transfers, and dividends"
```

---

### Task 9: Loans

**Files:**
- Create: `src/routes/loans/+page.server.ts`
- Create: `src/routes/loans/+page.svelte`

**Step 1: Create `src/routes/loans/+page.server.ts`**

```ts
import db from '$lib/server/db';
import { formatDateDR, advanceDate, daysBetween } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type Loan = { id: number; lender: string; principal: number; interest_rate: number; start_date: string; term_days: number; status: string };
type Payment = { id: number; loan_id: number; transaction_id: number; principal_portion: number; interest_portion: number };

function buildAmortization(loan: Loan, payments: Payment[], currentDate: string) {
  const paidPrincipal = payments.reduce((s, p) => s + p.principal_portion, 0);
  const paidInterest  = payments.reduce((s, p) => s + p.interest_portion, 0);
  const outstanding   = loan.principal - paidPrincipal;
  const daysElapsed   = Math.max(0, daysBetween(loan.start_date, currentDate));
  const dueDate       = advanceDate(loan.start_date, loan.term_days);
  const daysRemaining = Math.max(0, daysBetween(currentDate, dueDate));
  const accruedInterest = Math.round(outstanding * loan.interest_rate * (daysElapsed / 30));

  return { outstanding, paidPrincipal, paidInterest, accruedInterest, daysElapsed, daysRemaining, dueDate, dueDateFormatted: formatDateDR(dueDate) };
}

export const load: PageServerLoad = () => {
  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;
  const loans = db.prepare('SELECT * FROM loans ORDER BY status ASC, id DESC').all() as Loan[];
  const payments = db.prepare('SELECT * FROM loan_payments').all() as Payment[];
  const paymentsByLoan = loans.reduce((acc, l) => {
    acc[l.id] = payments.filter(p => p.loan_id === l.id);
    return acc;
  }, {} as Record<number, Payment[]>);

  return {
    currentDate,
    loans: loans.map(l => ({
      ...l,
      startDateFormatted: formatDateDR(l.start_date),
      amort: buildAmortization(l, paymentsByLoan[l.id] ?? [], currentDate),
    })),
  };
};

export const actions: Actions = {
  addLoan: async ({ request }) => {
    const form = await request.formData();
    const lender        = String(form.get('lender') ?? '').trim();
    const principal     = Number(form.get('principal'));
    const interest_rate = Number(form.get('interest_rate')) / 100; // input as percent
    const start_date    = String(form.get('start_date') ?? '').trim();
    const term_days     = Number(form.get('term_days'));

    if (!lender || !start_date || isNaN(principal) || principal <= 0 || isNaN(interest_rate) || isNaN(term_days) || term_days <= 0) {
      return fail(400, { error: 'All fields required.' });
    }

    const result = db.prepare(
      'INSERT INTO loans (lender, principal, interest_rate, start_date, term_days) VALUES (?, ?, ?, ?, ?)'
    ).run(lender, principal, interest_rate, start_date, term_days);

    // Post income transaction for loan receipt
    db.prepare('INSERT INTO transactions (date_dr, description, amount, category, loan_id) VALUES (?, ?, ?, ?, ?)').run(
      start_date, `Loan from ${lender}`, principal, 'Loan Payment', result.lastInsertRowid
    );
    return { success: true };
  },

  makePayment: async ({ request }) => {
    const form = await request.formData();
    const loan_id           = Number(form.get('loan_id'));
    const principal_portion = Number(form.get('principal_portion'));
    const interest_portion  = Number(form.get('interest_portion'));
    const date_dr           = String(form.get('date_dr') ?? '').trim();
    const total             = principal_portion + interest_portion;

    if (!loan_id || !date_dr || isNaN(total) || total <= 0) {
      return fail(400, { error: 'All fields required.' });
    }

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan_id) as Loan | undefined;
    if (!loan) return fail(404, { error: 'Loan not found.' });

    const paid = (db.prepare('SELECT COALESCE(SUM(principal_portion), 0) as paid FROM loan_payments WHERE loan_id = ?').get(loan_id) as { paid: number }).paid;
    if (paid + principal_portion > loan.principal) {
      return fail(400, { error: 'Payment exceeds outstanding principal.' });
    }

    db.transaction(() => {
      const tx = db.prepare('INSERT INTO transactions (date_dr, description, amount, category, loan_id) VALUES (?, ?, ?, ?, ?)').run(
        date_dr, `Loan payment to ${loan.lender}`, -total, 'Loan Payment', loan_id
      );
      db.prepare('INSERT INTO loan_payments (loan_id, transaction_id, principal_portion, interest_portion) VALUES (?, ?, ?, ?)').run(
        loan_id, tx.lastInsertRowid, principal_portion, interest_portion
      );
      // Mark paid if fully repaid
      const newPaid = paid + principal_portion;
      if (newPaid >= loan.principal) {
        db.prepare("UPDATE loans SET status = 'paid' WHERE id = ?").run(loan_id);
      }
    })();
    return { success: true };
  }
};
```

**Step 2: Create `src/routes/loans/+page.svelte`**

```svelte
<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Loans</h2>

  <!-- Add loan form -->
  <details class="bg-stone-900 border border-stone-800 rounded-lg">
    <summary class="px-4 py-3 text-sm font-semibold text-stone-300 cursor-pointer hover:text-amber-400">+ New Loan</summary>
    <form method="POST" action="?/addLoan" class="p-4 pt-0 grid grid-cols-3 gap-3">
      {#if form?.error}<p class="col-span-3 text-red-400 text-sm">{form.error}</p>{/if}
      <div><label class="block text-xs text-stone-400 mb-1">Lender</label>
        <input name="lender" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Principal (gp)</label>
        <input name="principal" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Monthly Rate (%)</label>
        <input name="interest_rate" type="number" min="0" step="0.1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Start Date</label>
        <input name="start_date" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Term (days)</label>
        <input name="term_days" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div class="flex items-end">
        <button class="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-1.5 rounded text-sm transition-colors">Add Loan</button>
      </div>
    </form>
  </details>

  <!-- Loan list -->
  {#each data.loans as loan}
    <div class="bg-stone-900 border border-stone-800 rounded-lg">
      <div class="px-4 py-3 border-b border-stone-800 flex justify-between items-center">
        <div>
          <span class="text-stone-200 font-semibold">{loan.lender}</span>
          <span class="ml-2 text-xs text-stone-500">{loan.startDateFormatted} · {loan.interest_rate * 100}%/mo · {loan.term_days} days</span>
        </div>
        <span class="text-xs px-2 py-0.5 rounded {loan.status === 'active' ? 'bg-amber-900 text-amber-300' : 'bg-stone-800 text-stone-400'}">
          {loan.status}
        </span>
      </div>

      <div class="p-4 grid grid-cols-4 gap-4 text-sm">
        <div><p class="text-xs text-stone-500">Original</p><p class="font-mono text-stone-300">{loan.principal} gp</p></div>
        <div><p class="text-xs text-stone-500">Outstanding</p><p class="font-mono text-amber-400">{loan.amort.outstanding} gp</p></div>
        <div><p class="text-xs text-stone-500">Accrued Interest</p><p class="font-mono text-red-400">{loan.amort.accruedInterest} gp</p></div>
        <div><p class="text-xs text-stone-500">Due</p><p class="text-stone-300">{loan.amort.dueDateFormatted}</p></div>
      </div>

      {#if loan.status === 'active'}
        <div class="border-t border-stone-800 p-4">
          <form method="POST" action="?/makePayment" class="flex flex-wrap gap-2 items-end">
            <input type="hidden" name="loan_id" value={loan.id} />
            <div><label class="block text-xs text-stone-400 mb-1">Date</label>
              <input name="date_dr" value={data.currentDate} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-32" /></div>
            <div><label class="block text-xs text-stone-400 mb-1">Principal (gp)</label>
              <input name="principal_portion" type="number" min="0" value="0" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-24" /></div>
            <div><label class="block text-xs text-stone-400 mb-1">Interest (gp)</label>
              <input name="interest_portion" type="number" min="0" value="0" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-24" /></div>
            <button class="bg-stone-700 hover:bg-stone-600 px-3 py-1.5 rounded text-sm transition-colors">Record Payment</button>
          </form>
        </div>
      {/if}
    </div>
  {:else}
    <p class="text-stone-500 text-sm">No loans recorded.</p>
  {/each}
</div>
```

**Step 3: Verify**

```bash
npm run check
```

Browser: Add a loan (e.g., "Moneylender Zhentarim", 1000 gp, 5%/mo, 90 days). Ledger gains a +1000 gp entry. Record a payment of 100 principal + 50 interest. Ledger gains -150. Outstanding shows 900.

**Step 4: Commit**

```bash
git add src/routes/loans/
git commit -m "feat: add loans page with amortization and payment recording"
```

---

### Task 10: Assets

**Files:**
- Create: `src/routes/assets/+page.server.ts`
- Create: `src/routes/assets/+page.svelte`

**Step 1: Create `src/routes/assets/+page.server.ts`**

```ts
import db from '$lib/server/db';
import { formatDateDR, daysBetween } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type Asset = { id: number; name: string; purchase_date: string; cost: number; useful_life_days: number; salvage_value: number; description: string | null };

export const load: PageServerLoad = () => {
  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;
  const assets = db.prepare('SELECT * FROM assets ORDER BY purchase_date DESC').all() as Asset[];

  return {
    currentDate,
    assets: assets.map(a => {
      const age = Math.max(0, daysBetween(a.purchase_date, currentDate) + 1);
      const dailyDep = (a.cost - a.salvage_value) / a.useful_life_days;
      const accumulated = Math.min(Math.round(dailyDep * age), a.cost - a.salvage_value);
      const bookValue = a.cost - accumulated;
      const fullyDepreciated = age >= a.useful_life_days;
      return {
        ...a,
        purchaseDateFormatted: formatDateDR(a.purchase_date),
        age,
        accumulated,
        bookValue,
        fullyDepreciated,
      };
    }),
    totalBookValue: assets.reduce((sum, a) => {
      const age = Math.max(0, daysBetween(a.purchase_date, currentDate) + 1);
      const dailyDep = (a.cost - a.salvage_value) / a.useful_life_days;
      const acc = Math.min(Math.round(dailyDep * age), a.cost - a.salvage_value);
      return sum + (a.cost - acc);
    }, 0),
  };
};

export const actions: Actions = {
  add: async ({ request }) => {
    const form = await request.formData();
    const name             = String(form.get('name') ?? '').trim();
    const purchase_date    = String(form.get('purchase_date') ?? '').trim();
    const cost             = Number(form.get('cost'));
    const useful_life_days = Number(form.get('useful_life_days'));
    const salvage_value    = Number(form.get('salvage_value') ?? 0);
    const description      = String(form.get('description') ?? '').trim() || null;

    if (!name || !purchase_date || isNaN(cost) || cost <= 0 || isNaN(useful_life_days) || useful_life_days <= 0) {
      return fail(400, { error: 'Name, date, cost, and useful life required.' });
    }

    db.transaction(() => {
      db.prepare('INSERT INTO assets (name, purchase_date, cost, useful_life_days, salvage_value, description) VALUES (?, ?, ?, ?, ?, ?)').run(
        name, purchase_date, cost, useful_life_days, salvage_value, description
      );
      db.prepare('INSERT INTO transactions (date_dr, description, amount, category) VALUES (?, ?, ?, ?)').run(
        purchase_date, `Asset purchase: ${name}`, -cost, 'Investment'
      );
    })();
    return { success: true };
  }
};
```

**Step 2: Create `src/routes/assets/+page.svelte`**

```svelte
<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-amber-400">Capital Assets</h2>
    <span class="text-sm text-stone-400">Total Book Value: <span class="text-amber-400 font-mono">{data.totalBookValue} gp</span></span>
  </div>

  <!-- Add asset -->
  <details class="bg-stone-900 border border-stone-800 rounded-lg">
    <summary class="px-4 py-3 text-sm font-semibold text-stone-300 cursor-pointer hover:text-amber-400">+ Add Asset</summary>
    <form method="POST" action="?/add" class="p-4 pt-0 grid grid-cols-3 gap-3">
      {#if form?.error}<p class="col-span-3 text-red-400 text-sm">{form.error}</p>{/if}
      <div class="col-span-2"><label class="block text-xs text-stone-400 mb-1">Name</label>
        <input name="name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Purchase Date</label>
        <input name="purchase_date" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Cost (gp)</label>
        <input name="cost" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Useful Life (days)</label>
        <input name="useful_life_days" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Salvage Value (gp)</label>
        <input name="salvage_value" type="number" min="0" value="0" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div class="col-span-3"><label class="block text-xs text-stone-400 mb-1">Description (optional)</label>
        <input name="description" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div class="col-span-3">
        <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Add Asset</button>
      </div>
    </form>
  </details>

  <!-- Asset table -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Asset</th>
          <th class="text-right px-4 py-2">Cost</th>
          <th class="text-right px-4 py-2">Age (days)</th>
          <th class="text-right px-4 py-2">Accum. Dep.</th>
          <th class="text-right px-4 py-2">Book Value</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.assets as a}
          <tr class="{a.fullyDepreciated ? 'opacity-50' : ''}">
            <td class="px-4 py-2">
              <p class="text-stone-200">{a.name}</p>
              <p class="text-xs text-stone-500">{a.purchaseDateFormatted}{#if a.description} · {a.description}{/if}</p>
            </td>
            <td class="px-4 py-2 text-right font-mono text-stone-300">{a.cost} gp</td>
            <td class="px-4 py-2 text-right text-stone-400">{a.age} / {a.useful_life_days}</td>
            <td class="px-4 py-2 text-right font-mono text-red-400">({a.accumulated} gp)</td>
            <td class="px-4 py-2 text-right font-mono text-amber-400">{a.bookValue} gp</td>
          </tr>
        {:else}
          <tr><td colspan="5" class="px-4 py-6 text-center text-stone-500">No assets recorded.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
```

**Step 3: Verify**

```bash
npm run check
```

Browser: Add an asset (e.g., "Brewery Equipment", 500 gp, 365 day life, 50 gp salvage). Ledger gets a -500 Investment entry. Advance 30 days — book value should decrease by ~(500-50)/365*30 ≈ 37 gp. P&L report memo shows depreciation.

**Step 4: Commit**

```bash
git add src/routes/assets/
git commit -m "feat: add capital assets page with straight-line depreciation"
```

---

### Task 11: Hospitality

**Files:**
- Create: `src/routes/hospitality/+page.server.ts`
- Create: `src/routes/hospitality/+page.svelte`

**Step 1: Create `src/routes/hospitality/+page.server.ts`**

```ts
import db from '$lib/server/db';
import { formatDateDR, daysBetween } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type Room = { id: number; name: string; floor: number | null; rate: number; description: string | null };
type Booking = { id: number; room_id: number; guest_name: string; check_in: string; check_out: string; rate: number; paid: number; notes: string | null };
type Event = { id: number; name: string; date_dr: string; revenue: number; cost: number; description: string | null };

export const load: PageServerLoad = () => {
  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;

  const rooms = db.prepare('SELECT * FROM rooms ORDER BY floor, name').all() as Room[];
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY check_in DESC').all() as Booking[];
  const events = db.prepare('SELECT * FROM events ORDER BY date_dr DESC').all() as Event[];

  // Determine occupancy: room has an active booking overlapping currentDate
  const occupiedRoomIds = new Set(
    bookings
      .filter(b => b.check_in <= currentDate && b.check_out > currentDate)
      .map(b => b.room_id)
  );

  return {
    currentDate,
    rooms: rooms.map(r => ({ ...r, occupied: occupiedRoomIds.has(r.id) })),
    bookings: bookings.map(b => ({
      ...b,
      checkInFormatted: formatDateDR(b.check_in),
      checkOutFormatted: formatDateDR(b.check_out),
      nights: daysBetween(b.check_in, b.check_out),
      total: b.rate * daysBetween(b.check_in, b.check_out),
      roomName: rooms.find(r => r.id === b.room_id)?.name ?? 'Unknown',
    })),
    events: events.map(e => ({ ...e, dateFormatted: formatDateDR(e.date_dr) })),
  };
};

export const actions: Actions = {
  addRoom: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const floor = form.get('floor') ? Number(form.get('floor')) : null;
    const rate = Number(form.get('rate'));
    const description = String(form.get('description') ?? '').trim() || null;
    if (!name || isNaN(rate) || rate < 0) return fail(400, { error: 'Name and rate required.' });
    db.prepare('INSERT INTO rooms (name, floor, rate, description) VALUES (?, ?, ?, ?)').run(name, floor, rate, description);
    return { success: true };
  },

  addBooking: async ({ request }) => {
    const form = await request.formData();
    const room_id    = Number(form.get('room_id'));
    const guest_name = String(form.get('guest_name') ?? '').trim();
    const check_in   = String(form.get('check_in') ?? '').trim();
    const check_out  = String(form.get('check_out') ?? '').trim();
    const rate       = Number(form.get('rate'));
    const notes      = String(form.get('notes') ?? '').trim() || null;

    if (!guest_name || !check_in || !check_out || isNaN(rate) || rate < 0 || check_out <= check_in) {
      return fail(400, { error: 'All fields required; check-out must be after check-in.' });
    }

    // Overlap check
    const overlap = db.prepare(`
      SELECT id FROM bookings
      WHERE room_id = ? AND check_in < ? AND check_out > ?
    `).get(room_id, check_out, check_in);
    if (overlap) return fail(400, { error: 'Room already booked for those dates.' });

    db.prepare('INSERT INTO bookings (room_id, guest_name, check_in, check_out, rate, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
      room_id, guest_name, check_in, check_out, rate, notes
    );
    return { success: true };
  },

  checkout: async ({ request }) => {
    const form = await request.formData();
    const booking_id = Number(form.get('booking_id'));
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id) as Booking | undefined;
    if (!booking) return fail(404, { error: 'Booking not found.' });
    if (booking.paid) return fail(400, { error: 'Already checked out.' });

    const nights = daysBetween(booking.check_in, booking.check_out);
    const total = booking.rate * nights;
    const room = db.prepare('SELECT name FROM rooms WHERE id = ?').get(booking.room_id) as { name: string };

    db.transaction(() => {
      db.prepare('UPDATE bookings SET paid = 1 WHERE id = ?').run(booking_id);
      db.prepare('INSERT INTO transactions (date_dr, description, amount, category, booking_id) VALUES (?, ?, ?, ?, ?)').run(
        booking.check_out, `Room: ${room.name} — ${booking.guest_name} (${nights} nights)`, total, 'Room Rental', booking_id
      );
    })();
    return { success: true };
  },

  addEvent: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const date_dr = String(form.get('date_dr') ?? '').trim();
    const revenue = Number(form.get('revenue') ?? 0);
    const cost = Number(form.get('cost') ?? 0);
    const description = String(form.get('description') ?? '').trim() || null;
    if (!name || !date_dr) return fail(400, { error: 'Name and date required.' });

    db.transaction(() => {
      db.prepare('INSERT INTO events (name, date_dr, revenue, cost, description) VALUES (?, ?, ?, ?, ?)').run(name, date_dr, revenue, cost, description);
      if (revenue > 0) db.prepare('INSERT INTO transactions (date_dr, description, amount, category) VALUES (?, ?, ?, ?)').run(date_dr, `Event revenue: ${name}`, revenue, 'Event Revenue');
      if (cost > 0) db.prepare('INSERT INTO transactions (date_dr, description, amount, category) VALUES (?, ?, ?, ?)').run(date_dr, `Event cost: ${name}`, -cost, 'Supplies');
    })();
    return { success: true };
  }
};
```

**Step 2: Create `src/routes/hospitality/+page.svelte`**

```svelte
<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Hospitality</h2>

  <!-- Rooms -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg">
    <div class="px-4 py-3 border-b border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300">Rooms</h3>
    </div>
    <div class="p-4 grid grid-cols-3 gap-3">
      {#each data.rooms as room}
        <div class="bg-stone-800 rounded p-3 border border-stone-700">
          <div class="flex justify-between items-start">
            <p class="text-stone-200 font-semibold text-sm">{room.name}</p>
            <span class="text-xs px-1.5 py-0.5 rounded {room.occupied ? 'bg-red-900 text-red-300' : 'bg-emerald-900 text-emerald-300'}">
              {room.occupied ? 'Occupied' : 'Vacant'}
            </span>
          </div>
          {#if room.floor}<p class="text-xs text-stone-500">Floor {room.floor}</p>{/if}
          <p class="text-xs text-amber-400 mt-1 font-mono">{room.rate} gp/night</p>
        </div>
      {:else}
        <p class="col-span-3 text-stone-500 text-sm">No rooms configured.</p>
      {/each}
    </div>
    <details class="border-t border-stone-800">
      <summary class="px-4 py-2 text-xs text-stone-400 cursor-pointer hover:text-amber-400">+ Add Room</summary>
      <form method="POST" action="?/addRoom" class="p-4 pt-0 flex flex-wrap gap-2">
        <input name="name" placeholder="Room name" required class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-40" />
        <input name="floor" type="number" placeholder="Floor" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-20" />
        <input name="rate" type="number" min="0" placeholder="Rate (gp)" required class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-24" />
        <input name="description" placeholder="Description" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 flex-1" />
        <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-3 py-1 rounded text-sm transition-colors">Add</button>
      </form>
    </details>
  </div>

  <!-- Bookings -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg">
    <div class="px-4 py-3 border-b border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300">Bookings</h3>
    </div>
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Guest</th>
          <th class="text-left px-4 py-2">Room</th>
          <th class="text-left px-4 py-2">Check-in</th>
          <th class="text-left px-4 py-2">Check-out</th>
          <th class="text-right px-4 py-2">Total</th>
          <th class="text-center px-4 py-2">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.bookings as b}
          <tr>
            <td class="px-4 py-2 text-stone-200">{b.guest_name}</td>
            <td class="px-4 py-2 text-stone-400">{b.roomName}</td>
            <td class="px-4 py-2 text-stone-400">{b.checkInFormatted}</td>
            <td class="px-4 py-2 text-stone-400">{b.checkOutFormatted}</td>
            <td class="px-4 py-2 text-right font-mono text-amber-400">{b.total} gp</td>
            <td class="px-4 py-2 text-center">
              {#if b.paid}
                <span class="text-xs text-stone-500">Paid</span>
              {:else}
                <form method="POST" action="?/checkout">
                  <input type="hidden" name="booking_id" value={b.id} />
                  <button class="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded transition-colors">Check out</button>
                </form>
              {/if}
            </td>
          </tr>
        {:else}
          <tr><td colspan="6" class="px-4 py-6 text-center text-stone-500">No bookings.</td></tr>
        {/each}
      </tbody>
    </table>
    <details class="border-t border-stone-800">
      <summary class="px-4 py-2 text-xs text-stone-400 cursor-pointer hover:text-amber-400">+ New Booking</summary>
      <form method="POST" action="?/addBooking" class="p-4 pt-0 grid grid-cols-3 gap-3">
        {#if form?.error}<p class="col-span-3 text-red-400 text-sm">{form.error}</p>{/if}
        <div><label class="block text-xs text-stone-400 mb-1">Room</label>
          <select name="room_id" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
            {#each data.rooms as r}<option value={r.id}>{r.name}</option>{/each}
          </select></div>
        <div><label class="block text-xs text-stone-400 mb-1">Guest Name</label>
          <input name="guest_name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Rate (gp/night)</label>
          <input name="rate" type="number" min="0" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Check-in (YYYY-MM-DD)</label>
          <input name="check_in" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Check-out (YYYY-MM-DD)</label>
          <input name="check_out" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Notes</label>
          <input name="notes" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-3">
          <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Book</button>
        </div>
      </form>
    </details>
  </div>

  <!-- Events -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg">
    <div class="px-4 py-3 border-b border-stone-800"><h3 class="text-sm font-semibold text-stone-300">Events</h3></div>
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Event</th>
          <th class="text-left px-4 py-2">Date</th>
          <th class="text-right px-4 py-2">Revenue</th>
          <th class="text-right px-4 py-2">Cost</th>
          <th class="text-right px-4 py-2">Net</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.events as e}
          <tr>
            <td class="px-4 py-2 text-stone-200">{e.name}{#if e.description}<span class="text-xs text-stone-500 ml-1">— {e.description}</span>{/if}</td>
            <td class="px-4 py-2 text-stone-400">{e.dateFormatted}</td>
            <td class="px-4 py-2 text-right font-mono text-emerald-400">{e.revenue} gp</td>
            <td class="px-4 py-2 text-right font-mono text-red-400">({e.cost} gp)</td>
            <td class="px-4 py-2 text-right font-mono {e.revenue - e.cost >= 0 ? 'text-emerald-400' : 'text-red-400'}">{e.revenue - e.cost} gp</td>
          </tr>
        {:else}
          <tr><td colspan="5" class="px-4 py-6 text-center text-stone-500">No events.</td></tr>
        {/each}
      </tbody>
    </table>
    <details class="border-t border-stone-800">
      <summary class="px-4 py-2 text-xs text-stone-400 cursor-pointer hover:text-amber-400">+ New Event</summary>
      <form method="POST" action="?/addEvent" class="p-4 pt-0 grid grid-cols-3 gap-3">
        <div class="col-span-2"><label class="block text-xs text-stone-400 mb-1">Event Name</label>
          <input name="name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Date</label>
          <input name="date_dr" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Revenue (gp)</label>
          <input name="revenue" type="number" min="0" value="0" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Cost (gp)</label>
          <input name="cost" type="number" min="0" value="0" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Description</label>
          <input name="description" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-3">
          <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Add Event</button>
        </div>
      </form>
    </details>
  </div>
</div>
```

**Step 3: Verify**

```bash
npm run check
```

Browser: Add rooms (Ground Floor Common Room, 2nd Floor Suite). Add a booking for 3 nights. Dashboard shows the upcoming booking. Check out — ledger gains an income entry. Add an event (Bard Night, 50 gp revenue, 10 gp cost). P&L report shows Event Revenue category.

**Step 4: Commit**

```bash
git add src/routes/hospitality/
git commit -m "feat: add hospitality page with rooms, bookings, checkout, and events"
```

---

## Done

At this point all 11 tasks are complete. Run `npm run check` one final time to confirm zero errors, then commit the db file as the initial save state:

```bash
git add data/trollskull.db
git commit -m "chore: add initial db state"
```

Optionally remove `data/trollskull.db` from `.gitignore` if you want to track the db in git (recommended — it's your campaign save file).
