import { createClient } from '@libsql/client'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = resolve(__dirname, '../data/family-dashboard.db')

const client = createClient({ url: `file:${dbPath}` })

const statements = [
  `CREATE TABLE IF NOT EXISTS cards (
    id text PRIMARY KEY NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    config_json text NOT NULL DEFAULT '{}',
    owner_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_shared integer NOT NULL DEFAULT 1,
    is_admin integer NOT NULL DEFAULT 0,
    created_at integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id text PRIMARY KEY NOT NULL,
    profile_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    card_id text NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    breakpoint text NOT NULL,
    x integer NOT NULL DEFAULT 0,
    y integer NOT NULL DEFAULT 0,
    w integer NOT NULL DEFAULT 4,
    h integer NOT NULL DEFAULT 4,
    is_minimized integer NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS todo_lists (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    owner_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_shared integer NOT NULL DEFAULT 1,
    created_at integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS todo_items (
    id text PRIMARY KEY NOT NULL,
    list_id text NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
    text text NOT NULL,
    assigned_to text REFERENCES profiles(id) ON DELETE SET NULL,
    due_date text,
    priority integer NOT NULL DEFAULT 2,
    completed_at integer,
    created_at integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS grocery_items (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    category text NOT NULL DEFAULT 'other',
    quantity text,
    added_by text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_checked integer NOT NULL DEFAULT 0,
    created_at integer NOT NULL
  )`,
]

for (const sql of statements) {
  await client.execute(sql)
}

const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
console.log('Tables:', result.rows.map(r => r.name).join(', '))
console.log('Done.')
