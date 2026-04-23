import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { query, withTransaction } from "../db/pool.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { appLog } from "../utils/logger.js";

const router = Router();
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12");

const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
};

// ── Helper: get a global setting ─────────────────────────────────────────
async function getSetting(key, fallback = null) {
  try {
    const r = await query("SELECT value FROM app_settings WHERE key=$1", [key]);
    return r.rows[0] ? r.rows[0].value : fallback;
  } catch { return fallback; }
}

// ── Helper: get effective permissions for a user ─────────────────────────
// Returns merged set from role + groups + individual overrides
async function getEffectivePermissions(userId, role) {
  const ROLE_PERMISSIONS = {
    owner:   ["*"],  // wildcard = all
    admin:   ["users.view","users.create","users.edit","users.delete",
               "groups.view","groups.manage","settings.view","settings.edit",
               "logs.view","maps.create","maps.edit","maps.delete","maps.share",
               "llm.use","export.use","collab.use","admin.panel"],
    editor:  ["maps.create","maps.edit","maps.delete","maps.share",
               "llm.use","export.use","collab.use"],
    viewer:  ["maps.view"],
    restricted: ["maps.view"],
  };

  const base = ROLE_PERMISSIONS[role] || [];

  // Get group permissions
  const groups = await query(
    `SELECT ug.permissions FROM user_groups ug
     JOIN user_group_members ugm ON ugm.group_id=ug.id
     WHERE ugm.user_id=$1`, [userId]
  );

  // Get individual permission overrides
  const perms = await query(
    "SELECT permission, granted FROM user_permissions WHERE user_id=$1", [userId]
  );

  const effective = new Set(base);
  groups.rows.forEach(g => {
    const gp = g.permissions || {};
    Object.entries(gp).forEach(([p, granted]) => {
      if (granted) effective.add(p); else effective.delete(p);
    });
  });
  perms.rows.forEach(p => {
    if (p.granted) effective.add(p.permission); else effective.delete(p.permission);
  });

  return [...effective];
}

