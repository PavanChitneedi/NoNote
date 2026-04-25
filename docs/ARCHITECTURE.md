# NoNote — Architecture

## Frontend Component Tree
```
App.jsx (root)
├── ThemeProvider (colors)
│   └── DesignProvider (spacing)
│       └── SkinProvider (personality)
│           └── AuthProvider
│               └── AppInner
│                   ├── [nav shell — depends on skin.nav]
│                   │   ├── "top"       → topbar + Dashboard(sidebar)
│                   │   ├── "bottom"    → content + fixed bottom dock
│                   │   ├── "icon-dock" → 56px vertical icon column + content
│                   │   └── "editorial" → full-width centered topbar + content
│                   ├── Dashboard
│                   │   ├── Left sidebar (top-nav skins only)
│                   │   ├── Compact nav strip (all other skins)
│                   │   ├── Map grid (grid/list view, grouping, search)
│                   │   └── LiveDashboard (dashTab==="live")
│                   ├── NodeCanvas (canvas page)
│                   │   ├── SVG edge layer (renders BEFORE nodes for z-order)
│                   │   ├── Node elements
│                   │   ├── NodeSidebar (60+ node types, 9 categories)
│                   │   ├── PropertiesPanel (right side)
│                   │   └── IntegrationPanel (📡 Live tab in node panel)
│                   ├── AdminPanel
│                   └── Modals: ThemePicker, HelpGuide, Tutorial, UserProfile
```

## Data Flow

### Node State
- All nodes stored in PostgreSQL via backend API
- Canvas state: React state in NodeCanvas (not Redux)
- Node heights tracked via `nodeHeightsRef` (DOM measurements) — critical for collision detection
- Edges stored with `from_anchor`, `to_anchor` (JSONB), `mid_off` (bezier control point)

### Canvas Rendering
1. SVG `<defs>` + edge paths render first (DOM order = z-order, no zIndex tricks)
2. Node divs render on top
3. Collision detection on drag: axis-separated AABB with penetration resolution
4. `rectEdgePoint()` uses actual rendered dimensions for accurate arrow endpoints

### Authentication
- JWT-based, stored in memory (not localStorage)
- Backend validates on every request
- Roles: owner, admin, editor, viewer

## API Endpoints (backend)
```
GET    /api/maps              list maps
POST   /api/maps              create map
GET    /api/maps/:id          get map with nodes+edges
PUT    /api/maps/:id          update map metadata
DELETE /api/maps/:id          delete map

GET    /api/maps/:id/nodes    list nodes
POST   /api/maps/:id/nodes    create node
PUT    /api/maps/:id/nodes/:nid  update node
DELETE /api/maps/:id/nodes/:nid  delete node

POST   /api/integrations/proxmox  proxy to Proxmox API
POST   /api/integrations/truenas  proxy to TrueNAS API
POST   /api/integrations/unraid   proxy to Unraid API
POST   /api/integrations/probe    HTTP probe

POST   /api/auth/login        get JWT
POST   /api/auth/refresh      refresh JWT
GET    /api/users/me          current user
```

## Database Schema (key tables)
```sql
maps(id, title, description, owner_id, is_public, created_at, updated_at)
map_nodes(id, map_id, type, title, x, y, w, h, properties JSONB)
map_edges(id, map_id, from_id, to_id, label, style JSONB,
          from_anchor JSONB, to_anchor JSONB, mid_off JSONB)
users(id, username, display_name, role, avatar_color, created_at)
map_collaborators(map_id, user_id, permission)
```

## CSS Variable System
```
Color vars (Theme owns):
  --bg, --bg2, --bg3          backgrounds (darkest to lightest)
  --border, --border2         borders
  --text, --text2, --text3, --text4   text hierarchy
  --accent, --accent2         primary action colors
  --success, --danger         status colors
  --canvas-dot                canvas grid dot color
  --node-bg                   default node background
  --shadow                    base shadow color (rgba)
  --neu-dark, --neu-light     neumorphic dual-shadow colors (clay theme)

Spacing vars (Design owns):
  --topbar-h                  topbar height
  --node-header-h             node title bar height
  --node-pad                  node header padding
  --node-body-pad             node body padding
  --btn-pad                   button padding
  --sidebar-w                 dashboard sidebar width
  --props-w                   properties panel width
  --node-border-w             node border thickness
  --line-height               text line height

Personality vars (Skin owns):
  --font-ui                   UI font family
  --font-node                 node font family
  --font-weight-ui            UI font weight
  --font-weight-node          node font weight
  --letter-space              letter spacing
  --radius-xs/sm/md/lg        border radii scale
  --radius-node               node border radius
  --radius-btn                button border radius
  --shadow-node               node box shadow
  --shadow-node-sel           selected node box shadow
  --transition-all            global transition timing
  --topbar-bg                 topbar background (can be semi-transparent)
  --topbar-border             topbar border
  --topbar-blur               topbar backdrop-filter
  --sidebar-bg                sidebar background
  --sidebar-border            sidebar border
```

## Docker Compose Services
```
nodemap_nginx      → Nginx reverse proxy (port 443 SSL)
nodemap_frontend   → Vite preview server
nodemap_backend    → Node.js Express API
nodemap_postgres   → PostgreSQL 15
nodemap_redis      → Redis (sessions/cache)
```

Network: `internal` network removed so containers can reach LAN (Proxmox, etc.)
Backend env: `NODE_TLS_REJECT_UNAUTHORIZED=0` for self-signed homelab certs
