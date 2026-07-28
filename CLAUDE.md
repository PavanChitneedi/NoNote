# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoNote (internal name "NodeMap") is a self-hosted mind-mapping / network-diagramming app for homelabbers and sysadmins: drag-and-connect node canvases with 118 node types across 13 categories, live Proxmox/TrueNAS/Unraid/ESXi integration, real-time multi-user collaboration over WebSocket, an LLM assistant with canvas context, and a 7-skin/11-theme appearance system.

Current version lives in `backend/package.json` (`version` field) — treat that as ground truth over the README header, which drifts. Every release also prepends an entry to `frontend/src/changelog.js`; its first entry shows the latest shipped changes.

Other docs in this repo, kept current by convention:
- `docs/ARCHITECTURE.md` — component tree, API routes, DB schema, CSS variable reference, deployment/rollback
- `docs/SKINS.md` — skin/theme/design system, rewritten from scratch after being found badly stale — verify against source before trusting any other doc's specific claims about it
- `docs/FEATURES.md` — feature inventory by page
- `docs/ui-system.md` — Dev Mode / `data-ui` metadata contract; its own coverage table is honestly flagged as under-enforced, not exhaustive

(No `docs/TASKS.md` or `AUDIT_REPORT.md` — both existed at points in this repo's history but were removed as stale/superseded; don't assume they exist.)

## Commands

There is no root `package.json` — frontend and backend are independent Node projects with no shared tooling.

```bash
# Backend — hot reload via node --watch, no build step (plain ESM)
cd backend && npm install && npm run dev      # or: npm start (production mode)

# Frontend — Vite dev server
cd frontend && npm install && npm run dev     # vite --host
cd frontend && npm run build                  # production build to frontend/dist
cd frontend && npm run preview                # preview a production build
```

**Both projects have Vitest suites** (`npm test` in either directory). Both also have ESLint 9 flat config (`npm run lint` in either directory, backed by `frontend/eslint.config.js` / `backend/eslint.config.js`) — frontend adds `eslint-plugin-react`/`react-hooks`/`react-refresh` on top of `@eslint/js` recommended (React 18, JSX, browser globals); backend is `@eslint/js` recommended with Node globals via the `globals` package. Both configs start from each plugin's `recommended` rules only, plus a few narrowly-scoped project rules — not a maximalist ruleset. Both set `no-empty: [error, { allowEmptyCatch: true }]` since best-effort paths (auto-save retries, optional JSON parsing, non-critical probes) deliberately swallow errors via `catch {}` throughout this codebase. `react/no-unstable-nested-components` is an error on the frontend, enforcing the no-inline-components convention below.

Backend (134 tests, one `*.test.js` per route file plus middleware/ws): `db/pool.js` and `db/redis.js` are mocked with `vi.mock` in every test file since both open real connections at import time — never import them unmocked. Route tests use `supertest` against an `express()` app with just that router mounted; several route files (`integrations.js`, `llm.js`, `users.js`) have pure-ish helper functions (`isSafeUrl`, `isProbeUrlSafe`, `buildSystemPrompt`, `getEffectivePermissions`, etc.) exported specifically to unit-test in isolation, same pattern as the earlier `NodeCanvas.jsx` extractions — check a route file for an already-exported helper before assuming you need a full HTTP-level test.

Frontend (174 tests): the original 86 are extracted pure functions from `NodeCanvas.jsx` (geometry/layout/bundling, in `frontend/src/lib/*.js`) plus `llmExport`/`api/client` — none of those render a component. `@testing-library/react` is set up (`frontend/src/test-setup.js`, registers RTL's `cleanup()` in `afterEach` — required since `vitest.config.js` doesn't set `test.globals: true`) with `LoginPage.test.jsx` as the original real-component template: mock `api/client.js`, render the real context providers, not mocked hooks. The remaining ~88 tests are RTL component tests for the ~15 presentational/interactive components extracted out of `NodeCanvas.jsx` into `frontend/src/components/canvas/*.jsx` (one `*.test.jsx` per component, e.g. `NodeSidebar.test.jsx`, `PropsPanel.test.jsx`, `InlineNodeEditor.test.jsx`) — these are prop-driven with no context/API imports of their own, so most render directly without provider wrapping.

