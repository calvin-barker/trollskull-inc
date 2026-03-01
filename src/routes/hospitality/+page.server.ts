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

  // Determine occupancy: room has an unpaid booking overlapping currentDate
  const occupiedRoomIds = new Set(
    bookings
      .filter(b => !b.paid && b.check_in <= currentDate && b.check_out > currentDate)
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

  editRoom: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id'));
    const name = String(form.get('name') ?? '').trim();
    const floor = form.get('floor') ? Number(form.get('floor')) : null;
    const rate = Number(form.get('rate'));
    const description = String(form.get('description') ?? '').trim() || null;
    if (!id || !name || isNaN(rate) || rate < 0) return fail(400, { error: 'Name and rate required.' });
    db.prepare('UPDATE rooms SET name = ?, floor = ?, rate = ?, description = ? WHERE id = ?').run(name, floor, rate, description, id);
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
