import { describe, it, expect } from 'vitest';
import {
  buildAmortization,
  computeDepreciation,
  computeOutstandingDebt,
  distributeDividend,
  computePeriodDepreciation,
  computeAccruedInterest,
  type Loan,
  type Payment,
  type Asset,
  type Shareholder,
} from './finance';

// ── Helpers ───────────────────────────────────────────────────

function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: 1, lender: 'Mirt', principal: 1000, interest_rate: 0.1,
    start_date: '1492-01-01', term_days: 365, status: 'active',
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 1, loan_id: 1, transaction_id: 1,
    principal_portion: 100, interest_portion: 10,
    ...overrides,
  };
}

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 1, name: 'Bar counter', purchase_date: '1492-01-01',
    cost: 3000, useful_life_days: 365, salvage_value: 0, description: null,
    ...overrides,
  };
}

// ── buildAmortization ─────────────────────────────────────────

describe('buildAmortization', () => {
  it('computes full amortization with no payments', () => {
    const loan = makeLoan();
    const result = buildAmortization(loan, [], '1492-01-01');
    expect(result.outstanding).toBe(1000);
    expect(result.paidPrincipal).toBe(0);
    expect(result.paidInterest).toBe(0);
    expect(result.daysElapsed).toBe(0);
    expect(result.daysRemaining).toBe(365);
    expect(result.accruedInterest).toBe(0);
  });

  it('reduces outstanding principal by payments', () => {
    const loan = makeLoan();
    const payments = [makePayment({ principal_portion: 200, interest_portion: 15 })];
    const result = buildAmortization(loan, payments, '1492-01-01');
    expect(result.outstanding).toBe(800);
    expect(result.paidPrincipal).toBe(200);
    expect(result.paidInterest).toBe(15);
  });

  it('accrues interest over time', () => {
    const loan = makeLoan({ principal: 3000, interest_rate: 0.1 });
    // 30 days elapsed => 1 month => accrued = 3000 * 0.1 * (30/30) = 300
    const result = buildAmortization(loan, [], '1492-01-31');
    expect(result.daysElapsed).toBe(30);
    expect(result.accruedInterest).toBe(300);
  });

  it('calculates due date and remaining days', () => {
    const loan = makeLoan({ start_date: '1492-01-01', term_days: 60 });
    // 10 days in => 50 remaining
    const result = buildAmortization(loan, [], '1492-01-11');
    expect(result.daysElapsed).toBe(10);
    expect(result.daysRemaining).toBe(50);
  });

  it('clamps daysRemaining to 0 when past due', () => {
    const loan = makeLoan({ term_days: 10 });
    const result = buildAmortization(loan, [], '1492-01-30');
    expect(result.daysRemaining).toBe(0);
  });

  it('formats the due date', () => {
    // Hammer has 30 days, so 30 days from day 1 = Midwinter (month 02)
    const loan = makeLoan({ start_date: '1492-01-01', term_days: 30 });
    const result = buildAmortization(loan, [], '1492-01-01');
    expect(result.dueDate).toBe('1492-02-01');
    expect(result.dueDateFormatted).toBe('Midwinter, 1492 DR');
  });

  it('handles multiple payments', () => {
    const loan = makeLoan({ principal: 1000 });
    const payments = [
      makePayment({ principal_portion: 100, interest_portion: 10 }),
      makePayment({ id: 2, principal_portion: 150, interest_portion: 20 }),
    ];
    const result = buildAmortization(loan, payments, '1492-01-01');
    expect(result.outstanding).toBe(750);
    expect(result.paidPrincipal).toBe(250);
    expect(result.paidInterest).toBe(30);
  });
});

// ── computeDepreciation ───────────────────────────────────────

