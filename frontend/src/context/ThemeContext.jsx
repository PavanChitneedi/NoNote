import { createContext, useContext, useState, useEffect } from "react";

// ── Improved color palettes — researched, elegant, cohesive ──
export const THEMES = {
  // ── DARK ─────────────────────────────────────────────────
  dark: {
    name:"Dark", icon:"🌑", group:"Dark",
    vars:{
      "--bg":"#0d1117","--bg2":"#161b22","--bg3":"#21262d",
      "--border":"#30363d","--border2":"#21262d",
      "--text":"#e6edf3","--text2":"#c9d1d9","--text3":"#7d8590","--text4":"#484f58",
      "--accent":"#58a6ff","--accent2":"#1f6feb",
      "--success":"#3fb950","--danger":"#f85149",
      "--canvas-dot":"#21262d","--node-bg":"#161b22","--shadow":"rgba(0,0,0,0.5)",
    },
  },
  midnight: {
    name:"Midnight", icon:"🌌", group:"Dark",
    vars:{
      "--bg":"#070c14","--bg2":"#0e1520","--bg3":"#162035",
      "--border":"#1e3050","--border2":"#162035",
      "--text":"#cdd9f4","--text2":"#8dacd8","--text3":"#4a6ea8","--text4":"#2a3e60",
      "--accent":"#7aa2f7","--accent2":"#3d6fda",
      "--success":"#73daca","--danger":"#f7768e",
      "--canvas-dot":"#162035","--node-bg":"#0e1520","--shadow":"rgba(0,0,0,0.7)",
    },
  },
  forest: {
    name:"Forest", icon:"🌲", group:"Dark",
    vars:{
      "--bg":"#091410","--bg2":"#0f1c16","--bg3":"#162c1e",
      "--border":"#284035","--border2":"#1e3028",
      "--text":"#c8e0cc","--text2":"#90b898","--text3":"#4e8060","--text4":"#2a4a34",
      "--accent":"#73daca","--accent2":"#2ac3a4",
      "--success":"#73daca","--danger":"#f7768e",
      "--canvas-dot":"#162c1e","--node-bg":"#0f1c16","--shadow":"rgba(0,0,0,0.6)",
    },
  },
  ocean: {
    name:"Ocean", icon:"🌊", group:"Dark",
    vars:{
      "--bg":"#030b18","--bg2":"#071428","--bg3":"#0c2040",
      "--border":"#0d3060","--border2":"#0a2040",
      "--text":"#b8d8f4","--text2":"#6aaad8","--text3":"#3070a0","--text4":"#1a4870",
      "--accent":"#00b8d9","--accent2":"#0090b0",
      "--success":"#2bd4a0","--danger":"#ff5e85",
      "--canvas-dot":"#0c2040","--node-bg":"#071428","--shadow":"rgba(0,0,0,0.7)",
    },
  },
  amber: {
    name:"Amber", icon:"🔥", group:"Dark",
    vars:{
      "--bg":"#0e0a06","--bg2":"#181208","--bg3":"#241c0e",
      "--border":"#3a2a14","--border2":"#2a1e0c",
      "--text":"#f0d8a8","--text2":"#d4b878","--text3":"#9a7840","--text4":"#5a4820",
      "--accent":"#f0a830","--accent2":"#c88020",
      "--success":"#68c880","--danger":"#e05040",
      "--canvas-dot":"#241c0e","--node-bg":"#181208","--shadow":"rgba(0,0,0,0.7)",
    },
  },
  violet: {
    name:"Violet", icon:"💜", group:"Dark",
    vars:{
      "--bg":"#07040f","--bg2":"#0e0820","--bg3":"#160e30",
      "--border":"#2a1850","--border2":"#1e1040",
      "--text":"#d8c8f8","--text2":"#b098e8","--text3":"#7058b8","--text4":"#402888",
      "--accent":"#bd93f9","--accent2":"#8b5cf6",
      "--success":"#50fa7b","--danger":"#ff5555",
      "--canvas-dot":"#160e30","--node-bg":"#0e0820","--shadow":"rgba(0,0,0,0.8)",
    },
  },

  // ── LIGHT ────────────────────────────────────────────────
  light: {
    name:"Light", icon:"☀️", group:"Light",
    vars:{
      "--bg":"#f8f9fc","--bg2":"#ffffff","--bg3":"#f1f3f8",
      "--border":"#dde1ea","--border2":"#eaedf4",
      "--text":"#0f1824","--text2":"#2d3a4a","--text3":"#6b7888","--text4":"#9faab8",
      "--accent":"#2563eb","--accent2":"#1d4ed8",
      "--success":"#059669","--danger":"#dc2626",
      "--canvas-dot":"#dde1ea","--node-bg":"#ffffff","--shadow":"rgba(0,0,0,0.08)",
    },
  },
  cream: {
    name:"Cream", icon:"🍦", group:"Light",
    vars:{
      "--bg":"#fdf7ee","--bg2":"#fffbf5","--bg3":"#f5edde",
      "--border":"#e0cebc","--border2":"#eadece",
      "--text":"#28180a","--text2":"#4a3020","--text3":"#8a6a48","--text4":"#b89a78",
      "--accent":"#c2622a","--accent2":"#9e4e22",
      "--success":"#2d7a3a","--danger":"#c42828",
      "--canvas-dot":"#c8b89e","--node-bg":"#fffbf5","--shadow":"rgba(0,0,0,0.07)",
    },
  },
  sepia: {
    name:"Sepia", icon:"📜", group:"Light",
    vars:{
      "--bg":"#f2e8da","--bg2":"#f9f3e8","--bg3":"#e8dece",
      "--border":"#c4a882","--border2":"#d4b892",
      "--text":"#1e1408","--text2":"#3c2a18","--text3":"#7a5e3c","--text4":"#a8886a",
      "--accent":"#7c4f1e","--accent2":"#5a3a14",
      "--success":"#2d5a1e","--danger":"#8b1c1c",
      "--canvas-dot":"#c4a882","--node-bg":"#f9f3e8","--shadow":"rgba(0,0,0,0.09)",
    },
  },
  rose: {
    name:"Rose", icon:"🌸", group:"Light",
    vars:{
      "--bg":"#fef5f7","--bg2":"#fff9fa","--bg3":"#fce8ed",
      "--border":"#f0c8d4","--border2":"#f8dce4",
      "--text":"#28080e","--text2":"#4a1420","--text3":"#9a3a50","--text4":"#c87888",
      "--accent":"#e11d48","--accent2":"#be1238",
      "--success":"#059669","--danger":"#dc2626",
      "--canvas-dot":"#dba8b8","--node-bg":"#fff9fa","--shadow":"rgba(0,0,0,0.07)",
    },
  },
  softblue: {
    name:"Soft Blue", icon:"🩵", group:"Light",
    vars:{
      "--bg":"#eff6ff","--bg2":"#f8fbff","--bg3":"#dbeafe",
      "--border":"#bfdbfe","--border2":"#dbeafe",
      "--text":"#0c1a3a","--text2":"#1e3060","--text3":"#4a6898","--text4":"#7a98c8",
      "--accent":"#2563eb","--accent2":"#1d4ed8",
      "--success":"#059669","--danger":"#dc2626",
      "--canvas-dot":"#90b8ee","--node-bg":"#f8fbff","--shadow":"rgba(0,0,0,0.07)",
    },
  },
  mint: {
    name:"Mint", icon:"🌿", group:"Light",
    vars:{
      "--bg":"#f0faf5","--bg2":"#f8fffc","--bg3":"#dcfce7",
      "--border":"#a8e6bf","--border2":"#d4f4e0",
      "--text":"#082018","--text2":"#143a28","--text3":"#3d7a58","--text4":"#6aaa88",
      "--accent":"#16a34a","--accent2":"#15803d",
      "--success":"#16a34a","--danger":"#dc2626",
      "--canvas-dot":"#80c8a0","--node-bg":"#f8fffc","--shadow":"rgba(0,0,0,0.07)",
    },
  },
  clay: {
    name:"Clay", icon:"⬜", group:"Light",
    vars:{
      "--bg":"#dde4ef","--bg2":"#e8edf5","--bg3":"#d0d8e8",
      "--border":"#c8d0e0","--border2":"#d4dcea",
      "--text":"#2d3a4e","--text2":"#3d4f68","--text3":"#7888a0","--text4":"#a8b8cc",
      "--accent":"#5b8dee","--accent2":"#2563eb",
      "--success":"#27ae60","--danger":"#e74c3c",
      "--canvas-dot":"#b0bdd0","--node-bg":"#f4f7ff","--shadow":"rgba(190,199,216,0.8)",
    },
  },
    parchment: {
    name:"Parchment", icon:"📄", group:"Light",
    vars:{
      "--bg":"#faf8f3","--bg2":"#ffffff","--bg3":"#f2ede4",
      "--border":"#d8cdb8","--border2":"#e8e0d0",
      "--text":"#1a1410","--text2":"#3a2e24","--text3":"#7a6a56","--text4":"#a89a84",
      "--accent":"#8b6914","--accent2":"#6b4e0c",
      "--success":"#3a6e28","--danger":"#9e2020",
      "--canvas-dot":"#c0b09a","--node-bg":"#ffffff","--shadow":"rgba(0,0,0,0.06)",
    },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem("nm_theme") || "dark"
  );
  const [fontScale, setFontScaleRaw] = useState(
    () => parseInt(localStorage.getItem("nm_fontscale") || "100", 10)
  );

  const theme = THEMES[themeName] || THEMES.dark;

  // Listen for skin-driven theme switches
  useEffect(() => {
    const h = (e) => { if (THEMES[e.detail]) setThemeName(e.detail); };
    window.addEventListener("nn-set-theme", h);
    return () => window.removeEventListener("nn-set-theme", h);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    // Shared semantic state tokens used by all components/skins.
    root.style.setProperty("--on-accent", "#ffffff");
    root.style.setProperty("--overlay-scrim-1", "rgba(0,0,0,0.45)");
    root.style.setProperty("--overlay-scrim-2", "rgba(0,0,0,0.62)");
    root.style.setProperty("--state-hover-bg", "color-mix(in srgb, var(--accent) 10%, var(--bg))");
    root.style.setProperty("--state-active-bg", "color-mix(in srgb, var(--accent) 18%, var(--bg))");
    root.style.setProperty("--state-selected-bg", "color-mix(in srgb, var(--accent2) 22%, var(--bg))");
    root.style.setProperty("--state-focus-ring", "0 0 0 2px var(--accent)55");
    root.style.setProperty("--state-disabled-opacity", "0.45");
    root.style.setProperty("--state-soft-danger-bg", "color-mix(in srgb, var(--danger) 14%, var(--bg))");
    root.style.setProperty("--state-soft-success-bg", "color-mix(in srgb, var(--success) 14%, var(--bg))");
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
