import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SKINS, SKIN_KEYS, getSkinPalettes } from "../skins.js";

const SkinContext = createContext(null);

export function SkinProvider({ children }) {
  const [skinName, setSkinRaw] = useState(
    () => localStorage.getItem("nn_skin") || "obsidian"
  );
  const [variantName, setVariantRaw] = useState(
    () => localStorage.getItem(`nn_skin_variant_${localStorage.getItem("nn_skin") || "obsidian"}`) || null
  );
  const styleRef = useRef(null);
  const firstMount = useRef(true);

  // One-time migration from legacy global theme to per-skin variant.
  useEffect(() => {
    const legacyTheme = localStorage.getItem("nm_theme");
    if (!legacyTheme) return;
    const palettes = getSkinPalettes(skinName);
    const fallback = Object.keys(palettes).includes(SKINS[skinName]?.defaultTheme)
      ? SKINS[skinName].defaultTheme
      : Object.keys(palettes)[0];
    const migrated = palettes[legacyTheme] ? legacyTheme : fallback;
    localStorage.setItem(`nn_skin_variant_${skinName}`, migrated);
    setVariantRaw(migrated);
    localStorage.removeItem("nm_theme");
  }, []);

  // Apply palette + personality vars
  const applySkinTokens = (skin, variant) => {
    const root = document.documentElement;
    const palettes = getSkinPalettes(skinName);
    const paletteVars = palettes[variant] || palettes[skin.defaultTheme] || Object.values(palettes)[0] || {};
    Object.entries(paletteVars).forEach(([k, v]) => root.style.setProperty(k, v));
    Object.entries(skin.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.setProperty("--on-accent", "#ffffff");
    root.style.setProperty("--overlay-scrim-1", "rgba(0,0,0,0.45)");
    root.style.setProperty("--overlay-scrim-2", "rgba(0,0,0,0.62)");
    root.style.setProperty("--state-hover-bg", "color-mix(in srgb, var(--accent) 10%, var(--bg))");
    root.style.setProperty("--state-active-bg", "color-mix(in srgb, var(--accent) 18%, var(--bg))");
    root.style.setProperty("--state-selected-bg", "color-mix(in srgb, var(--accent2) 22%, var(--bg))");
    root.style.setProperty("--state-focus-ring", "0 0 0 2px var(--accent)55");
    root.style.setProperty("--state-disabled-opacity", "0.45");
    root.style.setProperty("--state-soft-danger-bg", "color-mix(in srgb, var(--danger) 14%, var(--bg))");
    root.style.setProperty("--state-soft-success-bg", "color-mix(in srgb, var(--success) 14%, var(--bg))");
    document.body.style.fontFamily = skin.vars["--font-ui"] || "";
    document.body.dataset.theme = variant || skin.defaultTheme || "dark";
  };

  const setSkinName = (name) => {
    if (!SKINS[name]) return;
    setSkinRaw(name);
    const skin = SKINS[name];
    const palettes = getSkinPalettes(name);
    const variantKeys = Object.keys(palettes);
    const preferredVariant = variantKeys.includes(skin.defaultTheme) ? skin.defaultTheme : variantKeys[0];
    setVariantRaw(preferredVariant);
    localStorage.setItem(`nn_skin_variant_${name}`, preferredVariant);
    // Legacy theme key is deprecated in skin-only mode.
    localStorage.removeItem("nm_theme");
    // Apply default accent — clears any previous accent override
    if (skin.defaultAccent) {
      localStorage.setItem("nn_skin_accent", JSON.stringify({ accent: skin.defaultAccent.accent, accent2: skin.defaultAccent.accent2, skinName: name }));
    } else {
      localStorage.removeItem("nn_skin_accent");
    }
  };

  const setSkinVariant = (variant) => {
    const palettes = getSkinPalettes(skinName);
    if (!palettes[variant]) return;
    setVariantRaw(variant);
    localStorage.setItem(`nn_skin_variant_${skinName}`, variant);
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
      const palettes = getSkinPalettes(skinName);
      const defaultVariant = Object.keys(palettes).includes(skin.defaultTheme) ? skin.defaultTheme : Object.keys(palettes)[0];
      const savedVariant = localStorage.getItem(`nn_skin_variant_${skinName}`);
      const resolvedVariant = palettes[savedVariant] ? savedVariant : (variantName || defaultVariant);
      applySkinTokens(skin, resolvedVariant);
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
  }, [skinName, variantName]);

  // Re-apply skin tokens when design changes
  useEffect(() => {
    const reapply = () => {
      const skin = SKINS[skinName] || SKINS.obsidian;
      const palettes = getSkinPalettes(skinName);
      const defaultVariant = Object.keys(palettes).includes(skin.defaultTheme) ? skin.defaultTheme : Object.keys(palettes)[0];
      const resolvedVariant = palettes[variantName] ? variantName : defaultVariant;
      setTimeout(() => applySkinTokens(skin, resolvedVariant), 0);
    };
    window.addEventListener("nn-design-changed", reapply);
    return () => {
      window.removeEventListener("nn-design-changed", reapply);
    };
  }, [skinName, variantName]);

  return (
    <SkinContext.Provider value={{
      skinName, setSkinName,
      skin: SKINS[skinName] || SKINS.obsidian,
      skinVariants: Object.keys(getSkinPalettes(skinName)),
      skinVariant: variantName || SKINS[skinName]?.defaultTheme,
      setSkinVariant,
      setAccent,
    }}>
      {children}
    </SkinContext.Provider>
  );
}

export const useSkin = () => useContext(SkinContext);