describe('computeDepreciation', () => {
  it('computes daily depreciation from day 1', () => {
    // cost 3650, salvage 0, life 365 => dailyDep = 10/day
    // On purchase date: age = 1, accumulated = 10
    const asset = makeAsset({ cost: 3650, useful_life_days: 365, salvage_value: 0 });
    const result = computeDepreciation(asset, '1492-01-01');
    expect(result.age).toBe(1);
    expect(result.accumulated).toBe(10);
    expect(result.bookValue).toBe(3640);
    expect(result.fullyDepreciated).toBe(false);
  });

  it('caps accumulated depreciation at cost minus salvage', () => {
    const asset = makeAsset({ cost: 1000, useful_life_days: 100, salvage_value: 200 });
    // way past useful life
    const result = computeDepreciation(asset, '1492-09-01');
    expect(result.accumulated).toBe(800); // cost - salvage
    expect(result.bookValue).toBe(200);   // salvage value
    expect(result.fullyDepreciated).toBe(true);
  });

  it('respects salvage value', () => {
    // cost 1000, salvage 400, life 30 => dailyDep = 20/day
    // age 30 => accumulated = min(round(20*30), 600) = 600
    const asset = makeAsset({ cost: 1000, useful_life_days: 30, salvage_value: 400 });
    const result = computeDepreciation(asset, '1492-01-30');
    expect(result.accumulated).toBe(600);
    expect(result.bookValue).toBe(400);
    expect(result.fullyDepreciated).toBe(true);
  });

  it('returns 0 accumulated if current date is before purchase', () => {
    const asset = makeAsset({ purchase_date: '1492-03-01' });
    const result = computeDepreciation(asset, '1492-01-01');
    expect(result.age).toBe(0);
    expect(result.accumulated).toBe(0);
    expect(result.bookValue).toBe(asset.cost);
  });
});

// ── computeOutstandingDebt ────────────────────────────────────

describe('computeOutstandingDebt', () => {
  it('returns 0 with no loans', () => {
    expect(computeOutstandingDebt([], {})).toBe(0);
  });

  it('returns full principal when nothing paid', () => {
    const loans = [{ id: 1, principal: 1000 }, { id: 2, principal: 500 }];
    expect(computeOutstandingDebt(loans, {})).toBe(1500);
  });

  it('subtracts paid amounts', () => {
    const loans = [{ id: 1, principal: 1000 }, { id: 2, principal: 500 }];
    const paidMap = { 1: 300, 2: 200 };
    expect(computeOutstandingDebt(loans, paidMap)).toBe(1000);
  });
});

// ── distributeDividend ────────────────────────────────────────

describe('distributeDividend', () => {
  it('splits proportionally by shares', () => {
    const shareholders: Shareholder[] = [
      { id: 1, name: 'Renaer', shares: 50 },
      { id: 2, name: 'Volo', shares: 50 },
    ];
    const splits = distributeDividend(shareholders, 100);
    expect(splits).toHaveLength(2);
    expect(splits[0]).toEqual({ id: 1, name: 'Renaer', amount: -50 });
    expect(splits[1]).toEqual({ id: 2, name: 'Volo', amount: -50 });
  });

  it('handles uneven splits with rounding', () => {
    const shareholders: Shareholder[] = [
      { id: 1, name: 'A', shares: 1 },
      { id: 2, name: 'B', shares: 2 },
    ];
    const splits = distributeDividend(shareholders, 100);
    expect(splits[0].amount).toBe(-33);  // round(1/3 * 100)
    expect(splits[1].amount).toBe(-67);  // round(2/3 * 100)
  });

  it('returns empty array when no shareholders', () => {
    expect(distributeDividend([], 100)).toEqual([]);
  });

  it('returns empty array when total shares is 0', () => {
    const shareholders: Shareholder[] = [{ id: 1, name: 'A', shares: 0 }];
    expect(distributeDividend(shareholders, 100)).toEqual([]);
  });

  it('filters out zero-amount splits', () => {
    // 1 share out of 10000, amount 1 => round(1/10000 * 1) = 0 => filtered
    const shareholders: Shareholder[] = [
      { id: 1, name: 'Big', shares: 9999 },
      { id: 2, name: 'Tiny', shares: 1 },
    ];
    const splits = distributeDividend(shareholders, 1);
    expect(splits).toHaveLength(1);
    expect(splits[0].name).toBe('Big');
  });
});

