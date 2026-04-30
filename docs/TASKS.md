# docs/TASKS.md — NoNote Task Tracker
> Keep this file up to date. Update after every session.
> Format: [STATUS] Task — notes

## Current Version: v5.35.4
## Last Updated: Apr 2026

---

## 🔴 In Progress
_Nothing currently in progress._

---

## 🟡 Backlog (known issues / next work)

### Skins & Appearance
- [ ] Vapor skin — VT323 font may not load reliably without Google Fonts CDN; add @import or fallback
- [ ] Neumorphic skin on dark themes looks flat (physically correct but jarring UX) — consider a "dark clay" variant theme
- [ ] Aurora skin `color-mix()` in topbar-bg may fail on Safari < 16.4 — verify or add fallback
- [ ] Skin picker cards — mini preview doesn't show font personality (all cards use system font for the preview)
- [ ] Add a "Reset to skin defaults" button in Appearance modal that restores defaultTheme + defaultDesign + defaultAccent

### Live Dashboard
- [ ] Standalone integrations: no edit UI — can only remove and re-add
- [ ] ESXi integration — backend proxy exists but frontend card renderer not implemented (falls back to probe)
- [ ] Unraid: VMs tab only shows if `d.vms?.domain` is non-empty — test with actual Unraid VM data
- [ ] Error state cards have no retry button — user must click Refresh in the summary bar

### Canvas
- [ ] Node collision detection misses `minHeight` CSS — actual rendered height can exceed stored `node.h`
- [ ] Auto-layout: large maps (50+ nodes) can be slow — consider web worker
- [ ] Edge labels: no UI to set/edit label after initial creation

### Dashboard
- [ ] Map groups not synced to backend — stored in localStorage only; lost on new device/browser
- [ ] Search doesn't search node content — only map title

### General
- [ ] No dark/light mode auto-detection on first load (defaults to `dark` theme, ignores `prefers-color-scheme`)
- [ ] Mobile: MobileCanvas exists but many features unavailable — not actively maintained

---

## 🟢 Completed (recent)

### v5.35.4 (Apr 2026)
- [x] Neumorphic skin: restored dual-shadow effect to exact v5.34.3 look
- [x] Added Clay theme with `--neu-dark`/`--neu-light` CSS vars
- [x] Created CLAUDE.md, docs/ARCHITECTURE.md, docs/SKINS.md, docs/FEATURES.md, INSTRUCTIONS.md for handover

### v5.35.3 (Apr 2026)
- [x] Live Dashboard accessible in ALL skins — compact nav strip for non-sidebar skins
- [x] Each skin applies defaultAccent on switch (matching v5.34.3 appearance)
- [x] Skin switch: applies defaultTheme + defaultDesign + defaultAccent atomically

### v5.35.2 (Apr 2026)
- [x] Architecture fix: Theme=colors, Design=spacing, Skin=personality — clean separation
- [x] Design tab actually works — removed font/radius from DesignContext
- [x] 13 themes with improved color palettes (added amber, violet, clay)
- [x] Accent quick-pick per skin (5 curated accents in Skins tab)
- [x] DesignContext: spacing-only vars, 5 designs

### v5.35.1 (Apr 2026)
- [x] Skins tab error fixed — `s.palette` was undefined after removing hardcoded colors
- [x] ThemePicker: fixed `s.tags.slice` crash

### v5.35.0 (Apr 2026)
- [x] Skins rewritten — no hardcoded colors, all use CSS vars
- [x] Design tab working (partial — spacing fixed, font/radius still conflicted)
- [x] URL fragments: #dashboard, #live, #canvas/{mapId}, #admin
- [x] Live Dashboard tab in all skins via compact nav strip

### v5.34.3 (Apr 2026)
- [x] Provider order fixed (Theme → Design → Skin)
- [x] SkinContext vars deferred with setTimeout(0)
- [x] Clay theme for Neumorphic baseline

### v5.34.0–5.34.2 (Apr 2026)
- [x] 11 distinct skins with 4 nav layout types
- [x] ThemePicker crash fixes (tags, palette, error boundary)
- [x] NavLogo/NavActions converted from components to JSX vars (React remount fix)

### v5.33.x (Apr 2026)
- [x] SkinContext + SkinProvider initial implementation
- [x] skins.js: 6 → 11 skins
- [x] Appearance modal: ✨ Skins tab added

### v5.32.0 (Apr 2026)
- [x] Map cards: colored top-border, emoji icon, group sections
- [x] Grid/List view toggle
- [x] Map grouping with ✎ customize modal
- [x] Search + group filter pills

### v5.31.x (Apr 2026)
- [x] Dashboard sidebar layout (220px left + full-width content)
- [x] Topbar: avatar pill with name
- [x] Map cards: hover shadow, accent border

### v5.30.x–5.31.0 (Apr 2026)
- [x] Live Dashboard: tabs per card (Overview/Guests/Storage)
- [x] NaN% storage fix (Proxmox disk_used → used field)
- [x] Deduplication by URL
- [x] Standalone integrations without map node
- [x] max-width 1400px → full width with sidebar layout

### v5.29.x (prior)
- [x] Node types expanded to 60+ across 9 categories
- [x] Services/VMs/Containers panel on server nodes
- [x] Ports panel on all nodes (20+ port types)
- [x] Connection type system: 15 styles
- [x] Custom anchor points (from_anchor, to_anchor JSONB)
- [x] Bezier midpoint control (mid_off JSONB)

---

## 💡 Ideas / Future Consideration
- Real-time collaboration (WebSocket-based multi-cursor)
- Map templates (pre-built homelab topologies)
- Node search on canvas (Ctrl+F)
- Minimap for large canvases
- PDF/PNG export
- Skin marketplace (community skins)
- Backend-stored map meta (groups, icons) — currently localStorage only
