import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getMap, saveMap, saveVersion } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import LLMChat        from "./LLMChat.jsx";
import ThemePicker    from "./ThemePicker.jsx";
import VersionHistory from "./VersionHistory.jsx";

// ── Node types ────────────────────────────────────────────────
// ── Node type registry ────────────────────────────────────────
const NT = {
  // General
  note:       { label:"Note",          color:"#FFD93D", icon:"📝", cat:"General" },
  heading:    { label:"Heading",       color:"#6C63FF", icon:"📌", cat:"General" },
  user:       { label:"User",          color:"#E91E63", icon:"👤", cat:"General" },
  process:    { label:"Process",       color:"#9C27B0", icon:"🔄", cat:"General" },
  group:      { label:"Group",         color:"#9E9E9E", icon:"📂", cat:"General" },
  decision:   { label:"Decision",      color:"#FF9800", icon:"◆",  cat:"General" },
  annotation: { label:"Annotation",    color:"#78909C", icon:"💬", cat:"General" },
  // Network Infrastructure
  router:     { label:"Router",        color:"#00BCD4", icon:"📡", cat:"Network" },
  switch:     { label:"Switch",        color:"#03A9F4", icon:"🔀", cat:"Network" },
  firewall:   { label:"Firewall",      color:"#FF5722", icon:"🔥", cat:"Network" },
  loadbal:    { label:"Load Balancer", color:"#26C6DA", icon:"⚖️", cat:"Network" },
  vpn:        { label:"VPN Gateway",   color:"#42A5F5", icon:"🔐", cat:"Network" },
  ap:         { label:"Access Point",  color:"#29B6F6", icon:"📶", cat:"Network" },
  modem:      { label:"Modem",         color:"#4DD0E1", icon:"📟", cat:"Network" },
  wanlink:    { label:"WAN Link",      color:"#0288D1", icon:"🌐", cat:"Network" },
  vlan:       { label:"VLAN",          color:"#0097A7", icon:"🔗", cat:"Network" },
  proxy:      { label:"Proxy",         color:"#00838F", icon:"🔁", cat:"Network" },
  // Computers & Workstations
  desktop:    { label:"Desktop PC",    color:"#8D6E63", icon:"🖥️", cat:"Computers" },
  laptop:     { label:"Laptop",        color:"#A1887F", icon:"💻", cat:"Computers" },
  workstation:{ label:"Workstation",   color:"#795548", icon:"🖱️", cat:"Computers" },
  thinclnt:   { label:"Thin Client",   color:"#6D4C41", icon:"📺", cat:"Computers" },
  kiosk:      { label:"Kiosk",         color:"#5D4037", icon:"🏧", cat:"Computers" },
  // Servers
  server:     { label:"Server",        color:"#EF5350", icon:"🗄️", cat:"Servers" },
  webserver:  { label:"Web Server",    color:"#E53935", icon:"🌍", cat:"Servers" },
  appserver:  { label:"App Server",    color:"#F44336", icon:"⚙️", cat:"Servers" },
  dbserver:   { label:"DB Server",     color:"#C62828", icon:"🗃️", cat:"Servers" },
  fileserver: { label:"File Server",   color:"#D32F2F", icon:"📁", cat:"Servers" },
  mailserver: { label:"Mail Server",   color:"#B71C1C", icon:"📧", cat:"Servers" },
  printserver:{ label:"Print Server",  color:"#FF8A80", icon:"🖨️", cat:"Servers" },
  // Storage
  storage:    { label:"Storage",       color:"#607D8B", icon:"💾", cat:"Storage" },
  nas:        { label:"NAS",           color:"#546E7A", icon:"🗄️", cat:"Storage" },
  san:        { label:"SAN",           color:"#455A64", icon:"💿", cat:"Storage" },
  backup:     { label:"Backup",        color:"#78909C", icon:"🔄", cat:"Storage" },
  tape:       { label:"Tape Library",  color:"#90A4AE", icon:"📼", cat:"Storage" },
  // Mobile & IoT
  mobile:     { label:"Mobile/Phone",  color:"#66BB6A", icon:"📱", cat:"Mobile & IoT" },
  tablet:     { label:"Tablet",        color:"#4CAF50", icon:"📋", cat:"Mobile & IoT" },
  rpi:        { label:"Raspberry Pi",  color:"#C62828", icon:"🍓", cat:"Mobile & IoT" },
  arduino:    { label:"Arduino",       color:"#00979D", icon:"🔌", cat:"Mobile & IoT" },
  esp:        { label:"ESP32/8266",    color:"#E65100", icon:"📡", cat:"Mobile & IoT" },
  sensor:     { label:"Sensor",        color:"#26A69A", icon:"📡", cat:"Mobile & IoT" },
  camera:     { label:"IP Camera",     color:"#43A047", icon:"📷", cat:"Mobile & IoT" },
  plc:        { label:"PLC",           color:"#2E7D32", icon:"🏭", cat:"Mobile & IoT" },
  gateway:    { label:"IoT Gateway",   color:"#388E3C", icon:"🔀", cat:"Mobile & IoT" },
  hvac:       { label:"HVAC",          color:"#1B5E20", icon:"❄️", cat:"Mobile & IoT" },
  // Cloud
  cloud:      { label:"Cloud",         color:"#29B6F6", icon:"☁️", cat:"Cloud" },
  lambda:     { label:"Function",      color:"#FF9100", icon:"λ",  cat:"Cloud" },
  queue:      { label:"Queue",         color:"#AB47BC", icon:"↔",  cat:"Cloud" },
  cdn:        { label:"CDN",           color:"#26A69A", icon:"🕸️", cat:"Cloud" },
  s3:         { label:"Object Store",  color:"#FF6D00", icon:"🪣", cat:"Cloud" },
  k8s:        { label:"Kubernetes",    color:"#326CE5", icon:"⎈",  cat:"Cloud" },
  container:  { label:"Container",     color:"#2496ED", icon:"📦", cat:"Cloud" },
  apigateway: { label:"API Gateway",   color:"#A100FF", icon:"🔌", cat:"Cloud" },
  // Software & Services
  software:   { label:"Software",      color:"#4CAF50", icon:"📦", cat:"Software" },
  api:        { label:"API",           color:"#009688", icon:"🔌", cat:"Software" },
  database:   { label:"Database",      color:"#3F51B5", icon:"🗃️", cat:"Software" },
  service:    { label:"Service",       color:"#8BC34A", icon:"⚡", cat:"Software" },
  microservice:{ label:"Microservice", color:"#66BB6A", icon:"🧩", cat:"Software" },
  cache:      { label:"Cache",         color:"#FF7043", icon:"⚡", cat:"Software" },
  broker:     { label:"Msg Broker",    color:"#7B1FA2", icon:"📨", cat:"Software" },
  // Security
  ids:        { label:"IDS/IPS",       color:"#F44336", icon:"🛡️", cat:"Security" },
  waf:        { label:"WAF",           color:"#E53935", icon:"🧱", cat:"Security" },
  vault:      { label:"Vault/HSM",     color:"#B00020", icon:"🔒", cat:"Security" },
  siem:       { label:"SIEM",          color:"#C62828", icon:"🔍", cat:"Security" },
  dlp:        { label:"DLP",           color:"#D50000", icon:"🚫", cat:"Security" },
};

