import { useState, useCallback, useRef } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import { useCards } from '@/api/cards'
import { useLayouts, useSaveLayout } from '@/api/layouts'
import { CardFrame } from './CardFrame'
import type { Breakpoint, CardLayout, DashboardLayout } from '@family-dashboard/types'

const ResponsiveGridLayout = WidthProvider(Responsive)

// ── Grid config ───────────────────────────────────────────────────────────────

const COLS: Record<Breakpoint, number> = {
  xl: 12, lg: 10, md: 8, sm: 6, xs: 4,
}

const BREAKPOINTS: Record<Breakpoint, number> = {
  xl: 1536, lg: 1280, md: 1024, sm: 768, xs: 480,
}

const ROW_HEIGHT = 80

// ── Layout conversion helpers ─────────────────────────────────────────────────

/**
 * Build RGL layouts from saved data.
 * Cards without a saved position get a sensible default (2-column stacking).
 */
function buildRglLayouts(
  cardIds: string[],
  saved: DashboardLayout | undefined
): Record<string, Layout[]> {
  const result: Record<string, Layout[]> = {}

  for (const bp of Object.keys(COLS) as Breakpoint[]) {
    const cols = COLS[bp]
    const savedBp = saved?.[bp] ?? []
    const savedMap = new Map(savedBp.map((cl) => [cl.cardId, cl]))
    const colW = Math.max(1, Math.floor(cols / 2))

    result[bp] = cardIds.map((id, i) => {
      const s = savedMap.get(id)
      if (s) return { i: id, x: s.x, y: s.y, w: s.w, h: s.h }
      // Default: two-column grid, 4 rows tall
      return { i: id, x: (i % 2) * colW, y: Math.floor(i / 2) * 4, w: colW, h: 4 }
    })
  }

  return result
}

/** Convert RGL layout back to our CardLayout[], preserving isMinimized. */
function rglToCardLayouts(
  rglLayout: Layout[],
  prevCardLayouts: CardLayout[]
): CardLayout[] {
  const prevMap = new Map(prevCardLayouts.map((cl) => [cl.cardId, cl]))
  return rglLayout.map(({ i, x, y, w, h }) => ({
    cardId: i,
    x, y, w, h,
    isMinimized: prevMap.get(i)?.isMinimized ?? false,
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DashboardGridProps {
  isAdmin: boolean
}

export function DashboardGrid({ isAdmin }: DashboardGridProps) {
  const { data: cards = [], isLoading: cardsLoading } = useCards()
  const { data: savedLayouts, isLoading: layoutsLoading } = useLayouts()
  const { mutate: saveLayout } = useSaveLayout()

  const [editMode, setEditMode] = useState(false)
  const [currentBp, setCurrentBp] = useState<Breakpoint>('lg')

  // Local overrides applied immediately on drag/resize so the UI is instant.
  // Keyed by breakpoint — only touched breakpoints are overridden.
  const [localLayouts, setLocalLayouts] = useState<Partial<DashboardLayout>>({})

  // Debounce saves so we don't hammer the API on every pixel moved
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedSave = useCallback(
    (bp: Breakpoint, layout: CardLayout[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => saveLayout({ breakpoint: bp, layout }), 800)
    },
    [saveLayout]
  )

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      const prev = (localLayouts[currentBp] ?? savedLayouts?.[currentBp]) ?? []
      const updated = rglToCardLayouts(currentLayout, prev)
      setLocalLayouts((lls) => ({ ...lls, [currentBp]: updated }))
      debouncedSave(currentBp, updated)
    },
    [localLayouts, savedLayouts, currentBp, debouncedSave]
  )

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (cardsLoading || layoutsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
        <p className="text-slate-400 text-lg font-medium">No cards yet</p>
        <p className="text-slate-600 text-sm">
          {isAdmin
            ? 'Switch to Edit Layout mode to add your first card.'
            : 'Ask an admin to add cards to the dashboard.'}
        </p>
      </div>
    )
  }

  // ── Merge saved + local layout overrides ─────────────────────────────────────

  const mergedLayouts: DashboardLayout = {
    xl: localLayouts.xl ?? savedLayouts?.xl ?? [],
    lg: localLayouts.lg ?? savedLayouts?.lg ?? [],
    md: localLayouts.md ?? savedLayouts?.md ?? [],
    sm: localLayouts.sm ?? savedLayouts?.sm ?? [],
    xs: localLayouts.xs ?? savedLayouts?.xs ?? [],
  }

  const cardIds = cards.map((c) => c.id)
  const rglLayouts = buildRglLayouts(cardIds, mergedLayouts)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-slate-800 flex-shrink-0">
        <button
          onClick={() => setEditMode((v) => !v)}
          className={[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            editMode
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200',
          ].join(' ')}
        >
          {editMode ? 'Done' : 'Edit Layout'}
        </button>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-auto">
        <ResponsiveGridLayout
          className="layout"
          layouts={rglLayouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={(bp) => setCurrentBp(bp as Breakpoint)}
          margin={[12, 12]}
          containerPadding={[16, 16]}
          draggableHandle=".drag-handle"
        >
          {cards.map((card) => (
            <div key={card.id} className="overflow-hidden">
              <CardFrame card={card} editMode={editMode} />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}
