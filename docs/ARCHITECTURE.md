# NoNote — Architecture

## Frontend Component Tree
```
App.jsx (root)
├── ThemeProvider (colors)
│   └── DesignProvider (5 presets defined, but unreachable from the UI —
│       │                every user gets the hardcoded "workspace" fallback;
│       │                see docs/SKINS.md)
│       └── SkinProvider (personality)
│           └── AuthProvider
│               └── AppInner
│                   ├── Topbar + Dashboard(sidebar)
│                   │   (all 7 current skins use nav:"top" — the old
│                   │    per-skin bottom/icon-dock/editorial nav layouts
│                   │    aren't exercised by any current skin)
│                   ├── Dashboard
│                   │   ├── Left sidebar (top-nav skins only)
│                   │   ├── Map grid (grid/list, grouping, search)
│                   │   └── LiveDashboard (dashTab==="live")
│                   ├── NodeCanvas
│                   │   ├── SVG edge layer (renders BEFORE nodes for z-order)
│                   │   ├── Node elements
│                   │   ├── NodeSidebar (118 types, 13 categories)
│                   │   ├── PropertiesPanel (right side)
│                   │   └── IntegrationPanel (📡 Live tab in node panel)
│                   ├── AdminPanel
│                   └── Modals: ThemePicker, HelpGuide, Tutorial, UserProfile
```

## Data Flow

### Node State
- Stored in PostgreSQL; React state in NodeCanvas (no Redux)
- Node heights tracked via `nodeHeightsRef` (DOM measurements) — critical for collision
- Edges stored with `from_anchor`, `to_anchor` (JSONB), `mid_off` (bezier control)
- Save uses upsert (INSERT … ON CONFLICT DO UPDATE) for edges — concurrency-safe

### Canvas Rendering
1. SVG `<defs>` + edge paths render first (DOM order = z-order)
2. Node divs render on top
3. Collision: axis-separated AABB with penetration resolution on drag/arrow-key
4. `rectEdgePoint()` uses actual rendered dimensions
5. Edge bundling (`buildBundle()`, module-scope in `NodeCanvas.jsx`): fan-out/fan-in groups sharing a node/side get one trunk + spine instead of parallel lines, only when the whole group is obstacle-clear — see `NodeCanvas.bundle.test.js`

### Authentication
- JWT: 15-min access token (sessionStorage) + 7-day refresh token (localStorage)
- Refresh tokens auto-purged on startup and every 24h
- Roles: owner > admin > editor > viewer > restricted

