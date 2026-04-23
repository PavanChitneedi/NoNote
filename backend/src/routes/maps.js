import { randomUUID as _uuid } from 'crypto';
import { Router } from "express";
import { appLog } from "../utils/logger.js";
import { body, param, validationResult } from "express-validator";
import { query, withTransaction } from "../db/pool.js";
import { authenticate, mapPermission } from "../middleware/auth.js";

const router = Router();
const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
};

// ── GET /api/maps ─────────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT m.id, m.title, m.description, m.is_public, m.created_at, m.updated_at,
              u.display_name as owner_name, u.avatar_color as owner_color,
              m.owner_id,
              mc.permission,
              (SELECT COUNT(*) FROM map_nodes WHERE map_id = m.id) as node_count,
              (SELECT COUNT(*) FROM map_collaborators WHERE map_id = m.id) as collab_count
       FROM maps m
       JOIN users u ON u.id = m.owner_id
       LEFT JOIN map_collaborators mc ON mc.map_id = m.id AND mc.user_id = $1
       WHERE m.owner_id = $1 OR mc.user_id = $1
         OR (m.is_public AND $2 = ANY(ARRAY['owner','admin']::text[]))
       ORDER BY m.updated_at DESC`,
      [req.user.id, req.user.role]
    );
    res.json({ maps: rows });
  } catch (err) {
    console.error("[maps] list error:", err);
    res.status(500).json({ error: "Failed to fetch maps" });
  }
});

// ── POST /api/maps ────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  [body("title").trim().isLength({ min: 1, max: 200 })],
  validate,
  async (req, res) => {
    try {
      const { title, description = "" } = req.body;
      const { rows } = await query(
        `INSERT INTO maps (title, description, owner_id) VALUES ($1, $2, $3) RETURNING *`,
        [title, description, req.user.id]
      );
      res.status(201).json({ map: rows[0] });
      appLog("info", "maps", `Map created: "${rows[0].title}"`, req.user.id).catch(()=>{});
    } catch (err) {
      console.error("[maps] create error:", err);
      res.status(500).json({ error: "Failed to create map" });
    }
  }
);

// ── GET /api/maps/:mapId ──────────────────────────────────────
router.get(
  "/:mapId",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("viewer"); fn(req, res, next); },
  async (req, res) => {
    try {
      const { mapId } = req.params;
      const [mapRes, nodesRes, edgesRes, collabRes] = await Promise.all([
        query(
          `SELECT m.*, u.display_name as owner_name, u.avatar_color as owner_color
           FROM maps m JOIN users u ON u.id = m.owner_id WHERE m.id = $1`,
          [mapId]
        ),
        query("SELECT * FROM map_nodes WHERE map_id = $1 ORDER BY z_index, created_at", [mapId]),
        query(
          `SELECT me.*, fn.title as from_title, tn.title as to_title
           FROM map_edges me
           JOIN map_nodes fn ON fn.id = me.from_node
           JOIN map_nodes tn ON tn.id = me.to_node
           WHERE me.map_id = $1`,
          [mapId]
        ),
        query(
          `SELECT mc.*, u.display_name, u.email, u.avatar_color
           FROM map_collaborators mc JOIN users u ON u.id = mc.user_id
           WHERE mc.map_id = $1`,
          [mapId]
        ),
      ]);

      if (!mapRes.rows[0]) return res.status(404).json({ error: "Map not found" });

      res.json({
        map:           mapRes.rows[0],
        nodes:         nodesRes.rows,
        edges:         edgesRes.rows,
        collaborators: collabRes.rows,
        groupBoxes: mapRes.rows[0].group_boxes || [],
      });
    } catch (err) {
      console.error("[maps] get error:", err);
      res.status(500).json({ error: "Failed to fetch map" });
    }
  }
);

// ── PUT /api/maps/:mapId ──────────────────────────────────────
router.put(
  "/:mapId",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("editor"); fn(req, res, next); },
  async (req, res) => {
    try {
      const { title, description, is_public } = req.body;
      const { rows } = await query(
        `UPDATE maps SET
           title       = COALESCE($2, title),
           description = COALESCE($3, description),
           is_public   = COALESCE($4, is_public)
         WHERE id = $1 RETURNING *`,
        [req.params.mapId, title, description, is_public]
      );
      res.json({ map: rows[0] });
    } catch (err) {
      console.error("[maps] update error:", err);
      res.status(500).json({ error: "Failed to update map" });
    }
  }
);

// ── DELETE /api/maps/:mapId ───────────────────────────────────
router.patch(
  "/:mapId",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("editor"); fn(req, res, next); },
  async (req, res) => {
    const { title, description } = req.body;
    try {
      const result = await query(
        `UPDATE maps SET title=COALESCE($1,title), description=COALESCE($2,description),
         updated_at=NOW() WHERE id=$3 RETURNING *`,
        [title||null, description||null, req.params.mapId]
      );
      res.json({ map: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to update map" });
    }
  }
);

router.post(
  "/:mapId/duplicate",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("viewer"); fn(req, res, next); },
  async (req, res) => {
    try {
      const orig = await query("SELECT * FROM maps WHERE id=$1",[req.params.mapId]);
      if (!orig.rows.length) return res.status(404).json({error:"Not found"});
      const m = orig.rows[0];
      const newMap = await query(
        `INSERT INTO maps (owner_id,title,description,node_data,edge_data,is_public)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [req.user.id, m.title+" (copy)", m.description, m.node_data, m.edge_data, false]
      );
      res.json({ map: newMap.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Failed to duplicate map" });
    }
  }
);

