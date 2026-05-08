import { eq, and } from 'drizzle-orm'
import { db } from '../db/client.js'
import { dashboardLayouts } from '../db/schema.js'
import { randomUUID } from 'crypto'
import type { Breakpoint, CardLayout, DashboardLayout } from '@family-dashboard/types'

const BREAKPOINTS: Breakpoint[] = ['xl', 'lg', 'md', 'sm', 'xs']

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getLayouts(profileId: string): Promise<DashboardLayout> {
  const rows = await db
    .select()
    .from(dashboardLayouts)
    .where(eq(dashboardLayouts.profileId, profileId))

  // Initialise all breakpoints to empty arrays
  const result = Object.fromEntries(
    BREAKPOINTS.map((bp) => [bp, [] as CardLayout[]])
  ) as DashboardLayout

  for (const row of rows) {
    const bp = row.breakpoint as Breakpoint
    if (BREAKPOINTS.includes(bp)) {
      result[bp].push({
        cardId: row.cardId,
        x: row.x,
        y: row.y,
        w: row.w,
        h: row.h,
        isMinimized: row.isMinimized,
      })
    }
  }

  return result
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Atomically replaces all layout rows for a given profile + breakpoint.
 * Passing an empty array clears the layout for that breakpoint.
 */
export async function saveLayout(
  profileId: string,
  breakpoint: Breakpoint,
  layout: CardLayout[]
): Promise<void> {
  await db
    .delete(dashboardLayouts)
    .where(
      and(
        eq(dashboardLayouts.profileId, profileId),
        eq(dashboardLayouts.breakpoint, breakpoint)
      )
    )

  if (layout.length === 0) return

  await db.insert(dashboardLayouts).values(
    layout.map((item) => ({
      id: randomUUID(),
      profileId,
      cardId: item.cardId,
      breakpoint,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      isMinimized: item.isMinimized,
    }))
  )
}
