import React from 'react';
import { useState, useEffect } from "react";
import LiveDashboard from "./LiveDashboard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getMaps, createMap, deleteMap, apiFetch, saveMap, getAccessToken } from "../api/client.js";
import { CHANGELOG, CURRENT_VERSION } from "../changelog.js";

const RC = { owner:"#FFD93D", admin:"#f78166", editor:"var(--accent)", viewer:"var(--text3)" };

const MAP_ACCENT_COLORS = ["#6C63FF","#FF6C2F","#0095D5","#16a34a","#E67C1C","#be185d","#0891b2","#7c3aed","#dc2626","#059669"];
const MAP_ICON_OPTIONS   = ["🗺","🏠","🌐","⚙","🔒","☁","💾","📊","🔌","🧪","🏢","📱","🚀","🎯","📡"];
const DEFAULT_GROUPS     = ["Personal","Work","Infrastructure","Network","Security","Archive"];

function getMapMeta(id)       { try{return JSON.parse(localStorage.getItem("nn_mm_"+id)||"{}");}catch{return {};} }
function setMapMeta(id, meta) { localStorage.setItem("nn_mm_"+id, JSON.stringify(meta)); }
function mapColor(id,idx)     { return getMapMeta(id).color || MAP_ACCENT_COLORS[idx%MAP_ACCENT_COLORS.length]; }
function mapGroup(id)         { return getMapMeta(id).group || ""; }
function mapIcon(id)          { return getMapMeta(id).icon  || "🗺"; }

