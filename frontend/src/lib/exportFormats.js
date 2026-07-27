import { NT, COL_W, COL_H } from "./nodeTypes.js";
import { rectEdgePoint } from "./edgeRouting.js";

// Text fallback for canvas/export contexts (icon can be a Lucide component
// or a string emoji — see NodeIcon in components/canvas/NodeIcon.jsx for the
// on-screen JSX equivalent).
export function iconChar(icon) {
  if (!icon) return "□";
  if (typeof icon === "string") return icon;
  return "◉"; // generic fallback for SVG icons in canvas context
}

// ── Secret redaction for every export path ─────────────────────────
// `_integration` holds a live API token, and `_integration_cache` is the raw,
// unfiltered API response from that integration — for Proxmox/TrueNAS this
// includes disk serials, internal hostnames, VM/container inventories, and
// other infrastructure internals that were never meant to leave the app.
// Every export (.nonote file, Copy for AI, Word/PDF) must go through this —
// this is the ONE canonical copy; DocExportModal.jsx and utils/llmExport.js
// used to each keep their own duplicate of this regex, which meant a future
// edit to the pattern (e.g. adding a new secret-like key) could silently
// diverge between the three export paths and reopen the exact leak this was
// written to close. Both now import it from here instead.
export const SECRET_KEY_RE = /^_integration|token|password|secret|api[_-]?key/i;
export function sanitizeProperties(props) {
  if (!props) return props;
  const out = {};
  Object.entries(props).forEach(([k, v]) => {
    if (SECRET_KEY_RE.test(k)) return;
    out[k] = v;
  });
  return out;
}
function sanitizeNodesForExport(nodes) {
  return nodes.map(n => ({ ...n, properties: sanitizeProperties(n.properties) }));
}

