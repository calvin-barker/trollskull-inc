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
