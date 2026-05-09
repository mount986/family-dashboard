import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Card } from '@family-dashboard/types'
import { TodoCardExpanded } from '@/components/cards/TodoCardExpanded'
import { GroceryCardExpanded } from '@/components/cards/GroceryCardExpanded'

function CardExpandedBody({ card }: { card: Card }) {
  if (card.type === 'todo') return <TodoCardExpanded card={card} />
  if (card.type === 'grocery') return <GroceryCardExpanded />
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-slate-600 text-sm">{card.type} — expanded view coming soon</p>
    </div>
  )
}

// ── Icon metadata per card type ───────────────────────────────────────────────

const TYPE_ICON: Record<Card['type'], { emoji: string; bg: string; color: string }> = {
  'todo':          { emoji: '✅', bg: '#fef9c3', color: '#713f12' },
  'grocery':       { emoji: '🛒', bg: '#ffe4e6', color: '#9f1239' },
  'calendar':      { emoji: '📅', bg: '#ffedd5', color: '#9a3412' },
  'weather':       { emoji: '🌤', bg: '#ccfbf1', color: '#134e4a' },
  'iframe':        { emoji: '🔗', bg: '#f3e8ff', color: '#6b21a8' },
  'chore-tracker': { emoji: '🧹', bg: '#e0e7ff', color: '#3730a3' },
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CardMaximizeOverlayProps {
  card: Card
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

function CardMaximizeOverlayInner({ card, onClose }: CardMaximizeOverlayProps) {
  const icon = TYPE_ICON[card.type]

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    // Backdrop — click outside the card to close
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Inner card — stop propagation so clicks inside don't close the overlay */}
      <div
        className="relative m-4 flex-1 flex flex-col bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden max-w-7xl mx-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 flex-shrink-0">
          {/* Icon square */}
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
            style={{ backgroundColor: icon.bg, color: icon.color }}
          >
            {icon.emoji}
          </span>

          {/* Title */}
          <span className="text-sm font-semibold flex-1 min-w-0 truncate text-slate-100">
            {card.title}
          </span>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden">
          <CardExpandedBody card={card} />
        </div>
      </div>
    </div>
  )
}

export function CardMaximizeOverlay(props: CardMaximizeOverlayProps) {
  return createPortal(<CardMaximizeOverlayInner {...props} />, document.body)
}
