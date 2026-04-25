// skins.js — personality layer only (no color vars — those come from Theme)
// Each skin sets: fonts, radius, shadows, spacing, nav layout, CSS effects

export const SKINS = {

  obsidian: {
    name:"Obsidian", icon:"⬡", nav:"top",
    concept:"Dense developer tool. Tight monospace, precise geometry.",
    tags:["Technical","Monospace"],
    vars:{
      "--font-ui":"'JetBrains Mono','Fira Code',monospace",
      "--font-node":"'JetBrains Mono','Fira Code',monospace",
      "--font-weight-ui":"700","--font-weight-node":"600",
      "--letter-space":"0.3px","--line-height":"1.5",
      "--radius-xs":"4px","--radius-sm":"6px","--radius-md":"8px","--radius-lg":"10px",
      "--radius-node":"10px","--radius-btn":"6px",
      "--topbar-h":"48px","--node-header-h":"34px","--btn-pad":"5px 10px",
      "--sidebar-w":"220px","--props-w":"268px","--node-pad":"8px 10px",
      "--node-body-pad":"6px 10px 8px","--node-border-w":"2px",
      "--shadow-node":"0 2px 12px var(--shadow)","--shadow-node-sel":"0 0 0 3px var(--accent)44,0 6px 28px var(--shadow)",
      "--transition-all":"all 0.12s",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--border2)","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg2)","--sidebar-border":"1px solid var(--border2)",
    },
    bodyClass:"skin-obsidian",
    css:`body.skin-obsidian ::-webkit-scrollbar{width:6px;height:6px}
body.skin-obsidian ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}`,
  },

  aurora: {
    name:"Aurora", icon:"🌌", nav:"top",
    concept:"Frosted glass panels. Elements float over a deep background.",
    tags:["Glass","Blur","Spacious"],
    vars:{
      "--font-ui":"'Inter','Segoe UI',system-ui,sans-serif",
      "--font-node":"'Inter',system-ui,sans-serif",
      "--font-weight-ui":"500","--font-weight-node":"400",
      "--letter-space":"-0.01em","--line-height":"1.6",
      "--radius-xs":"10px","--radius-sm":"14px","--radius-md":"18px","--radius-lg":"24px",
      "--radius-node":"18px","--radius-btn":"12px",
      "--topbar-h":"54px","--node-header-h":"42px","--btn-pad":"8px 18px",
      "--sidebar-w":"220px","--props-w":"280px","--node-pad":"12px 14px",
      "--node-body-pad":"10px 14px 12px","--node-border-w":"1px",
      "--shadow-node":"0 4px 32px var(--shadow),0 2px 8px var(--shadow)",
      "--shadow-node-sel":"0 0 0 2px var(--accent),0 8px 40px var(--shadow)",
      "--transition-all":"all 0.2s cubic-bezier(0.4,0,0.2,1)",
      "--topbar-bg":"color-mix(in srgb, var(--bg2) 70%, transparent)","--topbar-border":"1px solid var(--border)","--topbar-blur":"blur(24px)",
      "--sidebar-bg":"color-mix(in srgb, var(--bg) 80%, transparent)","--sidebar-border":"1px solid var(--border2)",
    },
    bodyClass:"skin-aurora",
    css:`body.skin-aurora .nn-topbar{backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important}
body.skin-aurora .nn-sidebar{backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}
body.skin-aurora button:not([disabled]):hover{box-shadow:0 0 16px var(--accent)44!important}
body.skin-aurora ::-webkit-scrollbar{width:5px}
body.skin-aurora ::-webkit-scrollbar-thumb{background:var(--accent)44;border-radius:3px}`,
  },

  brutalist: {
    name:"Brutalist", icon:"🏗", nav:"bottom",
    concept:"Raw. Confrontational. Thick borders, offset shadows, zero softness.",
    tags:["Bold","Angular","Statement"],
    vars:{
      "--font-ui":"'Space Grotesk','Arial Black',sans-serif",
      "--font-node":"'Space Grotesk',sans-serif",
      "--font-weight-ui":"700","--font-weight-node":"700",
      "--letter-space":"0.03em","--line-height":"1.3",
      "--radius-xs":"0","--radius-sm":"0","--radius-md":"0","--radius-lg":"0",
      "--radius-node":"0","--radius-btn":"0",
      "--topbar-h":"0px","--node-header-h":"36px","--btn-pad":"10px 20px",
      "--sidebar-w":"220px","--props-w":"268px","--node-pad":"10px 12px",
      "--node-body-pad":"8px 12px 10px","--node-border-w":"3px",
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
body.skin-brutalist input:focus,body.skin-brutalist select:focus{border-color:var(--accent)!important;box-shadow:4px 4px 0 var(--accent)!important}
body.skin-brutalist ::-webkit-scrollbar{width:8px}
body.skin-brutalist ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:0}`,
  },

  neonTokyo: {
    name:"Neon Tokyo", icon:"⚡", nav:"bottom",
    concept:"Everything glows. Scanlines. Rain on the streets. Every click electric.",
    tags:["Neon","Glow","Cyberpunk"],
    vars:{
      "--font-ui":"'Rajdhani','Orbitron',system-ui,sans-serif",
      "--font-node":"'Rajdhani',system-ui,sans-serif",
      "--font-weight-ui":"600","--font-weight-node":"500",
      "--letter-space":"0.08em","--line-height":"1.4",
      "--radius-xs":"0","--radius-sm":"2px","--radius-md":"4px","--radius-lg":"6px",
      "--radius-node":"4px","--radius-btn":"2px",
      "--topbar-h":"0px","--node-header-h":"36px","--btn-pad":"7px 16px",
      "--sidebar-w":"220px","--props-w":"270px","--node-pad":"10px 12px",
      "--node-body-pad":"8px 12px 10px","--node-border-w":"1px",
      "--shadow-node":"0 0 0 1px var(--accent)44,0 0 20px var(--accent)22,0 4px 20px var(--shadow)",
      "--shadow-node-sel":"0 0 0 1px var(--accent),0 0 30px var(--accent)66",
      "--transition-all":"all 0.08s",
      "--topbar-bg":"var(--bg)","--topbar-border":"1px solid var(--accent)55","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-neon-tokyo",
    css:`body.skin-neon-tokyo::before{content:'';position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9997;background:repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)}
