import { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import { useSkin } from "../context/SkinContext.jsx";
import { SKINS, SKIN_KEYS } from "../skins.js";

export default function ThemePicker({
  onClose,
  defaultTab = "skins",
}) {
  const { fontScale, setFontScale } = useTheme();
  const { skinName, setSkinName, skin, setAccent, skinVariants, skinVariant, setSkinVariant } = useSkin();
  const [tab, setTab]         = useState(defaultTab);
  const [fontInput, setFontInput] = useState(String(fontScale));

  const tabs = [
    { id:"skins",   label:"✨ Skins" },
    { id:"text",    label:"🔤 Text Size" },
  ];

  return (
    <div
      // Only close on clicking the ACTUAL backdrop div, not bubbled events from children
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      data-ui="theme-picker" data-component="ThemePicker" data-page="global" data-role="modal" style={{ position:"fixed", inset:0, background:"var(--overlay-scrim-2)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1200, padding:16 }}>
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
                color:      tab===t.id ? "var(--on-accent)" : "var(--text3)" }}>
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
                Each skin is a complete visual overhaul — fonts, shapes, shadows, colors, and special effects.
                Not just a color change.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {SKIN_KEYS.map(key => {
                  const s = SKINS[key];
                  const active = skinName === key;
                  // No palette — use neutral preview colors based on skin tags
                  const isDark = (s.tags||[]).some(t=>["Dark","Neon","Technical","Industrial","Bold","Atmospheric"].includes(t));
                  const bg0 = isDark ? "#0d1117" : "#f5f5f0";
                  const bg1 = isDark ? "#161b22" : "#ffffff";
                  const acc = isDark ? "#58a6ff" : "#6366f1";
                  return (
                    <div key={key}
                      onClick={() => setSkinName(key)}
                      style={{
                        borderRadius:8, cursor:"pointer", overflow:"hidden",
                        border:active?"2px solid var(--accent)":"2px solid var(--border)",
                        background: bg1,
                        transition:"transform 0.14s, border-color 0.14s, box-shadow 0.14s",
                        userSelect:"none",
                        boxShadow: active ? "var(--nIs,inset 2px 2px 6px var(--neu-shadow),-2px -2px 4px var(--neu-hilight))" : "var(--nEx,2px 2px 5px var(--neu-shadow),-2px -2px 3px var(--neu-hilight))",
                      }}
                      onMouseEnter={e => { if(!active){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="var(--accent)";}}}
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
                          <div style={{ position:"absolute", top:4, right:6, background:"var(--accent)",
                            borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:10, color:"var(--on-accent)", fontWeight:800 }}>✓</div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding:"8px 10px", background:bg1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          <span style={{ fontSize:14 }}>{s.icon}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:isDark?"#e6edf3":"#1a1a2e" }}>{s.name}</span>
                        </div>
                        <div style={{ display:"flex", gap:3, marginBottom:6 }}>
                          {/* Tag pills instead of palette dots */}
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
              {/* Description of active */}
              {/* ── Accent quick-pick for current skin ── */}
              {skin?.accentOptions && skin.accentOptions.length > 0 && (
                <div style={{ marginTop:12, padding:"12px 14px", background:"var(--bg3)",
                  border:"1px solid var(--border)", borderRadius:8 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text)", marginBottom:8 }}>
                    Accent Color
                    <span style={{ fontSize:10, fontWeight:400, color:"var(--text4)", marginLeft:6 }}>curated for this skin</span>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {skin.accentOptions.map(opt => (
                      <button key={opt.name} onClick={() => setAccent(opt.accent, opt.accent2)}
                        style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px",
                          border:"1px solid var(--border)", borderRadius:"var(--radius-sm)",
                          background:"var(--bg2)", cursor:"pointer", fontFamily:"var(--font-ui)", fontSize:10 }}>
                        <span style={{ width:12, height:12, borderRadius:"50%", background:opt.accent, flexShrink:0, border:"1px solid rgba(255,255,255,0.2)" }}/>
                        <span style={{ color:"var(--text3)" }}>{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

          {tab==="skins" && skinVariants?.length > 1 && (
            <div style={{ marginTop:12, padding:"12px 14px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--text)", marginBottom:8 }}>
                Skin Variant
                <span style={{ fontSize:10, fontWeight:400, color:"var(--text4)", marginLeft:6 }}>palette preset inside selected skin</span>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {skinVariants.map((key) => {
                  const t = THEMES[key];
                  const active = skinVariant === key;
                  return (
                    <button key={key} onClick={() => setSkinVariant(key)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", border:`1px solid ${active?"var(--accent)":"var(--border)"}`, borderRadius:"var(--radius-sm)", background:active?"var(--state-selected-bg)":"var(--bg2)", cursor:"pointer", fontFamily:"var(--font-ui)", fontSize:10, color:active?"var(--accent)":"var(--text3)" }}>
                      <span>{t?.icon || "🎨"}</span>
                      <span>{t?.name || key}</span>
                    </button>
                  );
                })}
              </div>
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
