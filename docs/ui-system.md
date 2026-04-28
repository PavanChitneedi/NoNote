# NoNote UI System — Metadata & Skin Contract
**Version:** v5.44.0 | **Status:** Enforced  
**Rule:** Every UI element MUST have `data-ui`. Every PR touching UI MUST update this doc.

---

## Skin-Only Contract

- Runtime color ownership is in `SkinContext` via `getSkinPalettes()` from `skins.js`.
- UI must consume semantic CSS tokens (`--bg`, `--text*`, `--accent*`, state tokens), never hardcoded literals.
- Theme tab is removed; palette variants are selected inside the active skin.
- Guardrail script: `npm run lint:ui-colors` checks core components for hardcoded color literals.

---

## 1. Dev Mode

### Activation (any of three methods)
| Method | How |
|---|---|
| Toggle button | Top-right of topbar → **DEV** button |
| URL param | `?devMode=true` in any URL |
| Keyboard | `Ctrl+Shift+D` anywhere in the app |
| Persistent | Remembered via `localStorage("nn_devmode")` |

### Behavior when ON
- **Hover** any element → cyan outline highlight + tooltip showing all metadata
- **Click** any element → copies structured block to clipboard:
```
[UI_ELEMENT]
  id:        topbar-edit
  component: CanvasToolbar
  page:      canvas
  role:      mode-btn
  type:      button
  state:     active
  variant:   edit
[/UI_ELEMENT]
```
- DEV badge shown top-right (cyan) with copy confirmation

### Implementation
- **Context:** `frontend/src/context/DevModeContext.jsx`
- **Provider:** wraps entire app in `App.jsx` inside `SkinProvider`
- **Inspector logic:** walks DOM up from hovered element to find nearest `data-ui` ancestor

---

## 2. Metadata Schema

### Required attributes (ALL interactive or structural elements)
| Attribute | Type | Description | Example |
|---|---|---|---|
| `data-ui` | `string` | Unique ID for this element | `"toolbar-edit"`, `"mapcard-${id}"` |
| `data-component` | `string` | React component name | `"CanvasToolbar"`, `"NodeCard"` |
| `data-page` | `string` | Page context | `"canvas"`, `"dashboard"`, `"global"`, `"login"` |
| `data-role` | `string` | Semantic role | see Role Taxonomy below |

### Optional attributes
| Attribute | Type | Description | Example |
|---|---|---|---|
| `data-state` | `string` | Current UI state | `"active"`, `"disabled"`, `"loading"` |
| `data-variant` | `string` | Visual/behavior variant | `"edit"`, `node.type`, `"danger"` |

### Role Taxonomy
| Role | Used for |
|---|---|
| `page` | Full-page root containers |
| `navbar` | Top navigation bars |
| `toolbar` | Action toolbars |
| `sidebar` | Side navigation panels |
| `modal` | Overlay dialogs |
| `panel` | Slide-in or docked panels |
| `overlay` | Full-screen overlays (tutorial, spotlight) |
| `card` | Clickable content cards |
| `list-item` | Rows in a list |
| `node` | Canvas node cards |
| `mode-btn` | Toolbar mode switchers (Edit/Select/Connect) |
| `action-btn` | Buttons that trigger actions |
| `nav-btn` | Navigation/routing buttons |
| `cta-btn` | Primary call-to-action buttons |
| `panel-btn` | Buttons that open/close panels |
| `toggle` | On/off toggles |
| `search-input` | Search fields |
| `input` | Form inputs |
| `tab` | Tab navigation items |

### Page Values
| Value | When |
|---|---|
| `canvas` | NodeCanvas / MobileCanvas |
| `dashboard` | Dashboard (map list) |
| `admin` | AdminPanel |
| `login` | LoginPage |
| `global` | Present on all pages (topbar, modals) |

---

## 3. Component Metadata Registry

All 22 root components and their metadata:

