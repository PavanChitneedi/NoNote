import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SKINS, SKIN_KEYS } from "../skins.js";

// Skin ↔ Theme ↔ Design recommended pairings
export const SKIN_PAIRINGS = {
  obsidian:  { theme: "dark",     design: "workspace"    },
  aurora:    { theme: "midnight", design: "clean"        },
  brutalist: { theme: "dark",     design: "professional" },
  neonTokyo: { theme: "ocean",    design: "professional" },
  neumorphic:{ theme: "light",    design: "comfort"      },
  sakura:    { theme: "cream",    design: "clean"        },
  vapor:     { theme: "midnight", design: "professional" },
  newspaper: { theme: "sepia",    design: "clean"        },
  coral:     { theme: "midnight", design: "comfort"      },
  carbon:    { theme: "dark",     design: "workspace"    },
  pastelPop: { theme: "rose",     design: "comfort"      },
};

const SkinContext = createContext(null);

export function SkinProvider({ children }) {
  const [skinName, setSkinRaw] = useState(
    () => localStorage.getItem("nn_skin") || "obsidian"
  );
  const styleRef = useRef(null);
  // Track if user has manually overridden theme/design for this skin
  const overrideRef = useRef(false);

  const applySkinVars = (skin) => {
    const root = document.documentElement;
    // Apply skin vars AFTER a tick so they win over theme+design
    Object.entries(skin.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.fontFamily = skin.vars["--font-ui"] || "";
  };

  const setSkinName = (name) => {
    if (!SKINS[name]) return;
    overrideRef.current = false;
    setSkinRaw(name);
    // Also set recommended theme & design
    const pairing = SKIN_PAIRINGS[name];
    if (pairing) {
      localStorage.setItem("nm_theme",  pairing.theme);
      localStorage.setItem("nn_design", pairing.design);
      window.dispatchEvent(new CustomEvent("nn-set-theme",  { detail: pairing.theme  }));
      window.dispatchEvent(new CustomEvent("nn-set-design", { detail: pairing.design }));
    }
  };

  useEffect(() => {
    const skin = SKINS[skinName] || SKINS.obsidian;

    // Inject CSS
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.id = "nn-skin-css";
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = skin.css || "";

    // Body class
    SKIN_KEYS.forEach(k => document.body.classList.remove(SKINS[k].bodyClass));
    document.body.classList.add(skin.bodyClass);

    // Apply vars — deferred so we run AFTER theme/design useEffects
    const t = setTimeout(() => applySkinVars(skin), 0);

    localStorage.setItem("nn_skin", skinName);
    return () => clearTimeout(t);
  }, [skinName]);

  // Re-apply skin vars whenever theme/design change (skin always wins)
  useEffect(() => {
    const reapply = () => {
      const skin = SKINS[skinName] || SKINS.obsidian;
      setTimeout(() => applySkinVars(skin), 0);
    };
    window.addEventListener("nn-theme-changed",  reapply);
    window.addEventListener("nn-design-changed", reapply);
    return () => {
      window.removeEventListener("nn-theme-changed",  reapply);
      window.removeEventListener("nn-design-changed", reapply);
    };
  }, [skinName]);

  return (
    <SkinContext.Provider value={{ skinName, setSkinName, skin: SKINS[skinName] || SKINS.obsidian, SKIN_PAIRINGS }}>
      {children}
    </SkinContext.Provider>
  );
}

export const useSkin = () => useContext(SkinContext);
