import type { Card } from '@family-dashboard/types'

// ── Labels + colours per card type ───────────────────────────────────────────

const TYPE_LABELS: Record<Card['type'], string> = {
  'todo':          'To-do',
  'grocery':       'Grocery',
  'calendar':      'Calendar',
  'weather':       'Weather',
  'iframe':        'Embed',
  'chore-tracker': 'Chores',
}

const TYPE_PILL: Record<Card['type'], string> = {
  'todo':          'bg-indigo-500/20 text-indigo-300',
  'grocery':       'bg-emerald-500/20 text-emerald-300',
  'calendar':      'bg-blue-500/20 text-blue-300',
  'weather':       'bg-sky-500/20 text-sky-300',
  'iframe':        'bg-violet-500/20 text-violet-300',
  'chore-tracker': 'bg-amber-500/20 text-amber-300',
}

interface CardFrameProps {
  card: Card
  editMode: boolean
}

export function CardFrame({ card, editMode }: CardFrameProps) {
  return (
    <div
      className={[
        'h-full flex flex-col bg-slate-900 rounded-xl border overflow-hidden select-none',
        editMode
          ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
          : 'border-slate-800',
      ].join(' ')}
    >
      {/* ── Header ── drag-handle class is required by DashboardGrid's draggableHandle */}
      <div
        className={[
          'flex items-center gap-2 px-3 py-2 border-b border-slate-800 flex-shrink-0',
          editMode ? 'drag-handle cursor-grab active:cursor-grabbing' : '',
        ].join(' ')}
      >
        <span
          className={[
            'text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0',
            TYPE_PILL[card.type],
          ].join(' ')}
        >
          {TYPE_LABELS[card.type]}
        </span>
        <span className="text-white text-sm font-medium flex-1 min-w-0 truncate">
          {card.title}
        </span>
        {editMode && (
          <span className="text-slate-500 text-xs flex-shrink-0 pointer-events-none">⠿</span>
        )}
      </div>

      {/* ── Body — content wired up per-type in Phase 2 ── */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <p className="text-slate-600 text-xs">Content coming soon</p>
      </div>
    </div>
  )
}
