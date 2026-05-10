import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true })
  } catch {
    return reply.code(401).send({ error: 'unauthorized', message: 'Authentication required', statusCode: 401 })
  }
}

export const iframeRoutes: FastifyPluginAsync = async (server) => {

  // ── GET /api/iframe/resolve?url=... ───────────────────────────────────────
  // Follows redirects server-side and returns the final URL + whether the
  // destination allows embedding (based on X-Frame-Options / CSP headers).
  server.get<{ Querystring: { url: string } }>(
    '/iframe/resolve',
    {
      preHandler: requireSession,
      schema: {
        querystring: {
          type: 'object',
          required: ['url'],
          properties: { url: { type: 'string', minLength: 1 } },
        },
      },
    },
    async (request) => {
      const { url } = request.query

      try {
        const res = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FamilyDashboard/1.0)' },
          signal: AbortSignal.timeout(8000),
        })

        const finalUrl = res.url

        const xfo = res.headers.get('x-frame-options') ?? ''
        const csp = res.headers.get('content-security-policy') ?? ''

        const blockedByXfo = /^(DENY|SAMEORIGIN)$/i.test(xfo.trim())
        // frame-ancestors * → allowed; anything else (specific origins, 'none') → blocked
        const blockedByCsp = csp.includes('frame-ancestors') && !csp.includes('frame-ancestors *')

        return { data: { finalUrl, canEmbed: !blockedByXfo && !blockedByCsp } }
      } catch {
        // Network error or timeout — hand the original URL to the iframe and let it try
        return { data: { finalUrl: url, canEmbed: true } }
      }
    }
  )
}
