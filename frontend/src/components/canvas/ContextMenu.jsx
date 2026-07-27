import { NT } from "../../lib/nodeTypes.js";
import NodeIcon from "./NodeIcon.jsx";

// ── Context Menu ─────────────────────────────────────────────────
export default function ContextMenu({x,y,nodeId,nodes,selected,edges,canEdit,onClose,
  onDuplicate,onDelete,onCollapse,onConnect,onEditTitle,onSelectAll,onProps}){
  const node=nodes.find(n=>n.id===nodeId);
  if(!node) return null;
  const t=NT[node.type]||NT.note;
  const connCount=edges.filter(e=>e.from===nodeId||e.to===nodeId).length;
  const isMulti=selected.size>1&&selected.has(nodeId);

  // Clamp to viewport
  const menuW=196, menuH=320;
  const vw=window.innerWidth, vh=window.innerHeight;
  const left=Math.min(x+220, vw-menuW-8)-220; // approx canvas offset
  const top=Math.min(y+48, vh-menuH-8)-48;

  const Item=({icon,label,sub,onClick,danger,disabled})=>(
    <div onClick={disabled?undefined:()=>{onClick();onClose();}}
      style={{display:"flex",alignItems:"center",gap:9,padding:"7px 13px",cursor:disabled?"default":"pointer",
        opacity:disabled?.4:1,transition:"background .1s",
        color:danger?"var(--danger)":"var(--text)"}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)";}}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
      <NodeIcon icon={icon} size={14} />
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:600}}>{label}</div>
        {sub&&<div style={{fontSize:9,color:danger?"var(--danger)":"var(--text4)",marginTop:1}}>{sub}</div>}
      </div>
    </div>
  );

  const Sep=()=><div style={{height:1,background:"var(--border2)",margin:"3px 0"}}/>;

  return(
    <div style={{
      position:"absolute",left:x,top:y,zIndex:601,
      background:"var(--bg2)",
      borderRadius:"var(--radius-md)",boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
      width:menuW,overflow:"hidden",userSelect:"none",
    }} onClick={e=>e.stopPropagation()}>
      {/* Header */}
      <div style={{padding:"8px 13px",borderBottom:"1px solid var(--border2)",background:"var(--bg3)",
        display:"flex",alignItems:"center",gap:7}}>
        <NodeIcon icon={t.icon} size={15} color={t.color} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:700,color:t.color,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node.title}</div>
          <div style={{fontSize:9,color:"var(--text4)"}}>{t.label}{connCount>0?` · ${connCount} connections`:""}</div>
        </div>
      </div>

      {canEdit&&<>
        <Item icon="✏" label="Edit title" sub="Double-click" onClick={onEditTitle}/>
        <Item icon="⤳" label="Connect from here" sub="C key" onClick={onConnect}/>
        <Sep/>
        <Item icon="⧉" label={isMulti?`Duplicate ${selected.size} nodes`:"Duplicate"} sub="Ctrl+D" onClick={onDuplicate}/>
        <Item icon={node.collapsed?"⊞":"⊟"} label={node.collapsed?"Expand":"Collapse"} onClick={onCollapse}/>
        <Item icon="✏" label="Properties" onClick={onProps}/>
        <Sep/>
        <Item icon="◻" label="Select all" sub="Ctrl+A" onClick={onSelectAll}/>
        <Sep/>
        <Item icon="🗑" label={isMulti?`Delete ${selected.size} nodes`:"Delete node"} sub="Del"
          danger onClick={onDelete}/>
      </>}
      {!canEdit&&(
        <div style={{padding:"10px 13px",fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>View-only mode</div>
      )}
    </div>
  );
}
