import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser, apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const RC = { owner:"#FFD93D", admin:"#f78166", editor:"var(--accent)", viewer:"var(--text3)" };
const inp = { width:"100%", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:7, padding:"9px 11px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
const pb = (primary) => ({ padding:"9px 18px", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", background:primary?"var(--accent2)":"var(--bg3)", color:primary?"#fff":"var(--text3)" });

function Alert({ color, children }) {
  return <div style={{ background:`${color}18`, border:`1px solid ${color}40`, borderRadius:8, padding:"10px 14px", fontSize:12, color, lineHeight:1.5 }}>{children}</div>;
}

function Field({ label, value, onChange, type="text", required, disabled, placeholder }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:4 }}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} required={required} disabled={disabled} placeholder={placeholder}
        style={{ ...inp, opacity:disabled?.6:1 }} />
    </div>
  );
}

// ── Edit User Modal ────────────────────────────────────────────
function EditUserModal({ user: u, currentUserRole, onSave, onClose }) {
  const [name,    setName]    = useState(u.display_name);
  const [role,    setRole]    = useState(u.role);
  const [active,  setActive]  = useState(u.is_active);
  const [newPw,   setNewPw]   = useState("");
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const patch = { display_name: name.trim(), role, is_active: active };
      if (newPw.trim()) {
        if (newPw.length < 8) { setError("Password must be at least 8 characters."); setSaving(false); return; }
        patch.password = newPw;
      }
      const d = await updateUser(u.id, patch);
      onSave(d.user);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500, padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:14, width:"100%", maxWidth:420, overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:u.avatar_color||"#6C63FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff" }}>
            {u.display_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Edit User</div>
            <div style={{ fontSize:11, color:"var(--text4)" }}>{u.email}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:20 }}>×</button>
        </div>
        <form onSubmit={handle} style={{ padding:18, display:"flex", flexDirection:"column", gap:12 }}>
          <Field label="DISPLAY NAME" value={name} onChange={setName} required />
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:4 }}>ROLE</div>
            <select value={role} onChange={e=>setRole(e.target.value)}
              disabled={currentUserRole !== "owner"}
              style={{ ...inp, opacity:currentUserRole!=="owner"?.5:1 }}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              {currentUserRole==="owner" && <option value="owner">Owner</option>}
            </select>
            {currentUserRole !== "owner" && <div style={{ fontSize:10, color:"var(--text4)", marginTop:3 }}>Only owners can change roles</div>}
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:4 }}>STATUS</div>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"var(--text2)" }}>
              <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
              Account active
            </label>
          </div>
          <Field label="RESET PASSWORD (leave blank to keep)" value={newPw} onChange={setNewPw} type="password" placeholder="New password…" />
          {error && <Alert color="var(--danger)">{error}</Alert>}
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button type="submit" disabled={saving} style={pb(true)}>{saving?"Saving…":"SAVE CHANGES"}</button>
            <button type="button" onClick={onClose} style={pb(false)}>CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main AdminPanel ────────────────────────────────────────────
