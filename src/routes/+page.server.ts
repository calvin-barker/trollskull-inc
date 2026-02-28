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
