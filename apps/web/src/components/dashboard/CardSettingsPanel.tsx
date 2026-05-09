import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import type { Card } from '@family-dashboard/types'
import { useUpdateCard, useDeleteCard } from '@/api/cards'

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

// ── Props ─────────────────────────────────────────────────────────────────────

interface CardSettingsPanelProps {
  card: Card
  isAdmin: boolean
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CardSettingsPanel({ card, isAdmin, onClose }: CardSettingsPanelProps) {
  const meta = TYPE_META[card.type]
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()

  const [title, setTitle] = useState(card.title)
  const [isShared, setIsShared] = useState(card.isShared)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Re-sync if the card prop changes (e.g. after a mutation invalidates the query)
  useEffect(() => {
    setTitle(card.title)
    setIsShared(card.isShared)
  }, [card.title, card.isShared])

  const titleRef = useRef<HTMLInputElement>(null)

  function commitTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== card.title) {
      updateCard.mutate({ id: card.id, title: trimmed })
    } else {
      // Reset to current value if empty or unchanged
      setTitle(card.title)
    }
  }

  function handleTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      titleRef.current?.blur()
    } else if (e.key === 'Escape') {
      setTitle(card.title)
      titleRef.current?.blur()
    }
  }

  function toggleShared() {
    const next = !isShared
    setIsShared(next)
    updateCard.mutate({ id: card.id, isShared: next })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-60 bg-slate-950/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides in from the right */}
      <div
        className="fixed right-0 top-0 bottom-0 z-60 w-80 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl"
        style={{
          transform: 'translateX(0)',
          transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        role="dialog"
        aria-label="Card settings"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            {/* Icon square — 28×28, matching CardFrame */}
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              {meta.emoji}
            </span>
            <span className="text-sm font-semibold text-slate-100 truncate">
              {card.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors ml-2 flex-shrink-0 text-lg leading-none"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {isAdmin ? (
            <>
              {/* Section: Card Title */}
              <section className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Card Title
                </p>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-500 transition-colors"
                  placeholder="Card title"
                />
              </section>

              {/* Section: Visibility */}
              <section className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Visibility
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Shared with all profiles</span>
                  {/* Pill toggle */}
                  <button
                    role="switch"
                    aria-checked={isShared}
                    onClick={toggleShared}
                    className={[
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                      isShared ? 'bg-indigo-600' : 'bg-slate-600',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                        isShared ? 'translate-x-6' : 'translate-x-1',
                      ].join(' ')}
                    />
                  </button>
                </div>
              </section>

              {/* Section: Card Type */}
              <section className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Card Type
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: meta.bg, color: meta.color }}
                  >
                    {meta.emoji}
                  </span>
                  <span className="text-sm text-slate-300">{meta.label}</span>
                </div>
                <p className="text-slate-500 text-xs">Card type cannot be changed after creation.</p>
              </section>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">
              Settings can only be changed by an admin.
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-slate-800 space-y-2">
          {isAdmin && (
            confirmDelete ? (
              <div className="space-y-2">
                <p className="text-xs text-rose-400 text-center">Delete this card permanently?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteCard.mutate(card.id, { onSuccess: onClose })}
                    disabled={deleteCard.isPending}
                    className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    {deleteCard.isPending ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium transition-colors border border-rose-500/20"
              >
                Delete Card
              </button>
            )
          )}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}
