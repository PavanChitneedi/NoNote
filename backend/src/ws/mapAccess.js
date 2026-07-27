import { query } from "../db/pool.js";

// Mirrors the access rule in middleware/auth.js's mapPermission("viewer"):
// owners/admins get global access; everyone else needs to own the map,
// have an explicit map_collaborators row, or the map must be public.
//
// This is a standalone module (not a shared import with mapPermission)
// because the WS JOIN handler in index.js can't use Express middleware —
// but keeping it here as its own testable, importable function at least
// means the live WS code path actually calls tested code instead of
// reimplementing the check inline. If map-access rules change, this and
// mapPermission in middleware/auth.js both need updating.
//
// DB errors are intentionally left to propagate — the caller (WS JOIN
// handler) wraps this in its own try/catch for the generic "Access check
// failed" / 1011 close path.
export async function checkMapAccess(userId, mapId) {
  const userRes = await query(
    "SELECT role, display_name, is_active FROM users WHERE id=$1",
    [userId]
  );
  const u = userRes.rows[0];
  if (!u || !u.is_active) {
    return {
      ok: false,
      message: "User not found or disabled",
      closeCode: 1008,
      closeReason: "Unauthorized",
    };
  }
  const userName = u.display_name || "User";

  if (["owner", "admin"].includes(u.role)) {
    return { ok: true, userName };
  }

  const accessRes = await query(
    `SELECT m.owner_id, mc.permission, m.is_public
     FROM maps m
     LEFT JOIN map_collaborators mc ON mc.map_id=m.id AND mc.user_id=$2
     WHERE m.id=$1`,
    [mapId, userId]
  );
  const row = accessRes.rows[0];
  if (!row) {
    return {
      ok: false,
      message: "Map not found",
      closeCode: 1008,
      closeReason: "Forbidden",
    };
  }

  const hasAccess = row.owner_id === userId || row.permission || row.is_public;
  if (!hasAccess) {
    return {
      ok: false,
      message: "No access to this map",
      closeCode: 1008,
      closeReason: "Forbidden",
    };
  }

  return { ok: true, userName };
}