// ── Default properties per node type ──────────────────────────
const DP = {
  note:{Content:""},
  heading:{Level:"H1",Subtitle:""},
  user:{Role:"",Email:"",Team:""},
  process:{Step:"",Input:"",Output:""},
  group:{Description:""},
  decision:{Condition:"",Yes:"",No:""},
  annotation:{Reference:""},
  // Network
  router:{Make:"",Model:"",Gateway:"",Protocol:"BGP",Firmware:""},
  switch:{Make:"",Model:"",Ports:"24",VLAN:"",Layer:"L2"},
  firewall:{Make:"",Model:"",Rules:"",Zone:"",OS:""},
  loadbal:{Make:"",Model:"",Algorithm:"Round Robin",VIP:""},
  vpn:{Protocol:"IPSec",Endpoint:"",Peer:"",Tunnel:""},
  ap:{Make:"",Model:"",SSID:"",Band:"2.4GHz/5GHz",Channel:""},
  modem:{Make:"",Model:"",ISP:"",Type:"Cable"},
  wanlink:{Provider:"",Speed:"",Type:"MPLS",Redundant:"No"},
  vlan:{ID:"",Name:"",Subnet:"",Tagged:""},
  proxy:{Type:"Forward",IP:"",Port:"3128",Auth:""},
  // Computers
  desktop:{Make:"",Model:"",OS:"Windows 11",CPU:"",RAM:"",IP:""},
  laptop:{Make:"",Model:"",OS:"",CPU:"",RAM:"",User:""},
  workstation:{Make:"",Model:"",OS:"",CPU:"",RAM:"",GPU:""},
  thinclnt:{Make:"",Model:"",OS:"",Server:""},
  kiosk:{Make:"",OS:"",Location:"",App:""},
  // Servers
  server:{Make:"",Model:"",OS:"",CPU:"",RAM:"",Role:"",IP:""},
  webserver:{Software:"Nginx",Version:"",Port:"443",SSL:"Yes"},
  appserver:{Runtime:"",Version:"",Port:"",Instances:""},
  dbserver:{Engine:"PostgreSQL",Version:"",Port:"5432",RAM:""},
  fileserver:{OS:"",Shares:"",Storage:"",Protocol:"SMB"},
  mailserver:{Software:"",Domain:"",TLS:"Yes",Spam:""},
  printserver:{Make:"",Model:"",Queue:"",Protocol:"IPP"},
  // Storage
  storage:{Capacity:"",Type:"SSD",RAID:"",Interface:""},
  nas:{Make:"",Model:"",Capacity:"",RAID:"",Shares:""},
  san:{Make:"",Model:"",Capacity:"",FC:"",Protocol:"iSCSI"},
  backup:{Software:"",Schedule:"",Retention:"",Target:""},
  tape:{Make:"",Model:"",Capacity:"",Library:""},
  // Mobile & IoT
  mobile:{Make:"",Model:"",OS:"",User:"",MDM:""},
  tablet:{Make:"",Model:"",OS:"",User:""},
  rpi:{Model:"Pi 4B",OS:"Raspberry Pi OS",RAM:"4GB",Role:""},
  arduino:{Model:"Uno",Firmware:"",Sensors:"",Protocol:""},
  esp:{Model:"ESP32",Firmware:"",WiFi:"",Protocol:"MQTT"},
  sensor:{Type:"",Protocol:"MQTT",Location:"",Unit:""},
  camera:{Make:"",Model:"",Resolution:"",Protocol:"RTSP",IP:""},
  plc:{Make:"",Model:"",Protocol:"Modbus",IO:""},
  gateway:{Make:"",Model:"",Protocol:"",Upstream:""},
  hvac:{Make:"",Model:"",Zone:"",Protocol:"BACnet"},
  // Cloud
  cloud:{Provider:"AWS",Region:"",Service:"",Account:""},
  lambda:{Runtime:"Node.js 20",Trigger:"",Memory:"256MB",Timeout:"30s"},
  queue:{Type:"SQS",MaxSize:"",DLQ:"",Delay:""},
  cdn:{Provider:"CloudFront",Origin:"",TTL:"3600",Geo:""},
  s3:{Provider:"AWS",Bucket:"",Region:"",Access:"Private"},
  k8s:{Cluster:"",Namespace:"",Replicas:"",Version:""},
  container:{Image:"",Tag:"latest",Port:"",Registry:""},
  apigateway:{Provider:"AWS",Stage:"",Auth:"",Throttle:""},
  // Software
  software:{Version:"",License:"",Port:"",Platform:""},
  api:{Endpoint:"",Method:"REST",Auth:"Bearer",Version:"v1"},
  database:{Engine:"PostgreSQL",Port:"5432",Schema:"",HA:""},
  service:{URL:"",Status:"Running",Port:"",SLA:""},
  microservice:{Language:"",Port:"",Version:"",Replicas:""},
  cache:{Type:"Redis",Port:"6379",MaxMem:"",Eviction:"LRU"},
  broker:{Type:"Kafka",Port:"9092",Topics:"",Retention:"7d"},
  // Security
  ids:{Make:"",Model:"",Mode:"Inline",Ruleset:"Snort"},
  waf:{Provider:"",Mode:"Block",Rules:"OWASP",SSL:"Yes"},
  vault:{Type:"HashiCorp Vault",Auth:"",Secrets:"",HA:""},
  siem:{Software:"",Sources:"",Retention:"90d",Alerts:""},
  dlp:{Provider:"",Mode:"",Channels:"",Policy:""},
};

