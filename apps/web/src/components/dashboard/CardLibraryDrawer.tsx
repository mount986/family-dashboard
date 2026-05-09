import type { Breakpoint, Card, CardLayout } from '@family-dashboard/types'
import { useSaveLayout } from '@/api/layouts'

// ── Icon metadata per card type ───────────────────────────────────────────────

const TYPE_META: Record<
  Card['type'],
  { emoji: string; bg: string; color: string; label: string }
> = {
  'todo':          { emoji: '✅', bg: '#fef9c3', color: '#713f12', label: 'To-Do List' },
  'grocery':       { emoji: '🛒', bg: '#ffe4e6', color: '#9f1239', label: 'Grocery List' },
  'calendar':      { emoji: '📅', bg: '#ffedd5', color: '#9a3412', label: 'Calendar' },
  'weather':       { emoji: '🌤', bg: '#ccfbf1', color: '#134e4a', label: 'Weather' },
  'iframe':        { emoji: '🔗', bg: '#f3e8ff', color: '#6b21a8', label: 'Web Frame' },
  'chore-tracker': { emoji: '🧹', bg: '#e0e7ff', color: '#3730a3', label: 'Chore Tracker' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute a default CardLayout for a newly-added card */
function computeDefaultLayout(
  cardId: string,
  currentLayout: CardLayout[],
  cols: number
): CardLayout {
  const bottomY =
    currentLayout.length > 0
      ? Math.max(...currentLayout.map((cl) => cl.y + cl.h))
      : 0

  return {
    cardId,
    x: 0,
    y: bottomY,
    w: Math.floor(cols / 2),
    h: 4,
    isMinimized: false,
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CardLibraryDrawerProps {
  /** All cards visible to this profile */
  allCards: Card[]
  /** Card IDs currently on the dashboard (have layout entries) */
  visibleCardIds: Set<string>
  /** The current breakpoint, used when adding a card to the layout */
  currentBreakpoint: Breakpoint
  /** Current layout for the active breakpoint, used to compute a new position */
  currentLayout: CardLayout[]
  /** Number of columns at the current breakpoint */
  cols: number
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CardLibraryDrawer({
  allCards,
  visibleCardIds,
  currentBreakpoint,
  currentLayout,
  cols,
  onClose,
}: CardLibraryDrawerProps) {
  const saveLayout = useSaveLayout()

  const libraryCards = allCards.filter((c) => !visibleCardIds.has(c.id))

  function handleAddCard(card: Card) {
    const newEntry = computeDefaultLayout(card.id, currentLayout, cols)
    saveLayout.mutate(
      { breakpoint: currentBreakpoint, layout: [...currentLayout, newEntry] },
      { onSuccess: onClose }
    )
  }

  const count = libraryCards.length
  const subtitle = `${count} card${count !== 1 ? 's' : ''} available`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — slides up from bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-2xl shadow-2xl flex flex-col max-h-[60vh]"
        style={{
          transform: 'translateY(0)',
          transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        role="dialog"
        aria-label="Card library"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-100 font-semibold text-sm">Card Library</span>
            <span className="text-slate-500 text-xs">{subtitle}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-lg leading-none"
            aria-label="Close library"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-3">
          {libraryCards.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8">
              <p className="text-slate-500 text-sm">All cards are on your dashboard</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {libraryCards.map((card) => {
                const meta = TYPE_META[card.type]
                const isPending =
                  saveLayout.isPending &&
                  saveLayout.variables?.layout.at(-1)?.cardId === card.id

                return (
                  <button
                    key={card.id}
                    onClick={() => handleAddCard(card)}
                    disabled={isPending}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 cursor-pointer transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {/* Icon square — 24×24 */}
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex flex-col">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {card.title}
                      </span>
                      <span className="text-xs text-slate-500">{meta.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
