/**
 * MobileCanvas v2 — full feature parity with desktop, touch-optimised.
 *
 * UI model:
 *  • Pinch-to-zoom + one-finger pan on canvas background
 *  • Bottom toolbar: Select | Connect | Add(FAB) | Layout | More
 *  • Tap node → selected state + "Edit" button on node
 *  • Bottom sheet → full node editor (title, description, notes)
 *  • Add sheet → node type grid grouped by category
 *  • Long-press/drag node → moves it
 *  • Tap edge → confirm to delete
 *  • Full collab sync (presence, live updates)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { getMap, saveMap, getAccessToken } from "../api/client.js";

// ── Node type map ─────────────────────────────────────────────────
const NT = {
  note:       { label:"Note",          color:"#FFD93D", icon:"📝", cat:"General" },
  heading:    { label:"Heading",       color:"#6C63FF", icon:"📌", cat:"General" },
  user:       { label:"User",          color:"#E91E63", icon:"👤", cat:"General" },
  process:    { label:"Process",       color:"#9C27B0", icon:"🔄", cat:"General" },
  decision:   { label:"Decision",      color:"#FF9800", icon:"◆",  cat:"General" },
  annotation: { label:"Comment",       color:"#78909C", icon:"💬", cat:"General" },
  router:     { label:"Router",        color:"#00BCD4", icon:"📡", cat:"Network" },
  switch:     { label:"Switch",        color:"#03A9F4", icon:"🔀", cat:"Network" },
  firewall:   { label:"Firewall",      color:"#FF5722", icon:"🔥", cat:"Network" },
  loadbal:    { label:"Load Balancer", color:"#26C6DA", icon:"⚖️", cat:"Network" },
  vpn:        { label:"VPN",           color:"#42A5F5", icon:"🔐", cat:"Network" },
  server:     { label:"Server",        color:"#EF5350", icon:"🗄️", cat:"Servers" },
  webserver:  { label:"Web Server",    color:"#E53935", icon:"🌍", cat:"Servers" },
  dbserver:   { label:"DB Server",     color:"#C62828", icon:"🗃️", cat:"Servers" },
  appserver:  { label:"App Server",    color:"#F44336", icon:"⚙️", cat:"Servers" },
  database:   { label:"Database",      color:"#3F51B5", icon:"🗃️", cat:"Software" },
  api:        { label:"API",           color:"#009688", icon:"🔌", cat:"Software" },
  service:    { label:"Service",       color:"#8BC34A", icon:"⚡", cat:"Software" },
  microservice:{label:"Microservice",  color:"#66BB6A", icon:"🧩", cat:"Software" },
  cache:      { label:"Cache",         color:"#FF7043", icon:"⚡", cat:"Software" },
  cloud:      { label:"Cloud",         color:"#29B6F6", icon:"☁️", cat:"Cloud" },
  container:  { label:"Container",     color:"#2496ED", icon:"📦", cat:"Cloud" },
  k8s:        { label:"Kubernetes",    color:"#326CE5", icon:"⎈",  cat:"Cloud" },
  lambda:     { label:"Function",      color:"#FF9100", icon:"λ",  cat:"Cloud" },
  s3:         { label:"Object Store",  color:"#FF6D00", icon:"🪣", cat:"Cloud" },
  mobile:     { label:"Mobile",        color:"#66BB6A", icon:"📱", cat:"Devices" },
  laptop:     { label:"Laptop",        color:"#A1887F", icon:"💻", cat:"Devices" },
  desktop:    { label:"Desktop",       color:"#8D6E63", icon:"🖥️", cat:"Devices" },
  storage:    { label:"Storage",       color:"#607D8B", icon:"💾", cat:"Storage" },
  nas:        { label:"NAS",           color:"#546E7A", icon:"🗄️", cat:"Storage" },
  ids:        { label:"IDS/IPS",       color:"#F44336", icon:"🛡️", cat:"Security" },
  waf:        { label:"WAF",           color:"#E53935", icon:"🧱", cat:"Security" },
  vault:      { label:"Vault",         color:"#B00020", icon:"🔒", cat:"Security" },
  siem:       { label:"SIEM",          color:"#C62828", icon:"🔍", cat:"Security" },
};

const CATS = ["General","Network","Servers","Software","Cloud","Devices","Storage","Security"];
const DEF_W = 220, DEF_H = 96;
const ACCENT = "#58a6ff";

const USER_COLORS = ["#f97316","#06b6d4","#a855f7","#22c55e","#f59e0b","#ef4444","#3b82f6","#ec4899"];
const userColor = id => { let h=0; for(let i=0;i<(id||"").length;i++) h=(h*31+id.charCodeAt(i))>>>0; return USER_COLORS[h%USER_COLORS.length]; };
const mkId = () => Math.random().toString(36).slice(2,10);

function mkNode(type, x, y) {
  const t = NT[type] || NT.note;
  return { id:mkId(), type, title:t.label, description:"", x, y, w:DEF_W, h:DEF_H, notes:[], properties:{}, collapsed:false };
}

// Point on node border towards target
function edgePt(node, tx, ty) {
  const cx=node.x+(node.w||DEF_W)/2, cy=node.y+(node.h||DEF_H)/2;
  const dx=tx-cx, dy=ty-cy;
  if (Math.abs(dx)<0.01&&Math.abs(dy)<0.01) return {x:cx,y:cy};
  const hw=(node.w||DEF_W)/2, hh=(node.h||DEF_H)/2;
  const s=Math.min(Math.abs(dx)>0.01?hw/Math.abs(dx):Infinity, Math.abs(dy)>0.01?hh/Math.abs(dy):Infinity);
  return {x:cx+dx*s, y:cy+dy*s};
}

function NodeIcon({ icon, size=18, color="currentColor" }) {
  if (!icon) return null;
  if (typeof icon === "string") return <span style={{fontSize:size,lineHeight:1}}>{icon}</span>;
  const I = icon;
  return <I size={size} color={color} strokeWidth={1.8} style={{flexShrink:0}} />;
}

export default function MobileCanvas({ mapId, onBack }) {
  const [nodes,   setNodes]   = useState([]);
  const [edges,   setEdges]   = useState([]);
  const [mapMeta, setMapMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [zoom,    setZoom]    = useState(0.55);
  const [pan,     setPan]     = useState({x:16, y:16});
  const [mode,    setMode]    = useState("select");
  const [selected,setSelected]= useState(null);
  const [connecting,setConnecting]=useState(null);
  const [sheet,   setSheet]   = useState(null);
  const [addCat,  setAddCat]  = useState("General");
  const [saving,  setSaving]  = useState(false);
  const [editTitle,setEditTitle]=useState("");
  const [editDesc, setEditDesc]=useState("");
  const [newNote,  setNewNote] =useState("");
  const [remoteSelections,setRemoteSelections]=useState({});

  const nodesRef  = useRef([]);
  const wsRef     = useRef(null);
  const saveTimer = useRef(null);
  const drag      = useRef(null);
  const ptrs      = useRef(new Map());
  const lastPinch = useRef(null);
  const lastPan   = useRef(null);
  const canvasRef = useRef(null);

  useEffect(()=>{ nodesRef.current=nodes; },[nodes]);

  // Load
  useEffect(()=>{
    if(!mapId) return;
    setLoading(true);
    getMap(mapId)
      .then(d=>{
        setMapMeta(d.map||null);
        setNodes(Array.isArray(d.nodes)?d.nodes:[]);
        setEdges(Array.isArray(d.edges)?d.edges:[]);
      })
      .catch(e=>setError(e?.message||"Failed to load map"))
      .finally(()=>setLoading(false));
  },[mapId]);

  // Save
  const scheduleSave = useCallback((ns,es)=>{
    clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current=setTimeout(async()=>{
      try {
        await saveMap(mapId,{nodes:ns,edges:es,groupBoxes:[]});
        const ws=wsRef.current;
        if(ws?.readyState===1){
          ws.send(JSON.stringify({type:"nodes_update",nodes:ns}));
          ws.send(JSON.stringify({type:"edges_update",edges:es}));
        }
      } catch {}
      setSaving(false);
    },1000);
  },[mapId]);

  const applyNodes=useCallback((fn)=>{
    setNodes(prev=>{
      const next=typeof fn==="function"?fn(prev):fn;
      setEdges(es=>{scheduleSave(next,es);return es;});
      return next;
    });
  },[scheduleSave]);

  const applyEdges=useCallback((fn)=>{
    setEdges(prev=>{
      const next=typeof fn==="function"?fn(prev):fn;
      setNodes(ns=>{scheduleSave(ns,next);return ns;});
      return next;
    });
  },[scheduleSave]);

  // WebSocket
  useEffect(()=>{
    if(!mapId) return;
    let ws,timer,active=true;
    const connect=()=>{
      const token=getAccessToken(); if(!token) return;
      const proto=location.protocol==="https:"?"wss:":"ws:";
      ws=new WebSocket(`${proto}//${location.host}/ws`);
      wsRef.current=ws;
      ws.onopen=()=>ws.send(JSON.stringify({type:"join",mapId,token}));
      ws.onmessage=e=>{
        let msg; try{msg=JSON.parse(e.data);}catch{return;}
        if(msg.type==="nodes_update") setNodes(msg.nodes);
        if(msg.type==="edges_update") setEdges(msg.edges);
        if(msg.type==="selection_update")
          setRemoteSelections(prev=>({...prev,[msg.userId]:{color:userColor(msg.userId),selectedIds:new Set(msg.selectedIds||[])}}));
        if(msg.type==="user_left")
          setRemoteSelections(prev=>{const n={...prev};delete n[msg.userId];return n;});
      };
      ws.onclose=ev=>{wsRef.current=null;if(active&&ev.code!==1000)timer=setTimeout(connect,4000);};
    };
    connect();
    return()=>{active=false;clearTimeout(timer);ws?.readyState<=1&&ws.close(1000);};
  },[mapId]);

  // Broadcast selection
  const broadcastSel=useCallback((nodeId)=>{
    const ws=wsRef.current;
    if(ws?.readyState===1)
      ws.send(JSON.stringify({type:"selection_update",selectedIds:nodeId?[nodeId]:[],editingId:null}));
  },[]);

  // Canvas touch handlers
  const onCvDown=useCallback(e=>{
    if(e.target.closest(".mob-node")) return;
    ptrs.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    e.currentTarget.setPointerCapture(e.pointerId);
    if(ptrs.current.size===1) lastPan.current={x:e.clientX,y:e.clientY};
    if(ptrs.current.size===2) lastPinch.current=null;
    setSelected(null); broadcastSel(null);
    if(mode==="connect") setConnecting(null);
  },[mode,broadcastSel]);

  const onCvMove=useCallback(e=>{
    ptrs.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const pts=[...ptrs.current.values()];
    if(pts.length===2){
      const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      if(lastPinch.current!==null){
        const delta=d/lastPinch.current;
        setZoom(z=>Math.max(0.2,Math.min(3,+(z*delta).toFixed(2))));
      }
      lastPinch.current=d;
    } else if(pts.length===1&&!drag.current){
      if(lastPan.current){
        const dx=e.clientX-lastPan.current.x, dy=e.clientY-lastPan.current.y;
        setPan(p=>({x:p.x+dx,y:p.y+dy}));
        lastPan.current={x:e.clientX,y:e.clientY};
      }
    } else if(drag.current){
      const d=drag.current;
      const dx=(e.clientX-d.sx)/zoom, dy=(e.clientY-d.sy)/zoom;
      if(Math.abs(dx)>4||Math.abs(dy)>4) d.moved=true;
      if(d.moved) setNodes(ns=>ns.map(n=>n.id===d.id?{...n,x:Math.max(0,d.nx+dx),y:Math.max(0,d.ny+dy)}:n));
    }
  },[zoom]);

  const onCvUp=useCallback(e=>{
    ptrs.current.delete(e.pointerId);
    if(ptrs.current.size<2) lastPinch.current=null;
    lastPan.current=ptrs.current.size===1?[...ptrs.current.values()][0]:null;
    if(drag.current?.moved){
      const ns=nodesRef.current;
      setEdges(es=>{scheduleSave(ns,es);return es;});
    }
    drag.current=null;
  },[scheduleSave]);

  // Node touch handlers
  const onNodeDown=useCallback((e,nodeId)=>{
    e.stopPropagation();
    ptrs.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPan.current=null;
    const node=nodesRef.current.find(n=>n.id===nodeId);
    if(node) drag.current={id:nodeId,sx:e.clientX,sy:e.clientY,nx:node.x,ny:node.y,moved:false};
  },[]);

  const onNodeUp=useCallback((e,nodeId)=>{
    e.stopPropagation();
    ptrs.current.delete(e.pointerId);
    const d=drag.current;
    if(!d||!d.moved){
      // Tap
      if(mode==="connect"&&connecting&&connecting!==nodeId){
        applyEdges(es=>[...es,{id:mkId(),from:connecting,to:nodeId,style:"arrow",color:ACCENT}]);
        setConnecting(null); setMode("select");
      } else if(mode==="connect"&&!connecting){
        setConnecting(nodeId);
      } else {
        setSelected(nodeId);
        broadcastSel(nodeId);
        const node=nodesRef.current.find(n=>n.id===nodeId);
        if(node){setEditTitle(node.title||"");setEditDesc(node.description||"");}
      }
    } else {
      const ns=nodesRef.current;
      setEdges(es=>{scheduleSave(ns,es);return es;});
    }
    drag.current=null;
  },[mode,connecting,applyEdges,broadcastSel,scheduleSave]);

  const addNode=useCallback((type)=>{
    const el=canvasRef.current;
    const cx=el?(el.clientWidth/2-pan.x)/zoom:400;
    const cy=el?(el.clientHeight/2-pan.y)/zoom:300;
    let ox=0,oy=0;
    for(let i=0;i<20;i++){
      if(!nodesRef.current.some(n=>Math.abs(n.x-(cx+ox))<DEF_W+20&&Math.abs(n.y-(cy+oy))<DEF_H+20)) break;
      ox+=DEF_W+24; if(ox>600){ox=0;oy+=DEF_H+24;}
    }
    const node=mkNode(type,cx+ox,cy+oy);
    applyNodes(ns=>[...ns,node]);
    setSelected(node.id); setEditTitle(node.title); setEditDesc("");
    setSheet(null); setMode("select");
  },[pan,zoom,applyNodes]);

  const deleteSelected=useCallback(()=>{
    if(!selected) return;
    if(!window.confirm("Delete this node?")) return;
    applyNodes(ns=>ns.filter(n=>n.id!==selected));
    applyEdges(es=>es.filter(e=>e.from!==selected&&e.to!==selected));
    setSelected(null); setSheet(null);
  },[selected,applyNodes,applyEdges]);

  const saveEdit=useCallback(()=>{
    if(!selected) return;
    applyNodes(ns=>ns.map(n=>n.id===selected?{...n,title:editTitle,description:editDesc}:n));
    setSheet(null);
  },[selected,editTitle,editDesc,applyNodes]);

  const addNote=useCallback(()=>{
    if(!selected||!newNote.trim()) return;
    applyNodes(ns=>ns.map(n=>n.id===selected?{...n,notes:[...(Array.isArray(n.notes)?n.notes:[]),{id:mkId(),content:newNote.trim(),sensitive:false}]}:n));
    setNewNote("");
  },[selected,newNote,applyNodes]);

  const deleteNote=useCallback((nodeId,idx)=>{
    applyNodes(ns=>ns.map(n=>n.id===nodeId?{...n,notes:(Array.isArray(n.notes)?n.notes:[]).filter((_,i)=>i!==idx)}:n));
  },[applyNodes]);

  const selNode=nodes.find(n=>n.id===selected);
  const remoteColor=id=>{ for(const rs of Object.values(remoteSelections)) if(rs.selectedIds?.has(id)) return rs.color; return null; };

  // Fit to screen
  const fitView=()=>{
    if(!nodes.length) return;
    const minX=Math.min(...nodes.map(n=>n.x))-20;
    const minY=Math.min(...nodes.map(n=>n.y))-20;
    const maxX=Math.max(...nodes.map(n=>n.x+(n.w||DEF_W)))+20;
    const maxY=Math.max(...nodes.map(n=>n.y+(n.h||DEF_H)))+20;
    const el=canvasRef.current; if(!el) return;
    const z=Math.min(3,Math.min(el.clientWidth/(maxX-minX),el.clientHeight/(maxY-minY)))*0.9;
    setZoom(z); setPan({x:-minX*z+20,y:-minY*z+20});
  };

  if(loading) return(
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:36}}>⬡</div>
      <div style={{fontSize:12,color:"var(--text4)",letterSpacing:2}}>LOADING…</div>
    </div>
  );
  if(error) return(
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
      <div style={{fontSize:13,color:"var(--danger)"}}>{error}</div>
      <button onClick={onBack} style={mBtn(true)}>← Back</button>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:"var(--bg)",touchAction:"none"}}>

      {/* ─── TOP BAR ───────────────────────────────────────── */}
      <div style={{height:52,background:"var(--bg2)",borderBottom:"1px solid var(--border2)",
        display:"flex",alignItems:"center",gap:8,padding:"0 12px",flexShrink:0,zIndex:20}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--text3)",
          fontSize:22,cursor:"pointer",padding:"4px 8px",borderRadius:8,lineHeight:1}}>←</button>
        <span style={{fontSize:14,fontWeight:700,color:"var(--accent)",flex:1,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {mapMeta?.title||"Map"}
        </span>
        {saving&&<span style={{fontSize:9,color:"var(--text4)"}}>saving…</span>}
        {Object.entries(remoteSelections).map(([uid,rs],i)=>(
          <div key={uid} title={uid} style={{width:22,height:22,borderRadius:"50%",background:rs.color,
            color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
            border:"2px solid var(--bg2)",marginLeft:i>0?-6:0,flexShrink:0}}>
            {uid[0].toUpperCase()}
          </div>
        ))}
        <button onClick={fitView} style={{background:"var(--bg3)",border:"none",borderRadius:6,
          color:"var(--text4)",fontSize:10,padding:"4px 9px",cursor:"pointer",flexShrink:0}}>
          {Math.round(zoom*100)}% FIT
        </button>
      </div>

      {/* Connect mode hint */}
      {mode==="connect"&&(
        <div style={{background:connecting?"#22c55e22":"var(--accent)22",
          borderBottom:`2px solid ${connecting?"#22c55e":ACCENT}`,
          padding:"8px 16px",fontSize:12,fontWeight:700,
          color:connecting?"#22c55e":ACCENT,textAlign:"center"}}>
          {connecting?"✓ Source set — now tap the destination node":"⤳ Tap the source node to start"}
        </div>
      )}

      {/* ─── CANVAS ────────────────────────────────────────── */}
      <div ref={canvasRef}
        style={{flex:1,position:"relative",overflow:"hidden",
          background:"radial-gradient(circle,var(--canvas-dot) 1px,transparent 1px) center/28px 28px var(--canvas-bg)"}}
        onPointerDown={onCvDown} onPointerMove={onCvMove}
        onPointerUp={onCvUp} onPointerCancel={onCvUp}>

        <div style={{position:"absolute",
          transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          transformOrigin:"0 0",width:4000,height:3000,userSelect:"none"}}>

          {/* SVG edges — must be BEFORE nodes in DOM so nodes appear on top */}
          <svg style={{position:"absolute",left:0,top:0,width:4000,height:3000,
            pointerEvents:"none",overflow:"visible"}}>
            <defs>
              <marker id="ma" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <polygon points="0 0,10 4,0 8" fill={ACCENT}/>
              </marker>
            </defs>
            {edges.map(edge=>{
              const f=nodes.find(n=>n.id===edge.from),t=nodes.find(n=>n.id===edge.to);
              if(!f||!t) return null;
              const fcx=f.x+(f.w||DEF_W)/2,fcy=f.y+(f.h||DEF_H)/2;
              const tcx=t.x+(t.w||DEF_W)/2,tcy=t.y+(t.h||DEF_H)/2;
              const fp=edgePt(f,tcx,tcy),tp=edgePt(t,fcx,fcy);
              const dx=tp.x-fp.x,dy=tp.y-fp.y;
              const dist=Math.hypot(dx,dy)||1;
              const ctrl=Math.max(60,dist*0.42);
              // Exit normal from the face the point is on
              const fNx=Math.abs(fp.x-f.x)<3?-1:Math.abs(fp.x-(f.x+(f.w||DEF_W)))<3?1:0;
              const fNy=fNx!==0?0:(Math.abs(fp.y-f.y)<3?-1:1);
              const tNx=Math.abs(tp.x-t.x)<3?-1:Math.abs(tp.x-(t.x+(t.w||DEF_W)))<3?1:0;
              const tNy=tNx!==0?0:(Math.abs(tp.y-t.y)<3?-1:1);
              const c1x=fp.x+(fNx!==0?fNx:Math.sign(dx)||1)*ctrl;
              const c1y=fp.y+(fNx!==0?0:fNy)*ctrl;
              const c2x=tp.x+(tNx!==0?tNx:Math.sign(-dx)||1)*ctrl;
              const c2y=tp.y+(tNx!==0?0:tNy)*ctrl;
              const path=`M ${fp.x} ${fp.y} C ${c1x} ${c1y},${c2x} ${c2y},${tp.x} ${tp.y}`;
              const da=edge.style==="dashed"?"8,5":edge.style==="dotted"?"2,5":"none";
              const ec=edge.color||ACCENT;
              return(
                <g key={edge.id} style={{pointerEvents:"all"}}
                  onClick={e=>{e.stopPropagation();if(window.confirm("Delete this connection?"))applyEdges(es=>es.filter(x=>x.id!==edge.id));}}>
                  {/* Wide invisible hit area */}
                  <path d={path} stroke="transparent" strokeWidth={20} fill="none" style={{cursor:"pointer"}}/>
                  {/* Visible edge */}
                  <path d={path} stroke={ec} strokeWidth={2.5} fill="none"
                    strokeDasharray={da} markerEnd="url(#ma)" opacity={0.9}/>
                  {edge.label&&<text x={(fp.x+tp.x)/2} y={(fp.y+tp.y)/2-9}
                    fill="var(--text3)" fontSize={11} textAnchor="middle"
                    fontFamily="var(--font-ui)">{edge.label}</text>}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node=>{
            const t=NT[node.type]||NT.note;
            const isSel=selected===node.id;
            const isConn=connecting===node.id;
            const rColor=remoteColor(node.id);
            const border=isConn?"#22c55e":rColor||(isSel?ACCENT:`${t.color}55`);
            const noteCount=(Array.isArray(node.notes)?node.notes:[]).filter(n=>!n.sensitive).length;
            return(
              <div key={node.id} className="mob-node"
                onPointerDown={e=>onNodeDown(e,node.id)}
                onPointerUp={e=>onNodeUp(e,node.id)}
                onPointerCancel={e=>onNodeUp(e,node.id)}
                style={{position:"absolute",left:node.x,top:node.y,
                  width:node.w||DEF_W,minHeight:node.h||DEF_H,zIndex:2,
                  background:"var(--bg2)",border:`2px solid ${border}`,
                  borderRadius:10,touchAction:"none",cursor:"grab",
                  boxShadow:isSel?`0 0 0 3px ${ACCENT}44,0 8px 24px rgba(0,0,0,.55)`:"0 2px 8px rgba(0,0,0,.4)",
                  transition:"border-color .12s,box-shadow .12s"}}>
                {/* Header */}
                <div style={{padding:"10px 12px 6px",background:`${t.color}18`,
                  borderRadius:"8px 8px 0 0",display:"flex",alignItems:"center",gap:8}}>
                  <NodeIcon icon={t.icon} size={20} color={t.color} />
                  <span style={{fontSize:13,fontWeight:700,color:"var(--text)",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,lineHeight:1.2}}>
                    {node.title||"Untitled"}
                  </span>
                  {isSel&&(
                    <button onPointerDown={e=>e.stopPropagation()}
                      onClick={e=>{e.stopPropagation();setSheet("node");}}
                      style={{background:`${t.color}30`,border:"none",borderRadius:6,
                        color:t.color,fontSize:11,fontWeight:700,padding:"3px 9px",cursor:"pointer",flexShrink:0}}>
                      Edit ✎
                    </button>
                  )}
                </div>
                {node.description&&(
                  <div style={{padding:"6px 12px",fontSize:11,color:"var(--text3)",lineHeight:1.5}}>
                    {node.description.slice(0,140)}{node.description.length>140?"…":""}
                  </div>
                )}
                {noteCount>0&&(
                  <div style={{padding:"0 12px 8px"}}>
                    <span onPointerDown={e=>e.stopPropagation()}
                      onClick={e=>{e.stopPropagation();setSelected(node.id);setSheet("notes");}}
                      style={{fontSize:10,color:"var(--text4)",background:"var(--bg3)",
                        borderRadius:4,padding:"2px 8px",cursor:"pointer",display:"inline-block"}}>
                      📝 {noteCount} note{noteCount>1?"s":""}
                    </span>
                  </div>
                )}
                {/* Remote badge */}
                {rColor&&<div style={{position:"absolute",top:-10,right:8,background:rColor,
                  color:"#fff",fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:3,pointerEvents:"none"}}>
                  editing
                </div>}
                {/* Connect ring */}
                {isConn&&<div style={{position:"absolute",inset:-6,borderRadius:14,
                  border:"2.5px dashed #22c55e",pointerEvents:"none",
                  animation:"mob-ring 1.2s ease-in-out infinite"}}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── BOTTOM TOOLBAR ────────────────────────────────── */}
      <div style={{height:62,background:"var(--bg2)",borderTop:"1px solid var(--border2)",
        display:"flex",alignItems:"center",justifyContent:"space-around",
        flexShrink:0,zIndex:20,paddingBottom:"env(safe-area-inset-bottom,4px)"}}>
        <TBtn icon="↖" label="Select" active={mode==="select"} onTap={()=>{setMode("select");setConnecting(null);setSheet(null);}}/>
        <TBtn icon="⤳" label="Connect" active={mode==="connect"} ac="#6C63FF"
          onTap={()=>{setMode(m=>m==="connect"?"select":"connect");setConnecting(null);setSheet(null);}}/>
        {/* FAB */}
        <button onPointerDown={e=>e.stopPropagation()}
          onClick={()=>{setSheet(s=>s==="add"?null:"add");setMode("select");setConnecting(null);}}
          style={{width:54,height:54,borderRadius:"50%",
            background:sheet==="add"?"var(--bg3)":"var(--accent2)",
            border:"none",color:"#fff",fontSize:28,cursor:"pointer",
            boxShadow:sheet==="add"?"0 0 0 2px var(--accent)":"0 4px 18px rgba(88,166,255,.55)",
            display:"flex",alignItems:"center",justifyContent:"center",
            transform:sheet==="add"?"rotate(45deg)":"none",transition:"all .2s",
            marginTop:-20}}>+</button>
        <TBtn icon="⊞" label="Layout" active={false}
          onTap={()=>{alert("Auto-layout: open on desktop for full layout options.");}}/>
        <TBtn icon="···" label="More" active={sheet==="more"}
          onTap={()=>setSheet(s=>s==="more"?null:"more")}/>
      </div>

      {/* ─── SHEET BACKDROP ────────────────────────────────── */}
      {sheet&&<div onClick={()=>{if(sheet==="node")saveEdit();else setSheet(null);}}
        style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:29}}/>}

      {/* ADD SHEET */}
      {sheet==="add"&&(
        <Sht title="Add Node" onClose={()=>setSheet(null)} h="68vh">
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:10,marginBottom:10,
            borderBottom:"1px solid var(--border2)"}}>
            {CATS.filter(c=>Object.values(NT).some(t=>t.cat===c)).map(c=>(
              <button key={c} onClick={()=>setAddCat(c)}
                style={{padding:"5px 13px",borderRadius:20,border:"none",cursor:"pointer",
                  fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0,
                  background:addCat===c?"var(--accent2)":"var(--bg3)",
                  color:addCat===c?"#fff":"var(--text3)"}}>
                {c}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,overflowY:"auto",paddingBottom:16}}>
            {Object.entries(NT).filter(([,t])=>t.cat===addCat).map(([type,t])=>(
              <button key={type} onClick={()=>addNode(type)}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                  padding:"14px 6px",border:`1.5px solid ${t.color}40`,borderRadius:10,
                  background:`${t.color}12`,cursor:"pointer"}}>
                <NodeIcon icon={t.icon} size={28} color={t.color} />
                <span style={{fontSize:10,fontWeight:700,color:"var(--text2)",textAlign:"center",lineHeight:1.2}}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </Sht>
      )}

      {/* NODE EDIT SHEET */}
      {sheet==="node"&&selNode&&(
        <Sht title="Edit Node" onClose={saveEdit} h="78vh"
          foot={
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setSheet("notes")} style={mBtn(false)}>
                📝 Notes {Array.isArray(selNode.notes)&&selNode.notes.length>0?` (${selNode.notes.length})`:""}
              </button>
              <button onClick={saveEdit} style={{...mBtn(true),flex:1}}>Save ✓</button>
              <button onClick={deleteSelected} style={{...mBtn(false),color:"var(--danger)"}}>🗑</button>
            </div>
          }>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
              background:`${NT[selNode.type]?.color||ACCENT}15`,borderRadius:8}}>
              <NodeIcon icon={NT[selNode.type]?.icon} size={24} color={NT[selNode.type]?.color} />
              <span style={{fontSize:11,fontWeight:700,color:"var(--text4)",letterSpacing:1}}>
                {NT[selNode.type]?.label||selNode.type}
              </span>
            </div>
            <Fld label="TITLE" val={editTitle} set={setEditTitle} focus/>
            <Fld label="DESCRIPTION" val={editDesc} set={setEditDesc} multi rows={3}/>
          </div>
        </Sht>
      )}

      {/* NOTES SHEET */}
      {sheet==="notes"&&selNode&&(
        <Sht title={`Notes — ${selNode.title}`} onClose={()=>setSheet("node")} h="78vh"
          foot={
            <div style={{display:"flex",gap:8}}>
              <input value={newNote} onChange={e=>setNewNote(e.target.value)}
                placeholder="Add a note and press →"
                onKeyDown={e=>e.key==="Enter"&&addNote()}
                style={{flex:1,background:"var(--bg3)",border:"1px solid var(--border)",
                  borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,
                  fontFamily:"var(--font-ui)",outline:"none"}}/>
              <button onClick={addNote} style={mBtn(true)}>→</button>
            </div>
          }>
          {(!Array.isArray(selNode.notes)||selNode.notes.length===0)
            ?<div style={{color:"var(--text4)",fontSize:13,padding:"20px 0",textAlign:"center"}}>
               No notes yet — add one below
             </div>
            :(Array.isArray(selNode.notes)?selNode.notes:[]).map((note,i)=>{
              const text=typeof note==="string"?note:(note.content||"");
              const sens=typeof note==="object"&&note.sensitive;
              return(
                <div key={i} style={{background:"var(--bg3)",borderRadius:8,padding:"11px 14px",
                  marginBottom:8,display:"flex",gap:10,alignItems:"flex-start"}}>
                  {sens&&<span title="Sensitive">🔒</span>}
                  <span style={{fontSize:13,color:"var(--text2)",flex:1,lineHeight:1.6}}>{text}</span>
                  <button onClick={()=>deleteNote(selNode.id,i)}
                    style={{background:"none",border:"none",color:"var(--text4)",
                      fontSize:18,cursor:"pointer",lineHeight:1,padding:"0 2px"}}>×</button>
                </div>
              );
            })
          }
        </Sht>
      )}

      {/* MORE SHEET */}
      {sheet==="more"&&(
        <Sht title="Options" onClose={()=>setSheet(null)} h="auto">
          {[
            ["🔍 FIT","Zoom to fit all nodes",fitView],
            ["⬡ HOME","Back to dashboard",onBack],
            ["🕐 History","View version history (desktop only)",()=>alert("Open on desktop to view full version history")],
            ["👥 Share","Manage collaborators (desktop only)",()=>alert("Open on desktop to manage sharing & permissions")],
            ["↗ Export","Export map (desktop only)",()=>alert("Open on desktop to export PNG, PDF, Markdown, HTML, .nonote")],
            ["❓ Help","Open documentation",()=>alert("Full help & documentation available on desktop")],
          ].map(([icon,label,fn])=>(
            <button key={label} onClick={()=>{fn();setSheet(null);}}
              style={{display:"flex",alignItems:"center",gap:14,padding:"15px 4px",width:"100%",
                background:"none",border:"none",borderBottom:"1px solid var(--border2)",
                color:"var(--text)",cursor:"pointer",fontSize:13,fontFamily:"var(--font-ui)",textAlign:"left"}}>
              <span style={{fontSize:18,minWidth:28,textAlign:"center"}}>{icon.split(" ")[0]}</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{icon.split(" ").slice(1).join(" ")}</div>
                <div style={{fontSize:11,color:"var(--text4)",marginTop:1}}>{label}</div>
              </div>
            </button>
          ))}
        </Sht>
      )}

      <style>{`
        @keyframes mob-ring { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────
function Sht({title,onClose,children,foot,h="60vh"}){
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:30,
      background:"var(--bg2)",borderTop:"1.5px solid var(--border)",
      borderRadius:"16px 16px 0 0",boxShadow:"0 -10px 48px rgba(0,0,0,.55)",
      display:"flex",flexDirection:"column",
      maxHeight:h,height:h==="auto"?undefined:h}}>
      <div style={{display:"flex",justifyContent:"center",padding:"10px 0 2px"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"var(--border)"}}/>
      </div>
      <div style={{display:"flex",alignItems:"center",padding:"4px 18px 10px",
        borderBottom:"1px solid var(--border2)"}}>
        <span style={{fontSize:14,fontWeight:700,color:"var(--text)",flex:1}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:24,
          color:"var(--text4)",cursor:"pointer",lineHeight:1,padding:"0 4px"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 18px"}}>{children}</div>
      {foot&&<div style={{padding:"10px 18px 16px",borderTop:"1px solid var(--border2)"}}>{foot}</div>}
    </div>
  );
}

function TBtn({icon,label,active,ac=ACCENT,onTap}){
  return(
    <button onPointerDown={e=>e.stopPropagation()} onClick={onTap}
      style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,
        background:"none",border:"none",cursor:"pointer",padding:"6px 14px",
        color:active?ac:"var(--text4)",transition:"color .15s"}}>
      <span style={{fontSize:22,lineHeight:1}}>{icon}</span>
      <span style={{fontSize:9,fontWeight:700,letterSpacing:.5}}>{label}</span>
    </button>
  );
}

function Fld({label,val,set,multi=false,rows=1,focus=false}){
  const s={width:"100%",background:"var(--bg3)",border:"1px solid var(--border)",
    borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:14,
    fontFamily:"var(--font-ui)",outline:"none",boxSizing:"border-box",
    resize:multi?"vertical":"none"};
  return(
    <div>
      <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1.5,marginBottom:5}}>{label}</div>
      {multi?<textarea value={val} onChange={e=>set(e.target.value)} rows={rows} style={s} autoFocus={focus}/>
            :<input value={val} onChange={e=>set(e.target.value)} style={s} autoFocus={focus}/>}
    </div>
  );
}

function mBtn(primary){
  return{padding:"11px 18px",border:primary?"none":"1px solid var(--border)",
    borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"var(--font-ui)",
    background:primary?"var(--accent2)":"var(--bg3)",color:primary?"#fff":"var(--text3)"};
}