body.skin-neon-tokyo button{text-transform:uppercase!important;letter-spacing:0.1em!important}
body.skin-neon-tokyo button:not([disabled]):hover{color:var(--accent)!important;border-color:var(--accent)!important;box-shadow:0 0 12px var(--accent)55!important;text-shadow:0 0 8px var(--accent)!important}
body.skin-neon-tokyo input:focus,body.skin-neon-tokyo select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 1px var(--accent),0 0 16px var(--accent)44!important}
body.skin-neon-tokyo ::-webkit-scrollbar{width:4px}
body.skin-neon-tokyo ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}`,
  },

  neumorphic: {
    name:"Neumorphic", icon:"⬜", nav:"icon-dock",
    concept:"Soft clay. Elements are pushed out of or pressed into a single surface.",
    tags:["3D","Tactile","Soft"],
    vars:{
      "--font-ui":"'Nunito','Poppins',system-ui,sans-serif",
      "--font-node":"'Nunito',system-ui,sans-serif",
      "--font-weight-ui":"700","--font-weight-node":"600",
      "--letter-space":"0em","--line-height":"1.65",
      "--radius-xs":"10px","--radius-sm":"14px","--radius-md":"20px","--radius-lg":"28px",
      "--radius-node":"20px","--radius-btn":"14px",
      "--topbar-h":"0px","--node-header-h":"44px","--btn-pad":"9px 20px",
      "--sidebar-w":"220px","--props-w":"290px","--node-pad":"14px 16px",
      "--node-body-pad":"12px 16px 14px","--node-border-w":"0px",
      "--shadow-node":"8px 8px 16px var(--shadow),-4px -4px 12px rgba(255,255,255,0.05)",
      "--shadow-node-sel":"6px 6px 12px var(--shadow),-4px -4px 12px rgba(255,255,255,0.06),0 0 0 3px var(--accent)44",
      "--transition-all":"all 0.15s ease",
      "--topbar-bg":"var(--bg2)","--topbar-border":"none","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"none",
    },
    bodyClass:"skin-neumorphic",
    css:`body.skin-neumorphic button{border:none!important;box-shadow:4px 4px 8px var(--shadow),-2px -2px 6px rgba(255,255,255,0.05)!important;transition:all 0.15s ease!important}
