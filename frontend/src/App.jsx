import { useState, useEffect, Component } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme, THEMES } from "./context/ThemeContext.jsx";
import { SkinProvider, useSkin } from "./context/SkinContext.jsx";
import { DesignProvider } from "./context/DesignContext.jsx";
import { DevModeProvider, useDevMode } from "./context/DevModeContext.jsx";
import LoginPage    from "./components/LoginPage.jsx";
import Dashboard    from "./components/Dashboard.jsx";
import NodeCanvas   from "./components/NodeCanvas.jsx";
import MobileCanvas from "./components/MobileCanvas.jsx";
import AdminPanel   from "./components/AdminPanel.jsx";
import ThemePicker  from "./components/ThemePicker.jsx";
import UserProfile  from "./components/UserProfile.jsx";
import Tutorial     from "./components/Tutorial.jsx";
import HelpGuide    from "./components/HelpGuide.jsx";
import DesignSystemProvider from "./ui/DesignSystemProvider.jsx";
import { Button, QuickActionButton, ToggleButton } from "./components/ui/uiPrimitivesV2.jsx";

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
        <Button variant="secondary" onClick={this.props.onBack}
          style={{padding:"12px 24px",background:"var(--accent2)",
            borderRadius:10,color:"var(--on-accent)",fontSize:14,fontWeight:700}}>
          ← Back
        </Button>
      </div>
    );
    return this.props.children;
  }
}

