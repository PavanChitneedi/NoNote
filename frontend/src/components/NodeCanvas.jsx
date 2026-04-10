import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getMap, saveMap, saveVersion } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import LLMChat        from "./LLMChat.jsx";
import ThemePicker    from "./ThemePicker.jsx";
import VersionHistory from "./VersionHistory.jsx";

// ── Node types ────────────────────────────────────────────────
const NT = {
  note:     { label:"Note",     color:"#FFD93D", icon:"📝", cat:"General" },
  heading:  { label:"Heading",  color:"#6C63FF", icon:"📌", cat:"General" },
  user:     { label:"User",     color:"#E91E63", icon:"👤", cat:"General" },
  process:  { label:"Process",  color:"#9C27B0", icon:"🔄", cat:"General" },
  group:    { label:"Group",    color:"#9E9E9E", icon:"📂", cat:"General" },
  network:  { label:"Network",  color:"#2196F3", icon:"🌐", cat:"Networking" },
  router:   { label:"Router",   color:"#00BCD4", icon:"📡", cat:"Networking" },
  firewall: { label:"Firewall", color:"#FF5722", icon:"🔥", cat:"Networking" },
  switch:   { label:"Switch",   color:"#03A9F4", icon:"🔀", cat:"Networking" },
  server:   { label:"Server",   color:"#F44336", icon:"🗄️", cat:"Hardware" },
  hardware: { label:"Hardware", color:"#FF9800", icon:"🖥️", cat:"Hardware" },
  cpu:      { label:"CPU",      color:"#795548", icon:"⚙️", cat:"Hardware" },
  storage:  { label:"Storage",  color:"#607D8B", icon:"💾", cat:"Hardware" },
  software: { label:"Software", color:"#4CAF50", icon:"📦", cat:"Software" },
  api:      { label:"API",      color:"#009688", icon:"🔌", cat:"Software" },
  database: { label:"Database", color:"#3F51B5", icon:"🗃️", cat:"Software" },
  service:  { label:"Service",  color:"#8BC34A", icon:"⚡", cat:"Software" },
  cloud:    { label:"Cloud",    color:"#29B6F6", icon:"☁️", cat:"Cloud" },
  lambda:   { label:"Function", color:"#FF9100", icon:"λ",  cat:"Cloud" },
  queue:    { label:"Queue",    color:"#AB47BC", icon:"↔",  cat:"Cloud" },
  cdn:      { label:"CDN",      color:"#26A69A", icon:"🕸️", cat:"Cloud" },
};
const DP = {
  note:{Content:""},heading:{Level:"H1",Subtitle:""},user:{Role:"",Email:"",Team:""},
  process:{Step:"",Input:"",Output:""},group:{Description:""},
  network:{IP:"",Subnet:"",VLAN:""},router:{Gateway:"",Protocol:"BGP"},
  firewall:{Rules:"",Zone:""},switch:{Ports:"",VLAN:""},
  server:{OS:"",RAM:"",CPU:"",Role:""},hardware:{Model:"",Serial:"",Location:""},
  cpu:{Cores:"",Speed:"",Architecture:""},storage:{Capacity:"",Type:"SSD",RAID:""},
  software:{Version:"",License:"",Port:""},api:{Endpoint:"",Method:"REST",Auth:""},
  database:{Engine:"",Port:"5432",Schema:""},service:{URL:"",Status:"Running",Port:""},
  cloud:{Provider:"AWS",Region:"",Service:""},lambda:{Runtime:"Node.js",Trigger:"",Memory:"256MB"},
  queue:{Type:"SQS",MaxSize:"",DLQ:""},cdn:{Provider:"CloudFront",Origin:"",TTL:""},
};

const DEF_W=220, DEF_H=96, GRP_W=340, GRP_H=240;
const COL_W=72,  COL_H=72; // collapsed node size

// Use browser crypto for UUID - never send non-UUID to DB
const makeId = () => typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:r&0x3|0x8).toString(16);});

const mkNode = (type, x, y) => ({
  id: makeId(), type, x, y,
  w: type==="group" ? GRP_W : DEF_W,
  h: type==="group" ? GRP_H : DEF_H,
  title: NT[type]?.label || "Node",
  notes: "", collapsed: false,
  properties: { ...(DP[type]||{}) }, customProps: {},
});

