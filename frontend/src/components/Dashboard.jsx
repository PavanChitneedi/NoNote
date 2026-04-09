import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMaps, createMap, deleteMap } from "../api/client.js";

const RC = { owner:"#FFD93D", admin:"#f78166", editor:"var(--accent)", viewer:"var(--text3)" };

export default function Dashboard({ onOpenMap, onOpenAdmin, onShowThemes }) {
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
        <div style={{ marginBottom:26 }}>
          <div style={{ fontSize:22, fontWeight:700, color:"var(--text)", marginBottom:5 }}>Your Maps</div>
          <div style={{ fontSize:12, color:"var(--text4)" }}>
            {user?.display_name} ·{" "}
            <span style={{ color:RC[user?.role]||"var(--text3)" }}>{user?.role}</span>
          </div>
        </div>

        {error && (
          <div style={{ background:"var(--danger)18", border:`1px solid var(--danger)40`, borderRadius:8, padding:"10px 14px", fontSize:12, color:"var(--danger)", marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* New map */}
        {["owner","admin","editor"].includes(user?.role) && (
          showNew ? (
            <form onSubmit={handleCreate} style={{ display:"flex", gap:8, marginBottom:20 }}>
              <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Map title…"
                style={{ flex:1, background:"var(--bg2)", border:`1px solid var(--accent)`, borderRadius:8, padding:"10px 14px", color:"var(--text)", fontSize:13, outline:"none" }}
              />
              <button type="submit" disabled={creating} style={{ padding:"10px 18px", background:"var(--accent2)", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {creating?"…":"CREATE"}
              </button>
              <button type="button" onClick={()=>setShowNew(false)} style={{ padding:"10px 14px", background:"var(--bg3)", border:"none", borderRadius:8, color:"var(--text3)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                CANCEL
              </button>
            </form>
          ) : (
            <button onClick={()=>setShowNew(true)} style={{ padding:"10px 20px", background:"var(--accent2)", border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", marginBottom:20, fontFamily:"inherit" }}>
              ＋ NEW MAP
            </button>
          )
        )}

        {/* Map grid */}
        {loading ? (
          <div style={{ textAlign:"center", color:"var(--text4)", fontSize:13, padding:50 }}>Loading maps…</div>
        ) : maps.length===0 ? (
          <div style={{ textAlign:"center", padding:"70px 20px", color:"var(--text4)", fontSize:13, lineHeight:2 }}>
            <div style={{ fontSize:36, marginBottom:14 }}>⬡</div>
            No maps yet. Create your first one.
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
            {maps.map(map=>(
              <div key={map.id}
                onClick={()=>onOpenMap(map.id)}
                style={{ background:"var(--bg2)", border:`1px solid var(--border2)`, borderRadius:12, padding:18, cursor:"pointer", transition:"all .15s", position:"relative" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.transform="translateY(0)";}}
              >
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:20 }}>
                  {map.title}
                </div>
                {map.description && (
                  <div style={{ fontSize:11, color:"var(--text3)", marginBottom:7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {map.description}
                  </div>
                )}
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:"var(--text4)" }}>{map.node_count||0} nodes</span>
                  {map.permission && (
                    <span style={{ fontSize:10, color:RC[map.permission]||"var(--text3)", background:`${RC[map.permission]||"#888"}18`, padding:"1px 7px", borderRadius:4 }}>
                      {map.permission}
                    </span>
                  )}
                  {map.is_public && (
                    <span style={{ fontSize:10, color:"var(--success)", background:"var(--success)18", padding:"1px 7px", borderRadius:4 }}>public</span>
                  )}
                </div>
                <div style={{ marginTop:10, fontSize:10, color:"var(--text4)" }}>
                  Updated {new Date(map.updated_at).toLocaleDateString()}
                </div>
                {/* Delete */}
                <button onClick={e=>handleDelete(map.id,e)}
                  style={{ position:"absolute", top:12, right:12, background:"none", border:"none", color:"var(--text4)", cursor:"pointer", fontSize:18, lineHeight:1, padding:"0 2px" }}
                  onMouseEnter={e=>e.currentTarget.style.color="var(--danger)"}
                  onMouseLeave={e=>e.currentTarget.style.color="var(--text4)"}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
