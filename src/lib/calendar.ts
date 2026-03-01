export const FR_MONTHS = [
  { num: 1,  name: 'Hammer',         days: 30, festival: false },
  { num: 2,  name: 'Midwinter',      days: 1,  festival: true  },
  { num: 3,  name: 'Alturiak',       days: 30, festival: false },
  { num: 4,  name: 'Ches',           days: 30, festival: false },
  { num: 5,  name: 'Tarsakh',        days: 30, festival: false },
  { num: 6,  name: 'Greengrass',     days: 1,  festival: true  },
  { num: 7,  name: 'Mirtul',         days: 30, festival: false },
  { num: 8,  name: 'Kythorn',        days: 30, festival: false },
  { num: 9,  name: 'Flamerule',      days: 30, festival: false },
  { num: 10, name: 'Midsummer',      days: 1,  festival: true  },
  { num: 11, name: 'Eleasis',        days: 30, festival: false },
  { num: 12, name: 'Eleint',         days: 30, festival: false },
  { num: 13, name: 'Highharvestide', days: 1,  festival: true  },
  { num: 14, name: 'Marpenoth',      days: 30, festival: false },
  { num: 15, name: 'Uktar',          days: 30, festival: false },
  { num: 16, name: 'Feast of Moon',  days: 1,  festival: true  },
  { num: 17, name: 'Nightal',        days: 30, festival: false },
] as const;

const YEAR_DAYS = 365;
const BASE_YEAR = 1492;

/** Convert 'YYYY-MM-DD' (FR, MM = 01–17) to an absolute day count from 1492-01-01 */
export function dateToAbsDay(dateDR: string): number {
  const [year, month, day] = dateDR.split('-').map(Number);
  const yearOffset = (year - BASE_YEAR) * YEAR_DAYS;
  let monthOffset = 0;
  for (let i = 0; i < month - 1; i++) {
    monthOffset += FR_MONTHS[i].days;
  }
  return yearOffset + monthOffset + (day - 1);
}

/** Convert absolute day count back to 'YYYY-MM-DD' (FR) */
export function absDayToDate(absDay: number): string {
  const year = BASE_YEAR + Math.floor(absDay / YEAR_DAYS);
  let remaining = absDay % YEAR_DAYS;
  for (let i = 0; i < FR_MONTHS.length; i++) {
    if (remaining < FR_MONTHS[i].days) {
      const month = String(i + 1).padStart(2, '0');
      const day = String(remaining + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    remaining -= FR_MONTHS[i].days;
  }
  throw new Error(`Cannot convert absDay ${absDay} to FR date`);
}

/** Format 'YYYY-MM-DD' (FR) for display: "14 Flamerule, 1492 DR" */
export function formatDateDR(dateDR: string): string {
  const [year, month, day] = dateDR.split('-').map(Number);
  const m = FR_MONTHS[month - 1];
  if (m.festival) return `${m.name}, ${year} DR`;
  return `${day} ${m.name}, ${year} DR`;
}

/** Add `days` in-game days to a FR date string */
export function advanceDate(dateDR: string, days = 1): string {
  return absDayToDate(dateToAbsDay(dateDR) + days);
}

/** Count in-game days between two FR date strings (to - from) */
export function daysBetween(from: string, to: string): number {
  return dateToAbsDay(to) - dateToAbsDay(from);
}

/** Return true if `date` is between `from` and `to` (inclusive) */
export function dateBetween(date: string, from: string, to: string): boolean {
  const d = dateToAbsDay(date);
  return d >= dateToAbsDay(from) && d <= dateToAbsDay(to);
}

/** Return list of { label, value } for building date-picker selects */
export function monthOptions() {
  return FR_MONTHS.map(m => ({ label: m.name, value: String(m.num).padStart(2, '0') }));
}

/** Validate a FR date string 'YYYY-MM-DD' against the Harptos calendar */
export function isValidFRDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (year < 1) return false;
  if (month < 1 || month > FR_MONTHS.length) return false;
  const m = FR_MONTHS[month - 1];
  return day >= 1 && day <= m.days;
}

/** Build a zero-padded FR date string from components */
export function buildDateStr(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
