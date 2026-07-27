# NoNote — Skin & Theme System

## Philosophy
Three independent layers, though in practice only two are currently reachable from the UI.

| Layer | File | Controls | Never touches |
|---|---|---|---|
| **Theme** | `ThemeContext.jsx` | Colors only | Fonts, spacing |
| **Skin** | `skins.js` + `SkinContext.jsx` | Font, radius, shadow, transitions, topbar/sidebar surface | Colors |
| **Design** | `DesignContext.jsx` | Spacing/density only | Colors, fonts | Colors, fonts |

> **Design is defined but currently unreachable from the UI.** `DesignContext.jsx` still defines 5 named presets (Workspace/Clean/Comfort/Professional/Minimal) with a fully working `setDesignName`/`nn-set-design` switching mechanism — but nothing in the current codebase calls it. Skins used to carry a `defaultDesign` field that auto-applied a design on skin switch (see `changelog.js`, "Removed: defaultDesign auto-apply on skin switch"); that field no longer exists on any skin, and `ThemePicker.jsx` has no Design tab. Every user silently gets `DesignContext`'s hardcoded fallback (`"workspace"`) with no way to change it. The mechanism is live code, not dead code — it would work immediately if something called `setDesignName()` — it's just currently unreferenced.

## Application Order
1. `ThemeContext.useEffect` → applies color vars
2. `DesignContext.useEffect` → applies spacing vars (always `workspace`, per above)
3. `SkinContext.useEffect` (with `setTimeout(0)`) → applies personality vars LAST

Skin vars **always win** over theme on their variables. `SkinContext` re-applies personality vars whenever `nn-theme-changed` or `nn-design-changed` fires, so switching either underneath it doesn't lose the active skin's look.

## Current Skins (7)

All 7 currently use `nav: "top"` — there is no more per-skin nav layout variation (see "What changed" below).

| Key | Name | Default Theme | Font | Notes |
|---|---|---|---|---|
| `clean` | Clean | `arctic` | Inter | Default skin (`SkinContext`'s hardcoded fallback) |
| `rounded` | Rounded | `sakura` | Nunito | Warm, generous radii |
| `sharp` | Sharp | `void` | JetBrains Mono | `extra: true` — dev-tool aesthetic |
| `glass` | Glass | `midnight` | Inter | Frosted/backdrop-blur topbar + sidebar |
| `editorial` | Editorial | `amber` | Georgia (serif) | `extra: true` — reading-first |
| `industrial` | Industrial | `industrialDark` | Inter | Thin borders, near-zero shadow |
| `neutralIndustrial` | Neutral Industrial | `neutralIndustrialDark` | Inter | Flattest of all — Proxmox/TrueNAS-inspired |

The `extra: true` flag exists on some skins and themes (`sharp`, `editorial` skins; `amber`, `emerald`, `rose`, `void` themes) — check `ThemePicker.jsx`/`SkinContext.jsx` for current gating behavior before assuming what it does; it isn't just decorative.

## Nav Layout Types — mostly historical

Older versions supported `"top" | "bottom" | "icon-dock" | "editorial"` nav layouts per skin. Every skin currently defined uses `"top"` — the other three layout modes may still be supported by the surrounding layout code, but nothing in `skins.js` currently exercises them. Don't assume `bottom`/`icon-dock`/`editorial` nav is reachable without checking `App.jsx`'s nav-shell logic first.

## Skin Definition Structure (current shape)
```js
skinKey: {
  name: "Display Name",
  icon: "glyph",
  nav: "top",                  // only value in use currently
  desc: "One-line personality description",

  defaultTheme: "themeName",   // auto-applied on skin switch, via the
                                // nn-set-theme event — NOT via the
                                // localStorage write in setSkinName,
                                // which writes to the wrong key ("nm_theme"
                                // instead of "nn_theme") and is a no-op;
                                // the event dispatch is what actually works

  extra: true,                 // optional — gates something in the UI,
                                // verify current behavior before relying on it

  vars: {
    // font, radius, shadow, transition, topbar/sidebar bg/border — never colors
    "--font-ui": "...",
    "--radius-xs": "...",
    "--shadow-node": "...",
    "--topbar-bg": "var(--bg2)",  // use CSS vars or color-mix(), never hex!
  },

  bodyClass: "skin-kebab-name",  // added to <body>

  css: `
    /* Injected into <style id="nn-skin-css"> */
    /* ALWAYS use var(--accent), var(--bg), color-mix() — never hardcode colors */
    body.skin-name button:hover { ... }
  `,
}
```

There is currently **no accent-picker system** — no `accentOptions`, no `defaultAccent`, no per-skin accent override. `SkinContext.jsx` only manages `skinName`, applies `skin.vars`/`skin.css`/`skin.bodyClass`, and dispatches the default-theme switch. If earlier docs or code comments mention accent pickers, that feature has been removed.

## Current Themes (11)

### Dark (7)
| Key | Name | Character | Notes |
|---|---|---|---|
| `slate` | Slate | Linear.app-inspired professional dark | |
| `amber` | Amber | Bear/Obsidian-inspired warm amber | `extra: true` |
| `midnight` | Midnight | Raycast-inspired deep navy | |
| `emerald` | Emerald | Supabase-inspired dark + emerald accent | `extra: true` |
| `void` | Void | Warp terminal-inspired near-black | `extra: true` |
| `industrialDark` | Industrial Dark | Primary long-session dark theme, ~90% grayscale | |
| `neutralIndustrialDark` | Neutral Industrial | Proxmox/TrueNAS/DSM-inspired, muted material accents | |

### Light (4)
| Key | Name | Character | Notes |
|---|---|---|---|
| `arctic` | Arctic | Vercel/Tailwind-inspired crisp cool white | |
| `sakura` | Sakura | Craft.do-inspired warm cream-rose | |
| `rose` | Rose | Superhuman-inspired warm energetic | `extra: true` |
| `neutralIndustrialLight` | Neutral Industrial Light | Light counterpart to Neutral Industrial | |

Note: `ThemeContext.jsx`'s own top-of-file comment still says "8 Carefully designed themes" — that's stale in the source itself (11 are actually defined), not just in docs.

## Adding a New Skin — Checklist
1. Add entry to `SKINS` in `skins.js`
2. Set `defaultTheme`
3. In `vars`: only set font/radius/shadow/transition/topbar-bg/sidebar-bg vars — never colors
4. In `css`: use `var(--accent)`, `var(--bg)`, `color-mix()` — never hardcode hex
5. `bodyClass`: unique `skin-kebab-name`
6. Test with at least one dark and one light theme

## Adding a New Theme — Checklist
1. Add entry to `THEMES` in `ThemeContext.jsx`
2. Set `group: "Dark"` or `"Light"` and all required vars: `--bg`, `--bg2`, `--bg3`, `--border`, `--border2`, `--text`, `--text2`, `--text3`, `--text4`, `--accent`, `--accent2`, `--success`, `--danger`, `--warn`, `--canvas-dot`, `--node-bg`, `--shadow`
3. Test with all 7 skins

## What changed since this doc was last accurate

This file previously described an 11-skin (Obsidian/Aurora/Brutalist/NeonTokyo/Neumorphic/Sakura/Vapor/Newspaper/Coral/Carbon/PastelPop), 13-theme system with 4 nav layout types and a 5-accent-per-skin picker. None of that exists in the current code — it was fully replaced by the system documented above. If you find references elsewhere (comments, other docs, old changelog entries) to skin names like "Obsidian" or "Vapor," they're historical, not current.
