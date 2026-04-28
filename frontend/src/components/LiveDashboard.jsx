import { useState, useEffect, useRef, useCallback } from 'react';
import { NODE_INT_MAP, fmt, gb, pct } from './IntegrationPanel.jsx';
import { apiFetch } from '../api/client.js';

const REFRESH_MS = 30000;
const TYPE_COLOR = { proxmox:'var(--accent2)', truenas:'#0095D5', unraid:'#E67C1C', esxi:'#717CBD', probe:'var(--text3)', freenas:'#1565C0' };
const TYPE_LABEL = { proxmox:'Proxmox VE', truenas:'TrueNAS', unraid:'Unraid', esxi:'ESXi', probe:'HTTP Probe', freenas:'FreeNAS' };

function uptime(s){ if(!s) return'—'; const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return d>0?`${d}d ${h}h`:h>0?`${h}h ${m}m`:`${m}m`; }
function Bar({v,h=4}){ const c=v>=90?'var(--danger)':v>=70?'#ff9800':'var(--success)'; return <div style={{height:h,background:'var(--border2)',borderRadius:h,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(v,100)}%`,background:c,borderRadius:h,transition:'width .4s'}}/></div>; }
function MiniMetric({label,value,sub,v}){ return <div style={{minWidth:0}}><div style={{fontSize:9,color:'var(--text4)',marginBottom:1}}>{label}</div><div style={{fontSize:13,fontWeight:800,color:v>=90?'var(--danger)':v>=70?'#ff9800':'var(--text)',lineHeight:1.1}}>{value}</div>{sub&&<div style={{fontSize:9,color:'var(--text4)',marginTop:1}}>{sub}</div>}{v!=null&&<Bar v={v}/>}</div>; }
function Pill({running}){ return <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,fontWeight:700,background:running?'var(--success)22':'var(--bg3)',color:running?'var(--success)':'var(--text4)',border:`1px solid ${running?'var(--success)44':'var(--border)'}`}}>{running?'●':'■'} {running?'on':'off'}</span>; }

// ── Guest list (shared) ───────────────────────────────────────
function GuestList({guests, color}){
  const [f,setF]=useState('all');
  const rVM=guests.filter(g=>g._type==='VM'&&g.status==='running').length, tVM=guests.filter(g=>g._type==='VM').length;
  const rCT=guests.filter(g=>g._type==='CT'&&g.status==='running').length, tCT=guests.filter(g=>g._type==='CT').length;
  const shown=guests.filter(g=>f==='all'||(f==='vm'&&g._type==='VM')||(f==='ct'&&g._type==='CT')||(f==='off'&&g.status!=='running'));
  return <div>
    <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
      {[['all',`All ${guests.length}`],['vm',`VM ${rVM}/${tVM}`],['ct',`CT ${rCT}/${tCT}`],['off','Stopped']].map(([v,l])=>(
        <button key={v} onClick={()=>setF(v)} style={{fontSize:9,padding:'2px 8px',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:600,background:f===v?color:'var(--bg3)',color:f===v?'#fff':'var(--text4)'}}>{l}</button>
      ))}
    </div>
    {shown.length===0&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic',textAlign:'center',padding:'8px 0'}}>None</div>}
    {shown.map(g=>{
      const cp=Math.round((g.cpu||0)*100), mp=pct(g.mem,g.maxmem), run=g.status==='running', isVM=g._type==='VM';
      return <div key={`${g._type}${g.vmid}`} style={{display:'grid',gridTemplateColumns:'auto 1fr auto auto auto',gap:6,alignItems:'center',padding:'5px 8px',borderRadius:6,marginBottom:3,background:'var(--bg)',border:`1px solid ${run?'var(--success)22':'var(--border2)'}`,opacity:run?1:.6}}>
        <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,fontWeight:700,background:isVM?'#8E24AA22':'var(--accent2)22',color:isVM?'#CE93D8':'var(--accent2)'}}>{isVM?'VM':'CT'}</span>
        <div style={{minWidth:0}}><div style={{fontSize:11,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name||`${g._type}${g.vmid}`}</div><div style={{fontSize:8,color:'var(--text4)'}}>{g.cpus}c · up {uptime(g.uptime)}</div></div>
        <div style={{width:60}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:8,color:'var(--text4)'}}>CPU</span><span style={{fontSize:9,fontWeight:700}}>{cp}%</span></div><Bar v={cp}/></div>
        <div style={{width:70}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:8,color:'var(--text4)'}}>RAM</span><span style={{fontSize:9,fontWeight:700}}>{mp}%</span></div><Bar v={mp}/><div style={{fontSize:8,color:'var(--text4)'}}>{gb(g.mem)}</div></div>
        <Pill running={run}/>
      </div>;
    })}
  </div>;
}

// ── Proxmox full card ─────────────────────────────────────────
function ProxmoxCard({result, color}){
  const [tab,setTab]=useState('overview');
  const d=result.data, n=d.nodes?.[0], s=n?.status||{};
  const cp=Math.round((s.cpu||0)*100), mp=pct(s.memory?.used,s.memory?.total), dp=pct(s.rootfs?.used,s.rootfs?.total);
  const guests=d.nodes?.flatMap(nd=>[...(nd.vms||[]).map(v=>({...v,_type:'VM'})),...(nd.lxc||[]).map(v=>({...v,_type:'CT'}))])||[];
  const stor=d.nodes?.flatMap(nd=>(nd.storage||[]).filter(s=>s.active&&s.total>0))||[];
  const rVM=guests.filter(g=>g._type==='VM'&&g.status==='running').length;
  const rCT=guests.filter(g=>g._type==='CT'&&g.status==='running').length;

  const TABS=[{id:'overview',label:'Overview'},{id:'guests',label:`Guests (${guests.length})`},{id:'storage',label:`Storage (${stor.length})`}];
  return <>
    {/* Always-visible mini metrics strip */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,padding:'8px 12px',background:'var(--bg)',borderBottom:'1px solid var(--border2)'}}>
      <MiniMetric label="CPU" value={`${cp}%`} v={cp}/>
      <MiniMetric label="RAM" value={`${mp}%`} sub={`${gb(s.memory?.used)}`} v={mp}/>
      <MiniMetric label="Disk" value={`${dp}%`} sub={`${fmt(s.rootfs?.used)}`} v={dp}/>
      <MiniMetric label="VMs" value={`${rVM}/${(n?.vms||[]).length}`}/>
      <MiniMetric label="CTs" value={`${rCT}/${(n?.lxc||[]).length}`}/>
      <MiniMetric label="Uptime" value={uptime(s.uptime)}/>
    </div>
    {/* Tabs */}
    <div style={{display:'flex',background:'var(--bg3)',borderBottom:'1px solid var(--border2)'}}>
      {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'6px 14px',border:'none',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'var(--font-ui)',background:tab===t.id?'var(--bg2)':'var(--bg3)',color:tab===t.id?color:'var(--text4)',borderBottom:tab===t.id?`2px solid ${color}`:'2px solid transparent'}}>{t.label}</button>)}
    </div>
    {/* Tab content — fixed height scroll */}
    <div style={{height:220,overflowY:'auto',padding:'10px 12px'}}>
      {tab==='overview'&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        {d.nodes?.map(nd=>{const st=nd.status||{};const c2=Math.round((st.cpu||0)*100),m2=pct(st.memory?.used,st.memory?.total),d2=pct(st.rootfs?.used,st.rootfs?.total);return <div key={nd.node} style={{gridColumn:'span 3',background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}><span style={{width:7,height:7,borderRadius:'50%',background:nd.online?'var(--success)':'var(--danger)'}}/><span style={{fontWeight:700,fontSize:11,color:'var(--text)'}}>{nd.node}</span><span style={{fontSize:9,color:'var(--text4)',marginLeft:'auto'}}>v{d.version} · {st.cpuinfo?.model?.split(' ').slice(-1)[0]||`${st.cpuinfo?.cores||'?'}c`}</span></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
            {[{l:`CPU(${st.cpuinfo?.cores}c)`,v:c2},{l:'RAM',v:m2,s:`${gb(st.memory?.used)}/${gb(st.memory?.total)}`},{l:'Disk',v:d2,s:`${fmt(st.rootfs?.used)}/${fmt(st.rootfs?.total)}`}].map(({l,v,s})=><div key={l}><div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}><span style={{fontSize:9,color:'var(--text4)'}}>{l}</span><span style={{fontSize:10,fontWeight:700,color:v>=90?'var(--danger)':v>=70?'#ff9800':'var(--text)'}}>{v}%</span></div><Bar v={v} h={5}/>{s&&<div style={{fontSize:8,color:'var(--text4)',marginTop:2}}>{s}</div>}</div>)}
          </div>
        </div>;})}
      </div>}
      {tab==='guests'&&<GuestList guests={guests} color={color}/>}
      {tab==='storage'&&<div>
        {stor.length===0&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic',textAlign:'center',padding:'8px 0'}}>No storage</div>}
        {stor.map(st=>{const sp=pct(st.used||st.disk_used||0,st.total||st.maxdisk||1);return <div key={st.storage} style={{display:'grid',gridTemplateColumns:'1fr auto 120px auto',gap:8,alignItems:'center',padding:'6px 8px',borderRadius:5,marginBottom:4,background:'var(--bg)',border:'1px solid var(--border2)'}}>
          <span style={{fontSize:11,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{st.storage}</span>
          <span style={{fontSize:9,color:'var(--text4)',whiteSpace:'nowrap'}}>{fmt(st.used||st.disk_used||0)}/{fmt(st.total)}</span>
          <Bar v={sp} h={5}/>
          <span style={{fontSize:10,fontWeight:700,color:sp>=85?'var(--danger)':sp>=70?'#ff9800':'var(--success)',minWidth:32,textAlign:'right'}}>{sp}%</span>
        </div>;})}
      </div>}
    </div>
  </>;
}

// ── TrueNAS full card ─────────────────────────────────────────
function TrueNASCard({result, color}){
  const [tab,setTab]=useState('overview');
  const d=result.data, info=d.info||{}, pools=d.pools||[], svcs=d.services||[];
  const run=svcs.filter(s=>s.state==='RUNNING').length;
  const used=pools.reduce((a,p)=>a+(p.size?.allocated||0),0), total=pools.reduce((a,p)=>a+(p.size?.total||0),0);
  const dp=pct(used,total);
  const TABS=[{id:'overview',label:'Overview'},{id:'pools',label:`Pools (${pools.length})`},{id:'services',label:`Services (${run}/${svcs.length})`}];
  return <>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,padding:'8px 12px',background:'var(--bg)',borderBottom:'1px solid var(--border2)'}}>
      <MiniMetric label="Storage" value={`${dp}%`} sub={`${fmt(used)}/${fmt(total)}`} v={dp}/>
      <MiniMetric label="Pools" value={pools.length} sub={pools.every(p=>p.healthy)?'✓ healthy':'⚠ check'}/>
      <MiniMetric label="Services" value={`${run}/${svcs.length}`} sub="running"/>
      <MiniMetric label="Alerts" value={(d.alerts||[]).length} sub={(d.alerts||[]).length>0?'⚠ active':'✓ none'}/>
    </div>
    <div style={{display:'flex',background:'var(--bg3)',borderBottom:'1px solid var(--border2)'}}>
      {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'6px 14px',border:'none',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'var(--font-ui)',background:tab===t.id?'var(--bg2)':'var(--bg3)',color:tab===t.id?color:'var(--text4)',borderBottom:tab===t.id?`2px solid ${color}`:'2px solid transparent'}}>{t.label}</button>)}
    </div>
    <div style={{height:220,overflowY:'auto',padding:'10px 12px'}}>
      {tab==='overview'&&<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8}}>
          {[{l:'Hostname',v:info.hostname||'—'},{l:'Version',v:(info.version||'').split('-')[0]||'—'},{l:'Uptime',v:info.uptimeSeconds?Math.floor(info.uptimeSeconds/86400)+'d':'—'}].map(({l,v})=><div key={l} style={{background:'var(--bg)',borderRadius:5,padding:'6px 8px',border:'1px solid var(--border2)'}}><div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{v}</div></div>)}
        </div>
        {(d.alerts||[]).map((a,i)=><div key={i} style={{padding:'4px 8px',background:'var(--danger)11',borderRadius:4,fontSize:10,color:'var(--danger)',marginBottom:3}}>⚠ {a.formatted||a.text}</div>)}
      </div>}
      {tab==='pools'&&pools.map(p=>{const sp=pct(p.size?.allocated,p.size?.total);return <div key={p.name} style={{padding:'7px 10px',borderRadius:6,marginBottom:5,background:'var(--bg)',border:`1px solid ${p.healthy?'var(--success)22':'var(--danger)33'}`}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}><span style={{fontWeight:600,fontSize:12,color:'var(--text)',flex:1}}>{p.name}</span><span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:8,background:p.healthy?'var(--success)22':'var(--danger)22',color:p.healthy?'var(--success)':'var(--danger)'}}>{p.status}</span><span style={{fontSize:10,fontWeight:700,color:sp>=85?'var(--danger)':sp>=70?'#ff9800':'var(--success)'}}>{sp}%</span></div>
        <Bar v={sp} h={5}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}><span style={{fontSize:9,color:'var(--text4)'}}>Used {fmt(p.size?.allocated)}</span><span style={{fontSize:9,color:'var(--text4)'}}>Free {fmt((p.size?.total||0)-(p.size?.allocated||0))}</span><span style={{fontSize:9,color:'var(--text4)'}}>Total {fmt(p.size?.total)}</span></div>
      </div>;})}
      {tab==='services'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
        {svcs.map(s=><div key={s.service} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 8px',borderRadius:5,background:'var(--bg)',border:`1px solid ${s.state==='RUNNING'?'var(--success)22':'var(--border2)'}`}}>
          <span style={{fontSize:10,color:s.state==='RUNNING'?'var(--success)':'var(--text4)'}}>{s.state==='RUNNING'?'▶':'■'}</span>
          <span style={{fontSize:10,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.service}</span>
        </div>)}
      </div>}
    </div>
  </>;
}

// ── Unraid full card ──────────────────────────────────────────
function UnraidCard({result, color}){
  const [tab,setTab]=useState('overview');
  const d=result.data?.data||{}, sys=d.system||{}, mem=sys.memory||{};
  const cp=Math.round(sys.cpu?.usage||0), mp=pct(mem.total-mem.free,mem.total);
  const ctrs=d.docker?.containers||[], runC=ctrs.filter(c=>c.state==='running').length;
  const TABS=[{id:'overview',label:'Overview'},{id:'docker',label:`Docker (${runC}/${ctrs.length})`}];
  return <>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,padding:'8px 12px',background:'var(--bg)',borderBottom:'1px solid var(--border2)'}}>
      <MiniMetric label="CPU" value={`${cp}%`} v={cp}/>
      <MiniMetric label="RAM" value={`${mp}%`} sub={`${gb(mem.total-mem.free)}/${gb(mem.total)}`} v={mp}/>
      <MiniMetric label="Docker" value={`${runC}/${ctrs.length}`} sub="running"/>
    </div>
    <div style={{display:'flex',background:'var(--bg3)',borderBottom:'1px solid var(--border2)'}}>
      {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'6px 14px',border:'none',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'var(--font-ui)',background:tab===t.id?'var(--bg2)':'var(--bg3)',color:tab===t.id?color:'var(--text4)',borderBottom:tab===t.id?`2px solid ${color}`:'2px solid transparent'}}>{t.label}</button>)}
    </div>
    <div style={{height:220,overflowY:'auto',padding:'10px 12px'}}>
      {tab==='overview'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {[{l:'CPU',v:cp},{l:'RAM',v:mp,s:`${gb(mem.total-mem.free)} / ${gb(mem.total)}`}].map(({l,v,s})=><div key={l} style={{background:'var(--bg)',borderRadius:5,padding:'8px 10px',border:'1px solid var(--border2)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:9,color:'var(--text4)'}}>{l}</span><span style={{fontSize:13,fontWeight:800,color:v>=90?'var(--danger)':v>=70?'#ff9800':'var(--text)'}}>{v}%</span></div><Bar v={v} h={6}/>{s&&<div style={{fontSize:9,color:'var(--text4)',marginTop:3}}>{s}</div>}</div>)}
      </div>}
      {tab==='docker'&&ctrs.map((c,i)=>{const r=c.state==='running';return <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:5,marginBottom:3,background:'var(--bg)',border:`1px solid ${r?'var(--success)22':'var(--border2)'}`,opacity:r?1:.6}}>
        <span style={{fontSize:10,color:r?'var(--success)':'var(--text4)'}}>{r?'▶':'■'}</span>
        <span style={{fontSize:11,fontWeight:600,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(c.names||['?'])[0].replace(/^\//,'')}</span>
        <Pill running={r}/>
      </div>;})}
    </div>
  </>;
}

// ── Probe card ────────────────────────────────────────────────
function ProbeCard({result}){
  const d=result.data||{};
  return <div style={{padding:'20px 14px',display:'flex',alignItems:'center',gap:16}}>
    <span style={{fontSize:40}}>{d.ok?'✅':'❌'}</span>
    <div><div style={{fontWeight:800,fontSize:16,color:d.ok?'var(--success)':'var(--danger)'}}>{d.ok?'Online':'Unreachable'}</div><div style={{fontSize:11,color:'var(--text4)',marginTop:3}}>HTTP {d.status||'—'} · {d.ms||'?'}ms response</div></div>
  </div>;
}

const RENDERERS={proxmox:ProxmoxCard, truenas:TrueNASCard, freenas:TrueNASCard, unraid:UnraidCard, probe:ProbeCard};

async function fetchInt(node){
  const cfg=node.properties?._integration; if(!cfg?.url) return null;
  const type=cfg.type||NODE_INT_MAP[node.type]||'probe';
  try{ const json=await apiFetch(`/integrations/${type}`,{method:'POST',body:JSON.stringify(cfg)}); return{nodeId:node.id,type,data:json,ok:json.ok,ts:Date.now()}; }
  catch(e){ return{nodeId:node.id,type,ok:false,error:e.message,ts:Date.now()}; }
}

function StandaloneAdd({onAdd}){
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({title:'',type:'proxmox',url:'',token:'',username:'',password:''});
  const save=()=>{
    if(!form.url||!form.title) return;
    const node={id:'standalone_'+Date.now(),title:form.title,type:form.type==='truenas'?'truenas':form.type==='unraid'?'unraid':form.type==='esxi'?'esxi':form.type==='probe'?'server':'proxmox',
      properties:{_integration:{type:form.type,url:form.url.trim(),token:form.token,username:form.username,password:form.password}},
      mapTitle:'Standalone',mapId:null};
    // Persist to localStorage
    const saved=JSON.parse(localStorage.getItem('nn_standalone_integrations')||'[]');
    const deduped=saved.filter(s=>s.properties._integration.url!==node.properties._integration.url);
    localStorage.setItem('nn_standalone_integrations',JSON.stringify([...deduped,node]));
    onAdd(node); setShow(false); setForm({title:'',type:'proxmox',url:'',token:'',username:'',password:''});
  };
  return <div style={{marginBottom:12}}>
    {!show&&<button onClick={()=>setShow(true)} style={{fontSize:10,padding:'5px 12px',background:'var(--bg3)',border:'1px dashed var(--border)',borderRadius:6,color:'var(--text4)',cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:600}}>＋ Add integration without map</button>}
    {show&&<div style={{background:'var(--bg2)',borderRadius:8,padding:'12px 14px',border:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto auto',gap:8,alignItems:'end'}}>
      <div><div style={{fontSize:9,color:'var(--text4)',marginBottom:3}}>NAME</div><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="My Proxmox" style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',color:'var(--text)',fontSize:11,outline:'none',boxSizing:'border-box'}}/></div>
      <div><div style={{fontSize:9,color:'var(--text4)',marginBottom:3}}>TYPE</div>
        <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',color:'var(--text)',fontSize:11,outline:'none'}}>
          <option value="proxmox">Proxmox VE</option><option value="truenas">TrueNAS</option><option value="unraid">Unraid</option><option value="esxi">ESXi/vCenter</option><option value="probe">HTTP Probe</option>
        </select></div>
      <div><div style={{fontSize:9,color:'var(--text4)',marginBottom:3}}>URL</div><input value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://192.168.x.x:8006" style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',color:'var(--text)',fontSize:11,outline:'none',boxSizing:'border-box'}}/></div>
      <div><div style={{fontSize:9,color:'var(--text4)',marginBottom:3}}>{form.type==='esxi'?'USERNAME':'TOKEN / API KEY'}</div>
        <input value={form.type==='esxi'?form.username:form.token} onChange={e=>setForm(f=>form.type==='esxi'?{...f,username:e.target.value}:{...f,token:e.target.value})} type="password" placeholder={form.type==='esxi'?'admin@vsphere.local':'user@pam!id=uuid'} style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',color:'var(--text)',fontSize:11,outline:'none',boxSizing:'border-box'}}/></div>
      <button onClick={save} style={{padding:'5px 14px',background:'var(--accent2)',border:'none',borderRadius:5,color:'#fff',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'var(--font-ui)',whiteSpace:'nowrap'}}>Add</button>
      <button onClick={()=>setShow(false)} style={{padding:'5px 10px',background:'none',border:'1px solid var(--border)',borderRadius:5,color:'var(--text4)',cursor:'pointer',fontSize:11,fontFamily:'var(--font-ui)'}}>×</button>
    </div>}
  </div>;
}

export default function LiveDashboard({maps}){
  const [nodes,setNodes]=useState([]);
  const [results,setResults]=useState({});
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [lastRefresh,setLastRefresh]=useState(null);
  const [countdown,setCountdown]=useState(0);
  const timerRef=useRef(null), cdRef=useRef(null);

  const loadNodes=useCallback(async()=>{
    setLoading(true);
    try{ const all=await Promise.all(maps.map(m=>apiFetch(`/maps/${m.id}`).catch(()=>null)));
      const raw=all.flatMap(d=>{ if(!d?.nodes) return []; return d.nodes.filter(n=>n.properties?._integration?.url).map(n=>({...n,mapTitle:maps.find(m=>m.id===d.map?.id)?.title||'Map',mapId:d.map?.id})); });
      // Deduplicate by integration URL — keep first occurrence
      const seen=new Set(); const deduped=raw.filter(n=>{ const url=n.properties._integration?.url; if(seen.has(url)) return false; seen.add(url); return true; });
      // Merge standalone integrations from localStorage
      const standalone=JSON.parse(localStorage.getItem('nn_standalone_integrations')||'[]');
      const allNodes=[...deduped];
      for(const s of standalone){ if(!allNodes.some(n=>n.properties._integration?.url===s.properties._integration?.url)) allNodes.push(s); }
      setNodes(allNodes);
    }finally{ setLoading(false); }
  },[maps]);

  const refresh=useCallback(async(silent=false)=>{
    if(!silent) setRefreshing(true);
    const all=await Promise.allSettled(nodes.map(n=>fetchInt(n)));
    const map={}; all.forEach((r,i)=>{ if(r.status==='fulfilled'&&r.value) map[nodes[i].id]=r.value; });
    setResults(map); setLastRefresh(new Date()); setCountdown(REFRESH_MS/1000);
    if(!silent) setRefreshing(false);
  },[nodes]);

  useEffect(()=>{ loadNodes(); },[maps]);
  useEffect(()=>{ if(nodes.length>0) refresh(); },[nodes]);
  useEffect(()=>{ clearInterval(timerRef.current); if(nodes.length>0) timerRef.current=setInterval(()=>refresh(true),REFRESH_MS); return()=>clearInterval(timerRef.current); },[refresh]);
  useEffect(()=>{ clearInterval(cdRef.current); if(lastRefresh) cdRef.current=setInterval(()=>setCountdown(c=>Math.max(0,c-1)),1000); return()=>clearInterval(cdRef.current); },[lastRefresh]);

  if(loading) return <div data-ui="live-dashboard" data-component="LiveDashboard" data-page="dashboard" data-role="panel" style={{padding:'60px 0',textAlign:'center',color:'var(--text4)'}}><div style={{fontSize:28,marginBottom:8}}>⏳</div>Loading integrations…</div>;
  if(nodes.length===0) return <div style={{padding:'60px 0',textAlign:'center',color:'var(--text4)'}}>
    <div style={{fontSize:40,marginBottom:12}}>🔌</div>
    <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:6}}>No live integrations yet</div>
    <div style={{fontSize:11,maxWidth:320,margin:'0 auto',lineHeight:1.7}}>Open any node → <strong>📡 Live</strong> tab → configure credentials → Save.</div>
  </div>;

  const online=Object.values(results).filter(r=>r?.ok).length, offline=Object.values(results).filter(r=>r&&!r.ok).length;

  return <div>
    {/* Compact summary bar */}
    <div style={{display:'flex',alignItems:'center',gap:14,padding:'8px 12px',background:'var(--bg3)',borderRadius:8,marginBottom:14,border:'1px solid var(--border)'}}>
      <span style={{fontSize:11,color:'var(--success)',fontWeight:700}}>● {online} online</span>
      {offline>0&&<span style={{fontSize:11,color:'var(--danger)',fontWeight:700}}>● {offline} offline</span>}
      <span style={{fontSize:11,color:'var(--text4)'}}>📡 {nodes.length} integration{nodes.length!==1?'s':''}</span>
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
        {lastRefresh&&<span style={{fontSize:9,color:'var(--text4)'}}>↻{countdown}s</span>}
        <button onClick={()=>refresh()} disabled={refreshing} style={{fontSize:10,background:refreshing?'var(--bg3)':'var(--accent2)',border:'none',borderRadius:5,color:refreshing?'var(--text4)':'#fff',cursor:refreshing?'default':'pointer',padding:'4px 12px',fontFamily:'var(--font-ui)',fontWeight:700}}>{refreshing?'…':'🔄 Refresh'}</button>
      </div>
    </div>

    <StandaloneAdd onAdd={node=>{setNodes(prev=>{const url=node.properties._integration?.url;if(prev.some(n=>n.properties._integration?.url===url)) return prev;return [...prev,node];});}}/>
    {/* Cards */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:12}}>
      {nodes.map(node=>{
        const cfg=node.properties._integration, result=results[node.id];
        const type=cfg.type||NODE_INT_MAP[node.type]||'probe', Renderer=RENDERERS[type];
        const color=TYPE_COLOR[type]||'var(--accent2)', isOnline=result?.ok;
        return <div key={node.id} style={{background:'var(--bg2)',borderRadius:8,overflow:'hidden',border:`1px solid ${isOnline?color+'44':result?'var(--danger)33':'var(--border)'}`,borderLeft:`3px solid ${isOnline?color:result?'var(--danger)':'var(--border)'}`,boxShadow:'var(--nEx,2px 2px 5px var(--neu-shadow),-2px -2px 3px var(--neu-hilight))'}}>
          {/* Compact header */}
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderBottom:'1px solid var(--border2)'}}>
            <span style={{width:7,height:7,borderRadius:'50%',flexShrink:0,background:isOnline?'var(--success)':result?'var(--danger)':'var(--text4)',boxShadow:isOnline?'0 0 5px var(--success)':'none'}}/>
            <span style={{fontSize:13,fontWeight:800,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{node.title}</span>
            <span style={{fontSize:9,padding:'1px 6px',borderRadius:8,fontWeight:700,background:color+'22',color,border:`1px solid ${color}33`}}>{TYPE_LABEL[type]||type}</span>
            <span style={{fontSize:9,color:'var(--text4)'}}>{cfg.url?.replace(/^https?:\/\//,'').split('/')[0]}</span>
            <span style={{fontSize:9,fontWeight:700,color:isOnline?'var(--success)':result?'var(--danger)':'var(--text4)',minWidth:40,textAlign:'right'}}>{isOnline?'online':result?'offline':'…'}</span>
          </div>
          {!result&&<div style={{padding:'20px',fontSize:11,color:'var(--text4)',fontStyle:'italic',textAlign:'center'}}>Connecting…</div>}
          {result?.error&&<div style={{margin:'10px',fontSize:10,color:'var(--danger)',padding:'6px 8px',background:'var(--danger)11',borderRadius:5}}>⚠ {result.error}</div>}
          {result?.ok&&Renderer&&<Renderer result={result} color={color}/>}
          <div style={{display:'flex',alignItems:'center',padding:'2px 10px 4px',borderTop:'1px solid var(--border2)'}}>
            {node.mapId===null&&<button onClick={()=>{const saved=JSON.parse(localStorage.getItem('nn_standalone_integrations')||'[]');localStorage.setItem('nn_standalone_integrations',JSON.stringify(saved.filter(s=>s.properties._integration.url!==cfg.url)));setNodes(prev=>prev.filter(n=>n.id!==node.id));}} style={{fontSize:9,background:'none',border:'none',color:'var(--danger)',cursor:'pointer',padding:0,fontFamily:'var(--font-ui)'}}>✕ Remove</button>}
            <span style={{fontSize:8,color:'var(--text4)',marginLeft:'auto'}}>{node.mapId===null?'standalone · ':'map: '+node.mapTitle+' · '}{result?.ts?new Date(result.ts).toLocaleTimeString():''}</span>
          </div>
        </div>;
      })}
    </div>
  </div>;
}
