import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { query } from "./db/pool.js";
import authRouter  from "./routes/auth.js";
import mapsRouter  from "./routes/maps.js";
import usersRouter from "./routes/users.js";
import llmRouter      from "./routes/llm.js";
import versionsRouter from "./routes/versions.js";
import integrationsRouter from "./routes/integrations.js";
import { checkMapAccess } from "./ws/mapAccess.js";

const app  = express();
const PORT = parseInt(process.env.PORT || "3001");

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      scriptSrc:  ["'self'"],
      imgSrc:     ["'self'", "data:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: (process.env.CORS_ORIGIN || "http://localhost").split(","),
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// ── Body / compression ────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "4mb" }));
app.set("trust proxy", 1);

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  // Custom format: combined minus the Authorization header to avoid token logging
  morgan.token("safe-url", (req) => {
    // Strip any ?key= or ?token= query params from logged URL
    try {
      const u = new URL(req.url, "http://x");
      u.searchParams.delete("key");
      u.searchParams.delete("token");
      u.searchParams.delete("api_key");
      return u.pathname + (u.search ? u.search : "");
    } catch { return req.url; }
  });
  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));
}

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  max:      parseInt(process.env.RATE_LIMIT_MAX || "100"),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests, slow down." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many login attempts." },
});

app.use("/api", limiter);
app.use("/api/auth/login",   authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",  authRouter);
app.use("/api/maps",  mapsRouter);
app.use("/api/users", usersRouter);
app.use("/api/llm",   llmRouter);
app.use("/api/maps",  versionsRouter);  // version history sub-routes
app.use("/api/integrations", integrationsRouter);

// ── Health ────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Bootstrap: create initial admin user ─────────────────────
async function seedAdmin() {
  const { rows } = await query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
  if (rows.length > 0) return;

  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin creation");
    return;
  }

  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || "12"));
  await query(
    `INSERT INTO users (email, display_name, password_hash, role, avatar_color)
     VALUES ($1, 'Admin', $2, 'owner', '#6C63FF')
     ON CONFLICT (email) DO NOTHING`,
    [email, hash]
  );
  console.log(`[seed] Created owner admin: ${email}`);
}

// ── WebSocket collaboration server ──────────────────────────────
// Simple single-instance model: rooms Map holds connected clients per map.
// On any message, broadcast to all OTHER clients in the same room.
// No Redis needed — straightforward and reliable.

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

const rooms = new Map(); // mapId → Set<ws>