### WebSocket (real-time collaboration)
- WS server co-hosted with Express on same HTTP server
- JOIN handler calls `checkMapAccess()` (`backend/src/ws/mapAccess.js`) before admitting to room — a separate implementation from the REST `mapPermission` middleware (WS can't use Express middleware), tested in `mapAccess.test.js`
- Rate-limited: 120 messages/min per connection
- Broadcasts: `nodes_update`, `edges_update`, `cursor`, `user_joined/left`

## API Endpoints

```
Auth
POST   /api/auth/login                       login → access + refresh tokens
POST   /api/auth/register                    self-registration (gated by registration_enabled setting)
POST   /api/auth/refresh                     refresh → new access token
POST   /api/auth/logout                      revoke refresh token
GET    /api/auth/me                          current user (lightweight, token-only check)

Maps
GET    /api/maps                             list accessible maps
POST   /api/maps                             create (enforces max_maps_per_user)
PATCH  /api/maps/:mapId/meta                 update per-user metadata (group/color/icon) — map_user_meta
GET    /api/maps/:mapId                      get map + nodes + edges
PUT    /api/maps/:mapId                      update metadata
PATCH  /api/maps/:mapId                      partial metadata update
POST   /api/maps/:mapId/duplicate            batch-clone in transaction
DELETE /api/maps/:mapId                      delete (logged; admin deletes audit-logged)
POST   /api/maps/:mapId/save                 save nodes + edges (upsert by ID)
POST   /api/maps/:mapId/collaborators        add collaborator
GET    /api/maps/:mapId/collaborators        list collaborators
DELETE /api/maps/:mapId/collaborators/:userId  remove collaborator
GET    /api/maps/:mapId/changelog            collaboration change log (map_changelog)
GET    /api/maps/:mapId/search               search nodes within a map

Versions
GET    /api/maps/:mapId/versions             list (requires viewer)
POST   /api/maps/:mapId/versions             save snapshot (requires editor)
GET    /api/maps/:mapId/versions/:versionId  get snapshot (requires viewer)
DELETE /api/maps/:mapId/versions/:versionId  delete (requires editor)

Users / Admin
PATCH  /api/users/me                         update own profile (guards setting-gated changes)
GET    /api/users/me/settings                own effective settings
GET    /api/users                            list users (admin)
POST   /api/users                            create user (admin)
PATCH  /api/users/:id                        update user (admin; self-update also guards settings)
DELETE /api/users/:id                        delete user (owner only)
GET    /api/users/audit                      audit log (admin)
GET    /api/users/search                     search users
GET    /api/users/groups                     list RBAC groups (admin)
POST   /api/users/groups                     create RBAC group (admin)
PATCH  /api/users/groups/:id                 update RBAC group (admin)
DELETE /api/users/groups/:id                 delete RBAC group (admin)
GET    /api/users/groups/:id/members         list group members (admin)
POST   /api/users/groups/:id/members         add group member (admin)
DELETE /api/users/groups/:id/members/:uid    remove group member (admin)
GET    /api/users/:id/permissions            list a user's custom permissions (admin)
POST   /api/users/:id/permissions            grant a custom permission (admin)
DELETE /api/users/:id/permissions/:perm      revoke a custom permission (admin)
GET    /api/users/settings/global            global settings (admin)
PATCH  /api/users/settings/global            update settings (admin; allowlisted keys only)
GET    /api/users/logs                       app logs
GET    /api/users/logs/retention             log retention setting
PATCH  /api/users/logs/retention             update log retention setting
DELETE /api/users/logs                       clear logs

LLM
GET    /api/llm/presets                      built-in provider presets
GET    /api/llm/probe-models                 probe a custom base_url for available models
GET    /api/llm/providers                    list configured LLM providers
POST   /api/llm/providers                    create provider config
PATCH  /api/llm/providers/:id                update provider config
DELETE /api/llm/providers/:id                delete provider config
GET    /api/llm/maps/:mapId/conversations    list conversations for a map (optional node_id filter)
POST   /api/llm/maps/:mapId/conversations    create conversation
GET    /api/llm/conversations/:id/messages   history
POST   /api/llm/conversations/:id/chat       send message (history budget-trimmed, ~6000 words)
DELETE /api/llm/conversations/:id            delete conversation
POST   /api/llm/export-interpret             LLM-assisted interpretation for exports
POST   /api/llm/workflow-audit               LLM-assisted workflow audit (WorkflowAuditPanel)

Integrations (homelab proxy — SSRF-guarded, see isSafeUrl() note in Security Controls)
POST   /api/integrations/proxmox
POST   /api/integrations/truenas
POST   /api/integrations/unraid
POST   /api/integrations/esxi
POST   /api/integrations/probe
```

## Database Schema (key tables)

```sql
maps(id UUID, title, description, owner_id, is_public, group_boxes JSONB,
     created_at, updated_at)

map_nodes(id UUID, map_id, node_type, title, x, y, w, h,
          properties JSONB, custom_props JSONB, notes TEXT,
          node_notes TEXT, notes_private BOOLEAN, z_index INT)
-- node_notes/notes_private added v5.49.0 (node notes redesign);
-- node_notes has a GIN full-text index

map_edges(id UUID, map_id, from_node, to_node, label, style, color,
          from_anchor JSONB, to_anchor JSONB, mid_off JSONB)

map_collaborators(map_id, user_id, permission: 'editor'|'viewer')

map_versions(id, map_id, user_id, label, nodes_json, edges_json,
             node_count, edge_count, created_at)

map_changelog(id, map_id, user_id, user_name, action, target_id,
              target_label, meta JSONB, created_at)
-- add_node/delete_node/edit_node/add_edge/delete_edge — populated by
-- diffing WS nodes_update/edges_update against the previous snapshot,
-- not by explicit client change events

map_user_meta(map_id, user_id, grp, color, icon, updated_at)
-- per-user map grouping/color/icon, added v5.48.0 — replaced the old
-- localStorage-only grouping (legacy entries auto-migrate on load)

users(id UUID, email, display_name, role user_role, password_hash,
      avatar_color, is_active, created_at)

-- user_role ENUM: owner, admin, editor, viewer, restricted
-- ('restricted' added later via migration — sits outside the numeric
--  ROLE_HIERARCHY in middleware/auth.js, don't assume it's "below viewer")

refresh_tokens(id, user_id, token_hash, expires_at, revoked_at, created_at)
-- Auto-purged: DELETE WHERE expires_at < NOW() OR revoked_at IS NOT NULL (24h interval)

user_groups(id, name, description, color, permissions JSONB, created_by, created_at, updated_at)
user_group_members(user_id, group_id, added_by, added_at)
user_permissions(user_id, permission, granted BOOLEAN, granted_by, granted_at)
-- RBAC groups + per-user custom permission grants, admin-managed via /api/users/groups*, /api/users/:id/permissions*

app_settings(key TEXT PRIMARY KEY, value TEXT, updated_at)
-- Allowlisted keys enforced on PATCH /settings/global

audit_log(id, user_id, action, resource, resource_id, ip_address, metadata JSONB, created_at)

app_logs(id, level, category, message, user_id, meta JSONB, created_at)

llm_providers(id, user_id, name, provider, base_url, model, api_key_enc, is_default, created_at)
-- api_key_enc is AES-256-GCM encrypted, NULL for providers like Ollama that need no key

llm_conversations(id, map_id, user_id, provider_id, title, node_id, model_override, created_at, updated_at)
-- node_id (v5.41.2) scopes a conversation to a specific node — node-level AI chat
-- model_override (v5.45.0) lets a conversation pin a model different from the provider's default

llm_messages(id, conversation_id, role, content, tokens_used, created_at)
```

`backend/src/index.js`'s `runMigrations()` is the actual source of truth for schema evolution (idempotent, runs every boot) — `postgres/init.sql` only bootstraps a fresh volume and has drifted to include some but not all of the above (e.g. it's missing `app_settings`, `app_logs`, `user_groups`, `user_group_members`, `user_permissions` entirely; the backend creates them itself via `CREATE TABLE IF NOT EXISTS` regardless). Don't treat `init.sql` alone as complete.

