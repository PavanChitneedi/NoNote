import { useTheme, THEMES } from "../context/ThemeContext.jsx";

export default function ThemePicker({ onClose }) {
  const { themeName, setThemeName } = useTheme();

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:400, padding:16 }}
      onClick={onClose}>
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:16, padding:24, width:"100%", maxWidth:400 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>🎨 Themes</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:22 }}>×</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <div key={key}
              onClick={() => { setThemeName(key); onClose(); }}
              style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"14px 16px", borderRadius:10, cursor:"pointer",
                border:`2px solid ${themeName===key ? "var(--accent)" : "var(--border)"}`,
                background: themeName===key ? "var(--accent2)22" : "var(--bg3)",
                transition:"all .15s",
              }}
              onMouseEnter={e => { if(themeName!==key) e.currentTarget.style.borderColor="var(--accent)"; }}
              onMouseLeave={e => { if(themeName!==key) e.currentTarget.style.borderColor="var(--border)"; }}
            >
              <span style={{ fontSize:24 }}>{t.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{t.name}</div>
                <div style={{ display:"flex", gap:6, marginTop:6 }}>
                  {["--bg","--bg2","--accent","--success","--danger"].map(v => (
                    <div key={v} style={{ width:16, height:16, borderRadius:4, background:t.vars[v], border:"1px solid rgba(255,255,255,.1)" }} />
                  ))}
                </div>
              </div>
              {themeName===key && (
                <span style={{ color:"var(--accent)", fontSize:18 }}>✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
