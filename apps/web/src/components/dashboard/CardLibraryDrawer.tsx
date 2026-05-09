import { useState } from 'react'
import type { Breakpoint, Card, CardLayout } from '@family-dashboard/types'
import { useSaveLayout } from '@/api/layouts'

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META: Record<
  Card['type'],
  { emoji: string; bg: string; color: string; label: string }
> = {
  'todo':          { emoji: '✅', bg: '#fef9c3', color: '#713f12', label: 'To-Do List' },
  'grocery':       { emoji: '🛒', bg: '#ffe4e6', color: '#9f1239', label: 'Grocery' },
  'calendar':      { emoji: '📅', bg: '#ffedd5', color: '#9a3412', label: 'Calendar' },
  'weather':       { emoji: '🌤', bg: '#ccfbf1', color: '#134e4a', label: 'Weather' },
  'iframe':        { emoji: '🔗', bg: '#f3e8ff', color: '#6b21a8', label: 'Web Embed' },
  'chore-tracker': { emoji: '🧹', bg: '#e0e7ff', color: '#3730a3', label: 'Chores' },
}

const CARD_TYPES = Object.keys(TYPE_META) as Card['type'][]

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeDefaultLayout(cardId: string, currentLayout: CardLayout[], cols: number): CardLayout {
  const bottomY = currentLayout.length > 0
    ? Math.max(...currentLayout.map((cl) => cl.y + cl.h))
    : 0
  return { cardId, x: 0, y: bottomY, w: Math.floor(cols / 2), h: 4, isMinimized: false }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CardLibraryDrawerProps {
  allCards: Card[]
  visibleCardIds: Set<string>
  currentBreakpoint: Breakpoint
  currentLayout: CardLayout[]
  cols: number
  isAdmin: boolean
  onClose: () => void
  onQuickAdd?: (type: Card['type']) => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CardLibraryDrawer({
  allCards,
  visibleCardIds,
  currentBreakpoint,
  currentLayout,
  cols,
  isAdmin,
  onClose,
  onQuickAdd,
}: CardLibraryDrawerProps) {
  const saveLayout = useSaveLayout()

  const [quickAddPending, setQuickAddPending] = useState<Card['type'] | null>(null)

  const libraryCards = allCards.filter((c) => !visibleCardIds.has(c.id))

  function handleAddCard(card: Card) {
    const newEntry = computeDefaultLayout(card.id, currentLayout, cols)
    saveLayout.mutate(
      { breakpoint: currentBreakpoint, layout: [...currentLayout, newEntry] },
      { onSuccess: onClose }
    )
  }

  async function handleQuickAddClick(type: Card['type']) {
    if (!onQuickAdd || quickAddPending) return
    setQuickAddPending(type)
    try {
      await onQuickAdd(type)
    } finally {
      setQuickAddPending(null)
    }
  }

  const libraryCount = libraryCards.length
  const subtitle = libraryCount > 0
    ? `${libraryCount} card${libraryCount !== 1 ? 's' : ''} available to add`
    : 'No hidden cards'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-950/60" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh]"
        role="dialog"
        aria-label="Add card"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-100 font-semibold text-sm">Add Card</span>
            <span className="text-slate-500 text-xs">{subtitle}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Quick Add (admin only) ── */}
          {isAdmin && onQuickAdd && (
            <div className="p-4 border-b border-slate-800 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Click a card to place it on the board
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CARD_TYPES.map((type) => {
                  const meta = TYPE_META[type]
                  const pending = quickAddPending === type
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={!!quickAddPending}
                      onClick={() => handleQuickAddClick(type)}
                      className={[
                        'flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-center transition-colors',
                        pending
                          ? 'border-indigo-500 bg-indigo-500/10 opacity-70'
                          : 'border-slate-700 bg-slate-800 hover:border-indigo-400 hover:bg-indigo-500/5 active:scale-95',
                        quickAddPending && !pending ? 'opacity-40 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {pending ? '…' : meta.emoji}
                      </span>
                      <span className="text-[10px] font-medium text-slate-300 leading-tight">
                        {meta.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Library: hidden / off-dashboard cards ── */}
          {libraryCards.length > 0 && (
            <div className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Hidden Cards
              </p>
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
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
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
            </div>
          )}

          {/* ── Empty state (non-admin with nothing hidden) ── */}
          {!isAdmin && libraryCards.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-500 text-sm">All cards are on your dashboard</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