// sidebar category order
const SIDEBAR_CATS = ["General","Network","Computers","Servers","Storage","Mobile & IoT","Cloud","Software","Security"];

// ── Edge style definitions ────────────────────────────────────
const EDGE_STYLES = {
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
};

// Sections order for the panel
const EDGE_SECTIONS = ["Basic","Dashed","Dotted","Bold","Double","Special"];

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
  try {
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
    const maxH = layer.length ? Math.max(...layer.map(id => nodeH(nodeById(id)))) : DEF_H;
    y += maxH + V_PAD;
  });

  const fallbackY = y;
  let result = nodes.map((n, i) => ({
    ...n,
    ...(posMap[n.id] || { x: START_X + (i % 4) * (DEF_W + 80), y: fallbackY + Math.floor(i / 4) * (DEF_H + 80) }),
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
  } catch(err) {
    console.error("[autoLayout] crash:", err);
    return nodes; // return unchanged on any error
  }
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

// ── Anchor system ────────────────────────────────────────────
// anchor: { side: "top"|"bottom"|"left"|"right"|"auto", t: 0-1 }
// t=0.5 is midpoint of that side. "auto" means compute from direction.
function anchorToPoint(node, nw, nh, anchor) {
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
function snapToAnchor(node, nw, nh, cx, cy) {
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

// ── PNG export ────────────────────────────────────────────────────
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
  const [edgeColor,    setEdgeColor]    = useState("var(--accent)");
  const [showConnPanel,setShowConnPanel]= useState(false);
  const [draggingMid,  setDraggingMid]  = useState(null); // {edgeId, startX, startY, origOffset}
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
        properties:n.properties||{},customProps:n.custom_props||{},
      }));
      const es=data.edges.map(e=>({
        id:e.id,from:e.from_node,to:e.to_node,
        label:e.label,style:e.style,color:e.color,
        fromAnchor:e.from_anchor||null,
        toAnchor:e.to_anchor||null,
        midOff:e.mid_off||null,
      }));
      setNodes(ns); setEdges(es); pushHistory(ns,es);
    }).catch(err=>{ console.error('[NodeCanvas] load error:', err); }).finally(()=>setLoading(false));
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
          const toNode=nodes.find(n=>n.id===id);
          const tnw=collW(toNode), tnh=collH(toNode);
          const el=canvasRef.current;
          const rect=el.getBoundingClientRect(); const s=1/zoom;
          const clickX=(e.clientX-rect.left)*s+el.scrollLeft*s;
          const clickY=(e.clientY-rect.top)*s+el.scrollTop*s;
          const toAnchor=snapToAnchor(toNode,tnw,tnh,clickX,clickY) || {side:"auto"};
          applyEdges(es=>[...es,{
            id:makeId(), from:drawingEdge.fromId, to:id, label:"", style:edgeStyle, color:edgeColor,
            fromAnchor:drawingEdge.fromAnchor||{side:"auto"},
            toAnchor,
          }]);
        }
        setDrawingEdge(null);
      } else {
        const node=nodes.find(n=>n.id===id);
        const nw=collW(node), nh=collH(node);
        // Compute click position in canvas space
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const clickX=(e.clientX-rect.left)*s+el.scrollLeft*s;
        const clickY=(e.clientY-rect.top)*s+el.scrollTop*s;
        // Snap to border anchor if near an edge, else auto
        const anchor=snapToAnchor(node,nw,nh,clickX,clickY) || {side:"auto"};
        const startPt = anchor.side!=="auto"
          ? anchorToPoint(node,nw,nh,anchor)
          : {x:node.x+nw/2, y:node.y+nh/2};
        setDrawingEdge({fromId:id,mouseX:startPt.x,mouseY:startPt.y,fromAnchor:anchor});
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
    const mappedE=es.map(e=>({id:e.id,from:e.from_node||e.from,to:e.to_node||e.to,label:e.label||"",style:e.style||"arrow",color:e.color||"var(--accent)",fromAnchor:e.from_anchor||e.fromAnchor||null,toAnchor:e.to_anchor||e.toAnchor||null}));
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
  const getEdgePath=(fromNode,toNode,edge={})=>{
    const fw=collW(fromNode), fh=collH(fromNode);
    const tw=collW(toNode),   th=collH(toNode);
    const fcx=fromNode.x+fw/2, fcy=fromNode.y+fh/2;
    const tcx=toNode.x+tw/2,   tcy=toNode.y+th/2;

    // Use manual anchor if set, else auto-compute from direction
    const faceNormal=(pt,node,nw,nh)=>{
      const eps=2;
      if(Math.abs(pt.y-node.y)<eps)      return {dx:0,dy:-1};
      if(Math.abs(pt.y-(node.y+nh))<eps) return {dx:0,dy:1};
      if(Math.abs(pt.x-node.x)<eps)      return {dx:-1,dy:0};
      return {dx:1,dy:0};
    };

    let fp, fn1;
    const fa=edge.fromAnchor;
    if(fa && fa.side && fa.side!=="auto"){
      const a=anchorToPoint(fromNode,fw,fh,fa);
      if(a){ fp=a; fn1=a.normal; }
    }
    if(!fp){
      fp=rectEdgePoint(fromNode,fw,fh,tcx,tcy);
      fn1=faceNormal(fp,fromNode,fw,fh);
    }

    let tp, fn2;
    const ta=edge.toAnchor;
    if(ta && ta.side && ta.side!=="auto"){
      const a=anchorToPoint(toNode,tw,th,ta);
      if(a){ tp=a; fn2=a.normal; }
    }
    if(!tp){
      tp=rectEdgePoint(toNode,tw,th,fcx,fcy);
      fn2=faceNormal(tp,toNode,tw,th);
    }

    const dist=Math.sqrt((tp.x-fp.x)**2+(tp.y-fp.y)**2);
    const ctrl=Math.max(60, dist*0.4);
    let c1x=fp.x+fn1.dx*ctrl, c1y=fp.y+fn1.dy*ctrl;
    let c2x=tp.x+fn2.dx*ctrl, c2y=tp.y+fn2.dy*ctrl;

    // Apply manual midpoint offset if set (pulls the bezier curve)
    if(edge.midOff){
      const mx=(fp.x+tp.x)/2+edge.midOff.dx;
      const my=(fp.y+tp.y)/2+edge.midOff.dy;
      c1x=fp.x*0.3+mx*0.7; c1y=fp.y*0.3+my*0.7;
      c2x=tp.x*0.3+mx*0.7; c2y=tp.y*0.3+my*0.7;
    }

    // Midpoint on the bezier at t=0.5 (for handle placement)
    const midX=0.125*(fp.x+tp.x) + 0.375*(c1x+c2x);
    const midY=0.125*(fp.y+tp.y) + 0.375*(c1y+c2y);
    return {path:`M ${fp.x} ${fp.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tp.x} ${tp.y}`, fp, tp, mid:{x:midX,y:midY}};
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
  const cats=useMemo(()=>SIDEBAR_CATS.filter(c=>Object.values(NT).some(t=>t.cat===c)),[]);
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
          {mode==="connect"&&(<>
            {/* Connection style button → opens floating panel */}
            <button onClick={()=>setShowConnPanel(v=>!v)}
              style={{...tbtn(showConnPanel,"#6C63FF"),display:"flex",alignItems:"center",gap:5,padding:"5px 10px"}}>
              <span style={{fontSize:14}}>{EDGE_STYLES[edgeStyle]?.icon||"→"}</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>{EDGE_STYLES[edgeStyle]?.label}</span>
              <span style={{fontSize:9,color:"var(--text4)"}}>▾</span>
            </button>
            {/* Color swatch */}
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:edgeColor==="var(--accent)"?"var(--accent)":edgeColor,border:"2px solid var(--border)",cursor:"pointer",overflow:"hidden"}}
                title="Edge color">
                <input type="color" defaultValue="#58a6ff"
                  onChange={e=>setEdgeColor(e.target.value)}
                  style={{opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",padding:0}}/>
              </div>
            </div>
            <button onClick={()=>setEdgeColor("var(--accent)")} title="Reset color"
              style={{...tbtn(false),fontSize:9,padding:"3px 6px",color:"var(--text4)"}}>↺</button>
            {drawingEdge&&<span style={{fontSize:11,color:"#f78166",padding:"0 5px",animation:"pulse 1s infinite",flexShrink:0}}>● click target</span>}
          </>)}
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
        {!isMobile&&<NodeSidebar cats={cats} addNode={addNode} canEdit={canEdit&&editMode}/>}

        {/* Mobile sidebar */}
        {isMobile&&showSidebar&&(
          <div style={{position:"absolute",inset:0,zIndex:50,display:"flex"}}>
            <div style={{flex:1,background:"rgba(0,0,0,.6)"}} onClick={()=>setShowSidebar(false)}/>
            <div style={{width:220,background:"var(--bg2)",borderLeft:"1px solid var(--border)",overflow:"auto",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"12px 14px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:"var(--accent)"}}>Add Node</span>
                <button onClick={()=>setShowSidebar(false)} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20}}>×</button>
              </div>
              <NodeSidebar cats={cats} addNode={addNode} canEdit={canEdit&&editMode} inline/>
            </div>
          </div>
        )}

        {/* ── Connection Style Panel (floating) ── */}
        {/* ── Connection Style Panel (floating) ── */}
        {showConnPanel&&mode==="connect"&&(
          <div style={{
            position:"fixed",top:56,left:"50%",transform:"translateX(-50%)",
            background:"var(--bg2)",border:"1px solid var(--border2)",
            borderRadius:"var(--radius-lg)",zIndex:300,
            boxShadow:"0 12px 40px rgba(0,0,0,.55)",
            width:580,maxWidth:"96vw",maxHeight:"80vh",overflow:"auto",
          }} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:"var(--text)",flex:1}}>⤳ Connection Style</span>
              <button onClick={()=>setShowConnPanel(false)}
                style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20,lineHeight:1,padding:"0 4px"}}>×</button>
            </div>

            {/* Sections */}
            {EDGE_SECTIONS.map(section=>{
              const sectionStyles=Object.entries(EDGE_STYLES).filter(([,d])=>d.section===section);
              return(
                <div key={section} style={{padding:"10px 14px"}}>
                  <div style={{fontSize:9,fontWeight:700,color:"var(--text4)",letterSpacing:2,marginBottom:8}}>
                    {section.toUpperCase()}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                    {sectionStyles.map(([k,def])=>{
                      const sel=edgeStyle===k;
                      const ec=sel?"var(--accent)":"var(--text3)";
                      const sw=def.strokeW>2?3.5:1.8;
                      const da=def.dash==="none"?undefined:def.dash;
                      return(
                        <button key={k} onClick={()=>setEdgeStyle(k)}
                          style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",
                            borderRadius:"var(--radius-md)",cursor:"pointer",textAlign:"left",
                            border:`1.5px solid ${sel?"var(--accent)":"var(--border)"}`,
                            background:sel?"color-mix(in srgb,var(--accent) 12%,transparent)":"var(--bg3)",
                            transition:"all .12s",outline:"none"}}>
                          {/* Inline SVG preview */}
                          <svg width="48" height="20" viewBox="0 0 48 20" style={{flexShrink:0}}>
                            <defs>
                              <marker id={`p-e-${k}`} markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                                <polygon points="0 0,6 2.5,0 5" fill={ec}/>
                              </marker>
                              <marker id={`p-s-${k}`} markerWidth="6" markerHeight="5" refX="0" refY="2.5" orient="auto-start-reverse">
                                <polygon points="0 0,6 2.5,0 5" fill={ec}/>
                              </marker>
                            </defs>
                            {def.wave?(
                              <path d="M 4 10 Q 16 2 24 10 Q 32 18 44 10"
                                stroke={ec} strokeWidth={sw} fill="none"
                                markerEnd={def.mEnd?`url(#p-e-${k})`:undefined}
                                markerStart={def.mStart?`url(#p-s-${k})`:undefined}/>
                            ):(
                              <line x1="4" y1="10" x2="44" y2="10"
                                stroke={ec} strokeWidth={sw}
                                strokeDasharray={da}
                                markerEnd={def.mEnd?`url(#p-e-${k})`:undefined}
                                markerStart={def.mStart?`url(#p-s-${k})`:undefined}/>
                            )}
                          </svg>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:11,fontWeight:600,color:sel?"var(--accent)":"var(--text)",
                              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{def.label}</div>
                            <div style={{fontSize:9,color:"var(--text4)",marginTop:1}}>{def.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Color strip */}
            <div style={{padding:"10px 16px",borderTop:"1px solid var(--border2)",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:1,marginRight:4}}>COLOR</span>
              {["var(--accent)","#58a6ff","#f78166","#3fb950","#d2a8ff","#ffa657","#ff7b72","#39d353","#8b949e","#ff6ec7"].map(c=>(
                <div key={c} onClick={()=>setEdgeColor(c)} title={c}
                  style={{width:20,height:20,borderRadius:"50%",flexShrink:0,cursor:"pointer",
                    background:c==="var(--accent)"?"var(--accent)":c,
                    boxShadow:edgeColor===c?"0 0 0 2.5px var(--bg2), 0 0 0 4px var(--text)":"none",
                    transform:edgeColor===c?"scale(1.2)":"scale(1)",transition:"transform .1s,box-shadow .1s"}}/>
              ))}
              {/* Custom */}
              <div style={{position:"relative",width:20,height:20,borderRadius:"50%",overflow:"hidden",
                background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
                border:"1px solid var(--border)",cursor:"pointer",flexShrink:0}} title="Custom">
                <input type="color" onChange={e=>setEdgeColor(e.target.value)}
                  style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/>
              </div>
              <button onClick={()=>setEdgeColor("var(--accent)")}
                style={{marginLeft:"auto",background:"none",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",
                  color:"var(--text4)",cursor:"pointer",fontSize:10,padding:"3px 10px",fontFamily:"var(--font-ui)"}}>Reset</button>
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
                  {/* Standard filled arrow — end tip */}
                  <marker id="nn-arr" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">
                    <polygon points="0 0, 10 4, 0 8" fill="var(--accent)"/>
                  </marker>
                  {/* Bold filled arrow — end tip */}
                  <marker id="nn-tk"  markerWidth="8"  markerHeight="7" refX="8"  refY="3.5" orient="auto" markerUnits="strokeWidth">
                    <polygon points="0 0, 8 3.5, 0 7" fill="var(--accent)"/>
                  </marker>
                  {/* Double chevron — end tip */}
                  <marker id="nn-dbl" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto" markerUnits="strokeWidth">
                    <polyline points="0 1, 5 4, 0 7"  fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                    <polyline points="4 1, 9 4, 4 7"  fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                  </marker>
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
                    stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="6,4" opacity=".9" markerEnd="url(#nn-arr)"/>;
                })()}

                {/* Edges */}
                {edges.map(edge=>{
                  const f=nodes.find(n=>n.id===edge.from),t=nodes.find(n=>n.id===edge.to);
                  if(!f||!t) return null;
                  const result=getEdgePath(f,t,edge); const {path,fp,tp}=result;
                  const mid=result.mid||{x:(fp.x+tp.x)/2,y:(fp.y+tp.y)/2};
                  const isSel=selEdge===edge.id;
                  return (
                    <g key={edge.id} style={{cursor:"pointer",pointerEvents:"all"}} onClick={e=>handleEdgeClick(e,edge.id)}>
                      <path d={path} stroke="transparent" strokeWidth="14" fill="none"/>
                      {(()=>{
                        const def=EDGE_STYLES[edge.style]||EDGE_STYLES.arrow;
                        const ec=isSel?"var(--danger)":(edge.color||"var(--accent)");
                        const sw=isSel?3:def.strokeW;
                        const da=def.dash==="none"?"none":def.dash;
                        const mEnd=def.mEnd?`url(#${def.mEnd})`:undefined;
                        // Bidirectional: use auto-start-reverse trick — same marker at start
                        const mStart=def.mStart?`url(#${def.mStart})`:undefined;
                        // Wave style: generate wavy path via extra control points
                        const usePath = def.wave ? (() => {
                          const dx=tp.x-fp.x, dy=tp.y-fp.y;
                          const len=Math.sqrt(dx*dx+dy*dy)||1;
                          const px=-dy/len*18, py=dx/len*18; // perpendicular offset
                          const thirds=4;
                          let d=`M ${fp.x} ${fp.y}`;
                          for(let i=1;i<=thirds;i++){
                            const t1=(i*2-1)/(thirds*2), t2=i/thirds;
                            const sign=(i%2===1?1:-1);
                            d+=` Q ${fp.x+dx*t1+px*sign} ${fp.y+dy*t1+py*sign}, ${fp.x+dx*t2} ${fp.y+dy*t2}`;
                          }
                          return d;
                        })() : path;
                        return(
                          <path d={usePath} stroke={ec} strokeWidth={sw} fill="none" opacity={isSel?1:.92}
                            strokeDasharray={da}
                            markerEnd={mEnd}
                            markerStart={mStart}
                          />
                        );
                      })()}
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
                      {/* Midpoint drag handle — shown on every edge (diamond shape) */}
                      {canEdit&&(()=>{
                        const isThisEdgeSel=isSel;
                        const onMidDown=(ev)=>{
                          ev.stopPropagation();
                          const origOff=edge.midOff||{dx:0,dy:0};
                          const startX=ev.clientX, startY=ev.clientY;
                          const onMove=(mv)=>{
                            const el=canvasRef.current; if(!el) return;
                            const s=1/zoom;
                            const ddx=(mv.clientX-startX)*s, ddy=(mv.clientY-startY)*s;
                            applyEdges(es=>es.map(ex=>ex.id!==edge.id?ex:{...ex,midOff:{dx:origOff.dx+ddx,dy:origOff.dy+ddy}}));
                          };
                          const onUp=()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
                          window.addEventListener("mousemove",onMove);
                          window.addEventListener("mouseup",onUp);
                        };
                        // Only show on hover (via opacity) or always when selected
                        return(
                          <g style={{cursor:"grab",pointerEvents:"all"}} onMouseDown={onMidDown}
                             opacity={isThisEdgeSel?1:0} className="nn-mid-handle">
                            <circle cx={mid.x} cy={mid.y} r="10" fill="transparent"/>
                            <rect x={mid.x-5} y={mid.y-5} width="10" height="10" rx="2"
                              fill="var(--bg2)" stroke={edge.color||"var(--accent)"} strokeWidth="1.5"
                              transform={`rotate(45,${mid.x},${mid.y})`}/>
                            {/* Reset midpoint on dbl-click */}
                            <circle cx={mid.x} cy={mid.y} r="10" fill="transparent"
                              onDoubleClick={ev=>{ev.stopPropagation();applyEdges(es=>es.map(ex=>ex.id!==edge.id?ex:{...ex,midOff:null}));}}/>
                          </g>
                        );
                      })()}

                      {/* Draggable endpoint handles — shown on selected edge */}
                      {isSel&&canEdit&&(()=>{
                        const handleDrag=(isFrom)=>(ev)=>{
                          ev.stopPropagation();
                          const onMove=(mv)=>{
                            if(!canvasRef.current) return;
                            const el=canvasRef.current;
                            const rect=el.getBoundingClientRect(); const s=1/zoom;
                            const cx=(mv.clientX-rect.left)*s+el.scrollLeft*s;
                            const cy=(mv.clientY-rect.top)*s+el.scrollTop*s;
                            const hoveredNode=nodesRef.current.find(n=>{
                              const nw=collW(n),nh=collH(n);
                              return cx>=n.x&&cx<=n.x+nw&&cy>=n.y&&cy<=n.y+nh;
                            });
                            if(hoveredNode){
                              const nw=collW(hoveredNode),nh=collH(hoveredNode);
                              const newAnchor=snapToAnchor(hoveredNode,nw,nh,cx,cy)||{side:"auto"};
                              applyEdges(es=>es.map(ex=>ex.id!==edge.id?ex:{
                                ...ex,
                                ...(isFrom?{from:hoveredNode.id,fromAnchor:newAnchor}:{to:hoveredNode.id,toAnchor:newAnchor}),
                              }));
                            }
                          };
                          const onUp=()=>{ window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp); };
                          window.addEventListener("mousemove",onMove);
                          window.addEventListener("mouseup",onUp);
                        };
                        return (<>
                          <circle cx={fp.x} cy={fp.y} r="7" fill="var(--success)" stroke="var(--bg2)" strokeWidth="2.5"
                            style={{cursor:"grab",pointerEvents:"all"}} title="Drag to reattach source"
                            onMouseDown={handleDrag(true)}/>
                          <circle cx={tp.x} cy={tp.y} r="7" fill="var(--accent)" stroke="var(--bg2)" strokeWidth="2.5"
                            style={{cursor:"grab",pointerEvents:"all"}} title="Drag to reattach target"
                            onMouseDown={handleDrag(false)}/>
                        </>);
                      })()}
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

                    {/* Anchor dots — multiple per side in connect mode */}
                    {mode==="connect"&&canEdit&&!isCollapsed&&(()=>{
                      const nw2=collW(node), nh2=collH(node);
                      // Generate N anchor points per side based on node size
                      // More points on longer sides
                      const hCount = Math.max(3, Math.min(7, Math.floor(nw2/60))); // horizontal sides
                      const vCount = Math.max(3, Math.min(7, Math.floor(nh2/50))); // vertical sides
                      const anchors=[];
                      // Top & Bottom: hCount points evenly spaced
                      for(let i=0;i<hCount;i++){
                        const t=(i+1)/(hCount+1);
                        anchors.push({side:"top",    t, ax:node.x+nw2*t, ay:node.y,       key:`top-${i}`});
                        anchors.push({side:"bottom", t, ax:node.x+nw2*t, ay:node.y+nh2,   key:`bot-${i}`});
                      }
                      // Left & Right: vCount points evenly spaced
                      for(let i=0;i<vCount;i++){
                        const t=(i+1)/(vCount+1);
                        anchors.push({side:"left",   t, ax:node.x,       ay:node.y+nh2*t, key:`lft-${i}`});
                        anchors.push({side:"right",  t, ax:node.x+nw2,   ay:node.y+nh2*t, key:`rgt-${i}`});
                      }
                      // Corners too
                      anchors.push({side:"top",    t:0,   ax:node.x,      ay:node.y,      key:"tl"});
                      anchors.push({side:"top",    t:1,   ax:node.x+nw2,  ay:node.y,      key:"tr"});
                      anchors.push({side:"bottom", t:0,   ax:node.x,      ay:node.y+nh2,  key:"bl"});
                      anchors.push({side:"bottom", t:1,   ax:node.x+nw2,  ay:node.y+nh2,  key:"br"});

                      const DOT=8; // dot radius
                      return anchors.map(a=>(
                        <div key={a.key}
                          onMouseDown={e=>e.stopPropagation()}
                          onClick={e=>{
                            e.stopPropagation();
                            if(drawingEdge){
                              if(drawingEdge.fromId!==node.id){
                                applyEdges(es=>[...es,{
                                  id:makeId(),from:drawingEdge.fromId,to:node.id,
                                  label:"",style:edgeStyle,color:edgeColor,
                                  fromAnchor:drawingEdge.fromAnchor||{side:"auto"},
                                  toAnchor:{side:a.side,t:a.t},
                                }]);
                              }
                              setDrawingEdge(null);
                            } else {
                              setDrawingEdge({fromId:node.id,mouseX:a.ax,mouseY:a.ay,fromAnchor:{side:a.side,t:a.t}});
                            }
                          }}
                          style={{
                            position:"absolute",
                            left:a.ax-node.x-DOT, top:a.ay-node.y-DOT,
                            width:DOT*2, height:DOT*2, borderRadius:"50%",
                            background:drawingEdge?"var(--success)":"var(--accent)",
                            border:"2px solid var(--bg2)",
                            cursor:"crosshair", zIndex:30,
                            boxShadow:`0 0 5px var(--accent)`,
                            transition:"transform .1s, opacity .1s",
                            opacity:0.85,
                          }}
                          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.5)";e.currentTarget.style.opacity="1";}}
                          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.opacity="0.85";}}
                        />
                      ));
                    })()}

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
        g:hover .nn-mid-handle { opacity: 1 !important; }
        .nn-mid-handle { transition: opacity .15s; }
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
function NodeSidebar({cats,addNode,canEdit,inline}){
  const [search, setSearch]       = useState("");
  const [collapsed, setCollapsed] = useState({});

  const toggle = cat => setCollapsed(p=>({...p,[cat]:!p[cat]}));

  const q = search.trim().toLowerCase();
  // Filter: by search or show all
  const filtered = Object.entries(NT).filter(([,t])=>{
    if(!q) return true;
    return t.label.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q);
  });

  // Group filtered items by category (preserve SIDEBAR_CATS order)
  const groups = {};
  filtered.forEach(([k,t])=>{
    if(!groups[t.cat]) groups[t.cat]=[];
    groups[t.cat].push([k,t]);
  });
  const visibleCats = SIDEBAR_CATS.filter(c=>groups[c]?.length);

  return(
    <div style={inline?{display:"flex",flexDirection:"column",height:"100%"}:{width:"var(--sidebar-w)",background:"var(--bg2)",borderRight:"1px solid var(--border2)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>

      {/* Header */}
      {!inline&&(
        <div style={{padding:"10px 12px 8px",borderBottom:"1px solid var(--border2)"}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,marginBottom:8}}>NODE LIBRARY</div>
          {/* Search */}
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"var(--text4)",pointerEvents:"none"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search nodes…"
              style={{width:"100%",boxSizing:"border-box",paddingLeft:28,paddingRight:8,paddingTop:5,paddingBottom:5,
                background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",
                color:"var(--text)",fontSize:11,fontFamily:"var(--font-ui)",outline:"none"}}/>
            {search&&<span onClick={()=>setSearch("")}
              style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"var(--text4)",cursor:"pointer"}}>×</span>}
          </div>
        </div>
      )}

      {/* Inline search for mobile */}
      {inline&&(
        <div style={{padding:"8px 10px",borderBottom:"1px solid var(--border2)",position:"relative"}}>
          <span style={{position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"var(--text4)"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            style={{width:"100%",boxSizing:"border-box",paddingLeft:26,paddingRight:6,paddingTop:4,paddingBottom:4,
              background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",
              color:"var(--text)",fontSize:11,fontFamily:"var(--font-ui)",outline:"none"}}/>
        </div>
      )}

      {/* Categories + nodes */}
      <div style={{flex:1,overflow:"auto"}}>
        {visibleCats.length===0&&(
          <div style={{padding:"20px 14px",color:"var(--text4)",fontSize:12,textAlign:"center"}}>
            No nodes match "{search}"
          </div>
        )}
        {visibleCats.map(cat=>{
          const items=groups[cat]||[];
          const isCollapsed=collapsed[cat]&&!q; // always expand during search
          return(
            <div key={cat}>
              {/* Category header */}
              <div onClick={()=>toggle(cat)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",
                  cursor:"pointer",background:"var(--bg3)",borderBottom:"1px solid var(--border2)",
                  borderTop:"1px solid var(--border2)",userSelect:"none",
                  position:"sticky",top:0,zIndex:1}}>
                <span style={{fontSize:9,fontWeight:700,color:"var(--text4)",letterSpacing:2,flex:1}}>
                  {cat.toUpperCase()}
                </span>
                <span style={{fontSize:10,color:"var(--text4)",marginRight:4}}>{items.length}</span>
                <span style={{fontSize:10,color:"var(--text4)",transition:"transform .2s",
                  display:"inline-block",transform:isCollapsed?"rotate(-90deg)":"rotate(0deg)"}}>▾</span>
              </div>
              {/* Node items */}
              {!isCollapsed&&items.map(([key,t])=>(
                <div key={key} onClick={()=>canEdit&&addNode(key)} title={t.label}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",
                    cursor:canEdit?"pointer":"default",fontSize:12,
                    borderLeft:"3px solid transparent",transition:"background .12s,border-color .12s"}}
                  onMouseEnter={e=>{if(canEdit){e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.borderLeftColor=t.color;}}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}>
                  <span style={{fontSize:15,width:20,textAlign:"center",flexShrink:0}}>{t.icon}</span>
                  <span style={{color:"var(--text2)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>
                  <span style={{width:6,height:6,borderRadius:"50%",background:t.color,flexShrink:0}}/>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {!canEdit&&<div style={{padding:"8px 14px",fontSize:10,color:"var(--text4)",borderTop:"1px solid var(--border2)"}}>View only</div>}
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
          {Object.entries(node.properties||{}).map(([k,v])=>(
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
