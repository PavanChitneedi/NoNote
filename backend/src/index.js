import express from "express";
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

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`[server] NodeMap API running on :${PORT}`);
  await seedAdmin().catch(console.error);
});
