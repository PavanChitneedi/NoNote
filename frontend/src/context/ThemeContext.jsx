import { createContext, useContext, useState, useEffect } from "react";

// ── All themes ────────────────────────────────────────────────
export const THEMES = {
  // ── Dark themes ──────────────────────────────────────────
  dark: {
    name: "Dark",     icon: "🌑", group: "Dark",
    vars: {
      "--bg": "#0d1117", "--bg2": "#161b22", "--bg3": "#21262d",
      "--border": "#30363d", "--border2": "#21262d",
      "--text": "#e6edf3", "--text2": "#c9d1d9", "--text3": "#7d8590", "--text4": "#484f58",
      "--accent": "#58a6ff", "--accent2": "#1f6feb",
      "--success": "#3fb950", "--danger": "#f78166",
      "--canvas-dot": "#21262d", "--node-bg": "#161b22", "--shadow": "rgba(0,0,0,0.5)",
    },
  },
  midnight: {
    name: "Midnight",  icon: "🌌", group: "Dark",
    vars: {
      "--bg": "#090c14", "--bg2": "#0f1623", "--bg3": "#182033",
      "--border": "#1e2d45", "--border2": "#182033",
      "--text": "#cdd9f0", "--text2": "#a8bbd4", "--text3": "#6680a0", "--text4": "#3d5070",
      "--accent": "#4d9ef7", "--accent2": "#2563eb",
      "--success": "#34d399", "--danger": "#f87171",
      "--canvas-dot": "#182033", "--node-bg": "#0f1623", "--shadow": "rgba(0,0,0,0.7)",
    },
  },
  forest: {
    name: "Forest",   icon: "🌲", group: "Dark",
    vars: {
      "--bg": "#0d1410", "--bg2": "#121c14", "--bg3": "#1a2b1d",
      "--border": "#2d4a32", "--border2": "#1e3520",
      "--text": "#d4e8d6", "--text2": "#aed0b0", "--text3": "#6a9b6d", "--text4": "#3d6040",
      "--accent": "#4ade80", "--accent2": "#16a34a",
      "--success": "#86efac", "--danger": "#f87171",
      "--canvas-dot": "#1a2b1d", "--node-bg": "#121c14", "--shadow": "rgba(0,0,0,0.6)",
    },
  },
  ocean: {
    name: "Ocean",    icon: "🌊", group: "Dark",
    vars: {
      "--bg": "#020d18", "--bg2": "#051525", "--bg3": "#0a2238",
      "--border": "#0e3a5e", "--border2": "#0a2238",
      "--text": "#c8e8f8", "--text2": "#94c8e8", "--text3": "#4a90b8", "--text4": "#245878",
      "--accent": "#38bdf8", "--accent2": "#0284c7",
      "--success": "#34d399", "--danger": "#fb7185",
      "--canvas-dot": "#0a2238", "--node-bg": "#051525", "--shadow": "rgba(0,0,0,0.7)",
    },
  },

  // ── Light themes ─────────────────────────────────────────
  light: {
    name: "Light",    icon: "☀️", group: "Light",
    vars: {
      "--bg": "#f6f8fa", "--bg2": "#ffffff", "--bg3": "#f3f4f6",
      "--border": "#d0d7de", "--border2": "#e5e7eb",
      "--text": "#1f2328", "--text2": "#374151", "--text3": "#6b7280", "--text4": "#9ca3af",
      "--accent": "#0969da", "--accent2": "#0550ae",
      "--success": "#1a7f37", "--danger": "#cf222e",
      "--canvas-dot": "#d0d7de", "--node-bg": "#ffffff", "--shadow": "rgba(0,0,0,0.10)",
    },
  },
  cream: {
    name: "Cream",    icon: "🍦", group: "Light",
    vars: {
      "--bg": "#fdf8f0", "--bg2": "#fffdf7", "--bg3": "#f5f0e8",
      "--border": "#e2d9cc", "--border2": "#ede8df",
      "--text": "#2c2416", "--text2": "#4a3f32", "--text3": "#8a7a6a", "--text4": "#b5a898",
      "--accent": "#b45309", "--accent2": "#92400e",
      "--success": "#166534", "--danger": "#b91c1c",
      "--canvas-dot": "#ddd4c8", "--node-bg": "#fffdf7", "--shadow": "rgba(0,0,0,0.08)",
    },
  },
  sepia: {
    name: "Sepia",    icon: "📜", group: "Light",
    vars: {
      "--bg": "#f4ede4", "--bg2": "#faf5ee", "--bg3": "#ede4d8",
      "--border": "#c9b99a", "--border2": "#d8cabb",
      "--text": "#2d1f0e", "--text2": "#4a3520", "--text3": "#8b7355", "--text4": "#b09a7a",
      "--accent": "#7c4f1e", "--accent2": "#5c3510",
      "--success": "#2d6a2d", "--danger": "#8b1a1a",
      "--canvas-dot": "#c9b99a", "--node-bg": "#faf5ee", "--shadow": "rgba(0,0,0,0.10)",
    },
  },
  softblue: {
    name: "Soft Blue", icon: "🩵", group: "Light",
    vars: {
      "--bg": "#eef4fb", "--bg2": "#f8fbff", "--bg3": "#e4eef8",
      "--border": "#bdd0e8", "--border2": "#cddaee",
      "--text": "#0f2340", "--text2": "#1e3a5f", "--text3": "#4a6fa5", "--text4": "#7a9cc8",
      "--accent": "#1d6fa4", "--accent2": "#155a8a",
      "--success": "#1a6b3a", "--danger": "#b82020",
      "--canvas-dot": "#c0d4e8", "--node-bg": "#f8fbff", "--shadow": "rgba(0,0,0,0.09)",
    },
  },
  mint: {
    name: "Mint",     icon: "🌿", group: "Light",
    vars: {
      "--bg": "#f0faf4", "--bg2": "#f8fffe", "--bg3": "#e4f5ec",
      "--border": "#b8dfc8", "--border2": "#caeada",
      "--text": "#0d2918", "--text2": "#1a4028", "--text3": "#3d7a55", "--text4": "#6aaa88",
      "--accent": "#0f7a45", "--accent2": "#0a5c34",
      "--success": "#166534", "--danger": "#b91c1c",
      "--canvas-dot": "#b8dfc8", "--node-bg": "#f8fffe", "--shadow": "rgba(0,0,0,0.08)",
    },
  },
  rose: {
    name: "Rose",     icon: "🌸", group: "Light",
    vars: {
      "--bg": "#fdf2f5", "--bg2": "#fff8fa", "--bg3": "#f8e8ed",
      "--border": "#e8c0cc", "--border2": "#f0d0da",
      "--text": "#2d0a14", "--text2": "#4a1520", "--text3": "#9c4a60", "--text4": "#c87a90",
      "--accent": "#be185d", "--accent2": "#9d1550",
      "--success": "#166534", "--danger": "#b91c1c",
      "--canvas-dot": "#e0b8c4", "--node-bg": "#fff8fa", "--shadow": "rgba(0,0,0,0.08)",
    },
  },
};

// ── Font scale context ────────────────────────────────────────
const DEFAULT_SCALE = 100; // percent

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem("nm_theme") || "dark"
  );
  const [fontScale, setFontScaleRaw] = useState(
    () => parseInt(localStorage.getItem("nm_fontscale") || "100", 10)
  );

  const theme = THEMES[themeName] || THEMES.dark;

  // Apply theme CSS vars
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem("nm_theme", themeName);
  }, [theme, themeName]);

  // Apply font scale
  useEffect(() => {
    const px = Math.round((fontScale / 100) * 14); // base 14px
    document.documentElement.style.setProperty("--app-font-size", `${px}px`);
    document.body.style.fontSize = `${px}px`;
    localStorage.setItem("nm_fontscale", String(fontScale));
  }, [fontScale]);

  const setFontScale = (val) => {
    const clamped = Math.min(200, Math.max(60, Math.round(val)));
    setFontScaleRaw(clamped);
  };

  return (
    <ThemeContext.Provider value={{
      themeName, setThemeName,
      theme,
      fontScale, setFontScale,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
