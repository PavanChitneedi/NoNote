// skins.js — 6 distinct UI skins, each a complete visual personality
// Skins set: typography, radii, shadows, spacing, special effects, body class

export const SKINS = {

  // ── 1. Default — clean monospace dev tool ─────────────────────
  default: {
    name: "Default",
    desc: "Clean dev tool. JetBrains Mono, tight spacing, no frills.",
    icon: "⬡",
    tags: ["Dark-ready", "Technical"],
    palette: ["#0d1117","#161b22","#58a6ff","#3fb950","#f78166"],
    vars: {
      "--font-ui":           "'JetBrains Mono','Fira Code',monospace",
      "--font-node":         "'JetBrains Mono','Fira Code',monospace",
      "--font-weight-ui":    "700",
      "--font-weight-node":  "600",
      "--radius-xs":         "4px",  "--radius-sm":  "6px",
      "--radius-md":         "8px",  "--radius-lg":  "10px",
      "--radius-node":       "10px", "--radius-btn": "6px",
      "--topbar-h":          "48px", "--node-header-h": "34px",
      "--node-pad":          "8px 10px",
      "--node-body-pad":     "6px 10px 8px",
      "--node-border-w":     "2px",
      "--btn-pad":           "5px 10px",
      "--sidebar-w":         "220px", "--props-w": "268px",
      "--letter-space":      "0.3px",
      "--shadow-node":       "0 2px 12px rgba(0,0,0,0.4)",
      "--shadow-node-sel":   "0 0 0 3px rgba(88,166,255,0.25), 0 6px 28px rgba(0,0,0,0.5)",
      "--shadow-card":       "0 1px 6px rgba(0,0,0,.3)",
      "--transition-all":    "all 0.12s",
      "--line-height":       "1.5",
      "--topbar-bg":         "var(--bg2)",
      "--topbar-border":     "1px solid var(--border2)",
      "--topbar-blur":       "none",
      "--sidebar-bg":        "var(--bg2)",
      "--sidebar-border":    "1px solid var(--border2)",
      "--sidebar-blur":      "none",
      "--card-bg":           "var(--bg2)",
      "--card-border":       "1px solid var(--border2)",
      "--card-blur":         "none",
      "--input-bg":          "var(--bg3)",
      "--glow":              "none",
      "--skin-effect":       "none",
    },
    bodyClass: "skin-default",
    css: ``,
  },

  // ── 2. Glass — frosted glassmorphism ─────────────────────────
  glass: {
    name: "Glass",
    desc: "Frosted glass panels, blur backdrop, soft glow. Translucent everything.",
    icon: "🪟",
    tags: ["Modern", "Blur", "Translucent"],
    palette: ["#0a0e1a","#111827","#818cf8","#34d399","#f87171"],
    forceTheme: "midnight",
    vars: {
      "--font-ui":           "'Inter',system-ui,sans-serif",
      "--font-node":         "'Inter',system-ui,sans-serif",
      "--font-weight-ui":    "500",
      "--font-weight-node":  "400",
      "--radius-xs":         "8px",   "--radius-sm":  "12px",
      "--radius-md":         "16px",  "--radius-lg":  "22px",
      "--radius-node":       "16px",  "--radius-btn": "10px",
      "--topbar-h":          "52px",  "--node-header-h": "40px",
      "--node-pad":          "10px 14px",
      "--node-body-pad":     "8px 14px 10px",
      "--node-border-w":     "1px",
      "--btn-pad":           "7px 14px",
      "--sidebar-w":         "220px", "--props-w": "280px",
      "--letter-space":      "0px",
      "--shadow-node":       "0 4px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
      "--shadow-node-sel":   "0 0 0 2px rgba(129,140,248,0.6), 0 8px 40px rgba(0,0,0,0.5)",
      "--shadow-card":       "0 8px 32px rgba(0,0,0,.4)",
      "--transition-all":    "all 0.2s cubic-bezier(0.4,0,0.2,1)",
      "--line-height":       "1.6",
      "--topbar-bg":         "rgba(17,24,39,0.6)",
      "--topbar-border":     "1px solid rgba(255,255,255,0.08)",
      "--topbar-blur":       "blur(20px)",
      "--sidebar-bg":        "rgba(10,14,26,0.7)",
      "--sidebar-border":    "1px solid rgba(255,255,255,0.06)",
      "--sidebar-blur":      "blur(16px)",
      "--card-bg":           "rgba(255,255,255,0.04)",
      "--card-border":       "1px solid rgba(255,255,255,0.08)",
      "--card-blur":         "blur(12px)",
      "--input-bg":          "rgba(255,255,255,0.06)",
      "--glow":              "0 0 20px rgba(129,140,248,0.3)",
      "--skin-effect":       "glass",
    },
    bodyClass: "skin-glass",
    css: `
.skin-glass .nn-topbar { backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important; }
.skin-glass .nn-sidebar { backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; }
.skin-glass button:hover { box-shadow: 0 0 12px rgba(129,140,248,0.25); }
.skin-glass input, .skin-glass select, .skin-glass textarea {
  backdrop-filter: blur(8px); background: rgba(255,255,255,0.06) !important;
  border-color: rgba(255,255,255,0.12) !important;
}
`,
  },

  // ── 3. Terminal — green phosphor CRT ─────────────────────────
  terminal: {
    name: "Terminal",
    desc: "Green phosphor on black. CRT scanlines. Everything is a command.",
    icon: "💻",
    tags: ["Retro", "Monospace", "Hacker"],
    palette: ["#050a05","#0a120a","#00ff41","#00cc33","#ff3333"],
    forceTheme: "forest",
    vars: {
      "--font-ui":           "'Berkeley Mono','Courier New',monospace",
      "--font-node":         "'Berkeley Mono','Courier New',monospace",
      "--font-weight-ui":    "400",
      "--font-weight-node":  "400",
      "--radius-xs":         "0px",  "--radius-sm":  "0px",
      "--radius-md":         "0px",  "--radius-lg":  "2px",
      "--radius-node":       "2px",  "--radius-btn": "0px",
      "--topbar-h":          "44px", "--node-header-h": "30px",
      "--node-pad":          "6px 10px",
      "--node-body-pad":     "4px 10px 6px",
      "--node-border-w":     "1px",
      "--btn-pad":           "4px 10px",
      "--sidebar-w":         "220px", "--props-w": "260px",
      "--letter-space":      "0.05em",
      "--shadow-node":       "0 0 8px rgba(0,255,65,0.3), inset 0 0 0 1px rgba(0,255,65,0.2)",
      "--shadow-node-sel":   "0 0 0 1px #00ff41, 0 0 20px rgba(0,255,65,0.5)",
      "--shadow-card":       "0 0 0 1px rgba(0,255,65,0.2)",
      "--transition-all":    "all 0.05s",
      "--line-height":       "1.4",
      "--topbar-bg":         "#050a05",
      "--topbar-border":     "1px solid #00ff41",
      "--topbar-blur":       "none",
      "--sidebar-bg":        "#050a05",
      "--sidebar-border":    "1px solid rgba(0,255,65,0.3)",
      "--sidebar-blur":      "none",
      "--card-bg":           "#080f08",
      "--card-border":       "1px solid rgba(0,255,65,0.25)",
      "--card-blur":         "none",
      "--input-bg":          "#020502",
      "--glow":              "0 0 8px rgba(0,255,65,0.4)",
      "--skin-effect":       "terminal",
    },
    bodyClass: "skin-terminal",
    css: `
.skin-terminal * { text-transform: uppercase; letter-spacing: 0.05em; }
.skin-terminal h1,.skin-terminal h2,.skin-terminal h3 { letter-spacing: 0.1em; }
.skin-terminal button { border: 1px solid rgba(0,255,65,0.4) !important; text-transform: uppercase; }
.skin-terminal button:hover { background: rgba(0,255,65,0.12) !important; box-shadow: 0 0 8px rgba(0,255,65,0.3) !important; color: #00ff41 !important; }
.skin-terminal input, .skin-terminal select, .skin-terminal textarea {
  border: 1px solid rgba(0,255,65,0.4) !important; background: #020502 !important;
  color: #00ff41 !important; caret-color: #00ff41;
}
.skin-terminal input::placeholder { color: rgba(0,255,65,0.35) !important; }
.skin-terminal::before {
  content:''; position: fixed; top:0; left:0; width:100%; height:100%; pointer-events:none;
  z-index: 9999; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
}
`,
  },

  // ── 4. Cyber — neon cyberpunk ─────────────────────────────────
  cyber: {
    name: "Cyber",
    desc: "Sharp edges, neon glow, electric accents. Cyberpunk data terminal.",
    icon: "⚡",
    tags: ["Futuristic", "Neon", "Bold"],
    palette: ["#06001a","#0d0026","#00d4ff","#ff006e","#ffd60a"],
    forceTheme: "ocean",
    vars: {
      "--font-ui":           "'Rajdhani','Orbitron',system-ui,sans-serif",
      "--font-node":         "'Rajdhani',system-ui,sans-serif",
      "--font-weight-ui":    "600",
      "--font-weight-node":  "500",
      "--radius-xs":         "0px",  "--radius-sm":  "2px",
      "--radius-md":         "4px",  "--radius-lg":  "4px",
      "--radius-node":       "4px",  "--radius-btn": "2px",
      "--topbar-h":          "50px", "--node-header-h": "36px",
      "--node-pad":          "10px 12px",
      "--node-body-pad":     "8px 12px 10px",
      "--node-border-w":     "1px",
      "--btn-pad":           "6px 14px",
      "--sidebar-w":         "220px", "--props-w": "270px",
      "--letter-space":      "0.1em",
      "--shadow-node":       "0 0 0 1px rgba(0,212,255,0.3), 0 4px 20px rgba(0,212,255,0.15)",
      "--shadow-node-sel":   "0 0 0 1px #00d4ff, 0 0 30px rgba(0,212,255,0.6)",
      "--shadow-card":       "0 0 0 1px rgba(0,212,255,0.2), 0 4px 16px rgba(0,0,0,.5)",
      "--transition-all":    "all 0.08s",
      "--line-height":       "1.45",
      "--topbar-bg":         "#06001a",
      "--topbar-border":     "1px solid rgba(0,212,255,0.4)",
      "--topbar-blur":       "none",
      "--sidebar-bg":        "#06001a",
      "--sidebar-border":    "1px solid rgba(0,212,255,0.2)",
      "--sidebar-blur":      "none",
      "--card-bg":           "#0a0020",
      "--card-border":       "1px solid rgba(0,212,255,0.2)",
      "--card-blur":         "none",
      "--input-bg":          "#080018",
      "--glow":              "0 0 20px rgba(0,212,255,0.5)",
      "--skin-effect":       "cyber",
    },
    bodyClass: "skin-cyber",
    css: `
.skin-cyber .nn-topbar { border-bottom: 1px solid rgba(0,212,255,0.4) !important; box-shadow: 0 1px 0 rgba(0,212,255,0.2), 0 4px 20px rgba(0,0,0,.8) !important; }
.skin-cyber .nn-sidebar { border-right: 1px solid rgba(0,212,255,0.2) !important; }
.skin-cyber button { letter-spacing: 0.1em; text-transform: uppercase; font-size: 11px !important; }
.skin-cyber button:hover { box-shadow: 0 0 12px rgba(0,212,255,0.4) !important; border-color: #00d4ff !important; color: #00d4ff !important; }
.skin-cyber input:focus, .skin-cyber select:focus, .skin-cyber textarea:focus {
  box-shadow: 0 0 0 1px #00d4ff, 0 0 12px rgba(0,212,255,0.3) !important;
  border-color: #00d4ff !important;
}
.skin-cyber .nn-topbar::after {
  content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, #00d4ff, #ff006e, #00d4ff, transparent);
}
`,
  },

  // ── 5. Paper — warm physical analog ──────────────────────────
  paper: {
    name: "Paper",
    desc: "Warm cream, physical shadows, serif type. Like a well-designed notebook.",
    icon: "📄",
    tags: ["Light", "Warm", "Analog"],
    palette: ["#faf7f0","#ffffff","#7c4f1e","#2d6a2d","#b91c1c"],
    forceTheme: "parchment",
    vars: {
      "--font-ui":           "'Lora','Georgia',serif",
      "--font-node":         "'Lora','Georgia',serif",
      "--font-weight-ui":    "600",
      "--font-weight-node":  "500",
      "--radius-xs":         "3px",  "--radius-sm":  "5px",
      "--radius-md":         "7px",  "--radius-lg":  "10px",
      "--radius-node":       "8px",  "--radius-btn": "5px",
      "--topbar-h":          "56px", "--node-header-h": "42px",
      "--node-pad":          "12px 14px",
      "--node-body-pad":     "10px 14px 12px",
      "--node-border-w":     "1px",
      "--btn-pad":           "7px 14px",
      "--sidebar-w":         "220px", "--props-w": "290px",
      "--letter-space":      "0.01em",
      "--shadow-node":       "2px 3px 0 rgba(0,0,0,0.12), 0 6px 20px rgba(0,0,0,0.08)",
      "--shadow-node-sel":   "3px 4px 0 rgba(124,79,30,0.3), 0 0 0 2px rgba(124,79,30,0.4)",
      "--shadow-card":       "2px 3px 0 rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.07)",
      "--transition-all":    "all 0.18s ease",
      "--line-height":       "1.7",
      "--topbar-bg":         "#f5f0e8",
      "--topbar-border":     "1px solid #d8cabb",
      "--topbar-blur":       "none",
      "--sidebar-bg":        "#f0ebe0",
      "--sidebar-border":    "1px solid #d0c4b0",
      "--sidebar-blur":      "none",
      "--card-bg":           "#fdfaf5",
      "--card-border":       "1px solid #ddd0c0",
      "--card-blur":         "none",
      "--input-bg":          "#faf6ee",
      "--glow":              "none",
      "--skin-effect":       "paper",
    },
    bodyClass: "skin-paper",
    css: `
.skin-paper .nn-topbar { box-shadow: 0 2px 0 rgba(0,0,0,0.08) !important; }
.skin-paper .nn-sidebar { box-shadow: 2px 0 8px rgba(0,0,0,0.06) !important; }
.skin-paper button { border: 1px solid rgba(0,0,0,0.2) !important; box-shadow: 1px 1px 0 rgba(0,0,0,0.1); }
.skin-paper button:hover { box-shadow: 2px 2px 0 rgba(0,0,0,0.15) !important; transform: translate(-1px,-1px); }
.skin-paper button:active { box-shadow: none !important; transform: translate(1px,1px) !important; }
.skin-paper input, .skin-paper select, .skin-paper textarea {
  border: 1px solid rgba(0,0,0,0.2) !important; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.07);
}
`,
  },

  // ── 6. Slate — professional enterprise ───────────────────────
  slate: {
    name: "Slate",
    desc: "Neutral gray system, Inter font, subtle elevation. Linear / Figma feel.",
    icon: "🪨",
    tags: ["Professional", "Neutral", "Clean"],
    palette: ["#111215","#18191e","#7c6af5","#22c55e","#ef4444"],
    forceTheme: "dark",
    vars: {
      "--font-ui":           "'Inter',system-ui,sans-serif",
      "--font-node":         "'Inter',system-ui,sans-serif",
      "--font-weight-ui":    "500",
      "--font-weight-node":  "400",
      "--radius-xs":         "4px",  "--radius-sm":  "6px",
      "--radius-md":         "8px",  "--radius-lg":  "12px",
      "--radius-node":       "8px",  "--radius-btn": "6px",
      "--topbar-h":          "46px", "--node-header-h": "36px",
      "--node-pad":          "10px 12px",
      "--node-body-pad":     "8px 12px 10px",
      "--node-border-w":     "1px",
      "--btn-pad":           "5px 12px",
      "--sidebar-w":         "220px", "--props-w": "272px",
      "--letter-space":      "-0.01em",
      "--shadow-node":       "0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)",
      "--shadow-node-sel":   "0 0 0 2px rgba(124,106,245,0.45), 0 4px 20px rgba(0,0,0,0.35)",
      "--shadow-card":       "0 1px 3px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.15)",
      "--transition-all":    "all 0.14s ease",
      "--line-height":       "1.55",
      "--topbar-bg":         "var(--bg2)",
      "--topbar-border":     "1px solid var(--border2)",
      "--topbar-blur":       "none",
      "--sidebar-bg":        "var(--bg2)",
      "--sidebar-border":    "1px solid var(--border2)",
      "--sidebar-blur":      "none",
      "--card-bg":           "var(--bg2)",
      "--card-border":       "1px solid var(--border2)",
      "--card-blur":         "none",
      "--input-bg":          "var(--bg3)",
      "--glow":              "none",
      "--skin-effect":       "slate",
    },
    bodyClass: "skin-slate",
    css: `
.skin-slate button { font-weight: 500 !important; }
.skin-slate .nn-topbar { box-shadow: 0 1px 0 var(--border2) !important; }
.skin-slate input:focus, .skin-slate select:focus {
  box-shadow: 0 0 0 3px rgba(124,106,245,0.25) !important; border-color: #7c6af5 !important;
}
`,
  },
};

export const SKIN_KEYS = Object.keys(SKINS);
