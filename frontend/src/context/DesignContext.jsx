import { createContext, useContext, useState, useEffect } from "react";

// Each design controls: typography, spacing, border-radius, shadows, node shapes, density
export const DESIGNS = {
  workspace: {
    name: "Workspace",
    desc: "Dense technical layout — the original NodeMap feel",
    icon: "⚙️",
    preview: ["#0d1117","#161b22","#58a6ff"],
    vars: {
      "--font-ui":         "'JetBrains Mono', 'Fira Code', monospace",
      "--font-node":       "'JetBrains Mono', 'Fira Code', monospace",
      "--font-weight-ui":  "700",
      "--font-weight-node":"600",
      "--radius-xs":       "4px",
      "--radius-sm":       "6px",
      "--radius-md":       "8px",
      "--radius-lg":       "10px",
      "--radius-node":     "10px",
      "--radius-btn":      "6px",
      "--topbar-h":        "48px",
      "--node-header-h":   "34px",
      "--node-pad":        "8px 10px",
      "--node-body-pad":   "6px 10px 8px",
      "--node-border-w":   "2px",
      "--btn-pad":         "5px 10px",
      "--sidebar-w":       "178px",
      "--props-w":         "268px",
      "--letter-space":    "0.3px",
      "--shadow-node":     "0 2px 12px rgba(0,0,0,0.4)",
      "--shadow-node-sel": "0 0 0 3px rgba(88,166,255,0.25), 0 6px 28px rgba(0,0,0,0.5)",
      "--transition-all":  "all 0.12s",
      "--line-height":     "1.5",
    },
  },

  clean: {
    name: "Clean",
    desc: "Spacious, modern — Notion-inspired clarity",
    icon: "✨",
    preview: ["#f8fafc","#ffffff","#3b82f6"],
    vars: {
      "--font-ui":         "system-ui, -apple-system, 'Segoe UI', sans-serif",
      "--font-node":       "system-ui, -apple-system, 'Segoe UI', sans-serif",
      "--font-weight-ui":  "600",
      "--font-weight-node":"500",
      "--radius-xs":       "6px",
      "--radius-sm":       "8px",
      "--radius-md":       "12px",
      "--radius-lg":       "16px",
      "--radius-node":     "14px",
      "--radius-btn":      "8px",
      "--topbar-h":        "56px",
      "--node-header-h":   "40px",
      "--node-pad":        "12px 14px",
      "--node-body-pad":   "10px 14px 12px",
      "--node-border-w":   "1px",
      "--btn-pad":         "7px 14px",
      "--sidebar-w":       "200px",
      "--props-w":         "290px",
      "--letter-space":    "0px",
      "--shadow-node":     "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.06)",
      "--shadow-node-sel": "0 0 0 2px rgba(59,130,246,0.4), 0 8px 32px rgba(0,0,0,0.12)",
      "--transition-all":  "all 0.18s ease",
      "--line-height":     "1.65",
    },
  },

  professional: {
    name: "Professional",
    desc: "Sharp, structured — Figma / enterprise tool feel",
    icon: "💼",
    preview: ["#1e1e2e","#27273a","#7c3aed"],
    vars: {
      "--font-ui":         "'Inter', system-ui, sans-serif",
      "--font-node":       "'Inter', system-ui, sans-serif",
      "--font-weight-ui":  "600",
      "--font-weight-node":"500",
      "--radius-xs":       "2px",
      "--radius-sm":       "4px",
      "--radius-md":       "6px",
      "--radius-lg":       "8px",
      "--radius-node":     "6px",
      "--radius-btn":      "4px",
      "--topbar-h":        "44px",
      "--node-header-h":   "32px",
      "--node-pad":        "8px 12px",
      "--node-body-pad":   "6px 12px 8px",
      "--node-border-w":   "1px",
      "--btn-pad":         "5px 10px",
      "--sidebar-w":       "180px",
      "--props-w":         "260px",
      "--letter-space":    "0.1px",
      "--shadow-node":     "0 1px 3px rgba(0,0,0,0.25)",
      "--shadow-node-sel": "0 0 0 2px rgba(124,58,237,0.5), 0 4px 16px rgba(0,0,0,0.3)",
      "--transition-all":  "all 0.1s",
      "--line-height":     "1.5",
    },
  },

  comfort: {
    name: "Comfort",
    desc: "Soft, rounded, easy on the eyes — long sessions",
    icon: "☁️",
    preview: ["#fdf6ee","#ffffff","#d97706"],
    vars: {
      "--font-ui":         "'Nunito', 'Segoe UI', system-ui, sans-serif",
      "--font-node":       "'Nunito', 'Segoe UI', system-ui, sans-serif",
      "--font-weight-ui":  "700",
      "--font-weight-node":"600",
      "--radius-xs":       "8px",
      "--radius-sm":       "12px",
      "--radius-md":       "16px",
      "--radius-lg":       "20px",
      "--radius-node":     "18px",
      "--radius-btn":      "12px",
      "--topbar-h":        "60px",
      "--node-header-h":   "44px",
      "--node-pad":        "14px 16px",
      "--node-body-pad":   "10px 16px 14px",
      "--node-border-w":   "1.5px",
      "--btn-pad":         "8px 16px",
      "--sidebar-w":       "210px",
      "--props-w":         "300px",
      "--letter-space":    "0.2px",
      "--shadow-node":     "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
      "--shadow-node-sel": "0 0 0 3px rgba(217,119,6,0.3), 0 8px 32px rgba(0,0,0,0.12)",
      "--transition-all":  "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      "--line-height":     "1.7",
    },
  },

  minimal: {
    name: "Minimal",
    desc: "Pure whitespace, no noise — focus on content",
    icon: "⬜",
    preview: ["#ffffff","#fafafa","#000000"],
    vars: {
      "--font-ui":         "'DM Sans', system-ui, sans-serif",
      "--font-node":       "'DM Sans', system-ui, sans-serif",
      "--font-weight-ui":  "500",
      "--font-weight-node":"400",
      "--radius-xs":       "4px",
      "--radius-sm":       "6px",
      "--radius-md":       "8px",
      "--radius-lg":       "12px",
      "--radius-node":     "8px",
      "--radius-btn":      "6px",
      "--topbar-h":        "52px",
      "--node-header-h":   "38px",
      "--node-pad":        "10px 14px",
      "--node-body-pad":   "8px 14px 10px",
      "--node-border-w":   "1px",
      "--btn-pad":         "6px 12px",
      "--sidebar-w":       "190px",
      "--props-w":         "280px",
      "--letter-space":    "0px",
      "--shadow-node":     "0 2px 8px rgba(0,0,0,0.06)",
      "--shadow-node-sel": "0 0 0 2px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08)",
      "--transition-all":  "all 0.15s ease",
      "--line-height":     "1.6",
    },
  },
};

const DesignContext = createContext(null);

export function DesignProvider({ children }) {
  const [designName, setDesignNameRaw] = useState(
    () => localStorage.getItem("nn_design") || "workspace"
  );

  const design = DESIGNS[designName] || DESIGNS.workspace;

  const setDesignName = (name) => {
    if (DESIGNS[name]) setDesignNameRaw(name);
  };

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(design.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    // Apply font-family to body
    document.body.style.fontFamily = design.vars["--font-ui"];
    localStorage.setItem("nn_design", designName);
  }, [design, designName]);

  return (
    <DesignContext.Provider value={{ designName, setDesignName, design }}>
      {children}
    </DesignContext.Provider>
  );
}

export const useDesign = () => useContext(DesignContext);
