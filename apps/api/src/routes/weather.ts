import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true })
  } catch {
    return reply.code(401).send({ error: 'unauthorized', message: 'Authentication required', statusCode: 401 })
  }
}

// ── 30-minute server-side cache ───────────────────────────────────────────────

interface CacheEntry {
  data: WeatherResponse
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 30 * 60 * 1000

function getCached(key: string): WeatherResponse | null {
  const entry = cache.get(key)
  if (!entry || Date.now() > entry.expiresAt) return null
  return entry.data
}

function setCached(key: string, data: WeatherResponse) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ── Response shape ─────────────────────────────────────────────────────────────

export interface WeatherDay {
  date: string        // YYYY-MM-DD
  tempHigh: number
  tempLow: number
  description: string
  icon: string
}

export interface WeatherResponse {
  location: string
  current: {
    temp: number
    feelsLike: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
  }
  forecast: WeatherDay[]
}

// ── OpenWeatherMap API types (partial) ────────────────────────────────────────

interface OWMCurrentResponse {
  name: string
  sys: { country: string }
  main: { temp: number; feels_like: number; humidity: number }
  wind: { speed: number }
  weather: { description: string; icon: string }[]
}

interface OWMForecastItem {
  dt_txt: string
  main: { temp_max: number; temp_min: number }
  weather: { description: string; icon: string }[]
}

interface OWMForecastResponse {
  list: OWMForecastItem[]
}

// ── Helper ────────────────────────────────────────────────────────────────────

function round(n: number) { return Math.round(n) }

async function fetchWeather(location: string, units: string, apiKey: string): Promise<WeatherResponse> {
  const base = 'https://api.openweathermap.org/data/2.5'
  const params = `q=${encodeURIComponent(location)}&units=${units}&appid=${apiKey}`

  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${base}/weather?${params}`),
    fetch(`${base}/forecast?${params}`),
  ])

  if (!currentRes.ok) {
    const err = await currentRes.json() as { message?: string }
    throw new Error(err.message ?? `Weather API error ${currentRes.status}`)
  }

  const current = await currentRes.json() as OWMCurrentResponse
  const forecast = await forecastRes.json() as OWMForecastResponse

  // Group 3-hour forecast slots by date, keep first non-past day through day 5
  const dayMap = new Map<string, { highs: number[]; lows: number[]; description: string; icon: string }>()
  for (const item of forecast.list) {
    const date = item.dt_txt.slice(0, 10)
    const existing = dayMap.get(date)
    if (existing) {
      existing.highs.push(item.main.temp_max)
      existing.lows.push(item.main.temp_min)
    } else {
      dayMap.set(date, {
        highs: [item.main.temp_max],
        lows: [item.main.temp_min],
        description: item.weather[0]?.description ?? '',
        icon: item.weather[0]?.icon ?? '',
      })
    }
  }

  const forecastDays: WeatherDay[] = Array.from(dayMap.entries())
    .slice(0, 5)
    .map(([date, d]) => ({
      date,
      tempHigh: round(Math.max(...d.highs)),
      tempLow: round(Math.min(...d.lows)),
      description: d.description,
      icon: d.icon,
    }))

  return {
    location: `${current.name}, ${current.sys.country}`,
    current: {
      temp: round(current.main.temp),
      feelsLike: round(current.main.feels_like),
      humidity: current.main.humidity,
      windSpeed: round(current.wind.speed),
      description: current.weather[0]?.description ?? '',
      icon: current.weather[0]?.icon ?? '',
    },
    forecast: forecastDays,
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const weatherRoutes: FastifyPluginAsync = async (server) => {

  server.get<{ Querystring: { location: string; units?: string } }>(
    '/weather',
    {
      preHandler: requireSession,
      schema: {
        querystring: {
          type: 'object',
          required: ['location'],
          properties: {
            location: { type: 'string', minLength: 1 },
            units:    { type: 'string', enum: ['metric', 'imperial'], default: 'imperial' },
          },
        },
      },
    },
    async (request, reply) => {
      const apiKey = process.env.OPENWEATHER_API_KEY
      if (!apiKey) {
        return reply.code(503).send({ error: 'misconfigured', message: 'Weather API key not configured', statusCode: 503 })
      }

      const { location, units = 'imperial' } = request.query
      const cacheKey = `${location}:${units}`

      const cached = getCached(cacheKey)
      if (cached) return { data: cached }

      try {
        const data = await fetchWeather(location, units, apiKey)
        setCached(cacheKey, data)
        return { data }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch weather'
        return reply.code(502).send({ error: 'upstream_error', message, statusCode: 502 })
      }
    }
  )
}
