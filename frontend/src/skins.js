// SKINS = personality: font + radius + shadow + effects + nav layout
// Skins do NOT set colors (Theme) or spacing (Design) -- those stay independent

export const SKINS = {

  obsidian: {
    name:"Obsidian", icon:"⬡", nav:"top",
    concept:"The developer's workshop. Dense, precise, monospaced. GitHub meets VS Code.",
    tags:["Technical","Monospace"],
    defaultTheme:"dark",
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
/* Fix: use inset box-shadow for accent stripe -- avoids arc on 24px radius corners */
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
/* LLMChat panel -- neon border */
body.skin-neon-tokyo [style*="border-left: 1px solid var(--border)"] { border-left: 1px solid var(--accent)44 !important; }`,
  },

  sakura: {
    name:"Sakura", icon:"🌸", nav:"icon-dock",
    concept:"Ma -- the art of negative space. Beauty in what is absent.",
    tags:["Elegant","Serif","Minimal"],
    defaultTheme:"cream",
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
    css:`/* No global font-size override -- avoids overflow in badges/tabs */
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
/* Fix: don't force tiny font-size on icon-dock nav buttons -- breaks emoji icons */
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

  neumorphic: {
    name:"Neumorphic", icon:"o", nav:"top",
    concept:"Soft clay surfaces. Elements emerge from or sink into the same single material. Depth without colour.",
    tags:["Soft","3D","Minimal"],
    defaultTheme:"clay",
    vars:{
      "--font-ui":"'DM Sans','Inter',system-ui,sans-serif",
      "--font-node":"'DM Sans',system-ui,sans-serif",
      "--font-weight-ui":"500","--font-weight-node":"400",
      "--letter-space":"-0.01em","--line-height":"1.55",
      "--radius-xs":"8px","--radius-sm":"12px","--radius-md":"16px","--radius-lg":"20px",
      "--radius-node":"14px","--radius-btn":"10px",
      "--shadow-node":"var(--nEl)","--shadow-node-sel":"var(--nEm),0 0 0 2px var(--accent)66",
      "--transition-all":"all 0.18s ease",
      "--topbar-bg":"var(--bg)","--topbar-border":"none","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"none",
      "--sidebar-w":"68px",
    },
    bodyClass:"skin-neumorphic",
    css:`
/* =======================================================================
   NEUMORPHIC SKIN -- Three-group shadow calibration
   GROUP A  Mid-tone (clay, sepia): both shadow + highlight visible.
            oklch color-mix preserves theme hue. Classic dual-shadow.
   GROUP B  Near-white (light/cream/parchment/rose/softblue/mint):
            highlight invisible (bg~white, contrast~0.02).
            Force --neu-h:#fff, lean on shadow side.
   GROUP C  Near-black (dark/midnight/forest/ocean/amber/violet):
            color-mix shadow invisible (contrast~0.006).
            Use rgba() absolutes: shadow rgba(0,0,0,0.65),
            highlight rgba(255,255,255,0.12) -- always visible on dark.
            DO NOT override --node-bg; nodes use theme's elevated surface.
======================================================================= */

/* -- GROUP A: MID-TONE BASE (clay, sepia) ------------------------------ */
body.skin-neumorphic{
  --neu-s:color-mix(in oklch,var(--bg) 72%,#000);
  --neu-h:color-mix(in oklch,var(--bg) 30%,#fff);
  --nEl: 8px  8px 20px var(--neu-s), -8px  -8px 20px var(--neu-h);
  --nEm: 5px  5px 13px var(--neu-s), -5px  -5px 13px var(--neu-h);
  --nEs: 3px  3px  8px var(--neu-s), -3px  -3px  8px var(--neu-h);
  --nEx: 2px  2px  5px var(--neu-s), -2px  -2px  5px var(--neu-h);
  --nIl: inset  6px  6px 16px var(--neu-s), inset -6px -6px 16px var(--neu-h);
  --nIm: inset  4px  4px 10px var(--neu-s), inset -4px -4px 10px var(--neu-h);
  --nIs: inset  3px  3px  7px var(--neu-s), inset -3px -3px  7px var(--neu-h);
  --nIx: inset  2px  2px  4px var(--neu-s), inset -2px -2px  4px var(--neu-h);
}

/* -- GROUP B: NEAR-WHITE -- shadow does the heavy lifting -------------- */
body.skin-neumorphic[data-theme="light"],
body.skin-neumorphic[data-theme="cream"],
body.skin-neumorphic[data-theme="parchment"],
body.skin-neumorphic[data-theme="rose"],
body.skin-neumorphic[data-theme="softblue"],
body.skin-neumorphic[data-theme="mint"]{
  --neu-s:color-mix(in oklch,var(--bg) 74%,#000);
  --neu-h:#fff;
  --nEl: 9px  9px 22px var(--neu-s), -7px  -7px 14px var(--neu-h);
  --nEm: 5px  5px 14px var(--neu-s), -4px  -4px  9px var(--neu-h);
  --nEs: 3px  3px  9px var(--neu-s), -2px  -2px  5px var(--neu-h);
  --nEx: 2px  2px  5px var(--neu-s), -1px  -1px  3px var(--neu-h);
  --nIl: inset  7px  7px 18px var(--neu-s), inset -4px -4px 10px var(--neu-h);
  --nIm: inset  4px  4px 11px var(--neu-s), inset -3px -3px  6px var(--neu-h);
  --nIs: inset  3px  3px  8px var(--neu-s), inset -2px -2px  4px var(--neu-h);
  --nIx: inset  2px  2px  5px var(--neu-s), inset -1px -1px  3px var(--neu-h);
}

/* -- GROUP C: NEAR-BLACK -- rgba absolutes, highlight-dominant --------- */
body.skin-neumorphic[data-theme="dark"],
body.skin-neumorphic[data-theme="midnight"],
body.skin-neumorphic[data-theme="forest"],
body.skin-neumorphic[data-theme="ocean"],
body.skin-neumorphic[data-theme="amber"],
body.skin-neumorphic[data-theme="violet"]{
  --neu-s: rgba(0,0,0,0.65);
  --neu-h: rgba(255,255,255,0.12);
  --nEl:  8px  8px 22px var(--neu-s), -10px -10px 26px var(--neu-h);
  --nEm:  5px  5px 14px var(--neu-s),  -6px  -6px 16px var(--neu-h);
  --nEs:  3px  3px  9px var(--neu-s),  -4px  -4px 10px var(--neu-h);
  --nEx:  2px  2px  5px var(--neu-s),  -3px  -3px  6px var(--neu-h);
  --nIl:  inset  6px  6px 18px var(--neu-s), inset -8px -8px 20px var(--neu-h);
  --nIm:  inset  4px  4px 11px var(--neu-s), inset -5px -5px 13px var(--neu-h);
  --nIs:  inset  3px  3px  8px var(--neu-s), inset -4px -4px  9px var(--neu-h);
  --nIx:  inset  2px  2px  5px var(--neu-s), inset -2px -2px  6px var(--neu-h);
}

/* -- GLOBAL RESETS ----------------------------------------------------- */
body.skin-neumorphic *{border-color:transparent!important}
body.skin-neumorphic .nn-topbar,
body.skin-neumorphic .nn-sidebar{border:none!important}

/* -- SURFACE ------------------------------------------------------------ */
body.skin-neumorphic .nn-topbar,
body.skin-neumorphic .nn-sidebar{background:var(--bg)!important}
body.skin-neumorphic[data-theme="dark"] .nn-topbar,
body.skin-neumorphic[data-theme="dark"] .nn-sidebar,
body.skin-neumorphic[data-theme="midnight"] .nn-topbar,
body.skin-neumorphic[data-theme="midnight"] .nn-sidebar,
body.skin-neumorphic[data-theme="forest"] .nn-topbar,
body.skin-neumorphic[data-theme="forest"] .nn-sidebar,
body.skin-neumorphic[data-theme="ocean"] .nn-topbar,
body.skin-neumorphic[data-theme="ocean"] .nn-sidebar,
body.skin-neumorphic[data-theme="amber"] .nn-topbar,
body.skin-neumorphic[data-theme="amber"] .nn-sidebar,
body.skin-neumorphic[data-theme="violet"] .nn-topbar,
body.skin-neumorphic[data-theme="violet"] .nn-sidebar{background:var(--bg2)!important}
body.skin-neumorphic .nn-topbar{box-shadow:0 4px 12px var(--neu-s),0 -2px 6px var(--neu-h)!important}
body.skin-neumorphic .nn-sidebar{box-shadow:4px 0 12px var(--neu-s),-2px 0 6px var(--neu-h)!important}

/* -- SVG PROTECTION ---------------------------------------------------- */
body.skin-neumorphic svg path,body.skin-neumorphic svg line,
body.skin-neumorphic svg circle,body.skin-neumorphic svg polyline,
body.skin-neumorphic svg polygon{box-shadow:none!important}
body.skin-neumorphic svg[style*="position:absolute"]{background:transparent!important}

/* -- CANVAS GRID ------------------------------------------------------- */
body.skin-neumorphic [style*="radial-gradient"][style*="canvas-dot"]{
  background:radial-gradient(circle,var(--canvas-dot,color-mix(in oklch,var(--bg) 65%,#000)) 1.2px,var(--bg) 1.2px) 0 0/28px 28px!important}

/* -- BUTTONS ----------------------------------------------------------- */
body.skin-neumorphic button{
  box-shadow:var(--nEm)!important;background:var(--bg)!important;
  color:var(--text2)!important;border:none!important;
  border-radius:var(--radius-btn)!important;
  transition:box-shadow 0.15s ease!important;font-weight:500!important}
body.skin-neumorphic[data-theme="dark"] button,
body.skin-neumorphic[data-theme="midnight"] button,
body.skin-neumorphic[data-theme="forest"] button,
body.skin-neumorphic[data-theme="ocean"] button,
body.skin-neumorphic[data-theme="amber"] button,
body.skin-neumorphic[data-theme="violet"] button{background:var(--bg2)!important}
body.skin-neumorphic button:not([disabled]):hover{box-shadow:var(--nEl)!important;color:var(--text)!important}
body.skin-neumorphic button:not([disabled]):active{box-shadow:var(--nIs)!important}
body.skin-neumorphic button[disabled]{box-shadow:none!important;opacity:0.4!important}
body.skin-neumorphic button[style*="color:#fff"],
body.skin-neumorphic button[style*="color: #fff"],
body.skin-neumorphic button[style*="color:white"]{
  background:var(--accent2)!important;color:#fff!important;box-shadow:var(--nEm)!important}
body.skin-neumorphic button[style*="color:var(--accent)"],
body.skin-neumorphic button[style*="color: var(--accent)"],
body.skin-neumorphic button[style*="color:var(--accent2)"],
body.skin-neumorphic button[style*="color: var(--accent2)"]{
  box-shadow:var(--nIs)!important;font-weight:700!important}
body.skin-neumorphic .nn-toolbar-row{
  box-shadow:var(--nIm)!important;background:var(--bg)!important;
  border-radius:12px!important;padding:4px 8px!important;border:none!important}
body.skin-neumorphic[data-theme="dark"] .nn-toolbar-row,
body.skin-neumorphic[data-theme="midnight"] .nn-toolbar-row,
body.skin-neumorphic[data-theme="forest"] .nn-toolbar-row,
body.skin-neumorphic[data-theme="ocean"] .nn-toolbar-row,
body.skin-neumorphic[data-theme="amber"] .nn-toolbar-row,
body.skin-neumorphic[data-theme="violet"] .nn-toolbar-row{background:var(--bg2)!important}
body.skin-neumorphic .nn-toolbar-row button{box-shadow:none!important;background:transparent!important}
body.skin-neumorphic .nn-toolbar-row button:not([disabled]):hover{box-shadow:var(--nEx)!important}
body.skin-neumorphic .nn-toolbar-row button[style*="color:var(--accent)"],
body.skin-neumorphic .nn-toolbar-row button[style*="color:var(--accent2)"]{box-shadow:var(--nIx)!important}
body.skin-neumorphic .nn-topbar button{box-shadow:var(--nEs)!important;border-radius:8px!important}
body.skin-neumorphic .nn-topbar button:hover{box-shadow:var(--nEm)!important}
body.skin-neumorphic .nn-topbar button:active{box-shadow:var(--nIx)!important}

/* -- INPUTS ------------------------------------------------------------ */
body.skin-neumorphic input:not([type=range]):not([type=checkbox]):not([type=radio]),
body.skin-neumorphic select,body.skin-neumorphic textarea{
  box-shadow:var(--nIm)!important;background:var(--bg)!important;
  border:none!important;border-radius:var(--radius-sm)!important;color:var(--text)!important}
body.skin-neumorphic[data-theme="dark"] input:not([type=range]):not([type=checkbox]):not([type=radio]),
body.skin-neumorphic[data-theme="midnight"] input:not([type=range]):not([type=checkbox]):not([type=radio]),
body.skin-neumorphic[data-theme="forest"] input:not([type=range]):not([type=checkbox]):not([type=radio]),
body.skin-neumorphic[data-theme="ocean"] input:not([type=range]):not([type=checkbox]):not([type=radio]),
body.skin-neumorphic[data-theme="amber"] input:not([type=range]):not([type=checkbox]):not([type=radio]),
body.skin-neumorphic[data-theme="violet"] input:not([type=range]):not([type=checkbox]):not([type=radio]),
body.skin-neumorphic[data-theme="dark"] select,body.skin-neumorphic[data-theme="midnight"] select,
body.skin-neumorphic[data-theme="forest"] select,body.skin-neumorphic[data-theme="ocean"] select,
body.skin-neumorphic[data-theme="amber"] select,body.skin-neumorphic[data-theme="violet"] select,
body.skin-neumorphic[data-theme="dark"] textarea,body.skin-neumorphic[data-theme="midnight"] textarea,
body.skin-neumorphic[data-theme="forest"] textarea,body.skin-neumorphic[data-theme="ocean"] textarea,
body.skin-neumorphic[data-theme="amber"] textarea,body.skin-neumorphic[data-theme="violet"] textarea{
  background:var(--bg2)!important}
body.skin-neumorphic input:focus,body.skin-neumorphic select:focus,body.skin-neumorphic textarea:focus{
  box-shadow:var(--nIm),0 0 0 2px var(--accent)44!important;outline:none!important}
body.skin-neumorphic input[type=checkbox],body.skin-neumorphic input[type=radio]{
  appearance:none;width:18px;height:18px;background:var(--bg);
  box-shadow:var(--nIs);border-radius:4px;cursor:pointer}
body.skin-neumorphic input[type=radio]{border-radius:50%}
body.skin-neumorphic input[type=checkbox]:checked,body.skin-neumorphic input[type=radio]:checked{
  box-shadow:var(--nIs),inset 0 0 0 4px var(--accent)}

/* -- POPUPS / MODALS --------------------------------------------------- */
body.skin-neumorphic [style*="rgba(0,0,0,.7)"],body.skin-neumorphic [style*="rgba(0,0,0,.65)"],
body.skin-neumorphic [style*="rgba(0,0,0,.6)"],body.skin-neumorphic [style*="rgba(0,0,0,.55)"],
body.skin-neumorphic [style*="rgba(0,0,0,.5)"],body.skin-neumorphic [style*="rgba(0,0,0,.4)"]{
  box-shadow:var(--nEl)!important;border:none!important}
body.skin-neumorphic [style*="position:absolute"][style*="background:var(--bg"],
body.skin-neumorphic [style*="position:absolute"][style*="background: var(--bg"]{
  box-shadow:var(--nEl)!important;border:none!important;border-radius:16px!important}

/* -- ACTIVE PILLS / TABS ----------------------------------------------- */
body.skin-neumorphic [style*="background:var(--accent)"]:not([style*="color:#fff"]):not([style*="color: #fff"]),
body.skin-neumorphic [style*="background: var(--accent)"]:not([style*="color:#fff"]):not([style*="color: #fff"]),
body.skin-neumorphic [style*="background:var(--accent2)"]:not([style*="color:#fff"]):not([style*="color: #fff"]),
body.skin-neumorphic [style*="background: var(--accent2)"]:not([style*="color:#fff"]):not([style*="color: #fff"]){
  background:transparent!important;box-shadow:var(--nIs)!important;
  color:var(--accent)!important;border:none!important}

/* -- SCROLLBARS -------------------------------------------------------- */
body.skin-neumorphic ::-webkit-scrollbar{width:6px;height:6px}
body.skin-neumorphic ::-webkit-scrollbar-track{box-shadow:var(--nIs);border-radius:4px}
body.skin-neumorphic ::-webkit-scrollbar-thumb{
  background:color-mix(in oklch,var(--bg) 60%,#000);border-radius:4px}
body.skin-neumorphic[data-theme="dark"] ::-webkit-scrollbar-thumb,
body.skin-neumorphic[data-theme="midnight"] ::-webkit-scrollbar-thumb,
body.skin-neumorphic[data-theme="forest"] ::-webkit-scrollbar-thumb,
body.skin-neumorphic[data-theme="ocean"] ::-webkit-scrollbar-thumb,
body.skin-neumorphic[data-theme="amber"] ::-webkit-scrollbar-thumb,
body.skin-neumorphic[data-theme="violet"] ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15)}

/* -- KBD --------------------------------------------------------------- */
body.skin-neumorphic kbd{box-shadow:var(--nEs)!important;border:none!important;border-radius:6px!important}

/* =====================================================================
   DASHBOARD -- neumorphic treatment
===================================================================== */

/* -- SIDEBAR: ICON-ONLY DOCK (68px wide, avatar + icon nav only) ------- */
body.skin-neumorphic .nn-sidebar[data-page="dashboard"]{
  width:68px!important;padding:16px 0 12px!important;
  align-items:center!important;overflow:hidden!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] > div:first-child{
  border-bottom:none!important;
  box-shadow:0 1px 0 var(--neu-s)!important;
  padding:0 0 14px!important;margin-bottom:12px!important;
  width:100%!important;display:flex!important;
  flex-direction:column!important;align-items:center!important;gap:0!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] [style*="gap:10"][style*="marginBottom:10"]{
  justify-content:center!important;gap:0!important;padding:0!important;margin-bottom:0!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] [style*="gap:10"][style*="marginBottom:10"] > div:last-child{
  display:none!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] [style*="borderRadius:\"50%\""][style*="width:36"],
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] [style*="border-radius:50%"][style*="width:36"]{
  box-shadow:var(--nEm)!important;margin:0 auto!important;flex-shrink:0!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] [style*="gridTemplateColumns"]{
  display:none!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] button[style*="borderLeft"]{
  font-size:0!important;justify-content:center!important;
  gap:0!important;padding:0!important;
  width:44px!important;height:44px!important;
  margin:2px auto!important;display:flex!important;align-items:center!important;
  border-left:none!important;border-radius:12px!important;
  box-shadow:none!important;background:transparent!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] button[style*="borderLeft"] > span{
  font-size:18px!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] button[style*="var(--accent2)22"]{
  box-shadow:var(--nIs)!important;background:var(--bg)!important}
body.skin-neumorphic[data-theme="dark"] .nn-sidebar[data-page="dashboard"] button[style*="var(--accent2)22"],
body.skin-neumorphic[data-theme="midnight"] .nn-sidebar[data-page="dashboard"] button[style*="var(--accent2)22"],
body.skin-neumorphic[data-theme="forest"] .nn-sidebar[data-page="dashboard"] button[style*="var(--accent2)22"],
body.skin-neumorphic[data-theme="ocean"] .nn-sidebar[data-page="dashboard"] button[style*="var(--accent2)22"],
body.skin-neumorphic[data-theme="amber"] .nn-sidebar[data-page="dashboard"] button[style*="var(--accent2)22"],
body.skin-neumorphic[data-theme="violet"] .nn-sidebar[data-page="dashboard"] button[style*="var(--accent2)22"]{
  background:var(--bg2)!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] button[style*="transparent"]:not([style*="var(--accent2)22"]):hover{
  box-shadow:var(--nEx)!important;background:var(--bg)!important}
body.skin-neumorphic .nn-sidebar[data-page="dashboard"] > div[style*="borderTop"]{display:none!important}

/* -- DASHBOARD CONTENT ------------------------------------------------- */
body.skin-neumorphic input[placeholder*="maps"],
body.skin-neumorphic input[placeholder*="Search"]{box-shadow:var(--nIm)!important;border:none!important}
body.skin-neumorphic [style*="background:var(--accent2)22"],
body.skin-neumorphic [style*="background: var(--accent2)22"]{
  background:var(--bg)!important;box-shadow:var(--nIs)!important;border:none!important}

/* -- MAP CARDS --------------------------------------------------------- */
body.skin-neumorphic .nn-map-card{
  box-shadow:var(--nEl),inset 0 3px 0 var(--ca)!important;
  background:var(--bg2)!important;border:none!important;border-radius:18px!important;
  transition:box-shadow 0.2s ease,transform 0.15s ease!important}
body.skin-neumorphic .nn-map-card:hover{
  box-shadow:10px 10px 28px var(--neu-s),-10px -10px 28px var(--neu-h),inset 0 3px 0 var(--ca)!important;
  transform:translateY(-3px)!important}
body.skin-neumorphic .nn-map-card:hover .nn-card-actions{opacity:1!important}
body.skin-neumorphic .nn-card-actions button{box-shadow:none!important;background:transparent!important}
body.skin-neumorphic .nn-card-actions button:hover{box-shadow:var(--nEs)!important;background:var(--bg)!important}

/* -- LIST ROWS --------------------------------------------------------- */
body.skin-neumorphic .nn-map-list-row{
  box-shadow:var(--nEs)!important;border:none!important;
  border-radius:12px!important;margin-bottom:5px!important;background:var(--bg2)!important}
body.skin-neumorphic .nn-map-list-row:hover{
  box-shadow:var(--nEm)!important;transform:translateX(2px)!important}
`,
  },
};

export const SKIN_KEYS = Object.keys(SKINS);
