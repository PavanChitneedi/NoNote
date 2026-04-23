import { useState, useEffect, useRef, Component } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme, THEMES } from "./context/ThemeContext.jsx";
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

// Dev inspector — hover tooltip + static context badge + Ctrl+RightClick copy
function DevInspector({ view, user }) {
  const [on, setOn] = useState(() => localStorage.getItem("nodemap_dev_mode") === "true");
  const [tip, setTip] = useState(null);
  const latestRef = useRef(null);

  useEffect(() => {
    const sync = () => setOn(localStorage.getItem("nodemap_dev_mode") === "true");
    window.addEventListener("storage", sync);
    window.addEventListener("nodemap_devmode_change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("nodemap_devmode_change", sync);
    };
  }, []);

  useEffect(() => {
    if (!on) { setTip(null); return; }

    const onMove = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el.closest("[data-dev-overlay]")) { setTip(null); return; }

      const devEl = el.closest("[data-dev]");
      const devCtx = devEl?.getAttribute("data-dev") ?? null;

      const tag = el.tagName.toLowerCase();
      const label = (
        el.getAttribute("title") ||
        el.getAttribute("placeholder") ||
        el.getAttribute("aria-label") ||
        el.textContent || ""
      ).trim().replace(/\s+/g, " ").slice(0, 60);

      const elStr = `<${tag}>${label ? ` "${label}"` : ""}`;
      const refStr = devCtx
        ? `${devCtx} → ${tag}${label ? ` "${label}"` : ""}`
        : elStr;

      latestRef.current = refStr;
      setTip({ x: e.clientX, y: e.clientY, devCtx, elStr, refStr, copied: false });
    };

    const onContext = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (!latestRef.current) return;
      navigator.clipboard.writeText(latestRef.current).catch(() => {});
      setTip(t => t ? { ...t, copied: true } : t);
      setTimeout(() => setTip(t => t ? { ...t, copied: false } : t), 1500);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("contextmenu", onContext);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("contextmenu", onContext);
    };
  }, [on]);

  if (!on || !user) return null;

  const comp =
    view.page === "canvas" ? (window.innerWidth < 768 ? "MobileCanvas.jsx" : "NodeCanvas.jsx")
    : view.page === "admin" ? "AdminPanel.jsx"
    : "Dashboard.jsx";

  const tipX = tip ? Math.min(tip.x + 14, window.innerWidth - 340) : 0;
  const tipY = tip ? (tip.y + 80 > window.innerHeight ? tip.y - 72 : tip.y + 18) : 0;

  return (
    <>
      {/* Static context badge — bottom-right */}
      <div data-dev-overlay style={{
        position:"fixed", bottom:16, right:16, zIndex:9998,
        background:"rgba(10,10,18,0.94)", border:"1px solid rgba(108,99,255,0.35)",
        borderRadius:10, padding:"10px 14px", fontFamily:"monospace",
        fontSize:11, color:"#888", lineHeight:1.8, backdropFilter:"blur(6px)",
        maxWidth:280, userSelect:"text", pointerEvents:"none",
      }}>
        <div style={{color:"#6C63FF",fontWeight:700,marginBottom:2,fontSize:12,letterSpacing:1}}>🛠 DEV</div>
        <div><span style={{color:"#444"}}>page   </span>{view.page}</div>
        <div><span style={{color:"#444"}}>comp   </span>{comp}</div>
        {view.mapId && <div><span style={{color:"#444"}}>mapId  </span>{view.mapId.slice(0,8)}…</div>}
        <div><span style={{color:"#444"}}>user   </span>{user?.display_name} <span style={{color:"#6C63FF"}}>({user?.role})</span></div>
        <div><span style={{color:"#444"}}>uid    </span>{user?.id?.slice(0,8)}…</div>
      </div>

      {/* Hover tooltip */}
      {tip && (
        <div data-dev-overlay style={{
          position:"fixed", left:tipX, top:tipY, zIndex:9999, pointerEvents:"none",
          background: tip.copied ? "rgba(34,197,94,0.95)" : "rgba(10,10,18,0.97)",
          border:`1px solid ${tip.copied ? "#22c55e" : "rgba(108,99,255,0.55)"}`,
          borderRadius:8, padding:"8px 12px", fontFamily:"monospace",
          fontSize:11, color:"#bbb", lineHeight:1.65, backdropFilter:"blur(6px)",
          maxWidth:380, transition:"background .15s,border-color .15s",
        }}>
          {tip.copied ? (
            <span style={{color:"#22c55e",fontWeight:700}}>✓ Copied to clipboard</span>
          ) : (
            <>
              {tip.devCtx && <div style={{color:"#6C63FF",fontWeight:700,marginBottom:2}}>{tip.devCtx}</div>}
              <div style={{color:"#aaa"}}>{tip.elStr}</div>
              <div style={{color:"#3a3a5c",fontSize:10,marginTop:4}}>Ctrl + RightClick to copy</div>
            </>
          )}
        </div>
      )}
    </>
  );
}

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
    <div style={{ height:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>

      {/* ── Global header (dashboard + admin) ── */}
      {showHeader && (
        <div data-dev="App.jsx | global header" style={{
          height:"var(--topbar-h)", background:"var(--bg2)",
          borderBottom:"1px solid var(--border2)",
          display:"flex", alignItems:"center", gap:8,
          padding:"0 16px", flexShrink:0,
          position:"sticky", top:0, zIndex:20
        }}>
          {/* NoNote logo + name */}
          <span data-dev="App.jsx | header | logo (→ home)" onClick={goHome} title="Home"
            style={{ fontSize:22, cursor:"pointer", userSelect:"none" }}>⬡</span>
          <span onClick={goHome}
            style={{ fontSize:15, fontWeight:700, color:"var(--accent)", letterSpacing:1.5, cursor:"pointer", flex:1 }}>
            NoNote
          </span>

          {/* Back when on admin */}
          {view.page==="admin" && (
            <button data-dev="App.jsx | header | ← BACK button" onClick={goHome} style={hBtn}>← BACK</button>
          )}

          {/* Tutorial + Help */}
          <button data-dev="App.jsx | header | Tutorial button (→ Tutorial.jsx)" onClick={() => setShowTutorial(true)} style={{...hBtn, color:"var(--accent)"}} title="Interactive tutorial — learn the app step by step">
            🎓 Tutorial
          </button>
          <button data-dev="App.jsx | header | Help button (→ HelpGuide.jsx)" onClick={() => setShowHelp(true)} style={hBtn} title="Full documentation and help guide">
            ? Help
          </button>

          {/* Appearance */}
          <button data-dev="App.jsx | header | Appearance button (→ ThemePicker.jsx)" onClick={() => setShowAppearance(true)} style={hBtn} title="Theme, design & text size">
            {THEMES[themeName]?.icon} Appearance
          </button>

          {/* Avatar → profile */}
          <div data-dev="App.jsx | header | user avatar (→ UserProfile.jsx)" onClick={() => setShowProfile(true)} title="My profile"
            style={{ width:32, height:32, borderRadius:"50%", background:user.avatar_color||"#6C63FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0, cursor:"pointer" }}>
            {user.display_name?.[0]?.toUpperCase()}
          </div>

          {["owner","admin"].includes(user.role) && (
            <button data-dev="App.jsx | header | ADMIN button (→ AdminPanel.jsx)" onClick={openAdmin} style={hBtn}>⚙ ADMIN</button>
          )}

          <button data-dev="App.jsx | header | logout button" onClick={logout} style={{ ...hBtn, color:"var(--danger)" }}>→ OUT</button>
        </div>
      )}

      {/* ── Page ── */}
      <div style={{ flex:1, overflow:view.page==="canvas"?"hidden":"auto" }}>
        {view.page==="dashboard" && <Dashboard onOpenMap={openMap} onOpenAdmin={openAdmin} />}
        {view.page==="canvas" && view.mapId && (
          isMobile
            ? <MobileErrorBoundary onBack={goHome}><MobileCanvas mapId={view.mapId} onBack={goHome} /></MobileErrorBoundary>
            : <NodeCanvas mapId={view.mapId} onBack={goHome} onHome={goHome} />
        )}
        {view.page==="admin" && <AdminPanel onBack={goHome} />}
      </div>

      {/* Appearance modal */}
      {showAppearance && <ThemePicker onClose={() => setShowAppearance(false)} defaultTab="global"/>}
      {showTutorial && <Tutorial page={view.page==="canvas" ? "canvas" : "dashboard"} onClose={() => setShowTutorial(false)} />}
      {showHelp     && <HelpGuide onClose={() => setShowHelp(false)} />}
      {showProfile    && <UserProfile onClose={() => setShowProfile(false)} />}
      <DevInspector view={view} user={user} />
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
