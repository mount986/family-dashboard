import { useState, type KeyboardEvent } from 'react'
import type { GroceryCategory, GroceryItem } from '@family-dashboard/types'
import {
  useGroceryItems,
  useCreateGroceryItem,
  useUpdateGroceryItem,
  useDeleteGroceryItem,
  useClearCheckedItems,
} from '@/api/grocery'

const CATEGORIES: GroceryCategory[] = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverages', 'household', 'other']

const CATEGORY_META: Record<GroceryCategory, { emoji: string; label: string }> = {
  produce:   { emoji: '🥦', label: 'Produce' },
  dairy:     { emoji: '🥛', label: 'Dairy' },
  meat:      { emoji: '🥩', label: 'Meat' },
  pantry:    { emoji: '🫙', label: 'Pantry' },
  frozen:    { emoji: '🧊', label: 'Frozen' },
  beverages: { emoji: '🧃', label: 'Beverages' },
  household: { emoji: '🧴', label: 'Household' },
  other:     { emoji: '🛒', label: 'Other' },
}

export function GroceryCardExpanded() {
  const { data: items = [], isLoading } = useGroceryItems()
  const createItem = useCreateGroceryItem()
  const updateItem = useUpdateGroceryItem()
  const deleteItem = useDeleteGroceryItem()
  const clearChecked = useClearCheckedItems()

  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<GroceryCategory>('other')
  const [newQuantity, setNewQuantity] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    createItem.mutate(
      { name, category: newCategory, ...(newQuantity.trim() ? { quantity: newQuantity.trim() } : {}) },
      { onSuccess: () => { setNewName(''); setNewQuantity('') } }
    )
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const unchecked = items.filter((i) => !i.isChecked)
  const checked = items.filter((i) => i.isChecked)

  // Group unchecked items by category
  const grouped = CATEGORIES.reduce<Record<GroceryCategory, GroceryItem[]>>(
    (acc, cat) => {
      acc[cat] = unchecked.filter((i) => i.category === cat)
      return acc
    },
    {} as Record<GroceryCategory, GroceryItem[]>
  )

  return (
    <div className="flex flex-col h-full">
      {/* ── Stats + clear button ── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800 text-xs text-slate-500 flex-shrink-0">
        <span>{unchecked.length} remaining</span>
        <span>{checked.length} in cart</span>
        {checked.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            {confirmClear ? (
              <>
                <span className="text-rose-400">Clear {checked.length} checked?</span>
                <button onClick={() => setConfirmClear(false)} className="text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                <button
                  onClick={() => { clearChecked.mutate(); setConfirmClear(false) }}
                  className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  Clear
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Done shopping
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-600 text-sm">List is empty — add items below</p>
          </div>
        )}

        {/* Grouped unchecked */}
        {CATEGORIES.map((cat) => {
          const catItems = grouped[cat]
          if (catItems.length === 0) return null
          const meta = CATEGORY_META[cat]
          return (
            <div key={cat}>
              <div className="px-4 py-1.5 bg-slate-800/40 border-b border-slate-800">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                  {meta.emoji} {meta.label}
                </span>
              </div>
              {catItems.map((item) => (
                <ExpandedRow
                  key={item.id}
                  item={item}
                  onToggle={() => updateItem.mutate({ id: item.id, isChecked: true })}
                  onDelete={() => deleteItem.mutate(item.id)}
                  onUpdate={(patch) => updateItem.mutate({ id: item.id, ...patch })}
                />
              ))}
            </div>
          )
        })}

        {/* Checked items */}
        {checked.length > 0 && (
          <div>
            <div className="px-4 py-1.5 bg-slate-800/40 border-b border-slate-800">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">✓ In cart</span>
            </div>
            {checked.map((item) => (
              <ExpandedRow
                key={item.id}
                item={item}
                onToggle={() => updateItem.mutate({ id: item.id, isChecked: false })}
                onDelete={() => deleteItem.mutate(item.id)}
                onUpdate={(patch) => updateItem.mutate({ id: item.id, ...patch })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add row ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t border-slate-800 bg-slate-900/50">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an item…"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <input
          type="text"
          value={newQuantity}
          onChange={(e) => setNewQuantity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Qty"
          className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as GroceryCategory)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_META[c].emoji} {CATEGORY_META[c].label}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || createItem.isPending}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function ExpandedRow({
  item, onToggle, onDelete, onUpdate,
}: {
  item: GroceryItem
  onToggle: () => void
  onDelete: () => void
  onUpdate: (patch: { name?: string; quantity?: string | null; category?: GroceryCategory }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.name)
  const meta = CATEGORY_META[item.category]

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.name) onUpdate({ name: trimmed })
    else setDraft(item.name)
    setEditing(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setDraft(item.name); setEditing(false) }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 group ${item.isChecked ? 'opacity-50' : ''}`}>
      <button
        onClick={onToggle}
        className={[
          'w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-xs transition-colors',
          item.isChecked ? 'bg-slate-600 border-slate-500 text-slate-300' : 'border-slate-600 hover:border-indigo-400',
        ].join(' ')}
      >
        {item.isChecked && '✓'}
      </button>

      <span className="text-base flex-shrink-0">{meta.emoji}</span>

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
            className={`text-sm cursor-text ${item.isChecked ? 'line-through text-slate-500' : 'text-slate-200'}`}
            onDoubleClick={() => !item.isChecked && setEditing(true)}
          >
            {item.name}
            {item.quantity && <span className="text-slate-500 ml-2 text-xs">({item.quantity})</span>}
          </span>
        )}
      </div>

      <select
        value={item.category}
        onChange={(e) => onUpdate({ category: e.target.value as GroceryCategory })}
        disabled={item.isChecked}
        className="text-xs bg-transparent border-0 text-slate-500 focus:outline-none cursor-pointer disabled:opacity-50"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{CATEGORY_META[c].label}</option>
        ))}
      </select>

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
