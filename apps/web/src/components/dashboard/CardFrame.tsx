import type { Card } from '@family-dashboard/types'
import { TodoCard } from '@/components/cards/TodoCard'
import { GroceryCard } from '@/components/cards/GroceryCard'
import { IframeCard } from '@/components/cards/IframeCard'
import { WeatherCard } from '@/components/cards/WeatherCard'

// ── Card body registry ────────────────────────────────────────────────────────

function CardBody({ card }: { card: Card }) {
  if (card.type === 'todo') return <TodoCard card={card} />
  if (card.type === 'grocery') return <GroceryCard />
  if (card.type === 'iframe' || card.type === 'chore-tracker') return <IframeCard card={card} />
  if (card.type === 'weather') return <WeatherCard card={card} />
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-slate-600 text-xs">{card.type} — coming soon</p>
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

interface CardFrameProps {
  card: Card
  editMode: boolean
  onMaximize: () => void
  onSettings: () => void
  onHide: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CardFrame({ card, editMode, onMaximize, onSettings, onHide }: CardFrameProps) {
  const icon = TYPE_ICON[card.type]

  return (
    <div
      className={[
        'h-full flex flex-col bg-slate-900 rounded-xl border overflow-hidden select-none',
        editMode
          ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/10'
          : 'border-slate-800',
      ].join(' ')}
    >
      {/* ── Header ── */}
      <div
        className={[
          'flex items-center gap-2 px-3 py-2 border-b border-slate-800 flex-shrink-0',
          editMode ? 'drag-handle cursor-grab active:cursor-grabbing' : '',
        ].join(' ')}
      >
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

        {/* Maximize — only in view mode */}
        {!editMode && (
          <button
            onClick={onMaximize}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            aria-label="Maximize"
          >
            ⛶
          </button>
        )}

        {/* Settings + Hide — only in edit mode */}
        {editMode && (
          <>
            <button
              onClick={onSettings}
              className="drag-cancel w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              aria-label="Settings"
            >
              ⚙
            </button>
            <button
              onClick={onHide}
              className="drag-cancel w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
              aria-label="Hide"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden relative">
        <CardBody card={card} />
      </div>

      {/* ── Footer (edit mode only) ── */}
      {editMode && (
        <div className="flex justify-end px-3 py-1 border-t border-slate-800 flex-shrink-0">
          <span className="text-slate-600 text-[10px]">⠿ drag to resize</span>
        </div>
      )}
    </div>
  )
}
