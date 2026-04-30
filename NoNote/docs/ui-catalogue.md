**Version:** v5.43.2 | **Updated:** Apr 2026
**Source of truth** — every change MUST update this file.

## Token Reference

### Elevation (box-shadow)
| Token | Pixels | Use |
|---|---|---|
| `--nEl` | 9/9/22 raised | Modals, cards, large panels |
| `--nEm` | 6/6/14 raised | Button hover, dropdowns |
| `--nEs` | 4/4/9 raised | Buttons default, small cards |
| `--nEx` | 2/2/5 raised | Micro elements, icon buttons |
| `--nIl` | 5/5/12 inset | Input focus |
| `--nIm` | 3/3/7 inset | Inputs default |
| `--nIs` | 2/2/6 inset | Toggle tracks, small wells |
| `--nIx` | 1/1/4 inset | Active tabs, tiny wells |

### Colors
| Token | Formula | Role |
|---|---|---|
| `--neu-shadow` | `color-mix(bg 82%, black)` | Shadow side |
| `--neu-hilight` | `color-mix(bg 35%, white)` | Highlight side |
| `--nRl/m/s/x` | 16/12/8/6px | Radius scale |

---

## Component Catalogue

### NODE SYSTEM

#### 1. Node Card (`.nn-node > div:first-child`)
**Location:** NodeCanvas.jsx L2687
**Surface:** `var(--node-bg)` — whiter than canvas bg
| State | Shadow | Notes |
|---|---|---|
| Default | `var(--shadow-node)` = `--nEl` | |
| Selected | `var(--shadow-node-sel)` = `--nEl` + accent ring | |
| Group node | Same + color tint background | |

#### 2. Node Title Input (inline rename)
**Location:** NodeCanvas.jsx L2727
| State | Style |
|---|---|
| Default | transparent bg, accent border |
| Focus | accent color, no shadow |

#### 3. Node Action Buttons (`.nn-pencil-btn`, `.nn-comment-btn`, `.nn-collapse-btn`, `.nn-addnote-btn`)
**Location:** NodeCanvas.jsx L2740+
| State | Surface | Shadow |
|---|---|---|
| Default | transparent | none |
| Hover | `var(--bg)` | `--nEx` |
| Active | `var(--bg)` | `--nIx` |

#### 4. Node Anchor Dots (connection targets)
**Location:** NodeCanvas.jsx L3051
- Transparent, accent color, crosshair cursor

#### 5. Note Pill / Badge (inside node)
**Location:** NodeCanvas.jsx L2867
| State | Style |
|---|---|
| Default | `--nEx` raised, `var(--bg)` |
| Hover | `--nEs` raised |

---

### CANVAS TOOLBAR

#### 6. Toolbar Row Container (`[data-tut="topbar-row1"]`, sibling)
**Location:** NodeCanvas.jsx L3080+
- Inset trough: `inset 0 3px 9px shadow, inset 0 1px 3px hilight`
- No border, `var(--bg)` surface

#### 7. Toolbar Buttons (Edit, Popup, Panel, Select, Connect, Group, Collapse)
**Location:** NodeCanvas.jsx — `tbtn()` helper L989
| State | Surface | Shadow | Text |
|---|---|---|---|
| Default (inactive) | transparent | none | `var(--text2)` |
| Hover | `var(--bg)` | `--nEx` | `var(--text)` |
| Active (selected) | `var(--bg)` | `--nIx` | accent color |
| Disabled (Undo/Redo) | transparent | none | `var(--text4)` 35% opacity |

#### 8. Connection Type Dropdown (z-index 501)
**Location:** NodeCanvas.jsx L3372
- **Panel:** `var(--bg)` + `--nEl`, `var(--nRm)` radius
- **Style items:** `var(--bg)` surface, hover `--nEx`
- **Section header:** `0 2px 5px shadow` seam
- **Footer (color pickers):** `0 -2px 5px shadow` seam
- **Color swatch circles:** `--nEx` raised

#### 9. Layout Direction Dropdown (z-index 501)
**Location:** NodeCanvas.jsx L3424
- Same as connection type dropdown
- **Active direction:** `--nIs` inset OR accent border

#### 10. Toolbar Dividers (1px lines)
- `background: transparent` — hidden, replaced by spacing

---

### APP TOPBAR

#### 11. Topbar Shell (`.nn-topbar`)
**Location:** App.jsx L160+, multiple layouts
- `var(--bg)` surface
- `0 4px 10px shadow` bottom seam
- No border

