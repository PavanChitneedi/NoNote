# Node packages

NoNote keeps all 118 existing node types available in 13 bundled packages. Packages organize the picker; they do not enable, disable, rename, or migrate document nodes.

## Registry and compatibility

`frontend/src/lib/nodePackages.js` defines stable package IDs and maps each existing category to its node types. `nodeTypes.js` remains the source of truth for persisted type IDs, icons, colors, labels, and default properties. Existing maps and native exports continue to use the same `type` / `node_type` values. No database migration or export format change is needed.

| ID | Package |
| --- | --- |
| notes | Notes |
| planning | Planning |
| workflow | Workflow |
| knowledge | Knowledge |
| general | General |
| network | Network |
| computers | Computers |
| servers | Servers |
| storage | Storage |
| mobile-iot | Mobile & IoT |
| cloud | Cloud |
| software | Software |
| security | Security |

## Picker behavior

Desktop and phone use `NodeLibrary.jsx`. Search covers every type's ID, label, and package name, including collapsed packages. Clearing search restores the user's collapsed sections. Pinned packages sort first without removing other packages. Favorites and the eight most recently selected types appear above the package list. All packages start expanded.

Preferences are stored in this browser under `nn_node_library_v1`; they are shared across maps on the same origin, not synced to an account or another device. Malformed preferences and unavailable IDs are ignored. Storage failures do not prevent adding nodes. The desktop's previous recent-types list is accepted as a fallback. Full and compact desktop modes offer pin/favorite controls; icon mode can be expanded to manage them.

The phone now uses the complete type registry, replacing its former 34-type copy. Its node creation uses the same default properties and dimensions as desktop. This does not make every advanced desktop editor available on mobile.

## Extension boundary

These are bundled type packages, not executable third-party plugins. A future functional plugin can enhance existing types (for example, live appliance status) without owning their note content or removing nodes when disabled. Package organization never grants integration permissions.

## Validation

Automated coverage checks exact registry completeness/uniqueness, search across packages, malformed preferences, persistent favorites/pins/collapse, original type IDs passed to creation, and read-only creation guards. Existing import/export and canvas suites remain in the frontend test run.

Browser checks use the isolated synthetic backend: existing notebook opens, desktop Proxmox creation, phone Raspberry Pi creation, reload preservation of nodes and note content, preference continuity across layouts, and light/dark appearance. Screenshots are in `docs/audit-2026-09-27/node-packages-*.png`.

## Drag-to-connect interaction

Expanded desktop nodes, collapsed desktop nodes, and mobile nodes expose four small connection points at the border midpoints. Drag a point onto another node to create an edge. The shared pointer controller previews the line, highlights a valid destination, derives its anchor from rendered bounds, and cancels on empty-space/self drops, Escape, pointer cancellation, focus loss, or edit permission loss. Existing click-to-connect remains available. The drag handle requires edit access; it does not change node IDs or edge persistence.

Mobile pointer tracking now ignores hover events without an active pointer-down, and cancelled pointer gestures no longer complete connections. Gesture blocking is scoped to the canvas so the package sheet can scroll. The compact toolbar uses readable secondary text and exposes pressed state.

Validation: 215 frontend tests passed before the final toolbar styling adjustment; the production build and lint passed (existing warnings remain). New tests cover mouse/touch pointer sequences, target anchors, cancellation, self/blank drops, read-only state, and cleanup. Browser verification created edges by dragging handles on desktop and phone layouts and confirmed persistence after reload. Compact Add and Connect controls and the source/destination click sequence were also verified. Touch is covered by simulated pointer tests, not a physical phone. Evidence: `drag-connect-desktop.png` and `drag-connect-mobile.png` in the audit directory.


### Connection point design

The permanent in-node button was replaced with 8px border points. Desktop reveals points on hover/selection; phone reveals them on selection; Connect mode and an active drag reveal all eligible targets. Hit areas are 28px desktop / 40px phone, independent of canvas zoom. Midpoint placement avoids title actions and the bottom-right resize corner. Each point supplies its actual side anchor. Expanded desktop content retains its rounded clipping inside a wrapper, while the connection points extend across the border. Keyboard focus also reveals the controls. Light/dark colors use theme variables. Screenshots: `connection-points-desktop.png`, `connection-points-mobile.png`.

