// IntegrationPanel.jsx — per-node API integrations (Proxmox, TrueNAS, Unraid, ESXi, probe)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../api/client.js';

// Which integration type to use per node type
const NODE_INT_MAP = {
  proxmox: 'proxmox', esxi: 'esxi', hyperv: 'probe',
  unraid: 'unraid', truenas: 'truenas', freenas: 'truenas',
  nas: 'truenas', server: 'probe', appserver: 'probe',
  router: 'probe', switch: 'probe', firewall: 'probe',
  desktop: 'probe', laptop: 'probe', rpi: 'probe',
};

const INT_FIELDS = {
  proxmox: [
    { key: 'url',   label: 'URL',        placeholder: 'https://192.168.1.10:8006', type: 'text' },
    { key: 'token', label: 'API Token',  placeholder: 'user@pam!tokenid=UUID',    type: 'password', help: 'Datacenter → API Tokens → Add' },
  ],
  truenas: [
    { key: 'url',   label: 'URL',        placeholder: 'http://192.168.1.20',      type: 'text' },
    { key: 'token', label: 'API Key',    placeholder: 'API key from UI',          type: 'password', help: 'Credentials → API Keys → Add' },
  ],
  unraid: [
    { key: 'url',   label: 'URL',        placeholder: 'http://192.168.1.30',      type: 'text' },
    { key: 'token', label: 'API Key',    placeholder: 'x-api-key value',          type: 'password', help: 'Requires "Unraid API" community plugin' },
  ],
  esxi: [
    { key: 'url',      label: 'URL',      placeholder: 'https://192.168.1.40',    type: 'text' },
    { key: 'username', label: 'Username', placeholder: 'administrator@vsphere.local', type: 'text' },
    { key: 'password', label: 'Password', placeholder: '',                        type: 'password', help: 'Requires ESXi 7+ or vCenter 6.7+' },
  ],
  probe: [
    { key: 'url',   label: 'Health URL', placeholder: 'http://192.168.1.x:port/health', type: 'text' },
  ],
};


function pct(used, total) { return total ? Math.round(used / total * 100) : 0; }
function gb(bytes) { return bytes ? (bytes / 1073741824).toFixed(1) + ' GB' : '—'; }
function fmt(bytes) { if (!bytes) return '—'; if (bytes > 1e12) return (bytes/1e12).toFixed(1)+'TB'; if (bytes > 1e9) return (bytes/1e9).toFixed(1)+'GB'; return (bytes/1e6).toFixed(0)+'MB'; }

function Bar({ pct: p, warn = 80, crit = 90 }) {
  const c = p >= crit ? '#f44336' : p >= warn ? '#ff9800' : '#4caf50';
  return (
    <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
      <div style={{ height: '100%', width: `${p}%`, background: c, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ minWidth: 70 }}>
      <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--text4)' }}>{sub}</div>}
    </div>
  );
}

// ── Metric renderers per integration type ─────────────────────
function uptime(s){if(!s)return'—';const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);return d>0?`${d}d ${h}h`:h>0?`${h}h ${m}m`:`${m}m`;}

function MiniBar({v,warn=70,crit=90,h=4}){
  const col=v>=crit?'#f44336':v>=warn?'#ff9800':'#4caf50';
  return <div style={{height:h,background:'var(--bg)',borderRadius:h,overflow:'hidden'}}>
    <div style={{height:'100%',width:`${Math.min(v,100)}%`,background:col,borderRadius:h,transition:'width .4s'}}/>
  </div>;
}

