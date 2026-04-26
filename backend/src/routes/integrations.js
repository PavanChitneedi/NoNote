import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import https from 'https';
import http from 'http';
import { WebSocket } from 'ws';

const router = Router();
router.use(authenticate);

// ── URL safety check ─────────────────────────────────────────
// Integration routes are FOR homelab use — private IPs (192.168.x, 10.x, 172.16-31.x)
// are ALLOWED because Proxmox/TrueNAS/Unraid/ESXi live on LAN.
// Only blocked: cloud metadata endpoint, loopback, Docker service names.
function isSafeUrl(rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch { return false; }
  const hostname = parsed.hostname.toLowerCase();

  if (!['http:', 'https:'].includes(parsed.protocol)) return false;

  // Block loopback
  if (/^localhost$/i.test(hostname) || /^127\./.test(hostname) || /^::1$/.test(hostname)) return false;

  // Block cloud metadata (AWS/Azure/GCP link-local) — not a homelab address
  if (/^169\.254\./.test(hostname)) return false;

  // Block Docker internal service names (not IPs)
  const INTERNAL = ['postgres', 'redis', 'backend', 'frontend', 'nginx'];
  if (INTERNAL.includes(hostname)) return false;

  // Private IPs (192.168.x, 10.x, 172.16-31.x) are ALLOWED — homelab lives here
  return true;
}

// ── Credential sanity check: non-empty, printable ASCII, reasonable length ──
function isValidToken(t) {
  return typeof t === 'string' && t.length >= 4 && t.length <= 2048 && /^[\x20-\x7E]+$/.test(t);
}


// Self-signed cert agent — homelab appliances use self-signed TLS certs
const selfSignedAgent = new https.Agent({ rejectUnauthorized: false });

// ── HTTP wrapper using https.request — correctly applies 'agent' unlike native fetch ──
function go(url, opts = {}, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timeout')), timeout);
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: opts.method || 'GET',
      headers: opts.headers || {},
      ...(isHttps ? { agent: selfSignedAgent } : {}),
    };
    if (opts.body) {
      reqOpts.headers['Content-Length'] = Buffer.byteLength(opts.body);
    }
    const req = lib.request(reqOpts, (res) => {
      clearTimeout(timer);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(body)),
          text: () => Promise.resolve(body),
        });
      });
    });
    req.on('error', e => { clearTimeout(timer); reject(e); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}


// ── TrueNAS WebSocket realtime bridge ────────────────────────
// Tries DDP protocol (/websocket) then JSON-RPC 2.0 (/api/current)
// Returns { cpuPct, cpuTemp, memUsed, memTotal } or null on failure
function truenasRealtime(baseUrl, token) {
  const toWs = u => u.replace(/^http/, u.startsWith('https') ? 'wss' : 'ws');
  const base  = baseUrl.replace(/\/$/, '');
  const paths = [`${toWs(base)}/websocket`, `${toWs(base)}/api/current`];

  const tryPath = (wsUrl, isDDP) => new Promise(resolve => {
    let done = false;
    const finish = v => { if (!done) { done = true; try { ws.close(); } catch {} resolve(v); } };
    const timer  = setTimeout(() => finish(null), 5000);

    let ws;
    try { ws = new WebSocket(wsUrl, { rejectUnauthorized: false }); }
    catch { clearTimeout(timer); resolve(null); return; }

    ws.on('error', () => { clearTimeout(timer); finish(null); });

    const parse = raw => { try { return JSON.parse(raw.toString()); } catch { return null; } };

    const extract = fields => {
      if (!fields) return null;
      const cpu  = fields.cpu;
      const mem  = fields.memory?.physical || fields.memory;
      return {
        cpuPct:   cpu?.average?.percent != null ? Math.round(cpu.average.percent) : null,
        cpuTemp:  cpu?.temperature?.average ?? cpu?.temperature ?? null,
        memUsed:  mem?.used   ?? (mem?.total != null && mem?.available != null ? mem.total - mem.available : null),
        memTotal: mem?.total  ?? null,
        memFree:  mem?.free   ?? mem?.available ?? null,
      };
    };

    if (isDDP) {
      // Old DDP/Meteor protocol
      ws.on('open', () => ws.send(JSON.stringify({ id: '1', msg: 'connect', version: '1', support: ['1'] })));
      ws.on('message', raw => {
        const m = parse(raw); if (!m) return;
        if (m.msg === 'connected')
          ws.send(JSON.stringify({ id: '2', msg: 'method', method: 'auth.login_with_api_key', params: [token] }));
        else if (m.id === '2' && m.result != null)
          ws.send(JSON.stringify({ id: '3', msg: 'sub', name: 'reporting.realtime', params: [] }));
        else if (m.msg === 'added' && m.collection === 'reporting.realtime') {
          clearTimeout(timer); finish(extract(m.fields));
        } else if (m.id === '2' && m.error)
          finish(null); // auth failed
      });
    } else {
      // JSON-RPC 2.0 (SCALE 25.04+)
      let authDone = false;
      ws.on('open', () => ws.send(JSON.stringify({
        jsonrpc: '2.0', method: 'auth.login_with_api_key', id: 1, params: [token]
      })));
      ws.on('message', raw => {
        const m = parse(raw); if (!m) return;
        if (!authDone && m.id === 1) {
          if (m.error) return finish(null);
          authDone = true;
          ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'reporting.realtime', id: 2, params: [{ interval: 2 }] }));
        } else if (authDone && (m.id === 2 || m.method === 'reporting.realtime')) {
          const fields = m.result ?? m.params?.result ?? m.params;
          const r = extract(fields);
          if (r?.cpuPct != null || r?.memTotal != null) { clearTimeout(timer); finish(r); }
        }
      });
    }
  });

  return (async () => {
    for (let i = 0; i < paths.length; i++) {
      const r = await tryPath(paths[i], i === 0);
      if (r && (r.cpuPct != null || r.memTotal != null)) return r;
    }
    return null;
  })();
}

