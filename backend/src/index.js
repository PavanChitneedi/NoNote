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
  app.use(morgan("combined"));
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
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const forceReset = process.env.FORCE_RESET_ADMIN === 'true';

  if (!email || !password) {
    console.warn("[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed");
    return;
  }

  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || "12"));

  if (forceReset) {
    // FORCE_RESET_ADMIN=true: always update the password for this email
    const r = await query(
      `INSERT INTO users (email, display_name, password_hash, role, is_active, avatar_color)
       VALUES ($1, 'Admin', $2, 'owner', true, '#6C63FF')
       ON CONFLICT (email) DO UPDATE SET password_hash=$2, is_active=true
       RETURNING email`,
      [email, hash]
    );
    console.log(`[seed] Admin password reset for: ${r.rows[0]?.email}`);
    return;
  }

  // Normal: only create if no owner exists yet
  const { rows } = await query("SELECT id FROM users WHERE role='owner' LIMIT 1");
  if (rows.length > 0) return;

  await query(
    `INSERT INTO users (email, display_name, password_hash, role, is_active, avatar_color)
     VALUES ($1, 'Admin', $2, 'owner', true, '#6C63FF')
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

  ws.on("message", async (raw) => {
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
      ws.userId   = userId;
      ws.mapId    = mapId;

      // Fetch display name from DB
      try {
        const row = await query("SELECT display_name FROM users WHERE id=$1", [userId]);
        userName = row.rows[0]?.display_name || "User";
        ws.userName = userName;
      } catch {}

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
    // ── Seed default global settings ──────────────────────────
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
  ];
  let applied = 0;
  for (const sql of migrations) {
    try { await query(sql); applied++; } catch { /* already exists */ }
  }
  console.log(`[migrate] ${applied}/${migrations.length} migrations applied`);
}

// appLog moved to utils/logger.js

// ── Start ─────────────────────────────────────────────────────
// ── One-time migration: fix corrupted notes in map_nodes ─────────────────
async function fixCorruptedNotes() {
  try {
    const { rows } = await query(
      "SELECT id, notes FROM map_nodes WHERE notes IS NOT NULL AND notes != '[]' AND notes != ''"
    );
    let fixed = 0;
    for (const row of rows) {
      try {
        const arr = JSON.parse(row.notes);
        if (!Array.isArray(arr)) continue;
        let changed = false;
        const result = [];
        for (const note of arr) {
          if (!note || !note.content) { result.push(note); continue; }
          const c = note.content.trim();
          let inner = null;
          if (c.startsWith('[')) {
            try { const p = JSON.parse(c); if (Array.isArray(p) && p[0]?.content !== undefined) inner = p; } catch {}
          }
          if (!inner && c.startsWith('{')) {
            try {
              const esc = c.replace(/[\x00-\x1f]/g, function(ch) {
                if (ch === '\n') return '\\n';
                if (ch === '\r') return '\\r';
                if (ch === '\t') return '\\t';
                return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
              });
              const p = JSON.parse('[' + esc + ']');
              if (Array.isArray(p) && p[0]?.content !== undefined) inner = p;
            } catch {}
          }
          if (inner) { result.push(...inner); changed = true; }
          else result.push(note);
        }
        if (changed) {
          await query("UPDATE map_nodes SET notes=$1 WHERE id=$2", [JSON.stringify(result), row.id]);
          fixed++;
        }
      } catch {}
    }
    if (fixed > 0) console.log(`[migrate] Fixed corrupted notes in ${fixed} node(s)`);
  } catch (err) { console.error('[migrate] fixCorruptedNotes error:', err.message); }
}

httpServer.listen(PORT, "0.0.0.0", async () => {
  console.log(`[server] NodeMap API + WS running on :${PORT}`);
  await runMigrations().catch(console.error);
  await seedAdmin().catch(console.error);
  await fixCorruptedNotes();
  // Seed a startup log entry so the Logs tab is never empty
  try {
    const { appLog } = await import("./utils/logger.js");
    await appLog("info", "system", `Server started on port ${PORT} — NoNote v5.23.0`);
  } catch {}
});
