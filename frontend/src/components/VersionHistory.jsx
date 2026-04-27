import { useState, useEffect } from "react";
import { getVersions, saveVersion, getVersion, deleteVersion } from "../api/client.js";

export default function VersionHistory({ mapId, nodes, edges, mapTitle, onRestore, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [label,    setLabel]    = useState("");
  const [preview,  setPreview]  = useState(null);
  const [error,    setError]    = useState("");

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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this version?")) return;
    await deleteVersion(mapId, id).catch(e => setError(e.message));
    setVersions(v => v.filter(x => x.id !== id));
    if (preview?.id === id) setPreview(null);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }}
      onClick={onClose}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:16, width:"100%", maxWidth:680, maxHeight:"88vh", display:"flex", flexDirection:"column", overflow:"hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>🕐</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>Version History</div>
            <div style={{ fontSize:11, color:"var(--text4)" }}>{mapTitle} · up to 50 versions stored</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:22 }}>×</button>
        </div>

        {/* Save new version */}
        <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border2)", background:"var(--bg3)" }}>
          <div style={{ display:"flex", gap:8 }}>
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder={`Snapshot label (optional) — ${nodes.length} nodes, ${edges.length} edges`}
              style={{ flex:1, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"9px 12px", color:"var(--text)", fontSize:12, outline:"none", fontFamily:"inherit" }}
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
            <button onClick={handleSave} disabled={saving}
              style={{ padding:"9px 18px", background:"var(--accent2)", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
              {saving ? "Saving…" : "💾 SAVE NOW"}
            </button>
          </div>
          {error && <div style={{ marginTop:8, fontSize:12, color:"var(--danger)" }}>{error}</div>}
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {/* Version list */}
          <div style={{ width:280, borderRight:"1px solid var(--border2)", overflow:"auto", flexShrink:0 }}>
            {loading ? (
              <div style={{ padding:24, textAlign:"center", color:"var(--text4)", fontSize:12 }}>Loading…</div>
            ) : versions.length === 0 ? (
              <div style={{ padding:24, textAlign:"center", color:"var(--text4)", fontSize:12, lineHeight:1.8 }}>
                No versions saved yet.<br/>Save a snapshot to start.
              </div>
            ) : versions.map(ver => (
              <div key={ver.id}
                onClick={() => handlePreview(ver)}
                style={{
                  padding:"12px 16px", cursor:"pointer", borderLeft:`3px solid ${preview?.id===ver.id?"var(--accent)":"transparent"}`,
                  background: preview?.id===ver.id ? "var(--accent2)15" : "transparent",
                  borderBottom:"1px solid var(--border2)", transition:"all .12s",
                }}
                onMouseEnter={e => { if(preview?.id!==ver.id) e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"; }}
                onMouseLeave={e => { if(preview?.id!==ver.id) e.currentTarget.style.background="transparent"; }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text)", flex:1, marginRight:8 }}>
                    {ver.label || `Snapshot`}
                  </div>
                  <button onClick={e => handleDelete(ver.id, e)}
                    style={{ background:"none", border:"none", color:"var(--text4)", cursor:"pointer", fontSize:14, flexShrink:0, padding:0 }}
                    onMouseEnter={e => e.currentTarget.style.color="var(--danger)"}
                    onMouseLeave={e => e.currentTarget.style.color="var(--text4)"}
                  >×</button>
                </div>
                <div style={{ fontSize:10, color:"var(--text4)", marginTop:3 }}>
                  {ver.node_count} nodes · {ver.edge_count} edges
                </div>
                <div style={{ fontSize:10, color:"var(--text4)", marginTop:1 }}>
                  {new Date(ver.created_at).toLocaleString()} · {ver.saved_by}
                </div>
              </div>
            ))}
          </div>

          {/* Preview panel */}
          <div style={{ flex:1, overflow:"auto", padding:20, display:"flex", flexDirection:"column", gap:12 }}>
            {!preview ? (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text4)", textAlign:"center", gap:8 }}>
                <span style={{ fontSize:32 }}>🕐</span>
                <span style={{ fontSize:13 }}>Click a version to preview it</span>
              </div>
            ) : (
              <>
                <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:4 }}>
                    {preview.label || "Snapshot"}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text4)" }}>
                    Saved {new Date(preview.created_at).toLocaleString()} by {preview.saved_by}
                  </div>
                  <div style={{ display:"flex", gap:16, marginTop:8 }}>
                    <span style={{ fontSize:12, color:"var(--text3)" }}>📦 {preview.node_count} nodes</span>
                    <span style={{ fontSize:12, color:"var(--text3)" }}>↔ {preview.edge_count} connections</span>
                  </div>
                </div>

                {/* Node list preview */}
                <div style={{ flex:1, overflow:"auto" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:8 }}>NODES IN THIS VERSION</div>
                  {(Array.isArray(preview.nodes) ? preview.nodes : []).map(n => (
                    <div key={n.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid var(--border2)", fontSize:12 }}>
                      <span>{n.type==="server"?"🗄️":n.type==="database"?"🗃️":n.type==="cloud"?"☁️":n.type==="network"?"🌐":"📝"}</span>
                      <span style={{ color:"var(--text)" }}>{n.title}</span>
                      <span style={{ color:"var(--text4)", marginLeft:"auto", fontSize:10 }}>{n.type}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={handleRestore}
                    style={{ flex:1, padding:"11px", background:"var(--accent2)", border:"none", borderRadius:9, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    ↩ RESTORE THIS VERSION
                  </button>
                  <button onClick={() => setPreview(null)}
                    style={{ padding:"11px 16px", background:"var(--bg3)", border:"none", borderRadius:9, color:"var(--text3)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                    CANCEL
                  </button>
                </div>

                <div style={{ fontSize:11, color:"var(--text4)", textAlign:"center" }}>
                  ⚠ Restoring will replace the current canvas. Your current state is auto-saved.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
