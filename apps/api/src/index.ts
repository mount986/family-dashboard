import { buildServer } from './server.js'

const server = await buildServer()

try {
  await server.listen({
    port: Number(process.env.PORT ?? 3001),
    host: '0.0.0.0',
  })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
