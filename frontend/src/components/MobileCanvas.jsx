/**
 * MobileCanvas — touch-optimised map viewer/editor for phones and tablets.
 *
 * Philosophy:
 *  - Full read access for all shared users on mobile
 *  - Simplified edit: tap to select, tap-hold to move, tap toolbar for actions
 *  - Bottom sheet for node details instead of side panel
 *  - Pinch-to-zoom native via CSS transform (no scroll container)
 *  - Floating action button (FAB) for primary actions
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { getMap, saveMap, apiFetch, getAccessToken } from "../api/client.js";

const DEF_W = 220, DEF_H = 96;
const ACCENT = "#58a6ff";

function NodeCard({ node, selected, onTap, remoteColor }) {
  const isSelected = selected === node.id;
  return (
    <div
      onPointerDown={e => { e.stopPropagation(); onTap(node.id); }}
      style={{
        position: "absolute",
        left: node.x, top: node.y,
        width: node.w || DEF_W,
        minHeight: node.h || DEF_H,
        background: "var(--bg2)",
        border: `2px solid ${remoteColor || (isSelected ? ACCENT : "var(--border)")}`,
        borderRadius: 10,
        boxShadow: isSelected
          ? `0 0 0 3px ${ACCENT}44, 0 6px 24px rgba(0,0,0,.5)`
          : "0 2px 8px rgba(0,0,0,.35)",
        transition: "border-color .15s, box-shadow .15s",
        cursor: "pointer",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "10px 12px 6px",
        borderBottom: "1px solid var(--border2)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>
          {node.icon || "📄"}
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700, color: "var(--text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{node.title || "Untitled"}</span>
      </div>
      {/* Body */}
      {node.description && (
        <div style={{
          padding: "6px 12px 8px",
          fontSize: 11, color: "var(--text3)", lineHeight: 1.5,
        }}>
          {node.description.slice(0, 120)}{node.description.length > 120 ? "…" : ""}
        </div>
      )}
      {/* Remote selection badge */}
      {remoteColor && (
        <div style={{
          position: "absolute", top: -10, right: 8,
          background: remoteColor, color: "#fff",
          fontSize: 9, fontWeight: 700, padding: "1px 6px",
          borderRadius: 3, pointerEvents: "none",
        }}>editing</div>
      )}
    </div>
  );
}

