export type CardType =
  | 'todo'
  | 'grocery'
  | 'calendar'
  | 'weather'
  | 'iframe'
  | 'chore-tracker'

// ── Per-card config shapes ────────────────────────────────────────────────────

export interface TodoCardConfig {
  listId: string
}

export interface GroceryCardConfig {
  showChecked: boolean
}

export interface CalendarCardConfig {
  calendarIds: string[]
}

export interface WeatherCardConfig {
  location: string
  units: 'metric' | 'imperial'
}

export interface IframeCardConfig {
  url: string
  allowFullscreen: boolean
}

export interface ChoreTrackerCardConfig {
  url: string
  passProfileParam: boolean
}

export type CardConfig =
  | TodoCardConfig
  | GroceryCardConfig
  | CalendarCardConfig
  | WeatherCardConfig
  | IframeCardConfig
  | ChoreTrackerCardConfig

// ── Card entity ───────────────────────────────────────────────────────────────

export interface Card {
  id: string
  type: CardType
  title: string
  config: CardConfig
  ownerId: string
  isShared: boolean
  isPrivate: boolean
  createdAt: string
}

export interface CreateCardInput {
  type: CardType
  title: string
  config?: Partial<CardConfig>
  isShared?: boolean
  isPrivate?: boolean
}

export interface UpdateCardInput {
  title?: string
  config?: Partial<CardConfig>
  isShared?: boolean
  isPrivate?: boolean
}
