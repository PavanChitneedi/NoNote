import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SKINS, SKIN_KEYS } from "../skins.js";

const SkinContext = createContext(null);

export function SkinProvider({ children }) {
  const [skinName, setSkinRaw] = useState(
    () => localStorage.getItem("nn_skin") || "obsidian"
  );
  const styleRef = useRef(null);
  const firstMount = useRef(true);

  // Apply only personality vars (no colors, no spacing)
  const applyPersonality = (skin) => {
    const root = document.documentElement;
    Object.entries(skin.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.fontFamily = skin.vars["--font-ui"] || "";
  };

  const setSkinName = (name) => {
    if (!SKINS[name]) return;
    setSkinRaw(name);
    const skin = SKINS[name];
    // Apply default theme
    if (skin.defaultTheme) {
      localStorage.setItem("nm_theme", skin.defaultTheme);
      window.dispatchEvent(new CustomEvent("nn-set-theme", { detail: skin.defaultTheme }));
    }
    // Apply default accent — clears any previous accent override
    if (skin.defaultAccent) {
      localStorage.setItem("nn_skin_accent", JSON.stringify({ accent: skin.defaultAccent.accent, accent2: skin.defaultAccent.accent2, skinName: name }));
    } else {
      localStorage.removeItem("nn_skin_accent");
    }
  };

  // Apply accent color override
  const setAccent = (accent, accent2) => {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent2", accent2);
    localStorage.setItem("nn_skin_accent", JSON.stringify({ accent, accent2, skinName }));
  };

  useEffect(() => {
    const skin = SKINS[skinName] || SKINS.obsidian;

    // CSS injection
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.id = "nn-skin-css";
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = skin.css || "";

    // Body class swap
    SKIN_KEYS.forEach(k => document.body.classList.remove(SKINS[k].bodyClass));
    document.body.classList.add(skin.bodyClass);

    // Apply personality — deferred so theme/design run first, then skin wins on font/radius
    const t = setTimeout(() => {
      applyPersonality(skin);
      // Apply accent — saved override first, then defaultAccent
      try {
        const saved = JSON.parse(localStorage.getItem("nn_skin_accent") || "{}");
        const skin2 = SKINS[skinName];
        if (saved.skinName === skinName && saved.accent) {
          document.documentElement.style.setProperty("--accent", saved.accent);
          document.documentElement.style.setProperty("--accent2", saved.accent2 || saved.accent);
        } else if (skin2?.defaultAccent) {
          document.documentElement.style.setProperty("--accent", skin2.defaultAccent.accent);
          document.documentElement.style.setProperty("--accent2", skin2.defaultAccent.accent2);
        }
      } catch {}
    }, 0);

    localStorage.setItem("nn_skin", skinName);
    firstMount.current = false;
    return () => clearTimeout(t);
  }, [skinName]);

  // Re-apply personality when theme/design change (skin personality always wins over them)
  useEffect(() => {
    const reapply = () => {
      const skin = SKINS[skinName] || SKINS.obsidian;
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
      skin: SKINS[skinName] || SKINS.obsidian,
      setAccent,
    }}>
      {children}
    </SkinContext.Provider>
  );
}

export const useSkin = () => useContext(SkinContext);
