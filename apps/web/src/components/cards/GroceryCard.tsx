import { useState, type KeyboardEvent } from 'react'
import type { GroceryCategory, GroceryItem } from '@family-dashboard/types'
import {
  useGroceryItems,
  useCreateGroceryItem,
  useUpdateGroceryItem,
  useDeleteGroceryItem,
} from '@/api/grocery'

const CATEGORY_EMOJI: Record<GroceryCategory, string> = {
  produce:    '🥦',
  dairy:      '🥛',
  meat:       '🥩',
  pantry:     '🫙',
  frozen:     '🧊',
  beverages:  '🧃',
  household:  '🧴',
  other:      '🛒',
}

export function GroceryCard() {
  const { data: items = [], isLoading } = useGroceryItems()
  const createItem = useCreateGroceryItem()
  const updateItem = useUpdateGroceryItem()
  const deleteItem = useDeleteGroceryItem()

  const [newName, setNewName] = useState('')

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    createItem.mutate({ name }, { onSuccess: () => setNewName('') })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const unchecked = items.filter((i) => !i.isChecked)
  const checked = items.filter((i) => i.isChecked)

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="flex-1 overflow-y-auto px-3 pt-2 space-y-1">
        {unchecked.length === 0 && checked.length === 0 && (
          <p className="text-slate-600 text-xs text-center pt-4">List is empty — add items below</p>
        )}

        {unchecked.map((item) => (
          <ItemRow key={item.id} item={item} onToggle={() => updateItem.mutate({ id: item.id, isChecked: true })} onDelete={() => deleteItem.mutate(item.id)} />
        ))}

        {checked.length > 0 && (
          <p className="text-slate-600 text-[10px] uppercase tracking-widest pt-2 pb-0.5">
            In cart ({checked.length})
          </p>
        )}
        {checked.map((item) => (
          <ItemRow key={item.id} item={item} onToggle={() => updateItem.mutate({ id: item.id, isChecked: false })} onDelete={() => deleteItem.mutate(item.id)} />
        ))}
      </div>

      <div className="flex-shrink-0 px-3 py-2 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an item…"
          className="flex-1 bg-transparent text-slate-300 placeholder-slate-600 text-xs focus:outline-none min-w-0"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || createItem.isPending}
          className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 text-xs font-medium transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function ItemRow({ item, onToggle, onDelete }: { item: GroceryItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`flex items-center gap-2 py-1 group ${item.isChecked ? 'opacity-40' : ''}`}>
      <button
        onClick={onToggle}
        className={[
          'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[9px] transition-colors',
          item.isChecked ? 'bg-slate-600 border-slate-500 text-slate-300' : 'border-slate-600 hover:border-indigo-400',
        ].join(' ')}
      >
        {item.isChecked && '✓'}
      </button>
      <span className="text-xs">{CATEGORY_EMOJI[item.category]}</span>
      <span className={`flex-1 text-slate-200 leading-tight text-xs ${item.isChecked ? 'line-through' : ''}`}>
        {item.name}
        {item.quantity && <span className="text-slate-500 ml-1">({item.quantity})</span>}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all text-xs leading-none"
        aria-label="Delete"
      >
        ✕
      </button>
    </div>
  )
}
