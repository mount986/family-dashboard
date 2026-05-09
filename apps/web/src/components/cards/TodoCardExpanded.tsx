import { useState, useRef, type KeyboardEvent } from 'react'
import type { Card, TodoItem, TodoPriority } from '@family-dashboard/types'
import {
  useTodoList,
  useCreateTodoItem,
  useUpdateTodoItem,
  useDeleteTodoItem,
} from '@/api/todos'

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<TodoPriority, { label: string; color: string }> = {
  1: { label: 'High',   color: 'text-rose-400' },
  2: { label: 'Medium', color: 'text-amber-400' },
  3: { label: 'Low',    color: 'text-slate-500' },
}

function isOverdue(item: TodoItem) {
  return !item.completedAt && item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface TodoCardExpandedProps {
  card: Card
}

// ── Row component ─────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onToggle,
  onDelete,
  onUpdate,
}: {
  item: TodoItem
  onToggle: () => void
  onDelete: () => void
  onUpdate: (patch: { text?: string; priority?: TodoPriority; dueDate?: string | null }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)
  const isDone = !!item.completedAt
  const overdue = isOverdue(item)
  const p = PRIORITY_LABELS[item.priority]

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.text) onUpdate({ text: trimmed })
    else setDraft(item.text)
    setEditing(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setDraft(item.text); setEditing(false) }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 group ${isDone ? 'opacity-50' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={[
          'w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-xs transition-colors',
          isDone
            ? 'bg-slate-600 border-slate-500 text-slate-300'
            : 'border-slate-600 hover:border-indigo-400',
        ].join(' ')}
      >
        {isDone && '✓'}
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        ) : (
          <span
            className={[
              'text-sm cursor-text',
              isDone ? 'line-through text-slate-500' : overdue ? 'text-rose-400' : 'text-slate-200',
            ].join(' ')}
            onDoubleClick={() => !isDone && setEditing(true)}
          >
            {item.text}
          </span>
        )}
      </div>

      {/* Priority */}
      <select
        value={item.priority}
        onChange={(e) => onUpdate({ priority: Number(e.target.value) as TodoPriority })}
        disabled={isDone}
        className={`text-xs bg-transparent border-0 focus:outline-none cursor-pointer ${p.color} disabled:opacity-50`}
      >
        <option value={1}>High</option>
        <option value={2}>Medium</option>
        <option value={3}>Low</option>
      </select>

      {/* Due date */}
      <input
        type="date"
        value={item.dueDate ?? ''}
        onChange={(e) => onUpdate({ dueDate: e.target.value || null })}
        disabled={isDone}
        className="text-xs bg-transparent border-0 text-slate-500 focus:outline-none cursor-pointer disabled:opacity-50 w-28"
      />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs"
        aria-label="Delete"
      >
        ✕
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TodoCardExpanded({ card }: TodoCardExpandedProps) {
  const listId = (card.config as { listId?: string } | undefined)?.listId
  const { data, isLoading } = useTodoList(listId)
  const createItem = useCreateTodoItem(listId ?? '')
  const updateItem = useUpdateTodoItem(listId ?? '')
  const deleteItem = useDeleteTodoItem(listId ?? '')

  const [newText, setNewText] = useState('')
  const [newPriority, setNewPriority] = useState<TodoPriority>(2)
  const [showDone, setShowDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleAdd() {
    const text = newText.trim()
    if (!text || !listId) return
    createItem.mutate({ text, priority: newPriority }, { onSuccess: () => setNewText('') })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  if (!listId || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const items = data?.items ?? []
  const active = items.filter((i) => !i.completedAt)
  const done = items.filter((i) => i.completedAt)

  return (
    <div className="flex flex-col h-full">
      {/* ── Stats bar ── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800 text-xs text-slate-500 flex-shrink-0">
        <span>{active.length} remaining</span>
        <span>{done.length} completed</span>
        {done.length > 0 && (
          <button
            onClick={() => setShowDone((v) => !v)}
            className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showDone ? 'Hide completed' : 'Show completed'}
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto">
        {active.length === 0 && !showDone && (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-600 text-sm">All done! Add tasks below.</p>
          </div>
        )}

        {active.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={() => updateItem.mutate({ itemId: item.id, completedAt: new Date().toISOString() })}
            onDelete={() => deleteItem.mutate(item.id)}
            onUpdate={(patch) => updateItem.mutate({ itemId: item.id, ...patch })}
          />
        ))}

        {showDone && done.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={() => updateItem.mutate({ itemId: item.id, completedAt: null })}
            onDelete={() => deleteItem.mutate(item.id)}
            onUpdate={(patch) => updateItem.mutate({ itemId: item.id, ...patch })}
          />
        ))}
      </div>

      {/* ── Add row ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-t border-slate-800 bg-slate-900/50">
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task…"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(Number(e.target.value) as TodoPriority)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value={1}>High</option>
          <option value={2}>Medium</option>
          <option value={3}>Low</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={!newText.trim() || createItem.isPending}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </div>
  )
}
