import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

async function requireSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify({ onlyCookie: true })
  } catch {
    await reply.code(401).send({ error: 'unauthorized', message: 'Authentication required', statusCode: 401 })
  }
}

// ── OG / meta parsing ─────────────────────────────────────────────────────────

const MAX_BODY_BYTES = 50_000 // Only read first 50 KB — enough for <head>

function metaContent(html: string, ...keys: string[]): string | undefined {
  for (const key of keys) {
    // Handles either attribute order: property/name before or after content
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"'<>]+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
    ]
    for (const re of patterns) {
      const m = html.match(re)
      if (m?.[1]?.trim()) return m[1].trim()
    }
  }
  return undefined
}

function pageTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m?.[1]?.trim()
}

async function fetchHtmlHead(url: string): Promise<{ html: string; finalUrl: string; headers: Headers }> {
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FamilyDashboard/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(8000),
  })

  // Stream only the first MAX_BODY_BYTES to avoid downloading huge pages
  const reader = res.body?.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  if (reader) {
    while (totalBytes < MAX_BODY_BYTES) {
      const { done, value } = await reader.read()
      if (done || !value) break
      chunks.push(value)
      totalBytes += value.byteLength
    }
    reader.cancel().catch(() => {})
  }

  const html = new TextDecoder().decode(
    chunks.reduce((acc, c) => {
      const merged = new Uint8Array(acc.length + c.length)
      merged.set(acc)
      merged.set(c, acc.length)
      return merged
    }, new Uint8Array(0))
  )

  return { html, finalUrl: res.url, headers: res.headers }
}

// ── Server-side cache (5 min) ─────────────────────────────────────────────────

interface ResolveResult {
  finalUrl: string
  canEmbed: boolean
  preview: {
    title?: string
    description?: string
    image?: string
    siteName?: string
    favicon: string
  }
}

interface CacheEntry { data: ResolveResult; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000

function getCached(url: string): ResolveResult | null {
  const e = cache.get(url)
  if (!e || Date.now() > e.expiresAt) return null
  return e.data
}
function setCached(url: string, data: ResolveResult) {
  cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL })
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const iframeRoutes: FastifyPluginAsync = async (server) => {

  // ── GET /api/iframe/resolve?url=... ───────────────────────────────────────
  // Follows redirects, parses OG metadata, and checks embed permissions.
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

      const cached = getCached(url)
      if (cached) return { data: cached }

      try {
        const { html, finalUrl, headers } = await fetchHtmlHead(url)

        // ── Embed check ──────────────────────────────────────────────────────
        const xfo = headers.get('x-frame-options') ?? ''
        const csp = headers.get('content-security-policy') ?? ''
        const blockedByXfo = /^(DENY|SAMEORIGIN)$/i.test(xfo.trim())
        const blockedByCsp = csp.includes('frame-ancestors') && !csp.includes('frame-ancestors *')
        const canEmbed = !blockedByXfo && !blockedByCsp

        // ── OG / meta extraction ─────────────────────────────────────────────
        const title       = metaContent(html, 'og:title')       ?? pageTitle(html)
        const description = metaContent(html, 'og:description', 'description')
        const image       = metaContent(html, 'og:image')
        const siteName    = metaContent(html, 'og:site_name')

        const domain = new URL(finalUrl).hostname
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

        const result: ResolveResult = {
          finalUrl,
          canEmbed,
          preview: {
            favicon,
            ...(title       ? { title }       : {}),
            ...(description ? { description } : {}),
            ...(image       ? { image }       : {}),
            ...(siteName    ? { siteName }    : {}),
          },
        }

        setCached(url, result)
        return { data: result }
      } catch {
        // Network error / timeout — let the iframe try the original URL
        const result: ResolveResult = {
          finalUrl: url,
          canEmbed: true,
          preview: { favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64` },
        }
        return { data: result }
      }
    }
  )
}
