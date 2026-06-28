import { useTheme, THEMES, THEME_KEYS } from "../context/ThemeContext.jsx";

const ACCENT_COLORS = [
  "#7b8cff","#a78bfa","#f59e0b","#f87171","#4ade80",
  "#38bdf8","#fb923c","#e879f9","#34d399","#f472b6",
];

export default function ThemePicker({ onClose }) {
  const { themeName, setThemeName } = useTheme();

  const setAccent = (color) => {
    document.documentElement.style.setProperty("--accent", color);
    // Darken slightly for accent2
    document.documentElement.style.setProperty("--accent2", color + "cc");
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      background:"rgba(0,0,0,0.6)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div className="nn-modal-in" style={{
        background:"var(--bg2)", border:"1px solid var(--border)",
        borderRadius:"var(--radius-lg)", padding:28, width:480,
        boxShadow:"var(--shadow-panel)",
      }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>Appearance</div>
            <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>Choose your mood</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",
            color:"var(--text3)",fontSize:20,cursor:"pointer",padding:4}}>×</button>
        </div>

        {/* 6 Mood Cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
          {THEME_KEYS.map(key => {
            const t = THEMES[key];
            const isActive = themeName === key;
            const bg = t.vars["--bg2"];
            const accent = t.vars["--accent"];
            const text = t.vars["--text"];
            const textMuted = t.vars["--text3"];
            return (
              <button key={key} onClick={()=>setThemeName(key)} style={{
                background: bg,
                border: `2px solid ${isActive ? accent : "transparent"}`,
                borderRadius:"var(--radius-md)",
                padding:"14px 16px",
                cursor:"pointer",
                textAlign:"left",
                position:"relative",
                boxShadow: isActive ? `0 0 0 1px ${accent}44, 0 4px 16px rgba(0,0,0,0.2)` : "0 2px 8px rgba(0,0,0,0.15)",
                transition:"all 0.15s var(--ease-out)",
              }}>
                {/* Mini preview dots */}
                <div style={{display:"flex",gap:4,marginBottom:10}}>
                  {[accent, t.vars["--text2"], textMuted].map((c,i)=>(
                    <div key={i} style={{width:8,height:8,borderRadius:"50%",background:c}}/>
                  ))}
                  <div style={{flex:1}}/>
                  {isActive && <div style={{fontSize:10,color:accent,fontWeight:700}}>✓</div>}
                </div>
                {/* Mini node preview */}
                <div style={{background:t.vars["--node-bg"],borderRadius:6,
                  padding:"6px 8px",marginBottom:10,
                  borderTop:`2px solid ${accent}`,
                  boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>
                  <div style={{width:"60%",height:6,background:text,borderRadius:3,opacity:.8,marginBottom:4}}/>
                  <div style={{width:"40%",height:4,background:textMuted,borderRadius:3,opacity:.6}}/>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:text}}>{t.icon} {t.name}</div>
                <div style={{fontSize:10,color:textMuted,marginTop:2}}>{t.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Accent color */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",
            letterSpacing:"0.08em",marginBottom:10}}>ACCENT COLOR</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {ACCENT_COLORS.map(color=>(
              <button key={color} onClick={()=>setAccent(color)} style={{
                width:28,height:28,borderRadius:"50%",background:color,
                border:"none",cursor:"pointer",
                boxShadow:"0 2px 6px rgba(0,0,0,0.25)",
                transition:"transform 0.12s var(--ease-spring)",
              }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
