// SKINS = personality: font + radius + shadow + effects + nav layout
// Skins do NOT set colors (Theme) or spacing (Design) — those stay independent
// Each skin has: defaultTheme, accentOptions (curated accents for this skin)

export const SKINS = {

  obsidian: {
    name:"Obsidian", icon:"⬡", nav:"top",
    concept:"The developer's workshop. Dense, precise, monospaced. GitHub meets VS Code.",
    tags:["Technical","Monospace"],
    defaultTheme:"dark",
    defaultAccent:{accent:"#58a6ff",accent2:"#1f6feb"},
    accentOptions:[
      {name:"Blue",    accent:"#58a6ff", accent2:"#1f6feb"},
      {name:"Green",   accent:"#3fb950", accent2:"#16a34a"},
      {name:"Purple",  accent:"#bc8cff", accent2:"#8b5cf6"},
      {name:"Amber",   accent:"#f0a830", accent2:"#c88020"},
      {name:"Red",     accent:"#f85149", accent2:"#cf222e"},
    ],
    vars:{
      "--font-ui":"'JetBrains Mono','Fira Code',monospace",
      "--font-node":"'JetBrains Mono','Fira Code',monospace",
      "--font-weight-ui":"700","--font-weight-node":"600",
      "--letter-space":"0.3px","--line-height":"1.5",
      "--radius-xs":"4px","--radius-sm":"6px","--radius-md":"8px","--radius-lg":"10px",
      "--radius-node":"10px","--radius-btn":"6px",
      "--shadow-node":"0 2px 12px var(--shadow)","--shadow-node-sel":"0 0 0 3px var(--accent)44,0 6px 28px var(--shadow)",
      "--transition-all":"all 0.12s",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--border2)","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg2)","--sidebar-border":"1px solid var(--border2)",
    },
    bodyClass:"skin-obsidian",
    css:`body.skin-obsidian ::-webkit-scrollbar{width:6px;height:6px}
body.skin-obsidian ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
body.skin-obsidian ::-webkit-scrollbar-thumb:hover{background:var(--text4)}
body.skin-obsidian input:focus,body.skin-obsidian select:focus,body.skin-obsidian textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 2px var(--accent)33!important;outline:none}
body.skin-obsidian .nn-map-card{border:1px solid var(--border2);border-top:3px solid var(--ca)}
body.skin-obsidian .nn-map-card:hover{transform:translateY(-2px);box-shadow:0 6px 24px var(--shadow);border-color:var(--border)}
body.skin-obsidian .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-obsidian .nn-map-list-row:hover{background:var(--bg3)!important;box-shadow:0 2px 8px var(--shadow)}
body.skin-obsidian [style*="rgba(0,0,0,.7)"],body.skin-obsidian [style*="rgba(0,0,0,.65)"],body.skin-obsidian [style*="rgba(0,0,0,.6)"],body.skin-obsidian [style*="rgba(0,0,0,.55)"],body.skin-obsidian [style*="rgba(0,0,0,.5)"],body.skin-obsidian [style*="rgba(0,0,0,.4)"]{box-shadow:0 8px 32px rgba(0,0,0,.55),0 0 0 1px var(--border)!important}`,
  },

  aurora: {
    name:"Aurora", icon:"🌌", nav:"top",
    concept:"Frosted glass panels float over deep animated gradients. Everything breathes.",
    tags:["Glass","Blur","Rounded"],
    defaultTheme:"midnight",
    defaultAccent:{accent:"#a78bfa",accent2:"#7c3aed"},
    accentOptions:[
      {name:"Violet",  accent:"#a78bfa", accent2:"#7c3aed"},
      {name:"Teal",    accent:"#2dd4bf", accent2:"#0f766e"},
      {name:"Pink",    accent:"#f472b6", accent2:"#be185d"},
      {name:"Blue",    accent:"#60a5fa", accent2:"#2563eb"},
      {name:"Gold",    accent:"#fbbf24", accent2:"#d97706"},
    ],
    vars:{
      "--font-ui":"'Inter','Segoe UI',system-ui,sans-serif",
      "--font-node":"'Inter',system-ui,sans-serif",
      "--font-weight-ui":"500","--font-weight-node":"400",
      "--letter-space":"-0.01em","--line-height":"1.6",
      "--radius-xs":"10px","--radius-sm":"14px","--radius-md":"18px","--radius-lg":"24px",
      "--radius-node":"18px","--radius-btn":"12px",
      "--shadow-node":"0 4px 32px var(--shadow),0 2px 8px var(--shadow)",
      "--shadow-node-sel":"0 0 0 2px var(--accent),0 8px 40px var(--shadow)",
      "--transition-all":"all 0.2s cubic-bezier(0.4,0,0.2,1)",
      "--topbar-bg":"color-mix(in srgb,var(--bg2) 65%,transparent)",
      "--topbar-border":"1px solid var(--border)","--topbar-blur":"blur(24px)",
      "--sidebar-bg":"color-mix(in srgb,var(--bg) 75%,transparent)",
      "--sidebar-border":"1px solid var(--border2)",
    },
    bodyClass:"skin-aurora",
    css:`body.skin-aurora .nn-topbar{backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important}
body.skin-aurora .nn-sidebar{backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}
body.skin-aurora button:not([disabled]):hover{box-shadow:0 0 16px var(--accent)44!important}
body.skin-aurora input:focus,body.skin-aurora select:focus,body.skin-aurora textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 2px var(--accent)44,0 0 16px var(--accent)22!important;outline:none}
body.skin-aurora ::-webkit-scrollbar{width:5px}
body.skin-aurora ::-webkit-scrollbar-thumb{background:var(--accent)44;border-radius:6px}
/* Fix: use inset box-shadow for accent stripe — avoids arc on 24px radius corners */
body.skin-aurora .nn-map-card{
  border:1px solid var(--border);backdrop-filter:blur(8px);
  box-shadow:inset 0 2px 0 var(--ca),0 4px 16px var(--shadow)}
body.skin-aurora .nn-map-card:hover{
  transform:translateY(-2px);
  box-shadow:inset 0 2px 0 var(--ca),0 8px 32px var(--shadow),0 0 20px var(--ca)22;
  border-color:var(--ca)44}
body.skin-aurora .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-aurora .nn-map-list-row:hover{background:var(--bg3)!important;box-shadow:0 0 12px var(--ca)22}
body.skin-aurora [style*="rgba(0,0,0,.7)"],body.skin-aurora [style*="rgba(0,0,0,.65)"],body.skin-aurora [style*="rgba(0,0,0,.6)"],body.skin-aurora [style*="rgba(0,0,0,.55)"],body.skin-aurora [style*="rgba(0,0,0,.5)"],body.skin-aurora [style*="rgba(0,0,0,.4)"]{box-shadow:0 8px 32px rgba(0,0,0,.3),0 0 0 1px var(--accent)22,0 0 32px var(--accent)10!important}`,
  },

  brutalist: {
    name:"Brutalist", icon:"🏗", nav:"bottom",
    concept:"Raw concrete. Thick borders, hard offset shadows. Design as confrontation.",
    tags:["Bold","Angular","Statement"],
    defaultTheme:"dark",
    accentOptions:[
      {name:"Yellow",  accent:"#ffe600", accent2:"#ccb800"},
      {name:"Red",     accent:"#ff2e2e", accent2:"#cc0000"},
      {name:"White",   accent:"#ffffff", accent2:"#cccccc"},
      {name:"Cyan",    accent:"#00ffff", accent2:"#00cccc"},
      {name:"Green",   accent:"#00ff88", accent2:"#00cc66"},
    ],
    vars:{
      "--font-ui":"'Space Grotesk','Arial Black',sans-serif",
      "--font-node":"'Space Grotesk',sans-serif",
      "--font-weight-ui":"700","--font-weight-node":"700",
      "--letter-space":"0.03em","--line-height":"1.3",
      "--radius-xs":"0","--radius-sm":"0","--radius-md":"0","--radius-lg":"0",
      "--radius-node":"0","--radius-btn":"0",
      "--shadow-node":"5px 5px 0 var(--accent)","--shadow-node-sel":"7px 7px 0 var(--accent)",
      "--transition-all":"all 0.05s",
      "--topbar-bg":"var(--bg2)","--topbar-border":"3px solid var(--accent)","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg2)","--sidebar-border":"3px solid var(--border)",
    },
    bodyClass:"skin-brutalist",
    css:`body.skin-brutalist button{text-transform:uppercase!important;letter-spacing:0.06em!important;font-weight:700!important;border:2px solid var(--border)!important}
body.skin-brutalist button:not([disabled]):hover{background:var(--accent)!important;color:var(--bg)!important;border-color:var(--accent)!important;box-shadow:4px 4px 0 var(--accent)88!important;transform:translate(-2px,-2px)!important}
body.skin-brutalist button:active{transform:translate(2px,2px)!important;box-shadow:none!important}
body.skin-brutalist input,body.skin-brutalist select,body.skin-brutalist textarea{border:2px solid var(--border)!important;border-radius:0!important}
body.skin-brutalist input:focus,body.skin-brutalist select:focus,body.skin-brutalist textarea:focus{border-color:var(--accent)!important;box-shadow:4px 4px 0 var(--accent)!important;outline:none}
body.skin-brutalist ::-webkit-scrollbar{width:8px}
body.skin-brutalist ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:0}
body.skin-brutalist .nn-map-card{border:3px solid var(--border);box-shadow:4px 4px 0 var(--ca)}
body.skin-brutalist .nn-map-card:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ca)}
body.skin-brutalist .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-brutalist .nn-map-list-row{border-left:4px solid var(--ca)!important}
body.skin-brutalist .nn-map-list-row:hover{background:var(--bg3)!important;box-shadow:3px 3px 0 var(--ca)}
body.skin-brutalist [style*="rgba(0,0,0,.7)"],body.skin-brutalist [style*="rgba(0,0,0,.65)"],body.skin-brutalist [style*="rgba(0,0,0,.6)"],body.skin-brutalist [style*="rgba(0,0,0,.55)"],body.skin-brutalist [style*="rgba(0,0,0,.5)"],body.skin-brutalist [style*="rgba(0,0,0,.4)"]{box-shadow:8px 8px 0 var(--accent)!important;border:2px solid var(--accent)!important}`,
  },

  neonTokyo: {
    name:"Neon Tokyo", icon:"⚡", nav:"bottom",
    concept:"Rain on neon-soaked streets. Everything glows. Every click is electric.",
    tags:["Neon","Glow","Cyberpunk"],
    defaultTheme:"ocean",
    defaultAccent:{accent:"#ff2d78",accent2:"#cc0050"},
    accentOptions:[
      {name:"Hot Pink", accent:"#ff2d78", accent2:"#cc0050"},
      {name:"Cyan",     accent:"#00f5ff", accent2:"#00c0c0"},
      {name:"Matrix",   accent:"#00ff41", accent2:"#00cc33"},
      {name:"Purple",   accent:"#b967ff", accent2:"#8800cc"},
      {name:"Gold",     accent:"#ffd700", accent2:"#c0a800"},
    ],
    vars:{
      "--font-ui":"'Rajdhani','Orbitron',system-ui,sans-serif",
      "--font-node":"'Rajdhani',system-ui,sans-serif",
      "--font-weight-ui":"600","--font-weight-node":"500",
      "--letter-space":"0.08em","--line-height":"1.4",
      "--radius-xs":"0","--radius-sm":"2px","--radius-md":"4px","--radius-lg":"6px",
      "--radius-node":"4px","--radius-btn":"2px",
      "--shadow-node":"0 0 0 1px var(--accent)44,0 0 20px var(--accent)22,0 4px 20px var(--shadow)",
      "--shadow-node-sel":"0 0 0 1px var(--accent),0 0 30px var(--accent)66",
      "--transition-all":"all 0.08s",
      "--topbar-bg":"var(--bg)","--topbar-border":"1px solid var(--accent)55","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-neon-tokyo",
    css:`/* Fix: z-index 99 keeps scanlines below modals (z:1000+) */
body.skin-neon-tokyo::before{content:'';position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99;
  background:repeating-linear-gradient(0deg,transparent 0px,transparent 3px,color-mix(in srgb,var(--text) 5%,transparent) 3px,color-mix(in srgb,var(--text) 5%,transparent) 4px)}
body.skin-neon-tokyo .nn-topbar{position:relative;overflow:hidden}
/* Fix: clip to topbar so glow bar doesn't bleed into content */
body.skin-neon-tokyo .nn-topbar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--accent),var(--accent2),var(--accent),transparent);box-shadow:0 0 12px var(--accent)}
body.skin-neon-tokyo button{text-transform:uppercase!important;letter-spacing:0.1em!important}
body.skin-neon-tokyo button:not([disabled]):hover{color:var(--accent)!important;border-color:var(--accent)!important;box-shadow:0 0 12px var(--accent)55!important;text-shadow:0 0 8px var(--accent)!important}
body.skin-neon-tokyo input:focus,body.skin-neon-tokyo select:focus,body.skin-neon-tokyo textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 1px var(--accent),0 0 16px var(--accent)44!important;outline:none}
body.skin-neon-tokyo ::-webkit-scrollbar{width:4px}
body.skin-neon-tokyo ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}
body.skin-neon-tokyo .nn-map-card{border:1px solid var(--ca)55;box-shadow:0 0 0 1px var(--ca)18,0 2px 8px var(--shadow)}
body.skin-neon-tokyo .nn-map-card:hover{border-color:var(--ca);box-shadow:0 0 24px var(--ca)44,0 0 0 1px var(--ca);transform:translateY(-1px)}
body.skin-neon-tokyo .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-neon-tokyo .nn-map-list-row:hover{background:var(--bg3)!important;box-shadow:0 0 12px var(--ca)33}
body.skin-neon-tokyo [style*="rgba(0,0,0,.7)"],body.skin-neon-tokyo [style*="rgba(0,0,0,.65)"],body.skin-neon-tokyo [style*="rgba(0,0,0,.6)"],body.skin-neon-tokyo [style*="rgba(0,0,0,.55)"],body.skin-neon-tokyo [style*="rgba(0,0,0,.5)"],body.skin-neon-tokyo [style*="rgba(0,0,0,.4)"]{box-shadow:0 0 0 1px var(--accent)66,0 8px 40px rgba(0,0,0,.7),0 0 32px var(--accent)22!important}
/* LLMChat panel — neon border */
body.skin-neon-tokyo [style*="border-left: 1px solid var(--border)"] { border-left: 1px solid var(--accent)44 !important; }`,
  },

  neumorphic: {
    name:"Neumorphic", icon:"⬜", nav:"icon-dock",
    concept:"Soft clay. Elements pushed out of or pressed into a single material.",
    tags:["3D","Tactile","Soft"],
    defaultTheme:"clay",
    defaultAccent:{accent:"#5b8dee",accent2:"#2563eb"},
    accentOptions:[
      {name:"Blue",    accent:"#5b8dee", accent2:"#2563eb"},
      {name:"Purple",  accent:"#9b7dea", accent2:"#7c3aed"},
      {name:"Teal",    accent:"#2eb8a0", accent2:"#0f766e"},
      {name:"Rose",    accent:"#e878a8", accent2:"#be185d"},
      {name:"Amber",   accent:"#e8a030", accent2:"#d97706"},
    ],
    vars:{
      "--font-ui":"'Nunito','Poppins',system-ui,sans-serif",
      "--font-node":"'Nunito',system-ui,sans-serif",
      "--font-weight-ui":"700","--font-weight-node":"600",
      "--letter-space":"0em","--line-height":"1.65",
      "--radius-xs":"6px","--radius-sm":"10px","--radius-md":"14px","--radius-lg":"18px",
      "--radius-node":"16px","--radius-btn":"8px",
      "--shadow-node":"5px 5px 12px var(--neu-dark),-4px -4px 9px var(--neu-light)",
      "--shadow-node-sel":"4px 4px 10px var(--neu-dark),-3px -3px 7px var(--neu-light),0 0 0 2px var(--accent)55",
      "--transition-all":"all 0.15s ease",
      "--topbar-bg":"var(--bg2)","--topbar-border":"none","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"none",
    },
    bodyClass:"skin-neumorphic",
       css:`/* ════════════════════════════════════════════════════════════
   NONOTE — NEUMORPHIC SKIN  v2.0
   Single-material soft-clay. Depth via shadow, not borders.
   ════════════════════════════════════════════════════════════ */

/* ── A. DESIGN TOKENS ────────────────────────────────────────
   All shadow values derived from two theme variables:
   --neu-dark  = shadow side  (darker than bg)
   --neu-light = highlight side (lighter than bg)
   These are set per-theme in ThemeContext.
   ──────────────────────────────────────────────────────────── */
body.skin-neumorphic {
  --nS:   5px 5px 12px var(--neu-dark), -4px -4px 9px var(--neu-light);
  --nSsm: 3px 3px 6px  var(--neu-dark), -2px -2px 4px var(--neu-light);
  --nSxs: 2px 2px 4px  var(--neu-dark), -1px -1px 3px var(--neu-light);
  --nI:   inset 3px 3px 7px  var(--neu-dark), inset -2px -2px 5px var(--neu-light);
  --nIsm: inset 2px 2px 5px  var(--neu-dark), inset -1px -1px 3px var(--neu-light);
  --nIxs: inset 1px 1px 3px  var(--neu-dark), inset -1px -1px 2px var(--neu-light);
  --nR:   12px;
  --nRsm: 8px;
  --nRxs: 6px;
  background: var(--bg);
}

/* ── B. GLOBAL RESET — erase all borders, flatten bg variants ─ */
body.skin-neumorphic * { border-color: transparent !important; }
body.skin-neumorphic [style*="background: var(--bg2)"],
body.skin-neumorphic [style*="background:var(--bg2)"] { background: var(--bg) !important; }
body.skin-neumorphic [style*="background: var(--bg3)"],
body.skin-neumorphic [style*="background:var(--bg3)"] { background: var(--bg) !important; }
/* Keep node-bg for actual node cards */
body.skin-neumorphic .nn-node > div:first-child { background: var(--node-bg) !important; }
/* PROTECT canvas grid — never override the radial-gradient background */
body.skin-neumorphic [style*="radial-gradient"] {
  background-color: var(--bg) !important;
  background-image: radial-gradient(circle, var(--canvas-dot) 1.2px, transparent 1.2px) !important;
  background-size: 28px 28px !important;
  background-position: center !important;
}

/* ── C. FILLET ALL HARDCODED RADII ───────────────────────────── */
body.skin-neumorphic [style*="borderRadius:20"],
body.skin-neumorphic [style*="borderRadius:18"],
body.skin-neumorphic [style*="borderRadius:16"],
body.skin-neumorphic [style*="borderRadius:14"],
body.skin-neumorphic [style*="borderRadius:12"],
body.skin-neumorphic [style*="borderRadius:10"] { border-radius: var(--nR) !important; }
body.skin-neumorphic [style*="borderRadius:8"],
body.skin-neumorphic [style*="borderRadius:7"],
body.skin-neumorphic [style*="borderRadius:6"],
body.skin-neumorphic [style*="borderRadius:5"],
body.skin-neumorphic [style*="borderRadius:4"] { border-radius: var(--nRsm) !important; }
body.skin-neumorphic [style*="borderRadius:3"],
body.skin-neumorphic [style*="borderRadius:2"],
body.skin-neumorphic [style*="borderRadius:1"],
body.skin-neumorphic [style*="borderRadius:0"] { border-radius: var(--nRxs) !important; }

/* ── D. TYPOGRAPHY — ensure readable contrast ────────────────── */
body.skin-neumorphic { color: var(--text2); }

/* ── E. BUTTONS — raised pillows, states ─────────────────────── */
body.skin-neumorphic button {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nRsm) !important;
  box-shadow: var(--nSsm) !important;
  color: var(--text2) !important;
  font-weight: 600 !important;
  transition: box-shadow .14s ease, transform .1s ease, color .1s !important;
}
body.skin-neumorphic button:not([disabled]):hover {
  box-shadow: var(--nS) !important;
  color: var(--text) !important;
  transform: translateY(-1px) !important;
}
body.skin-neumorphic button:not([disabled]):active {
  box-shadow: var(--nIsm) !important;
  transform: translateY(0) !important;
}
/* Focus: accessible ring instead of border */
body.skin-neumorphic button:focus-visible {
  outline: 2px solid var(--accent) !important;
  outline-offset: 2px !important;
  box-shadow: var(--nSsm), 0 0 0 3px var(--accent)33 !important;
}
/* Disabled */
body.skin-neumorphic button[disabled],
body.skin-neumorphic button:disabled {
  box-shadow: var(--nSxs) !important;
  opacity: 0.45 !important;
  cursor: not-allowed !important;
}
/* Active/selected state (accent2 fill → inset + tinted text) */
body.skin-neumorphic button[style*="background: var(--accent2)"],
body.skin-neumorphic button[style*="background:var(--accent2)"] {
  background: var(--bg) !important;
  box-shadow: var(--nIsm) !important;
  color: var(--accent2) !important;
  transform: none !important;
}
body.skin-neumorphic button[style*="background: var(--success)"],
body.skin-neumorphic button[style*="background:var(--success)"] {
  background: var(--bg) !important;
  box-shadow: var(--nIsm) !important;
  color: var(--success) !important;
  transform: none !important;
}
body.skin-neumorphic button[style*="background: var(--danger)"],
body.skin-neumorphic button[style*="background:var(--danger)"] {
  background: var(--bg) !important;
  box-shadow: var(--nIsm) !important;
  color: var(--danger) !important;
  transform: none !important;
}
/* Transparent / icon-only buttons (small) */
body.skin-neumorphic button[style*="background: transparent"],
body.skin-neumorphic button[style*="background:transparent"],
body.skin-neumorphic button[style*="background: none"],
body.skin-neumorphic button[style*="background:none"] {
  background: transparent !important;
  box-shadow: none !important;
  color: var(--text3) !important;
}
body.skin-neumorphic button[style*="background: transparent"]:hover,
body.skin-neumorphic button[style*="background:transparent"]:hover,
body.skin-neumorphic button[style*="background: none"]:hover {
  background: color-mix(in srgb, var(--bg) 82%, var(--neu-dark)) !important;
  color: var(--text) !important;
  box-shadow: var(--nSxs) !important;
}
/* Submit/CTA button (accent fill) */
body.skin-neumorphic button[style*="background: var(--accent)"],
body.skin-neumorphic button[style*="color: #fff"],
body.skin-neumorphic button[style*="color:#fff"] {
  background: var(--accent2) !important;
  box-shadow: var(--nSsm) !important;
  color: #fff !important;
}
body.skin-neumorphic button[style*="background: var(--accent)"]:hover,
body.skin-neumorphic button[style*="color: #fff"]:hover {
  box-shadow: var(--nS) !important;
  transform: translateY(-1px) !important;
}

/* ── F. INPUTS / SELECT / TEXTAREA ───────────────────────────── */
body.skin-neumorphic input,
body.skin-neumorphic select,
body.skin-neumorphic textarea {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nR) !important;
  box-shadow: var(--nI) !important;
  color: var(--text) !important;
  transition: box-shadow .14s ease !important;
}
body.skin-neumorphic input::placeholder,
body.skin-neumorphic textarea::placeholder { color: var(--text4) !important; opacity: 1 !important; }
body.skin-neumorphic input:focus,
body.skin-neumorphic select:focus,
body.skin-neumorphic textarea:focus {
  outline: none !important;
  box-shadow: var(--nI), 0 0 0 2px var(--accent)44 !important;
}
body.skin-neumorphic input:disabled,
body.skin-neumorphic select:disabled,
body.skin-neumorphic textarea:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}
body.skin-neumorphic input[type="checkbox"],
body.skin-neumorphic input[type="radio"] {
  appearance: none !important;
  width: 16px !important; height: 16px !important;
  border-radius: 4px !important;
  box-shadow: var(--nIsm) !important;
  cursor: pointer !important;
  position: relative !important;
  flex-shrink: 0 !important;
}
body.skin-neumorphic input[type="checkbox"]:checked,
body.skin-neumorphic input[type="radio"]:checked {
  background: var(--accent2) !important;
  box-shadow: var(--nIxs) !important;
}
body.skin-neumorphic input[type="radio"] { border-radius: 50% !important; }
body.skin-neumorphic input[type="range"] {
  appearance: none !important;
  box-shadow: none !important;
  height: 4px !important;
  border-radius: 4px !important;
  background: var(--neu-dark) !important;
}

/* ── G. APP TOPBAR (.nn-topbar) ──────────────────────────────── */
body.skin-neumorphic .nn-topbar {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: 0 2px 6px var(--neu-dark) !important;
}
body.skin-neumorphic .nn-topbar button {
  box-shadow: none !important;
  background: transparent !important;
  color: var(--text3) !important;
  border-radius: var(--nRxs) !important;
}
body.skin-neumorphic .nn-topbar button:hover {
  background: color-mix(in srgb, var(--bg) 82%, var(--neu-dark)) !important;
  color: var(--text) !important;
  box-shadow: none !important;
  transform: none !important;
}

/* ── H. CANVAS TOOLBAR — unified inset trough ────────────────── */
/* Both rows share the same trough — top row gets top-inset, bottom row gets bottom-inset */
body.skin-neumorphic [data-tut="topbar-row1"] {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: inset 0 3px 8px var(--neu-dark), inset 0 1px 2px var(--neu-light) !important;
}
body.skin-neumorphic [data-tut="topbar-row1"] + div {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: inset 0 -3px 8px var(--neu-dark) !important;
}
/* Toolbar buttons: FLAT inside the trough, no individual elevation */
body.skin-neumorphic [data-tut="topbar-row1"] button,
body.skin-neumorphic [data-tut="topbar-row1"] + div button {
  box-shadow: none !important;
  background: transparent !important;
  border-radius: var(--nRxs) !important;
  color: var(--text2) !important;
  transform: none !important;
}
body.skin-neumorphic [data-tut="topbar-row1"] button:hover,
body.skin-neumorphic [data-tut="topbar-row1"] + div button:hover {
  background: color-mix(in srgb, var(--bg) 82%, var(--neu-dark)) !important;
  color: var(--text) !important;
  box-shadow: none !important;
  transform: none !important;
}
/* Active toolbar button: inset + accent tint */
body.skin-neumorphic [data-tut="topbar-row1"] button[style*="background: var(--accent2)"],
body.skin-neumorphic [data-tut="topbar-row1"] + div button[style*="background: var(--accent2)"] {
  box-shadow: var(--nIxs) !important;
  background: var(--bg) !important;
  color: var(--accent2) !important;
}
body.skin-neumorphic [data-tut="topbar-row1"] button[style*="background: var(--success)"],
body.skin-neumorphic [data-tut="topbar-row1"] + div button[style*="background: var(--success)"] {
  box-shadow: var(--nIxs) !important;
  background: var(--bg) !important;
  color: var(--success) !important;
}
body.skin-neumorphic [data-tut="topbar-row1"] button[disabled],
body.skin-neumorphic [data-tut="topbar-row1"] + div button[disabled] {
  opacity: 0.35 !important;
  color: var(--text4) !important;
}
/* Hide divider lines inside toolbar */
body.skin-neumorphic [data-tut="topbar-row1"] [style*="width: 1px"],
body.skin-neumorphic [data-tut="topbar-row1"] + div [style*="width: 1px"],
body.skin-neumorphic [style*="width: 1px"][style*="background: var(--border)"] {
  background: transparent !important;
}

/* ── I. SIDEBAR ───────────────────────────────────────────────── */
body.skin-neumorphic .nn-sidebar,
body.skin-neumorphic [style*="border-right: 1px solid"] {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: 4px 0 10px var(--neu-dark) !important;
}
body.skin-neumorphic [style*="border-left: 1px solid"] {
  border: none !important;
  box-shadow: -4px 0 10px var(--neu-dark) !important;
}
body.skin-neumorphic [style*="border-top: 1px solid"] {
  border-top: none !important;
  box-shadow: 0 -2px 6px var(--neu-dark) !important;
}
body.skin-neumorphic [style*="border-bottom: 1px solid var(--border2)"] {
  border-bottom: none !important;
  box-shadow: 0 2px 4px var(--neu-dark) !important;
}
body.skin-neumorphic [style*="border-bottom: 1px solid var(--border)"] {
  border-bottom: none !important;
  box-shadow: 0 1px 3px var(--neu-dark) !important;
}

/* ── J. NODE CARDS (.nn-node) ─────────────────────────────────── */
body.skin-neumorphic .nn-node > div:first-child {
  border: none !important;
  box-shadow: var(--shadow-node) !important;
}
/* Node buttons: flat with hover */
body.skin-neumorphic .nn-collapse-btn,
body.skin-neumorphic .nn-comment-btn,
body.skin-neumorphic .nn-addnote-btn,
body.skin-neumorphic .nn-pencil-btn {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

/* ── K. INLINE NODE POPUP (z-index: 200) ─────────────────────── */
body.skin-neumorphic [style*="z-index: 200"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: 18px !important;
  box-shadow: var(--nS), 3px 3px 6px var(--neu-dark) !important;
  overflow: hidden !important;
}
/* Header row */
body.skin-neumorphic [style*="z-index: 200"] > div:first-child {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: 0 2px 5px var(--neu-dark) !important;
}
/* Description row */
body.skin-neumorphic [style*="z-index: 200"] > div:nth-child(2) {
  background: var(--bg) !important;
  border: none !important;
}
/* Tab bar — inset trough */
body.skin-neumorphic [style*="z-index: 200"] > div:nth-child(3) {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: inset 0 2px 5px var(--neu-dark), inset 0 -1px 2px var(--neu-light) !important;
  padding: 5px 8px !important;
  gap: 3px !important;
}
body.skin-neumorphic [style*="z-index: 200"] > div:nth-child(3) > button {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 7px !important;
  border: none !important;
  color: var(--text3) !important;
  padding: 4px 9px !important;
  transform: none !important;
}
body.skin-neumorphic [style*="z-index: 200"] > div:nth-child(3) > button:hover {
  background: color-mix(in srgb, var(--bg) 82%, var(--neu-dark)) !important;
  color: var(--text) !important;
  box-shadow: none !important;
  transform: none !important;
}
body.skin-neumorphic [style*="z-index: 200"] > div:nth-child(3) > button[style*="color: var(--accent)"] {
  background: var(--bg) !important;
  box-shadow: var(--nIxs) !important;
  color: var(--accent) !important;
}
/* Content area */
body.skin-neumorphic [style*="z-index: 200"] > div[style*="flex: 1"][style*="overflow"] {
  background: var(--bg) !important;
}
/* All buttons inside popup: standard raised */
body.skin-neumorphic [style*="z-index: 200"] > div:nth-child(4) button,
body.skin-neumorphic [style*="z-index: 200"] > div:nth-child(5) button,
body.skin-neumorphic [style*="z-index: 200"] > div[style*="flex: 1"] button {
  box-shadow: var(--nSsm) !important;
  background: var(--bg) !important;
  color: var(--text2) !important;
  border-radius: var(--nRsm) !important;
}
body.skin-neumorphic [style*="z-index: 200"] > div[style*="flex: 1"] input,
body.skin-neumorphic [style*="z-index: 200"] > div[style*="flex: 1"] select,
body.skin-neumorphic [style*="z-index: 200"] > div[style*="flex: 1"] textarea {
  background: var(--bg) !important;
  box-shadow: var(--nI) !important;
  border: none !important;
  border-radius: var(--nR) !important;
}

/* ── L. MODALS (z-index: 400+, maxWidth overlays) ────────────── */
body.skin-neumorphic [style*="maxWidth:680"],
body.skin-neumorphic [style*="max-width: 680px"],
body.skin-neumorphic [style*="maxWidth: 680px"],
body.skin-neumorphic [style*="maxWidth:520"],
body.skin-neumorphic [style*="maxWidth:480"],
body.skin-neumorphic [style*="maxWidth:440"],
body.skin-neumorphic [style*="maxWidth:400"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: 20px !important;
  box-shadow: 8px 8px 20px var(--neu-dark), -6px -6px 14px var(--neu-light) !important;
}
/* Dark overlay backgrounds → same material */
body.skin-neumorphic [style*="rgba(0,0,0,.5)"],
body.skin-neumorphic [style*="rgba(0,0,0,.7)"],
body.skin-neumorphic [style*="rgba(0,0,0,.6)"],
body.skin-neumorphic [style*="rgba(0,0,0,.65)"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: 20px !important;
  box-shadow: 8px 8px 20px var(--neu-dark), -6px -6px 14px var(--neu-light) !important;
}

/* ── M. DROPDOWNS / CONTEXT MENUS ────────────────────────────── */
body.skin-neumorphic [style*="z-index: 601"],
body.skin-neumorphic [style*="z-index:601"],
body.skin-neumorphic [style*="z-index: 600"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nR) !important;
  box-shadow: 7px 7px 18px var(--neu-dark), -4px -4px 10px var(--neu-light) !important;
  overflow: hidden !important;
}
body.skin-neumorphic [style*="z-index: 501"],
body.skin-neumorphic [style*="z-index: 500"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nR) !important;
  box-shadow: 6px 6px 15px var(--neu-dark), -4px -4px 9px var(--neu-light) !important;
  overflow: hidden !important;
}
body.skin-neumorphic [style*="z-index: 800"],
body.skin-neumorphic [style*="z-index: 900"],
body.skin-neumorphic [style*="z-index: 1000"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: 20px !important;
  box-shadow: 8px 8px 22px var(--neu-dark), -6px -6px 14px var(--neu-light) !important;
}
/* Dropdown list items */
body.skin-neumorphic [style*="z-index: 601"] [style*="cursor: pointer"],
body.skin-neumorphic [style*="z-index: 601"] [style*="cursor:pointer"] {
  background: transparent !important;
  border: none !important;
  transition: background .1s !important;
}
body.skin-neumorphic [style*="z-index: 601"] [style*="cursor: pointer"]:hover {
  background: color-mix(in srgb, var(--bg) 82%, var(--neu-dark)) !important;
}

/* ── N. CONTENT CARDS (bg3 boxes, list rows) ─────────────────── */
body.skin-neumorphic [style*="background: var(--bg3)"][style*="borderRadius"],
body.skin-neumorphic [style*="background: var(--bg3)"][style*="border-radius"] {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: var(--nSsm) !important;
}
/* Raised admin/form sections */
body.skin-neumorphic [style*="border: 1px solid var(--border)"][style*="borderRadius"],
body.skin-neumorphic [style*="border: 1px solid var(--border)"][style*="border-radius"],
body.skin-neumorphic [style*="border:1px solid var(--border)"][style*="borderRadius"] {
  border: none !important;
  box-shadow: var(--nSsm) !important;
  background: var(--bg) !important;
}
/* Admin user/role row */
body.skin-neumorphic [style*="border: 1px solid var(--border2)"][style*="borderRadius"],
body.skin-neumorphic [style*="border: 1px solid var(--border2)"][style*="border-radius"] {
  border: none !important;
  background: var(--bg) !important;
  box-shadow: var(--nSxs) !important;
  margin-bottom: 5px !important;
}
/* List rows with cursor:pointer */
body.skin-neumorphic [style*="cursor: pointer"][style*="borderBottom"] {
  border: none !important;
}

/* ── O. TOGGLE / SEGMENTED CONTROLS ─────────────────────────── */
body.skin-neumorphic [style*="background: var(--bg3)"][style*="padding: 4px"],
body.skin-neumorphic [style*="background: var(--bg3)"][style*="padding: 6px"],
body.skin-neumorphic [style*="background: var(--bg3)"][style*="padding:4px"],
body.skin-neumorphic [style*="background: var(--bg3)"][style*="padding:6px"] {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: var(--nIsm) !important;
  border-radius: var(--nR) !important;
}

/* ── P. RICH TEXT EDITOR ─────────────────────────────────────── */
body.skin-neumorphic [style*="flex-direction: column"][style*="overflow: hidden"][style*="border"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nR) !important;
  box-shadow: var(--nI) !important;
}
body.skin-neumorphic button[style*="height: 22px"],
body.skin-neumorphic button[style*="height:22px"] {
  box-shadow: var(--nSxs) !important;
  border-radius: 5px !important;
  background: var(--bg) !important;
  color: var(--text2) !important;
}
body.skin-neumorphic button[style*="height: 22px"]:hover {
  box-shadow: var(--nSsm) !important;
  color: var(--text) !important;
  transform: none !important;
}
body.skin-neumorphic button[style*="height: 22px"][style*="background: var(--accent2)"] {
  box-shadow: var(--nIxs) !important;
  background: var(--bg) !important;
  color: var(--accent2) !important;
}

/* ── Q. DASHBOARD MAP CARDS ──────────────────────────────────── */
body.skin-neumorphic .nn-map-card {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: var(--nSsm), inset 0 3px 0 var(--ca) !important;
  border-radius: var(--nR) !important;
  transition: box-shadow .15s ease, transform .15s ease !important;
}
body.skin-neumorphic .nn-map-card:hover {
  box-shadow: var(--nS), inset 0 3px 0 var(--ca) !important;
  transform: translateY(-2px) !important;
}
body.skin-neumorphic .nn-map-list-row {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nR) !important;
  box-shadow: var(--nSxs) !important;
  margin-bottom: 5px !important;
  transition: box-shadow .15s ease !important;
}
body.skin-neumorphic .nn-map-list-row:hover { box-shadow: var(--nSsm) !important; }
/* ── Q2. MAP CARD ACTIONS — show on hover, neumorphic raised ── */
body.skin-neumorphic .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-neumorphic .nn-card-actions{position:relative;z-index:2}
body.skin-neumorphic .nn-card-actions button{
  background:var(--bg)!important;
  box-shadow:var(--nSxs)!important;
  border-radius:var(--nRsm)!important;
  color:var(--text2)!important;
  border:none!important;
  transition:box-shadow .12s ease,transform .1s ease!important;
}
body.skin-neumorphic .nn-card-actions button:hover{
  box-shadow:var(--nSsm)!important;
  color:var(--text)!important;
  transform:translateY(-1px)!important;
}
body.skin-neumorphic .nn-card-actions button:active{
  box-shadow:var(--nIxs)!important;
  transform:translateY(0)!important;
}
/* List row action buttons always visible, same style */
body.skin-neumorphic .nn-map-list-row button{
  background:var(--bg)!important;
  box-shadow:var(--nSxs)!important;
  border-radius:var(--nRxs)!important;
  color:var(--text2)!important;
  border:none!important;
}
body.skin-neumorphic .nn-map-list-row button:hover{
  box-shadow:var(--nSsm)!important;
  color:var(--text)!important;
  transform:translateY(-1px)!important;
}

/* ── R. LOGIN PAGE ───────────────────────────────────────────── */
/* Login card */
body.skin-neumorphic [style*="maxWidth"][style*="380"] {
  background: var(--bg) !important;
  border: none !important;
}
body.skin-neumorphic [style*="maxWidth"][style*="380"] > div[style*="border"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: 20px !important;
  box-shadow: var(--nS) !important;
}
/* Theme picker circles on login */
body.skin-neumorphic [style*="width: 28px"][style*="height: 28px"][style*="borderRadius: 50%"] {
  border: none !important;
  box-shadow: var(--nSxs) !important;
}

/* ── S. ADMIN PANEL ──────────────────────────────────────────── */
body.skin-neumorphic [style*="borderRadius:14"][style*="width: min"] {
  border: none !important;
  border-radius: 20px !important;
  box-shadow: var(--nS) !important;
  background: var(--bg) !important;
}
/* Admin tabs */
body.skin-neumorphic [style*="borderBottom: 1px solid var(--border2)"][style*="overflowX"] {
  border-bottom: none !important;
  box-shadow: 0 2px 5px var(--neu-dark) !important;
  background: var(--bg) !important;
}
/* Avatar circles */
body.skin-neumorphic [style*="width: 38px"][style*="height: 38px"][style*="borderRadius: 50%"] {
  box-shadow: var(--nSxs) !important;
}
body.skin-neumorphic [style*="width: 44px"][style*="height: 44px"][style*="borderRadius: 50%"] {
  box-shadow: var(--nSxs) !important;
}
/* Status badges */
body.skin-neumorphic [style*="borderRadius: 3px"][style*="padding: 1px"],
body.skin-neumorphic [style*="borderRadius:3px"][style*="padding:1px"],
body.skin-neumorphic [style*="borderRadius:4"][style*="padding: 1px"] {
  border: none !important;
  border-radius: 6px !important;
  box-shadow: var(--nSxs) !important;
}

/* ── T. THEME PICKER / SKIN PICKER ──────────────────────────── */
body.skin-neumorphic [style*="maxWidth:800"],
body.skin-neumorphic [style*="maxWidth: 800px"],
body.skin-neumorphic [style*="maxWidth:900"],
body.skin-neumorphic [style*="maxWidth:760"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: 20px !important;
  box-shadow: var(--nS), 3px 3px 6px var(--neu-dark) !important;
}
/* Skin/theme swatches */
body.skin-neumorphic [style*="cursor: pointer"][style*="border: 2px"] {
  border: none !important;
  box-shadow: var(--nSxs) !important;
}
body.skin-neumorphic [style*="cursor: pointer"][style*="border: 3px"] {
  border: none !important;
  box-shadow: var(--nS) !important;
}

/* ── U. HELP GUIDE / TUTORIAL / CHANGELOG ───────────────────── */
body.skin-neumorphic [style*="maxWidth:700"],
body.skin-neumorphic [style*="maxWidth: 700px"],
body.skin-neumorphic [style*="maxWidth:560"],
body.skin-neumorphic [style*="maxWidth:600"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: 20px !important;
  box-shadow: var(--nS) !important;
}

/* ── V. INTEGRATION PANEL (Live tab) ────────────────────────── */
body.skin-neumorphic [style*="background: var(--bg3)"][style*="border-radius: 7px"],
body.skin-neumorphic [style*="background: var(--bg3)"][style*="borderRadius: 7px"],
body.skin-neumorphic [style*="background: var(--bg3)"][style*="borderRadius:7px"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nR) !important;
  box-shadow: var(--nSsm) !important;
}
/* Integration mini bars */
body.skin-neumorphic [style*="background: var(--bg3)"][style*="border-radius: 5px"],
body.skin-neumorphic [style*="background: var(--bg3)"][style*="borderRadius: 5px"],
body.skin-neumorphic [style*="background: var(--bg3)"][style*="borderRadius:5px"] {
  background: color-mix(in srgb, var(--bg) 70%, var(--neu-dark)) !important;
  border-radius: 8px !important;
  box-shadow: var(--nIxs) !important;
}

/* ── W. AI CHAT PANEL ────────────────────────────────────────── */
body.skin-neumorphic [style*="width: 440px"],
body.skin-neumorphic [style*="width:440px"] {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: -4px 0 12px var(--neu-dark) !important;
}
/* Chat bubbles */
body.skin-neumorphic [style*="border-radius: var(--radius-md)"][style*="padding: 9px"] {
  background: var(--bg) !important;
  border: none !important;
  box-shadow: var(--nSxs) !important;
}

/* ── X. COLLAB / SHARE PANEL ─────────────────────────────────── */
body.skin-neumorphic [style*="z-index: 301"],
body.skin-neumorphic [style*="z-index: 300"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: 18px !important;
  box-shadow: var(--nS) !important;
}

/* ── Y. NODE CANVAS — all panels ─────────────────────────────── */
body.skin-neumorphic [style*="z-index: 400"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nR) !important;
  box-shadow: var(--nS) !important;
}
/* Tooltip / hover labels */
body.skin-neumorphic [style*="pointer-events: none"][style*="white-space: nowrap"],
body.skin-neumorphic [style*="pointerEvents: none"][style*="whiteSpace: nowrap"] {
  background: var(--bg) !important;
  border: none !important;
  border-radius: var(--nRxs) !important;
  box-shadow: var(--nSxs) !important;
}

/* ── Z. SCROLLBARS ───────────────────────────────────────────── */
body.skin-neumorphic ::-webkit-scrollbar { width: 6px; height: 6px; }
body.skin-neumorphic ::-webkit-scrollbar-track {
  background: var(--bg);
  box-shadow: inset 1px 1px 4px var(--neu-dark);
  border-radius: 6px;
}
body.skin-neumorphic ::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--bg) 60%, var(--neu-dark));
  border-radius: 6px;
  box-shadow: 1px 1px 2px var(--neu-dark);
}
body.skin-neumorphic ::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--bg) 40%, var(--neu-dark));
}

/* ══ DARK THEME SECTION ══════════════════════════════════════
   All 6 dark themes get boosted shadow depth (darker backgrounds
   need more contrast to show the effect)
   ═════════════════════════════════════════════════════════════ */
body.skin-neumorphic[data-theme="dark"],
body.skin-neumorphic[data-theme="midnight"],
body.skin-neumorphic[data-theme="forest"],
body.skin-neumorphic[data-theme="ocean"],
body.skin-neumorphic[data-theme="amber"],
body.skin-neumorphic[data-theme="violet"] {
  --nS:   8px 8px 18px var(--neu-dark), -5px -5px 12px var(--neu-light);
  --nSsm: 5px 5px 10px var(--neu-dark), -3px -3px 7px var(--neu-light);
  --nSxs: 3px 3px 6px  var(--neu-dark), -2px -2px 4px var(--neu-light);
  --nI:   inset 4px 4px 9px  var(--neu-dark), inset -3px -3px 6px var(--neu-light);
  --nIsm: inset 3px 3px 6px  var(--neu-dark), inset -2px -2px 4px var(--neu-light);
  --nIxs: inset 2px 2px 4px  var(--neu-dark), inset -1px -1px 2px var(--neu-light);
}
/* Toolbar buttons: keep flat in dark themes too */
body.skin-neumorphic[data-theme="dark"] [data-tut="topbar-row1"] button,
body.skin-neumorphic[data-theme="midnight"] [data-tut="topbar-row1"] button,
body.skin-neumorphic[data-theme="forest"] [data-tut="topbar-row1"] button,
body.skin-neumorphic[data-theme="ocean"] [data-tut="topbar-row1"] button,
body.skin-neumorphic[data-theme="amber"] [data-tut="topbar-row1"] button,
body.skin-neumorphic[data-theme="violet"] [data-tut="topbar-row1"] button,
body.skin-neumorphic[data-theme="dark"] [data-tut="topbar-row1"] + div button,
body.skin-neumorphic[data-theme="midnight"] [data-tut="topbar-row1"] + div button,
body.skin-neumorphic[data-theme="forest"] [data-tut="topbar-row1"] + div button,
body.skin-neumorphic[data-theme="ocean"] [data-tut="topbar-row1"] + div button,
body.skin-neumorphic[data-theme="amber"] [data-tut="topbar-row1"] + div button,
body.skin-neumorphic[data-theme="violet"] [data-tut="topbar-row1"] + div button {
  box-shadow: none !important;
  color: var(--text2) !important;
}`
  },

  sakura: {
    name:"Sakura", icon:"🌸", nav:"icon-dock",
    concept:"Ma — the art of negative space. Beauty in what is absent.",
    tags:["Elegant","Serif","Minimal"],
    defaultTheme:"cream",
    defaultAccent:{accent:"#e8648a",accent2:"#c0376a"},
    accentOptions:[
      {name:"Cherry",  accent:"#e8648a", accent2:"#c0376a"},
      {name:"Ink",     accent:"#1a1a2e", accent2:"#0d0d1e"},
      {name:"Matcha",  accent:"#4a7c59", accent2:"#2d5e3a"},
      {name:"Indigo",  accent:"#4338ca", accent2:"#3730a3"},
      {name:"Gold",    accent:"#b7860b", accent2:"#8a6508"},
    ],
    vars:{
      "--font-ui":"'Cormorant Garamond','Garamond','Georgia',serif",
      "--font-node":"'Cormorant Garamond','Georgia',serif",
      "--font-weight-ui":"500","--font-weight-node":"400",
      "--letter-space":"0.04em","--line-height":"1.8",
      "--radius-xs":"2px","--radius-sm":"4px","--radius-md":"8px","--radius-lg":"12px",
      "--radius-node":"10px","--radius-btn":"4px",
      "--shadow-node":"0 2px 16px var(--shadow),0 1px 4px var(--shadow)",
      "--shadow-node-sel":"0 0 0 2px var(--accent)44,0 4px 24px var(--shadow)",
      "--transition-all":"all 0.22s ease",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--border2)","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border2)",
    },
    bodyClass:"skin-sakura",
    css:`/* No global font-size override — avoids overflow in badges/tabs */
body.skin-sakura button{border:1px solid var(--border)!important;background:transparent!important;color:var(--text2)!important}
body.skin-sakura button:not([disabled]):hover{border-color:var(--accent)!important;color:var(--accent)!important;background:var(--accent)06!important}
body.skin-sakura input,body.skin-sakura select,body.skin-sakura textarea{border:1px solid var(--border)!important}
body.skin-sakura input:focus,body.skin-sakura select:focus,body.skin-sakura textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 2px var(--accent)20!important;outline:none}
body.skin-sakura ::-webkit-scrollbar{width:4px}
body.skin-sakura ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
body.skin-sakura ::-webkit-scrollbar-thumb:hover{background:var(--accent)}
/* Fix: inset stripe avoids arc on 12px radius cards */
body.skin-sakura .nn-map-card{border:1px solid var(--border2);box-shadow:inset 0 2px 0 var(--ca),0 2px 12px var(--shadow)}
body.skin-sakura .nn-map-card:hover{box-shadow:inset 0 2px 0 var(--ca),0 4px 20px var(--shadow);border-color:var(--ca)44}
body.skin-sakura .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-sakura .nn-map-list-row:hover{background:var(--bg3)!important}
body.skin-sakura [style*="rgba(0,0,0,.7)"],body.skin-sakura [style*="rgba(0,0,0,.65)"],body.skin-sakura [style*="rgba(0,0,0,.6)"],body.skin-sakura [style*="rgba(0,0,0,.55)"],body.skin-sakura [style*="rgba(0,0,0,.5)"],body.skin-sakura [style*="rgba(0,0,0,.4)"]{box-shadow:0 4px 32px rgba(0,0,0,.1),0 1px 4px rgba(0,0,0,.07)!important}`,
  },

  vapor: {
    name:"Vapor", icon:"🌊", nav:"editorial",
    concept:"A E S T H E T I C. Grid lines. Infinite sunset. Lost in the 80s.",
    tags:["Retro","Grid","Pixel"],
    defaultTheme:"violet",
    defaultAccent:{accent:"#ff71ce",accent2:"#d4008e"},
    accentOptions:[
      {name:"Pink",    accent:"#ff71ce", accent2:"#d4008e"},
      {name:"Cyan",    accent:"#01cdfe", accent2:"#00a0cc"},
      {name:"Purple",  accent:"#b967ff", accent2:"#8800cc"},
      {name:"Lime",    accent:"#05ffa1", accent2:"#00cc80"},
      {name:"Gold",    accent:"#fffb96", accent2:"#e0dc60"},
    ],
    vars:{
      "--font-ui":"'VT323','Press Start 2P','Courier New',monospace",
      "--font-node":"'VT323','Courier New',monospace",
      "--font-weight-ui":"400","--font-weight-node":"400",
      "--letter-space":"0.05em","--line-height":"1.5",
      "--radius-xs":"0","--radius-sm":"0","--radius-md":"2px","--radius-lg":"4px",
      "--radius-node":"2px","--radius-btn":"0",
      "--shadow-node":"0 0 0 1px var(--accent)44,0 0 20px var(--accent)22",
      "--shadow-node-sel":"0 0 0 2px var(--accent),0 0 40px var(--accent)55",
      "--transition-all":"all 0.1s",
      // Fix: use semi-transparent bg so blur actually works
      "--topbar-bg":"color-mix(in srgb,var(--bg) 80%,transparent)",
      "--topbar-border":"1px solid var(--accent)44","--topbar-blur":"blur(8px)",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-vapor",
    css:`body.skin-vapor{
  background-image:
    repeating-linear-gradient(0deg,transparent,transparent 39px,color-mix(in srgb,var(--accent) 18%,transparent) 39px,color-mix(in srgb,var(--accent) 18%,transparent) 40px),
    repeating-linear-gradient(90deg,transparent,transparent 39px,color-mix(in srgb,var(--accent) 18%,transparent) 39px,color-mix(in srgb,var(--accent) 18%,transparent) 40px);
  background-attachment:fixed}
body.skin-vapor .nn-topbar{position:relative;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important}
body.skin-vapor .nn-topbar::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--accent),var(--accent2),var(--accent),transparent);box-shadow:0 0 12px var(--accent)}
body.skin-vapor button{text-transform:uppercase!important;letter-spacing:0.15em!important;font-size:11px!important;border:1px solid var(--accent)55!important}
body.skin-vapor button:not([disabled]):hover{background:var(--accent)15!important;box-shadow:0 0 12px var(--accent)44!important;color:var(--accent)!important}
body.skin-vapor input:focus,body.skin-vapor select:focus,body.skin-vapor textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 1px var(--accent),0 0 12px var(--accent)44!important;outline:none}
body.skin-vapor ::-webkit-scrollbar{width:4px}
body.skin-vapor ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:0}
body.skin-vapor .nn-map-card{border:1px solid var(--ca)44;box-shadow:0 0 16px var(--ca)18,0 2px 8px var(--shadow)}
body.skin-vapor .nn-map-card:hover{border-color:var(--ca)88;box-shadow:0 0 28px var(--ca)55,0 0 0 1px var(--ca)66;transform:translateY(-1px)}
body.skin-vapor .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-vapor .nn-map-list-row:hover{background:var(--bg3)!important;box-shadow:0 0 12px var(--ca)33}
body.skin-vapor [style*="rgba(0,0,0,.7)"],body.skin-vapor [style*="rgba(0,0,0,.65)"],body.skin-vapor [style*="rgba(0,0,0,.6)"],body.skin-vapor [style*="rgba(0,0,0,.55)"],body.skin-vapor [style*="rgba(0,0,0,.5)"],body.skin-vapor [style*="rgba(0,0,0,.4)"]{box-shadow:0 0 0 1px var(--accent)55,0 8px 32px rgba(0,0,0,.5),0 0 24px var(--accent)15!important}
/* LLMChat panel */
body.skin-vapor [style*="border-left: 1px solid var(--border)"] { border-left: 1px solid var(--accent)33 !important; }`,
  },

  newspaper: {
    name:"Newspaper", icon:"📰", nav:"editorial",
    concept:"All the news fit to diagram. Playfair Display editorial clarity.",
    tags:["Print","Serif","Editorial"],
    defaultTheme:"parchment",
    defaultAccent:{accent:"#c41e3a",accent2:"#9b1530"},
    accentOptions:[
      {name:"Crimson", accent:"#c41e3a", accent2:"#9b1530"},
      {name:"Navy",    accent:"#2c5f8a", accent2:"#1a3a5e"},
      {name:"Forest",  accent:"#1a5e2a", accent2:"#0f3c1c"},
      {name:"Sepia",   accent:"#7c4f1e", accent2:"#5a3a14"},
      {name:"Black",   accent:"#1a1a1a", accent2:"#000000"},
    ],
    vars:{
      "--font-ui":"'Playfair Display','Georgia',serif",
      "--font-node":"'Playfair Display','Georgia',serif",
      "--font-weight-ui":"700","--font-weight-node":"400",
      "--letter-space":"0.02em","--line-height":"1.7",
      "--radius-xs":"0","--radius-sm":"0","--radius-md":"2px","--radius-lg":"4px",
      "--radius-node":"0","--radius-btn":"2px",
      "--shadow-node":"0 1px 4px var(--shadow),0 2px 0 var(--accent)44",
      "--shadow-node-sel":"0 0 0 2px var(--accent)55,0 4px 20px var(--shadow)",
      "--transition-all":"all 0.18s ease",
      "--topbar-bg":"var(--accent)","--topbar-border":"none","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg3)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-newspaper",
    css:`body.skin-newspaper .nn-topbar{box-shadow:0 3px 0 var(--accent2)!important}
/* Fix: only force white on direct text/icon children, not all descendants */
body.skin-newspaper .nn-topbar>*{color:#fff!important}
body.skin-newspaper .nn-topbar button{color:#fff!important;border-color:rgba(255,255,255,0.4)!important}
body.skin-newspaper button{font-style:italic!important;border:1px solid var(--border)!important;background:transparent!important}
body.skin-newspaper button:not([disabled]):hover{background:var(--text)!important;color:var(--bg)!important}
body.skin-newspaper input,body.skin-newspaper select,body.skin-newspaper textarea{border:1px solid var(--border)!important;border-top:2px solid var(--text)!important;border-radius:0!important}
body.skin-newspaper input:focus,body.skin-newspaper select:focus,body.skin-newspaper textarea:focus{border-top-color:var(--accent)!important;box-shadow:none!important;outline:none}
body.skin-newspaper ::-webkit-scrollbar{width:6px}
body.skin-newspaper ::-webkit-scrollbar-thumb{background:var(--accent)}
body.skin-newspaper .nn-map-card{border:1px solid var(--border);border-top:4px solid var(--ca);box-shadow:2px 2px 0 var(--shadow)}
body.skin-newspaper .nn-map-card:hover{box-shadow:4px 4px 0 var(--shadow);transform:translate(-1px,-1px)}
body.skin-newspaper .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-newspaper .nn-map-list-row{border-left:4px solid var(--ca)!important}
body.skin-newspaper .nn-map-list-row:hover{background:var(--bg3)!important}
body.skin-newspaper [style*="rgba(0,0,0,.7)"],body.skin-newspaper [style*="rgba(0,0,0,.65)"],body.skin-newspaper [style*="rgba(0,0,0,.6)"],body.skin-newspaper [style*="rgba(0,0,0,.55)"],body.skin-newspaper [style*="rgba(0,0,0,.5)"],body.skin-newspaper [style*="rgba(0,0,0,.4)"]{box-shadow:5px 5px 0 var(--shadow),0 0 0 1px var(--border)!important}`,
  },

  coral: {
    name:"Coral", icon:"🪸", nav:"bottom",
    concept:"Miami heat. Fun, bouncy, warm, alive. Every interaction feels good.",
    tags:["Vibrant","Bouncy","Warm"],
    defaultTheme:"dark",
    accentOptions:[
      {name:"Coral",   accent:"#ff6b6b", accent2:"#e53535"},
      {name:"Teal",    accent:"#00d4aa", accent2:"#00a888"},
      {name:"Sunset",  accent:"#ff8c42", accent2:"#d06820"},
      {name:"Electric",accent:"#ffd93d", accent2:"#d4a800"},
      {name:"Ocean",   accent:"#4ecdc4", accent2:"#2aaca4"},
    ],
    vars:{
      "--font-ui":"'DM Sans','Inter',system-ui,sans-serif",
      "--font-node":"'DM Sans',system-ui,sans-serif",
      "--font-weight-ui":"600","--font-weight-node":"500",
      "--letter-space":"-0.01em","--line-height":"1.55",
      "--radius-xs":"8px","--radius-sm":"12px","--radius-md":"16px","--radius-lg":"24px",
      "--radius-node":"16px","--radius-btn":"20px",
      "--shadow-node":"0 4px 24px var(--shadow),0 2px 8px var(--shadow)",
      "--shadow-node-sel":"0 0 0 2px var(--accent)66,0 8px 32px var(--shadow)",
      "--transition-all":"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--border)","--topbar-blur":"blur(16px)",
      "--sidebar-bg":"var(--bg2)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-coral",
    css:`body.skin-coral button:not([disabled]):hover{box-shadow:0 4px 16px var(--accent)44!important;transform:translateY(-2px)!important}
body.skin-coral button:active{transform:translateY(0)!important}
body.skin-coral input:focus,body.skin-coral select:focus,body.skin-coral textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent)22!important;outline:none}
body.skin-coral ::-webkit-scrollbar{width:6px}
body.skin-coral ::-webkit-scrollbar-thumb{background:var(--accent)55;border-radius:12px}
/* Fix: inset stripe avoids arc on 24px radius cards */
body.skin-coral .nn-map-card{border:1px solid var(--border2);box-shadow:inset 0 3px 0 var(--ca),0 4px 16px var(--shadow)}
body.skin-coral .nn-map-card:hover{transform:translateY(-4px);box-shadow:inset 0 3px 0 var(--ca),0 12px 32px var(--shadow)}
body.skin-coral .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-coral .nn-map-list-row:hover{background:var(--bg3)!important;transform:translateX(2px);box-shadow:0 4px 16px var(--shadow)}
body.skin-coral [style*="rgba(0,0,0,.7)"],body.skin-coral [style*="rgba(0,0,0,.65)"],body.skin-coral [style*="rgba(0,0,0,.6)"],body.skin-coral [style*="rgba(0,0,0,.55)"],body.skin-coral [style*="rgba(0,0,0,.5)"],body.skin-coral [style*="rgba(0,0,0,.4)"]{box-shadow:0 8px 40px var(--shadow),0 0 0 1px var(--border2),0 0 20px var(--accent)11!important}`,
  },

  carbon: {
    name:"Carbon", icon:"⚙", nav:"icon-dock",
    concept:"Forged, not designed. Carbon fiber, precision instruments, zero tolerance.",
    tags:["Industrial","Dense","Precise"],
    defaultTheme:"amber",
    defaultAccent:{accent:"#f0a830",accent2:"#c88020"},
    accentOptions:[
      {name:"Amber",   accent:"#f0a830", accent2:"#c88020"},
      {name:"Cyan",    accent:"#00c8ff", accent2:"#0090cc"},
      {name:"Copper",  accent:"#b87333", accent2:"#8a5520"},
      {name:"Lime",    accent:"#00ff88", accent2:"#00cc66"},
      {name:"Red",     accent:"#ff4444", accent2:"#cc2222"},
    ],
    vars:{
      "--font-ui":"'IBM Plex Mono','JetBrains Mono',monospace",
      "--font-node":"'IBM Plex Mono',monospace",
      "--font-weight-ui":"500","--font-weight-node":"400",
      "--letter-space":"0.04em","--line-height":"1.45",
      "--radius-xs":"2px","--radius-sm":"4px","--radius-md":"6px","--radius-lg":"8px",
      "--radius-node":"6px","--radius-btn":"4px",
      "--shadow-node":"0 2px 8px var(--shadow),inset 0 1px 0 var(--accent)18",
      "--shadow-node-sel":"0 0 0 1px var(--accent),0 4px 20px var(--accent)33",
      "--transition-all":"all 0.1s",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--accent)33","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-carbon",
    css:`body.skin-carbon{
  background-image:
    repeating-linear-gradient(45deg,color-mix(in srgb,var(--text) 4%,transparent) 0px,color-mix(in srgb,var(--text) 4%,transparent) 1px,transparent 1px,transparent 4px),
    repeating-linear-gradient(-45deg,color-mix(in srgb,var(--text) 4%,transparent) 0px,color-mix(in srgb,var(--text) 4%,transparent) 1px,transparent 1px,transparent 4px);
  background-attachment:fixed}
/* Fix: don't force tiny font-size on icon-dock nav buttons — breaks emoji icons */
body.skin-carbon button:not(.nn-nav-btn){text-transform:uppercase!important;letter-spacing:0.06em!important;font-size:10px!important;border:1px solid var(--border)!important}
body.skin-carbon .nn-topbar button{font-size:inherit!important;text-transform:none!important;letter-spacing:normal!important}
body.skin-carbon button:not([disabled]):hover{border-color:var(--accent)!important;color:var(--accent)!important;box-shadow:0 0 8px var(--accent)33!important}
body.skin-carbon input:focus,body.skin-carbon select:focus,body.skin-carbon textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 1px var(--accent),0 0 8px var(--accent)33!important;outline:none}
body.skin-carbon ::-webkit-scrollbar{width:5px}
body.skin-carbon ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:1px}
body.skin-carbon .nn-map-card{border:1px solid var(--ca)33;box-shadow:inset 0 1px 0 var(--ca)22,0 2px 8px var(--shadow)}
body.skin-carbon .nn-map-card:hover{border-color:var(--ca)66;box-shadow:0 0 16px var(--ca)22,inset 0 1px 0 var(--ca)22;transform:translateY(-1px)}
body.skin-carbon .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-carbon .nn-map-list-row:hover{background:var(--bg3)!important;border-left-color:var(--ca)!important}
body.skin-carbon [style*="rgba(0,0,0,.7)"],body.skin-carbon [style*="rgba(0,0,0,.65)"],body.skin-carbon [style*="rgba(0,0,0,.6)"],body.skin-carbon [style*="rgba(0,0,0,.55)"],body.skin-carbon [style*="rgba(0,0,0,.5)"],body.skin-carbon [style*="rgba(0,0,0,.4)"]{box-shadow:0 4px 24px rgba(0,0,0,.5),0 0 0 1px var(--accent)44!important}`,
  },

  pastelPop: {
    name:"Pastel Pop", icon:"🍬", nav:"bottom",
    concept:"Pure joy. Bouncy, soft, every interaction is a little celebration.",
    tags:["Fun","Rounded","Playful"],
    defaultTheme:"rose",
    defaultAccent:{accent:"#ff6eb4",accent2:"#d4008e"},
    accentOptions:[
      {name:"Pink",    accent:"#ff6eb4", accent2:"#d4008e"},
      {name:"Lavender",accent:"#9b72e8", accent2:"#7c3aed"},
      {name:"Mint",    accent:"#5ec8a0", accent2:"#2ea87e"},
      {name:"Peach",   accent:"#ff9b6e", accent2:"#dd6e3e"},
      {name:"Sky",     accent:"#6ec8ff", accent2:"#3ea8e8"},
    ],
    vars:{
      "--font-ui":"'Nunito','Poppins',system-ui,sans-serif",
      "--font-node":"'Nunito',system-ui,sans-serif",
      "--font-weight-ui":"800","--font-weight-node":"700",
      "--letter-space":"0em","--line-height":"1.7",
      "--radius-xs":"12px","--radius-sm":"16px","--radius-md":"22px","--radius-lg":"28px",
      "--radius-node":"22px","--radius-btn":"24px",
      "--shadow-node":"0 4px 20px var(--shadow),0 2px 8px var(--shadow)",
      "--shadow-node-sel":"0 0 0 3px var(--accent)55,0 8px 32px var(--shadow)",
      "--transition-all":"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--border)","--topbar-blur":"blur(16px)",
      "--sidebar-bg":"var(--bg2)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-pastel-pop",
    css:`body.skin-pastel-pop button{font-weight:800!important;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1)!important}
body.skin-pastel-pop button:not([disabled]):hover{transform:translateY(-3px) scale(1.02)!important;box-shadow:0 8px 20px var(--accent)33!important}
body.skin-pastel-pop button:active{transform:scale(0.96)!important}
body.skin-pastel-pop input:focus,body.skin-pastel-pop select:focus,body.skin-pastel-pop textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent)33!important;outline:none}
body.skin-pastel-pop ::-webkit-scrollbar{width:8px}
body.skin-pastel-pop ::-webkit-scrollbar-thumb{background:var(--accent)55;border-radius:12px}
/* Fix: inset stripe avoids severe arc on 28px radius cards */
body.skin-pastel-pop .nn-map-card{border:2px solid var(--ca)44;box-shadow:inset 0 4px 0 var(--ca),0 4px 16px var(--shadow)}
body.skin-pastel-pop .nn-map-card:hover{transform:translateY(-4px) scale(1.015);box-shadow:inset 0 4px 0 var(--ca),0 14px 32px var(--shadow);border-color:var(--ca)88}
body.skin-pastel-pop .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-pastel-pop .nn-map-list-row:hover{background:var(--bg3)!important;transform:translateX(3px)}
body.skin-pastel-pop [style*="rgba(0,0,0,.7)"],body.skin-pastel-pop [style*="rgba(0,0,0,.65)"],body.skin-pastel-pop [style*="rgba(0,0,0,.6)"],body.skin-pastel-pop [style*="rgba(0,0,0,.55)"],body.skin-pastel-pop [style*="rgba(0,0,0,.5)"],body.skin-pastel-pop [style*="rgba(0,0,0,.4)"]{box-shadow:0 8px 32px var(--accent)22,0 2px 8px var(--shadow),0 0 0 2px var(--accent)22!important}`,
  },
};

export const SKIN_KEYS = Object.keys(SKINS);
