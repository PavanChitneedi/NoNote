// skins.js — 6 radically distinct UI personalities
const BASE = {
  "--topbar-h":"48px","--node-header-h":"34px","--btn-pad":"5px 10px",
  "--sidebar-w":"220px","--props-w":"268px","--node-pad":"8px 10px",
  "--node-body-pad":"6px 10px 8px","--node-border-w":"2px",
  "--transition-all":"all 0.12s","--line-height":"1.5","--letter-space":"0.3px",
  "--canvas-dot":"#21262d","--node-bg":"#161b22","--shadow":"rgba(0,0,0,0.5)",
};

export const SKINS = {

aurora: {
  name:"Aurora", desc:"Deep space glassmorphism. Frosted panels float over an animated aurora gradient. Violet + teal.",
  icon:"🌌", tags:["Dark","Glass","Animated"],
  palette:["#05080f","#0d1424","#a78bfa","#34d399","#fb7185"],
  vars:{
    ...BASE,
    "--bg":"#05080f","--bg2":"#0d1424","--bg3":"#141d35",
    "--border":"rgba(139,92,246,0.25)","--border2":"rgba(139,92,246,0.12)",
    "--text":"#e2e8f8","--text2":"#b8c5e0","--text3":"#7890b8","--text4":"#4a6080",
    "--accent":"#a78bfa","--accent2":"#7c3aed",
    "--success":"#34d399","--danger":"#fb7185",
    "--canvas-dot":"#141d35","--node-bg":"#0d1424","--shadow":"rgba(0,0,0,0.7)",
    "--font-ui":"'Inter','Segoe UI',system-ui,sans-serif",
    "--font-node":"'Inter',system-ui,sans-serif",
    "--font-weight-ui":"500","--font-weight-node":"400",
    "--letter-space":"-0.01em","--line-height":"1.6",
    "--radius-xs":"10px","--radius-sm":"14px","--radius-md":"18px","--radius-lg":"24px",
    "--radius-node":"18px","--radius-btn":"12px",
    "--topbar-h":"54px","--node-header-h":"42px","--btn-pad":"8px 18px",
    "--node-pad":"12px 14px","--node-body-pad":"10px 14px 12px","--node-border-w":"1px",
    "--shadow-node":"0 4px 32px rgba(139,92,246,0.2), 0 2px 8px rgba(0,0,0,0.5)",
    "--shadow-node-sel":"0 0 0 2px rgba(167,139,250,0.7), 0 8px 40px rgba(139,92,246,0.4)",
    "--shadow-card":"0 8px 32px rgba(0,0,0,0.5)",
    "--transition-all":"all 0.2s cubic-bezier(0.4,0,0.2,1)",
    "--topbar-bg":"rgba(13,20,36,0.7)","--topbar-border":"1px solid rgba(139,92,246,0.2)","--topbar-blur":"blur(24px)",
    "--sidebar-bg":"rgba(5,8,15,0.8)","--sidebar-border":"1px solid rgba(139,92,246,0.15)","--sidebar-blur":"blur(20px)",
    "--card-blur":"blur(12px)","--glow":"0 0 30px rgba(139,92,246,0.3)",
  },
  bodyClass:"skin-aurora",
  css:`
body.skin-aurora{background:#05080f;background-image:radial-gradient(ellipse 80% 60% at 20% 20%,rgba(139,92,246,0.15) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 70%,rgba(52,211,153,0.10) 0%,transparent 55%),radial-gradient(ellipse 40% 40% at 60% 10%,rgba(251,113,133,0.08) 0%,transparent 50%);background-attachment:fixed;}
body.skin-aurora .nn-topbar{backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;box-shadow:0 1px 0 rgba(139,92,246,0.2),0 4px 24px rgba(0,0,0,0.4)!important;}
body.skin-aurora .nn-sidebar{backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important;}
body.skin-aurora button:not([disabled]):hover{box-shadow:0 0 16px rgba(167,139,250,0.4)!important;}
body.skin-aurora input:focus,body.skin-aurora select:focus{box-shadow:0 0 0 2px rgba(167,139,250,0.5),0 0 16px rgba(139,92,246,0.2)!important;border-color:rgba(167,139,250,0.6)!important;}
body.skin-aurora ::-webkit-scrollbar{width:5px}body.skin-aurora ::-webkit-scrollbar-track{background:transparent}body.skin-aurora ::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.4);border-radius:3px}
`,
},

brutalist:{
  name:"Brutalist", desc:"Raw confrontational design. Brutal yellow on black. Thick borders. No softness. Every element makes a statement.",
  icon:"🏗", tags:["Bold","High-contrast","Editorial"],
  palette:["#0a0a0a","#111111","#ffe600","#ffffff","#ff2e2e"],
  vars:{
    ...BASE,
    "--bg":"#0a0a0a","--bg2":"#111111","--bg3":"#1a1a1a",
    "--border":"#333333","--border2":"#222222",
    "--text":"#ffffff","--text2":"#e0e0e0","--text3":"#999999","--text4":"#555555",
    "--accent":"#ffe600","--accent2":"#ccb800",
    "--success":"#00ff88","--danger":"#ff2e2e",
    "--canvas-dot":"#1a1a1a","--node-bg":"#111111","--shadow":"rgba(0,0,0,0.9)",
    "--font-ui":"'Space Grotesk','Arial Black','Impact',sans-serif",
    "--font-node":"'Space Grotesk','Arial Black',sans-serif",
    "--font-weight-ui":"700","--font-weight-node":"700",
    "--letter-space":"0.03em","--line-height":"1.3",
    "--radius-xs":"0","--radius-sm":"0","--radius-md":"0","--radius-lg":"0",
    "--radius-node":"0","--radius-btn":"0",
    "--topbar-h":"52px","--node-header-h":"36px","--btn-pad":"8px 16px",
    "--node-pad":"10px 12px","--node-body-pad":"8px 12px 10px","--node-border-w":"3px",
    "--shadow-node":"4px 4px 0 #ffe600","--shadow-node-sel":"6px 6px 0 #ffe600",
    "--shadow-card":"3px 3px 0 #ffe600","--transition-all":"all 0.06s",
    "--topbar-bg":"#0a0a0a","--topbar-border":"3px solid #ffe600","--topbar-blur":"none",
    "--sidebar-bg":"#0a0a0a","--sidebar-border":"3px solid #333","--sidebar-blur":"none",
    "--card-blur":"none","--glow":"none",
  },
  bodyClass:"skin-brutalist",
  css:`
body.skin-brutalist{background:#0a0a0a;}
body.skin-brutalist .nn-topbar{border-bottom:3px solid #ffe600!important;box-shadow:0 3px 0 #ffe600!important;}
body.skin-brutalist .nn-sidebar{border-right:3px solid #333!important;}
body.skin-brutalist button{text-transform:uppercase!important;letter-spacing:0.06em!important;font-weight:700!important;border:2px solid currentColor!important;transition:all 0.06s!important;}
body.skin-brutalist button:not([disabled]):hover{background:#ffe600!important;color:#0a0a0a!important;box-shadow:3px 3px 0 rgba(255,230,0,0.5)!important;transform:translate(-2px,-2px)!important;}
body.skin-brutalist button:active{transform:translate(2px,2px)!important;box-shadow:none!important;}
body.skin-brutalist input,body.skin-brutalist select,body.skin-brutalist textarea{border:2px solid #333!important;border-radius:0!important;}
body.skin-brutalist input:focus,body.skin-brutalist select:focus{border-color:#ffe600!important;outline:none!important;box-shadow:3px 3px 0 #ffe600!important;}
body.skin-brutalist ::-webkit-scrollbar{width:8px}body.skin-brutalist ::-webkit-scrollbar-track{background:#111}body.skin-brutalist ::-webkit-scrollbar-thumb{background:#ffe600;border-radius:0}
`,
},

neonTokyo:{
  name:"Neon Tokyo", desc:"Cyberpunk night city. Hot pink + cyan neon with scanline overlay and glow effects. Rain-soaked streets.",
  icon:"⚡", tags:["Dark","Neon","Cyberpunk"],
  palette:["#02000a","#06011a","#ff2d78","#00f5ff","#ffe600"],
  vars:{
    ...BASE,
    "--bg":"#02000a","--bg2":"#06011a","--bg3":"#0d0230",
    "--border":"rgba(255,45,120,0.3)","--border2":"rgba(0,245,255,0.15)",
    "--text":"#f0f0ff","--text2":"#c8c0e0","--text3":"#8070a8","--text4":"#503868",
    "--accent":"#ff2d78","--accent2":"#cc0050",
    "--success":"#00f5a0","--danger":"#ff4040",
    "--canvas-dot":"#0d0230","--node-bg":"#06011a","--shadow":"rgba(0,0,0,0.9)",
    "--font-ui":"'Rajdhani','Orbitron',system-ui,sans-serif",
    "--font-node":"'Rajdhani',system-ui,sans-serif",
    "--font-weight-ui":"600","--font-weight-node":"500",
    "--letter-space":"0.08em","--line-height":"1.4",
    "--radius-xs":"0","--radius-sm":"2px","--radius-md":"4px","--radius-lg":"6px",
    "--radius-node":"4px","--radius-btn":"2px",
    "--topbar-h":"50px","--node-header-h":"36px","--btn-pad":"7px 16px",
    "--node-pad":"10px 12px","--node-body-pad":"8px 12px 10px","--node-border-w":"1px",
    "--shadow-node":"0 0 0 1px rgba(255,45,120,0.4),0 0 20px rgba(255,45,120,0.2),0 4px 20px rgba(0,0,0,.8)",
    "--shadow-node-sel":"0 0 0 1px #ff2d78,0 0 30px rgba(255,45,120,0.7),0 0 60px rgba(255,45,120,0.3)",
    "--shadow-card":"0 0 0 1px rgba(0,245,255,0.2),0 4px 20px rgba(0,0,0,.7)",
    "--transition-all":"all 0.08s",
    "--topbar-bg":"rgba(2,0,10,0.95)","--topbar-border":"1px solid rgba(255,45,120,0.5)","--topbar-blur":"none",
    "--sidebar-bg":"#02000a","--sidebar-border":"1px solid rgba(0,245,255,0.2)","--sidebar-blur":"none",
    "--card-blur":"none","--glow":"0 0 20px rgba(255,45,120,0.5)",
  },
  bodyClass:"skin-neon-tokyo",
  css:`
body.skin-neon-tokyo{background:#02000a;background-image:radial-gradient(ellipse 100% 80% at 50% 0%,rgba(255,45,120,0.08) 0%,transparent 50%);background-attachment:fixed;}
body.skin-neon-tokyo::before{content:'';position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;background:repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px);}
body.skin-neon-tokyo .nn-topbar{box-shadow:0 0 0 1px rgba(255,45,120,0.3),0 4px 20px rgba(0,0,0,0.8)!important;position:relative;}
body.skin-neon-tokyo .nn-topbar::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#ff2d78 30%,#00f5ff 70%,transparent);box-shadow:0 0 8px #ff2d78;}
body.skin-neon-tokyo button{text-transform:uppercase!important;letter-spacing:0.1em!important;font-weight:600!important;}
body.skin-neon-tokyo button:not([disabled]):hover{color:#ff2d78!important;border-color:#ff2d78!important;box-shadow:0 0 12px rgba(255,45,120,0.5),inset 0 0 12px rgba(255,45,120,0.1)!important;text-shadow:0 0 8px rgba(255,45,120,0.8)!important;}
body.skin-neon-tokyo input:focus,body.skin-neon-tokyo select:focus{border-color:#00f5ff!important;box-shadow:0 0 0 1px #00f5ff,0 0 16px rgba(0,245,255,0.3)!important;}
body.skin-neon-tokyo ::-webkit-scrollbar{width:4px}body.skin-neon-tokyo ::-webkit-scrollbar-track{background:#02000a}body.skin-neon-tokyo ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#ff2d78,#00f5ff);border-radius:2px}
`,
},

neumorphic:{
  name:"Neumorphic", desc:"Soft clay surfaces. Elements are pushed out of or into a single continuous material. Tactile and 3D.",
  icon:"⬜", tags:["Light","3D","Tactile","Soft"],
  palette:["#dde4ef","#e8edf5","#5b8dee","#27ae60","#e74c3c"],
  vars:{
    ...BASE,
    "--bg":"#dde4ef","--bg2":"#e8edf5","--bg3":"#d0d8e8",
    "--border":"#c8d0e0","--border2":"#d4dcea",
    "--text":"#2d3a4e","--text2":"#3d4f68","--text3":"#7888a0","--text4":"#a8b8cc",
    "--accent":"#5b8dee","--accent2":"#2563eb",
    "--success":"#27ae60","--danger":"#e74c3c",
    "--canvas-dot":"#c8d0e0","--node-bg":"#e8edf5","--shadow":"rgba(0,0,0,0.12)",
    "--font-ui":"'Nunito','Poppins',system-ui,sans-serif",
    "--font-node":"'Nunito',system-ui,sans-serif",
    "--font-weight-ui":"700","--font-weight-node":"600",
    "--letter-space":"0em","--line-height":"1.65",
    "--radius-xs":"10px","--radius-sm":"14px","--radius-md":"20px","--radius-lg":"28px",
    "--radius-node":"20px","--radius-btn":"14px",
    "--topbar-h":"58px","--node-header-h":"44px","--btn-pad":"9px 20px",
    "--node-pad":"14px 16px","--node-body-pad":"12px 16px 14px","--node-border-w":"0px",
    "--shadow-node":"8px 8px 16px #bec7d8,-8px -8px 16px #f4faff",
    "--shadow-node-sel":"6px 6px 12px #b0bcd0,-6px -6px 12px #f8feff,0 0 0 3px rgba(91,141,238,0.4)",
    "--shadow-card":"6px 6px 12px #bec7d8,-6px -6px 12px #f4faff",
    "--transition-all":"all 0.15s ease",
    "--topbar-bg":"#e8edf5","--topbar-border":"none","--topbar-blur":"none",
    "--sidebar-bg":"#dde4ef","--sidebar-border":"none","--sidebar-blur":"none",
    "--card-blur":"none","--glow":"none",
  },
  bodyClass:"skin-neumorphic",
  css:`
body.skin-neumorphic{background:#dde4ef;}
body.skin-neumorphic .nn-topbar{box-shadow:0 4px 12px #bec7d8,0 -1px 0 #f4faff!important;border-bottom:none!important;}
body.skin-neumorphic .nn-sidebar{box-shadow:4px 0 12px #bec7d8!important;border-right:none!important;}
body.skin-neumorphic button{background:#e8edf5!important;border:none!important;box-shadow:4px 4px 8px #bec7d8,-4px -4px 8px #f4faff!important;color:#3d4f68!important;font-weight:700!important;}
body.skin-neumorphic button:not([disabled]):hover{box-shadow:5px 5px 10px #b8c2d4,-5px -5px 10px #f6fdff!important;transform:translateY(-1px)!important;}
body.skin-neumorphic button:not([disabled]):active{box-shadow:inset 4px 4px 8px #bec7d8,inset -4px -4px 8px #f4faff!important;transform:translateY(0)!important;}
body.skin-neumorphic input,body.skin-neumorphic select,body.skin-neumorphic textarea{background:#dde4ef!important;border:none!important;box-shadow:inset 4px 4px 8px #bec7d8,inset -4px -4px 8px #f4faff!important;}
body.skin-neumorphic input:focus,body.skin-neumorphic select:focus{box-shadow:inset 4px 4px 8px #bec7d8,inset -4px -4px 8px #f4faff,0 0 0 2px rgba(91,141,238,0.4)!important;outline:none!important;}
body.skin-neumorphic ::-webkit-scrollbar{width:8px}body.skin-neumorphic ::-webkit-scrollbar-track{background:#dde4ef;box-shadow:inset 2px 2px 6px #bec7d8;border-radius:4px}body.skin-neumorphic ::-webkit-scrollbar-thumb{background:#c8d0e0;border-radius:4px}
`,
},

sakura:{
  name:"Sakura", desc:"Japanese minimalism. Cherry blossom pink, ink-black text, gold accents. The beauty of empty space — Ma.",
  icon:"🌸", tags:["Light","Minimal","Elegant","Serif"],
  palette:["#fef8f9","#ffffff","#e8648a","#1a1a2e","#d4af37"],
  vars:{
    ...BASE,
    "--bg":"#fef8f9","--bg2":"#ffffff","--bg3":"#fdf0f3",
    "--border":"#f0d0d8","--border2":"#f8e8ec",
    "--text":"#1a1a2e","--text2":"#2d2d42","--text3":"#8878a0","--text4":"#c4b8cc",
    "--accent":"#e8648a","--accent2":"#c0376a",
    "--success":"#2e9e5c","--danger":"#d0324a",
    "--canvas-dot":"#f0d0d8","--node-bg":"#ffffff","--shadow":"rgba(0,0,0,0.06)",
    "--font-ui":"'Cormorant Garamond','Garamond','Georgia',serif",
    "--font-node":"'Cormorant Garamond','Georgia',serif",
    "--font-weight-ui":"500","--font-weight-node":"400",
    "--letter-space":"0.04em","--line-height":"1.8",
    "--radius-xs":"2px","--radius-sm":"4px","--radius-md":"8px","--radius-lg":"12px",
    "--radius-node":"10px","--radius-btn":"4px",
    "--topbar-h":"56px","--node-header-h":"42px","--btn-pad":"8px 20px",
    "--node-pad":"12px 16px","--node-body-pad":"10px 16px 14px","--node-border-w":"1px",
    "--shadow-node":"0 2px 16px rgba(232,100,138,0.08),0 1px 4px rgba(0,0,0,0.06)",
    "--shadow-node-sel":"0 0 0 2px rgba(232,100,138,0.4),0 4px 24px rgba(232,100,138,0.15)",
    "--shadow-card":"0 2px 12px rgba(0,0,0,0.06)",
    "--transition-all":"all 0.22s ease",
    "--topbar-bg":"#ffffff","--topbar-border":"1px solid #f0d0d8","--topbar-blur":"none",
    "--sidebar-bg":"#fef8f9","--sidebar-border":"1px solid #f0d0d8","--sidebar-blur":"none",
    "--card-blur":"none","--glow":"none",
  },
  bodyClass:"skin-sakura",
  css:`
body.skin-sakura{background:#fef8f9;font-size:15px;}
body.skin-sakura .nn-topbar{box-shadow:0 1px 0 #f0d0d8,0 4px 16px rgba(232,100,138,0.04)!important;}
body.skin-sakura .nn-sidebar{box-shadow:1px 0 0 #f0d0d8!important;}
body.skin-sakura button{letter-spacing:0.08em!important;font-variant:small-caps!important;font-size:12px!important;border:1px solid #f0d0d8!important;background:transparent!important;color:#2d2d42!important;transition:all 0.22s ease!important;}
body.skin-sakura button:not([disabled]):hover{border-color:#e8648a!important;color:#e8648a!important;background:rgba(232,100,138,0.05)!important;}
body.skin-sakura input,body.skin-sakura select,body.skin-sakura textarea{border:1px solid #f0d0d8!important;font-family:'Cormorant Garamond','Georgia',serif!important;}
body.skin-sakura input:focus,body.skin-sakura select:focus{border-color:#e8648a!important;box-shadow:0 0 0 2px rgba(232,100,138,0.15)!important;outline:none!important;}
body.skin-sakura ::-webkit-scrollbar{width:4px}body.skin-sakura ::-webkit-scrollbar-track{background:transparent}body.skin-sakura ::-webkit-scrollbar-thumb{background:#f0d0d8;border-radius:2px}body.skin-sakura ::-webkit-scrollbar-thumb:hover{background:#e8648a}
`,
},

obsidian:{
  name:"Obsidian", desc:"The default. JetBrains Mono, volcanic dark, crisp technical layout. Built for developers.",
  icon:"⬡", tags:["Dark","Technical","Monospace","Default"],
  palette:["#0d1117","#161b22","#58a6ff","#3fb950","#f78166"],
  vars:{
    ...BASE,
    "--bg":"#0d1117","--bg2":"#161b22","--bg3":"#21262d",
    "--border":"#30363d","--border2":"#21262d",
    "--text":"#e6edf3","--text2":"#c9d1d9","--text3":"#7d8590","--text4":"#484f58",
    "--accent":"#58a6ff","--accent2":"#1f6feb",
    "--success":"#3fb950","--danger":"#f78166",
    "--canvas-dot":"#21262d","--node-bg":"#161b22","--shadow":"rgba(0,0,0,0.5)",
    "--font-ui":"'JetBrains Mono','Fira Code',monospace",
    "--font-node":"'JetBrains Mono','Fira Code',monospace",
    "--font-weight-ui":"700","--font-weight-node":"600",
    "--letter-space":"0.3px","--line-height":"1.5",
    "--radius-xs":"4px","--radius-sm":"6px","--radius-md":"8px","--radius-lg":"10px",
    "--radius-node":"10px","--radius-btn":"6px",
    "--topbar-h":"48px","--node-header-h":"34px","--btn-pad":"5px 10px",
    "--node-pad":"8px 10px","--node-body-pad":"6px 10px 8px","--node-border-w":"2px",
    "--shadow-node":"0 2px 12px rgba(0,0,0,0.4)",
    "--shadow-node-sel":"0 0 0 3px rgba(88,166,255,0.25),0 6px 28px rgba(0,0,0,0.5)",
    "--shadow-card":"0 1px 6px rgba(0,0,0,.3)",
    "--transition-all":"all 0.12s",
    "--topbar-bg":"#161b22","--topbar-border":"1px solid #21262d","--topbar-blur":"none",
    "--sidebar-bg":"#161b22","--sidebar-border":"1px solid #21262d","--sidebar-blur":"none",
    "--card-blur":"none","--glow":"none",
  },
  bodyClass:"skin-obsidian",
  css:`
body.skin-obsidian{background:#0d1117;}
body.skin-obsidian ::-webkit-scrollbar{width:6px;height:6px}body.skin-obsidian ::-webkit-scrollbar-track{background:#0d1117}body.skin-obsidian ::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}body.skin-obsidian ::-webkit-scrollbar-thumb:hover{background:#484f58}
`,
},

};

export const SKIN_KEYS = Object.keys(SKINS);
