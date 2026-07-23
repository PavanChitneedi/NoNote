// SKINS — personality layer: fonts, radii, shadows, motion
// Colors come from ThemeContext. Skins only set HOW things feel, not what color they are.

export const SKINS = {

  // 1. Clean — Linear / Notion. The default. Modern, balanced, universal.
  clean: {
    name: "Clean", icon: "◻", nav: "top",
    desc: "Modern and balanced — works with everything",
    defaultTheme: "arctic",
    vars: {
      "--font-ui":   "'Inter', 'Segoe UI Variable', system-ui, -apple-system, sans-serif",
      "--font-node": "'Inter', 'Segoe UI Variable', system-ui, sans-serif",
      "--font-mono": "ui-monospace, 'Cascadia Code', 'Fira Code', Consolas, monospace",
      "--font-weight-ui": "500", "--font-weight-node": "600",
      "--letter-space": "0.01em", "--line-height": "1.6",
      "--radius-xs": "5px", "--radius-sm": "8px", "--radius-md": "12px",
      "--radius-lg": "16px", "--radius-node": "12px", "--radius-btn": "8px",
      "--shadow-node": "0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
      "--shadow-node-hover": "0 3px 8px rgba(0,0,0,0.15), 0 8px 28px rgba(0,0,0,0.1)",
      "--shadow-node-sel": "0 0 0 2px var(--accent), 0 0 16px var(--accent)30, 0 8px 32px rgba(0,0,0,0.15)",
      "--shadow-panel": "0 4px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
      "--transition-all": "all 0.14s cubic-bezier(0.16, 1, 0.3, 1)",
      "--topbar-bg": "var(--bg2)", "--topbar-border": "1px solid var(--border)",
      "--topbar-blur": "none", "--sidebar-bg": "var(--bg2)",
      "--sidebar-border": "1px solid var(--border)",
    },
    bodyClass: "skin-clean",
    css: `
body.skin-clean input:focus, body.skin-clean textarea:focus, body.skin-clean select:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 3px var(--accent)22 !important;
  outline: none;
}
body.skin-clean button:not([disabled]):active { transform: scale(0.96); }
body.skin-clean .nn-map-card {
  border: 1px solid var(--border2);
  border-top: 3px solid var(--ca, var(--accent));
  border-radius: 12px;
  transition: transform 0.14s cubic-bezier(0.16,1,0.3,1), box-shadow 0.14s;
}
body.skin-clean .nn-map-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}
body.skin-clean .nn-node { transition: transform 0.14s cubic-bezier(0.16,1,0.3,1), box-shadow 0.14s; }
body.skin-clean .nn-node:hover { transform: translateY(-2px); }
    `.trim(),
  },

  // 2. Rounded — Craft.do / Framer. Warm, human, generous curves.
  rounded: {
    name: "Rounded", icon: "◯", nav: "top",
    desc: "Warm and human — like Craft.do",
    defaultTheme: "sakura",
    vars: {
      "--font-ui":   "'Nunito', 'Segoe UI', system-ui, sans-serif",
      "--font-node": "'Nunito', system-ui, sans-serif",
      "--font-mono": "ui-monospace, 'Fira Code', Consolas, monospace",
      "--font-weight-ui": "600", "--font-weight-node": "700",
      "--letter-space": "0.01em", "--line-height": "1.65",
      "--radius-xs": "8px", "--radius-sm": "12px", "--radius-md": "18px",
      "--radius-lg": "24px", "--radius-node": "18px", "--radius-btn": "12px",
      "--shadow-node": "0 2px 8px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08)",
      "--shadow-node-hover": "0 4px 16px rgba(0,0,0,0.14), 0 12px 40px rgba(0,0,0,0.1)",
      "--shadow-node-sel": "0 0 0 3px var(--accent)44, 0 8px 40px rgba(0,0,0,0.15)",
      "--shadow-panel": "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
      "--transition-all": "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
      "--topbar-bg": "var(--bg2)", "--topbar-border": "1px solid var(--border)",
      "--topbar-blur": "none", "--sidebar-bg": "var(--bg2)",
      "--sidebar-border": "1px solid var(--border)",
    },
    bodyClass: "skin-rounded",
    css: `
body.skin-rounded input:focus, body.skin-rounded textarea:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 4px var(--accent)20 !important;
  outline: none;
}
body.skin-rounded button:not([disabled]):active { transform: scale(0.94); }
body.skin-rounded .nn-map-card {
  border: 2px solid var(--border2);
  border-radius: 20px;
  transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
}
body.skin-rounded .nn-map-card:hover { transform: translateY(-3px) scale(1.01); }
body.skin-rounded .nn-node { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s; }
body.skin-rounded .nn-node:hover { transform: translateY(-3px); }
    `.trim(),
  },

  // 3. Sharp — Warp / VSCode. Developer tool. Precise, dense, mono.
  sharp: {
    extra: true,
    name: "Sharp", icon: "◼", nav: "top",
    desc: "Developer tool — like Warp or VSCode",
    defaultTheme: "void",
    vars: {
      "--font-ui":   "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
      "--font-node": "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
      "--font-mono": "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
      "--font-weight-ui": "500", "--font-weight-node": "600",
      "--letter-space": "0.02em", "--line-height": "1.5",
      "--radius-xs": "2px", "--radius-sm": "3px", "--radius-md": "4px",
      "--radius-lg": "6px", "--radius-node": "4px", "--radius-btn": "4px",
      "--shadow-node": "0 0 0 1px var(--border), 2px 2px 0 var(--border2)",
      "--shadow-node-hover": "0 0 0 1px var(--accent)88, 3px 3px 0 var(--accent)44",
      "--shadow-node-sel": "0 0 0 2px var(--accent), 4px 4px 0 var(--accent)44",
      "--shadow-panel": "0 0 0 1px var(--border), 4px 4px 0 var(--border2)",
      "--transition-all": "all 0.08s linear",
      "--topbar-bg": "var(--bg)", "--topbar-border": "1px solid var(--border)",
      "--topbar-blur": "none", "--sidebar-bg": "var(--bg)",
      "--sidebar-border": "1px solid var(--border)",
    },
    bodyClass: "skin-sharp",
    css: `
body.skin-sharp input:focus, body.skin-sharp textarea:focus {
  border-color: var(--accent) !important;
  outline: 1px solid var(--accent);
  box-shadow: none !important;
}
body.skin-sharp button:not([disabled]):hover { background: var(--bg3) !important; }
body.skin-sharp .nn-map-card {
  border: 1px solid var(--border);
  border-left: 3px solid var(--ca, var(--accent));
  border-radius: 3px;
}
body.skin-sharp .nn-map-card:hover { border-color: var(--accent); }
body.skin-sharp .nn-node { transition: none; }
body.skin-sharp .nn-node:hover { transform: none; box-shadow: 0 0 0 2px var(--accent)88 !important; }
    `.trim(),
  },

  // 4. Glass — Arc browser / Raycast. Frosted, premium, glowing.
  glass: {
    name: "Glass", icon: "◈", nav: "top",
    desc: "Premium frosted glass — like Arc or Raycast",
    defaultTheme: "midnight",
    vars: {
      "--font-ui":   "'Inter', system-ui, -apple-system, sans-serif",
      "--font-node": "'Inter', system-ui, sans-serif",
      "--font-mono": "ui-monospace, 'Cascadia Code', Consolas, monospace",
      "--font-weight-ui": "500", "--font-weight-node": "600",
      "--letter-space": "-0.01em", "--line-height": "1.6",
      "--radius-xs": "8px", "--radius-sm": "12px", "--radius-md": "16px",
      "--radius-lg": "22px", "--radius-node": "16px", "--radius-btn": "10px",
      "--shadow-node": "0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
      "--shadow-node-hover": "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
      "--shadow-node-sel": "0 0 0 2px var(--accent), 0 0 24px var(--accent)50, 0 8px 40px rgba(0,0,0,0.4)",
      "--shadow-panel": "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      "--transition-all": "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      "--topbar-bg": "color-mix(in srgb, var(--bg2) 70%, transparent)",
      "--topbar-border": "1px solid rgba(255,255,255,0.08)",
      "--topbar-blur": "blur(20px)",
      "--sidebar-bg": "color-mix(in srgb, var(--bg) 75%, transparent)",
      "--sidebar-border": "1px solid rgba(255,255,255,0.06)",
    },
    bodyClass: "skin-glass",
    css: `
body.skin-glass .nn-topbar { backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important; }
body.skin-glass .nn-sidebar { backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; }
body.skin-glass input:focus, body.skin-glass textarea:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 3px var(--accent)30, 0 0 12px var(--accent)20 !important;
  outline: none;
}
body.skin-glass button:not([disabled]):hover { box-shadow: 0 0 12px var(--accent)30 !important; }
body.skin-glass .nn-map-card {
  background: color-mix(in srgb, var(--node-bg) 80%, transparent) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.08);
  border-top: 3px solid var(--ca, var(--accent));
  border-radius: 16px;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s;
}
body.skin-glass .nn-map-card:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(0,0,0,0.4); }
body.skin-glass .nn-node { transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s; }
body.skin-glass .nn-node:hover { transform: translateY(-2px); }
    `.trim(),
  },

  // 5. Editorial — Notion docs / Bear. Serif titles, calm, reading-first.
  editorial: {
    extra: true,
    name: "Editorial", icon: "✦", nav: "top",
    desc: "Reading-first — like Notion or Bear",
    defaultTheme: "amber",
    vars: {
      "--font-ui":   "'Georgia', 'Times New Roman', serif",
      "--font-node": "'Georgia', serif",
      "--font-mono": "ui-monospace, 'Fira Code', Consolas, monospace",
      "--font-weight-ui": "400", "--font-weight-node": "700",
      "--letter-space": "0.01em", "--line-height": "1.75",
      "--radius-xs": "3px", "--radius-sm": "5px", "--radius-md": "8px",
      "--radius-lg": "10px", "--radius-node": "8px", "--radius-btn": "5px",
      "--shadow-node": "0 1px 4px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
      "--shadow-node-hover": "0 4px 12px rgba(0,0,0,0.2), 0 8px 28px rgba(0,0,0,0.1)",
      "--shadow-node-sel": "0 0 0 2px var(--accent), 0 8px 32px rgba(0,0,0,0.15)",
      "--shadow-panel": "0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
      "--transition-all": "all 0.16s ease-out",
      "--topbar-bg": "var(--bg)", "--topbar-border": "1px solid var(--border)",
      "--topbar-blur": "none", "--sidebar-bg": "var(--bg)",
      "--sidebar-border": "1px solid var(--border)",
    },
    bodyClass: "skin-editorial",
    css: `
body.skin-editorial input:focus, body.skin-editorial textarea:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  outline: none;
}
body.skin-editorial .nn-map-card {
  border: 1px solid var(--border);
  border-bottom: 3px solid var(--ca, var(--accent));
  border-radius: 6px;
  transition: transform 0.16s ease-out, box-shadow 0.16s;
}
body.skin-editorial .nn-map-card:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
body.skin-editorial .nn-node { transition: transform 0.16s ease-out, box-shadow 0.16s; }
body.skin-editorial .nn-node:hover { transform: translateY(-1px); }
    `.trim(),
  },
};

export const SKIN_KEYS = Object.keys(SKINS);
