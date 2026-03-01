import db from '$lib/server/db';
import { seedAll, clearAll } from '$lib/server/seed';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const minRow = db.prepare('SELECT value FROM game_state WHERE key = ?').get('daily_revenue_min') as { value: string } | undefined;
  const maxRow = db.prepare('SELECT value FROM game_state WHERE key = ?').get('daily_revenue_max') as { value: string } | undefined;
  return {
    dailyRevenueMin: Number(minRow?.value ?? 5),
    dailyRevenueMax: Number(maxRow?.value ?? 15),
  };
};

export const actions: Actions = {
  seed: async () => {
    seedAll(db);
  },

  clear: async () => {
    clearAll(db);
  },

  updateRevenue: async ({ request }) => {
    const form = await request.formData();
    const min = Number(form.get('min'));
    const max = Number(form.get('max'));
    if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
      return fail(400, { error: 'Min and max must be non-negative numbers.' });
    }
    if (min > max) {
      return fail(400, { error: 'Min must not exceed max.' });
    }
    db.prepare("INSERT OR REPLACE INTO game_state (key, value) VALUES ('daily_revenue_min', ?)").run(String(min));
    db.prepare("INSERT OR REPLACE INTO game_state (key, value) VALUES ('daily_revenue_max', ?)").run(String(max));
    return { success: true };
  },
};
