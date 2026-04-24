// LiveDashboard.jsx — aggregated live metrics across all maps
import { useState, useEffect, useRef, useCallback } from 'react';
import { NODE_INT_MAP, Bar, fmt, gb, pct } from './IntegrationPanel.jsx';
import { apiFetch } from '../api/client.js';

const REFRESH_MS = 30000;

function uptime(s){if(!s)return'—';const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);return d>0?`${d}d ${h}h`:h>0?`${h}h ${m}m`:`${m}m`;}
function MiniBar({v,h=4}){const col=v>=90?'#f44336':v>=75?'#ff9800':'#4caf50';return<div style={{height:h,background:'rgba(255,255,255,.08)',borderRadius:h,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(v,100)}%`,background:col,borderRadius:h,transition:'width .5s'}}/></div>;}
function Tag({children,color='var(--text4)',bg='var(--bg)'}){return<span style={{fontSize:9,padding:'1px 6px',borderRadius:10,background:bg,color,border:`1px solid ${color}44`,fontWeight:600}}>{children}</span>;}

async function fetchInt(node){
  const cfg=node.properties?._integration;
  if(!cfg?.url) return null;
  const type=cfg.type||NODE_INT_MAP[node.type]||'probe';
  try{
    const json=await apiFetch(`/integrations/${type}`,{method:'POST',body:JSON.stringify(cfg)});
    return{nodeId:node.id,type,data:json,ok:json.ok,ts:Date.now()};
  }catch(e){return{nodeId:node.id,type,ok:false,error:e.message,ts:Date.now()};}
}

// ── Card renderers ─────────────────────────────────────────────
function GuestDashRow({g}){
  const cpuPct=Math.round((g.cpu||0)*100);
  const memPct=pct(g.mem,g.maxmem);
  const running=g.status==='running';
  const isVM=g._type==='VM';
  return(
    <div style={{display:'grid',gridTemplateColumns:'42px 1fr 1fr 1fr',gap:6,alignItems:'center',
      padding:'6px 8px',borderRadius:6,marginBottom:4,
      background:running?'rgba(76,175,80,.06)':'rgba(255,255,255,.03)',
      border:`1px solid ${running?'rgba(76,175,80,.2)':'rgba(255,255,255,.06)'}`}}>
      <div>
        <span style={{fontSize:8,padding:'1px 4px',borderRadius:3,fontWeight:700,
          background:isVM?'#8E24AA33':'#00897B33',
          color:isVM?'#CE93D8':'#80CBC4',display:'block',textAlign:'center',marginBottom:2}}>{isVM?'VM':'CT'}</span>
        <span style={{fontSize:8,color:running?'#81c784':'rgba(255,255,255,.3)',display:'block',textAlign:'center'}}>{running?'●':'■'}</span>
      </div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.9)',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name||`${g._type}${g.vmid}`}</div>
        <div style={{fontSize:8,color:'rgba(255,255,255,.3)'}}>ID {g.vmid} · {g.cpus||'?'}c · {uptime(g.uptime)}</div>
      </div>
      <div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
          <span style={{fontSize:8,color:'rgba(255,255,255,.4)'}}>CPU</span>
          <span style={{fontSize:9,fontWeight:700,color:cpuPct>=90?'#f44336':cpuPct>=75?'#ff9800':'rgba(255,255,255,.7)'}}>{cpuPct}%</span>
        </div>
        <MiniBar v={cpuPct} h={3}/>
      </div>
      <div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
          <span style={{fontSize:8,color:'rgba(255,255,255,.4)'}}>RAM</span>
          <span style={{fontSize:9,fontWeight:700,color:memPct>=90?'#f44336':memPct>=75?'#ff9800':'rgba(255,255,255,.7)'}}>{memPct}%</span>
        </div>
        <MiniBar v={memPct} h={3}/>
        <div style={{fontSize:8,color:'rgba(255,255,255,.25)',marginTop:1}}>{gb(g.mem)}/{gb(g.maxmem)}</div>
      </div>
    </div>
  );
}

function ProxmoxDashCard({node,result}){
  const d=result?.data||{};
  const [filter,setFilter]=useState('all');
  const totalVMs=d.nodes?.reduce((a,n)=>a+n.vms.length,0)||0;
  const runVMs=d.nodes?.reduce((a,n)=>a+n.vms.filter(v=>v.status==='running').length,0)||0;
  const totalCT=d.nodes?.reduce((a,n)=>a+n.lxc.length,0)||0;
  const runCT=d.nodes?.reduce((a,n)=>a+n.lxc.filter(v=>v.status==='running').length,0)||0;
  const allGuests=d.nodes?.flatMap(n=>[...(n.vms||[]).map(v=>({...v,_type:'VM'})),...(n.lxc||[]).map(v=>({...v,_type:'CT'}))])||[];
  const filtered=allGuests.filter(g=>filter==='all'||(filter==='vm'&&g._type==='VM')||(filter==='ct'&&g._type==='CT')||(filter==='stopped'&&g.status!=='running'));
  const activeStorage=d.nodes?.flatMap(n=>(n.storage||[]).filter(s=>s.active&&s.total>0))||[];
  return(
    <div>
      {/* Summary tags */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
        <Tag color='#CE93D8' bg='#8E24AA22'>{runVMs}/{totalVMs} VMs</Tag>
        <Tag color='#80CBC4' bg='#00897B22'>{runCT}/{totalCT} CTs</Tag>
        <Tag color='rgba(255,255,255,.3)'>v{d.version}</Tag>
      </div>
      {/* Host metrics */}
      {d.nodes?.map(n=>{
        const s=n.status||{};
        const cpuPct=Math.round((s.cpu||0)*100);
        const memPct=pct(s.memory?.used,s.memory?.total);
        const diskPct=pct(s.rootfs?.used,s.rootfs?.total);
        return(
          <div key={n.node} style={{marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.6)',marginBottom:6}}>
              {n.node} · up {uptime(n.status?.uptime)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:8}}>
              {[{l:`CPU·${s.cpuinfo?.cores||'?'}c`,v:cpuPct,sub:`${cpuPct}%`},
                {l:'RAM',v:memPct,sub:`${gb(s.memory?.used)}/${gb(s.memory?.total)}`},
                {l:'Disk',v:diskPct,sub:`${fmt(s.rootfs?.used)}/${fmt(s.rootfs?.total)}`}
              ].map(({l,v,sub})=>(
                <div key={l} style={{background:'rgba(255,255,255,.04)',borderRadius:6,padding:'6px 8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:8,color:'rgba(255,255,255,.4)'}}>{l}</span>
                    <span style={{fontSize:10,fontWeight:700,color:v>=90?'#f44336':v>=75?'#ff9800':'#fff'}}>{v}%</span>
                  </div>
                  <MiniBar v={v} h={5}/>
                  <div style={{fontSize:8,color:'rgba(255,255,255,.3)',marginTop:2}}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {/* Storage */}
      {activeStorage.length>0&&(
        <div style={{marginBottom:10}}>
          <div style={{fontSize:8,fontWeight:700,color:'rgba(255,255,255,.3)',letterSpacing:1.5,marginBottom:6}}>STORAGE</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:4}}>
            {activeStorage.map(st=>{const sp=pct(st.disk_used,st.total);return(
              <div key={st.storage} style={{background:'rgba(255,255,255,.04)',borderRadius:5,padding:'5px 7px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.6)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:60}}>{st.storage}</span>
                  <span style={{fontSize:9,fontWeight:700,color:sp>=85?'#f44336':sp>=70?'#ff9800':'#81c784'}}>{sp}%</span>
                </div>
                <MiniBar v={sp} h={3}/>
                <div style={{fontSize:8,color:'rgba(255,255,255,.25)',marginTop:2}}>{fmt(st.disk_used)}/{fmt(st.total)}</div>
              </div>
            );})}
          </div>
        </div>
      )}
      {/* Guests */}
      {allGuests.length>0&&(
        <div>
          <div style={{display:'flex',gap:4,marginBottom:6,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:8,fontWeight:700,color:'rgba(255,255,255,.3)',letterSpacing:1.5,marginRight:2}}>GUESTS</span>
            {[['all',`All (${allGuests.length})`],['vm',`VM (${totalVMs})`],['ct',`CT (${totalCT})`],['stopped','Stopped']].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)}
                style={{fontSize:8,padding:'2px 7px',border:'none',borderRadius:8,cursor:'pointer',
                  fontFamily:'var(--font-ui)',fontWeight:600,
                  background:filter===v?'rgba(255,255,255,.2)':'rgba(255,255,255,.06)',
                  color:filter===v?'#fff':'rgba(255,255,255,.4)'}}>
                {l}
              </button>
            ))}
          </div>
          {filtered.map(g=><GuestDashRow key={`${g._type}${g.vmid}`} g={g}/>)}
        </div>
      )}
    </div>
  );
}

function TrueNASDashCard({node,result}){
  const d=result?.data||{};
  const info=d.info||{};
  const pools=d.pools||[];
  const usedCap=pools.reduce((a,p)=>a+(p.size?.allocated||0),0);
  const totalCap=pools.reduce((a,p)=>a+(p.size?.total||0),0);
  const diskPct=pct(usedCap,totalCap);
  const running=(d.services||[]).filter(s=>s.state==='RUNNING');
  return(
    <div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
        <Tag color='#80CBC4' bg='#00897B22'>{running.length} services</Tag>
        {(d.alerts||[]).length>0&&<Tag color='#f44336' bg='#f4433622'>⚠ {d.alerts.length} alerts</Tag>}
        <Tag color='var(--text4)'>{(info.version||'').split('-')[0]}</Tag>
      </div>
      <div style={{marginBottom:8}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
          <span style={{fontSize:9,color:'rgba(255,255,255,.5)'}}>Total Storage</span>
          <span style={{fontSize:10,fontWeight:700,color:diskPct>=90?'#f44336':diskPct>=75?'#ff9800':'#fff'}}>{diskPct}%</span>
        </div>
        <MiniBar v={diskPct} h={6}/>
        <div style={{fontSize:9,color:'rgba(255,255,255,.4)',marginTop:2}}>{fmt(usedCap)} / {fmt(totalCap)}</div>
      </div>
      {pools.map(p=>{const sp=pct(p.size?.allocated,p.size?.total);return(
        <div key={p.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <span style={{fontSize:9,color:p.healthy?'#81c784':'#f44336',flexShrink:0}}>●</span>
          <span style={{fontSize:10,color:'rgba(255,255,255,.8)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>
          <span style={{fontSize:9,color:'rgba(255,255,255,.4)'}}>{fmt(p.size?.total)}</span>
          <span style={{fontSize:9,fontWeight:700,color:sp>=90?'#f44336':sp>=75?'#ff9800':'rgba(255,255,255,.6)',width:30,textAlign:'right'}}>{sp}%</span>
        </div>
      );})}
    </div>
  );
}

function UnraidDashCard({node,result}){
  const d=result?.data?.data||{};
  const sys=d.system||{};
  const mem=sys.memory||{};
  const cpuPct=Math.round(sys.cpu?.usage||0);
  const memPct=pct(mem.total-mem.free,mem.total);
  const containers=d.docker?.containers||[];
  const running=containers.filter(c=>c.state==='running');
  return(
    <div>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        <Tag color='#80CBC4' bg='#00897B22'>{running.length}/{containers.length} containers</Tag>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        {[{l:'CPU',v:cpuPct},{l:'RAM',v:memPct,sub:`${gb(mem.total-mem.free)} / ${gb(mem.total)}`}].map(({l,v,sub})=>(
          <div key={l}><div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
            <span style={{fontSize:9,color:'rgba(255,255,255,.5)'}}>{l}</span>
            <span style={{fontSize:10,fontWeight:700,color:v>=90?'#f44336':v>=75?'#ff9800':'#fff'}}>{v}%</span>
          </div><MiniBar v={v}/>{sub&&<div style={{fontSize:8,color:'rgba(255,255,255,.4)',marginTop:1}}>{sub}</div>}</div>
        ))}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
        {containers.slice(0,10).map((ct,i)=>(
          <span key={i} style={{fontSize:9,padding:'2px 6px',borderRadius:4,
            background:ct.state==='running'?'rgba(76,175,80,.2)':'rgba(255,255,255,.06)',
            color:ct.state==='running'?'#81c784':'rgba(255,255,255,.35)',
            border:`1px solid ${ct.state==='running'?'rgba(76,175,80,.3)':'rgba(255,255,255,.1)'}`}}>
            {(ct.names||['?'])[0].replace(/^\//,'')}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProbeDashCard({node,result}){
  const d=result?.data||{};
  return(
    <div style={{display:'flex',alignItems:'center',gap:16,padding:'8px 0'}}>
      <div style={{fontSize:40,lineHeight:1}}>{d.ok?'✅':'❌'}</div>
      <div>
        <div style={{fontWeight:800,fontSize:16,color:d.ok?'#81c784':'#f44336'}}>{d.ok?'Online':'Unreachable'}</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>HTTP {d.status||'—'} · {d.ms||'?'}ms response</div>
      </div>
    </div>
  );
}

const CARD_RENDERERS={proxmox:ProxmoxDashCard,truenas:TrueNASDashCard,freenas:TrueNASDashCard,unraid:UnraidDashCard,probe:ProbeDashCard};
const TYPE_COLORS={proxmox:'#FF6C2F',truenas:'#0095D5',unraid:'#E67C1C',esxi:'#717CBD',probe:'#9E9E9E'};
const TYPE_LABEL={proxmox:'Proxmox VE',truenas:'TrueNAS',unraid:'Unraid',esxi:'ESXi',probe:'HTTP Probe',freenas:'FreeNAS'};

// ── Main LiveDashboard ─────────────────────────────────────────
export default function LiveDashboard({ maps }) {
  const [nodes,setNodes]=useState([]);
  const [results,setResults]=useState({});
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [lastRefresh,setLastRefresh]=useState(null);
  const [countdown,setCountdown]=useState(0);
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

  if(loading) return(
    <div style={{padding:'60px 20px',textAlign:'center',color:'var(--text4)'}}>
      <div style={{fontSize:32,marginBottom:12}}>⏳</div>Loading integrations…
    </div>
  );

  if(nodes.length===0) return(
    <div style={{padding:'60px 20px',textAlign:'center',color:'var(--text4)'}}>
      <div style={{fontSize:48,marginBottom:16}}>🔌</div>
      <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:8}}>No live integrations yet</div>
      <div style={{fontSize:12,maxWidth:360,margin:'0 auto',lineHeight:1.7}}>
        Open any node on a map → <strong>📡 Live</strong> tab → configure Proxmox / TrueNAS / Unraid credentials → Save.<br/>It will appear here automatically.
      </div>
    </div>
  );

  const online=Object.values(results).filter(r=>r?.ok).length;
  const offline=Object.values(results).filter(r=>r&&!r.ok).length;

  return(
    <div>
      {/* Summary bar */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
        background:'var(--bg3)',borderRadius:10,marginBottom:20,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:16,flex:1,flexWrap:'wrap'}}>
          <span style={{fontSize:12}}><span style={{color:'var(--success)',fontWeight:700}}>● {online}</span> <span style={{color:'var(--text4)'}}>online</span></span>
          {offline>0&&<span style={{fontSize:12}}><span style={{color:'var(--danger)',fontWeight:700}}>● {offline}</span> <span style={{color:'var(--text4)'}}>offline</span></span>}
          <span style={{fontSize:12}}><span style={{color:'var(--text4)'}}>📡 {nodes.length} integration{nodes.length!==1?'s':''}</span></span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {lastRefresh&&<span style={{fontSize:9,color:'var(--text4)'}}>↻ in {countdown}s · {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={()=>refresh()} disabled={refreshing}
            style={{fontSize:10,background:refreshing?'var(--bg3)':'var(--accent2)',border:'none',
              borderRadius:6,color:refreshing?'var(--text4)':'#fff',cursor:refreshing?'default':'pointer',
              padding:'5px 14px',fontFamily:'var(--font-ui)',fontWeight:700}}>
            {refreshing?'⏳ Refreshing…':'🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16,alignItems:'start'}}>
        {nodes.map(node=>{
          const cfg=node.properties._integration;
          const result=results[node.id];
          const type=cfg.type||NODE_INT_MAP[node.type]||'probe';
          const Renderer=CARD_RENDERERS[type];
          const color=TYPE_COLORS[type]||'var(--accent2)';
          const isOnline=result?.ok;
          return(
            <div key={node.id} style={{
              background:`linear-gradient(145deg, ${color}18 0%, var(--bg2) 60%)`,
              border:`1px solid ${isOnline?color+'55':result?'var(--danger)44':'var(--border)'}`,
              borderRadius:12,overflow:'hidden',
              boxShadow:`0 4px 20px ${color}11`}}>
              {/* Card header */}
              <div style={{padding:'14px 16px 10px',borderBottom:'1px solid rgba(255,255,255,.06)',
                background:`linear-gradient(90deg, ${color}22 0%, transparent 100%)`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{width:10,height:10,borderRadius:'50%',flexShrink:0,
                    background:isOnline?'#4caf50':result?'#f44336':'rgba(255,255,255,.2)',
                    boxShadow:isOnline?'0 0 8px #4caf5088':'none'}}/>
                  <span style={{fontSize:14,fontWeight:800,color:'var(--text)',flex:1,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{node.title}</span>
                  <span style={{fontSize:9,padding:'2px 8px',borderRadius:10,
                    background:`${color}33`,color,fontWeight:700,border:`1px solid ${color}44`}}>
                    {TYPE_LABEL[type]||type}
                  </span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:9,color:'rgba(255,255,255,.35)'}}>
                    {cfg.url?.replace(/^https?:\/\//,'').split('/')[0]}
                  </span>
                  <span style={{fontSize:9,color:'rgba(255,255,255,.25)'}}>· {node.mapTitle}</span>
                  <span style={{marginLeft:'auto',fontSize:9,fontWeight:700,
                    color:isOnline?'#81c784':result?'#f44336':'rgba(255,255,255,.3)'}}>
                    {isOnline?'● online':result?'● offline':'○ pending'}
                  </span>
                </div>
              </div>
              {/* Card body */}
              <div style={{padding:'12px 16px'}}>
                {!result&&<div style={{fontSize:11,color:'rgba(255,255,255,.3)',fontStyle:'italic'}}>Connecting…</div>}
                {result?.error&&<div style={{fontSize:10,color:'#f44336',padding:'6px 8px',background:'rgba(244,67,54,.1)',borderRadius:5}}>⚠ {result.error}</div>}
                {result?.ok&&Renderer&&<Renderer node={node} result={result}/>}
                {result?.ts&&<div style={{fontSize:8,color:'rgba(255,255,255,.2)',marginTop:10,textAlign:'right'}}>
                  {new Date(result.ts).toLocaleTimeString()}
                </div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
