import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { query } from "../db/pool.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12");

// ── PATCH /api/users/me (self-update: name, password) ────────
router.patch("/me", authenticate, async (req, res) => {
  try {
    const { display_name, password, current_password } = req.body;
    const updates = [], vals = [];

    if (display_name) { updates.push(`display_name=$${updates.length+1}`); vals.push(display_name.trim().slice(0,60)); }

    if (password) {
      if (!current_password) return res.status(400).json({ error: "current_password required" });
      const { rows } = await query("SELECT password_hash FROM users WHERE id=$1", [req.user.id]);
      const ok = await bcrypt.compare(current_password, rows[0]?.password_hash || "");
      if (!ok) return res.status(400).json({ error: "Current password is incorrect" });
      if (password.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });
      updates.push(`password_hash=$${updates.length+1}`);
      vals.push(await bcrypt.hash(password, ROUNDS));
    }

    if (!updates.length) return res.status(400).json({ error: "Nothing to update" });
    vals.push(req.user.id);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(",")} WHERE id=$${vals.length} RETURNING id, email, display_name, role, avatar_color`,
      vals
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("[users] me update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ── GET /api/users (admin+) ───────────────────────────────────
router.get("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, email, display_name, role, is_active, avatar_color, created_at, last_login_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ── POST /api/users (admin creates user) ─────────────────────
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("display_name").trim().isLength({ min: 1, max: 60 }),
    body("role").isIn(["admin", "editor", "viewer"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password, display_name, role } = req.body;
      // Only owners can create admins
      if (role === "admin" && req.user.role !== "owner") {
        return res.status(403).json({ error: "Only owners can create admins" });
      }

      const hash = await bcrypt.hash(password, ROUNDS);
      const colors = ["#6C63FF", "#E91E63", "#2196F3", "#4CAF50", "#FF9800", "#9C27B0"];
      const avatar_color = colors[Math.floor(Math.random() * colors.length)];

      const { rows } = await query(
        `INSERT INTO users (email, display_name, password_hash, role, avatar_color)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, display_name, role, is_active, avatar_color, created_at`,
        [email, display_name, hash, role, avatar_color]
      );

      await query(
        "INSERT INTO audit_log (user_id, action, resource, resource_id) VALUES ($1,$2,'user',$3)",
        [req.user.id, "create_user", rows[0].id]
      );

      res.status(201).json({ user: rows[0] });
    } catch (err) {
      if (err.code === "23505") return res.status(409).json({ error: "Email already in use" });
      console.error("[users] create error:", err);
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

// ── PATCH /api/users/:id ──────────────────────────────────────
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const isSelf = req.params.id === req.user.id;
    const isAdmin = ["owner", "admin"].includes(req.user.role);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: "Cannot modify other users" });
    }

    const { display_name, password, role, is_active } = req.body;

    // Role changes require admin; owner-only for admin promotions
    if (role && !isAdmin) return res.status(403).json({ error: "Cannot change role" });
    if (role === "owner" && req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can promote to owner" });
    }
    // Prevent demoting yourself
    if (role && isSelf) return res.status(400).json({ error: "Cannot change your own role" });

    let hash;
    if (password) hash = await bcrypt.hash(password, ROUNDS);

    const { rows } = await query(
      `UPDATE users SET
         display_name = COALESCE($2, display_name),
         password_hash = COALESCE($3, password_hash),
         role = COALESCE($4, role),
         is_active = COALESCE($5, is_active)
       WHERE id = $1
       RETURNING id, email, display_name, role, is_active, avatar_color`,
      [req.params.id, display_name, hash, role, is_active]
    );

    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("[users] update error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ── DELETE /api/users/:id (owner only) ───────────────────────
router.delete("/:id", authenticate, requireRole("owner"), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "Cannot delete yourself" });
  }
  try {
    await query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ── GET /api/users/audit (admin+) ────────────────────────────
router.get("/audit", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT al.*, u.display_name, u.email
       FROM audit_log al LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC LIMIT 200`
    );
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

// ── GET /api/users/search?q= (for share autocomplete) ───────
router.get("/search", authenticate, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json([]);
  try {
    const result = await query(
      `SELECT id, email, display_name FROM users
       WHERE (email ILIKE $1 OR display_name ILIKE $1)
         AND id != $2
       LIMIT 8`,
      [`%${q}%`, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});


// ── GET /api/users/logs — application logs (admin) ──────────────────
router.get("/logs", authenticate, async (req, res) => {
  if (!["admin","owner"].includes(req.user.role))
    return res.status(403).json({ error: "Admin only" });
  const limit  = Math.min(parseInt(req.query.limit  || "200"), 1000);
  const offset = parseInt(req.query.offset || "0");
  const level  = req.query.level || null; // error|warn|info|all
  const since  = req.query.since || null; // ISO date string
  try {
    let where = "WHERE 1=1";
    const params = [];
    if (level && level !== "all") {
      params.push(level); where += ` AND level = $${params.length}`;
    }
    if (since) {
      params.push(since); where += ` AND created_at >= $${params.length}`;
    }
    params.push(limit);  const lp = params.length;
    params.push(offset); const op = params.length;
    const rows = await query(
      `SELECT id, level, category, message, user_id, meta, created_at
       FROM app_logs ${where}
       ORDER BY created_at DESC LIMIT $${lp} OFFSET $${op}`,
      params
    );
    const total = await query(`SELECT COUNT(*) FROM app_logs ${where}`, params.slice(0,-2));
    res.json({ logs: rows.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ── GET /api/users/logs/retention — get/set retention days ───────────
router.get("/logs/retention", authenticate, async (req, res) => {
  if (!["admin","owner"].includes(req.user.role))
    return res.status(403).json({ error: "Admin only" });
  try {
    const r = await query("SELECT value FROM app_settings WHERE key='log_retention_days'");
    res.json({ days: r.rows[0] ? parseInt(r.rows[0].value) : 7 });
  } catch { res.json({ days: 7 }); }
});

router.patch("/logs/retention", authenticate, async (req, res) => {
  if (!["admin","owner"].includes(req.user.role))
    return res.status(403).json({ error: "Admin only" });
  const days = Math.max(1, Math.min(365, parseInt(req.body.days || "7")));
  try {
    await query(
      `INSERT INTO app_settings(key,value) VALUES('log_retention_days',$1)
       ON CONFLICT(key) DO UPDATE SET value=$1`, [String(days)]
    );
    res.json({ days });
  } catch { res.status(500).json({ error: "Failed to update retention" }); }
});

// ── DELETE /api/users/logs — clear old logs past retention ──────────
router.delete("/logs", authenticate, async (req, res) => {
  if (!["admin","owner"].includes(req.user.role))
    return res.status(403).json({ error: "Admin only" });
  try {
    const r = await query("SELECT value FROM app_settings WHERE key='log_retention_days'");
    const days = r.rows[0] ? parseInt(r.rows[0].value) : 7;
    const del = await query(
      "DELETE FROM app_logs WHERE created_at < NOW() - INTERVAL '1 day' * $1", [days]
    );
    res.json({ deleted: del.rowCount, retentionDays: days });
  } catch { res.status(500).json({ error: "Failed to prune logs" }); }
});

export default router;
