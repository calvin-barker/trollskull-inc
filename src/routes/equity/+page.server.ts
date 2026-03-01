import db from '$lib/server/db';
import { computeOutstandingDebt, distributeDividend, type Shareholder } from '$lib/finance';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const shareholders = db.prepare('SELECT * FROM shareholders ORDER BY shares DESC').all() as Shareholder[];

  const totalShares = shareholders.reduce((s, sh) => s + sh.shares, 0);

  // Net asset value = cash balance + asset book values - outstanding loan principals
  const cash = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM transactions').get() as { total: number }).total;

  const loans = db.prepare("SELECT id, principal FROM loans WHERE status = 'active'").all() as { id: number; principal: number }[];
  const paidPrincipal = db.prepare('SELECT loan_id, SUM(principal_portion) as paid FROM loan_payments GROUP BY loan_id').all() as { loan_id: number; paid: number }[];
  const paidMap = Object.fromEntries(paidPrincipal.map(r => [r.loan_id, r.paid]));
  const outstandingDebt = computeOutstandingDebt(loans, paidMap);

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

    const shareholders = db.prepare('SELECT * FROM shareholders').all() as Shareholder[];
    const totalShares = shareholders.reduce((s, sh) => s + sh.shares, 0);
    if (totalShares === 0) return fail(400, { error: 'No shareholders.' });

    const splits = distributeDividend(shareholders, totalAmount);
    db.transaction(() => {
      for (const split of splits) {
        db.prepare('INSERT INTO transactions (date_dr, description, amount, category) VALUES (?, ?, ?, ?)').run(
          date_dr, `Dividend to ${split.name}`, split.amount, 'Dividend'
        );
      }
    })();
    return { success: true };
  }
};
