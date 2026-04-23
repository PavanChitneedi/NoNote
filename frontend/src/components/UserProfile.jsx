import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../api/client.js";

const inp = {
  width:"100%", background:"var(--bg)", border:"1px solid var(--border)",
  borderRadius:8, padding:"10px 12px", color:"var(--text)", fontSize:13,
  fontFamily:"inherit", outline:"none", boxSizing:"border-box",
};
const btn = (primary) => ({
  padding:"10px 20px", border:"none", borderRadius:8, cursor:"pointer",
  fontSize:12, fontWeight:700, fontFamily:"inherit",
  background: primary ? "var(--accent2)" : "var(--bg3)",
  color:      primary ? "#fff"           : "var(--text3)",
});

const AVATAR_COLORS = [
  "#6C63FF","#E91E63","#2196F3","#4CAF50","#FF9800","#9C27B0",
  "#00BCD4","#F44336","#8BC34A","#FF5722","#3F51B5","#009688",
];

const RC = { owner:"#FFD93D", admin:"#f78166", editor:"var(--accent)", viewer:"var(--text3)", restricted:"#888" };

export default function UserProfile({ onClose }) {
  const { user, updateUserLocal } = useAuth();
  const [tab, setTab] = useState("profile");

  // Profile form
  const [name,    setName]    = useState(user?.display_name || "");
  const [email,   setEmail]   = useState(user?.email || "");
  const [color,   setColor]   = useState(user?.avatar_color || "#6C63FF");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ text:"", ok:true });

  // Password form
  const [curPw,   setCurPw]   = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confPw,  setConfPw]  = useState("");
  const [pwMsg,   setPwMsg]   = useState({ text:"", ok:true });
  const [pwSaving,setPwSaving]= useState(false);

  // Global settings — what the user is allowed to change
  const [allowed, setAllowed] = useState({
    allow_username_change: true,
    allow_email_change: false,
    allow_password_change: true,
    allow_avatar_change: true,
  });
  const [myGroups, setMyGroups] = useState([]);
  const [myPerms,  setMyPerms]  = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    apiFetch("/users/me/settings")
      .then(d => {
        setAllowed(d.settings || {});
        setMyGroups(d.groups || []);
        setMyPerms(d.permissions || []);
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const saveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true); setMsg({ text:"", ok:true });
    try {
      const payload = {};
      if (allowed.allow_username_change && name !== user?.display_name) payload.display_name = name;
      if (allowed.allow_email_change    && email !== user?.email)        payload.email = email;
      if (allowed.allow_avatar_change   && color !== user?.avatar_color) payload.avatar_color = color;
      if (!Object.keys(payload).length) { setMsg({ text:"No changes to save.", ok:true }); setSaving(false); return; }
      const d = await apiFetch("/users/me", { method:"PATCH", body:JSON.stringify(payload) });
      updateUserLocal?.(d.user);
      setMsg({ text:"Profile saved!", ok:true });
    } catch (err) {
      setMsg({ text:err.message || "Save failed.", ok:false });
    }
    setSaving(false);
  };

  const savePassword = async (e) => {
    e?.preventDefault();
    if (!allowed.allow_password_change) return;
    if (newPw !== confPw) { setPwMsg({ text:"Passwords don't match.", ok:false }); return; }
    if (newPw.length < 8) { setPwMsg({ text:"Password must be at least 8 characters.", ok:false }); return; }
    setPwSaving(true); setPwMsg({ text:"", ok:true });
    try {
      await apiFetch("/users/me", {
        method:"PATCH",
        body:JSON.stringify({ password:newPw, current_password:curPw }),
      });
      setCurPw(""); setNewPw(""); setConfPw("");
      setPwMsg({ text:"Password changed successfully!", ok:true });
    } catch (err) {
      setPwMsg({ text:err.message || "Change failed.", ok:false });
    }
    setPwSaving(false);
  };

  const hasChanges = name !== user?.display_name || email !== user?.email || color !== user?.avatar_color;

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding:"8px 16px", background:"none", border:"none",
      borderBottom:`2px solid ${tab===id?"var(--accent)":"transparent"}`,
      color: tab===id?"var(--accent)":"var(--text4)",
      cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:.5, fontFamily:"inherit",
    }}>{label}</button>
  );

  const Message = ({ m }) => m.text ? (
    <div style={{ fontSize:12, color:m.ok?"#4CAF50":"var(--danger)", marginTop:4, lineHeight:1.4 }}>
      {m.ok?"✓ ":""}{m.text}
    </div>
  ) : null;

  const Locked = ({ reason }) => (
    <div style={{ fontSize:11, color:"var(--text4)", background:"var(--bg3)",
      borderRadius:6, padding:"8px 12px", display:"flex", gap:8, alignItems:"center",
      border:"1px solid var(--border2)" }}>
      🔒 {reason}
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }}
      onClick={onClose}>
      <div data-dev="UserProfile.jsx | profile modal" style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:14,
        width:"100%", maxWidth:520, maxHeight:"88vh", display:"flex", flexDirection:"column",
        overflow:"hidden", boxShadow:"0 24px 72px rgba(0,0,0,.7)" }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"18px 22px 12px", borderBottom:"1px solid var(--border2)",
          display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20, fontWeight:700, color:"#fff", flexShrink:0 }}>
            {user?.display_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{user?.display_name}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
              <span style={{ fontSize:10, fontWeight:700, color:RC[user?.role]||"var(--text3)",
                background:`${RC[user?.role]||"#888"}18`, padding:"1px 8px",
                borderRadius:4 }}>{user?.role?.toUpperCase()}</span>
              <span style={{ fontSize:10, color:"var(--text4)" }}>{user?.email}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none",
            color:"var(--text4)", cursor:"pointer", fontSize:22, lineHeight:1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border2)", flexShrink:0, padding:"0 12px" }}>
          <TabBtn id="profile"  label="Profile"/>
          <TabBtn id="password" label="Password"/>
          <TabBtn id="access"   label="My Access"/>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:"auto", padding:"18px 22px" }}>

          {/* ── PROFILE TAB ── */}
          {tab==="profile" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Display name */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)",
                  letterSpacing:1.5, marginBottom:5, display:"flex", alignItems:"center", gap:8 }}>
                  DISPLAY NAME
                  {!allowed.allow_username_change && <span style={{ fontSize:9, color:"var(--text4)",
                    background:"var(--bg3)", borderRadius:3, padding:"1px 5px" }}>locked by admin</span>}
                </div>
                {allowed.allow_username_change
                  ? <input value={name} onChange={e=>setName(e.target.value)} style={inp}/>
                  : <Locked reason="Admin has disabled display name changes."/>
                }
              </div>

              {/* Email */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)",
                  letterSpacing:1.5, marginBottom:5, display:"flex", alignItems:"center", gap:8 }}>
                  EMAIL ADDRESS
                  {!allowed.allow_email_change && <span style={{ fontSize:9, color:"var(--text4)",
                    background:"var(--bg3)", borderRadius:3, padding:"1px 5px" }}>locked by admin</span>}
                </div>
                {allowed.allow_email_change
                  ? <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
                  : <div style={{ ...inp, color:"var(--text4)", background:"var(--bg3)",
                      cursor:"default", display:"flex", alignItems:"center" }}>{email}</div>
                }
              </div>

              {/* Avatar color */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)",
                  letterSpacing:1.5, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                  AVATAR COLOR
                  {!allowed.allow_avatar_change && <span style={{ fontSize:9, color:"var(--text4)",
                    background:"var(--bg3)", borderRadius:3, padding:"1px 5px" }}>locked by admin</span>}
                </div>
                {allowed.allow_avatar_change ? (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {AVATAR_COLORS.map(c => (
                      <div key={c} onClick={() => setColor(c)} style={{
                        width:30, height:30, borderRadius:"50%", background:c, cursor:"pointer",
                        border:`3px solid ${color===c?"#fff":"transparent"}`,
                        boxShadow: color===c?"0 0 0 2px var(--accent)":"none",
                        transition:"all .12s",
                      }}/>
                    ))}
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:color,
                      opacity:.5, border:"2px solid var(--border)" }}/>
                    <span style={{ fontSize:11, color:"var(--text4)", paddingTop:8 }}>Avatar color is managed by your admin</span>
                  </div>
                )}
              </div>

              <Message m={msg}/>
              {(allowed.allow_username_change||allowed.allow_email_change||allowed.allow_avatar_change) && (
                <button onClick={saveProfile} disabled={saving||!hasChanges} style={btn(true)}>
                  {saving ? "Saving…" : hasChanges ? "Save Profile" : "No Changes"}
                </button>
              )}
            </div>
          )}

          {/* ── PASSWORD TAB ── */}
          {tab==="password" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {!allowed.allow_password_change ? (
                <Locked reason="Your administrator has disabled password self-service. Contact an admin to change your password."/>
              ) : (
                <>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:1.5, marginBottom:5 }}>CURRENT PASSWORD</div>
                    <input type="password" value={curPw} onChange={e=>setCurPw(e.target.value)}
                      placeholder="Enter your current password" style={inp}/>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:1.5, marginBottom:5 }}>NEW PASSWORD</div>
                    <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)}
                      placeholder="Min 8 characters" style={inp}/>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:1.5, marginBottom:5 }}>CONFIRM NEW PASSWORD</div>
                    <input type="password" value={confPw} onChange={e=>setConfPw(e.target.value)}
                      placeholder="Repeat new password" style={inp}/>
                  </div>
                  {newPw && confPw && newPw !== confPw && (
                    <div style={{ fontSize:12, color:"var(--danger)" }}>Passwords don't match</div>
                  )}
                  <Message m={pwMsg}/>
                  <button onClick={savePassword} disabled={pwSaving||!curPw||!newPw||newPw!==confPw} style={btn(true)}>
                    {pwSaving ? "Changing…" : "Change Password"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── ACCESS TAB ── */}
          {tab==="access" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {loadingSettings ? (
                <div style={{ color:"var(--text4)", fontSize:12 }}>Loading…</div>
              ) : (
                <>
                  {/* Groups */}
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:1.5, marginBottom:8 }}>
                      YOUR GROUPS ({myGroups.length})
                    </div>
                    {myGroups.length === 0 ? (
                      <div style={{ fontSize:12, color:"var(--text4)" }}>You're not in any groups.</div>
                    ) : (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {myGroups.map(g => (
                          <div key={g.id} style={{ padding:"5px 14px", borderRadius:20, fontSize:11,
                            fontWeight:700, background:`${g.color}20`, color:g.color,
                            border:`2px solid ${g.color}40` }}>
                            {g.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Effective permissions */}
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:1.5, marginBottom:8 }}>
                      YOUR EFFECTIVE PERMISSIONS
                    </div>
                    {myPerms.includes("*") ? (
                      <div style={{ fontSize:12, color:"#FFD93D", fontWeight:700 }}>★ Full access — all permissions</div>
                    ) : myPerms.length === 0 ? (
                      <div style={{ fontSize:12, color:"var(--text4)" }}>No special permissions.</div>
                    ) : (
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {myPerms.map(p => (
                          <span key={p} style={{ fontSize:10, background:"var(--accent)15", color:"var(--accent)",
                            borderRadius:4, padding:"2px 8px", border:"1px solid var(--accent)25" }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* What you can change */}
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:1.5, marginBottom:8 }}>
                      SELF-SERVICE ALLOWED BY ADMIN
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {[
                        ["allow_username_change", "Change display name"],
                        ["allow_email_change",    "Change email address"],
                        ["allow_password_change", "Change password"],
                        ["allow_avatar_change",   "Change avatar color"],
                      ].map(([key, label]) => (
                        <div key={key} style={{ display:"flex", alignItems:"center", gap:10,
                          padding:"8px 12px", background:"var(--bg3)", borderRadius:6 }}>
                          <span style={{ fontSize:14 }}>{allowed[key] ? "✅" : "🔒"}</span>
                          <span style={{ fontSize:12, color: allowed[key] ? "var(--text)" : "var(--text4)" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
