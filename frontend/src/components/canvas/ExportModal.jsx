import { useState } from "react";
import { exportAsPNG } from "../../lib/exportFormats.js";



// ── Export Modal ──────────────────────────────────────────────
export default function ExportModal({nodes,edges,mapTitle,exportLLM,onClose}){
  const [tab,setTab]=useState("llm");
  const [copied,setCopied]=useState(false);
  const content=tab==="llm"?exportLLM():JSON.stringify({title:mapTitle,nodes,edges},null,2);
  const copy=()=>{navigator.clipboard.writeText(content);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const tbS=(active)=>({padding:"8px 16px",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"var(--font-ui)",background:"var(--bg)",color:active?"var(--text)":"var(--text3)",boxShadow:active?"inset 2px 2px 6px var(--neu-shadow),inset -1px -1px 4px var(--neu-hilight)":"2px 2px 4px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)",transition:"all .14s"});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.76)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={onClose}>
      <div style={{background:"var(--bg2)",borderRadius:"var(--radius-lg)",padding:20,width:"100%",maxWidth:600,maxHeight:"84vh",display:"flex",flexDirection:"column",gap:14}} onClick={e=>e.stopPropagation()}>
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
        {tab==="llm"&&<div style={{fontSize:12,color:"var(--text3)",background:"var(--bg3)",borderRadius:"var(--radius-sm)",padding:"8px 12px",lineHeight:1.6}}>Grouped by category · Arrows as sentences · Paste into any LLM</div>}
        <pre style={{background:"var(--bg)",borderRadius:"var(--radius-md)",padding:16,fontSize:12,overflow:"auto",flex:1,margin:0,color:"var(--text)",lineHeight:1.65,whiteSpace:"pre-wrap"}}>{content}</pre>
      </div>
    </div>
  );
}
