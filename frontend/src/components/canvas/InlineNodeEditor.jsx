import { useState } from "react";
import { NT, DP, SIDEBAR_CATS } from "../../lib/nodeTypes.js";
import { inp } from "../../lib/styleHelpers.js";
import NodeIcon from "./NodeIcon.jsx";
import CustomKeyInput from "./CustomKeyInput.jsx";


const NODE_INT_TYPES = new Set(['proxmox','unraid','truenas','freenas','esxi','hyperv','nas','server','appserver','router','switch','firewall','desktop','laptop','rpi']);

// ── Inline Node Editor — tabbed popup at node ────────────────────
export default function InlineNodeEditor({ node, x, y, tab, nodes, edges, canEdit, mapId, mapTitle,
  onTabChange, onClose, onUpdate, onUpdateNotes, onChangeType,
  onUpdateCustom, onDeleteCustom, onAddCustom, onRenameCustom, onUpdateProp: onUpdatePropExt }) {
  // onUpdateProp: prefer external (functional update from NodeCanvas) to avoid stale closure on live tab
  const onUpdateProp = onUpdatePropExt || ((key, val) => onUpdate({ properties: { ...node.properties, [key]: val } }));

  const t = NT[node.type] || NT.note;
  const nodeEdges = edges.filter(e => e.from === node.id || e.to === node.id);
  const [typeSearch, setTypeSearch] = useState('');
  const [confirmType, setConfirmType] = useState(null);

  const hasPorts    = Array.isArray(node.properties?.Ports)    && node.properties.Ports.length > 0;
  const hasServices = Array.isArray(node.properties?.Services) && node.properties.Services.length > 0;
  const hasIntegration = !!(node.properties?._integration?.url || NODE_INT_TYPES.has(node.type));
  const TABS = [
    { id: 'notes',    label: '📝 Notes'      },
    { id: 'props',    label: '⚙ Props'       },
    ...(hasServices ? [{ id: 'services', label: `🔧 Services (${node.properties.Services.length})` }] : []),
    ...(hasPorts    ? [{ id: 'ports',    label: `🔌 Ports (${node.properties.Ports.length})`       }] : []),
    ...(hasIntegration ? [{ id: 'live',  label: '📡 Live' }] : []),
    { id: 'ai',       label: '🤖 Ask AI'     },
    { id: 'type',     label: '🏷 Type'       },
    { id: 'conns',    label: `🔗 Links (${nodeEdges.length})` },
  ];

  const inp = () => ({
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)', padding: '6px 8px', color: 'var(--text)',
    fontSize: 11, fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box',
  });

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      style={{
        position: 'absolute', left: x, top: y, width: 520, zIndex: 200,
        background: 'var(--bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))', outline: `2px solid ${t.color}`,
        display: 'flex', flexDirection: 'column', maxHeight: '80vh',
        userSelect: 'none',
      }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderBottom: '1px solid var(--border2)', background: `${t.color}18`, flexShrink: 0 }}>
        <span style={{ fontSize: 18 }}><NodeIcon icon={t.icon} size={16} color={t.color} /></span>
        <input value={node.title} onChange={e => onUpdate({ title: e.target.value })}
          disabled={!canEdit}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 14, fontWeight: 700, color: t.color, fontFamily: 'var(--font-ui)' }}
        />
        <span style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 700, letterSpacing: 1 }}>{t.label.toUpperCase()}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text4)',
          cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
      </div>

      {/* Description field — hidden for note nodes */}
      {node.type !== 'note' && (
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border2)', flexShrink: 0 }}>
        <input
          value={node.description || ''}
          onChange={e => onUpdate({ description: e.target.value })}
          disabled={!canEdit}
          placeholder="Short description (shown on node)…"
          style={{ ...inp(), background: 'transparent', border: 'none', padding: '0',
            fontSize: 11, color: 'var(--text3)', fontStyle: node.description ? 'normal' : 'italic' }}
        />
      </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => onTabChange(tb.id)}
            style={{ flexShrink: 0, padding: '7px 8px', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-ui)',
              background: tab === tb.id ? 'var(--bg)' : 'var(--bg2)',
              color: tab === tb.id ? t.color : 'var(--text4)',
              borderBottom: tab === tb.id ? `2px solid ${t.color}` : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>
            {tb.label}
          </button>
        ))}
      </div>
      {(!hasServices || !hasPorts || !hasIntegration) && (
        <div style={{ fontSize: 9, color: 'var(--text4)', padding: '3px 14px', background: 'var(--bg2)', fontStyle: 'italic', flexShrink: 0 }}>
          {[!hasServices && 'Services', !hasPorts && 'Ports', !hasIntegration && 'Live'].filter(Boolean).join(', ')} tab{(!hasServices && !hasPorts && !hasIntegration) || (!hasServices && !hasPorts) || (!hasServices && !hasIntegration) || (!hasPorts && !hasIntegration) ? 's' : ''} hidden — not applicable to this node type
        </div>
      )}

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', userSelect: 'text', pointerEvents: 'all' }}>

        {/* ── NOTES TAB ── */}
        {tab === 'notes' && (
          <NodeNotesTab
            node={node}
            canEdit={canEdit}
            t={t}
            onUpdate={onUpdate}
          />
        )}

        {/* ── PROPERTIES TAB ── */}
        {tab === 'props' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Template properties */}
            {Object.keys(node.properties || {}).length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', letterSpacing: 1.5, marginBottom: 6 }}>TEMPLATE PROPERTIES</div>
                {Object.entries(node.properties || {}).filter(([k,v])=>!k.startsWith('_')&&!Array.isArray(v)&&typeof v!=='object').map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: `${t.color}cc`, letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>{k.toUpperCase()}</label>
                    <input value={v} onChange={e => onUpdateCustom ? (() => {
                      const p = { ...node.properties, [k]: e.target.value };
                      onUpdate({ properties: p });
                    })() : null} disabled={!canEdit} style={inp()} />
                  </div>
                ))}
              </div>
            )}
            {/* Custom properties */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', letterSpacing: 1.5, flex: 1 }}>CUSTOM FIELDS</span>
                {canEdit && <button onClick={onAddCustom} style={{ fontSize: 9, background: 'none',
                  border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text3)',
                  cursor: 'pointer', padding: '2px 7px', fontFamily: 'var(--font-ui)' }}>+ ADD</button>}
              </div>
              {Object.entries(node.customProps || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                  <CustomKeyInput propKey={k} node={node} canEdit={canEdit}
                    onRename={(old,nk)=>onRenameCustom&&onRenameCustom(old,nk)}
                    style={{ ...inp(), width: '100%', fontWeight: 600 }}
                  />
                  <input value={v} onChange={e => onUpdateCustom(k, e.target.value)} disabled={!canEdit}
                    style={{ ...inp(), flex: 1 }}
                    placeholder="value"
                    onKeyDown={e=>e.stopPropagation()}
                  />
                  {canEdit && <button onClick={() => onDeleteCustom(k)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>}
                </div>
              ))}
              {!Object.keys(node.customProps || {}).length && (
                <div style={{ fontSize: 10, color: 'var(--text4)', fontStyle: 'italic' }}>No custom fields yet</div>
              )}
            </div>
            {/* Size */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', letterSpacing: 1.5, marginBottom: 6 }}>SIZE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['w', 'h'].map(dim => (
                  <div key={dim} style={{ flex: 1 }}>
                    <label style={{ fontSize: 9, color: 'var(--text4)', display: 'block', marginBottom: 2 }}>{dim.toUpperCase()}</label>
                    <input type="number" value={node[dim]} onChange={e => onUpdate({ [dim]: +e.target.value })} disabled={!canEdit} style={inp()} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SERVICES TAB ── */}
        {tab === 'services' && (
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',letterSpacing:2,flex:1}}>SERVICES / VMs / CONTAINERS</span>
              {canEdit&&<button onClick={()=>{
                const svcs=[...(node.properties.Services||[]),
                  {id:Math.random().toString(36).slice(2,7),name:'',type:'Docker',ip:'',port:'',status:'Running',image:'',os:'',memory:'',cpu:'',notes:''}];
                onUpdateProp('Services',svcs);
              }} style={{fontSize:10,background:'none',borderRadius:4,color:'var(--text3)',cursor:'pointer',padding:'2px 8px',fontFamily:'var(--font-ui)'}}>+ Add</button>}
            </div>
            {(node.properties.Services||[]).map((svc,si)=>{
              const isAuto=nodes.some(n=>n.id===svc.id);
              return(
              <div key={svc.id||si} style={{background:'var(--bg3)',borderRadius:7,padding:'8px 10px',
                border:`1px solid ${svc.status==='Running'?'var(--success)33':svc.status==='Stopped'?'var(--danger)33':svc.status==='Error'?'var(--danger)55':'var(--border2)'}`}}>
                {isAuto&&<div style={{fontSize:9,color:'var(--accent1)',marginBottom:4}}>⚡ auto — {nodes.find(n=>n.id===svc.id)?.title}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 80px 70px auto',gap:4,marginBottom:4,alignItems:'center'}}>
                  <input value={svc.name||''} placeholder='Service name…' disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],name:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 6px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none',fontWeight:600}}/>
                  <select value={svc.type||'Docker'} disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],type:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 4px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}>
                    <option>Docker</option><option>VM</option><option>LXC</option><option>App</option>
                    <option>Service</option><option>Daemon</option><option>Web App</option><option>Database</option><option>API</option><option>Other</option>
                  </select>
                  <select value={svc.status||'Running'} disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],status:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 4px',
                      color:svc.status==='Running'?'var(--success)':svc.status==='Stopped'||svc.status==='Error'?'var(--danger)':'var(--text)',
                      fontSize:10,fontFamily:'var(--font-ui)',outline:'none',fontWeight:700}}>
                    <option>Running</option><option>Stopped</option><option>Paused</option><option>Error</option><option>Starting</option>
                  </select>
                  {canEdit&&<button onClick={()=>{const s=(node.properties.Services||[]).filter((_,i)=>i!==si);onUpdateProp('Services',s);}}
                    style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 60px 1fr',gap:4}}>
                  <input value={svc.ip||''} placeholder='IP' disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],ip:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 6px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                  <input value={svc.port||''} placeholder='Port' disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],port:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 6px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                  <input value={svc.image||svc.os||''} placeholder='Image / OS' disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],image:e.target.value,os:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 6px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                </div>
              </div>
              );
            })}
            {!node.properties?.Services?.length&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic'}}>No services configured</div>}
          </div>
        )}

        {/* ── PORTS TAB ── */}
        {tab === 'ports' && (()=>{
          const canvasConn=edges.filter(e=>e.from===node.id||e.to===node.id)
            .map(e=>{const oid=e.from===node.id?e.to:e.from;return nodes.find(n=>n.id===oid)?.title||null;})
            .filter(Boolean);
          const unassigned=canvasConn.filter(name=>!(node.properties.Ports||[]).some(p=>p.connected===name));
          return(
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',letterSpacing:2,flex:1}}>PORTS / INTERFACES</span>
              {canEdit&&unassigned.length>0&&<button onClick={()=>{
                const ports=[...(node.properties.Ports||[])];
                let ui=0;
                for(let pi=0;pi<ports.length&&ui<unassigned.length;pi++){
                  if(!ports[pi].connected){ports[pi]={...ports[pi],connected:unassigned[ui]};ui++;}
                }
                onUpdateProp('Ports',ports);
              }} style={{fontSize:10,background:'var(--accent1)18',border:'1px solid var(--accent1)',borderRadius:4,color:'var(--accent1)',cursor:'pointer',padding:'2px 7px',fontFamily:'var(--font-ui)'}}>⚡ Auto-fill</button>}
              {canEdit&&<button onClick={()=>{
                const ports=[...(node.properties.Ports||[]),
                  {id:Math.random().toString(36).slice(2,7),label:`Port ${(node.properties.Ports||[]).length+1}`,type:'Ethernet',connected:'',ip:'',vlan:''}];
                onUpdateProp('Ports',ports);
              }} style={{fontSize:10,background:'none',borderRadius:4,color:'var(--text3)',cursor:'pointer',padding:'2px 8px',fontFamily:'var(--font-ui)'}}>+ Port</button>}
            </div>
            {canvasConn.length>0&&(
              <div style={{fontSize:10,color:'var(--text4)',background:'var(--bg3)',borderRadius:5,padding:'4px 8px',display:'flex',flexWrap:'wrap',gap:4,alignItems:'center'}}>
                <span style={{fontWeight:700,marginRight:2}}>Canvas:</span>
                {canvasConn.map((name,i)=>(
                  <span key={i} style={{background:unassigned.includes(name)?'var(--accent1)22':'var(--success)22',
                    color:unassigned.includes(name)?'var(--accent1)':'var(--success)',
                    borderRadius:3,padding:'1px 5px',fontSize:9,fontWeight:600}}>
                    {unassigned.includes(name)?'○ ':'✓ '}{name}
                  </span>
                ))}
              </div>
            )}
            <datalist id={`popportconn-${node.id}`}>
              {canvasConn.map((name,i)=><option key={i} value={name}/>)}
            </datalist>
            {(node.properties.Ports||[]).map((port,pi)=>(
              <div key={port.id||pi} style={{display:'grid',gridTemplateColumns:'55px 85px 1fr 1fr auto',gap:4,alignItems:'center',
                background:'var(--bg3)',borderRadius:6,padding:'5px 8px',
                border:port.connected?'1px solid var(--success)44':'1px solid var(--border2)'}}>
                <input value={port.label||''} placeholder='eth0' disabled={!canEdit}
                  onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],label:e.target.value};onUpdateProp('Ports',p);}}
                  style={{background:'var(--bg)',borderRadius:4,padding:'3px 5px',color:'var(--text)',fontSize:10,fontFamily:'monospace',outline:'none'}}/>
                <select value={port.type||'Ethernet'} disabled={!canEdit}
                  onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],type:e.target.value};onUpdateProp('Ports',p);}}
                  style={{background:'var(--bg)',borderRadius:4,padding:'3px 4px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}>
                  <optgroup label="Network"><option>Ethernet</option><option>WAN</option><option>LAN</option>
                    <option>uplink</option><option>access</option><option>trunk</option><option>PoE</option><option>SFP+</option></optgroup>
                  <optgroup label="USB"><option>USB 3.0</option><option>USB 2.0</option><option>USB-C</option></optgroup>
                  <optgroup label="Thunderbolt"><option>Thunderbolt 4</option><option>Thunderbolt 3</option></optgroup>
                  <optgroup label="Video"><option>HDMI</option><option>DisplayPort</option><option>VGA</option></optgroup>
                  <optgroup label="Mgmt"><option>iDRAC/iLO</option><option>IPMI</option></optgroup>
                  <optgroup label="Other"><option>HBA</option><option>Fiber</option><option>Other</option></optgroup>
                </select>
                <input value={port.connected||''} placeholder='Connected to…' list={`popportconn-${node.id}`} disabled={!canEdit}
                  onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],connected:e.target.value};onUpdateProp('Ports',p);}}
                  style={{background:'var(--bg)',borderRadius:4,padding:'3px 5px',
                    color:port.connected?'var(--success)':'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                <input value={port.ip||port.vlan||''} placeholder='IP / VLAN' disabled={!canEdit}
                  onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],ip:e.target.value,vlan:e.target.value};onUpdateProp('Ports',p);}}
                  style={{background:'var(--bg)',borderRadius:4,padding:'3px 5px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                {canEdit&&<button onClick={()=>{const p=(node.properties.Ports||[]).filter((_,i)=>i!==pi);onUpdateProp('Ports',p);}}
                  style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>}
              </div>
            ))}
            {!node.properties?.Ports?.length&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic'}}>No ports configured</div>}
          </div>
          );
        })()}

        {/* ── LIVE TAB ── */}
        {tab === 'live' && (
          <>
            {!node.properties?.IP && !node.properties?._integration?.url && (
              <div style={{ background:'var(--accent2)11', border:'1px solid var(--accent2)33', borderRadius:'var(--radius-sm)', padding:'10px 12px', marginBottom:10, fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
                💡 Set the <strong style={{color:'var(--accent)'}}>IP address</strong> in the <button onClick={()=>onTabChange('props')} style={{background:'none',border:'none',color:'var(--accent2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:11,fontWeight:700,padding:0,textDecoration:'underline'}}>Properties tab</button> first, then return here to connect.
              </div>
            )}
            <IntegrationPanel
              node={node}
              canEdit={canEdit}
              onUpdateProp={onUpdateProp}
            />
          </>
        )}

        {/* ── TYPE TAB ── */}
        {tab === 'type' && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10 }}>
              Current type: <span style={{ color: t.color, fontWeight: 700 }}><NodeIcon icon={t.icon} size={16} color={t.color} /> {t.label}</span>
              {' '}<span style={{ color: 'var(--text4)', fontSize: 9 }}>(category: {t.cat})</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <input value={typeSearch} onChange={e => setTypeSearch(e.target.value)}
                placeholder="Search node types…"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text)',
                  fontSize: 11, fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {SIDEBAR_CATS.map(cat => {
              const items = Object.entries(NT).filter(([, nt]) => nt.cat === cat &&
                (!typeSearch || nt.label.toLowerCase().includes(typeSearch.toLowerCase())));
              if (!items.length) return null;
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', letterSpacing: 1.5, marginBottom: 4 }}>{cat.toUpperCase()}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {items.map(([key, nt]) => (
                      <button key={key}
                        onClick={() => {
                          if (key === node.type) return;
                          if (Object.values(node.properties || {}).some(v => v)) {
                            setConfirmType(key);
                          } else {
                            onChangeType(key);
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px',
                          border: `1.5px solid ${key === node.type ? nt.color : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          background: key === node.type ? `${nt.color}22` : 'var(--bg)',
                          color: key === node.type ? nt.color : 'var(--text3)',
                          fontSize: 11, fontFamily: 'var(--font-ui)',
                          transition: 'all .1s',
                        }}>
                        <NodeIcon icon={nt.icon} size={13} color={key===node.type?nt.color:'var(--text4)'} />
                        <span style={{ fontWeight: key === node.type ? 700 : 400 }}>{nt.label}</span>
                        {key === node.type && <span style={{ fontSize: 9 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Confirm type change modal */}
            {confirmType && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  padding: 20, maxWidth: 300, width: '90%' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Change node type?</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
                    Change to <NodeIcon icon={NT[confirmType]?.icon} size={14} color={NT[confirmType]?.color} /> {NT[confirmType]?.label}? You can keep or reset existing property values.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { onChangeType(confirmType); setConfirmType(null); onTabChange('props'); }}
                      style={{ flex: 1, padding: '7px', background: 'var(--accent2)', border: 'none', borderRadius: 6,
                        color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
                      Change + Keep Props
                    </button>
                    <button onClick={() => {
                      onUpdate({ type: confirmType, properties: { ...(DP[confirmType] || {}) } });
                      setConfirmType(null); onTabChange('props');
                    }}
                      style={{ flex: 1, padding: '7px', background: 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)' }}>
                      Reset Props
                    </button>
                    <button onClick={() => setConfirmType(null)}
                      style={{ padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', fontSize: 14 }}>
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI TAB ── */}
        {tab === 'ai' && mapId && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{ fontSize:10, color:'var(--text4)', padding:'6px 14px 0', fontStyle:'italic' }}>
              Asking AI about this node only — use the 💬 AI Chat button in the topbar for full-canvas context.
            </div>
            <NodeAIChat node={node} mapId={mapId} mapTitle={mapTitle} />
          </div>
        )}
        {tab === 'ai' && !mapId && (
          <div style={{ padding: 16, fontSize: 11, color: 'var(--text4)', textAlign: 'center' }}>Map ID not available</div>
        )}

        {/* ── CONNECTIONS TAB ── */}
        {tab === 'conns' && (
          <div>
            {nodeEdges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text4)', fontSize: 11, fontStyle: 'italic' }}>
                No connections yet. Use Connect mode (C) to draw arrows.
              </div>
            ) : nodeEdges.map(edge => {
              const other = nodes.find(n => n.id === (edge.from === node.id ? edge.to : edge.from));
              const isFrom = edge.from === node.id;
              const ot = NT[other?.type] || NT.note;
              return (
                <div key={edge.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10,
                  padding: '8px 10px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                    <NodeIcon icon={ot.icon} size={16} color={ot.color} />
                    <span style={{ fontSize: 18, color: ot.color, lineHeight: 1 }}>{isFrom ? '→' : '←'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ot.color, marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {other?.title || '?'}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <input value={edge.label || ''} placeholder="Label…"
                        onChange={e => {/* handled by parent */}}
                        style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4,
                          padding: '3px 6px', color: 'var(--text)', fontSize: 10, fontFamily: 'var(--font-ui)', outline: 'none' }}
                      />
                      <select value={edge.edgeType || 'data'}
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4,
                          padding: '3px 5px', color: 'var(--text3)', fontSize: 9, fontFamily: 'var(--font-ui)', outline: 'none' }}>
                        <option value="data">Data flow</option>
                        <option value="method">Method call</option>
                        <option value="network">Network</option>
                        <option value="dependency">Dependency</option>
                        <option value="trigger">Trigger</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
