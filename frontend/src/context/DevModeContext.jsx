/**
 * DevModeContext — UI inspection system
 * Activation: localStorage("nn_devmode"), ?devMode=true, Ctrl+Shift+D
 */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const DevModeContext = createContext({ devMode: false, setDevMode: () => {} });

export function DevModeProvider({ children }) {
  const [devMode, setDevModeRaw] = useState(() => {
    if (new URLSearchParams(window.location.search).get("devMode") === "true") return true;
    return localStorage.getItem("nn_devmode") === "true";
  });

  const setDevMode = useCallback((v) => {
    setDevModeRaw(v);
    localStorage.setItem("nn_devmode", v ? "true" : "false");
  }, []);

  // Ctrl+Shift+D toggle
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDevMode(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setDevMode]);

  return (
    <DevModeContext.Provider value={{ devMode, setDevMode }}>
      {children}
      {devMode && <DevModeOverlay />}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);

/* ── Inspector overlay ─────────────────────────────────────────────── */
function DevModeOverlay() {
  const [tooltip, setTooltip]     = useState(null); // { x, y, meta }
  const [copied, setCopied]       = useState(false);
  const lastEl                    = useRef(null);

  const getMeta = (el) => {
    // Walk up DOM to find nearest element with data-ui
    let node = el;
    while (node && node !== document.body) {
      if (node.dataset?.ui) {
        return {
          id:        node.dataset.ui        || "—",
          component: node.dataset.component || "—",
          page:      node.dataset.page      || "—",
          role:      node.dataset.role      || "—",
          state:     node.dataset.state     || "default",
          variant:   node.dataset.variant   || null,
          tag:       node.tagName?.toLowerCase() || "div",
          el:        node,
        };
      }
      node = node.parentElement;
    }
    return null;
  };

  useEffect(() => {
    const onMove = (e) => {
      // Skip if hovering the overlay itself
      if (e.target.closest?.("[data-devmode-overlay]")) return;

      const meta = getMeta(e.target);
      if (!meta) { setTooltip(null); lastEl.current = null; return; }
      if (meta.el === lastEl.current) return;
      lastEl.current = meta.el;

      // Highlight
      document.querySelectorAll("[data-devmode-highlight]").forEach(el => {
        el.removeAttribute("data-devmode-highlight");
        el.style.removeProperty("outline");
        el.style.removeProperty("outline-offset");
      });
      meta.el.setAttribute("data-devmode-highlight", "true");
      meta.el.style.setProperty("outline", "2px solid #00e5ff", "important");
      meta.el.style.setProperty("outline-offset", "2px", "important");

      const vw = window.innerWidth, vh = window.innerHeight;
      const tx = Math.min(e.clientX + 14, vw - 280);
      const ty = Math.min(e.clientY + 14, vh - 160);
      setTooltip({ x: tx, y: ty, meta });
    };

    const onLeave = (e) => {
      if (!e.relatedTarget) {
        setTooltip(null);
        document.querySelectorAll("[data-devmode-highlight]").forEach(el => {
          el.removeAttribute("data-devmode-highlight");
          el.style.removeProperty("outline");
          el.style.removeProperty("outline-offset");
        });
        lastEl.current = null;
      }
    };

    const onClick = (e) => {
      if (e.target.closest?.("[data-devmode-overlay]")) return;
      const meta = getMeta(e.target);
      if (!meta) return;
      e.preventDefault(); e.stopPropagation();

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

      navigator.clipboard.writeText(txt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    };

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseleave", onLeave, true);
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseleave", onLeave, true);
      document.removeEventListener("click", onClick, true);
      document.querySelectorAll("[data-devmode-highlight]").forEach(el => {
        el.removeAttribute("data-devmode-highlight");
        el.style.removeProperty("outline");
        el.style.removeProperty("outline-offset");
      });
    };
  }, []);

  return (
    <>
      {/* Fixed badge — top right */}
      <div data-devmode-overlay="true" style={{
        position:"fixed", top:8, right:8, zIndex:99999,
        background:"#00e5ff", color:"#000", fontSize:9, fontWeight:800,
        letterSpacing:1.5, padding:"4px 9px", borderRadius:6,
        fontFamily:"monospace", userSelect:"none", boxShadow:"0 2px 8px rgba(0,0,0,.4)",
        cursor:"default",
      }}>
        DEV MODE {copied ? "· COPIED ✓" : "· click to copy"}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div data-devmode-overlay="true" style={{
          position:"fixed", left:tooltip.x, top:tooltip.y, zIndex:99998,
          background:"rgba(0,5,20,0.95)", color:"#e0f7ff",
          fontFamily:"monospace", fontSize:10, lineHeight:1.7,
          padding:"9px 12px", borderRadius:8, pointerEvents:"none",
          boxShadow:"0 4px 20px rgba(0,0,0,.7)",
          borderLeft:"3px solid #00e5ff", minWidth:220, maxWidth:300,
          whiteSpace:"nowrap",
        }}>
          <Row k="id"        v={tooltip.meta.id}        accent />
          <Row k="component" v={tooltip.meta.component} />
          <Row k="page"      v={tooltip.meta.page}      />
          <Row k="role"      v={tooltip.meta.role}      />
          <Row k="type"      v={tooltip.meta.tag}       />
          <Row k="state"     v={tooltip.meta.state}     />
          {tooltip.meta.variant && <Row k="variant" v={tooltip.meta.variant} />}
        </div>
      )}
    </>
  );
}

const Row = ({ k, v, accent }) => (
  <div>
    <span style={{ color: accent ? "#00e5ff" : "#8ab4c8", marginRight:4 }}>{k}:</span>
    <span style={{ color: accent ? "#ffffff" : "#e0f7ff" }}>{v}</span>
  </div>
);
