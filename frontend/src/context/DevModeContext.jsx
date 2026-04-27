/**
 * DevModeContext — UI inspection system
 * Activation: ?devMode=true URL param, Ctrl+Shift+D, or DEV button in topbar
 * When OFF: zero impact on app behavior (no event listeners, no DOM changes)
 */
import { createContext, useContext, useState, useEffect, useRef } from "react";

const Ctx = createContext({ devMode: false, setDevMode: () => {} });

export function DevModeProvider({ children }) {
  const [devMode, setDevModeState] = useState(false); // always starts OFF for safety

  // Only activate from localStorage/URL after mount (client-side only)
  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get("devMode") === "true";
    const stored   = localStorage.getItem("nn_devmode") === "true";
    if (urlParam || stored) setDevModeState(true);
  }, []);

  const setDevMode = (v) => {
    setDevModeState(v);
    localStorage.setItem("nn_devmode", v ? "true" : "false");
  };

  // Ctrl+Shift+D toggle
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDevMode(!devMode);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [devMode]);

  return (
    <Ctx.Provider value={{ devMode, setDevMode }}>
      {children}
      {devMode && <DevModeOverlay setDevMode={setDevMode} />}
    </Ctx.Provider>
  );
}

export const useDevMode = () => useContext(Ctx);

/* ── Inspector overlay — only mounted when devMode=true ──────────── */
function DevModeOverlay({ setDevMode }) {
  const [tooltip, setTooltip] = useState(null);
  const [copied,  setCopied]  = useState(false);
  const highlightedEl         = useRef(null);

  const getMeta = (el) => {
    let node = el;
    while (node && node !== document.body) {
      if (node.dataset?.ui) return {
        id:        node.dataset.ui        || "—",
        component: node.dataset.component || "—",
        page:      node.dataset.page      || "—",
        role:      node.dataset.role      || "—",
        state:     node.dataset.state     || "default",
        variant:   node.dataset.variant   || null,
        tag:       node.tagName?.toLowerCase() || "div",
        el:        node,
      };
      node = node.parentElement;
    }
    return null;
  };

  const clearHighlight = () => {
    if (highlightedEl.current) {
      highlightedEl.current.style.removeProperty("outline");
      highlightedEl.current.style.removeProperty("outline-offset");
      highlightedEl.current = null;
    }
  };

  useEffect(() => {
    const onMove = (e) => {
      if (e.target.closest?.("[data-devmode-ui]")) return;
      const meta = getMeta(e.target);
      if (!meta) { setTooltip(null); clearHighlight(); return; }
      if (meta.el === highlightedEl.current) return;

      clearHighlight();
      highlightedEl.current = meta.el;
      meta.el.style.setProperty("outline", "2px solid #00e5ff", "important");
      meta.el.style.setProperty("outline-offset", "2px", "important");

      const vw = window.innerWidth, vh = window.innerHeight;
      setTooltip({
        x: Math.min(e.clientX + 14, vw - 280),
        y: Math.min(e.clientY + 14, vh - 160),
        meta,
      });
    };

    const onLeave = () => { setTooltip(null); clearHighlight(); };

    // Click: copy metadata — use non-capture, check devMode badge to avoid self-triggering
    const onClick = (e) => {
      if (e.target.closest?.("[data-devmode-ui]")) return;
      const meta = getMeta(e.target);
      if (!meta) return;

      // Only intercept if the element has direct data-ui (not inherited from parent)
      // This prevents blocking form inputs, buttons that don't have their own data-ui
      const directMeta = e.target.dataset?.ui;
      if (!directMeta) return; // don't block elements without direct metadata

      e.preventDefault();
      e.stopPropagation();

      const txt = [
        "[UI_ELEMENT]",
        `  id:        ${meta.id}`,
        `  component: ${meta.component}`,
        `  page:      ${meta.page}`,
        `  role:      ${meta.role}`,
        `  type:      ${meta.tag}`,
        `  state:     ${meta.state}`,
        meta.variant ? `  variant:   ${meta.variant}` : null,
        "[/UI_ELEMENT]",
      ].filter(Boolean).join("\n");

      navigator.clipboard?.writeText(txt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick);
      clearHighlight();
    };
  }, []);

  return (
    <>
      {/* DEV badge */}
      <div data-devmode-ui="true" style={{
        position:"fixed", top:8, right:8, zIndex:99999,
        background:"#00e5ff", color:"#000", fontSize:9, fontWeight:800,
        letterSpacing:1.5, padding:"4px 9px", borderRadius:6,
        fontFamily:"monospace", userSelect:"none",
        boxShadow:"0 2px 8px rgba(0,0,0,.4)", cursor:"pointer",
      }} onClick={() => setDevMode(false)} title="Click to exit Dev Mode">
        ◉ DEV {copied ? "· COPIED ✓" : "· hover=inspect, click=copy"}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div data-devmode-ui="true" style={{
          position:"fixed", left:tooltip.x, top:tooltip.y, zIndex:99998,
          background:"rgba(0,5,20,0.95)", color:"#e0f7ff",
          fontFamily:"monospace", fontSize:10, lineHeight:1.7,
          padding:"9px 12px", borderRadius:8, pointerEvents:"none",
          boxShadow:"0 4px 20px rgba(0,0,0,.7)",
          borderLeft:"3px solid #00e5ff", minWidth:220, maxWidth:300,
          whiteSpace:"nowrap",
        }}>
          {[
            ["id",        tooltip.meta.id,        true],
            ["component", tooltip.meta.component, false],
            ["page",      tooltip.meta.page,      false],
            ["role",      tooltip.meta.role,      false],
            ["type",      tooltip.meta.tag,       false],
            ["state",     tooltip.meta.state,     false],
            ...(tooltip.meta.variant ? [["variant", tooltip.meta.variant, false]] : []),
          ].map(([k, v, accent]) => (
            <div key={k}>
              <span style={{ color: accent ? "#00e5ff" : "#8ab4c8", marginRight:4 }}>{k}:</span>
              <span style={{ color: accent ? "#fff" : "#e0f7ff" }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
