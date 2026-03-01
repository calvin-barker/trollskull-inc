import { describe, it, expect } from 'vitest';
import { formatDateDR, advanceDate, daysBetween, dateBetween, monthOptions, FR_MONTHS } from './calendar';

describe('FR_MONTHS', () => {
  it('has 17 months totaling 365 days', () => {
    expect(FR_MONTHS).toHaveLength(17);
    expect(FR_MONTHS.reduce((s, m) => s + m.days, 0)).toBe(365);
  });

  it('has 5 festival months with 1 day each', () => {
    const festivals = FR_MONTHS.filter(m => m.festival);
    expect(festivals).toHaveLength(5);
    festivals.forEach(f => expect(f.days).toBe(1));
  });

  it('has 12 regular months with 30 days each', () => {
    const regular = FR_MONTHS.filter(m => !m.festival);
    expect(regular).toHaveLength(12);
    regular.forEach(m => expect(m.days).toBe(30));
  });
});

describe('formatDateDR', () => {
  it('formats regular month dates', () => {
    expect(formatDateDR('1492-01-14')).toBe('14 Hammer, 1492 DR');
    expect(formatDateDR('1492-09-01')).toBe('1 Flamerule, 1492 DR');
    expect(formatDateDR('1492-17-30')).toBe('30 Nightal, 1492 DR');
  });

  it('formats festival days without a day number', () => {
    expect(formatDateDR('1492-02-01')).toBe('Midwinter, 1492 DR');
    expect(formatDateDR('1492-06-01')).toBe('Greengrass, 1492 DR');
    expect(formatDateDR('1492-10-01')).toBe('Midsummer, 1492 DR');
    expect(formatDateDR('1492-13-01')).toBe('Highharvestide, 1492 DR');
    expect(formatDateDR('1492-16-01')).toBe('Feast of Moon, 1492 DR');
  });

  it('handles different years', () => {
    expect(formatDateDR('1493-01-01')).toBe('1 Hammer, 1493 DR');
    expect(formatDateDR('1500-10-01')).toBe('Midsummer, 1500 DR');
  });
});

describe('advanceDate', () => {
  it('advances within a month', () => {
    expect(advanceDate('1492-01-01', 5)).toBe('1492-01-06');
    expect(advanceDate('1492-01-15', 10)).toBe('1492-01-25');
  });

  it('defaults to advancing 1 day', () => {
    expect(advanceDate('1492-01-01')).toBe('1492-01-02');
  });

  it('crosses from regular month into festival day', () => {
    // Hammer day 30 + 1 = Midwinter day 1
    expect(advanceDate('1492-01-30', 1)).toBe('1492-02-01');
  });

  it('crosses from festival day into next month', () => {
    // Midwinter + 1 = Alturiak day 1
    expect(advanceDate('1492-02-01', 1)).toBe('1492-03-01');
  });

  it('crosses multiple months', () => {
    // Hammer 30 + 2 = skip Midwinter, land on Alturiak 1
    expect(advanceDate('1492-01-30', 2)).toBe('1492-03-01');
  });

  it('handles year rollover', () => {
    // Last day of Nightal (month 17, day 30) + 1 = next year Hammer 1
    expect(advanceDate('1492-17-30', 1)).toBe('1493-01-01');
  });

  it('advances exactly 365 days = 1 year', () => {
    expect(advanceDate('1492-01-01', 365)).toBe('1493-01-01');
  });

  it('advances across multiple years', () => {
    expect(advanceDate('1492-01-01', 730)).toBe('1494-01-01');
  });
});

describe('daysBetween', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetween('1492-01-01', '1492-01-01')).toBe(0);
  });

  it('returns positive for later date', () => {
    expect(daysBetween('1492-01-01', '1492-01-02')).toBe(1);
    expect(daysBetween('1492-01-01', '1492-01-30')).toBe(29);
  });

  it('returns negative when from is after to', () => {
    expect(daysBetween('1492-01-05', '1492-01-01')).toBe(-4);
  });

  it('counts festival days correctly', () => {
    // Hammer 30 -> Midwinter 01 = 1 day
    expect(daysBetween('1492-01-30', '1492-02-01')).toBe(1);
    // Midwinter 01 -> Alturiak 01 = 1 day
    expect(daysBetween('1492-02-01', '1492-03-01')).toBe(1);
  });

  it('counts a full year as 365 days', () => {
    expect(daysBetween('1492-01-01', '1493-01-01')).toBe(365);
  });

  it('is the inverse of advanceDate', () => {
    const start = '1492-05-15';
    const days = 47;
    const end = advanceDate(start, days);
    expect(daysBetween(start, end)).toBe(days);
  });
});

describe('dateBetween', () => {
  it('returns true for date inside range', () => {
    expect(dateBetween('1492-01-15', '1492-01-01', '1492-01-30')).toBe(true);
  });

  it('returns true for date on from boundary', () => {
    expect(dateBetween('1492-01-01', '1492-01-01', '1492-01-30')).toBe(true);
  });

  it('returns true for date on to boundary', () => {
    expect(dateBetween('1492-01-30', '1492-01-01', '1492-01-30')).toBe(true);
  });

  it('returns false for date before range', () => {
    expect(dateBetween('1491-17-30', '1492-01-01', '1492-01-30')).toBe(false);
  });

  it('returns false for date after range', () => {
    expect(dateBetween('1492-03-01', '1492-01-01', '1492-01-30')).toBe(false);
  });
});

describe('monthOptions', () => {
  it('returns 17 options', () => {
    const opts = monthOptions();
    expect(opts).toHaveLength(17);
  });

  it('has zero-padded values', () => {
    const opts = monthOptions();
    expect(opts[0]).toEqual({ label: 'Hammer', value: '01' });
    expect(opts[8]).toEqual({ label: 'Flamerule', value: '09' });
    expect(opts[16]).toEqual({ label: 'Nightal', value: '17' });
  });
});
