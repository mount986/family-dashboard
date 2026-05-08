import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: `file:${process.env.DATABASE_URL ?? './data/family-dashboard.db'}`,
  },
})
