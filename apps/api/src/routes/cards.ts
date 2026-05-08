import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { CreateCardInput, UpdateCardInput } from '@family-dashboard/types'
import * as cardService from '../services/cards.js'

// ── Auth guards ───────────────────────────────────────────────────────────────

async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true })
  } catch {
    return reply.code(401).send({
      error: 'unauthorized',
      message: 'Authentication required',
      statusCode: 401,
    })
  }
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true })
  } catch {
    return reply.code(401).send({
      error: 'unauthorized',
      message: 'Authentication required',
      statusCode: 401,
    })
  }
  if (!request.user.isAdmin) {
    return reply.code(403).send({
      error: 'forbidden',
      message: 'Admin profile required',
      statusCode: 403,
    })
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const cardRoutes: FastifyPluginAsync = async (server) => {

  // ── GET /api/cards — visible to any logged-in profile ────────────────────
  server.get(
    '/cards',
    { preHandler: requireSession },
    async (request) => {
      const { profileId, isAdmin } = request.user
      const data = await cardService.listCards(profileId, isAdmin)
      return { data }
    }
  )

  // ── POST /api/cards — admin only ─────────────────────────────────────────
  server.post<{ Body: CreateCardInput }>(
    '/cards',
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: 'object',
          required: ['type', 'title'],
          properties: {
            type: {
              type: 'string',
              enum: ['todo', 'grocery', 'calendar', 'weather', 'iframe', 'chore-tracker'],
            },
            title:     { type: 'string', minLength: 1, maxLength: 100 },
            config:    { type: 'object' },
            isShared:  { type: 'boolean' },
            isPrivate: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const card = await cardService.createCard(request.user.profileId, request.body)
      return reply.code(201).send({ data: card })
    }
  )

  // ── PATCH /api/cards/:id — admin only ────────────────────────────────────
  server.patch<{ Params: { id: string }; Body: UpdateCardInput }>(
    '/cards/:id',
    {
      preHandler: requireAdmin,
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          properties: {
            title:     { type: 'string', minLength: 1, maxLength: 100 },
            config:    { type: 'object' },
            isShared:  { type: 'boolean' },
            isPrivate: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const card = await cardService.updateCard(request.params.id, request.body)
      if (!card) {
        return reply.code(404).send({ error: 'not_found', message: 'Card not found', statusCode: 404 })
      }
      return { data: card }
    }
  )

  // ── DELETE /api/cards/:id — admin only ───────────────────────────────────
  server.delete<{ Params: { id: string } }>(
    '/cards/:id',
    {
      preHandler: requireAdmin,
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const card = await cardService.getCard(request.params.id)
      if (!card) {
        return reply.code(404).send({ error: 'not_found', message: 'Card not found', statusCode: 404 })
      }
      await cardService.deleteCard(request.params.id)
      return reply.code(204).send()
    }
  )
}
