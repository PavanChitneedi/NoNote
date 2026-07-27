import { useState } from "react";
import { COL_W, COL_H } from "../../lib/nodeTypes.js";
import { stripHtml } from "../../lib/notesFormat.js";
import NodeIcon from "./NodeIcon.jsx";

// ── Collapsed Node ────────────────────────────────────────────
export default function CollapsedNode({node,t,isSel,canEdit,mode,onMouseDown,onTouchStart,onClick,onContextMenu,onToggleCollapse}){
  const [hovered,setHovered]=useState(false);
  const propEntries=Object.entries(node.properties||{}).filter(([,v])=>v).slice(0,4);
  return (
    <div
      className="nn-node"
      onMouseDown={onMouseDown} onTouchStart={onTouchStart} onClick={onClick} onContextMenu={onContextMenu}
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
      <NodeIcon icon={t.icon} size={28} color={t.color} />
      {/* Name */}
      <span style={{fontSize:10,fontWeight:700,color:t.color,textAlign:"center",lineHeight:1.2,padding:"0 4px",maxWidth:COL_W-8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {node.title}
      </span>
      {/* ⊞ Expand icon — top-right of collapsed node */}
      {canEdit&&(
        <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onToggleCollapse(e);}}
          title="Expand node (⊞)"
          style={{position:"absolute",top:2,right:2,background:"none",borderRadius:3,color:t.color,cursor:"pointer",fontSize:11,width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
          ⊞
        </button>
      )}
      {/* Status dots: notes (blue), properties (green), connections — injected via prop */}
      <div style={{position:"absolute",bottom:3,left:0,right:0,display:"flex",justifyContent:"center",gap:3,pointerEvents:"none"}}>
        {(Array.isArray(node.notes)?node.notes:[]).length>0&&<div title="Has notes" style={{width:5,height:5,borderRadius:"50%",background:"var(--accent)",opacity:.9}}/>}
        {Object.values(node.properties||{}).some(v=>v)&&<div title="Has properties" style={{width:5,height:5,borderRadius:"50%",background:"var(--success)",opacity:.9}}/>}
        {Object.keys(node.customProps||{}).length>0&&<div title="Has custom fields" style={{width:5,height:5,borderRadius:"50%",background:"#d2a8ff",opacity:.9}}/>}
      </div>

      {/* Hover tooltip */}
      {hovered&&(propEntries.length>0||node.notes)&&(
        <div style={{
          position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",
          background:"var(--bg2)",borderRadius:"var(--radius-md)",
          padding:"10px 12px",minWidth:180,maxWidth:260,
          boxShadow:"0 8px 28px var(--shadow)",zIndex:100,
          pointerEvents:"none",
        }}>
          <div style={{fontSize:12,fontWeight:700,color:t.color,marginBottom:6}}><NodeIcon icon={t.icon} size={16} color={t.color} /> {node.title}</div>
          {propEntries.map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:6,fontSize:11,marginBottom:2}}>
              <span style={{color:"var(--text4)",flexShrink:0}}>{k}:</span>
              <span style={{color:"var(--text2)"}}>{String(v).slice(0,30)}</span>
            </div>
          ))}
{(Array.isArray(node.notes)?node.notes:[]).filter(nt=>!nt.sensitive).slice(0,2).map(nt=>(
            <div key={nt.id} style={{fontSize:10,color:"var(--text3)",marginTop:4,fontStyle:"italic",borderTop:"1px solid var(--border2)",paddingTop:4}}>
              {nt.title&&<span style={{fontWeight:700,marginRight:4}}>{nt.title}:</span>}{stripHtml(nt.content).slice(0,80)}
            </div>
          ))}
          <div style={{fontSize:9,color:"var(--text4)",marginTop:5,textAlign:"right"}}>Click for full details</div>
        </div>
      )}
    </div>
  );
}
