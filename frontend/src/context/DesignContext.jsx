import { createContext, useContext, useState, useEffect } from "react";

// Design = spacing + density ONLY
// Fonts, radius, shadows = Skin's territory
// Colors = Theme's territory
export const DESIGNS = {
  workspace: {
    name:"Workspace", icon:"⚙️",
    desc:"Dense, tight — original developer feel",
    vars:{
      "--topbar-h":"48px","--node-header-h":"34px",
      "--node-pad":"8px 10px","--node-body-pad":"6px 10px 8px",
      "--btn-pad":"5px 10px","--sidebar-w":"220px","--props-w":"268px",
      "--node-border-w":"2px","--line-height":"1.5","--letter-space":"0px",
    },
  },
  clean: {
    name:"Clean", icon:"✨",
    desc:"Spacious and modern — Notion-like clarity",
    vars:{
      "--topbar-h":"56px","--node-header-h":"40px",
      "--node-pad":"12px 14px","--node-body-pad":"10px 14px 12px",
      "--btn-pad":"7px 14px","--sidebar-w":"240px","--props-w":"290px",
      "--node-border-w":"1px","--line-height":"1.6","--letter-space":"0px",
    },
  },
  comfort: {
    name:"Comfort", icon:"🛋️",
    desc:"Extra breathing room — relaxed reading experience",
    vars:{
      "--topbar-h":"60px","--node-header-h":"46px",
      "--node-pad":"16px 18px","--node-body-pad":"14px 18px 16px",
      "--btn-pad":"10px 20px","--sidebar-w":"250px","--props-w":"310px",
      "--node-border-w":"1px","--line-height":"1.75","--letter-space":"0.02em",
    },
  },
  professional: {
    name:"Professional", icon:"💼",
    desc:"Balanced corporate layout — precise and refined",
    vars:{
      "--topbar-h":"52px","--node-header-h":"38px",
      "--node-pad":"10px 12px","--node-body-pad":"8px 12px 10px",
      "--btn-pad":"6px 12px","--sidebar-w":"228px","--props-w":"276px",
      "--node-border-w":"1px","--line-height":"1.55","--letter-space":"0.01em",
    },
  },
  minimal: {
    name:"Minimal", icon:"◻️",
    desc:"Ultra-sparse — maximum focus, minimum chrome",
    vars:{
      "--topbar-h":"40px","--node-header-h":"30px",
      "--node-pad":"6px 8px","--node-body-pad":"4px 8px 6px",
      "--btn-pad":"4px 8px","--sidebar-w":"200px","--props-w":"256px",
      "--node-border-w":"1px","--line-height":"1.4","--letter-space":"0px",
    },
  },
};

const DesignContext = createContext(null);

export function DesignProvider({ children }) {
  const [designName, setDesignNameRaw] = useState(
    () => localStorage.getItem("nn_design") || "workspace"
  );

  const setDesignName = (name) => { if (DESIGNS[name]) setDesignNameRaw(name); };

  // Listen for skin-driven design switches
  useEffect(() => {
    const h = (e) => { if (DESIGNS[e.detail]) setDesignNameRaw(e.detail); };
    window.addEventListener("nn-set-design", h);
    return () => window.removeEventListener("nn-set-design", h);
  }, []);

  useEffect(() => {
    const design = DESIGNS[designName] || DESIGNS.workspace;
    const root = document.documentElement;
    Object.entries(design.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem("nn_design", designName);
    window.dispatchEvent(new CustomEvent("nn-design-changed", { detail: designName }));
  }, [designName]);

  const design = DESIGNS[designName] || DESIGNS.workspace;
  return (
    <DesignContext.Provider value={{ designName, setDesignName, design }}>
      {children}
    </DesignContext.Provider>
  );
}

export const useDesign = () => useContext(DesignContext);
