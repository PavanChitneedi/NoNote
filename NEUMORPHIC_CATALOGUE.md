# NoNote — Neumorphic UI Design Catalogue
*Single source of truth for the neumorphic skin system.*
*Version: v5.43.1 | Updated: Apr 2026*

## Design Tokens (body.skin-neumorphic)

### Shadow Scale
| Token | Usage | Value |
|-------|-------|-------|
| `--nEl` | Cards, modals, popups | 9px 9px 22px shadow, -7px -7px 16px hilight |
| `--nEm` | Button hover, dropdown | 6px 6px 14px shadow, -5px -5px 10px hilight |
| `--nEs` | Buttons default, small cards | 4px 4px 9px shadow, -3px -3px 6px hilight |
| `--nEx` | Micro elements, tiny lift | 2px 2px 5px shadow, -2px -2px 3px hilight |
| `--nIl` | Input focus, large inset | inset 5px 5px 12px shadow, -4px -4px 8px hilight |
| `--nIm` | Inputs default, wells | inset 3px 3px 7px shadow, -2px -2px 5px hilight |
| `--nIs` | Small inset, toggle tracks | inset 2px 2px 6px shadow, -2px -2px 4px hilight |
| `--nIx` | Active tab, xsmall inset | inset 1px 1px 4px shadow, -1px -1px 3px hilight |

### Color Tokens
| Token | Value | Notes |
|-------|-------|-------|
| `--neu-shadow` | `color-mix(bg 82%, black)` | Shadow side — skin-owned |
| `--neu-hilight` | `color-mix(bg 35%, white)` | Highlight side — near-white on light themes |
| `--nRl` | 16px | Large radius |
| `--nRm` | 12px | Medium radius |
| `--nRs` | 8px | Small radius |
| `--nRx` | 6px | Xsmall radius |

---

## Component Catalogue

### 1. NODE CARDS (.nn-node)
- **Surface**: `var(--node-bg)` — slightly lighter than canvas bg
- **Default**: `box-shadow: var(--shadow-node)` = `var(--nEl)`
- **Selected**: `box-shadow: var(--shadow-node-sel)` = `var(--nEl)` + accent ring
- **Border**: none (shadow-only depth)
- **Radius**: `var(--radius-node)` = 16px

#### Node Internal Buttons (pencil, comment, collapse, add-note)
- **Default**: transparent, no shadow
- **Hover**: `var(--bg)` surface, `var(--nEx)` lift
- **Active**: `var(--nIx)` inset

#### Node Inline Input (title, quick-rename)
- **Surface**: transparent (inherits node-bg)
- **Border**: none
- **Focus**: accent color border only

---

### 2. CANVAS TOOLBAR (data-tut="topbar-row1" + sibling div)
- **Container**: inset trough — `inset 0 3px 9px shadow, 0 1px 3px hilight`
- **Toolbar buttons** (flat in trough):
  - Default: `transparent`, no shadow, `color: var(--text2)`, radius 6px
  - Hover: `var(--bg)` surface, `var(--nEx)` tiny raise
  - Active (accent2/success bg): `var(--nIx)` inset + tinted text
  - Disabled: 35% opacity

#### Toolbar Dropdown Panels (connection type, layout)
- **Panel**: `var(--nEl)` raised, `var(--nRm)` radius, `var(--bg)` surface
- **Header rows**: shadow seam below (`0 2px 5px shadow`)
- **List items**: hover = `var(--bg)` + `var(--nEx)` (no color-tint hover)
- **Active item**: `var(--nIs)` inset OR accent border

#### Connection Style Picker (z-index 501)
- **Container**: `var(--nEl)`, `var(--nRm)`, `var(--bg)` surface
- **Style item hover**: `var(--bg)` + `var(--nEx)` (NOT bg3 color change)
- **Color swatches**: raised circles `var(--nEx)`
- **Reset button**: ghost raised `var(--nEx)`

---

### 3. APP TOPBAR (.nn-topbar, all nav layouts)
- **Surface**: `var(--bg)`, shadow seam `0 4px 10px shadow`
- **Icon buttons**: flat, transparent, hover = `var(--bg)` + `var(--nEx)`
- **Avatar circle**: raised `var(--nEx)`
- **Badge/pill**: raised `var(--nEx)`

---

### 4. INLINE NODE POPUP (z-index 200)
- **Outer card**: `var(--nEl)`, 18px radius, `var(--bg)` surface
- **Header row**: same surface + `0 3px 8px shadow` bottom seam
- **Description input**: transparent bg, no shadow (inherits)
- **Tab bar**: inset trough `inset 0 2px 6px shadow`
  - Inactive tab: transparent, flat
  - Hover tab: `var(--bg)` + `var(--nEx)`
  - Active tab: `var(--nEs)` raised pop-out, accent text color
