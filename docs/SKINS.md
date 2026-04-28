# NoNote — Skin-Only UI System

## Philosophy
Skin-only architecture. Skins own personality and palette together.

| Layer | File | Controls |
|---|---|---|
| **Skin** | `skins.js` + `SkinContext.jsx` | Palette tokens + font + radius + shadow + nav personality |
| **ThemeContext (shim)** | `ThemeContext.jsx` | Legacy compatibility only (`nm_theme` read/write); does not drive runtime palette |

> **Note:** The Design layer (spacing/density) was removed from the user-facing UI. `DesignContext.jsx` still exists and applies a fixed "clean" spacing baseline — it is no longer user-selectable.

## Application Order
1. `DesignContext.useEffect` → applies fixed spacing vars
2. `SkinContext.useEffect` (with `setTimeout(0)`) → applies palette + personality vars
3. Skin CSS contract from `skins.js` enforces uniform state roles

No runtime global theme mixing. Changing skin guarantees a consistent visual contract.

## Skin Variants
- Variants are palette presets inside a skin (example: `neumorphic` has `clay` and `dark`).
- Variant is persisted as `nn_skin_variant_<skinKey>`.
- Legacy `nm_theme` is migrated once into the active skin variant and then removed.

## Current Skins (11)

| Key | Name | Nav | Font | Default Theme |
|---|---|---|---|---|
| `obsidian` | Obsidian | top | JetBrains Mono | dark |
| `aurora` | Aurora | top | Inter | midnight |
| `brutalist` | Brutalist | bottom | Space Grotesk | dark |
| `neonTokyo` | Neon Tokyo | bottom | Rajdhani | ocean |
| `neumorphic` | Neumorphic | icon-dock | Nunito | clay |
| `sakura` | Sakura | icon-dock | Cormorant Garamond | cream |
| `vapor` | Vapor | editorial | VT323 | violet |
| `newspaper` | Newspaper | editorial | Playfair Display | parchment |
| `coral` | Coral | bottom | DM Sans | dark |
| `carbon` | Carbon | icon-dock | IBM Plex Mono | amber |
| `pastelPop` | Pastel Pop | bottom | Nunito Black | rose |

## Theme Compatibility

All 11 skins work correctly with all 13 themes. Adaptive techniques used:

| Skin | Technique |
|---|---|
| **Neumorphic** | `color-mix(in srgb, var(--bg) 78%, #000/fff)` derives shadow colors from any theme bg |
| **NeonTokyo** | Scanlines use `color-mix(in srgb, var(--text) 5%, transparent)` — readable on light and dark |
| **Vapor** | Grid lines use `color-mix(in srgb, var(--accent) 18%, transparent)` — always visible |
| **Carbon** | Texture uses `color-mix(in srgb, var(--text) 4%, transparent)` — visible on both |
| **Newspaper** | Card shadows use `var(--shadow)` — adapts between light/dark |
| All others | Already fully CSS-var-based, no hardcoded colors |

## Nav Layout Types
```
"top"       → Standard topbar + left sidebar
"bottom"    → Content fills screen + fixed 60px dock at bottom
"icon-dock" → 56px vertical icon column on left side
"editorial" → Full-width with centered topbar text
```

## Skin Definition Structure
```js
skinKey: {
  name: "Display Name",
  icon: "emoji",
  nav: "top" | "bottom" | "icon-dock" | "editorial",
  concept: "One-line personality description",
  tags: ["Tag1", "Tag2"],

  defaultTheme: "themeName",    // auto-applied on skin switch
  defaultAccent: { accent: "#hex", accent2: "#hex" },  // optional

  accentOptions: [
    { name: "Label", accent: "#hex", accent2: "#hex" },
    // 5 entries shown in Appearance > Skins tab
  ],

  vars: {
    // ONLY: font, radius, shadow, transition, topbar/sidebar bg/border
    "--font-ui": "...",
    "--radius-xs": "...",
    "--shadow-node": "...",
    "--topbar-bg": "var(--bg2)",  // use CSS vars, never hex!
  },

  bodyClass: "skin-kebab-name",  // added to <body>

  css: `
    /* Injected into <style id="nn-skin-css"> */
    /* ALWAYS use var(--accent), var(--bg), color-mix() — never hardcode colors */
    body.skin-name button:hover { ... }
  `,
}
```

## Current Themes (13)

### Dark (6)
| Key | Name | Character |
|---|---|---|
| `dark` | Dark | GitHub Dark |
| `midnight` | Midnight | Tokyo Night indigo |
| `forest` | Forest | Deep forest teal |
| `ocean` | Ocean | Deep abyss cyan |
| `amber` | Amber | Volcanic warm amber |
| `violet` | Violet | Dracula purple |

### Light (7)
| Key | Name | Notes |
|---|---|---|
| `light` | Light | Clean crisp white |
| `cream` | Cream | Warm terracotta |
| `sepia` | Sepia | Vintage brown |
| `rose` | Rose | Vibrant pink |
| `softblue` | Soft Blue | Airy sky blue |
| `mint` | Mint | Fresh green |
| `parchment` | Parchment | Medieval manuscript |
| `clay` | Clay | Neumorphic default — provides `--neu-dark`/`--neu-light` vars |

## Adding a New Skin — Checklist
1. Add entry to `SKINS` in `skins.js`
2. Set `nav` type
3. Set `defaultTheme` + optional `defaultAccent`
4. Set 5 `accentOptions`
5. In `vars`: only set font/radius/shadow/topbar-bg vars
6. In `css`: use `var(--accent)`, `var(--bg)`, `color-mix()` — never hardcode hex
7. `bodyClass`: unique `skin-kebab-name`
8. Test with dark, light, and clay themes minimum

## Adding a New Theme — Checklist
1. Add entry to `THEMES` in `ThemeContext.jsx`
2. Set all required vars: `--bg`, `--bg2`, `--bg3`, `--border`, `--border2`, `--text`, `--text2`, `--text3`, `--text4`, `--accent`, `--accent2`, `--success`, `--danger`, `--canvas-dot`, `--node-bg`, `--shadow`
3. For themes intended for Neumorphic: add `--neu-dark`/`--neu-light` (optional — neumorphic now derives these via `color-mix` as fallback)
4. Test with all 11 skins
