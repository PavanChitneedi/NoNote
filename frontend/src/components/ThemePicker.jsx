import { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import { useSkin } from "../context/SkinContext.jsx";
import { SKINS, SKIN_KEYS } from "../skins.js";

// Compact theme chip strip — rendered inside the Skins tab
function ThemeStrip({ selected, onSelect }) {
  const groups = ["Dark", "Light"];
  return (
    <div style={{ marginTop:14, padding:"12px 14px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:10 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--text)", marginBottom:10 }}>Color Theme</div>
      {groups.map(g => {
        const items = Object.entries(THEMES).filter(([,t]) => t.group === g);
        return (
          <div key={g} style={{ marginBottom:8 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:6 }}>{g.toUpperCase()}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {items.map(([key, t]) => {
                const active = selected === key;
                return (
                  <button key={key} onClick={e => { e.stopPropagation(); onSelect(key); }}
                    title={t.name}
                    style={{
                      display:"flex", alignItems:"center", gap:5, padding:"4px 9px",
                      border:`2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      borderRadius:20, cursor:"pointer", background: active ? "var(--accent2)18" : "var(--bg2)",
                      transition:"border-color .12s", userSelect:"none",
                    }}>
                    <div style={{ display:"flex", gap:2 }}>
                      {["--bg","--accent","--success"].map(v => (
                        <div key={v} style={{ width:8, height:8, borderRadius:"50%", background:t.vars[v], border:"1px solid rgba(0,0,0,.12)" }}/>
                      ))}
                    </div>
                    <span style={{ fontSize:10, fontWeight:active?700:500, color: active ? "var(--accent)" : "var(--text3)" }}>{t.name}</span>
                    {active && <span style={{ fontSize:9, color:"var(--accent)" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ThemePicker({
  onClose,
  canvasTheme,
  setCanvasTheme,
  defaultTab = "skins",
}) {
  const { themeName, setThemeName, fontScale, setFontScale } = useTheme();
  const { skinName, setSkinName } = useSkin();
  const [tab, setTab]         = useState(defaultTab);
  const [fontInput, setFontInput] = useState(String(fontScale));

  const hasCanvas = canvasTheme !== undefined && setCanvasTheme !== undefined;
  const tabs = [
    { id:"skins",  label:"✨ Skins" },
    ...(hasCanvas ? [{ id:"canvas", label:"🎨 Canvas" }] : []),
    { id:"text",   label:"🔤 Text Size" },
  ];

  // Canvas-only theme grid (still needed for canvas tab)
  const ThemeGrid = ({ sel, onSel }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:8 }}>
      {["Dark","Light"].map(group => {
        const grouped = Object.entries(THEMES).filter(([,t]) => t.group === group);
        return (
          <div key={group}>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:8 }}>{group.toUpperCase()}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:8 }}>
              {grouped.map(([key, t]) => (
                <div key={key} onClick={e => { e.stopPropagation(); onSel(key); }}
                  style={{
                    padding:"10px 12px", borderRadius:"var(--radius-md)", cursor:"pointer",
                    border:`2px solid ${sel===key?"var(--accent)":"var(--border)"}`,
                    background: sel===key?"var(--accent2)18":"var(--bg3)",
                    display:"flex", alignItems:"center", gap:10, userSelect:"none",
                  }}>
                  <span style={{ fontSize:20 }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text)" }}>{t.name}</div>
                    <div style={{ display:"flex", gap:3, marginTop:5 }}>
                      {["--bg","--bg2","--accent","--success","--danger"].map(v => (
                        <div key={v} style={{ width:11, height:11, borderRadius:3, background:t.vars[v], border:"1px solid rgba(0,0,0,.12)" }}/>
                      ))}
                    </div>
                  </div>
                  {sel===key && <span style={{ color:"var(--accent)", fontSize:16 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      data-ui="theme-picker" data-component="ThemePicker" data-page="global" data-role="modal"
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1200, padding:16 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, width:"100%", maxWidth:680, height:"88vh", maxHeight:680, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>⚙</span>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text)", flex:1 }}>Appearance</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:22, lineHeight:1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, padding:"8px 16px", borderBottom:"1px solid var(--border2)", flexShrink:0, flexWrap:"wrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={e => { e.stopPropagation(); setTab(t.id); }}
              style={{ padding:"7px 14px", border:"none", borderRadius:"var(--radius-sm)", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", flexShrink:0,
                background: tab===t.id ? "var(--accent2)" : "var(--bg3)",
                color:      tab===t.id ? "#fff"           : "var(--text3)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"16px 20px", minHeight:0 }}>

          {/* ── Skins ── */}
          {tab==="skins" && (() => { try { return (
            <div>
              <div style={{ fontSize:11, color:"var(--text4)", marginBottom:14, lineHeight:1.6 }}>
                Each skin is a complete visual overhaul — fonts, shapes, shadows, and special effects.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {SKIN_KEYS.map(key => {
                  const s = SKINS[key];
                  const active = skinName === key;
                  const isDark = (s.tags||[]).some(t=>["Dark","Neon","Technical","Industrial","Bold","Atmospheric"].includes(t));
                  const bg0 = isDark ? "#0d1117" : "#f5f5f0";
                  const bg1 = isDark ? "#161b22" : "#ffffff";
                  const acc = isDark ? "#58a6ff" : "#6366f1";
                  return (
                    <div key={key} onClick={() => setSkinName(key)}
                      style={{
                        borderRadius:8, cursor:"pointer", overflow:"hidden",
                        border:active?"2px solid var(--accent)":"2px solid var(--border)",
                        background: bg1, transition:"transform 0.14s, border-color 0.14s", userSelect:"none",
                      }}
                      onMouseEnter={e => { if(!active){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="var(--accent)";}}}
                      onMouseLeave={e => { if(!active){e.currentTarget.style.transform="";e.currentTarget.style.borderColor="rgba(128,128,128,0.25)";}}}
                    >
                      <div style={{ height:80, background:bg0, position:"relative", overflow:"hidden", padding:"8px 8px 0" }}>
                        <div style={{ height:8, background:bg1, borderRadius:"2px 2px 0 0", marginBottom:4,
                          border:`1px solid ${acc||"#888"}44`, display:"flex", alignItems:"center", gap:2, padding:"0 4px" }}>
                          <div style={{ width:4, height:4, borderRadius:"50%", background:acc, opacity:.8 }}/>
                          <div style={{ flex:1, height:2, background:acc, opacity:.3, borderRadius:1 }}/>
                        </div>
                        <div style={{ display:"flex", gap:3 }}>
                          {[0.9,0.6,0.75].map((op,i)=>(
                            <div key={i} style={{ flex:1, height:28, background:bg1, borderRadius:2,
                              border:`1px solid ${acc}${Math.floor(op*50).toString(16).padStart(2,'0')}`, opacity:op }}/>
                          ))}
                        </div>
                        {active && (
                          <div style={{ position:"absolute", top:4, right:6, background:"var(--accent)",
                            borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:10, color:"#fff", fontWeight:800 }}>✓</div>
                        )}
                      </div>
                      <div style={{ padding:"8px 10px", background:bg1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          <span style={{ fontSize:14 }}>{s.icon}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:isDark?"#e6edf3":"#1a1a2e" }}>{s.name}</span>
                        </div>
                        <div style={{ fontSize:9, color:isDark?"#7d8590":"#666", opacity:.65, marginBottom:5, lineHeight:1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{s.concept||""}</div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
                          <span style={{ fontSize:8, padding:"1px 6px", borderRadius:8,
                            background:"var(--accent2)22", color:"var(--accent2)",
                            border:"1px solid var(--accent2)44", fontWeight:700 }}>
                            {s.nav==="top"?"⬆ Top Nav":s.nav==="bottom"?"⬇ Dock":s.nav==="icon-dock"?"◀ Icon":s.nav==="editorial"?"⬛ Full":"?"}
                          </span>
                          {(s.tags||[]).slice(0,2).map(t=>(
                            <span key={t} style={{ fontSize:8, color:isDark?"#7d8590":"#666", opacity:.6 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active skin description */}
              <div style={{ marginTop:12, padding:"10px 14px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:18 }}>{SKINS[skinName]?.icon}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{SKINS[skinName]?.name}</span>
                  <span style={{ fontSize:9, padding:"2px 8px", borderRadius:10,
                    background:"var(--accent2)22", color:"var(--accent2)", border:"1px solid var(--accent2)44" }}>
                    {SKINS[skinName]?.nav==="top"?"⬆ Top Nav":SKINS[skinName]?.nav==="bottom"?"⬇ Bottom Dock":SKINS[skinName]?.nav==="icon-dock"?"◀ Icon Dock":SKINS[skinName]?.nav==="editorial"?"⬛ Editorial":"?"}
                  </span>
                </div>
                <div style={{ fontSize:11, color:"var(--text3)", lineHeight:1.6, fontStyle:"italic" }}>
                  "{SKINS[skinName]?.concept}"
                </div>
              </div>

              {/* Compact theme strip */}
              <ThemeStrip selected={themeName} onSelect={key => setThemeName(key)} />
            </div>
          ); } catch(err) { return <div style={{color:"var(--danger)",padding:16,fontSize:11}}>Error: {err?.message}</div>; } })()}

          {/* ── Canvas Theme ── */}
          {tab==="canvas" && hasCanvas && (
            <>
              <div
                onClick={e => { e.stopPropagation(); setCanvasTheme("global"); }}
                style={{
                  padding:"10px 14px", borderRadius:"var(--radius-md)", cursor:"pointer", marginBottom:12,
                  border:`2px solid ${canvasTheme==="global"?"var(--accent)":"var(--border)"}`,
                  background: canvasTheme==="global"?"var(--accent2)18":"var(--bg3)",
                  display:"flex", alignItems:"center", gap:10, userSelect:"none",
                }}>
                <span style={{ fontSize:20 }}>🔗</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text)" }}>Follow Global Theme</div>
                  <div style={{ fontSize:11, color:"var(--text4)" }}>Canvas follows whatever global theme is selected</div>
                </div>
                {canvasTheme==="global" && <span style={{ color:"var(--accent)", fontSize:16, marginLeft:"auto" }}>✓</span>}
              </div>
              <ThemeGrid sel={canvasTheme} onSel={key => setCanvasTheme(key)} />
            </>
          )}

          {/* ── Text Size ── */}
          {tab==="text" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ fontSize:12, color:"var(--text3)" }}>Adjusts the base font size across the application.</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[{l:"XS",v:75},{l:"S",v:85},{l:"M",v:100},{l:"L",v:115},{l:"XL",v:130},{l:"XXL",v:150}].map(p => (
                  <button key={p.l}
                    onClick={e => { e.stopPropagation(); setFontScale(p.v); setFontInput(String(p.v)); }}
                    style={{ padding:"8px 16px", border:`2px solid ${fontScale===p.v?"var(--accent)":"var(--border)"}`,
                      borderRadius:"var(--radius-sm)", cursor:"pointer", fontSize:12, fontFamily:"inherit",
                      background: fontScale===p.v?"var(--accent2)18":"var(--bg3)",
                      color: fontScale===p.v?"var(--accent)":"var(--text3)", fontWeight:600 }}>
                    {p.l}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input type="range" min={60} max={200} value={fontScale}
                  onChange={e => { setFontScale(Number(e.target.value)); setFontInput(e.target.value); }}
                  style={{ flex:1 }}/>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <input type="number" min={60} max={200} value={fontInput}
                    onChange={e => setFontInput(e.target.value)}
                    onBlur={() => setFontScale(Number(fontInput))}
                    onKeyDown={e => e.key==="Enter" && setFontScale(Number(fontInput))}
                    style={{ width:56, padding:"6px 8px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:12, fontFamily:"inherit", outline:"none", textAlign:"center" }}/>
                  <span style={{ fontSize:12, color:"var(--text4)" }}>%</span>
                </div>
              </div>
              <div style={{ fontSize:13, padding:"10px 14px", background:"var(--bg3)", borderRadius:"var(--radius-sm)", color:"var(--text2)" }}>
                Preview: The quick brown fox jumps over the lazy dog.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
