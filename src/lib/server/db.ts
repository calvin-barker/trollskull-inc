import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { join } from 'path';

mkdirSync('data', { recursive: true });

const db = new Database('data/trollskull.db');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(join(process.cwd(), 'src/lib/server/schema.sql'), 'utf-8');
db.exec(schema);

// Migration: add person column to transactions (idempotent)
const cols = db.pragma('table_info(transactions)') as { name: string }[];
if (!cols.some(c => c.name === 'person')) {
  db.exec('ALTER TABLE transactions ADD COLUMN person TEXT');
}

export default db;
