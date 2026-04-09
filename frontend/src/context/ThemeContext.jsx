import { createContext, useContext, useState, useEffect } from "react";

export const THEMES = {
  dark: {
    name: "Dark",
    icon: "🌑",
    vars: {
      "--bg":         "#0d1117",
      "--bg2":        "#161b22",
      "--bg3":        "#21262d",
      "--border":     "#30363d",
      "--border2":    "#21262d",
      "--text":       "#e6edf3",
      "--text2":      "#c9d1d9",
      "--text3":      "#7d8590",
      "--text4":      "#484f58",
      "--accent":     "#58a6ff",
      "--accent2":    "#1f6feb",
      "--success":    "#3fb950",
      "--danger":     "#f78166",
      "--canvas-dot": "#21262d",
      "--node-bg":    "#161b22",
      "--shadow":     "rgba(0,0,0,0.5)",
    },
  },
  light: {
    name: "Light",
    icon: "☀️",
    vars: {
      "--bg":         "#f6f8fa",
      "--bg2":        "#ffffff",
      "--bg3":        "#f3f4f6",
      "--border":     "#d0d7de",
      "--border2":    "#e5e7eb",
      "--text":       "#1f2328",
      "--text2":      "#374151",
      "--text3":      "#6b7280",
      "--text4":      "#9ca3af",
      "--accent":     "#0969da",
      "--accent2":    "#0550ae",
      "--success":    "#1a7f37",
      "--danger":     "#cf222e",
      "--canvas-dot": "#d0d7de",
      "--node-bg":    "#ffffff",
      "--shadow":     "rgba(0,0,0,0.12)",
    },
  },
  midnight: {
    name: "Midnight",
    icon: "🌌",
    vars: {
      "--bg":         "#090c14",
      "--bg2":        "#0f1623",
      "--bg3":        "#182033",
      "--border":     "#1e2d45",
      "--border2":    "#182033",
      "--text":       "#cdd9f0",
      "--text2":      "#a8bbd4",
      "--text3":      "#6680a0",
      "--text4":      "#3d5070",
      "--accent":     "#4d9ef7",
      "--accent2":    "#2563eb",
      "--success":    "#34d399",
      "--danger":     "#f87171",
      "--canvas-dot": "#182033",
      "--node-bg":    "#0f1623",
      "--shadow":     "rgba(0,0,0,0.7)",
    },
  },
  forest: {
    name: "Forest",
    icon: "🌲",
    vars: {
      "--bg":         "#0d1410",
      "--bg2":        "#121c14",
      "--bg3":        "#1a2b1d",
      "--border":     "#2d4a32",
      "--border2":    "#1e3520",
      "--text":       "#d4e8d6",
      "--text2":      "#aed0b0",
      "--text3":      "#6a9b6d",
      "--text4":      "#3d6040",
      "--accent":     "#4ade80",
      "--accent2":    "#16a34a",
      "--success":    "#86efac",
      "--danger":     "#f87171",
      "--canvas-dot": "#1a2b1d",
      "--node-bg":    "#121c14",
      "--shadow":     "rgba(0,0,0,0.6)",
    },
  },
  ocean: {
    name: "Ocean",
    icon: "🌊",
    vars: {
      "--bg":         "#020d18",
      "--bg2":        "#051525",
      "--bg3":        "#0a2238",
      "--border":     "#0e3a5e",
      "--border2":    "#0a2238",
      "--text":       "#c8e8f8",
      "--text2":      "#94c8e8",
      "--text3":      "#4a90b8",
      "--text4":      "#245878",
      "--accent":     "#38bdf8",
      "--accent2":    "#0284c7",
      "--success":    "#34d399",
      "--danger":     "#fb7185",
      "--canvas-dot": "#0a2238",
      "--node-bg":    "#051525",
      "--shadow":     "rgba(0,0,0,0.7)",
    },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem("nm_theme") || "dark"
  );

  const theme = THEMES[themeName] || THEMES.dark;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem("nm_theme", themeName);
  }, [theme, themeName]);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, theme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