export default function AdminPanel({ onBack }) {
  const { user: me } = useAuth();
  const [tab, setTab]         = useState("users");
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [editUser, setEditUser]= useState(null);
  const [search, setSearch]   = useState("");
  const [form, setForm]       = useState({ email:"", display_name:"", password:"", role:"viewer" });
  const [creating, setCreating]= useState(false);

  useEffect(() => {
    if (tab==="users") {
      setLoading(true);
      getUsers().then(d=>setUsers(d.users)).catch(e=>setError(e.message)).finally(()=>setLoading(false));
    }
  }, [tab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setCreating(true);
    try {
      const d = await createUser(form);
      setUsers(u=>[d.user,...u]);
      setForm({ email:"", display_name:"", password:"", role:"viewer" });
      setTab("users");
      setSuccess("User created successfully.");
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently delete this user and all their data?")) return;
    try {
      await deleteUser(id);
      setUsers(u=>u.filter(x=>x.id!==id));
    } catch (err) { setError(err.message); }
  };

  const handleSaveEdit = (updated) => {
    setUsers(u=>u.map(x=>x.id===updated.id?{...x,...updated}:x));
    setSuccess("User updated.");
    setTimeout(()=>setSuccess(""),3000);
  };

  const filtered = users.filter(u =>
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"calc(100vh - 50px)", background:"var(--bg)", padding:"24px 20px" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:20, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Admin Panel</div>
          <div style={{ fontSize:12, color:"var(--text4)" }}>
            {me?.display_name} · <span style={{ color:RC[me?.role]||"var(--text3)" }}>{me?.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:22, flexWrap:"wrap" }}>
          {[["users","👥 All Users"],["create","＋ Create User"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{ ...pb(tab===t), background:tab===t?"var(--accent2)":"var(--bg3)", color:tab===t?"#fff":"var(--text3)" }}>
              {l}
            </button>
          ))}
        </div>

        {error   && <div style={{ marginBottom:14 }}><Alert color="var(--danger)">{error}</Alert></div>}
        {success && <div style={{ marginBottom:14 }}><Alert color="var(--success)">{success}</Alert></div>}

        {/* ── Users list ── */}
        {tab==="users" && (
          <>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…"
              style={{ ...inp, marginBottom:16, maxWidth:320 }}
            />
            {loading ? (
              <div style={{ color:"var(--text4)", fontSize:13, padding:20 }}>Loading…</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {filtered.map(u => (
                  <div key={u.id} style={{ background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, opacity:u.is_active?1:.5 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:u.avatar_color||"#6C63FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#fff", flexShrink:0 }}>
                      {u.display_name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{u.display_name}</div>
                      <div style={{ fontSize:11, color:"var(--text3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:RC[u.role]||"var(--text3)", background:`${RC[u.role]||"#888"}18`, padding:"3px 9px", borderRadius:5, flexShrink:0, letterSpacing:.5 }}>
                      {u.role.toUpperCase()}
                    </span>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:10, color:"var(--text4)" }}>{u.is_active?"Active":"Disabled"}</div>
                      <div style={{ fontSize:10, color:"var(--text4)" }}>
                        {u.last_login_at ? `Last: ${new Date(u.last_login_at).toLocaleDateString()}` : "Never logged in"}
                      </div>
                    </div>
                    {u.id !== me?.id && ["owner","admin"].includes(me?.role) && (
                      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                        <button onClick={()=>setEditUser(u)}
                          style={{ ...pb(false), padding:"5px 12px", fontSize:10 }}>EDIT</button>
                        {me?.role==="owner" && (
                          <button onClick={()=>handleDelete(u.id)}
                            style={{ padding:"5px 12px", background:"var(--danger)18", border:"1px solid var(--danger)40", borderRadius:7, color:"var(--danger)", cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"inherit" }}>
                            DELETE
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {!filtered.length && <div style={{ color:"var(--text4)", fontSize:13, padding:20 }}>No users match your search.</div>}
              </div>
            )}
          </>
        )}

        {/* ── Create user ── */}
        {tab==="create" && (
          <form onSubmit={handleCreate} style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, padding:22, display:"flex", flexDirection:"column", gap:14, maxWidth:480 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--text4)", letterSpacing:2 }}>NEW USER</div>
            <Field label="EMAIL" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email" required />
            <Field label="DISPLAY NAME" value={form.display_name} onChange={v=>setForm(f=>({...f,display_name:v}))} required />
            <Field label="PASSWORD" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} type="password" required />
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:4 }}>ROLE</div>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={inp}>
                <option value="viewer">Viewer — read-only on shared maps</option>
                <option value="editor">Editor — create and edit maps</option>
                <option value="admin">Admin — manage users</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button type="submit" disabled={creating} style={pb(true)}>{creating?"Creating…":"CREATE USER"}</button>
              <button type="button" onClick={()=>setTab("users")} style={pb(false)}>CANCEL</button>
            </div>
          </form>
        )}
      </div>

      {/* Edit modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          currentUserRole={me?.role}
          onSave={handleSaveEdit}
          onClose={()=>setEditUser(null)}
        />
      )}
    </div>
  );
}
