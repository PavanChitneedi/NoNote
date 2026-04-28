import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const { themeName, setThemeName } = useTheme();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div data-ui="login-page" data-component="LoginPage" data-page="login" data-role="page" style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center",
      backgroundImage:"radial-gradient(circle at 30% 40%, var(--accent2)10 0%, transparent 60%), radial-gradient(circle at 80% 70%, #2196F310 0%, transparent 50%)",
      padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        {/* Card */}
        <div style={{ background:"var(--bg2)", border:`1px solid var(--border)`, borderRadius:"var(--radius-lg)", padding:"36px 30px", boxShadow:"0 8px 40px var(--shadow)" }}>
          <div style={{ textAlign:"center", marginBottom:30 }}>
            <div style={{ fontSize:38 }}>⬡</div>
            <div style={{ fontSize:24, fontWeight:700, color:"var(--accent)", letterSpacing:2, marginTop:8 }}>NoNote</div>
            <div style={{ fontSize:11, color:"var(--text4)", marginTop:5, letterSpacing:1 }}>ARCHITECTURE · MIND MAPPING · DIAGRAMS</div>
          </div>

          <form onSubmit={handle} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:5 }}>EMAIL</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
                placeholder="you@example.com"
                style={{ width:"100%", background:"var(--bg)", border:`1px solid var(--border)`, borderRadius:"var(--radius-sm)", padding:"11px 12px", color:"var(--text)", fontSize:14, outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:5 }}>PASSWORD</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"
                placeholder="••••••••"
                style={{ width:"100%", background:"var(--bg)", border:`1px solid var(--border)`, borderRadius:"var(--radius-sm)", padding:"11px 12px", color:"var(--text)", fontSize:14, outline:"none", boxSizing:"border-box" }}
              />
            </div>
            {error && (
              <div style={{ background:"var(--danger)18", border:`1px solid var(--danger)50`, borderRadius:"var(--radius-sm)", padding:"10px 14px", fontSize:12, color:"var(--danger)" }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{ marginTop:6, padding:"12px", background:loading?"var(--bg3)":"var(--accent2)", border:"none", borderRadius:"var(--radius-md)", color:loading?"var(--text4)":"var(--on-accent)", fontSize:13, fontWeight:700, letterSpacing:1, cursor:loading?"not-allowed":"pointer", transition:"all .2s", fontFamily:"inherit" }}>
              {loading ? "SIGNING IN…" : "SIGN IN →"}
            </button>
          </form>

          <div style={{ marginTop:20, textAlign:"center", fontSize:11, color:"var(--text4)" }}>
            Contact your administrator to get access.
          </div>
        </div>

        {/* Theme switcher on login */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:16 }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} onClick={()=>setThemeName(key)} title={t.name}
              style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${themeName===key?"var(--accent)":"transparent"}`, background:t.vars["--bg2"], cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {t.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
