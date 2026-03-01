import db from '$lib/server/db';
import { formatDateDR } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const CATEGORIES = [
  'Ale & Drinks', 'Food', 'Room Rental', 'Event Revenue',
  'Staff Wages', 'Supplies', 'Maintenance', 'Loan Payment',
  'Investment', 'Dividend', "Owner's Equity", 'Other Income', 'Other Expense'
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
    id: number; date_dr: string; description: string; amount: number; category: string; person: string | null; notes: string | null;
  }[]).map(t => ({ ...t, dateFormatted: formatDateDR(t.date_dr) }));

  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;

  const shareholders = db.prepare('SELECT name FROM shareholders ORDER BY name').all() as { name: string }[];

  return {
    transactions,
    categories: CATEGORIES,
    currentDate,
    filters: { from, to, category },
    shareholderNames: shareholders.map(s => s.name),
  };
};

export const actions: Actions = {
  add: async ({ request }) => {
    const form = await request.formData();
    const date_dr   = String(form.get('date_dr') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const amount    = Number(form.get('amount'));
    const type      = form.get('type') === 'expense' ? -1 : 1;
    const category  = String(form.get('category') ?? '').trim();
    const person    = String(form.get('person') ?? '').trim() || null;
    const notes     = String(form.get('notes') ?? '').trim() || null;

    if (!date_dr || !description || !category || isNaN(amount) || amount <= 0) {
      return fail(400, { error: 'All fields required; amount must be positive.' });
    }

    db.prepare(
      'INSERT INTO transactions (date_dr, description, amount, category, person, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(date_dr, description, amount * type, category, person, notes);

    return { success: true };
  },

  edit: async ({ request }) => {
    const form = await request.formData();
    const id          = Number(form.get('id'));
    const description = String(form.get('description') ?? '').trim();
    const amount      = Number(form.get('amount'));
    const type        = form.get('type') === 'expense' ? -1 : 1;
    const category    = String(form.get('category') ?? '').trim();
    const person      = String(form.get('person') ?? '').trim() || null;
    const notes       = String(form.get('notes') ?? '').trim() || null;

    if (!id || !description || !category || isNaN(amount) || amount <= 0) {
      return fail(400, { error: 'All fields required; amount must be positive.' });
    }

    db.prepare(
      'UPDATE transactions SET description = ?, amount = ?, category = ?, person = ?, notes = ? WHERE id = ?'
    ).run(description, amount * type, category, person, notes, id);

    return { success: true };
  },

  delete: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id'));
    if (!id) return fail(400, { error: 'Transaction ID required.' });

    // Clean up any linked loan_payments
    db.transaction(() => {
      db.prepare('DELETE FROM loan_payments WHERE transaction_id = ?').run(id);
      db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    })();
    return { success: true };
  },
};
