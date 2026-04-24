// IntegrationPanel.jsx — per-node API integrations (Proxmox, TrueNAS, Unraid, ESXi, probe)
import React, { useState, useEffect, useRef } from 'react';
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

function GuestRow({g,type}){
  const cpuPct=Math.round((g.cpu||0)*100);
  const memPct=pct(g.mem,g.maxmem);
  const running=g.status==='running';
  return(
    <div style={{display:'grid',gridTemplateColumns:'16px 1fr 40px 90px 90px 60px',gap:6,alignItems:'center',
      padding:'5px 8px',borderRadius:5,background:'var(--bg)',marginBottom:3,
      border:`1px solid ${running?'var(--success)22':'var(--border2)'}`}}>
      <span style={{fontSize:9,color:running?'var(--success)':'var(--text4)',fontWeight:700}}>{running?'▶':'■'}</span>
      <div style={{minWidth:0}}>
        <div style={{fontSize:11,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name||`${type}${g.vmid}`}</div>
        <div style={{fontSize:9,color:'var(--text4)'}}>ID {g.vmid} · {uptime(g.uptime)}</div>
      </div>
      <span style={{fontSize:9,color:'var(--text4)',textAlign:'right'}}>{g.cpus||'—'}c</span>
      <div>
        <div style={{fontSize:9,color:'var(--text4)',marginBottom:1}}>CPU {cpuPct}%</div>
        <Bar pct={cpuPct}/>
      </div>
      <div>
        <div style={{fontSize:9,color:'var(--text4)',marginBottom:1}}>RAM {memPct}% <span style={{color:'var(--text4)'}}>{gb(g.mem)}</span></div>
        <Bar pct={memPct}/>
      </div>
      <div style={{fontSize:9,color:'var(--text4)',textAlign:'right'}}>{fmt(g.disk)}</div>
    </div>
  );
}

function ProxmoxMetrics({ data }) {
  const [expanded,setExpanded]=React.useState({});
  const toggle=id=>setExpanded(e=>({...e,[id]:!e[id]}));
  return (
    <div>
      <div style={{fontSize:9,color:'var(--text4)',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
        <span>Proxmox VE {data.version}</span>
        <span style={{marginLeft:'auto'}}>{data.nodes?.length} node(s)</span>
      </div>
      {(data.nodes || []).map(n => {
        const s = n.status || {};
        const cpuPct  = Math.round((s.cpu || 0) * 100);
        const memPct  = pct(s.memory?.used, s.memory?.total);
        const diskPct = pct(s.rootfs?.used, s.rootfs?.total);
        const runVMs  = (n.vms||[]).filter(v=>v.status==='running').length;
        const runLXC  = (n.lxc||[]).filter(v=>v.status==='running').length;
        const allGuests=[...(n.vms||[]).map(v=>({...v,_type:'VM'})),...(n.lxc||[]).map(v=>({...v,_type:'CT'}))];
        const isExp=expanded[n.node];
        return (
          <div key={n.node} style={{background:'var(--bg3)',borderRadius:8,marginBottom:10,
            border:`1px solid ${n.online?'var(--success)44':'var(--danger)44'}`}}>
            {/* Node header */}
            <div style={{padding:'10px 12px',cursor:'pointer'}} onClick={()=>toggle(n.node)}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:n.online?'var(--success)':'var(--danger)',flexShrink:0}}/>
                <span style={{fontWeight:700,fontSize:12}}>{n.node}</span>
                <span style={{fontSize:9,color:'var(--text4)'}}>· up {uptime(s.uptime)}</span>
                <span style={{marginLeft:'auto',fontSize:9,color:'var(--text4)'}}>{n.vms.length}VM · {n.lxc.length}CT · {isExp?'▲':'▼'}</span>
              </div>
              {/* Host metrics */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:8}}>
                <div><div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>CPU ({s.cpuinfo?.cores||'?'}c)</div>
                  <div style={{fontSize:14,fontWeight:700}}>{cpuPct}%</div><Bar pct={cpuPct}/></div>
                <div><div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>RAM</div>
                  <div style={{fontSize:14,fontWeight:700}}>{memPct}%</div>
                  <div style={{fontSize:9,color:'var(--text4)'}}>{gb(s.memory?.used)}/{gb(s.memory?.total)}</div>
                  <Bar pct={memPct}/></div>
                <div><div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>ROOT DISK</div>
                  <div style={{fontSize:14,fontWeight:700}}>{diskPct}%</div>
                  <div style={{fontSize:9,color:'var(--text4)'}}>{fmt(s.rootfs?.used)}/{fmt(s.rootfs?.total)}</div>
                  <Bar pct={diskPct}/></div>
                <div><div style={{fontSize:9,color:'var(--text4)',marginBottom:2}}>RUNNING</div>
                  <div style={{fontSize:13,fontWeight:700}}>{runVMs}VM</div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--accent1)'}}>{runLXC}CT</div></div>
              </div>
              {/* Storage pools */}
              {(n.storage||[]).filter(st=>st.active).length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>
                  {(n.storage||[]).filter(st=>st.active).map(st=>{
                    const sp=pct(st.disk_used,st.total);
                    return(
                      <div key={st.storage} style={{background:'var(--bg)',borderRadius:4,padding:'3px 7px',border:'1px solid var(--border2)',minWidth:80}}>
                        <div style={{fontSize:9,fontWeight:700,color:'var(--text3)'}}>{st.storage}</div>
                        <div style={{fontSize:9,color:'var(--text4)'}}>{fmt(st.disk_used)}/{fmt(st.total)} · {sp}%</div>
                        <Bar pct={sp}/>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Expanded guests */}
            {isExp&&allGuests.length>0&&(
              <div style={{borderTop:'1px solid var(--border2)',padding:'8px 10px'}}>
                <div style={{fontSize:9,fontWeight:700,color:'var(--text4)',letterSpacing:1.5,marginBottom:6}}>
                  VMs & CONTAINERS
                </div>
                <div style={{display:'grid',gridTemplateColumns:'16px 1fr 40px 90px 90px 60px',gap:6,
                  padding:'3px 8px',marginBottom:3}}>
                  {['','NAME','CPU','CPU %','RAM','DISK'].map((h,i)=>(
                    <span key={i} style={{fontSize:8,color:'var(--text4)',fontWeight:700}}>{h}</span>
                  ))}
                </div>
                {allGuests.map(g=><GuestRow key={`${g._type}${g.vmid}`} g={g} type={g._type}/>)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrueNASMetrics({ data }) {
  const info = data.info || {};
  const totalCap = (data.pools || []).reduce((a, p) => a + (p.size?.total || 0), 0);
  const usedCap  = (data.pools || []).reduce((a, p) => a + (p.size?.allocated || 0), 0);
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        <Stat label="HOSTNAME" value={info.hostname || '—'} />
        <Stat label="VERSION" value={(info.version || '').split('-')[0]} />
        <Stat label="UPTIME" value={info.uptimeSeconds ? Math.floor(info.uptimeSeconds / 86400) + 'd' : '—'} />
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {(data.services || []).map(s => (
          <span key={s.service} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3,
            background: s.state === 'RUNNING' ? 'var(--success)22' : 'var(--bg)',
            color: s.state === 'RUNNING' ? 'var(--success)' : 'var(--text4)',
            border: '1px solid var(--border)' }}>
            {s.service}
          </span>
        ))}
      </div>
      {(data.pools || []).map(p => {
        const diskPct = pct(p.size?.allocated, p.size?.total);
        return (
          <div key={p.name} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px', marginBottom: 6,
            border: `1px solid ${p.healthy ? 'var(--success)44' : 'var(--danger)44'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>{p.name}</span>
              <span style={{ fontSize: 9, color: p.healthy ? 'var(--success)' : 'var(--danger)' }}>{p.status}</span>
              <span style={{ fontSize: 9, color: 'var(--text4)', marginLeft: 'auto' }}>{fmt(p.size?.allocated)} / {fmt(p.size?.total)}</span>
            </div>
            <Bar pct={diskPct} />
          </div>
        );
      })}
      {(data.alerts || []).length > 0 && (
        <div style={{ marginTop: 8 }}>
          {data.alerts.map((a, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--danger)', padding: '3px 6px', background: 'var(--danger)11', borderRadius: 4, marginBottom: 3 }}>
              ⚠ {a.formatted || a.text}
            </div>
          ))}
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

// ── Main component ─────────────────────────────────────────────
export default function IntegrationPanel({ node, canEdit, onUpdateProp }) {
  const intType = NODE_INT_MAP[node.type] || 'probe';
  const fields  = INT_FIELDS[intType] || INT_FIELDS.probe;

  const cfg    = node.properties?._integration || {};
  const [form, setForm]   = useState({ type: intType, ...cfg });
  const [data, setData]   = useState(null);
  const [err,  setErr]    = useState('');
  const [busy, setBusy]   = useState(false);
  const [show, setShow]   = useState(false); // show credentials
  const intervalRef       = useRef(null);

  const save = () => onUpdateProp('_integration', form);

  const fetch_ = async (silent = false) => {
    if (!silent) setBusy(true);
    setErr('');
    try {
      const json = await apiFetch(`/integrations/${form.type}`, {
        method: 'POST',
        body: JSON.stringify({ ...form }),
      });
      if (!json.ok) throw new Error(json.error || 'Request failed');
      setData(json);
    } catch(e) { setErr(e.message); }
    finally { if (!silent) setBusy(false); }
  };

  // Auto-refresh every 30s if connected
  useEffect(() => {
    if (data && !err) {
      intervalRef.current = setInterval(() => fetch_(true), 30000);
    }
    return () => clearInterval(intervalRef.current);
  }, [data, err]);

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
              {data ? '● live' : '○ not connected'}
            </span>
          )}
          <button onClick={() => setShow(s => !s)}
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
              <button onClick={() => { save(); setShow(false); }}
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
          <button onClick={() => fetch_()} disabled={busy}
            style={{ flex: 1, padding: '7px', background: busy ? 'var(--bg3)' : 'var(--accent2)', border: 'none',
              borderRadius: 6, color: busy ? 'var(--text4)' : '#fff', cursor: busy ? 'default' : 'pointer',
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>
            {busy ? '⏳ Connecting…' : data ? '🔄 Refresh' : '⚡ Connect'}
          </button>
          {data && <button onClick={() => { setData(null); clearInterval(intervalRef.current); }}
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
