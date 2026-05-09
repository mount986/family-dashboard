import type { FastifyPluginAsync } from 'fastify'
import * as profileService from '../services/profiles.js'

// ── Bootstrap route ───────────────────────────────────────────────────────────
// Creates the very first admin profile when no profiles exist.
// Permanently disabled once any profile has been created.

export const bootstrapRoutes: FastifyPluginAsync = async (server) => {
  server.post<{ Body: { name: string; pin: string } }>(
    '/bootstrap',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'pin'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 50 },
            pin:  { type: 'string', minLength: 4, maxLength: 8, pattern: '^[0-9]+$' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      // Check if any profiles already exist
      const existing = await profileService.listProfiles()
      if (existing.length > 0) {
        return reply.code(403).send({
          error: 'bootstrap_disabled',
          message: 'Bootstrap is only available before any profiles are created',
          statusCode: 403,
        })
      }

      const profile = await profileService.createProfile({
        name: request.body.name,
        pin: request.body.pin,
        isAdmin: true,
        colorTheme: '#6366f1',
      })

      // Immediately issue a session for the new admin so they're logged in
      const session = {
        profileId: profile.id,
        profileName: profile.name,
        colorTheme: profile.colorTheme,
        theme: profile.theme,
        isAdmin: true,
      }

      const token = server.jwt.sign(session)
      reply.setCookie('session', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })

      return reply.code(201).send({ data: { profile, session } })
    }
  )

  // GET /api/bootstrap — lets the frontend check whether bootstrap is needed
  server.get('/bootstrap', async () => {
    const existing = await profileService.listProfiles()
    return { data: { needed: existing.length === 0 } }
  })
}
