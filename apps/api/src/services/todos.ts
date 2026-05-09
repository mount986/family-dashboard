import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { todoLists, todoItems } from '../db/schema.js'
import { randomUUID } from 'crypto'
import type { TodoList, TodoItem, CreateTodoItemInput, UpdateTodoItemInput } from '@family-dashboard/types'

// ── Row → domain ──────────────────────────────────────────────────────────────

function rowToList(row: typeof todoLists.$inferSelect): TodoList {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    isShared: row.isShared,
    createdAt: new Date(row.createdAt as number).toISOString(),
  }
}

function rowToItem(row: typeof todoItems.$inferSelect): TodoItem {
  return {
    id: row.id,
    listId: row.listId,
    text: row.text,
    assignedTo: row.assignedTo ?? null,
    dueDate: row.dueDate ?? null,
    priority: (row.priority ?? 2) as TodoItem['priority'],
    completedAt: row.completedAt ? new Date(row.completedAt as number).toISOString() : null,
    createdAt: new Date(row.createdAt as number).toISOString(),
  }
}

// ── Lists ─────────────────────────────────────────────────────────────────────

export async function createList(ownerId: string, name: string): Promise<TodoList> {
  const id = randomUUID()
  await db.insert(todoLists).values({ id, name, ownerId, isShared: true, createdAt: Date.now() })
  const rows = await db.select().from(todoLists).where(eq(todoLists.id, id))
  if (!rows[0]) throw new Error(`List ${id} not found after insert`)
  return rowToList(rows[0])
}

export async function getList(listId: string): Promise<TodoList | null> {
  const rows = await db.select().from(todoLists).where(eq(todoLists.id, listId))
  return rows[0] ? rowToList(rows[0]) : null
}

// ── Items ─────────────────────────────────────────────────────────────────────

export async function getItems(listId: string): Promise<TodoItem[]> {
  const rows = await db
    .select()
    .from(todoItems)
    .where(eq(todoItems.listId, listId))
  return rows.map(rowToItem)
}

export async function createItem(listId: string, input: CreateTodoItemInput): Promise<TodoItem> {
  const id = randomUUID()
  await db.insert(todoItems).values({
    id,
    listId,
    text: input.text,
    assignedTo: input.assignedTo ?? null,
    dueDate: input.dueDate ?? null,
    priority: input.priority ?? 2,
    createdAt: Date.now(),
  })
  const rows = await db.select().from(todoItems).where(eq(todoItems.id, id))
  if (!rows[0]) throw new Error(`Item ${id} not found after insert`)
  return rowToItem(rows[0])
}

export async function updateItem(itemId: string, input: UpdateTodoItemInput): Promise<TodoItem | null> {
  const existing = await db.select().from(todoItems).where(eq(todoItems.id, itemId))
  if (!existing[0]) return null

  const updates: Partial<typeof todoItems.$inferInsert> = {}
  if (input.text !== undefined) updates.text = input.text
  if (input.assignedTo !== undefined) updates.assignedTo = input.assignedTo
  if (input.dueDate !== undefined) updates.dueDate = input.dueDate
  if (input.priority !== undefined) updates.priority = input.priority
  if (input.completedAt !== undefined) {
    updates.completedAt = input.completedAt ? new Date(input.completedAt).getTime() : null
  }

  if (Object.keys(updates).length > 0) {
    await db.update(todoItems).set(updates).where(eq(todoItems.id, itemId))
  }

  const rows = await db.select().from(todoItems).where(eq(todoItems.id, itemId))
  return rows[0] ? rowToItem(rows[0]) : null
}

export async function deleteItem(itemId: string): Promise<void> {
  await db.delete(todoItems).where(eq(todoItems.id, itemId))
}
