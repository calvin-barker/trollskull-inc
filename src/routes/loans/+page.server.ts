import db from '$lib/server/db';
import { formatDateDR, advanceDate, daysBetween } from '$lib/calendar';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type Loan = { id: number; lender: string; principal: number; interest_rate: number; start_date: string; term_days: number; status: string };
type Payment = { id: number; loan_id: number; transaction_id: number; principal_portion: number; interest_portion: number };

function buildAmortization(loan: Loan, payments: Payment[], currentDate: string) {
  const paidPrincipal = payments.reduce((s, p) => s + p.principal_portion, 0);
  const paidInterest  = payments.reduce((s, p) => s + p.interest_portion, 0);
  const outstanding   = loan.principal - paidPrincipal;
  const daysElapsed   = Math.max(0, daysBetween(loan.start_date, currentDate));
  const dueDate       = advanceDate(loan.start_date, loan.term_days);
  const daysRemaining = Math.max(0, daysBetween(currentDate, dueDate));
  const accruedInterest = Math.round(outstanding * loan.interest_rate * (daysElapsed / 30));

  return { outstanding, paidPrincipal, paidInterest, accruedInterest, daysElapsed, daysRemaining, dueDate, dueDateFormatted: formatDateDR(dueDate) };
}

export const load: PageServerLoad = () => {
  const currentDate = (db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string }).value;
  const loans = db.prepare('SELECT * FROM loans ORDER BY status ASC, id DESC').all() as Loan[];
  const payments = db.prepare('SELECT * FROM loan_payments').all() as Payment[];
  const paymentsByLoan = loans.reduce((acc, l) => {
    acc[l.id] = payments.filter(p => p.loan_id === l.id);
    return acc;
  }, {} as Record<number, Payment[]>);

  return {
    currentDate,
    loans: loans.map(l => ({
      ...l,
      startDateFormatted: formatDateDR(l.start_date),
      amort: buildAmortization(l, paymentsByLoan[l.id] ?? [], currentDate),
    })),
  };
};

export const actions: Actions = {
  addLoan: async ({ request }) => {
    const form = await request.formData();
    const lender        = String(form.get('lender') ?? '').trim();
    const principal     = Number(form.get('principal'));
    const interest_rate = Number(form.get('interest_rate')) / 100;
    const start_date    = String(form.get('start_date') ?? '').trim();
    const term_days     = Number(form.get('term_days'));

    if (!lender || !start_date || isNaN(principal) || principal <= 0 || isNaN(interest_rate) || isNaN(term_days) || term_days <= 0) {
      return fail(400, { error: 'All fields required.' });
    }

    const result = db.prepare(
      'INSERT INTO loans (lender, principal, interest_rate, start_date, term_days) VALUES (?, ?, ?, ?, ?)'
    ).run(lender, principal, interest_rate, start_date, term_days);

    db.prepare('INSERT INTO transactions (date_dr, description, amount, category, loan_id) VALUES (?, ?, ?, ?, ?)').run(
      start_date, `Loan from ${lender}`, principal, 'Loan Payment', result.lastInsertRowid
    );
    return { success: true };
  },

  makePayment: async ({ request }) => {
    const form = await request.formData();
    const loan_id           = Number(form.get('loan_id'));
    const principal_portion = Number(form.get('principal_portion'));
    const interest_portion  = Number(form.get('interest_portion'));
    const date_dr           = String(form.get('date_dr') ?? '').trim();
    const total             = principal_portion + interest_portion;

    if (!loan_id || !date_dr || isNaN(total) || total <= 0) {
      return fail(400, { error: 'All fields required.' });
    }

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan_id) as Loan | undefined;
    if (!loan) return fail(404, { error: 'Loan not found.' });

    const paid = (db.prepare('SELECT COALESCE(SUM(principal_portion), 0) as paid FROM loan_payments WHERE loan_id = ?').get(loan_id) as { paid: number }).paid;
    if (paid + principal_portion > loan.principal) {
      return fail(400, { error: 'Payment exceeds outstanding principal.' });
    }

    db.transaction(() => {
      const tx = db.prepare('INSERT INTO transactions (date_dr, description, amount, category, loan_id) VALUES (?, ?, ?, ?, ?)').run(
        date_dr, `Loan payment to ${loan.lender}`, -total, 'Loan Payment', loan_id
      );
      db.prepare('INSERT INTO loan_payments (loan_id, transaction_id, principal_portion, interest_portion) VALUES (?, ?, ?, ?)').run(
        loan_id, tx.lastInsertRowid, principal_portion, interest_portion
      );
      const newPaid = paid + principal_portion;
      if (newPaid >= loan.principal) {
        db.prepare("UPDATE loans SET status = 'paid' WHERE id = ?").run(loan_id);
      }
    })();
    return { success: true };
  }
};