Full stack via Docker Compose — this is the actual deployment path (`docker-compose.yml`, `Makefile`, `setup.sh`):

```bash
cp .env.example .env      # fill in JWT secrets, DB/Redis passwords, admin creds
make up                   # docker compose up -d
make logs                 # tail all service logs
make logs-backend         # backend only
make shell-db             # psql into postgres
make shell-backend        # sh into backend container
make gen-certs            # self-signed TLS cert into nginx/certs/
make backup / make restore FILE=...
make install-backup-cron   # schedule daily backups via cron
make deploy                # git pull + make update, in one step
make update                # rebuild + rolling update, tagged by git commit, health-checked after
make rollback SHA=<sha>    # revert to a previously-deployed commit's image, no rebuild
make health                # curl /health
```

## Architecture

### Two-service Node app behind Nginx, no ORM, no build-time DB migration tool

- `backend/` — Express + `ws` WebSocket server on **one** HTTP server (`backend/src/index.js`), raw `pg` queries (no ORM). Redis is used only for token blocklisting on logout.
- `frontend/` — React 18 (no Redux/state library) + Vite, built to static files and served by Nginx (`frontend/Dockerfile` → `nginx:1.25-alpine`).
- `nginx/` — reverse proxy, SSL termination, serves the frontend's static build.
- **DB schema has no migration files or CLI tool.** `runMigrations()` in `backend/src/index.js` runs a hardcoded array of idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements on *every* backend boot, each wrapped in try/catch so already-applied statements silently no-op. To change schema, append a new statement to that array (with a version comment) — don't create a separate migrations directory. `postgres/init.sql` only handles first-boot bootstrap (extensions, enum types, base tables).

### Auth & permissions

- JWT access token (15 min, kept in **sessionStorage**) + refresh token (7 days, kept in **localStorage**) — see `frontend/src/api/client.js`. `apiFetch()` auto-retries once on 401 by calling `/auth/refresh`, coalescing concurrent refreshes through a shared `_refreshPromise` so parallel in-flight requests don't each trigger a separate refresh.
- Role hierarchy (`backend/src/middleware/auth.js`): `owner(4) > admin(3) > editor(2) > viewer(1)`. A `restricted` role was added later via migration and sits outside this numeric map — check call sites before assuming it behaves like a tier below viewer.
- Two permission layers: `requireRole(minRole)` for global/admin routes, `mapPermission(requiredPerm)` for per-map REST routes (checks `map_collaborators`, ownership, or `is_public`). Owners/admins bypass per-map checks entirely.
- **The WebSocket JOIN handler in `backend/src/index.js` cannot use `mapPermission` directly, since it isn't Express middleware.** The access check (user lookup → `map_collaborators`/`is_public`) is factored into `checkMapAccess()` in `backend/src/ws/mapAccess.js` — a separate implementation from `mapPermission`, not a shared one, tested in `mapAccess.test.js`. If map-access rules change, update both `mapPermission` and `checkMapAccess`.
- Integration routes (`backend/src/routes/integrations.js`) proxy to homelab hosts (Proxmox/TrueNAS/Unraid/ESXi). `isSafeUrl()` there is the SSRF guard, but it's narrower than "blocks private networks" — it only blocks loopback, `169.254.x` (cloud metadata), and a fixed list of Docker-internal hostnames (`postgres`/`redis`/`backend`/`frontend`/`nginx`); RFC-1918 private IPs are *allowed* by design, since that's where homelab appliances actually live, and arbitrary public hosts pass too. Tested in `integrations.test.js`. This file is also the one place TLS verification is deliberately relaxed — don't reuse that relaxed-TLS pattern elsewhere.

### Frontend provider stack (order matters)

```
ThemeProvider → DesignProvider → SkinProvider → AuthProvider → AppInner
```
Declared in that order in `App.jsx`. `SkinContext` re-applies its CSS vars last (via `setTimeout(0)`) specifically so skin personality vars always win over theme vars, and it re-triggers on an `nn-theme-changed` event whenever the active theme changes underneath it.

### Skin / Theme / Design — three independent CSS-variable layers, never mix them

