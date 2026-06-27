import { useState, useEffect } from "react";
import { getVersions, saveVersion, getVersion, deleteVersion } from "../api/client.js";

export default function VersionHistory({ mapId, nodes, edges, mapTitle, onRestore, onClose, collabLog = [] }) {
  const [tab,      setTab]      = useState("versions");
  const [versions, setVersions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [label,    setLabel]    = useState("");
  const [preview,  setPreview]  = useState(null);
  const [error,    setError]    = useState("");
  const [delConfirm, setDelConfirm] = useState(null);

  useEffect(() => {
    getVersions(mapId)
      .then(d => setVersions(d.versions))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [mapId]);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const d = await saveVersion(mapId, {
        nodes, edges,
        label: label.trim() || `Snapshot ${new Date().toLocaleString()}`,
      });
      setVersions(v => [{ ...d.version, saved_by: "You" }, ...v]);
      setLabel("");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handlePreview = async (ver) => {
    try {
      const d = await getVersion(mapId, ver.id);
      setPreview({ ...ver, nodes: d.nodes, edges: d.edges });
    } catch (e) { setError(e.message); }
  };

  const handleRestore = () => {
    if (!preview) return;
    onRestore(preview.nodes, preview.edges);
    onClose();
  };

  const handleDelete = async (id) => {
    await deleteVersion(mapId, id).catch(e => setError(e.message));
    setVersions(v => v.filter(x => x.id !== id));
    if (preview?.id === id) setPreview(null);
    setDelConfirm(null);
  };

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, padding: "9px 0", border: "none", cursor: "pointer",
      fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 12,
      background: tab === id ? "var(--bg2)" : "var(--bg3)",
      color: tab === id ? "var(--accent)" : "var(--text4)",
      borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent",
      transition: "all .12s",
    }}>{label}</button>
  );

  return (
    <div data-ui="version-history" data-component="VersionHistory" data-page="canvas" data-role="panel"
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }}
      onClick={onClose}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:16, width:"100%", maxWidth:700, maxHeight:"88vh", display:"flex", flexDirection:"column", overflow:"hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>🕐</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>History</div>
            <div style={{ fontSize:11, color:"var(--text4)" }}>{mapTitle}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:22 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border2)", background:"var(--bg3)", flexShrink:0 }}>
          {tabBtn("versions", "🗂 Versions")}
          {tabBtn("activity", `📋 Activity${collabLog.length ? ` (${collabLog.length})` : ""}`)}
        </div>

        {/* ── VERSIONS TAB ── */}
        {tab === "versions" && <>
          <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border2)", background:"var(--bg3)", flexShrink:0 }}>
            <div style={{ display:"flex", gap:8 }}>
              <input value={label} onChange={e => setLabel(e.target.value)}
                placeholder={`Snapshot label (optional) — ${nodes.length} nodes, ${edges.length} edges`}
                style={{ flex:1, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", color:"var(--text)", fontSize:12, outline:"none", fontFamily:"inherit" }}
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
              <button onClick={handleSave} disabled={saving}
                style={{ padding:"8px 16px", background:"var(--accent2)", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
                {saving ? "Saving…" : "💾 Save now"}
              </button>
            </div>
            {error && <div style={{ marginTop:6, fontSize:11, color:"var(--danger)" }}>{error}</div>}
          </div>

          <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
            {/* Version list */}
            <div style={{ width:260, borderRight:"1px solid var(--border2)", overflow:"auto", flexShrink:0 }}>
              {loading ? (
                <div style={{ padding:24, textAlign:"center", color:"var(--text4)", fontSize:12 }}>Loading…</div>
              ) : versions.length === 0 ? (
                <div style={{ padding:24, textAlign:"center", color:"var(--text4)", fontSize:12, lineHeight:1.8 }}>
                  No versions saved yet.<br/>Save a snapshot above.
                </div>
              ) : versions.map(ver => (
                <div key={ver.id} onClick={() => handlePreview(ver)} style={{
                  padding:"11px 14px", cursor:"pointer",
                  borderLeft:`3px solid ${preview?.id===ver.id?"var(--accent)":"transparent"}`,
                  background: preview?.id===ver.id ? "var(--accent2)15" : "transparent",
                  borderBottom:"1px solid var(--border2)", transition:"all .12s",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", flex:1, marginRight:6 }}>
                      {ver.label || "Snapshot"}
                    </div>
                    <button onClick={e => { e.stopPropagation(); setDelConfirm(ver.id); }}
                      style={{ background:"none", border:"none", color:"var(--text4)", cursor:"pointer", fontSize:14, padding:0 }}
                      onMouseEnter={e => e.currentTarget.style.color="var(--danger)"}
                      onMouseLeave={e => e.currentTarget.style.color="var(--text4)"}
                    >×</button>
                  </div>
                  <div style={{ fontSize:10, color:"var(--text4)", marginTop:2 }}>{ver.node_count} nodes · {ver.edge_count} edges</div>
                  <div style={{ fontSize:10, color:"var(--text4)", marginTop:1 }}>{new Date(ver.created_at).toLocaleString()} · {ver.saved_by}</div>
                </div>
              ))}
            </div>

            {/* Preview panel */}
            <div style={{ flex:1, overflow:"auto", padding:18, display:"flex", flexDirection:"column", gap:12 }}>
              {!preview ? (
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text4)", textAlign:"center", gap:8 }}>
                  <span style={{ fontSize:32 }}>🕐</span>
                  <span style={{ fontSize:12 }}>Click a version to preview</span>
                </div>
              ) : (<>
                <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:3 }}>{preview.label || "Snapshot"}</div>
                  <div style={{ fontSize:11, color:"var(--text4)" }}>Saved {new Date(preview.created_at).toLocaleString()} by {preview.saved_by}</div>
                  <div style={{ display:"flex", gap:14, marginTop:6 }}>
                    <span style={{ fontSize:12, color:"var(--text3)" }}>📦 {preview.node_count} nodes</span>
                    <span style={{ fontSize:12, color:"var(--text3)" }}>↔ {preview.edge_count} connections</span>
                  </div>
                </div>
                <div style={{ flex:1, overflow:"auto" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:6 }}>NODES IN THIS VERSION</div>
                  {(Array.isArray(preview.nodes) ? preview.nodes : []).map(n => (
                    <div key={n.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", borderBottom:"1px solid var(--border2)", fontSize:12 }}>
                      <span style={{ color:"var(--text)", flex:1 }}>{n.title}</span>
                      <span style={{ color:"var(--text4)", fontSize:10 }}>{n.type}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={handleRestore}
                    style={{ flex:1, padding:"10px", background:"var(--accent2)", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    ↩ Restore this version
                  </button>
                  <button onClick={() => setPreview(null)}
                    style={{ padding:"10px 14px", background:"var(--bg3)", border:"none", borderRadius:8, color:"var(--text3)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                    Cancel
                  </button>
                </div>
                <div style={{ fontSize:11, color:"var(--text4)", textAlign:"center" }}>
                  ⚠ Restoring replaces the current canvas. Your current state is auto-saved.
                </div>
              </>)}
            </div>
          </div>
        </>}

        {/* ── ACTIVITY TAB ── */}
        {tab === "activity" && (
          <div style={{ flex:1, overflow:"auto", padding:"14px 20px" }}>
            {collabLog.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"var(--text4)", fontSize:12 }}>
                No activity recorded yet. Changes appear here as collaborators edit the map.
              </div>
            ) : collabLog.map((entry, i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"9px 0", borderBottom:"1px solid var(--border2)" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--accent2)22", border:"1px solid var(--accent2)44",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                  color:"var(--accent2)", flexShrink:0 }}>
                  {(entry.user_name||"?")[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:"var(--text)", fontWeight:600 }}>{entry.user_name || "Unknown"}</div>
                  <div style={{ fontSize:11, color:"var(--text3)", marginTop:1 }}>
                    {entry.action}{entry.target_label ? ` — ${entry.target_label}` : ""}
                  </div>
                  <div style={{ fontSize:10, color:"var(--text4)", marginTop:2 }}>
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirm */}
        {delConfirm && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:16, zIndex:10 }}>
            <div style={{ background:"var(--bg2)", borderRadius:10, padding:20, width:300, border:"1px solid var(--border)" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:8 }}>Delete version?</div>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:16 }}>This snapshot will be permanently removed.</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setDelConfirm(null)}
                  style={{ flex:1, padding:"8px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Cancel</button>
                <button onClick={() => handleDelete(delConfirm)}
                  style={{ flex:1, padding:"8px", background:"var(--danger)", border:"none", borderRadius:7, color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
