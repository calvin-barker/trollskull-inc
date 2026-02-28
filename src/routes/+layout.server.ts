import db from '$lib/server/db';
import { formatDateDR } from '$lib/calendar';

export function load() {
  const row = db.prepare('SELECT value FROM game_state WHERE key = ?').get('current_date') as { value: string };
  return {
    currentDate: row.value,
    currentDateFormatted: formatDateDR(row.value)
  };
}
