import type { FastifyPluginAsync } from 'fastify'
import type { CreateProfileInput, UpdateProfileInput } from '@family-dashboard/types'
import * as profileService from '../services/profiles.js'

export const profileRoutes: FastifyPluginAsync = async (server) => {
  // ── GET /api/profiles ────────────────────────────────────────────────────
  server.get('/profiles', async () => {
    const data = await profileService.listProfiles()
    return { data }
  })

  // ── POST /api/profiles ───────────────────────────────────────────────────
  server.post<{ Body: CreateProfileInput }>(
    '/profiles',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 50 },
            avatarUrl: { type: 'string' },
            colorTheme: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            isPrivate: { type: 'boolean' },
            pin: { type: 'string', minLength: 4, maxLength: 8, pattern: '^[0-9]+$' },
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

  // ── PATCH /api/profiles/:id ──────────────────────────────────────────────
  server.patch<{ Params: { id: string }; Body: UpdateProfileInput }>(
    '/profiles/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 50 },
            avatarUrl: { type: ['string', 'null'] },
            colorTheme: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            isPrivate: { type: 'boolean' },
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

  // ── DELETE /api/profiles/:id ─────────────────────────────────────────────
  server.delete<{ Params: { id: string } }>(
    '/profiles/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      await profileService.deleteProfile(request.params.id)
      return reply.code(204).send()
    }
  )

  // ── POST /api/profiles/switch ────────────────────────────────────────────
  // Switch the active session to a different profile.
  // Requires PIN if the target profile is private.
  server.post<{ Body: { profileId: string; pin?: string } }>(
    '/profiles/switch',
    {
      schema: {
        body: {
          type: 'object',
          required: ['profileId'],
          properties: {
            profileId: { type: 'string' },
            pin: { type: 'string', minLength: 4, maxLength: 8 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { profileId, pin } = request.body

      const profile = await profileService.getProfile(profileId)
      if (!profile) return reply.code(404).send(notFound('Profile not found'))

      if (profile.isPrivate) {
        if (!pin) {
          return reply.code(401).send(error('pin_required', 'PIN required for private profile'))
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
          return reply.code(401).send(error('invalid_pin', 'Incorrect PIN'))
        }
      }

      // Issue a signed JWT session cookie
      const session = {
        profileId: profile.id,
        profileName: profile.name,
        isPrivate: profile.isPrivate,
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

  // ── GET /api/session ─────────────────────────────────────────────────────
  // Returns the currently active profile from the session cookie.
  server.get('/session', async (request, reply) => {
    try {
      await request.jwtVerify({ onlyCookie: true })
      return { data: request.user }
    } catch {
      return reply.code(401).send(error('no_session', 'No active session'))
    }
  })

  // ── DELETE /api/session ──────────────────────────────────────────────────
  server.delete('/session', async (_request, reply) => {
    reply.clearCookie('session', { path: '/' })
    return reply.code(204).send()
  })
}

// ── Error helpers ─────────────────────────────────────────────────────────────

function notFound(message: string) {
  return { error: 'not_found', message, statusCode: 404 }
}

function error(code: string, message: string) {
  return { error: code, message, statusCode: 401 }
}
