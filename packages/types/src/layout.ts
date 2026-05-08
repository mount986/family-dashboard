export type Breakpoint = 'xl' | 'lg' | 'md' | 'sm' | 'xs'

export interface CardLayout {
  cardId: string
  /** Column position (0-based) */
  x: number
  /** Row position (0-based) */
  y: number
  /** Width in grid columns */
  w: number
  /** Height in grid rows */
  h: number
  isMinimized: boolean
}

/** Full dashboard layout — one CardLayout[] per breakpoint */
export type DashboardLayout = Record<Breakpoint, CardLayout[]>

export interface SaveLayoutInput {
  breakpoint: Breakpoint
  layout: CardLayout[]
}