#### 12. Topbar Icon Buttons (theme, history, zoom, help, etc.)
**Location:** NodeCanvas.jsx L3082+
| State | Surface | Shadow |
|---|---|---|
| Default | transparent | none |
| Hover | `var(--bg)` | `--nEx` |
| Active | `var(--bg)` | `--nIx` |

#### 13. Topbar Version/Status Badge
- `var(--bg)` + `--nEx` raised

#### 14. User Avatar Circle
**Location:** App.jsx L118
- `accent-color` fill, `--nEx` raised

---

### INLINE NODE POPUP (z-index 200)

#### 15. Popup Outer Card
- `var(--bg)` surface, `--nEl`, 18px radius, overflow hidden

#### 16. Popup Header Row
- Same surface + `0 3px 8px shadow` bottom seam
- Title input: transparent bg, accent color text, no shadow

#### 17. Popup Description Input
- transparent bg (inherits), no shadow

#### 18. Popup Tab Bar
- `var(--bg)`, `inset 0 2px 6px shadow` trough
- **Inactive tab:** transparent, flat, `var(--text3)`
- **Tab hover:** `var(--bg)` + `--nEx`
- **Active tab:** `var(--bg)` + `--nEs` raised pop, accent text

#### 19. Popup Content (Notes, Properties, Services, Ports, Live, AI, Type, Links)
- `var(--bg)` surface, no shadow

#### 20. Property Inputs (inside popup)
- `var(--bg)` + `--nIm` inset well, `var(--nRm)` radius

#### 21. Notes Toggle Row
- `var(--bg)` + `--nIs` inset pill, `var(--nRm)` radius

#### 22. "+ ADD NOTE" CTA Button
- `var(--accent2)` fill, `--nEs` raised, white text

#### 23. Note Title Input
- `var(--bg)` + `--nIs` inset well

#### 24. Rich Text Editor Toolbar
- `var(--bg)` + `0 3px 6px shadow` seam
- **Format buttons:** `--nEx` default, `--nIx` active
- **Bold/Italic etc. active state:** `--nIx` inset (PRESSED IN)

---

### SIDEBAR

#### 25. Sidebar Shell (`.nn-sidebar`)
- `var(--bg)` + `4px 0 12px shadow` right seam

#### 26. Node Type List Items
| State | Shadow |
|---|---|
| Hover | `var(--bg)` + `--nEx` |

#### 27. Sidebar Search Input
- `var(--bg)` + `--nIm` inset well

#### 28. Section Headers (NOTES, PLANNING, etc.)
- Flat text, no bg fill, no shadow

#### 29. Compact Toggle / Sidebar Controls
- `--nEs` raised

---

### FORMS & INPUTS

#### 30. Standard Input / Select / Textarea
| State | Surface | Shadow |
|---|---|---|
| Default | `var(--bg)` | `--nIm` |
| Focus | `var(--bg)` | `--nIl` + `0 0 0 2px accent44` ring |
| Disabled | `var(--bg)` | `--nIm` 50% opacity |

#### 31. Checkbox / Radio
- `appearance: none`, `--nIs` inset, accent fill when checked

#### 32. Toggle/Switch Track
- `--nIs` inset trough

#### 33. Toggle/Switch Thumb
- `--nEx` raised circle on track

---

### BUTTONS (all contexts)

#### 34. Standard Button
| State | Surface | Shadow | Transform |
|---|---|---|---|
| Default | `var(--bg)` | `--nEs` | none |
| Hover | `var(--bg)` | `--nEm` | `translateY(-1px)` |
| Active/press | `var(--bg)` | `--nIs` | none |
| Selected (accent2 bg) | `var(--bg)` | `--nIs` | none, tinted text |
| Disabled | `var(--bg)` | `--nEx` | none, 40% opacity |

#### 35. CTA Button (white text)
| State | Surface | Shadow |
|---|---|---|
| Default | `var(--accent2)` | `--nEs` |
| Hover | `var(--accent2)` | `--nEm` + `translateY(-1px)` |

#### 36. Danger Button (remove/delete)
- `var(--bg)` + `--nEx`, `var(--danger)` text
- Hover: `--nEs`

#### 37. Ghost Button
- `var(--bg)` + `--nEx`, `var(--text3)`

---

### MODALS & OVERLAYS

#### 38. Modal Panel (maxWidth containers, ThemePicker, LLMSettings, etc.)
- `var(--bg)` + `--nEl`, 20px radius
- NO `rgba(0,0,0)` backdrop → backdrop stays natural

#### 39. Full-screen Modal Backdrop
- `rgba(0,0,0,0.75)` — this is the ONLY element that keeps rgba
- The modal card itself uses `--nEl`

