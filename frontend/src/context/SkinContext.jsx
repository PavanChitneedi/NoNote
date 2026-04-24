import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SKINS, SKIN_KEYS } from "../skins.js";

const SkinContext = createContext(null);

export function SkinProvider({ children }) {
  const [skinName, setSkinRaw] = useState(
    () => localStorage.getItem("nn_skin") || "obsidian"
  );
  const styleRef = useRef(null);

  const setSkinName = (name) => { if (SKINS[name]) setSkinRaw(name); };

  useEffect(() => {
    const skin = SKINS[skinName] || SKINS.obsidian;
    const root = document.documentElement;

    // Apply ALL vars — fully overrides ThemeContext and DesignContext
    Object.entries(skin.vars).forEach(([k, v]) => root.style.setProperty(k, v));

    // Swap body class
    SKIN_KEYS.forEach(k => document.body.classList.remove(SKINS[k].bodyClass));
    document.body.classList.add(skin.bodyClass);

    // Inject skin CSS
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.id = "nn-skin-css";
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = skin.css || "";

    // Body font-family
    document.body.style.fontFamily = skin.vars["--font-ui"] || "";

    localStorage.setItem("nn_skin", skinName);
  }, [skinName]);

  return (
    <SkinContext.Provider value={{ skinName, setSkinName, skin: SKINS[skinName] || SKINS.obsidian }}>
      {children}
    </SkinContext.Provider>
  );
}

export const useSkin = () => useContext(SkinContext);
