# NoNote — Claude Handover Document
> **NEW SESSION?** Read this file first, then `INSTRUCTIONS.md`.
> This is the source of truth for any Claude working on this project.

## Current Version: v5.43.6
## Last Updated: Apr 2026

Self-hosted mind-mapping / network diagram app for homelabbers and sysadmins.
Built so ADHD brains can switch environments visually (skins).
Owner (Pavan) runs it on EC2 at `192.168.0.43` via Docker Compose.

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, inline styles only (no CSS modules) |
| Backend | Node.js + Express + WebSocket (ws) |
| DB | PostgreSQL 15 + Redis |
| Infra | Docker Compose, AWS EC2, Nginx reverse proxy |
| Dev | code-server local IDE, Gitea, GitHub (PavanChitneedi/NoNote) |

---

## Repository Structure
```
NoNote/
├── CLAUDE.md              ← YOU ARE HERE
├── AUDIT_REPORT.md        ← Pre-production security audit findings
├── docs/
│   ├── ARCHITECTURE.md    ← Component tree, API endpoints, DB schema, security
│   ├── SKINS.md           ← Skin/Theme system, compatibility matrix
│   ├── FEATURES.md        ← Feature inventory by page
│   └── TASKS.md           ← Pending tasks / roadmap
├── frontend/src/
│   ├── App.jsx            ← Root: auth, routing, nav layout per skin
│   ├── skins.js           ← 11 skin definitions (no defaultDesign — removed)
│   ├── changelog.js       ← Version changelog (update before every release)
│   ├── context/
│   │   ├── ThemeContext.jsx   ← 13 color themes
│   │   ├── DesignContext.jsx  ← Fixed "clean" spacing (not user-selectable)
│   │   └── SkinContext.jsx    ← Active skin + accent override
│   └── components/
│       ├── Dashboard.jsx      ← Maps list + Live Dashboard tab
│       ├── LiveDashboard.jsx  ← Proxmox/TrueNAS/Unraid live tiles
│       ├── ThemePicker.jsx    ← Appearance modal (Skins / Theme / Canvas / Text Size)
│       ├── NodeCanvas.jsx     ← Canvas (nodes, edges, drag, collision)
│       ├── IntegrationPanel.jsx ← Per-node live integration config
│       └── AdminPanel.jsx     ← User/settings/audit management
├── backend/src/
│   ├── index.js               ← Express + WebSocket setup, rate limiting
│   └── routes/
│       ├── auth.js            ← Login, refresh, register
│       ├── maps.js            ← Map CRUD, save, duplicate, collaborators
│       ├── versions.js        ← Version history (mapPermission gated)
│       ├── users.js           ← Users, audit log, app logs, settings
│       ├── llm.js             ← LLM proxy (OpenAI/Anthropic/Gemini/Groq)
│       └── integrations.js    ← Homelab proxy (SSRF-guarded)
└── postgres/init.sql          ← DB schema + migrations
```

---

## Appearance System (2 layers, not 3)
The **Design** layer was removed from the user-facing UI (v5.37.0).
`DesignContext` still exists and applies a fixed "clean" spacing baseline automatically.

User-facing layers:
1. **Theme** — 13 color themes (dark/midnight/forest/ocean/amber/violet + 7 light)
2. **Skin** — 11 personality skins (font, radius, shadow, nav layout, effects)

Skins use `color-mix()` for adaptive effects that work on any theme.
See `docs/SKINS.md` for full compatibility matrix.

---

## Critical Implementation Notes

### Node Heights
Track from DOM via `nodeHeightsRef`, not from stored `node.h`. The `minHeight` CSS causes actual rendered height to exceed stored values — this affects collision detection and edge routing.

### Edge Saving
Edges use upsert (INSERT … ON CONFLICT DO UPDATE) keyed by edge ID — **not** delete-all-reinsert. This is concurrency-safe for collaborative editing.

### Auto-layout
Must operate on expanded node sizes. Never collapse → layout → expand — causes overlaps.

### SVG z-order
SVG renders before node divs in DOM order. Do NOT use `zIndex` on the SVG layer.

### Map Permission
`mapPermission(level)` middleware must be applied to ALL map-related routes.
WebSocket JOIN also verifies map access before admitting clients to a room.

### LLM History
Chat history is budget-trimmed before each API call (~6000-word budget, newest-first).
Canvas context can be large — never pass unbounded history.

---

## Deployment Workflow
```bash
# On server
cd /opt/NoNote && docker compose down && docker compose up -d --build
```

Packaging (done by Claude after changes):
```bash
cd /home/claude && zip -r nonote-vX.X.X.zip nonote \
  --exclude "nonote/.git/*" --exclude "nonote/node_modules/*" \
  --exclude "nonote/frontend/node_modules/*" \
  --exclude "nonote/backend/node_modules/*"
cp nonote-vX.X.X.zip /mnt/user-data/outputs/
```

**Version naming:** `vMAJOR.MINOR.PATCH`
- PATCH: bug fixes
- MINOR: new features, significant changes
- MAJOR: architecture changes

**Always before packaging:**
1. Update `frontend/src/changelog.js` (prepend new entry)
2. Update `backend/package.json` version
3. Update version in this file (CLAUDE.md)

---

## Known Remaining Items (v5.37.0)
- No automated tests (unit/integration) — highest-value gap for future sessions
- Refresh token in localStorage (accepted risk for homelab context)
- Map duplicate N+1 → fixed in v5.37.0 (batch inserts in transaction)
- See `AUDIT_REPORT.md` for full audit findings and resolution status
