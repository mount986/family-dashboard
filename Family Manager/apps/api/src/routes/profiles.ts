import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { CreateProfileInput, UpdateProfileInput } from '@family-dashboard/types'
import * as profileService from '../services/profiles.js'

// ── Admin guard ───────────────────────────────────────────────────────────────
// Verifies the session cookie and confirms the active profile is an admin.
// Attach as preHandler to any route that mutates profiles.

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true })
  } catch {
    return reply.code(401).send({ error: 'unauthorized', message: 'Authentication required', statusCode: 401 })
  }

  if (!request.user.isAdmin) {
    return reply.code(403).send({
      error: 'forbidden',
      message: 'An admin profile is required to manage profiles',
      statusCode: 403,
    })
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const profileRoutes: FastifyPluginAsync = async (server) => {

  // ── GET /api/profiles — public, used by the switcher ─────────────────────
  server.get('/profiles', async () => {
    const data = await profileService.listProfiles()
    return { data }
  })

  // ── POST /api/profiles — admin only ──────────────────────────────────────
  server.post<{ Body: CreateProfileInput }>(
    '/profiles',
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name:       { type: 'string', minLength: 1, maxLength: 50 },
            avatarUrl:  { type: 'string' },
            colorTheme: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            isAdmin:    { type: 'boolean' },
            pin:        { type: 'string', minLength: 4, maxLength: 8, pattern: '^[0-9]+$' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const profile = await profileService.createProfile(request.body)
      return reply.code(201).send({ data: profile })
    }
  )

  // ── PATCH /api/profiles/:id — admin only ─────────────────────────────────
  server.patch<{ Params: { id: string }; Body: UpdateProfileInput }>(
    '/profiles/:id',
    {
      preHandler: requireAdmin,
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          properties: {
            name:       { type: 'string', minLength: 1, maxLength: 50 },
            avatarUrl:  { type: ['string', 'null'] },
            colorTheme: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            isAdmin:    { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const profile = await profileService.updateProfile(request.params.id, request.body)
      if (!profile) return reply.code(404).send(notFound('Profile not found'))
      return { data: profile }
    }
  )

  // ── DELETE /api/profiles/:id — admin only ────────────────────────────────
  server.delete<{ Params: { id: string } }>(
    '/profiles/:id',
    {
      preHandler: requireAdmin,
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      await profileService.deleteProfile(request.params.id)
      return reply.code(204).send()
    }
  )

  // ── POST /api/profiles/switch — open to all ───────────────────────────────
  // Admin profiles require a PIN; regular profiles switch freely.
  server.post<{ Body: { profileId: string; pin?: string } }>(
    '/profiles/switch',
    {
      schema: {
        body: {
          type: 'object',
          required: ['profileId'],
          properties: {
            profileId: { type: 'string' },
            pin:       { type: 'string', minLength: 4, maxLength: 8 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { profileId, pin } = request.body

      const profile = await profileService.getProfile(profileId)
      if (!profile) return reply.code(404).send(notFound('Profile not found'))

      if (profile.isAdmin) {
        if (!pin) {
          return reply.code(401).send(clientError('pin_required', 'PIN required for admin profile'))
        }

        const result = await profileService.verifyPin(profileId, pin)

        if (!result.ok) {
          if (result.reason === 'locked') {
            return reply.code(423).send({
              error: 'pin_locked',
              message: 'Too many failed attempts. Try again later.',
              lockedUntil: result.lockedUntil,
              statusCode: 423,
            })
          }
          return reply.code(401).send(clientError('invalid_pin', 'Incorrect PIN'))
        }
      }

      const session = {
        profileId: profile.id,
        profileName: profile.name,
        isAdmin: profile.isAdmin,
      }

      const token = server.jwt.sign(session)
      reply.setCookie('session', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return { data: session }
    }
  )

  // ── GET /api/session — open to all ───────────────────────────────────────
  server.get('/session', async (request, reply) => {
    try {
      await request.jwtVerify({ onlyCookie: true })
      return { data: request.user }
    } catch {
      return reply.code(401).send(clientError('no_session', 'No active session'))
    }
  })

  // ── DELETE /api/session — open to all ────────────────────────────────────
  server.delete('/session', async (_request, reply) => {
    reply.clearCookie('session', { path: '/' })
    return reply.code(204).send()
  })
}

// ── Error helpers ─────────────────────────────────────────────────────────────

function notFound(message: string) {
  return { error: 'not_found', message, statusCode: 404 }
}

function clientError(code: string, message: string) {
  return { error: code, message, statusCode: 401 }
}
