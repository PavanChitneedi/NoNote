import { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import { useDesign, DESIGNS } from "../context/DesignContext.jsx";

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
  const [tab, setTab]         = useState(defaultTab);
  const [fontInput, setFontInput] = useState(String(fontScale));

  const hasCanvas = canvasTheme !== undefined && setCanvasTheme !== undefined;
  const tabs = [
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
        style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", width:"100%", maxWidth:560, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

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
          {tab==="skins" && (
            <div>
              <div style={{ fontSize:11, color:"var(--text4)", marginBottom:14, lineHeight:1.6 }}>
                Skins change the entire visual identity — typography, layout, shadows, and effects. Not just colors.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {SKIN_KEYS.map(key => {
                  const s = SKINS[key];
                  const active = skinName === key;
                  return (
                    <div key={key}
                      onClick={() => setSkinName(key)}
                      style={{
                        borderRadius:"var(--radius-md)", cursor:"pointer", overflow:"hidden",
                        border:`2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        background: active ? "var(--accent2)14" : "var(--bg3)",
                        transition:"var(--transition-all)", userSelect:"none",
                      }}
                      onMouseEnter={e => { if(!active) e.currentTarget.style.borderColor="var(--text4)"; }}
                      onMouseLeave={e => { if(!active) e.currentTarget.style.borderColor="var(--border)"; }}
                    >
                      <div style={{ height:48, display:"flex", position:"relative", overflow:"hidden" }}>
                        {s.palette.map((col, i) => <div key={i} style={{ flex:1, background:col }} />)}
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{s.icon}</div>
                        {active && <div style={{ position:"absolute", top:6, right:8, fontSize:14, color:"#fff", textShadow:"0 1px 4px rgba(0,0,0,.8)" }}>✓</div>}
                      </div>
                      <div style={{ padding:"9px 12px" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--text)", marginBottom:3 }}>{s.name}</div>
                        <div style={{ fontSize:10, color:"var(--text4)", marginBottom:5, lineHeight:1.45 }}>{s.desc}</div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {s.tags.map(t => (
                            <span key={t} style={{ fontSize:9, padding:"1px 6px", borderRadius:10,
                              background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text4)" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {SKINS[skinName]?.forceTheme && (
                <div style={{ marginTop:12, padding:"8px 12px", background:"var(--accent2)18",
                  border:"1px solid var(--accent2)44", borderRadius:"var(--radius-sm)",
                  fontSize:10, color:"var(--accent)" }}>
                  💡 <strong>{SKINS[skinName].name}</strong> skin works best with the <em>{SKINS[skinName].forceTheme}</em> color theme (auto-applied on first select).
                </div>
              )}
            </div>
          )}

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
