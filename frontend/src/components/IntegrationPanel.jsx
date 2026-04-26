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
                    const sp=pct(st.disk_used,st.total);
                    return(
                      <div key={st.storage} style={{background:'var(--bg)',borderRadius:6,padding:'6px 8px',border:'1px solid var(--border2)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:10,fontWeight:700,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:70}}>{st.storage}</span>
                          <span style={{fontSize:9,fontWeight:700,color:sp>85?'#f44336':sp>70?'#ff9800':'var(--success)'}}>{sp}%</span>
                        </div>
                        <MiniBar v={sp} h={4}/>
                        <div style={{fontSize:8,color:'var(--text4)',marginTop:3}}>{fmt(st.disk_used)} / {fmt(st.total)}</div>
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
  const [tab, setTab] = useState('overview');

  // Extra system info
  const totalRam  = info.physmem ? fmt(info.physmem) : null;
  const loadAvg   = info.loadavg ? info.loadavg.map(v => v.toFixed(2)).join(' / ') : null;
  const cpuCores  = info.cores   || null;
  const model     = info.model   || null;
  const hasTasks  = replication.length > 0 || cloudsync.length > 0;

  const uptimeSec = info.uptime_seconds || info.uptimeSeconds; // v2.0 uses snake_case
  const uptime = uptimeSec
    ? (() => {
        const d = Math.floor(uptimeSec / 86400);
        const h = Math.floor((uptimeSec % 86400) / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
      })()
    : '—';

  const TabBtn = ({ id, label }) => (
    <button
      onMouseDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); setTab(id); }}
      style={{
        fontSize: 9, padding: '2px 8px', borderRadius: 4, border: 'none',
        background: tab === id ? 'var(--accent2)' : 'var(--bg3)',
        color: tab === id ? '#fff' : 'var(--text3)',
        cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600,
      }}>{label}</button>
  );

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <Stat label="HOSTNAME" value={info.hostname || '—'} />
        <Stat label="VERSION"  value={(info.version || '').split('-')[0] || '—'} />
        <Stat label="UPTIME"   value={uptime} />
        <Stat label="POOLS"    value={pools.length} />
        <Stat label="DISKS"    value={disks.length} />
        {totalRam  && <Stat label="RAM"    value={totalRam} />}
        {cpuCores  && <Stat label="CORES"  value={cpuCores} />}
        {loadAvg   && <Stat label="LOAD"   value={loadAvg} />}
        {model     && <Stat label="MODEL"  value={model} />}
      </div>

      {/* Total storage bar */}
      {storage.totalSize > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text4)', marginBottom: 2 }}>
            <span>TOTAL STORAGE</span>
            <span>{fmt(storage.totalAllocated)} used / {fmt(storage.totalSize)}</span>
          </div>
          <Bar pct={pct(storage.totalAllocated, storage.totalSize)} />
        </div>
      )}

      {/* Service pills */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
        {services.map(s => (
          <span key={s.service} style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 3,
            background: s.state === 'RUNNING' ? 'var(--success)22' : 'var(--bg)',
            color: s.state === 'RUNNING' ? 'var(--success)' : 'var(--text4)',
            border: `1px solid ${s.state === 'RUNNING' ? 'var(--success)44' : 'var(--border)'}`,
            fontWeight: s.state === 'RUNNING' ? 700 : 400,
          }}>{s.service}</span>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              fontSize: 10, color: 'var(--danger)',
              padding: '3px 7px', background: 'var(--danger)11', borderRadius: 4, marginBottom: 3,
              border: '1px solid var(--danger)22',
            }}>⚠ {a.formatted || a.text}</div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {['overview','pools','disks','datasets','network',...(vms.length > 0 ? ['vms'] : []),...(hasTasks ? ['tasks'] : [])].map(t => (
          <TabBtn key={t} id={t} label={t.charAt(0).toUpperCase() + t.slice(1)} />
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && pools.map(p => {
        const used = p.allocated || 0;
        const total = p.size || 0;
        return (
          <div key={p.name} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px', marginBottom: 6,
            border: `1px solid ${p.healthy ? 'var(--success)44' : 'var(--danger)44'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>{p.name}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: p.healthy ? 'var(--success)' : 'var(--danger)' }}>{p.status}</span>
              <span style={{ fontSize: 9, color: 'var(--text4)', marginLeft: 'auto' }}>{fmt(used)} / {fmt(total)}</span>
            </div>
            <Bar pct={pct(used, total)} />
            <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 3 }}>
              {p.topology?.data?.[0]?.type && `RAID: ${p.topology.data[0].type}`}
              {p.autotrim?.value === 'on' && ' · AutoTRIM'}
            </div>
          </div>
        );
      })}

      {/* ── Pools ── */}
      {tab === 'pools' && pools.map(p => (
        <div key={p.name} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', marginBottom: 8,
          border: `1px solid ${p.healthy ? 'var(--success)33' : 'var(--danger)33'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 12 }}>{p.name}</span>
            <span style={{ fontSize: 10, color: p.healthy ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{p.status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', fontSize: 10, marginBottom: 6 }}>
            {[['Used', fmt(p.allocated||0)],['Free', fmt(p.free||0)],
              ['Total', fmt(p.size||0)],['Fragmentation', (p.fragmentation??'—')+'%'],
              ['Dedup', p.dedup?.value??'—'],['Compress ratio', p.compress_ratio?.value??'—']
            ].map(([k,v]) => [
              <span key={k+'k'} style={{ color: 'var(--text4)' }}>{k}</span>,
              <span key={k+'v'}>{v}</span>
            ])}
          </div>
          <Bar pct={pct(p.allocated, p.size)} />
          {(p.topology?.data||[]).map((vdev, vi) => (
            <div key={vi} style={{ marginTop: 6, fontSize: 9, color: 'var(--text3)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text2)' }}>{vdev.type||'DISK'}</span>
              {(vdev.children||[]).map((c,ci) => (
                <span key={ci} style={{ marginLeft: 6, color: c.stats?.state==='ONLINE'?'var(--success)':'var(--danger)' }}>
                  {c.disk||c.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* ── Disks ── */}
      {tab === 'disks' && (
        <div>
          {disks.length === 0 && <div style={{ fontSize: 10, color: 'var(--text4)', fontStyle: 'italic' }}>No disk data</div>}
          {disks.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderBottom: '1px solid var(--border2)', fontSize: 10 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)', minWidth: 40 }}>{d.name}</span>
              <span style={{ color: 'var(--text3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.model||'—'}</span>
              <span style={{ color: 'var(--text4)', minWidth: 42, textAlign: 'right' }}>{fmt(d.size)}</span>
              <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--bg3)', color: 'var(--text4)' }}>{d.type||'—'}</span>
              {d.temp != null && (
                <span style={{ fontSize: 9, color: d.temp > 50 ? 'var(--danger)' : d.temp > 40 ? '#f59e0b' : 'var(--success)', minWidth: 32, textAlign: 'right' }}>
                  {d.temp}°C
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Datasets ── */}
      {tab === 'datasets' && (
        <div>
          {datasets.length === 0 && <div style={{ fontSize: 10, color: 'var(--text4)', fontStyle: 'italic' }}>No dataset data</div>}
          {datasets.map((d, i) => (
            <div key={i} style={{ padding: '5px 8px', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{d.id}</span>
                <span style={{ color: 'var(--text4)', flexShrink: 0, marginLeft: 6 }}>{fmt(d.used)} / {fmt(d.used + d.available)}</span>
              </div>
              <Bar pct={pct(d.used, d.used + d.available)} />
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                {d.compression && <span style={{ fontSize: 8, color: 'var(--text4)' }}>comp:{d.compression}</span>}
                {d.encrypted   && <span style={{ fontSize: 8, color: 'var(--accent)' }}>🔒 enc</span>}
                {d.mountpoint  && <span style={{ fontSize: 8, color: 'var(--text4)' }}>{d.mountpoint}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Network ── */}
      {tab === 'network' && (
        <div>
          {ifaces.length === 0 && <div style={{ fontSize: 10, color: 'var(--text4)', fontStyle: 'italic' }}>No interface data</div>}
          {ifaces.map((iface, i) => (
            <div key={i} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: iface.up ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 11 }}>{iface.name}</span>
                <span style={{ fontSize: 9, color: 'var(--text4)' }}>{iface.type}</span>
                {iface.speed && <span style={{ fontSize: 9, color: 'var(--text4)', marginLeft: 'auto' }}>{iface.speed >= 1000 ? iface.speed/1000+'G' : iface.speed+'M'}</span>}
              </div>
              {iface.aliases.map((a, ai) => (
                <div key={ai} style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 14 }}>{a}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── VMs ── */}
      {tab === 'vms' && vms.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderBottom: '1px solid var(--border2)', fontSize: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: v.status === 'RUNNING' ? 'var(--success)' : 'var(--text4)', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, flex: 1 }}>{v.name}</span>
          <span style={{ color: 'var(--text4)' }}>{v.vcpus} vCPU</span>
          <span style={{ color: 'var(--text4)' }}>{gb(v.memory * 1024 * 1024)}</span>
          <span style={{ fontSize: 9, color: v.status === 'RUNNING' ? 'var(--success)' : 'var(--text4)' }}>{v.status}</span>
        </div>
      ))}

      {/* ── Tasks (Replication + Cloud Sync) ── */}
      {tab === 'tasks' && (
        <div>
          {replication.length > 0 && (
            <div style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>REPLICATION</div>
          )}
          {replication.map((t, i) => {
            const ok = t.state === 'FINISHED';
            const running = t.state === 'RUNNING';
            const failed  = t.state === 'ERROR' || t.state === 'FAILED';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderBottom: '1px solid var(--border2)', fontSize: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: !t.enabled ? 'var(--text4)' : ok ? 'var(--success)' : running ? 'var(--accent)' : failed ? 'var(--danger)' : 'var(--text4)' }} />
                <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                <span style={{ fontSize: 9, color: 'var(--text4)' }}>{t.direction}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3,
                  background: !t.enabled ? 'var(--bg3)' : ok ? 'var(--success)22' : failed ? 'var(--danger)22' : 'var(--bg3)',
                  color: !t.enabled ? 'var(--text4)' : ok ? 'var(--success)' : failed ? 'var(--danger)' : 'var(--text3)' }}>
                  {!t.enabled ? 'disabled' : t.state || '—'}
                </span>
              </div>
            );
          })}
          {cloudsync.length > 0 && (
            <div style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 700, letterSpacing: 1, margin: '8px 0 4px' }}>CLOUD SYNC</div>
          )}
          {cloudsync.map((t, i) => {
            const ok = t.state === 'SUCCESS' || t.state === 'FINISHED';
            const failed = t.state === 'FAILED' || t.state === 'ERROR';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderBottom: '1px solid var(--border2)', fontSize: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: !t.enabled ? 'var(--text4)' : ok ? 'var(--success)' : failed ? 'var(--danger)' : 'var(--text4)' }} />
                <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                <span style={{ fontSize: 9, color: 'var(--text4)' }}>{t.provider}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3,
                  background: !t.enabled ? 'var(--bg3)' : ok ? 'var(--success)22' : failed ? 'var(--danger)22' : 'var(--bg3)',
                  color: !t.enabled ? 'var(--text4)' : ok ? 'var(--success)' : failed ? 'var(--danger)' : 'var(--text3)' }}>
                  {!t.enabled ? 'disabled' : t.state || '—'}
                </span>
              </div>
            );
          })}
          {!hasTasks && <div style={{ fontSize: 10, color: 'var(--text4)', fontStyle: 'italic' }}>No tasks configured</div>}
        </div>
      )}
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
