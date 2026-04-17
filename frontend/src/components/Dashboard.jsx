import React from 'react';
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMaps, createMap, deleteMap, apiFetch } from "../api/client.js";

const RC = { owner:"#FFD93D", admin:"#f78166", editor:"var(--accent)", viewer:"var(--text3)" };

export default function Dashboard({ onOpenMap, onOpenAdmin, onShowThemes }) {
  const [showChangelog, setShowChangelog] = React.useState(false);
  const [menuMap,   setMenuMap]   = useState(null);  // {id, title, x, y} for context menu
  const [renaming,  setRenaming]  = useState(null);  // {id, title}
  const { user } = useAuth();
  const [maps, setMaps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle]= useState("");
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating]= useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    getMaps().then(d=>setMaps(d.maps)).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const d = await createMap({ title:newTitle.trim() });
      setMaps(m=>[d.map,...m]);
      setNewTitle(""); setShowNew(false);
      onOpenMap(d.map.id);
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  };

  const handleRename = async (id, title) => {
    try {
      await apiFetch(`/maps/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title })
      });
      setMaps(m => m.map(x => x.id===id ? {...x,title} : x));
    } catch {}
    setRenaming(null);
  };

  const handleDuplicate = async (map) => {
    try {
      const r = await apiFetch(`/maps/${map.id}/duplicate`, { method: "POST" });
      if (r.ok) { const d = await r.json(); setMaps(m=>[d.map,...m]); }
    } catch {}
  };

  const handleImportFile = (e) => {
    const f = e.target.files?.[0]; if(!f) return;
    const r = new FileReader();
    r.onload = async ev => {
      try {
        const b = JSON.parse(ev.target.result);
        if (b.app === "NoNote" && b.nodes) {
          // Create map then populate it
          const d = await createMap({ title: b.title||f.name.replace(/\.nonote$/,"") });
          if (d.map?.id) {
            await fetch(`/api/maps/${d.map.id}/save`, {
              method: "POST",
              headers: { "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem('nn_token')}` },
              body: JSON.stringify({ nodes: b.nodes, edges: b.edges||[] })
            });
            onOpenMap(d.map.id);
          }
        } else { alert("Not a valid .nonote file"); }
      } catch(err) { alert("Could not read file: "+err.message); }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this map? This cannot be undone.")) return;
    await deleteMap(id).catch(()=>{});
    setMaps(m=>m.filter(x=>x.id!==id));
  };

  return (
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
            v5.5 ✦ What's new
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
                {[
                  {v:"v5.5",date:"Apr 2026",items:[
                    "Share map: invite team members with Viewer/Editor permissions",
                    "Real-time collaboration: 🟢 Collab toggle — changes sync instantly across users",
                    "Inline formatting toolbar: Bold, Italic, Underline, Strikethrough, HR on note edit",
                    "Changelog now shown on home page (this modal)",
                    "Arrow fix: markerEnd arrowhead always flush with destination node edge",
                  ]},
                  {v:"v5.3–5.4",date:"Apr 2026",items:[
                    "Compact sidebar redesigned: 136px, categories preserved, search works in all modes",
                    "Icon grid uses CSS auto-fill — no trailing gaps in last row",
                    "Arrow endpoint pull corrected for both forward and bidirectional arrows",
                    "Description shown only once (removed duplicate from node body)",
                  ]},
                  {v:"v5.1–5.2",date:"Apr 2026",items:[
                    "Note content inline editable on canvas (✎ pencil, textarea inline)",
                    "Bidirectional arrow endpoints pull BOTH ends (PULL=14px) to clear node borders",
                    "Node header redesign: title + description in header, type label at right-bottom",
                    "Comment 💬 and Collapse ⊟ in one row, no overlap",
                    "Compact sidebar cycling fixed (onCycleMode prop pattern)",
                  ]},
                  {v:"v5.0",date:"Apr 2026",items:[
                    "Bidirectional arrows correctly show both arrowheads (auto-start-reverse)",
                    "Inline text editing: pencil icon on title and description (F2 to rename)",
                    "Keyboard shortcuts: E opens node popup, N adds note, F2 renames",
                    "Export/Import .nonote bundle format",
                    "Focus mode activates on node click",
                    "Changelog maintained automatically in every version",
                  ]},
                  {v:"v4.46–4.47",date:"Apr 2026",items:[
                    "Recursive subtree auto-layout (no overlapping nodes)",
                    "5 layout directions: L→R, T→B, R→L, B→T, Radial",
                    "Popup closes on canvas click",
                  ]},
                  {v:"v4.0–4.45",date:"2025–2026",items:[
                    "Full-stack: Node.js + PostgreSQL + Redis + Docker",
                    "60+ node types, 15 connection styles, AABB collision prevention",
                    "Version history, LLM export, AI Chat, custom themes, PNG export",
                    "Multi-note per node, rich text editor, sensitive data toggle",
                    "Smart edge router, anchor system, endpoint drag handles",
                  ]},
                ].map(({v,date,items})=>(
                  <div key={v} style={{marginBottom:18}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--accent)"}}>{v}</span>
                      <span style={{fontSize:10,color:"var(--text4)"}}>{date}</span>
                    </div>
                    {items.map((item,i)=>(
                      <div key={i} style={{display:"flex",gap:6,marginBottom:4,fontSize:11,color:"var(--text2)"}}>
                        <span style={{color:"var(--accent)",flexShrink:0}}>•</span>
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
                    {icon:"↙",label:"Export .nonote",action:()=>{
                      apiFetch(`/maps/${menuMap.id}`)
                        .then(r=>r.json()).then(d=>{
                          const b={version:1,app:"NoNote",title:d.map?.title||menuMap.title,exported:new Date().toISOString(),nodes:d.map?.nodes||[],edges:d.map?.edges||[]};
                          const a=document.createElement("a");
                          a.href=URL.createObjectURL(new Blob([JSON.stringify(b,null,2)],{type:"application/json"}));
                          a.download=`${(menuMap.title||"map").replace(/[^a-z0-9]/gi,"-")}.nonote`;
                          a.click();
                        });
                      setMenuMap(null);
                    }},
                    {icon:"👥",label:"Share / Collaborate",action:()=>{
                      window._shareMapId=menuMap.id;
                      // Open the map then trigger share dialog
                      onOpenMap(menuMap.id);
                      setMenuMap(null);
                    }},
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
}
