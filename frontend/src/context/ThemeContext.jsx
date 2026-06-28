import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({});

// ── 6 Mood Presets — complete, opinionated, warm ─────────────
export const THEMES = {
  arctic: {
    name:"Arctic", icon:"❄", mood:"light",
    desc:"Cool blue-white, crisp and clean.",
    vars:{
      "--bg":"#f4f7fb","--bg2":"#ffffff","--bg3":"#e8eef6",
      "--border":"#e2e8f0","--border2":"#eef2f8",
      "--text":"#1e293b","--text2":"#475569","--text3":"#94a3b8","--text4":"#cbd5e1",
      "--accent":"#3b82f6","--accent2":"#2563eb",
      "--success":"#10b981","--danger":"#ef4444",
      "--canvas-dot":"#dde5f0","--node-bg":"#ffffff","--shadow":"rgba(15,23,42,0.08)",
    },
  },
  obsidian: {
    name:"Obsidian", icon:"⬡", mood:"dark",
    desc:"Focused, warm dark.",
    vars:{
      "--bg":"#0e0e12","--bg2":"#17171e","--bg3":"#1f1f28",
      "--border":"#2a2a38","--border2":"#1f1f28",
      "--text":"#eaeaf0","--text2":"#b8b8cc","--text3":"#6e6e8a","--text4":"#42425a",
      "--accent":"#7b8cff","--accent2":"#5c6ef0",
      "--success":"#4ade80","--danger":"#f87171",
      "--canvas-dot":"#2a2a38","--node-bg":"#17171e","--shadow":"rgba(0,0,0,0.5)",
    },
  },
  warm: {
    name:"Warm", icon:"🕯", mood:"light",
    desc:"Cream tones, easy on the eyes.",
    vars:{
      "--bg":"#faf7f2","--bg2":"#f5f0e8","--bg3":"#ede6d8",
      "--border":"#d4c9b8","--border2":"#e8e0d0",
      "--text":"#2d2820","--text2":"#4a4238","--text3":"#8a7d6e","--text4":"#b8aa98",
      "--accent":"#7c5cfc","--accent2":"#6244e8",
      "--success":"#22a65a","--danger":"#dc3545",
      "--canvas-dot":"#d4c9b8","--node-bg":"#f5f0e8","--shadow":"rgba(0,0,0,0.12)",
    },
  },
  vibrant: {
    name:"Vibrant", icon:"⚡", mood:"dark",
    desc:"High contrast, energetic.",
    vars:{
      "--bg":"#08080f","--bg2":"#0f0f1a","--bg3":"#16162a",
      "--border":"#2d2d55","--border2":"#16162a",
      "--text":"#f0f0ff","--text2":"#c0c0e8","--text3":"#7070a8","--text4":"#404070",
      "--accent":"#a78bfa","--accent2":"#7c3aed",
      "--success":"#34d399","--danger":"#fb7185",
      "--canvas-dot":"#2d2d55","--node-bg":"#0f0f1a","--shadow":"rgba(0,0,0,0.6)",
    },
  },
  minimal: {
    name:"Minimal", icon:"○", mood:"light",
    desc:"Pure whitespace, zero distraction.",
    vars:{
      "--bg":"#ffffff","--bg2":"#f8f8f8","--bg3":"#f0f0f0",
      "--border":"#e0e0e0","--border2":"#f0f0f0",
      "--text":"#1a1a1a","--text2":"#3a3a3a","--text3":"#888888","--text4":"#bbbbbb",
      "--accent":"#3b82f6","--accent2":"#1d4ed8",
      "--success":"#16a34a","--danger":"#dc2626",
      "--canvas-dot":"#e8e8e8","--node-bg":"#ffffff","--shadow":"rgba(0,0,0,0.08)",
    },
  },
  cozy: {
    name:"Cozy", icon:"🍂", mood:"dark",
    desc:"Soft, warm, low-stress.",
    vars:{
      "--bg":"#1a1410","--bg2":"#221c16","--bg3":"#2c2418",
      "--border":"#3d3020","--border2":"#2c2418",
      "--text":"#f0e8d8","--text2":"#c8b898","--text3":"#8a7058","--text4":"#554535",
      "--accent":"#f59e0b","--accent2":"#d97706",
      "--success":"#4ade80","--danger":"#f87171",
      "--canvas-dot":"#3d3020","--node-bg":"#221c16","--shadow":"rgba(0,0,0,0.5)",
    },
  },
  terminal: {
    name:"Terminal", icon:"▶", mood:"dark",
    desc:"Monospace, green accent, power user.",
    vars:{
      "--bg":"#020a02","--bg2":"#061006","--bg3":"#0a180a",
      "--border":"#1a3a1a","--border2":"#0a180a",
      "--text":"#d4f4d4","--text2":"#a0c8a0","--text3":"#508050","--text4":"#2a5028",
      "--accent":"#4ade80","--accent2":"#16a34a",
      "--success":"#4ade80","--danger":"#f87171",
      "--canvas-dot":"#1a3a1a","--node-bg":"#061006","--shadow":"rgba(0,0,0,0.7)",
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem("nm_theme") || "arctic"
  );
  const [fontScale, setFontScaleRaw] = useState(
    () => parseInt(localStorage.getItem("nm_fontscale") || "100", 10)
  );

  const theme = THEMES[themeName] || THEMES.arctic;

  // Listen for skin-driven theme switches
  useEffect(() => {
    const h = (e) => { if (THEMES[e.detail]) setThemeName(e.detail); };
    window.addEventListener("nn-set-theme", h);
    return () => window.removeEventListener("nn-set-theme", h);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.dataset.theme = themeName;
    localStorage.setItem("nm_theme", themeName);
    window.dispatchEvent(new CustomEvent("nn-theme-changed", { detail: themeName }));
  }, [theme, themeName]);

  const setFontScale = (v) => {
    setFontScaleRaw(v);
    localStorage.setItem("nm_fontscale", v);
  };

  useEffect(() => {
    const px = Math.round((fontScale / 100) * 14);
    document.documentElement.style.setProperty("--app-font-size", `${px}px`);
  }, [fontScale]);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, fontScale, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
