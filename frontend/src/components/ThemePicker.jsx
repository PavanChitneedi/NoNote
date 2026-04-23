import { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import { useDesign, DESIGNS } from "../context/DesignContext.jsx";

const THEME_GROUPS = ["Dark", "Light"];

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

  // ── Theme grid ────────────────────────────────────────────
  const ThemeGrid = ({ selected, onSelect }) => (
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
                <div key={key} onClick={() => onSelect(key)}
                  style={{
                    padding:"10px 12px", borderRadius:"var(--radius-md)", cursor:"pointer",
                    border:`2px solid ${selected===key?"var(--accent)":"var(--border)"}`,
                    background: selected===key?"var(--accent2)18":"var(--bg3)",
                    display:"flex", alignItems:"center", gap:10,
                    transition:"var(--transition-all)",
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

  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500, padding:16 }}>
      <div data-dev="ThemePicker.jsx | appearance & design settings modal" onClick={e => e.stopPropagation()}
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
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:"7px 14px", border:"none", borderRadius:"var(--radius-sm)", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", flexShrink:0,
                background: tab===t.id ? "var(--accent2)" : "var(--bg3)",
                color:      tab===t.id ? "#fff"           : "var(--text3)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }}>

          {/* ── Global Theme ── */}
          {tab==="global" && (
            <>
              <div style={{ fontSize:12, color:"var(--text3)", marginBottom:8 }}>Applies to the entire app — sidebar, topbar, panels, and canvas.</div>
              <ThemeGrid selected={themeName} onSelect={setThemeName} />
            </>
          )}

          {/* ── Canvas Theme ── */}
          {tab==="canvas" && hasCanvas && (
            <>
              <div style={{ fontSize:12, color:"var(--text3)", marginBottom:12 }}>Changes only the dotted drawing canvas background. UI keeps the global theme.</div>
              {/* Global option */}
              <div onClick={() => setCanvasTheme("global")}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:"var(--radius-md)", cursor:"pointer", marginBottom:10,
                  border:`2px solid ${canvasTheme==="global"?"var(--accent)":"var(--border)"}`,
                  background: canvasTheme==="global" ? "var(--accent2)18" : "var(--bg3)" }}>
                <span style={{ fontSize:22 }}>🌐</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>Use Global Theme</div>
                  <div style={{ fontSize:11, color:"var(--text4)" }}>Canvas follows whatever global theme is selected</div>
                </div>
                {canvasTheme==="global" && <span style={{ color:"var(--accent)", fontSize:16 }}>✓</span>}
              </div>
              <ThemeGrid selected={canvasTheme} onSelect={setCanvasTheme} />
            </>
          )}

          {/* ── Design System ── */}
          {tab==="design" && (
            <>
              <div style={{ fontSize:12, color:"var(--text3)", marginBottom:12 }}>
                Designs control typography, spacing, border radius, shadows, and overall UI feel — independent of color theme.
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {Object.entries(DESIGNS).map(([key, d]) => (
                  <div key={key} onClick={() => setDesignName(key)}
                    style={{ padding:"14px 16px", borderRadius:"var(--radius-md)", cursor:"pointer",
                      border:`2px solid ${designName===key?"var(--accent)":"var(--border)"}`,
                      background: designName===key ? "var(--accent2)14" : "var(--bg3)",
                      transition:"var(--transition-all)" }}
                    onMouseEnter={e => { if(designName!==key) e.currentTarget.style.borderColor="var(--accent)"; }}
                    onMouseLeave={e => { if(designName!==key) e.currentTarget.style.borderColor="var(--border)"; }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:26 }}>{d.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:2 }}>{d.name}</div>
                        <div style={{ fontSize:11, color:"var(--text3)" }}>{d.desc}</div>
                        {/* Design preview */}
                        <div style={{ display:"flex", gap:6, marginTop:8, alignItems:"center" }}>
                          {/* Mock button */}
                          <div style={{ padding:"3px 10px", background:"var(--accent2)", borderRadius:d.vars["--radius-btn"], fontSize:10, color:"#fff", fontFamily:d.vars["--font-ui"], fontWeight:d.vars["--font-weight-ui"] }}>
                            Button
                          </div>
                          {/* Mock node */}
                          <div style={{ padding:"4px 10px", background:"var(--bg2)", border:"1.5px solid var(--border)", borderRadius:d.vars["--radius-node"], fontSize:10, color:"var(--text2)", fontFamily:d.vars["--font-node"] }}>
                            Node
                          </div>
                          {/* Spacing indicator */}
                          <div style={{ fontSize:10, color:"var(--text4)" }}>
                            {d.vars["--radius-node"]} radius · {d.vars["--font-ui"].split(",")[0].replace(/'/g,"")}
                          </div>
                        </div>
                      </div>
                      {designName===key && <span style={{ color:"var(--accent)", fontSize:18 }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Text Size ── */}
          {tab==="text" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ fontSize:12, color:"var(--text3)" }}>
                Scales all text across the entire app. Base is 14px at 100%.
              </div>

              {/* Quick presets */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:8 }}>PRESETS</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[{l:"XS",v:75},{l:"S",v:85},{l:"M",v:100},{l:"L",v:115},{l:"XL",v:130},{l:"XXL",v:150}].map(p => (
                    <button key={p.l} onClick={() => { setFontScale(p.v); setFontInput(String(p.v)); }}
                      style={{ padding:"8px 16px", border:"none", borderRadius:"var(--radius-sm)", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit",
                        background: fontScale===p.v ? "var(--accent2)" : "var(--bg3)",
                        color:      fontScale===p.v ? "#fff"           : "var(--text3)" }}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider + input */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:8 }}>FINE-TUNE</div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <button onClick={() => { const v=Math.max(60,fontScale-5); setFontScale(v); setFontInput(String(v)); }}
                    style={{ width:36, height:36, border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", background:"var(--bg3)", color:"var(--text)", cursor:"pointer", fontSize:18 }}>−</button>
                  <input type="range" min="60" max="200" step="5" value={fontScale}
                    onChange={e => { setFontScale(+e.target.value); setFontInput(e.target.value); }}
                    style={{ flex:1, accentColor:"var(--accent2)" }}/>
                  <button onClick={() => { const v=Math.min(200,fontScale+5); setFontScale(v); setFontInput(String(v)); }}
                    style={{ width:36, height:36, border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", background:"var(--bg3)", color:"var(--text)", cursor:"pointer", fontSize:18 }}>＋</button>
                  <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", overflow:"hidden" }}>
                    <input type="number" min="60" max="200" value={fontInput}
                      onChange={e => setFontInput(e.target.value)}
                      onBlur={() => { const v=Math.min(200,Math.max(60,+fontInput)); setFontScale(v); setFontInput(String(v)); }}
                      onKeyDown={e => { if(e.key==="Enter"){const v=Math.min(200,Math.max(60,+fontInput));setFontScale(v);} }}
                      style={{ width:50, background:"var(--bg)", border:"none", padding:"8px 6px", color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none", textAlign:"center" }}/>
                    <span style={{ paddingRight:8, color:"var(--text4)", fontSize:12 }}>%</span>
                  </div>
                </div>
                <div style={{ marginTop:6, fontSize:11, color:"var(--text4)" }}>
                  {fontScale}% → {Math.round((fontScale/100)*14)}px base
                </div>
              </div>

              {/* Live preview */}
              <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:10 }}>PREVIEW</div>
                <div style={{ fontSize:"1.4em", fontWeight:700, color:"var(--text)", marginBottom:4 }}>Heading — Node Title</div>
                <div style={{ fontSize:"1em", color:"var(--text2)", marginBottom:4 }}>Regular body — properties, labels, notes</div>
                <div style={{ fontSize:"0.85em", color:"var(--text3)" }}>Small — metadata, badges, timestamps</div>
              </div>

              <button onClick={() => { setFontScale(100); setFontInput("100"); }}
                style={{ padding:"8px 16px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", color:"var(--text3)", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
                Reset to 100%
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
