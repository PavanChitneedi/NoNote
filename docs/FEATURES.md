# NoNote — Feature Inventory

## Dashboard (/)

### Map Cards
- Grid view (default) + List view toggle (⊞ / ☰)
- Each card: colored top-border accent, emoji icon, title, node count, date, collab badge
- Hover: `translateY(-2px)` + box-shadow lift (skin-aware animation)
- Right-click or ⋮ → context menu (rename, duplicate, delete, share, export)
- ✎ button → Customize modal: pick icon (15 options), accent color (10), group name

### Map Grouping
- Assign any map to a group via ✎ modal
- Backend-stored per-user in the `map_user_meta` table (`grp`/`color`/`icon` columns), via `saveMapMeta()` (`PATCH /api/maps/:id/meta`) — added v5.48.0
- Legacy `localStorage["nn_mm_"+mapId]` entries are auto-migrated to the backend on load, then removed from localStorage
- Preset groups: Personal, Work, Infrastructure, Network, Security, Archive

### Map Actions
- **+ New Map**: inline creation with title input; enforces `max_maps_per_user` admin setting
- **Import .nonote**: drag-drop or file picker, handles duplicate conflicts (overwrite/copy/cancel)
- **Export**: saves as `.nonote` JSON file (nodes + edges + metadata)
- **Share**: invite collaborators by username, set permission level (editor/viewer)
- **Duplicate**: single-transaction batch copy — nodes and edges cloned with new UUIDs

### Live Dashboard Tab
- Shows all nodes that have `properties._integration.url` set
- Deduped by URL — same server in 2 maps shows once
- **Standalone integrations**: add server directly without a map node
  - Persisted in `localStorage["nn_standalone_integrations"]`
- Cards: Proxmox (Overview/Guests/Storage tabs), TrueNAS (Overview/Pools/Services), Unraid (Overview/Docker), HTTP Probe
- Auto-refresh every 30s with countdown display

---

## Canvas (/canvas/:mapId)

### Node Types (118, 13 categories)
Network (27), Servers (13), Notes (11), Software (10), Mobile & IoT (10), Planning (9), Cloud (8), General (7), Storage (6), Knowledge (6), Security (5), Computers (5), Workflow (1)

### Node Features
- **Drag**: AABB collision detection prevents overlap
- **Resize**: drag corner handles
- **Arrow key movement**: 10px steps with collision detection
- **Right-click**: context menu
- **Double-click title**: inline rename

### Node Panel (right side, opens on node select)
Tabs: Notes, Properties, Services, Ports, 📡 Live, Type, Links

### 📡 Live Integration (per node)
- Configure credentials: URL, API token, username/password
- Connect → live data refresh in node panel
- Auto-refresh every 15s when connected
- Supports: Proxmox VE, TrueNAS, Unraid, ESXi/vCenter, HTTP Probe
- Backend proxy at `POST /api/integrations/{type}` with SSRF guard

### Edge System
- 15 connection styles: Basic, Dashed, Dotted, Bold, Double, Special/Wave
- Custom anchor points: drag endpoint to specific position on node edge (`from_anchor`/`to_anchor` JSONB)
- Bezier curve control: drag midpoint diamond handle (`mid_off` JSONB)
- Concurrent-save-safe: edges upserted by ID, not delete-all-reinsert

### Canvas Controls
- Zoom: scroll wheel or +/- buttons
- Pan: middle-click drag or space+drag
- Select all: Ctrl+A
- Multi-select: shift+click or drag select box
- **Auto-layout**: force-directed, collision-aware, always uses expanded node sizes

### Node Sidebar (left panel)
- 60+ node types, 9 collapsible categories, search filtering, sticky headers

---

## Appearance System

### ThemePicker Modal (Appearance button in nav)
Tabs (only 2 currently — earlier docs describing more are stale):
1. **✦ Personality** — 7 skins; switching auto-applies the skin's `defaultTheme`
2. **🎨 Color** — 11 color themes in Dark (7) / Light (4) groups

No Canvas tab, no Text Size tab, no accent picker currently exist in `ThemePicker.jsx`. There is no Design tab either — see `docs/SKINS.md` for why (a 5-preset Design system still exists in code but is currently unreachable from any UI).

---

## Version History
- Always visible in dashboard as "v5.x.x ✦ What's new" button
- Source: `frontend/src/changelog.js` — update before every packaging

---

## Admin Panel
- User management: create, edit, delete, toggle active
- Roles: owner, admin, editor, viewer, restricted
- `max_maps_per_user` setting enforced on create + duplicate
- Global settings: registration toggle, LLM access, map limits, session timeout
- Audit log: all admin actions logged with actor name and timestamp
- System logs with level filtering

---

## Security Model
- JWT auth (15min access + 7-day refresh with automatic cleanup)
- Per-map RBAC on all REST routes AND WebSocket room joins
- Version history routes gated by mapPermission
- Integration proxy: SSRF guard — blocks loopback, cloud-metadata (`169.254.x`), and named Docker-internal hosts; RFC-1918 private IPs are intentionally allowed, since that's where homelab appliances live
- Gemini API key sent via header, not URL query param
- Frontend nginx serves CSP + security headers

---

## URL Fragments (routing)
```
/#dashboard      → Maps view
/#live           → Live Dashboard view
/#canvas/{mapId} → Opens specific map
/#admin          → Admin panel
```

## Keyboard Shortcuts (Canvas)
| Shortcut | Action |
|---|---|
| Ctrl+A | Select all |
| Delete / Backspace | Delete selected |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C / Ctrl+V | Copy / Paste |
| Arrow keys | Move selected (10px) |
| Space+drag | Pan canvas |
| Scroll | Zoom |
