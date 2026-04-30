import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";
import redis, { PREFIXES } from "../db/redis.js";

const ROLE_HIERARCHY = { owner: 4, admin: 3, editor: 2, viewer: 1 };

// ── Verify JWT access token ───────────────────────────────────
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Check if token is blocklisted (logout)
    const blocked = await redis.get(`${PREFIXES.userSession}blocked:${token}`);
    if (blocked) return res.status(401).json({ error: "Token revoked" });

    const { rows } = await query(
      "SELECT id, email, display_name, role, is_active, avatar_color FROM users WHERE id = $1",
      [payload.sub]
    );
    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ error: "User not found or disabled" });
    }

    req.user = rows[0];
    req.tokenExpiry = payload.exp;
    next();
  } catch (err) {
    console.error("[auth] authenticate error:", err);
    res.status(500).json({ error: "Auth error" });
  }
}

// ── Require minimum global role ───────────────────────────────
export function requireRole(minRole) {
  return (req, res, next) => {
    const userLevel = ROLE_HIERARCHY[req.user?.role] ?? 0;
    const required  = ROLE_HIERARCHY[minRole] ?? 99;
    if (userLevel < required) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// ── Check per-map permission (from map_collaborators or ownership) ──
export async function mapPermission(requiredPerm) {
  return async (req, res, next) => {
    try {
      const mapId = req.params.mapId || req.body.map_id;
      const userId = req.user.id;

      // Admins and owners have global access
      if (["owner", "admin"].includes(req.user.role)) return next();

      const { rows } = await query(
        `SELECT m.owner_id, mc.permission
         FROM maps m
         LEFT JOIN map_collaborators mc ON mc.map_id = m.id AND mc.user_id = $2
         WHERE m.id = $1`,
        [mapId, userId]
      );

      if (!rows[0]) return res.status(404).json({ error: "Map not found" });

      const { owner_id, permission } = rows[0];
      const isOwner = owner_id === userId;
      const effectivePerm = isOwner ? "owner" : permission;

      if (!effectivePerm) {
        // Check if map is public and we only need viewer
        const { rows: pub } = await query("SELECT is_public FROM maps WHERE id=$1", [mapId]);
        if (pub[0]?.is_public && requiredPerm === "viewer") return next();
        return res.status(403).json({ error: "No access to this map" });
      }

      if (ROLE_HIERARCHY[effectivePerm] < ROLE_HIERARCHY[requiredPerm]) {
        return res.status(403).json({ error: "Insufficient map permission" });
      }

      req.mapPerm = effectivePerm;
      next();
    } catch (err) {
      console.error("[auth] mapPermission error:", err);
      res.status(500).json({ error: "Permission check failed" });
    }
  };
}
