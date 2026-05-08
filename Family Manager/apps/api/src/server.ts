import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './db/client.js'
import { profileRoutes } from './routes/profiles.js'
import { bootstrapRoutes } from './routes/bootstrap.js'

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      ...(process.env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty' } }
        : {}),
    },
  })

  // ── Run migrations on startup ─────────────────────────────────────────────
  await migrate(db, { migrationsFolder: './src/db/migrations' })
  server.log.info('Database migrations applied')

  // ── Plugins ───────────────────────────────────────────────────────────────

  await server.register(cors, {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })

  await server.register(cookie)

  await server.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    cookie: {
      cookieName: 'session',
      signed: false,
    },
  })

  await server.register(websocket)

  // ── Routes ────────────────────────────────────────────────────────────────

  server.get('/health', async () => ({ status: 'ok', ts: Date.now() }))

  await server.register(bootstrapRoutes, { prefix: '/api' })
  await server.register(profileRoutes, { prefix: '/api' })

  // TODO Phase 1: Register layout routes
  // TODO Phase 2: Register todo routes
  // TODO Phase 2: Register grocery routes
  // TODO Phase 2: Register WebSocket handler
  // TODO Phase 3: Register calendar routes
  // TODO Phase 3: Register weather routes

  return server
}