export default function MobileCanvas({ mapId, onBack }) {
  const [nodes,    setNodes]    = useState([]);
  const [edges,    setEdges]    = useState([]);
  const [mapMeta,  setMapMeta]  = useState(null);
  const [selected, setSelected] = useState(null); // single nodeId
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [zoom,     setZoom]     = useState(0.6);
  const [pan,      setPan]      = useState({ x: 20, y: 20 });
  const [sheet,    setSheet]    = useState(null);  // bottom sheet mode: "node" | "add" | null
  const [editTitle, setEditTitle] = useState("");
  const [editDesc,  setEditDesc]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [remoteSelections, setRemoteSelections] = useState({});

  const canvasRef   = useRef(null);
  const wsRef       = useRef(null);
  const nodesRef    = useRef([]);
  const saveTimer   = useRef(null);

  // Pinch / pan state
  const pointers    = useRef(new Map());
  const lastPinchD  = useRef(null);
  const lastPanPt   = useRef(null);

  // Keep nodesRef in sync
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // Load map
  useEffect(() => {
    if (!mapId) return;
    setLoading(true);
    getMap(mapId)
      .then(data => {
        setMapMeta(data.map);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [mapId]);

  // WebSocket — same protocol as desktop
  useEffect(() => {
    if (!mapId) return;
    let ws, reconnTimer, active = true;
    const connect = () => {
      const token = getAccessToken();
      if (!token) return;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ type: "join", mapId, token }));
      ws.onmessage = e => {
        let msg; try { msg = JSON.parse(e.data); } catch { return; }
        if (msg.type === "nodes_update") setNodes(msg.nodes);
        if (msg.type === "edges_update") setEdges(msg.edges);
        if (msg.type === "selection_update") {
          setRemoteSelections(prev => ({
            ...prev,
            [msg.userId]: { color: userColor(msg.userId), selectedIds: new Set(msg.selectedIds || []) }
          }));
        }
        if (msg.type === "user_left")
          setRemoteSelections(prev => { const n = { ...prev }; delete n[msg.userId]; return n; });
      };
      ws.onclose = ev => {
        wsRef.current = null;
        if (active && ev.code !== 1000) reconnTimer = setTimeout(connect, 4000);
      };
    };
    connect();
    return () => {
      active = false; clearTimeout(reconnTimer);
      if (ws?.readyState <= 1) ws.close(1000);
    };
  }, [mapId]);

  // Auto-save
  const scheduleSave = useCallback((ns, es) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveMap(mapId, { nodes: ns, edges: es, groupBoxes: [] });
        const w = wsRef.current;
        if (w?.readyState === 1) {
          w.send(JSON.stringify({ type: "nodes_update", nodes: ns }));
          w.send(JSON.stringify({ type: "edges_update", edges: es }));
        }
      } catch {}
      setSaving(false);
    }, 1200);
  }, [mapId]);

  // ── Pointer events for pan + pinch-zoom ─────────────────────────
  const onPointerDown = useCallback(e => {
    if (e.target.closest(".nn-node-mobile")) return; // let node handle it
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointers.current.size === 1) lastPanPt.current = { x: e.clientX, y: e.clientY };
    if (pointers.current.size === 2) lastPinchD.current = null;
    setSelected(null);
  }, []);

  const onPointerMove = useCallback(e => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      // Pinch zoom
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchD.current !== null) {
        const delta = d / lastPinchD.current;
        setZoom(z => Math.max(0.2, Math.min(3, +(z * delta).toFixed(2))));
      }
      lastPinchD.current = d;
    } else if (pts.length === 1) {
      // Pan
      if (lastPanPt.current) {
        const dx = e.clientX - lastPanPt.current.x;
        const dy = e.clientY - lastPanPt.current.y;
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        lastPanPt.current = { x: e.clientX, y: e.clientY };
      }
    }
  }, []);

  const onPointerUp = useCallback(e => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastPinchD.current = null;
    lastPanPt.current = pointers.current.size === 1
      ? [...pointers.current.values()][0] : null;
  }, []);

  // Select node
  const handleNodeTap = useCallback(id => {
    setSelected(id);
    const node = nodesRef.current.find(n => n.id === id);
    if (node) {
      setEditTitle(node.title || "");
      setEditDesc(node.description || "");
      setSheet("node");
    }
  }, []);

  // Save node edits from bottom sheet
  const saveNodeEdit = useCallback(() => {
    if (!selected) return;
    const updated = nodesRef.current.map(n =>
      n.id === selected ? { ...n, title: editTitle, description: editDesc } : n
    );
    setNodes(updated);
    scheduleSave(updated, edges);
    setSheet(null);
  }, [selected, editTitle, editDesc, edges, scheduleSave]);

  // Determine remote color for a node
  const remoteColorFor = id => {
    for (const rs of Object.values(remoteSelections)) {
      if (rs.selectedIds?.has(id)) return rs.color;
    }
    return null;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 36 }}>⬡</div>
      <div style={{ fontSize: 12, color: "var(--text4)", letterSpacing: 2 }}>LOADING…</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: "var(--danger)" }}>Failed to load: {error}</div>
      <button onClick={onBack} style={{ padding: "8px 18px", background: "var(--accent2)",
        border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" }}>← Back</button>
    </div>
  );

  const selectedNode = nodes.find(n => n.id === selected);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex",
      flexDirection: "column", overflow: "hidden", touchAction: "none" }}>

      {/* ── Mobile topbar ── */}
      <div style={{ height: 52, background: "var(--bg2)", borderBottom: "1px solid var(--border2)",
        display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
        flexShrink: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none",
          color: "var(--text3)", fontSize: 20, cursor: "pointer", padding: "4px 6px",
          borderRadius: 6 }}>←</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", flex: 1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {mapMeta?.title || "Map"}
        </span>
        {saving && <span style={{ fontSize: 10, color: "var(--text4)" }}>saving…</span>}
        {Object.keys(remoteSelections).length > 0 && (
          <div style={{ display: "flex", alignItems: "center" }}>
            {Object.entries(remoteSelections).map(([uid, rs], i) => (
              <div key={uid} style={{ width: 22, height: 22, borderRadius: "50%",
                background: rs.color, color: "#fff", fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginLeft: i > 0 ? -6 : 0, border: "2px solid var(--bg2)" }}>
                {uid[0].toUpperCase()}
              </div>
            ))}
          </div>
        )}
        {/* Zoom indicator */}
        <button onClick={() => setZoom(0.6)} style={{ background: "var(--bg3)",
          border: "none", borderRadius: 6, color: "var(--text3)", fontSize: 10,
          padding: "3px 8px", cursor: "pointer" }}>
          {Math.round(zoom * 100)}%
        </button>
      </div>

      {/* ── Canvas area ── */}
      <div
        ref={canvasRef}
        style={{ flex: 1, position: "relative", overflow: "hidden",
          background: "radial-gradient(circle,var(--canvas-dot) 1px,transparent 1px) center/28px 28px var(--canvas-bg)" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Transform container */}
        <div style={{
          position: "absolute",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: 4000, height: 3000,
        }}>
          {/* Edges SVG */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            pointerEvents: "none", overflow: "visible" }}>
            {edges.map(edge => {
              const f = nodes.find(n => n.id === edge.from);
              const t = nodes.find(n => n.id === edge.to);
              if (!f || !t) return null;
              const fcx = f.x + (f.w || DEF_W) / 2, fcy = f.y + (f.h || DEF_H) / 2;
              const tcx = t.x + (t.w || DEF_W) / 2, tcy = t.y + (t.h || DEF_H) / 2;
              const dx = tcx - fcx, dy = tcy - fcy;
              const dist = Math.hypot(dx, dy);
              const c1x = fcx + dx * 0.25, c1y = fcy + dy * 0.1;
              const c2x = tcx - dx * 0.25, c2y = tcy - dy * 0.1;
              return (
                <path key={edge.id}
                  d={`M ${fcx} ${fcy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tcx} ${tcy}`}
                  stroke={edge.color || ACCENT} strokeWidth={1.5} fill="none"
                  strokeDasharray={edge.style === "dashed" ? "8,5" : edge.style === "dotted" ? "2,5" : "none"}
                  markerEnd="url(#mob-arr)" opacity={0.7}/>
              );
            })}
            <defs>
              <marker id="mob-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={ACCENT}/>
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <div key={node.id} className="nn-node-mobile">
              <NodeCard
                node={node}
                selected={selected}
                onTap={handleNodeTap}
                remoteColor={remoteColorFor(node.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Zoom controls (fixed bottom-right) ── */}
      <div style={{ position: "fixed", bottom: sheet ? 260 : 100, right: 16,
        display: "flex", flexDirection: "column", gap: 8, zIndex: 20 }}>
        <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))}
          style={fabBtn()}>＋</button>
        <button onClick={() => setZoom(z => Math.max(0.2, +(z - 0.1).toFixed(1)))}
          style={fabBtn()}>−</button>
        <button onClick={() => { setZoom(0.6); setPan({ x: 20, y: 20 }); }}
          style={{ ...fabBtn(), fontSize: 10, padding: "8px 6px" }}>FIT</button>
      </div>

      {/* ── Bottom sheet — node details ── */}
      {sheet === "node" && selectedNode && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--bg2)", borderTop: "1.5px solid var(--border)",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,.5)",
          padding: "0 0 32px", zIndex: 30,
          maxHeight: "55vh", display: "flex", flexDirection: "column" }}>

          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2,
              background: "var(--border)" }}/>
          </div>

          <div style={{ padding: "0 18px 0", overflowY: "auto", flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text4)",
              letterSpacing: 1.5, marginBottom: 10 }}>NODE DETAILS</div>

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text4)", marginBottom: 4 }}>TITLE</div>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "9px 12px", color: "var(--text)", fontSize: 14,
                  fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}/>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "var(--text4)", marginBottom: 4 }}>DESCRIPTION</div>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                rows={3} style={{ width: "100%", background: "var(--bg3)",
                  border: "1px solid var(--border)", borderRadius: 8,
                  padding: "9px 12px", color: "var(--text)", fontSize: 13,
                  fontFamily: "var(--font-ui)", outline: "none", resize: "none",
                  boxSizing: "border-box" }}/>
            </div>

            {/* Notes preview */}
            {Array.isArray(selectedNode.notes) && selectedNode.notes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "var(--text4)", marginBottom: 6 }}>
                  NOTES ({selectedNode.notes.length})
                </div>
                {selectedNode.notes.slice(0, 3).map((note, i) => (
                  <div key={i} style={{ background: "var(--bg3)", borderRadius: 6,
                    padding: "7px 10px", marginBottom: 6, fontSize: 12,
                    color: "var(--text3)", lineHeight: 1.4 }}>
                    {typeof note === "string" ? note.slice(0, 100) : (note.content || "").slice(0, 100)}
                    {(note.content || note || "").length > 100 ? "…" : ""}
                  </div>
                ))}
                {selectedNode.notes.length > 3 && (
                  <div style={{ fontSize: 11, color: "var(--text4)" }}>
                    +{selectedNode.notes.length - 3} more (open on desktop to see all)
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveNodeEdit}
                style={{ flex: 1, padding: "12px", background: "var(--accent2)",
                  border: "none", borderRadius: 10, color: "#fff", fontSize: 13,
                  fontWeight: 700, cursor: "pointer" }}>
                Save Changes
              </button>
              <button onClick={() => setSheet(null)}
                style={{ padding: "12px 18px", background: "var(--bg3)",
                  border: "1px solid var(--border)", borderRadius: 10, color: "var(--text3)",
                  fontSize: 13, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Node count badge ── */}
      {!sheet && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: "var(--bg3)", border: "1px solid var(--border)",
          borderRadius: 20, padding: "5px 14px", fontSize: 11, color: "var(--text4)",
          zIndex: 20, pointerEvents: "none" }}>
          {nodes.length} nodes · pinch to zoom · tap to select
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
const USER_COLORS = ["#f97316","#06b6d4","#a855f7","#22c55e","#f59e0b","#ef4444","#3b82f6"];
function userColor(id) {
  let h = 0;
  for (let i = 0; i < (id || "").length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return USER_COLORS[h % USER_COLORS.length];
}
function fabBtn() {
  return {
    width: 44, height: 44, borderRadius: "50%",
    background: "var(--bg3)", border: "1px solid var(--border)",
    color: "var(--text)", fontSize: 20, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,.4)",
  };
}
