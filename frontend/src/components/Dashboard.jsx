import React from 'react';
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMaps, createMap, deleteMap, apiFetch, saveMap, getAccessToken } from "../api/client.js";
import { CHANGELOG } from "../changelog.js";

const RC = { owner:"#FFD93D", admin:"#f78166", editor:"var(--accent)", viewer:"var(--text3)" };

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
        width:"min(460px,94vw)",boxShadow:"0 24px 64px rgba(0,0,0,.7)",padding:26,
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
              boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}>
              {search.map(u=>(
                <div key={u.id} onClick={()=>addUser(u.id)} style={{padding:"9px 12px",cursor:"pointer",
                  fontSize:12,color:"var(--text2)"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
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

export default function Dashboard({ onOpenMap, onOpenAdmin, onShowThemes }) {
  const [showChangelog, setShowChangelog] = useState(false);
  const [menuMap,   setMenuMap]   = useState(null);
  const [renaming,  setRenaming]  = useState(null);
  const [shareMap,  setShareMap]  = useState(null); // map object for inline share modal
  const { user, logout } = useAuth();
  const [maps, setMaps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle]= useState("");
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating]= useState(false);
  const [error, setError]     = useState("");
  // Title conflict dialog
  const [conflict, setConflict] = useState(null); // {title, resolve}

  useEffect(() => {
    getMaps().then(d=>setMaps(d.maps)).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, []);

  // Unique title helper — shows conflict UI if name taken
  const createWithUnique = (title, nodes, edges) => new Promise((resolve, reject) => {
    const existing = maps.find(m => m.title.toLowerCase() === title.toLowerCase());
    if (existing) {
      setConflict({ title, existing, resolve: (action) => {
        setConflict(null);
        resolve(action); // "overwrite" | "rename:{newTitle}" | "cancel"
      }});
    } else {
      resolve("create");
    }
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    const title = newTitle.trim(); if (!title) return;
    setCreating(true); setError("");
    try {
      const action = await createWithUnique(title, [], []);
      if (action === "cancel") { setCreating(false); return; }
      const finalTitle = action.startsWith("rename:") ? action.slice(7) : title;
      if (action === "overwrite") {
        const ex = maps.find(m=>m.title.toLowerCase()===title.toLowerCase());
        if (ex) { await apiFetch(`/maps/${ex.id}`,{method:"PATCH",body:JSON.stringify({title:finalTitle})}); }
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
    } catch(e) { alert("Duplicate failed: "+e.message); }
  };

  const handleExportNoNote = async (map) => {
    try {
      const d = await apiFetch(`/maps/${map.id}`);
      // apiFetch already returns parsed JSON
      const data = d.map || d;
      const bundle = {
        version:1, app:"NoNote",
        title: data.title || map.title,
        exported: new Date().toISOString(),
        nodes: d.nodes || [],
        edges: d.edges || [],
      };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"}));
      a.download = `${(map.title||"map").replace(/[^a-z0-9]/gi,"-")}.nonote`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch(e) { alert("Export failed: "+e.message); }
  };

  const handleImportFile = (e) => {
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const b = JSON.parse(ev.target.result);
        if (!(b.app==="NoNote" && Array.isArray(b.nodes)))
          return alert("Not a valid .nonote file");

        const title = b.title || f.name.replace(/\.nonote$/,"") || "Imported Map";
        const nodes = b.nodes.map(n=>({...n, notes:Array.isArray(n.notes)?n.notes:[]}));
        const edges = b.edges || [];

        // Check for title conflict
        const existing = maps.find(m=>m.title.toLowerCase()===title.toLowerCase());
        if (existing) {
          setConflict({ title, existing, resolve: async (action) => {
            setConflict(null);
            if (action==="cancel") return;
            if (action==="overwrite") {
              // Overwrite existing map's data
              await saveMap(existing.id, { nodes, edges, groupBoxes:[] });
              alert(`Map "${title}" overwritten with imported data.`);
              setMaps(m=>m.map(x=>x.id===existing.id?{...x,title}:x));
            } else {
              // Rename: action = "rename:NewTitle"
              const finalTitle = action.startsWith("rename:") ? action.slice(7) : title+" (imported)";
              const d = await createMap({ title:finalTitle });
              await saveMap(d.map.id, { nodes, edges, groupBoxes:[] });
              setMaps(m=>[{...d.map,title:finalTitle},...m]);
              alert(`Imported as "${finalTitle}". Map is saved to your dashboard.`);
            }
          }});
          return;
        }

        // No conflict — create and save
        const d = await createMap({ title });
        if (!d.map?.id) throw new Error("Failed to create map");
        await saveMap(d.map.id, { nodes, edges, groupBoxes:[] });
        setMaps(m=>[{...d.map,title},...m]);
        alert(`"${title}" imported successfully (${nodes.length} nodes). Click to open.`);
      } catch(err) { alert("Import failed: "+err.message); }
    };
    reader.readAsText(f);
    e.target.value="";
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation?.();
    if (!confirm("Delete this map? This cannot be undone.")) return;
    await deleteMap(id).catch(()=>{});
    setMaps(m=>m.filter(x=>x.id!==id));
  };
  return (
    <>
    <div style={{ minHeight:"calc(100vh - 50px)", background:"var(--bg)", padding:"28px 20px" }}>
      <div style={{ maxWidth:920, margin:"0 auto" }}>

        {/* Welcome */}
        <div style={{ marginBottom:26, display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:700, color:"var(--text)", marginBottom:5 }}>Your Maps</div>
            <div style={{ fontSize:12, color:"var(--text4)" }}>
              {user?.display_name} ·{" "}
              <span style={{ color:RC[user?.role]||"var(--text3)" }}>{user?.role}</span>
            </div>
          </div>
          <button onClick={()=>setShowChangelog(true)}
            style={{ background:"none", border:"1px solid var(--accent)", borderRadius:8,
              padding:"6px 14px", color:"var(--accent)", fontSize:11, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
            v5.24.0 ✦ What's new
          </button>
        </div>

        {/* ── Changelog Modal ── */}
        {showChangelog&&(
          <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center"}}
            onClick={()=>setShowChangelog(false)}>
            <div style={{background:"var(--bg2)",border:"1.5px solid var(--accent)",borderRadius:12,
              boxShadow:"0 24px 64px rgba(0,0,0,.7)",width:540,maxWidth:"94vw",maxHeight:"80vh",
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

        {/* ── Action bar ── */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
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
        </div>

        {/* Map grid */}
        {loading ? (
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
                <div style={{background:"var(--bg2)",borderRadius:10,padding:20,minWidth:340,boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}
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
                  border:"1px solid var(--border2)",borderRadius:9,boxShadow:"0 8px 28px rgba(0,0,0,.5)",
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
                      onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{width:16,textAlign:"center",opacity:.7}}>{icon}</span>{label}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              {maps.map(map=>(
                <div key={map.id}
                  data-tut={maps.indexOf(map)===0?"map-card":undefined}
                  onClick={()=>onOpenMap(map.id)}
                  onContextMenu={e=>{e.preventDefault();setMenuMap({id:map.id,title:map.title,x:e.clientX,y:e.clientY});}}
                  style={{ background:"var(--bg2)", border:`1px solid var(--border2)`, borderRadius:12, padding:18, cursor:"pointer", transition:"all .15s", position:"relative" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.transform="translateY(0)";}}
                >
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:28 }}>
                    {map.title}
                  </div>
                  {map.description&&<div style={{ fontSize:11, color:"var(--text3)", marginBottom:7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{map.description}</div>}
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, color:"var(--text4)" }}>{map.node_count||0} nodes</span>
                    {/* Shared-to-me badge */}
                    {map.permission&&map.owner_id!==user?.id&&(
                      <span style={{fontSize:9,color:"var(--accent)",background:"var(--accent)15",
                        padding:"1px 6px",borderRadius:4,border:"1px solid var(--accent)30",fontWeight:600}}>
                        👁 {map.permission} · {map.owner_name?"by "+map.owner_name:"shared"}
                      </span>
                    )}
                    {/* Owner with collaborators */}
                    {(map.owner_id===user?.id||!map.permission)&&(map.collab_count>0)&&(
                      <span style={{fontSize:9,color:"#4d9be6",background:"#1565C018",
                        padding:"1px 6px",borderRadius:4,border:"1px solid #1565C030",fontWeight:600}}>
                        👥 Shared · {map.collab_count}
                      </span>
                    )}
                    {map.is_public&&<span style={{ fontSize:10, color:"var(--success)", background:"var(--success)18", padding:"1px 7px", borderRadius:4 }}>public</span>}
                  </div>
                  <div style={{ marginTop:8, fontSize:10, color:"var(--text4)" }}>Updated {new Date(map.updated_at).toLocaleDateString()}</div>
                  {/* ⋮ options button */}
                  <button
                    onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setMenuMap({id:map.id,title:map.title,x:r.right-170,y:r.bottom+4});}}
                    style={{ position:"absolute", top:10, right:10, background:"none", border:"1px solid transparent", borderRadius:6, color:"var(--text4)", cursor:"pointer", fontSize:16, lineHeight:1, padding:"2px 6px", transition:"all .12s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color="var(--text4)";}}
                    title="Map options">⋮</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
  {/* ── Changelog Modal ── */}
  {showChangelog&&(
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.7)",
      display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={()=>setShowChangelog(false)}>
      <div style={{background:"var(--bg2)",border:"1.5px solid var(--accent)",
        borderRadius:"var(--radius-lg)",boxShadow:"0 24px 64px rgba(0,0,0,.7)",
        width:560,maxWidth:"94vw",maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 22px 14px",borderBottom:"1px solid var(--border2)",
          display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:15,fontWeight:700,color:"var(--accent)",flex:1}}>⬡ NoNote — What's New</span>
          <button onClick={()=>setShowChangelog(false)}
            style={{background:"none",border:"none",fontSize:22,color:"var(--text4)",cursor:"pointer"}}>×</button>
        </div>
        <div style={{overflowY:"auto",padding:"14px 22px 20px"}}>
          {CHANGELOG.slice(0,6).map(entry=>(
            <div key={entry.v} style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontWeight:700,color:"var(--accent)",fontSize:13}}>{entry.v}</span>
                <span style={{fontSize:10,color:"var(--text4)"}}>{entry.date}</span>
              </div>
              <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:4}}>
                {entry.items.map((item,i)=>(
                  <li key={i} style={{fontSize:12,color:"var(--text3)",display:"flex",gap:8,lineHeight:1.5}}>
                    <span style={{color:"var(--accent)",flexShrink:0}}>✦</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Inline Share Modal */}
  {shareMap && <ShareModal map={shareMap} onClose={()=>setShareMap(null)}/>}
  {/* Conflict Dialog */}
  {conflict && <ConflictDialog conflict={conflict}/>}
</>
  );
}
{/* ── Inline Share Modal ── */}
  {shareMap && <ShareModal map={shareMap} onClose={()=>setShareMap(null)}/>}

  {/* ── Title Conflict Dialog ── */}
  {conflict && <ConflictDialog conflict={conflict}/>}

function ConflictDialog({ conflict }) {
  const [newName, setNewName] = React.useState(conflict.title + " (copy)");
  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.72)",
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:14,
        width:"min(420px,94vw)",padding:26,boxShadow:"0 24px 64px rgba(0,0,0,.7)",
        display:"flex",flexDirection:"column",gap:16}}>
        <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>Name Conflict</div>
        <div style={{fontSize:13,color:"var(--text3)",lineHeight:1.6}}>
          A map named <strong style={{color:"var(--text)"}}>{conflict.title}</strong> already exists.
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1.5,marginBottom:6}}>RENAME</div>
          <input value={newName} onChange={e=>setNewName(e.target.value)}
            style={{width:"100%",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,
              padding:"9px 12px",color:"var(--text)",fontSize:13,fontFamily:"inherit",
              outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>conflict.resolve("cancel")}
            style={{padding:"9px 14px",background:"var(--bg3)",border:"none",borderRadius:8,
              color:"var(--text3)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>Cancel</button>
          <button onClick={()=>conflict.resolve("rename:"+(newName.trim()||conflict.title+" (copy)"))}
            style={{flex:1,padding:"9px 14px",background:"var(--accent2)",border:"none",borderRadius:8,
              color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>Save as new name</button>
          <button onClick={()=>conflict.resolve("overwrite")}
            style={{padding:"9px 14px",background:"var(--danger)22",border:"1px solid var(--danger)50",
              borderRadius:8,color:"var(--danger)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>Overwrite</button>
        </div>
      </div>
    </div>
  );
}
