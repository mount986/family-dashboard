import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import type { Card, TodoItem } from '@family-dashboard/types'
import { useQueryClient } from '@tanstack/react-query'
import { cardKeys } from '@/api/cards'
import {
  useTodoList,
  useCreateTodoList,
  useCreateTodoItem,
  useUpdateTodoItem,
  useDeleteTodoItem,
} from '@/api/todos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function priorityColor(p: TodoItem['priority']) {
  return p === 1 ? 'bg-rose-500' : p === 3 ? 'bg-slate-600' : 'bg-amber-500'
}

function isOverdue(item: TodoItem) {
  return !item.completedAt && item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface TodoCardProps {
  card: Card
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodoCard({ card }: TodoCardProps) {
  const listId = (card.config as { listId?: string } | undefined)?.listId
  const qc = useQueryClient()
  const createList = useCreateTodoList()
  const { data, isLoading } = useTodoList(listId)
  const createItem = useCreateTodoItem(listId ?? '')
  const updateItem = useUpdateTodoItem(listId ?? '')
  const deleteItem = useDeleteTodoItem(listId ?? '')

  const [newText, setNewText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Lazily create the backing list the first time this card renders
  useEffect(() => {
    if (!listId) {
      createList.mutate(
        { name: card.title, cardId: card.id },
        { onSuccess: () => qc.invalidateQueries({ queryKey: cardKeys.all }) }
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  function handleAddItem() {
    const text = newText.trim()
    if (!text || !listId) return
    createItem.mutate({ text }, { onSuccess: () => setNewText('') })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAddItem()
  }

  function toggleComplete(item: TodoItem) {
    updateItem.mutate({
      itemId: item.id,
      completedAt: item.completedAt ? null : new Date().toISOString(),
    })
  }

  if (!listId || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const items = data?.items ?? []
  const active = items.filter((i) => !i.completedAt)
  const done = items.filter((i) => i.completedAt)

  return (
    <div className="flex flex-col h-full text-sm">
      {/* ── Item list ── */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 space-y-1">
        {active.length === 0 && done.length === 0 && (
          <p className="text-slate-600 text-xs text-center pt-4">No tasks yet — add one below</p>
        )}

        {active.map((item) => (
          <div key={item.id} className="flex items-start gap-2 py-1 group">
            <button
              onClick={() => toggleComplete(item)}
              className="mt-0.5 w-4 h-4 rounded border border-slate-600 flex-shrink-0 hover:border-indigo-400 transition-colors"
              aria-label="Complete"
            />
            <span className={['flex-1 text-slate-200 leading-tight', isOverdue(item) ? 'text-rose-400' : ''].join(' ')}>
              {item.text}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${priorityColor(item.priority)}`} />
            <button
              onClick={() => deleteItem.mutate(item.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all text-xs leading-none"
              aria-label="Delete"
            >
              ✕
            </button>
          </div>
        ))}

        {done.length > 0 && (
          <p className="text-slate-600 text-[10px] uppercase tracking-widest pt-2 pb-0.5">
            Done ({done.length})
          </p>
        )}
        {done.map((item) => (
          <div key={item.id} className="flex items-start gap-2 py-1 group opacity-40">
            <button
              onClick={() => toggleComplete(item)}
              className="mt-0.5 w-4 h-4 rounded border border-slate-500 bg-slate-600 flex-shrink-0 flex items-center justify-center text-[9px] text-slate-300"
            >
              ✓
            </button>
            <span className="flex-1 text-slate-400 line-through leading-tight">{item.text}</span>
            <button
              onClick={() => deleteItem.mutate(item.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all text-xs leading-none"
              aria-label="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ── Add item input ── */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-slate-800 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task…"
          className="flex-1 bg-transparent text-slate-300 placeholder-slate-600 text-xs focus:outline-none min-w-0"
        />
        <button
          onClick={handleAddItem}
          disabled={!newText.trim() || createItem.isPending}
          className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 text-xs font-medium transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}
