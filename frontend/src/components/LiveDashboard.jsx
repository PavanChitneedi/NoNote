import { useState, useEffect, useRef, useCallback } from 'react';
import { NODE_INT_MAP, fmt, gb, pct } from './IntegrationPanel.jsx';
import { apiFetch } from '../api/client.js';

const REFRESH_MS = 30000;

function uptime(s){if(!s)return'—';const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);return d>0?`${d}d ${h}h`:h>0?`${h}h ${m}m`:`${m}m`;}

function Bar({v,h=5}){
  const col=v>=90?'var(--danger)':v>=70?'#ff9800':'var(--success)';
  return(
    <div style={{height:h,background:'var(--border2)',borderRadius:h,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${Math.min(v,100)}%`,background:col,borderRadius:h,transition:'width .4s'}}/>
    </div>
  );
}

function MetricBox({label,value,sub,pct:p}){
  const col=p>=90?'var(--danger)':p>=70?'#ff9800':'var(--text)';
  return(
    <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)'}}>
      <div style={{fontSize:9,color:'var(--text4)',marginBottom:4,fontWeight:700,letterSpacing:.5}}>{label}</div>
      <div style={{fontSize:16,fontWeight:800,color:col,lineHeight:1,marginBottom:4}}>{value}</div>
      {sub&&<div style={{fontSize:9,color:'var(--text4)',marginBottom:4}}>{sub}</div>}
      {p!=null&&<Bar v={p}/>}
    </div>
  );
}

function StatusPill({running}){
  return(
    <span style={{fontSize:9,padding:'2px 7px',borderRadius:10,fontWeight:700,flexShrink:0,
      background:running?'var(--success)22':'var(--bg)',
      color:running?'var(--success)':'var(--text4)',
      border:`1px solid ${running?'var(--success)44':'var(--border)'}`}}>
      {running?'● running':'■ stopped'}
    </span>
  );
}

function TypeBadge({type,isVM}){
  return(
    <span style={{fontSize:9,padding:'2px 6px',borderRadius:4,fontWeight:700,flexShrink:0,
      background:isVM?'#8E24AA22':'var(--accent2)22',
      color:isVM?'#CE93D8':'var(--accent2)',
      border:`1px solid ${isVM?'#8E24AA44':'var(--accent2)44'}`}}>
      {type}
    </span>
  );
}

function GuestRow({g}){
  const cpuPct=Math.round((g.cpu||0)*100);
  const memPct=pct(g.mem,g.maxmem);
  const running=g.status==='running';
  const isVM=g._type==='VM';
  return(
    <div style={{padding:'8px 10px',borderRadius:7,marginBottom:4,
      background:'var(--bg)',border:`1px solid ${running?'var(--success)33':'var(--border2)'}`,
      opacity:running?1:.65}}>
      {/* Row 1: type + name + status */}
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
        <TypeBadge type={g._type} isVM={isVM}/>
        <span style={{fontSize:12,fontWeight:700,color:'var(--text)',flex:1,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {g.name||`${g._type}${g.vmid}`}
        </span>
        <StatusPill running={running}/>
      </div>
      {/* Row 2: meta */}
      <div style={{fontSize:9,color:'var(--text4)',marginBottom:8}}>
        ID {g.vmid} · {g.cpus||'?'} vCPU · {fmt(g.maxmem)} RAM · up {uptime(g.uptime)}
      </div>
      {/* Row 3: metrics */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{fontSize:9,color:'var(--text4)'}}>CPU</span>
            <span style={{fontSize:10,fontWeight:700,color:cpuPct>=90?'var(--danger)':cpuPct>=70?'#ff9800':'var(--text)'}}>{cpuPct}%</span>
          </div>
          <Bar v={cpuPct}/>
        </div>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{fontSize:9,color:'var(--text4)'}}>RAM</span>
            <span style={{fontSize:10,fontWeight:700,color:memPct>=90?'var(--danger)':memPct>=70?'#ff9800':'var(--text)'}}>{memPct}% <span style={{fontWeight:400,fontSize:8,color:'var(--text4)'}}>{gb(g.mem)}</span></span>
          </div>
          <Bar v={memPct}/>
        </div>
      </div>
      {g.maxdisk>0&&<div style={{fontSize:9,color:'var(--text4)',marginTop:5}}>💾 {fmt(g.disk)} / {fmt(g.maxdisk)}</div>}
    </div>
  );
}

// ── Proxmox compact summary ─────────────────────────────────
function ProxmoxSummary({data}){
  const s=data.nodes?.[0]?.status||{};
  const cpuPct=Math.round((s.cpu||0)*100);
  const memPct=pct(s.memory?.used,s.memory?.total);
  const diskPct=pct(s.rootfs?.used,s.rootfs?.total);
  const runVMs=data.nodes?.reduce((a,n)=>a+n.vms.filter(v=>v.status==='running').length,0)||0;
  const runCT=data.nodes?.reduce((a,n)=>a+n.lxc.filter(v=>v.status==='running').length,0)||0;
  const totalVMs=data.nodes?.reduce((a,n)=>a+n.vms.length,0)||0;
  const totalCT=data.nodes?.reduce((a,n)=>a+n.lxc.length,0)||0;
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
        <MetricBox label="CPU" value={`${cpuPct}%`} sub={`${s.cpuinfo?.cores||'?'} cores`} pct={cpuPct}/>
        <MetricBox label="RAM" value={`${memPct}%`} sub={`${gb(s.memory?.used)} / ${gb(s.memory?.total)}`} pct={memPct}/>
        <MetricBox label="DISK" value={`${diskPct}%`} sub={`${fmt(s.rootfs?.used)} / ${fmt(s.rootfs?.total)}`} pct={diskPct}/>
      </div>
      <div style={{display:'flex',gap:8}}>
        <div style={{flex:1,background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)',textAlign:'center'}}>
          <div style={{fontSize:20,fontWeight:800,color:'var(--text)'}}>{runVMs}<span style={{fontSize:11,fontWeight:400,color:'var(--text4)'}}>/{totalVMs}</span></div>
          <div style={{fontSize:9,color:'var(--text4)'}}>VMs running</div>
        </div>
        <div style={{flex:1,background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)',textAlign:'center'}}>
          <div style={{fontSize:20,fontWeight:800,color:'var(--accent2)'}}>{runCT}<span style={{fontSize:11,fontWeight:400,color:'var(--text4)'}}>/{totalCT}</span></div>
          <div style={{fontSize:9,color:'var(--text4)'}}>CTs running</div>
        </div>
        <div style={{flex:1,background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)',textAlign:'center'}}>
          <div style={{fontSize:20,fontWeight:800,color:'var(--text)'}}>{data.nodes?.length||0}</div>
          <div style={{fontSize:9,color:'var(--text4)'}}>Nodes</div>
        </div>
      </div>
    </div>
  );
}

// ── Proxmox expanded detail ─────────────────────────────────
function ProxmoxDetail({data}){
  const [filter,setFilter]=useState('all');
  const allGuests=data.nodes?.flatMap(n=>[...(n.vms||[]).map(v=>({...v,_type:'VM'})),...(n.lxc||[]).map(v=>({...v,_type:'CT'}))])||[];
  const activeStorage=data.nodes?.flatMap(n=>(n.storage||[]).filter(s=>s.active&&s.total>0))||[];
  const filtered=allGuests.filter(g=>filter==='all'||(filter==='vm'&&g._type==='VM')||(filter==='ct'&&g._type==='CT')||(filter==='stopped'&&g.status!=='running'));
  const runVMs=allGuests.filter(g=>g._type==='VM'&&g.status==='running').length;
  const runCT=allGuests.filter(g=>g._type==='CT'&&g.status==='running').length;
  return(
    <div>
      {/* Per-node host metrics */}
      {data.nodes?.map(n=>{
        const s=n.status||{};
        const cpuPct=Math.round((s.cpu||0)*100);
        const memPct=pct(s.memory?.used,s.memory?.total);
        const diskPct=pct(s.rootfs?.used,s.rootfs?.total);
        return(
          <div key={n.node} style={{marginBottom:12,padding:'10px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:n.online?'var(--success)':'var(--danger)',flexShrink:0}}/>
              <span style={{fontWeight:700,fontSize:12,color:'var(--text)'}}>{n.node}</span>
              <span style={{fontSize:9,color:'var(--text4)'}}>· {s.cpuinfo?.model||''} · up {uptime(s.uptime)}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
              {[{l:`CPU (${s.cpuinfo?.cores||'?'}c)`,v:cpuPct,sub:`${cpuPct}%`},
                {l:'RAM',v:memPct,sub:`${gb(s.memory?.used)} / ${gb(s.memory?.total)}`},
                {l:'Root Disk',v:diskPct,sub:`${fmt(s.rootfs?.used)} / ${fmt(s.rootfs?.total)}`}
              ].map(({l,v,sub})=>(
                <div key={l}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:9,color:'var(--text4)'}}>{l}</span>
                    <span style={{fontSize:10,fontWeight:700,color:v>=90?'var(--danger)':v>=70?'#ff9800':'var(--text)'}}>{v}%</span>
                  </div>
                  <Bar v={v}/><div style={{fontSize:9,color:'var(--text4)',marginTop:2}}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {/* Storage */}
      {activeStorage.length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginBottom:6}}>STORAGE POOLS</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:6}}>
            {activeStorage.map(st=>{const sp=pct(st.disk_used,st.total);return(
              <div key={st.storage} style={{background:'var(--bg)',borderRadius:6,padding:'8px',border:'1px solid var(--border2)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:64}}>{st.storage}</span>
                  <span style={{fontSize:10,fontWeight:700,color:sp>=85?'var(--danger)':sp>=70?'#ff9800':'var(--success)'}}>{sp}%</span>
                </div>
                <Bar v={sp} h={4}/>
                <div style={{fontSize:8,color:'var(--text4)',marginTop:4}}>{fmt(st.disk_used)} / {fmt(st.total)}</div>
              </div>
            );})}
          </div>
        </div>
      )}
      {/* Guests */}
      {allGuests.length>0&&(
        <div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,flexWrap:'wrap'}}>
            <span style={{fontSize:9,fontWeight:700,color:'var(--text4)',letterSpacing:1.5}}>GUESTS</span>
            {[['all',`All (${allGuests.length})`],['vm',`VM (${runVMs}/${allGuests.filter(g=>g._type==='VM').length})`],['ct',`CT (${runCT}/${allGuests.filter(g=>g._type==='CT').length})`],['stopped','Stopped']].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)}
                style={{fontSize:9,padding:'3px 9px',border:'none',borderRadius:10,cursor:'pointer',
                  fontFamily:'var(--font-ui)',fontWeight:600,
                  background:filter===v?'var(--accent2)':'var(--bg3)',
                  color:filter===v?'#fff':'var(--text4)'}}>
                {l}
              </button>
            ))}
          </div>
          {filtered.map(g=><GuestRow key={`${g._type}${g.vmid}`} g={g}/>)}
        </div>
      )}
    </div>
  );
}

// ── TrueNAS ──────────────────────────────────────────────────
function TrueNASSummary({data}){
  const pools=data.pools||[];
  const usedCap=pools.reduce((a,p)=>a+(p.size?.allocated||0),0);
  const totalCap=pools.reduce((a,p)=>a+(p.size?.total||0),0);
  const diskPct=pct(usedCap,totalCap);
  const running=(data.services||[]).filter(s=>s.state==='RUNNING');
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
        <MetricBox label="STORAGE USED" value={`${diskPct}%`} sub={`${fmt(usedCap)} / ${fmt(totalCap)}`} pct={diskPct}/>
        <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)'}}>
          <div style={{fontSize:9,color:'var(--text4)',marginBottom:4,fontWeight:700}}>SERVICES</div>
          <div style={{fontSize:20,fontWeight:800,color:'var(--success)'}}>{running.length}<span style={{fontSize:11,fontWeight:400,color:'var(--text4)'}}>/{data.services?.length||0}</span></div>
          <div style={{fontSize:9,color:'var(--text4)'}}>running</div>
        </div>
      </div>
      {(data.alerts||[]).length>0&&(
        <div style={{padding:'6px 8px',background:'var(--danger)11',border:'1px solid var(--danger)33',borderRadius:6,fontSize:10,color:'var(--danger)'}}>
          ⚠ {data.alerts.length} alert{data.alerts.length>1?'s':''}
        </div>
      )}
    </div>
  );
}

function TrueNASDetail({data}){
  const info=data.info||{};
  const pools=data.pools||[];
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
        <MetricBox label="HOSTNAME" value={info.hostname||'—'}/>
        <MetricBox label="VERSION" value={(info.version||'').split('-')[0]||'—'}/>
        <MetricBox label="UPTIME" value={info.uptimeSeconds?Math.floor(info.uptimeSeconds/86400)+'d':'—'}/>
      </div>
      <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginBottom:6}}>POOLS</div>
      {pools.map(p=>{const sp=pct(p.size?.allocated,p.size?.total);return(
        <div key={p.name} style={{background:'var(--bg)',borderRadius:7,padding:'10px',marginBottom:6,border:`1px solid ${p.healthy?'var(--success)33':'var(--danger)33'}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{fontWeight:700,fontSize:12,color:'var(--text)',flex:1}}>{p.name}</span>
            <span style={{fontSize:9,color:p.healthy?'var(--success)':'var(--danger)',fontWeight:700}}>{p.status}</span>
            <span style={{fontSize:9,color:'var(--text4)'}}>{sp}%</span>
          </div>
          <Bar v={sp}/>
          <div style={{fontSize:9,color:'var(--text4)',marginTop:4}}>{fmt(p.size?.allocated)} / {fmt(p.size?.total)}</div>
        </div>
      );})}
      {(data.services||[]).length>0&&(
        <div style={{marginTop:8}}>
          <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginBottom:6}}>SERVICES</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {data.services.map(s=>(
              <span key={s.service} style={{fontSize:9,padding:'2px 8px',borderRadius:10,fontWeight:600,
                background:s.state==='RUNNING'?'var(--success)22':'var(--bg)',
                color:s.state==='RUNNING'?'var(--success)':'var(--text4)',
                border:`1px solid ${s.state==='RUNNING'?'var(--success)44':'var(--border)'}`}}>
                {s.service}
              </span>
            ))}
          </div>
        </div>
      )}
      {(data.alerts||[]).map((a,i)=>(
        <div key={i} style={{marginTop:4,padding:'6px 8px',background:'var(--danger)11',borderRadius:5,fontSize:10,color:'var(--danger)'}}>⚠ {a.formatted||a.text}</div>
      ))}
    </div>
  );
}

