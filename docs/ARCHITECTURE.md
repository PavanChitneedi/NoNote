# NoNote — Architecture

## Frontend Component Tree
```
App.jsx (root)
├── ThemeProvider (colors)
│   └── DesignProvider (fixed "clean" spacing — not user-selectable)
│       └── SkinProvider (personality)
│           └── AuthProvider
│               └── AppInner
│                   ├── [nav shell — depends on skin.nav]
│                   │   ├── "top"       → topbar + Dashboard(sidebar)
│                   │   ├── "bottom"    → content + fixed bottom dock
│                   │   ├── "icon-dock" → 56px vertical icon column
│                   │   └── "editorial" → full-width centered topbar
│                   ├── Dashboard
│                   │   ├── Left sidebar (top-nav skins only)
│                   │   ├── Compact nav strip (all other skins)
│                   │   ├── Map grid (grid/list, grouping, search)
│                   │   └── LiveDashboard (dashTab==="live")
│                   ├── NodeCanvas
│                   │   ├── SVG edge layer (renders BEFORE nodes for z-order)
│                   │   ├── Node elements
│                   │   ├── NodeSidebar (60+ types, 9 categories)
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

### Authentication
- JWT: 15-min access token (sessionStorage) + 7-day refresh token (localStorage)
- Refresh tokens auto-purged on startup and every 24h
- Roles: owner > admin > editor > viewer > restricted

### WebSocket (real-time collaboration)
- WS server co-hosted with Express on same HTTP server
- JOIN handler verifies map access before admitting to room (same RBAC as REST)
- Rate-limited: 120 messages/min per connection
- Broadcasts: `nodes_update`, `edges_update`, `cursor`, `user_joined/left`

## API Endpoints

```
Auth
POST   /api/auth/login           login → access + refresh tokens
POST   /api/auth/refresh         refresh → new access token
POST   /api/auth/logout          revoke refresh token

Maps
GET    /api/maps                 list accessible maps
POST   /api/maps                 create (enforces max_maps_per_user)
GET    /api/maps/:id             get map + nodes + edges
POST   /api/maps/:id/save        save nodes + edges (upsert by ID)
PUT    /api/maps/:id             update metadata
DELETE /api/maps/:id             delete (logged; admin deletes audit-logged)
POST   /api/maps/:id/duplicate   batch-clone in transaction

Versions
GET    /api/maps/:id/versions           list (requires viewer)
POST   /api/maps/:id/versions           save snapshot (requires editor)
GET    /api/maps/:id/versions/:vid      get snapshot (requires viewer)
DELETE /api/maps/:id/versions/:vid      delete (requires editor)

Users / Admin
GET    /api/users/me             current user profile
PATCH  /api/users/me             update profile (guards setting-gated changes)
GET    /api/users                list users (admin)
POST   /api/users                create user (admin)
PATCH  /api/users/:id            update user (admin; self-update also guards settings)
DELETE /api/users/:id            delete user (admin)
GET    /api/users/audit          audit log (admin)
GET    /api/users/logs           app logs (admin)
GET    /api/users/settings/global    global settings (admin)
PATCH  /api/users/settings/global    update settings (admin; allowlisted keys only)

LLM
GET    /api/llm/providers        list configured LLM providers
POST   /api/llm/conversations    create conversation
GET    /api/llm/conversations/:id/messages  history
POST   /api/llm/conversations/:id/chat      send message (history budget-trimmed)

Integrations (homelab proxy — SSRF-guarded)
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
          properties JSONB, custom_props JSONB, notes TEXT, z_index INT)

map_edges(id UUID, map_id, from_node, to_node, label, style, color,
          from_anchor JSONB, to_anchor JSONB, mid_off JSONB)

map_collaborators(map_id, user_id, permission: 'editor'|'viewer')

map_versions(id, map_id, user_id, label, nodes_json, edges_json,
             node_count, edge_count, created_at)

users(id UUID, email, display_name, role user_role, password_hash,
      avatar_color, is_active, created_at)

-- user_role ENUM: owner, admin, editor, viewer, restricted

refresh_tokens(id, user_id, token_hash, expires_at, revoked_at, created_at)
-- Auto-purged: DELETE WHERE expires_at < NOW() OR revoked_at IS NOT NULL (24h interval)

app_settings(key TEXT PRIMARY KEY, value TEXT, updated_at)
-- Allowlisted keys enforced on PATCH /settings/global

audit_log(id, user_id, action, resource, resource_id, ip_address, metadata JSONB, created_at)

app_logs(id, level, source, message, user_id, created_at)
```

## CSS Variable System

```
Color (Theme owns):
  --bg, --bg2, --bg3            backgrounds
  --border, --border2           borders
  --text, --text2, --text3, --text4
  --accent, --accent2
  --success, --danger
  --canvas-dot, --node-bg, --shadow

Spacing (DesignContext — fixed "clean" baseline):
  --topbar-h, --node-header-h, --node-pad, --node-body-pad
  --btn-pad, --sidebar-w, --props-w, --node-border-w, --line-height

Personality (Skin owns):
  --font-ui, --font-node, --font-weight-ui, --font-weight-node
  --letter-space, --line-height
  --radius-xs/sm/md/lg, --radius-node, --radius-btn
  --shadow-node, --shadow-node-sel
  --transition-all
  --topbar-bg, --topbar-border, --topbar-blur
  --sidebar-bg, --sidebar-border
```

## Security Controls (v5.37.0)

| Layer | Control |
|---|---|
| Auth | JWT + bcrypt; refresh tokens auto-expire + purge |
| REST | mapPermission middleware on all map/version routes |
| WebSocket | Map access check on JOIN before room admission |
| Integration proxy | SSRF guard (RFC-1918, loopback, Docker hostnames blocked) |
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
nodemap_postgres   → PostgreSQL 15
nodemap_redis      → Redis (sessions/cache)
```

Networks: `internal` (postgres/redis private) + `external` (nginx/backend/frontend)
