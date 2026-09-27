import { parseExportNotes } from './exportFormats.js';

export function normalizeNativeGraph(rawNodes, rawEdges = []) {
    // Always generate fresh IDs — imported nodes/edges have IDs from the source map
    // which already exist in the DB. Reusing them causes ON CONFLICT to silently
    // update the original map's nodes instead of inserting into the new map.
    if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges) || rawNodes.some(n=>!n || typeof n.id!=='string') || rawEdges.some(e=>!e)) throw new Error('Invalid graph');
    const idMap = Object.create(null);
    const nodes = (rawNodes || []).map(n => {
      const newId = crypto.randomUUID();
      idMap[n.id] = newId;
      return {
        id:          newId,
        type:        n.type || n.node_type || "note",
        x:           n.x || 0,
        y:           n.y || 0,
        w:           n.w || 180,
        h:           n.h || 80,
        title:       n.title || "Untitled",
        description: n.description || '',
        node_notes:  n.node_notes || '',
        notes_private: !!n.notes_private,
        notes:       parseExportNotes(n.notes),
        properties:  n.properties || {},
        customProps: n.customProps || n.custom_props || {},
        collapsed:   n.collapsed || false,
        z_index:     n.z_index || 0,
      };
    });
    const edges = (rawEdges || []).map(e => ({
      id:         crypto.randomUUID(),
      from:       idMap[e.from || e.from_node] || e.from || e.from_node,
      to:         idMap[e.to   || e.to_node]   || e.to   || e.to_node,
      label:      e.label || "",
      style:      e.style || "arrow",
      color:      e.color || "#58a6ff",
      fromAnchor: e.fromAnchor || e.from_anchor || null,
      toAnchor:   e.toAnchor   || e.to_anchor   || null,
      midOff:     e.midOff     || e.mid_off      || null,
    }));
    return { nodes, edges };
}
