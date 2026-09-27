import { DEF_W, DEF_H } from "./nodeTypes.js";
import { STACK_BOX_H } from "./edgeRouting.js";
import { boxesOverlap } from "./autoLayout.js";
import { layoutQuality, betterLayout } from './layoutQuality.js';

// Loaded lazily (not a static import) so elkjs's large bundled UMD build
// lands in its own chunk instead of being merged and re-minified alongside
// the rest of the app — statically importing it into the main chunk caused
// a minifier variable collision that broke unrelated code (edgeRoutes'
// "rgt is not a constructor" error).
let elkPromise = null;
function getElk() {
  if (!elkPromise) {
    elkPromise = import("elkjs/lib/elk.bundled.js").then(m => new (m.default)());
  }
  return elkPromise;
}

const DIR_MAP = { LR: "RIGHT", RL: "LEFT", TB: "DOWN", BT: "UP" };
const STACK_W = 240, ANNO_GAP = 60;

// ELK's own layered layout, validated on the app's Homelab map as more
// robust than the hand-rolled autoLayout.js (see docs/ARCHITECTURE.md
// history / changelog for the note-placement regression that motivated
// this). Used only for LR/RL/TB/BT — radial has no ELK equivalent and
// stays on autoLayout.js.
export async function elkAutoLayout(nodes, edges, direction = "LR", options = {}) {
  if (!nodes.length) return nodes;
  try {
    const elk = await getElk();
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const isHoriz = direction === "LR" || direction === "RL";

    // ── Separate annotations from the graph proper — same rule as
    // autoLayout.js: a note attached to exactly one non-note node is an
    // ANNOTATION on that node, not a graph peer. Letting ELK's layered
    // algorithm place it as an ordinary child (an earlier version of this
    // function did, by routing an edge to it like any other target) let ELK
    // scatter it arbitrarily far from its parent — which then broke the
    // bundling system's assumption that a node's own annotation sits right
    // beside it (buildBundle's clearBox correction has to reach all the way
    // out to clear it, and at ELK-scattered distances that reach collides
    // with unrelated nodes, silently failing bundling map-wide). Annotations
    // are excluded from the ELK graph entirely and parked beside their
    // parent afterward instead, exactly like autoLayout.js.
    const noteParents = {};
    edges.forEach(e => {
      const f = byId[e.from], t = byId[e.to];
      if (!f || !t) return;
      if (t.type === "note" && f.type !== "note") (noteParents[e.to] = noteParents[e.to] || []).push(e.from);
      if (f.type === "note" && t.type !== "note") (noteParents[e.from] = noteParents[e.from] || []).push(e.to);
    });
    const annoOf = {};   // parentId -> [noteId,...]
    nodes.forEach(n => {
      if (n.type !== "note") return;
      if (n.customProps?._ungrouped) return;   // manually pulled out — stays a core node
      const ps = [...new Set(noteParents[n.id] || [])];
      if (ps.length === 1 && byId[ps[0]]) (annoOf[ps[0]] = annoOf[ps[0]] || []).push(n.id);
    });
    const annoIds = new Set(Object.values(annoOf).flat());
    const core = nodes.filter(n => !annoIds.has(n.id));
    if (!core.length) return nodes;

    const stackH = STACK_BOX_H;
    const annoBox = pid => {
      const ids = annoOf[pid];
      if (!ids || !ids.length) return null;
      if (ids.length >= 2) return { w: STACK_W, h: stackH(ids.length) };
      const n = byId[ids[0]];
      return { w: n?.w || 240, h: n?.h || 160 };
    };

    // ── Build the ELK graph from core nodes only ────────────────────────
    // A node with its own annotation gets its ELK box inflated on the
    // main (flow) axis by the annotation's gap+size, exactly like
    // autoLayout.js widening a whole layer's main-axis gap by its widest
    // annotation. Without this, ELK has no idea the annotation needs room
    // and can place the very next layer (or a same-layer sibling) right
    // where it wants to sit — forcing the beside-placement fallback further
    // out, which is what silently broke bundling (see the comment above).
    // ELK always grows a box in +x/+y from its own (x,y) origin regardless
    // of flow direction, so the reserved gutter only lands on the side the
    // annotation actually needs it for a forward flow (LR/TB); for a
    // reversed flow (RL/BT) the real node is shifted to the box's far edge
    // instead, leaving the gutter at the box's start where the annotation —
    // and the following layer — actually are.
    const reversed = direction === "RL" || direction === "BT";
    const extraOf = {};
    const elkNodeIds = new Set(core.map(n => n.id));
    const elkNodes = core.map(n => {
      const w = n.w || DEF_W, h = n.h || DEF_H;
      const box = annoBox(n.id);
      if (!box) return { id: n.id, width: w, height: h };
      const extra = ANNO_GAP + (isHoriz ? box.w : box.h);
      extraOf[n.id] = extra;
      return isHoriz
        ? { id: n.id, width: w + extra, height: h }
        : { id: n.id, width: w, height: h + extra };
    });

    const elkEdges = [];
    const seen = new Set();
    edges.forEach(e => {
      if (!elkNodeIds.has(e.from) || !elkNodeIds.has(e.to) || e.from === e.to) return;
      const key = `${e.from}->${e.to}`;
      if (seen.has(key)) return;
      seen.add(key);
      elkEdges.push({ id: e.id, sources: [e.from], targets: [e.to] });
    });

    if (!elkNodes.length) return nodes;

    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.randomSeed": String(options.seed ?? 1),
        "elk.direction": DIR_MAP[direction] || "RIGHT",
        "elk.edgeRouting": "ORTHOGONAL",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "elk.spacing.nodeNode": "60",
        "elk.spacing.edgeNode": "50",
        "elk.spacing.edgeEdge": "20",
        "elk.layered.spacing.nodeNodeBetweenLayers": String(options.gap ?? 160),
        "elk.layered.spacing.edgeNodeBetweenLayers": "50",
        "elk.layered.spacing.edgeEdgeBetweenLayers": "20",
        "elk.layered.mergeEdges": "false",
      },
      children: elkNodes,
      edges: elkEdges,
    };

    const result = await elk.layout(graph);
    recenterIsolatedRoots(result, isHoriz);

    // ── Map core positions back onto the app's node shape ───────────────
    // For a reversed flow, the real node sits at the inflated box's far
    // edge (see extraOf above) — the gutter is the space before it, not
    // after.
    const posById = Object.fromEntries(result.children.map(n => {
      const extra = extraOf[n.id];
      if (!extra || !reversed) return [n.id, { x: n.x, y: n.y }];
      return [n.id, isHoriz ? { x: n.x + extra, y: n.y } : { x: n.x, y: n.y + extra }];
    }));
    const placed = nodes.map(n => {
      const p = posById[n.id];
      return p ? { ...n, x: Math.round(p.x), y: Math.round(p.y) } : { ...n };
    });

    // ── Park each node's own annotation(s) beside it ─────────────────────
    // Candidates in order: straight-connector default (centred on the axis
    // whose size is exact), a wider gap, then edge-aligned alternates — the
    // same bounded local nudge autoLayout.js uses, since neither knows what
    // else ELK placed nearby.
    const placedById = Object.fromEntries(placed.map(n => [n.id, n]));
    const placedAnnoBoxes = [];
    const AX = {}, AY = {};
    Object.keys(annoOf).forEach(pid => {
      const p = placedById[pid];
      const box = annoBox(pid);
      if (!p || !box) return;
      const pw = p.w || DEF_W, ph = p.h || DEF_H;
      const candidates = [];
      const push = (ax, ay) => candidates.push({ ax, ay });
      if (direction === "RL") {
        push(p.x - ANNO_GAP - box.w,   p.y + ph/2 - box.h/2);
        push(p.x - ANNO_GAP*2 - box.w, p.y + ph/2 - box.h/2);
        push(p.x - ANNO_GAP - box.w,   p.y);
        push(p.x - ANNO_GAP - box.w,   p.y + ph - box.h);
      } else if (direction === "BT") {
        push(p.x + pw/2 - box.w/2, p.y - ANNO_GAP - box.h);
        push(p.x + pw/2 - box.w/2, p.y - ANNO_GAP*2 - box.h);
        push(p.x,                  p.y - ANNO_GAP - box.h);
        push(p.x + pw - box.w,     p.y - ANNO_GAP - box.h);
      } else if (isHoriz) {
        push(p.x + pw + ANNO_GAP,   p.y + ph/2 - box.h/2);
        push(p.x + pw + ANNO_GAP*2, p.y + ph/2 - box.h/2);
        push(p.x + pw + ANNO_GAP,   p.y);
        push(p.x + pw + ANNO_GAP,   p.y + ph - box.h);
      } else {
        push(p.x + pw/2 - box.w/2, p.y + ph + ANNO_GAP);
        push(p.x + pw/2 - box.w/2, p.y + ph + ANNO_GAP*2);
        push(p.x,                  p.y + ph + ANNO_GAP);
        push(p.x + pw - box.w,     p.y + ph + ANNO_GAP);
      }
      const obstacles = placed
        .filter(n => n.id !== pid)
        .map(n => ({ x: n.x, y: n.y, w: n.w || DEF_W, h: n.h || DEF_H }));
      const clear = c => {
        const b = { x: c.ax, y: c.ay, w: box.w, h: box.h };
        return !obstacles.some(o => boxesOverlap(b, o)) && !placedAnnoBoxes.some(o => boxesOverlap(b, o));
      };
      const chosen = candidates.find(clear) || candidates[0];
      placedAnnoBoxes.push({ x: chosen.ax, y: chosen.ay, w: box.w, h: box.h });
      annoOf[pid].forEach(nid => { AX[nid] = chosen.ax; AY[nid] = chosen.ay; });
    });

    return placed.map(n => AX[n.id] !== undefined
      ? { ...n, x: Math.round(AX[n.id]), y: Math.round(AY[n.id]) }
      : n);
  } catch (err) {
    console.error("[elkAutoLayout]", err);
    return nodes;
  }
}