wss.on("connection", (ws) => {
  let mapId   = null;
  let userId  = null;
  let userName = "User";

  // ── Per-connection rate limiter: max 120 messages/min ────────
  let msgCount = 0;
  let rlWindow = Date.now();
  const WS_RATE_LIMIT = 120;
  const WS_RATE_WINDOW_MS = 60_000;

  ws.on("message", async (raw) => {
    // Rate limit check (skip for join message — no userId yet)
    const now = Date.now();
    if (now - rlWindow > WS_RATE_WINDOW_MS) { msgCount = 0; rlWindow = now; }
    msgCount++;
    if (msgCount > WS_RATE_LIMIT) {
      ws.send(JSON.stringify({ type: "error", message: "Rate limit exceeded. Slow down." }));
      return;
    }

    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── JOIN ──────────────────────────────────────────────────
    if (msg.type === "join") {
      // Verify JWT
      try {
        const payload = jwt.verify(msg.token, process.env.JWT_ACCESS_SECRET);
        userId = payload.sub;
      } catch (e) {
        console.warn("[ws] auth rejected:", e.message);
        ws.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }));
        ws.close(1008, "Unauthorized");
        return;
      }

      mapId = msg.mapId;

      // ── Check map access (see ws/mapAccess.js — mirrors mapPermission middleware) ──
      try {
        const access = await checkMapAccess(userId, mapId);
        if (!access.ok) {
          ws.send(JSON.stringify({ type: "auth_error", message: access.message }));
          ws.close(access.closeCode, access.closeReason);
          return;
        }
        userName = access.userName;
      } catch (e) {
        console.error("[ws] access check error:", e.message);
        ws.send(JSON.stringify({ type: "auth_error", message: "Access check failed" }));
        ws.close(1011, "Error");
        return;
      }

      ws.userId   = userId;
      ws.mapId    = mapId;
      ws.userName = userName;

      // Register in room
      if (!rooms.has(mapId)) rooms.set(mapId, new Set());
      rooms.get(mapId).add(ws);

      console.log(`[ws] "${userName}" joined map ${mapId} (${rooms.get(mapId).size} total)`);

      // Tell the joiner who else is here
      const others = [];
      rooms.get(mapId).forEach(c => {
        if (c !== ws && c.userId)
          others.push({ userId: c.userId, userName: c.userName || "User" });
      });
      ws.send(JSON.stringify({ type: "room_state", users: others }));

      // Tell everyone else this user joined
      broadcast(mapId, { type: "user_joined", userId, userName }, ws);
      return;
    }

    if (!mapId || !userId) return; // must join first

    // ── LOG significant canvas changes ────────────────────────
    if (msg.type === "nodes_update" && Array.isArray(msg.nodes)) {
      const prev = ws._snapNodes;
      if (prev) {
        const pById = Object.fromEntries(prev.map(n => [n.id, n]));
        const cById = Object.fromEntries(msg.nodes.map(n => [n.id, n]));
        for (const n of msg.nodes) {
          if (!pById[n.id])
            query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
              [mapId,userId,userName,"add_node",n.id,n.title||n.type||"node"]).catch(()=>{});
          else if (pById[n.id].title !== n.title && n.title)
            query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
              [mapId,userId,userName,"edit_node",n.id,n.title]).catch(()=>{});
        }
        for (const n of prev)
          if (!cById[n.id])
            query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
              [mapId,userId,userName,"delete_node",n.id,n.title||"node"]).catch(()=>{});
      }
      ws._snapNodes = msg.nodes;
    }
    if (msg.type === "edges_update" && Array.isArray(msg.edges)) {
      const prev = ws._snapEdges;
      if (prev) {
        const pIds = new Set(prev.map(e => e.id));
        const cIds = new Set(msg.edges.map(e => e.id));
        for (const e of msg.edges)
          if (!pIds.has(e.id))
            query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
              [mapId,userId,userName,"add_edge",e.id,e.label||"edge"]).catch(()=>{});
        for (const e of prev)
          if (!cIds.has(e.id))
            query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
              [mapId,userId,userName,"delete_edge",e.id,e.label||"edge"]).catch(()=>{});
      }
      ws._snapEdges = msg.edges;
    }

    // ── BROADCAST to everyone else in the room ─────────────────
    broadcast(mapId, { ...msg, userId, userName }, ws);
  });

  ws.on("close", () => {
    if (mapId && rooms.has(mapId)) {
      rooms.get(mapId).delete(ws);
      console.log(`[ws] "${userName}" left map ${mapId}`);
      if (rooms.get(mapId).size === 0) {
        rooms.delete(mapId);
      } else {
        broadcast(mapId, { type: "user_left", userId, userName });
      }
    }
  });

  ws.on("error", err => console.error("[ws] error:", err.message));
});

function broadcast(mapId, msg, exclude = null) {
  const room = rooms.get(mapId);
  if (!room) return;
  const raw = JSON.stringify(msg);
  room.forEach(c => {
    if (c !== exclude && c.readyState === 1) c.send(raw);
  });
}

