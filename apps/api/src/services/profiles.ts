import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../db/client.js'
import { profiles } from '../db/schema.js'
import type {
  Profile,
  ProfileSummary,
  CreateProfileInput,
  UpdateProfileInput,
} from '@family-dashboard/types'

const BCRYPT_ROUNDS = 12
const MAX_PIN_FAILURES = 5
const PIN_LOCKOUT_MS = 5 * 60 * 1000 // 5 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowToSummary(row: typeof profiles.$inferSelect): ProfileSummary {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatarUrl,
    colorTheme: row.colorTheme,
    theme: (row.theme as 'light' | 'dark') ?? 'dark',
    isAdmin: row.isAdmin,
  }
}

function rowToProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    ...rowToSummary(row),
    createdAt: new Date(row.createdAt as number).toISOString(),
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listProfiles(): Promise<ProfileSummary[]> {
  const rows = await db.select().from(profiles)
  return rows.map(rowToSummary)
}

export async function getProfile(id: string): Promise<Profile | null> {
  const rows = await db.select().from(profiles).where(eq(profiles.id, id))
  const row = rows[0]
  return row ? rowToProfile(row) : null
}

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const id = crypto.randomUUID()
  const now = Date.now()
  const pinHash = input.pin ? await bcrypt.hash(input.pin, BCRYPT_ROUNDS) : null

  await db.insert(profiles).values({
    id,
    name: input.name,
    avatarUrl: input.avatarUrl ?? null,
    colorTheme: input.colorTheme ?? '#6366f1',
    theme: input.theme ?? 'dark',
    isAdmin: input.isAdmin ?? false,
    pinHash,
    pinFailures: 0,
    pinLockedUntil: null,
    createdAt: now,
  })

  return (await getProfile(id))!
}

export async function updateProfile(
  id: string,
  input: UpdateProfileInput
): Promise<Profile | null> {
  const existing = await getProfile(id)
  if (!existing) return null

  await db
    .update(profiles)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.colorTheme !== undefined ? { colorTheme: input.colorTheme } : {}),
      ...(input.theme !== undefined ? { theme: input.theme } : {}),
      ...(input.isAdmin !== undefined ? { isAdmin: input.isAdmin } : {}),
    })
    .where(eq(profiles.id, id))

  return getProfile(id)
}

export async function deleteProfile(id: string): Promise<void> {
  await db.delete(profiles).where(eq(profiles.id, id))
}

// ── PIN verification ──────────────────────────────────────────────────────────

export type PinCheckResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_pin' | 'locked'; lockedUntil?: number }

export async function verifyPin(profileId: string, pin: string): Promise<PinCheckResult> {
  const rows = await db.select().from(profiles).where(eq(profiles.id, profileId))
  const row = rows[0]
  if (!row) return { ok: false, reason: 'invalid_pin' }

  // Check if currently locked out
  if (row.pinLockedUntil && row.pinLockedUntil > Date.now()) {
    return { ok: false, reason: 'locked', lockedUntil: row.pinLockedUntil }
  }

  // No PIN set — treat as unlocked
  if (!row.pinHash) return { ok: true }

  const valid = await bcrypt.compare(pin, row.pinHash)

  if (!valid) {
    const newFailures = row.pinFailures + 1
    const shouldLock = newFailures >= MAX_PIN_FAILURES
    const lockedUntil = shouldLock ? Date.now() + PIN_LOCKOUT_MS : null

    await db
      .update(profiles)
      .set({
        pinFailures: newFailures,
        ...(lockedUntil !== null ? { pinLockedUntil: lockedUntil } : {}),
      })
      .where(eq(profiles.id, profileId))

    return { ok: false, reason: 'invalid_pin' }
  }

  // Successful — reset failure counter
  await db
    .update(profiles)
    .set({ pinFailures: 0, pinLockedUntil: null })
    .where(eq(profiles.id, profileId))

  return { ok: true }
}
