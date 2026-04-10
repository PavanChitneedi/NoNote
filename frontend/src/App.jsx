import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme, THEMES } from "./context/ThemeContext.jsx";
import { DesignProvider } from "./context/DesignContext.jsx";
import LoginPage    from "./components/LoginPage.jsx";
import Dashboard    from "./components/Dashboard.jsx";
import NodeCanvas   from "./components/NodeCanvas.jsx";
import AdminPanel   from "./components/AdminPanel.jsx";
import ThemePicker  from "./components/ThemePicker.jsx";
import UserProfile  from "./components/UserProfile.jsx";

function AppInner() {
  const { user, loading, logout } = useAuth();
  const { themeName }             = useTheme();
  const [view,         setView]         = useState({ page:"dashboard", mapId:null });
  const [showAppearance, setShowAppearance] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  const goHome    = () => setView({ page:"dashboard", mapId:null });
  const openMap   = id => setView({ page:"canvas",    mapId:id });
  const openAdmin = ()  => setView({ page:"admin",    mapId:null });

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:"var(--text4)" }}>
        <div style={{ fontSize:38, marginBottom:12 }}>⬡</div>
        <div style={{ fontSize:12, letterSpacing:2, fontFamily:"monospace" }}>LOADING…</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const showHeader = view.page !== "canvas";

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>

      {/* ── Global header (dashboard + admin) ── */}
      {showHeader && (
        <div style={{
          height:"var(--topbar-h)", background:"var(--bg2)",
          borderBottom:"1px solid var(--border2)",
          display:"flex", alignItems:"center", gap:8,
          padding:"0 16px", flexShrink:0,
          position:"sticky", top:0, zIndex:20
        }}>
          {/* NoNote logo + name */}
          <span onClick={goHome} title="Home"
            style={{ fontSize:22, cursor:"pointer", userSelect:"none" }}>⬡</span>
          <span onClick={goHome}
            style={{ fontSize:15, fontWeight:700, color:"var(--accent)", letterSpacing:1.5, cursor:"pointer", flex:1 }}>
            NoNote
          </span>

          {/* Back when on admin */}
          {view.page==="admin" && (
            <button onClick={goHome} style={hBtn}>← BACK</button>
          )}

          {/* Appearance */}
          <button onClick={() => setShowAppearance(true)} style={hBtn} title="Theme, design & text size">
            {THEMES[themeName]?.icon} Appearance
          </button>

          {/* Avatar → profile */}
          <div onClick={() => setShowProfile(true)} title="My profile"
            style={{ width:32, height:32, borderRadius:"50%", background:user.avatar_color||"#6C63FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0, cursor:"pointer" }}>
            {user.display_name?.[0]?.toUpperCase()}
          </div>

          {["owner","admin"].includes(user.role) && (
            <button onClick={openAdmin} style={hBtn}>⚙ ADMIN</button>
          )}

          <button onClick={logout} style={{ ...hBtn, color:"var(--danger)" }}>→ OUT</button>
        </div>
      )}

      {/* ── Page ── */}
      <div style={{ flex:1, overflow:view.page==="canvas"?"hidden":"auto" }}>
        {view.page==="dashboard" && <Dashboard onOpenMap={openMap} onOpenAdmin={openAdmin} />}
        {view.page==="canvas" && view.mapId && (
          <NodeCanvas mapId={view.mapId} onBack={goHome} onHome={goHome} />
        )}
        {view.page==="admin" && <AdminPanel onBack={goHome} />}
      </div>

      {/* Appearance modal */}
      {showAppearance && <ThemePicker onClose={() => setShowAppearance(false)} defaultTab="global"/>}
      {showProfile    && <UserProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
}

const hBtn = {
  padding:"6px 12px", background:"var(--bg3)", border:"none",
  borderRadius:"var(--radius-btn)", color:"var(--text3)",
  cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit",
};

export default function App() {
  return (
    <ThemeProvider>
      <DesignProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </DesignProvider>
    </ThemeProvider>
  );
}
