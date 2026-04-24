import { useState, useEffect, useRef, useCallback } from 'react';
import { NODE_INT_MAP, fmt, gb, pct } from './IntegrationPanel.jsx';
import { apiFetch } from '../api/client.js';

const REFRESH_MS = 30000;
const TYPE_COLOR  = { proxmox:'var(--accent2)', truenas:'#0095D5', unraid:'#E67C1C', esxi:'#717CBD', probe:'var(--text3)', freenas:'#1565C0' };
const TYPE_LABEL  = { proxmox:'Proxmox VE', truenas:'TrueNAS', unraid:'Unraid', esxi:'ESXi', probe:'HTTP Probe', freenas:'FreeNAS' };

function uptime(s){ if(!s) return'—'; const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return d>0?`${d}d ${h}h`:h>0?`${h}h ${m}m`:`${m}m`; }

function Bar({v,h=5}){
  const col=v>=90?'var(--danger)':v>=70?'#ff9800':'var(--success)';
  return <div style={{height:h,background:'var(--border2)',borderRadius:h,overflow:'hidden'}}>
    <div style={{height:'100%',width:`${Math.min(v,100)}%`,background:col,borderRadius:h,transition:'width .4s'}}/>
  </div>;
}
function MetricBox({label,value,sub,pct:p}){
  const col=p>=90?'var(--danger)':p>=70?'#ff9800':'var(--text)';
  return <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)'}}>
    <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,letterSpacing:.5,marginBottom:4}}>{label}</div>
    <div style={{fontSize:16,fontWeight:800,color:col,lineHeight:1,marginBottom:p!=null?4:0}}>{value}</div>
    {sub&&<div style={{fontSize:9,color:'var(--text4)',marginBottom:p!=null?4:0}}>{sub}</div>}
    {p!=null&&<Bar v={p}/>}
  </div>;
}
function StatusPill({running}){
  return <span style={{fontSize:9,padding:'2px 7px',borderRadius:10,fontWeight:700,flexShrink:0,
    background:running?'var(--success)22':'var(--bg3)',color:running?'var(--success)':'var(--text4)',
    border:`1px solid ${running?'var(--success)44':'var(--border)'}`}}>{running?'● running':'■ stopped'}</span>;
}
function CardTabs({tabs,active,onChange,color}){
  return <div style={{display:'flex',borderBottom:'1px solid var(--border2)',background:'var(--bg3)'}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)}
      style={{flex:1,padding:'7px 4px',border:'none',cursor:'pointer',fontSize:10,fontWeight:700,
        fontFamily:'var(--font-ui)',background:active===t.id?'var(--bg2)':'var(--bg3)',
        color:active===t.id?color:'var(--text4)',
        borderBottom:active===t.id?`2px solid ${color}`:'2px solid transparent'}}>{t.label}</button>)}
  </div>;
}
function GuestRow({g}){
  const cpuPct=Math.round((g.cpu||0)*100),memPct=pct(g.mem,g.maxmem),running=g.status==='running',isVM=g._type==='VM';
  return <div style={{padding:'8px 10px',borderRadius:7,marginBottom:5,background:'var(--bg)',
    border:`1px solid ${running?'var(--success)33':'var(--border2)'}`,opacity:running?1:.6}}>
    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
      <span style={{fontSize:9,padding:'2px 5px',borderRadius:4,fontWeight:700,
        background:isVM?'#8E24AA22':'var(--accent2)22',color:isVM?'#CE93D8':'var(--accent2)',
        border:`1px solid ${isVM?'#8E24AA44':'var(--accent2)44'}`}}>{isVM?'VM':'CT'}</span>
      <span style={{fontSize:12,fontWeight:700,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name||`${g._type}${g.vmid}`}</span>
      <StatusPill running={running}/>
    </div>
    <div style={{fontSize:9,color:'var(--text4)',marginBottom:7}}>ID {g.vmid} · {g.cpus||'?'} vCPU · {fmt(g.maxmem)} · up {uptime(g.uptime)}</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
      <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontSize:9,color:'var(--text4)'}}>CPU</span>
        <span style={{fontSize:10,fontWeight:700,color:cpuPct>=90?'var(--danger)':cpuPct>=70?'#ff9800':'var(--text)'}}>{cpuPct}%</span>
      </div><Bar v={cpuPct}/></div>
      <div><div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontSize:9,color:'var(--text4)'}}>RAM</span>
        <span style={{fontSize:10,fontWeight:700,color:memPct>=90?'var(--danger)':memPct>=70?'#ff9800':'var(--text)'}}>{memPct}% <span style={{fontSize:8,fontWeight:400,color:'var(--text4)'}}>{gb(g.mem)}</span></span>
      </div><Bar v={memPct}/></div>
    </div>
    {g.maxdisk>0&&<div style={{fontSize:9,color:'var(--text4)',marginTop:5}}>💾 {fmt(g.disk)} / {fmt(g.maxdisk)}</div>}
  </div>;
}

