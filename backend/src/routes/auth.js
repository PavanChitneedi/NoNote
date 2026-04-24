import { Router } from "express";
import { appLog } from "../utils/logger.js";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { query, withTransaction } from "../db/pool.js";
import redis, { PREFIXES } from "../db/redis.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12");

function makeTokens(userId, role) {
  const accessSecret  = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET / JWT_REFRESH_SECRET not configured");
  }
  const access = jwt.sign(
    { sub: userId, role },
    accessSecret,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
  const refresh = jwt.sign(
    { sub: userId, jti: uuidv4() },
    refreshSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );
  return { access, refresh };
}

// ── POST /api/auth/login ──────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const { rows } = await query(
        "SELECT id, email, display_name, password_hash, role, is_active, avatar_color FROM users WHERE email = $1",
        [email]
      );

      const user = rows[0];
      // Constant-time compare even if user not found
      const hash = user?.password_hash || "$2b$12$invalidhashpadding000000000000000000000000000000000000000";
      const valid = await bcrypt.compare(password, hash);

      if (!user || !valid || !user.is_active) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { access, refresh } = makeTokens(user.id, user.role);
      const tokenHash = await bcrypt.hash(refresh, 8);

      await withTransaction(async (client) => {
        // Store refresh token
        await client.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
           VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
          [user.id, tokenHash, req.headers["user-agent"]?.slice(0, 255), req.ip]
        );
        // Update last login
        await client.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
      });

      // Audit
      try { await query("INSERT INTO audit_log (user_id, action, ip_address) VALUES ($1, 'login', $2)", [user.id, req.ip]); } catch {}
      await appLog('info', 'auth', `User login: ${user.email}`, user.id, { ip: req.ip }).catch(()=>{});

      res.json({
        access_token: access,
        refresh_token: refresh,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          avatar_color: user.avatar_color,
        },
      });
    } catch (err) {
      console.error("[auth] login error:", err);
      const errMsg = err.message?.includes("JWT") ? "Server configuration error — contact admin" : "Login failed";
      console.error("[auth] login error:", err.message);
      res.status(500).json({ error: errMsg });
    }
  }
);

// ── POST /api/auth/register (if REGISTRATION_OPEN=true or first admin) ──
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("display_name").trim().isLength({ min: 1, max: 60 }),
  ],
  async (req, res) => {
    if (process.env.REGISTRATION_OPEN !== "true") {
      return res.status(403).json({ error: "Registration is closed. Contact admin." });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password, display_name } = req.body;
      const hash = await bcrypt.hash(password, ROUNDS);
      const colors = ["#6C63FF", "#E91E63", "#2196F3", "#4CAF50", "#FF9800"];
      const avatar_color = colors[Math.floor(Math.random() * colors.length)];

      const { rows } = await query(
        `INSERT INTO users (email, display_name, password_hash, role, avatar_color)
         VALUES ($1, $2, $3, 'viewer', $4)
         RETURNING id, email, display_name, role, avatar_color`,
        [email, display_name, hash, avatar_color]
      );

      const user = rows[0];
      const { access, refresh } = makeTokens(user.id, user.role);
      const tokenHash = await bcrypt.hash(refresh, 8);
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
        [user.id, tokenHash, req.headers["user-agent"]?.slice(0, 255), req.ip]
      );

      res.status(201).json({ access_token: access, refresh_token: refresh, user });
    } catch (err) {
      if (err.code === "23505") return res.status(409).json({ error: "Email already in use" });
      console.error("[auth] register error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// ── POST /api/auth/refresh ────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "Missing refresh token" });

  try {
    let payload;
    try {
      payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const { rows: tokens } = await query(
      `SELECT rt.id, rt.token_hash, rt.revoked_at, u.id as user_id, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.user_id = $1 AND rt.expires_at > NOW() AND rt.revoked_at IS NULL
       ORDER BY rt.created_at DESC LIMIT 10`,
      [payload.sub]
    );

    let matched = null;
    for (const row of tokens) {
      const ok = await bcrypt.compare(refresh_token, row.token_hash);
      if (ok) { matched = row; break; }
    }

    if (!matched || !matched.is_active) {
      return res.status(401).json({ error: "Refresh token not found or revoked" });
    }

    // Rotate: revoke old, issue new
    const { access, refresh: newRefresh } = makeTokens(matched.user_id, matched.role);
    const newHash = await bcrypt.hash(newRefresh, 8);

    await withTransaction(async (client) => {
      await client.query("UPDATE refresh_tokens SET revoked_at=NOW() WHERE id=$1", [matched.id]);
      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
        [matched.user_id, newHash, req.headers["user-agent"]?.slice(0, 255), req.ip]
      );
    });

    res.json({ access_token: access, refresh_token: newRefresh });
  } catch (err) {
    console.error("[auth] refresh error:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post("/logout", authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization.slice(7);
    const ttl = Math.max(0, req.tokenExpiry - Math.floor(Date.now() / 1000));
    if (ttl > 0) {
      await redis.setex(`${PREFIXES.userSession}blocked:${token}`, ttl, "1");
    }
    await query(
      "UPDATE refresh_tokens SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL",
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[auth] logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
