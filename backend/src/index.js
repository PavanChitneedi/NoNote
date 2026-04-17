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

// ── WebSocket collaboration server ───────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

// mapId → Set of ws clients
const rooms = new Map();

wss.on("connection", (ws, req) => {
  let mapId = null;
  let userId = null;
  let userDisplayName = "Unknown";

  ws.on("message", async raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === "join") {
      try {
        const payload = jwt.verify(msg.token, process.env.JWT_SECRET);
        userId = payload.sub || payload.id;
      } catch (e) {
        console.warn("[ws] auth failed:", e.message);
        ws.close(1008, "Unauthorized"); return;
      }
      mapId = msg.mapId;
      // Fetch display name
      try {
        const u = await query("SELECT display_name FROM users WHERE id=$1", [userId]);
        if (u.rows[0]) userDisplayName = u.rows[0].display_name || "User";
      } catch {}
      if (!rooms.has(mapId)) rooms.set(mapId, new Set());
      rooms.get(mapId).add(ws);
      ws.mapId = mapId; ws.userId = userId; ws.userName = userDisplayName;
      console.log(`[ws] "${userDisplayName}" joined map ${mapId}`);
      // Tell the joining user who else is in the room
      const others = [];
      rooms.get(mapId).forEach(c => {
        if (c !== ws && c.readyState === 1)
          others.push({ userId: c.userId, userName: c.userName });
      });
      ws.send(JSON.stringify({ type: "room_state", users: others }));
      // Tell others this user joined
      rooms.get(mapId).forEach(c => {
        if (c !== ws && c.readyState === 1)
          c.send(JSON.stringify({ type: "user_joined", userId, userName: userDisplayName }));
      });
      return;
    }

    if (!mapId || !userId) return;

    const room = rooms.get(mapId);
    if (!room) return;

    // Log significant changes to map_changelog
    if (msg.type === "nodes_update" && Array.isArray(msg.nodes)) {
      try {
        // Detect what changed by comparing with last snapshot
        const snap = ws._lastNodes;
        if (snap) {
          const snapById = {};
          snap.forEach(n => { snapById[n.id] = n; });
          const curById = {};
          msg.nodes.forEach(n => { curById[n.id] = n; });
          // New nodes
          for (const n of msg.nodes) {
            if (!snapById[n.id]) {
              await query(
                "INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "add_node", n.id, n.title || n.type]
              );
            } else if (snapById[n.id].title !== n.title && n.title) {
              await query(
                "INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "edit_node", n.id, n.title]
              );
            }
          }
          // Deleted nodes
          for (const n of snap) {
            if (!curById[n.id]) {
              await query(
                "INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "delete_node", n.id, n.title || n.type]
              );
            }
          }
        }
        ws._lastNodes = msg.nodes;
      } catch (e) { console.error("[ws] changelog err:", e.message); }
    }

    if (msg.type === "edges_update" && Array.isArray(msg.edges)) {
      try {
        const snap = ws._lastEdges;
        if (snap) {
          const snapIds = new Set(snap.map(e => e.id));
          for (const e of msg.edges) {
            if (!snapIds.has(e.id)) {
              await query(
                "INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "add_edge", e.id, e.label || "edge"]
              );
            }
          }
          const curIds = new Set(msg.edges.map(e => e.id));
          for (const e of snap) {
            if (!curIds.has(e.id)) {
              await query(
                "INSERT INTO map_changelog(map_id,user_id,user_name,action,target_id,target_label) VALUES($1,$2,$3,$4,$5,$6)",
                [mapId, userId, userDisplayName, "delete_edge", e.id, e.label || "edge"]
              );
            }
          }
        }
        ws._lastEdges = msg.edges;
      } catch (e) { console.error("[ws] changelog err:", e.message); }
    }

    // Broadcast to all OTHER clients
    const out = JSON.stringify({ ...msg, userId, userName: userDisplayName });
    room.forEach(client => {
      if (client !== ws && client.readyState === 1) client.send(out);
    });
  });

  ws.on("close", () => {
    if (mapId && rooms.has(mapId)) {
      rooms.get(mapId).delete(ws);
      if (rooms.get(mapId).size === 0) rooms.delete(mapId);
      const room = rooms.get(mapId);
      if (room) {
        const out = JSON.stringify({ type: "user_left", userId, userName: userDisplayName });
        room.forEach(c => { if (c.readyState === 1) c.send(out); });
      }
    }
  });
});

// ── Start ─────────────────────────────────────────────────────
httpServer.listen(PORT, "0.0.0.0", async () => {
  console.log(`[server] NodeMap API + WS running on :${PORT}`);
  await seedAdmin().catch(console.error);
});
