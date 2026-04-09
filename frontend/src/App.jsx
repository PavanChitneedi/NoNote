import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme, THEMES } from "./context/ThemeContext.jsx";
import LoginPage   from "./components/LoginPage.jsx";
import Dashboard   from "./components/Dashboard.jsx";
import NodeCanvas  from "./components/NodeCanvas.jsx";
import AdminPanel  from "./components/AdminPanel.jsx";
import ThemePicker from "./components/ThemePicker.jsx";
import UserProfile from "./components/UserProfile.jsx";

function AppInner() {
  const { user, loading, logout } = useAuth();
  const { themeName }             = useTheme();
  const [view,        setView]        = useState({ page: "dashboard", mapId: null });
  const [showThemes,  setShowThemes]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const goHome    = () => setView({ page: "dashboard", mapId: null });
  const openMap   = id => setView({ page: "canvas",    mapId: id });
  const openAdmin = ()  => setView({ page: "admin",    mapId: null });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--text4)", fontFamily: "monospace" }}>
        <div style={{ fontSize: 38, marginBottom: 12 }}>⬡</div>
        <div style={{ fontSize: 12, letterSpacing: 2 }}>LOADING…</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const showHeader = view.page !== "canvas";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* ── Global header ── */}
      {showHeader && (
        <div style={{ height: 50, background: "var(--bg2)", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", flexShrink: 0, position: "sticky", top: 0, zIndex: 20 }}>

          <span onClick={goHome} title="Home" style={{ fontSize: 22, cursor: "pointer", userSelect: "none" }}>⬡</span>
          <span onClick={goHome} style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", letterSpacing: 1.5, cursor: "pointer", flex: 1 }}>
            NodeMap
          </span>

          {view.page === "admin" && (
            <button onClick={goHome} style={headerBtn}>← BACK</button>
          )}

          {/* Appearance button — opens unified ThemePicker */}
          <button onClick={() => setShowThemes(true)} style={headerBtn} title="Themes, canvas color & text size">
            {THEMES[themeName]?.icon} Appearance
          </button>

          {/* Avatar → profile */}
          <div onClick={() => setShowProfile(true)} title="My profile"
            style={{ width: 32, height: 32, borderRadius: "50%", background: user.avatar_color || "#6C63FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, cursor: "pointer" }}>
            {user.display_name?.[0]?.toUpperCase()}
          </div>

          {["owner", "admin"].includes(user.role) && (
            <button onClick={openAdmin} style={headerBtn}>⚙ ADMIN</button>
          )}

          <button onClick={logout} style={{ ...headerBtn, color: "var(--danger)" }}>→ OUT</button>
        </div>
      )}

      {/* ── Page ── */}
      <div style={{ flex: 1, overflow: view.page === "canvas" ? "hidden" : "auto" }}>
        {view.page === "dashboard" && <Dashboard onOpenMap={openMap} onOpenAdmin={openAdmin} />}
        {view.page === "canvas" && view.mapId && (
          <NodeCanvas
            mapId={view.mapId}
            onBack={goHome}
            onHome={goHome}
            onOpenAppearance={() => setShowThemes(true)}
          />
        )}
        {view.page === "admin"  && <AdminPanel onBack={goHome} />}
      </div>

      {/* Unified appearance modal — no canvas props here, canvas opens its own */}
      {showThemes  && <ThemePicker onClose={() => setShowThemes(false)} defaultTab="global" />}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
}

const headerBtn = {
  padding: "6px 12px", background: "var(--bg3)", border: "none",
  borderRadius: 7, color: "var(--text3)", cursor: "pointer",
  fontSize: 11, fontWeight: 700, fontFamily: "inherit",
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
