import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SKINS, SKIN_KEYS } from "../skins.js";

const SkinContext = createContext(null);

export function SkinProvider({ children }) {
  const [skinName, setSkinNameRaw] = useState(
    () => localStorage.getItem("nn_skin") || "default"
  );

  const styleRef = useRef(null);

  const setSkinName = (name) => {
    if (SKINS[name]) setSkinNameRaw(name);
  };

  useEffect(() => {
    const skin = SKINS[skinName] || SKINS.default;
    const root = document.documentElement;

    // 1. Apply CSS variables
    Object.entries(skin.vars).forEach(([k, v]) => root.style.setProperty(k, v));

    // 2. Apply body class
    SKIN_KEYS.forEach(k => document.body.classList.remove(SKINS[k].bodyClass));
    document.body.classList.add(skin.bodyClass);

    // 3. Inject skin-specific CSS
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.id = "nn-skin-css";
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = skin.css || "";

    // 4. Persist
    localStorage.setItem("nn_skin", skinName);

    // 5. If skin forces a theme, apply it (soft override — user can still change)
    if (skin.forceTheme && !localStorage.getItem("nn_skin_theme_overridden_" + skinName)) {
      const event = new CustomEvent("nn-skin-force-theme", { detail: skin.forceTheme });
      window.dispatchEvent(event);
    }
  }, [skinName]);

  const skin = SKINS[skinName] || SKINS.default;

  return (
    <SkinContext.Provider value={{ skinName, setSkinName, skin }}>
      {children}
    </SkinContext.Provider>
  );
}

export const useSkin = () => useContext(SkinContext);