router.delete(
  "/:mapId",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("owner"); fn(req, res, next); },
  async (req, res) => {
    try {
      await query("DELETE FROM maps WHERE id = $1", [req.params.mapId]);
      res.json({ ok: true });
    } catch (err) {
      console.error("[maps] delete error:", err);
      res.status(500).json({ error: "Failed to delete map" });
    }
  }
);

// ── Bulk save (nodes + edges) ─────────────────────────────────
router.post(
  "/:mapId/save",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("editor"); fn(req, res, next); },
  async (req, res) => {
    try {
      const { nodes, edges, groupBoxes } = req.body;
      const { mapId } = req.params;

      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // Build id map: frontend-id → real UUID (generate if needed)
      const idMap = {};
      for (const n of nodes || []) {
        idMap[n.id] = UUID_RE.test(n.id) ? n.id : _uuid();
      }
      for (const e of edges || []) {
        if (!idMap[e.id]) idMap[e.id] = UUID_RE.test(e.id) ? e.id : _uuid();
      }

      await withTransaction(async (client) => {
        // Upsert all nodes with real UUIDs
        for (const n of nodes || []) {
          const nodeId = idMap[n.id];
          await client.query(
            `INSERT INTO map_nodes (id, map_id, node_type, title, x, y, w, h, properties, custom_props, notes, z_index)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (id) DO UPDATE SET
               title=$4, x=$5, y=$6, w=$7, h=$8,
               properties=$9, custom_props=$10, notes=$11, z_index=$12`,
            [nodeId, mapId, n.type, n.title, n.x, n.y, n.w, n.h,
             JSON.stringify(n.properties || {}),
             JSON.stringify(n.customProps || {}),
             n.notes || "", n.z_index || 0]
          );
        }

        // Sync edges: delete all, re-insert with real UUIDs
        await client.query("DELETE FROM map_edges WHERE map_id = $1", [mapId]);
        for (const e of edges || []) {
          const edgeId   = idMap[e.id]   || _uuid();
          const fromNode = idMap[e.from]  || e.from;
          const toNode   = idMap[e.to]    || e.to;
          if (!UUID_RE.test(fromNode) || !UUID_RE.test(toNode)) continue; // skip orphaned
          await client.query(
            `INSERT INTO map_edges (id, map_id, from_node, to_node, label, style, color, from_anchor, to_anchor, mid_off)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
[edgeId, mapId, fromNode, toNode,
             e.label || "", e.style || "arrow", e.color || "#58a6ff",
             e.fromAnchor ? JSON.stringify(e.fromAnchor) : null,
             e.toAnchor   ? JSON.stringify(e.toAnchor)   : null,
             e.midOff     ? JSON.stringify(e.midOff)     : null]
          );
        }

        // Delete removed nodes
        if (nodes?.length > 0) {
          const keepIds = Object.values(idMap).filter(id => UUID_RE.test(id));
          if (keepIds.length > 0) {
            await client.query(
              `DELETE FROM map_nodes WHERE map_id = $1 AND id != ALL($2::uuid[])`,
              [mapId, keepIds]
            );
          }
        }

        // Save groupBoxes as JSON in maps metadata
        await client.query(
          "UPDATE maps SET updated_at=NOW(), group_boxes=$2::jsonb WHERE id=$1",
          [mapId, JSON.stringify(groupBoxes || [])]
        );
      });

      res.json({ ok: true });
    } catch (err) {
      console.error("[maps] save error:", err);
      res.status(500).json({ error: "Failed to save map" });
    }
  }
);

// ── Collaborators ─────────────────────────────────────────────
router.post(
  "/:mapId/collaborators",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("admin"); fn(req, res, next); },
  async (req, res) => {
    try {
      const { email, permission = "viewer" } = req.body;
      const { rows: users } = await query(
        "SELECT id FROM users WHERE email = $1", [email]
      );
      if (!users[0]) return res.status(404).json({ error: "User not found" });

      await query(
        `INSERT INTO map_collaborators (map_id, user_id, permission, invited_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (map_id, user_id) DO UPDATE SET permission = $3`,
        [req.params.mapId, users[0].id, permission, req.user.id]
      );
      res.json({ ok: true });
    } catch (err) {
      console.error("[maps] collab error:", err);
      res.status(500).json({ error: "Failed to add collaborator" });
    }
  }
);

router.get(
  "/:mapId/collaborators",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("viewer"); fn(req, res, next); },
  async (req, res) => {
    try {
      const result = await query(
        `SELECT mc.user_id, mc.permission, u.email, u.display_name
         FROM map_collaborators mc JOIN users u ON u.id = mc.user_id
         WHERE mc.map_id = $1
         ORDER BY mc.invited_at`,
        [req.params.mapId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch collaborators" });
    }
  }
);

router.delete(
  "/:mapId/collaborators/:userId",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("admin"); fn(req, res, next); },
  async (req, res) => {
    try {
      await query(
        "DELETE FROM map_collaborators WHERE map_id=$1 AND user_id=$2",
        [req.params.mapId, req.params.userId]
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to remove collaborator" });
    }
  }
);

// ── GET /api/maps/:mapId/changelog ────────────────────────────
router.get(
  "/:mapId/changelog",
  authenticate,
  async (req, res, next) => { const fn = await mapPermission("viewer"); fn(req, res, next); },
  async (req, res) => {
    try {
      const result = await query(
        `SELECT id, user_id, user_name, action, target_id, target_label, meta, created_at
         FROM map_changelog WHERE map_id=$1
         ORDER BY created_at DESC LIMIT 100`,
        [req.params.mapId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch changelog" });
    }
  }
);

export default router;
