import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({});

// ── 8 Carefully designed themes ───────────────────────────────
// Each references a real-world design system for consistency
export const THEMES = {

  // 1. Slate — Linear.app inspired. Professional blue-slate dark.
  slate: {
    name:"Slate", icon:"◈", group:"Dark",
    desc:"Professional dark — like Linear",
    vars:{
      "--bg":"#0f1117","--bg2":"#181c27","--bg3":"#1e2235",
      "--border":"rgba(255,255,255,0.07)","--border2":"rgba(255,255,255,0.04)",
      "--text":"#e8eaf0","--text2":"#7c83a0","--text3":"#3d4360","--text4":"#252840",
      "--accent":"#5e7ce2","--accent2":"#3b5bd9",
      "--success":"#3ecf8e","--danger":"#f56565","--warn":"#f6ad55",
      "--canvas-dot":"rgba(255,255,255,0.04)","--node-bg":"#181c27","--shadow":"rgba(0,0,0,0.5)",
    },
  },

  // 2. Arctic — Vercel/Tailwind inspired. Crisp cool white.
  arctic: {
    name:"Arctic", icon:"❄", group:"Light",
    desc:"Crisp light — like Vercel",
    vars:{
      "--bg":"#f4f7fb","--bg2":"#ffffff","--bg3":"#e8eef6",
      "--border":"#e2e8f0","--border2":"#eef2f8",
      "--text":"#1e293b","--text2":"#475569","--text3":"#94a3b8","--text4":"#cbd5e1",
      "--accent":"#3b82f6","--accent2":"#2563eb",
      "--success":"#10b981","--danger":"#ef4444","--warn":"#f59e0b",
      "--canvas-dot":"#c8d8ee","--node-bg":"#ffffff","--shadow":"rgba(15,23,42,0.08)",
    },
  },

  // 3. Amber — Bear app / Obsidian inspired. Warm amber on dark.
  amber: {
    extra: true,
    name:"Amber", icon:"🔥", group:"Dark",
    desc:"Warm focus — like Bear",
    vars:{
      "--bg":"#141210","--bg2":"#1c1917","--bg3":"#242019",
      "--border":"rgba(255,255,255,0.06)","--border2":"rgba(255,255,255,0.03)",
      "--text":"#fef3c7","--text2":"#a8956a","--text3":"#5a4a30","--text4":"#332b1e",
      "--accent":"#f59e0b","--accent2":"#d97706",
      "--success":"#10b981","--danger":"#f87171","--warn":"#fb923c",
      "--canvas-dot":"rgba(255,255,255,0.03)","--node-bg":"#1c1917","--shadow":"rgba(0,0,0,0.5)",
    },
  },

  // 4. Sakura — Craft.do inspired. Warm cream-rose light.
  sakura: {
    name:"Sakura", icon:"🌸", group:"Light",
    desc:"Warm & human — like Craft",
    vars:{
      "--bg":"#fdf8f5","--bg2":"#ffffff","--bg3":"#f5ede8",
      "--border":"#e8d5cc","--border2":"#f2e8e2",
      "--text":"#2d1f1a","--text2":"#7a5c52","--text3":"#b8948a","--text4":"#d4b8b2",
      "--accent":"#e8614c","--accent2":"#c94a37",
      "--success":"#34a853","--danger":"#ea4335","--warn":"#fbbc04",
      "--canvas-dot":"#d0b8b0","--node-bg":"#ffffff","--shadow":"rgba(45,31,26,0.08)",
    },
  },

  // 5. Midnight — Raycast inspired. Deep navy, rich and calm.
  midnight: {
    name:"Midnight", icon:"🌙", group:"Dark",
    desc:"Rich and calm — like Raycast",
    vars:{
      "--bg":"#07090f","--bg2":"#0d1117","--bg3":"#141a24",
      "--border":"rgba(255,255,255,0.06)","--border2":"rgba(255,255,255,0.03)",
      "--text":"#c9d1d9","--text2":"#586374","--text3":"#2d3748","--text4":"#1a2332",
      "--accent":"#7aa2f7","--accent2":"#5a82e4",
      "--success":"#73daca","--danger":"#f7768e","--warn":"#e0af68",
      "--canvas-dot":"rgba(255,255,255,0.03)","--node-bg":"#0d1117","--shadow":"rgba(0,0,0,0.7)",
    },
  },

  // 6. Emerald — Supabase inspired. Dark with emerald accent.
  emerald: {
    extra: true,
    name:"Emerald", icon:"💚", group:"Dark",
    desc:"Dev-friendly — like Supabase",
    vars:{
      "--bg":"#0a0f0a","--bg2":"#111811","--bg3":"#192019",
      "--border":"rgba(255,255,255,0.06)","--border2":"rgba(255,255,255,0.03)",
      "--text":"#d4f4d4","--text2":"#6a9e6a","--text3":"#2e5230","--text4":"#1a301a",
      "--accent":"#3ecf8e","--accent2":"#29b97a",
      "--success":"#3ecf8e","--danger":"#f87171","--warn":"#fbbf24",
      "--canvas-dot":"rgba(255,255,255,0.03)","--node-bg":"#111811","--shadow":"rgba(0,0,0,0.6)",
    },
  },

  // 7. Rose — Superhuman inspired. Warm rose-white, energetic.
  rose: {
    extra: true,
    name:"Rose", icon:"🌹", group:"Light",
    desc:"Warm & energetic — like Superhuman",
    vars:{
      "--bg":"#fff8f8","--bg2":"#ffffff","--bg3":"#fce8e8",
      "--border":"#fcd5d5","--border2":"#fde8e8",
      "--text":"#2d0f1a","--text2":"#7a3a52","--text3":"#b87a8a","--text4":"#ddb4be",
      "--accent":"#e8305a","--accent2":"#c4204a",
      "--success":"#34a853","--danger":"#ea4335","--warn":"#fbbc04",
      "--canvas-dot":"#e0b8c4","--node-bg":"#ffffff","--shadow":"rgba(45,15,26,0.08)",
    },
  },

  // 8. Void — Warp terminal inspired. Near-black, pure focus.
  void: {
    extra: true,
    name:"Void", icon:"◉", group:"Dark",
    desc:"Pure focus — like Warp",
    vars:{
      "--bg":"#020203","--bg2":"#06060a","--bg3":"#0c0c14",
      "--border":"rgba(255,255,255,0.05)","--border2":"rgba(255,255,255,0.02)",
      "--text":"#e2e8f0","--text2":"#4a5568","--text3":"#2d3748","--text4":"#1a202c",
      "--accent":"#a78bfa","--accent2":"#7c3aed",
      "--success":"#68d391","--danger":"#fc8181","--warn":"#f6ad55",
      "--canvas-dot":"rgba(255,255,255,0.025)","--node-bg":"#06060a","--shadow":"rgba(0,0,0,0.8)",
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES);
export const THEME_GROUPS = {
  Dark: THEME_KEYS.filter(k => THEMES[k].group === "Dark"),
  Light: THEME_KEYS.filter(k => THEMES[k].group === "Light"),
};

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem("nn_theme") || "arctic"
  );
  const [fontScale, setFontScaleRaw] = useState(
    () => parseInt(localStorage.getItem("nn_fontscale") || "100", 10)
  );

  const theme = THEMES[themeName] || THEMES.arctic;

  useEffect(() => {
    const h = (e) => { if (THEMES[e.detail]) setThemeName(e.detail); };
    window.addEventListener("nn-set-theme", h);
    return () => window.removeEventListener("nn-set-theme", h);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.dataset.theme = themeName;
    localStorage.setItem("nn_theme", themeName);
    window.dispatchEvent(new CustomEvent("nn-theme-changed", { detail: themeName }));
  }, [theme, themeName]);

  const setFontScale = (v) => {
    setFontScaleRaw(v);
    localStorage.setItem("nn_fontscale", v);
  };

  useEffect(() => {
    const px = Math.round((fontScale / 100) * 13);
    document.documentElement.style.setProperty("--app-font-size", `${px}px`);
  }, [fontScale]);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, theme, fontScale, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