## Connection routing follow-up (2026-09-28)

New border-handle drags create automatic attachments. Both canvas variants and
valid-target drag previews call `routeConnections`; explicit existing anchors are
preserved until reset. Desktop endpoint editing still permits fixed attachment.
Compact canvas Options includes Reset all connection routing; desktop retains its
per-edge reset. The synthetic verification map's old anchors were reset during QA.

Unbundled routing is the default for new preferences. Explicitly enabled desktop
bundling remains a separate rendering option. Shared routing spaces incoming and
outgoing automatic ports together, prefers centered clear two-bend paths, and uses
direction-aware A* for obstacles. Oversized/unroutable grids retain the existing
orthogonal fallback; overlapping nodes cannot guarantee a clear route.

Validation: 223 frontend tests pass; lint has zero errors (25 existing warnings).
Desktop and compact test-map views inspected. Native physical touch and crowded
large-map performance were not verified in this pass.

## Auto Arrange routing quality (2026-09-28)

Directional Arrange compares three seeded ELK layouts (one above 60 nodes) using
actual routed geometry. Quality order is node/edge collisions, shared stretches,
crossings, then total Manhattan length plus bend cost. Up to 12 nodes also receive
bounded cross-axis placement refinement. Measured dimensions inform placement;
user size fields are preserved. Radial layout retains its earlier algorithm.

A* rejects shared collinear stretches of prior routes. The legacy fallback remains
for unreachable/fixed endpoints and oversized grids, so zero overlap is a target,
not a universal guarantee. Ordinary connectors now use sharp orthogonal segments;
explicit special edge styles retain their semantics. Arrange disables bundling.
Compact Layout now works and fits the result. Desktop and compact synthetic-map
arrangements were inspected, and the diamond-graph regression verifies zero
node collisions, shared stretches, and crossings. Full suite: 226 tests passing;
final endpoint adjustment also passed the 11 focused routing/layout tests.

## Mixed line styles (2026-09-28)

Occupancy now reserves an 8px parallel corridor for every style, including dash
and dot gaps. Complete paths are validated, including source/target stubs that
previously bypassed A* occupancy. Failed routes retry with alternate stub lengths,
extra lanes beside occupied segments, and nearby automatic ports. Locked ports
are preserved. The connectivity fallback remains for exhausted searches, so this
is not a universal overlap-free guarantee for impossible fixed endpoints.
Mixed solid/dotted/dashed regression checks every pair of full path segments and
verifies style changes leave geometry unchanged.

## Flexible endpoints (2026-09-28)

Per user request, shared routing now treats all legacy saved anchors as automatic.
Source/destination node IDs remain unchanged. If the preferred ports and nearby
same-side ports fail, it evaluates center/20%/80% positions across all 16 source/
destination side combinations, scoring valid candidates by length plus bend cost.
The fixed-endpoint restriction described above is superseded. This remains a
bounded geometric search with a connectivity fallback, not a universal solver.
Regression tests cover ignoring old locked anchors and escaping a blocked face.

## Coordinated ELK routes (2026-09-28)

Directional Arrange now uses `coordinatedLayout` to keep ELK node positions and
edge section geometry together. Every parallel edge is passed through; merging
is disabled. Desktop note stacks are passed as their rendered boxes, with member
positions moved by the stack delta. Radial retains the previous algorithm.

Routes persist as `fromAnchor.route` metadata using the existing JSON anchor
storage. A signature of all node bounds and edge identities/endpoints prevents
stale paths being reused after movement, resizing, or graph changes. Label/style
changes do not invalidate geometry. A changed graph currently falls back to the
existing live router; coordinated rerouting during manual movement and label-aware
clearance remain follow-up work. Existing explicit wave/special styles remain.

Browser comparison on the saved 12-node / 24-link synthetic stress map:
- Shared segments: 0 before, 0 after.
- Strict interior centerline crossings: 15 before, 3 after.
- Bends: 54 before, 38 after.
- Total Manhattan path length: 17,040 before, 12,582 after (26% shorter).
- Reload: all 24 routes reproduced exactly.
These measures are not a proof of stroke/arrowhead/label clearance or optimality.
Raw paths and metrics: elk-routing-comparison.json in this audit folder.
