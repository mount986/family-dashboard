import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { CreateTodoItemInput, UpdateTodoItemInput } from '@family-dashboard/types'
import * as todoService from '../services/todos.js'
import * as cardService from '../services/cards.js'

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true })
  } catch {
    return reply.code(401).send({ error: 'unauthorized', message: 'Authentication required', statusCode: 401 })
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const todoRoutes: FastifyPluginAsync = async (server) => {

  // ── POST /api/todos/lists — create a list and link it to a card ───────────
  server.post<{ Body: { name: string; cardId: string } }>(
    '/todos/lists',
    {
      preHandler: requireSession,
      schema: {
        body: {
          type: 'object',
          required: ['name', 'cardId'],
          properties: {
            name:   { type: 'string', minLength: 1, maxLength: 100 },
            cardId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { profileId } = request.user
      const { name, cardId } = request.body

      const list = await todoService.createList(profileId, name)

      // Store the listId in the card's config
      await cardService.updateCard(cardId, { config: { listId: list.id } })

      return reply.code(201).send({ data: list })
    }
  )

  // ── GET /api/todos/lists/:listId — get list + items ───────────────────────
  server.get<{ Params: { listId: string } }>(
    '/todos/lists/:listId',
    { preHandler: requireSession },
    async (request, reply) => {
      const { listId } = request.params
      const [list, items] = await Promise.all([
        todoService.getList(listId),
        todoService.getItems(listId),
      ])
      if (!list) return reply.code(404).send({ error: 'not_found', message: 'List not found', statusCode: 404 })
      return { data: { list, items } }
    }
  )

  // ── POST /api/todos/lists/:listId/items — add item ────────────────────────
  server.post<{ Params: { listId: string }; Body: CreateTodoItemInput }>(
    '/todos/lists/:listId/items',
    {
      preHandler: requireSession,
      schema: {
        params: { type: 'object', properties: { listId: { type: 'string' } } },
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text:       { type: 'string', minLength: 1, maxLength: 500 },
            assignedTo: { type: 'string' },
            dueDate:    { type: 'string' },
            priority:   { type: 'number', enum: [1, 2, 3] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const item = await todoService.createItem(request.params.listId, request.body)
      return reply.code(201).send({ data: item })
    }
  )

  // ── PATCH /api/todos/lists/:listId/items/:itemId — update item ────────────
  server.patch<{ Params: { listId: string; itemId: string }; Body: UpdateTodoItemInput }>(
    '/todos/lists/:listId/items/:itemId',
    {
      preHandler: requireSession,
      schema: {
        params: {
          type: 'object',
          properties: { listId: { type: 'string' }, itemId: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            text:        { type: 'string', minLength: 1, maxLength: 500 },
            assignedTo:  { type: ['string', 'null'] },
            dueDate:     { type: ['string', 'null'] },
            priority:    { type: 'number', enum: [1, 2, 3] },
            completedAt: { type: ['string', 'null'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const item = await todoService.updateItem(request.params.itemId, request.body)
      if (!item) return reply.code(404).send({ error: 'not_found', message: 'Item not found', statusCode: 404 })
      return { data: item }
    }
  )

  // ── DELETE /api/todos/lists/:listId/items/:itemId — delete item ───────────
  server.delete<{ Params: { listId: string; itemId: string } }>(
    '/todos/lists/:listId/items/:itemId',
    {
      preHandler: requireSession,
      schema: {
        params: {
          type: 'object',
          properties: { listId: { type: 'string' }, itemId: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      await todoService.deleteItem(request.params.itemId)
      return reply.code(204).send()
    }
  )
}