| Component | File | data-ui | data-page | data-role |
|---|---|---|---|---|
| App topbar | App.jsx | `topbar-shell` | `global` | `navbar` |
| DEV toggle | App.jsx | `topbar-devmode-toggle` | `global` | `toggle` |
| Tutorial btn | App.jsx | `topbar-tutorial` | `global` | `nav-btn` |
| Help btn | App.jsx | `topbar-help` | `global` | `nav-btn` |
| Logout btn | App.jsx | `topbar-logout` | `global` | `action-btn` |
| LoginPage | LoginPage.jsx | `login-page` | `login` | `page` |
| Dashboard | Dashboard.jsx | (root div) | `dashboard` | `page` |
| Dashboard sidebar | Dashboard.jsx | `dashboard-sidebar` | `dashboard` | `sidebar` |
| Dashboard new map | Dashboard.jsx | `dashboard-new-map` | `dashboard` | `cta-btn` |
| Dashboard search | Dashboard.jsx | `dashboard-search` | `dashboard` | `search-input` |
| Map card | Dashboard.jsx | `mapcard-{id}` | `dashboard` | `card` |
| Map list row | Dashboard.jsx | `maprow-{id}` | `dashboard` | `list-item` |
| NodeCanvas | NodeCanvas.jsx | (canvas div) | `canvas` | `page` |
| Canvas sidebar | NodeCanvas.jsx | `canvas-sidebar` | `canvas` | `sidebar` |
| Sidebar search | NodeCanvas.jsx | `sidebar-search` | `canvas` | `search-input` |
| Canvas toolbar R1 | NodeCanvas.jsx | `canvas-toolbar-row1` | `canvas` | `toolbar` |
| Edit btn | NodeCanvas.jsx | `toolbar-edit` | `canvas` | `mode-btn` |
| Popup btn | NodeCanvas.jsx | `toolbar-popup` | `canvas` | `mode-btn` |
| Panel btn | NodeCanvas.jsx | `toolbar-panel` | `canvas` | `mode-btn` |
| Select btn | NodeCanvas.jsx | `toolbar-select` | `canvas` | `mode-btn` |
| Connect btn | NodeCanvas.jsx | `toolbar-connect` | `canvas` | `mode-btn` |
| Group btn | NodeCanvas.jsx | `toolbar-group` | `canvas` | `action-btn` |
| Layout btn | NodeCanvas.jsx | `toolbar-layout` | `canvas` | `action-btn` |
| Collapse btn | NodeCanvas.jsx | `toolbar-collapse` | `canvas` | `action-btn` |
| AI Chat btn | NodeCanvas.jsx | `topbar-aichat` | `canvas` | `panel-btn` |
| Comments btn | NodeCanvas.jsx | `topbar-comments` | `canvas` | `panel-btn` |
| Node card | NodeCanvas.jsx | `node-{id}` | `canvas` | `node` |
| MobileCanvas | MobileCanvas.jsx | `mobile-canvas` | `canvas` | `page` |
| AdminPanel | AdminPanel.jsx | `admin-panel` | `admin` | `modal` |
| ThemePicker | ThemePicker.jsx | `theme-picker` | `global` | `modal` |
| LLMSettings | LLMSettings.jsx | `llm-settings` | `global` | `modal` |
| LLMChat | LLMChat.jsx | `llm-chat` | `canvas` | `panel` |
| NodeAIChat | NodeAIChat.jsx | `node-ai-chat` | `canvas` | `panel` |
| VersionHistory | VersionHistory.jsx | `version-history` | `canvas` | `panel` |
| UserProfile | UserProfile.jsx | `user-profile` | `global` | `modal` |
| DocExportModal | DocExportModal.jsx | `doc-export` | `canvas` | `modal` |
| HelpGuide | HelpGuide.jsx | `help-guide` | `global` | `modal` |
| Tutorial | Tutorial.jsx | `tutorial` | `global` | `overlay` |
| IntegrationPanel | IntegrationPanel.jsx | `integration-panel` | `canvas` | `panel` |
| LiveDashboard | LiveDashboard.jsx | `live-dashboard` | `dashboard` | `panel` |

---

## 4. Enforcement Rules

### Adding a new component
```jsx
// REQUIRED — root element must have all 4 attributes
<div
  data-ui="my-component"
  data-component="MyComponent"
  data-page="canvas"
  data-role="modal"
>
```

### Adding an interactive element
```jsx
// Any button/input/link that users interact with
<button
  data-ui="my-component-save"
  data-component="MyComponent"
  data-page="canvas"
  data-role="action-btn"
  data-state={loading ? "loading" : "default"}
>
```

### Dynamic IDs (lists, nodes)
```jsx
// Use template literals for repeated elements
<div data-ui={`node-${node.id}`} data-component="NodeCard" ...>
<div data-ui={`mapcard-${m.id}`} data-component="MapCard" ...>
```

### Dev mode propagation
The inspector walks **up** the DOM tree to find the nearest ancestor with `data-ui`.
This means:
- Container-level metadata is inherited by all children
- Only override when a child has a meaningfully different role
- Buttons inside a modal will show the modal's metadata unless tagged themselves

---

## 5. Validation Script

Run to check coverage:
```bash
# Check for elements missing data-ui (approximate)
grep -rn "<button\|<input\|<select\|<textarea" frontend/src/components/ \
  | grep -v "data-ui\|//\|\.md" | wc -l
```

Acceptable missing: internal framework elements, SVG children, conditional renders with unique parents.

---

## 6. Changelog
| Version | Change |
|---|---|
| v5.43.4 | Initial system — DevMode + full metadata schema + 40+ tagged elements |
