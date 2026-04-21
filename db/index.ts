import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'work-manager.db');
const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  // migrations
  try { db.exec('ALTER TABLE tasks ADD COLUMN scheduled_date TEXT'); } catch {}
  try { db.exec(`CREATE TABLE IF NOT EXISTS report_docs (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, title TEXT, content TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`); } catch {}
  // migration: add scheduled_date if not exists
  // migrate old is_today=1 tasks to scheduled_date = today
  db.exec(`UPDATE tasks SET scheduled_date = date('now') WHERE is_today = 1 AND scheduled_date IS NULL AND status NOT IN ('done','archived')`);

  return db;
}