export async function optimizedAutoLayout(nodes, edges, direction = 'LR') {
  const automatic = edges.map(e=>({...e,fromAnchor:null,toAnchor:null}));
  let best, score;
  // Keep the search bounded. Large maps still get a single layered pass.
  const candidates = nodes.length > 60 ? [{seed:1,gap:120}] : [
    {seed:1,gap:100}, {seed:7,gap:160}, {seed:19,gap:220},
  ];
  for (const options of candidates) {
    const placed = await elkAutoLayout(nodes,automatic,direction,options);
    const next = layoutQuality(placed,automatic);
    if (!score || betterLayout(next,score)) { best=placed; score=next; }
  }
  // Layered placement can put a middle card directly in a long connection's
  // corridor. On small maps, compare side-to-side moves using the real router.
  // Preserve the selected flow axis and accept only strict quality improvements.
  if (nodes.length <= 12) {
    const horizontal = direction === 'LR' || direction === 'RL';
    for (const node of [...best]) {
      // Notes sharing a stack position must continue moving as a group.
      if(best.some(n=>n.id!==node.id && n.x===node.x && n.y===node.y)) continue;
      for (const sign of [-1,1]) {
        const candidate = best.map(n=>n.id===node.id?{
          ...n, [horizontal?'y':'x']: n[horizontal?'y':'x']+sign*((horizontal?n.h:n.w)+60),
        }:n);
        const next=layoutQuality(candidate,automatic);
        if(betterLayout(next,score)) { best=candidate; score=next; }
      }
    }
    const minX=Math.min(...best.map(n=>n.x)), minY=Math.min(...best.map(n=>n.y));
    best=best.map(n=>({...n,x:n.x-minX+24,y:n.y-minY+24}));
  }
  return best || nodes;
}

