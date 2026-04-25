import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SKINS, SKIN_KEYS } from "../skins.js";

const SkinContext = createContext(null);

export function SkinProvider({ children }) {
  const [skinName, setSkinRaw] = useState(
    () => localStorage.getItem("nn_skin") || "obsidian"
  );
  const styleRef = useRef(null);

  const setSkinName = (name) => { if (SKINS[name]) setSkinRaw(name); };

  const applyVars = (skin) => {
    const root = document.documentElement;
    Object.entries(skin.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.fontFamily = skin.vars["--font-ui"] || "";
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

    // Apply vars deferred — runs after theme+design effects
    const t = setTimeout(() => applyVars(skin), 0);
    localStorage.setItem("nn_skin", skinName);
    return () => clearTimeout(t);
  }, [skinName]);

  // Re-apply skin vars on top whenever theme/design change
  useEffect(() => {
    const reapply = () => {
      const skin = SKINS[skinName] || SKINS.obsidian;
      setTimeout(() => applyVars(skin), 0);
    };
    window.addEventListener("nn-theme-changed", reapply);
    window.addEventListener("nn-design-changed", reapply);
    return () => {
      window.removeEventListener("nn-theme-changed", reapply);
      window.removeEventListener("nn-design-changed", reapply);
    };
  }, [skinName]);

  return (
    <SkinContext.Provider value={{ skinName, setSkinName, skin: SKINS[skinName] || SKINS.obsidian }}>
      {children}
    </SkinContext.Provider>
  );
}

export const useSkin = () => useContext(SkinContext);
