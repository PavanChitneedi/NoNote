# NoNote — Claude Handover Document
> **NEW SESSION?** Read `INSTRUCTIONS.md` first — it tells you exactly what to do.
> This file is the source of truth for any Claude working on this project.

## Current Version: v5.35.4
## Last Updated: Apr 2026
Self-hosted mind-mapping / network diagram app for homelabbers and sysadmins. Built so ADHD brains can switch environments visually (skins). The owner (Pavan) runs it on EC2 at `192.168.0.43` via Docker Compose.

**Current version: v5.35.4**

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, inline styles only (no CSS files/modules) |
| Backend | Node.js + Express |
| DB | PostgreSQL + Redis |
| Infra | Docker Compose, AWS EC2, Nginx reverse proxy |
| Dev | code-server local IDE, Gitea for code |

---

## Repository Structure
```
NoNote/
├── CLAUDE.md              ← YOU ARE HERE — read first
├── docs/
│   ├── ARCHITECTURE.md    ← Full technical architecture
│   ├── SKINS.md           ← Skin/Theme/Design system
│   └── FEATURES.md        ← Feature inventory by page
├── frontend/src/
│   ├── App.jsx            ← Root: auth, routing, nav layout per skin
│   ├── skins.js           ← All 11 skin definitions
│   ├── changelog.js       ← Version changelog (update on every release)
│   ├── context/
│   │   ├── ThemeContext.jsx   ← 13 color themes
│   │   ├── DesignContext.jsx  ← 5 spacing/density designs
│   │   └── SkinContext.jsx    ← Active skin, accent override
│   └── components/
│       ├── Dashboard.jsx      ← Maps list + Live Dashboard view
│       ├── LiveDashboard.jsx  ← Proxmox/TrueNAS/Unraid live tiles
│       ├── ThemePicker.jsx    ← Appearance modal (Skins/Theme/Design/Text)
│       ├── NodeCanvas.jsx     ← Main canvas (nodes, edges, drag)
│       └── IntegrationPanel.jsx ← Per-node live integration config
├── backend/src/
│   └── routes/
│       └── integrations.js   ← Proxy routes to Proxmox/TrueNAS/Unraid
└── postgres/init.sql         ← DB schema + migrations
```

---

## Deployment Workflow
```bash
# Owner's update script (on server)
~/update-project.sh http://192.168.0.99:8000/nonote-vX.X.X.zip /opt/NoNote --no-restart
cd /opt/NoNote && docker compose up -d --build
```

**Packaging convention:**
```bash
cd /tmp && rm -rf pack && mkdir pack
cp -r /home/claude/NoNote pack/nonote-vX.X.X
rm -rf pack/nonote-vX.X.X/.git pack/nonote-vX.X.X/frontend/node_modules \
       pack/nonote-vX.X.X/frontend/dist pack/nonote-vX.X.X/backend/node_modules
find pack/nonote-vX.X.X -name "*.bak*" -delete
cd /tmp/pack && zip -r /tmp/nonote-vX.X.X.zip nonote-vX.X.X/
cp /tmp/nonote-vX.X.X.zip /mnt/user-data/outputs/nonote-vX.X.X.zip
```

**Version naming:** `vMAJOR.MINOR.PATCH`
- PATCH: bug fixes, small tweaks
- MINOR: new features, redesigns
- MAJOR: architecture changes

**Always update changelog.js** before packaging:
```js
// frontend/src/changelog.js — prepend to CHANGELOG array
{ v:"vX.X.X", date:"Month Year", items:["change1","change2"] }
```

---

## Critical Architecture Rules

### Skin / Theme / Design separation — DO NOT MIX
```
Theme  → sets: --bg, --bg2, --bg3, --border, --text, --accent, --success, --danger
Design → sets: --topbar-h, --node-pad, --btn-pad, --sidebar-w, --line-height
Skin   → sets: --font-ui, --font-node, --radius-*, --shadow-node, --transition-all
```
- **Skins NEVER set color vars** (bg, text, accent) — those come from Theme
- **Skins NEVER set spacing vars** (padding, heights) — those come from Design
- **Design NEVER sets fonts or radius** — those belong to Skin
- Application order: Theme → Design → Skin (Skin applied via `setTimeout(0)` to always win on its vars)

### Provider order in App.jsx
```jsx
<ThemeProvider>        // colors
  <DesignProvider>     // spacing
    <SkinProvider>     // personality (innermost = wins)
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SkinProvider>
  </DesignProvider>
</ThemeProvider>
```

