import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getMap, saveMap, saveVersion } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import LLMChat        from "./LLMChat.jsx";
import ThemePicker    from "./ThemePicker.jsx";
import VersionHistory from "./VersionHistory.jsx";

// ─────────────────────────────────────────────────────────────
// Node type library
// ─────────────────────────────────────────────────────────────
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
let _seq=1;
const makeId=()=>`n${Date.now()}_${_seq++}`;
const mkNode=(type,x,y)=>({
  id:makeId(),type,x,y,
  w:type==="group"?GRP_W:DEF_W, h:type==="group"?GRP_H:DEF_H,
  title:NT[type]?.label||"Node", notes:"",
  properties:{...(DP[type]||{})}, customProps:{},
});

// ─────────────────────────────────────────────────────────────
// Auto-layout (topological layers)
// ─────────────────────────────────────────────────────────────
function autoLayout(nodes, edges) {
  if (!nodes.length) return nodes;
  const PAD=60, inDeg={}, adj={};
  nodes.forEach(n=>{ inDeg[n.id]=0; adj[n.id]=[]; });
  edges.forEach(e=>{ if(inDeg[e.to]!==undefined){inDeg[e.to]++;adj[e.from]?.push(e.to);} });
  const layers=[]; let q=nodes.filter(n=>inDeg[n.id]===0).map(n=>n.id);
  const vis=new Set();
  while(q.length){
    layers.push([...q]); q.forEach(id=>vis.add(id));
    const next=[];
    q.forEach(id=>adj[id]?.forEach(tid=>{if(!vis.has(tid)){inDeg[tid]--;if(inDeg[tid]===0)next.push(tid)}}));
    q=next;
  }
  const leftover=nodes.filter(n=>!vis.has(n.id)).map(n=>n.id);
  if(leftover.length) layers.push(leftover);
  const posMap={};
  let y=80;
  layers.forEach(layer=>{
    const maxH=Math.max(...layer.map(id=>nodes.find(n=>n.id===id)?.h||DEF_H));
    let x=80;
    layer.forEach(id=>{
      const node=nodes.find(n=>n.id===id);
      posMap[id]={x,y}; x+=(node?.w||DEF_W)+PAD;
    });
    y+=maxH+PAD;
  });
  const COLS=Math.ceil(Math.sqrt(nodes.length)); let col=0,row=0;
  nodes.forEach(n=>{ if(!posMap[n.id]){posMap[n.id]={x:80+col*(DEF_W+PAD),y:80+row*(DEF_H+PAD)};col++;if(col>=COLS){col=0;row++;}} });
  return nodes.map(n=>({...n,...posMap[n.id]}));
}

