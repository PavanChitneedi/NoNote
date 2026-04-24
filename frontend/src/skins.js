// skins.js — 10 distinct UI personalities, each with a nav layout + CSS character

export const SKINS = {

// ──────────────────────────────────────────────────────────────
// OBSIDIAN — default developer tool, top nav + left sidebar
// ──────────────────────────────────────────────────────────────
obsidian: {
  name: "Obsidian",  icon: "⬡",
  concept: "The Developer's Workshop. Dense, precise, monospaced. GitHub meets VS Code.",
  nav: "top",
  palette: ["#0d1117","#161b22","#58a6ff","#3fb950","#f78166"],
  vars: {
    "--bg":"#0d1117","--bg2":"#161b22","--bg3":"#21262d",
    "--border":"#30363d","--border2":"#21262d",
    "--text":"#e6edf3","--text2":"#c9d1d9","--text3":"#7d8590","--text4":"#484f58",
    "--accent":"#58a6ff","--accent2":"#1f6feb","--success":"#3fb950","--danger":"#f78166",
    "--canvas-dot":"#21262d","--node-bg":"#161b22","--shadow":"rgba(0,0,0,0.5)",
    "--font-ui":"'JetBrains Mono','Fira Code',monospace",
    "--font-node":"'JetBrains Mono','Fira Code',monospace",
    "--font-weight-ui":"700","--font-weight-node":"600",
    "--letter-space":"0.3px","--line-height":"1.5",
    "--radius-xs":"4px","--radius-sm":"6px","--radius-md":"8px","--radius-lg":"10px",
    "--radius-node":"10px","--radius-btn":"6px",
    "--topbar-h":"48px","--node-header-h":"34px","--btn-pad":"5px 10px",
    "--sidebar-w":"220px","--props-w":"268px","--node-pad":"8px 10px",
    "--node-body-pad":"6px 10px 8px","--node-border-w":"2px",
    "--shadow-node":"0 2px 12px rgba(0,0,0,0.4)",
    "--shadow-node-sel":"0 0 0 3px rgba(88,166,255,0.25),0 6px 28px rgba(0,0,0,0.5)",
    "--transition-all":"all 0.12s",
    "--topbar-bg":"#161b22","--topbar-border":"1px solid #21262d","--topbar-blur":"none",
    "--sidebar-bg":"#161b22","--sidebar-border":"1px solid #21262d",
  },
  bodyClass: "skin-obsidian",
  css: `body.skin-obsidian{background:#0d1117}
body.skin-obsidian ::-webkit-scrollbar{width:6px;height:6px}
body.skin-obsidian ::-webkit-scrollbar-track{background:#0d1117}
body.skin-obsidian ::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}`,
},

// ──────────────────────────────────────────────────────────────
// AURORA — glassmorphism, space gradients, top nav
// ──────────────────────────────────────────────────────────────
aurora: {
  name: "Aurora",  icon: "🌌",
  concept: "Floating in deep space. Frosted glass panels over animated aurora gradients.",
  nav: "top",
  palette: ["#05080f","#0d1424","#a78bfa","#34d399","#fb7185"],
  vars: {
    "--bg":"#05080f","--bg2":"#0d1424","--bg3":"#141d35",
    "--border":"rgba(139,92,246,0.25)","--border2":"rgba(139,92,246,0.12)",
    "--text":"#e2e8f8","--text2":"#b8c5e0","--text3":"#7890b8","--text4":"#4a6080",
    "--accent":"#a78bfa","--accent2":"#7c3aed","--success":"#34d399","--danger":"#fb7185",
    "--canvas-dot":"#141d35","--node-bg":"rgba(13,20,36,0.8)","--shadow":"rgba(0,0,0,0.7)",
    "--font-ui":"'Inter','Segoe UI',system-ui,sans-serif",
    "--font-node":"'Inter',system-ui,sans-serif",
    "--font-weight-ui":"500","--font-weight-node":"400",
    "--letter-space":"-0.01em","--line-height":"1.6",
    "--radius-xs":"10px","--radius-sm":"14px","--radius-md":"18px","--radius-lg":"24px",
    "--radius-node":"18px","--radius-btn":"12px",
    "--topbar-h":"54px","--node-header-h":"42px","--btn-pad":"8px 18px",
    "--sidebar-w":"220px","--props-w":"280px","--node-pad":"12px 14px",
    "--node-body-pad":"10px 14px 12px","--node-border-w":"1px",
    "--shadow-node":"0 4px 32px rgba(139,92,246,0.2),0 2px 8px rgba(0,0,0,0.5)",
    "--shadow-node-sel":"0 0 0 2px rgba(167,139,250,0.7),0 8px 40px rgba(139,92,246,0.4)",
    "--transition-all":"all 0.2s cubic-bezier(0.4,0,0.2,1)",
    "--topbar-bg":"rgba(13,20,36,0.6)","--topbar-border":"1px solid rgba(139,92,246,0.2)","--topbar-blur":"blur(24px)",
    "--sidebar-bg":"rgba(5,8,15,0.7)","--sidebar-border":"1px solid rgba(139,92,246,0.15)",
  },
  bodyClass: "skin-aurora",
  css: `body.skin-aurora{background:#05080f;background-image:radial-gradient(ellipse 80% 60% at 20% 20%,rgba(139,92,246,0.18) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 70%,rgba(52,211,153,0.12) 0%,transparent 55%),radial-gradient(ellipse 40% 40% at 60% 5%,rgba(251,113,133,0.10) 0%,transparent 50%);background-attachment:fixed}
body.skin-aurora .nn-topbar{backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;box-shadow:0 1px 0 rgba(139,92,246,0.2),0 4px 24px rgba(0,0,0,0.5)!important}
body.skin-aurora .nn-sidebar{backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}
body.skin-aurora button:not([disabled]):hover{box-shadow:0 0 16px rgba(167,139,250,0.4)!important}
body.skin-aurora input:focus,body.skin-aurora select:focus{box-shadow:0 0 0 2px rgba(167,139,250,0.5)!important;border-color:rgba(167,139,250,0.6)!important}
body.skin-aurora ::-webkit-scrollbar{width:5px}
body.skin-aurora ::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.4);border-radius:3px}`,
},

// ──────────────────────────────────────────────────────────────
// BRUTALIST — confrontational, no-nonsense, bottom dock nav
// ──────────────────────────────────────────────────────────────
brutalist: {
  name: "Brutalist",  icon: "🏗",
  concept: "Raw concrete and steel. No metaphors. No softness. Design as confrontation.",
  nav: "bottom",
  palette: ["#0a0a0a","#111111","#ffe600","#ffffff","#ff2e2e"],
  vars: {
    "--bg":"#0a0a0a","--bg2":"#111111","--bg3":"#1a1a1a",
    "--border":"#333","--border2":"#222",
    "--text":"#fff","--text2":"#e0e0e0","--text3":"#999","--text4":"#555",
    "--accent":"#ffe600","--accent2":"#ccb800","--success":"#00ff88","--danger":"#ff2e2e",
    "--canvas-dot":"#1a1a1a","--node-bg":"#111","--shadow":"rgba(0,0,0,0.9)",
    "--font-ui":"'Space Grotesk','Arial Black',sans-serif",
    "--font-node":"'Space Grotesk',sans-serif",
    "--font-weight-ui":"700","--font-weight-node":"700",
    "--letter-space":"0.02em","--line-height":"1.3",
    "--radius-xs":"0","--radius-sm":"0","--radius-md":"0","--radius-lg":"0",
    "--radius-node":"0","--radius-btn":"0",
    "--topbar-h":"0px","--node-header-h":"36px","--btn-pad":"10px 20px",
    "--sidebar-w":"0px","--props-w":"268px","--node-pad":"10px 12px",
    "--node-body-pad":"8px 12px 10px","--node-border-w":"3px",
    "--shadow-node":"5px 5px 0 #ffe600","--shadow-node-sel":"7px 7px 0 #ffe600",
    "--transition-all":"all 0.05s",
    "--topbar-bg":"#0a0a0a","--topbar-border":"3px solid #ffe600","--topbar-blur":"none",
    "--sidebar-bg":"#0a0a0a","--sidebar-border":"3px solid #333",
  },
  bodyClass: "skin-brutalist",
  css: `body.skin-brutalist{background:#0a0a0a}
body.skin-brutalist button{text-transform:uppercase!important;letter-spacing:0.06em!important;font-weight:700!important;border:2px solid currentColor!important}
body.skin-brutalist button:not([disabled]):hover{background:#ffe600!important;color:#0a0a0a!important;box-shadow:4px 4px 0 rgba(255,230,0,0.4)!important;transform:translate(-2px,-2px)!important}
body.skin-brutalist button:active{transform:translate(2px,2px)!important;box-shadow:none!important}
body.skin-brutalist input,body.skin-brutalist select{border:2px solid #333!important;border-radius:0!important}
body.skin-brutalist input:focus,body.skin-brutalist select:focus{border-color:#ffe600!important;box-shadow:4px 4px 0 #ffe600!important}
body.skin-brutalist ::-webkit-scrollbar{width:8px}
body.skin-brutalist ::-webkit-scrollbar-thumb{background:#ffe600;border-radius:0}`,
},

// ──────────────────────────────────────────────────────────────
// NEON TOKYO — cyberpunk, bottom dock nav
// ──────────────────────────────────────────────────────────────
neonTokyo: {
  name: "Neon Tokyo",  icon: "⚡",
  concept: "Rain on neon-soaked streets. Everything glows. Every click is electric.",
  nav: "bottom",
  palette: ["#02000a","#06011a","#ff2d78","#00f5ff","#ffe600"],
  vars: {
    "--bg":"#02000a","--bg2":"#06011a","--bg3":"#0d0230",
    "--border":"rgba(255,45,120,0.3)","--border2":"rgba(0,245,255,0.15)",
    "--text":"#f0f0ff","--text2":"#c8c0e0","--text3":"#8070a8","--text4":"#503868",
    "--accent":"#ff2d78","--accent2":"#cc0050","--success":"#00f5a0","--danger":"#ff4040",
    "--canvas-dot":"#0d0230","--node-bg":"#06011a","--shadow":"rgba(0,0,0,0.9)",
    "--font-ui":"'Rajdhani','Orbitron',system-ui,sans-serif",
    "--font-node":"'Rajdhani',system-ui,sans-serif",
    "--font-weight-ui":"600","--font-weight-node":"500",
    "--letter-space":"0.08em","--line-height":"1.4",
    "--radius-xs":"0","--radius-sm":"2px","--radius-md":"4px","--radius-lg":"6px",
    "--radius-node":"4px","--radius-btn":"2px",
    "--topbar-h":"0px","--node-header-h":"36px","--btn-pad":"7px 16px",
    "--sidebar-w":"0px","--props-w":"270px","--node-pad":"10px 12px",
    "--node-body-pad":"8px 12px 10px","--node-border-w":"1px",
    "--shadow-node":"0 0 0 1px rgba(255,45,120,0.4),0 0 20px rgba(255,45,120,0.2)",
    "--shadow-node-sel":"0 0 0 1px #ff2d78,0 0 30px rgba(255,45,120,0.7)",
    "--transition-all":"all 0.08s",
    "--topbar-bg":"rgba(2,0,10,0.95)","--topbar-border":"1px solid rgba(255,45,120,0.5)","--topbar-blur":"none",
    "--sidebar-bg":"#02000a","--sidebar-border":"1px solid rgba(0,245,255,0.2)",
  },
  bodyClass: "skin-neon-tokyo",
  css: `body.skin-neon-tokyo{background:#02000a;background-image:radial-gradient(ellipse 100% 80% at 50% 0%,rgba(255,45,120,0.08) 0%,transparent 50%);background-attachment:fixed}
body.skin-neon-tokyo::before{content:'';position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9997;background:repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)}
body.skin-neon-tokyo button{text-transform:uppercase!important;letter-spacing:0.1em!important}
body.skin-neon-tokyo button:not([disabled]):hover{color:#ff2d78!important;border-color:#ff2d78!important;box-shadow:0 0 12px rgba(255,45,120,0.5)!important;text-shadow:0 0 8px rgba(255,45,120,0.8)!important}
body.skin-neon-tokyo input:focus,body.skin-neon-tokyo select:focus{border-color:#00f5ff!important;box-shadow:0 0 0 1px #00f5ff,0 0 16px rgba(0,245,255,0.3)!important}
body.skin-neon-tokyo ::-webkit-scrollbar{width:4px}
body.skin-neon-tokyo ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff2d78,#00f5ff);border-radius:2px}`,
},

// ──────────────────────────────────────────────────────────────
// NEUMORPHIC — soft clay 3D, left icon dock
// ──────────────────────────────────────────────────────────────
neumorphic: {
  name: "Neumorphic",  icon: "⬜",
  concept: "Everything is sculpted from a single material. Push it. Press it. Feel it.",
  nav: "icon-dock",
  palette: ["#dde4ef","#e8edf5","#5b8dee","#27ae60","#e74c3c"],
  vars: {
    "--bg":"#dde4ef","--bg2":"#e8edf5","--bg3":"#d0d8e8",
    "--border":"#c8d0e0","--border2":"#d4dcea",
    "--text":"#2d3a4e","--text2":"#3d4f68","--text3":"#7888a0","--text4":"#a8b8cc",
    "--accent":"#5b8dee","--accent2":"#2563eb","--success":"#27ae60","--danger":"#e74c3c",
    "--canvas-dot":"#c8d0e0","--node-bg":"#e8edf5","--shadow":"rgba(0,0,0,0.12)",
    "--font-ui":"'Nunito','Poppins',system-ui,sans-serif",
    "--font-node":"'Nunito',system-ui,sans-serif",
    "--font-weight-ui":"700","--font-weight-node":"600",
    "--letter-space":"0em","--line-height":"1.65",
    "--radius-xs":"10px","--radius-sm":"14px","--radius-md":"20px","--radius-lg":"28px",
    "--radius-node":"20px","--radius-btn":"14px",
    "--topbar-h":"0px","--node-header-h":"44px","--btn-pad":"9px 20px",
    "--sidebar-w":"0px","--props-w":"290px","--node-pad":"14px 16px",
    "--node-body-pad":"12px 16px 14px","--node-border-w":"0px",
    "--shadow-node":"8px 8px 16px #bec7d8,-8px -8px 16px #f4faff",
    "--shadow-node-sel":"6px 6px 12px #b0bcd0,-6px -6px 12px #f8feff,0 0 0 3px rgba(91,141,238,0.4)",
    "--transition-all":"all 0.15s ease",
    "--topbar-bg":"#e8edf5","--topbar-border":"none","--topbar-blur":"none",
    "--sidebar-bg":"#dde4ef","--sidebar-border":"none",
  },
  bodyClass: "skin-neumorphic",
  css: `body.skin-neumorphic{background:#dde4ef}
body.skin-neumorphic button{background:#e8edf5!important;border:none!important;box-shadow:4px 4px 8px #bec7d8,-4px -4px 8px #f4faff!important;color:#3d4f68!important;font-weight:700!important}
body.skin-neumorphic button:not([disabled]):hover{box-shadow:5px 5px 10px #b8c2d4,-5px -5px 10px #f6fdff!important;transform:translateY(-1px)!important}
body.skin-neumorphic button:not([disabled]):active{box-shadow:inset 4px 4px 8px #bec7d8,inset -4px -4px 8px #f4faff!important;transform:translateY(0)!important}
body.skin-neumorphic input,body.skin-neumorphic select,body.skin-neumorphic textarea{background:#dde4ef!important;border:none!important;box-shadow:inset 4px 4px 8px #bec7d8,inset -4px -4px 8px #f4faff!important}
body.skin-neumorphic input:focus,body.skin-neumorphic select:focus{box-shadow:inset 3px 3px 6px #bec7d8,inset -3px -3px 6px #f4faff,0 0 0 2px rgba(91,141,238,0.4)!important;outline:none!important}
body.skin-neumorphic ::-webkit-scrollbar{width:8px}
body.skin-neumorphic ::-webkit-scrollbar-track{background:#dde4ef;box-shadow:inset 2px 2px 6px #bec7d8;border-radius:4px}
body.skin-neumorphic ::-webkit-scrollbar-thumb{background:#c8d0e0;border-radius:4px}`,
},

// ──────────────────────────────────────────────────────────────
// SAKURA — Japanese minimal, left icon dock
// ──────────────────────────────────────────────────────────────
sakura: {
  name: "Sakura",  icon: "🌸",
  concept: "Ma — the Japanese art of negative space. Beauty lives in what is absent.",
  nav: "icon-dock",
  palette: ["#fef8f9","#ffffff","#e8648a","#1a1a2e","#d4af37"],
  vars: {
    "--bg":"#fef8f9","--bg2":"#ffffff","--bg3":"#fdf0f3",
    "--border":"#f0d0d8","--border2":"#f8e8ec",
    "--text":"#1a1a2e","--text2":"#2d2d42","--text3":"#8878a0","--text4":"#c4b8cc",
    "--accent":"#e8648a","--accent2":"#c0376a","--success":"#2e9e5c","--danger":"#d0324a",
    "--canvas-dot":"#f0d0d8","--node-bg":"#ffffff","--shadow":"rgba(0,0,0,0.06)",
    "--font-ui":"'Cormorant Garamond','Garamond','Georgia',serif",
    "--font-node":"'Cormorant Garamond','Georgia',serif",
    "--font-weight-ui":"500","--font-weight-node":"400",
    "--letter-space":"0.04em","--line-height":"1.8",
    "--radius-xs":"2px","--radius-sm":"4px","--radius-md":"8px","--radius-lg":"12px",
    "--radius-node":"10px","--radius-btn":"4px",
    "--topbar-h":"0px","--node-header-h":"42px","--btn-pad":"8px 20px",
    "--sidebar-w":"0px","--props-w":"290px","--node-pad":"12px 16px",
    "--node-body-pad":"10px 16px 14px","--node-border-w":"1px",
    "--shadow-node":"0 2px 16px rgba(232,100,138,0.08),0 1px 4px rgba(0,0,0,0.06)",
    "--shadow-node-sel":"0 0 0 2px rgba(232,100,138,0.4),0 4px 24px rgba(232,100,138,0.15)",
    "--transition-all":"all 0.22s ease",
    "--topbar-bg":"#ffffff","--topbar-border":"1px solid #f0d0d8","--topbar-blur":"none",
    "--sidebar-bg":"#fef8f9","--sidebar-border":"1px solid #f0d0d8",
  },
  bodyClass: "skin-sakura",
  css: `body.skin-sakura{background:#fef8f9;font-size:15px}
body.skin-sakura button{letter-spacing:0.08em!important;font-size:12px!important;border:1px solid #f0d0d8!important;background:transparent!important;color:#2d2d42!important}
body.skin-sakura button:not([disabled]):hover{border-color:#e8648a!important;color:#e8648a!important;background:rgba(232,100,138,0.05)!important}
body.skin-sakura input,body.skin-sakura select{border:1px solid #f0d0d8!important}
body.skin-sakura input:focus,body.skin-sakura select:focus{border-color:#e8648a!important;box-shadow:0 0 0 2px rgba(232,100,138,0.15)!important;outline:none!important}
body.skin-sakura ::-webkit-scrollbar{width:4px}
body.skin-sakura ::-webkit-scrollbar-thumb{background:#f0d0d8;border-radius:2px}
body.skin-sakura ::-webkit-scrollbar-thumb:hover{background:#e8648a}`,
},

// ──────────────────────────────────────────────────────────────
// VAPOR — vaporwave 80s, editorial full-width no sidebar
// ──────────────────────────────────────────────────────────────
vapor: {
  name: "Vapor",  icon: "🌊",
  concept: "A E S T H E T I C. Lost in the 80s. Palm trees. Grid lines. Infinite sunset.",
  nav: "editorial",
  palette: ["#0d001a","#1a0033","#ff71ce","#01cdfe","#b967ff"],
  vars: {
    "--bg":"#0d001a","--bg2":"#1a0033","--bg3":"#240048",
    "--border":"rgba(255,113,206,0.3)","--border2":"rgba(1,205,254,0.2)",
    "--text":"#ffe4ff","--text2":"#e0b8e8","--text3":"#9870b8","--text4":"#604878",
    "--accent":"#ff71ce","--accent2":"#d4008e","--success":"#01cdfe","--danger":"#ff4444",
    "--canvas-dot":"#240048","--node-bg":"#1a0033","--shadow":"rgba(0,0,0,0.8)",
    "--font-ui":"'VT323','Press Start 2P','Courier New',monospace",
    "--font-node":"'VT323','Courier New',monospace",
    "--font-weight-ui":"400","--font-weight-node":"400",
    "--letter-space":"0.05em","--line-height":"1.5",
    "--radius-xs":"0","--radius-sm":"0","--radius-md":"2px","--radius-lg":"4px",
    "--radius-node":"2px","--radius-btn":"0",
    "--topbar-h":"56px","--node-header-h":"38px","--btn-pad":"8px 20px",
    "--sidebar-w":"0px","--props-w":"268px","--node-pad":"10px 14px",
    "--node-body-pad":"8px 14px 10px","--node-border-w":"2px",
    "--shadow-node":"0 0 0 1px rgba(255,113,206,0.5),0 0 20px rgba(185,103,255,0.3)",
    "--shadow-node-sel":"0 0 0 2px #ff71ce,0 0 40px rgba(255,113,206,0.5)",
    "--transition-all":"all 0.1s",
    "--topbar-bg":"rgba(13,0,26,0.9)","--topbar-border":"1px solid rgba(255,113,206,0.4)","--topbar-blur":"blur(8px)",
    "--sidebar-bg":"#0d001a","--sidebar-border":"1px solid rgba(185,103,255,0.3)",
  },
  bodyClass: "skin-vapor",
  css: `body.skin-vapor{background:#0d001a;background-image:linear-gradient(180deg,#0d001a 0%,#1a0033 40%,rgba(255,113,206,0.05) 100%),repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(1,205,254,0.07) 39px,rgba(1,205,254,0.07) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(185,103,255,0.07) 39px,rgba(185,103,255,0.07) 40px);background-attachment:fixed}
body.skin-vapor .nn-topbar{box-shadow:0 0 0 1px rgba(255,113,206,0.3),0 4px 30px rgba(185,103,255,0.2)!important}
body.skin-vapor .nn-topbar::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff71ce,#b967ff,#01cdfe,#b967ff,#ff71ce);box-shadow:0 0 12px #ff71ce,0 0 24px #b967ff}
body.skin-vapor button{text-transform:uppercase!important;letter-spacing:0.15em!important;font-size:11px!important;border:1px solid rgba(255,113,206,0.5)!important}
body.skin-vapor button:not([disabled]):hover{background:rgba(255,113,206,0.15)!important;box-shadow:0 0 12px rgba(255,113,206,0.4),inset 0 0 12px rgba(185,103,255,0.1)!important;color:#ff71ce!important;text-shadow:0 0 8px rgba(255,113,206,0.8)!important}
body.skin-vapor input:focus,body.skin-vapor select:focus{border-color:#01cdfe!important;box-shadow:0 0 0 1px #01cdfe,0 0 12px rgba(1,205,254,0.3)!important}
body.skin-vapor ::-webkit-scrollbar{width:4px}
body.skin-vapor ::-webkit-scrollbar-thumb{background:linear-gradient(#ff71ce,#b967ff);border-radius:0}`,
},

// ──────────────────────────────────────────────────────────────
// NEWSPAPER — editorial print, full-width top nav
// ──────────────────────────────────────────────────────────────
newspaper: {
  name: "Newspaper",  icon: "📰",
  concept: "All the news fit to diagram. Playfair Display meets The New York Times.",
  nav: "editorial",
  palette: ["#fafaf8","#ffffff","#1a1a1a","#c41e3a","#2c5f8a"],
  vars: {
    "--bg":"#fafaf8","--bg2":"#ffffff","--bg3":"#f4f3ef",
    "--border":"#d4d2cc","--border2":"#e8e6e0",
    "--text":"#1a1a1a","--text2":"#2d2d2d","--text3":"#666","--text4":"#999",
    "--accent":"#c41e3a","--accent2":"#9b1530","--success":"#1a5e2a","--danger":"#c41e3a",
    "--canvas-dot":"#d4d2cc","--node-bg":"#ffffff","--shadow":"rgba(0,0,0,0.08)",
    "--font-ui":"'Playfair Display','Georgia',serif",
    "--font-node":"'Playfair Display','Georgia',serif",
    "--font-weight-ui":"700","--font-weight-node":"400",
    "--letter-space":"0.02em","--line-height":"1.7",
    "--radius-xs":"0","--radius-sm":"0","--radius-md":"2px","--radius-lg":"4px",
    "--radius-node":"0","--radius-btn":"2px",
    "--topbar-h":"64px","--node-header-h":"44px","--btn-pad":"8px 18px",
    "--sidebar-w":"0px","--props-w":"290px","--node-pad":"12px 14px",
    "--node-body-pad":"10px 14px 12px","--node-border-w":"1px",
    "--shadow-node":"0 1px 4px rgba(0,0,0,0.1),0 2px 0 rgba(196,30,58,0.3)",
    "--shadow-node-sel":"0 0 0 2px rgba(196,30,58,0.5),0 4px 20px rgba(0,0,0,0.12)",
    "--transition-all":"all 0.18s ease",
    "--topbar-bg":"#1a1a1a","--topbar-border":"none","--topbar-blur":"none",
    "--sidebar-bg":"#f4f3ef","--sidebar-border":"1px solid #d4d2cc",
  },
  bodyClass: "skin-newspaper",
  css: `body.skin-newspaper{background:#fafaf8}
body.skin-newspaper .nn-topbar{box-shadow:0 3px 0 #c41e3a!important}
body.skin-newspaper button{font-family:'Playfair Display','Georgia',serif!important;font-style:italic!important;border:1px solid currentColor!important;background:transparent!important;color:#1a1a1a!important}
body.skin-newspaper button:not([disabled]):hover{background:#1a1a1a!important;color:#fafaf8!important}
body.skin-newspaper input,body.skin-newspaper select{font-family:'Playfair Display',serif!important;border:1px solid #d4d2cc!important;border-top:2px solid #1a1a1a!important;background:#fff!important;border-radius:0!important}
body.skin-newspaper input:focus,body.skin-newspaper select:focus{border-top-color:#c41e3a!important;box-shadow:none!important;outline:none!important}
body.skin-newspaper ::-webkit-scrollbar{width:6px}
body.skin-newspaper ::-webkit-scrollbar-track{background:#f4f3ef;border-left:1px solid #d4d2cc}
body.skin-newspaper ::-webkit-scrollbar-thumb{background:#c41e3a}`,
},

// ──────────────────────────────────────────────────────────────
// CORAL — vibrant tropical, bottom nav
// ──────────────────────────────────────────────────────────────
coral: {
  name: "Coral",  icon: "🪸",
  concept: "Miami heat. Warm coral, electric cyan, deep ocean navy. Fun and alive.",
  nav: "bottom",
  palette: ["#0a1628","#112240","#ff6b6b","#00d4aa","#ffd93d"],
  vars: {
    "--bg":"#0a1628","--bg2":"#112240","--bg3":"#1a3055",
    "--border":"rgba(255,107,107,0.25)","--border2":"rgba(0,212,170,0.15)",
    "--text":"#f0f8ff","--text2":"#c8ddf0","--text3":"#7090b0","--text4":"#405870",
    "--accent":"#ff6b6b","--accent2":"#e63535","--success":"#00d4aa","--danger":"#ff4757",
    "--canvas-dot":"#1a3055","--node-bg":"#112240","--shadow":"rgba(0,0,0,0.6)",
    "--font-ui":"'DM Sans','Inter',system-ui,sans-serif",
    "--font-node":"'DM Sans',system-ui,sans-serif",
    "--font-weight-ui":"600","--font-weight-node":"500",
    "--letter-space":"-0.01em","--line-height":"1.55",
    "--radius-xs":"8px","--radius-sm":"12px","--radius-md":"16px","--radius-lg":"24px",
    "--radius-node":"16px","--radius-btn":"20px",
    "--topbar-h":"0px","--node-header-h":"42px","--btn-pad":"10px 22px",
    "--sidebar-w":"0px","--props-w":"280px","--node-pad":"12px 14px",
    "--node-body-pad":"10px 14px 12px","--node-border-w":"1px",
    "--shadow-node":"0 4px 24px rgba(255,107,107,0.15),0 2px 8px rgba(0,0,0,0.4)",
    "--shadow-node-sel":"0 0 0 2px rgba(255,107,107,0.6),0 8px 32px rgba(255,107,107,0.25)",
    "--transition-all":"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
    "--topbar-bg":"rgba(10,22,40,0.9)","--topbar-border":"1px solid rgba(255,107,107,0.3)","--topbar-blur":"blur(16px)",
    "--sidebar-bg":"#112240","--sidebar-border":"1px solid rgba(255,107,107,0.2)",
  },
  bodyClass: "skin-coral",
  css: `body.skin-coral{background:#0a1628}
body.skin-coral button:not([disabled]):hover{box-shadow:0 4px 16px rgba(255,107,107,0.4)!important;transform:translateY(-2px)!important}
body.skin-coral button:active{transform:translateY(0)!important}
body.skin-coral input:focus,body.skin-coral select:focus{border-color:rgba(255,107,107,0.6)!important;box-shadow:0 0 0 3px rgba(255,107,107,0.2)!important;outline:none!important}
body.skin-coral ::-webkit-scrollbar{width:6px}
body.skin-coral ::-webkit-scrollbar-thumb{background:rgba(255,107,107,0.4);border-radius:3px}`,
},

// ──────────────────────────────────────────────────────────────
// CARBON — industrial precision, icon dock
// ──────────────────────────────────────────────────────────────
carbon: {
  name: "Carbon",  icon: "⚙",
  concept: "Forged, not designed. Carbon fiber texture, amber precision, zero tolerance.",
  nav: "icon-dock",
  palette: ["#0c0c0c","#141414","#ff8c00","#00c8ff","#ff2244"],
  vars: {
    "--bg":"#0c0c0c","--bg2":"#141414","--bg3":"#1c1c1c",
    "--border":"#2a2a2a","--border2":"#1e1e1e",
    "--text":"#f5f5f5","--text2":"#d0d0d0","--text3":"#888","--text4":"#444",
    "--accent":"#ff8c00","--accent2":"#cc7000","--success":"#00c8a0","--danger":"#ff2244",
    "--canvas-dot":"#1c1c1c","--node-bg":"#141414","--shadow":"rgba(0,0,0,0.8)",
    "--font-ui":"'IBM Plex Mono','JetBrains Mono',monospace",
    "--font-node":"'IBM Plex Mono',monospace",
    "--font-weight-ui":"500","--font-weight-node":"400",
    "--letter-space":"0.04em","--line-height":"1.45",
    "--radius-xs":"2px","--radius-sm":"4px","--radius-md":"6px","--radius-lg":"8px",
    "--radius-node":"6px","--radius-btn":"4px",
    "--topbar-h":"0px","--node-header-h":"36px","--btn-pad":"7px 14px",
    "--sidebar-w":"0px","--props-w":"268px","--node-pad":"10px 12px",
    "--node-body-pad":"8px 12px 10px","--node-border-w":"1px",
    "--shadow-node":"0 2px 8px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,140,0,0.1)",
    "--shadow-node-sel":"0 0 0 1px #ff8c00,0 4px 20px rgba(255,140,0,0.3)",
    "--transition-all":"all 0.1s",
    "--topbar-bg":"#0c0c0c","--topbar-border":"1px solid rgba(255,140,0,0.3)","--topbar-blur":"none",
    "--sidebar-bg":"#0c0c0c","--sidebar-border":"1px solid #2a2a2a",
  },
  bodyClass: "skin-carbon",
  css: `body.skin-carbon{background:#0c0c0c;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 4px);background-attachment:fixed}
body.skin-carbon button{letter-spacing:0.06em!important;text-transform:uppercase!important;font-size:10px!important;border:1px solid #2a2a2a!important}
body.skin-carbon button:not([disabled]):hover{border-color:#ff8c00!important;color:#ff8c00!important;box-shadow:0 0 8px rgba(255,140,0,0.3)!important}
body.skin-carbon input,body.skin-carbon select{background:#0c0c0c!important;border:1px solid #2a2a2a!important}
body.skin-carbon input:focus,body.skin-carbon select:focus{border-color:#ff8c00!important;box-shadow:0 0 0 1px rgba(255,140,0,0.3)!important;outline:none!important}
body.skin-carbon ::-webkit-scrollbar{width:5px}
body.skin-carbon ::-webkit-scrollbar-track{background:#0c0c0c}
body.skin-carbon ::-webkit-scrollbar-thumb{background:#ff8c00;border-radius:1px}`,
},

// ──────────────────────────────────────────────────────────────
// PASTEL POP — kawaii fun, bottom nav  
// ──────────────────────────────────────────────────────────────
pastelPop: {
  name: "Pastel Pop",  icon: "🍬",
  concept: "Pure joy in pixels. Soft gradients, bouncy animations, every click is a delight.",
  nav: "bottom",
  palette: ["#fff0f8","#fce4ff","#ff6eb4","#7eb8ff","#ffd166"],
  vars: {
    "--bg":"#fff0f8","--bg2":"#fce4ff","--bg3":"#f8d4f4",
    "--border":"rgba(255,110,180,0.3)","--border2":"rgba(126,184,255,0.2)",
    "--text":"#3d2050","--text2":"#5d3570","--text3":"#9878b0","--text4":"#c8b0d8",
    "--accent":"#ff6eb4","--accent2":"#d4008e","--success":"#58cc82","--danger":"#ff5454",
    "--canvas-dot":"#f8d4f4","--node-bg":"#fce4ff","--shadow":"rgba(180,80,180,0.1)",
    "--font-ui":"'Nunito','Poppins',system-ui,sans-serif",
    "--font-node":"'Nunito',system-ui,sans-serif",
    "--font-weight-ui":"800","--font-weight-node":"700",
    "--letter-space":"0em","--line-height":"1.7",
    "--radius-xs":"12px","--radius-sm":"16px","--radius-md":"22px","--radius-lg":"32px",
    "--radius-node":"22px","--radius-btn":"24px",
    "--topbar-h":"0px","--node-header-h":"48px","--btn-pad":"10px 22px",
    "--sidebar-w":"0px","--props-w":"290px","--node-pad":"14px 16px",
    "--node-body-pad":"12px 16px 16px","--node-border-w":"2px",
    "--shadow-node":"0 4px 20px rgba(255,110,180,0.15),0 2px 8px rgba(0,0,0,0.06)",
    "--shadow-node-sel":"0 0 0 3px rgba(255,110,180,0.5),0 8px 32px rgba(255,110,180,0.2)",
    "--transition-all":"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    "--topbar-bg":"rgba(252,228,255,0.9)","--topbar-border":"1px solid rgba(255,110,180,0.2)","--topbar-blur":"blur(16px)",
    "--sidebar-bg":"#fce4ff","--sidebar-border":"1px solid rgba(255,110,180,0.2)",
  },
  bodyClass: "skin-pastel-pop",
  css: `body.skin-pastel-pop{background:linear-gradient(135deg,#fff0f8 0%,#f0f0ff 50%,#fff8f0 100%);background-attachment:fixed}
body.skin-pastel-pop button{font-weight:800!important;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1)!important}
body.skin-pastel-pop button:not([disabled]):hover{transform:translateY(-3px) scale(1.02)!important;box-shadow:0 8px 20px rgba(255,110,180,0.3)!important}
body.skin-pastel-pop button:active{transform:scale(0.96)!important}
body.skin-pastel-pop input,body.skin-pastel-pop select{border:2px solid rgba(255,110,180,0.3)!important;background:rgba(255,255,255,0.8)!important}
body.skin-pastel-pop input:focus,body.skin-pastel-pop select:focus{border-color:#ff6eb4!important;box-shadow:0 0 0 3px rgba(255,110,180,0.2)!important;outline:none!important}
body.skin-pastel-pop ::-webkit-scrollbar{width:8px}
body.skin-pastel-pop ::-webkit-scrollbar-track{background:rgba(252,228,255,0.5);border-radius:4px}
body.skin-pastel-pop ::-webkit-scrollbar-thumb{background:linear-gradient(#ff6eb4,#7eb8ff);border-radius:4px}`,
},

};

export const SKIN_KEYS = Object.keys(SKINS);
