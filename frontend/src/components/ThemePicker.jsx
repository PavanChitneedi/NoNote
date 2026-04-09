import { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";

// Groups for display
const GROUPS = ["Dark", "Light"];

export default function ThemePicker({
  onClose,
  // optional canvas theme props (only passed from NodeCanvas)
  canvasTheme,
  setCanvasTheme,
  defaultTab = "global",
}) {
  const { themeName, setThemeName, fontScale, setFontScale } = useTheme();
  const [tab, setTab] = useState(defaultTab);
  const [fontInput, setFontInput] = useState(String(fontScale));

  const hasCanvas = canvasTheme !== undefined && setCanvasTheme !== undefined;
  const tabs = ["global", ...(hasCanvas ? ["canvas"] : []), "text"];

  const TAB_LABELS = {
    global: "🌍 Global Theme",
    canvas: "🎨 Canvas",
    text:   "🔤 Text Size",
  };

  const ThemeGrid = ({ selected, onSelect }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
      {GROUPS.map(group => {
        const groupThemes = Object.entries(THEMES).filter(([, t]) => t.group === group);
        return (
          <div key={group}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text4)", letterSpacing: 2, marginBottom: 8 }}>
              {group.toUpperCase()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {groupThemes.map(([key, t]) => (
                <div key={key}
                  onClick={() => onSelect(key)}
                  style={{
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${selected === key ? "var(--accent)" : "var(--border)"}`,
                    background: selected === key ? "var(--accent2)18" : "var(--bg3)",
                    transition: "all .13s",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                  onMouseEnter={e => { if (selected !== key) e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={e => { if (selected !== key) e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{t.name}</div>
                    {/* Color swatches */}
                    <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                      {["--bg", "--bg2", "--accent", "--success", "--danger"].map(v => (
                        <div key={v} style={{ width: 12, height: 12, borderRadius: 3, background: t.vars[v], border: "1px solid rgba(0,0,0,.1)" }} />
                      ))}
                    </div>
                  </div>
                  {selected === key && <span style={{ color: "var(--accent)", fontSize: 16 }}>✓</span>}
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
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚙</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", flex: 1 }}>Appearance</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "10px 16px", borderBottom: "1px solid var(--border2)" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "7px 14px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                background: tab === t ? "var(--accent2)" : "var(--bg3)",
                color:      tab === t ? "#fff"           : "var(--text3)" }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>

          {/* ── Global Theme tab ── */}
          {tab === "global" && (
            <>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>
                Applies to the entire application — sidebar, topbar, panels, and canvas.
              </div>
              <ThemeGrid selected={themeName} onSelect={name => { setThemeName(name); }} />
            </>
          )}

          {/* ── Canvas Theme tab ── */}
          {tab === "canvas" && hasCanvas && (
            <>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>
                Changes only the drawing canvas background. The rest of the UI keeps the global theme.
              </div>
              <div style={{ marginBottom: 10 }}>
                <div
                  onClick={() => setCanvasTheme("global")}
                  style={{
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer", marginBottom: 8,
                    border: `2px solid ${canvasTheme === "global" ? "var(--accent)" : "var(--border)"}`,
                    background: canvasTheme === "global" ? "var(--accent2)18" : "var(--bg3)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                  <span style={{ fontSize: 20 }}>🌐</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Use Global Theme</div>
                    <div style={{ fontSize: 11, color: "var(--text4)" }}>Canvas follows the global theme selected above</div>
                  </div>
                  {canvasTheme === "global" && <span style={{ color: "var(--accent)", fontSize: 16 }}>✓</span>}
                </div>
              </div>
              <ThemeGrid selected={canvasTheme} onSelect={name => setCanvasTheme(name)} />
            </>
          )}

          {/* ── Text Size tab ── */}
          {tab === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>
                Scales all text across the entire app. Base size is 14px at 100%.
              </div>

              {/* Quick presets */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text4)", letterSpacing: 2, marginBottom: 8 }}>PRESETS</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "XS", val: 75  },
                    { label: "S",  val: 85  },
                    { label: "M",  val: 100 },
                    { label: "L",  val: 115 },
                    { label: "XL", val: 130 },
                    { label: "XXL",val: 150 },
                  ].map(p => (
                    <button key={p.label} onClick={() => { setFontScale(p.val); setFontInput(String(p.val)); }}
                      style={{ padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                        background: fontScale === p.val ? "var(--accent2)" : "var(--bg3)",
                        color:      fontScale === p.val ? "#fff"           : "var(--text3)" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider + manual input */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text4)", letterSpacing: 2, marginBottom: 8 }}>CUSTOM SIZE</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => { const v = fontScale - 5; setFontScale(v); setFontInput(String(Math.max(60,v))); }}
                    style={{ width: 36, height: 36, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg3)", color: "var(--text)", cursor: "pointer", fontSize: 18 }}>−</button>
                  <input
                    type="range" min="60" max="200" step="5"
                    value={fontScale}
                    onChange={e => { setFontScale(+e.target.value); setFontInput(e.target.value); }}
                    style={{ flex: 1, accentColor: "var(--accent2)" }}
                  />
                  <button onClick={() => { const v = fontScale + 5; setFontScale(v); setFontInput(String(Math.min(200,v))); }}
                    style={{ width: 36, height: 36, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg3)", color: "var(--text)", cursor: "pointer", fontSize: 18 }}>＋</button>
                  {/* Manual number input */}
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                    <input
                      type="number" min="60" max="200"
                      value={fontInput}
                      onChange={e => setFontInput(e.target.value)}
                      onBlur={() => { setFontScale(+fontInput); setFontInput(String(Math.min(200, Math.max(60, +fontInput)))); }}
                      onKeyDown={e => { if (e.key === "Enter") { setFontScale(+fontInput); } }}
                      style={{ width: 52, background: "var(--bg)", border: "none", padding: "8px 8px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", textAlign: "center" }}
                    />
                    <span style={{ paddingRight: 8, color: "var(--text4)", fontSize: 12 }}>%</span>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text4)" }}>
                  Current: {fontScale}% → {Math.round((fontScale/100)*14)}px base size
                </div>
              </div>

              {/* Preview */}
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text4)", letterSpacing: 2, marginBottom: 10 }}>PREVIEW</div>
                <div style={{ fontSize: "1.4em", fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Heading text</div>
                <div style={{ fontSize: "1em", color: "var(--text2)", marginBottom: 4 }}>Regular body text — nodes, labels, properties</div>
                <div style={{ fontSize: "0.85em", color: "var(--text3)" }}>Small labels and metadata</div>
              </div>

              {/* Reset */}
              <button onClick={() => { setFontScale(100); setFontInput("100"); }}
                style={{ padding: "8px 16px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text3)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                Reset to 100%
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
