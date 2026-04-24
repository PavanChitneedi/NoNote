import { useState, useEffect, Component } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme, THEMES } from "./context/ThemeContext.jsx";
import { SkinProvider, useSkin } from "./context/SkinContext.jsx";
import { DesignProvider } from "./context/DesignContext.jsx";
import LoginPage    from "./components/LoginPage.jsx";
import Dashboard    from "./components/Dashboard.jsx";
import NodeCanvas   from "./components/NodeCanvas.jsx";
import MobileCanvas from "./components/MobileCanvas.jsx";
import AdminPanel   from "./components/AdminPanel.jsx";
import ThemePicker  from "./components/ThemePicker.jsx";
import UserProfile  from "./components/UserProfile.jsx";
import Tutorial     from "./components/Tutorial.jsx";
import HelpGuide    from "./components/HelpGuide.jsx";

// Error boundary so a MobileCanvas crash shows an error instead of blank screen
class MobileErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false, err: "" }; }
  static getDerivedStateFromError(e) { return { crashed: true, err: e?.message || "Unknown error" }; }
  render() {
    if (this.state.crashed) return (
      <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",
        alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24}}>
        <div style={{fontSize:36}}>⬡</div>
        <div style={{fontSize:12,color:"var(--danger)",textAlign:"center",lineHeight:1.5}}>
          {this.state.err}
        </div>
        <button onClick={this.props.onBack}
          style={{padding:"12px 24px",background:"var(--accent2)",border:"none",
            borderRadius:10,color:"#fff",fontSize:14,cursor:"pointer",fontWeight:700}}>
          ← Back
        </button>
      </div>
    );
    return this.props.children;
  }
}

