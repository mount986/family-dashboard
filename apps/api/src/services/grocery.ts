import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { groceryItems } from '../db/schema.js'
import { randomUUID } from 'crypto'
import type { GroceryItem, CreateGroceryItemInput, UpdateGroceryItemInput } from '@family-dashboard/types'

function rowToItem(row: typeof groceryItems.$inferSelect): GroceryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as GroceryItem['category'],
    quantity: row.quantity ?? null,
    addedBy: row.addedBy,
    isChecked: row.isChecked,
    createdAt: new Date(row.createdAt as number).toISOString(),
  }
}

export async function listItems(): Promise<GroceryItem[]> {
  const rows = await db.select().from(groceryItems)
  return rows.map(rowToItem)
}

export async function createItem(addedBy: string, input: CreateGroceryItemInput): Promise<GroceryItem> {
  const id = randomUUID()
  await db.insert(groceryItems).values({
    id,
    name: input.name,
    category: input.category ?? 'other',
    quantity: input.quantity ?? null,
    addedBy,
    isChecked: false,
    createdAt: Date.now(),
  })
  const rows = await db.select().from(groceryItems).where(eq(groceryItems.id, id))
  if (!rows[0]) throw new Error(`Item ${id} not found after insert`)
  return rowToItem(rows[0])
}

export async function updateItem(id: string, input: UpdateGroceryItemInput): Promise<GroceryItem | null> {
  const existing = await db.select().from(groceryItems).where(eq(groceryItems.id, id))
  if (!existing[0]) return null

  const updates: Partial<typeof groceryItems.$inferInsert> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.category !== undefined) updates.category = input.category
  if (input.quantity !== undefined) updates.quantity = input.quantity
  if (input.isChecked !== undefined) updates.isChecked = input.isChecked

  if (Object.keys(updates).length > 0) {
    await db.update(groceryItems).set(updates).where(eq(groceryItems.id, id))
  }

  const rows = await db.select().from(groceryItems).where(eq(groceryItems.id, id))
  return rows[0] ? rowToItem(rows[0]) : null
}

export async function deleteItem(id: string): Promise<void> {
  await db.delete(groceryItems).where(eq(groceryItems.id, id))
}

export async function clearChecked(): Promise<void> {
  await db.delete(groceryItems).where(eq(groceryItems.isChecked, true))
}
