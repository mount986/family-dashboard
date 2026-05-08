import type { ActiveSession } from '@family-dashboard/types'

// Augment @fastify/jwt so request.user is typed as ActiveSession everywhere
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: ActiveSession
    user: ActiveSession
  }
}
