import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme, THEMES } from "./context/ThemeContext.jsx";
import LoginPage    from "./components/LoginPage.jsx";
import Dashboard    from "./components/Dashboard.jsx";
import NodeCanvas   from "./components/NodeCanvas.jsx";
import AdminPanel   from "./components/AdminPanel.jsx";
import ThemePicker  from "./components/ThemePicker.jsx";
import UserProfile  from "./components/UserProfile.jsx";

// ── Font size stored in localStorage ─────────────────────────
const FONT_SIZES = [
  { label:"S",  size:"11px" },
  { label:"M",  size:"13px" },
  { label:"L",  size:"15px" },
  { label:"XL", size:"18px" },
];
function applyFontSize(size) {
  document.documentElement.style.setProperty("--app-font-size", size);
  document.body.style.fontSize = size;
}

function AppInner() {
  const { user, loading, logout }    = useAuth();
  const { themeName, theme, THEMES: T } = useTheme();
  const [view, setView]              = useState({ page:"dashboard", mapId:null });
  const [showThemes,   setShowThemes]  = useState(false);
  const [showProfile,  setShowProfile] = useState(false);
  const [fontIdx,      setFontIdx]     = useState(() => {
    const saved = localStorage.getItem("nm_fontsize");
    return FONT_SIZES.findIndex(f=>f.size===saved) !== -1 ? FONT_SIZES.findIndex(f=>f.size===saved) : 1;
  });

  useEffect(() => {
    applyFontSize(FONT_SIZES[fontIdx].size);
    localStorage.setItem("nm_fontsize", FONT_SIZES[fontIdx].size);
  }, [fontIdx]);

  const goHome    = () => setView({ page:"dashboard", mapId:null });
  const openMap   = (id) => setView({ page:"canvas", mapId:id });
  const openAdmin = () => setView({ page:"admin",   mapId:null });

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:"var(--text4)", fontFamily:"monospace" }}>
        <div style={{ fontSize:38, marginBottom:12 }}>⬡</div>
        <div style={{ fontSize:12, letterSpacing:2 }}>LOADING…</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const showHeader = view.page !== "canvas";

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>

      {/* ── Global header (dashboard + admin pages) ── */}
      {showHeader && (
        <div style={{ height:50, background:"var(--bg2)", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", gap:8, padding:"0 16px", flexShrink:0, position:"sticky", top:0, zIndex:20 }}>

          {/* Logo */}
          <span onClick={goHome} title="Home"
            style={{ fontSize:22, cursor:"pointer", userSelect:"none" }}>⬡</span>
          <span onClick={goHome}
            style={{ fontSize:14, fontWeight:700, color:"var(--accent)", letterSpacing:1.5, cursor:"pointer", flex:1 }}>
            NodeMap
          </span>

          {/* Back when on admin */}
          {view.page==="admin" && (
            <button onClick={goHome} style={{ padding:"6px 12px", background:"var(--bg3)", border:"none", borderRadius:7, color:"var(--text3)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit" }}>
              ← BACK
            </button>
          )}

          {/* Font size picker */}
          <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--border)", borderRadius:7, overflow:"hidden" }}>
            {FONT_SIZES.map((f,i) => (
              <button key={f.label} onClick={()=>setFontIdx(i)}
                style={{ padding:"5px 9px", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"inherit",
                  background:fontIdx===i?"var(--accent2)":"var(--bg3)", color:fontIdx===i?"#fff":"var(--text4)" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Theme */}
          <button onClick={()=>setShowThemes(true)} title="Change theme"
            style={{ padding:"6px 12px", background:"var(--bg3)", border:"none", borderRadius:7, color:"var(--text3)", cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>
            {THEMES[themeName]?.icon} THEME
          </button>

          {/* Avatar + profile */}
          <div onClick={()=>setShowProfile(true)} title="My profile"
            style={{ width:32, height:32, borderRadius:"50%", background:user.avatar_color||"#6C63FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0, cursor:"pointer" }}>
            {user.display_name?.[0]?.toUpperCase()}
          </div>

          {["owner","admin"].includes(user.role) && (
            <button onClick={openAdmin} style={{ padding:"6px 12px", background:"var(--bg3)", border:"none", borderRadius:7, color:"var(--text3)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit" }}>
              ⚙ ADMIN
            </button>
          )}

          <button onClick={logout} style={{ padding:"6px 12px", background:"var(--bg3)", border:"none", borderRadius:7, color:"var(--danger)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit" }}>
            → OUT
          </button>
        </div>
      )}

      {/* ── Page content ── */}
      <div style={{ flex:1, overflow:view.page==="canvas"?"hidden":"auto" }}>
        {view.page==="dashboard" && (
          <Dashboard onOpenMap={openMap} onOpenAdmin={openAdmin} />
        )}
        {view.page==="canvas" && view.mapId && (
          <NodeCanvas mapId={view.mapId} onBack={goHome} onHome={goHome} />
        )}
        {view.page==="admin" && (
          <AdminPanel onBack={goHome} />
        )}
      </div>

      {showThemes  && <ThemePicker onClose={()=>setShowThemes(false)} />}
      {showProfile && <UserProfile onClose={()=>setShowProfile(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
