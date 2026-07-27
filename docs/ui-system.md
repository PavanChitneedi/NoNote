# NoNote UI System — Metadata & Dev Mode Contract
**Status:** Not actually enforced — see note below.
**Rule (aspirational):** Every UI element MUST have `data-ui`. Every PR touching UI MUST update this doc.

> **Coverage has regressed significantly since this was written.** Verified directly against the code: most of `NodeCanvas.jsx`'s toolbar buttons (`toolbar-edit`, `toolbar-popup`, `toolbar-panel`, `toolbar-select`, `toolbar-connect`, `toolbar-group`, `toolbar-collapse`, `topbar-aichat`, `topbar-comments`), `canvas-sidebar`, `sidebar-search`, `dashboard-new-map`, and `dashboard-search` don't have `data-ui` at all despite being listed below. Three whole components (`ThemePicker.jsx`, `HelpGuide.jsx`, `IntegrationPanel.jsx`) and one that didn't exist when this doc was written (`WorkflowAuditPanel.jsx`) have **zero** `data-ui` attributes. The Dev Mode inspector itself is real and works as described — it just won't show useful metadata for most of the app's interactive surface right now. Treat the registry below as "what's actually tagged," not "what should be tagged."

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

Verified directly against every `data-ui=` occurrence in the code (not trusted from the previous version of this table, which had drifted significantly). Components with **no** `data-ui` at all currently: `ThemePicker.jsx`, `HelpGuide.jsx`, `IntegrationPanel.jsx`, `WorkflowAuditPanel.jsx`.

| Component | File | data-ui | data-page | data-role |
|---|---|---|---|---|
| App topbar | App.jsx | `topbar-shell` | `global` | `navbar` |
| DEV toggle | App.jsx | `topbar-devmode-toggle` | `global` | `toggle` |
| Tutorial btn | App.jsx | `topbar-tutorial` | `global` | `nav-btn` |
| Help btn | App.jsx | `topbar-help` | `global` | `nav-btn` |
| Logout btn | App.jsx | `topbar-logout` | `global` | `action-btn` |
| LoginPage | LoginPage.jsx | `login-page` | `login` | `page` |
| Dashboard sidebar | Dashboard.jsx | `dashboard-sidebar` | `dashboard` | `sidebar` |
| Map card | Dashboard.jsx | `mapcard-{id}` | `dashboard` | `card` |
| Map list row | Dashboard.jsx | `maprow-{id}` | `dashboard` | `list-item` |
| Canvas toolbar R1 | NodeCanvas.jsx | `canvas-toolbar-row1` | `canvas` | `toolbar` |
| Layout btn | NodeCanvas.jsx | `toolbar-layout` | `canvas` | `action-btn` |
| Copy for AI btn | NodeCanvas.jsx | `copy-for-ai` | `canvas` | `action-btn` |
| Node card | NodeCanvas.jsx | `node-{id}` | `canvas` | `node` |
| MobileCanvas | MobileCanvas.jsx | `mobile-canvas` | `canvas` | `page` |
| AdminPanel | AdminPanel.jsx | `admin-panel` | `admin` | `modal` |
| LLMSettings | LLMSettings.jsx | `llm-settings` | `global` | `modal` |
| LLMChat | LLMChat.jsx | `llm-chat` | `canvas` | `panel` |
| NodeAIChat | NodeAIChat.jsx | `node-ai-chat` | `canvas` | `panel` |
| VersionHistory | VersionHistory.jsx | `version-history` | `canvas` | `panel` |
| UserProfile | UserProfile.jsx | `user-profile` | `global` | `modal` |
| DocExportModal | DocExportModal.jsx | `doc-export` | `canvas` | `modal` |
| Tutorial | Tutorial.jsx | `tutorial` | `global` | `overlay` |
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
| (undated, this audit) | Registry re-verified against actual code — found ~15 previously-listed elements with no `data-ui`, 3 fully-untagged components, 1 untagged newer component (`WorkflowAuditPanel.jsx`), and 1 undocumented tagged element (`copy-for-ai`). See coverage note near the top. |