## CSS Variable System

```
Color (Theme owns):
  --bg, --bg2, --bg3            backgrounds
  --border, --border2           borders
  --text, --text2, --text3, --text4
  --accent, --accent2
  --success, --danger, --warn
  --canvas-dot, --node-bg, --shadow

Spacing (DesignContext — hardcoded to the "workspace" preset; see docs/SKINS.md
         for why 4 other defined presets are currently unreachable):
  --topbar-h, --node-header-h, --node-pad, --node-body-pad
  --btn-pad, --sidebar-w, --props-w, --node-border-w, --line-height, --letter-space

Personality (Skin owns):
  --font-ui, --font-node, --font-mono, --font-weight-ui, --font-weight-node
  --letter-space, --line-height
  --radius-xs/sm/md/lg, --radius-node, --radius-btn
  --shadow-node, --shadow-node-hover, --shadow-node-sel, --shadow-panel
  --transition-all
  --topbar-bg, --topbar-border, --topbar-blur
  --sidebar-bg, --sidebar-border
```

## Security Controls

| Layer | Control |
|---|---|
| Auth | JWT + bcrypt; refresh tokens auto-expire + purge |
| REST | mapPermission middleware on all map/version routes |
| WebSocket | checkMapAccess() check on JOIN before room admission |
| Integration proxy | SSRF guard (isSafeUrl()) — blocks loopback, 169.254.x cloud-metadata, named Docker-internal hosts; RFC-1918 private IPs are intentionally *allowed* (homelab appliances live there) |
| TLS | Scoped `https.Agent({rejectUnauthorized:false})` only in integrations.js |
| LLM keys | Gemini via `x-goog-api-key` header (not URL); others via Authorization |
| Settings | Allowlist of valid keys on PATCH /settings/global |
| Logs | Morgan strips `?key=/?token=` params; no raw DB errors in API responses |
| Frontend | CSP + X-Frame-Options + X-Content-Type-Options via nginx |

## Docker Compose Services
```
nodemap_nginx      → Nginx reverse proxy (port 443 SSL)
nodemap_frontend   → React SPA (nginx static serve)
nodemap_backend    → Node.js Express + WebSocket
nodemap_postgres   → PostgreSQL 16
nodemap_redis      → Redis (sessions/cache)
```

Networks: `internal` (postgres/redis private) + `external` (nginx/backend/frontend)