function AppInner() {
  const { user, loading, logout } = useAuth();
  const { skin, skinVariant } = useSkin();
  const { themeName }             = useTheme();
  const { devMode, setDevMode }    = useDevMode();
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

  const goHome    = () => { setView({ page:"dashboard", mapId:null }); window.history.pushState({page:"dashboard"}, ""); window.location.hash = "dashboard"; };
  const openMap   = id => { setView({ page:"canvas",    mapId:id   }); window.history.pushState({page:"canvas",mapId:id}, ""); window.location.hash = `canvas/${id}`; };
  const openAdmin = ()  => { setView({ page:"admin",    mapId:null }); window.history.pushState({page:"admin"}, ""); window.location.hash = "admin"; };

  // Handle browser back/forward + hash routing
  useEffect(() => {
    const parseHash = () => {
      const h = window.location.hash.replace("#","");
      if (h.startsWith("canvas/")) { const id=h.slice(7); if(id) return {page:"canvas",mapId:id}; }
      if (h === "admin") return {page:"admin",mapId:null};
      if (h === "live")  return {page:"dashboard",mapId:null,tab:"live"};
      return {page:"dashboard",mapId:null};
    };
    const onPop = () => { const v=parseHash(); setView({page:v.page,mapId:v.mapId||null}); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    // Restore from hash on load
    const initial = parseHash();
    if (initial.page !== "dashboard" || initial.mapId) setView({page:initial.page,mapId:initial.mapId||null});
    if (!window.history.state) window.history.replaceState({page:"dashboard"}, "");
    return () => { window.removeEventListener("popstate", onPop); window.removeEventListener("hashchange", onPop); };
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
      {view.page==="admin" && <Button variant="secondary" onClick={goHome}>← Back</Button>}
      <Button variant="ghost" onClick={() => setShowTutorial(true)} title="Tutorial" data-ui="topbar-tutorial" data-component="Topbar" data-page="global" data-role="nav-btn">🎓</Button>
      <Button variant="ghost" onClick={() => setShowHelp(true)} title="Help" data-ui="topbar-help" data-component="Topbar" data-page="global" data-role="nav-btn">?</Button>
      <Button variant="secondary" onClick={() => setShowAppearance(true)} title="Appearance">{THEMES[skinVariant || themeName]?.icon || "🎨"}</Button>
      {["owner","admin"].includes(user.role) && <Button variant="ghost" onClick={openAdmin}>⚙</Button>}
      <div onClick={() => setShowProfile(true)}
        style={{ width:28, height:28, borderRadius:"50%", background:user.avatar_color||"var(--accent2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:700, color:"var(--on-accent)", cursor:"pointer", flexShrink:0 }}>
        {user.display_name?.[0]?.toUpperCase()}
      </div>
      <ToggleButton onClick={()=>setDevMode(!devMode)} title={devMode?"Exit Dev Mode":"Dev Mode (Ctrl+Shift+D)"}
        data-ui="topbar-devmode-toggle" data-component="Topbar" data-page="global" data-role="toggle"
        data-state={devMode?"active":"default"}
        pressed={devMode} className="app-dev-toggle">DEV</ToggleButton>
      <Button variant="destructive" onClick={logout} className="app-logout-btn" data-ui="topbar-logout" data-component="Topbar" data-page="global" data-role="action-btn">✕</Button>
    </div>
  );
  const navActionsCol = (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"stretch", gap:2 }}>
      <Button variant="ghost" onClick={() => setShowTutorial(true)} className="app-dock-btn" title="Tutorial" data-ui="topbar-tutorial" data-component="Topbar" data-page="global" data-role="nav-btn">🎓</Button>
      <Button variant="ghost" onClick={() => setShowHelp(true)} className="app-dock-btn" title="Help" data-ui="topbar-help" data-component="Topbar" data-page="global" data-role="nav-btn">?</Button>
      <Button variant="secondary" onClick={() => setShowAppearance(true)} className="app-dock-btn" title="Appearance">{THEMES[skinVariant || themeName]?.icon || "🎨"}</Button>
      {["owner","admin"].includes(user.role) && <Button variant="ghost" onClick={openAdmin} className="app-dock-btn" title="Admin">⚙</Button>}
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
      {showAppearance && <ThemePicker onClose={() => setShowAppearance(false)} defaultTab="skins"/>}
      {showTutorial && <Tutorial page={view.page==="canvas" ? "canvas" : "dashboard"} onClose={() => setShowTutorial(false)} />}
      {showHelp     && <HelpGuide onClose={() => setShowHelp(false)} />}
      {showProfile    && <UserProfile onClose={() => setShowProfile(false)} />}
    </>
  );

  // ── TOP NAV layout (standard) ─────────────────────────────
  if (navType === "top") return (
    <div style={{ height:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {showHeader && (
        <div className="nn-topbar" data-ui="topbar-shell" data-component="Topbar" data-page="global" data-role="navbar" style={{
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
          {view.page==="admin" && <Button variant="ghost" onClick={goHome} className="app-dock-btn" title="Back">←</Button>}
          {navActionsCol}
          <div style={{ flex:1 }}/>
          <div onClick={() => setShowProfile(true)}
            style={{ width:32, height:32, borderRadius:"50%", background:user.avatar_color||"var(--accent2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, color:"var(--on-accent)", cursor:"pointer", marginBottom:4 }}>
            {user.display_name?.[0]?.toUpperCase()}
          </div>
          <ToggleButton onClick={()=>setDevMode(!devMode)} title={devMode?"Exit Dev Mode":"Dev Mode"}
            data-ui="topbar-devmode-toggle" data-component="Topbar" data-page="global" data-role="toggle"
            data-state={devMode?"active":"default"}
            pressed={devMode} className="app-dock-btn">DEV</ToggleButton>
          <Button variant="destructive" onClick={logout} className="app-dock-btn app-logout-btn" title="Logout">✕</Button>
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

export default function App() {
  return (
    <ThemeProvider>
      <DesignProvider>
        <SkinProvider>
          <DesignSystemProvider>
            <DevModeProvider>
              <AuthProvider>
                <AppInner />
              </AuthProvider>
            </DevModeProvider>
          </DesignSystemProvider>
        </SkinProvider>
      </DesignProvider>
    </ThemeProvider>
  );
}