// ── Unraid ───────────────────────────────────────────────────
function UnraidSummary({data}){
  const sys=data.data?.system||{};
  const mem=sys.memory||{};
  const cpuPct=Math.round(sys.cpu?.usage||0);
  const memPct=pct(mem.total-mem.free,mem.total);
  const containers=data.data?.docker?.containers||[];
  const running=containers.filter(c=>c.state==='running');
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
        <MetricBox label="CPU" value={`${cpuPct}%`} pct={cpuPct}/>
        <MetricBox label="RAM" value={`${memPct}%`} sub={`${gb(mem.total-mem.free)} / ${gb(mem.total)}`} pct={memPct}/>
        <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 10px',border:'1px solid var(--border2)',textAlign:'center'}}>
          <div style={{fontSize:9,color:'var(--text4)',marginBottom:4,fontWeight:700}}>CONTAINERS</div>
          <div style={{fontSize:20,fontWeight:800,color:'var(--success)'}}>{running.length}<span style={{fontSize:11,color:'var(--text4)',fontWeight:400}}>/{containers.length}</span></div>
        </div>
      </div>
    </div>
  );
}

function UnraidDetail({data}){
  const containers=data.data?.docker?.containers||[];
  return(
    <div>
      <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginBottom:8}}>CONTAINERS</div>
      {containers.map((c,i)=>{
        const running=c.state==='running';
        return(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,marginBottom:4,
            background:'var(--bg)',border:`1px solid ${running?'var(--success)33':'var(--border2)'}`,opacity:running?1:.65}}>
            <span style={{fontSize:11,color:running?'var(--success)':'var(--text4)'}}>{running?'▶':'■'}</span>
            <span style={{fontSize:11,fontWeight:600,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {(c.names||['?'])[0].replace(/^\//,'')}
            </span>
            <StatusPill running={running}/>
          </div>
        );
      })}
    </div>
  );
}

