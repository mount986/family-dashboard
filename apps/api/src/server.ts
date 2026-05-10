import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './db/client.js'
import { profileRoutes } from './routes/profiles.js'
import { bootstrapRoutes } from './routes/bootstrap.js'
import { cardRoutes } from './routes/cards.js'
import { layoutRoutes } from './routes/layouts.js'
import { todoRoutes } from './routes/todos.js'
import { groceryRoutes } from './routes/grocery.js'
import { iframeRoutes } from './routes/iframe.js'
import { weatherRoutes } from './routes/weather.js'
import { wsRoutes } from './ws/routes.js'

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
  await server.register(cardRoutes, { prefix: '/api' })
  await server.register(layoutRoutes, { prefix: '/api' })
  await server.register(todoRoutes, { prefix: '/api' })
  await server.register(groceryRoutes, { prefix: '/api' })
  await server.register(iframeRoutes, { prefix: '/api' })
  await server.register(weatherRoutes, { prefix: '/api' })
  await server.register(wsRoutes)

  // TODO Phase 3: Register calendar routes
  // TODO Phase 3: Register weather routes

  return server
}
