import { useQuery } from '@tanstack/react-query'
import { api } from './client'

export interface WeatherDay {
  date: string
  tempHigh: number
  tempLow: number
  description: string
  icon: string
}

export interface WeatherData {
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

export function useWeather(location: string | undefined, units: 'metric' | 'imperial' = 'imperial') {
  return useQuery({
    queryKey: ['weather', location, units],
    queryFn: () =>
      api.get<WeatherData>(`/weather?location=${encodeURIComponent(location!)}&units=${units}`),
    enabled: !!location,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })
}
