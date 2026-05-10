import type { Card, WeatherCardConfig } from '@family-dashboard/types'
import { useWeather } from '@/api/weather'

// OWM icon code → emoji
function weatherEmoji(icon: string): string {
  const code = icon.replace('d', '').replace('n', '')
  const map: Record<string, string> = {
    '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
    '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️',
  }
  return map[code] ?? '🌡️'
}

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface WeatherCardProps {
  card: Card
}

export function WeatherCard({ card }: WeatherCardProps) {
  const config = card.config as Partial<WeatherCardConfig>
  const location = config.location?.trim()
  const units = config.units ?? 'imperial'
  const unitLabel = units === 'metric' ? '°C' : '°F'
  const windLabel = units === 'metric' ? 'm/s' : 'mph'

  const { data, isLoading, error } = useWeather(location, units)

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="text-3xl">🌤</span>
        <p className="text-slate-300 text-sm font-medium">No location set</p>
        <p className="text-slate-500 text-xs leading-relaxed">
          Open settings (⚙ in edit mode) and enter a city name.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
        <span className="text-2xl">⚠️</span>
        <p className="text-slate-400 text-sm">Could not load weather</p>
        <p className="text-slate-600 text-xs">Check the city name in settings.</p>
      </div>
    )
  }

  const { current, forecast } = data

  return (
    <div className="flex flex-col h-full overflow-hidden text-sm">
      {/* ── Current conditions ── */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-5xl leading-none">{weatherEmoji(current.icon)}</span>
        <div className="min-w-0">
          <div className="text-4xl font-light text-slate-100 leading-none">
            {current.temp}{unitLabel}
          </div>
          <div className="text-slate-400 text-xs mt-1 truncate">
            {capitalize(current.description)}
          </div>
          <div className="text-slate-500 text-xs truncate">{data.location}</div>
        </div>
        <div className="ml-auto text-right text-xs text-slate-500 space-y-0.5 flex-shrink-0">
          <div>Feels {current.feelsLike}{unitLabel}</div>
          <div>Humidity {current.humidity}%</div>
          <div>Wind {current.windSpeed} {windLabel}</div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 border-t border-slate-800 flex-shrink-0" />

      {/* ── 5-day forecast ── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {forecast.map((day) => (
          <div key={day.date} className="flex items-center gap-2 py-0.5">
            <span className="text-lg leading-none w-7 text-center">{weatherEmoji(day.icon)}</span>
            <span className="flex-1 text-slate-400 text-xs truncate">{formatDate(day.date)}</span>
            <span className="text-slate-200 text-xs font-medium">{day.tempHigh}{unitLabel}</span>
            <span className="text-slate-600 text-xs">{day.tempLow}{unitLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