// ── Inline Share Modal (shown from dashboard without navigating away) ────
function ShareModal({ map, onClose }) {
  const [email, setEmail]         = useState("");
  const [perm,  setPerm]          = useState("editor");
  const [users, setUsers]         = useState([]);
  const [search, setSearch]       = useState([]);
  const [saving, setSaving]       = useState(false);
  const [msg,   setMsg]           = useState("");

  useEffect(() => {
    apiFetch(`/maps/${map.id}/collaborators`).then(d=>setUsers(Array.isArray(d)?d:[])).catch(()=>{});
  }, [map.id]);

  const doSearch = async (q) => {
    setEmail(q);
    if (q.length < 2) { setSearch([]); return; }
    const r = await apiFetch(`/users/search?q=${encodeURIComponent(q)}`).catch(()=>[]);
    setSearch(Array.isArray(r) ? r : []);
  };

  const addUser = async (uid) => {
    setSaving(true); setMsg("");
    try {
      await apiFetch(`/maps/${map.id}/collaborators`, { method:"POST", body:JSON.stringify({ user_id:uid, permission:perm }) });
      const d = await apiFetch(`/maps/${map.id}/collaborators`);
      setUsers(Array.isArray(d)?d:[]); setEmail(""); setSearch([]);
      setMsg("Added!");
    } catch(e) { setMsg(e.message); }
    setSaving(false);
  };

  const removeUser = async (uid) => {
    await apiFetch(`/maps/${map.id}/collaborators/${uid}`, { method:"DELETE" }).catch(()=>{});
    setUsers(u=>u.filter(x=>x.id!==uid));
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:800,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:14,
        width:"min(460px,94vw)",boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",border:"none",padding:26,
        display:"flex",flexDirection:"column",gap:16}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>👥</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Share — {map.title}</div>
            <div style={{fontSize:11,color:"var(--text4)",marginTop:2}}>Invite people to collaborate</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,color:"var(--text4)",cursor:"pointer"}}>×</button>
        </div>
        {msg&&<div style={{fontSize:12,color:"var(--accent)"}}>{msg}</div>}
        {/* Add user */}
        <div style={{display:"flex",gap:8,position:"relative"}}>
          <input value={email} onChange={e=>doSearch(e.target.value)} placeholder="Search by name or email…"
            style={{flex:1,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,
              padding:"9px 12px",color:"var(--text)",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <select value={perm} onChange={e=>setPerm(e.target.value)}
            style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,
              padding:"9px 10px",color:"var(--text)",fontSize:12,fontFamily:"inherit",outline:"none"}}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          {search.length>0&&(
            <div style={{position:"absolute",top:"100%",left:0,right:80,zIndex:10,marginTop:4,
              background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:8,
              boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",border:"none"}}>
              {search.map(u=>(
                <div key={u.id} onClick={()=>addUser(u.id)} style={{padding:"9px 12px",cursor:"pointer",
                  fontSize:12,color:"var(--text2)"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
                  {u.display_name} <span style={{color:"var(--text4)"}}>{u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Current collaborators */}
        {users.length>0&&(
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1.5,marginBottom:8}}>COLLABORATORS</div>
            {users.map(u=>(
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",
                borderBottom:"1px solid var(--border2)"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:u.avatar_color||"#6C63FF",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>
                  {u.display_name?.[0]?.toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{u.display_name}</div>
                  <div style={{fontSize:10,color:"var(--text4)"}}>{u.permission}</div>
                </div>
                <button onClick={()=>removeUser(u.id)} style={{background:"none",border:"none",
                  color:"var(--danger)",cursor:"pointer",fontSize:14}}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ onOpenMap, onOpenAdmin, onShowThemes, skinNav="top" }) {
  const [showChangelog, setShowChangelog] = useState(false);
  const [menuMap,   setMenuMap]   = useState(null);
  const [renaming,  setRenaming]  = useState(null);
  const [shareMap,  setShareMap]  = useState(null);
  const { user, logout } = useAuth();
  const [maps, setMaps]       = useState([]);
  const [dashTab, setDashTab]     = useState("maps");
  const [viewMode, setViewMode]   = useState("grid");   // "grid" | "list"
  const [activeGroup, setGroup]   = useState("all");
  const [mapSearch, setMapSearch] = useState("");
  const [editingMeta, setEditingMeta] = useState(null); // mapId being meta-edited
  const [, forceUpdate] = useState(0); // re-render after meta change
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle]= useState("");
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating]= useState(false);
  const [error, setError]     = useState("");
  const [conflict, setConflict] = useState(null);
  const [toast, setToast] = useState(null); // {msg, type:"ok"|"err"}
  const [importConflict, setImportConflict] = useState(null); // {title, existing, nodes, edges}
  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    getMaps().then(d=>setMaps(d.maps)).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const title = newTitle.trim(); if (!title) return;
    setCreating(true); setError("");
    try {
      const duplicate = maps.find(m=>m.title.toLowerCase()===title.toLowerCase());
      let finalTitle = title;
      if (duplicate) {
        finalTitle = `${title} (${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"})})`;
        setError(`Name taken — creating as "${finalTitle}"`);
        setTimeout(()=>setError(""),3000);
      }
      const d = await createMap({ title:finalTitle });
      setMaps(m=>[d.map,...m.filter(x=>x.id!==d.map.id)]);
      setNewTitle(""); setShowNew(false);
      onOpenMap(d.map.id);
    } catch(err) { setError(err.message); }
    finally { setCreating(false); }
  };

  const handleRename = async (id, title) => {
    try {
      await apiFetch(`/maps/${id}`, { method:"PATCH", body:JSON.stringify({ title }) });
      setMaps(m=>m.map(x=>x.id===id?{...x,title}:x));
    } catch {}
    setRenaming(null);
  };

  const handleDuplicate = async (map) => {
    try {
      const d = await apiFetch(`/maps/${map.id}/duplicate`, { method:"POST" });
      if (d.map) setMaps(m=>[d.map,...m]);
    } catch(e) {
      if (e.message?.includes("already exists")) {
        try {
          const src = await apiFetch(`/maps/${map.id}`);
          const newTitle = (src.map?.title || map.title) + " (copy)";
          const nd = await createMap({ title: newTitle });
          await saveMap(nd.map.id, { nodes: src.nodes||[], edges: src.edges||[], groupBoxes:[] });
          setMaps(m=>[{...nd.map, title:newTitle},...m]);
        } catch(e2) { showToast("Duplicate failed: "+e2.message, "err"); }
      } else { showToast("Duplicate failed: "+e.message, "err"); }
    }
  };

  const handleExportNoNote = async (map) => {
    try {
      const d = await apiFetch(`/maps/${map.id}`);
      // DB rows use node_type/custom_props — map to frontend format for .nonote compatibility
      const nodes = (d.nodes || []).map(n => ({
        id: n.id, type: n.node_type || n.type, title: n.title,
        x: n.x, y: n.y, w: n.w, h: n.h,
        description: n.description || "",
        properties: typeof n.properties === "string" ? JSON.parse(n.properties||"{}") : (n.properties||{}),
        customProps: typeof n.custom_props === "string" ? JSON.parse(n.custom_props||"{}") : (n.custom_props||n.customProps||{}),
        notes: (() => { try { return JSON.parse(n.notes||"[]"); } catch { return []; } })(),
      }));
      const edges = (d.edges || []).map(e => ({
        id: e.id, from: e.from_node || e.from, to: e.to_node || e.to,
        label: e.label||"", style: e.style||"arrow", color: e.color||"#58a6ff",
        fromAnchor: e.from_anchor, toAnchor: e.to_anchor, midOff: e.mid_off,
      }));
      const bundle = {
        version:1, app:"NoNote",
        title: d.map?.title || map.title,
        exported: new Date().toISOString(),
        nodes, edges,
      };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"}));
      a.download = `${(map.title||"map").replace(/[^a-z0-9]/gi,"-")}.nonote`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch(e) { showToast("Export failed: "+e.message, "err"); }
  };

  // Sanitize imported nodes/edges to ensure correct field names regardless of export source
  const sanitizeImport = (rawNodes, rawEdges) => {
    // Always generate fresh IDs — imported nodes/edges have IDs from the source map
    // which already exist in the DB. Reusing them causes ON CONFLICT to silently
    // update the original map's nodes instead of inserting into the new map.
    const idMap = {};
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
        notes:       Array.isArray(n.notes) ? n.notes : [],
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
  };

  const doImportSave = async (mapId, nodes, edges, title, isOverwrite = false) => {
    await saveMap(mapId, { nodes, edges, groupBoxes: [] });
    if (isOverwrite) {
      getMaps().then(d => setMaps(d.maps)).catch(() => {});
      showToast(`"${title}" overwritten — ${nodes.length} nodes`);
    } else {
      getMaps().then(d => setMaps(d.maps)).catch(() => {});
      showToast(`"${title}" imported — ${nodes.length} nodes`);
    }
    onOpenMap(mapId);
  };

  const handleImportFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    let raw;
    try { raw = JSON.parse(await f.text()); } catch { showToast("Invalid file — not valid JSON", "err"); return; }
    if (raw.app !== "NoNote" || !Array.isArray(raw.nodes)) { showToast("Not a valid .nonote file", "err"); return; }

    const { nodes, edges } = sanitizeImport(raw.nodes, raw.edges);
    const title = raw.title || f.name.replace(/\.nonote$/i, "") || "Imported Map";
    const existing = maps.find(m => m.title.toLowerCase() === title.toLowerCase());

    if (existing) {
      // Show inline conflict modal instead of window.confirm
      setImportConflict({ title, existing, nodes, edges });
      return;
    }

    // No conflict — create new map and save
    let newMapId = null;
    try {
      const d = await createMap({ title });
      newMapId = d.map.id;
      await doImportSave(newMapId, nodes, edges, title);
    } catch(err) {
      // Clean up the orphaned empty map if save failed
      if (newMapId) {
        try { await deleteMap(newMapId); } catch {}
        setMaps(m => m.filter(x => x.id !== newMapId));
      }
      showToast("Import failed: " + err.message, "err");
    }
  };

  const handleImportConflictResolve = async (choice) => {
    if (!importConflict) return;
    const { title, existing, nodes, edges } = importConflict;
    setImportConflict(null);

    if (choice === "overwrite") {
      try {
        await doImportSave(existing.id, nodes, edges, title, true);
      } catch(err) { showToast("Overwrite failed: " + err.message, "err"); }
    } else if (choice === "copy") {
      const copyTitle = title + " (imported " + new Date().toLocaleTimeString() + ")";
      let newMapId = null;
      try {
        const d = await createMap({ title: copyTitle });
        newMapId = d.map.id;
        await doImportSave(newMapId, nodes, edges, copyTitle);
      } catch(err) {
        if (newMapId) {
          try { await deleteMap(newMapId); } catch {}
          setMaps(m => m.filter(x => x.id !== newMapId));
        }
        showToast("Import failed: " + err.message, "err");
      }
    }
    // "cancel" — do nothing
  };
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this map? This cannot be undone.")) return;
    await deleteMap(id).catch(()=>{});
    setMaps(m=>m.filter(x=>x.id!==id));
  };

  return (
    <>
    {/* ── Sidebar + Content layout ── */}
    <div style={{ display:"flex", minHeight:"calc(100vh - var(--topbar-h))", background:"var(--bg)" }}>

      {/* ── Left Sidebar ── */}
      {skinNav==="top" && <div className="nn-sidebar" data-ui="dashboard-sidebar" data-component="DashboardSidebar" data-page="dashboard" data-role="sidebar" style={{ width:"var(--sidebar-w,220px)", flexShrink:0,
        background:"var(--sidebar-bg,var(--bg2))",
        borderRight:"var(--sidebar-border,1px solid var(--border2))",
        backdropFilter:"var(--sidebar-blur,none)",
        WebkitBackdropFilter:"var(--sidebar-blur,none)",
        display:"flex", flexDirection:"column",
        padding:"24px 0", position:"sticky", top:0, height:"calc(100vh - var(--topbar-h))",
        overflowY:"auto" }}>
        {/* User block */}
        <div style={{ padding:"0 18px 20px", borderBottom:"1px solid var(--border2)", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%",
              background:user?.avatar_color||"var(--accent2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:15, fontWeight:800, color:"#fff", flexShrink:0 }}>
              {user?.display_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", lineHeight:1.2 }}>{user?.display_name}</div>
              <div style={{ fontSize:10, color:RC[user?.role]||"var(--text4)", fontWeight:600 }}>{user?.role}</div>
            </div>
          </div>
          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[["Maps", maps.length],["Nodes", maps.reduce((a,m)=>a+(m.node_count||0),0)]].map(([l,v])=>(
              <div key={l} style={{ background:"var(--bg3)", borderRadius:"var(--radius-sm)", padding:"6px 8px", border:"1px solid var(--border2)" }}>
                <div style={{ fontSize:16, fontWeight:800, color:"var(--text)", lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:9, color:"var(--text4)", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav items */}
        {[["maps","🗺","Maps"],["live","📡","Live Dashboard"]].map(([id,icon,label])=>(
          <button key={id} onClick={()=>{ setDashTab(id); window.location.hash=id==="live"?"live":"dashboard"; }}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 18px",
              border:"none", cursor:"pointer", fontFamily:"var(--font-ui)", fontWeight:600,
              fontSize:12, textAlign:"left", transition:"all .1s",
              background: dashTab===id ? "var(--accent2)22" : "transparent",
              color: dashTab===id ? "var(--accent2)" : "var(--text3)",
              borderLeft: dashTab===id ? "3px solid var(--accent2)" : "3px solid transparent" }}>
            <span style={{ fontSize:14 }}>{icon}</span>{label}
          </button>
        ))}

        <div style={{ flex:1 }}/>

        {/* Bottom actions */}
        <div style={{ padding:"0 12px", borderTop:"1px solid var(--border2)", paddingTop:12 }}>
          <button onClick={()=>setShowChangelog(true)}
            style={{ width:"100%", padding:"7px 10px", background:"none",
              border:"1px solid var(--border)", borderRadius:7, color:"var(--text4)",
              fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-ui)", textAlign:"left" }}>
            {CURRENT_VERSION} ✦ What's new
          </button>
        </div>
      </div>}

      {/* ── Main content ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 28px", minWidth:0 }}>

        {/* ── Compact nav header for non-sidebar skins ── */}
        {skinNav !== "top" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20,
            padding:"8px 12px", background:"var(--bg2)", borderRadius:"var(--radius-md)",
            border:"1px solid var(--border2)", flexShrink:0, flexWrap:"wrap" }}>
            {/* User pill */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:4 }}>
              <div style={{ width:28, height:28, borderRadius:"50%",
                background:user?.avatar_color||"var(--accent2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>
                {user?.display_name?.[0]?.toUpperCase()}
              </div>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--text3)" }}>
                {user?.display_name}
              </div>
            </div>
            <div style={{ width:1, height:20, background:"var(--border2)", flexShrink:0 }}/>
            {/* Maps / Live tabs */}
            <div style={{ display:"flex", gap:2, background:"var(--bg3)",
              borderRadius:"var(--radius-sm)", padding:2, border:"1px solid var(--border)" }}>
              {[["maps","🗺 Maps"],["live","📡 Live"]].map(([id,lbl])=>(
                <button key={id}
                  onClick={()=>{ setDashTab(id); window.location.hash=id==="live"?"live":"dashboard"; }}
                  style={{ fontSize:11, padding:"4px 12px",
                    border:"none", borderRadius:"var(--radius-xs)", cursor:"pointer",
                    fontFamily:"var(--font-ui)", fontWeight:700,
                    background: dashTab===id ? "var(--accent2)" : "transparent",
                    color: dashTab===id ? "#fff" : "var(--text4)" }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ flex:1 }}/>
            <button onClick={()=>setShowChangelog(true)}
              style={{ background:"none", border:"1px solid var(--border)", borderRadius:"var(--radius-btn)",
                padding:"4px 10px", color:"var(--text4)", fontSize:10, cursor:"pointer",
                fontFamily:"var(--font-ui)", fontWeight:600 }}>
              {CURRENT_VERSION} ✦ What's new
            </button>
          </div>
        )}

        {/* ── Changelog Modal ── */}
        {showChangelog&&(
          <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center"}}
            onClick={()=>setShowChangelog(false)}>
            <div style={{background:"var(--bg2)",border:"1.5px solid var(--accent)",borderRadius:12,
              boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",border:"none",width:540,maxWidth:"94vw",maxHeight:"80vh",
              display:"flex",flexDirection:"column",overflow:"hidden"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",
                borderBottom:"1px solid var(--border2)",background:"var(--bg3)",flexShrink:0}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--accent)"}}>NoNote — What's New</div>
                  <div style={{fontSize:10,color:"var(--text4)",marginTop:2}}>Full changelog across all versions</div>
                </div>
                <button onClick={()=>setShowChangelog(false)}
                  style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"14px 18px"}}>
                {CHANGELOG.map(entry=>(
                  <div key={entry.v} style={{marginBottom:18}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--accent)"}}>{entry.v}</span>
                      <span style={{fontSize:10,color:"var(--text4)"}}>{entry.date}</span>
                    </div>
                    {entry.items.map((item,i)=>(
                      <div key={i} style={{display:"flex",gap:6,marginBottom:4,fontSize:11,color:"var(--text2)"}}>
                        <span style={{color:"var(--accent)",flexShrink:0}}>✦</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background:"var(--danger)18", border:`1px solid var(--danger)40`, borderRadius:8, padding:"10px 14px", fontSize:12, color:"var(--danger)", marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:9999,
            background: toast.type==="err" ? "#3d0f0f" : "#0f2d1a",
            border:`1px solid ${toast.type==="err" ? "var(--danger)" : "#2ea043"}`,
            color: toast.type==="err" ? "var(--danger)" : "#3fb950",
            borderRadius:10, padding:"11px 22px", fontSize:13, fontWeight:600,
            boxShadow:"0 4px 24px #0008", pointerEvents:"none", whiteSpace:"nowrap" }}>
            {toast.type==="err" ? "✕ " : "✓ "}{toast.msg}
          </div>
        )}

        {/* Import conflict modal */}
        {importConflict && (
          <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:14, padding:"28px 32px", maxWidth:420, width:"90%", boxShadow:"0 8px 40px #000a" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--text1)", marginBottom:10 }}>Map already exists</div>
              <div style={{ fontSize:13, color:"var(--text3)", marginBottom:24 }}>
                A map named <strong style={{color:"var(--text1)"}}>"{importConflict.title}"</strong> already exists.<br/>What would you like to do?
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <button onClick={()=>handleImportConflictResolve("overwrite")}
                  style={{ flex:1, padding:"9px 16px", background:"var(--danger)22", border:"1px solid var(--danger)60", borderRadius:8, color:"var(--danger)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  ↺ Overwrite existing
                </button>
                <button onClick={()=>handleImportConflictResolve("copy")}
                  style={{ flex:1, padding:"9px 16px", background:"var(--accent)22", border:"1px solid var(--accent)60", borderRadius:8, color:"var(--accent)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  ⊕ Save as copy
                </button>
                <button onClick={()=>handleImportConflictResolve("cancel")}
                  style={{ padding:"9px 16px", background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:8, color:"var(--text3)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section title — only show for top-nav skins (others get nav strip above) */}
        {skinNav === "top" && (
          <div style={{ marginBottom:18, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:16, fontWeight:"var(--font-weight-ui,800)", color:"var(--text)", letterSpacing:"var(--letter-space)" }}>
              {dashTab==="maps" ? "Your Maps" : "Live Dashboard"}
            </div>
          </div>
        )}
        {/* ── Action bar (maps only) ── */}
        {dashTab==="maps"&&<div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
          {["owner","admin","editor"].includes(user?.role) && (
            showNew ? (
              <form onSubmit={handleCreate} style={{ display:"flex", gap:8, flex:1, minWidth:260 }}>
                <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Map title…"
                  style={{ flex:1, background:"var(--bg2)", border:`1px solid var(--accent)`, borderRadius:8, padding:"9px 14px", color:"var(--text)", fontSize:13, outline:"none" }}/>
                <button type="submit" disabled={creating} style={{ padding:"9px 16px", background:"var(--accent2)", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  {creating?"…":"CREATE"}
                </button>
                <button type="button" onClick={()=>setShowNew(false)} style={{ padding:"9px 12px", background:"var(--bg3)", border:"none", borderRadius:8, color:"var(--text3)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                  CANCEL
                </button>
              </form>
            ) : (
              <button data-tut="new-map" onClick={()=>setShowNew(true)} style={{ padding:"9px 18px", background:"var(--accent2)", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                ＋ New Map
              </button>
            )
          )}
          {/* Import .nonote */}
          <label data-tut="import" style={{ padding:"9px 15px", background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:8, color:"var(--text3)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
            ↙ Import .nonote
            <input type="file" accept=".nonote,.json" style={{ display:"none" }} onChange={handleImportFile}/>
          </label>
        </div>}

        {/* Map grid */}
        {dashTab==="live" ? (
          <LiveDashboard maps={maps} />
        ) : loading ? (
          <div style={{ textAlign:"center", color:"var(--text4)", fontSize:13, padding:50 }}>Loading maps…</div>
        ) : maps.length===0 ? (
          <div style={{ textAlign:"center", padding:"70px 20px", color:"var(--text4)", fontSize:13, lineHeight:2 }}>
            <div style={{ fontSize:36, marginBottom:14 }}>⬡</div>
            No maps yet. Create your first one.
          </div>
        ) : (
          <>
            {/* Rename inline overlay */}
            {renaming&&(
              <div style={{position:"fixed",inset:0,zIndex:800,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center"}}
                onClick={()=>setRenaming(null)}>
                <div style={{background:"var(--bg2)",borderRadius:10,padding:20,minWidth:340,boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))"}}
                  onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:10}}>Rename Map</div>
                  <input autoFocus value={renaming.title}
                    onChange={e=>setRenaming(r=>({...r,title:e.target.value}))}
                    onKeyDown={e=>{if(e.key==="Enter")handleRename(renaming.id,renaming.title);if(e.key==="Escape")setRenaming(null);}}
                    style={{width:"100%",boxSizing:"border-box",padding:"8px 12px",background:"var(--bg3)",border:"1px solid var(--accent)",borderRadius:8,color:"var(--text)",fontSize:13,outline:"none",marginBottom:10}}/>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setRenaming(null)} style={{padding:"6px 14px",background:"var(--bg3)",border:"none",borderRadius:7,color:"var(--text3)",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Cancel</button>
                    <button onClick={()=>handleRename(renaming.id,renaming.title)} style={{padding:"6px 16px",background:"var(--accent2)",border:"none",borderRadius:7,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Rename</button>
                  </div>
                </div>
              </div>
            )}
            {/* Context menu */}
            {menuMap&&(
              <>
                <div style={{position:"fixed",inset:0,zIndex:699}} onClick={()=>setMenuMap(null)}/>
                <div style={{position:"fixed",left:menuMap.x,top:menuMap.y,zIndex:700,background:"var(--bg2)",
                  border:"none",borderRadius:9,boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
                  minWidth:170,overflow:"hidden"}}>
                  {[
                    {icon:"↗",label:"Open",action:()=>{onOpenMap(menuMap.id);setMenuMap(null);}},
                    {icon:"✎",label:"Rename",action:()=>{setRenaming({id:menuMap.id,title:menuMap.title});setMenuMap(null);}},
                    {icon:"⧉",label:"Duplicate",action:()=>{handleDuplicate(menuMap);setMenuMap(null);}},
                    {icon:"↙",label:"Export .nonote",action:()=>{handleExportNoNote(menuMap);setMenuMap(null);}},
                    {icon:"👥",label:"Share / Collaborate",action:()=>{setShareMap(menuMap);setMenuMap(null);}},
                    {icon:"✕",label:"Delete",color:"var(--danger)",action:()=>{handleDelete(menuMap.id,{stopPropagation:()=>{}});setMenuMap(null);}},
                  ].map(({icon,label,action,color})=>(
                    <div key={label} onClick={action}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",cursor:"pointer",
                        fontSize:12,color:color||"var(--text2)",transition:"background .1s"}}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
                      <span style={{width:16,textAlign:"center",opacity:.7}}>{icon}</span>{label}
                    </div>
                  ))}
                </div>
              </>
            )}
{(()=>{
              // Filter + group maps
              const allGroups = [...new Set(maps.map(m=>mapGroup(m.id)).filter(Boolean))];
              const filtered  = maps.filter(m=>{
                const matchGroup = activeGroup==="all" || mapGroup(m.id)===activeGroup;
                const matchSearch = !mapSearch || m.title.toLowerCase().includes(mapSearch.toLowerCase());
                return matchGroup && matchSearch;
              });
              const grouped = activeGroup==="all" && !mapSearch
                ? [...new Set(["", ...allGroups])].reduce((acc,g)=>{
                    const items=maps.filter(m=>mapGroup(m.id)===(g||""));
                    if(items.length) acc.push({group:g||"Ungrouped",items});
                    return acc;
                  },[])
                : [{group:"",items:filtered}];

              return <>
                {/* ── Toolbar ── */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                  {/* Search */}
                  <input value={mapSearch} onChange={e=>setMapSearch(e.target.value)} placeholder="Search maps…" data-ui="dashboard-search" data-component="Dashboard" data-page="dashboard" data-role="search-input"
                    style={{flex:"0 0 200px",padding:"6px 10px",background:"var(--bg3)",border:"1px solid var(--border)",
                      borderRadius:"var(--radius-sm)",color:"var(--text)",fontSize:11,outline:"none",fontFamily:"var(--font-ui)"}}/>
                  {/* Group pills */}
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",flex:1}}>
                    {[["all","All"],...allGroups.map(g=>[g,g])].map(([id,lbl])=>(
                      <button key={id} onClick={()=>setGroup(id)}
                        style={{fontSize:10,padding:"4px 10px",border:"none",borderRadius:6,cursor:"pointer",
                          fontFamily:"var(--font-ui)",fontWeight:600,
                          background:activeGroup===id?"var(--accent2)":"var(--bg3)",
                          color:activeGroup===id?"#fff":"var(--text4)"}}>
                        {lbl} <span style={{opacity:.6}}>({id==="all"?maps.length:maps.filter(m=>mapGroup(m.id)===id).length})</span>
                      </button>
                    ))}
                  </div>
                  {/* View toggle */}
                  <div style={{display:"flex",gap:2,background:"var(--bg3)",borderRadius:6,padding:2,border:"1px solid var(--border)",flexShrink:0}}>
                    {[["grid","⊞"],["list","☰"]].map(([v,icon])=>(
                      <button key={v} onClick={()=>setViewMode(v)}
                        style={{fontSize:14,padding:"3px 8px",border:"none",borderRadius:4,cursor:"pointer",
                          background:viewMode===v?"var(--accent2)":"transparent",
                          color:viewMode===v?"#fff":"var(--text4)"}}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Map meta editor modal ── */}
                {editingMeta&&(()=>{
                  const meta=getMapMeta(editingMeta);
                  return <div style={{position:"fixed",inset:0,zIndex:800,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center"}}
                    onClick={()=>setEditingMeta(null)}>
                    <div style={{background:"var(--bg)",borderRadius:12,padding:20,width:380,border:"none",boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))"}}
                      onClick={e=>e.stopPropagation()}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:14}}>Customize Map</div>
                      {/* Group input */}
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:10,color:"var(--text4)",marginBottom:4,fontWeight:700}}>GROUP</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                          {DEFAULT_GROUPS.map(g=>(
                            <button key={g} onClick={()=>{setMapMeta(editingMeta,{...meta,group:g});forceUpdate(n=>n+1);}}
                              style={{fontSize:10,padding:"3px 9px",border:`1px solid ${meta.group===g?"var(--accent2)":"var(--border)"}`,
                                borderRadius:6,cursor:"pointer",background:meta.group===g?"var(--accent2)":"var(--bg3)",
                                color:meta.group===g?"#fff":"var(--text3)",fontFamily:"var(--font-ui)"}}>
                              {g}
                            </button>
                          ))}
                        </div>
                        <input value={meta.group||""} onChange={e=>{setMapMeta(editingMeta,{...meta,group:e.target.value});forceUpdate(n=>n+1);}}
                          placeholder="Custom group name…"
                          style={{width:"100%",boxSizing:"border-box",padding:"6px 10px",background:"var(--bg3)",
                            border:"1px solid var(--border)",borderRadius:7,color:"var(--text)",fontSize:11,outline:"none"}}/>
                      </div>
                      {/* Icon picker */}
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:10,color:"var(--text4)",marginBottom:6,fontWeight:700}}>ICON</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {MAP_ICON_OPTIONS.map(ic=>(
                            <button key={ic} onClick={()=>{setMapMeta(editingMeta,{...meta,icon:ic});forceUpdate(n=>n+1);}}
                              style={{fontSize:18,padding:"4px 8px",border:`2px solid ${meta.icon===ic?"var(--accent2)":"var(--border)"}`,
                                borderRadius:7,cursor:"pointer",background:meta.icon===ic?"var(--accent2)22":"var(--bg3)"}}>
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Color picker */}
                      <div style={{marginBottom:16}}>
                        <div style={{fontSize:10,color:"var(--text4)",marginBottom:6,fontWeight:700}}>ACCENT COLOR</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {MAP_ACCENT_COLORS.map(col=>(
                            <button key={col} onClick={()=>{setMapMeta(editingMeta,{...meta,color:col});forceUpdate(n=>n+1);}}
                              style={{width:24,height:24,borderRadius:"50%",background:col,border:`2px solid ${meta.color===col?"white":"transparent"}`,
                                cursor:"pointer",boxShadow:meta.color===col?"0 0 0 2px "+col:"none"}}>
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={()=>setEditingMeta(null)}
                        style={{width:"100%",padding:"8px",background:"var(--accent2)",border:"none",borderRadius:8,
                          color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"var(--font-ui)",fontSize:12}}>
                        Done
                      </button>
                    </div>
                  </div>;
                })()}

                {/* ── Groups + Cards ── */}
                {grouped.map(({group,items})=>(
                  <div key={group} style={{marginBottom:28}}>
                    {group&&group!=="Ungrouped"&&<div style={{fontSize:10,fontWeight:700,color:"var(--text4)",
                      letterSpacing:2,marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                      <span style={{flex:1,height:1,background:"var(--border2)"}}/>
                      <span style={{padding:"2px 10px",background:"var(--bg3)",borderRadius:"var(--radius-btn)",border:"1px solid var(--border2)",letterSpacing:2}}>{group.toUpperCase()}</span>
                      <span style={{flex:1,height:1,background:"var(--border2)"}}/>
                    </div>}

                    {/* Grid view */}
                    {viewMode==="grid"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                      {items.map((map,idx)=>{
                        const accent=mapColor(map.id,maps.indexOf(map));
                        const icon=mapIcon(map.id);
                        return <div key={map.id}
                          className="nn-map-card" data-ui={`mapcard-${m.id}`} data-component="MapCard" data-page="dashboard" data-role="card"
                          data-tut={maps.indexOf(map)===0?"map-card":undefined}
                          onClick={()=>onOpenMap(map.id)}
                          onContextMenu={e=>{e.preventDefault();setMenuMap({id:map.id,title:map.title,x:e.clientX,y:e.clientY});}}
                          style={{background:"var(--bg2)",borderRadius:"var(--radius-lg)",
                            cursor:"pointer",position:"relative",overflow:"hidden",
                            transition:"var(--transition-all)","--ca":accent}}>
                          <div style={{padding:"11px 12px 10px"}}>
                            {/* Title row */}
                            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                              <span style={{fontSize:17,lineHeight:1,flexShrink:0}}>{icon}</span>
                              <div style={{fontSize:13,fontWeight:"var(--font-weight-ui,700)",color:"var(--text)",
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,letterSpacing:"var(--letter-space)"}}>{map.title}</div>
                              {/* Inline actions */}
                              <div className="nn-card-actions" style={{display:"flex",gap:1,flexShrink:0,opacity:0,transition:"opacity .15s"}}>
                                <button onClick={e=>{e.stopPropagation();setEditingMeta(map.id);}}
                                  style={{fontSize:11,background:"none",border:"none",color:"var(--text3)",cursor:"pointer",padding:"3px 5px",borderRadius:"var(--radius-xs)"}}
                                  title="Customize">✎</button>
                                <button onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setMenuMap({id:map.id,title:map.title,x:r.right-170,y:r.bottom+4});}}
                                  style={{fontSize:14,background:"none",border:"none",color:"var(--text3)",cursor:"pointer",padding:"3px 4px",borderRadius:"var(--radius-xs)"}}
                                  title="Options">⋮</button>
                              </div>
                            </div>
                            {map.description&&<div style={{fontSize:10,color:"var(--text4)",marginBottom:6,
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"var(--letter-space)"}}>{map.description}</div>}
                            {/* Footer row */}
                            <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginTop:4}}>
                              <span style={{fontSize:10,fontWeight:600,color:"var(--ca)",background:"var(--ca)18",
                                padding:"1px 7px",borderRadius:"var(--radius-xs)",letterSpacing:"var(--letter-space)"}}>{map.node_count||0} nodes</span>
                              {map.permission&&map.owner_id!==user?.id&&(
                                <span style={{fontSize:9,color:"var(--accent)",background:"var(--accent)18",padding:"1px 6px",borderRadius:"var(--radius-xs)",fontWeight:600}}>👁</span>
                              )}
                              {(map.owner_id===user?.id||!map.permission)&&map.collab_count>0&&(
                                <span style={{fontSize:9,color:"var(--text3)",background:"var(--bg3)",padding:"1px 6px",borderRadius:"var(--radius-xs)",fontWeight:600}}>
                                  👥 {map.collab_count}
                                </span>
                              )}
                              {map.is_public&&<span style={{fontSize:9,color:"var(--success)",background:"var(--success)18",padding:"1px 6px",borderRadius:"var(--radius-xs)"}}>public</span>}
                              <span style={{marginLeft:"auto",fontSize:9,color:"var(--text4)"}}>{new Date(map.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>;
                      })}
                    </div>}

                    {/* List view */}
                    {viewMode==="list"&&<div style={{display:"flex",flexDirection:"column",gap:3}}>
                      {items.map((map,idx)=>{
                        const accent=mapColor(map.id,maps.indexOf(map));
                        const icon=mapIcon(map.id);
                        return <div key={map.id}
                          className="nn-map-list-row" data-ui={`maprow-${m.id}`} data-component="MapListRow" data-page="dashboard" data-role="list-item"
                          onClick={()=>onOpenMap(map.id)}
                          onContextMenu={e=>{e.preventDefault();setMenuMap({id:map.id,title:map.title,x:e.clientX,y:e.clientY});}}
                          style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                            background:"var(--bg2)",borderRadius:"var(--radius-sm)",cursor:"pointer",
                            borderLeft:`3px solid ${accent}`,transition:"var(--transition-all)","--ca":accent}}>
                          <span style={{fontSize:15,flexShrink:0}}>{icon}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:"var(--font-weight-ui,600)",color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{map.title}</div>
                            {map.description&&<div style={{fontSize:10,color:"var(--text4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{map.description}</div>}
                          </div>
                          <span style={{fontSize:10,color:"var(--ca)",fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{map.node_count||0} nodes</span>
                          {map.collab_count>0?<span style={{fontSize:9,color:"var(--text3)",flexShrink:0}}>👥 {map.collab_count}</span>:<span/>}
                          {map.is_public?<span style={{fontSize:9,color:"var(--success)"}}>public</span>:<span/>}
                          <span style={{fontSize:10,color:"var(--text4)",whiteSpace:"nowrap"}}>{new Date(map.updated_at).toLocaleDateString()}</span>
                          <div style={{display:"flex",gap:2,justifyContent:"flex-end"}}>
                            <button onClick={e=>{e.stopPropagation();setEditingMeta(map.id);}}
                              style={{fontSize:11,background:"none",border:"none",color:"var(--text4)",cursor:"pointer",padding:"2px 5px"}}
                              title="Customize">✎</button>
                            <button onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setMenuMap({id:map.id,title:map.title,x:r.right-170,y:r.bottom+4});}}
                              style={{fontSize:14,background:"none",border:"none",color:"var(--text4)",cursor:"pointer",padding:"2px 4px"}}
                              title="Options">⋮</button>
                          </div>
                        </div>;
                      })}
                    </div>}
                  </div>
                ))}
                {filtered.length===0&&<div style={{textAlign:"center",padding:"50px 0",color:"var(--text4)",fontSize:13}}>
                  No maps match your search.
                </div>}
              </>;
            })()}
          </>
        )}
      </div>
    </div>
  {shareMap && <ShareModal map={shareMap} onClose={()=>setShareMap(null)}/>}
</>
  );
}