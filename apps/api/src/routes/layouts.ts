import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { Breakpoint, CardLayout } from '@family-dashboard/types'
import * as layoutService from '../services/layouts.js'

// ── Auth guard ────────────────────────────────────────────────────────────────

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

// ── Routes ────────────────────────────────────────────────────────────────────

export const layoutRoutes: FastifyPluginAsync = async (server) => {

  // ── GET /api/layouts — full layout for current profile ───────────────────
  server.get(
    '/layouts',
    { preHandler: requireSession },
    async (request) => {
      const data = await layoutService.getLayouts(request.user.profileId)
      return { data }
    }
  )

  // ── DELETE /api/layouts/cards/:cardId — hide a card (all breakpoints) ────
  server.delete<{ Params: { cardId: string } }>(
    '/layouts/cards/:cardId',
    {
      preHandler: requireSession,
      schema: {
        params: {
          type: 'object',
          required: ['cardId'],
          properties: { cardId: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      await layoutService.hideCard(request.user.profileId, request.params.cardId)
      return reply.code(204).send()
    }
  )

  // ── PUT /api/layouts/:breakpoint — save one breakpoint's layout ──────────
  // Replaces all layout rows for (profileId, breakpoint) atomically.
  server.put<{
    Params: { breakpoint: Breakpoint }
    Body: { layout: CardLayout[] }
  }>(
    '/layouts/:breakpoint',
    {
      preHandler: requireSession,
      schema: {
        params: {
          type: 'object',
          required: ['breakpoint'],
          properties: {
            breakpoint: { type: 'string', enum: ['xl', 'lg', 'md', 'sm', 'xs'] },
          },
        },
        body: {
          type: 'object',
          required: ['layout'],
          properties: {
            layout: {
              type: 'array',
              items: {
                type: 'object',
                required: ['cardId', 'x', 'y', 'w', 'h'],
                properties: {
                  cardId:      { type: 'string' },
                  x:           { type: 'integer', minimum: 0 },
                  y:           { type: 'integer', minimum: 0 },
                  w:           { type: 'integer', minimum: 1 },
                  h:           { type: 'integer', minimum: 1 },
                  isMinimized: { type: 'boolean' },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      await layoutService.saveLayout(
        request.user.profileId,
        request.params.breakpoint,
        request.body.layout
      )
      return reply.code(204).send()
    }
  )
}