function AppInner() {
  const { user, loading, logout } = useAuth();
  const { setThemeName } = useTheme();
  const { skin } = useSkin();
  const { themeName }             = useTheme();
  const [view,         setView]         = useState({ page:"dashboard", mapId:null });
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || (window.innerWidth < 1024 && "ontouchstart" in window));
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp,     setShowHelp]     = useState(false);

  const goHome    = () => { setView({ page:"dashboard", mapId:null }); window.history.pushState({page:"dashboard"}, ""); };
  const openMap   = id => { setView({ page:"canvas",    mapId:id   }); window.history.pushState({page:"canvas",mapId:id}, ""); };
  const openAdmin = ()  => { setView({ page:"admin",    mapId:null }); window.history.pushState({page:"admin"}, ""); };

  // Handle browser back/forward
  useEffect(() => {
    const onPop = (e) => {
      const state = e.state;
      if (!state || state.page === "dashboard") setView({ page:"dashboard", mapId:null });
      else if (state.page === "canvas" && state.mapId) setView({ page:"canvas", mapId:state.mapId });
      else if (state.page === "admin") setView({ page:"admin", mapId:null });
      else setView({ page:"dashboard", mapId:null });
    };
    window.addEventListener("popstate", onPop);
    // Set initial history state so back from dashboard goes nowhere inside the app
    if (!window.history.state) window.history.replaceState({page:"dashboard"}, "");
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Handle skin force-theme events
  useEffect(() => {
    const handler = (e) => {
      if (e.detail && setThemeName) setThemeName(e.detail);
    };
    window.addEventListener("nn-skin-force-theme", handler);
    return () => window.removeEventListener("nn-skin-force-theme", handler);
  }, []);

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
  const navType = skin?.nav || "top";

  // ── Shared nav elements (inline, not components) ───────────
  const navLogo = (
    <div onClick={goHome} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", userSelect:"none" }}>
      <span style={{ fontSize:20 }}>⬡</span>
      <span style={{ fontSize:14, fontWeight:800, color:"var(--accent)", letterSpacing:1 }}>NoNote</span>
    </div>
  );
  const navActions = (
    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
      {view.page==="admin" && <button onClick={goHome} style={hBtn}>← Back</button>}
      <button onClick={() => setShowTutorial(true)} style={hBtn} title="Tutorial">🎓</button>
      <button onClick={() => setShowHelp(true)} style={hBtn} title="Help">?</button>
      <button onClick={() => setShowAppearance(true)} style={hBtn} title="Appearance">{THEMES[themeName]?.icon}</button>
      {["owner","admin"].includes(user.role) && <button onClick={openAdmin} style={hBtn}>⚙</button>}
      <div onClick={() => setShowProfile(true)}
        style={{ width:28, height:28, borderRadius:"50%", background:user.avatar_color||"var(--accent2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer", flexShrink:0 }}>
        {user.display_name?.[0]?.toUpperCase()}
      </div>
      <button onClick={logout} style={{ ...hBtn, color:"var(--danger)" }}>✕</button>
    </div>
  );
  const navActionsCol = (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"stretch", gap:2 }}>
      <button onClick={() => setShowTutorial(true)} style={{...hBtn,padding:"8px",fontSize:14,width:40}} title="Tutorial">🎓</button>
      <button onClick={() => setShowHelp(true)} style={{...hBtn,padding:"8px",fontSize:14,width:40}} title="Help">?</button>
      <button onClick={() => setShowAppearance(true)} style={{...hBtn,padding:"8px",fontSize:14,width:40}} title="Appearance">{THEMES[themeName]?.icon}</button>
      {["owner","admin"].includes(user.role) && <button onClick={openAdmin} style={{...hBtn,padding:"8px",fontSize:14,width:40}} title="Admin">⚙</button>}
    </div>
  );

  const pageContent = (
    <>
      {view.page==="dashboard" && <Dashboard onOpenMap={openMap} onOpenAdmin={openAdmin} skinNav={navType} />}
      {view.page==="canvas" && view.mapId && (
        isMobile
          ? <MobileErrorBoundary onBack={goHome}><MobileCanvas mapId={view.mapId} onBack={goHome} /></MobileErrorBoundary>
          : <NodeCanvas mapId={view.mapId} onBack={goHome} onHome={goHome} />
      )}
      {view.page==="admin" && <AdminPanel onBack={goHome} />}
    </>
  );

  const modals = (
    <>
      {showAppearance && <ThemePicker onClose={() => setShowAppearance(false)} defaultTab="global"/>}
      {showTutorial && <Tutorial page={view.page==="canvas" ? "canvas" : "dashboard"} onClose={() => setShowTutorial(false)} />}
      {showHelp     && <HelpGuide onClose={() => setShowHelp(false)} />}
      {showProfile    && <UserProfile onClose={() => setShowProfile(false)} />}
    </>
  );

  // ── TOP NAV layout (standard) ─────────────────────────────
  if (navType === "top") return (
    <div style={{ height:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {showHeader && (
        <div className="nn-topbar" style={{
          height:"var(--topbar-h,48px)", background:"var(--topbar-bg,var(--bg2))",
          borderBottom:"var(--topbar-border,1px solid var(--border2))",
          backdropFilter:"var(--topbar-blur,none)", WebkitBackdropFilter:"var(--topbar-blur,none)",
          display:"flex", alignItems:"center", padding:"0 20px", flexShrink:0,
          position:"sticky", top:0, zIndex:20
        }}>
          {navLogo}
          <div style={{ flex:1 }}/>
          {navActions}
        </div>
      )}
      <div style={{ flex:1, overflow:view.page==="canvas"?"hidden":"auto" }}>{pageContent}</div>
      {modals}
    </div>
  );

  // ── BOTTOM NAV layout (brutalist, neon tokyo, coral, pastel) ─
  if (navType === "bottom") return (
    <div style={{ height:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ flex:1, overflow:view.page==="canvas"?"hidden":"auto", paddingBottom:view.page!=="canvas"?60:0 }}>{pageContent}</div>
      {view.page !== "canvas" && (
        <div className="nn-topbar" style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:30,
          height:60, background:"var(--topbar-bg,var(--bg2))",
          borderTop:"var(--topbar-border,1px solid var(--border2))",
          backdropFilter:"var(--topbar-blur,none)", WebkitBackdropFilter:"var(--topbar-blur,none)",
          display:"flex", alignItems:"center", padding:"0 20px", gap:0,
        }}>
          {navLogo}
          <div style={{ flex:1 }}/>
          {navActions}
        </div>
      )}
      {modals}
    </div>
  );

  // ── ICON DOCK layout (neumorphic, sakura, carbon) ────────────
  if (navType === "icon-dock") return (
    <div style={{ height:"100vh", background:"var(--bg)", display:"flex", overflow:"hidden" }}>
      {view.page !== "canvas" && (
        <div className="nn-topbar" style={{
          width:56, flexShrink:0, background:"var(--topbar-bg,var(--bg2))",
          borderRight:"var(--topbar-border,1px solid var(--border2))",
          display:"flex", flexDirection:"column", alignItems:"center",
          padding:"12px 0", gap:4, zIndex:20, overflowY:"auto",
        }}>
          <div onClick={goHome} style={{ fontSize:22, cursor:"pointer", userSelect:"none", marginBottom:12 }}>⬡</div>
          {view.page==="admin" && <button onClick={goHome} style={{...hBtn,padding:"8px",fontSize:14,width:40}} title="Back">←</button>}
          {navActionsCol}
          <div style={{ flex:1 }}/>
          <div onClick={() => setShowProfile(true)}
            style={{ width:32, height:32, borderRadius:"50%", background:user.avatar_color||"var(--accent2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer", marginBottom:4 }}>
            {user.display_name?.[0]?.toUpperCase()}
          </div>
          <button onClick={logout} style={{...hBtn,padding:"6px",fontSize:11,width:40,color:"var(--danger)"}} title="Logout">✕</button>
        </div>
      )}
      <div style={{ flex:1, overflow:view.page==="canvas"?"hidden":"auto" }}>{pageContent}</div>
      {modals}
    </div>
  );

  // ── EDITORIAL layout (vapor, newspaper) — full width, minimal nav ─
  if (navType === "editorial") return (
    <div style={{ height:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {showHeader && (
        <div className="nn-topbar" style={{
          height:"var(--topbar-h,56px)", background:"var(--topbar-bg,var(--bg2))",
          borderBottom:"var(--topbar-border,1px solid var(--border2))",
          backdropFilter:"var(--topbar-blur,none)", WebkitBackdropFilter:"var(--topbar-blur,none)",
          display:"flex", alignItems:"center", padding:"0 32px", flexShrink:0,
          position:"sticky", top:0, zIndex:20, gap:24,
        }}>
          {navLogo}
          <div style={{ flex:1, textAlign:"center", fontSize:11, color:"var(--text4)", letterSpacing:"0.2em", textTransform:"uppercase" }}>
            {view.page === "admin" ? "ADMINISTRATION" : "NONOTE DIAGRAMMING"}
          </div>
          {navActions}
        </div>
      )}
      <div style={{ flex:1, overflow:view.page==="canvas"?"hidden":"auto" }}>{pageContent}</div>
      {modals}
    </div>
  );

  // fallback
  return null;
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
        <SkinProvider>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </SkinProvider>
      </DesignProvider>
    </ThemeProvider>
  );
}