#### 40. Modal Header
- Same surface + `0 3px 7px shadow` seam

#### 41. Modal Footer
- Same surface + `0 -2px 5px shadow` seam (top shadow)

#### 42. Close Button (×)
| State | Surface | Shadow |
|---|---|---|
| Default | transparent | none |
| Hover | `var(--bg)` | `--nEx` |

---

### DROPDOWNS & CONTEXT MENUS

#### 43. Dropdown Panel (z-index 501/601)
- `var(--bg)` + `--nEl`, `var(--nRm)` radius

#### 44. Dropdown List Item
| State | Surface | Shadow |
|---|---|---|
| Default | transparent | none |
| Hover | `var(--bg)` | `--nEx` — NO color change |
| Active | `var(--bg)` | `--nIs` |

#### 45. Dropdown Section Divider
- `0 2px 5px shadow` seam — no visible line

---

### DASHBOARD

#### 46. Map Card (`.nn-map-card`)
- `var(--bg)` + `--nEs` + accent top stripe
- Hover: `--nEl` + `translateY(-2px)`

#### 47. Map List Row (`.nn-map-list-row`)
- `var(--bg)` + `--nEx`
- Hover: `--nEs`

#### 48. Card Action Buttons (`.nn-card-actions`)
- Hidden (opacity 0), appear on card hover
- `var(--bg)` + `--nEx`, hover `--nEs`

#### 49. "New Map" / "Import" Buttons
- `var(--bg)` + `--nEs`

#### 50. Search Input
- `var(--bg)` + `--nIm`

---

### ADMIN PANEL

#### 51. Admin Modal Card
- `var(--bg)` + `--nEl`, 20px radius

#### 52. User/Role Row Cards
- `var(--bg)` + `--nEx`
- Hover: `--nEs`

#### 53. Toggle Thumb (admin toggles)
- `--nEx` raised, accent when on

#### 54. Tab Navigation (admin sections)
- Same as popup tab bar (items 17–19)

---

### SPECIALIZED COMPONENTS

#### 55. Theme Picker Swatches
**Location:** ThemePicker.jsx L131
- Active: `--nIs` inset + accent ring
- Inactive: `--nEx` raised

#### 56. Skin Picker Cards
- Active: `--nIs` inset
- Inactive: `--nEs` raised

#### 57. KBD Chip (`<kbd>`)
- `var(--bg)` + `--nEs`, `var(--nRx)` radius

#### 58. Version History Row
**Location:** VersionHistory.jsx L102
| State | Surface | Shadow |
|---|---|---|
| Default | transparent | none |
| Hover | `var(--bg)` | `--nEx` |
| Active | `var(--bg)` | `--nIs` |

#### 59. Help Guide / Tutorial Modal
- `var(--bg)` + `--nEl`, 20px radius
- Tutorial spotlight: overlay rgba(0,0,0) only, NOT the target element

#### 60. Quick-Capture Floating Input
**Location:** NodeCanvas.jsx L3891
- `var(--bg)` + `--nEl`, `var(--nRm)` radius
- NO hardcoded border color

#### 61. Search Results Overlay
**Location:** NodeCanvas.jsx L3192
- `var(--bg)` + `--nEl`
- Result rows hover: `--nEx`

#### 62. Integration Panel (Live tab)
- Metric cards: `var(--bg)` + `--nEs`
- Progress bars: `--nIs` trough
- Filter pills: `var(--bg)` + `--nEx`, active `--nIs`

#### 63. AI Chat Panel
- Message bubbles: `var(--bg)` + `--nEs`
- Input: `var(--bg)` + `--nIm`
- Send button: accent + `--nEs`

#### 64. Node AI Chat (inside popup)
- Same as AI Chat Panel

#### 65. Scrollbars
- Track: `inset 1px shadow`
- Thumb: `var(--neu-shadow)` color

#### 66. Tooltip / Hover Labels
- `var(--bg)` + `--nEs`, `var(--nRx)` radius

---

## Enforcement Rules (MUST follow)

1. `background` on hover MUST be `var(--bg)` — NEVER `var(--bg3)`
2. `box-shadow` MUST use token vars — NEVER `rgba(0,0,0,N)` directly
3. `border` for separation MUST be replaced by shadow seam
4. `onMouseEnter` style changes MUST not set `background: var(--bg3)`
5. Only backdrop overlays (`rgba(0,0,0,0.75)`) keep raw rgba
6. Every interactive element MUST have: default + hover + active states
7. "Selected" state MUST show `--nIs` inset (not color-only)

