import db from '$lib/server/db';
import { formatDateDR } from '$lib/calendar';
import { computeDepreciation, type Asset } from '$lib/finance';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;
  const assets = db.prepare('SELECT * FROM assets ORDER BY purchase_date DESC').all() as Asset[];

  return {
    currentDate,
    assets: assets.map(a => {
      const dep = computeDepreciation(a, currentDate);
      return {
        ...a,
        purchaseDateFormatted: formatDateDR(a.purchase_date),
        ...dep,
      };
    }),
    totalBookValue: assets.reduce((sum, a) => sum + computeDepreciation(a, currentDate).bookValue, 0),
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
