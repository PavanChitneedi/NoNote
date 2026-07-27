// ── Edge style definitions ────────────────────────────────────
export const EDGE_STYLES = {
  // Basic
  arrow:         { label:"Arrow",        section:"Basic",   strokeW:2,   dash:"none", mEnd:"nn-arr",  mStart:null,       desc:"One-way arrow" },
  bidirectional: { label:"Both ways",    section:"Basic",   strokeW:2,   dash:"none", mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Arrow on both ends" },
  line:          { label:"Plain line",   section:"Basic",   strokeW:2,   dash:"none", mEnd:null,       mStart:null,       desc:"No arrowhead" },
  // Dashed
  dashed:        { label:"Dashed →",     section:"Dashed",  strokeW:2,   dash:"8,5",  mEnd:"nn-arr",  mStart:null,       desc:"Dashed with arrow" },
  "dashed-bi":   { label:"Dashed ↔",    section:"Dashed",  strokeW:2,   dash:"8,5",  mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Dashed bidirectional" },
  "dashed-line": { label:"Dashed line",  section:"Dashed",  strokeW:2,   dash:"8,5",  mEnd:null,       mStart:null,       desc:"Dashed, no arrow" },
  // Dotted
  dotted:        { label:"Dotted →",     section:"Dotted",  strokeW:2,   dash:"2,5",  mEnd:"nn-arr",  mStart:null,       desc:"Dotted with arrow" },
  "dotted-bi":   { label:"Dotted ↔",    section:"Dotted",  strokeW:2,   dash:"2,5",  mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Dotted bidirectional" },
  "dotted-line": { label:"Dotted line",  section:"Dotted",  strokeW:2,   dash:"2,5",  mEnd:null,       mStart:null,       desc:"Dotted, no arrow" },
  // Bold
  thick:         { label:"Bold →",       section:"Bold",    strokeW:4,   dash:"none", mEnd:"nn-tk",   mStart:null,       desc:"Bold arrow" },
  "thick-bi":    { label:"Bold ↔",       section:"Bold",    strokeW:4,   dash:"none", mEnd:"nn-tk",   mStart:"nn-tk",    desc:"Bold bidirectional" },
  // Double
  double:        { label:"Double →",     section:"Double",  strokeW:1.5, dash:"none", mEnd:"nn-dbl",  mStart:null,       desc:"Double chevron" },
  "double-bi":   { label:"Double ↔",    section:"Double",  strokeW:1.5, dash:"none", mEnd:"nn-dbl",  mStart:"nn-dbl",   desc:"Double bidirectional" },
  // Wavy / special
  wave:          { label:"Wave →",       section:"Special", strokeW:2,   dash:"none", mEnd:"nn-arr",  mStart:null,       desc:"Wavy / animated", wave:true },
  "wave-bi":     { label:"Wave ↔",      section:"Special", strokeW:2,   dash:"none", mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Wavy bidirectional", wave:true },
  // Semantic — note-taking relationships
  causes:        { label:"Causes →",     section:"Semantic",strokeW:2,   dash:"4,3",  mEnd:"nn-arr",  mStart:null,       desc:"Causal relationship", color:"#FF7043" },
  supports:      { label:"Supports →",   section:"Semantic",strokeW:2,   dash:"6,3",  mEnd:"nn-arr",  mStart:null,       desc:"Supporting evidence", color:"#66BB6A" },
  contradicts:   { label:"Contradicts",  section:"Semantic",strokeW:2,   dash:"4,3",  mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Opposing idea",       color:"#EF5350" },
  partof:        { label:"Part of",      section:"Semantic",strokeW:1.5, dash:"none", mEnd:"nn-arr",  mStart:null,       desc:"Containment / belongs to" },
  seealso:       { label:"See also",     section:"Semantic",strokeW:1.5, dash:"5,4",  mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Related concept" },
  leads:         { label:"Leads to →",   section:"Semantic",strokeW:2.5, dash:"none", mEnd:"nn-tk",   mStart:null,       desc:"Sequential / next step" },
  depends:       { label:"Depends on",   section:"Semantic",strokeW:2,   dash:"8,4",  mEnd:"nn-arr",  mStart:null,       desc:"Dependency" },
};

// Sections order for the panel
export const EDGE_SECTIONS = ["Basic","Dashed","Dotted","Bold","Double","Special","Semantic"];

// ── Edge start/end point on node rectangle edge ─────────────────
// nw/nh are the ACTUAL rendered dimensions (not just stored node.w/node.h)
export function rectEdgePoint(node, nw, nh, targetX, targetY) {
  const cx = node.x + nw/2, cy = node.y + nh/2;
  const dx = targetX - cx,  dy = targetY - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x:cx, y:cy };
  const hw = nw/2, hh = nh/2;
  const sx = Math.abs(dx) > 0.001 ? hw / Math.abs(dx) : Infinity;
  const sy = Math.abs(dy) > 0.001 ? hh / Math.abs(dy) : Infinity;
  const s  = Math.min(sx, sy);
  return { x: cx + dx*s, y: cy + dy*s };
}

// ── Best face picker — pure function, used by getEdgePath + port pre-compute ──
// Picks the (from, to) face pair that gives the most direct, non-backtracking path
export function pickBestSides(fx,fy,fw,fh,tx,ty,tw,th){
  // CRITICAL RULE: Always return OPPOSITE faces.
  // right→left, left→right, bottom→top, top→bottom.
  // Non-opposite pairs (right→right, bottom→left, etc.) create U-curves and loops.
  //
  // Uses STORED node dimensions (fw,fh,tw,th) not DOM-measured heights,
  // so the face decision is stable and independent of ref timing.
  //
  // Decision: whichever axis has larger center-to-center separation wins.
  // Tie goes to horizontal (cleaner for most diagram layouts).
  const fcx=fx+fw/2, fcy=fy+fh/2;
  const tcx=tx+tw/2, tcy=ty+th/2;
  const dx=tcx-fcx, dy=tcy-fcy;

  if(Math.abs(dx)>=Math.abs(dy)){
    // Horizontal dominant (or tie)
    return dx>=0?{from:"right",to:"left"}:{from:"left",to:"right"};
  } else {
    // Vertical dominant
    return dy>=0?{from:"bottom",to:"top"}:{from:"top",to:"bottom"};
  }
}

// Where an annotation connector attaches across its parent's face. Shared by
// the layout (which positions the note box) and the router (which picks the
// port) — they must agree or the connector stops being straight.
// Port assignment, as a pure function so the router, the renderer and the
// tests all use one implementation rather than three that can drift apart.
export function computePortMap(nodes, edges) {
    // Groups edges by (nodeId, side, from|to) and assigns evenly-spread t-values
    // so multiple arrows on the same face don't stack on the same pixel.
    //
    // CRITICAL: each group is SORTED by where the *other* end of the edge sits.
    // Assigning ports in edge-array order guarantees crossings whenever two
    // edges leave the same face toward targets in the opposite vertical order —
    // the edge heading to the lower node would get the upper port and the two
    // would have to cross right at the node. Sorting removes that entire class
    // of crossing for free.
    //
    // IMPORTANT: uses node.w/node.h (stored) NOT collW/collH (DOM ref) —
    // refs don't trigger memo updates so face decisions would be stale.
    const portGroups = {};
    // A node has at most one annotation block, and that connector is placed to
    // be perfectly perpendicular. Letting it join a stagger group would shove
    // it off centre and reintroduce a bend, so it always keeps the centre port.
    const annoParentCount = {};
    edges.forEach(e => {
      const f = nodes.find(n=>n.id===e.from), t = nodes.find(n=>n.id===e.to);
      if (!f || !t) return;
      if (t.type==='note' && f.type!=='note') annoParentCount[t.id] = (annoParentCount[t.id]||0)+1;
      if (f.type==='note' && t.type!=='note') annoParentCount[f.id] = (annoParentCount[f.id]||0)+1;
    });
    const isAnnoEdge = (f,t) =>
      (t.type==='note' && f.type!=='note' && annoParentCount[t.id]===1) ||
      (f.type==='note' && t.type!=='note' && annoParentCount[f.id]===1);

    // The annotation connector is offset off the node's centre line. Everything
    // else in the router uses centre-line stubs, so a centred annotation line
    // ends up running exactly on top of them. ANNO_T must match the offset used
    // when the note box is positioned in autoLayout, or the line stops being
    // straight.
    const annoT = {};
    edges.forEach(edge => {
      const f = nodes.find(n=>n.id===edge.from), t = nodes.find(n=>n.id===edge.to);
      if (!f || !t || !isAnnoEdge(f,t)) return;
      const parentIsFrom = f.type !== 'note';
      annoT[`${edge.id}:${parentIsFrom?'from':'to'}`] = 0.5;     // parent side
      annoT[`${edge.id}:${parentIsFrom?'to':'from'}`] = 0.5;     // note side
    });

    edges.forEach(edge => {
      const f = nodes.find(n=>n.id===edge.from);
      const t = nodes.find(n=>n.id===edge.to);
      if (!f || !t) return;
      if (isAnnoEdge(f,t)) return;   // keeps the default 0.5 centre port
      // Use stored dimensions for consistent, stable face selection
      const fw=f.w||220, fh=f.h||96, tw=t.w||220, th=t.h||96;

      if (!edge.fromAnchor || edge.fromAnchor.side==="auto") {
        const {from:fSide} = pickBestSides(f.x,f.y,fw,fh,t.x,t.y,tw,th);
        const k=`${edge.from}:${fSide}:from`;
        // rank = position of the OTHER end along this face's spread axis
        const rank = (fSide==="left"||fSide==="right") ? (t.y+th/2) : (t.x+tw/2);
        (portGroups[k]=portGroups[k]||[]).push({id:edge.id, rank});
      }
      if (!edge.toAnchor || edge.toAnchor.side==="auto") {
        const {to:tSide} = pickBestSides(f.x,f.y,fw,fh,t.x,t.y,tw,th);
        const k=`${edge.to}:${tSide}:to`;
        const rank = (tSide==="left"||tSide==="right") ? (f.y+fh/2) : (f.x+fw/2);
        (portGroups[k]=portGroups[k]||[]).push({id:edge.id, rank});
      }
    });

    // Spread t-values evenly across [0.2, 0.8], in sorted order:
    //   1 edge  → 0.5
    //   2 edges → 0.27, 0.73
    //   3 edges → 0.2, 0.5, 0.8
    const tMap = {};
    // Faces that carry an annotation connector must keep their centre line
    // clear: the annotation is pinned to 0.5 so it stays straight, and any
    // other edge landing on 0.5 would run right along the top of it.
    const annoFaces = new Set();
    edges.forEach(edge => {
      const f = nodes.find(n=>n.id===edge.from), t = nodes.find(n=>n.id===edge.to);
      if (!f || !t || !isAnnoEdge(f,t)) return;
      const p = f.type !== 'note' ? f : t, o = f.type !== 'note' ? t : f;
      const pw=p.w||220, ph=p.h||96, ow=o.w||220, oh=o.h||96;
      const sides = pickBestSides(p.x,p.y,pw,ph,o.x,o.y,ow,oh);
      annoFaces.add(`${p.id}:${sides.from}`);
      annoFaces.add(`${p.id}:${sides.to}`);
    });
    Object.entries(portGroups).forEach(([key, group]) => {
      const [nodeId, side, role] = key.split(":");
      group.sort((a,b)=>a.rank-b.rank);
      const n = group.length;
      const keepClear = annoFaces.has(`${nodeId}:${side}`);
      group.forEach((item, i) => {
        let t = n===1 ? 0.5 : 0.2+(i/(n-1))*0.6;
        if (keepClear && Math.abs(t-0.5) < 0.08) t = i < n/2 ? 0.38 : 0.62;
        tMap[`${item.id}:${role}`] = t;
      });
    });
    Object.assign(tMap, annoT);
    return tMap;
}

export const ANNO_T = 0.32;
// Collapsed height of a note-group box: header + up to three preview rows,
// plus a "+N more" row when there are extras. autoLayout reserves exactly this.
// Collapsed content is now fixed (header + one note's title + one snippet
// line) regardless of how many notes are in the stack, so the reserved
// height no longer scales with count. It stays a function of n for call-site
// compatibility, but the box height is hard-pinned via CSS either way, so
// this number IS the real height — it just needs to comfortably fit the
// content, not predict it.
export const STACK_BOX_H = () => 96;

// ── A* orthogonal router ─────────────────────────────────────────
// Heuristics can only ever approximate. This searches for the genuinely
// shortest legal path instead: it builds a sparse grid from the node
// boundaries (a Hanan grid — the optimal orthogonal route is guaranteed to lie
// on it), removes every segment that would pass through a node, then runs A*.
// Because a blocked segment simply does not exist in the graph, crossing a node
// is impossible rather than merely unlikely. Turn cost keeps paths from
// zig-zagging, and a congestion cost makes later edges step aside instead of
// running on top of earlier ones.
const TURN_COST = 34;      // a bend is worth ~34px of extra length
const CONGEST_COST = 500;  // reusing another edge's segment: strongly discouraged

function segKey(x1,y1,x2,y2) {
  return x1<x2||(x1===x2&&y1<=y2) ? `${x1},${y1},${x2},${y2}` : `${x2},${y2},${x1},${y1}`;
}

// Build ONE grid shared by every edge. Rebuilding it per edge (the obvious
// approach) silently breaks congestion tracking: each edge lands on slightly
// different grid lines, so the segment keys never match and no edge ever sees
// that another has already used a line. Geometry is shared; only which boxes
// count as blocking varies per edge.
function buildRoutingGrid(boxes, ports, margin = 16, lanes = [0, 18, 36]) {
  const xs = new Set(), ys = new Set();
  boxes.forEach(b => lanes.forEach(o => {
    xs.add(b.x - margin - o); xs.add(b.x + b.w + margin + o);
    ys.add(b.y - margin - o); ys.add(b.y + b.h + margin + o);
  }));
  ports.forEach(p => { xs.add(p.x); ys.add(p.y); });
  return { xs: [...xs].sort((a,b)=>a-b), ys: [...ys].sort((a,b)=>a-b) };
}

// Minimal binary heap — the open set gets large enough that scanning it
// linearly dominates the search time.
function heapPush(h, item) {
  h.push(item);
  let i = h.length - 1;
  while (i > 0) {
    const p = (i-1) >> 1;
    if (h[p][0] <= h[i][0]) break;
    [h[p], h[i]] = [h[i], h[p]]; i = p;
  }
}
function heapPop(h) {
  const top = h[0], last = h.pop();
  if (h.length) {
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2*i+1, r = l+1;
      let m = i;
      if (l < h.length && h[l][0] < h[m][0]) m = l;
      if (r < h.length && h[r][0] < h[m][0]) m = r;
      if (m === i) break;
      [h[m], h[i]] = [h[i], h[m]]; i = m;
    }
  }
  return top;
}

function astarRoute(fp, fn1, tp, fn2, obstacles, usage, grid, opts = {}) {
  const STUB = opts.stub ?? 24;
  const start = { x: fp.x + fn1.dx*STUB, y: fp.y + fn1.dy*STUB };
  const goal  = { x: tp.x + fn2.dx*STUB, y: tp.y + fn2.dy*STUB };
  if (!grid) return null;
  const { xs, ys } = grid;
  const xi = new Map(xs.map((v,i)=>[v,i]));
  const yi = new Map(ys.map((v,i)=>[v,i]));
  if (!xi.has(start.x) || !yi.has(start.y) || !xi.has(goal.x) || !yi.has(goal.y)) return null;

  const W = xs.length, H = ys.length;
  if (W*H > 90000) return null;

  const blocked = (x1,y1,x2,y2) => obstacles.some(b => {
    const sx1=Math.min(x1,x2), sx2=Math.max(x1,x2);
    const sy1=Math.min(y1,y2), sy2=Math.max(y1,y2);
    return sx1 < b.x+b.w && sx2 > b.x && sy1 < b.y+b.h && sy2 > b.y;
  });

  const idx = (i,j) => j*W + i;
  const g = new Float64Array(W*H).fill(Infinity);
  const cameFrom = new Int32Array(W*H).fill(-1);
  const dirOf = new Int8Array(W*H).fill(-1);
  const closed = new Uint8Array(W*H);
  const si = idx(xi.get(start.x), yi.get(start.y));
  const gxi = xi.get(goal.x), gyi = yi.get(goal.y);
  const gi = idx(gxi, gyi);
  const h = (i,j) => Math.abs(xs[i]-xs[gxi]) + Math.abs(ys[j]-ys[gyi]);

  g[si] = 0;
  dirOf[si] = Math.abs(fn1.dx) > 0.5 ? 0 : 1;
  const open = [];
  heapPush(open, [h(xi.get(start.x), yi.get(start.y)), si]);

  while (open.length) {
    const [, cur] = heapPop(open);
    if (cur === gi) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const ci = cur % W, cj = (cur - ci) / W;
    const cx = xs[ci], cy = ys[cj];
    for (const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const ni = ci+di, nj = cj+dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
      const n = idx(ni,nj);
      if (closed[n]) continue;
      const nx = xs[ni], ny = ys[nj];
      if (blocked(cx,cy,nx,ny)) continue;
      const dir = di !== 0 ? 0 : 1;
      const len = Math.abs(nx-cx) + Math.abs(ny-cy);
      const turn = (dirOf[cur] !== -1 && dirOf[cur] !== dir) ? TURN_COST : 0;
      const used = usage ? (usage.get(segKey(cx,cy,nx,ny))||0) : 0;
      const ng = g[cur] + len + turn + used*CONGEST_COST;
      if (ng < g[n]) {
        g[n] = ng; cameFrom[n] = cur; dirOf[n] = dir;
        heapPush(open, [ng + h(ni,nj), n]);
      }
    }
  }
  if (!isFinite(g[gi])) return null;

  const pts = [];
  for (let c = gi; c !== -1; c = cameFrom[c]) {
    const i = c % W, j = (c - i) / W;
    pts.push({ x: xs[i], y: ys[j] });
    if (c === si) break;
  }
  pts.reverse();
  // Record occupancy at GRID resolution, before simplification. Marking the
  // simplified path instead stores one long segment whose key can never match
  // the short grid segments A* actually looks up — which silently disables
  // congestion avoidance entirely.
  if (usage) {
    for (let i = 0; i < pts.length-1; i++) {
      const k = segKey(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
      usage.set(k, (usage.get(k)||0) + 1);
    }
  }
  const full = [fp, ...pts, tp];
  const simp = [];
  full.forEach(p => {
    const n = simp.length;
    if (n && Math.abs(simp[n-1].x-p.x) < 0.5 && Math.abs(simp[n-1].y-p.y) < 0.5) return;
    if (n >= 2) {
      const a = simp[n-2], b = simp[n-1];
      const collinear = (Math.abs(a.x-b.x)<0.5 && Math.abs(b.x-p.x)<0.5)
                     || (Math.abs(a.y-b.y)<0.5 && Math.abs(b.y-p.y)<0.5);
      if (collinear) { simp[n-1] = p; return; }
    }
    simp.push(p);
  });
  return simp;
}

function markUsage(pts, usage) {
  if (!usage || !pts) return;
  for (let i = 0; i < pts.length-1; i++) {
    const k = segKey(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    usage.set(k, (usage.get(k)||0) + 1);
  }
}

// ── Orthogonal (Manhattan) edge routing ──────────────────────────
// Curved beziers between two points can't avoid anything: they pass straight
// through nodes, overlap each other when several edges share a corridor, and
// balloon into big loops on long spans. Orthogonal routing fixes all three by
// (a) leaving each node perpendicular to its face, (b) travelling down a
// dedicated "lane" in the empty channel between nodes, and (c) checking that
// lane against every node rectangle before committing to it.

// Turn a polyline into an SVG path with rounded corners.
export function roundedPolyPath(pts, r = 14) {
  const P = [];
  pts.forEach(p => {
    const last = P[P.length-1];
    if (!last || Math.abs(last.x-p.x) > 0.5 || Math.abs(last.y-p.y) > 0.5) P.push(p);
  });
  if (P.length < 2) return '';
  let d = `M ${P[0].x} ${P[0].y}`;
  for (let i = 1; i < P.length-1; i++) {
    const p = P[i], prev = P[i-1], next = P[i+1];
    const v1 = { x: p.x-prev.x, y: p.y-prev.y };
    const v2 = { x: next.x-p.x, y: next.y-p.y };
    const l1 = Math.hypot(v1.x,v1.y) || 1, l2 = Math.hypot(v2.x,v2.y) || 1;
    const rr = Math.min(r, l1/2, l2/2);
    d += ` L ${p.x - v1.x/l1*rr} ${p.y - v1.y/l1*rr}`;
    d += ` Q ${p.x} ${p.y}, ${p.x + v2.x/l2*rr} ${p.y + v2.y/l2*rr}`;
  }
  const last = P[P.length-1];
  return d + ` L ${last.x} ${last.y}`;
}

// Does an axis-aligned segment pass through any obstacle rectangle?
export function segHitsRects(x1, y1, x2, y2, rects, pad = 8) {
  const lo = (a,b) => Math.min(a,b), hi = (a,b) => Math.max(a,b);
  const sx1 = lo(x1,x2), sx2 = hi(x1,x2), sy1 = lo(y1,y2), sy2 = hi(y1,y2);
  return rects.some(r => {
    const rx1 = r.x - pad, ry1 = r.y - pad;
    const rx2 = r.x + r.w + pad, ry2 = r.y + r.h + pad;
    return sx1 < rx2 && sx2 > rx1 && sy1 < ry2 && sy2 > ry1;
  });
}

// Face-normal vector and border point for a box side — shared by edge routing
// and edge bundling.
export function nrm(side) {
  return side==="right" ? {dx:1,dy:0} : side==="left" ? {dx:-1,dy:0} : side==="top" ? {dx:0,dy:-1} : {dx:0,dy:1};
}
export function port(b, side, t) {
  return side==="right" ? {x:b.x+b.w, y:b.y+b.h*t}
       : side==="left"  ? {x:b.x,     y:b.y+b.h*t}
       : side==="top"   ? {x:b.x+b.w*t, y:b.y}
       :                  {x:b.x+b.w*t, y:b.y+b.h};
}

export const TRUNK_MIN = 40, TRUNK_MAX = 110;

// Shared trunk + spine for a fan-out/fan-in bundle — see edgeBundles in
// NodeCanvas for how FAN-OUT (one source, several targets) and FAN-IN
// (several sources, one target) both funnel through this same geometry by
// calling the shared endpoint "trunkPt" and the scattered endpoints
// "branches". Returns null if the trunk, spine, or any branch would be
// blocked by an obstacle — callers fall back to individual A* routes.
export function buildBundle(trunkPt, trunkSide, branchSpecs, baseObstacles, clearBox) {
  const horiz = trunkSide==="left"||trunkSide==="right";
  const fn = nrm(trunkSide);
  const cross = p => horiz ? p.y : p.x;
  const main  = p => horiz ? p.x : p.y;
  let spineOffset = Math.min(TRUNK_MAX, Math.max(TRUNK_MIN, Math.min(...branchSpecs.map(b=>b.gap))/2));
  // A node's own note sits in the same corridor the trunk exits into. It's
  // excluded from the hard obstacle check (below) so the bundle isn't
  // rejected outright, but the trunk should still visually clear it rather
  // than run straight through it — so route past its far edge instead of
  // stopping at the default offset.
  if (clearBox) {
    const farEdge = horiz
      ? (fn.dx > 0 ? clearBox.x + clearBox.w : clearBox.x)
      : (fn.dy > 0 ? clearBox.y + clearBox.h : clearBox.y);
    const neededOffset = Math.abs(farEdge - main(trunkPt)) + 20;
    spineOffset = Math.max(spineOffset, Math.min(neededOffset, TRUNK_MAX*3));
  }
  const spineMain = main(trunkPt) + (horiz?fn.dx:fn.dy)*spineOffset;
  const at = (m,c) => horiz ? {x:m,y:c} : {x:c,y:m};
  const stemPts = [trunkPt, at(spineMain, cross(trunkPt))];
  const crosses = [...branchSpecs.map(b=>cross(b.entry)), cross(trunkPt)];
  const spinePts = [at(spineMain, Math.min(...crosses)), at(spineMain, Math.max(...crosses))];

  const blocked = (p,q,obs) => segHitsRects(p.x,p.y,q.x,q.y,obs,4);
  // The stem and spine are shared corridor — every sibling target is a real
  // obstacle here, none of them get excluded.
  if (blocked(stemPts[0],stemPts[1],baseObstacles) || blocked(spinePts[0],spinePts[1],baseObstacles)) return null;
  const branchPts = {};
  for (const b of branchSpecs) {
    // A branch's own target is not an obstacle to ITSELF — but every OTHER
    // sibling's target still is. Excluding all group targets for every
    // branch (the earlier version) let one branch's line cut straight
    // through a sibling's box, since that box had been blanket-excluded
    // group-wide instead of only for its own branch.
    const branchObstacles = b.targetId ? baseObstacles.filter(x => x.id !== b.targetId) : baseObstacles;
    const junction = at(spineMain, cross(b.entry));
    if (blocked(junction, b.entry, branchObstacles)) return null;
    branchPts[b.id] = [junction, b.entry];
  }
  return { stemPts, spinePts, branchPts };
}

// Build an orthogonal route. `lane` is the preferred coordinate of the middle
// travel segment; obstacles are the node rects to route around.
export function orthoRoute(fp, fn1, tp, fn2, lane, obstacles = []) {
  const STUB = 26;                       // straight run off the node face
  const horizExit  = Math.abs(fn1.dx) > 0.5;
  const horizEnter = Math.abs(fn2.dx) > 0.5;

  // If the two ports are close to lining up and the direct run is clear, draw a
  // straight line — nudging the endpoint by a few pixels rather than inserting
  // a visible jog. A 4px offset does not need a bend to express it, and those
  // tiny jogs are the single biggest source of visual noise on a dense map.
  const SNAP = 12;
  const dPerp = horizExit && horizEnter ? Math.abs(fp.y - tp.y)
              : !horizExit && !horizEnter ? Math.abs(fp.x - tp.x)
              : Infinity;
  if (dPerp < SNAP) {
    const a2 = horizExit ? { x: fp.x, y: fp.y } : { x: fp.x, y: fp.y };
    const b2 = horizExit ? { x: tp.x, y: fp.y } : { x: fp.x, y: tp.y };
    if (!segHitsRects(a2.x, a2.y, b2.x, b2.y, obstacles)) return [a2, b2];
  }

  const a = { x: fp.x + fn1.dx*STUB, y: fp.y + fn1.dy*STUB };
  const b = { x: tp.x + fn2.dx*STUB, y: tp.y + fn2.dy*STUB };

  const mk = (mid) => {
    if (horizExit && horizEnter) return [fp, a, {x:mid,y:a.y}, {x:mid,y:b.y}, b, tp];
    if (!horizExit && !horizEnter) return [fp, a, {x:a.x,y:mid}, {x:b.x,y:mid}, b, tp];
    if (horizExit && !horizEnter) return [fp, a, {x:b.x,y:a.y}, b, tp];
    return [fp, a, {x:a.x,y:b.y}, b, tp];
  };

  const bothSameAxis = (horizExit && horizEnter) || (!horizExit && !horizEnter);
  if (!bothSameAxis) return mk(0);

  const base = lane !== undefined && lane !== null
    ? lane
    : (horizExit ? (a.x + b.x)/2 : (a.y + b.y)/2);

  // Try the assigned lane first, then progressively wider offsets if the
  // travel segment would cut through a node.
  const hits = (mid) => {
    const pts = mk(mid);
    for (let i = 0; i < pts.length-1; i++) {
      if (segHitsRects(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, obstacles)) return true;
    }
    return false;
  };
  if (!hits(base)) return mk(base);
  for (let step = 1; step <= 12; step++) {
    for (const sign of [1,-1]) {
      const cand = base + sign*step*26;
      if (!hits(cand)) return mk(cand);
    }
  }

  // Still blocked — the edge has to cross a whole row/column of nodes. Shifting
  // the single travel segment can't help, because it's the legs at the source
  // and target heights that are hitting things. Use a 5-segment route instead:
  // step out, run along a clear corridor *between* rows, then come back in.
  const corridorHits = (c) => {
    const pts = horizExit
      ? [fp, a, {x:a.x,y:c}, {x:b.x,y:c}, b, tp]
      : [fp, a, {x:c,y:a.y}, {x:c,y:b.y}, b, tp];
    for (let i = 0; i < pts.length-1; i++) {
      if (segHitsRects(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, obstacles)) return null;
    }
    return pts;
  };
  // Candidate corridors: the gaps between obstacle edges, nearest first.
  // Two edges detouring around the SAME obstacle would otherwise pick the
  // identical corridor and run exactly on top of each other, so each edge is
  // nudged by a small offset derived from its lane — enough to keep them
  // visually distinct without changing the shape of the route.
  const bias = lane !== undefined && lane !== null ? ((Math.round(lane) % 3) - 1) * 10 : 0;
  const bounds = [];
  obstacles.forEach(r => {
    if (horizExit) { bounds.push(r.y - 30 + bias, r.y + r.h + 30 + bias); }
    else           { bounds.push(r.x - 30 + bias, r.x + r.w + 30 + bias); }
  });
  const from = horizExit ? fp.y : fp.x;
  bounds.sort((p,q) => Math.abs(p-from) - Math.abs(q-from));
  for (const c of bounds) {
    const pts = corridorHits(c);
    if (pts) return pts;
  }
  return mk(base);
}

export function anchorToPoint(node, nw, nh, anchor) {
  const {side, t=0.5} = anchor;
  switch(side) {
    case "top":    return {x: node.x + nw*t, y: node.y,      normal:{dx:0, dy:-1}};
    case "bottom": return {x: node.x + nw*t, y: node.y + nh, normal:{dx:0, dy:1}};
    case "left":   return {x: node.x,        y: node.y+nh*t, normal:{dx:-1,dy:0}};
    case "right":  return {x: node.x + nw,   y: node.y+nh*t, normal:{dx:1, dy:0}};
    default:       return null; // "auto" — use rectEdgePoint
  }
}

// Snap a canvas-space click position to the nearest border anchor {side,t}
export function snapToAnchor(node, nw, nh, cx, cy) {
  // distances to each face
  const dTop    = Math.abs(cy - node.y);
  const dBottom = Math.abs(cy - (node.y + nh));
  const dLeft   = Math.abs(cx - node.x);
  const dRight  = Math.abs(cx - (node.x + nw));
  const minD = Math.min(dTop, dBottom, dLeft, dRight);
  const SNAP_DIST = Math.min(nw, nh) * 0.3; // snap zone = 30% of smallest dim
  if (minD > SNAP_DIST) return null; // too far from any edge — use auto
  if      (minD === dTop)    return {side:"top",    t: Math.min(1,Math.max(0,(cx-node.x)/nw))};
  else if (minD === dBottom) return {side:"bottom", t: Math.min(1,Math.max(0,(cx-node.x)/nw))};
  else if (minD === dLeft)   return {side:"left",   t: Math.min(1,Math.max(0,(cy-node.y)/nh))};
  else                       return {side:"right",  t: Math.min(1,Math.max(0,(cy-node.y)/nh))};
}

// Internal A* pathfinding pieces exported for potential reuse/testing by
// higher-level routing code in NodeCanvas.jsx.
export { segKey, buildRoutingGrid, heapPush, heapPop, astarRoute, markUsage };