body.skin-neumorphic button:not([disabled]):hover{box-shadow:5px 5px 10px var(--shadow),-3px -3px 8px rgba(255,255,255,0.06)!important;transform:translateY(-1px)!important}
body.skin-neumorphic button:not([disabled]):active{box-shadow:inset 3px 3px 6px var(--shadow),inset -2px -2px 4px rgba(255,255,255,0.04)!important;transform:translateY(0)!important}
body.skin-neumorphic input,body.skin-neumorphic select,body.skin-neumorphic textarea{border:none!important;box-shadow:inset 3px 3px 6px var(--shadow),inset -2px -2px 4px rgba(255,255,255,0.04)!important}
body.skin-neumorphic ::-webkit-scrollbar{width:8px}
body.skin-neumorphic ::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}`,
  },

  sakura: {
    name:"Sakura", icon:"🌸", nav:"icon-dock",
    concept:"Ma — the art of negative space. Beauty in what is absent.",
    tags:["Elegant","Serif","Minimal"],
    vars:{
      "--font-ui":"'Cormorant Garamond','Garamond','Georgia',serif",
      "--font-node":"'Cormorant Garamond','Georgia',serif",
      "--font-weight-ui":"500","--font-weight-node":"400",
      "--letter-space":"0.04em","--line-height":"1.8",
      "--radius-xs":"2px","--radius-sm":"4px","--radius-md":"8px","--radius-lg":"12px",
      "--radius-node":"10px","--radius-btn":"4px",
      "--topbar-h":"0px","--node-header-h":"42px","--btn-pad":"8px 20px",
      "--sidebar-w":"220px","--props-w":"290px","--node-pad":"12px 16px",
      "--node-body-pad":"10px 16px 14px","--node-border-w":"1px",
      "--shadow-node":"0 2px 16px var(--shadow),0 1px 4px var(--shadow)",
      "--shadow-node-sel":"0 0 0 2px var(--accent)44,0 4px 24px var(--shadow)",
      "--transition-all":"all 0.22s ease",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--border2)","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border2)",
    },
    bodyClass:"skin-sakura",
    css:`body.skin-sakura{font-size:15px}
