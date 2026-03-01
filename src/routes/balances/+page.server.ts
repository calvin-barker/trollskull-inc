import db from '$lib/server/db';
import { formatDateDR } from '$lib/calendar';
import { computeDepreciation, type Asset, type Loan, type Payment } from '$lib/finance';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;

  // Cash
  const cash = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM transactions').get() as { total: number }).total;

  // Assets with depreciation
  const assets = db.prepare('SELECT * FROM assets ORDER BY purchase_date DESC').all() as Asset[];
  const assetsWithDep = assets.map(a => {
    const dep = computeDepreciation(a, currentDate);
    return {
      id: a.id,
      name: a.name,
      cost: a.cost,
      purchaseDateFormatted: formatDateDR(a.purchase_date),
      bookValue: dep.bookValue,
      fullyDepreciated: dep.fullyDepreciated,
    };
  });
  const totalBookValue = assetsWithDep.reduce((sum, a) => sum + a.bookValue, 0);

  // Liabilities (active loans with outstanding principal)
  const loans = db.prepare("SELECT * FROM loans WHERE status = 'active' ORDER BY id DESC").all() as Loan[];
  const payments = db.prepare('SELECT * FROM loan_payments').all() as Payment[];
  const paidByLoan: Record<number, number> = {};
  for (const p of payments) {
    paidByLoan[p.loan_id] = (paidByLoan[p.loan_id] ?? 0) + p.principal_portion;
  }

  const loansWithOutstanding = loans.map(l => ({
    id: l.id,
    lender: l.lender,
    principal: l.principal,
    outstanding: l.principal - (paidByLoan[l.id] ?? 0),
    startDateFormatted: formatDateDR(l.start_date),
  }));
  const totalDebt = loansWithOutstanding.reduce((s, l) => s + l.outstanding, 0);

  // Totals
  const totalAssets = cash + totalBookValue;
  const netWorth = totalAssets - totalDebt;

  return {
    currentDateFormatted: formatDateDR(currentDate),
    cash,
    assets: assetsWithDep,
    totalBookValue,
    loans: loansWithOutstanding,
    totalDebt,
    totalAssets,
    netWorth,
  };
};
