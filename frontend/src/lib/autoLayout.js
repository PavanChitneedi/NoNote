import { DEF_W, DEF_H } from "./nodeTypes.js";
import { STACK_BOX_H } from "./edgeRouting.js";

// ── Auto-layout — topological layers, centered, no overlap ──
export function autoLayout(nodes, edges, direction='LR') {
  if (!nodes.length) return nodes;
  try {
    const PAD       = 80;   // canvas padding
    const LAYER_GAP = 140;  // gap between depth layers (main axis)
    const NODE_GAP  = 44;   // min gap between nodes within a layer (cross axis)
    const ANNO_GAP  = 60;   // gap between a node and its own notes
    const nodeW = n => n?.w || DEF_W;
    const nodeH = n => n?.h || DEF_H;
    const rawById = id => nodes.find(n => n.id === id);
    const isHoriz = direction === 'LR' || direction === 'RL';

    // ── 0. Separate annotations from the graph proper ────────────────
    // A note attached to exactly one node is an ANNOTATION on that node, not a
    // peer in the graph. Laying it out as a graph node puts it in the same
    // layer as that node's real children, where it competes for a slot and gets
    // shoved away from its own parent — which is precisely why notes end up
    // scattered. Annotations are pulled out of the graph entirely and parked in
    // a gutter beside their parent afterwards. Notes shared by several nodes
    // stay in the graph, since they genuinely belong to more than one place.
    const noteParents = {};
    edges.forEach(e => {
      const fn = rawById(e.from), tn = rawById(e.to);
      if (tn?.type === 'note' && fn?.type !== 'note') (noteParents[e.to]  = noteParents[e.to]  || []).push(e.from);
      if (fn?.type === 'note' && tn?.type !== 'note') (noteParents[e.from]= noteParents[e.from]|| []).push(e.to);
    });
    const annoOf = {};   // parentId -> [noteId,...]
    nodes.forEach(n => {
      if (n.type !== 'note') return;
      if (n.customProps?._ungrouped) return;   // manually pulled out of its stack
      const ps = [...new Set(noteParents[n.id] || [])];
      if (ps.length === 1 && rawById(ps[0])) (annoOf[ps[0]] = annoOf[ps[0]] || []).push(n.id);
    });
    const annoIds = new Set(Object.values(annoOf).flat());
    const core = nodes.filter(n => !annoIds.has(n.id));
    if (!core.length) return nodes;

    // Rendered size of a node's annotation block. Width is fixed at 240 for a
    // group; height is content-driven, so it is ESTIMATED. Placement below is
    // arranged so that only spacing depends on the height estimate — never the
    // straightness of the connector.
    const STACK_W = 240;
    const stackH = STACK_BOX_H;
    const annoBox = pid => {
      const ids = annoOf[pid];
      if (!ids || !ids.length) return null;
      if (ids.length >= 2) return { w: STACK_W, h: stackH(ids.length) };
      const n = rawById(ids[0]);
      return { w: n?.w || 240, h: n?.h || 160 };
    };
    // Notes sit BESIDE their parent — on the outgoing side, centred on the
    // parent. The note block is given its own reserved band in the layer so it
    // never collides with anything, and its own column so it never widens the
    // gap between layers more than it needs to.
    const annoCross = pid => { const b = annoBox(pid); return b ? (isHoriz ? b.h : b.w) : 0; };
    const annoMain  = pid => { const b = annoBox(pid); return b ? (isHoriz ? b.w : b.h) : 0; };

    const crossSize = id => isHoriz ? nodeH(rawById(id)) : nodeW(rawById(id));
    const mainSize  = id => isHoriz ? nodeW(rawById(id)) : nodeH(rawById(id));
    // Reserve whichever is taller: the node, or its note block beside it.
    const effSize   = id => Math.max(crossSize(id), annoCross(id));

    const coreIds = core.map(n => n.id);
    const isCore = new Set(coreIds);

    // ── 1. Adjacency over core nodes only ────────────────────────────
    const children = {}, parents = {};
    coreIds.forEach(u => { children[u] = []; parents[u] = []; });
    edges.forEach(e => {
      if (!isCore.has(e.from) || !isCore.has(e.to) || e.from === e.to) return;
      if (!children[e.from].includes(e.to)) { children[e.from].push(e.to); parents[e.to].push(e.from); }
    });

    // ── 2. Break cycles ──────────────────────────────────────────────
    const vis = new Set(), stk = new Set();
    (function () {
      function walk(id) {
        vis.add(id); stk.add(id);
        for (const c of [...children[id]]) {
          if (stk.has(c)) {
            children[id] = children[id].filter(x => x !== c);
            parents[c]   = parents[c].filter(x => x !== id);
          } else if (!vis.has(c)) walk(c);
        }
        stk.delete(id);
      }
      coreIds.forEach(u => { if (!vis.has(u)) walk(u); });
    })();

    // ── 3. Longest-path layering ─────────────────────────────────────
    const depthOf = {};
    {
      const memo = {}, seen = new Set();
      function d(id) {
        if (memo[id] !== undefined) return memo[id];
        if (seen.has(id)) return 0;
        seen.add(id);
        const pd = parents[id].map(p => d(p) + 1);
        seen.delete(id);
        return (memo[id] = pd.length ? Math.max(...pd) : 0);
      }
      coreIds.forEach(u => { depthOf[u] = d(u); });
    }
    const maxDepth = Math.max(0, ...coreIds.map(u => depthOf[u]));

    // Place a node's annotation block perpendicular to the flow direction.
    // Centred on the axis whose size is exact, so the connector is straight.
    const placeAnnotations = (posX, posY, out) => {
      Object.keys(annoOf).forEach(pid => {
        const p = out.find(n => n.id === pid);
        const box = annoBox(pid);
        if (!p || !box) return;
        let ax, ay;
        if (direction === 'RL')      { ax = p.x - ANNO_GAP - box.w;      ay = p.y + nodeH(p)/2 - box.h/2; }
        else if (direction === 'BT') { ax = p.x + nodeW(p)/2 - box.w/2;  ay = p.y - ANNO_GAP - box.h; }
        else if (isHoriz)            { ax = p.x + nodeW(p) + ANNO_GAP;   ay = p.y + nodeH(p)/2 - box.h/2; }
        else                         { ax = p.x + nodeW(p)/2 - box.w/2;  ay = p.y + nodeH(p) + ANNO_GAP; }
        annoOf[pid].forEach(nid => { posX[nid] = ax; posY[nid] = ay; });
      });
    };

    // ── 4. RADIAL ────────────────────────────────────────────────────
    if (direction === 'radial') {
      const cx=2000, cy=1500, radii=[0,340,640,940,1240,1540];
      const px={}, py={};
      const byDepth = Array.from({length:6}, ()=>[]);
      coreIds.forEach(u => byDepth[Math.min(depthOf[u],5)].push(u));
      byDepth.forEach((layer,li) => {
        const r=radii[li];
        layer.forEach((id,i) => {
          if (li===0 && layer.length===1) { px[id]=cx-nodeW(rawById(id))/2; py[id]=cy-nodeH(rawById(id))/2; }
          else {
            const a=(i/Math.max(layer.length,1))*Math.PI*2-Math.PI/2;
            px[id]=cx+r*Math.cos(a)-nodeW(rawById(id))/2;
            py[id]=cy+r*Math.sin(a)-nodeH(rawById(id))/2;
          }
        });
      });
      const out = nodes.map(n => px[n.id]!==undefined ? {...n,x:Math.round(px[n.id]),y:Math.round(py[n.id])} : {...n});
      const PX={}, PY={};
      Object.keys(annoOf).forEach(pid => {
        const p = out.find(n=>n.id===pid); if(!p) return;
        const box = annoBox(pid); if(!box) return;
        const ang = Math.atan2((p.y+nodeH(p)/2)-cy, (p.x+nodeW(p)/2)-cx);
        const ax = p.x + Math.cos(ang)*(nodeW(p)/2 + ANNO_GAP + box.w/2) + nodeW(p)/2 - box.w/2;
        const ay = p.y + Math.sin(ang)*(nodeH(p)/2 + ANNO_GAP + box.h/2) + nodeH(p)/2 - box.h/2;
        annoOf[pid].forEach(nid => { PX[nid]=ax; PY[nid]=ay; });
      });
      return out.map(n => PX[n.id]!==undefined ? {...n,x:Math.round(PX[n.id]),y:Math.round(PY[n.id])} : n);
    }

    // ── 5. Main-axis position per layer ──────────────────────────────
    const layerPos = [];
    let curMain = PAD;
    for (let d = 0; d <= maxDepth; d++) {
      layerPos[d] = curMain;
      const atD = coreIds.filter(u => depthOf[u] === d);
      const widest = atD.length ? Math.max(...atD.map(mainSize)) : DEF_W;
      const gutter = atD.length ? Math.max(0, ...atD.map(annoMain)) : 0;
      curMain += widest + (gutter ? gutter + ANNO_GAP : 0) + LAYER_GAP;
    }

    // ── 6. Order within each layer — crossing reduction ──────────────
    const layers = [];
    coreIds.forEach(u => { const d = depthOf[u]; (layers[d] = layers[d] || []).push(u); });

    {
      const primaryParent = {};
      coreIds.forEach(u => {
        if (!parents[u].length) return;
        primaryParent[u] = parents[u].reduce((best,p) => depthOf[p] > depthOf[best] ? p : best);
      });
      const treeKids = {};
      coreIds.forEach(u => { treeKids[u] = []; });
      coreIds.forEach(u => { if (primaryParent[u]) treeKids[primaryParent[u]].push(u); });
      const seq = [], seen = new Set();
      coreIds.filter(u => !primaryParent[u]).forEach(function walk(id) {
        if (seen.has(id)) return;
        seen.add(id); seq.push(id);
        treeKids[id].forEach(walk);
      });
      coreIds.forEach(u => { if (!seen.has(u)) seq.push(u); });
      const rank = Object.fromEntries(seq.map((id,i) => [id,i]));
      layers.forEach(l => l && l.sort((a,b) => rank[a]-rank[b]));
    }

    const orderIndex = {};
    layers.forEach(l => l && l.forEach((id,i) => { orderIndex[id] = i; }));

    function countCrossings() {
      let total = 0;
      for (let d = 0; d < layers.length-1; d++) {
        if (!layers[d] || !layers[d+1]) continue;
        const pairs = [];
        layers[d].forEach(u => children[u].forEach(v => {
          if (depthOf[v] === d+1) pairs.push([orderIndex[u], orderIndex[v]]);
        }));
        for (let i = 0; i < pairs.length; i++)
          for (let j = i+1; j < pairs.length; j++)
            if ((pairs[i][0]-pairs[j][0]) * (pairs[i][1]-pairs[j][1]) < 0) total++;
      }
      return total;
    }
    function sortLayer(layer, refIds) {
      const ref = new Set(refIds || []);
      const bc = {};
      layer.forEach(id => {
        const nb = [...parents[id], ...children[id]].filter(x => ref.has(x));
        bc[id] = nb.length ? nb.reduce((s,x)=>s+orderIndex[x],0)/nb.length : orderIndex[id];
      });
      layer.sort((a,b) => bc[a]-bc[b] || orderIndex[a]-orderIndex[b]);
      layer.forEach((id,i) => { orderIndex[id] = i; });
    }
    let bestCross = countCrossings();
    let bestOrder = layers.map(l => l ? [...l] : l);
    for (let it = 0; it < 8 && bestCross > 0; it++) {
      if (it % 2 === 0) for (let d = 1; d < layers.length; d++)    layers[d] && sortLayer(layers[d], layers[d-1]);
      else               for (let d = layers.length-2; d >= 0; d--) layers[d] && sortLayer(layers[d], layers[d+1]);
      const c = countCrossings();
      if (c < bestCross) { bestCross = c; bestOrder = layers.map(l => l ? [...l] : l); }
    }
    bestOrder.forEach((l,d) => { if (l) layers[d] = l; });
    layers.forEach(l => l && l.forEach((id,i) => { orderIndex[id] = i; }));

    // ── 7. Cross-axis coordinates ────────────────────────────────────
    const cross = {};
    // The node sits at the TOP of its reserved block; its notes hang below
    // inside the same block, so nothing else can be packed into that space.
    const effTop = id => cross[id] + crossSize(id)/2 - effSize(id)/2;
    const setEffTop = (id,t) => { cross[id] = t + effSize(id)/2 - crossSize(id)/2; };

    layers.forEach(layer => {
      if (!layer) return;
      let c = PAD;
      layer.forEach(id => { setEffTop(id, c); c += effSize(id) + NODE_GAP; });
    });

    function resolveOverlaps(layer) {
      for (let i = 1; i < layer.length; i++) {
        const prev = layer[i-1], cur = layer[i];
        const minT = effTop(prev) + effSize(prev) + NODE_GAP;
        if (effTop(cur) < minT) setEffTop(cur, minT);
      }
      for (let i = layer.length-2; i >= 0; i--) {
        const next = layer[i+1], cur = layer[i];
        const maxT = effTop(next) - NODE_GAP - effSize(cur);
        if (effTop(cur) > maxT) setEffTop(cur, maxT);
      }
      const minStart = Math.min(...layer.map(effTop));
      if (minStart < PAD) layer.forEach(id => { cross[id] += PAD - minStart; });
    }

    for (let it = 0; it < 12; it++) {
      const order = it % 2 === 0 ? [...layers.keys()] : [...layers.keys()].reverse();
      order.forEach(d => {
        const layer = layers[d];
        if (!layer) return;
        layer.forEach(id => {
          const nb = it % 2 === 0 ? parents[id] : children[id];
          const ref = nb.length ? nb : [...parents[id], ...children[id]];
          if (!ref.length) return;
          const target = ref.reduce((s,x) => s + cross[x] + crossSize(x)/2, 0) / ref.length;
          cross[id] = target - crossSize(id)/2;
        });
        resolveOverlaps(layer);
      });
    }
    layers.forEach(l => l && resolveOverlaps(l));

    // ── 8. Assemble ──────────────────────────────────────────────────
    const px = {}, py = {};
    coreIds.forEach(u => {
      const d = depthOf[u];
      if (isHoriz) { px[u] = layerPos[d]; py[u] = cross[u]; }
      else          { px[u] = cross[u];    py[u] = layerPos[d]; }
    });

    // ── 9. Flip for RL / BT ──────────────────────────────────────────
    if (direction === 'RL' || direction === 'BT') {
      const maxMain = Math.max(...coreIds.map(u =>
        isHoriz ? px[u] + nodeW(rawById(u)) : py[u] + nodeH(rawById(u))));
      coreIds.forEach(u => {
        if (isHoriz) px[u] = maxMain - px[u] - nodeW(rawById(u)) + PAD;
        else         py[u] = maxMain - py[u] - nodeH(rawById(u)) + PAD;
      });
    }

    // ── 10. Park annotations beside their parent ─────────────────────
    const out = nodes.map(n => px[n.id] !== undefined
      ? { ...n, x: Math.round(px[n.id]), y: Math.round(py[n.id]) }
      : { ...n });
    const AX = {}, AY = {};
    placeAnnotations(AX, AY, out);
    const placed = out.map(n => AX[n.id] !== undefined
      ? { ...n, x: Math.round(AX[n.id]), y: Math.round(AY[n.id]) }
      : n);

    // ── 11. Normalise to the origin ──────────────────────────────────
    // Straightening pushes layers around freely and the per-layer guard only
    // catches drift ABOVE the padding, so the whole diagram can end up
    // thousands of pixels down the canvas with nothing above it. Shift the
    // finished layout back so it always starts at the top-left.
    const minX = Math.min(...placed.map(n => n.x));
    const minY = Math.min(...placed.map(n => n.y));
    const shiftX = PAD - minX, shiftY = PAD - minY;
    return placed.map(n => ({ ...n, x: n.x + shiftX, y: n.y + shiftY }));

  } catch(err) {
    console.error('[autoLayout]', err);
    return nodes;
  }
}