// ── .nonote (JSON) export ────────────────────────────────────────────────
export function exportAsNoNote(nodes, edges, mapMeta) {
  const bundle = {
    version: 1,
    app: "NoNote",
    title: mapMeta?.title || "Untitled",
    exported: new Date().toISOString(),
    nodes: sanitizeNodesForExport(nodes).map(n => ({...n, notes: Array.isArray(n.notes) ? n.notes : []})),
    edges,
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(mapMeta?.title||"map").replace(/[^a-z0-9]/gi,"-")}.nonote`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Consistent colour per userId (deterministic)
const USER_COLORS = ["#f97316","#06b6d4","#a855f7","#22c55e","#f59e0b","#ef4444","#3b82f6","#ec4899"];
export function userColor(userId) {
  if (!userId) return USER_COLORS[0];
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return USER_COLORS[h % USER_COLORS.length];
}

export function exportAsPDF(nodes, edges, mapTitle) {
  if(!nodes.length){ alert("No nodes to export."); return; }
  // Build same HTML as visual export, open print-optimised version
  const PAD=60;
  const minX=Math.min(...nodes.map(n=>n.x))-PAD;
  const minY=Math.min(...nodes.map(n=>n.y))-PAD;
  const maxX=Math.max(...nodes.map(n=>n.x+(n.w||220)))+PAD;
  const maxY=Math.max(...nodes.map(n=>n.y+(n.h||96)))+PAD;
  const W=maxX-minX, H=maxY-minY;

  const svgEdges = edges.map(e=>{
    const fn=nodes.find(n=>n.id===e.from), tn=nodes.find(n=>n.id===e.to);
    if(!fn||!tn) return "";
    const fcx=fn.x-minX+(fn.w||220)/2, fcy=fn.y-minY+(fn.h||96)/2;
    const tcx=tn.x-minX+(tn.w||220)/2, tcy=tn.y-minY+(tn.h||96)/2;
    const ctrl=Math.max(50,Math.sqrt((tcx-fcx)**2+(tcy-fcy)**2)*0.4);
    const dx=tcx-fcx,dy=tcy-fcy,d=Math.sqrt(dx*dx+dy*dy)||1;
    return `<path d="M ${fcx} ${fcy} C ${fcx+dx/d*ctrl} ${fcy+dy/d*ctrl}, ${tcx-dx/d*ctrl} ${tcy-dy/d*ctrl}, ${tcx} ${tcy}" stroke="#4d9be6" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>`;
  }).join("");

  const nodeHtml = nodes.map(n=>{
    const t=NT[n.type]||NT.note;
    const notes=(Array.isArray(n.notes)?n.notes:[]).filter(nt=>!nt.sensitive);
    return `<div class="nn-node" style="left:${n.x-minX}px;top:${n.y-minY}px;width:${n.w||220}px;min-height:${n.h||96}px;border-color:${t.color}65">
      <div class="nn-hdr" style="background:${t.color}15;border-bottom:1px solid ${t.color}28;padding:7px 10px 4px">
        <b style="font-size:13px">${iconChar(t.icon)} ${n.title||""}</b>
        ${n.description?`<div style="font-size:10px;color:#666;margin-top:2px">${n.description}</div>`:""}
        <div style="font-size:8px;text-align:right;color:${t.color};opacity:.7;margin-top:1px">${t.label}</div>
      </div>
      ${notes.length?`<div style="padding:6px 10px;font-size:10px">${notes.map(nt=>`<div><b style="color:${t.color}">${nt.title||"Note"}</b><div>${(nt.content||"").replace(/<[^>]+>/g," ")}</div></div>`).join("")}</div>`:""}
    </div>`;
  }).join("");

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${mapTitle||"NoNote"}</title>
<style>
  @page{size:${Math.ceil(W*0.75+40)}px ${Math.ceil(H*0.75+80)}px;margin:20px}
  body{margin:0;background:#fff;font-family:Arial,sans-serif}
  .canvas{position:relative;width:${W}px;height:${H}px;transform:scale(0.75);transform-origin:top left}
  .nn-node{position:absolute;background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;overflow:hidden;font-size:12px}
  svg{position:absolute;inset:0;pointer-events:none}
</style></head><body>
<h2 style="margin:0 0 10px;font-size:14px;color:#333">${mapTitle||"NoNote Map"} — ${new Date().toLocaleDateString()}</h2>
<div class="canvas">
  <svg width="${W}" height="${H}"><defs><marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#4d9be6"/></marker></defs>${svgEdges}</svg>
  ${nodeHtml}
</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`;

  const w=window.open("","_blank","width=800,height=600");
  if(w){ w.document.write(html); w.document.close(); }
  else alert("Allow popups to use PDF export.");
}