// ── Auto-layout — topological layers, centered, no overlap ──
function autoLayout(nodes, edges) {
  if (!nodes.length) return nodes;
  // Always use EXPANDED sizes for layout — so collapse→layout→expand never overlaps
  const H_PAD = 80, V_PAD = 80;
  const START_X = 100, START_Y = 100;
  // Always use full (expanded) size regardless of current collapse state
  const nodeW = n => n?.w || DEF_W;
  const nodeH = n => n?.h || DEF_H;
  const nodeById = id => nodes.find(n => n.id === id);

  // Build adjacency for topological sort
  const inDeg = {}, adj = {};
  nodes.forEach(n => { inDeg[n.id] = 0; adj[n.id] = []; });
  edges.forEach(e => {
    if (inDeg[e.to] !== undefined && inDeg[e.from] !== undefined) {
      inDeg[e.to]++;
      adj[e.from].push(e.to);
    }
  });

  // Kahn topo sort → layers
  const layers = [];
  let q = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  const vis = new Set();
  while (q.length) {
    layers.push([...q]);
    q.forEach(id => vis.add(id));
    const next = [];
    q.forEach(id => adj[id]?.forEach(tid => {
      if (!vis.has(tid)) { inDeg[tid]--; if (inDeg[tid] === 0) next.push(tid); }
    }));
    q = next;
  }
  // Cyclic / isolated nodes — place in extra rows
  nodes.filter(n => !vis.has(n.id)).forEach(n => layers.push([n.id]));

  // Position each layer left-to-right, stack layers top-to-bottom
  const posMap = {};
  let y = START_Y;
  layers.forEach(layer => {
    let x = START_X;
    layer.forEach(id => {
      const n = nodeById(id);
      posMap[id] = { x, y };
      x += nodeW(n) + H_PAD;
    });
    const maxH = Math.max(...layer.map(id => nodeH(nodeById(id))));
    y += maxH + V_PAD;
  });

  const fallbackY = y;
  let result = nodes.map((n, i) => ({
    ...n,
    ...(posMap[n.id] || { x: START_X, y: fallbackY + i * (DEF_H + H_PAD) }),
  }));

  // Force-separation — push overlapping nodes apart until clean
  const MIN_GAP = 24;
  for (let iter = 0; iter < 120; iter++) {
    let moved = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i], b = result[j];
        const aw = a.w||DEF_W, ah = a.h||DEF_H;
        const bw = b.w||DEF_W, bh = b.h||DEF_H;
        const gapX = b.x - (a.x + aw);
        const gapY = b.y - (a.y + ah);
        const gapBX = a.x - (b.x + bw);
        const gapBY = a.y - (b.y + bh);
        const overlapX = gapX < MIN_GAP && gapBX < MIN_GAP;
        const overlapY = gapY < MIN_GAP && gapBY < MIN_GAP;
        if (overlapX && overlapY) {
          // Push along the smaller overlap axis
          const pushRight = MIN_GAP - gapX;
          const pushDown  = MIN_GAP - gapY;
          if (pushRight <= pushDown) {
            result[j] = { ...result[j], x: result[j].x + pushRight };
          } else {
            result[j] = { ...result[j], y: result[j].y + pushDown };
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  return result;
}

// ── Edge start/end point on node rectangle edge ─────────────────
// nw/nh are the ACTUAL rendered dimensions (not just stored node.w/node.h)
function rectEdgePoint(node, nw, nh, targetX, targetY) {
  const cx = node.x + nw/2, cy = node.y + nh/2;
  const dx = targetX - cx,  dy = targetY - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x:cx, y:cy };
  const hw = nw/2, hh = nh/2;
  const sx = Math.abs(dx) > 0.001 ? hw / Math.abs(dx) : Infinity;
  const sy = Math.abs(dy) > 0.001 ? hh / Math.abs(dy) : Infinity;
  const s  = Math.min(sx, sy);
  return { x: cx + dx*s, y: cy + dy*s };
}

// ── PNG export ────────────────────────────────────────────────
async function exportAsPNG(nodes, edges, mapTitle) {
  if(!nodes.length){alert("No nodes to export.");return;}
  const PAD=60;
  const minX=Math.min(...nodes.map(n=>n.x))-PAD, minY=Math.min(...nodes.map(n=>n.y))-PAD;
  const maxX=Math.max(...nodes.map(n=>n.x+(n.collapsed?COL_W:n.w)))+PAD;
  const maxY=Math.max(...nodes.map(n=>n.y+(n.collapsed?COL_H:n.h)))+PAD;
  const W=maxX-minX, H=maxY-minY, DPR=2;
  const canvas=document.createElement("canvas");
  canvas.width=W*DPR; canvas.height=H*DPR;
  const ctx=canvas.getContext("2d"); ctx.scale(DPR,DPR);
  const cs=getComputedStyle(document.documentElement);
  const bg=cs.getPropertyValue("--bg").trim()||"#0d1117";
  const bg2=cs.getPropertyValue("--bg2").trim()||"#161b22";
  const text=cs.getPropertyValue("--text").trim()||"#e6edf3";
  const text3=cs.getPropertyValue("--text3").trim()||"#7d8590";
  const acc=cs.getPropertyValue("--accent").trim()||"#58a6ff";
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  // dot grid
  ctx.fillStyle=cs.getPropertyValue("--canvas-dot").trim()||"#21262d";
  for(let gx=0;gx<W;gx+=28)for(let gy=0;gy<H;gy+=28){ctx.beginPath();ctx.arc(gx,gy,1,0,Math.PI*2);ctx.fill();}
  // edges — orthogonal bezier (same logic as canvas)
  ctx.strokeStyle=acc; ctx.lineWidth=2; ctx.globalAlpha=0.85;
  const pngFaceNormal=(pt,node,nw,nh)=>{
    const eps=1;
    if(Math.abs(pt.y-node.y)<eps)       return {dx:0,dy:-1};
    if(Math.abs(pt.y-(node.y+nh))<eps)  return {dx:0,dy:1};
    if(Math.abs(pt.x-node.x)<eps)       return {dx:-1,dy:0};
    return {dx:1,dy:0};
  };
  edges.forEach(e=>{
    const f=nodes.find(n=>n.id===e.from),t=nodes.find(n=>n.id===e.to); if(!f||!t)return;
    const fw=f.collapsed?COL_W:f.w, fh=f.collapsed?COL_H:f.h;
    const tw=t.collapsed?COL_W:t.w, th=t.collapsed?COL_H:t.h;
    const tcx=t.x+tw/2, tcy=t.y+th/2, fcx=f.x+fw/2, fcy=f.y+fh/2;
    const ffw=f.collapsed?COL_W:f.w, ffh=f.collapsed?COL_H:f.h;
    const ttw=t.collapsed?COL_W:t.w, tth=t.collapsed?COL_H:t.h;
    const fp=rectEdgePoint(f,ffw,ffh,tcx,tcy), tp=rectEdgePoint(t,ttw,tth,fcx,fcy);
    const n1=pngFaceNormal(fp,f,fw,fh), n2=pngFaceNormal(tp,t,tw,th);
    const dist=Math.sqrt((tp.x-fp.x)**2+(tp.y-fp.y)**2);
    const ctrl=Math.max(60,dist*0.4);
    const c1x=fp.x+n1.dx*ctrl, c1y=fp.y+n1.dy*ctrl;
    const c2x=tp.x+n2.dx*ctrl, c2y=tp.y+n2.dy*ctrl;
    ctx.beginPath();
    ctx.moveTo(fp.x-minX,fp.y-minY);
    ctx.bezierCurveTo(c1x-minX,c1y-minY,c2x-minX,c2y-minY,tp.x-minX,tp.y-minY);
    ctx.setLineDash(e.style==="dashed"?[7,5]:[]);ctx.stroke();
    // Arrowhead perpendicular to arrival face
    const angle=Math.atan2(tp.y-c2y,tp.x-c2x);
    ctx.save();ctx.translate(tp.x-minX,tp.y-minY);ctx.rotate(angle);
    ctx.beginPath();ctx.moveTo(-9,-5);ctx.lineTo(0,0);ctx.lineTo(-9,5);
    ctx.fillStyle=acc;ctx.globalAlpha=1;ctx.fill();ctx.restore();
  });
  ctx.globalAlpha=1;ctx.setLineDash([]);
  // nodes
  nodes.forEach(node=>{
    const t=NT[node.type]||NT.note; const nx=node.x-minX,ny=node.y-minY;
    const nw=node.collapsed?COL_W:node.w, nh=node.collapsed?COL_H:node.h;
    const r=parseInt(cs.getPropertyValue("--radius-node")||"10");
    ctx.shadowColor="rgba(0,0,0,.35)";ctx.shadowBlur=8;ctx.shadowOffsetY=2;
    ctx.fillStyle=bg2;ctx.beginPath();ctx.roundRect(nx,ny,nw,nh,r);ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle=`${t.color}70`;ctx.lineWidth=1.5;ctx.stroke();
    if(node.collapsed){
      ctx.font="24px serif";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(t.icon,nx+nw/2,ny+nw/2-8);
      ctx.font=`bold 10px monospace`;ctx.fillStyle=t.color;
      ctx.fillText(node.title.slice(0,10),nx+nw/2,ny+nh-10);
    } else {
      const hH=34;ctx.fillStyle=`${t.color}22`;ctx.beginPath();
      ctx.roundRect(nx,ny,nw,hH,[r,r,0,0]);ctx.fill();
      ctx.font="14px serif";ctx.textBaseline="middle";ctx.fillText(t.icon,nx+10,ny+hH/2);
      ctx.font="bold 12px monospace";ctx.fillStyle=t.color;
      ctx.fillText(node.title.length>22?node.title.slice(0,22)+"…":node.title,nx+30,ny+hH/2);
      ctx.font="11px monospace";ctx.fillStyle=text3;ctx.textBaseline="top";
      let py=ny+hH+7;
      Object.entries(node.properties||{}).slice(0,3).forEach(([k,v])=>{
        if(!v)return;ctx.fillStyle=text3;ctx.fillText(`${k}:`,nx+10,py);
        ctx.fillStyle=text;ctx.fillText(String(v).slice(0,20),nx+50,py);py+=16;
      });
    }
  });
  ctx.font="bold 11px monospace";ctx.fillStyle=text3;ctx.globalAlpha=0.45;
  ctx.textBaseline="bottom";ctx.textAlign="left";
  ctx.fillText(`⬡ NoNote — ${mapTitle||"Map"}`,12,H-8);
  const a=document.createElement("a");
  a.download=`${(mapTitle||"nonote").replace(/\s+/g,"_")}.png`;
  a.href=canvas.toDataURL("image/png",1);a.click();
}

// ── Style helpers ─────────────────────────────────────────────
const tbtn=(active,color="var(--accent2)")=>({
  padding:"5px 10px",border:"none",borderRadius:"var(--radius-btn)",cursor:"pointer",
  fontSize:11,fontWeight:"var(--font-weight-ui)",flexShrink:0,
  letterSpacing:"var(--letter-space)",
  background:active?color:"var(--bg3)",
  color:active?"#fff":"var(--text3)",
  transition:"var(--transition-all)",
});
const inp=()=>({
  width:"100%",background:"var(--bg)",border:`1px solid var(--border)`,
  borderRadius:"var(--radius-sm)",padding:"7px 9px",color:"var(--text)",
  fontSize:"inherit",fontFamily:"inherit",marginTop:3,
  boxSizing:"border-box",outline:"none",
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function NodeCanvas({ mapId, onBack, onHome }) {
  const { user }             = useAuth();
  const { themeName, theme } = useTheme();
  const canEdit              = ["owner","admin","editor"].includes(user?.role);

  // ── State ──────────────────────────────────────────────────
  const [mapMeta,      setMapMeta]      = useState(null);
  const [nodes,        setNodes]        = useState([]);
  const [edges,        setEdges]        = useState([]);
  const [editMode,     setEditMode]     = useState(true);   // view vs edit mode
  const [selected,     setSelected]     = useState(new Set()); // set of node ids
  const [selEdge,      setSelEdge]      = useState(null);
  const [mode,         setMode]         = useState("select");
  const [edgeStyle,    setEdgeStyle]    = useState("arrow");
  const [dragging,     setDragging]     = useState(null);
  const [resizing,     setResizing]     = useState(null);
  const [drawingEdge,  setDrawingEdge]  = useState(null);
  // Box-select
  const [boxSel,       setBoxSel]       = useState(null); // {startX,startY,endX,endY}
  const boxSelRef = useRef(null); // live ref for window mousemove handler
  const [saveState,    setSaveState]    = useState("idle");
  const [saveMsg,      setSaveMsg]      = useState("");
  const [loading,      setLoading]      = useState(true);
  const [showSidebar,  setShowSidebar]  = useState(false);
  const [showProps,    setShowProps]    = useState(false);
  const [showExport,   setShowExport]   = useState(false);
  const [showChat,     setShowChat]     = useState(false);
  const [showAppearance,setShowAppearance]=useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [activeCat,    setActiveCat]    = useState(null);
  // Quick capture
  const [quickPos,     setQuickPos]     = useState(null);
  const [quickText,    setQuickText]    = useState("");
  // Inline title edit
  const [editingTitle, setEditingTitle] = useState(null);
  // Zoom
  const [zoom,         setZoom]         = useState(1.0);
  // Canvas theme
  const [canvasTheme,  setCanvasTheme]  = useState(
    () => localStorage.getItem(`nn_canvas_${mapId}`) || "global"
  );
  // Undo/redo
  const [canUndo,      setCanUndo]      = useState(false);
  const [canRedo,      setCanRedo]      = useState(false);
  const [globalCollapsed,setGlobalCollapsed]= useState(false); // collapse all / expand all

  const canvasRef   = useRef(null);
  const nodesRef      = useRef([]);        // live ref for box-select
  const nodeHeightsRef= useRef({});       // actual rendered height per node id
  const saveTimer   = useRef(null);
  const versionTimer= useRef(null);
  const notesTimers = useRef({});
  const quickInpRef = useRef(null);
  const historyRef  = useRef([]);
  const histIdxRef  = useRef(-1);

  // ── History ────────────────────────────────────────────────
  const pushHistory = useCallback((ns, es) => {
    historyRef.current = historyRef.current.slice(0, histIdxRef.current+1);
    historyRef.current.push({ nodes:JSON.parse(JSON.stringify(ns)), edges:JSON.parse(JSON.stringify(es)) });
    if (historyRef.current.length>80) historyRef.current.shift();
    histIdxRef.current = historyRef.current.length-1;
    setCanUndo(histIdxRef.current>0); setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (histIdxRef.current<=0) return;
    histIdxRef.current--;
    const s=historyRef.current[histIdxRef.current];
    setNodes(s.nodes); setEdges(s.edges);
    setCanUndo(histIdxRef.current>0); setCanRedo(true);
    scheduleSave(s.nodes,s.edges);
  }, []);

  const redo = useCallback(() => {
    if (histIdxRef.current>=historyRef.current.length-1) return;
    histIdxRef.current++;
    const s=historyRef.current[histIdxRef.current];
    setNodes(s.nodes); setEdges(s.edges);
    setCanUndo(true); setCanRedo(histIdxRef.current<historyRef.current.length-1);
    scheduleSave(s.nodes,s.edges);
  }, []);

  // ── Save ───────────────────────────────────────────────────
  const scheduleSave = useCallback((ns, es) => {
    if (!canEdit) return;
    setSaveState("saving"); setSaveMsg("Saving…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveMap(mapId, { nodes:ns, edges:es });
        setSaveState("saved"); setSaveMsg("Saved ✓");
        setTimeout(()=>{setSaveState("idle");setSaveMsg("");},2500);
        clearTimeout(versionTimer.current);
        versionTimer.current = setTimeout(async()=>{
          try{ await saveVersion(mapId,{nodes:ns,edges:es,label:"Auto-save"}); }catch{}
        }, 5*60*1000);
      } catch {
        setSaveState("error"); setSaveMsg("Save failed — retry in 10s");
        saveTimer.current = setTimeout(()=>scheduleSave(ns,es),10000);
      }
    }, 1000);
  }, [mapId,canEdit]);

  // applyNodes: save + history. Pass skipHistory=true during live drag.
  const applyNodes = useCallback((fn, skipHistory=false) => {
    setNodes(prev=>{
      const next=typeof fn==="function"?fn(prev):fn;
      setEdges(es=>{ scheduleSave(next,es); if(!skipHistory)pushHistory(next,es); return es; });
      return next;
    });
  }, [scheduleSave,pushHistory]);

  const applyEdges = useCallback((fn, skipHistory=false) => {
    setEdges(prev=>{
      const next=typeof fn==="function"?fn(prev):fn;
      setNodes(ns=>{ scheduleSave(ns,next); if(!skipHistory)pushHistory(ns,next); return ns; });
      return next;
    });
  }, [scheduleSave,pushHistory]);

  // Keep nodesRef in sync with nodes state
  useEffect(()=>{ nodesRef.current = nodes; },[nodes]);

  // ── Actual collision dimensions (uses rendered height, not stored h) ──
  const collW = (n) => n?.collapsed ? COL_W : (n?.w || DEF_W);
  const collH = (n) => {
    if (!n) return DEF_H;
    if (n.collapsed) return COL_H;
    // Use measured DOM height if available, else fall back to stored h
    // Add 2px for border
    return Math.max(n.h || DEF_H, (nodeHeightsRef.current[n.id] || 0));
  };

  // ── Load ───────────────────────────────────────────────────
  useEffect(()=>{
    setLoading(true);
    getMap(mapId).then(data=>{
      setMapMeta(data.map);
      const ns=data.nodes.map(n=>({
        id:n.id,type:n.node_type,x:n.x,y:n.y,w:n.w,h:n.h,
        title:n.title,notes:n.notes,collapsed:false,
        properties:n.properties,customProps:n.custom_props,
      }));
      const es=data.edges.map(e=>({
        id:e.id,from:e.from_node,to:e.to_node,
        label:e.label,style:e.style,color:e.color,
      }));
      setNodes(ns); setEdges(es); pushHistory(ns,es);
    }).catch(console.error).finally(()=>setLoading(false));
  },[mapId]);

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(()=>{
    const h=(e)=>{
      const tag=e.target.tagName;
      const isInput=["INPUT","TEXTAREA","SELECT"].includes(tag);
      if(e.code==="Escape"){
        if(editingTitle){setEditingTitle(null);return;}
        if(quickPos){setQuickPos(null);setQuickText("");return;}
        if(drawingEdge){setDrawingEdge(null);return;}
        if(boxSel){setBoxSel(null);return;}
        setMode("select"); setSelected(new Set()); setSelEdge(null); return;
      }
      if(isInput) return;
      if(e.code==="Space"){
        e.preventDefault();
        if(!canEdit||!canvasRef.current) return;
        if(quickPos){setQuickPos(null);setQuickText("");return;}
        const el=canvasRef.current;
        setQuickText(""); setQuickPos({x:el.scrollLeft+el.clientWidth/2-130,y:el.scrollTop+el.clientHeight/2-55});
        return;
      }
      if(e.code==="Delete"||e.code==="Backspace"){e.preventDefault();deleteSelected();return;}
      const mod=e.ctrlKey||e.metaKey;
      if(mod&&e.code==="KeyZ"&&!e.shiftKey){e.preventDefault();undo();return;}
      if((mod&&e.code==="KeyY")||(mod&&e.shiftKey&&e.code==="KeyZ")){e.preventDefault();redo();return;}
      if(mod&&e.code==="Enter"){e.preventDefault();handleAutoLayout();return;}
      if(mod&&e.code==="Equal"){e.preventDefault();setZoom(z=>Math.min(3,+(z+0.1).toFixed(1)));return;}
      if(mod&&e.code==="Minus"){e.preventDefault();setZoom(z=>Math.max(0.2,+(z-0.1).toFixed(1)));return;}
      if(mod&&e.code==="Digit0"){e.preventDefault();setZoom(1);return;}
      // Arrow keys: move selected nodes (with collision prevention)
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)&&selected.size>0){
        e.preventDefault();
        const step=e.shiftKey?20:4;
        const adx=e.code==="ArrowLeft"?-step:e.code==="ArrowRight"?step:0;
        const ady=e.code==="ArrowUp"?-step:e.code==="ArrowDown"?step:0;
        applyNodes(ns=>{
          const GAP=14;
          const others=ns.filter(n=>!selected.has(n.id));
          return ns.map(n=>{
            if(!selected.has(n.id)) return n;
            let nx=n.x+adx, ny=n.y+ady;
            const dw=collW(n);
            const dh=collH(n);
            for(const o of others){
              const ow=collW(o);
              const oh=collH(o);
              if(nx<o.x+ow+GAP && nx+dw>o.x-GAP && ny<o.y+oh+GAP && ny+dh>o.y-GAP){
                if(adx>0) nx=o.x-GAP-dw;
                if(adx<0) nx=o.x+ow+GAP;
                if(ady>0) ny=o.y-GAP-dh;
                if(ady<0) ny=o.y+oh+GAP;
              }
            }
            return {...n,x:Math.max(0,nx),y:Math.max(0,ny)};
          });
        });
        return;
      }
      if(e.code==="KeyN"&&canEdit){addNode("note");return;}
      if(e.code==="KeyC"&&canEdit){setMode(m=>m==="connect"?"select":"connect");setDrawingEdge(null);return;}
      if(e.code==="KeyS"&&canEdit){setMode("select");setDrawingEdge(null);return;}
      if(e.code==="KeyE"&&canEdit){setEditMode(v=>!v);return;}
      if(e.code==="KeyV"&&canEdit){setShowVersions(true);return;}
      if(e.code==="KeyA"&&mod){e.preventDefault();setSelected(new Set(nodes.map(n=>n.id)));return;}
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[quickPos,drawingEdge,canEdit,undo,redo,selected,nodes,boxSel,editingTitle]);

  useEffect(()=>{if(quickPos)quickInpRef.current?.focus();},[quickPos]);

  // ── Pinch/scroll zoom ─────────────────────────────────────
  useEffect(()=>{
    const el=canvasRef.current; if(!el) return;
    const fn=(e)=>{
      if(!e.ctrlKey&&!e.metaKey) return;
      e.preventDefault();
      setZoom(z=>Math.min(3,Math.max(0.2,+(z-e.deltaY*0.001).toFixed(2))));
    };
    el.addEventListener("wheel",fn,{passive:false});
    return ()=>el.removeEventListener("wheel",fn);
  },[]);

  // ── Drag: single or multi-select ─────────────────────────
  const startDrag=useCallback((cx,cy,id)=>{
    if(!canEdit||!canvasRef.current) return;
    if(mode==="connect") return;
    const el=canvasRef.current;
    const rect=el.getBoundingClientRect(); const s=1/zoom;
    const canvasX=(cx-rect.left)*s+el.scrollLeft*s;
    const canvasY=(cy-rect.top)*s+el.scrollTop*s;
    // If clicking a node not in selection, select only that node
    const sel=selected.has(id)?new Set(selected):new Set([id]);
    if(!selected.has(id)) setSelected(sel);
    // Record starting positions for all selected nodes
    const startPositions={};
    nodes.forEach(n=>{ if(sel.has(n.id)) startPositions[n.id]={x:n.x,y:n.y}; });
    setDragging({ids:[...sel],startX:canvasX,startY:canvasY,startPositions});
  },[mode,nodes,selected,canEdit,zoom]);

  const startResize=useCallback((e,id)=>{
    e.stopPropagation();e.preventDefault();
    const node=nodes.find(n=>n.id===id);
    setResizing({id,startX:e.clientX,startY:e.clientY,origW:node.w,origH:node.h});
  },[nodes]);

  useEffect(()=>{
    const onMove=(e)=>{
      const isT=!!e.touches;
      const cx=isT?e.touches[0].clientX:e.clientX;
      const cy=isT?e.touches[0].clientY:e.clientY;
      if(dragging&&canvasRef.current){
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const canvasX=(cx-rect.left)*s+el.scrollLeft*s;
        const canvasY=(cy-rect.top)*s+el.scrollTop*s;
        const dx=canvasX-dragging.startX, dy=canvasY-dragging.startY;
        const GAP=14; // 14px minimum gap between any two node edges
        const fixedNodes=nodesRef.current.filter(n=>!dragging.ids.includes(n.id));

        // Axis-separated collision: X then Y, each fully resolved.
        // Key: full AABB overlap check on each axis, resolve by minimum penetration.
        const resolvedPositions={};

        for(const id of dragging.ids){
          const start=dragging.startPositions[id]; if(!start) continue;
          const base=nodesRef.current.find(n=>n.id===id); if(!base) continue;
          const nw=collW(base);
          const nh=collH(base);

          // Step 1: apply X delta, keep Y unchanged (old position)
          let tx=Math.max(0,start.x+dx);
          const oy=start.y; // old Y — unchanged during X pass

          for(const o of fixedNodes){
            const ow=collW(o);
            const oh=collH(o);
            // Full Y overlap check with old Y
            if(oy+nh<=o.y||oy>=o.y+oh) continue; // no Y overlap — skip
            // Full X overlap check
            if(tx+nw<=o.x||tx>=o.x+ow) continue; // no X overlap — skip
            // Resolve X: push toward smallest penetration side
            const pLeft  = tx+nw - o.x;   // penetration through o's left face
            const pRight = o.x+ow - tx;   // penetration through o's right face
            if(pLeft<=pRight){ tx=o.x-nw-GAP; } else { tx=o.x+ow+GAP; }
          }

          // Step 2: apply Y delta, use resolved X from step 1
          let ty=Math.max(0,start.y+dy);

          for(const o of fixedNodes){
            const ow=collW(o);
            const oh=collH(o);
            // Full X overlap check with resolved tx
            if(tx+nw<=o.x||tx>=o.x+ow) continue; // no X overlap — skip
            // Full Y overlap check
            if(ty+nh<=o.y||ty>=o.y+oh) continue; // no Y overlap — skip
            // Resolve Y: push toward smallest penetration side
            const pTop    = ty+nh - o.y;   // penetration through o's top face
            const pBottom = o.y+oh - ty;   // penetration through o's bottom face
            if(pTop<=pBottom){ ty=o.y-nh-GAP; } else { ty=o.y+oh+GAP; }
          }

          resolvedPositions[id]={x:Math.max(0,tx),y:Math.max(0,ty)};
        }

        setNodes(ns=>ns.map(n=>{
          const rp=resolvedPositions[n.id];
          return rp?{...n,...rp}:n;
        }));
      }
      if(resizing&&canvasRef.current){
        const s=1/zoom;
        // Use setNodes directly — no history during resize
        setNodes(ns=>ns.map(n=>n.id===resizing.id?{...n,w:Math.max(160,resizing.origW+(cx-resizing.startX)*s),h:Math.max(60,resizing.origH+(cy-resizing.startY)*s)}:n));
      }
      if(boxSelRef.current&&canvasRef.current){
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const mx=(cx-rect.left)*s+el.scrollLeft*s;
        const my=(cy-rect.top)*s+el.scrollTop*s;
        const updated={...boxSelRef.current,endX:mx,endY:my};
        boxSelRef.current=updated;
        setBoxSel(updated);
      }
      if(drawingEdge&&canvasRef.current){
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        setDrawingEdge(d=>({...d,mouseX:(cx-rect.left)*s+el.scrollLeft*s,mouseY:(cy-rect.top)*s+el.scrollTop*s}));
      }
    };
    const onUp=()=>{
      // Push ONE history entry when drag/resize ends (not during)
      if(dragging||resizing){
        setNodes(ns=>{setEdges(es=>{scheduleSave(ns,es);pushHistory(ns,es);return es;});return ns;});
      }
      if(boxSelRef.current){
        const {startX,startY,endX,endY}=boxSelRef.current;
        const x1=Math.min(startX,endX),y1=Math.min(startY,endY);
        const x2=Math.max(startX,endX),y2=Math.max(startY,endY);
        if(Math.abs(x2-x1)>5||Math.abs(y2-y1)>5){
          const sel=new Set();
          // Use nodesRef (live ref) so selection is not stale
          nodesRef.current.forEach(n=>{
            const nw=collW(n), nh=collH(n);
            if(n.x<x2&&n.x+nw>x1&&n.y<y2&&n.y+nh>y1) sel.add(n.id);
          });
          setSelected(sel);
        }
        boxSelRef.current=null; setBoxSel(null);
      }
      setDragging(null); setResizing(null);
    };
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("touchmove",onMove,{passive:true});
    window.addEventListener("touchend",onUp);
    return ()=>{
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("touchmove",onMove);
      window.removeEventListener("touchend",onUp);
    };
  },[dragging,resizing,drawingEdge,scheduleSave,pushHistory,zoom,nodes]);

  // ── Node click ────────────────────────────────────────────
  const handleNodeClick=useCallback((e,id)=>{
    e.stopPropagation();
    if(mode==="connect"){
      if(drawingEdge){
        if(drawingEdge.fromId!==id){
          applyEdges(es=>[...es,{id:makeId(),from:drawingEdge.fromId,to:id,label:"",style:edgeStyle,color:"var(--accent)"}]);
        }
        setDrawingEdge(null);
      } else {
        const node=nodes.find(n=>n.id===id);
        const cx=node.x+(node.collapsed?COL_W:node.w)/2;
        const cy=node.y+(node.collapsed?COL_H:node.h)/2;
        setDrawingEdge({fromId:id,mouseX:cx,mouseY:cy});
      }
      return;
    }
    if(e.shiftKey||e.ctrlKey||e.metaKey){
      // Multi-select toggle
      setSelected(prev=>{
        const s=new Set(prev);
        s.has(id)?s.delete(id):s.add(id);
        return s;
      });
      return;
    }
    setSelected(new Set([id])); setSelEdge(null);
    if(window.innerWidth<768) setShowProps(true);
  },[mode,drawingEdge,edgeStyle,nodes,applyEdges]);

  const handleEdgeClick=useCallback((e,eid)=>{
    e.stopPropagation();
    if(mode==="select"){setSelEdge(eid);setSelected(new Set());}
  },[mode]);

  // ── Canvas mousedown — start box select ───────────────────
  const handleCanvasMouseDown=useCallback((e)=>{
    if(mode!=="select"||!canEdit) return;
    // Only start box-select if clicking directly on canvas background (not a node/edge)
    const target=e.target;
    if(target.closest(".nn-node")) return;
    if(target.tagName==="path"||target.tagName==="text"||target.closest("circle")||target.closest("polygon")||target.closest("foreignObject")) return;
    // Only start box-select on true canvas background
    const el=canvasRef.current; if(!el) return;
    const rect=el.getBoundingClientRect(); const s=1/zoom;
    const x=(e.clientX-rect.left)*s+el.scrollLeft*s;
    const y=(e.clientY-rect.top)*s+el.scrollTop*s;
    const bs={startX:x,startY:y,endX:x,endY:y};
    boxSelRef.current=bs; setBoxSel(bs);
    setSelected(new Set()); setSelEdge(null);
  },[mode,canEdit,zoom]);

  // ── Add node ──────────────────────────────────────────────
  const addNode=useCallback((type)=>{
    if(!canEdit) return;
    const el=canvasRef.current; if(!el) return;
    const s=1/zoom;
    const baseX=(el.scrollLeft+el.clientWidth/2)*s-110;
    const baseY=(el.scrollTop+el.clientHeight/2)*s-48;
    // Offset from any node already close to the center so they don't stack
    const cur = nodesRef.current;
    let ox=0, oy=0;
    for(let tries=0; tries<20; tries++){
      const clash = cur.some(n=>Math.abs(n.x-(baseX+ox))<(n.w||DEF_W)+20 && Math.abs(n.y-(baseY+oy))<(n.h||DEF_H)+20);
      if(!clash) break;
      ox += (DEF_W+30); if(ox > 600){ ox=0; oy += (DEF_H+30); }
    }
    const node=mkNode(type, baseX+ox, baseY+oy);
    applyNodes(ns=>[...ns,node]);
    setSelected(new Set([node.id])); setSelEdge(null);
    setShowSidebar(false);
    if(window.innerWidth<768) setShowProps(true);
  },[zoom,applyNodes,canEdit]);

  // ── Delete ─────────────────────────────────────────────────
  const deleteSelected=useCallback(()=>{
    if(!canEdit) return;
    if(selEdge){
      applyEdges(es=>es.filter(e=>e.id!==selEdge));
      setSelEdge(null); return;
    }
    if(selected.size===0) return;
    applyNodes(ns=>ns.filter(n=>!selected.has(n.id)));
    applyEdges(es=>es.filter(e=>!selected.has(e.from)&&!selected.has(e.to)));
    setSelected(new Set()); setShowProps(false);
  },[selected,selEdge,canEdit,applyNodes,applyEdges]);

  // ── Node updates ───────────────────────────────────────────
  const updateNode   =(id,u)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,...u}:n));
  const updateProp   =(id,k,v)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,properties:{...n.properties,[k]:v}}:n));
  const updateCustom =(id,k,v)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,customProps:{...n.customProps,[k]:v}}:n));
  const deleteCustom =(id,k)=>applyNodes(ns=>ns.map(n=>{if(n.id!==id)return n;const c={...n.customProps};delete c[k];return{...n,customProps:c};}));
  const resetSize    =(id)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,w:n.type==="group"?GRP_W:DEF_W,h:n.type==="group"?GRP_H:DEF_H}:n));
  const toggleCollapse=(id)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,collapsed:!n.collapsed}:n));
  const collapseAll=()=>{ applyNodes(ns=>ns.map(n=>({...n,collapsed:true}))); setGlobalCollapsed(true); };
  const expandAll=()=>{ applyNodes(ns=>ns.map(n=>({...n,collapsed:false}))); setGlobalCollapsed(false); };
  const updateNotes  =(id,val)=>{
    setNodes(ns=>ns.map(n=>n.id===id?{...n,notes:val}:n));
    clearTimeout(notesTimers.current[id]);
    notesTimers.current[id]=setTimeout(()=>{
      setNodes(ns=>{const u=ns.map(n=>n.id===id?{...n,notes:val}:n);setEdges(es=>{scheduleSave(u,es);pushHistory(u,es);return es;});return u;});
    },800);
  };

  // ── Auto-layout ────────────────────────────────────────────
  const handleAutoLayout=useCallback(()=>{
    applyNodes(ns=>{
      const laid=autoLayout(ns,edges);
      // Scroll to show nodes after a tick
      setTimeout(()=>{
        if(canvasRef.current) canvasRef.current.scrollTo({left:0,top:0,behavior:"smooth"});
      },100);
      return laid;
    });
  },[edges,applyNodes,zoom]);

  // ── Restore version ────────────────────────────────────────
  const handleRestore=(ns,es)=>{
    const mappedN=ns.map(n=>({id:n.id,type:n.node_type||n.type,x:n.x,y:n.y,w:n.w,h:n.h,title:n.title,notes:n.notes||"",collapsed:false,properties:n.properties||{},customProps:n.custom_props||n.customProps||{}}));
    const mappedE=es.map(e=>({id:e.id,from:e.from_node||e.from,to:e.to_node||e.to,label:e.label||"",style:e.style||"arrow",color:e.color||"var(--accent)"}));
    setNodes(mappedN);setEdges(mappedE);pushHistory(mappedN,mappedE);scheduleSave(mappedN,mappedE);
  };

  // ── Quick capture commit ───────────────────────────────────
  const commitCapture=()=>{
    const title=quickText.trim();
    if(!title){setQuickPos(null);setQuickText("");return;}
    const node=mkNode("note",quickPos.x,quickPos.y);
    node.title=title;
    applyNodes(ns=>[...ns,node]);
    setSelected(new Set([node.id])); setQuickPos(null); setQuickText("");
  };

  // ── Edge path — orthogonal bezier, arrows perpendicular to node edge ──
  // Uses actual rendered dimensions (collW/collH) for precise edge exit points
  const getEdgePath=(fromNode,toNode)=>{
    const fw=collW(fromNode), fh=collH(fromNode);
    const tw=collW(toNode),   th=collH(toNode);
    const fcx=fromNode.x+fw/2, fcy=fromNode.y+fh/2;
    const tcx=toNode.x+tw/2,   tcy=toNode.y+th/2;
    // Exit points on actual rectangle edges
    const fp=rectEdgePoint(fromNode,fw,fh,tcx,tcy);
    const tp=rectEdgePoint(toNode,tw,th,fcx,fcy);
    // Face normal at each exit point (outward perpendicular)
    const getFaceNormal=(pt,node,nw,nh)=>{
      const eps=2;
      if(Math.abs(pt.y - node.y)       < eps) return {dx:0,dy:-1}; // top
      if(Math.abs(pt.y -(node.y+nh))   < eps) return {dx:0,dy:1};  // bottom
      if(Math.abs(pt.x - node.x)       < eps) return {dx:-1,dy:0}; // left
      return {dx:1,dy:0};                                            // right
    };
    const fn1=getFaceNormal(fp,fromNode,fw,fh);
    const fn2=getFaceNormal(tp,toNode,tw,th);
    const dist=Math.sqrt((tp.x-fp.x)**2+(tp.y-fp.y)**2);
    const ctrl=Math.max(60, dist*0.4);
    const c1x=fp.x+fn1.dx*ctrl, c1y=fp.y+fn1.dy*ctrl;
    const c2x=tp.x+fn2.dx*ctrl, c2y=tp.y+fn2.dy*ctrl;
    return {
      path:`M ${fp.x} ${fp.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tp.x} ${tp.y}`,
      fp, tp,
    };
  };

  // ── LLM export ─────────────────────────────────────────────
  const exportLLM=()=>{
    const title=mapMeta?.title||"Map";
    let out=`# ${title}\n_NoNote export · ${new Date().toLocaleString()}_\n\n## Summary\n${nodes.length} components · ${edges.length} connections\n\n## Components\n\n`;
    const cats={};
    nodes.forEach(n=>{const c=NT[n.type]?.cat||"General";(cats[c]=cats[c]||[]).push(n);});
    Object.entries(cats).forEach(([cat,ns])=>{
      out+=`### ${cat}\n\n`;
      ns.forEach(n=>{
        out+=`**${n.title}** _(${NT[n.type]?.label||n.type})_\n`;
        [...Object.entries(n.properties||{}),...Object.entries(n.customProps||{})].filter(([,v])=>v).forEach(([k,v])=>{out+=`- ${k}: ${v}\n`;});
        if(n.notes)out+=`- Notes: ${n.notes}\n`;
        out+="\n";
      });
    });
    if(edges.length){
      out+=`## Relationships\n\n`;
      edges.forEach(e=>{
        const f=nodes.find(n=>n.id===e.from),t=nodes.find(n=>n.id===e.to);
        if(!f||!t)return;
        const verb=e.label?`"${e.label}"`:e.style==="bidirectional"?"communicates with":"connects to";
        out+=`- **${f.title}** ${e.style==="bidirectional"?"↔":"→"} **${t.title}**: ${verb}\n`;
      });
    }
    out+=`\n---\n_Paste into any LLM for review, documentation, or Q&A._`;
    return out;
  };

  // ── Derived ────────────────────────────────────────────────
  const selectedNode = selected.size===1 ? nodes.find(n=>n.id===[...selected][0]) : null;
  const selectedEdgeObj = selEdge ? edges.find(e=>e.id===selEdge) : null;
  const cats=useMemo(()=>[...new Set(Object.values(NT).map(t=>t.cat))],[]);
  const isMobile=window.innerWidth<768;
  const canvasBg = canvasTheme!=="global"&&THEMES[canvasTheme]
    ? THEMES[canvasTheme].vars["--bg"]
    : "var(--bg)";
  const canvasDot = canvasTheme!=="global"&&THEMES[canvasTheme]
    ? THEMES[canvasTheme].vars["--canvas-dot"]
    : "var(--canvas-dot)";

  // ── Box select rect ────────────────────────────────────────
  const boxRect = boxSel ? {
    x:Math.min(boxSel.startX,boxSel.endX),
    y:Math.min(boxSel.startY,boxSel.endY),
    w:Math.abs(boxSel.endX-boxSel.startX),
    h:Math.abs(boxSel.endY-boxSel.startY),
  } : null;

  if(loading) return (
    <div style={{height:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",color:"var(--text4)"}}>
        <div style={{fontSize:36,marginBottom:12}}>⬡</div>
        <div style={{fontSize:14}}>Loading…</div>
      </div>
    </div>
  );

  const saveMsgColor=saveState==="saved"?"var(--success)":saveState==="error"?"var(--danger)":"var(--text3)";

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--bg)",overflow:"hidden",fontFamily:"var(--font-ui)"}}>

      {/* ── Topbar ── */}
      <div
        onKeyDown={e=>e.stopPropagation()}
        style={{height:"var(--topbar-h)",background:"var(--bg2)",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:4,padding:"0 8px",flexShrink:0,overflowX:"auto"}}
      >
        <span onClick={onHome} title="Home" style={{fontSize:20,cursor:"pointer",flexShrink:0,padding:"0 4px",userSelect:"none"}}>⬡</span>
        <button onClick={onBack} style={tbtn(false)}>← MAPS</button>
        <div style={{width:1,height:22,background:"var(--border)",flexShrink:0,margin:"0 2px"}}/>
        <span style={{fontSize:12,fontWeight:700,color:"var(--accent)",whiteSpace:"nowrap",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis"}}>{mapMeta?.title}</span>
        <div style={{width:1,height:22,background:"var(--border)",flexShrink:0,margin:"0 2px"}}/>

        {/* Edit / View mode */}
        {canEdit&&(
          <button onClick={()=>setEditMode(v=>!v)} style={tbtn(!editMode,"var(--success)")} title="Toggle edit/view mode (E)">
            {editMode?"✏ EDIT":"👁 VIEW"}
          </button>
        )}

        {editMode&&canEdit&&<>
          <button onClick={()=>{setMode("select");setDrawingEdge(null);}} style={tbtn(mode==="select","var(--accent2)")} title="Select (S)">↖</button>
          <button onClick={()=>setMode("connect")} style={tbtn(mode==="connect","#6C63FF")} title="Connect (C)">⤳</button>
          {mode==="connect"&&["arrow","line","dashed","bidirectional"].map(s=>(
            <button key={s} onClick={()=>setEdgeStyle(s)} style={tbtn(edgeStyle===s,"#6C63FF")}>{s}</button>
          ))}
          {mode==="connect"&&drawingEdge&&<span style={{fontSize:11,color:"#f78166",padding:"0 5px",animation:"pulse 1s infinite",flexShrink:0}}>● click target</span>}
          <button onClick={()=>setShowSidebar(v=>!v)} style={tbtn(false)} title="Add node (N)">＋ NODE</button>
          <button onClick={handleAutoLayout} style={tbtn(false)} title="Auto-arrange (Ctrl+Enter)">⊞ AUTO LAYOUT</button>
          <button onClick={globalCollapsed?expandAll:collapseAll} style={tbtn(globalCollapsed,"#9C27B0")} title="Collapse / Expand all nodes">
            {globalCollapsed?"⊞ EXPAND ALL":"⊟ COLLAPSE ALL"}
          </button>
          <button onClick={undo} disabled={!canUndo} style={{...tbtn(false),opacity:!canUndo?.3:1}} title="Undo (Ctrl+Z)">↩</button>
          <button onClick={redo} disabled={!canRedo} style={{...tbtn(false),opacity:!canRedo?.3:1}} title="Redo (Ctrl+Y)">↪</button>
          {(selected.size>0||selEdge)&&<button onClick={deleteSelected} style={{...tbtn(false),background:"var(--danger)20",color:"var(--danger)"}} title="Delete (Del)">🗑{selected.size>1?` (${selected.size})`:""}</button>}
          {selectedNode&&<button onClick={()=>setShowProps(v=>!v)} style={tbtn(showProps,"var(--accent2)")} title="Properties">✏ PROPS</button>}

        </>}

        <div style={{flex:1}}/>

        {saveMsg&&<span style={{fontSize:11,color:saveMsgColor,flexShrink:0,whiteSpace:"nowrap",padding:"0 4px"}}>{saveMsg}</span>}

        {/* Zoom */}
        <div style={{display:"flex",alignItems:"center",gap:1,border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",overflow:"hidden",flexShrink:0}}>
          <button onClick={()=>setZoom(z=>Math.max(0.2,+(z-0.1).toFixed(1)))} style={{...tbtn(false),padding:"3px 8px",borderRadius:0}}>−</button>
          <span onClick={()=>setZoom(1)} title="Reset zoom" style={{fontSize:11,color:"var(--text3)",cursor:"pointer",minWidth:40,textAlign:"center",userSelect:"none"}}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>Math.min(3,+(z+0.1).toFixed(1)))} style={{...tbtn(false),padding:"3px 8px",borderRadius:0}}>＋</button>
        </div>

        <button onClick={()=>setShowAppearance(true)} style={tbtn(false,"#6C63FF")} title="Appearance">🎨</button>
        <button onClick={()=>setShowVersions(true)}   style={tbtn(false)}           title="Version history (V)">🕐</button>
        <button onClick={()=>setShowChat(true)}        style={tbtn(false,"#6C63FF")}>💬</button>
        <button onClick={()=>setShowExport(true)}      style={tbtn(false,"#238636")}>↗</button>

        {!isMobile&&<span title={"Shortcuts:\nESC=cancel  Space=quick note\nDel=delete  Ctrl+Z/Y=undo/redo\nShift+click=multi-select  Ctrl+A=select all\nArrows=move selection  Ctrl+Enter=layout\nCtrl+±/0=zoom  E=edit/view  V=versions"}
          style={{fontSize:11,color:"var(--text4)",cursor:"help",flexShrink:0,borderBottom:"1px dashed var(--text4)",padding:"0 4px"}}>⌨</span>}
      </div>

      {/* ── Main area ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>

        {/* Desktop sidebar */}
        {!isMobile&&<NodeSidebar cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} addNode={addNode} canEdit={canEdit&&editMode}/>}

        {/* Mobile sidebar */}
        {isMobile&&showSidebar&&(
          <div style={{position:"absolute",inset:0,zIndex:50,display:"flex"}}>
            <div style={{flex:1,background:"rgba(0,0,0,.6)"}} onClick={()=>setShowSidebar(false)}/>
            <div style={{width:220,background:"var(--bg2)",borderLeft:"1px solid var(--border)",overflow:"auto",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"12px 14px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:"var(--accent)"}}>Add Node</span>
                <button onClick={()=>setShowSidebar(false)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20}}>×</button>
              </div>
              <NodeSidebar cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} addNode={addNode} canEdit={canEdit&&editMode} inline/>
            </div>
          </div>
        )}

        {/* ── Canvas ── */}
        <div ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onClick={e=>{
            // Don't clear selection if we just finished a box-select drag
            if(e.target.closest(".nn-node")) return;
            if(e.target.tagName==="path"||e.target.tagName==="text") return;
            setSelected(new Set());setSelEdge(null);
            if(drawingEdge)setDrawingEdge(null);
          }}
          onMouseMove={e=>{
            if(drawingEdge&&canvasRef.current){
              const el=canvasRef.current; const rect=el.getBoundingClientRect(); const s=1/zoom;
              setDrawingEdge(d=>({...d,mouseX:(e.clientX-rect.left)*s+el.scrollLeft*s,mouseY:(e.clientY-rect.top)*s+el.scrollTop*s}));
            }
          }}
          style={{
            flex:1,position:"relative",overflow:"auto",
            cursor:mode==="connect"?"crosshair":boxSel?"crosshair":"default",
            backgroundColor:canvasBg,
            backgroundImage:`radial-gradient(circle, ${canvasDot} 1px, transparent 1px)`,
            backgroundSize:`${28*zoom}px ${28*zoom}px`,
            WebkitOverflowScrolling:"touch",
          }}
        >
          <div style={{width:4000*zoom,height:3000*zoom,position:"relative"}}>
            <div style={{transform:`scale(${zoom})`,transformOrigin:"0 0",width:4000,height:3000,position:"relative"}}>

              {/* Box selection rect — behind nodes */}
              {boxRect&&boxRect.w>2&&boxRect.h>2&&(
                <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible",zIndex:1}}>
                  <rect x={boxRect.x} y={boxRect.y} width={boxRect.w} height={boxRect.h}
                    fill="var(--accent2)" fillOpacity="0.08"
                    stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5,3"/>
                </svg>
              )}

              {/* Edge SVG — before nodes in DOM = renders BEHIND nodes. No zIndex to preserve DOM stacking. */}
              <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
                <defs>
                  <marker id="nn-a"  markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto"><polygon points="0 0, 10 4, 0 8" fill="var(--accent)"/></marker>
                  <marker id="nn-a2" markerWidth="10" markerHeight="8" refX="0"  refY="4" orient="auto-start-reverse"><polygon points="10 0, 0 4, 10 8" fill="var(--accent)"/></marker>
                </defs>

                {/* Live arrow while drawing */}
                {drawingEdge&&(()=>{
                  const fn=nodes.find(n=>n.id===drawingEdge.fromId); if(!fn) return null;
                  const fw=collW(fn), fh=collH(fn);
                  const fp=rectEdgePoint(fn,fw,fh,drawingEdge.mouseX,drawingEdge.mouseY);
                  // Face normal for perpendicular exit
                  const eps=2;
                  let ndx=0,ndy=0;
                  if(Math.abs(fp.y-fn.y)<eps)       ndy=-1;
                  else if(Math.abs(fp.y-(fn.y+fh))<eps) ndy=1;
                  else if(Math.abs(fp.x-fn.x)<eps)  ndx=-1;
                  else                               ndx=1;
                  const dist=Math.sqrt((drawingEdge.mouseX-fp.x)**2+(drawingEdge.mouseY-fp.y)**2);
                  const ctrl=Math.max(50,dist*0.4);
                  const c1x=fp.x+ndx*ctrl, c1y=fp.y+ndy*ctrl;
                  return <path d={`M ${fp.x} ${fp.y} C ${c1x} ${c1y}, ${drawingEdge.mouseX} ${drawingEdge.mouseY-20}, ${drawingEdge.mouseX} ${drawingEdge.mouseY}`}
                    stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="6,4" opacity=".9" markerEnd="url(#nn-a)"/>;
                })()}

                {/* Edges */}
                {edges.map(edge=>{
                  const f=nodes.find(n=>n.id===edge.from),t=nodes.find(n=>n.id===edge.to);
                  if(!f||!t) return null;
                  const {path,fp,tp}=getEdgePath(f,t);
                  const mid={x:(fp.x+tp.x)/2,y:(fp.y+tp.y)/2};
                  const isSel=selEdge===edge.id;
                  return (
                    <g key={edge.id} style={{cursor:"pointer",pointerEvents:"all"}} onClick={e=>handleEdgeClick(e,edge.id)}>
                      <path d={path} stroke="transparent" strokeWidth="14" fill="none"/>
                      <path d={path}
                        stroke={isSel?"var(--danger)":edge.color||"var(--accent)"}
                        strokeWidth={isSel?3:2} fill="none" opacity={isSel?1:.9}
                        strokeDasharray={edge.style==="dashed"?"7,5":"none"}
                        markerEnd={edge.style!=="line"?"url(#nn-a)":undefined}
                        markerStart={edge.style==="bidirectional"?"url(#nn-a2)":undefined}
                      />
                      {isSel&&(
                        <g style={{cursor:"pointer",pointerEvents:"all"}} onClick={e=>{e.stopPropagation();applyEdges(es=>es.filter(ex=>ex.id!==edge.id));setSelEdge(null);}}>
                          <circle cx={mid.x} cy={mid.y} r="11" fill="var(--danger)"/>
                          <text x={mid.x} y={mid.y+4.5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">×</text>
                        </g>
                      )}
                      {edge.label&&!isSel&&<text x={mid.x} y={mid.y-9} fill="var(--text3)" fontSize="11" textAnchor="middle" fontFamily="var(--font-ui)">{edge.label}</text>}
                      {isSel&&(
                        <foreignObject x={mid.x-55} y={mid.y+16} width="110" height="28">
                          <input value={edge.label||""} placeholder="label"
                            onChange={e=>{e.stopPropagation();applyEdges(es=>es.map(ex=>ex.id===edge.id?{...ex,label:e.target.value}:ex));}}
                            onClick={e=>e.stopPropagation()}
                            style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--accent)",borderRadius:5,padding:"3px 7px",color:"var(--text)",fontSize:11,fontFamily:"var(--font-ui)",outline:"none"}}
                          />
                        </foreignObject>
                      )}
                    </g>
                  );
                })}

              </svg>

              {/* Nodes */}
              {nodes.map(node=>{
                const t=NT[node.type]||NT.note;
                const isSel=selected.has(node.id);
                const isGroup=node.type==="group";
                const isCollapsed=node.collapsed;
                const nw=isCollapsed?COL_W:node.w;
                const nh=isCollapsed?COL_H:node.h;

                if(isCollapsed) return (
                  <CollapsedNode key={node.id} node={node} t={t} isSel={isSel}
                    canEdit={canEdit&&editMode} mode={mode}
                    onMouseDown={e=>{e.stopPropagation();startDrag(e.clientX,e.clientY,node.id);}}
                    onTouchStart={e=>{e.stopPropagation();startDrag(e.touches[0].clientX,e.touches[0].clientY,node.id);}}
                    onClick={e=>handleNodeClick(e,node.id)}
                    onToggleCollapse={e=>{e.stopPropagation();toggleCollapse(node.id);}}
                  />
                );

                return (
                  <div key={node.id}
                    className="nn-node"
                    ref={el=>{ if(el) nodeHeightsRef.current[node.id]=el.getBoundingClientRect().height/zoom; }}
                    onMouseDown={e=>{e.stopPropagation();if(editingTitle!==node.id)startDrag(e.clientX,e.clientY,node.id);}}
                    onTouchStart={e=>{e.stopPropagation();startDrag(e.touches[0].clientX,e.touches[0].clientY,node.id);}}
                    onClick={e=>handleNodeClick(e,node.id)}
                    onDoubleClick={e=>{e.stopPropagation();if(canEdit&&editMode)setEditingTitle(node.id);}}
                    style={{
                      position:"absolute",left:node.x,top:node.y,width:nw,minHeight:nh,
                      background:isGroup?`${t.color}10`:"var(--node-bg)",
                      border:`var(--node-border-w) ${isGroup?"dashed":"solid"} ${isSel?"var(--accent)":`${t.color}65`}`,
                      borderRadius:"var(--radius-node)",
                      boxShadow:isSel?"var(--shadow-node-sel)":"var(--shadow-node)",
                      cursor:mode==="connect"?"crosshair":canEdit&&editMode?"grab":"default",
                      userSelect:"none",overflow:"hidden",touchAction:"none",
                      transition:"border-color .12s,box-shadow .12s",
                      outline:selected.size>1&&isSel?`2px solid var(--accent)`:"none",
                    }}
                  >
                    {/* Header */}
                    <div style={{display:"flex",alignItems:"center",gap:7,padding:"var(--node-pad)",background:`${t.color}1a`,borderBottom:`1px solid ${t.color}28`,height:"var(--node-header-h)",boxSizing:"border-box"}}>
                      <span style={{fontSize:15,lineHeight:1,flexShrink:0}}>{t.icon}</span>
                      {editingTitle===node.id ? (
                        <input autoFocus value={node.title}
                          onChange={e=>{e.stopPropagation();updateNode(node.id,{title:e.target.value});}}
                          onMouseDown={e=>e.stopPropagation()}
                          onBlur={()=>setEditingTitle(null)}
                          onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter"||e.key==="Escape")setEditingTitle(null);}}
                          style={{flex:1,background:"var(--bg)",border:`1px solid ${t.color}`,borderRadius:"var(--radius-xs)",padding:"2px 6px",color:"var(--text)",fontSize:13,fontFamily:"var(--font-ui)",outline:"none",fontWeight:700}}
                        />
                      ) : (
                        <span style={{fontSize:13,fontWeight:"var(--font-weight-node)",color:t.color,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:canEdit&&editMode?"text":"default"}}
                          title={canEdit&&editMode?"Double-click to edit":node.title}>
                          {node.title}
                        </span>
                      )}
                      <span style={{fontSize:9,color:"var(--text4)",letterSpacing:1.2,fontWeight:700,flexShrink:0}}>{t.label.toUpperCase()}</span>
                    </div>

                    {/* Body */}
                    {!isGroup&&(
                      <div style={{padding:"var(--node-body-pad)",fontSize:12,color:"var(--text3)",lineHeight:"var(--line-height)"}}>
                        {Object.entries(node.properties||{}).slice(0,3).map(([k,v])=>
                          v?<div key={k} style={{display:"flex",gap:5,overflow:"hidden"}}>
                            <span style={{color:"var(--text4)",flexShrink:0}}>{k}:</span>
                            <span style={{color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</span>
                          </div>:null
                        )}
                        <textarea value={node.notes||""} onChange={e=>{e.stopPropagation();updateNotes(node.id,e.target.value);}}
                          onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}
                          placeholder="Notes…" rows={2} readOnly={!canEdit||!editMode}
                          style={{width:"100%",marginTop:4,background:"transparent",border:"none",borderTop:`1px dashed ${t.color}30`,outline:"none",resize:"none",color:"var(--text3)",fontSize:11,fontFamily:"var(--font-ui)",lineHeight:1.5,cursor:canEdit&&editMode?"text":"default",paddingTop:4}}
                        />
                      </div>
                    )}

                    {/* Bottom-right corner icons — order: reset | collapse | resize(rightmost) */}
                    {canEdit&&editMode&&(
                      <div style={{position:"absolute",bottom:4,right:4,display:"flex",gap:3,alignItems:"center"}}>
                        {/* Reset size (leftmost) */}
                        {isSel&&(
                          <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();resetSize(node.id);}}
                            title="Reset to default size" style={{background:"none",border:"1px solid var(--border)",borderRadius:"var(--radius-xs)",color:"var(--text4)",cursor:"pointer",fontSize:9,width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center"}}>⊡</button>
                        )}
                        {/* Collapse/Expand (middle) */}
                        <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();toggleCollapse(node.id);}}
                          title={node.collapsed?"Expand node (⊞)":"Collapse node (⊟)"}
                          style={{background:"none",border:`1px solid ${t.color}40`,borderRadius:"var(--radius-xs)",color:t.color,cursor:"pointer",fontSize:12,width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity .15s"}} className="nn-collapse-btn">
                          {node.collapsed?"⊞":"⊟"}
                        </button>
                        {/* Resize handle (rightmost — directly in the corner) */}
                        {!isGroup&&isSel&&(
                          <div onMouseDown={e=>startResize(e,node.id)}
                            style={{width:16,height:16,cursor:"nwse-resize",display:"flex",alignItems:"center",justifyContent:"center",opacity:.8}} title="Drag to resize">
                            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 10 L10 2 M6 10 L10 6" stroke="var(--accent)" strokeWidth="1.8"/></svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}


              {/* Quick Capture */}
              {quickPos&&canEdit&&editMode&&(
                <div style={{position:"absolute",left:quickPos.x,top:quickPos.y-64,zIndex:100,display:"flex",flexDirection:"column",gap:5}} onClick={e=>e.stopPropagation()}>
                  <div style={{background:"#6C63FF",color:"#fff",fontSize:10,fontWeight:700,letterSpacing:1.5,padding:"3px 9px",borderRadius:"var(--radius-xs)",alignSelf:"flex-start"}}>⚡ QUICK CAPTURE</div>
                  <div style={{display:"flex",alignItems:"center",gap:7,background:"var(--bg2)",border:"2px solid #6C63FF",borderRadius:"var(--radius-md)",padding:"9px 12px",boxShadow:"0 10px 40px var(--shadow)",minWidth:300}}>
                    <span style={{fontSize:16}}>📝</span>
                    <input ref={quickInpRef} value={quickText} onChange={e=>setQuickText(e.target.value)}
                      onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter")commitCapture();if(e.key==="Escape"){setQuickPos(null);setQuickText("");}}}
                      placeholder="Type and press Enter…"
                      style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:14,fontFamily:"var(--font-ui)"}}
                    />
                    <button onClick={commitCapture} style={{background:"#6C63FF",border:"none",borderRadius:"var(--radius-sm)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,padding:"5px 12px",fontFamily:"var(--font-ui)"}}>ADD</button>
                    <button onClick={()=>{setQuickPos(null);setQuickText("");}} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:18}}>×</button>
                  </div>
                  <div style={{fontSize:10,color:"var(--text4)",paddingLeft:2}}>Enter to place · Esc to dismiss</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Props Panel */}
        {selectedNode&&(showProps||!isMobile)&&(
          <PropsPanel node={selectedNode} edges={edges} nodes={nodes}
            isMobile={isMobile} canEdit={canEdit&&editMode}
            onClose={()=>setShowProps(false)}
            onUpdate={updateNode} onUpdateProp={updateProp}
            onUpdateCustom={updateCustom} onDeleteCustom={deleteCustom}
            onAddCustom={()=>{const k=`field_${Object.keys(selectedNode.customProps||{}).length+1}`;updateCustom(selectedNode.id,k,"");}}
            onUpdateEdge={(eid,u)=>applyEdges(es=>es.map(e=>e.id===eid?{...e,...u}:e))}
            onDeleteEdge={eid=>applyEdges(es=>es.filter(e=>e.id!==eid))}
            onResetSize={()=>resetSize(selectedNode.id)}
            onUpdateNotes={updateNotes}
            onStartEditTitle={()=>canEdit&&editMode&&setEditingTitle(selectedNode.id)}
            onToggleCollapse={()=>toggleCollapse(selectedNode.id)}
          />
        )}

        {/* Multi-select info bar */}
        {selected.size>1&&(
          <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",background:"var(--bg2)",border:"1px solid var(--accent)",borderRadius:"var(--radius-md)",padding:"8px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"var(--shadow-node)",zIndex:30,fontSize:12,color:"var(--text2)"}}>
            <span style={{color:"var(--accent)",fontWeight:700}}>{selected.size} nodes selected</span>
            <button onClick={()=>selected.forEach(id=>toggleCollapse(id))} style={{...tbtn(false,"#9C27B0"),padding:"4px 10px"}}>⊟ TOGGLE COLLAPSE</button>
            <button onClick={handleAutoLayout} style={{...tbtn(false),padding:"4px 10px"}}>⊞ LAYOUT</button>
            <button onClick={deleteSelected} style={{...tbtn(false),background:"var(--danger)20",color:"var(--danger)",padding:"4px 10px"}}>🗑 DELETE ALL</button>
            <button onClick={()=>setSelected(new Set())} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:16}}>×</button>
          </div>
        )}
      </div>

      {showExport&&<ExportModal nodes={nodes} edges={edges} mapTitle={mapMeta?.title} exportLLM={exportLLM} onClose={()=>setShowExport(false)}/>}
      {showChat&&<LLMChat mapId={mapId} nodes={nodes} edges={edges} mapTitle={mapMeta?.title||"Map"} onClose={()=>setShowChat(false)}/>}
      {showVersions&&<VersionHistory mapId={mapId} nodes={nodes} edges={edges} mapTitle={mapMeta?.title} onRestore={handleRestore} onClose={()=>setShowVersions(false)}/>}
      {showAppearance&&<ThemePicker onClose={()=>setShowAppearance(false)} canvasTheme={canvasTheme} setCanvasTheme={t=>{setCanvasTheme(t);localStorage.setItem(`nn_canvas_${mapId}`,t);}} defaultTab="canvas"/>}

      <style>{`
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .nn-node:hover { z-index: 10; }
        .nn-node:hover .nn-collapse-btn { opacity: 0.8 !important; }
        .nn-node .nn-collapse-btn:hover { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// ── Collapsed Node ────────────────────────────────────────────
function CollapsedNode({node,t,isSel,canEdit,mode,onMouseDown,onTouchStart,onClick,onToggleCollapse}){
  const [hovered,setHovered]=useState(false);
  const propEntries=Object.entries(node.properties||{}).filter(([,v])=>v).slice(0,4);
  return (
    <div
      className="nn-node"
      onMouseDown={onMouseDown} onTouchStart={onTouchStart} onClick={onClick}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{
        position:"absolute",left:node.x,top:node.y,
        width:COL_W,height:COL_H,
        background:"var(--node-bg)",
        border:`var(--node-border-w) solid ${isSel?"var(--accent)":`${t.color}65`}`,
        borderRadius:"var(--radius-node)",
        boxShadow:isSel?"var(--shadow-node-sel)":"var(--shadow-node)",
        cursor:mode==="connect"?"crosshair":canEdit?"grab":"default",
        userSelect:"none",touchAction:"none",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,
        overflow:"visible",
        transition:"var(--transition-all)",
        zIndex:hovered?20:1,
      }}
    >
      {/* Icon */}
      <span style={{fontSize:28,lineHeight:1,userSelect:"none"}}>{t.icon}</span>
      {/* Name */}
      <span style={{fontSize:10,fontWeight:700,color:t.color,textAlign:"center",lineHeight:1.2,padding:"0 4px",maxWidth:COL_W-8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {node.title}
      </span>
      {/* ⊞ Expand icon — top-right of collapsed node */}
      {canEdit&&(
        <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onToggleCollapse(e);}}
          title="Expand node (⊞)"
          style={{position:"absolute",top:2,right:2,background:"none",border:`1px solid ${t.color}60`,borderRadius:3,color:t.color,cursor:"pointer",fontSize:11,width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
          ⊞
        </button>
      )}
      {/* Hover tooltip */}
      {hovered&&(propEntries.length>0||node.notes)&&(
        <div style={{
          position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",
          background:"var(--bg2)",border:`1px solid ${t.color}40`,borderRadius:"var(--radius-md)",
          padding:"10px 12px",minWidth:180,maxWidth:260,
          boxShadow:"0 8px 28px var(--shadow)",zIndex:100,
          pointerEvents:"none",
        }}>
          <div style={{fontSize:12,fontWeight:700,color:t.color,marginBottom:6}}>{t.icon} {node.title}</div>
          {propEntries.map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:6,fontSize:11,marginBottom:2}}>
              <span style={{color:"var(--text4)",flexShrink:0}}>{k}:</span>
              <span style={{color:"var(--text2)"}}>{String(v).slice(0,30)}</span>
            </div>
          ))}
          {node.notes&&<div style={{fontSize:10,color:"var(--text3)",marginTop:5,fontStyle:"italic",borderTop:"1px solid var(--border2)",paddingTop:5}}>{node.notes.slice(0,80)}{node.notes.length>80?"…":""}</div>}
          <div style={{fontSize:9,color:"var(--text4)",marginTop:5,textAlign:"right"}}>Click for full details</div>
        </div>
      )}
    </div>
  );
}

// ── Node Sidebar ──────────────────────────────────────────────
function NodeSidebar({cats,activeCat,setActiveCat,addNode,canEdit,inline}){
  return(
    <div style={inline?{}:{width:"var(--sidebar-w)",background:"var(--bg2)",borderRight:"1px solid var(--border2)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
      {!inline&&<div style={{padding:"10px 14px",borderBottom:"1px solid var(--border2)",fontSize:11,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>NODE LIBRARY</div>}
      <div style={{display:"flex",flexWrap:"wrap",gap:4,padding:"8px 10px",borderBottom:"1px solid var(--border2)"}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setActiveCat(activeCat===c?null:c)}
            style={{padding:"3px 8px",border:"none",borderRadius:"var(--radius-xs)",cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:.5,
              background:activeCat===c?"var(--accent2)":"var(--bg3)",color:activeCat===c?"#fff":"var(--text3)"}}>
            {c.slice(0,4).toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        {Object.entries(NT).filter(([,t])=>!activeCat||t.cat===activeCat).map(([key,t])=>(
          <div key={key} onClick={()=>canEdit&&addNode(key)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",cursor:canEdit?"pointer":"default",fontSize:12,borderLeft:"3px solid transparent",transition:"var(--transition-all)"}}
            onMouseEnter={e=>{if(canEdit){e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.borderLeftColor=t.color;}}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}>
            <span style={{fontSize:14}}>{t.icon}</span>
            <span style={{color:"var(--text2)"}}>{t.label}</span>
            <span style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:t.color,flexShrink:0}}/>
          </div>
        ))}
      </div>
      {!canEdit&&<div style={{padding:"8px 14px",fontSize:10,color:"var(--text4)",borderTop:"1px solid var(--border2)"}}>View only mode</div>}
    </div>
  );
}

// ── Props Panel ───────────────────────────────────────────────
function PropsPanel({node,edges,nodes,isMobile,canEdit,onClose,onUpdate,onUpdateProp,onUpdateCustom,onDeleteCustom,onAddCustom,onUpdateEdge,onDeleteEdge,onResetSize,onUpdateNotes,onStartEditTitle,onToggleCollapse}){
  const t=NT[node.type]||NT.note;
  const nodeEdges=edges.filter(e=>e.from===node.id||e.to===node.id);
  return(
    <div style={isMobile?{position:"absolute",bottom:0,left:0,right:0,height:"65vh",background:"var(--bg2)",borderTop:"1px solid var(--border)",borderRadius:"14px 14px 0 0",overflow:"auto",zIndex:40,animation:"slideUp .25s ease"}:{width:"var(--props-w)",background:"var(--bg2)",borderLeft:"1px solid var(--border2)",overflow:"auto",flexShrink:0}}>
      <div style={{padding:"11px 14px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:8,position:"sticky",top:0,background:"var(--bg2)",zIndex:1}}>
        <span style={{fontSize:16}}>{t.icon}</span>
        <span style={{fontSize:11,color:t.color,fontWeight:700,flex:1}}>{t.label.toUpperCase()}</span>
        <button onClick={onToggleCollapse} title={node.collapsed?"Expand node":"Collapse node"}
          style={{background:node.collapsed?"var(--success)18":"var(--bg3)",border:`1px solid ${node.collapsed?"var(--success)":"var(--border)"}`,borderRadius:5,color:node.collapsed?"var(--success)":"var(--text3)",cursor:"pointer",fontSize:10,padding:"3px 9px",fontFamily:"inherit",fontWeight:700}}>
          {node.collapsed?"▶ EXPAND":"◀ COLLAPSE"}
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
      </div>
      <div style={{padding:"13px 14px",display:"flex",flexDirection:"column",gap:11}}>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
            <label style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>TITLE</label>
            {canEdit&&<button onClick={onStartEditTitle} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>✏ inline</button>}
          </div>
          <input value={node.title} onChange={e=>onUpdate(node.id,{title:e.target.value})} disabled={!canEdit} style={inp()}/>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
            <label style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>SIZE</label>
            {canEdit&&<button onClick={onResetSize} style={{background:"none",border:"1px solid var(--border)",borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:"inherit"}}>⊡ RESET</button>}
          </div>
          <div style={{display:"flex",gap:6}}>
            {["w","h"].map(dim=>(
              <div key={dim} style={{flex:1}}>
                <label style={{fontSize:9,color:"var(--text4)"}}>{dim.toUpperCase()}</label>
                <input type="number" value={node[dim]} onChange={e=>onUpdate(node.id,{[dim]:+e.target.value})} disabled={!canEdit} style={{...inp(),marginTop:2}}/>
              </div>
            ))}
          </div>
        </div>
        {Object.keys(node.properties||{}).length>0&&<>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>TEMPLATE PROPERTIES</div>
          {Object.entries(node.properties).map(([k,v])=>(
            <div key={k}>
              <label style={{fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:3,display:"block",color:`${t.color}cc`}}>{k.toUpperCase()}</label>
              <input value={v} onChange={e=>onUpdateProp(node.id,k,e.target.value)} disabled={!canEdit} style={inp()}/>
            </div>
          ))}
        </>}
        <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>CUSTOM PROPERTIES</span>
            {canEdit&&<button onClick={onAddCustom} style={{background:"none",border:"1px solid var(--border)",borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:"inherit"}}>+ ADD</button>}
          </div>
          {Object.entries(node.customProps||{}).map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:4,marginBottom:5}}>
              <input value={k} readOnly style={{...inp(),width:"42%",marginTop:0,opacity:.7}}/>
              <input value={v} onChange={e=>onUpdateCustom(node.id,k,e.target.value)} disabled={!canEdit} style={{...inp(),flex:1,marginTop:0}}/>
              {canEdit&&<button onClick={()=>onDeleteCustom(node.id,k)} style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
            </div>
          ))}
          {!Object.keys(node.customProps||{}).length&&<div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>None yet</div>}
        </div>
        <div>
          <label style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,marginBottom:3,display:"block"}}>NOTES</label>
          <textarea value={node.notes||""} onChange={e=>onUpdateNotes(node.id,e.target.value)} disabled={!canEdit} rows={4} placeholder="Add notes…" style={{...inp(),resize:"vertical",lineHeight:1.55,marginTop:3}}/>
        </div>
        {nodeEdges.length>0&&(
          <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,marginBottom:8}}>CONNECTIONS</div>
            {nodeEdges.map(edge=>{
              const other=nodes.find(n=>n.id===(edge.from===node.id?edge.to:edge.from));
              return(
                <div key={edge.id} style={{display:"flex",alignItems:"center",gap:5,marginBottom:6,fontSize:12}}>
                  <span style={{color:"var(--accent)",flexShrink:0}}>{edge.from===node.id?"→":"←"}</span>
                  <span style={{flex:1,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{other?.title||"?"}</span>
                  <input value={edge.label||""} placeholder="label" onChange={e=>onUpdateEdge(edge.id,{label:e.target.value})} disabled={!canEdit}
                    style={{...inp(),width:62,marginTop:0,padding:"3px 6px",fontSize:11}}/>
                  {canEdit&&<button onClick={()=>onDeleteEdge(edge.id)} style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Export Modal ──────────────────────────────────────────────
function ExportModal({nodes,edges,mapTitle,exportLLM,onClose}){
  const [tab,setTab]=useState("llm");
  const [copied,setCopied]=useState(false);
  const content=tab==="llm"?exportLLM():JSON.stringify({title:mapTitle,nodes,edges},null,2);
  const copy=()=>{navigator.clipboard.writeText(content);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const tbS=(active,color="var(--accent2)")=>({padding:"8px 16px",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"var(--font-ui)",background:active?color:"var(--bg3)",color:active?"#fff":"var(--text3)"});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.76)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={onClose}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:20,width:"100%",maxWidth:600,maxHeight:"84vh",display:"flex",flexDirection:"column",gap:14}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:14,color:"var(--accent)"}}>↗ EXPORT</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:22}}>×</button>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[["llm","🤖 LLM Text"],["json","{ } JSON"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={tbS(tab===id)}>{label}</button>
          ))}
          <button onClick={()=>exportAsPNG(nodes,edges,mapTitle)} style={tbS(false,"#9C27B0")}>🖼 PNG</button>
          <div style={{flex:1}}/>
          <button onClick={copy} style={tbS(copied,"var(--success)")}>{copied?"✓ COPIED":"📋 COPY"}</button>
        </div>
        {tab==="llm"&&<div style={{fontSize:12,color:"var(--text3)",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"8px 12px",lineHeight:1.6}}>Grouped by category · Arrows as sentences · Paste into any LLM</div>}
        <pre style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:16,fontSize:12,overflow:"auto",flex:1,margin:0,color:"var(--text)",lineHeight:1.65,whiteSpace:"pre-wrap"}}>{content}</pre>
      </div>
    </div>
  );
}