body.skin-sakura button{font-size:12px!important;border:1px solid var(--border)!important;background:transparent!important;color:var(--text2)!important}
body.skin-sakura button:not([disabled]):hover{border-color:var(--accent)!important;color:var(--accent)!important;background:var(--accent)08!important}
body.skin-sakura input,body.skin-sakura select{border:1px solid var(--border)!important}
body.skin-sakura ::-webkit-scrollbar{width:4px}
body.skin-sakura ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}`,
  },

  vapor: {
    name:"Vapor", icon:"🌊", nav:"editorial",
    concept:"A E S T H E T I C. Grid lines. Infinite sunset. Lost in the 80s.",
    tags:["Retro","Grid","Atmospheric"],
    vars:{
      "--font-ui":"'VT323','Press Start 2P','Courier New',monospace",
      "--font-node":"'VT323','Courier New',monospace",
      "--font-weight-ui":"400","--font-weight-node":"400",
      "--letter-space":"0.05em","--line-height":"1.5",
      "--radius-xs":"0","--radius-sm":"0","--radius-md":"2px","--radius-lg":"4px",
      "--radius-node":"2px","--radius-btn":"0",
      "--topbar-h":"56px","--node-header-h":"38px","--btn-pad":"8px 20px",
      "--sidebar-w":"220px","--props-w":"268px","--node-pad":"10px 14px",
      "--node-body-pad":"8px 14px 10px","--node-border-w":"2px",
      "--shadow-node":"0 0 0 1px var(--accent)44,0 0 20px var(--accent)22",
      "--shadow-node-sel":"0 0 0 2px var(--accent),0 0 40px var(--accent)55",
      "--transition-all":"all 0.1s",
      "--topbar-bg":"var(--bg)","--topbar-border":"1px solid var(--accent)44","--topbar-blur":"blur(8px)",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-vapor",
    css:`body.skin-vapor{background-image:repeating-linear-gradient(0deg,transparent,transparent 39px,var(--border2) 39px,var(--border2) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,var(--border2) 39px,var(--border2) 40px);background-attachment:fixed}
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
    vars:{
      "--font-ui":"'Playfair Display','Georgia',serif",
      "--font-node":"'Playfair Display','Georgia',serif",
      "--font-weight-ui":"700","--font-weight-node":"400",
      "--letter-space":"0.02em","--line-height":"1.7",
      "--radius-xs":"0","--radius-sm":"0","--radius-md":"2px","--radius-lg":"4px",
      "--radius-node":"0","--radius-btn":"2px",
      "--topbar-h":"64px","--node-header-h":"44px","--btn-pad":"8px 18px",
      "--sidebar-w":"220px","--props-w":"290px","--node-pad":"12px 14px",
      "--node-body-pad":"10px 14px 12px","--node-border-w":"1px",
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
body.skin-newspaper ::-webkit-scrollbar{width:6px}
body.skin-newspaper ::-webkit-scrollbar-thumb{background:var(--accent)}`,
  },

  coral: {
    name:"Coral", icon:"🪸", nav:"bottom",
    concept:"Miami heat. Fun and alive. Bouncy, warm, energetic.",
    tags:["Vibrant","Bouncy","Warm"],
    vars:{
      "--font-ui":"'DM Sans','Inter',system-ui,sans-serif",
      "--font-node":"'DM Sans',system-ui,sans-serif",
      "--font-weight-ui":"600","--font-weight-node":"500",
      "--letter-space":"-0.01em","--line-height":"1.55",
      "--radius-xs":"8px","--radius-sm":"12px","--radius-md":"16px","--radius-lg":"24px",
      "--radius-node":"16px","--radius-btn":"20px",
      "--topbar-h":"0px","--node-header-h":"42px","--btn-pad":"10px 22px",
      "--sidebar-w":"220px","--props-w":"280px","--node-pad":"12px 14px",
      "--node-body-pad":"10px 14px 12px","--node-border-w":"1px",
      "--shadow-node":"0 4px 24px var(--shadow),0 2px 8px var(--shadow)",
      "--shadow-node-sel":"0 0 0 2px var(--accent)66,0 8px 32px var(--shadow)",
      "--transition-all":"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--border)","--topbar-blur":"blur(16px)",
      "--sidebar-bg":"var(--bg2)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-coral",
    css:`body.skin-coral button:not([disabled]):hover{box-shadow:0 4px 16px var(--accent)44!important;transform:translateY(-2px)!important}
body.skin-coral button:active{transform:translateY(0)!important}
body.skin-coral input:focus,body.skin-coral select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent)22!important;outline:none!important}
body.skin-coral ::-webkit-scrollbar{width:6px}
body.skin-coral ::-webkit-scrollbar-thumb{background:var(--accent)55;border-radius:3px}`,
  },

  carbon: {
    name:"Carbon", icon:"⚙", nav:"icon-dock",
    concept:"Forged, not designed. Precision, performance, zero tolerance.",
    tags:["Industrial","Dense","Precise"],
    vars:{
      "--font-ui":"'IBM Plex Mono','JetBrains Mono',monospace",
      "--font-node":"'IBM Plex Mono',monospace",
      "--font-weight-ui":"500","--font-weight-node":"400",
      "--letter-space":"0.04em","--line-height":"1.45",
      "--radius-xs":"2px","--radius-sm":"4px","--radius-md":"6px","--radius-lg":"8px",
      "--radius-node":"6px","--radius-btn":"4px",
      "--topbar-h":"0px","--node-header-h":"36px","--btn-pad":"7px 14px",
      "--sidebar-w":"220px","--props-w":"268px","--node-pad":"10px 12px",
      "--node-body-pad":"8px 12px 10px","--node-border-w":"1px",
      "--shadow-node":"0 2px 8px var(--shadow),inset 0 1px 0 var(--accent)18",
      "--shadow-node-sel":"0 0 0 1px var(--accent),0 4px 20px var(--accent)33",
      "--transition-all":"all 0.1s",
      "--topbar-bg":"var(--bg2)","--topbar-border":"1px solid var(--accent)33","--topbar-blur":"none",
      "--sidebar-bg":"var(--bg)","--sidebar-border":"1px solid var(--border)",
    },
    bodyClass:"skin-carbon",
    css:`body.skin-carbon{background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 4px);background-attachment:fixed}
body.skin-carbon button{text-transform:uppercase!important;letter-spacing:0.06em!important;font-size:10px!important;border:1px solid var(--border)!important}
body.skin-carbon button:not([disabled]):hover{border-color:var(--accent)!important;color:var(--accent)!important;box-shadow:0 0 8px var(--accent)33!important}
body.skin-carbon ::-webkit-scrollbar{width:5px}
body.skin-carbon ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:1px}`,
  },

  pastelPop: {
    name:"Pastel Pop", icon:"🍬", nav:"bottom",
    concept:"Pure joy. Soft gradients, bouncy animations, every interaction delightful.",
    tags:["Fun","Rounded","Playful"],
    vars:{
      "--font-ui":"'Nunito','Poppins',system-ui,sans-serif",
      "--font-node":"'Nunito',system-ui,sans-serif",
      "--font-weight-ui":"800","--font-weight-node":"700",
      "--letter-space":"0em","--line-height":"1.7",
      "--radius-xs":"12px","--radius-sm":"16px","--radius-md":"22px","--radius-lg":"32px",
      "--radius-node":"22px","--radius-btn":"24px",
      "--topbar-h":"0px","--node-header-h":"48px","--btn-pad":"10px 22px",
      "--sidebar-w":"220px","--props-w":"290px","--node-pad":"14px 16px",
      "--node-body-pad":"12px 16px 16px","--node-border-w":"2px",
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
