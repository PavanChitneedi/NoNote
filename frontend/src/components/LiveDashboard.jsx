// LiveDashboard.jsx — shows live metrics for all nodes with integrations configured
import { useState, useEffect, useRef, useCallback } from 'react';
import { NODE_INT_MAP, Bar, Stat, fmt, gb, pct } from './IntegrationPanel.jsx';

const API = '/api/integrations';
const REFRESH_INTERVAL = 30000;

function authHeader() {
  const t = localStorage.getItem('nn_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
}

async function fetchIntegration(node) {
  const cfg = node.properties?._integration;
  if (!cfg?.url) return null;
  const type = cfg.type || NODE_INT_MAP[node.type] || 'probe';
  try {
    const r = await fetch(`${API}/${type}`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify(cfg),
    });
    const json = await r.json();
    return { nodeId: node.id, type, data: json, ok: json.ok, ts: Date.now() };
  } catch(e) {
    return { nodeId: node.id, type, ok: false, error: e.message, ts: Date.now() };
  }
}

// ── Mini card renderers ────────────────────────────────────────
function ProxmoxCard({ data, title }) {
  const first = data.nodes?.[0];
  if (!first) return <div style={{ color: 'var(--text4)', fontSize: 11 }}>No nodes</div>;
  const s = first.status || {};
  const cpuPct = Math.round((s.cpu || 0) * 100);
  const memPct = pct(s.memory?.used, s.memory?.total);
  const totalVMs  = data.nodes.reduce((a, n) => a + n.vms.length, 0);
  const runVMs    = data.nodes.reduce((a, n) => a + n.vms.filter(v => v.status === 'running').length, 0);
  const totalLXC  = data.nodes.reduce((a, n) => a + n.lxc.length, 0);
  const runLXC    = data.nodes.reduce((a, n) => a + n.lxc.filter(v => v.status === 'running').length, 0);
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 6 }}>v{data.version} · {data.nodes.length} node(s)</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        <Stat label="CPU" value={`${cpuPct}%`} />
        <Stat label="RAM" value={`${memPct}%`} />
        <Stat label="VMs" value={`${runVMs}/${totalVMs}`} />
        <Stat label="LXC" value={`${runLXC}/${totalLXC}`} />
      </div>
      <Bar pct={cpuPct} /><Bar pct={memPct} />
    </div>
  );
}

function TrueNASCard({ data }) {
  const pools = data.pools || [];
  const totalCap = pools.reduce((a, p) => a + (p.size?.total || 0), 0);
  const usedCap  = pools.reduce((a, p) => a + (p.size?.allocated || 0), 0);
  const healthy  = pools.every(p => p.healthy);
  const alertCount = (data.alerts || []).length;
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 6 }}>{data.info?.hostname} · {(data.info?.version||'').split('-')[0]}</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
        <Stat label="STORAGE" value={`${pct(usedCap, totalCap)}%`} sub={`${fmt(usedCap)} / ${fmt(totalCap)}`} />
        <Stat label="POOLS" value={pools.length} sub={healthy ? '✓ healthy' : '⚠ degraded'} />
        <Stat label="ALERTS" value={alertCount} sub={alertCount > 0 ? '⚠' : '✓'} />
      </div>
      <Bar pct={pct(usedCap, totalCap)} />
    </div>
  );
}

function UnraidCard({ data }) {
  const sys = data.data?.system || {};
  const mem = sys.memory || {};
  const containers = data.data?.docker?.containers || [];
  const running = containers.filter(c => c.state === 'running').length;
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
        <Stat label="CPU" value={`${Math.round(sys.cpu?.usage || 0)}%`} />
        <Stat label="RAM" value={`${pct(mem.total - mem.free, mem.total)}%`} />
        <Stat label="CONTAINERS" value={`${running}/${containers.length}`} />
      </div>
      <Bar pct={Math.round(sys.cpu?.usage || 0)} />
      <Bar pct={pct(mem.total - mem.free, mem.total)} />
    </div>
  );
}

function ProbeCard({ data }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 28 }}>{data.ok ? '✅' : '❌'}</span>
      <div>
        <div style={{ fontWeight: 700, color: data.ok ? 'var(--success)' : 'var(--danger)' }}>
          {data.ok ? 'Online' : 'Unreachable'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text4)' }}>HTTP {data.status} · {data.ms}ms</div>
      </div>
    </div>
  );
}

const CARD_RENDERERS = { proxmox: ProxmoxCard, truenas: TrueNASCard, freenas: TrueNASCard, unraid: UnraidCard, probe: ProbeCard };