The most failure-prone part of the frontend (full details in `docs/SKINS.md`, which was substantially rewritten after being found badly stale — verify against `skins.js`/`ThemeContext.jsx`/`DesignContext.jsx` directly rather than trusting any doc's specific skin/theme names or counts at face value). Strict separation:
- **Theme** (`ThemeContext.jsx`) owns color vars only (`--bg`, `--text`, `--accent`, etc.) — 11 themes (7 dark, 4 light).
- **Design** (`DesignContext.jsx`) owns spacing only, and is hardcoded to one fixed baseline (the values that used to be the "workspace" preset) — not user-selectable. It used to have 5 switchable presets and a working switch mechanism, but nothing in the codebase called it (skins lost their `defaultDesign` field, `ThemePicker.jsx` never had a Design tab), so the unreachable presets and switching code were removed rather than left as dead weight.
- **Skin** (`skins.js` + `SkinContext.jsx`) owns font/radius/shadow/transitions/topbar-sidebar-surface — **never colors**. Skin `css` blocks must reference `var(--accent)`, `var(--bg)`, `color-mix(...)`, etc.; a hardcoded hex value in a skin breaks it under other themes. 7 skins currently exist, all using `nav: "top"` (per-skin nav layout variation and the old accent-picker system are both gone).
- Test skin/theme changes against at least one dark and one light theme; there's no compatibility matrix to lean on anymore.

### Canvas rendering (`frontend/src/components/NodeCanvas.jsx` — ~7,800 lines, by far the largest file in the repo)

Effectively the whole diagram engine lives in this one component: node rendering, drag/collision, edge routing, edge bundling (fan-out/fan-in trunks with obstacle-aware pathing), and note-stack grouping. Invariants that have repeatedly caused regressions per the changelog history:
- SVG edge `<defs>` + paths render **before** node divs in DOM order — z-stacking relies on DOM order, not `z-index`. Never put `z-index` on the SVG edge layer.
- Node heights are read from real DOM measurements (`nodeHeightsRef`), not stored/assumed sizes — routing bugs have repeatedly come from code reading a stored `h` instead of measured height for nodes with variable content (badges, note stacks, etc.).
- Edge saves use `INSERT ... ON CONFLICT DO UPDATE` (upsert) keyed by edge ID, not delete-all-reinsert — required for concurrency safety under real-time collaboration.

### Real-time collaboration

Single-instance, in-memory room model — `rooms: Map<mapId, Set<ws>>` in `backend/src/index.js`, no Redis pub/sub, so this does not horizontally scale past one backend instance. Per-connection rate limit: 120 messages/min. Incoming `nodes_update`/`edges_update` messages are diffed against the previous per-connection snapshot to write `map_changelog` audit rows (add/edit/delete) without the client sending explicit change events.

### LLM integration

`backend/src/routes/llm.js` supports multiple provider configs (OpenAI, Anthropic, Groq, Gemini, custom OpenAI-compatible via `base_url`) stored per-install in the DB, not just via env vars — `.env` API keys are one way to configure a provider, not the only way. Chat history is loaded generously then trimmed to a ~6000-word budget before each call (`WORD_BUDGET` in `llm.js`) since canvas context can otherwise blow up the request. Gemini auth goes through the `x-goog-api-key` header rather than a URL query param to keep keys out of logs (the `safe-url` morgan token in `index.js` also strips `key`/`token`/`api_key` query params from access logs generally).

## Conventions worth knowing (non-obvious, not enforced by tooling)

- Never define a React component inline inside another component's render/body — has caused remount bugs (canvas/panel state loss) in this codebase. Define components at module scope.
- `app_settings` is a flat key/value table gating certain user-editable profile fields (username/email/password/avatar changes, registration, LLM/export access for viewers, max maps per user). `PATCH /api/users/settings/global` only accepts an allowlisted set of keys — check the allowlist in `backend/src/routes/users.js` before adding a new setting key.
- Changelog convention: `frontend/src/changelog.js` entries are prepended (newest first), plain JS objects only (`v`, `date`, `items[]`) — no JSX in that file; it's imported by both `NodeCanvas` and `Dashboard`.
