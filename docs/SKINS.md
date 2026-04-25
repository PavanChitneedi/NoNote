# NoNote — Skin / Theme / Design System

## Philosophy
Three independent layers. Any combination works.

| Layer | File | Controls | Never touches |
|---|---|---|---|
| **Theme** | `ThemeContext.jsx` | Colors only | Fonts, spacing |
| **Design** | `DesignContext.jsx` | Spacing/density only | Fonts, radius, colors |
| **Skin** | `skins.js` + `SkinContext.jsx` | Font, radius, shadow, effects, nav layout | Colors, spacing |

## Application Order
1. `ThemeContext.useEffect` → applies color vars
2. `DesignContext.useEffect` → applies spacing vars
3. `SkinContext.useEffect` (with `setTimeout(0)`) → applies personality vars LAST

Skin vars **always win** over theme/design on their variables. When theme/design change, SkinContext listens to `nn-theme-changed` / `nn-design-changed` events and re-applies personality vars on top.

## Current Skins (11)

| Key | Name | Nav | Font | Character |
|---|---|---|---|---|
| `obsidian` | Obsidian | top | JetBrains Mono | GitHub Dark developer tool |
| `aurora` | Aurora | top | Inter | Deep space glassmorphism |
| `brutalist` | Brutalist | bottom | Space Grotesk | Raw, confrontational, yellow on black |
| `neonTokyo` | Neon Tokyo | bottom | Rajdhani | Cyberpunk, CRT scanlines, neon glow |
| `neumorphic` | Neumorphic | icon-dock | Nunito | Soft clay 3D, dual-direction shadows |
| `sakura` | Sakura | icon-dock | Cormorant Garamond | Japanese minimal, Ma space |
| `vapor` | Vapor | editorial | VT323 | 80s vaporwave, grid lines |
| `newspaper` | Newspaper | editorial | Playfair Display | NYT editorial serif |
| `coral` | Coral | bottom | DM Sans | Miami tropical, bouncy |
| `carbon` | Carbon | icon-dock | IBM Plex Mono | Industrial, carbon fiber |
| `pastelPop` | Pastel Pop | bottom | Nunito Black | Kawaii, spring physics |

## Nav Layout Types
```
"top"       → Standard topbar + left sidebar (Dashboard shows sidebar nav)
"bottom"    → Content fills screen + fixed 60px dock at bottom
"icon-dock" → 56px vertical icon column on left side
"editorial" → Full-width with centered topbar text
```

Dashboard.jsx checks `skinNav` prop:
- `skinNav === "top"` → render full sidebar
- `skinNav !== "top"` → render compact nav strip (Maps/Live tabs inline)

## Skin Definition Structure
```js
skinKey: {
  name: "Display Name",
  icon: "emoji",
  nav: "top" | "bottom" | "icon-dock" | "editorial",
  concept: "One-line personality description",
  tags: ["Tag1", "Tag2"],  // shown in picker cards

  defaultTheme: "themeName",   // auto-applied on skin switch
  defaultDesign: "designName", // auto-applied on skin switch
  defaultAccent: { accent: "#hex", accent2: "#hex" }, // auto-applied on switch

  accentOptions: [
    { name: "Label", accent: "#hex", accent2: "#hex" },
    // 5 entries — shown in Appearance > Skins tab
  ],

  vars: {
    // ONLY: font, radius, shadow, transition, topbar-bg/border/blur, sidebar-bg/border
    "--font-ui": "...",
    "--radius-xs": "...",
    "--shadow-node": "...",
    "--topbar-bg": "var(--bg2)",   // use CSS vars, not hex!
    // etc.
  },

  bodyClass: "skin-kebab-name",  // added to <body>

  css: `
    /* Injected into <style id="nn-skin-css"> */
    /* ALWAYS use var(--accent), var(--bg), etc. — never hardcode colors */
    body.skin-name button:hover { ... }
  `,
}
```