function ProxmoxCard({node,result,color}){
  const [tab,setTab]=useState('overview');
  const [gf,setGf]=useState('all');
  const d=result?.data||{};
  const all=d.nodes?.flatMap(n=>[...(n.vms||[]).map(v=>({...v,_type:'VM'})),...(n.lxc||[]).map(v=>({...v,_type:'CT'}))])||[];
  const stor=d.nodes?.flatMap(n=>(n.storage||[]).filter(s=>s.active&&s.total>0))||[];
  const rVM=all.filter(g=>g._type==='VM'&&g.status==='running').length, tVM=all.filter(g=>g._type==='VM').length;
  const rCT=all.filter(g=>g._type==='CT'&&g.status==='running').length, tCT=all.filter(g=>g._type==='CT').length;
  const filt=all.filter(g=>gf==='all'||(gf==='vm'&&g._type==='VM')||(gf==='ct'&&g._type==='CT')||(gf==='stopped'&&g.status!=='running'));
  return <><CardTabs tabs={[{id:'overview',label:'📊 Overview'},{id:'guests',label:`🖥 Guests (${all.length})`},{id:'storage',label:`💾 Storage (${stor.length})`}]} active={tab} onChange={setTab} color={color}/>
  <div style={{padding:'10px 14px',overflow:'auto'}}>
    {tab==='overview'&&d.nodes?.map(n=>{const s=n.status||{};const cp=Math.round((s.cpu||0)*100),mp=pct(s.memory?.used,s.memory?.total),dp=pct(s.rootfs?.used,s.rootfs?.total);return <div key={n.node}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:n.online?'var(--success)':'var(--danger)',boxShadow:n.online?'0 0 6px var(--success)':'none'}}/>
        <span style={{fontWeight:700,fontSize:12,color:'var(--text)'}}>{n.node}</span>
        <span style={{fontSize:9,color:'var(--text4)'}}>v{d.version} · up {uptime(s.uptime)}</span>
        <span style={{marginLeft:'auto',fontSize:10,fontWeight:700,color:'var(--text)'}}>{rVM}<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>/{tVM}VM</span></span>
        <span style={{fontSize:10,fontWeight:700,color:'var(--accent2)'}}>{rCT}<span style={{fontSize:9,fontWeight:400,color:'var(--text4)'}}>/{tCT}CT</span></span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        <MetricBox label={`CPU (${s.cpuinfo?.cores||'?'}c)`} value={`${cp}%`} pct={cp}/>
        <MetricBox label="RAM" value={`${mp}%`} sub={`${gb(s.memory?.used)} / ${gb(s.memory?.total)}`} pct={mp}/>
        <MetricBox label="Root Disk" value={`${dp}%`} sub={`${fmt(s.rootfs?.used)} / ${fmt(s.rootfs?.total)}`} pct={dp}/>
      </div>
    </div>;})}
    {tab==='guests'&&<div>
      <div style={{display:'flex',gap:4,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginRight:4}}>FILTER</span>
        {[['all',`All(${all.length})`],['vm',`VM(${rVM}/${tVM})`],['ct',`CT(${rCT}/${tCT})`],['stopped','Stopped']].map(([v,l])=>(
          <button key={v} onClick={()=>setGf(v)} style={{fontSize:9,padding:'3px 9px',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'var(--font-ui)',fontWeight:600,background:gf===v?color:'var(--bg3)',color:gf===v?'#fff':'var(--text4)'}}>{l}</button>
        ))}
      </div>
      {filt.length===0&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic',textAlign:'center',padding:'16px 0'}}>No guests</div>}
      {filt.map(g=><GuestRow key={`${g._type}${g.vmid}`} g={g}/>)}
    </div>}
    {tab==='storage'&&<div>
      {stor.length===0&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic',textAlign:'center',padding:'16px 0'}}>No storage data</div>}
      {stor.map(st=>{const sp=pct(st.disk_used,st.total);return <div key={st.storage} style={{background:'var(--bg)',borderRadius:7,padding:'10px 12px',marginBottom:8,border:'1px solid var(--border2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <span style={{fontWeight:700,fontSize:12,color:'var(--text)'}}>{st.storage}</span>
          <span style={{fontSize:11,fontWeight:700,color:sp>=85?'var(--danger)':sp>=70?'#ff9800':'var(--success)'}}>{sp}%</span>
        </div>
        <Bar v={sp} h={6}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
          <span style={{fontSize:9,color:'var(--text4)'}}>Used {fmt(st.disk_used)}</span>
          <span style={{fontSize:9,color:'var(--text4)'}}>Free {fmt((st.total||0)-(st.disk_used||0))}</span>
          <span style={{fontSize:9,color:'var(--text4)'}}>Total {fmt(st.total)}</span>
        </div>
      </div>;})}
    </div>}
  </div></>;
}

function TrueNASCard({node,result,color}){
  const [tab,setTab]=useState('overview');
  const d=result?.data||{},info=d.info||{},pools=d.pools||[],svcs=d.services||[];
  const run=svcs.filter(s=>s.state==='RUNNING');
  const used=pools.reduce((a,p)=>a+(p.size?.allocated||0),0),total=pools.reduce((a,p)=>a+(p.size?.total||0),0);
  return <><CardTabs tabs={[{id:'overview',label:'📊 Overview'},{id:'pools',label:`💾 Pools (${pools.length})`},{id:'services',label:`⚙ Services (${run.length}/${svcs.length})`}]} active={tab} onChange={setTab} color={color}/>
  <div style={{padding:'12px 14px'}}>
    {tab==='overview'&&<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
        <MetricBox label="HOSTNAME" value={info.hostname||'—'}/>
        <MetricBox label="VERSION" value={(info.version||'').split('-')[0]||'—'}/>
        <MetricBox label="UPTIME" value={info.uptimeSeconds?Math.floor(info.uptimeSeconds/86400)+'d':'—'}/>
      </div>
      <MetricBox label="TOTAL STORAGE" value={`${pct(used,total)}%`} sub={`${fmt(used)} / ${fmt(total)}`} pct={pct(used,total)}/>
      {(d.alerts||[]).length>0&&<div style={{marginTop:8,padding:'6px 8px',background:'var(--danger)11',border:'1px solid var(--danger)33',borderRadius:6,fontSize:10,color:'var(--danger)',fontWeight:700}}>⚠ {d.alerts.length} alert{d.alerts.length>1?'s':''}</div>}
    </div>}
    {tab==='pools'&&pools.map(p=>{const sp=pct(p.size?.allocated,p.size?.total);return <div key={p.name} style={{background:'var(--bg)',borderRadius:7,padding:'10px 12px',marginBottom:8,border:`1px solid ${p.healthy?'var(--success)33':'var(--danger)33'}`}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
        <span style={{fontWeight:700,fontSize:12,color:'var(--text)',flex:1}}>{p.name}</span>
        <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:10,background:p.healthy?'var(--success)22':'var(--danger)22',color:p.healthy?'var(--success)':'var(--danger)'}}>{p.status}</span>
        <span style={{fontSize:11,fontWeight:700,color:sp>=85?'var(--danger)':sp>=70?'#ff9800':'var(--success)'}}>{sp}%</span>
      </div>
      <Bar v={sp} h={6}/>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
        <span style={{fontSize:9,color:'var(--text4)'}}>Used {fmt(p.size?.allocated)}</span>
        <span style={{fontSize:9,color:'var(--text4)'}}>Free {fmt((p.size?.total||0)-(p.size?.allocated||0))}</span>
        <span style={{fontSize:9,color:'var(--text4)'}}>Total {fmt(p.size?.total)}</span>
      </div>
    </div>;})}
    {tab==='services'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
      {svcs.map(s=><div key={s.service} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 10px',borderRadius:6,background:'var(--bg)',border:`1px solid ${s.state==='RUNNING'?'var(--success)33':'var(--border2)'}`}}>
        <span style={{fontSize:10,color:s.state==='RUNNING'?'var(--success)':'var(--text4)'}}>{s.state==='RUNNING'?'▶':'■'}</span>
        <span style={{fontSize:11,fontWeight:600,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.service}</span>
      </div>)}
    </div>}
  </div></>;
}

function UnraidCard({node,result,color}){
  const [tab,setTab]=useState('overview');
  const d=result?.data?.data||{},sys=d.system||{},mem=sys.memory||{};
  const cp=Math.round(sys.cpu?.usage||0),mp=pct(mem.total-mem.free,mem.total);
  const ctrs=d.docker?.containers||[],run=ctrs.filter(c=>c.state==='running'),vms=d.vms?.domain||[];
  return <><CardTabs tabs={[{id:'overview',label:'📊 Overview'},{id:'containers',label:`🐳 Docker (${run.length}/${ctrs.length})`},...(vms.length>0?[{id:'vms',label:`🖥 VMs (${vms.length})`}]:[])]} active={tab} onChange={setTab} color={color}/>
  <div style={{padding:'12px 14px'}}>
    {tab==='overview'&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
      <MetricBox label="CPU" value={`${cp}%`} pct={cp}/>
      <MetricBox label="RAM" value={`${mp}%`} sub={`${gb(mem.total-mem.free)} / ${gb(mem.total)}`} pct={mp}/>
      <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)',textAlign:'center'}}>
        <div style={{fontSize:9,color:'var(--text4)',fontWeight:700,letterSpacing:.5,marginBottom:4}}>CONTAINERS</div>
        <div style={{fontSize:22,fontWeight:800,color:'var(--success)',lineHeight:1.2}}>{run.length}<span style={{fontSize:12,color:'var(--text4)',fontWeight:400}}>/{ctrs.length}</span></div>
      </div>
    </div>}
    {tab==='containers'&&ctrs.map((c,i)=>{const r=c.state==='running';return <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:6,marginBottom:4,background:'var(--bg)',border:`1px solid ${r?'var(--success)33':'var(--border2)'}`,opacity:r?1:.65}}>
      <span style={{fontSize:10,color:r?'var(--success)':'var(--text4)'}}>{r?'▶':'■'}</span>
      <span style={{fontSize:11,fontWeight:600,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(c.names||['?'])[0].replace(/^\//,'')}</span>
      <StatusPill running={r}/>
    </div>;})}
    {tab==='vms'&&vms.map((v,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:6,marginBottom:4,background:'var(--bg)',border:`1px solid ${v.state==='running'?'var(--success)33':'var(--border2)'}`}}>
      <span style={{fontSize:10,color:v.state==='running'?'var(--success)':'var(--text4)'}}>{v.state==='running'?'▶':'■'}</span>
      <span style={{fontSize:11,fontWeight:600,color:'var(--text)',flex:1}}>{v.name}</span>
      <StatusPill running={v.state==='running'}/>
    </div>)}
  </div></>;
}

function ProbeCard({node,result}){
  const d=result?.data||{};
  return <div style={{padding:'14px'}}><div style={{display:'flex',alignItems:'center',gap:14}}>
    <span style={{fontSize:36}}>{d.ok?'✅':'❌'}</span>
    <div><div style={{fontWeight:800,fontSize:15,color:d.ok?'var(--success)':'var(--danger)'}}>{d.ok?'Online':'Unreachable'}</div>
    <div style={{fontSize:10,color:'var(--text4)',marginTop:2}}>HTTP {d.status||'—'} · {d.ms||'?'}ms</div></div>
  </div></div>;
}

const CARD_RENDERERS={proxmox:ProxmoxCard,truenas:TrueNASCard,freenas:TrueNASCard,unraid:UnraidCard,probe:ProbeCard};

async function fetchInt(node){
  const cfg=node.properties?._integration; if(!cfg?.url) return null;
  const type=cfg.type||NODE_INT_MAP[node.type]||'probe';
  try{ const json=await apiFetch(`/integrations/${type}`,{method:'POST',body:JSON.stringify(cfg)}); return{nodeId:node.id,type,data:json,ok:json.ok,ts:Date.now()}; }
  catch(e){ return{nodeId:node.id,type,ok:false,error:e.message,ts:Date.now()}; }
}

export default function LiveDashboard({maps}){
  const [nodes,setNodes]=useState([]);
  const [results,setResults]=useState({});
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [lastRefresh,setLastRefresh]=useState(null);
  const [countdown,setCountdown]=useState(0);
  const timerRef=useRef(null),cdRef=useRef(null);

  const loadNodes=useCallback(async()=>{
    setLoading(true);
    try{ const all=await Promise.all(maps.map(m=>apiFetch(`/maps/${m.id}`).catch(()=>null)));
      setNodes(all.flatMap(d=>{ if(!d?.nodes) return []; return d.nodes.filter(n=>n.properties?._integration?.url).map(n=>({...n,mapTitle:maps.find(m=>m.id===d.map?.id)?.title||'Map',mapId:d.map?.id})); }));
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

  if(loading) return <div style={{padding:'60px 20px',textAlign:'center',color:'var(--text4)'}}><div style={{fontSize:32,marginBottom:12}}>⏳</div>Loading…</div>;
  if(nodes.length===0) return <div style={{padding:'60px 20px',textAlign:'center',color:'var(--text4)'}}>
    <div style={{fontSize:48,marginBottom:16}}>🔌</div>
    <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:8}}>No live integrations yet</div>
    <div style={{fontSize:12,maxWidth:340,margin:'0 auto',lineHeight:1.7}}>Open any node → <strong>📡 Live</strong> tab → configure credentials → Save.</div>
  </div>;

  const online=Object.values(results).filter(r=>r?.ok).length, offline=Object.values(results).filter(r=>r&&!r.ok).length;

  return <div>
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'var(--bg3)',borderRadius:10,marginBottom:20,border:'1px solid var(--border)',flexWrap:'wrap'}}>
      <div style={{display:'flex',gap:16,flex:1,flexWrap:'wrap'}}>
        <span style={{fontSize:11}}><span style={{color:'var(--success)',fontWeight:700}}>● {online}</span> <span style={{color:'var(--text4)'}}>online</span></span>
        {offline>0&&<span style={{fontSize:11}}><span style={{color:'var(--danger)',fontWeight:700}}>● {offline}</span> <span style={{color:'var(--text4)'}}>offline</span></span>}
        <span style={{fontSize:11,color:'var(--text4)'}}>📡 {nodes.length} integration{nodes.length!==1?'s':''}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        {lastRefresh&&<span style={{fontSize:9,color:'var(--text4)'}}>↻ {countdown}s · {lastRefresh.toLocaleTimeString()}</span>}
        <button onClick={()=>refresh()} disabled={refreshing} style={{fontSize:10,background:refreshing?'var(--bg3)':'var(--accent2)',border:'none',borderRadius:6,color:refreshing?'var(--text4)':'#fff',cursor:refreshing?'default':'pointer',padding:'5px 14px',fontFamily:'var(--font-ui)',fontWeight:700}}>{refreshing?'⏳ Refreshing…':'🔄 Refresh'}</button>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
      {nodes.map(node=>{
        const cfg=node.properties._integration,result=results[node.id];
        const type=cfg.type||NODE_INT_MAP[node.type]||'probe',Renderer=CARD_RENDERERS[type];
        const color=TYPE_COLOR[type]||'var(--accent2)',isOnline=result?.ok;
        return <div key={node.id} style={{background:'var(--bg2)',borderRadius:10,overflow:'hidden',display:'flex',flexDirection:'column',height:380,
          border:`1px solid ${isOnline?color+'55':result?'var(--danger)44':'var(--border)'}`,
          borderTop:`3px solid ${isOnline?color:'var(--border)'}`,boxShadow:'0 2px 12px rgba(0,0,0,.12)'}}>
          <div style={{padding:'11px 14px',borderBottom:'1px solid var(--border2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
              <span style={{width:8,height:8,borderRadius:'50%',flexShrink:0,background:isOnline?'var(--success)':result?'var(--danger)':'var(--text4)',boxShadow:isOnline?'0 0 6px var(--success)':'none'}}/>
              <span style={{fontSize:13,fontWeight:800,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{node.title}</span>
              <span style={{fontSize:9,padding:'2px 7px',borderRadius:10,fontWeight:700,background:color+'22',color,border:`1px solid ${color}44`}}>{TYPE_LABEL[type]||type}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:9,color:'var(--text4)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cfg.url?.replace(/^https?:\/\//,'').split('/')[0]} · {node.mapTitle}</span>
              <span style={{fontSize:9,fontWeight:700,color:isOnline?'var(--success)':result?'var(--danger)':'var(--text4)'}}>{isOnline?'● online':result?'● offline':'○ …'}</span>
            </div>
          </div>
          {!result&&<div style={{padding:'16px 14px',fontSize:11,color:'var(--text4)',fontStyle:'italic'}}>Connecting…</div>}
          {result?.error&&<div style={{margin:'10px 14px',fontSize:10,color:'var(--danger)',padding:'6px 8px',background:'var(--danger)11',borderRadius:5,border:'1px solid var(--danger)33'}}>⚠ {result.error}</div>}
          <div style={{flex:1,overflow:'auto',minHeight:0}}>{result?.ok&&Renderer&&<Renderer node={node} result={result} color={color}/>}</div>}
          {result?.ts&&<div style={{fontSize:8,color:'var(--text4)',padding:'2px 14px 6px',textAlign:'right'}}>{new Date(result.ts).toLocaleTimeString()}</div>}
        </div>;
      })}
    </div>
  </div>;
}
