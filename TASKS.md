# Family Dashboard — Project Tasks

> **Legend:** 🔴 High priority · 🟡 Medium priority · 🟢 Low priority

---

## Phase 1 — Foundation
> Core infrastructure, profiles, and an empty dashboard grid.

### Project Setup
- [x] 🔴 Scaffold frontend project (Vite + React + TypeScript)
- [x] 🔴 Scaffold backend project (Node.js + Fastify + TypeScript)
- [x] 🔴 Configure shared TypeScript config (`tsconfig.json`)
- [x] 🟡 Set up ESLint + Prettier across both projects
- [x] 🟡 Set up Tailwind CSS v4

### Database
- [x] 🔴 Install and configure Drizzle ORM with `better-sqlite3`
- [x] 🔴 Define `profiles` table schema
- [x] 🔴 Define `cards` table schema
- [x] 🔴 Define `dashboard_layouts` table schema
- [x] 🟡 Write initial Drizzle migration and verify it runs cleanly
- [x] 🟡 Enable WAL mode on SQLite

### Profile System
- [x] 🔴 Build profile creation API (`POST /profiles`)
- [x] 🔴 Build profile list API (`GET /profiles`)
- [x] 🔴 Implement PIN hashing with bcrypt (cost factor 12)
- [x] 🔴 Implement PIN verification endpoint with rate limiting (5 attempts → 5 min lockout)
- [x] 🔴 Implement session cookie (short-lived JWT) for active profile
- [x] 🔴 Build profile switcher UI — public profiles (free switch)
- [x] 🔴 Build PIN entry modal for private profile switching
- [x] 🟡 Build profile creation/edit UI (name, avatar, color theme, public/private toggle)

### Dashboard Grid
- [ ] 🔴 Install and configure `react-grid-layout`
- [ ] 🔴 Define 5 responsive breakpoints: `xl`, `lg`, `md`, `sm`, `xs`
- [ ] 🔴 Implement layout save on change (`POST /layouts/:profileId`)
- [ ] 🔴 Implement layout load on profile switch (`GET /layouts/:profileId`)
- [ ] 🟡 Build empty-state dashboard with "Add your first card" prompt
- [ ] 🟢 Add smooth layout transition animations (Framer Motion)

### Deployment — k3s + Helm
- [ ] 🔴 Install k3s on local server
- [ ] 🔴 Install Tailscale Kubernetes Operator and join Tailnet
- [ ] 🔴 Write `Dockerfile` for the Node.js/Fastify app
- [ ] 🔴 Write `Dockerfile` for the nginx static frontend
- [ ] 🔴 Scaffold Helm chart (`Chart.yaml`, `values.yaml`, `templates/`)
- [ ] 🔴 Write `deployment-app.yaml` (replicas: 1, SQLite constraint)
- [ ] 🔴 Write `deployment-static.yaml`
- [ ] 🔴 Write `pvc.yaml` (ReadWriteOnce, local-path storage class)
- [ ] 🔴 Write `secret.yaml` for API keys
- [ ] 🔴 Write `configmap.yaml` for app config
- [ ] 🔴 Write Traefik `ingress.yaml` with TLS
- [ ] 🟡 Configure MagicDNS hostname (e.g., `dashboard.home.ts.net`)
- [ ] 🟡 Verify end-to-end deploy with `helm upgrade --install`

---

## Phase 2 — Internal Apps
> Grocery list, to-do list, card system, and real-time sync.

### Card System
- [ ] 🔴 Build card shell component (header, controls, resize handle)
- [ ] 🔴 Implement card settings slide-out panel
- [ ] 🔴 Implement card maximize / restore (full viewport overlay)
- [ ] 🔴 Implement card hide (remove from view, keep in library)
- [ ] 🔴 Build card library drawer (browse + add hidden/new cards)
- [ ] 🔴 Implement card privacy toggle (shared vs. private to profile)
- [ ] 🟡 Build card type registry (maps card type string → component)

### To-Do List
- [ ] 🔴 Define `todo_lists` and `todo_items` DB schema + migration
- [ ] 🔴 Build CRUD API for lists and items
- [ ] 🔴 Implement task assignment to profiles
- [ ] 🔴 Implement due dates and priority field
- [ ] 🔴 Build to-do card UI (compact list view)
- [ ] 🔴 Build to-do expanded / full-screen view
- [ ] 🟡 Implement task archiving (completed tasks archived, not deleted)
- [ ] 🟢 Add due date badge and overdue highlighting