### Nav layouts — 4 types
Each skin defines `nav: "top" | "bottom" | "icon-dock" | "editorial"`. App.jsx renders a completely different shell for each. Dashboard.jsx checks `skinNav` prop and shows a compact nav strip (Maps/Live tabs) when sidebar is hidden.

### CSS vars for special effects
- `--neu-dark`, `--neu-light` — required by Neumorphic skin's dual-shadow effect
- `--topbar-bg`, `--topbar-blur`, `--sidebar-bg` — override topbar/sidebar appearance per skin
- All skin CSS effects use `var(--accent)` so they inherit theme + user accent overrides

### URL fragments
`#dashboard`, `#live`, `#canvas/{mapId}`, `#admin` — set on every navigation, read on page load.

---

## Key Files to Know

### `frontend/src/skins.js`
Each skin entry:
```js
skinKey: {
  name, icon, nav, concept, tags,
  defaultTheme,   // applied on skin switch
  defaultDesign,  // applied on skin switch
  defaultAccent,  // { accent, accent2 } — applied on skin switch
  accentOptions,  // 5 curated accents shown in Appearance > Skins
  vars: { /* font, radius, shadow, topbar-bg, etc. */ },
  bodyClass,      // CSS class added to <body>
  css,            // injected <style> — always use var(--accent), var(--bg) etc.
}
```

### `frontend/src/context/SkinContext.jsx`
- On `setSkinName(name)`: applies defaultTheme + defaultDesign + defaultAccent
- Personality vars applied with `setTimeout(0)` so they win over theme/design
- Listens to `nn-theme-changed` + `nn-design-changed` events and reapplies personality on top

### `frontend/src/context/ThemeContext.jsx`
- 13 themes: dark, midnight, forest, ocean, amber, violet (dark) + light, cream, sepia, rose, softblue, mint, parchment, clay (light)
- Clay theme has `--neu-dark`/`--neu-light` for Neumorphic compatibility
- Fires `nn-theme-changed` event after applying vars
- Listens for `nn-set-theme` event (dispatched by SkinContext on skin switch)

### `frontend/src/context/DesignContext.jsx`
- 5 designs: workspace, clean, comfort, professional, minimal
- Spacing/density ONLY — no fonts, no radius
- Fires `nn-design-changed` after applying

### `frontend/src/components/Dashboard.jsx`
- Receives `skinNav` prop from App.jsx
- Shows left sidebar only when `skinNav === "top"`
- Shows compact nav strip (Maps/Live/user) for all other nav types
- Map cards: colored top-border accent + emoji icon, stored in `localStorage["nn_mm_"+mapId]`
- Map grouping: assign group via ✎ modal, shown as labeled sections
- Grid/List view toggle

### `frontend/src/components/LiveDashboard.jsx`
- Proxmox: Overview/Guests/Storage tabs
- TrueNAS: Overview/Pools/Services tabs
- Unraid: Overview/Docker tabs
- Standalone integrations persisted in `localStorage["nn_standalone_integrations"]`
- Deduped by URL across maps
- Auto-refresh every 30s with countdown

---

## localStorage Keys
| Key | Contents |
|---|---|
| `nn_skin` | active skin name |
| `nm_theme` | active theme name |
| `nn_design` | active design name |
| `nm_fontscale` | font scale % |
| `nn_skin_accent` | `{accent, accent2, skinName}` — accent override |
| `nn_mm_{mapId}` | `{color, icon, group}` — map card customization |
| `nn_standalone_integrations` | array of standalone live integration nodes |

---

## Backend Routes
- `POST /api/integrations/proxmox` — proxy to Proxmox API
- `POST /api/integrations/truenas` — proxy to TrueNAS API  
- `POST /api/integrations/unraid` — proxy to Unraid API
- `POST /api/integrations/probe` — HTTP probe
- Uses `undici` with `rejectUnauthorized: false` for self-signed certs
- `NODE_TLS_REJECT_UNAUTHORIZED=0` in docker env

---

## Pending / Known Issues
- Skin CSS effects (scanlines, grid overlays) may interfere with modal z-index in some browsers
- Neumorphic dual-shadow doesn't look great on dark themes (physically correct — neumorphism needs mid-tone bg)
- `color-mix()` in Aurora's topbar-bg may not work in older Safari — has fallback
- Node collision detection uses `nodeHeightsRef` — still the most reliable but misses CSS `minHeight` in edge cases

---

## Owner Context
- **Pavan** — homelab enthusiast, ADHD, values environment variety (hence skins)
- Runs Proxmox at `192.168.0.153:8006`, various VMs/CTs
- Prefers concise responses, no unnecessary elaboration
- Packages go to `http://192.168.0.99:8000/` (local file server)
- Always uses `--no-restart` then manual `docker compose up -d --build`
