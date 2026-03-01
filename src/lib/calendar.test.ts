import { describe, it, expect } from 'vitest';
import { formatDateDR, advanceDate, daysBetween, dateBetween, monthOptions, FR_MONTHS, dateToAbsDay, absDayToDate, isValidFRDate, buildDateStr } from './calendar';

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

describe('dateToAbsDay / absDayToDate', () => {
  it('base date returns 0', () => {
    expect(dateToAbsDay('1492-01-01')).toBe(0);
  });

  it('end of first month returns 29', () => {
    expect(dateToAbsDay('1492-01-30')).toBe(29);
  });

  it('Midwinter (festival) returns 30', () => {
    expect(dateToAbsDay('1492-02-01')).toBe(30);
  });

  it('first day of next year returns 365', () => {
    expect(dateToAbsDay('1493-01-01')).toBe(365);
  });

  it('round-trips through absDayToDate', () => {
    for (const d of ['1492-01-01', '1492-02-01', '1492-09-15', '1492-17-30', '1493-01-01']) {
      expect(absDayToDate(dateToAbsDay(d))).toBe(d);
    }
  });

  it('absDayToDate(30) is Midwinter', () => {
    expect(absDayToDate(30)).toBe('1492-02-01');
  });
});

describe('isValidFRDate', () => {
  it('accepts valid regular month dates', () => {
    expect(isValidFRDate('1492-01-01')).toBe(true);
    expect(isValidFRDate('1492-01-30')).toBe(true);
    expect(isValidFRDate('1492-17-30')).toBe(true);
  });

  it('accepts valid festival dates', () => {
    expect(isValidFRDate('1492-02-01')).toBe(true);
    expect(isValidFRDate('1492-06-01')).toBe(true);
  });

  it('rejects day 0', () => {
    expect(isValidFRDate('1492-01-00')).toBe(false);
  });

  it('rejects day > max for month', () => {
    expect(isValidFRDate('1492-01-31')).toBe(false);
    expect(isValidFRDate('1492-02-02')).toBe(false); // festival has only 1 day
  });

  it('rejects month 0 and month 18', () => {
    expect(isValidFRDate('1492-00-01')).toBe(false);
    expect(isValidFRDate('1492-18-01')).toBe(false);
  });

  it('rejects malformed strings', () => {
    expect(isValidFRDate('not-a-date')).toBe(false);
    expect(isValidFRDate('1492-1-1')).toBe(false);
    expect(isValidFRDate('')).toBe(false);
  });
});

describe('buildDateStr', () => {
  it('zero-pads components', () => {
    expect(buildDateStr(1492, 1, 1)).toBe('1492-01-01');
    expect(buildDateStr(1492, 17, 30)).toBe('1492-17-30');
  });

  it('handles small year numbers', () => {
    expect(buildDateStr(1, 1, 1)).toBe('0001-01-01');
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
