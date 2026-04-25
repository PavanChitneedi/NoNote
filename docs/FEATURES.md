# NoNote — Feature Inventory

## Dashboard (/)

### Map Cards
- Grid view (default) + List view toggle (⊞ / ☰)
- Each card: colored top-border accent, emoji icon, title, node count, date, collab badge
- Hover: `translateY(-2px)` + box-shadow lift
- Right-click or ⋮ → context menu (rename, duplicate, delete, share, export)
- ✎ button → Customize modal: pick icon (15 options), accent color (10), group name

### Map Grouping
- Assign any map to a group via ✎ modal
- Groups stored in `localStorage["nn_mm_"+mapId]` (no DB change needed)
- Preset groups: Personal, Work, Infrastructure, Network, Security, Archive
- Groups render as labeled sections with divider lines
- Search + group filter pills work together

### Map Actions
- **+ New Map**: inline creation with title input
- **Import .nonote**: drag-drop or file picker, handles duplicate conflicts (overwrite/copy/cancel)
- **Export**: saves as `.nonote` JSON file (nodes + edges + metadata)
- **Share**: invite collaborators by username, set permission level (editor/viewer)

### Live Dashboard Tab
- Shows all nodes that have `properties._integration.url` set
- Deduped by URL — same server in 2 maps shows once
- **Standalone integrations**: add server directly without map node
  - Form: name, type, URL, token/credentials
  - Persisted in `localStorage["nn_standalone_integrations"]`
  - Shows "✕ Remove" button on card footer
- Cards: Proxmox (Overview/Guests/Storage tabs), TrueNAS (Overview/Pools/Services), Unraid (Overview/Docker), HTTP Probe
- Auto-refresh every 30s with countdown display

---

## Canvas (/canvas/:mapId)

### Node Types (60+, 9 categories)
General, Network, Computers, Servers, Storage, Mobile & IoT, Cloud, Software, Security

### Node Features
- **Drag**: AABB collision detection prevents overlap
- **Resize**: drag corner handles
- **Arrow key movement**: 10px steps with collision detection
- **Right-click**: context menu
- **Double-click title**: inline rename

### Node Panel (right side, opens on node select)
Tabs:
1. **Notes** — markdown text field
2. **Properties** — key/value pairs (arrays filtered from text inputs)
3. **Services** — for server/VM nodes: add Docker/VM/LXC/App services with name, type, IP, port, status
4. **Ports** — physical/logical ports (20+ types grouped)
5. **📡 Live** — integration config (Proxmox/TrueNAS/Unraid/ESXi/HTTP probe)
6. **Type** — change node type
7. **Links** — outgoing links

### 📡 Live Integration (per node)
- Configure credentials: URL, API token, username/password
- Connect → live data refresh in node panel
- Auto-refresh every 15s when connected
- Supports: Proxmox VE, TrueNAS, FreeNAS, Unraid, ESXi/vCenter, HTTP Probe
- Backend proxy at `POST /api/integrations/{type}`

### Services Auto-Population
- Connecting a Docker/VM/LXC node to a host node → auto-fills host's Services panel
- Edge deletion → auto-removes the corresponding service entry

### Edge System
- 15 connection styles: Basic, Dashed, Dotted, Bold, Double, Special/Wave
- Custom anchor points: drag endpoint to specific position on node edge
  - Stored as `{side, t}` in `from_anchor`/`to_anchor` JSONB columns
- Bezier curve control: drag midpoint diamond handle
  - Stored as `mid_off` JSONB
- Floating style panel with live inline SVG previews + color swatches

### Canvas Controls
- Zoom: scroll wheel or +/- buttons
- Pan: middle-click drag or space+drag
- Select all: Ctrl+A
- Multi-select: shift+click or drag select box
- **Auto-layout**: force-directed, collision-aware, always uses expanded node sizes

### Node Sidebar (left panel)
- 60+ node types organized in 9 collapsible categories
- Search filtering
- Sticky category headers
- Drag to canvas or click to place

---

## Appearance System

### ThemePicker Modal (Appearance button in nav)
Tabs:
1. **✨ Skins** — choose from 11 skins, see mini UI preview cards
   - Accent quick-pick: 5 curated accents per skin
   - Active skin description shown below grid
   - Switching skin auto-applies defaultTheme + defaultDesign + defaultAccent
2. **🌍 Theme** — 13 color themes in Dark/Light groups
3. **🎨 Canvas** (only on canvas page) — separate theme for canvas background
4. **🖌 Design** — 5 spacing/density designs
5. **🔤 Text Size** — XS to XXL presets + slider + manual input

### Skin Nav Types (4)
See `docs/SKINS.md` for full details.

---

## Admin Panel

- User management: create, edit, delete users
- Set roles: owner, admin, editor, viewer
- Map visibility: toggle public/private
- System info display

---

## URL Fragments (routing)
```
/#dashboard         → Maps view
/#live              → Live Dashboard view
/#canvas/{mapId}    → Opens specific map on canvas
/#admin             → Admin panel
```
Fragments set on every navigation. Restored on page load (deep-link support).

---

## Export / Import

### .nonote format (JSON)
```json
{
  "version": "1.0",
  "map": { "title": "...", "description": "..." },
  "nodes": [...],
  "edges": [...]
}
```

### Export triggers
- Map card context menu → Export
- Also available in canvas toolbar

---

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

---

## Tutorial System
- Interactive step-by-step tutorial accessible via 🎓 button
- Different flows for Dashboard vs Canvas pages
- Highlights elements with CSS ring animation

---

## Changelog
- Always update `frontend/src/changelog.js` before packaging
- Visible in dashboard as "v5.x.x ✦ What's new" button
- Opens modal with full version history
