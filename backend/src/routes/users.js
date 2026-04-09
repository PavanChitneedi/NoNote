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

export default router;