// ── Probe ────────────────────────────────────────────────────
function ProbeSummary({data}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      <span style={{fontSize:32}}>{data.ok?'✅':'❌'}</span>
      <div>
        <div style={{fontWeight:800,fontSize:14,color:data.ok?'var(--success)':'var(--danger)'}}>{data.ok?'Online':'Unreachable'}</div>
        <div style={{fontSize:10,color:'var(--text4)'}}>HTTP {data.status||'—'} · {data.ms||'?'}ms</div>
      </div>
    </div>
  );
}

const SUMMARY={proxmox:ProxmoxSummary,truenas:TrueNASSummary,freenas:TrueNASSummary,unraid:UnraidSummary,probe:ProbeSummary};
const DETAIL={proxmox:ProxmoxDetail,truenas:TrueNASDetail,freenas:TrueNASDetail,unraid:UnraidDetail};
const TYPE_COLOR={proxmox:'var(--accent2)',truenas:'#0095D5',unraid:'#E67C1C',esxi:'#717CBD',probe:'var(--text3)',freenas:'#1565C0'};
const TYPE_LABEL={proxmox:'Proxmox VE',truenas:'TrueNAS',unraid:'Unraid',esxi:'ESXi',probe:'HTTP Probe',freenas:'FreeNAS'};

async function fetchInt(node){
  const cfg=node.properties?._integration;
  if(!cfg?.url) return null;
  const type=cfg.type||NODE_INT_MAP[node.type]||'probe';
  try{
    const json=await apiFetch(`/integrations/${type}`,{method:'POST',body:JSON.stringify(cfg)});
    return{nodeId:node.id,type,data:json,ok:json.ok,ts:Date.now()};
  }catch(e){return{nodeId:node.id,type,ok:false,error:e.message,ts:Date.now()};}
}

