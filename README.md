# NoNote

Self-hosted mind-mapping and network diagram application for homelabbers and sysadmins.

**Current version: v5.63.2**

---

## What It Does

- **Visual mind maps and architecture diagrams** — drag, connect, annotate 60+ node types across 9 categories (Network, Servers, Cloud, Security, etc.)
- **Live homelab integration** — connect Proxmox, TrueNAS, Unraid, ESXi nodes to live server data; see VM/container status in real time
- **Real-time collaboration** — multiple users edit the same map simultaneously via WebSocket
- **LLM assistant** — ask questions about your map with canvas context awareness
- **11 visual skins** — from Obsidian (GitHub Dark dev tool) to Neumorphic (soft clay) to Vapor (80s vaporwave); any of 13 color themes works with any skin
- **Version history** — save named snapshots, restore any previous state

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express + WebSocket |
| Database | PostgreSQL 15 + Redis |
| Infra | Docker Compose + Nginx |

---

## Quick Start

```bash
# Clone
git clone https://github.com/PavanChitneedi/NoNote.git
cd NoNote

# Configure
cp .env.example .env
# Edit .env — set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET, DB passwords, LLM keys

# Run
docker compose up -d --build
```

Default admin credentials: set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.

Access at `https://your-host/` (Nginx handles SSL termination).

---

## Configuration (.env)

```env
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
POSTGRES_PASSWORD=yourpassword
REDIS_PASSWORD=yourpassword
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
```

LLM providers (optional — add any combination):
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
```

---

## Docs

| File | Contents |
|---|---|
| `docs/ARCHITECTURE.md` | Component tree, API endpoints, DB schema, security controls |
| `docs/FEATURES.md` | Feature inventory by page |
| `docs/SKINS.md` | Skin + theme system, adding new skins/themes |
| `CLAUDE.md` | Developer handover — read first in any new session |

---

## Security

- Per-map RBAC on REST routes, WebSocket JOIN, and version history
- Integration proxy SSRF guard — blocks loopback, cloud-metadata (`169.254.x`), and named Docker-internal hosts; RFC-1918 private IPs are intentionally allowed, since that's where homelab appliances live
- TLS verification scoped — only disabled for the homelab integration proxy
- Automatic refresh token cleanup
- Frontend served with Content-Security-Policy headers

---

## Development

```bash
# Backend (hot reload)
cd backend && npm install && npm run dev
cd backend && npm test          # run the backend test suite

# Frontend (Vite dev server)
cd frontend && npm install && npm run dev
cd frontend && npm test         # run the frontend test suite
```

Changelog: always update `frontend/src/changelog.js` before releasing.