// ── Proxmox SMART temperatures ────────────────────────────────
// Returns { node: { diskPath: tempC } } across all nodes (best-effort, parallel)
async function proxmoxDiskTemps(base, h, nodes) {
  const result = {};
  await Promise.all(nodes.map(async node => {
    try {
      const r = await go(`${base}/api2/json/nodes/${node}/disks/list`, { headers: h }, 6000);
      if (!r.ok) return;
      const list = (await r.json()).data || [];
      const temps = {};
      await Promise.all(list.slice(0, 8).map(async d => {
        if (!d.devpath) return;
        try {
          const sr = await go(`${base}/api2/json/nodes/${node}/disks/smart?disk=${encodeURIComponent(d.devpath)}`, { headers: h }, 5000);
          if (!sr.ok) return;
          const smart = (await sr.json()).data || {};
          // Temperature is in SMART attribute 190 or 194
          const tempAttr = (smart.attributes || []).find(a => a.name === 'Temperature_Celsius' || a.id === 194 || a.id === 190);
          if (tempAttr) temps[d.devpath] = parseInt(tempAttr.raw?.split(' ')[0] || tempAttr.value);
          // Or direct field
          else if (smart.temperature != null) temps[d.devpath] = smart.temperature;
        } catch {}
      }));
      result[node] = temps;
    } catch {}
  }));
  return result;
}

// ── Proxmox VE ───────────────────────────────────────────────
router.post('/proxmox', async (req, res) => {
  const { url, token } = req.body;
  if (!url || !token) return res.status(400).json({ error: 'url and token required' });
  if (!isValidToken(token)) return res.status(400).json({ error: 'Invalid token format' });
  if (!isSafeUrl(url)) return res.status(400).json({ error: 'Invalid or disallowed URL' });
  const base = url.replace(/\/$/, '');
  const h = { Authorization: `PVEAPIToken=${token}` };
  try {
    const [nR, vR] = await Promise.all([
      go(`${base}/api2/json/nodes`,   { headers: h }),
      go(`${base}/api2/json/version`, { headers: h }),
    ]);
    const [nJ, vJ] = await Promise.all([nR.json(), vR.json()]);
    const nodeList = (nJ.data || []).slice(0, 6);
    const details = await Promise.all(nodeList.map(async n => {
      const [sR, vmR, lxR, stR] = await Promise.all([
        go(`${base}/api2/json/nodes/${n.node}/status`,  { headers: h }),
        go(`${base}/api2/json/nodes/${n.node}/qemu`,    { headers: h }),
        go(`${base}/api2/json/nodes/${n.node}/lxc`,     { headers: h }),
        go(`${base}/api2/json/nodes/${n.node}/storage`, { headers: h }),
      ]);
      const [s, vms, lxc, storage] = await Promise.all([sR.json(), vmR.json(), lxR.json(), stR.json()]);
      // CPU temp from node status (available on some Proxmox installs)
      const cpuTemp = s.data?.cputemp ?? null;
      return { node: n.node, online: n.status === 'online', status: s.data, cpuTemp, vms: vms.data || [], lxc: lxc.data || [], storage: storage.data || [] };
    }));
    // Disk temps via SMART (parallel, best-effort)
    const diskTemps = await proxmoxDiskTemps(base, h, nodeList.map(n => n.node));
    const nodesWithTemps = details.map(n => ({ ...n, diskTemps: diskTemps[n.node] || {} }));
    res.json({ ok: true, version: vJ.data?.version, nodes: nodesWithTemps });
  } catch(e) { res.status(502).json({ error: e.message }); }
});

