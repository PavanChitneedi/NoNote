// SKINS = personality: font + radius + shadow + effects + nav layout
// Skins do NOT set colors (Theme) or spacing (Design) — those stay independent
// Each skin has: defaultTheme, defaultDesign, accentOptions (curated accents for this skin)

export const SKINS = {

  obsidian: {
    name:"Obsidian", icon:"⬡", nav:"top",
    concept:"The developer's workshop. Dense, precise, monospaced. GitHub meets VS Code.",
    tags:["Technical","Monospace"],
    defaultTheme:"dark",
    defaultAccent:{accent:"#ff6b6b",accent2:"#e53535"},
    defaultAccent:{accent:"#ffe600",accent2:"#ccb800"},
    defaultAccent:{accent:"#58a6ff",accent2:"#1f6feb"}, defaultDesign:"workspace",
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
body.skin-obsidian ::-webkit-scrollbar-thumb:hover{background:var(--text4)}`,
  },

  aurora: {
    name:"Aurora", icon:"🌌", nav:"top",
    concept:"Frosted glass panels float over deep animated gradients. Everything breathes.",
    tags:["Glass","Blur","Rounded"],
    defaultTheme:"midnight",
    defaultAccent:{accent:"#a78bfa",accent2:"#7c3aed"}, defaultDesign:"clean",
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
body.skin-aurora ::-webkit-scrollbar{width:5px}
body.skin-aurora ::-webkit-scrollbar-thumb{background:var(--accent)44;border-radius:6px}`,
  },

  brutalist: {
    name:"Brutalist", icon:"🏗", nav:"bottom",
    concept:"Raw concrete. Thick borders, hard offset shadows. Design as confrontation.",
    tags:["Bold","Angular","Statement"],
    defaultTheme:"dark", defaultDesign:"professional",
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
    css:`body.skin-brutalist button{text-transform:uppercase!important;letter-spacing:0.06em!important;font-weight:700!important;border:2px solid currentColor!important}
body.skin-brutalist button:not([disabled]):hover{background:var(--accent)!important;color:var(--bg)!important;box-shadow:4px 4px 0 var(--accent)66!important;transform:translate(-2px,-2px)!important}
body.skin-brutalist button:active{transform:translate(2px,2px)!important;box-shadow:none!important}
body.skin-brutalist input,body.skin-brutalist select{border:2px solid var(--border)!important;border-radius:0!important}
body.skin-brutalist input:focus,body.skin-brutalist select:focus{border-color:var(--accent)!important;box-shadow:4px 4px 0 var(--accent)!important;outline:none}
body.skin-brutalist ::-webkit-scrollbar{width:8px}
body.skin-brutalist ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:0}`,
  },

  neonTokyo: {
    name:"Neon Tokyo", icon:"⚡", nav:"bottom",
    concept:"Rain on neon-soaked streets. Everything glows. Every click is electric.",
    tags:["Neon","Glow","Cyberpunk"],
    defaultTheme:"ocean",
    defaultAccent:{accent:"#ff2d78",accent2:"#cc0050"}, defaultDesign:"workspace",
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
    css:`body.skin-neon-tokyo::before{content:'';position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9997;background:repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)}
body.skin-neon-tokyo .nn-topbar{position:relative}
body.skin-neon-tokyo .nn-topbar::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--accent),var(--accent2),var(--accent),transparent);box-shadow:0 0 12px var(--accent)}
body.skin-neon-tokyo button{text-transform:uppercase!important;letter-spacing:0.1em!important}
body.skin-neon-tokyo button:not([disabled]):hover{color:var(--accent)!important;border-color:var(--accent)!important;box-shadow:0 0 12px var(--accent)55!important;text-shadow:0 0 8px var(--accent)!important}
body.skin-neon-tokyo input:focus,body.skin-neon-tokyo select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 1px var(--accent),0 0 16px var(--accent)44!important;outline:none}
body.skin-neon-tokyo ::-webkit-scrollbar{width:4px}
body.skin-neon-tokyo ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}`,
  },

  neumorphic: {
    name:"Neumorphic", icon:"⬜", nav:"icon-dock",
    concept:"Soft clay. Elements pushed out of or pressed into a single material.",
    tags:["3D","Tactile","Soft"],
    defaultTheme:"clay",
    defaultAccent:{accent:"#5b8dee",accent2:"#2563eb"}, defaultDesign:"comfort",
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
      "--radius-xs":"10px","--radius-sm":"14px","--radius-md":"20px","--radius-lg":"28px",
      "--radius-node":"20px","--radius-btn":"14px",
      "--shadow-node":"8px 8px 16px var(--neu-dark,#bec7d8),-8px -8px 16px var(--neu-light,#f4faff)",
      "--shadow-node-sel":"6px 6px 12px var(--neu-dark,#bec7d8),-6px -6px 12px var(--neu-light,#f4faff),0 0 0 3px var(--accent)44",
      "--transition-all":"all 0.15s ease",
      "--topbar-bg":"var(--bg2)","--topbar-border":"none","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"none",
    },
    bodyClass:"skin-neumorphic",
    css:`body.skin-neumorphic{background:var(--bg)}
body.skin-neumorphic .nn-topbar{box-shadow:0 4px 12px var(--neu-dark,#bec7d8),0 -1px 0 var(--neu-light,#f4faff)!important;border-bottom:none!important}
body.skin-neumorphic .nn-sidebar{box-shadow:4px 0 12px var(--neu-dark,#bec7d8)!important;border-right:none!important}
body.skin-neumorphic button{background:var(--bg2)!important;border:none!important;box-shadow:4px 4px 8px var(--neu-dark,#bec7d8),-4px -4px 8px var(--neu-light,#f4faff)!important;color:var(--text2)!important;font-weight:700!important;transition:all 0.15s ease!important}
body.skin-neumorphic button:not([disabled]):hover{box-shadow:5px 5px 10px var(--neu-dark,#bec7d8),-5px -5px 10px var(--neu-light,#f4faff)!important;transform:translateY(-1px)!important}
body.skin-neumorphic button:not([disabled]):active{box-shadow:inset 4px 4px 8px var(--neu-dark,#bec7d8),inset -4px -4px 8px var(--neu-light,#f4faff)!important;transform:translateY(0)!important}
body.skin-neumorphic input,body.skin-neumorphic select,body.skin-neumorphic textarea{background:var(--bg)!important;border:none!important;box-shadow:inset 3px 3px 6px var(--neu-dark,#bec7d8),inset -3px -3px 6px var(--neu-light,#f4faff)!important}
body.skin-neumorphic input:focus,body.skin-neumorphic select:focus{box-shadow:inset 3px 3px 6px var(--neu-dark,#bec7d8),inset -3px -3px 6px var(--neu-light,#f4faff),0 0 0 2px var(--accent)44!important;outline:none}
body.skin-neumorphic ::-webkit-scrollbar{width:8px}
body.skin-neumorphic ::-webkit-scrollbar-track{background:var(--bg);box-shadow:inset 2px 2px 6px var(--neu-dark,#bec7d8);border-radius:4px}
body.skin-neumorphic ::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;box-shadow:2px 2px 4px var(--neu-dark,#bec7d8)}`,
  },

  sakura: {
    name:"Sakura", icon:"🌸", nav:"icon-dock",
    concept:"Ma — the art of negative space. Beauty in what is absent.",
    tags:["Elegant","Serif","Minimal"],
    defaultTheme:"cream",
    defaultAccent:{accent:"#e8648a",accent2:"#c0376a"}, defaultDesign:"clean",
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
    css:`body.skin-sakura{font-size:15px}
body.skin-sakura button{font-size:12px!important;border:1px solid var(--border)!important;background:transparent!important;color:var(--text2)!important}
body.skin-sakura button:not([disabled]):hover{border-color:var(--accent)!important;color:var(--accent)!important;background:var(--accent)06!important}
body.skin-sakura input,body.skin-sakura select{border:1px solid var(--border)!important}
body.skin-sakura input:focus,body.skin-sakura select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 2px var(--accent)20!important;outline:none}
body.skin-sakura ::-webkit-scrollbar{width:4px}
body.skin-sakura ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
body.skin-sakura ::-webkit-scrollbar-thumb:hover{background:var(--accent)}`,
  },

  vapor: {
    name:"Vapor", icon:"🌊", nav:"editorial",
    concept:"A E S T H E T I C. Grid lines. Infinite sunset. Lost in the 80s.",
    tags:["Retro","Grid","Pixel"],
    defaultTheme:"violet",
    defaultAccent:{accent:"#ff71ce",accent2:"#d4008e"}, defaultDesign:"workspace",
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
      "--topbar-bg":"var(--bg)","--topbar-border":"1px solid var(--accent)44","--topbar-blur":"blur(8px)",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-vapor",
    css:`body.skin-vapor{background-image:repeating-linear-gradient(0deg,transparent,transparent 39px,var(--border2) 39px,var(--border2) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,var(--border2) 39px,var(--border2) 40px);background-attachment:fixed}
body.skin-vapor .nn-topbar{position:relative}
body.skin-vapor .nn-topbar::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--accent),var(--accent2),var(--accent),transparent);box-shadow:0 0 12px var(--accent)}
body.skin-vapor button{text-transform:uppercase!important;letter-spacing:0.15em!important;font-size:11px!important;border:1px solid var(--accent)55!important}
body.skin-vapor button:not([disabled]):hover{background:var(--accent)15!important;box-shadow:0 0 12px var(--accent)44!important;color:var(--accent)!important}
body.skin-vapor ::-webkit-scrollbar{width:4px}
body.skin-vapor ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:0}`,
  },

  newspaper: {
    name:"Newspaper", icon:"📰", nav:"editorial",
    concept:"All the news fit to diagram. Playfair Display editorial clarity.",
    tags:["Print","Serif","Editorial"],
    defaultTheme:"parchment",
    defaultAccent:{accent:"#c41e3a",accent2:"#9b1530"}, defaultDesign:"professional",
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
body.skin-newspaper .nn-topbar *{color:#fff!important}
body.skin-newspaper button{font-style:italic!important;border:1px solid currentColor!important;background:transparent!important}
body.skin-newspaper button:not([disabled]):hover{background:var(--text)!important;color:var(--bg)!important}
body.skin-newspaper input,body.skin-newspaper select{border:1px solid var(--border)!important;border-top:2px solid var(--text)!important;border-radius:0!important}
body.skin-newspaper input:focus,body.skin-newspaper select:focus{border-top-color:var(--accent)!important;box-shadow:none!important;outline:none}
body.skin-newspaper ::-webkit-scrollbar{width:6px}
body.skin-newspaper ::-webkit-scrollbar-thumb{background:var(--accent)}`,
  },

  coral: {
    name:"Coral", icon:"🪸", nav:"bottom",
    concept:"Miami heat. Fun, bouncy, warm, alive. Every interaction feels good.",
    tags:["Vibrant","Bouncy","Warm"],
    defaultTheme:"dark", defaultDesign:"comfort",
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
body.skin-coral input:focus,body.skin-coral select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent)22!important;outline:none}
body.skin-coral ::-webkit-scrollbar{width:6px}
body.skin-coral ::-webkit-scrollbar-thumb{background:var(--accent)55;border-radius:3px}`,
  },

  carbon: {
    name:"Carbon", icon:"⚙", nav:"icon-dock",
    concept:"Forged, not designed. Carbon fiber, precision instruments, zero tolerance.",
    tags:["Industrial","Dense","Precise"],
    defaultTheme:"amber",
    defaultAccent:{accent:"#f0a830",accent2:"#c88020"}, defaultDesign:"workspace",
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
    css:`body.skin-carbon{background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 4px);background-attachment:fixed}
body.skin-carbon button{text-transform:uppercase!important;letter-spacing:0.06em!important;font-size:10px!important;border:1px solid var(--border)!important}
body.skin-carbon button:not([disabled]):hover{border-color:var(--accent)!important;color:var(--accent)!important;box-shadow:0 0 8px var(--accent)33!important}
body.skin-carbon ::-webkit-scrollbar{width:5px}
body.skin-carbon ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:1px}`,
  },

  pastelPop: {
    name:"Pastel Pop", icon:"🍬", nav:"bottom",
    concept:"Pure joy. Bouncy, soft, every interaction is a little celebration.",
    tags:["Fun","Rounded","Playful"],
    defaultTheme:"rose",
    defaultAccent:{accent:"#ff6eb4",accent2:"#d4008e"}, defaultDesign:"comfort",
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
      "--radius-xs":"12px","--radius-sm":"16px","--radius-md":"22px","--radius-lg":"32px",
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
body.skin-pastel-pop ::-webkit-scrollbar{width:8px}
body.skin-pastel-pop ::-webkit-scrollbar-thumb{background:var(--accent)55;border-radius:4px}`,
  },
};

export const SKIN_KEYS = Object.keys(SKINS);