// ─────────────────────────────────────────────────────────────
// PNG export
// ─────────────────────────────────────────────────────────────
async function exportAsPNG(nodes, edges, mapTitle) {
  if(!nodes.length){alert("No nodes to export.");return;}
  const PAD=60;
  const minX=Math.min(...nodes.map(n=>n.x))-PAD, minY=Math.min(...nodes.map(n=>n.y))-PAD;
  const maxX=Math.max(...nodes.map(n=>n.x+n.w))+PAD, maxY=Math.max(...nodes.map(n=>n.y+n.h))+PAD;
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
  const dot=cs.getPropertyValue("--canvas-dot").trim()||"#21262d";
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle=dot;
  for(let gx=0;gx<W;gx+=28)for(let gy=0;gy<H;gy+=28){ctx.beginPath();ctx.arc(gx,gy,1,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle=acc; ctx.lineWidth=1.8; ctx.globalAlpha=0.65;
  edges.forEach(e=>{
    const f=nodes.find(n=>n.id===e.from),t=nodes.find(n=>n.id===e.to); if(!f||!t)return;
    const fx=f.x-minX+f.w/2,fy=f.y-minY+f.h/2,tx=t.x-minX+t.w/2,ty=t.y-minY+t.h/2,cx=(fx+tx)/2;
    ctx.beginPath(); ctx.moveTo(fx,fy); ctx.bezierCurveTo(cx,fy,cx,ty,tx,ty);
    if(e.style==="dashed")ctx.setLineDash([7,5]);else ctx.setLineDash([]);
    ctx.stroke();
    const angle=Math.atan2(ty-fy,tx-fx);
    ctx.save();ctx.translate(tx,ty);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-8,-5);ctx.lineTo(0,0);ctx.lineTo(-8,5);ctx.fillStyle=acc;ctx.globalAlpha=0.9;ctx.fill();ctx.restore();
  });
  ctx.globalAlpha=1; ctx.setLineDash([]);
  nodes.forEach(node=>{
    const t=NT[node.type]||NT.note;
    const nx=node.x-minX,ny=node.y-minY,r=node.type==="group"?12:9;
    ctx.shadowColor="rgba(0,0,0,.4)";ctx.shadowBlur=10;ctx.shadowOffsetY=3;
    ctx.fillStyle=node.type==="group"?`${t.color}12`:bg2;
    ctx.beginPath();ctx.roundRect(nx,ny,node.w,node.h,r);ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle=`${t.color}70`;ctx.lineWidth=1.5;
    if(node.type==="group")ctx.setLineDash([6,4]);else ctx.setLineDash([]);
    ctx.stroke();ctx.setLineDash([]);
    const hH=32;
    ctx.fillStyle=`${t.color}22`;ctx.beginPath();ctx.roundRect(nx,ny,node.w,hH,[r,r,0,0]);ctx.fill();
    ctx.font="15px serif";ctx.textBaseline="middle";ctx.fillText(t.icon,nx+10,ny+hH/2);
    ctx.font="bold 12px monospace";ctx.fillStyle=t.color;
    ctx.fillText(node.title.length>24?node.title.slice(0,24)+"…":node.title,nx+30,ny+hH/2);
    ctx.font="11px monospace";ctx.fillStyle=text3;ctx.textBaseline="top";
    let py=ny+hH+7;
    Object.entries(node.properties||{}).slice(0,3).forEach(([k,v])=>{
      if(!v)return; ctx.fillStyle=text3;ctx.fillText(`${k}:`,nx+10,py);
      ctx.fillStyle=text;ctx.fillText(String(v).slice(0,20),nx+50,py); py+=16;
    });
  });
  ctx.font="bold 12px monospace";ctx.fillStyle=text3;ctx.globalAlpha=0.45;
  ctx.textBaseline="bottom";ctx.fillText(`⬡ NodeMap — ${mapTitle||"Map"}`,12,H-8);
  ctx.globalAlpha=1;
  const a=document.createElement("a");
  a.download=`${(mapTitle||"nodemap").replace(/\s+/g,"_")}.png`;
  a.href=canvas.toDataURL("image/png",1);a.click();
}

// ─────────────────────────────────────────────────────────────
// Style helpers (read CSS vars at render time)
// ─────────────────────────────────────────────────────────────
const tbtn=(active,color="var(--accent2)")=>({
  padding:"6px 10px",border:"none",borderRadius:7,cursor:"pointer",
  fontSize:11,fontWeight:700,letterSpacing:.4,flexShrink:0,
  background:active?color:"var(--bg3)",
  color:active?"#fff":"var(--text3)",
  transition:"background .12s",
});
const inp=()=>({
  width:"100%",background:"var(--bg)",border:"1px solid var(--border)",
  borderRadius:6,padding:"7px 9px",color:"var(--text)",fontSize:13,
  fontFamily:"inherit",marginTop:3,boxSizing:"border-box",outline:"none",
});
const lbl={display:"block",fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2};

// ─────────────────────────────────────────────────────────────
// Canvas-specific theme override
// ─────────────────────────────────────────────────────────────
const CANVAS_THEMES = [
  { id:"global", label:"Use Global Theme", icon:"🌐" },
  ...Object.entries(THEMES).map(([id,t])=>({ id, label:t.name, icon:t.icon })),
];

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function NodeCanvas({ mapId, onBack, onHome }) {
  const { user }             = useAuth();
  const { themeName, theme } = useTheme();
  const canEdit              = ["owner","admin","editor"].includes(user?.role);

  // ── Canvas-local theme override ────────────────────────────
  const [canvasTheme, setCanvasTheme] = useState("global");

  // Build inline CSS vars for the canvas area when a local theme is selected
  const canvasThemeVars = useMemo(() => {
    if (canvasTheme === "global") return {};
    const t = THEMES[canvasTheme];
    if (!t) return {};
    // Convert THEMES vars object to React inline style object
    const style = {};
    Object.entries(t.vars).forEach(([k, v]) => {
      // CSS var names become camelCase-ish but we use a data-attr approach:
      // store them as a style string injected via a <style> tag
      style[k] = v;
    });
    return style;
  }, [canvasTheme]);

  // ── State ──────────────────────────────────────────────────
  const [mapMeta,    setMapMeta]    = useState(null);
  const [nodes,      setNodes]      = useState([]);
  const [edges,      setEdges]      = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [selType,    setSelType]    = useState(null);    // "node"|"edge"
  const [mode,       setMode]       = useState("select");
  const [edgeStyle,  setEdgeStyle]  = useState("arrow");
  const [dragging,   setDragging]   = useState(null);
  const [resizing,   setResizing]   = useState(null);
  const [drawingEdge,setDrawingEdge]= useState(null);
  const [saveState,  setSaveState]  = useState("idle"); // idle|saving|saved|error
  const [saveMsg,    setSaveMsg]    = useState("");
  const [loading,    setLoading]    = useState(true);
  const [showSidebar,setShowSidebar]= useState(false);
  const [showProps,  setShowProps]  = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showChat,   setShowChat]   = useState(false);
  const [showTheme,  setShowTheme]  = useState(false);
  const [showVersions,setShowVersions]=useState(false);
  const [showCanvasTheme,setShowCanvasTheme]=useState(false);
  const [activeCat,  setActiveCat]  = useState(null);
  const [quickPos,   setQuickPos]   = useState(null);
  const [quickText,  setQuickText]  = useState("");
  const [editingTitle,setEditingTitle]=useState(null); // node id being inline-edited
  const [zoom,       setZoom]       = useState(1.0);
  const [canUndo,    setCanUndo]    = useState(false);
  const [canRedo,    setCanRedo]    = useState(false);

  const canvasRef   = useRef(null);
  const saveTimer   = useRef(null);
  const versionTimer= useRef(null);
  const notesTimers = useRef({});
  const quickInpRef = useRef(null);
  const historyRef  = useRef([]);
  const histIdxRef  = useRef(-1);

  // ── Keep refs in sync with latest state for save ─────────
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  // ── History helpers ────────────────────────────────────────
  const pushHistory = useCallback((ns, es) => {
    historyRef.current = historyRef.current.slice(0, histIdxRef.current + 1);
    historyRef.current.push({ nodes:JSON.parse(JSON.stringify(ns)), edges:JSON.parse(JSON.stringify(es)) });
    if (historyRef.current.length > 80) historyRef.current.shift();
    histIdxRef.current = historyRef.current.length - 1;
    setCanUndo(histIdxRef.current > 0);
    setCanRedo(false);
  }, []);

  // ── Save — uses refs, never stale ─────────────────────────
  const triggerSave = useCallback(() => {
    if (!canEdit) return;
    setSaveState("saving"); setSaveMsg("Saving…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ns = nodesRef.current;
      const es = edgesRef.current;
      try {
        await saveMap(mapId, { nodes:ns, edges:es });
        setSaveState("saved"); setSaveMsg("Saved ✓");
        setTimeout(() => setSaveState("idle"), 2000);
        // Auto-snapshot every 5 min
        clearTimeout(versionTimer.current);
        versionTimer.current = setTimeout(async () => {
          try { await saveVersion(mapId, { nodes:nodesRef.current, edges:edgesRef.current, label:"Auto-save" }); } catch {}
        }, 5 * 60 * 1000);
      } catch (err) {
        setSaveState("error"); setSaveMsg("Save failed — retrying…");
        saveTimer.current = setTimeout(() => triggerSave(), 10000);
      }
    }, 1000);
  }, [mapId, canEdit]);

  // ── applyNodes / applyEdges — clean, no nested setState ───
  const applyNodes = useCallback((fn) => {
    setNodes(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      nodesRef.current = next;
      pushHistory(next, edgesRef.current);
      triggerSave();
      return next;
    });
  }, [pushHistory, triggerSave]);

  const applyEdges = useCallback((fn) => {
    setEdges(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      edgesRef.current = next;
      pushHistory(nodesRef.current, next);
      triggerSave();
      return next;
    });
  }, [pushHistory, triggerSave]);

  const undo = useCallback(() => {
    if (histIdxRef.current <= 0) return;
    histIdxRef.current--;
    const snap = historyRef.current[histIdxRef.current];
    nodesRef.current = snap.nodes; edgesRef.current = snap.edges;
    setNodes(snap.nodes); setEdges(snap.edges);
    setCanUndo(histIdxRef.current > 0); setCanRedo(true);
    triggerSave();
  }, [triggerSave]);

  const redo = useCallback(() => {
    if (histIdxRef.current >= historyRef.current.length - 1) return;
    histIdxRef.current++;
    const snap = historyRef.current[histIdxRef.current];
    nodesRef.current = snap.nodes; edgesRef.current = snap.edges;
    setNodes(snap.nodes); setEdges(snap.edges);
    setCanUndo(true); setCanRedo(histIdxRef.current < historyRef.current.length - 1);
    triggerSave();
  }, [triggerSave]);

  // ── Load map ───────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    getMap(mapId).then(data => {
      setMapMeta(data.map);
      const ns = data.nodes.map(n=>({
        id:n.id,type:n.node_type,x:n.x,y:n.y,w:n.w,h:n.h,
        title:n.title,notes:n.notes,properties:n.properties,customProps:n.custom_props,
      }));
      const es = data.edges.map(e=>({
        id:e.id,from:e.from_node,to:e.to_node,label:e.label,style:e.style,color:e.color,
      }));
      nodesRef.current = ns; edgesRef.current = es;
      setNodes(ns); setEdges(es);
      pushHistory(ns,es);
    }).catch(console.error).finally(()=>setLoading(false));
  }, [mapId]);

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag     = e.target.tagName;
      const isInput = ["INPUT","TEXTAREA","SELECT"].includes(tag);

      // ESC: step-back behaviour
      if (e.code==="Escape") {
        if (editingTitle) { setEditingTitle(null); return; }
        if (quickPos)     { setQuickPos(null); setQuickText(""); return; }
        if (drawingEdge)  { setDrawingEdge(null); return; }
        setMode("select"); return;
      }

      if (isInput) return;

      // Space → quick capture
      if (e.code==="Space") {
        e.preventDefault();
        if (!canEdit || !canvasRef.current) return;
        if (quickPos) { setQuickPos(null); setQuickText(""); return; }
        const el=canvasRef.current;
        setQuickText(""); setQuickPos({ x:el.scrollLeft+el.clientWidth/2-130, y:el.scrollTop+el.clientHeight/2-55 });
        return;
      }

      // Delete / Backspace
      if (e.code==="Delete" || e.code==="Backspace") { e.preventDefault(); deleteSelected(); return; }

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.code==="KeyZ" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((mod&&e.code==="KeyY") || (mod&&e.shiftKey&&e.code==="KeyZ")) { e.preventDefault(); redo(); return; }
      if (mod && e.code==="Enter")     { e.preventDefault(); handleAutoLayout(); return; }
      if (mod && e.code==="Equal")     { e.preventDefault(); setZoom(z=>Math.min(3,+(z+0.1).toFixed(1))); return; }
      if (mod && e.code==="Minus")     { e.preventDefault(); setZoom(z=>Math.max(0.2,+(z-0.1).toFixed(1))); return; }
      if (mod && e.code==="Digit0")    { e.preventDefault(); setZoom(1); return; }
      if (e.code==="KeyN" && canEdit)  { addNode("note"); return; }
      if (e.code==="KeyC" && canEdit)  { setMode(m=>m==="connect"?"select":"connect"); setDrawingEdge(null); return; }
      if (e.code==="KeyS" && canEdit)  { setMode("select"); setDrawingEdge(null); return; }
      if (e.code==="KeyV" && canEdit)  { setShowVersions(true); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quickPos, drawingEdge, canEdit, undo, redo, editingTitle]);

  useEffect(() => { if (quickPos) quickInpRef.current?.focus(); }, [quickPos]);

  // ── Pinch/scroll zoom ─────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(z => Math.min(3, Math.max(0.2, +(z - e.deltaY * 0.001).toFixed(2))));
    };
    el.addEventListener("wheel", onWheel, { passive:false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Quick capture commit ───────────────────────────────────
  const commitCapture = () => {
    const title = quickText.trim();
    if (!title) { setQuickPos(null); setQuickText(""); return; }
    const node = mkNode("note", quickPos.x, quickPos.y);
    node.title = title;
    applyNodes(ns => [...ns, node]);
    setSelected(node.id); setSelType("node");
    setQuickPos(null); setQuickText("");
  };

  // ── Drag + Resize ─────────────────────────────────────────
  const startDrag = useCallback((cx,cy,id) => {
    if (mode!=="select"||!canEdit||!canvasRef.current) return;
    const node=nodes.find(n=>n.id===id);
    const rect=canvasRef.current.getBoundingClientRect();
    const s=1/zoom;
    setDragging({ id, sx:(cx-rect.left)*s+canvasRef.current.scrollLeft*s, sy:(cy-rect.top)*s+canvasRef.current.scrollTop*s, ox:node.x,oy:node.y });
    setSelected(id); setSelType("node");
  }, [mode,nodes,canEdit,zoom]);

  const startResize = useCallback((e,id) => {
    e.stopPropagation(); e.preventDefault();
    const node=nodes.find(n=>n.id===id);
    setResizing({ id, startX:e.clientX,startY:e.clientY, origW:node.w,origH:node.h });
  }, [nodes]);

  useEffect(() => {
    const onMove=(e)=>{
      const isT=!!e.touches;
      const cx=isT?e.touches[0].clientX:e.clientX, cy=isT?e.touches[0].clientY:e.clientY;
      if (dragging&&canvasRef.current) {
        const rect=canvasRef.current.getBoundingClientRect(); const s=1/zoom;
        const dx=(cx-rect.left)*s+canvasRef.current.scrollLeft*s-dragging.sx;
        const dy=(cy-rect.top)*s+canvasRef.current.scrollTop*s-dragging.sy;
        setNodes(ns=>ns.map(n=>n.id===dragging.id?{...n,x:dragging.ox+dx,y:dragging.oy+dy}:n));
      }
      if (resizing) {
        const s=1/zoom;
        setNodes(ns=>ns.map(n=>n.id===resizing.id?{...n,w:Math.max(160,resizing.origW+(cx-resizing.startX)*s),h:Math.max(60,resizing.origH+(cy-resizing.startY)*s)}:n));
      }
      if (drawingEdge&&canvasRef.current) {
        const rect=canvasRef.current.getBoundingClientRect(); const s=1/zoom;
        setDrawingEdge(d=>({...d, mouseX:(cx-rect.left)*s+canvasRef.current.scrollLeft*s, mouseY:(cy-rect.top)*s+canvasRef.current.scrollTop*s}));
      }
    };
    const onUp=()=>{
      if (dragging||resizing) { triggerSave(); }
      setDragging(null); setResizing(null);
    };
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
    window.addEventListener("touchmove",onMove,{passive:true}); window.addEventListener("touchend",onUp);
    return ()=>{ window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); window.removeEventListener("touchmove",onMove); window.removeEventListener("touchend",onUp); };
  }, [dragging,resizing,drawingEdge,triggerSave,pushHistory,zoom]);

  // ── Node click ─────────────────────────────────────────────
  const handleNodeClick = useCallback((e,id) => {
    e.stopPropagation();
    if (mode==="connect") {
      if (drawingEdge) {
        if (drawingEdge.fromId!==id) {
          applyEdges(es=>[...es,{id:`e${Date.now()}`,from:drawingEdge.fromId,to:id,label:"",style:edgeStyle,color:"var(--accent)"}]);
        }
        setDrawingEdge(null);
      } else {
        const node=nodes.find(n=>n.id===id);
        setDrawingEdge({fromId:id,mouseX:node.x+node.w/2,mouseY:node.y+node.h/2});
      }
    } else {
      setSelected(id); setSelType("node");
      if (window.innerWidth<768) setShowProps(true);
    }
  }, [mode,drawingEdge,edgeStyle,nodes,applyEdges]);

  const handleEdgeClick = useCallback((e,eid) => {
    e.stopPropagation();
    if (mode==="select") { setSelected(eid); setSelType("edge"); }
  }, [mode]);

  // ── Add node ───────────────────────────────────────────────
  const addNode = useCallback((type) => {
    const el=canvasRef.current;
    const s=1/zoom;
    const node=mkNode(type,(el.scrollLeft+el.clientWidth/2)*s-110,(el.scrollTop+el.clientHeight/2)*s-48);
    applyNodes(ns=>[...ns,node]);
    setSelected(node.id); setSelType("node");
    setShowSidebar(false);
    if(window.innerWidth<768) setShowProps(true);
  }, [zoom,applyNodes]);

  // ── Delete ─────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selected||!canEdit) return;
    if (selType==="edge") {
      applyEdges(es=>es.filter(e=>e.id!==selected));
    } else {
      applyNodes(ns=>ns.filter(n=>n.id!==selected));
      applyEdges(es=>es.filter(e=>e.from!==selected&&e.to!==selected));
      setShowProps(false);
    }
    setSelected(null); setSelType(null);
  }, [selected,selType,canEdit,applyNodes,applyEdges]);

  // ── Node updates ───────────────────────────────────────────
  const updateNode   = (id,u)   => applyNodes(ns=>ns.map(n=>n.id===id?{...n,...u}:n));
  const updateProp   = (id,k,v) => applyNodes(ns=>ns.map(n=>n.id===id?{...n,properties:{...n.properties,[k]:v}}:n));
  const updateCustom = (id,k,v) => applyNodes(ns=>ns.map(n=>n.id===id?{...n,customProps:{...n.customProps,[k]:v}}:n));
  const deleteCustom = (id,k)   => applyNodes(ns=>ns.map(n=>{if(n.id!==id)return n;const c={...n.customProps};delete c[k];return{...n,customProps:c};}));
  const resetSize    = (id)     => applyNodes(ns=>ns.map(n=>n.id===id?{...n,w:n.type==="group"?GRP_W:DEF_W,h:n.type==="group"?GRP_H:DEF_H}:n));

  // ── Notes debounced save ───────────────────────────────────
  const updateNotes = (id, val) => {
    // Instant UI update
    setNodes(ns=>{
      const updated = ns.map(n=>n.id===id?{...n,notes:val}:n);
      nodesRef.current = updated;
      return updated;
    });
    // Debounce history + save
    clearTimeout(notesTimers.current[id]);
    notesTimers.current[id] = setTimeout(()=>{
      const updated = nodesRef.current;
      pushHistory(updated, edgesRef.current);
      triggerSave();
    }, 800);
  };

  // ── Auto-layout ────────────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    applyNodes(ns=>autoLayout(ns,edges));
  }, [edges,applyNodes]);

  // ── Restore version ────────────────────────────────────────
  const handleRestore = (ns, es) => {
    const mappedNodes = ns.map(n=>({
      id:n.id,type:n.node_type||n.type,x:n.x,y:n.y,w:n.w,h:n.h,
      title:n.title,notes:n.notes||"",
      properties:n.properties||{},customProps:n.custom_props||n.customProps||{},
    }));
    const mappedEdges = es.map(e=>({
      id:e.id,from:e.from_node||e.from,to:e.to_node||e.to,
      label:e.label||"",style:e.style||"arrow",color:e.color||"#58a6ff",
    }));
    nodesRef.current = mappedNodes; edgesRef.current = mappedEdges;
    setNodes(mappedNodes); setEdges(mappedEdges);
    pushHistory(mappedNodes,mappedEdges);
    triggerSave();
  };

  // ── Edge path ──────────────────────────────────────────────
  const getPath=(a,b)=>{
    const fx=a.x+a.w/2,fy=a.y+a.h/2,tx=b.x+b.w/2,ty=b.y+b.h/2,cx=(fx+tx)/2;
    return `M ${fx} ${fy} C ${cx} ${fy}, ${cx} ${ty}, ${tx} ${ty}`;
  };

  // ── LLM export ─────────────────────────────────────────────
  const exportLLM=()=>{
    const title=mapMeta?.title||"Map";
    let out=`# ${title}\n_NodeMap · ${new Date().toLocaleString()}_\n\n## Summary\n${nodes.length} components · ${edges.length} connections\n\n## Components\n\n`;
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
    out+=`\n---\n_Paste into any LLM for review, docs, or Q&A._`;
    return out;
  };

  // ── Derived ────────────────────────────────────────────────
  const selectedNode = selType==="node" ? nodes.find(n=>n.id===selected) : null;
  const cats         = useMemo(()=>[...new Set(Object.values(NT).map(t=>t.cat))],[]);
  const isMobile     = window.innerWidth<768;
  const saveMsgColor = saveState==="saved"?"var(--success)":saveState==="error"?"var(--danger)":"var(--text3)";

  if (loading) return (
    <div style={{height:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",color:"var(--text4)"}}>
        <div style={{fontSize:36,marginBottom:12}}>⬡</div>
        <div style={{fontSize:14}}>Loading map…</div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--bg)",overflow:"hidden"}}>
      {/* Canvas-local theme injection */}
      {canvasTheme !== "global" && THEMES[canvasTheme] && (
        <style>{`
          .nm-canvas-area {
            ${Object.entries(THEMES[canvasTheme].vars).map(([k,v])=>`${k}: ${v};`).join('
            ')}
          }
        `}</style>
      )}

      {/* ── Topbar ── */}
      <div style={{height:50,background:"var(--bg2)",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:4,padding:"0 8px",flexShrink:0,overflowX:"auto"}}>
        {/* Logo */}
        <span onClick={onHome} title="Home" style={{fontSize:20,cursor:"pointer",flexShrink:0,userSelect:"none",padding:"0 4px"}}>⬡</span>
        <button onClick={onBack} style={tbtn(false)}>← MAPS</button>
        <div style={{width:1,height:22,background:"var(--border)",flexShrink:0,margin:"0 2px"}}/>
        <span style={{fontSize:12,fontWeight:700,color:"var(--accent)",whiteSpace:"nowrap",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis"}}>{mapMeta?.title}</span>
        <div style={{width:1,height:22,background:"var(--border)",flexShrink:0,margin:"0 2px"}}/>

        {canEdit&&<>
          <button onClick={()=>{setMode("select");setDrawingEdge(null);}} style={tbtn(mode==="select","var(--accent2)")} title="Select (S)">↖</button>
          <button onClick={()=>{setMode("connect");}} style={tbtn(mode==="connect","#6C63FF")} title="Connect (C)">⤳</button>
          {mode==="connect"&&["arrow","line","dashed","bidirectional"].map(s=>(
            <button key={s} onClick={()=>setEdgeStyle(s)} style={tbtn(edgeStyle===s,"#6C63FF")}>{s}</button>
          ))}
          {mode==="connect"&&drawingEdge&&<span style={{fontSize:11,color:"#f78166",padding:"0 5px",animation:"pulse 1s infinite",flexShrink:0}}>● click target</span>}
          <button onClick={()=>setShowSidebar(v=>!v)} style={tbtn(false)} title="Add node (N)">＋ NODE</button>
          <button onClick={handleAutoLayout} style={tbtn(false)} title="Auto-layout (Ctrl+Enter)">⊞ LAYOUT</button>
          <button onClick={undo} disabled={!canUndo} style={{...tbtn(false),opacity:!canUndo?.3:1}} title="Undo (Ctrl+Z)">↩</button>
          <button onClick={redo} disabled={!canRedo} style={{...tbtn(false),opacity:!canRedo?.3:1}} title="Redo (Ctrl+Y)">↪</button>
          {selected&&<button onClick={deleteSelected} style={{...tbtn(false),background:"var(--danger)20",color:"var(--danger)"}} title="Delete (Del)">🗑</button>}
          {selectedNode&&<button onClick={()=>setShowProps(v=>!v)} style={tbtn(showProps,"var(--accent2)")} title="Properties">✏</button>}
        </>}

        <div style={{flex:1}}/>
        {/* Save status */}
        {saveMsg&&<span style={{fontSize:11,color:saveMsgColor,flexShrink:0,whiteSpace:"nowrap"}}>{saveMsg}</span>}

        {/* Zoom controls */}
        <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0,border:"1px solid var(--border)",borderRadius:7,padding:"0 4px",margin:"0 4px"}}>
          <button onClick={()=>setZoom(z=>Math.max(0.2,+(z-0.1).toFixed(1)))} style={{...tbtn(false),padding:"3px 7px"}}>−</button>
          <span onClick={()=>setZoom(1)} title="Reset zoom (Ctrl+0)" style={{fontSize:11,color:"var(--text3)",cursor:"pointer",minWidth:36,textAlign:"center",userSelect:"none"}}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>Math.min(3,+(z+0.1).toFixed(1)))} style={{...tbtn(false),padding:"3px 7px"}}>＋</button>
        </div>

        {/* Canvas theme */}
        <div style={{position:"relative",flexShrink:0}}>
          <button
            onClick={e=>{e.stopPropagation();setShowCanvasTheme(v=>!v);}}
            style={tbtn(canvasTheme!=="global","#6C63FF")} title="Canvas theme"
          >
            {canvasTheme==="global"?THEMES[themeName]?.icon||"🌐":"🎨"} CANVAS
          </button>
          {showCanvasTheme&&(
            <>
              {/* Backdrop — below dropdown */}
              <div
                style={{position:"fixed",inset:0,zIndex:199}}
                onClick={e=>{e.stopPropagation();setShowCanvasTheme(false);}}
              />
              {/* Dropdown — above backdrop */}
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:10,padding:8,zIndex:200,minWidth:200,boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}>
                <div style={{fontSize:9,fontWeight:700,color:"var(--text4)",letterSpacing:2,padding:"4px 10px 8px"}}>CANVAS THEME</div>
                {CANVAS_THEMES.map(t=>(
                  <div key={t.id}
                    onClick={e=>{e.stopPropagation();setCanvasTheme(t.id);setShowCanvasTheme(false);}}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,cursor:"pointer",background:canvasTheme===t.id?"var(--accent2)25":"transparent",fontSize:13,color:canvasTheme===t.id?"var(--accent)":"var(--text)",transition:"background .1s"}}>
                    <span style={{fontSize:16}}>{t.icon}</span>
                    <span>{t.label}</span>
                    {canvasTheme===t.id&&<span style={{marginLeft:"auto",color:"var(--accent)",fontSize:14}}>✓</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button onClick={()=>setShowVersions(true)} style={tbtn(false)} title="Version history (V)">🕐</button>
        <button onClick={()=>setShowChat(true)}      style={tbtn(false,"#6C63FF")}>💬</button>
        <button onClick={()=>setShowExport(true)}    style={tbtn(false,"#238636")}>↗</button>

        {/* Keyboard shortcuts tooltip */}
        {!isMobile&&<span title={"⌨ Shortcuts\nESC = select/cancel\nSpace = quick note\nDel = delete\nCtrl+Z/Y = undo/redo\nCtrl+Enter = auto-layout\nCtrl+±/0 = zoom\nN = new note  C = connect  S = select\nV = version history"}
          style={{fontSize:11,color:"var(--text4)",cursor:"help",flexShrink:0,padding:"0 4px",borderBottom:"1px dashed var(--text4)"}}>⌨</span>}
      </div>



      {/* ── Main area — canvas theme class applied here ── */}
      <div className="nm-canvas-area" style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>

        {/* Sidebar desktop */}
        {!isMobile&&<NodeSidebar cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} addNode={addNode} canEdit={canEdit}/>}

        {/* Mobile sidebar */}
        {isMobile&&showSidebar&&(
          <div style={{position:"absolute",inset:0,zIndex:50,display:"flex"}}>
            <div style={{flex:1,background:"rgba(0,0,0,.6)"}} onClick={()=>setShowSidebar(false)}/>
            <div style={{width:220,background:"var(--bg2)",borderLeft:"1px solid var(--border)",overflow:"auto",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"12px 14px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,color:"var(--accent)"}}>Add Node</span>
                <button onClick={()=>setShowSidebar(false)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20}}>×</button>
              </div>
              <NodeSidebar cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} addNode={addNode} canEdit={canEdit} inline/>
            </div>
          </div>
        )}

        {/* ── Canvas ── */}
        <div ref={canvasRef}
          onClick={()=>{setSelected(null);setSelType(null);if(drawingEdge)setDrawingEdge(null);}}
          onMouseMove={e=>{
            if(drawingEdge&&canvasRef.current){
              const rect=canvasRef.current.getBoundingClientRect(); const s=1/zoom;
              setDrawingEdge(d=>({...d,mouseX:(e.clientX-rect.left)*s+canvasRef.current.scrollLeft*s,mouseY:(e.clientY-rect.top)*s+canvasRef.current.scrollTop*s}));
            }
          }}
          style={{flex:1,position:"relative",overflow:"auto",cursor:mode==="connect"?"crosshair":"default",backgroundImage:"radial-gradient(circle,var(--canvas-dot) 1px,transparent 1px)",backgroundSize:`${28*zoom}px ${28*zoom}px`,WebkitOverflowScrolling:"touch"}}
        >
          {/* Zoom wrapper */}
          <div style={{width:4000*zoom,height:3000*zoom,position:"relative",transformOrigin:"0 0"}}>
            <div style={{transform:`scale(${zoom})`,transformOrigin:"0 0",width:4000,height:3000,position:"relative"}}>

              {/* SVG edges */}
              <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
                <defs>
                  <marker id="nm-a"  markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="var(--accent)" opacity=".85"/></marker>
                  <marker id="nm-a2" markerWidth="9" markerHeight="7" refX="1" refY="3.5" orient="auto-start-reverse"><polygon points="9 0, 0 3.5, 9 7" fill="var(--accent)" opacity=".85"/></marker>
                </defs>

                {/* Live arrow preview */}
                {drawingEdge&&(()=>{
                  const fn=nodes.find(n=>n.id===drawingEdge.fromId); if(!fn)return null;
                  const fx=fn.x+fn.w/2,fy=fn.y+fn.h/2,tx=drawingEdge.mouseX,ty=drawingEdge.mouseY,cx=(fx+tx)/2;
                  return <path d={`M ${fx} ${fy} C ${cx} ${fy}, ${cx} ${ty}, ${tx} ${ty}`}
                    stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="6,4" opacity=".7" markerEnd="url(#nm-a)"/>;
                })()}

                {edges.map(edge=>{
                  const f=nodes.find(n=>n.id===edge.from),t=nodes.find(n=>n.id===edge.to); if(!f||!t)return null;
                  const mid={x:(f.x+f.w/2+t.x+t.w/2)/2,y:(f.y+f.h/2+t.y+t.h/2)/2};
                  const isSel=selected===edge.id&&selType==="edge";
                  return (
                    <g key={edge.id} style={{cursor:"pointer",pointerEvents:"all"}} onClick={e=>handleEdgeClick(e,edge.id)}>
                      <path d={getPath(f,t)} stroke="transparent" strokeWidth="14" fill="none"/>
                      <path d={getPath(f,t)} stroke={isSel?"var(--danger)":edge.color||"var(--accent)"} strokeWidth={isSel?2.5:1.8}
                        fill="none" opacity=".7" strokeDasharray={edge.style==="dashed"?"7,5":"none"}
                        markerEnd={edge.style!=="line"?"url(#nm-a)":undefined}
                        markerStart={edge.style==="bidirectional"?"url(#nm-a2)":undefined}
                      />
                      {isSel&&canEdit&&(
                        <g style={{cursor:"pointer",pointerEvents:"all"}}
                          onClick={e=>{e.stopPropagation();applyEdges(es=>es.filter(ex=>ex.id!==edge.id));setSelected(null);setSelType(null);}}>
                          <circle cx={mid.x} cy={mid.y} r="11" fill="var(--danger)"/>
                          <text x={mid.x} y={mid.y+4.5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">×</text>
                        </g>
                      )}
                      {edge.label&&!isSel&&<text x={mid.x} y={mid.y-9} fill="var(--text3)" fontSize="11" textAnchor="middle" fontFamily="monospace">{edge.label}</text>}
                      {isSel&&(
                        <foreignObject x={mid.x-54} y={mid.y+16} width="108" height="28">
                          <input value={edge.label||""} placeholder="label"
                            onChange={e=>{e.stopPropagation();applyEdges(es=>es.map(ex=>ex.id===edge.id?{...ex,label:e.target.value}:ex));}}
                            onClick={e=>e.stopPropagation()}
                            style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--accent)",borderRadius:5,padding:"3px 6px",color:"var(--text)",fontSize:11,fontFamily:"monospace",outline:"none"}}/>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Nodes */}
              {nodes.map(node=>{
                const t=NT[node.type]||NT.note;
                const isSel=selected===node.id&&selType==="node";
                const isGroup=node.type==="group";
                const isEditingTitle=editingTitle===node.id;
                return (
                  <div key={node.id}
                    onMouseDown={e=>{e.stopPropagation();if(!isEditingTitle)startDrag(e.clientX,e.clientY,node.id);}}
                    onTouchStart={e=>{e.stopPropagation();startDrag(e.touches[0].clientX,e.touches[0].clientY,node.id);}}
                    onClick={e=>handleNodeClick(e,node.id)}
                    style={{
                      position:"absolute",left:node.x,top:node.y,width:node.w,minHeight:node.h,
                      background:isGroup?`${t.color}10`:"var(--node-bg)",
                      border:`2px ${isGroup?"dashed":"solid"} ${isSel?"var(--accent)":`${t.color}60`}`,
                      borderRadius:isGroup?14:10,
                      boxShadow:isSel?`0 0 0 3px ${t.color}30,0 6px 28px var(--shadow)`:"0 2px 12px var(--shadow)",
                      cursor:mode==="connect"?"crosshair":canEdit?"grab":"default",
                      userSelect:"none",overflow:"hidden",touchAction:"none",
                      transition:"border-color .12s,box-shadow .12s",
                    }}
                  >
                    {/* Header with inline title edit */}
                    <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",background:`${t.color}1a`,borderBottom:`1px solid ${t.color}25`}}>
                      <span style={{fontSize:15,lineHeight:1,flexShrink:0}}>{t.icon}</span>

                      {isEditingTitle ? (
                        <input
                          autoFocus
                          value={node.title}
                          onChange={e=>{e.stopPropagation();updateNode(node.id,{title:e.target.value});}}
                          onMouseDown={e=>e.stopPropagation()}
                          onBlur={()=>setEditingTitle(null)}
                          onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter"||e.key==="Escape")setEditingTitle(null);}}
                          style={{flex:1,background:"var(--bg)",border:`1px solid ${t.color}`,borderRadius:5,padding:"2px 6px",color:"var(--text)",fontSize:12,fontFamily:"inherit",outline:"none",fontWeight:700}}
                        />
                      ) : (
                        <span
                          onDoubleClick={e=>{e.stopPropagation();if(canEdit)setEditingTitle(node.id);}}
                          title={canEdit?"Double-click to edit title":""}
                          style={{fontSize:13,fontWeight:700,color:t.color,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:canEdit?"text":"default"}}
                        >{node.title}</span>
                      )}

                      <span style={{fontSize:9,color:"var(--text4)",letterSpacing:1.2,fontWeight:700,flexShrink:0}}>{t.label.toUpperCase()}</span>
                    </div>

                    {/* Body */}
                    {!isGroup&&(
                      <div style={{padding:"6px 10px 8px",fontSize:12,color:"var(--text3)",lineHeight:1.6}}>
                        {Object.entries(node.properties||{}).slice(0,3).map(([k,v])=>
                          v?<div key={k} style={{display:"flex",gap:5,overflow:"hidden"}}>
                            <span style={{color:"var(--text4)",flexShrink:0}}>{k}:</span>
                            <span style={{color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</span>
                          </div>:null
                        )}
                        {/* Inline notes — debounced autosave */}
                        <textarea
                          value={node.notes||""}
                          onChange={e=>{e.stopPropagation();updateNotes(node.id,e.target.value);}}
                          onMouseDown={e=>e.stopPropagation()}
                          onClick={e=>e.stopPropagation()}
                          placeholder="Notes…"
                          rows={2}
                          style={{width:"100%",marginTop:4,background:"transparent",border:"none",borderTop:`1px dashed ${t.color}30`,outline:"none",resize:"none",color:"var(--text3)",fontSize:11,fontFamily:"inherit",lineHeight:1.5,cursor:"text",paddingTop:4}}
                        />
                      </div>
                    )}

                    {/* Resize handle */}
                    {canEdit&&isSel&&<div onMouseDown={e=>startResize(e,node.id)}
                      style={{position:"absolute",bottom:0,right:0,width:16,height:16,cursor:"nw-resize",display:"flex",alignItems:"center",justifyContent:"center",opacity:.6}} title="Resize">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 10 L10 2 M6 10 L10 6" stroke="var(--accent)" strokeWidth="1.5"/></svg>
                    </div>}
                    {/* Reset size */}
                    {canEdit&&isSel&&<button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();resetSize(node.id);}}
                      title="Reset size" style={{position:"absolute",top:4,right:4,background:"var(--bg3)",border:"none",borderRadius:4,color:"var(--text4)",cursor:"pointer",fontSize:9,padding:"1px 5px",fontFamily:"inherit"}}>⊡</button>}
                  </div>
                );
              })}

              {/* Quick capture overlay */}
              {quickPos&&canEdit&&(
                <div style={{position:"absolute",left:quickPos.x,top:quickPos.y-64,zIndex:100,display:"flex",flexDirection:"column",gap:5}} onClick={e=>e.stopPropagation()}>
                  <div style={{background:"#6C63FF",color:"#fff",fontSize:10,fontWeight:700,letterSpacing:1.5,padding:"3px 9px",borderRadius:4,alignSelf:"flex-start"}}>⚡ QUICK CAPTURE</div>
                  <div style={{display:"flex",alignItems:"center",gap:7,background:"var(--bg2)",border:"2px solid #6C63FF",borderRadius:11,padding:"9px 12px",boxShadow:"0 10px 40px var(--shadow)",minWidth:300}}>
                    <span style={{fontSize:16}}>📝</span>
                    <input ref={quickInpRef} value={quickText} onChange={e=>setQuickText(e.target.value)}
                      onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter")commitCapture();if(e.key==="Escape"){setQuickPos(null);setQuickText("");}}}
                      placeholder="Type and press Enter…"
                      style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:14,fontFamily:"inherit"}}
                    />
                    <button onClick={commitCapture} style={{background:"#6C63FF",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,padding:"5px 12px",fontFamily:"inherit"}}>ADD</button>
                    <button onClick={()=>{setQuickPos(null);setQuickText("");}} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:18}}>×</button>
                  </div>
                  <div style={{fontSize:10,color:"var(--text4)",paddingLeft:2}}>Enter to place · Esc to dismiss</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties panel */}
        {selectedNode&&(showProps||!isMobile)&&(
          <PropsPanel node={selectedNode} edges={edges} nodes={nodes} isMobile={isMobile} canEdit={canEdit}
            onClose={()=>setShowProps(false)} onUpdate={updateNode} onUpdateProp={updateProp}
            onUpdateCustom={updateCustom} onDeleteCustom={deleteCustom}
            onAddCustom={()=>{ const k=`field_${Object.keys(selectedNode.customProps||{}).length+1}`; updateCustom(selectedNode.id,k,""); }}
            onUpdateEdge={(eid,u)=>applyEdges(es=>es.map(e=>e.id===eid?{...e,...u}:e))}
            onDeleteEdge={eid=>applyEdges(es=>es.filter(e=>e.id!==eid))}
            onResetSize={()=>resetSize(selectedNode.id)}
            onUpdateNotes={updateNotes}
            onStartEditTitle={()=>canEdit&&setEditingTitle(selectedNode.id)}
          />
        )}
      </div>

      {showExport&&<ExportModal nodes={nodes} edges={edges} mapTitle={mapMeta?.title} exportLLM={exportLLM} onClose={()=>setShowExport(false)}/>}
      {showChat&&<LLMChat mapId={mapId} nodes={nodes} edges={edges} mapTitle={mapMeta?.title||"Map"} onClose={()=>setShowChat(false)}/>}
      {showTheme&&<ThemePicker onClose={()=>setShowTheme(false)}/>}
      {showVersions&&<VersionHistory mapId={mapId} nodes={nodes} edges={edges} mapTitle={mapMeta?.title} onRestore={handleRestore} onClose={()=>setShowVersions(false)}/>}

      <style>{`
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function NodeSidebar({cats,activeCat,setActiveCat,addNode,canEdit,inline}){
  return(
    <div style={inline?{}:{width:178,background:"var(--bg2)",borderRight:"1px solid var(--border2)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
      {!inline&&<div style={{padding:"10px 14px",borderBottom:"1px solid var(--border2)",fontSize:11,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>NODE LIBRARY</div>}
      <div style={{display:"flex",flexWrap:"wrap",gap:4,padding:"8px 10px",borderBottom:"1px solid var(--border2)"}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setActiveCat(activeCat===c?null:c)}
            style={{padding:"3px 8px",border:"none",borderRadius:4,cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:.5,background:activeCat===c?"var(--accent2)":"var(--bg3)",color:activeCat===c?"#fff":"var(--text3)"}}>
            {c.slice(0,4).toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        {Object.entries(NT).filter(([,t])=>!activeCat||t.cat===activeCat).map(([key,t])=>(
          <div key={key} onClick={()=>canEdit&&addNode(key)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",cursor:canEdit?"pointer":"default",fontSize:12,borderLeft:"3px solid transparent",transition:"all .12s"}}
            onMouseEnter={e=>{if(canEdit){e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.borderLeftColor=t.color;}}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}>
            <span style={{fontSize:14}}>{t.icon}</span>
            <span style={{color:"var(--text2)"}}>{t.label}</span>
            <span style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:t.color,flexShrink:0}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function PropsPanel({node,edges,nodes,isMobile,canEdit,onClose,onUpdate,onUpdateProp,onUpdateCustom,onDeleteCustom,onAddCustom,onUpdateEdge,onDeleteEdge,onResetSize,onUpdateNotes,onStartEditTitle}){
  const t=NT[node.type]||NT.note;
  const nodeEdges=edges.filter(e=>e.from===node.id||e.to===node.id);
  return(
    <div style={isMobile?{position:"absolute",bottom:0,left:0,right:0,height:"65vh",background:"var(--bg2)",borderTop:"1px solid var(--border)",borderRadius:"14px 14px 0 0",overflow:"auto",zIndex:40,animation:"slideUp .25s ease"}:{width:272,background:"var(--bg2)",borderLeft:"1px solid var(--border2)",overflow:"auto",flexShrink:0}}>
      <div style={{padding:"11px 14px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:8,position:"sticky",top:0,background:"var(--bg2)",zIndex:1}}>
        <span style={{fontSize:16}}>{t.icon}</span>
        <span style={{fontSize:11,color:t.color,fontWeight:700,flex:1,letterSpacing:.5}}>{t.label.toUpperCase()}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
      </div>
      <div style={{padding:"13px 14px",display:"flex",flexDirection:"column",gap:11}}>

        {/* Title with edit button */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
            <label style={lbl}>TITLE</label>
            {canEdit&&<button onClick={onStartEditTitle} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>✏ edit inline</button>}
          </div>
          <input value={node.title} onChange={e=>onUpdate(node.id,{title:e.target.value})} disabled={!canEdit} style={inp()}/>
        </div>

        {/* Size */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
            <label style={lbl}>SIZE</label>
            {canEdit&&<button onClick={onResetSize} style={{background:"none",border:"1px solid var(--border)",borderRadius:4,color:"var(--text3)",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:"inherit"}}>⊡ RESET</button>}
          </div>
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:1}}>
              <label style={{...lbl,fontSize:9}}>W</label>
              <input type="number" value={node.w} onChange={e=>onUpdate(node.id,{w:+e.target.value})} disabled={!canEdit} style={{...inp(),marginTop:2}}/>
            </div>
            <div style={{flex:1}}>
              <label style={{...lbl,fontSize:9}}>H</label>
              <input type="number" value={node.h} onChange={e=>onUpdate(node.id,{h:+e.target.value})} disabled={!canEdit} style={{...inp(),marginTop:2}}/>
            </div>
          </div>
        </div>

        {/* Template props */}
        {Object.keys(node.properties||{}).length>0&&<>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,marginTop:2}}>TEMPLATE PROPERTIES</div>
          {Object.entries(node.properties).map(([k,v])=>(
            <div key={k}>
              <label style={{...lbl,color:`${t.color}cc`}}>{k.toUpperCase()}</label>
              <input value={v} onChange={e=>onUpdateProp(node.id,k,e.target.value)} disabled={!canEdit} style={inp()}/>
            </div>
          ))}
        </>}

        {/* Custom props */}
        <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>CUSTOM PROPERTIES</span>
            {canEdit&&<button onClick={onAddCustom} style={{background:"none",border:"1px solid var(--border)",borderRadius:4,color:"var(--text3)",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:"inherit"}}>+ ADD</button>}
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

        {/* Notes */}
        <div>
          <label style={lbl}>NOTES</label>
          <textarea value={node.notes||""} onChange={e=>onUpdateNotes(node.id,e.target.value)} disabled={!canEdit} rows={4} placeholder="Add notes…"
            style={{...inp(),resize:"vertical",lineHeight:1.55,marginTop:3}}/>
        </div>

        {/* Connections */}
        {nodeEdges.length>0&&(
          <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,marginBottom:8}}>CONNECTIONS</div>
            {nodeEdges.map(edge=>{
              const other=nodes.find(n=>n.id===(edge.from===node.id?edge.to:edge.from));
              return(
                <div key={edge.id} style={{display:"flex",alignItems:"center",gap:5,marginBottom:6,fontSize:12}}>
                  <span style={{color:"var(--accent)",flexShrink:0}}>{edge.from===node.id?"→":"←"}</span>
                  <span style={{flex:1,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{other?.title||"?"}</span>
                  <input value={edge.label||""} placeholder="label"
                    onChange={e=>onUpdateEdge(edge.id,{label:e.target.value})} disabled={!canEdit}
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

// ─────────────────────────────────────────────────────────────
function ExportModal({nodes,edges,mapTitle,exportLLM,onClose}){
  const [tab,setTab]=useState("llm");
  const [copied,setCopied]=useState(false);
  const content=tab==="llm"?exportLLM():JSON.stringify({title:mapTitle,nodes,edges},null,2);
  const copy=()=>{navigator.clipboard.writeText(content);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.76)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={onClose}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:14,padding:20,width:"100%",maxWidth:600,maxHeight:"84vh",display:"flex",flexDirection:"column",gap:14}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:14,color:"var(--accent)"}}>↗ EXPORT</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:22}}>×</button>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[["llm","🤖 LLM Text"],["json","{ } JSON"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{...tbtn(tab===id,"var(--accent2)"),padding:"8px 16px",fontSize:12}}>{label}</button>
          ))}
          <button onClick={()=>exportAsPNG(nodes,edges,mapTitle)} style={{...tbtn(false,"#9C27B0"),padding:"8px 16px",fontSize:12}}>🖼 PNG</button>
          <div style={{flex:1}}/>
          <button onClick={copy} style={{...tbtn(copied,"var(--success)"),padding:"8px 16px",fontSize:12}}>{copied?"✓ COPIED":"📋 COPY"}</button>
        </div>
        {tab==="llm"&&<div style={{fontSize:12,color:"var(--text3)",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",lineHeight:1.6}}>
          Grouped by category · Arrows as sentences · Groups as sections · Paste into any LLM
        </div>}
        <pre style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:16,fontSize:12,overflow:"auto",flex:1,margin:0,color:"var(--text)",lineHeight:1.65,whiteSpace:"pre-wrap"}}>
          {content}
        </pre>
      </div>
    </div>
  );
}
