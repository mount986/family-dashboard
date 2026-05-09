// Recreates tables that have FK constraints as identical tables without them.
// Preserves all existing data. Safe to run multiple times (IF NOT EXISTS guards).
import { createClient } from '@libsql/client'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = resolve(__dirname, '../data/family-dashboard.db')
const client = createClient({ url: `file:${dbPath}` })

await client.execute('PRAGMA foreign_keys = OFF')

// ── cards: drop owner_id FK ───────────────────────────────────────────────────
await client.execute(`CREATE TABLE IF NOT EXISTS cards_new (
  id text PRIMARY KEY NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  config_json text NOT NULL DEFAULT '{}',
  owner_id text NOT NULL,
  is_shared integer NOT NULL DEFAULT 1,
  is_admin integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL
)`)
await client.execute(`INSERT OR IGNORE INTO cards_new SELECT * FROM cards`)
await client.execute(`DROP TABLE cards`)
await client.execute(`ALTER TABLE cards_new RENAME TO cards`)

// ── dashboard_layouts: drop profile_id + card_id FKs ─────────────────────────
await client.execute(`CREATE TABLE IF NOT EXISTS dashboard_layouts_new (
  id text PRIMARY KEY NOT NULL,
  profile_id text NOT NULL,
  card_id text NOT NULL,
  breakpoint text NOT NULL,
  x integer NOT NULL DEFAULT 0,
  y integer NOT NULL DEFAULT 0,
  w integer NOT NULL DEFAULT 4,
  h integer NOT NULL DEFAULT 4,
  is_minimized integer NOT NULL DEFAULT 0
)`)
await client.execute(`INSERT OR IGNORE INTO dashboard_layouts_new SELECT * FROM dashboard_layouts`)
await client.execute(`DROP TABLE dashboard_layouts`)
await client.execute(`ALTER TABLE dashboard_layouts_new RENAME TO dashboard_layouts`)

// ── todo_lists: drop owner_id FK ─────────────────────────────────────────────
await client.execute(`CREATE TABLE IF NOT EXISTS todo_lists_new (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  owner_id text NOT NULL,
  is_shared integer NOT NULL DEFAULT 1,
  created_at integer NOT NULL
)`)
await client.execute(`INSERT OR IGNORE INTO todo_lists_new SELECT * FROM todo_lists`)
await client.execute(`DROP TABLE todo_lists`)
await client.execute(`ALTER TABLE todo_lists_new RENAME TO todo_lists`)

// ── todo_items: drop list_id + assigned_to FKs ───────────────────────────────
await client.execute(`CREATE TABLE IF NOT EXISTS todo_items_new (
  id text PRIMARY KEY NOT NULL,
  list_id text NOT NULL,
  text text NOT NULL,
  assigned_to text,
  due_date text,
  priority integer NOT NULL DEFAULT 2,
  completed_at integer,
  created_at integer NOT NULL
)`)
await client.execute(`INSERT OR IGNORE INTO todo_items_new SELECT * FROM todo_items`)
await client.execute(`DROP TABLE todo_items`)
await client.execute(`ALTER TABLE todo_items_new RENAME TO todo_items`)

// ── grocery_items: drop added_by FK ──────────────────────────────────────────
await client.execute(`CREATE TABLE IF NOT EXISTS grocery_items_new (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  quantity text,
  added_by text NOT NULL,
  is_checked integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL
)`)
await client.execute(`INSERT OR IGNORE INTO grocery_items_new SELECT * FROM grocery_items`)
await client.execute(`DROP TABLE grocery_items`)
await client.execute(`ALTER TABLE grocery_items_new RENAME TO grocery_items`)

const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
console.log('Tables:', result.rows.map(r => r.name).join(', '))
console.log('Done — FK constraints removed.')