- **Scroll body**: `var(--bg)`, no shadow
- **Property inputs**: `var(--nIm)` inset wells
- **Inner cards** (bg3): `var(--nEs)` raised
- **Toggle row** (bg3 + padding): `var(--nIs)` inset pill
- **CTA button** (ADD NOTE): accent2 fill + `var(--nEs)` lift

---

### 5. SIDEBAR (.nn-sidebar)
- **Surface**: `var(--bg)`, right-edge shadow seam
- **Section labels** (NOTES, PLANNING): flat text, no bg
- **Node type rows**: hover = `var(--bg)` + `var(--nEx)` (no bg3)
- **Compact toggle/buttons**: `var(--nEs)` raised

---

### 6. BUTTONS (all contexts)
| State | Surface | Shadow | Transform |
|-------|---------|--------|-----------|
| Default | `var(--bg)` | `--nEs` | none |
| Hover | `var(--bg)` | `--nEm` | `translateY(-1px)` |
| Active/click | `var(--bg)` | `--nIs` | none |
| Selected (accent2 bg) | `var(--bg)` | `--nIs` | none, tinted text |
| Disabled | `var(--bg)` | `--nEx` | none, 40% opacity |
| CTA (white text) | `var(--accent2)` | `--nEs` | hover: `--nEm` |

---

### 7. INPUTS / SELECT / TEXTAREA
- **Surface**: `var(--bg)`
- **Default**: `var(--nIm)` inset well, `var(--nRm)` radius
- **Focus**: `var(--nIl)` deeper + `2px accent44` ring
- **Disabled**: 50% opacity

---

### 8. MODALS (maxWidth panels, overlay dialogs)
- **Surface**: `var(--bg)`, `var(--nEl)`, 20px radius
- **Overlay backdrop**: `rgba(0,0,0,0.75)` — backdrop NOT neumorphic
- **Header**: bottom shadow seam
- **Scroll body**: same surface
- **Close button**: transparent, hover = `var(--bg)` + `var(--nEx)`

---

### 9. DROPDOWNS / CONTEXT MENUS (z-index 501/601)
- **Surface**: `var(--bg)`, `var(--nEm)` raised, `var(--nRm)` radius
- **List items**: hover = `var(--bg)` + `var(--nEx)` — NEVER bg-color change
- **Section headers**: `0 2px 5px shadow` bottom seam
- **Dividers**: shadow seam, no visible line

---

### 10. DASHBOARD MAP CARDS (.nn-map-card / .nn-map-list-row)
- **Card**: `var(--nEs)` raised + accent top stripe
- **Hover**: `var(--nEl)` elevated + `translateY(-2px)`
- **List row**: `var(--nEx)` raised
- **Action buttons** (on hover): `var(--nEx)` raised, hover `var(--nEs)`

---

### 11. RICH TEXT EDITOR (note editor)
- **Container**: `var(--nIm)` inset well
- **Toolbar bar**: `0 3px 6px shadow` bottom seam
- **Format buttons**: `var(--nEx)` raised, active = `var(--nIx)` inset

---

### 12. TOGGLE CONTROLS
- **Track** (bg3 + padding): `var(--nIs)` inset trough
- **Thumb** (active): raised with accent color

---

### 13. SCROLLBARS
- **Track**: inset `1px shadow`, rounded
- **Thumb**: `var(--neu-shadow)` color, rounded

---

### 14. KEYBOARD / KBD ELEMENTS
- **Surface**: `var(--bg)`, `var(--nEs)` raised, `var(--nRx)` radius

---

### 15. NODE ANCHOR POINTS (connection anchors)
- **Dot**: `var(--bg)` + `var(--nEx)`, accent border on hover

---

## Enforcement Rules
1. **NEVER** use `background: var(--bg3)` for hover state → use `var(--bg)` + shadow
2. **NEVER** use `onMouseEnter` to set `style.background = 'var(--bg3)'` → use CSS
3. **NEVER** use `rgba(0,0,0,.5)` box-shadow → use `var(--neu-shadow)` tokens
4. **NEVER** add `border` instead of shadow for separation
5. Surface color MUST be `var(--bg)` for all non-CTA interactive elements
6. Elevation tokens MUST come from the `--nEl/nEm/nEs/nEx/nIl/nIm/nIs/nIx` scale