// Walk outward from root nodes (no incoming edges); for as long as a column
// contains exactly one node, that node is provably safe to move (nothing in
// its own column to collide with) — recenter it on the diagram's true
// cross-axis midpoint. Stops at the first column with siblings (a real
// branch point, out of scope for this local fix). Mutates `result` in
// place, matching elk.layout()'s own convention.
function recenterIsolatedRoots(result, horiz) {
  if (!result.children.length) return;
  const byId = Object.fromEntries(result.children.map(n => [n.id, n]));

  // "main" is the layering axis (x for LR/RL, y for TB/BT); "cross" is the
  // axis a lone node in its own layer is safe to recenter on.
  const mainOf = n => horiz ? n.x : n.y;
  const crossOf = n => horiz ? n.y : n.x;
  const crossSizeOf = n => horiz ? n.height : n.width;

  const sorted = [...result.children].sort((a, b) => mainOf(a) - mainOf(b));
  const layers = [];
  sorted.forEach(n => {
    const last = layers[layers.length - 1];
    if (last && Math.abs(mainOf(n) - last.main) < 25) last.nodes.push(n);
    else layers.push({ main: mainOf(n), nodes: [n] });
  });

  const isolatedChain = [];
  for (const layer of layers) {
    if (layer.nodes.length !== 1) break;
    isolatedChain.push(layer.nodes[0]);
  }
  if (!isolatedChain.length) return;

  const minCross = Math.min(...result.children.map(crossOf));
  const maxCross = Math.max(...result.children.map(n => crossOf(n) + crossSizeOf(n)));
  const trueCenter = (minCross + maxCross) / 2;

  const movedIds = new Set(isolatedChain.map(n => n.id));
  isolatedChain.forEach(n => {
    if (horiz) n.y = trueCenter - n.height / 2;
    else n.x = trueCenter - n.width / 2;
  });

  result.edges.forEach(e => {
    const s = byId[e.sources[0]], t = byId[e.targets[0]];
    if (!s || !t) return;
    if (!movedIds.has(e.sources[0]) && !movedIds.has(e.targets[0])) return;
    const sec = e.sections && e.sections[0];
    if (!sec) return;
    // Which face a node's port sits on depends on flow direction (LEFT/UP
    // reverse it vs RIGHT/DOWN) — inferred from the two nodes' relative
    // main-axis position rather than hardcoded, so it's correct either way.
    const forward = mainOf(s) <= mainOf(t);
    const fp = horiz
      ? { x: forward ? s.x + s.width : s.x, y: s.y + s.height / 2 }
      : { x: s.x + s.width / 2, y: forward ? s.y + s.height : s.y };
    const tp = horiz
      ? { x: forward ? t.x : t.x + t.width, y: t.y + t.height / 2 }
      : { x: t.x + t.width / 2, y: forward ? t.y : t.y + t.height };
    sec.startPoint = fp;
    sec.endPoint = tp;
    const straight = horiz ? Math.abs(fp.y - tp.y) < 1 : Math.abs(fp.x - tp.x) < 1;
    if (straight) {
      sec.bendPoints = [];
    } else if (horiz) {
      const midX = (fp.x + tp.x) / 2;
      sec.bendPoints = [{ x: midX, y: fp.y }, { x: midX, y: tp.y }];
    } else {
      const midY = (fp.y + tp.y) / 2;
      sec.bendPoints = [{ x: fp.x, y: midY }, { x: tp.x, y: midY }];
    }
  });
}
