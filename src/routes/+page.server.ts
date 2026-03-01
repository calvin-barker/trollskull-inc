import db from '$lib/server/db';
import { formatDateDR, isValidFRDate } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const dateRow = db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string };
  const currentDate = dateRow.value;

  const fullMoonRow = db.prepare('SELECT value FROM game_state WHERE key = ?').get('full_moon_date') as { value: string } | undefined;
  const fullMoonDate = fullMoonRow?.value ?? '1492-01-01';

  const balance = (db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM transactions').get() as { total: number }).total;

  const recentTx = db.prepare(
    'SELECT * FROM transactions ORDER BY date_dr DESC, id DESC LIMIT 10'
  ).all() as { id: number; date_dr: string; description: string; amount: number; category: string; person: string | null }[];

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
    fullMoonDate,
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
  setDate: async ({ request }) => {
    const form = await request.formData();
    const date = String(form.get('date') ?? '');
    if (!isValidFRDate(date)) {
      return fail(400, { error: 'Invalid Forgotten Realms date' });
    }
    db.prepare('UPDATE game_state SET value = ? WHERE key = ?').run(date, 'current_date');
    return { newDate: date, newDateFormatted: formatDateDR(date) };
  },

  setFullMoon: async ({ request }) => {
    const form = await request.formData();
    const date = String(form.get('date') ?? '');
    if (!isValidFRDate(date)) {
      return fail(400, { error: 'Invalid Forgotten Realms date' });
    }
    db.prepare('INSERT OR REPLACE INTO game_state (key, value) VALUES (?, ?)').run('full_moon_date', date);
  },
};
