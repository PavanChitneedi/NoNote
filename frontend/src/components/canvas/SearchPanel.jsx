import { useState, useRef, useEffect } from "react";
import NodeIcon from "./NodeIcon.jsx";

// NOTE: this component is currently unreferenced anywhere in the app (confirmed via
// repo-wide grep before this Phase 2 extraction) — moved verbatim, behavior unchanged.
// ── Search Panel ──────────────────────────────────────────────
export default function SearchPanel({query,setQuery,field,setField,results,onSelect,onClose,nodes,edges}){
  const inputRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),50); },[]);
  useEffect(()=>{ setActiveIdx(0); },[results]);

  const handleKey=(e)=>{
    if(e.key==="ArrowDown"){e.preventDefault();setActiveIdx(i=>Math.min(i+1,results.length-1));}
    if(e.key==="ArrowUp")  {e.preventDefault();setActiveIdx(i=>Math.max(i-1,0));}
    if(e.key==="Enter"&&results[activeIdx]){e.preventDefault();onSelect(results[activeIdx]);}
    if(e.key==="Escape"){onClose();}
  };

  const Hl=({text,q})=>{
    if(!q||!text) return <span>{text}</span>;
    const low=String(text).toLowerCase(), ql=q.toLowerCase();
    const idx=low.indexOf(ql); if(idx<0) return <span>{text}</span>;
    return <span>{String(text).slice(0,idx)}<mark style={{background:"var(--accent2)",color:"#fff",borderRadius:2,padding:"0 1px"}}>{String(text).slice(idx,idx+q.length)}</mark>{String(text).slice(idx+q.length)}</span>;
  };

  const FIELDS=[{id:"all",label:"All"},{id:"title",label:"Title"},{id:"notes",label:"Notes"},{id:"props",label:"Properties"},{id:"type",label:"Type"}];
  const totalMatches=results.reduce((s,r)=>s+r.hits.length,0);

  return(
    <div style={{width:340,background:"var(--bg2)",borderRight:"1px solid var(--border2)",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>

      {/* Search input */}
      <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{fontSize:13,color:"var(--text4)"}}>🔍</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder="Search nodes, notes, properties…"
            style={{flex:1,background:"var(--bg3)",border:"1px solid var(--accent)",borderRadius:"var(--radius-sm)",
              padding:"6px 10px",color:"var(--text)",fontSize:12,fontFamily:"var(--font-ui)",outline:"none"}}/>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:18,lineHeight:1,flexShrink:0}}>×</button>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {FIELDS.map(f=>(
            <button key={f.id} onClick={()=>setField(f.id)}
              style={{padding:"2px 8px",border:"none",borderRadius:"var(--radius-xs)",cursor:"pointer",
                fontSize:10,fontWeight:700,fontFamily:"var(--font-ui)",
                background:field===f.id?"var(--accent2)":"var(--bg3)",
                color:field===f.id?"#fff":"var(--text4)"}}>
              {f.label}
            </button>
          ))}
        </div>
        {query.trim()&&(
          <div style={{marginTop:6,fontSize:10,color:"var(--text4)"}}>
            {results.length===0?"No matches":`${results.length} node${results.length!==1?"s":""} · ${totalMatches} match${totalMatches!==1?"es":""}`}
            {results.length>0&&<span style={{marginLeft:6}}>↑↓ navigate · Enter jump</span>}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{flex:1,overflow:"auto"}}>
        {!query.trim()&&(
          <div style={{padding:"20px 14px",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:8}}>🔍</div>
            <div style={{fontSize:12,color:"var(--text3)",marginBottom:14}}>Search across all your nodes</div>
            {[["Title","Node names"],["Notes","Free-text content"],["Properties","Make, Model, IP, OS…"],["Type","Router, Server, Note…"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:8,fontSize:11,padding:"5px 8px",background:"var(--bg3)",borderRadius:"var(--radius-sm)",marginBottom:4,textAlign:"left"}}>
                <span style={{color:"var(--accent)",fontWeight:700,minWidth:70}}>{k}</span>
                <span style={{color:"var(--text3)"}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:12,fontSize:10,color:"var(--text4)"}}>Ctrl+F to open · ESC to close</div>
          </div>
        )}

        {query.trim()&&results.length===0&&(
          <div style={{padding:"30px 14px",textAlign:"center",color:"var(--text4)"}}>
            <div style={{fontSize:28,marginBottom:8}}>🔎</div>
            <div style={{fontSize:12}}>No results for "{query}"</div>
            <div style={{fontSize:10,marginTop:6}}>Try different terms or change field filter</div>
          </div>
        )}

        {results.map((r,i)=>{
          const isActive=i===activeIdx; const t=r.t;
          const connCount=edges.filter(e=>e.from===r.node.id||e.to===r.node.id).length;
          return(
            <div key={r.node.id} onClick={()=>{setActiveIdx(i);onSelect(r);}}
              style={{padding:"10px 12px",borderBottom:"1px solid var(--border2)",cursor:"pointer",
                background:isActive?"var(--bg3)":"transparent",
                borderLeft:`3px solid ${isActive?t.color:"transparent"}`,transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="";}}>

              {/* Node title row */}
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <NodeIcon icon={t.icon} size={14} color={t.color} />
                <span style={{fontSize:12,fontWeight:700,color:t.color,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  <Hl text={r.node.title} q={query}/>
                </span>
                <span style={{fontSize:9,color:"var(--text4)",background:"var(--bg)",padding:"1px 5px",borderRadius:3,border:"1px solid var(--border)",flexShrink:0}}>{t.label}</span>
              </div>

              {/* Match snippets */}
              {r.hits.slice(0,4).map((hit,j)=>(
                <div key={j} style={{display:"flex",gap:6,fontSize:10,lineHeight:1.45,marginBottom:2}}>
                  <span style={{color:"var(--accent2)",flexShrink:0,fontWeight:700,minWidth:56,fontSize:9,letterSpacing:.5,paddingTop:1}}>{hit.field.toUpperCase()}</span>
                  <span style={{color:"var(--text3)",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                    <Hl text={hit.snippet} q={query}/>
                  </span>
                </div>
              ))}
              {r.hits.length>4&&<div style={{fontSize:9,color:"var(--text4)",marginTop:1}}>+{r.hits.length-4} more</div>}

              {/* Footer meta */}
              <div style={{marginTop:4,display:"flex",gap:8,fontSize:9,color:"var(--text4)"}}>
                <span>x:{Math.round(r.node.x)} y:{Math.round(r.node.y)}</span>
                {connCount>0&&<span>· {connCount} connection{connCount!==1?"s":""}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {results.length>0&&query.trim()&&(
        <div style={{padding:"6px 12px",borderTop:"1px solid var(--border2)",display:"flex",gap:10,fontSize:9,color:"var(--text4)"}}>
          <span>↑↓ Navigate</span><span>↵ Jump to node</span><span>ESC Close</span>
        </div>
      )}
    </div>
  );
}
