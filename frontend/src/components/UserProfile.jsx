import { useState } from "react";
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

export default function UserProfile({ onClose }) {
  const { user, updateUserLocal } = useAuth();
  const [tab, setTab] = useState("profile");

  const [name,    setName]    = useState(user?.display_name || "");
  const [color,   setColor]   = useState(user?.avatar_color || "#6C63FF");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  const [curPw,   setCurPw]   = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confPw,  setConfPw]  = useState("");
  const [pwMsg,   setPwMsg]   = useState("");
  const [pwSaving,setPwSaving]= useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setMsg("");
    try {
      const d = await apiFetch(`/users/${user.id}`, { method:"PATCH", body:JSON.stringify({ display_name:name.trim(), avatar_color:color }) });
      updateUserLocal?.(d.user);
      setMsg("✓ Profile saved");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) { setMsg("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (newPw !== confPw) { setPwMsg("New passwords do not match."); return; }
    if (newPw.length < 8) { setPwMsg("Password must be at least 8 characters."); return; }
    setPwSaving(true);
    try {
      await apiFetch(`/users/me`, { method:"PATCH", body:JSON.stringify({ current_password:curPw, password:newPw }) });
      setCurPw(""); setNewPw(""); setConfPw("");
      setPwMsg("✓ Password changed successfully");
      setTimeout(() => setPwMsg(""), 4000);
    } catch (err) { setPwMsg("Error: " + err.message); }
    finally { setPwSaving(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:400, padding:16 }}
      onClick={onClose}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:16, width:"100%", maxWidth:440, overflow:"hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff", flexShrink:0 }}>
            {user?.display_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{user?.display_name}</div>
            <div style={{ fontSize:11, color:"var(--text4)" }}>{user?.email} · {user?.role}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:22 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, padding:"12px 16px", borderBottom:"1px solid var(--border2)" }}>
          {[["profile","👤 Profile"],["password","🔑 Password"]].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...btn(tab===t), padding:"7px 14px", fontSize:11 }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ padding:"20px" }}>
          {/* ── Profile tab ── */}
          {tab==="profile" && (
            <form onSubmit={saveProfile} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:5 }}>DISPLAY NAME</label>
                <input value={name} onChange={e => setName(e.target.value)} required style={inp} />
              </div>

              <div>
                <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:8 }}>AVATAR COLOR</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {AVATAR_COLORS.map(c => (
                    <div key={c} onClick={() => setColor(c)}
                      style={{ width:30, height:30, borderRadius:"50%", background:c, cursor:"pointer", border:`3px solid ${color===c?"var(--text)":"transparent"}`, transition:"border .1s" }}
                    />
                  ))}
                </div>
              </div>

              {msg && <div style={{ fontSize:12, color: msg.startsWith("✓") ? "var(--success)" : "var(--danger)", padding:"8px 12px", background: msg.startsWith("✓") ? "var(--success)18" : "var(--danger)18", borderRadius:7 }}>{msg}</div>}

              <button type="submit" disabled={saving} style={btn(true)}>{saving ? "Saving…" : "SAVE PROFILE"}</button>
            </form>
          )}

          {/* ── Password tab ── */}
          {tab==="password" && (
            <form onSubmit={changePassword} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:5 }}>CURRENT PASSWORD</label>
                <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} required style={inp} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:5 }}>NEW PASSWORD</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} style={inp} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:5 }}>CONFIRM NEW PASSWORD</label>
                <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} required style={inp} />
              </div>
              <div style={{ fontSize:11, color:"var(--text4)" }}>Minimum 8 characters</div>

              {pwMsg && <div style={{ fontSize:12, color: pwMsg.startsWith("✓") ? "var(--success)" : "var(--danger)", padding:"8px 12px", background: pwMsg.startsWith("✓") ? "var(--success)18" : "var(--danger)18", borderRadius:7 }}>{pwMsg}</div>}

              <button type="submit" disabled={pwSaving} style={btn(true)}>{pwSaving ? "Saving…" : "CHANGE PASSWORD"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
