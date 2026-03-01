import db from '$lib/server/db';
import { formatDateDR } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type Staff = { id: number; name: string; role: string; daily_wage: number; hire_date: string; status: string; notes: string | null };
type Posting = { id: number; faction: string; title: string; description: string | null; reward: number; deadline: string | null; status: string; notes: string | null };

export const load: PageServerLoad = () => {
  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;

  const staff = db.prepare('SELECT * FROM staff ORDER BY status, name').all() as Staff[];
  const postings = db.prepare('SELECT * FROM faction_postings ORDER BY status, faction').all() as Posting[];

  return {
    currentDate,
    currentDateFormatted: formatDateDR(currentDate),
    staff: staff.map(s => ({
      ...s,
      hireDateFormatted: formatDateDR(s.hire_date),
    })),
    postings: postings.map(p => ({
      ...p,
      deadlineFormatted: p.deadline ? formatDateDR(p.deadline) : null,
    })),
  };
};

export const actions: Actions = {
  addStaff: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const role = String(form.get('role') ?? '').trim();
    const daily_wage = Number(form.get('daily_wage'));
    const hire_date = String(form.get('hire_date') ?? '').trim();
    const notes = String(form.get('notes') ?? '').trim() || null;
    if (!name || !role || isNaN(daily_wage) || daily_wage < 0 || !hire_date) {
      return fail(400, { error: 'Name, role, wage, and hire date required.' });
    }
    db.prepare('INSERT INTO staff (name, role, daily_wage, hire_date, notes) VALUES (?, ?, ?, ?, ?)').run(name, role, daily_wage, hire_date, notes);
    return { success: true };
  },

  editStaff: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id'));
    const name = String(form.get('name') ?? '').trim();
    const role = String(form.get('role') ?? '').trim();
    const daily_wage = Number(form.get('daily_wage'));
    const hire_date = String(form.get('hire_date') ?? '').trim();
    const notes = String(form.get('notes') ?? '').trim() || null;
    if (!id || !name || !role || isNaN(daily_wage) || daily_wage < 0 || !hire_date) {
      return fail(400, { error: 'All fields required.' });
    }
    db.prepare('UPDATE staff SET name = ?, role = ?, daily_wage = ?, hire_date = ?, notes = ? WHERE id = ?').run(name, role, daily_wage, hire_date, notes, id);
    return { success: true };
  },

  dismissStaff: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id'));
    if (!id) return fail(400, { error: 'Staff ID required.' });
    db.prepare("UPDATE staff SET status = 'dismissed' WHERE id = ?").run(id);
    return { success: true };
  },

  payStaff: async ({ request }) => {
    const form = await request.formData();
    const staff_id = Number(form.get('staff_id'));
    const days = Number(form.get('days'));
    const date_dr = String(form.get('date_dr') ?? '').trim();
    if (!staff_id || isNaN(days) || days <= 0 || !date_dr) {
      return fail(400, { error: 'Staff, days, and date required.' });
    }
    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(staff_id) as Staff | undefined;
    if (!staff) return fail(404, { error: 'Staff not found.' });
    const amount = -(staff.daily_wage * days);
    db.prepare('INSERT INTO transactions (date_dr, description, amount, category, person, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
      date_dr, `Wages: ${staff.name} (${days} days)`, amount, 'Wages', staff.name, `${staff.role} @ ${staff.daily_wage} gp/day`
    );
    return { success: true };
  },

  addPosting: async ({ request }) => {
    const form = await request.formData();
    const faction = String(form.get('faction') ?? '').trim();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim() || null;
    const reward = Number(form.get('reward') ?? 0);
    const deadline = String(form.get('deadline') ?? '').trim() || null;
    const notes = String(form.get('notes') ?? '').trim() || null;
    if (!faction || !title) return fail(400, { error: 'Faction and title required.' });
    db.prepare('INSERT INTO faction_postings (faction, title, description, reward, deadline, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
      faction, title, description, reward, deadline, notes
    );
    return { success: true };
  },

  editPosting: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id'));
    const faction = String(form.get('faction') ?? '').trim();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim() || null;
    const reward = Number(form.get('reward') ?? 0);
    const deadline = String(form.get('deadline') ?? '').trim() || null;
    const notes = String(form.get('notes') ?? '').trim() || null;
    if (!id || !faction || !title) return fail(400, { error: 'Faction and title required.' });
    db.prepare('UPDATE faction_postings SET faction = ?, title = ?, description = ?, reward = ?, deadline = ?, notes = ? WHERE id = ?').run(
      faction, title, description, reward, deadline, notes, id
    );
    return { success: true };
  },

  acceptPosting: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id'));
    if (!id) return fail(400, { error: 'Posting ID required.' });
    const posting = db.prepare('SELECT * FROM faction_postings WHERE id = ?').get(id) as Posting | undefined;
    if (!posting) return fail(404, { error: 'Posting not found.' });
    if (posting.status !== 'open') return fail(400, { error: 'Only open postings can be accepted.' });
    db.prepare("UPDATE faction_postings SET status = 'accepted' WHERE id = ?").run(id);
    return { success: true };
  },

  completePosting: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get('id'));
    if (!id) return fail(400, { error: 'Posting ID required.' });
    const posting = db.prepare('SELECT * FROM faction_postings WHERE id = ?').get(id) as Posting | undefined;
    if (!posting) return fail(404, { error: 'Posting not found.' });

    const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;

    db.transaction(() => {
      db.prepare("UPDATE faction_postings SET status = 'completed' WHERE id = ?").run(id);
      if (posting.reward > 0) {
        db.prepare('INSERT INTO transactions (date_dr, description, amount, category, person, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
          currentDate, `Contract: ${posting.title}`, posting.reward, 'Contract', posting.faction, posting.description
        );
      }
    })();
    return { success: true };
  },
};
