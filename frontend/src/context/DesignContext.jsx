import { useEffect } from "react";

// Design = spacing + density ONLY. Fonts, radius, shadows = Skin's territory.
// Colors = Theme's territory.
//
// This used to be user-selectable — 5 presets (Workspace/Clean/Comfort/
// Professional/Minimal, see changelog.js v5.35.2) with a working switch
// mechanism and skins carrying a defaultDesign field to auto-apply one on
// skin switch. The auto-apply was removed later (changelog.js: "Removed:
// defaultDesign auto-apply on skin switch") and nothing ever replaced it —
// no Design tab exists in ThemePicker.jsx, no skin carries defaultDesign.
// The switch mechanism and the 4 unreachable presets were removed here
// since nothing called them; only the values that were actually always
// applied (the "workspace" preset) remain.
const VARS = {
  "--topbar-h": "48px", "--node-header-h": "34px",
  "--node-pad": "8px 10px", "--node-body-pad": "6px 10px 8px",
  "--btn-pad": "5px 10px", "--sidebar-w": "220px", "--props-w": "268px",
  "--node-border-w": "2px", "--line-height": "1.5", "--letter-space": "0px",
};

export function DesignProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(VARS).forEach(([k, v]) => root.style.setProperty(k, v));
  }, []);

  return children;
}