// ── Main LiveDashboard ─────────────────────────────────────────
export default function LiveDashboard({ maps }) {
  const [nodes, setNodes]     = useState([]);
  const [results, setResults] = useState({}); // nodeId → result
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  // Load all nodes from all maps that have _integration configured
  const loadNodes = useCallback(async () => {
    setLoading(true);
    try {
      const t = localStorage.getItem('nn_token');
      const all = await Promise.all(
        maps.map(m => fetch(`/api/maps/${m.id}`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).catch(() => null))
      );
      const integNodes = all.flatMap(d => {
        if (!d?.nodes) return [];
        return d.nodes
          .filter(n => n.properties?._integration?.url)
          .map(n => ({ ...n, mapTitle: maps.find(m => m.id === d.map?.id)?.title || 'Map', mapId: d.map?.id }));
      });
      setNodes(integNodes);
    } finally { setLoading(false); }
  }, [maps]);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const fetches = nodes.map(n => fetchIntegration(n));
    const all = await Promise.allSettled(fetches);
    const map = {};
    all.forEach((r, i) => { if (r.status === 'fulfilled' && r.value) map[nodes[i].id] = r.value; });
    setResults(map);
    setLastRefresh(new Date());
    if (!silent) setRefreshing(false);
  }, [nodes]);

  useEffect(() => { loadNodes(); }, [maps]);
  useEffect(() => {
    if (nodes.length > 0) refresh();
  }, [nodes]);
  useEffect(() => {
    intervalRef.current = setInterval(() => refresh(true), REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  if (loading) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text4)' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
      Loading integrations…
    </div>
  );

  if (nodes.length === 0) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text4)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔌</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>No integrations configured</div>
      <div style={{ fontSize: 12, maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
        Open any node in a map, go to the <strong>🔌 Live</strong> tab, configure your Proxmox / TrueNAS / Unraid credentials, and click Save. It will appear here automatically.
      </div>
    </div>
  );

  const online  = Object.values(results).filter(r => r.ok).length;
  const offline = Object.values(results).filter(r => r && !r.ok).length;
  const pending = nodes.length - Object.keys(results).length;

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px',
        background: 'var(--bg3)', borderRadius: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          <div style={{ fontSize: 11 }}><span style={{ color: 'var(--success)', fontWeight: 700 }}>● {online}</span> online</div>
          {offline > 0 && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--danger)', fontWeight: 700 }}>● {offline}</span> offline</div>}
          {pending > 0 && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--text4)', fontWeight: 700 }}>○ {pending}</span> pending</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastRefresh && <span style={{ fontSize: 9, color: 'var(--text4)' }}>Updated {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={() => refresh()} disabled={refreshing}
            style={{ fontSize: 10, background: 'none', border: '1px solid var(--border)', borderRadius: 4,
              color: refreshing ? 'var(--text4)' : 'var(--text3)', cursor: refreshing ? 'default' : 'pointer',
              padding: '3px 10px', fontFamily: 'var(--font-ui)' }}>
            {refreshing ? '⏳' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {nodes.map(node => {
          const cfg    = node.properties._integration;
          const result = results[node.id];
          const intType = cfg.type || NODE_INT_MAP[node.type] || 'probe';
          const Renderer = CARD_RENDERERS[intType];
          const isOnline = result?.ok;
          const hasResult = !!result;

          return (
            <div key={node.id} style={{ background: 'var(--bg2)', border: `1px solid ${isOnline ? 'var(--success)44' : hasResult ? 'var(--danger)44' : 'var(--border)'}`,
              borderRadius: 10, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                  background: isOnline ? 'var(--success)' : hasResult ? 'var(--danger)' : 'var(--text4)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {node.title}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text4)' }}>
                    {intType.toUpperCase()} · {node.mapTitle} · {cfg.url?.replace(/^https?:\/\//, '').split('/')[0]}
                  </div>
                </div>
                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10,
                  background: isOnline ? 'var(--success)22' : hasResult ? 'var(--danger)22' : 'var(--bg3)',
                  color: isOnline ? 'var(--success)' : hasResult ? 'var(--danger)' : 'var(--text4)',
                  border: `1px solid ${isOnline ? 'var(--success)' : hasResult ? 'var(--danger)' : 'var(--border)'}` }}>
                  {isOnline ? 'online' : hasResult ? 'offline' : '…'}
                </span>
              </div>

              {/* Metrics */}
              {!hasResult && (
                <div style={{ fontSize: 11, color: 'var(--text4)', fontStyle: 'italic' }}>Connecting…</div>
              )}
              {result?.error && (
                <div style={{ fontSize: 10, color: 'var(--danger)' }}>⚠ {result.error}</div>
              )}
              {result?.ok && Renderer && <Renderer data={result.data} title={node.title} />}

              {/* Timestamp */}
              {result?.ts && (
                <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 8, textAlign: 'right' }}>
                  {new Date(result.ts).toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
