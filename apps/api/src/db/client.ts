import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import * as schema from './schema.js'

const dbPath = process.env.DATABASE_URL ?? './data/family-dashboard.db'

// Ensure the data directory exists (libsql uses a file:// URL for local SQLite)
const resolvedPath = resolve(dbPath)
mkdirSync(dirname(resolvedPath), { recursive: true })

const client = createClient({
  url: `file:${resolvedPath}`,
})

export const db = drizzle(client, { schema })
export type DB = typeof db