// ── TrueNAS ──────────────────────────────────────────────────
router.post('/truenas', async (req, res) => {
  const { url, token } = req.body;
  if (!url || !token) return res.status(400).json({ error: 'url and token required' });
  if (!isValidToken(token)) return res.status(400).json({ error: 'Invalid token format' });
  if (!isSafeUrl(url)) return res.status(400).json({ error: 'Invalid or disallowed URL' });
  const base = url.replace(/\/$/, '');
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Safe GET — returns parsed JSON or null
  const safe = async (endpoint, timeout = 8000) => {
    try {
      const r = await go(`${base}${endpoint}`, { headers: h }, timeout);
      if (!r.ok) return null;
      return JSON.parse(await r.text());
    } catch { return null; }
  };

  // Safe POST — returns parsed JSON or null
  const safePost = async (endpoint, body, timeout = 10000) => {
    try {
      const bodyStr = JSON.stringify(body);
      const r = await go(`${base}${endpoint}`, { method: 'POST', headers: h, body: bodyStr }, timeout);
      if (!r.ok) return null;
      return JSON.parse(await r.text());
    } catch { return null; }
  };

  try {
    // Batch 1: core (always needed)
    const [info, pools, alerts, services] = await Promise.all([
      safe('/api/v2.0/system/info'),
      safe('/api/v2.0/pool'),
      safe('/api/v2.0/alert/list'),
      safe('/api/v2.0/service'),
    ]);

    // Batch 2: extended (best-effort, parallel)
    const [disks, datasets, interfaces, vms, replication, cloudsync, apps, bootState, smartResults] = await Promise.all([
      safe('/api/v2.0/disk'),
      safe('/api/v2.0/pool/dataset?limit=100'),
      safe('/api/v2.0/interface'),
      safe('/api/v2.0/vm'),
      safe('/api/v2.0/replication/task'),
      safe('/api/v2.0/cloudsync/task'),
      safe('/api/v2.0/app'),                        // SCALE 24+ apps (Docker-based)
      safe('/api/v2.0/boot/get_state'),              // boot pool health
      safe('/api/v2.0/smart/test/results?limit=10'), // recent SMART results
    ]);

    // Batch 3: disk temps + WS realtime (run in parallel)
    const diskNames = (disks || []).map(d => d.name).filter(Boolean);
    const [diskTemps, realtime] = await Promise.all([
      diskNames.length > 0
        ? safePost('/api/v2.0/disk/temperature_agg', { names: diskNames, powermode: 'NEVER' })
        : Promise.resolve(null),
      truenasRealtime(base, token),
    ]);

    // ── Process pools ──
    const poolList = pools || [];
    const totalSize      = poolList.reduce((a, p) => a + (p.size      || 0), 0);
    const totalAllocated = poolList.reduce((a, p) => a + (p.allocated || 0), 0);
    const totalFree      = poolList.reduce((a, p) => a + (p.free      || 0), 0);

    // ── Process disks (merge in temperatures) ──
    const diskSummary = (disks || []).map(d => ({
      name:   d.name,
      size:   d.size,
      model:  d.model,
      serial: d.serial,
      type:   d.type,
      rotationrate: d.rotationrate,
      temp:   diskTemps?.[d.name] ?? d.temperature ?? null,
    }));

    // ── Root datasets ──
    const rootDatasets = (datasets || [])
      .filter(d => !d.id.includes('/') || d.id.split('/').length <= 2)
      .slice(0, 30)
      .map(d => ({
        id:          d.id,
        used:        d.used?.parsed       || 0,
        available:   d.available?.parsed  || 0,
        compression: d.compression?.value,
        type:        d.type,
        mountpoint:  d.mountpoint,
        encrypted:   !!d.encrypted,
        dedup:       d.dedup?.value,
      }));

    // ── Network interfaces ──
    const netIfaces = (interfaces || [])
      .filter(i => !i.fake)
      .map(i => ({
        name:    i.name,
        type:    i.type,
        up:      i.state?.link_state === 'LINK_STATE_UP',
        speed:   i.state?.speed,
        mtu:     i.mtu,
        aliases: (i.aliases || []).filter(a => a.type === 'INET' || a.type === 'INET6').map(a => a.address),
      }));

    // ── VMs ──
    const vmSummary = (vms || []).map(v => ({
      name:   v.name,
      status: v.status?.state,
      vcpus:  v.vcpus,
      memory: v.memory,
      description: v.description,
    }));

    // ── Apps (SCALE 24+) ──
    const appSummary = (apps || []).map(a => ({
      name:    a.name,
      state:   a.state,
      version: a.human_version || a.metadata?.app_version,
      train:   a.metadata?.train,
      containers: a.active_workloads?.containers || 0,
    }));

    // ── Replication tasks ──
    const replTasks = (replication || []).map(t => ({
      name:      t.name,
      enabled:   t.enabled,
      direction: t.direction,
      transport: t.transport,
      state:     t.state?.state,
      error:     t.state?.error || null,
    }));

    // ── Cloud sync tasks ──
    const csyncTasks = (cloudsync || []).map(t => ({
      name:      t.description || t.path,
      enabled:   t.enabled,
      direction: t.direction,
      provider:  t.credentials?.provider || '?',
      state:     t.job?.state || t.state,
      error:     t.job?.error || null,
    }));

    // ── Boot pool ──
    const bootPool = bootState ? {
      name:    bootState.name,
      status:  bootState.status,
      healthy: bootState.healthy,
      size:    bootState.size,
      allocated: bootState.allocated,
    } : null;

    // ── SMART results (recent failures/warnings only) ──
    const smartAlerts = (smartResults || [])
      .filter(r => r.status !== 'SUCCESS' && r.status !== 'RUNNING')
      .slice(0, 5)
      .map(r => ({ disk: r.disk, type: r.type, status: r.status, description: r.description }));

    res.json({
      ok:          true,
      realtime:    realtime || null,   // { cpuPct, cpuTemp, memUsed, memTotal } from WS
      info:        info || {},
      pools:       poolList,
      alerts:      (alerts || []).filter(a => a.level !== 'INFO'),
      services:    services || [],
      disks:       diskSummary,
      datasets:    rootDatasets,
      interfaces:  netIfaces,
      vms:         vmSummary,
      apps:        appSummary,
      storage:     { totalSize, totalAllocated, totalFree },
      replication: replTasks,
      cloudsync:   csyncTasks,
      bootPool,
      smartAlerts,
    });
  } catch(e) { res.status(502).json({ error: e.message }); }
});

