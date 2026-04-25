# NoNote — Pre-Production Readiness Audit
**Version audited:** v5.35.5  
**Date:** April 2026  
**Scope:** Full codebase review — backend, frontend, DB schema, infra, integrations

---

## CRITICAL Issues

---

### [C-1] WebSocket: No Map Access Authorization on JOIN
**Category:** Security / Authorization  
**Severity:** Critical  
**Confidence:** High

**Description:** The WebSocket `join` handler in `backend/src/index.js` verifies the JWT token (authentication) but never checks whether the authenticated user has permission to access the requested `mapId`. Any logged-in user — including a restricted viewer with no map access — can join any map's WebSocket room, receive all real-time collaboration events (node moves, edits, cursor positions), and broadcast messages to all collaborators in that room.

**Impact:** Complete bypass of per-map RBAC. A viewer-role user with zero map collaborations can eavesdrop on and inject messages into any private map session in real time.

**Steps to Reproduce:**
1. Log in as any user (even `viewer` with no shared maps).
2. Obtain any mapId (e.g., from a URL you weren't invited to, or by brute-forcing UUIDs).
3. Open a WebSocket to `/ws` and send `{ type: "join", token: "<access_token>", mapId: "<targetMapId>" }`.
4. You will receive `room_state` and all subsequent `nodes_update`, `edges_update` etc. broadcasts.

**Affected Area:** `backend/src/index.js` — WebSocket `join` handler

**Suggested Direction:** Before adding the client to the room, run the same map-access query used by `mapPermission("viewer")` middleware. Reject and close the connection if the user has no access.

---

### [C-2] Audit Log Schema/Query Mismatch — Admin Audit Tab Is Broken
**Category:** Functional / Data Integrity  
**Severity:** Critical  
**Confidence:** High

**Description:** The `audit_log` table schema (`postgres/init.sql`) defines columns `user_id`, `action`, `resource`, `resource_id`, `ip_address`, `metadata`. However, the admin audit query in `backend/src/routes/users.js` selects `actor_id` and `target_user_id` — neither of which exists in the schema. The JOIN conditions `u.id=a.actor_id` and `t.id=a.target_user_id` silently return NULL for all actor/target names. The `meta` column is also selected but the schema column is `metadata`.

**Impact:** The Admin → Audit Log tab displays no actor names, no target names, and partially incorrect data. Security-relevant audit trail is invisible to administrators. No error is raised — the query succeeds but returns wrong data.

**Affected Area:** `backend/src/routes/users.js` (audit query), `postgres/init.sql` (schema)

**Suggested Direction:** Either update the query to use `user_id` (matching the schema) or add `actor_id`/`target_user_id` columns to the schema. Also align `meta` vs `metadata`.

---

### [C-3] Version History: No Map Permission Check — Any User Can Read/Write/Delete Versions of Any Map
**Category:** Security / Authorization  
**Severity:** Critical  
**Confidence:** High

**Description:** All four routes in `backend/src/routes/versions.js` use only `authenticate` middleware — no `mapPermission` check is applied. This means any authenticated user can:
- `GET /:mapId/versions` — list all saved versions of any private map
- `POST /:mapId/versions` — inject a version snapshot into any map
- `GET /:mapId/versions/:versionId` — read full node/edge JSON of any map version
- `DELETE /:mapId/versions/:versionId` — destroy version history of any map

**Impact:** Full data exfiltration of any map's historical snapshots, and version history tampering for maps a user has no access to.

**Affected Area:** `backend/src/routes/versions.js`

**Suggested Direction:** Add `mapPermission("viewer")` guard to GET routes and `mapPermission("editor")` to POST/DELETE, using the same inline `await mapPermission(...)` pattern used in `maps.js`.

---

### [C-4] NODE_TLS_REJECT_UNAUTHORIZED=0 Set Globally — All Outbound HTTPS Is Insecure
**Category:** Security  
**Severity:** Critical  
**Confidence:** High

**Description:** `docker-compose.yml` sets `NODE_TLS_REJECT_UNAUTHORIZED: "0"` as a global environment variable on the backend container. This disables TLS certificate verification for **all** outbound HTTPS connections made by Node.js, not just the integration proxy routes. This includes LLM API calls to OpenAI, Anthropic, Groq, etc., where API keys are transmitted. A network-level attacker could intercept or MITM any of these requests.

**Impact:** API keys for all configured LLM providers (OpenAI, Anthropic, etc.) are exposed to MITM attacks. Intended only for the homelab integration proxy (Proxmox/TrueNAS/ESXi with self-signed certs), but applies globally.

**Affected Area:** `docker-compose.yml`, `backend/src/routes/integrations.js`

**Suggested Direction:** Remove the global env var. Instead, create a dedicated `https.Agent` with `rejectUnauthorized: false` used only for the integration proxy routes, while all other fetch calls retain full TLS verification.

---

## HIGH Issues

---

### [H-1] PATCH /api/users/:id — Self-Update Bypasses Admin Setting Guards
**Category:** Security / Functional  
**Severity:** High  
**Confidence:** High

**Description:** `PATCH /api/users/me` correctly checks `allow_username_change`, `allow_email_change`, etc. from `app_settings` before allowing updates. However, `PATCH /api/users/:id` (with `isSelf = req.params.id === req.user.id`) applies **no such checks** — any user can update their own `display_name` (and `avatar_color`) via this endpoint regardless of whether the admin has disabled those changes. The `/me` route protection is trivially bypassed by simply using the `/users/:id` route with one's own user ID.

**Affected Area:** `backend/src/routes/users.js` — `PATCH /:id`

**Suggested Direction:** When `isSelf === true` in the `/:id` handler, apply the same setting guard checks as `/me`.

---

### [H-2] Integration Proxy: SSRF Vulnerability — User-Supplied URLs Not Restricted
**Category:** Security  
**Severity:** High  
**Confidence:** High

**Description:** All integration routes (`/proxmox`, `/truenas`, `/unraid`, `/esxi`) accept a `url` parameter directly from the authenticated user's request body and proxy it to that destination with no validation. Any authenticated user can instruct the backend to fetch any internal URL — including `http://169.254.169.254/` (AWS metadata endpoint), `http://postgres:5432`, `http://redis:6379`, or other internal Docker network services.

**Impact:** SSRF enabling cloud metadata theft (EC2 IMDSv1), internal network scanning, and potentially reaching internal services not exposed externally.

**Affected Area:** `backend/src/routes/integrations.js`

**Suggested Direction:** Validate the `url` parameter against a whitelist of allowed hostnames/IP ranges, or at minimum block private IP ranges (RFC 1918, link-local) and the Docker internal network CIDR.

---

### [H-3] Gemini API Key Transmitted in URL Query Parameter
**Category:** Security  
**Severity:** High  
**Confidence:** High

**Description:** In `callGemini()` within `backend/src/routes/llm.js`, the API key is appended directly to the URL: `` `...?key=${api_key}` ``. Query parameters are written to Nginx access logs, backend Morgan logs, and the `app_logs` table. Any log exposure event (file access, log shipping, an admin viewing logs) leaks all Gemini API keys.

**Affected Area:** `backend/src/routes/llm.js` — `callGemini()`

**Suggested Direction:** Use an `X-Goog-Api-Key` or `Authorization` header for the Gemini key instead of a query parameter, and suppress the key from any logging.

---

### [H-4] Concurrent Map Saves Can Cause Edge Data Loss
**Category:** Reliability / Data Integrity  
**Severity:** High  
**Confidence:** High

**Description:** The `/api/maps/:mapId/save` route deletes **all edges** for a map (`DELETE FROM map_edges WHERE map_id = $1`) and reinserts them within a transaction. When two clients save concurrently (e.g., two browser tabs or two collaborators), the sequence can be: `Client A: DELETE edges → Client B: DELETE edges → Client A: INSERT edges → Client B: INSERT edges (overwrites A's)`— resulting in the last write discarding the other client's edge changes. The 1-second autosave debounce in the frontend makes this race condition very plausible during active collaboration.

**Affected Area:** `backend/src/routes/maps.js` — `/save` route; `frontend/src/components/NodeCanvas.jsx` — autosave logic

**Suggested Direction:** Replace delete-all-reinsert with upsert (INSERT ... ON CONFLICT DO UPDATE) for edges, keyed by edge ID. This matches the node save strategy already in place.

---

### [H-5] App Settings: Unrestricted Key Injection by Admin
**Category:** Security / Data Integrity  
**Severity:** High  
**Confidence:** Medium

**Description:** `PATCH /api/users/settings/global` accepts `Object.entries(req.body)` and upserts **any** key-value pair into `app_settings` without a whitelist. An admin can inject arbitrary keys that might later be read by code that queries `app_settings` generically, and could potentially pollute the settings store or cause behavioral anomalies if unexpected keys are used.

**Affected Area:** `backend/src/routes/users.js` — `PATCH /settings/global`

**Suggested Direction:** Define and enforce an allowlist of valid setting keys. Reject requests containing unknown keys with a 400.

---

## MEDIUM Issues

---

### [M-1] `restricted` Role in Code But Not in DB Enum
**Category:** Functional / Data Integrity  
**Severity:** Medium  
**Confidence:** High

**Description:** `postgres/init.sql` defines `user_role AS ENUM ('owner', 'admin', 'editor', 'viewer')` — no `restricted` value. However, `backend/src/routes/users.js` allows creating users with `role: "restricted"` (validated via `isIn([..., "restricted"])`). Attempting to insert a user with `role='restricted'` will fail with a PostgreSQL enum violation error, returning a 500. The `ROLE_PERMISSIONS` map also defines permissions for `restricted`. This is dead/broken code.

**Affected Area:** `backend/src/routes/users.js`, `postgres/init.sql`

**Suggested Direction:** Either add `'restricted'` to the enum via migration, or remove it from the validator and permissions map.

---

### [M-2] Refresh Token Table Grows Unboundedly — No Expiry Cleanup
**Category:** Performance / Reliability  
**Severity:** Medium  
**Confidence:** High

**Description:** Every login creates a `refresh_tokens` row. Every token refresh creates a new row and marks the old one `revoked_at`. There is no background job, scheduled task, or triggered cleanup to delete expired or revoked tokens. Over months of use, the `refresh_tokens` table grows indefinitely. The refresh endpoint queries up to 10 tokens per user and bcrypt-compares each, which becomes progressively slower as the table grows.

**Affected Area:** `backend/src/routes/auth.js`, `postgres/init.sql`

**Suggested Direction:** Add a periodic cleanup query (e.g., via a startup interval or a scheduled job) to delete rows where `expires_at < NOW()` or `revoked_at IS NOT NULL`.

---

### [M-3] WebSocket: No Rate Limiting on Messages
**Category:** Security / Performance  
**Severity:** Medium  
**Confidence:** High

**Description:** HTTP endpoints have rate limiting (30–100 req/min via express-rate-limit). WebSocket messages have none. A single authenticated client can send thousands of `nodes_update` messages per second, triggering DB writes (changelog inserts) and broadcasting to all room members on every message.

**Affected Area:** `backend/src/index.js` — WebSocket handler

**Suggested Direction:** Track message count per connection with a sliding window and disconnect or throttle clients exceeding a reasonable threshold (e.g., 60 messages/min).

---

### [M-4] max_maps_per_user Setting Exists but Is Never Enforced
**Category:** Functional  
**Severity:** Medium  
**Confidence:** High

**Description:** `app_settings` seeds a `max_maps_per_user` key with default `0`. The admin can set it to a non-zero value. However, neither `POST /api/maps` (create) nor `POST /api/maps/:mapId/duplicate` checks this setting before allowing map creation. The setting is a dead config with no effect.

**Affected Area:** `backend/src/routes/maps.js`

**Suggested Direction:** In both create and duplicate handlers, query `max_maps_per_user`. If non-zero, count the user's existing maps and reject if at or above the limit.

---

### [M-5] LLM Conversation History Not Bounded — Context Overflow Risk
**Category:** Reliability / Performance  
**Severity:** Medium  
**Confidence:** High

**Description:** The chat endpoint loads the last 40 messages (`LIMIT 40`) and passes them all to the LLM. With canvas context injected via the system prompt (which can be very large for maps with 60+ nodes), the total token count could easily exceed provider context windows, causing API errors. No token estimation or truncation is performed before forwarding to the LLM.

**Affected Area:** `backend/src/routes/llm.js` — `/conversations/:id/chat`

**Suggested Direction:** Estimate tokens before calling the provider (simple word-count heuristic is sufficient), and truncate/summarize older history to stay within a safe limit.

---

### [M-6] Double Error Log on Login Failure
**Category:** Maintainability / Reliability  
**Severity:** Medium  
**Confidence:** High

**Description:** In `backend/src/routes/auth.js` login handler, `console.error("[auth] login error:", err)` is called twice — once with the full `err` object and once with `err.message` only. This creates duplicated log noise and may obscure log parsing.

**Affected Area:** `backend/src/routes/auth.js` — login error handler

---

### [M-7] Server Version String Hardcoded and Outdated
**Category:** Maintainability  
**Severity:** Medium  
**Confidence:** High

**Description:** `backend/src/index.js` startup log hardcodes `NoNote v5.23.0`, but `frontend/src/changelog.js` shows the current version as `v5.35.5`. This creates false signals in logs and makes it impossible to determine running version from server logs alone.

**Affected Area:** `backend/src/index.js`

**Suggested Direction:** Read version from `package.json` at startup rather than hardcoding it.

---

### [M-8] Map Duplicate Copies N Nodes via N Individual INSERT Statements
**Category:** Performance  
**Severity:** Medium  
**Confidence:** High

**Description:** `POST /api/maps/:mapId/duplicate` iterates over every node and edge and issues individual `INSERT` statements, plus a separate `SELECT uuid_generate_v4()` per node. For maps with 50+ nodes, this is 100+ sequential round-trips inside a non-transactional context (no `withTransaction`). This is slow and partially atomic — if an edge insert fails, some nodes are already inserted with no rollback.

**Affected Area:** `backend/src/routes/maps.js` — duplicate route

**Suggested Direction:** Wrap in a transaction and use `COPY` or multi-row inserts. Use `gen_random_uuid()` inline in SQL rather than a separate query per node.

---

## LOW Issues

---

### [L-1] Frontend Refresh Token Stored in localStorage — XSS Risk
**Category:** Security  
**Severity:** Low  
**Confidence:** Medium

**Description:** `frontend/src/api/client.js` stores the refresh token in `localStorage` (persists across tabs/sessions) while the access token goes to `sessionStorage`. localStorage is accessible to any JS running on the page. A future XSS vulnerability would immediately expose the refresh token, enabling session hijacking that survives beyond the 15-minute access token window — up to 7 days.

**Suggested Direction:** Consider storing the refresh token in a `httpOnly` cookie set by the server, or at minimum document this accepted risk.

---

### [L-2] Morgan Logs Full Requests Including Any Sensitive Query Params
**Category:** Security / Observability  
**Severity:** Low  
**Confidence:** High

**Description:** `morgan("combined")` logs the full request path. If any endpoint or future feature accepts sensitive data in query parameters, it would appear in server logs. The Gemini key-in-URL issue (H-3) makes this a concrete concern today.

**Affected Area:** `backend/src/index.js`

---

### [L-3] No Content-Security-Policy on Frontend Nginx
**Category:** Security  
**Severity:** Low  
**Confidence:** High

**Description:** The frontend is served by an Nginx container (`frontend/nginx-spa.conf`). No `Content-Security-Policy` header is set there. The backend Helmet CSP only applies to API responses. The actual SPA HTML/JS has no CSP protection against XSS.

**Affected Area:** `frontend/nginx-spa.conf`

**Suggested Direction:** Add a CSP header in `nginx-spa.conf` appropriate for a React SPA (allow `'self'`, `'unsafe-inline'` for style if needed, restrict `script-src`).

---

### [L-4] Integration Proxy: No Credential Validation Before Proxying
**Category:** Reliability  
**Severity:** Low  
**Confidence:** High

**Description:** Integration routes accept any non-empty `token` string and immediately attempt to proxy. There's no validation of token format or sanitization. Malformed tokens get forwarded, generating confusing error responses from the target.

---

### [L-5] Deletion of Map Does Not Check Ownership — Admin Can Delete Any Map
**Category:** Functional  
**Severity:** Low  
**Confidence:** High

**Description:** `DELETE /api/maps/:mapId` uses `mapPermission("owner")` which — per the middleware — skips the DB permission check entirely for `admin` and `owner` role users, granting them delete access to any map they don't own. This may be intentional for admin purposes but is not documented and may surprise map owners.

---

### [L-6] No Cleanup of WS rooms Map on Long-Running Server
**Category:** Performance  
**Severity:** Low  
**Confidence:** Medium

**Description:** The `rooms` Map in the WS server only gets cleaned when the last client leaves. Zombie entries are not possible by design, but the structure holds `Set<ws>` objects in memory for the lifetime of any active session. On a server running for weeks with many unique maps opened, the `rooms` Map remains in memory until each room empties. Not a leak per se, but worth monitoring.

---

### [L-7] No Zero-Trust on `app_logs` Error Messages Returned to Client
**Category:** Security  
**Severity:** Low  
**Confidence:** Medium

**Description:** The logs endpoint returns `err.message` directly in the error response: `{ error: "Failed to fetch logs: " + err.message }`. PostgreSQL error messages can contain table names, column names, and query fragments — information useful to an attacker.

**Affected Area:** `backend/src/routes/users.js` — logs GET handler

---

### [L-8] No Test Coverage
**Category:** Maintainability / Reliability  
**Severity:** Low  
**Confidence:** High

**Description:** No test files exist anywhere in the repository — no unit tests, no integration tests, no API contract tests. The `package.json` references `NODE_ENV !== "test"` for Morgan, suggesting test infrastructure was planned but never implemented. All critical paths (auth, RBAC, save, WebSocket) are untested.

---

## Final Summary

---

### Top 5 Critical Risks

| # | Risk | Why It's Critical |
|---|------|--------------------|
| 1 | **[C-1] WS No Map Auth** | Any user can join any private map's real-time session |
| 2 | **[C-3] Versions No Permission** | Full data exfiltration of any map's historical snapshots |
| 3 | **[C-4] Global TLS Disabled** | All LLM API keys transmitted over unverified TLS |
| 4 | **[C-2] Audit Log Broken** | Admin security audit trail is silently non-functional |
| 5 | **[H-4] Concurrent Save Data Loss** | Active collaboration can silently corrupt edge data |

---

### Quick Wins (High Impact, Low Effort)

1. **Fix version routes** — add `mapPermission()` inline (same 1-line pattern as `maps.js`) — 15 minutes
2. **Fix audit log query** — change `actor_id` → `user_id` and `target_user_id` → `null` cast or schema update — 10 minutes
3. **Add WS map access check** — one DB query before room join — 20 minutes
4. **Fix server version string** — read from `package.json` — 5 minutes
5. **Add `restricted` to DB enum** — single migration line — 5 minutes
6. **Fix double console.error in login** — delete one line — 2 minutes

---

### Risk Areas Needing Immediate Attention Before Production

1. **Authorization completeness** — WS + versions routes are unprotected. RBAC is applied inconsistently across the codebase.
2. **TLS configuration** — global `NODE_TLS_REJECT_UNAUTHORIZED=0` must be scoped before any deployment handling real API keys.
3. **SSRF in integrations** — user-controlled URLs proxied by the backend without any IP/hostname filtering.
4. **Data loss under concurrency** — edge delete-reinsert pattern is not safe for collaborative use.
5. **No automated tests** — every future change risks regressions in auth, RBAC, and data flows with no safety net.

---

### Overall Production Readiness Score: **41 / 100**

**Breakdown:**
- Feature completeness: 8/10 — Rich feature set (RBAC, collab, LLM, integrations, version history, skins)
- Security: 4/10 — Several critical auth bypasses, global TLS disabled, SSRF
- Reliability: 5/10 — Data loss risk under concurrency, no retry logic, no tests
- Performance: 7/10 — Good DB indexing, connection pooling, rate limiting; some N+1 patterns
- Code quality: 6/10 — Consistent patterns, readable code; schema/code drift, duplicate routes
- Observability: 5/10 — Logging exists but audit trail is broken; no metrics, no alerting
- Deployment: 6/10 — Good Docker setup, healthchecks; global TLS flag is a blocker

**Recommendation:** Address all Critical and High issues before exposing this to any network beyond `localhost`. The core architecture is sound and the feature set is impressive — the gap is primarily in authorization consistency and a few targeted security issues that are straightforward to fix.