function GuestCard({g}){
  const cpuPct=Math.round((g.cpu||0)*100);
  const memPct=pct(g.mem,g.maxmem);
  const running=g.status==='running';
  const isVM=g._type==='VM';
  return(
    <div style={{background:'var(--bg)',borderRadius:7,padding:'8px 10px',
      border:`1px solid ${running?'var(--success)33':'var(--border2)'}`,
      opacity:running?1:0.6}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
        <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,fontWeight:700,
          background:isVM?'#8E24AA22':'#00897B22',
          color:isVM?'#CE93D8':'#80CBC4'}}>{isVM?'VM':'CT'}</span>
        <span style={{fontSize:11,fontWeight:700,color:'var(--text)',flex:1,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name||`${g._type}${g.vmid}`}</span>
        <span style={{fontSize:9,padding:'1px 6px',borderRadius:10,
          background:running?'var(--success)22':'var(--bg3)',
          color:running?'var(--success)':'var(--text4)',
          border:`1px solid ${running?'var(--success)44':'var(--border)'}`}}>
          {running?'● running':'■ stopped'}</span>
      </div>
      <div style={{fontSize:9,color:'var(--text4)',marginBottom:6}}>
        ID {g.vmid} · {g.cpus||'?'} vCPU · up {uptime(g.uptime)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
            <span style={{fontSize:9,color:'var(--text4)'}}>CPU</span>
            <span style={{fontSize:9,fontWeight:700,color:cpuPct>80?'#f44336':cpuPct>60?'#ff9800':'var(--success)'}}>{cpuPct}%</span>
          </div>
          <MiniBar v={cpuPct}/>
        </div>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
            <span style={{fontSize:9,color:'var(--text4)'}}>RAM</span>
            <span style={{fontSize:9,fontWeight:700,color:memPct>80?'#f44336':memPct>60?'#ff9800':'var(--success)'}}>{memPct}% <span style={{fontWeight:400,color:'var(--text4)'}}>{gb(g.mem)}</span></span>
          </div>
          <MiniBar v={memPct}/>
        </div>
      </div>
      {g.maxdisk>0&&<div style={{fontSize:9,color:'var(--text4)',marginTop:4,textAlign:'right'}}>💾 {fmt(g.disk)} / {fmt(g.maxdisk)}</div>}
    </div>
  );
}

function ProxmoxMetrics({ data }) {
  const [expanded,setExpanded]=React.useState({});
  const toggle=id=>setExpanded(e=>({...e,[id]:!e[id]}));
  const [filter,setFilter]=React.useState('all'); // all|vm|ct|stopped
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <span style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>Proxmox VE {data.version}</span>
        <span style={{fontSize:9,color:'var(--text4)',marginLeft:'auto'}}>{data.nodes?.length} node(s)</span>
      </div>
      {(data.nodes||[]).map(n=>{
        const s=n.status||{};
        const cpuPct=Math.round((s.cpu||0)*100);
        const memPct=pct(s.memory?.used,s.memory?.total);
        const diskPct=pct(s.rootfs?.used,s.rootfs?.total);
        const allGuests=[...(n.vms||[]).map(v=>({...v,_type:'VM'})),...(n.lxc||[]).map(v=>({...v,_type:'CT'}))];
        const runVMs=(n.vms||[]).filter(v=>v.status==='running').length;
        const runLXC=(n.lxc||[]).filter(v=>v.status==='running').length;
        const isExp=expanded[n.node]!==false; // default expanded
        const filtered=allGuests.filter(g=>filter==='all'||(filter==='vm'&&g._type==='VM')||(filter==='ct'&&g._type==='CT')||(filter==='stopped'&&g.status!=='running'));
        const activeStorage=(n.storage||[]).filter(st=>st.active&&st.total>0);
        return(
          <div key={n.node} style={{marginBottom:12}}>
            {/* ── Node header card ── */}
            <div style={{background:'var(--bg3)',borderRadius:'10px 10px 0 0',padding:'12px 14px',
              border:`1px solid ${n.online?'var(--success)55':'var(--danger)55'}`,
              borderBottom:'none',cursor:'pointer'}} onClick={()=>toggle(n.node)}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span style={{width:9,height:9,borderRadius:'50%',
                  background:n.online?'var(--success)':'var(--danger)',
                  boxShadow:n.online?'0 0 6px var(--success)':'none',flexShrink:0}}/>
                <span style={{fontWeight:800,fontSize:13,color:'var(--text)'}}>{n.node}</span>
                <span style={{fontSize:9,color:'var(--text4)'}}>up {uptime(s.uptime)}</span>
                <span style={{marginLeft:'auto',fontSize:9,background:'var(--bg)',
                  padding:'2px 8px',borderRadius:10,border:'1px solid var(--border)',
                  color:'var(--text4)'}}>
                  {runVMs}/{n.vms.length} VM · {runLXC}/{n.lxc.length} CT · {isExp?'▲':'▼'}
                </span>
              </div>
              {/* Metric bars */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[
                  {label:`CPU · ${s.cpuinfo?.cores||'?'}c`,v:cpuPct,sub:`${cpuPct}%`},
                  {label:'RAM',v:memPct,sub:`${gb(s.memory?.used)} / ${gb(s.memory?.total)}`},
                  {label:'Root Disk',v:diskPct,sub:`${fmt(s.rootfs?.used)} / ${fmt(s.rootfs?.total)}`},
                ].map(({label,v,sub})=>(
                  <div key={label}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:9,color:'var(--text4)'}}>{label}</span>
                      <span style={{fontSize:10,fontWeight:700,
                        color:v>=90?'#f44336':v>=75?'#ff9800':'var(--text)'}}>{v}%</span>
                    </div>
                    <MiniBar v={v} h={5}/>
                    <div style={{fontSize:9,color:'var(--text4)',marginTop:2}}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Storage pools */}
            {activeStorage.length>0&&(
              <div style={{background:'var(--bg3)',padding:'8px 14px',borderLeft:`1px solid ${n.online?'var(--success)55':'var(--danger)55'}`,borderRight:`1px solid ${n.online?'var(--success)55':'var(--danger)55'}`}}>
                <div style={{fontSize:8,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginBottom:6}}>STORAGE</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:6}}>
                  {activeStorage.map(st=>{
                    const sp=pct(st.used||st.disk_used,st.total);
                    return(
                      <div key={st.storage} style={{background:'var(--bg)',borderRadius:6,padding:'6px 8px',border:'1px solid var(--border2)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:10,fontWeight:700,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:70}}>{st.storage}</span>
                          <span style={{fontSize:9,fontWeight:700,color:sp>85?'#f44336':sp>70?'#ff9800':'var(--success)'}}>{sp}%</span>
                        </div>
                        <MiniBar v={sp} h={4}/>
                        <div style={{fontSize:8,color:'var(--text4)',marginTop:3}}>{fmt(st.used||st.disk_used)} / {fmt(st.total)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Guests */}
            {isExp&&(
              <div style={{background:'var(--bg3)',borderRadius:'0 0 10px 10px',padding:'10px 14px',
                border:`1px solid ${n.online?'var(--success)55':'var(--danger)55'}`,borderTop:'1px solid var(--border2)'}}>
                {/* Filter pills */}
                {allGuests.length>0&&(
                  <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{fontSize:8,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginRight:4}}>SHOW</span>
                    {[['all','All'],['vm','VMs'],['ct','CTs'],['stopped','Stopped']].map(([v,l])=>(
                      <button key={v} onClick={e=>{e.stopPropagation();setFilter(v)}}
                        style={{fontSize:9,padding:'2px 8px',border:'none',borderRadius:10,cursor:'pointer',
                          fontFamily:'var(--font-ui)',fontWeight:600,
                          background:filter===v?'var(--accent2)':'var(--bg)',
                          color:filter===v?'#fff':'var(--text4)'}}>
                        {l} {v==='all'?`(${allGuests.length})`:v==='vm'?`(${n.vms.length})`:v==='ct'?`(${n.lxc.length})`:``}
                      </button>
                    ))}
                  </div>
                )}
                {filtered.length===0&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic',textAlign:'center',padding:'10px 0'}}>No guests</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {filtered.map(g=><GuestCard key={`${g._type}${g.vmid}`} g={g}/>)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({t, ok, failed}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderBottom:'1px solid var(--border2)',fontSize:10}}>
      <span style={{width:7,height:7,borderRadius:'50%',flexShrink:0,
        background:!t.enabled?'var(--text4)':ok?'var(--success)':failed?'var(--danger)':'var(--accent)'}}/>
      <span style={{fontWeight:600,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</span>
      <span style={{fontSize:9,color:'var(--text4)'}}>{t.direction||t.provider}</span>
      <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,
        background:!t.enabled?'var(--bg3)':ok?'var(--success)22':failed?'var(--danger)22':'var(--bg3)',
        color:!t.enabled?'var(--text4)':ok?'var(--success)':failed?'var(--danger)':'var(--text3)'}}>
        {!t.enabled?'disabled':t.state||'—'}
      </span>
    </div>
  );
}

function TrueNASMetrics({ data }) {
  const info        = data.info        || {};
  const pools       = data.pools       || [];
  const services    = data.services    || [];
  const disks       = data.disks       || [];
  const datasets    = data.datasets    || [];
  const ifaces      = data.interfaces  || [];
  const vms         = data.vms         || [];
  const alerts      = data.alerts      || [];
  const storage     = data.storage     || {};
  const replication = data.replication || [];
  const cloudsync   = data.cloudsync   || [];
  const [filter, setFilter] = useState('disks');

  const uptimeSec  = info.uptime_seconds || info.uptimeSeconds;
  const healthy    = pools.length > 0 && pools.every(p => p.healthy);
  const cpuCores   = info.cores || 1;
  const loadAvg    = info.loadavg || [];
  const load1      = loadAvg[0] != null ? loadAvg[0].toFixed(2) : null;
  const load5      = loadAvg[1] != null ? loadAvg[1].toFixed(2) : null;
  const load15     = loadAvg[2] != null ? loadAvg[2].toFixed(2) : null;
  const loadPct    = load1 != null ? Math.min(Math.round(loadAvg[0] / cpuCores * 100), 100) : 0;
  const onlinePools = pools.filter(p => p.status === 'ONLINE').length;
  const runningVMs = vms.filter(v => v.status === 'RUNNING').length;
  const hasTasks   = replication.length > 0 || cloudsync.length > 0;
  const borderCol  = healthy ? 'var(--success)55' : pools.length === 0 ? 'var(--border)' : 'var(--danger)55';

  const filterTabs = [
    ['disks','Disks',disks.length],
    ['datasets','Datasets',datasets.length],
    ['network','Network',ifaces.length],
    ['services','Services',services.length],
    ...(vms.length   > 0 ? [['vms','VMs',vms.length]] : []),
    ...(hasTasks         ? [['tasks','Tasks',replication.length+cloudsync.length]] : []),
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <span style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>TrueNAS {(info.version||'').split('-')[0]||''}</span>
        <span style={{fontSize:9,color:'var(--text4)',marginLeft:'auto'}}>{onlinePools}/{pools.length} pools online</span>
      </div>

      {/* ── System card (like Proxmox node header) ── */}
      <div style={{background:'var(--bg3)',borderRadius:'10px 10px 0 0',padding:'12px 14px',
        border:`1px solid ${borderCol}`,borderBottom:'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <span style={{width:9,height:9,borderRadius:'50%',
            background:healthy?'var(--success)':'var(--danger)',
            boxShadow:healthy?'0 0 6px var(--success)':'none',flexShrink:0}}/>
          <span style={{fontWeight:800,fontSize:13,color:'var(--text)'}}>{info.hostname||'—'}</span>
          <span style={{fontSize:9,color:'var(--text4)'}}>up {uptime(uptimeSec)}</span>
          <span style={{marginLeft:'auto',fontSize:9,background:'var(--bg)',
            padding:'2px 8px',borderRadius:10,border:'1px solid var(--border)',color:'var(--text4)'}}>
            {disks.length} disk{disks.length!==1?'s':''}
            {vms.length>0?` · ${runningVMs}/${vms.length} VM`:''}
          </span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {/* Load */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:9,color:'var(--text4)'}}>Load · {cpuCores}c</span>
              <span style={{fontSize:10,fontWeight:700,color:loadPct>=90?'#f44336':loadPct>=75?'#ff9800':'var(--text)'}}>{loadPct}%</span>
            </div>
            <MiniBar v={loadPct} h={5}/>
            <div style={{fontSize:9,color:'var(--text4)',marginTop:2}}>{load1?:'—'}</div>
          </div>
          {/* RAM — API only gives total, no used */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:9,color:'var(--text4)'}}>RAM</span>
              <span style={{fontSize:10,fontWeight:700,color:'var(--text)'}}>{info.physmem?fmt(info.physmem):'—'}</span>
            </div>
            <div style={{height:5,background:'var(--border2)',borderRadius:5}}/>
            <div style={{fontSize:9,color:'var(--text4)',marginTop:2}}>total · usage N/A</div>
          </div>
          {/* Storage */}
          {(()=>{const v=pct(storage.totalAllocated,storage.totalSize);return(
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontSize:9,color:'var(--text4)'}}>Storage</span>
                <span style={{fontSize:10,fontWeight:700,color:v>=90?'#f44336':v>=75?'#ff9800':'var(--text)'}}>{v}%</span>
              </div>
              <MiniBar v={v} h={5}/>
              <div style={{fontSize:9,color:'var(--text4)',marginTop:2}}>{fmt(storage.totalAllocated||0)} / {fmt(storage.totalSize||0)}</div>
            </div>
          );})()}
        </div>
      </div>

      {/* ── Pools (like Proxmox storage section) ── */}
      {pools.length>0&&(
        <div style={{background:'var(--bg3)',padding:'8px 14px',
          borderLeft:`1px solid ${borderCol}`,borderRight:`1px solid ${borderCol}`}}>
          <div style={{fontSize:8,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginBottom:6}}>POOLS</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:6}}>
            {pools.map(p=>{
              const sp=pct(p.allocated,p.size);
              return(
                <div key={p.name} style={{background:'var(--bg)',borderRadius:6,padding:'6px 8px',
                  border:`1px solid ${p.healthy?'var(--success)33':'var(--danger)33'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontSize:10,fontWeight:700,color:'var(--text3)',overflow:'hidden',
                      textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:70}}>{p.name}</span>
                    <span style={{fontSize:9,fontWeight:700,
                      color:sp>85?'#f44336':sp>70?'#ff9800':'var(--success)'}}>{sp}%</span>
                  </div>
                  <MiniBar v={sp} h={4}/>
                  <div style={{fontSize:8,color:'var(--text4)',marginTop:3,display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:p.healthy?'var(--success)':'var(--danger)',fontWeight:700}}>{p.status}</span>
                    <span>{fmt(p.allocated)} / {fmt(p.size)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Alerts strip ── */}
      {alerts.length>0&&(
        <div style={{background:'var(--bg3)',padding:'4px 14px',
          borderLeft:`1px solid ${borderCol}`,borderRight:`1px solid ${borderCol}`}}>
          {alerts.map((a,i)=>(
            <div key={i} style={{fontSize:10,color:'var(--danger)',padding:'3px 0',
              borderBottom:i<alerts.length-1?'1px solid var(--border2)':undefined}}>
              ⚠ {a.formatted||a.text}
            </div>
          ))}
        </div>
      )}

      {/* ── Services strip ── */}
      {services.length>0&&(
        <div style={{background:'var(--bg3)',padding:'6px 14px',display:'flex',gap:4,flexWrap:'wrap',
          borderLeft:`1px solid ${borderCol}`,borderRight:`1px solid ${borderCol}`}}>
          {services.map(s=>(
            <span key={s.service} style={{fontSize:9,padding:'1px 6px',borderRadius:3,
              background:s.state==='RUNNING'?'var(--success)22':'var(--bg)',
              color:s.state==='RUNNING'?'var(--success)':'var(--text4)',
              border:`1px solid ${s.state==='RUNNING'?'var(--success)44':'var(--border)'}`,
              fontWeight:s.state==='RUNNING'?700:400}}>{s.service}</span>
          ))}
        </div>
      )}

      {/* ── Items section (Disks / Datasets / Network / Services / VMs / Tasks) ── */}
      <div style={{background:'var(--bg3)',borderRadius:'0 0 10px 10px',padding:'10px 14px',
        border:`1px solid ${borderCol}`,borderTop:'1px solid var(--border2)'}}>
        {/* Filter pills */}
        <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:8,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginRight:4}}>SHOW</span>
          {filterTabs.map(([v,l,count])=>(
            <button key={v} onMouseDown={e=>e.stopPropagation()}
              onClick={e=>{e.stopPropagation();setFilter(v);}}
              style={{fontSize:9,padding:'2px 8px',border:'none',borderRadius:10,cursor:'pointer',
                fontFamily:'var(--font-ui)',fontWeight:600,
                background:filter===v?'var(--accent2)':'var(--bg)',
                color:filter===v?'#fff':'var(--text4)'}}>
              {l} ({count})
            </button>
          ))}
        </div>

        {/* Disks */}
        {filter==='disks'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {disks.length===0&&<div style={{fontSize:10,color:'var(--text4)',fontStyle:'italic',gridColumn:'1/-1'}}>No disk data</div>}
            {disks.map((d,i)=>(
              <div key={i} style={{background:'var(--bg)',borderRadius:7,padding:'8px 10px',border:'1px solid var(--border2)'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--text)',flex:1}}>{d.name}</span>
                  {d.temp!=null&&<span style={{fontSize:9,fontWeight:700,
                    color:d.temp>50?'#f44336':d.temp>40?'#ff9800':'var(--success)'}}>{d.temp}°C</span>}
                </div>
                <div style={{fontSize:9,color:'var(--text4)',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.model||'—'}</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'var(--text3)'}}>
                  <span>{fmt(d.size)}</span>
                  <span style={{padding:'1px 5px',borderRadius:3,background:'var(--bg3)',color:'var(--text4)'}}>{d.type||'—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Datasets */}
        {filter==='datasets'&&(
          <div>
            {datasets.length===0&&<div style={{fontSize:10,color:'var(--text4)',fontStyle:'italic'}}>No dataset data</div>}
            {datasets.map((d,i)=>{
              const sp=pct(d.used,d.used+d.available);
              return(
                <div key={i} style={{marginBottom:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2,fontSize:10}}>
                    <span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:8}}>{d.id}</span>
                    <span style={{fontSize:9,color:'var(--text4)',flexShrink:0}}>{sp}% · {fmt(d.used+d.available)}</span>
                  </div>
                  <MiniBar v={sp} h={4}/>
                </div>
              );
            })}
          </div>
        )}

        {/* Network */}
        {filter==='network'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {ifaces.length===0&&<div style={{fontSize:10,color:'var(--text4)',fontStyle:'italic',gridColumn:'1/-1'}}>No interface data</div>}
            {ifaces.map((iface,i)=>(
              <div key={i} style={{background:'var(--bg)',borderRadius:7,padding:'8px 10px',border:'1px solid var(--border2)'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:iface.up?'var(--success)':'var(--danger)',flexShrink:0}}/>
                  <span style={{fontWeight:700,fontSize:11,flex:1}}>{iface.name}</span>
                  {iface.speed&&<span style={{fontSize:9,color:'var(--text4)'}}>{iface.speed>=1000?iface.speed/1000+'G':iface.speed+'M'}</span>}
                </div>
                <div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>{iface.type}</div>
                {(iface.aliases||[]).map((a,ai)=><div key={ai} style={{fontSize:9,color:'var(--text3)'}}>{a}</div>)}
              </div>
            ))}
          </div>
        )}

        {/* Services */}
        {filter==='services'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {services.map(s=>(
              <div key={s.service} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px',
                background:'var(--bg)',borderRadius:6,
                border:`1px solid ${s.state==='RUNNING'?'var(--success)33':'var(--border2)'}`}}>
                <span style={{width:7,height:7,borderRadius:'50%',
                  background:s.state==='RUNNING'?'var(--success)':'var(--text4)',flexShrink:0}}/>
                <span style={{fontSize:10,fontWeight:s.state==='RUNNING'?700:400,flex:1,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.service}</span>
                <span style={{fontSize:9,color:s.state==='RUNNING'?'var(--success)':'var(--text4)'}}>{s.state}</span>
              </div>
            ))}
          </div>
        )}

        {/* VMs */}
        {filter==='vms'&&vms.map((v,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',
            borderBottom:'1px solid var(--border2)',fontSize:10}}>
            <span style={{width:7,height:7,borderRadius:'50%',
              background:v.status==='RUNNING'?'var(--success)':'var(--text4)',flexShrink:0}}/>
            <span style={{fontWeight:600,flex:1}}>{v.name}</span>
            <span style={{color:'var(--text4)'}}>{v.vcpus} vCPU</span>
            <span style={{color:'var(--text4)'}}>{gb(v.memory*1024*1024)}</span>
            <span style={{fontSize:9,color:v.status==='RUNNING'?'var(--success)':'var(--text4)'}}>{v.status}</span>
          </div>
        ))}

        {/* Tasks */}
        {filter==='tasks'&&(
          <div>
            {replication.length>0&&<div style={{fontSize:9,color:'var(--text4)',fontWeight:700,letterSpacing:1,marginBottom:4}}>REPLICATION</div>}
            {replication.map((t,i)=>{
              const ok=t.state==='FINISHED',failed=t.state==='ERROR'||t.state==='FAILED';
              return <TaskRow key={i} t={t} ok={ok} failed={failed}/>;
            })}
            {cloudsync.length>0&&<div style={{fontSize:9,color:'var(--text4)',fontWeight:700,letterSpacing:1,margin:'8px 0 4px'}}>CLOUD SYNC</div>}
            {cloudsync.map((t,i)=>{
              const ok=t.state==='SUCCESS'||t.state==='FINISHED',failed=t.state==='FAILED'||t.state==='ERROR';
              return <TaskRow key={i} t={t} ok={ok} failed={failed}/>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function UnraidMetrics({ data }) {
  const sys = data.data?.system || {};
  const mem = sys.memory || {};
  const memPct = pct(mem.total - mem.free, mem.total);
  const cpuPct = Math.round((sys.cpu?.usage || 0));
  const containers = data.data?.docker?.containers || [];
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <Stat label="CPU" value={`${cpuPct}%`} />
        <Stat label="RAM" value={`${memPct}%`} sub={`${gb(mem.total - mem.free)} / ${gb(mem.total)}`} />
        <Stat label="CONTAINERS" value={containers.length} />
      </div>
      <Bar pct={cpuPct} /><Bar pct={memPct} />
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {containers.slice(0, 10).map((c, i) => (
          <span key={i} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3,
            background: c.state === 'running' ? 'var(--success)22' : 'var(--bg)',
            color: c.state === 'running' ? 'var(--success)' : 'var(--text4)',
            border: '1px solid var(--border)' }}>
            {(c.names || ['?'])[0].replace(/^\//, '')}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProbeMetrics({ data }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <span style={{ fontSize: 24 }}>{data.ok ? '✅' : '❌'}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: data.ok ? 'var(--success)' : 'var(--danger)' }}>
          {data.ok ? 'Online' : 'Unreachable'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text4)' }}>HTTP {data.status} · {data.ms}ms</div>
      </div>
    </div>
  );
}

const METRIC_RENDERERS = { proxmox: ProxmoxMetrics, truenas: TrueNASMetrics, unraid: UnraidMetrics, probe: ProbeMetrics };

const POLL_MS = 15000; // 15s real-time polling

// ── Main component ─────────────────────────────────────────────
export default function IntegrationPanel({ node, canEdit, onUpdateProp }) {
  const intType = NODE_INT_MAP[node.type] || 'probe';
  const fields  = INT_FIELDS[intType] || INT_FIELDS.probe;

  const cfg    = node.properties?._integration || {};
  const cache  = node.properties?._integration_cache || null;
  const [form, setForm]   = useState({ type: intType, ...cfg });
  const [data, setData]   = useState(cache);          // restore cached data immediately
  const [err,  setErr]    = useState('');
  const [busy, setBusy]   = useState(false);
  const [show, setShow]   = useState(false);
  const [lastTs, setLastTs] = useState(cache ? Date.now() : null);
  const [countdown, setCountdown] = useState(cache ? POLL_MS / 1000 : 0);
  const intervalRef  = useRef(null);
  const countdownRef = useRef(null);
  const formRef      = useRef(form);                  // always-current form ref (avoids stale closures)

  // Keep formRef in sync
  useEffect(() => { formRef.current = form; }, [form]);

  const doFetch = useCallback(async (silent = false) => {
    const f = formRef.current;
    if (!silent) setBusy(true);
    setErr('');
    try {
      const json = await apiFetch(`/integrations/${f.type}`, {
        method: 'POST',
        body: JSON.stringify({ ...f }),
      });
      if (!json.ok) throw new Error(json.error || 'Request failed');
      setData(json);
      setLastTs(Date.now());
      setCountdown(POLL_MS / 1000);
      // Persist last successful response so panel shows data immediately on reopen
      onUpdateProp('_integration_cache', json);
    } catch(e) { setErr(e.message); }
    finally { if (!silent) setBusy(false); }
  }, [onUpdateProp]);

  // Auto-connect on mount if credentials are saved (fires fresh data over cached)
  useEffect(() => {
    const savedCfg = node.properties?._integration;
    if (savedCfg?.url && fields.every(fi => savedCfg[fi.key])) {
      doFetch(true);
    }
  }, [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling interval
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (data && !err) {
      intervalRef.current = setInterval(() => doFetch(true), POLL_MS);
    }
    return () => clearInterval(intervalRef.current);
  }, [data, err, doFetch]);

  // Countdown timer
  useEffect(() => {
    clearInterval(countdownRef.current);
    if (data && !err) {
      countdownRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [data, err, lastTs]);

  const save = () => {
    onUpdateProp('_integration', form);
    // Auto-connect immediately after saving credentials
    setTimeout(() => doFetch(false), 50);
    setShow(false);
  };

  const Renderer = METRIC_RENDERERS[form.type] || ProbeMetrics;
  const isConfigured = fields.every(f => form[f.key]);

  return (
    <div>
      {/* Config section */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)', letterSpacing: 2, flex: 1 }}>
            {intType.toUpperCase()} INTEGRATION
          </span>
          {isConfigured && (
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: data ? 'var(--success)22' : 'var(--bg3)',
              color: data ? 'var(--success)' : 'var(--text4)', border: `1px solid ${data ? 'var(--success)' : 'var(--border)'}` }}>
              {data ? `● live · ↻${countdown}s` : '○ not connected'}
            </span>
          )}
          <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{ e.stopPropagation(); setShow(s => !s); }}
            style={{ fontSize: 10, background: 'none', border: '1px solid var(--border)', borderRadius: 4,
              color: 'var(--text4)', cursor: 'pointer', padding: '2px 8px', fontFamily: 'var(--font-ui)' }}>
            {show ? 'Hide' : 'Configure'}
          </button>
        </div>

        {show && (
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            {/* Type override */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 9, color: 'var(--text4)', display: 'block', marginBottom: 3 }}>INTEGRATION TYPE</label>
              <select value={form.type} disabled={!canEdit}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4,
                  padding: '5px 8px', color: 'var(--text)', fontSize: 11, fontFamily: 'var(--font-ui)', outline: 'none' }}>
                <option value="proxmox">Proxmox VE</option>
                <option value="truenas">TrueNAS / FreeNAS</option>
                <option value="unraid">Unraid</option>
                <option value="esxi">VMware ESXi / vCenter</option>
                <option value="probe">HTTP Health Probe</option>
              </select>
            </div>
            {fields.map(f => (
              <div key={f.key} style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 9, color: 'var(--text4)', display: 'block', marginBottom: 3 }}>
                  {f.label.toUpperCase()}
                  {f.help && <span style={{ fontSize: 8, color: 'var(--accent1)', marginLeft: 6 }}>ℹ {f.help}</span>}
                </label>
                <input type={f.type} value={form[f.key] || ''} placeholder={f.placeholder} disabled={!canEdit}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4,
                    padding: '5px 8px', color: 'var(--text)', fontSize: 11, fontFamily: 'var(--font-ui)',
                    outline: 'none', boxSizing: 'border-box', fontFamily: f.type === 'password' ? 'monospace' : 'var(--font-ui)' }}
                />
              </div>
            ))}
            {canEdit && (
              <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{ e.stopPropagation(); save(); }}
                style={{ width: '100%', padding: '6px', background: 'var(--accent2)', border: 'none', borderRadius: 4,
                  color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)', marginTop: 4 }}>
                Save Configuration
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connect / Refresh */}
      {isConfigured && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();doFetch()}} disabled={busy}
            style={{ flex: 1, padding: '7px', background: busy ? 'var(--bg3)' : 'var(--accent2)', border: 'none',
              borderRadius: 6, color: busy ? 'var(--text4)' : '#fff', cursor: busy ? 'default' : 'pointer',
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>
            {busy ? '⏳ Connecting…' : data ? '🔄 Refresh' : '⚡ Connect'}
          </button>
          {data && <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{ e.stopPropagation(); setData(null); clearInterval(intervalRef.current); clearInterval(countdownRef.current); }}
            style={{ padding: '7px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--text4)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)' }}>
            Disconnect
          </button>}
        </div>
      )}

      {err && <div style={{ fontSize: 11, color: 'var(--danger)', background: 'var(--danger)11', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>⚠ {err}</div>}

      {/* Metrics */}
      {data && <Renderer data={data} />}

      {!isConfigured && !show && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text4)', fontSize: 11 }}>
          Click <strong>Configure</strong> to set up live integration.
        </div>
      )}
    </div>
  );
}

// ── exportable helpers for LiveDashboard ──────────────────────
export { NODE_INT_MAP, METRIC_RENDERERS, Bar, Stat, fmt, gb, pct };
