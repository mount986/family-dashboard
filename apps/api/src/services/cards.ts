import { eq, or, and } from 'drizzle-orm'
import { db } from '../db/client.js'
import { cards } from '../db/schema.js'
import { randomUUID } from 'crypto'
import type { Card, CreateCardInput, UpdateCardInput } from '@family-dashboard/types'

// ── Row → domain type ─────────────────────────────────────────────────────────
// Note: the cards table uses `is_admin` to mean "admin-only visible".
// The shared Card type calls this field `isPrivate` (intentionally distinct
// from the profile-level isAdmin flag).

function rowToCard(row: typeof cards.$inferSelect): Card {
  return {
    id: row.id,
    type: row.type as Card['type'],
    title: row.title,
    config: JSON.parse(row.configJson) as Card['config'],
    ownerId: row.ownerId,
    isShared: row.isShared,
    isPrivate: row.isAdmin, // DB isAdmin → type isPrivate
    createdAt: new Date(row.createdAt as number).toISOString(),
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listCards(profileId: string, isAdmin: boolean): Promise<Card[]> {
  const rows = isAdmin
    ? await db.select().from(cards)
    : await db
        .select()
        .from(cards)
        .where(
          and(
            or(eq(cards.isShared, true), eq(cards.ownerId, profileId)),
            eq(cards.isAdmin, false) // non-admins cannot see admin-only cards
          )
        )
  return rows.map(rowToCard)
}

export async function getCard(id: string): Promise<Card | null> {
  const rows = await db.select().from(cards).where(eq(cards.id, id))
  return rows[0] ? rowToCard(rows[0]) : null
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createCard(ownerId: string, input: CreateCardInput): Promise<Card> {
  const id = randomUUID()
  await db.insert(cards).values({
    id,
    type: input.type,
    title: input.title,
    configJson: JSON.stringify(input.config ?? {}),
    ownerId,
    isShared: input.isShared ?? true,
    isAdmin: input.isPrivate ?? false,
    createdAt: Date.now(),
  })
  const inserted = await db.select().from(cards).where(eq(cards.id, id))
  if (!inserted[0]) throw new Error(`Card ${id} not found after insert`)
  return rowToCard(inserted[0])
}

export async function updateCard(id: string, input: UpdateCardInput): Promise<Card | null> {
  const existing = await db.select().from(cards).where(eq(cards.id, id))
  if (!existing[0]) return null

  const updates: Partial<typeof cards.$inferInsert> = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.isShared !== undefined) updates.isShared = input.isShared
  if (input.isPrivate !== undefined) updates.isAdmin = input.isPrivate
  if (input.config !== undefined) {
    const base = JSON.parse(existing[0].configJson) as Record<string, unknown>
    updates.configJson = JSON.stringify({ ...base, ...(input.config as Record<string, unknown>) })
  }

  if (Object.keys(updates).length > 0) {
    await db.update(cards).set(updates).where(eq(cards.id, id))
  }

  const updated = await db.select().from(cards).where(eq(cards.id, id))
  if (!updated[0]) return null
  return rowToCard(updated[0])
}

export async function deleteCard(id: string): Promise<void> {
  await db.delete(cards).where(eq(cards.id, id))
}
