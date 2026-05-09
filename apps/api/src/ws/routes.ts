import type { FastifyPluginAsync } from 'fastify'
import { addConnection } from './broadcaster.js'

export const wsRoutes: FastifyPluginAsync = async (server) => {
  server.get('/ws', { websocket: true }, (socket) => {
    addConnection(socket)
  })
}