### Grocery List
- [ ] 🔴 Define `grocery_items` DB schema + migration
- [ ] 🔴 Build CRUD API for grocery items
- [ ] 🔴 Build grocery card UI with category grouping
- [ ] 🔴 Implement check-off and "Done Shopping" clear action
- [ ] 🟡 Build item history / quick re-add from recent items
- [ ] 🟢 Add item quantity field

### Real-Time Sync
- [ ] 🔴 Set up WebSocket server in Fastify (`@fastify/websocket`)
- [ ] 🔴 Broadcast to-do item changes to all connected clients
- [ ] 🔴 Broadcast grocery list changes to all connected clients
- [ ] 🟡 Handle reconnection gracefully on the client (exponential backoff)
- [ ] 🟢 Show "X is editing…" presence indicator on shared lists

---

## Phase 3 — External Integrations
> Google Calendar, weather, iframe embeds, and the chore tracker.

### Google Calendar
- [ ] 🔴 Register app in Google Cloud Console, enable Calendar API
- [ ] 🔴 Implement OAuth 2.0 authorization flow (server-side)
- [ ] 🔴 Store and refresh Google OAuth tokens (encrypted in DB)
- [ ] 🔴 Build `/api/calendar/events` proxy endpoint
- [ ] 🔴 Build calendar card UI — compact week view
- [ ] 🔴 Build calendar expanded view — month view
- [ ] 🟡 Support multiple calendars with color coding
- [ ] 🟢 Add new event quick-entry from the card

### Weather
- [ ] 🔴 Register for OpenWeatherMap API key (free tier)
- [ ] 🔴 Build `/api/weather` proxy endpoint with 30-min server-side cache
- [ ] 🔴 Build weather card UI — current conditions + 7-day forecast
- [ ] 🟡 Make location configurable per profile
- [ ] 🟢 Add hourly forecast in expanded view

### iFrame / Embed Cards
- [ ] 🔴 Build generic iframe card component
- [ ] 🔴 Implement Open Graph / oEmbed server-side proxy for link previews
- [ ] 🔴 Graceful fallback to link preview when `X-Frame-Options` blocks embed
- [ ] 🔴 Embed chore tracker with active profile passed as URL query param
- [ ] 🟡 Build "Add external card" UI (URL input + preview before saving)
- [ ] 🟡 Implement tap-to-activate overlay for iframes on touch devices

---

## Phase 4 — Polish, Mobile & Ops
> Responsive refinement, PWA, animations, and Helm hardening.

### Mobile Experience
- [ ] 🔴 Implement "Edit Layout" mode on mobile (long-press → reorder handles)
- [ ] 🔴 Build bottom sheet card controls for mobile/tablet
- [ ] 🔴 Build bottom navigation bar profile switcher for mobile
- [ ] 🔴 Audit all tap targets — minimum 44×44px
- [ ] 🟡 Implement tablet condensed card controls (overflow menu)
- [ ] 🟡 Test and fix touch scroll vs. iframe capture conflict
- [ ] 🟢 Add pull-to-refresh on mobile list cards

### PWA
- [ ] 🔴 Write `manifest.json` (name, icons, display: standalone)
- [ ] 🔴 Implement service worker with cache-first strategy for static assets
- [ ] 🟡 Generate per-profile splash screen colors
- [ ] 🟢 Test "Add to Home Screen" on iOS Safari and Android Chrome

### Animations & UI Polish
- [ ] 🟡 Card enter/exit animations (Framer Motion)
- [ ] 🟡 Card maximize/restore transition
- [ ] 🟡 Profile switch transition
- [ ] 🟢 Skeleton loading states for all cards
- [ ] 🟢 Dark mode support

### Helm & Ops Hardening
- [ ] 🔴 Write `cronjob-backup.yaml` (nightly SQLite → host path)
- [ ] 🔴 Add liveness and readiness probes to app Deployment
- [ ] 🔴 Set resource requests and limits on all containers
- [ ] 🟡 Configure Traefik rate-limiting middleware
- [ ] 🟡 Add Helm chart `NOTES.txt` with post-install instructions
- [ ] 🟢 Set up automated image builds (GitHub Actions → container registry)

### Admin & Settings
- [ ] 🟡 Build admin panel (manage profiles, cards, integrations)
- [ ] 🟡 Build per-profile settings page (theme, layout reset, weather location)
- [ ] 🟢 Export / import dashboard configuration as JSON

### Testing & QA
- [ ] 🔴 Cross-browser test: Chrome, Safari, Firefox
- [ ] 🔴 Cross-device test: desktop, tablet (landscape + portrait), mobile
- [ ] 🟡 Test PIN rate limiting and session expiry
- [ ] 🟡 Verify private card content is excluded at API layer (not just UI)
- [ ] 🟢 Lighthouse audit — target 90+ on Performance and Accessibility