// ── DB migrations (run on every startup, all idempotent) ──────
async function runMigrations() {
  const migrations = [
    "ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS from_anchor JSONB",
    "ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS to_anchor JSONB",
    "ALTER TABLE map_edges ADD COLUMN IF NOT EXISTS mid_off JSONB",
    "ALTER TABLE maps ADD COLUMN IF NOT EXISTS group_boxes JSONB NOT NULL DEFAULT '[]'::jsonb",
    `CREATE TABLE IF NOT EXISTS map_changelog (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT, action TEXT NOT NULL,
      target_id TEXT, target_label TEXT, meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    "CREATE INDEX IF NOT EXISTS idx_map_changelog_map ON map_changelog(map_id, created_at DESC)",
    // Application logs (admin visible, 7-day default retention)
    `CREATE TABLE IF NOT EXISTS app_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      level TEXT NOT NULL DEFAULT 'info',
      category TEXT NOT NULL DEFAULT 'system',
      message TEXT NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    "CREATE INDEX IF NOT EXISTS idx_app_logs_created ON app_logs(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level)",
    // App settings kv store
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    // ── RBAC: User groups ──────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS user_groups (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name        TEXT NOT NULL,
      description TEXT,
      color       TEXT NOT NULL DEFAULT '#6C63FF',
      permissions JSONB NOT NULL DEFAULT '{}',
      created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_group_members (
      user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id  UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
      added_by  UUID REFERENCES users(id) ON DELETE SET NULL,
      added_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, group_id)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_ugm_user ON user_group_members(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_ugm_group ON user_group_members(group_id)",
    // ── RBAC: Custom role permissions per user ─────────────────
    `CREATE TABLE IF NOT EXISTS user_permissions (
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission TEXT NOT NULL,
      granted    BOOLEAN NOT NULL DEFAULT true,
      granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, permission)
    )`,
    // ── Add 'restricted' to user_role enum if missing ─────────
    `DO $$ BEGIN
       ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'restricted';
     EXCEPTION WHEN duplicate_object THEN NULL;
     END $$`,
    `INSERT INTO app_settings(key,value) VALUES
      ('allow_username_change','true'),
      ('allow_email_change','false'),
      ('allow_password_change','true'),
      ('allow_avatar_change','true'),
      ('registration_enabled','true'),
      ('allow_llm_for_viewers','false'),
      ('allow_export_for_viewers','true'),
      ('max_maps_per_user','0'),
      ('session_timeout_hours','720')
    ON CONFLICT(key) DO NOTHING`,
    // v5.41.2 node-level AI chat
    "ALTER TABLE llm_conversations ADD COLUMN IF NOT EXISTS node_id TEXT DEFAULT NULL",
    "CREATE INDEX IF NOT EXISTS idx_llm_conversations_node_id ON llm_conversations(node_id) WHERE node_id IS NOT NULL",
    // v5.45.0 model override per conversation
    "ALTER TABLE llm_conversations ADD COLUMN IF NOT EXISTS model_override TEXT DEFAULT NULL",
    // v5.48.0 per-user map metadata
    `CREATE TABLE IF NOT EXISTS map_user_meta (
      map_id     UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grp        TEXT NOT NULL DEFAULT '',
      color      TEXT NOT NULL DEFAULT '',
      icon       TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (map_id, user_id)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_map_user_meta_user ON map_user_meta(user_id)",
    // v5.49.0 node notes redesign
    "ALTER TABLE map_nodes ADD COLUMN IF NOT EXISTS node_notes TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE map_nodes ADD COLUMN IF NOT EXISTS notes_private BOOLEAN NOT NULL DEFAULT false",
    "CREATE INDEX IF NOT EXISTS idx_map_nodes_notes_fts ON map_nodes USING gin(to_tsvector('english', coalesce(node_notes,'')))",
    // v5.49.0 node notes redesign — migration handled client-side on map load (one note node per entry)
    "SELECT 1", // placeholder — no-op
  ];
  let applied = 0;
  for (const sql of migrations) {
    try { await query(sql); applied++; } catch { /* already exists */ }
  }
  console.log(`[migrate] ${applied}/${migrations.length} migrations applied`);
}

// appLog moved to utils/logger.js

// ── Start ─────────────────────────────────────────────────────
httpServer.listen(PORT, "0.0.0.0", async () => {
  // Read version from package.json for accurate logging
  let appVersion = "unknown";
  try {
    const { readFileSync } = await import("fs");
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
    appVersion = pkg.version || appVersion;
  } catch {}
  console.log(`[server] NodeMap API + WS running on :${PORT}`);
  await runMigrations().catch(console.error);
  await seedAdmin().catch(console.error);
  try {
    const { appLog } = await import("./utils/logger.js");
    await appLog("info", "system", `Server started on port ${PORT} — NoNote v${appVersion}`);
  } catch {}

  // ── M-2: Periodic cleanup of expired/revoked refresh tokens ──
  // Runs once at startup then every 24h — prevents unbounded table growth
  async function cleanExpiredTokens() {
    try {
      const r = await query(
        "DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL"
      );
      if (r.rowCount > 0) console.log(`[cleanup] Removed ${r.rowCount} expired/revoked refresh tokens`);
    } catch (e) {
      console.error("[cleanup] token cleanup error:", e.message);
    }
  }
  cleanExpiredTokens();
  setInterval(cleanExpiredTokens, 24 * 60 * 60 * 1000);
});
