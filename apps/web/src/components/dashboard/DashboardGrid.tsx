import { useState, useCallback, useRef } from 'react'
import type { Card } from '@family-dashboard/types'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import { useCards, useCreateCard } from '@/api/cards'
import { useLayouts, useSaveLayout, useHideCard } from '@/api/layouts'
import { CardFrame } from './CardFrame'
import { CardMaximizeOverlay } from './CardMaximizeOverlay'
import { CardSettingsPanel } from './CardSettingsPanel'
import { CardLibraryDrawer } from './CardLibraryDrawer'
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

const DEFAULT_NAMES: Record<Card['type'], string> = {
  'todo':          'To-Do List',
  'grocery':       'Grocery List',
  'calendar':      'Calendar',
  'weather':       'Weather',
  'iframe':        'Web Embed',
  'chore-tracker': 'Chore Tracker',
}

// ── Layout conversion helpers ─────────────────────────────────────────────────

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
      return { i: id, x: (i % 2) * colW, y: Math.floor(i / 2) * 4, w: colW, h: 4 }
    })
  }

  return result
}

function rglToCardLayouts(rglLayout: Layout[], prevCardLayouts: CardLayout[]): CardLayout[] {
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
  const { mutate: saveLayout, mutateAsync: saveLayoutAsync } = useSaveLayout()
  const { mutate: hideCard } = useHideCard()
  const { mutateAsync: createCard } = useCreateCard()

  const [editMode, setEditMode] = useState(false)
  const [currentBp, setCurrentBp] = useState<Breakpoint>('lg')
  const [maximizedCard, setMaximizedCard] = useState<Card | null>(null)
  const [settingsCard, setSettingsCard] = useState<Card | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [localLayouts, setLocalLayouts] = useState<Partial<DashboardLayout>>({})

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

  const handleHide = useCallback(
    (cardId: string) => {
      // Clear any local layout overrides for this card so it doesn't re-appear
      setLocalLayouts((lls) => {
        const next = { ...lls } as Partial<DashboardLayout>
        for (const bp of Object.keys(next) as Breakpoint[]) {
          if (next[bp]) next[bp] = next[bp]!.filter((cl) => cl.cardId !== cardId)
        }
        return next
      })
      hideCard(cardId)
    },
    [hideCard]
  )

  const handleQuickAdd = useCallback(
    async (type: Card['type']) => {
      try {
        const card = await createCard({ type, title: DEFAULT_NAMES[type], isShared: true })
        const existingLayout = savedLayouts?.[currentBp] ?? []
        const bottomY = existingLayout.length > 0
          ? Math.max(...existingLayout.map((cl) => cl.y + cl.h))
          : 0
        const colW = Math.floor(COLS[currentBp] / 2)
        const newEntry: CardLayout = { cardId: card.id, x: 0, y: bottomY, w: colW, h: 4, isMinimized: false }
        await saveLayoutAsync({ breakpoint: currentBp, layout: [...existingLayout, newEntry] })
        setLibraryOpen(false)
        setEditMode(true)
      } catch (err) {
        console.error('Quick-add failed:', err)
      }
    },
    [createCard, saveLayoutAsync, currentBp, savedLayouts]
  )

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (cardsLoading || layoutsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Derive visible vs. library cards ─────────────────────────────────────────
  // savedLayouts is the authority for which cards are on the board.
  // localLayouts only overrides x/y/w/h for smooth in-progress drag/resize.
  const mergeBp = (bp: Breakpoint): CardLayout[] => {
    const saved = savedLayouts?.[bp] ?? []
    const local = localLayouts[bp]
    if (!local) return saved
    const localMap = new Map(local.map((cl) => [cl.cardId, cl]))
    return saved.map((cl) => localMap.get(cl.cardId) ?? cl)
  }

  const mergedLayouts: DashboardLayout = {
    xl: mergeBp('xl'),
    lg: mergeBp('lg'),
    md: mergeBp('md'),
    sm: mergeBp('sm'),
    xs: mergeBp('xs'),
  }

  const layoutCardIds = new Set(
    Object.values(mergedLayouts).flatMap((bp) => bp.map((cl) => cl.cardId))
  )

  const visibleCards = cards.filter((c) => layoutCardIds.has(c.id))
  const cardIds = visibleCards.map((c) => c.id)
  const rglLayouts = buildRglLayouts(cardIds, mergedLayouts)

  const currentLayout = mergedLayouts[currentBp]
  const libraryCardCount = cards.length - visibleCards.length

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 justify-end px-4 py-2 border-b border-slate-800 flex-shrink-0">
        {(isAdmin || libraryCardCount > 0) && (
          <button
            onClick={() => setLibraryOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 flex items-center gap-1.5"
          >
            <span>＋</span>
            <span>{isAdmin ? 'Add Card' : 'Library'}</span>
            {libraryCardCount > 0 && (
              <span className="bg-slate-700 text-slate-300 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {libraryCardCount}
              </span>
            )}
          </button>
        )}
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

      {/* ── Empty state (non-admin only — admins always see the grid + Add Card) ── */}
      {visibleCards.length === 0 && !isAdmin && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
          <p className="text-slate-400 text-lg font-medium">No cards on your board</p>
          <p className="text-slate-600 text-sm">Ask an admin to add cards to the dashboard.</p>
        </div>
      )}

      {/* ── Grid ── */}
      {(visibleCards.length > 0 || isAdmin) && (
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
          {visibleCards.map((card) => (
            <div key={card.id} className="overflow-hidden">
              <CardFrame
                card={card}
                editMode={editMode}
                onMaximize={() => setMaximizedCard(card)}
                onSettings={() => setSettingsCard(card)}
                onHide={() => handleHide(card.id)}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
      )}

      {/* ── Overlays ── */}
      {maximizedCard && (
        <CardMaximizeOverlay card={maximizedCard} onClose={() => setMaximizedCard(null)} />
      )}

      {settingsCard && (
        <CardSettingsPanel
          card={settingsCard}
          isAdmin={isAdmin}
          onClose={() => setSettingsCard(null)}
        />
      )}

      {libraryOpen && (
        <CardLibraryDrawer
          allCards={cards}
          visibleCardIds={layoutCardIds}
          currentBreakpoint={currentBp}
          currentLayout={currentLayout}
          cols={COLS[currentBp]}
          isAdmin={isAdmin}
          onClose={() => setLibraryOpen(false)}
          {...(isAdmin ? { onQuickAdd: handleQuickAdd } : {})}
        />
      )}
    </div>
  )
}
