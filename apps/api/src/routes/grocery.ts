import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { CreateGroceryItemInput, UpdateGroceryItemInput } from '@family-dashboard/types'
import * as groceryService from '../services/grocery.js'
import { broadcast } from '../ws/broadcaster.js'

async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true })
  } catch {
    return reply.code(401).send({ error: 'unauthorized', message: 'Authentication required', statusCode: 401 })
  }
}

export const groceryRoutes: FastifyPluginAsync = async (server) => {

  // ── GET /api/grocery — all items ─────────────────────────────────────────
  server.get('/grocery', { preHandler: requireSession }, async () => {
    const data = await groceryService.listItems()
    return { data }
  })

  // ── POST /api/grocery — add item ─────────────────────────────────────────
  server.post<{ Body: CreateGroceryItemInput }>(
    '/grocery',
    {
      preHandler: requireSession,
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name:     { type: 'string', minLength: 1, maxLength: 200 },
            category: { type: 'string', enum: ['produce','dairy','meat','pantry','frozen','beverages','household','other'] },
            quantity: { type: 'string', maxLength: 50 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const item = await groceryService.createItem(request.user.profileId, request.body)
      broadcast({ type: 'grocery_changed' })
      return reply.code(201).send({ data: item })
    }
  )

  // ── PATCH /api/grocery/:id — update item ─────────────────────────────────
  server.patch<{ Params: { id: string }; Body: UpdateGroceryItemInput }>(
    '/grocery/:id',
    {
      preHandler: requireSession,
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          properties: {
            name:      { type: 'string', minLength: 1, maxLength: 200 },
            category:  { type: 'string', enum: ['produce','dairy','meat','pantry','frozen','beverages','household','other'] },
            quantity:  { type: ['string', 'null'], maxLength: 50 },
            isChecked: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const item = await groceryService.updateItem(request.params.id, request.body)
      if (!item) return reply.code(404).send({ error: 'not_found', message: 'Item not found', statusCode: 404 })
      broadcast({ type: 'grocery_changed' })
      return { data: item }
    }
  )

  // ── DELETE /api/grocery/:id — delete item ────────────────────────────────
  server.delete<{ Params: { id: string } }>(
    '/grocery/:id',
    {
      preHandler: requireSession,
      schema: { params: { type: 'object', properties: { id: { type: 'string' } } } },
    },
    async (request, reply) => {
      await groceryService.deleteItem(request.params.id)
      broadcast({ type: 'grocery_changed' })
      return reply.code(204).send()
    }
  )

  // ── DELETE /api/grocery/checked — clear all checked items ────────────────
  server.delete(
    '/grocery/checked',
    { preHandler: requireSession },
    async (_request, reply) => {
      await groceryService.clearChecked()
      broadcast({ type: 'grocery_changed' })
      return reply.code(204).send()
    }
  )
}
