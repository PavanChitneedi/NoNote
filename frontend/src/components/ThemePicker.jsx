import { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import { useDesign, DESIGNS } from "../context/DesignContext.jsx";
import { useSkin } from "../context/SkinContext.jsx";
import { SKINS, SKIN_KEYS } from "../skins.js";

const THEME_GROUPS = ["Dark", "Light"];

// ── ThemeGrid MUST be outside ThemePicker — if defined inside, every render
// creates a new component type causing React to unmount/remount it, which
// breaks click events because React re-mounts before the event finishes.
function ThemeGrid({ selected, onSelect }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:8 }}>
      {THEME_GROUPS.map(group => {
        const grouped = Object.entries(THEMES).filter(([,t]) => t.group === group);
        return (
          <div key={group}>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:8 }}>
              {group.toUpperCase()}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:8 }}>
              {grouped.map(([key, t]) => (
                <div key={key}
                  onClick={e => { e.stopPropagation(); onSelect(key); }}
                  style={{
                    padding:"10px 12px", borderRadius:"var(--radius-md)", cursor:"pointer",
                    border:`2px solid ${selected===key?"var(--accent)":"var(--border)"}`,
                    background: selected===key?"var(--accent2)18":"var(--bg3)",
                    display:"flex", alignItems:"center", gap:10,
                    transition:"var(--transition-all)",
                    userSelect:"none",
                  }}
                  onMouseEnter={e => { if(selected!==key) e.currentTarget.style.borderColor="var(--accent)"; }}
                  onMouseLeave={e => { if(selected!==key) e.currentTarget.style.borderColor="var(--border)"; }}
                >
                  <span style={{ fontSize:20 }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text)" }}>{t.name}</div>
                    <div style={{ display:"flex", gap:3, marginTop:5 }}>
                      {["--bg","--bg2","--accent","--success","--danger"].map(v => (
                        <div key={v} style={{ width:11, height:11, borderRadius:3, background:t.vars[v], border:"1px solid rgba(0,0,0,.12)" }}/>
                      ))}
                    </div>
                  </div>
                  {selected===key && <span style={{ color:"var(--accent)", fontSize:16 }}>✓</span>}
                </div>
              ))}
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
  defaultTab = "global",
}) {
  const { themeName, setThemeName, fontScale, setFontScale } = useTheme();
  const { designName, setDesignName } = useDesign();
  const { skinName, setSkinName } = useSkin();
  const [tab, setTab]         = useState(defaultTab);
  const [fontInput, setFontInput] = useState(String(fontScale));

  const hasCanvas = canvasTheme !== undefined && setCanvasTheme !== undefined;
  const tabs = [
    { id:"skins",   label:"✨ Skins" },
    { id:"global",  label:"🌍 Theme" },
    ...(hasCanvas ? [{ id:"canvas", label:"🎨 Canvas" }] : []),
    { id:"design",  label:"🖌 Design" },
    { id:"text",    label:"🔤 Text Size" },
  ];

  return (
    <div
      // Only close on clicking the ACTUAL backdrop div, not bubbled events from children
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1200, padding:16 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", width:"100%", maxWidth:720, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border2)", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>⚙</span>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text)", flex:1 }}>Appearance</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:22, lineHeight:1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, padding:"10px 16px", borderBottom:"1px solid var(--border2)", overflowX:"auto" }}>
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
        <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }}>

          {/* ── Skins ── */}
          {tab==="skins" && (() => { try { return (
            <div>
              <div style={{ fontSize:11, color:"var(--text4)", marginBottom:14, lineHeight:1.6 }}>
                Each skin is a complete visual overhaul — fonts, shapes, shadows, colors, and special effects.
                Not just a color change.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {SKIN_KEYS.map(key => {
                  const s = SKINS[key];
                  const active = skinName === key;
                  const bg0 = s.palette[0], bg1 = s.palette[1], acc = s.palette[2];
                  return (
                    <div key={key}
                      onClick={() => setSkinName(key)}
                      style={{
                        borderRadius:8, cursor:"pointer", overflow:"hidden",
                        border:`2px solid ${active ? acc : "rgba(128,128,128,0.25)"}`,
                        background: bg1,
                        transition:"transform 0.14s, border-color 0.14s, box-shadow 0.14s",
                        userSelect:"none",
                        boxShadow: active ? `0 4px 20px ${acc}55` : "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                      onMouseEnter={e => { if(!active){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=(acc||"#888")+"88";}}}
                      onMouseLeave={e => { if(!active){e.currentTarget.style.transform="";e.currentTarget.style.borderColor="rgba(128,128,128,0.25)";}}}
                    >
                      {/* Mini UI preview */}
                      <div style={{ height:80, background:bg0, position:"relative", overflow:"hidden", padding:"8px 8px 0" }}>
                        {/* Fake topbar */}
                        <div style={{ height:8, background:bg1, borderRadius:"2px 2px 0 0", marginBottom:4,
                          border:`1px solid ${acc||"#888"}44`, display:"flex", alignItems:"center", gap:2, padding:"0 4px" }}>
                          <div style={{ width:4, height:4, borderRadius:"50%", background:acc, opacity:.8 }}/>
                          <div style={{ flex:1, height:2, background:acc, opacity:.3, borderRadius:1 }}/>
                        </div>
                        {/* Fake content cards */}
                        <div style={{ display:"flex", gap:3 }}>
                          {[0.9,0.6,0.75].map((op,i)=>(
                            <div key={i} style={{ flex:1, height:28, background:bg1, borderRadius:2,
                              border:`1px solid ${acc}${Math.floor(op*50).toString(16).padStart(2,'0')}`,
                              opacity:op }}/>
                          ))}
                        </div>
                        {active && (
                          <div style={{ position:"absolute", top:4, right:6, background:acc,
                            borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:10, color:bg0, fontWeight:800 }}>✓</div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding:"8px 10px", background:bg1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          <span style={{ fontSize:14 }}>{s.icon}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:String(s.palette?.[3]||"#fff") }}>{s.name}</span>
                        </div>
                        <div style={{ display:"flex", gap:3, marginBottom:6 }}>
                          {s.palette.map((col,i) => (
                            <div key={i} style={{ width:14, height:14, borderRadius:"50%", background:col,
                              border:"1px solid rgba(255,255,255,0.2)", flexShrink:0 }}/>
                          ))}
                        </div>
                        <div style={{ fontSize:9, color:String(s.palette?.[3]||"#aaa"), opacity:.65, marginBottom:5, lineHeight:1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{s.concept||""}</div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
                          <span style={{ fontSize:8, padding:"1px 6px", borderRadius:8,
                            background:(s.palette?.[2]||"#888")+"33", color:s.palette[2],
                            border:`1px solid ${s.palette[2]}55`, fontWeight:700 }}>
                            {s.nav==="top"?"⬆ Top Nav":s.nav==="bottom"?"⬇ Dock":s.nav==="icon-dock"?"◀ Icon":s.nav==="editorial"?"⬛ Full":"?"}
                          </span>
                          {(s.tags||[]).slice(0,2).map(t=>(
                            <span key={t} style={{ fontSize:8, color:String(s.palette?.[3]||"#aaa"), opacity:.6 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Description of active */}
              <div style={{ marginTop:12, padding:"10px 14px", background:"var(--bg3)",
                border:"1px solid var(--border)", borderRadius:8 }}>
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
            </div>
          ); } catch(err) { return <div style={{color:"var(--danger)",padding:16,fontSize:11}}>Error: {err?.message}</div>; } })()}

          {/* ── Global Theme ── */}
          {tab==="global" && (
            <>
              <div style={{ fontSize:12, color:"var(--text3)", marginBottom:8 }}>Applies to the entire app — sidebar, topbar, panels, and canvas.</div>
              <ThemeGrid selected={themeName} onSelect={key => { setThemeName(key); }} />
            </>
          )}

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
              <ThemeGrid selected={canvasTheme} onSelect={key => { setCanvasTheme(key); }} />
            </>
          )}

          {/* ── Design ── */}
          {tab==="design" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:12, color:"var(--text3)", marginBottom:4 }}>Controls node shape, spacing, and visual density.</div>
              {Object.entries(DESIGNS).map(([key, d]) => (
                <div key={key}
                  onClick={e => { e.stopPropagation(); setDesignName(key); }}
                  style={{
                    padding:"12px 16px", borderRadius:"var(--radius-md)", cursor:"pointer",
                    border:`2px solid ${designName===key?"var(--accent)":"var(--border)"}`,
                    background: designName===key?"var(--accent2)18":"var(--bg3)",
                    display:"flex", alignItems:"center", gap:12, userSelect:"none",
                  }}>
                  <span style={{ fontSize:24 }}>{d.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{d.name}</div>
                    <div style={{ fontSize:11, color:"var(--text4)", marginTop:2 }}>{d.desc}</div>
                  </div>
                  {designName===key && <span style={{ color:"var(--accent)", fontSize:16 }}>✓</span>}
                </div>
              ))}
            </div>
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