// ── Main ─────────────────────────────────────────────────────
export default function LiveDashboard({maps}){
  const [nodes,setNodes]=useState([]);
  const [results,setResults]=useState({});
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [lastRefresh,setLastRefresh]=useState(null);
  const [countdown,setCountdown]=useState(0);
  const [expanded,setExpanded]=useState({});
  const timerRef=useRef(null);
  const cdRef=useRef(null);

  const loadNodes=useCallback(async()=>{
    setLoading(true);
    try{
      const all=await Promise.all(maps.map(m=>apiFetch(`/maps/${m.id}`).catch(()=>null)));
      const intNodes=all.flatMap(d=>{
        if(!d?.nodes) return [];
        return d.nodes.filter(n=>n.properties?._integration?.url)
          .map(n=>({...n,mapTitle:maps.find(m=>m.id===d.map?.id)?.title||'Map',mapId:d.map?.id}));
      });
      setNodes(intNodes);
    }finally{setLoading(false);}
  },[maps]);

  const refresh=useCallback(async(silent=false)=>{
    if(!silent) setRefreshing(true);
    const all=await Promise.allSettled(nodes.map(n=>fetchInt(n)));
    const map={};
    all.forEach((r,i)=>{if(r.status==='fulfilled'&&r.value) map[nodes[i].id]=r.value;});
    setResults(map);
    setLastRefresh(new Date());
    setCountdown(REFRESH_MS/1000);
    if(!silent) setRefreshing(false);
  },[nodes]);

  useEffect(()=>{loadNodes();},[maps]);
  useEffect(()=>{if(nodes.length>0) refresh();},[nodes]);
  useEffect(()=>{
    clearInterval(timerRef.current);
    if(nodes.length>0) timerRef.current=setInterval(()=>refresh(true),REFRESH_MS);
    return()=>clearInterval(timerRef.current);
  },[refresh]);
  useEffect(()=>{
    clearInterval(cdRef.current);
    if(lastRefresh) cdRef.current=setInterval(()=>setCountdown(c=>Math.max(0,c-1)),1000);
    return()=>clearInterval(cdRef.current);
  },[lastRefresh]);

  if(loading) return <div style={{padding:'60px 20px',textAlign:'center',color:'var(--text4)'}}><div style={{fontSize:32,marginBottom:12}}>⏳</div>Loading integrations…</div>;
  if(nodes.length===0) return(
    <div style={{padding:'60px 20px',textAlign:'center',color:'var(--text4)'}}>
      <div style={{fontSize:48,marginBottom:16}}>🔌</div>
      <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:8}}>No live integrations yet</div>
      <div style={{fontSize:12,maxWidth:360,margin:'0 auto',lineHeight:1.7}}>
        Open any node → <strong>📡 Live</strong> tab → configure credentials → Save.
      </div>
    </div>
  );

  const online=Object.values(results).filter(r=>r?.ok).length;
  const offline=Object.values(results).filter(r=>r&&!r.ok).length;

  return(
    <div>
      {/* Summary bar */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
        background:'var(--bg3)',borderRadius:10,marginBottom:20,border:'1px solid var(--border)',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:16,flex:1,flexWrap:'wrap'}}>
          <span style={{fontSize:11}}><span style={{color:'var(--success)',fontWeight:700}}>● {online}</span> <span style={{color:'var(--text4)'}}>online</span></span>
          {offline>0&&<span style={{fontSize:11}}><span style={{color:'var(--danger)',fontWeight:700}}>● {offline}</span> <span style={{color:'var(--text4)'}}>offline</span></span>}
          <span style={{fontSize:11,color:'var(--text4)'}}>📡 {nodes.length} integration{nodes.length!==1?'s':''}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {lastRefresh&&<span style={{fontSize:9,color:'var(--text4)'}}>↻ {countdown}s · {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={()=>refresh()} disabled={refreshing}
            style={{fontSize:10,background:refreshing?'var(--bg3)':'var(--accent2)',border:'none',
              borderRadius:6,color:refreshing?'var(--text4)':'#fff',cursor:refreshing?'default':'pointer',
              padding:'5px 14px',fontFamily:'var(--font-ui)',fontWeight:700}}>
            {refreshing?'⏳ Refreshing…':'🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14,alignItems:'start'}}>
        {nodes.map(node=>{
          const cfg=node.properties._integration;
          const result=results[node.id];
          const type=cfg.type||NODE_INT_MAP[node.type]||'probe';
          const SummaryComp=SUMMARY[type];
          const DetailComp=DETAIL[type];
          const color=TYPE_COLOR[type]||'var(--accent2)';
          const isOnline=result?.ok;
          const isExp=expanded[node.id];
          return(
            <div key={node.id} style={{background:'var(--bg2)',border:`1px solid ${isOnline?color+'55':result?'var(--danger)44':'var(--border)'}`,
              borderRadius:10,overflow:'hidden',borderTop:`3px solid ${isOnline?color:'var(--border)'}`,
              boxShadow:'0 2px 12px rgba(0,0,0,.15)'}}>
              {/* Card header */}
              <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border2)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
                    background:isOnline?'var(--success)':result?'var(--danger)':'var(--text4)',
                    boxShadow:isOnline?'0 0 6px var(--success)':'none'}}/>
                  <span style={{fontSize:13,fontWeight:800,color:'var(--text)',flex:1,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{node.title}</span>
                  <span style={{fontSize:9,padding:'2px 7px',borderRadius:10,fontWeight:700,
                    background:color+'22',color,border:`1px solid ${color}44`}}>
                    {TYPE_LABEL[type]||type}
                  </span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:9,color:'var(--text4)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {cfg.url?.replace(/^https?:\/\//,'').split('/')[0]} · {node.mapTitle}
                  </span>
                  <span style={{fontSize:9,fontWeight:700,
                    color:isOnline?'var(--success)':result?'var(--danger)':'var(--text4)'}}>
                    {isOnline?'● online':result?'● offline':'○ pending'}
                  </span>
                </div>
              </div>
              {/* Card body */}
              <div style={{padding:'12px 14px'}}>
                {!result&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic'}}>Connecting…</div>}
                {result?.error&&<div style={{fontSize:10,color:'var(--danger)',padding:'6px 8px',background:'var(--danger)11',borderRadius:5,border:'1px solid var(--danger)33'}}>⚠ {result.error}</div>}
                {result?.ok&&SummaryComp&&<SummaryComp data={result.data}/>}
                {result?.ok&&DetailComp&&isExp&&(
                  <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border2)'}}>
                    <DetailComp data={result.data}/>
                  </div>
                )}
              </div>
              {/* Expand/collapse footer */}
              {result?.ok&&DetailComp&&(
                <button onClick={()=>setExpanded(e=>({...e,[node.id]:!e[node.id]}))}
                  style={{width:'100%',padding:'8px',background:'var(--bg3)',border:'none',
                    borderTop:'1px solid var(--border2)',color:'var(--text4)',cursor:'pointer',
                    fontSize:10,fontFamily:'var(--font-ui)',fontWeight:600,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                  {isExp?'▲ Show less':'▼ Show details'}
                </button>
              )}
              {result?.ts&&<div style={{fontSize:8,color:'var(--text4)',padding:'2px 14px 6px',textAlign:'right'}}>{new Date(result.ts).toLocaleTimeString()}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