// ── PATCH /api/users/me — self-update with global setting guards ──────────
router.patch("/me", authenticate, async (req, res) => {
  try {
    const { display_name, email, password, current_password, avatar_color } = req.body;
    const updates = [], vals = [];

    // Check global settings for what's allowed
    const [allowName, allowEmail, allowPw, allowAvatar] = await Promise.all([
      getSetting("allow_username_change", "true"),
      getSetting("allow_email_change", "false"),
      getSetting("allow_password_change", "true"),
      getSetting("allow_avatar_change", "true"),
    ]);

    if (display_name !== undefined) {
      if (allowName !== "true") return res.status(403).json({ error: "Username changes are disabled by admin" });
      if (!display_name.trim()) return res.status(400).json({ error: "Name cannot be empty" });
      updates.push(`display_name=$${updates.length+1}`);
      vals.push(display_name.trim().slice(0, 60));
    }

    if (email !== undefined) {
      if (allowEmail !== "true") return res.status(403).json({ error: "Email changes are disabled by admin" });
      if (!email.includes("@")) return res.status(400).json({ error: "Invalid email address" });
      // Check uniqueness
      const exist = await query("SELECT id FROM users WHERE email=$1 AND id!=$2", [email.toLowerCase(), req.user.id]);
      if (exist.rows.length) return res.status(409).json({ error: "Email already in use" });
      updates.push(`email=$${updates.length+1}`);
      vals.push(email.toLowerCase().trim());
    }

    if (avatar_color !== undefined) {
      if (allowAvatar !== "true") return res.status(403).json({ error: "Avatar changes are disabled by admin" });
      updates.push(`avatar_color=$${updates.length+1}`);
      vals.push(avatar_color);
    }

    if (password !== undefined) {
      if (allowPw !== "true") return res.status(403).json({ error: "Password changes are disabled by admin" });
      if (!current_password) return res.status(400).json({ error: "current_password required" });
      const { rows } = await query("SELECT password_hash FROM users WHERE id=$1", [req.user.id]);
      const ok = await bcrypt.compare(current_password, rows[0]?.password_hash || "");
      if (!ok) return res.status(400).json({ error: "Current password is incorrect" });
      if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
      updates.push(`password_hash=$${updates.length+1}`);
      vals.push(await bcrypt.hash(password, ROUNDS));
    }

    if (!updates.length) return res.status(400).json({ error: "Nothing to update" });
    updates.push(`updated_at=NOW()`);
    vals.push(req.user.id);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(",")} WHERE id=$${vals.length}
       RETURNING id, email, display_name, role, avatar_color`,
      vals
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("[users] me update:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ── GET /api/users/me/settings — what changes are allowed for me ──────────
router.get("/me/settings", authenticate, async (req, res) => {
  try {
    const keys = ["allow_username_change","allow_email_change","allow_password_change","allow_avatar_change"];
    const r = await query(`SELECT key,value FROM app_settings WHERE key=ANY($1)`, [keys]);
    const settings = Object.fromEntries(r.rows.map(x => [x.key, x.value === "true"]));
    // Fill defaults
    keys.forEach(k => { if (settings[k] === undefined) settings[k] = k !== "allow_email_change"; });
    // Get user's groups
    const groups = await query(
      `SELECT ug.id, ug.name, ug.color FROM user_groups ug
       JOIN user_group_members ugm ON ugm.group_id=ug.id WHERE ugm.user_id=$1`,
      [req.user.id]
    );
    const perms = await getEffectivePermissions(req.user.id, req.user.role);
    res.json({ settings, groups: groups.rows, permissions: perms });
  } catch (err) {
    res.status(500).json({ error: "Failed to load user settings" });
  }
});

// ── GET /api/users — list all users (admin) ───────────────────────────────
router.get("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.avatar_color,
              u.created_at, u.last_login_at,
              COALESCE(
                json_agg(json_build_object('id',ug.id,'name',ug.name,'color',ug.color))
                FILTER (WHERE ug.id IS NOT NULL), '[]'
              ) AS groups
       FROM users u
       LEFT JOIN user_group_members ugm ON ugm.user_id=u.id
       LEFT JOIN user_groups ug ON ug.id=ugm.group_id
       GROUP BY u.id ORDER BY u.created_at ASC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error("[users] list:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ── POST /api/users — create user (admin) ────────────────────────────────
router.post("/",
  authenticate, requireRole("admin"),
  [
    body("email").isEmail().normalizeEmail(),
    body("display_name").trim().isLength({ min:1, max:60 }),
    body("password").isLength({ min:8 }),
    body("role").isIn(["owner","admin","editor","viewer","restricted"]),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, display_name, password, role, is_active = true } = req.body;
      // Only owner can create other owners/admins
      if (["owner","admin"].includes(role) && req.user.role !== "owner")
        return res.status(403).json({ error: "Only owner can create admin users" });
      const hash = await bcrypt.hash(password, ROUNDS);
      const { rows } = await query(
        `INSERT INTO users(email, display_name, password_hash, role, is_active)
         VALUES($1,$2,$3,$4,$5)
         RETURNING id, email, display_name, role, is_active, avatar_color`,
        [email, display_name, hash, role, is_active]
      );
      appLog("info", "users", `Admin created user: ${email} (${role})`, req.user.id, { target_email: email, role });
      res.status(201).json({ user: { ...rows[0], groups: [] } });
    } catch (err) {
      if (err.code === "23505") return res.status(409).json({ error: "Email already exists" });
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

// ── PATCH /api/users/:id — admin update any user ─────────────────────────
router.patch("/:id", authenticate, async (req, res) => {
  const isSelf = req.params.id === req.user.id;
  const isAdmin = ["admin","owner"].includes(req.user.role);
  if (!isSelf && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { display_name, email, role, is_active, avatar_color, password } = req.body;
    const updates = [], vals = [];

    if (display_name !== undefined) {
      updates.push(`display_name=$${updates.length+1}`); vals.push(display_name.trim().slice(0,60));
    }
    if (email !== undefined && isAdmin) {
      updates.push(`email=$${updates.length+1}`); vals.push(email.toLowerCase());
    }
    if (role !== undefined && isAdmin) {
      if (role === "owner" && req.user.role !== "owner")
        return res.status(403).json({ error: "Only owner can assign owner role" });
      updates.push(`role=$${updates.length+1}`); vals.push(role);
    }
    if (is_active !== undefined && isAdmin) {
      updates.push(`is_active=$${updates.length+1}`); vals.push(is_active);
    }
    if (avatar_color !== undefined) {
      updates.push(`avatar_color=$${updates.length+1}`); vals.push(avatar_color);
    }
    if (password !== undefined && isAdmin) {
      if (password.length < 8) return res.status(400).json({ error: "Password too short" });
      updates.push(`password_hash=$${updates.length+1}`);
      vals.push(await bcrypt.hash(password, ROUNDS));
    }

    if (!updates.length) return res.status(400).json({ error: "Nothing to update" });
    updates.push("updated_at=NOW()");
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(",")} WHERE id=$${vals.length}
       RETURNING id, email, display_name, role, is_active, avatar_color`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    if (!isSelf) appLog("info", "users", `Admin updated user ${req.params.id}`, req.user.id, { fields: Object.keys(req.body) });
    res.json({ user: rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email already in use" });
    console.error("[users] patch:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ── DELETE /api/users/:id — admin delete user ─────────────────────────────
router.delete("/:id", authenticate, requireRole("owner"), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
  try {
    await query("DELETE FROM users WHERE id=$1", [req.params.id]);
    appLog("warn", "users", `Admin deleted user ${req.params.id}`, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ── GET /api/users/audit — audit log ─────────────────────────────────────
router.get("/audit", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.id, a.action, a.target_user_id, a.meta, a.created_at,
              u.display_name AS actor_name, t.display_name AS target_name
       FROM audit_log a
       LEFT JOIN users u ON u.id=a.actor_id
       LEFT JOIN users t ON t.id=a.target_user_id
       ORDER BY a.created_at DESC LIMIT 200`,
    );
    res.json({ logs: rows });
  } catch {
    res.json({ logs: [] }); // table may not exist yet
  }
});

// ── GET /api/users/search ─────────────────────────────────────────────────
router.get("/search", authenticate, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json([]);
  try {
    const { rows } = await query(
      `SELECT id, email, display_name FROM users
       WHERE (email ILIKE $1 OR display_name ILIKE $1) AND id!=$2 AND is_active=true
       LIMIT 8`,
      [`%${q}%`, req.user.id]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: "Search failed" }); }
});

// ── Groups CRUD ───────────────────────────────────────────────────────────
router.get("/groups", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT g.*, COUNT(ugm.user_id)::int AS member_count,
              u.display_name AS created_by_name
       FROM user_groups g
       LEFT JOIN user_group_members ugm ON ugm.group_id=g.id
       LEFT JOIN users u ON u.id=g.created_by
       GROUP BY g.id, u.display_name ORDER BY g.created_at ASC`
    );
    res.json({ groups: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.post("/groups", authenticate, requireRole("admin"),
  [body("name").trim().isLength({ min:1, max:60 })],
  validate,
  async (req, res) => {
    try {
      const { name, description = "", color = "#6C63FF", permissions = {} } = req.body;
      const { rows } = await query(
        `INSERT INTO user_groups(name, description, color, permissions, created_by)
         VALUES($1,$2,$3,$4,$5) RETURNING *`,
        [name, description, color, JSON.stringify(permissions), req.user.id]
      );
      res.status(201).json({ group: { ...rows[0], member_count: 0 } });
    } catch (err) {
      res.status(500).json({ error: "Failed to create group" });
    }
  }
);

router.patch("/groups/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { name, description, color, permissions } = req.body;
    const updates = [], vals = [];
    if (name) { updates.push(`name=$${updates.length+1}`); vals.push(name); }
    if (description !== undefined) { updates.push(`description=$${updates.length+1}`); vals.push(description); }
    if (color) { updates.push(`color=$${updates.length+1}`); vals.push(color); }
    if (permissions) { updates.push(`permissions=$${updates.length+1}`); vals.push(JSON.stringify(permissions)); }
    if (!updates.length) return res.status(400).json({ error: "Nothing to update" });
    updates.push("updated_at=NOW()");
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE user_groups SET ${updates.join(",")} WHERE id=$${vals.length} RETURNING *`, vals
    );
    res.json({ group: rows[0] });
  } catch { res.status(500).json({ error: "Update failed" }); }
});

router.delete("/groups/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    await query("DELETE FROM user_groups WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Delete failed" }); }
});

// ── Group members ─────────────────────────────────────────────────────────
router.get("/groups/:id/members", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.display_name, u.email, u.role, u.avatar_color, ugm.added_at
       FROM user_group_members ugm JOIN users u ON u.id=ugm.user_id
       WHERE ugm.group_id=$1 ORDER BY ugm.added_at ASC`,
      [req.params.id]
    );
    res.json({ members: rows });
  } catch { res.status(500).json({ error: "Failed to fetch members" }); }
});

router.post("/groups/:id/members", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { user_ids = [] } = req.body;
    if (!user_ids.length) return res.status(400).json({ error: "user_ids required" });
    await Promise.all(user_ids.map(uid =>
      query(
        `INSERT INTO user_group_members(user_id, group_id, added_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
        [uid, req.params.id, req.user.id]
      )
    ));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to add members" }); }
});

router.delete("/groups/:id/members/:uid", authenticate, requireRole("admin"), async (req, res) => {
  try {
    await query(
      "DELETE FROM user_group_members WHERE group_id=$1 AND user_id=$2",
      [req.params.id, req.params.uid]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to remove member" }); }
});

// ── Individual user permissions ───────────────────────────────────────────
router.get("/:id/permissions", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const user = await query("SELECT role FROM users WHERE id=$1", [req.params.id]);
    if (!user.rows.length) return res.status(404).json({ error: "User not found" });
    const perms = await getEffectivePermissions(req.params.id, user.rows[0].role);
    const overrides = await query("SELECT permission, granted FROM user_permissions WHERE user_id=$1", [req.params.id]);
    res.json({ effective: perms, overrides: overrides.rows });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/:id/permissions", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { permission, granted = true } = req.body;
    await query(
      `INSERT INTO user_permissions(user_id, permission, granted, granted_by)
       VALUES($1,$2,$3,$4) ON CONFLICT(user_id, permission) DO UPDATE SET granted=$3`,
      [req.params.id, permission, granted, req.user.id]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.delete("/:id/permissions/:perm", authenticate, requireRole("admin"), async (req, res) => {
  try {
    await query("DELETE FROM user_permissions WHERE user_id=$1 AND permission=$2",
      [req.params.id, req.params.perm]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

// ── Global settings (admin) ───────────────────────────────────────────────
router.get("/settings/global", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { rows } = await query("SELECT key, value FROM app_settings ORDER BY key");
    res.json({ settings: Object.fromEntries(rows.map(r => [r.key, r.value])) });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.patch("/settings/global", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    if (!entries.length) return res.status(400).json({ error: "No settings provided" });
    await Promise.all(entries.map(([k, v]) =>
      query(
        `INSERT INTO app_settings(key,value) VALUES($1,$2)
         ON CONFLICT(key) DO UPDATE SET value=$2, updated_at=NOW()`,
        [k, String(v)]
      )
    ));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to save settings" }); }
});

// ── App Logs ──────────────────────────────────────────────────────────────
router.get("/logs", authenticate, async (req, res) => {
  if (!["admin","owner"].includes(req.user.role))
    return res.status(403).json({ error: "Admin only" });
  const limit  = Math.min(parseInt(req.query.limit || "200"), 1000);
  const offset = parseInt(req.query.offset || "0");
  const level  = req.query.level || null;
  const since  = req.query.since || null;
  try {
    let where = "WHERE 1=1";
    const params = [];
    if (level && level !== "all") { params.push(level); where += ` AND level=$${params.length}`; }
    if (since) { params.push(since); where += ` AND created_at>=$${params.length}`; }
    params.push(limit); const lp = params.length;
    params.push(offset); const op = params.length;
    const rows = await query(
      `SELECT id,level,category,message,user_id,meta,created_at FROM app_logs
       ${where} ORDER BY created_at DESC LIMIT $${lp} OFFSET $${op}`, params
    );
    const total = await query(`SELECT COUNT(*) FROM app_logs ${where}`, params.slice(0,-2));
    res.json({ logs: rows.rows, total: parseInt(total.rows[0].count) });
  } catch { res.status(500).json({ error: "Failed to fetch logs" }); }
});

router.get("/logs/retention", authenticate, async (req, res) => {
  if (!["admin","owner"].includes(req.user.role)) return res.status(403).json({ error: "Admin only" });
  try {
    const r = await query("SELECT value FROM app_settings WHERE key='log_retention_days'");
    res.json({ days: r.rows[0] ? parseInt(r.rows[0].value) : 7 });
  } catch { res.json({ days: 7 }); }
});

router.patch("/logs/retention", authenticate, async (req, res) => {
  if (!["admin","owner"].includes(req.user.role)) return res.status(403).json({ error: "Admin only" });
  const days = Math.max(1, Math.min(365, parseInt(req.body.days || "7")));
  try {
    await query(`INSERT INTO app_settings(key,value) VALUES('log_retention_days',$1) ON CONFLICT(key) DO UPDATE SET value=$1`, [String(days)]);
    res.json({ days });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.delete("/logs", authenticate, async (req, res) => {
  if (!["admin","owner"].includes(req.user.role)) return res.status(403).json({ error: "Admin only" });
  try {
    const r = await query("SELECT value FROM app_settings WHERE key='log_retention_days'");
    const days = r.rows[0] ? parseInt(r.rows[0].value) : 7;
    const del = await query("DELETE FROM app_logs WHERE created_at < NOW() - INTERVAL '1 day' * $1", [days]);
    res.json({ deleted: del.rowCount, retentionDays: days });
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
