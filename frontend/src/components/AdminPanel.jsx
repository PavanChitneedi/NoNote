import { useState, useEffect } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const RC = { owner:"#FFD93D", admin:"#f78166", editor:"var(--accent)", viewer:"var(--text3)", restricted:"#888" };
const GC = ["#6C63FF","#E91E63","#2196F3","#4CAF50","#FF9800","#9C27B0","#00BCD4","#F44336","#FF5722","#607D8B"];
const AVATAR_COLORS = ["#6C63FF","#E91E63","#2196F3","#4CAF50","#FF9800","#9C27B0","#00BCD4","#F44336","#FF5722","#607D8B","#3F51B5","#009688"];

const ALL_PERMS = [
  {key:"maps.create",   label:"Create maps",             cat:"Maps"},
  {key:"maps.edit",     label:"Edit maps",                cat:"Maps"},
  {key:"maps.delete",   label:"Delete maps",              cat:"Maps"},
  {key:"maps.share",    label:"Share & collaborate",      cat:"Maps"},
  {key:"maps.view",     label:"View shared maps",         cat:"Maps"},
  {key:"llm.use",       label:"AI / LLM features",        cat:"Features"},
  {key:"export.use",    label:"Export maps",              cat:"Features"},
  {key:"collab.use",    label:"Real-time collaboration",  cat:"Features"},
  {key:"admin.panel",   label:"Access admin panel",       cat:"Admin"},
  {key:"users.view",    label:"View all users",           cat:"Admin"},
  {key:"users.create",  label:"Create users",             cat:"Admin"},
  {key:"users.edit",    label:"Edit users",               cat:"Admin"},
  {key:"users.delete",  label:"Delete users",             cat:"Admin"},
  {key:"groups.manage", label:"Manage groups",            cat:"Admin"},
  {key:"settings.edit", label:"Edit global settings",     cat:"Admin"},
  {key:"logs.view",     label:"View system logs",         cat:"Admin"},
];

const ROLE_PERMS = {
  owner: ["*"],
  admin: ALL_PERMS.filter(p=>p.cat==="Admin"||["maps.create","maps.edit","maps.delete","maps.share","maps.view","llm.use","export.use","collab.use"].includes(p.key)).map(p=>p.key),
  editor: ["maps.create","maps.edit","maps.delete","maps.share","maps.view","llm.use","export.use","collab.use"],
  viewer: ["maps.view"],
  restricted: [],
};

const GLOBAL_SETTINGS = [
  {key:"allow_username_change",    label:"Users can change display name",      type:"bool", cat:"Self-Service"},
  {key:"allow_email_change",       label:"Users can change email address",     type:"bool", cat:"Self-Service"},
  {key:"allow_password_change",    label:"Users can change password",          type:"bool", cat:"Self-Service"},
  {key:"allow_avatar_change",      label:"Users can change avatar color",      type:"bool", cat:"Self-Service"},
  {key:"registration_enabled",     label:"Allow new user self-registration",   type:"bool", cat:"Access"},
  {key:"allow_llm_for_viewers",    label:"Viewers can use AI/LLM features",   type:"bool", cat:"Features"},
  {key:"allow_export_for_viewers", label:"Viewers can export maps",            type:"bool", cat:"Features"},
  {key:"max_maps_per_user",        label:"Max maps per user (0 = unlimited)",  type:"num",  cat:"Limits"},
  {key:"session_timeout_hours",    label:"Session timeout in hours",           type:"num",  cat:"Security"},
  {key:"log_retention_days",       label:"Log retention in days",              type:"num",  cat:"Logs"},
];

