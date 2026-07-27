import { NT } from "../../lib/nodeTypes.js";
import { inp } from "../../lib/styleHelpers.js";
import NodeIcon from "./NodeIcon.jsx";
import CustomKeyInput from "./CustomKeyInput.jsx";
import NoteCard from "./NoteCard.jsx";

// ── Props Panel ───────────────────────────────────────────────

export default function PropsPanel({node,edges,nodes,isMobile,canEdit,onClose,onUpdate,onUpdateProp,onUpdateCustom,onDeleteCustom,onAddCustom,onRenameCustom,onUpdateEdge,onDeleteEdge,onResetSize,onUpdateNotes,onStartEditTitle,onToggleCollapse}){
  const t=NT[node.type]||NT.note;
  const nodeEdges=edges.filter(e=>e.from===node.id||e.to===node.id);
  return(
    <div style={isMobile?{position:"absolute",bottom:0,left:0,right:0,height:"65vh",background:"var(--bg2)",borderTop:"1px solid var(--border)",borderRadius:"14px 14px 0 0",overflow:"auto",zIndex:40,animation:"slideUp .25s ease"}:{width:"var(--props-w)",background:"var(--bg2)",borderLeft:"1px solid var(--border2)",overflow:"auto",flexShrink:0}}>
      <div style={{padding:"11px 14px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:8,position:"sticky",top:0,background:"var(--bg2)",zIndex:1}}>
        <NodeIcon icon={t.icon} size={16} color={t.color} />
        <span style={{fontSize:11,color:t.color,fontWeight:700,flex:1}}>{t.label.toUpperCase()}</span>
        <button onClick={onToggleCollapse} title={node.collapsed?"Expand node":"Collapse node"}
          style={{background:node.collapsed?"var(--success)18":"var(--bg3)",borderRadius:5,color:node.collapsed?"var(--success)":"var(--text3)",cursor:"pointer",fontSize:10,padding:"3px 9px",fontFamily:"inherit",fontWeight:700}}>
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
            {canEdit&&<button onClick={onResetSize} style={{background:"none",borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:"inherit"}}>⊡ RESET</button>}
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
        {/* ── PORTS / INTERFACES — with canvas auto-populate ── */}
        {Array.isArray(node.properties?.Ports)&&(()=>{
          const canvasConn=edges.filter(e=>e.from===node.id||e.to===node.id)
            .map(e=>{const oid=e.from===node.id?e.to:e.from;return nodes.find(n=>n.id===oid)?.title||null;})
            .filter(Boolean);
          const unassigned=canvasConn.filter(name=>!(node.properties.Ports||[]).some(p=>p.connected===name));
          const autoFill=()=>{
            const ports=[...(node.properties.Ports||[])];
            let ui=0;
            for(let pi=0;pi<ports.length&&ui<unassigned.length;pi++){
              if(!ports[pi].connected){ports[pi]={...ports[pi],connected:unassigned[ui]};ui++;}
            }
            onUpdateProp(node.id,"Ports",ports);
          };
          return(
          <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,flex:1}}>PORTS / INTERFACES</span>
              {canEdit&&unassigned.length>0&&<button onClick={autoFill}
                title={`Auto-assign: ${unassigned.join(", ")}`}
                style={{fontSize:10,background:"var(--accent1)18",border:"1px solid var(--accent1)",
                  borderRadius:"var(--radius-xs)",color:"var(--accent1)",cursor:"pointer",
                  padding:"2px 7px",fontFamily:"inherit"}}>⚡ Auto-fill</button>}
              {canEdit&&<button onClick={()=>{
                const ports=[...(node.properties.Ports||[]),
                  {id:Math.random().toString(36).slice(2,7),label:`Port ${(node.properties.Ports||[]).length+1}`,type:"Ethernet",connected:"",ip:"",vlan:""}];
                onUpdateProp(node.id,"Ports",ports);
              }} style={{fontSize:10,background:"none",
                borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",
                padding:"2px 8px",fontFamily:"inherit"}}>+ Port</button>}
            </div>
            {canvasConn.length>0&&(
              <div style={{fontSize:10,color:"var(--text4)",background:"var(--bg3)",borderRadius:5,
                padding:"4px 8px",marginBottom:6,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                <span style={{fontWeight:700,marginRight:2}}>Canvas:</span>
                {canvasConn.map((name,i)=>(
                  <span key={i} style={{background:unassigned.includes(name)?"var(--accent1)22":"var(--success)22",
                    color:unassigned.includes(name)?"var(--accent1)":"var(--success)",
                    borderRadius:3,padding:"1px 5px",fontSize:9,fontWeight:600}}>
                    {unassigned.includes(name)?"○ ":"✓ "}{name}
                  </span>
                ))}
              </div>
            )}
            <datalist id={`portconn-${node.id}`}>
              {canvasConn.map((name,i)=><option key={i} value={name}/>)}
            </datalist>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:4}}>
              {(node.properties.Ports||[]).map((port,pi)=>(
                <div key={port.id||pi} style={{display:"grid",
                  gridTemplateColumns:"60px 90px 1fr 1fr auto",
                  gap:4,alignItems:"center",
                  background:"var(--bg3)",borderRadius:6,padding:"5px 8px",
                  border:port.connected?"1px solid var(--success)44":"1px solid var(--border2)"}}>
                  <input value={port.label||""} placeholder="eth0"
                    disabled={!canEdit}
                    onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],label:e.target.value};onUpdateProp(node.id,"Ports",p);}}
                    style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0,fontFamily:"monospace"}}/>
                  <select value={port.type||"Ethernet"} disabled={!canEdit}
                    onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],type:e.target.value};onUpdateProp(node.id,"Ports",p);}}
                    style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0}}>
                    <optgroup label="Network"><option>Ethernet</option><option>WAN</option><option>LAN</option>
                      <option>uplink</option><option>access</option><option>trunk</option><option>PoE</option>
                      <option>mgmt</option><option>SFP+</option><option>SFP28</option><option>QSFP28</option></optgroup>
                    <optgroup label="USB"><option>USB 3.0</option><option>USB 2.0</option><option>USB-C</option></optgroup>
                    <optgroup label="Thunderbolt"><option>Thunderbolt 4</option><option>Thunderbolt 3</option></optgroup>
                    <optgroup label="Video"><option>HDMI</option><option>DisplayPort</option><option>VGA</option></optgroup>
                    <optgroup label="Storage"><option>SATA</option><option>PCIe/NVMe</option><option>HBA</option></optgroup>
                    <optgroup label="Management"><option>iDRAC/iLO</option><option>IPMI</option></optgroup>
                    <optgroup label="Other"><option>Serial/COM</option><option>Fiber</option><option>Other</option></optgroup>
                  </select>
                  <input value={port.connected||""} placeholder="Connected to…"
                    list={`portconn-${node.id}`}
                    disabled={!canEdit}
                    onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],connected:e.target.value};onUpdateProp(node.id,"Ports",p);}}
                    style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0,
                      color:port.connected?"var(--success)":"inherit"}}/>
                  <input value={port.ip||port.vlan||""} placeholder="IP / VLAN"
                    disabled={!canEdit}
                    onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],ip:e.target.value,vlan:e.target.value};onUpdateProp(node.id,"Ports",p);}}
                    style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0}}/>
                  {canEdit&&<button onClick={()=>{const p=(node.properties.Ports||[]).filter((_,i)=>i!==pi);onUpdateProp(node.id,"Ports",p);}}
                    style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:14,flexShrink:0,lineHeight:1}}>×</button>}
                </div>
              ))}
              {!(node.properties?.Ports?.length)&&(
                <div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>No ports configured</div>
              )}
            </div>
          </div>
          );
        })()}
        {/* ── SERVICES / VMs / CONTAINERS ── */}
        {Array.isArray(node.properties?.Services)&&(
          <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,flex:1}}>SERVICES / VMs / CONTAINERS</span>
              {canEdit&&<button onClick={()=>{
                const svcs=[...(node.properties.Services||[]),
                  {id:Math.random().toString(36).slice(2,7),name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}];
                onUpdateProp(node.id,"Services",svcs);
              }} style={{fontSize:10,background:"none",
                borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",
                padding:"2px 8px",fontFamily:"inherit"}}>+ Add</button>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:6}}>
              {(node.properties.Services||[]).map((svc,si)=>(
                <div key={svc.id||si} style={{background:"var(--bg3)",borderRadius:7,padding:"8px 10px",
                  border:`1px solid ${svc.status==="Running"?"var(--success)33":svc.status==="Stopped"?"var(--danger)33":svc.status==="Error"?"var(--danger)55":"var(--border2)"}`}}>
                  {/* auto-populated badge */}
                  {nodes.find(n=>n.id===svc.id)&&(
                    <div style={{fontSize:9,color:"var(--accent1)",background:"var(--accent1)15",borderRadius:3,padding:"1px 6px",marginBottom:4,display:"inline-flex",alignItems:"center",gap:3}}>
                      ⚡ auto — linked to <strong>{nodes.find(n=>n.id===svc.id)?.title}</strong>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 88px 76px auto",gap:4,marginBottom:5,alignItems:"center"}}>
                    <input value={svc.name||""} placeholder="Service name…" disabled={!canEdit}
                      onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],name:e.target.value};onUpdateProp(node.id,"Services",s);}}
                      style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0,fontWeight:600}}/>
                    <select value={svc.type||"Docker"} disabled={!canEdit}
                      onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],type:e.target.value};onUpdateProp(node.id,"Services",s);}}
                      style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0}}>
                      <option>Docker</option><option>VM</option><option>LXC</option>
                      <option>App</option><option>Service</option><option>Daemon</option>
                      <option>Web App</option><option>Database</option><option>API</option><option>Other</option>
                    </select>
                    <select value={svc.status||"Running"} disabled={!canEdit}
                      onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],status:e.target.value};onUpdateProp(node.id,"Services",s);}}
                      style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0,fontWeight:600,
                        color:svc.status==="Running"?"var(--success)":svc.status==="Stopped"?"var(--danger)":svc.status==="Error"?"var(--danger)":"var(--text2)"}}>
                      <option>Running</option><option>Stopped</option><option>Paused</option><option>Error</option><option>Starting</option>
                    </select>
                    {canEdit&&<button onClick={()=>{const s=(node.properties.Services||[]).filter((_,i)=>i!==si);onUpdateProp(node.id,"Services",s);}}
                      style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 70px 1fr",gap:4,marginBottom:4}}>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>IP</label>
                      <input value={svc.ip||""} placeholder="192.168.x.x" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],ip:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>PORT</label>
                      <input value={svc.port||""} placeholder="8080" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],port:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>IMAGE / OS</label>
                      <input value={svc.image||svc.os||""} placeholder="nginx:latest / Ubuntu…" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],image:e.target.value,os:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"72px 56px 1fr",gap:4}}>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>MEMORY</label>
                      <input value={svc.memory||""} placeholder="2GB" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],memory:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>CPU</label>
                      <input value={svc.cpu||""} placeholder="2" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],cpu:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>NOTES</label>
                      <input value={svc.notes||""} placeholder="…" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],notes:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                  </div>
                </div>
              ))}
              {!(node.properties?.Services?.length)&&(
                <div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>No services configured</div>
              )}
            </div>
          </div>
        )}
        {Object.keys(node.properties||{}).filter(k=>k!=="Ports"&&k!=="Services").length>0&&<>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>TEMPLATE PROPERTIES</div>
          {Object.entries(node.properties||{}).filter(([k,v])=>!k.startsWith('_')&&k!=="Ports"&&k!=="Services"&&!Array.isArray(v)&&typeof v!=="object").map(([k,v])=>(
            <div key={k}>
              <label style={{fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:3,display:"block",color:`${t.color}cc`}}>{k.toUpperCase()}</label>
              <input value={v} onChange={e=>onUpdateProp(node.id,k,e.target.value)} disabled={!canEdit} style={inp()}/>
            </div>
          ))}
        </>}
        <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>CUSTOM PROPERTIES</span>
            {canEdit&&<button onClick={onAddCustom} style={{background:"none",borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:"inherit"}}>+ ADD</button>}
          </div>
          {Object.entries(node.customProps||{}).map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:4,marginBottom:5,alignItems:"flex-start"}}>
              <CustomKeyInput propKey={k} node={node} canEdit={canEdit}
                onRename={(old,nk)=>onRenameCustom&&onRenameCustom(node.id,old,nk)}
                style={{...inp(),width:"100%",marginTop:0,fontWeight:600}}
              />
              <input value={v} onChange={e=>onUpdateCustom(node.id,k,e.target.value)} disabled={!canEdit}
                style={{...inp(),flex:1,marginTop:0,alignSelf:"flex-start"}}
                onKeyDown={e=>e.stopPropagation()}
                placeholder="value"
              />
              {canEdit&&<button onClick={()=>onDeleteCustom(node.id,k)}
                style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:16,flexShrink:0,alignSelf:"flex-start",paddingTop:2}}>×</button>}
            </div>
          ))}
          {!Object.keys(node.customProps||{}).length&&<div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>None yet</div>}
        </div>
        {/* ── NOTES SECTION ── */}
        <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,flex:1}}>NOTES</span>
            {canEdit&&<button onClick={()=>{
              const newNote={id:Math.random().toString(36).slice(2),title:"",content:"",sensitive:false};
              onUpdateNotes(node.id,[...(Array.isArray(node.notes)?node.notes:[]),newNote]);
            }} style={{fontSize:10,background:"var(--accent2)",border:"none",borderRadius:"var(--radius-xs)",
              color:"#fff",cursor:"pointer",padding:"2px 8px",fontFamily:"var(--font-ui)",fontWeight:700}}>
              + ADD NOTE
            </button>}
          </div>
          {(Array.isArray(node.notes)?node.notes:[]).map((nt,idx)=>(
            <NoteCard key={nt.id} note={nt} canEdit={canEdit}
              onChange={updated=>{
                const arr=[...(Array.isArray(node.notes)?node.notes:[])];
                arr[idx]=updated;
                onUpdateNotes(node.id,arr);
              }}
              onDelete={()=>{
                const arr=(Array.isArray(node.notes)?node.notes:[]).filter((_,i)=>i!==idx);
                onUpdateNotes(node.id,arr);
              }}
            />
          ))}
          {!(Array.isArray(node.notes)?node.notes:[]).length&&(
            <div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic",textAlign:"center",padding:"10px 0"}}>
              No notes yet. Click + ADD NOTE to create one.
            </div>
          )}
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