## Current Themes (13)

### Dark (6)
| Key | Name | Character |
|---|---|---|
| `dark` | Dark | GitHub Dark — the classic |
| `midnight` | Midnight | Tokyo Night indigo |
| `forest` | Forest | Deep forest with teal accent |
| `ocean` | Ocean | Deep abyss cyan |
| `amber` | Amber | Volcanic warm amber terminal |
| `violet` | Violet | Dracula-inspired purple |

### Light (7)
| Key | Name | Character |
|---|---|---|
| `light` | Light | Clean crisp white |
| `cream` | Cream | Warm terracotta parchment |
| `sepia` | Sepia | Vintage editorial brown |
| `rose` | Rose | Vibrant rose pink |
| `softblue` | Soft Blue | Airy sky blue |
| `mint` | Mint | Fresh garden green |
| `parchment` | Parchment | Medieval manuscript |
| `clay` | Clay | **Neumorphic default** — exact v5.34.3 colors with `--neu-dark`/`--neu-light` |

## Current Designs (5)
| Key | Name | Feel |
|---|---|---|
| `workspace` | Workspace | Dense, tight, original dev feel |
| `clean` | Clean | Spacious, Notion-like |
| `comfort` | Comfort | Extra breathing room |
| `professional` | Professional | Balanced corporate |
| `minimal` | Minimal | Ultra-sparse, max focus |

Designs set **only**: `--topbar-h`, `--node-header-h`, `--node-pad`, `--node-body-pad`, `--btn-pad`, `--sidebar-w`, `--props-w`, `--node-border-w`, `--line-height`, `--letter-space`.

## Special CSS Variables
- `--neu-dark`, `--neu-light`: Required by Neumorphic skin. The clay theme provides exact values (`#bec7d8`, `#f4faff`). Other light themes have contextually appropriate fallbacks. Dark themes don't define these — neumorphic looks flat on dark (correct physics).
- `--topbar-bg`/`--topbar-blur`: Allows skin to make topbar frosted glass (Aurora) or accent-colored (Newspaper)
- `--shadow-node`/`--shadow-node-sel`: Node shadow + selected state — skin defines style, theme provides `var(--shadow)` color

## Adding a New Skin — Checklist
1. Add entry to `SKINS` in `skins.js`
2. Set `nav` type (determines which App.jsx shell renders)
3. Set `defaultTheme` + `defaultDesign` + `defaultAccent`
4. Set 5 `accentOptions`
5. In `vars`: only set font/radius/shadow/topbar-bg vars
6. In `css`: only use `var(--accent)`, `var(--bg)`, etc. — never hardcode hex
7. `bodyClass`: unique `skin-kebab-name`
8. Build + test all 13 themes with the new skin
9. Test all 5 designs with the new skin

## Adding a New Theme — Checklist
1. Add entry to `THEMES` in `ThemeContext.jsx`
2. Set all color vars: `--bg`, `--bg2`, `--bg3`, `--border`, `--border2`, `--text`, `--text2`, `--text3`, `--text4`, `--accent`, `--accent2`, `--success`, `--danger`, `--canvas-dot`, `--node-bg`, `--shadow`
3. For light themes, consider adding `--neu-dark`/`--neu-light` for Neumorphic compatibility
4. Test with all 11 skins

## SkinContext Events
```js
// Fired by ThemeContext after applying theme vars
window.dispatchEvent(new CustomEvent("nn-theme-changed", { detail: themeName }))

// Fired by DesignContext after applying design vars
window.dispatchEvent(new CustomEvent("nn-design-changed", { detail: designName }))

// Listened to by ThemeContext (from SkinContext on switch)
window.dispatchEvent(new CustomEvent("nn-set-theme", { detail: "themeName" }))

// Listened to by DesignContext (from SkinContext on switch)
window.dispatchEvent(new CustomEvent("nn-set-design", { detail: "designName" }))
```
