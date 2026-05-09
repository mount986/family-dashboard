// Run with: pnpm --filter @family-dashboard/api db:migrate
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './client.js'

console.log('Running migrations…')
await migrate(db, { migrationsFolder: './src/db/migrations' })
console.log('Migrations complete.')
