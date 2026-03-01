import { daysBetween, advanceDate, formatDateDR } from './calendar';

// ── Shared types ──────────────────────────────────────────────

export type Loan = {
  id: number;
  lender: string;
  principal: number;
  interest_rate: number;
  start_date: string;
  term_days: number;
  status: string;
};

export type Payment = {
  id: number;
  loan_id: number;
  transaction_id: number;
  principal_portion: number;
  interest_portion: number;
};

export type Asset = {
  id: number;
  name: string;
  purchase_date: string;
  cost: number;
  useful_life_days: number;
  salvage_value: number;
  description: string | null;
};

export type Shareholder = {
  id: number;
  name: string;
  shares: number;
};

// ── Loan amortization ─────────────────────────────────────────

export function buildAmortization(loan: Loan, payments: Payment[], currentDate: string) {
  const paidPrincipal = payments.reduce((s, p) => s + p.principal_portion, 0);
  const paidInterest  = payments.reduce((s, p) => s + p.interest_portion, 0);
  const outstanding   = loan.principal - paidPrincipal;
  const daysElapsed   = Math.max(0, daysBetween(loan.start_date, currentDate));
  const dueDate       = advanceDate(loan.start_date, loan.term_days);
  const daysRemaining = Math.max(0, daysBetween(currentDate, dueDate));
  const accruedInterest = Math.round(outstanding * loan.interest_rate * (daysElapsed / 30));

  return { outstanding, paidPrincipal, paidInterest, accruedInterest, daysElapsed, daysRemaining, dueDate, dueDateFormatted: formatDateDR(dueDate) };
}

// ── Asset depreciation ────────────────────────────────────────

export function computeDepreciation(asset: Asset, currentDate: string) {
  const age = Math.max(0, daysBetween(asset.purchase_date, currentDate) + 1);
  const dailyDep = (asset.cost - asset.salvage_value) / asset.useful_life_days;
  const accumulated = Math.min(Math.round(dailyDep * age), asset.cost - asset.salvage_value);
  const bookValue = asset.cost - accumulated;
  const fullyDepreciated = age >= asset.useful_life_days;
  return { age, accumulated, bookValue, fullyDepreciated };
}

// ── Outstanding debt ──────────────────────────────────────────

export function computeOutstandingDebt(loans: { id: number; principal: number }[], paidMap: Record<number, number>): number {
  return loans.reduce((s, l) => s + l.principal - (paidMap[l.id] ?? 0), 0);
}

// ── Dividend distribution ─────────────────────────────────────

export function distributeDividend(shareholders: Shareholder[], totalAmount: number): { id: number; name: string; amount: number }[] {
  const totalShares = shareholders.reduce((s, sh) => s + sh.shares, 0);
  if (totalShares === 0) return [];
  return shareholders
    .map(sh => ({
      id: sh.id,
      name: sh.name,
      amount: -Math.round((sh.shares / totalShares) * totalAmount),
    }))
    .filter(d => d.amount !== 0);
}

// ── Period depreciation memo ──────────────────────────────────

export function computePeriodDepreciation(
  assets: { purchase_date: string; cost: number; useful_life_days: number; salvage_value: number }[],
  from: string,
  to: string,
): number {
  const periodDays = Math.max(0, daysBetween(from, to) + 1);
  return Math.round(
    assets.reduce((sum, a) => {
      const dailyDep = (a.cost - a.salvage_value) / a.useful_life_days;
      if (a.purchase_date <= to) {
        const assetDays = Math.min(periodDays, daysBetween(a.purchase_date, to) + 1);
        return sum + dailyDep * assetDays;
      }
      return sum;
    }, 0),
  );
}

// ── Accrued interest memo ─────────────────────────────────────

export function computeAccruedInterest(
  loans: { id: number; principal: number; interest_rate: number }[],
  paidMap: Record<number, number>,
  periodDays: number,
): number {
  const months = periodDays / 30;
  return Math.round(
    loans.reduce((sum, loan) => {
      return sum + loan.principal * loan.interest_rate * months - (paidMap[loan.id] ?? 0);
    }, 0),
  );
}
