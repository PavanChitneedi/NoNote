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
import { createClient as createRedisClient } from "./db/redis.js";
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

// ── WebSocket collaboration server (Redis pub/sub) ──────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

// Each backend instance has one Redis subscriber per active map room.
// ws clients on THIS instance register in localRooms.
// Messages published on a map channel reach ALL instances.
const localRooms = new Map();   // mapId → Set<ws>
const redisSubs  = new Map();   // mapId → Redis subscriber client


async function getOrCreateSub(mapId) {
  if (redisSubs.has(mapId)) return redisSubs.get(mapId);
  const sub = createRedisClient();
  await sub.subscribe(`map:${mapId}`, (raw) => {
    const clients = localRooms.get(mapId);
    if (!clients) return;
    // Parse to get sender userId — skip sending back to the publisher
    let senderId = null;
    try { senderId = JSON.parse(raw).userId; } catch {}
    clients.forEach(c => {
      if (c.readyState === 1 && c.userId !== senderId) c.send(raw);
    });
  });
  redisSubs.set(mapId, sub);
  return sub;
}

function cleanupRoom(mapId) {
  const clients = localRooms.get(mapId);
  if (clients && clients.size === 0) {
    localRooms.delete(mapId);
    const sub = redisSubs.get(mapId);
    if (sub) { sub.unsubscribe(); sub.quit(); redisSubs.delete(mapId); }
  }
}

wss.on("connection", (ws) => {
  let mapId = null;
  let userId = null;
  let userDisplayName = "User";
  let pubClient = null; // per-connection publisher

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── JOIN ────────────────────────────────────────────────
    if (msg.type === "join") {
      try {
        const payload = jwt.verify(msg.token, process.env.JWT_ACCESS_SECRET);
        userId = payload.sub;
      } catch (e) {
        console.warn("[ws] auth failed:", e.message);
        ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
        ws.close(1008, "Unauthorized");
        return;
      }

      mapId = msg.mapId;
      try {
        const u = await query("SELECT display_name FROM users WHERE id=$1", [userId]);
        userDisplayName = u.rows[0]?.display_name || "User";
      } catch {}

      // Register locally
      if (!localRooms.has(mapId)) localRooms.set(mapId, new Set());
      localRooms.get(mapId).add(ws);

      // Subscribe to Redis channel for this map
      await getOrCreateSub(mapId);

      // Per-connection publish client
      pubClient = createRedisClient();

      console.log(`[ws] "${userDisplayName}" joined map ${mapId}`);

      // Tell joiner who else is here (local only — good enough for single instance)
      const others = [];
      localRooms.get(mapId).forEach(c => {
        if (c !== ws && c.userId) others.push({ userId: c.userId, userName: c.userName });
      });
      ws.userId = userId; ws.userName = userDisplayName;
      ws.send(JSON.stringify({ type: "room_state", users: others }));

      // Announce to room
      const joinMsg = JSON.stringify({ type: "user_joined", userId, userName: userDisplayName });
      await pubClient.publish(`map:${mapId}`, joinMsg);
      return;
    }

    if (!mapId || !userId || !pubClient) return;

    // ── CHANGELOG ───────────────────────────────────────────
    if (msg.type === "nodes_update" && Array.isArray(msg.nodes)) {
      try {
        const snap = ws._lastNodes;
        if (snap) {
          const byId = (arr) => Object.fromEntries(arr.map(n => [n.id, n]));
          const prev = byId(snap), cur = byId(msg.nodes);
          for (const n of msg.nodes) {
            if (!prev[n.id]) {
              await query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "add_node", n.id, n.title||n.type||"node"]).catch(()=>{});
            } else if (prev[n.id].title !== n.title && n.title) {
              await query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "edit_node", n.id, n.title]).catch(()=>{});
            }
          }
          for (const n of snap) {
            if (!cur[n.id]) {
              await query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "delete_node", n.id, n.title||"node"]).catch(()=>{});
            }
          }
        }
        ws._lastNodes = msg.nodes;
      } catch {}
    }
    if (msg.type === "edges_update" && Array.isArray(msg.edges)) {
      try {
        const snap = ws._lastEdges;
        if (snap) {
          const snapIds = new Set(snap.map(e => e.id));
          const curIds  = new Set(msg.edges.map(e => e.id));
          for (const e of msg.edges) {
            if (!snapIds.has(e.id))
              await query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "add_edge", e.id, e.label||"edge"]).catch(()=>{});
          }
          for (const e of snap) {
            if (!curIds.has(e.id))
              await query("INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "delete_edge", e.id, e.label||"edge"]).catch(()=>{});
          }
        }
        ws._lastEdges = msg.edges;
      } catch {}
    }

    // ── PUBLISH to Redis (fan-out to all subscribers) ────────
    // Add userId/userName so receivers know who sent it
    const out = JSON.stringify({ ...msg, userId, userName: userDisplayName });
    await pubClient.publish(`map:${mapId}`, out).catch(console.error);
  });

  ws.on("close", async () => {
    if (mapId && localRooms.has(mapId)) {
      localRooms.get(mapId).delete(ws);
      cleanupRoom(mapId);
      if (pubClient) {
        const leaveMsg = JSON.stringify({ type: "user_left", userId, userName: userDisplayName });
        await pubClient.publish(`map:${mapId}`, leaveMsg).catch(()=>{});
        pubClient.quit().catch(()=>{});
      }
    }
  });
});


// ── Run DB migrations on every startup ───────────────────────
async function runMigrations() {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const migPath = path.join(process.cwd(), "../postgres/migrate.sql");
    if (fs.existsSync(migPath)) {
      const sql = fs.readFileSync(migPath, "utf8");
      // Split on semicolons, run each statement
      const stmts = sql.split(";").map(s => s.trim()).filter(s => s && !s.startsWith("--"));
      for (const stmt of stmts) {
        try { await query(stmt); }
        catch (e) { console.warn("[migrate] skipped:", e.message.slice(0,80)); }
      }
      console.log("[migrate] migrations applied");
    }
  } catch (e) { console.warn("[migrate] could not run migrations:", e.message); }
}

// ── Start ─────────────────────────────────────────────────────
httpServer.listen(PORT, "0.0.0.0", async () => {
  console.log(`[server] NodeMap API + WS running on :${PORT}`);
  await runMigrations().catch(console.error);
  await seedAdmin().catch(console.error);
});
