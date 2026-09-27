import NodeLibrary from "./NodeLibrary.jsx";

export default function NodeSidebar({addNode,canEdit,collapsed,onToggleCollapse,iconOnly,dense,onCycleMode,recentTypes=[]}) {
  if (collapsed) return <aside aria-label="Node library" style={{width:28,flexShrink:0,background:"var(--bg2)",borderRight:"1px solid var(--border2)"}}>
    <button aria-label="Expand node library" onClick={onToggleCollapse}>›</button>
    <span style={{writingMode:"vertical-rl",fontSize:10,margin:8,color:"var(--text3)"}}>NODES</span>
  </aside>;
  return <aside aria-label="Node library" style={{width:iconOnly?48:dense?160:220,flexShrink:0,display:"flex",flexDirection:"column",minHeight:0,background:"var(--bg2)",borderRight:"1px solid var(--border2)"}}>
    <div style={{display:"flex",alignItems:"center",gap:4,padding:6,color:"var(--text2)",fontSize:11}}>
      {!iconOnly && <strong style={{flex:1}}>Node packages</strong>}
      <button onClick={onCycleMode} title={iconOnly?"Switch to full mode":dense?"Switch to icons only":"Switch to compact mode"}
        style={{background:"transparent",color:"var(--text2)",fontSize:10,cursor:"pointer"}}>{iconOnly?"⊞":dense?"⊡":"⊟"}</button>
      <button onClick={onToggleCollapse} title="Collapse" style={{background:"transparent",color:"var(--text2)",cursor:"pointer"}}>‹</button>
    </div>
    <NodeLibrary addNode={addNode} canEdit={canEdit} iconOnly={iconOnly} dense={dense} recentTypes={recentTypes} onExpand={onCycleMode}/>
  </aside>;
}
