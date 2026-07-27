import { useRef } from "react";
import { NT } from "../../lib/nodeTypes.js";
import NodeIcon from "./NodeIcon.jsx";

// ── Comments Panel ─────────────────────────────────────────────────
export default function CommentsPanel({comments,nodes,commentNode,setCommentNode,draft,setDraft,user,onAdd,onDelete,onScrollTo}){
  const inputRef=useRef(null);
  // Build list: if commentNode set, show only that node's comments; else all
  const entries=commentNode
    ? [{nodeId:commentNode,list:comments[commentNode]||[]}]
    : nodes.filter(n=>(comments[n.id]||[]).length>0).map(n=>({nodeId:n.id,list:comments[n.id]||[]}));

  const addComment=()=>{
    const t=draft.trim(); if(!t||!commentNode) return;
    onAdd(commentNode,t);
  };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Thread list */}
      <div style={{flex:1,overflow:"auto",padding:"8px 12px",display:"flex",flexDirection:"column",gap:10}}>
        {entries.length===0&&(
          <div style={{padding:"20px 0",textAlign:"center",color:"var(--text4)"}}>
            <div style={{fontSize:24,marginBottom:8}}>🗨</div>
            <div style={{fontSize:12}}>{commentNode?"No comments yet":"No comments on any node"}</div>
            {commentNode&&<div style={{fontSize:10,marginTop:4}}>Add one below</div>}
          </div>
        )}
        {entries.map(({nodeId,list})=>{
          const node=nodes.find(n=>n.id===nodeId);
          const t=NT[node?.type]||NT.note;
          return(
            <div key={nodeId}>
              {/* Node header */}
              {!commentNode&&(
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,
                  cursor:"pointer",padding:"4px 0"}}
                  onClick={()=>{setCommentNode(nodeId);onScrollTo(nodeId);}}>
                  <NodeIcon icon={t.icon} size={13} color={t.color} />
                  <span style={{fontSize:11,fontWeight:700,color:t.color,flex:1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node?.title}</span>
                  <span style={{fontSize:9,color:"var(--text4)"}}>{list.length}</span>
                </div>
              )}
              {/* Comments */}
              {list.map(c=>(
                <div key={c.id} style={{
                  background:"var(--bg3)",borderRadius:"var(--radius-sm)",
                  padding:"8px 10px",marginBottom:4,
                  borderLeft:`3px solid var(--accent)`,
                }}>
                  <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:700,color:"var(--accent)"}}>{c.author}</span>
                    <span style={{fontSize:9,color:"var(--text4)"}}>
                      {new Date(c.ts).toLocaleDateString()} {new Date(c.ts).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
                    </span>
                    <button onClick={()=>onDelete(nodeId,c.id)}
                      style={{marginLeft:"auto",background:"none",border:"none",
                        color:"var(--text4)",cursor:"pointer",fontSize:12,opacity:.5}}>×</button>
                  </div>
                  <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{c.text}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Input */}
      {commentNode?(
        <div style={{padding:"10px 12px",borderTop:"1px solid var(--border2)",background:"var(--bg3)"}}>
          <div style={{fontSize:10,color:"var(--accent)",marginBottom:5,fontWeight:700}}>
            REPLY ON "{nodes.find(n=>n.id===commentNode)?.title||"node"}"
          </div>
          <div style={{display:"flex",gap:6}}>
            <textarea ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addComment();}}}
              placeholder="Write a comment… (Enter to send)"
              rows={2}
              style={{flex:1,background:"var(--bg)",
                borderRadius:"var(--radius-sm)",padding:"6px 8px",color:"var(--text)",
                fontSize:11,fontFamily:"var(--font-ui)",resize:"none",outline:"none"}}/>
            <button onClick={addComment}
              style={{background:"var(--accent2)",border:"none",borderRadius:"var(--radius-sm)",
                color:"#fff",cursor:"pointer",padding:"0 10px",fontSize:11,fontWeight:700,
                fontFamily:"var(--font-ui)",flexShrink:0}}>↑</button>
          </div>
        </div>
      ):(
        <div style={{padding:"10px 12px",borderTop:"1px solid var(--border2)",
          fontSize:10,color:"var(--text4)",textAlign:"center"}}>
          Click a node's 💬 icon or a thread above to comment
        </div>
      )}
    </div>
  );
}