export function exportAsHTML(nodes, edges, mapTitle) {
  if(!nodes.length){ alert("No nodes to export."); return; }
  const PAD=60;
  const minX=Math.min(...nodes.map(n=>n.x))-PAD;
  const minY=Math.min(...nodes.map(n=>n.y))-PAD;
  const maxX=Math.max(...nodes.map(n=>n.x+(n.w||220)))+PAD;
  const maxY=Math.max(...nodes.map(n=>n.y+(n.h||96)))+PAD;
  const W=maxX-minX, H=maxY-minY;

  const nodeHtml = nodes.map(n=>{
    const t=NT[n.type]||NT.note;
    const notes=(Array.isArray(n.notes)?n.notes:[]).filter(nt=>!nt.sensitive);
    return `<div class="nn-node" style="left:${n.x-minX}px;top:${n.y-minY}px;width:${n.w||220}px;min-height:${n.h||96}px;border-color:${t.color}65;">
      <div class="nn-header" style="background:${t.color}1a;border-bottom-color:${t.color}28">
        <span class="nn-icon">${iconChar(t.icon)}</span>
        <span class="nn-title">${n.title||""}</span>
        ${n.description?`<div class="nn-desc">${n.description}</div>`:""}
        <span class="nn-type" style="color:${t.color}80">${t.label}</span>
      </div>
      ${notes.length?`<div class="nn-notes">${notes.map(nt=>`<div class="nn-note"><div class="nn-note-title">${nt.title||"Note"}</div><div class="nn-note-content">${nt.content||""}</div></div>`).join("")}</div>`:""}
    </div>`;
  }).join("");

  // Build edge SVG paths
  const svgEdges = edges.map(e=>{
    const fn=nodes.find(n=>n.id===e.from), tn=nodes.find(n=>n.id===e.to);
    if(!fn||!tn) return "";
    const fcx=fn.x-minX+(fn.w||220)/2, fcy=fn.y-minY+(fn.h||96)/2;
    const tcx=tn.x-minX+(tn.w||220)/2, tcy=tn.y-minY+(tn.h||96)/2;
    const ctrl=Math.max(50,Math.sqrt((tcx-fcx)**2+(tcy-fcy)**2)*0.4);
    const dx=tcx-fcx, dy=tcy-fcy;
    const d=Math.sqrt(dx*dx+dy*dy)||1;
    const nx=dx/d, ny=dy/d;
    const c1x=fcx+nx*ctrl, c1y=fcy+ny*ctrl;
    const c2x=tcx-nx*ctrl, c2y=tcy-ny*ctrl;
    return `<path d="M ${fcx} ${fcy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tcx} ${tcy}" stroke="#4d9be6" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>`;
  }).join("");

  const html=`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${mapTitle||"NoNote Map"}</title>
<style>
  body{margin:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
  .canvas{position:relative;width:${W}px;height:${H}px;margin:20px auto;}
  .nn-node{position:absolute;background:#161b22;border:1px solid #30363d;border-radius:8px;overflow:hidden;}
  .nn-header{padding:8px 10px 5px;}
  .nn-icon{font-size:13px;margin-right:6px;}
  .nn-title{font-size:13px;font-weight:700;color:#e6edf3;}
  .nn-desc{font-size:10px;color:#7d8590;margin-top:2px;}
  .nn-type{font-size:8px;opacity:.7;display:block;text-align:right;margin-top:2px;}
  .nn-notes{padding:6px 10px;border-top:1px solid #21262d;}
  .nn-note{margin-bottom:6px;}
  .nn-note-title{font-size:10px;font-weight:600;color:#58a6ff;}
  .nn-note-content{font-size:10px;color:#7d8590;margin-top:2px;}
  svg.edges{position:absolute;inset:0;pointer-events:none;}
</style></head>
<body><div class="canvas">
  <svg class="edges" width="${W}" height="${H}">
    <defs><marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#4d9be6"/></marker></defs>
    ${svgEdges}
  </svg>
  ${nodeHtml}
</div></body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`${(mapTitle||"map").replace(/[^a-z0-9]/gi,"-")}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportAsDoc(nodes, mapTitle) {
  // Plain-text documentation export (Simple mode — no LLM)
  const lines=[`# ${mapTitle||"NoNote Map"}`,`*Exported: ${new Date().toLocaleDateString()}*`,""];
  nodes.forEach(n=>{
    const t=NT[n.type]||NT.note;
    lines.push(`## ${iconChar(t.icon)} ${n.title||"Untitled"} (${t.label})`);
    if(n.description) lines.push(`*${n.description}*`);
    const notes=(Array.isArray(n.notes)?n.notes:[]).filter(nt=>!nt.sensitive);
    if(notes.length){
      lines.push("### Notes");
      notes.forEach(nt=>{
        lines.push(`**${nt.title||"Note"}**`);
        lines.push((nt.content||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());
      });
    }
    lines.push("");
  });
  const blob=new Blob([lines.join("\n")],{type:"text/markdown"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`${(mapTitle||"map").replace(/[^a-z0-9]/gi,"-")}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function exportAsPNG(nodes, edges, mapTitle) {
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
      ctx.fillText(iconChar(t.icon),nx+nw/2,ny+nw/2-8);
      ctx.font=`bold 10px monospace`;ctx.fillStyle=t.color;
      ctx.fillText(node.title.slice(0,10),nx+nw/2,ny+nh-10);
    } else {
      const hH=34;ctx.fillStyle=`${t.color}22`;ctx.beginPath();
      ctx.roundRect(nx,ny,nw,hH,[r,r,0,0]);ctx.fill();
      ctx.font="14px serif";ctx.textBaseline="middle";ctx.fillText(iconChar(t.icon),nx+10,ny+hH/2);
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
