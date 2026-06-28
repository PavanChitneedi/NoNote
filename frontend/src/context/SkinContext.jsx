import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SKINS, SKIN_KEYS } from "../skins.js";

const SkinContext = createContext(null);

export function SkinProvider({ children }) {
  const [skinName, setSkinRaw] = useState(
    () => localStorage.getItem("nn_skin") || "clean"
  );
  const styleRef = useRef(null);
  const firstMount = useRef(true);

  const applyPersonality = (skin) => {
    const root = document.documentElement;
    Object.entries(skin.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.fontFamily = skin.vars["--font-ui"] || "";
  };

  const setSkinName = (name) => {
    if (!SKINS[name]) return;
    setSkinRaw(name);
    const skin = SKINS[name];
    if (skin.defaultTheme) {
      localStorage.setItem("nm_theme", skin.defaultTheme);
      window.dispatchEvent(new CustomEvent("nn-set-theme", { detail: skin.defaultTheme }));
    }
  };

  useEffect(() => {
    const skin = SKINS[skinName] || SKINS.clean;

    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.id = "nn-skin-css";
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = skin.css || "";

    SKIN_KEYS.forEach(k => document.body.classList.remove(SKINS[k].bodyClass));
    document.body.classList.add(skin.bodyClass);

    const t = setTimeout(() => applyPersonality(skin), 0);

    localStorage.setItem("nn_skin", skinName);
    firstMount.current = false;
    return () => clearTimeout(t);
  }, [skinName]);

  useEffect(() => {
    const reapply = () => {
      const skin = SKINS[skinName] || SKINS.clean;
      setTimeout(() => applyPersonality(skin), 0);
    };
    window.addEventListener("nn-theme-changed", reapply);
    window.addEventListener("nn-design-changed", reapply);
    return () => {
      window.removeEventListener("nn-theme-changed", reapply);
      window.removeEventListener("nn-design-changed", reapply);
    };
  }, [skinName]);

  return (
    <SkinContext.Provider value={{
      skinName, setSkinName,
      skin: SKINS[skinName] || SKINS.clean,
    }}>
      {children}
    </SkinContext.Provider>
  );
}

export const useSkin = () => useContext(SkinContext);
