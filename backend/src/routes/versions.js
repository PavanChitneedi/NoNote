import { Router } from "express";
import { query } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// ── GET /api/maps/:mapId/versions ────────────────────────────
router.get("/:mapId/versions", authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT v.id, v.label, v.node_count, v.edge_count, v.created_at,
              u.display_name as saved_by, u.avatar_color
       FROM map_versions v
       JOIN users u ON u.id = v.user_id
       WHERE v.map_id = $1
       ORDER BY v.created_at DESC
       LIMIT 50`,
      [req.params.mapId]
    );
    res.json({ versions: rows });
  } catch (err) {
    console.error("[versions] list error:", err);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

// ── POST /api/maps/:mapId/versions ───────────────────────────
router.post("/:mapId/versions", authenticate, async (req, res) => {
  try {
    const { nodes = [], edges = [], label = "" } = req.body;
    const { rows } = await query(
      `INSERT INTO map_versions (map_id, user_id, label, nodes_json, edges_json, node_count, edge_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, label, node_count, edge_count, created_at`,
      [req.params.mapId, req.user.id, label,
       JSON.stringify(nodes), JSON.stringify(edges),
       nodes.length, edges.length]
    );

    // Keep only latest 50 versions per map
    await query(
      `DELETE FROM map_versions
       WHERE map_id = $1
         AND id NOT IN (
           SELECT id FROM map_versions WHERE map_id = $1
           ORDER BY created_at DESC LIMIT 50
         )`,
      [req.params.mapId]
    );

    res.status(201).json({ version: rows[0] });
  } catch (err) {
    console.error("[versions] create error:", err);
    res.status(500).json({ error: "Failed to save version" });
  }
});

// ── GET /api/maps/:mapId/versions/:versionId ─────────────────
router.get("/:mapId/versions/:versionId", authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT v.*, u.display_name as saved_by
       FROM map_versions v
       JOIN users u ON u.id = v.user_id
       WHERE v.id = $1 AND v.map_id = $2`,
      [req.params.versionId, req.params.mapId]
    );
    if (!rows[0]) return res.status(404).json({ error: "Version not found" });
    res.json({
      version: rows[0],
      nodes: rows[0].nodes_json,
      edges: rows[0].edges_json,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch version" });
  }
});

// ── DELETE /api/maps/:mapId/versions/:versionId ──────────────
router.delete("/:mapId/versions/:versionId", authenticate, async (req, res) => {
  try {
    await query(
      "DELETE FROM map_versions WHERE id = $1 AND map_id = $2",
      [req.params.versionId, req.params.mapId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete version" });
  }
});

export default router;
