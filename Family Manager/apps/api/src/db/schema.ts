import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ── Profiles ──────────────────────────────────────────────────────────────────

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  colorTheme: text('color_theme').notNull().default('#6366f1'),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  pinHash: text('pin_hash'),
  pinFailures: integer('pin_failures').notNull().default(0),
  pinLockedUntil: integer('pin_locked_until'), // unix timestamp ms
  createdAt: integer('created_at').notNull(), // unix timestamp ms
})

// ── Cards ─────────────────────────────────────────────────────────────────────

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  configJson: text('config_json').notNull().default('{}'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  isShared: integer('is_shared', { mode: 'boolean' }).notNull().default(true),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
})

// ── Dashboard layouts ─────────────────────────────────────────────────────────

export const dashboardLayouts = sqliteTable('dashboard_layouts', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  breakpoint: text('breakpoint').notNull(), // xl | lg | md | sm | xs
  x: integer('x').notNull().default(0),
  y: integer('y').notNull().default(0),
  w: integer('w').notNull().default(4),
  h: integer('h').notNull().default(4),
  isMinimized: integer('is_minimized', { mode: 'boolean' }).notNull().default(false),
})

// ── Todo lists ────────────────────────────────────────────────────────────────

export const todoLists = sqliteTable('todo_lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  isShared: integer('is_shared', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
})

export const todoItems = sqliteTable('todo_items', {
  id: text('id').primaryKey(),
  listId: text('list_id')
    .notNull()
    .references(() => todoLists.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  assignedTo: text('assigned_to').references(() => profiles.id, { onDelete: 'set null' }),
  dueDate: text('due_date'), // ISO date string
  priority: integer('priority').notNull().default(2), // 1=high 2=med 3=low
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull(),
})

// ── Grocery list ──────────────────────────────────────────────────────────────

export const groceryItems = sqliteTable('grocery_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('other'),
  quantity: text('quantity'),
  addedBy: text('added_by')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  isChecked: integer('is_checked', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
})