// ── computePeriodDepreciation ─────────────────────────────────

describe('computePeriodDepreciation', () => {
  it('computes depreciation for the full period', () => {
    // cost 3000, salvage 0, life 300 => dailyDep = 10/day
    // period: 30 days, asset purchased at start => 30 * 10 = 300
    const assets = [{ purchase_date: '1492-01-01', cost: 3000, useful_life_days: 300, salvage_value: 0 }];
    expect(computePeriodDepreciation(assets, '1492-01-01', '1492-01-30')).toBe(300);
  });

  it('excludes assets purchased after the period', () => {
    const assets = [{ purchase_date: '1492-03-01', cost: 3000, useful_life_days: 300, salvage_value: 0 }];
    expect(computePeriodDepreciation(assets, '1492-01-01', '1492-01-30')).toBe(0);
  });

  it('pro-rates assets purchased during the period', () => {
    // Asset purchased on day 16 of a 30-day period (1492-01-01 to 1492-01-30)
    // assetDays = min(30, daysBetween('1492-01-16', '1492-01-30') + 1) = min(30, 15) = 15
    // dailyDep = 3000/300 = 10
    // total = 150
    const assets = [{ purchase_date: '1492-01-16', cost: 3000, useful_life_days: 300, salvage_value: 0 }];
    expect(computePeriodDepreciation(assets, '1492-01-01', '1492-01-30')).toBe(150);
  });

  it('sums multiple assets', () => {
    const assets = [
      { purchase_date: '1492-01-01', cost: 3000, useful_life_days: 300, salvage_value: 0 },
      { purchase_date: '1492-01-01', cost: 1500, useful_life_days: 300, salvage_value: 0 },
    ];
    // (10 + 5) * 30 = 450
    expect(computePeriodDepreciation(assets, '1492-01-01', '1492-01-30')).toBe(450);
  });

  it('returns 0 for empty assets', () => {
    expect(computePeriodDepreciation([], '1492-01-01', '1492-01-30')).toBe(0);
  });
});

// ── computeAccruedInterest ────────────────────────────────────

describe('computeAccruedInterest', () => {
  it('computes interest for a full month', () => {
    // principal 1000, rate 0.1, period 30 days (1 month)
    // accrued = 1000 * 0.1 * 1 = 100
    const loans = [{ id: 1, principal: 1000, interest_rate: 0.1 }];
    expect(computeAccruedInterest(loans, {}, 30)).toBe(100);
  });

  it('subtracts paid interest', () => {
    const loans = [{ id: 1, principal: 1000, interest_rate: 0.1 }];
    // accrued 100 - paid 40 = 60
    expect(computeAccruedInterest(loans, { 1: 40 }, 30)).toBe(60);
  });

  it('sums across multiple loans', () => {
    const loans = [
      { id: 1, principal: 1000, interest_rate: 0.1 },
      { id: 2, principal: 2000, interest_rate: 0.05 },
    ];
    // loan1: 1000 * 0.1 * 1 = 100, loan2: 2000 * 0.05 * 1 = 100
    expect(computeAccruedInterest(loans, {}, 30)).toBe(200);
  });

  it('pro-rates for partial months', () => {
    const loans = [{ id: 1, principal: 3000, interest_rate: 0.1 }];
    // 15 days = 0.5 months => 3000 * 0.1 * 0.5 = 150
    expect(computeAccruedInterest(loans, {}, 15)).toBe(150);
  });

  it('returns 0 with no loans', () => {
    expect(computeAccruedInterest([], {}, 30)).toBe(0);
  });
});
