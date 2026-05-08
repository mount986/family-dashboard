CREATE TABLE `profiles` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `avatar_url` text,
  `color_theme` text NOT NULL DEFAULT '#6366f1',
  `is_private` integer NOT NULL DEFAULT false,
  `pin_hash` text,
  `pin_failures` integer NOT NULL DEFAULT 0,
  `pin_locked_until` integer,
  `created_at` integer NOT NULL
);

CREATE TABLE `cards` (
  `id` text PRIMARY KEY NOT NULL,
  `type` text NOT NULL,
  `title` text NOT NULL,
  `config_json` text NOT NULL DEFAULT '{}',
  `owner_id` text NOT NULL REFERENCES `profiles`(`id`) ON DELETE CASCADE,
  `is_shared` integer NOT NULL DEFAULT true,
  `is_private` integer NOT NULL DEFAULT false,
  `created_at` integer NOT NULL
);

CREATE TABLE `dashboard_layouts` (
  `id` text PRIMARY KEY NOT NULL,
  `profile_id` text NOT NULL REFERENCES `profiles`(`id`) ON DELETE CASCADE,
  `card_id` text NOT NULL REFERENCES `cards`(`id`) ON DELETE CASCADE,
  `breakpoint` text NOT NULL,
  `x` integer NOT NULL DEFAULT 0,
  `y` integer NOT NULL DEFAULT 0,
  `w` integer NOT NULL DEFAULT 4,
  `h` integer NOT NULL DEFAULT 4,
  `is_minimized` integer NOT NULL DEFAULT false
);

CREATE TABLE `todo_lists` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `owner_id` text NOT NULL REFERENCES `profiles`(`id`) ON DELETE CASCADE,
  `is_shared` integer NOT NULL DEFAULT true,
  `created_at` integer NOT NULL
);

CREATE TABLE `todo_items` (
  `id` text PRIMARY KEY NOT NULL,
  `list_id` text NOT NULL REFERENCES `todo_lists`(`id`) ON DELETE CASCADE,
  `text` text NOT NULL,
  `assigned_to` text REFERENCES `profiles`(`id`) ON DELETE SET NULL,
  `due_date` text,
  `priority` integer NOT NULL DEFAULT 2,
  `completed_at` integer,
  `created_at` integer NOT NULL
);

CREATE TABLE `grocery_items` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `category` text NOT NULL DEFAULT 'other',
  `quantity` text,
  `added_by` text NOT NULL REFERENCES `profiles`(`id`) ON DELETE CASCADE,
  `is_checked` integer NOT NULL DEFAULT false,
  `created_at` integer NOT NULL
);