// ── Unraid ───────────────────────────────────────────────────
router.post('/unraid', async (req, res) => {
  const { url, token } = req.body;
  if (!url || !token) return res.status(400).json({ error: 'url and token required' });
  if (!isValidToken(token)) return res.status(400).json({ error: 'Invalid token format' });
  if (!isSafeUrl(url)) return res.status(400).json({ error: 'Invalid or disallowed URL' });
  const base = url.replace(/\/$/, '');
  const gql = `{ info { os { platform version } } system { cpu { usage temp } memory { total free } disks { disk { name size temp status } } } docker { containers { names status state cpu memory } } vms { domain { name state } } }`;
  try {
    const r = await go(`${base}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': token },
      body: JSON.stringify({ query: gql }),
    });
    res.json({ ok: true, ...(await r.json()) });
  } catch(e) { res.status(502).json({ error: e.message }); }
});

// ── ESXi / vCenter ───────────────────────────────────────────
router.post('/esxi', async (req, res) => {
  const { url, username, password } = req.body;
  if (!url || !username || !password) return res.status(400).json({ error: 'url, username, password required' });
  if (!isSafeUrl(url)) return res.status(400).json({ error: 'Invalid or disallowed URL' });
  const base = url.replace(/\/$/, '');
  try {
    const sR = await go(`${base}/api/session`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') },
    });
    const sessionId = await sR.json();
    const h = { 'vmware-api-session-id': sessionId };
    const [hR, vR] = await Promise.all([
      go(`${base}/api/vcenter/host`, { headers: h }),
      go(`${base}/api/vcenter/vm`,   { headers: h }),
    ]);
    const [hosts, vms] = await Promise.all([hR.json(), vR.json()]);
    res.json({ ok: true, hosts, vms });
  } catch(e) { res.status(502).json({ error: e.message }); }
});

// ── Generic HTTP probe ────────────────────────────────────────
router.post('/probe', async (req, res) => {
  const { url, method = 'GET', headers = {} } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  if (!isSafeUrl(url)) return res.status(400).json({ error: 'Invalid or disallowed URL' });
  const t0 = Date.now();
  try {
    const r = await go(url, { method, headers });
    res.json({ ok: r.ok, status: r.status, ms: Date.now() - t0 });
  } catch(e) { res.json({ ok: false, error: e.message, ms: Date.now() - t0 }); }
});

export default router;