// ── Style helpers ────────────────────────────────────────────────────────
const inp = {width:"100%",background:"var(--bg)",borderRadius:8,
  padding:"9px 12px",color:"var(--text)",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
const btn = (primary, danger) => ({
  padding:"8px 16px",border:"none",borderRadius:8,cursor:"pointer",fontSize:11,
  fontWeight:700,fontFamily:"inherit",
  background: danger ? "var(--danger)18" : primary ? "var(--accent2)" : "var(--bg3)",
  color:       danger ? "var(--danger)"   : primary ? "#fff"          : "var(--text3)",
});

function Alert({color,children}){
  return <div style={{background:`${color}18`,borderRadius:8,
    padding:"9px 14px",fontSize:12,color,lineHeight:1.5,marginBottom:12}}>{children}</div>;
}
function Tab({label,active,onClick,badge}){
  return(
    <button onClick={onClick} style={{padding:"8px 14px",background:"none",border:"none",
      borderBottom:`2px solid ${active?"var(--accent)":"transparent"}`,
      color:active?"var(--accent)":"var(--text4)",cursor:"pointer",fontSize:11,
      fontWeight:700,letterSpacing:.5,fontFamily:"inherit",whiteSpace:"nowrap",
      display:"flex",alignItems:"center",gap:5}}>
      {label}
      {badge!==undefined&&badge>0&&<span style={{background:"var(--accent2)",color:"#fff",
        borderRadius:10,fontSize:9,padding:"1px 5px",lineHeight:1.5}}>{badge}</span>}
    </button>
  );
}

// ── Edit User Modal ──────────────────────────────────────────────────────
function EditUserModal({user:u, allGroups, me, onSave, onClose}){
  const [name,  setName]  = useState(u.display_name);
  const [email, setEmail] = useState(u.email);
  const [role,  setRole]  = useState(u.role);
  const [active,setActive]= useState(u.is_active);
  const [color, setColor] = useState(u.avatar_color||"#6C63FF");
  const [pw,    setPw]    = useState("");
  const [myGroups, setMyGroups] = useState(new Set((u.groups||[]).map(g=>g.id)));
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const payload = {display_name:name,email,role,is_active:active,avatar_color:color};
      if(pw) payload.password=pw;
      const d = await apiFetch(`/users/${u.id}`,{method:"PATCH",body:JSON.stringify(payload)});
      // Sync group memberships
      const orig = new Set((u.groups||[]).map(g=>g.id));
      await Promise.all([
        ...[...myGroups].filter(id=>!orig.has(id)).map(gid=>
          apiFetch(`/users/groups/${gid}/members`,{method:"POST",body:JSON.stringify({user_ids:[u.id]})})),
        ...[...orig].filter(id=>!myGroups.has(id)).map(gid=>
          apiFetch(`/users/groups/${gid}/members/${u.id}`,{method:"DELETE"})),
      ]);
      onSave({...d.user, groups:[...myGroups].map(id=>allGroups.find(g=>g.id===id)).filter(Boolean)});
    } catch(e){ setErr(e.message); }
    setSaving(false);
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.72)",
      display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div data-ui="admin-panel" data-component="AdminPanel" data-page="admin" data-role="modal"
        onClick={e=>e.stopPropagation()} style={{background:"var(--bg2)",
        borderRadius:14,width:"min(540px,94vw)",
        maxHeight:"88vh",overflow:"auto",boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
        padding:26,display:"flex",flexDirection:"column",gap:16}}>

        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:color,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,fontWeight:700,color:"#fff",flexShrink:0}}>
            {name?.[0]?.toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Edit User</div>
            <div style={{fontSize:11,color:"var(--text4)"}}>{u.email}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",
            fontSize:22,color:"var(--text4)",cursor:"pointer"}}>×</button>
        </div>

        {err && <Alert color="var(--danger)">{err}</Alert>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {/* eslint-disable react/jsx-key -- [label, element] data tuples consumed via
              destructuring below, not rendered as JSX list siblings directly */}
          {[
            ["DISPLAY NAME", <input value={name} onChange={e=>setName(e.target.value)} style={inp}/>],
            ["EMAIL ADDRESS", <input value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>],
            ["ROLE", <select value={role} onChange={e=>setRole(e.target.value)} style={inp}>
              {me?.role==="owner"&&<option value="owner">Owner</option>}
              {me?.role==="owner"&&<option value="admin">Admin</option>}
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
              <option value="restricted">Restricted</option>
            </select>],
            ["STATUS", <select value={active?"active":"disabled"} onChange={e=>setActive(e.target.value==="active")} style={inp}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>],
          /* eslint-enable react/jsx-key */
          ].map(([label,el])=>(
            <div key={label}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1.5,marginBottom:4}}>{label}</div>
              {el}
            </div>
          ))}
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1.5,marginBottom:4}}>NEW PASSWORD <span style={{color:"var(--text4)",fontWeight:400}}>(leave blank to keep current)</span></div>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Min 8 characters" style={inp}/>
          </div>
        </div>

        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1.5,marginBottom:8}}>AVATAR COLOR</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {AVATAR_COLORS.map(c=>(
              <div key={c} onClick={()=>setColor(c)} style={{width:26,height:26,borderRadius:"50%",
                background:c,cursor:"pointer",border:`3px solid ${color===c?"#fff":"transparent"}`,
                boxShadow:color===c?"0 0 0 2px var(--accent)":"none"}}/>
            ))}
          </div>
        </div>

        {allGroups.length>0&&(
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1.5,marginBottom:8}}>GROUP MEMBERSHIPS</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {allGroups.map(g=>{
                const on=myGroups.has(g.id);
                return(
                  <div key={g.id} onClick={()=>setMyGroups(prev=>{
                    const s=new Set(prev); on?s.delete(g.id):s.add(g.id); return s;
                  })} style={{padding:"5px 14px",borderRadius:20,cursor:"pointer",fontSize:11,
                    fontWeight:700,border:`2px solid ${on?g.color:"var(--border)"}`,
                    background:on?`${g.color}22`:"transparent",
                    color:on?g.color:"var(--text4)",transition:"all .12s",userSelect:"none"}}>
                    {g.name}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button onClick={save} disabled={saving} style={{...btn(true),flex:1}}>
            {saving?"Saving…":"Save Changes"}
          </button>
          <button onClick={onClose} style={btn(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminPanel ──────────────────────────────────────────────────────
export default function AdminPanel({ onBack }) {
  const {user:me} = useAuth();
  const [tab,    setTab]    = useState("users");
  const [users,  setUsers]  = useState([]);
  const [groups, setGroups] = useState([]);
  const [logs,   setLogs]   = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loading,setLoading]= useState(false);
  const [error,  setError]  = useState("");
  const [success,setSuccess]= useState("");
  const [search, setSearch] = useState("");
  const [editUser,setEditUser]=useState(null);

  // Create user
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({email:"",display_name:"",password:"",role:"editor"});
  const [creating, setCreating] = useState(false);

  // Create group
  const [showCG, setShowCG] = useState(false);
  const [gForm,  setGForm]  = useState({name:"",description:"",color:"#6C63FF",permissions:{}});
  const [creatingG, setCreatingG] = useState(false);

  // Settings
  const [localSet, setLocalSet] = useState({});
  const [savingSet, setSavingSet] = useState(false);

  // Logs
  const [logLevel, setLogLevel] = useState("all");
  const [logRetInput, setLogRetInput] = useState("7");

  const clrMsg = () => { setError(""); setSuccess(""); };

  // Fetch data per tab
  useEffect(()=>{
    clrMsg(); setLoading(true);
    if(tab==="users"){
      Promise.all([apiFetch("/users"),apiFetch("/users/groups")])
        .then(([u,g])=>{setUsers(u.users||[]);setGroups(g.groups||[]);})
        .catch(e=>setError(e.message)).finally(()=>setLoading(false));
    } else if(tab==="groups"){
      apiFetch("/users/groups").then(d=>setGroups(d.groups||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));
    } else if(tab==="settings"){
      apiFetch("/users/settings/global").then(d=>setLocalSet(d.settings||{}))
        .catch(e=>setError(e.message)).finally(()=>setLoading(false));
    } else if(tab==="logs"){
      apiFetch(`/users/logs?limit=200&level=${logLevel}`)
        .then(d=>{setLogs(d.logs||[]);setLogsTotal(d.total||0);}).catch(e=>setError(e.message));
      apiFetch("/users/logs/retention").then(d=>setLogRetInput(String(d.days))).catch(()=>{});
      setLoading(false);
    } else { setLoading(false); }
  },[tab,logLevel]);

  const filtered = users.filter(u=>!search||
    u.display_name.toLowerCase().includes(search.toLowerCase())||
    u.email.toLowerCase().includes(search.toLowerCase()));

  const handleCreateUser = async e => {
    e.preventDefault(); setCreating(true); clrMsg();
    try {
      const d = await apiFetch("/users",{method:"POST",body:JSON.stringify(createForm)});
      setUsers(u=>[...u,{...d.user,groups:[]}]);
      setCreateForm({email:"",display_name:"",password:"",role:"editor"});
      setShowCreate(false); setSuccess("User created.");
    } catch(e){setError(e.message);}
    setCreating(false);
  };

  const handleDelete = async id => {
    if(!confirm("Delete this user permanently? This cannot be undone.")) return;
    try {
      await apiFetch(`/users/${id}`,{method:"DELETE"});
      setUsers(u=>u.filter(x=>x.id!==id)); setSuccess("User deleted.");
    } catch(e){setError(e.message);}
  };

  const handleSaveUser = updated => {
    setUsers(u=>u.map(x=>x.id===updated.id?{...x,...updated}:x));
    setEditUser(null); setSuccess("User updated.");
  };

  const handleCreateGroup = async e => {
    e.preventDefault(); setCreatingG(true); clrMsg();
    try {
      const d = await apiFetch("/users/groups",{method:"POST",body:JSON.stringify(gForm)});
      setGroups(g=>[...g,d.group]);
      setGForm({name:"",description:"",color:"#6C63FF",permissions:{}});
      setShowCG(false); setSuccess("Group created.");
    } catch(e){setError(e.message);}
    setCreatingG(false);
  };

  const handleDeleteGroup = async id => {
    if(!confirm("Delete group? Users will not be removed.")) return;
    try {
      await apiFetch(`/users/groups/${id}`,{method:"DELETE"});
      setGroups(g=>g.filter(x=>x.id!==id)); setSuccess("Group deleted.");
    } catch(e){setError(e.message);}
  };

  const handleSaveSettings = async () => {
    setSavingSet(true); clrMsg();
    try {
      await apiFetch("/users/settings/global",{method:"PATCH",body:JSON.stringify(localSet)});
      setSuccess("Global settings saved.");
    } catch(e){setError(e.message);}
    setSavingSet(false);
  };

  const settingsCats = [...new Set(GLOBAL_SETTINGS.map(s=>s.cat))];

  return (
    <div style={{padding:"24px",maxWidth:920,margin:"0 auto"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20,lineHeight:1}}>←</button>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--text)"}}>Administration</div>
          <div style={{fontSize:11,color:"var(--text4)"}}>Manage users, groups, permissions and system settings</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid var(--border2)",marginBottom:20,overflowX:"auto"}}>
        <Tab label="👥 Users"       active={tab==="users"}    onClick={()=>setTab("users")}    badge={users.length}/>
        <Tab label="🏷 Groups"      active={tab==="groups"}   onClick={()=>setTab("groups")}   badge={groups.length}/>
        <Tab label="🔐 Permissions" active={tab==="perms"}    onClick={()=>setTab("perms")}/>
        <Tab label="⚙ Global Settings" active={tab==="settings"} onClick={()=>setTab("settings")}/>
        <Tab label="📋 Logs"        active={tab==="logs"}     onClick={()=>setTab("logs")}/>
      </div>

      {error   && <Alert color="var(--danger)">{error}</Alert>}
      {success && <Alert color="#4CAF50">{success}</Alert>}

      {/* ── USERS ────────────────────────────────────────────── */}
      {tab==="users"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name or email…" style={{...inp,flex:1,minWidth:200}}/>
            <button onClick={()=>setShowCreate(v=>!v)} style={btn(true)}>
              {showCreate?"✕ Cancel":"+ Create User"}
            </button>
          </div>

          {/* Role legend */}
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {[["owner","Full control"],["admin","Manage users & settings"],["editor","Create & edit maps"],
              ["viewer","View shared maps"],["restricted","View-only"]].map(([r,desc])=>(
              <span key={r} style={{fontSize:9,background:`${RC[r]}18`,color:RC[r],
                borderRadius:4,padding:"2px 8px",fontWeight:700}}>
                {r.toUpperCase()} — {desc}
              </span>
            ))}
          </div>

          {/* Create form */}
          {showCreate&&(
            <form onSubmit={handleCreateUser} style={{background:"var(--bg2)",
              borderRadius:12,padding:18,marginBottom:16,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>NEW USER</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["EMAIL","email","email"],["DISPLAY NAME","text","display_name"],
                  ["PASSWORD","password","password"],null].map((f,_i)=>f?(
                  <div key={f[2]}>
                    <div style={{fontSize:10,color:"var(--text4)",marginBottom:4}}>{f[0]}</div>
                    <input type={f[1]} value={createForm[f[2]]} required
                      onChange={e=>setCreateForm(x=>({...x,[f[2]]:e.target.value}))} style={inp}/>
                  </div>
                ):(
                  <div key="role">
                    <div style={{fontSize:10,color:"var(--text4)",marginBottom:4}}>ROLE</div>
                    <select value={createForm.role} onChange={e=>setCreateForm(x=>({...x,role:e.target.value}))} style={inp}>
                      {me?.role==="owner"&&<option value="admin">Admin</option>}
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                      <option value="restricted">Restricted</option>
                    </select>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button type="submit" disabled={creating} style={btn(true)}>{creating?"Creating…":"Create User"}</button>
                <button type="button" onClick={()=>setShowCreate(false)} style={btn(false)}>Cancel</button>
              </div>
            </form>
          )}

          {loading?<div style={{color:"var(--text4)",padding:20}}>Loading…</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filtered.length===0&&<div style={{color:"var(--text4)",padding:20}}>No users found.</div>}
              {filtered.map(u=>{
                const col=RC[u.role]||"var(--text3)";
                return(
                  <div key={u.id} style={{background:"var(--bg2)",
                    borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,opacity:u.is_active?1:.5}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:u.avatar_color||"#6C63FF",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:15,fontWeight:700,color:"#fff",flexShrink:0}}>
                      {u.display_name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:6}}>
                        {u.display_name}
                        {!u.is_active&&<span style={{fontSize:9,color:"var(--text4)",background:"var(--bg3)",borderRadius:3,padding:"1px 5px"}}>DISABLED</span>}
                        {u.id===me?.id&&<span style={{fontSize:9,color:"var(--accent)",background:"var(--accent)18",borderRadius:3,padding:"1px 5px"}}>YOU</span>}
                      </div>
                      <div style={{fontSize:11,color:"var(--text4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                      {u.groups?.filter(g=>g?.id).length>0&&(
                        <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                          {u.groups.filter(g=>g?.id).map(g=>(
                            <span key={g.id} style={{fontSize:9,background:`${g.color}22`,color:g.color,
                              borderRadius:4,padding:"1px 6px",fontWeight:700}}>{g.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <span style={{fontSize:10,fontWeight:700,color:col,background:`${col}18`,
                        padding:"2px 9px",borderRadius:5,display:"block",textAlign:"center"}}>{u.role.toUpperCase()}</span>
                      <div style={{fontSize:9,color:"var(--text4)",marginTop:3}}>
                        {u.last_login_at?new Date(u.last_login_at).toLocaleDateString():"Never logged in"}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>setEditUser(u)} style={btn(false)}>Edit</button>
                      {u.id!==me?.id&&me?.role==="owner"&&(
                        <button onClick={()=>handleDelete(u.id)} style={btn(false,true)}>✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── GROUPS ───────────────────────────────────────────── */}
      {tab==="groups"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:12,color:"var(--text4)"}}>Groups apply permission sets to multiple users at once. Assign users to groups in the Users tab.</div>
            <button onClick={()=>setShowCG(v=>!v)} style={btn(true)} >{showCG?"✕ Cancel":"+ Create Group"}</button>
          </div>

          {showCG&&(
            <form onSubmit={handleCreateGroup} style={{background:"var(--bg2)",
              borderRadius:12,padding:18,marginBottom:16,display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>NEW GROUP</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{fontSize:10,color:"var(--text4)",marginBottom:4}}>GROUP NAME</div>
                  <input value={gForm.name} required onChange={e=>setGForm(f=>({...f,name:e.target.value}))} style={inp}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{fontSize:10,color:"var(--text4)",marginBottom:4}}>DESCRIPTION</div>
                  <input value={gForm.description} onChange={e=>setGForm(f=>({...f,description:e.target.value}))} style={inp} placeholder="What this group is for…"/>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:"var(--text4)",marginBottom:7}}>GROUP COLOR</div>
                <div style={{display:"flex",gap:7}}>{GC.map(c=>(
                  <div key={c} onClick={()=>setGForm(f=>({...f,color:c}))} style={{width:24,height:24,
                    borderRadius:"50%",background:c,cursor:"pointer",
                    border:`3px solid ${gForm.color===c?"#fff":"transparent"}`,
                    boxShadow:gForm.color===c?"0 0 0 2px var(--accent)":"none"}}/>
                ))}</div>
              </div>
              <div>
                <div style={{fontSize:10,color:"var(--text4)",letterSpacing:1.5,marginBottom:10}}>PERMISSIONS FOR THIS GROUP</div>
                {[...new Set(ALL_PERMS.map(p=>p.cat))].map(cat=>(
                  <div key={cat} style={{marginBottom:10}}>
                    <div style={{fontSize:9,color:"var(--text4)",letterSpacing:1,marginBottom:5,fontWeight:700}}>{cat}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {ALL_PERMS.filter(p=>p.cat===cat).map(p=>{
                        const on=!!gForm.permissions[p.key];
                        return(
                          <label key={p.key} style={{display:"flex",alignItems:"center",gap:5,
                            fontSize:11,color:on?"var(--text)":"var(--text4)",cursor:"pointer",
                            background:on?"var(--accent)18":"var(--bg3)",borderRadius:5,
                            padding:"3px 8px",border:`1px solid ${on?"var(--accent)30":"var(--border)"}`}}>
                            <input type="checkbox" checked={on}
                              onChange={e=>setGForm(f=>({...f,permissions:{...f.permissions,[p.key]:e.target.checked}}))}
                              style={{accentColor:"var(--accent)"}}/>
                            {p.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button type="submit" disabled={creatingG} style={btn(true)}>{creatingG?"Creating…":"Create Group"}</button>
                <button type="button" onClick={()=>setShowCG(false)} style={btn(false)}>Cancel</button>
              </div>
            </form>
          )}

          {loading?<div style={{color:"var(--text4)",padding:20}}>Loading…</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {groups.length===0&&<div style={{color:"var(--text4)",fontSize:12,padding:20,textAlign:"center"}}>
                No groups yet. Groups let you apply permission bundles to multiple users simultaneously.</div>}
              {groups.map(g=>(
                <div key={g.id} style={{background:"var(--bg2)",
                  border:`1px solid ${g.color}30`,borderLeft:`4px solid ${g.color}`,
                  borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:g.color,flexShrink:0,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff"}}>
                    {g.name[0].toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{g.name}</div>
                    {g.description&&<div style={{fontSize:11,color:"var(--text4)",marginTop:1}}>{g.description}</div>}
                    <div style={{fontSize:10,color:"var(--text4)",marginTop:3}}>
                      {g.member_count} member{g.member_count!==1?"s":""}
                      {g.created_by_name&&` · Created by ${g.created_by_name}`}
                    </div>
                    <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                      {Object.entries(g.permissions||{}).filter(([,v])=>v).map(([k])=>(
                        <span key={k} style={{fontSize:9,background:`${g.color}15`,color:g.color,
                          borderRadius:3,padding:"1px 6px",border:`1px solid ${g.color}30`}}>{k}</span>
                      ))}
                      {Object.values(g.permissions||{}).filter(Boolean).length===0&&
                        <span style={{fontSize:9,color:"var(--text4)"}}>No extra permissions</span>}
                    </div>
                  </div>
                  <button onClick={()=>handleDeleteGroup(g.id)} style={btn(false,true)}>✕ Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PERMISSIONS REFERENCE ────────────────────────────── */}
      {tab==="perms"&&(
        <div>
          <div style={{fontSize:12,color:"var(--text4)",marginBottom:16,lineHeight:1.7}}>
            Permissions are inherited from role → groups → individual overrides. Use the <strong>Users tab</strong> to assign groups. Individual per-user permission grants/revokes can be set via API.
          </div>
          {Object.entries(RC).map(([role,color])=>(
            <div key={role} style={{background:"var(--bg2)",border:`1px solid ${color}30`,
              borderLeft:`4px solid ${color}`,borderRadius:10,padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:700,color,textTransform:"uppercase"}}>{role}</span>
                <span style={{fontSize:11,color:"var(--text4)"}}>
                  {role==="owner"?"Full system access — inherits everything":
                   role==="admin"?"User management + editor capabilities":
                   role==="editor"?"Create, edit, share, export, AI features":
                   role==="viewer"?"View shared maps only":
                   "Minimal — no create, no AI, no export"}
                </span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {role==="owner"
                  ?<span style={{fontSize:10,background:`${color}18`,color,borderRadius:4,padding:"2px 10px",border:`1px solid ${color}30`,fontWeight:700}}>★ All Permissions</span>
                  :(ROLE_PERMS[role]||[]).map(k=>{
                    const p=ALL_PERMS.find(x=>x.key===k);
                    return p?(
                      <span key={k} style={{fontSize:10,background:`${color}12`,color,borderRadius:4,
                        padding:"2px 8px",border:`1px solid ${color}25`}}>{p.label}</span>
                    ):null;
                  })}
                {(ROLE_PERMS[role]||[]).length===0&&
                  <span style={{fontSize:10,color:"var(--text4)"}}>No permissions by default</span>}
              </div>
            </div>
          ))}
          <div style={{marginTop:16,padding:14,background:"var(--bg2)",borderRadius:10,
            border:"1px solid var(--border)",fontSize:12,color:"var(--text3)",lineHeight:1.7}}>
            <strong>Effective permission resolution order:</strong><br/>
            1. Base role permissions<br/>
            2. + Additional permissions from all groups the user belongs to<br/>
            3. + Individual permission grants/revokes (override everything above)<br/>
            Assign users to groups in the <strong>Users → Edit</strong> panel.
          </div>
        </div>
      )}

      {/* ── GLOBAL SETTINGS ──────────────────────────────────── */}
      {tab==="settings"&&(
        <div>
          {loading?<div style={{color:"var(--text4)",padding:20}}>Loading…</div>:(
            <>
              {settingsCats.map(cat=>(
                <div key={cat} style={{marginBottom:24}}>
                  <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1.5,
                    marginBottom:10,borderBottom:"1px solid var(--border2)",paddingBottom:6}}>{cat.toUpperCase()}</div>
                  {GLOBAL_SETTINGS.filter(s=>s.cat===cat).map(s=>{
                    const val=localSet[s.key];
                    return(
                      <div key={s.key} style={{display:"flex",alignItems:"center",gap:14,
                        marginBottom:10,padding:"11px 16px",background:"var(--bg2)",
                        borderRadius:8,border:"1px solid var(--border2)"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:"var(--text)",fontWeight:600}}>{s.label}</div>
                          <div style={{fontSize:10,color:"var(--text4)",marginTop:2}}>
                            <code style={{color:"var(--accent)",background:"var(--bg3)",
                              borderRadius:3,padding:"0 4px",fontSize:10}}>{s.key}</code>
                          </div>
                        </div>
                        {s.type==="bool"?(
                          <div onClick={()=>setLocalSet(ls=>({...ls,[s.key]:val!=="true"?"true":"false"}))}
                            style={{width:46,height:26,borderRadius:13,cursor:"pointer",flexShrink:0,
                              background:val==="true"?"var(--accent2)":"var(--border)",
                              position:"relative",transition:"background .2s"}}>
                            <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",
                              position:"absolute",top:3,transition:"left .2s",
                              left:val==="true"?22:3,boxShadow:"var(--nEx,2px 2px 5px var(--neu-shadow),-2px -2px 3px var(--neu-hilight))"}}/>
                          </div>
                        ):(
                          <input type="number" value={val||"0"}
                            onChange={e=>setLocalSet(ls=>({...ls,[s.key]:e.target.value}))}
                            style={{...inp,width:88,textAlign:"center",flexShrink:0}}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <button onClick={handleSaveSettings} disabled={savingSet}
                style={{...btn(true),marginTop:4}}>
                {savingSet?"Saving…":"Save All Settings"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── LOGS ─────────────────────────────────────────────── */}
      {tab==="logs"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--text2)"}}>Application Logs</div>
              <div style={{fontSize:10,color:"var(--text4)",marginTop:2}}>{logsTotal} total records</div>
            </div>
            <select value={logLevel} onChange={e=>{setLogLevel(e.target.value);setTab("_");setTimeout(()=>setTab("logs"),0);}}
              style={{...inp,width:"auto",padding:"5px 10px",fontSize:11}}>
              {["all","info","warn","error"].map(l=><option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--bg2)",
              borderRadius:8,padding:"4px 10px"}}>
              <span style={{fontSize:10,color:"var(--text4)"}}>Retention:</span>
              <input type="number" value={logRetInput} onChange={e=>setLogRetInput(e.target.value)}
                style={{width:46,background:"transparent",border:"none",color:"var(--text)",
                  fontSize:11,fontFamily:"inherit",outline:"none",textAlign:"center"}} min="1" max="365"/>
              <span style={{fontSize:10,color:"var(--text4)"}}>days</span>
              <button onClick={()=>apiFetch("/users/logs/retention",{method:"PATCH",body:JSON.stringify({days:parseInt(logRetInput)||7})}).catch(()=>{})}
                style={{...btn(true),padding:"3px 9px",fontSize:10}}>Save</button>
            </div>
            <button onClick={()=>apiFetch("/users/logs",{method:"DELETE"})
                .then(d=>{alert(`Pruned ${d.deleted} old entries`);setTab("_");setTimeout(()=>setTab("logs"),0);}).catch(()=>{})}
              style={{...btn(false,true),padding:"5px 12px",fontSize:10}}>🗑 Prune</button>
          </div>
          {logs.length===0
            ?<div style={{color:"var(--text4)",padding:20}}>No logs found for this filter.</div>
            :<div style={{fontFamily:"monospace",fontSize:11,lineHeight:1.6,maxHeight:"55vh",overflowY:"auto"}}>
              {logs.map(log=>(
                <div key={log.id} style={{display:"flex",gap:10,padding:"5px 2px",
                  borderBottom:"1px solid var(--border2)",alignItems:"flex-start"}}>
                  <span style={{color:log.level==="error"?"var(--danger)":log.level==="warn"?"#f59e0b":"var(--text4)",
                    fontWeight:700,minWidth:42,fontSize:10,flexShrink:0}}>
                    {(log.level||"info").toUpperCase()}
                  </span>
                  <span style={{color:"var(--text4)",minWidth:100,fontSize:9,paddingTop:1,flexShrink:0}}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  <span style={{color:"var(--accent)",minWidth:64,fontSize:9,paddingTop:1,flexShrink:0}}>
                    [{log.category||"sys"}]
                  </span>
                  <span style={{color:"var(--text2)",flex:1}}>{log.message}</span>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* Edit modal */}
      {editUser&&(
        <EditUserModal user={editUser} allGroups={groups} me={me}
          onSave={handleSaveUser} onClose={()=>setEditUser(null)}/>
      )}
    </div>
  );
}
