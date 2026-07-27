import { useState } from "react";
import { NT, SIDEBAR_CATS } from "../../lib/nodeTypes.js";
import NodeIcon from "./NodeIcon.jsx";

// ── Node Sidebar ──────────────────────────────────────────────
// Modes: full (178px) → compact (136px icons+labels) → icons (48px) → full
export default function NodeSidebar({cats,addNode,canEdit,inline,collapsed,onToggleCollapse,iconOnly,onToggleIconOnly,dense,onToggleDense,onCycleMode,recentTypes=[]}){
  const [search, setSearch]   = useState("");
  const [catOpen, setCatOpen] = useState({});
  const [tooltip, setTooltip] = useState(null);

  const toggle = cat => setCatOpen(p=>({...p,[cat]:!(p[cat]===undefined?true:p[cat])}));
  const q = search.trim().toLowerCase();

  const filtered = Object.entries(NT).filter(([,t])=>
    !q || t.label.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q)
  );
  const groups = {};
  filtered.forEach(([k,t])=>{ if(!groups[t.cat]) groups[t.cat]=[]; groups[t.cat].push([k,t]); });
  const visibleCats = SIDEBAR_CATS.filter(c=>groups[c]?.length);

  const COMPACT_W = 136;
  const ICON_W    = 48;
  const FULL_W    = 178;

  const sideW = iconOnly ? ICON_W : dense ? COMPACT_W : FULL_W;

  // ── Collapsed bar ────────────────────────────────────────────
  if(collapsed){
    return(
      <div style={{width:28,flexShrink:0,background:"var(--bg2)",borderRight:"1px solid var(--border2)",
        display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8,gap:6,overflow:"hidden"}}>
        <button onClick={onToggleCollapse}
          style={{background:"none",borderRadius:"var(--radius-sm)",
            color:"var(--text4)",cursor:"pointer",fontSize:13,width:20,height:20,display:"flex",
            alignItems:"center",justifyContent:"center",lineHeight:1}}>›</button>
        <div style={{writingMode:"vertical-rl",fontSize:9,fontWeight:700,color:"var(--text4)",
          letterSpacing:2,marginTop:8,userSelect:"none",opacity:.6}}>NODES</div>
      </div>
    );
  }

  return(
    <div style={{width:sideW,flexShrink:0,background:"var(--bg2)",
      borderRight:"1px solid var(--border2)",display:"flex",flexDirection:"column",
      overflow:"hidden",transition:"width .18s",position:"relative"}}>

      {/* ── Header ── */}
      <div style={{padding:"6px 8px 5px",borderBottom:"1px solid var(--border2)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:4}}>
          {!iconOnly&&<span style={{fontSize:9,fontWeight:700,color:"var(--text4)",letterSpacing:.5,flex:1,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>
            {dense?"NODES":"NODES"}
          </span>}
          {iconOnly&&<div style={{flex:1}}/>}
          {/* Mode cycle button */}
          <button onClick={onCycleMode}
            title={iconOnly?"Switch to full mode":dense?"Switch to icons only":"Switch to compact mode"}
            style={{background:"none",borderRadius:"var(--radius-xs)",
              color:dense||iconOnly?"var(--accent)":"var(--text4)",cursor:"pointer",fontSize:8,
              padding:"1px 4px",height:15,display:"flex",alignItems:"center",
              lineHeight:1,flexShrink:0,whiteSpace:"nowrap",gap:2}}>
            {iconOnly?"⊞ Full":dense?"⊡ Icons":"⊟ Compact"}
          </button>
          <button onClick={onToggleCollapse} title="Collapse"
            style={{background:"none",borderRadius:"var(--radius-xs)",
              color:"var(--text4)",cursor:"pointer",fontSize:10,width:15,height:15,
              display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,flexShrink:0}}>‹</button>
        </div>

        {/* Search — visible in all modes */}
        {!iconOnly?(
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",
              fontSize:10,color:"var(--text4)",pointerEvents:"none"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={dense?"Search…":"Search types…"}
              style={{width:"100%",boxSizing:"border-box",paddingLeft:20,paddingRight:search?18:5,
                paddingTop:3,paddingBottom:3,background:"var(--bg3)",
                borderRadius:"var(--radius-sm)",color:"var(--text)",fontSize:dense?9:11,
                fontFamily:"var(--font-ui)",outline:"none"}}/>
            {search&&<span onClick={()=>setSearch("")}
              style={{position:"absolute",right:5,top:"50%",transform:"translateY(-50%)",
                fontSize:11,color:"var(--text4)",cursor:"pointer"}}>×</span>}
          </div>
        ):(
          <button onClick={onCycleMode} title="Switch to full view to search"
            style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",
              fontSize:11,width:"100%",display:"flex",justifyContent:"center",paddingTop:2}}>🔍</button>
        )}
      </div>

      {/* ── Node list ── */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}} onMouseLeave={()=>setTooltip(null)}>
        {visibleCats.length===0&&q&&(
          <div style={{padding:"16px 10px",color:"var(--text4)",fontSize:10,textAlign:"center"}}>
            No nodes match "{search}"
          </div>
        )}

        {/* ── Recently used — your real working set, one click away ── */}
        {!q&&recentTypes.length>0&&(
          <div>
            <div style={{display:"flex",alignItems:"center",padding:iconOnly?"4px 0":"4px 8px",
              background:"var(--bg3)",borderBottom:"1px solid var(--border2)",gap:3}}>
              {!iconOnly&&<span style={{fontSize:8,fontWeight:700,color:"var(--accent)",letterSpacing:1.5,flex:1}}>RECENT</span>}
              {iconOnly&&<div style={{width:"100%",height:2,background:"var(--accent)44",margin:"0 4px",borderRadius:1}}/>}
            </div>
            <div style={{display:iconOnly||dense?"flex":"block",flexWrap:"wrap",padding:iconOnly?"3px 2px":dense?"3px 4px":0}}>
              {recentTypes.filter(k=>NT[k]).map(k=>{
                const t=NT[k], Ic=t.icon;
                return(
                  <div key={"rc-"+k} onClick={()=>canEdit&&addNode(k)}
                    title={t.label}
                    style={{display:"flex",alignItems:"center",gap:6,cursor:canEdit?"pointer":"default",
                      padding:iconOnly?"4px":dense?"3px 4px":"4px 10px",opacity:canEdit?1:.4,
                      borderRadius:"var(--radius-xs)"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{color:t.color,display:"flex",flexShrink:0}}>{(typeof Ic==="function"||typeof Ic==="object")?<Ic size={dense||iconOnly?13:14}/>:<NodeIcon icon={t.icon} size={14} color={t.color}/>}</span>
                    {!iconOnly&&!dense&&<span style={{fontSize:10,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visibleCats.map(cat=>{
          const items=groups[cat]||[];
          const isOpen=catOpen[cat]===undefined?true:catOpen[cat];
          const showOpen=q?true:isOpen;

          return(
            <div key={cat}>
              {/* Category header — always shown in all modes */}
              <div onClick={()=>toggle(cat)}
                style={{display:"flex",alignItems:"center",padding:iconOnly?"4px 0":"4px 8px",
                  cursor:"pointer",background:"var(--bg3)",
                  borderBottom:"1px solid var(--border2)",borderTop:"1px solid var(--border2)",
                  userSelect:"none",position:"sticky",top:0,zIndex:1,gap:3}}>
                {!iconOnly&&(
                  <>
                    <span style={{fontSize:8,fontWeight:700,color:"var(--text4)",letterSpacing:dense?0.5:1.5,flex:1,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {dense?cat.slice(0,8).toUpperCase():cat.toUpperCase()}
                    </span>
                    <span style={{fontSize:8,color:"var(--text4)",opacity:.7}}>{items.length}</span>
                    <span style={{fontSize:8,color:"var(--text4)",transition:"transform .15s",display:"inline-block",
                      transform:showOpen?"rotate(0deg)":"rotate(-90deg)"}}>▾</span>
                  </>
                )}
                {iconOnly&&<div style={{width:"100%",height:2,background:"var(--border2)",margin:"0 4px",borderRadius:1}}/>}
              </div>

              {/* Items */}
              {showOpen&&(
                iconOnly||dense?(
                  // Compact / icon grid — CSS grid auto-fills to eliminate trailing gap
                  <div style={{display:"grid",
                    gridTemplateColumns:dense?"repeat(auto-fill,minmax(30px,1fr))":"repeat(auto-fill,minmax(36px,1fr))",
                    gap:dense?2:3,padding:dense?"3px 4px":"3px 2px"}}>
                    {items.map(([key,t])=>(
                      <div key={key}
                        onClick={()=>canEdit&&addNode(key)}
                        onMouseEnter={e=>{
                          const r=e.currentTarget.getBoundingClientRect();
                          setTooltip({key,label:t.label,color:t.color,x:r.right+6,y:r.top+r.height/2});
                        }}
                        onMouseLeave={()=>setTooltip(null)}
                        title={t.label}
                        style={{aspectRatio:"1",borderRadius:5,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:dense?15:18,cursor:canEdit?"pointer":"default",
                          transition:"background .1s,border-color .1s",
                          border:"1.5px solid transparent"}}
                        onMouseOver={e=>{
                          e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)";
                          e.currentTarget.style.borderColor=t.color+"70";
                        }}
                        onMouseOut={e=>{
                          e.currentTarget.style.boxShadow="";
                          e.currentTarget.style.borderColor="transparent";
                        }}>
                        <NodeIcon icon={t.icon} size={16} color={t.color} />
                      </div>
                    ))}
                  </div>
                ):(
                  // Full label list
                  items.map(([key,t])=>(
                    <div key={key} onClick={()=>canEdit&&addNode(key)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",
                        cursor:canEdit?"pointer":"default",
                        borderLeft:"3px solid transparent",transition:"background .1s,border-color .1s"}}
                      onMouseEnter={e=>{if(canEdit){e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)";e.currentTarget.style.borderLeftColor=t.color;}}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.borderLeftColor="transparent";}}>
                      <NodeIcon icon={t.icon} size={15} color={t.color} />
                      <span style={{color:"var(--text2)",flex:1,overflow:"hidden",textOverflow:"ellipsis",
                        whiteSpace:"nowrap",fontSize:11}}>{t.label}</span>
                      <span style={{width:5,height:5,borderRadius:"50%",background:t.color,flexShrink:0}}/>
                    </div>
                  ))
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip for icon/compact modes */}
      {(iconOnly||dense)&&tooltip&&(
        <div style={{position:"fixed",left:tooltip.x,top:tooltip.y-14,zIndex:999,
          background:"var(--bg2)",
          borderRadius:"var(--radius-sm)",padding:"3px 9px",fontSize:11,
          fontWeight:700,color:tooltip.color,
          boxShadow:"var(--nEs,4px 4px 9px var(--neu-shadow),-3px -3px 6px var(--neu-hilight))",pointerEvents:"none",whiteSpace:"nowrap"}}>
          {tooltip.label}
        </div>
      )}

      {!canEdit&&!iconOnly&&(
        <div style={{padding:"5px 10px",fontSize:9,color:"var(--text4)",borderTop:"1px solid var(--border2)"}}>
          View only
        </div>
      )}
    </div>
  );
}
