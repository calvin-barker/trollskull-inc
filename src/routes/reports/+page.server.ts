import db from '$lib/server/db';
import { formatDateDR, daysBetween } from '$lib/calendar';
import { computePeriodDepreciation, computeAccruedInterest } from '$lib/finance';
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
  const depreciationMemo = computePeriodDepreciation(assets, from, to);

  // Accrued interest memo
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

  const accruedInterestMemo = computeAccruedInterest(loans, paidMap, periodDays);

  return {
    from, to,
    fromFormatted: formatDateDR(from),
    toFormatted: formatDateDR(to),
    revenueRows,
    expenseRows: expenseRows.map(r => ({ ...r, total: Math.abs(r.total) })),
    totalRevenue,
    totalExpenses: Math.abs(totalExpenses),
    netIncome,
    depreciationMemo,
    accruedInterestMemo,
  };
};
