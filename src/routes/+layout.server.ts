import db from '$lib/server/db';
import { formatDateDR } from '$lib/calendar';
import { getMoonPhase } from '$lib/moon';

export function load() {
  const row = db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string };
  const fullMoonRow = db.prepare('SELECT value FROM game_state WHERE key = ?').get('full_moon_date') as { value: string } | undefined;
  const fullMoonDate = fullMoonRow?.value ?? '1492-01-01';
  const moon = getMoonPhase(row.value, fullMoonDate);
  return {
    currentDate: row.value,
    currentDateFormatted: formatDateDR(row.value),
    fullMoonDate,
    moonPhase: moon.phase,
    moonEmoji: moon.emoji,
  };
}
