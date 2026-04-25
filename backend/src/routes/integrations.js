import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import https from 'https';
import http from 'http';

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
function go(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timeout')), 8000);
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
    const details = await Promise.all((nJ.data || []).slice(0, 6).map(async n => {
      const [sR, vmR, lxR, stR] = await Promise.all([
        go(`${base}/api2/json/nodes/${n.node}/status`,  { headers: h }),
        go(`${base}/api2/json/nodes/${n.node}/qemu`,    { headers: h }),
        go(`${base}/api2/json/nodes/${n.node}/lxc`,     { headers: h }),
        go(`${base}/api2/json/nodes/${n.node}/storage`, { headers: h }),
      ]);
      const [s, vms, lxc, storage] = await Promise.all([sR.json(), vmR.json(), lxR.json(), stR.json()]);
      return { node: n.node, online: n.status === 'online', status: s.data, vms: vms.data || [], lxc: lxc.data || [], storage: storage.data || [] };
    }));
    res.json({ ok: true, version: vJ.data?.version, nodes: details });
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

  // Safe fetch — returns parsed JSON or null on any failure
  const safe = async (endpoint) => {
    try {
      const r = await go(`${base}${endpoint}`, { headers: h });
      if (!r.ok) return null;
      const text = await r.text();
      return JSON.parse(text);
    } catch { return null; }
  };

  try {
    // Core endpoints (always needed)
    const [info, pools, alerts, services] = await Promise.all([
      safe('/api/v2.0/system/info'),
      safe('/api/v2.0/pool'),
      safe('/api/v2.0/alert/list'),
      safe('/api/v2.0/service'),
    ]);

    // Extended endpoints (best-effort — may not exist on all versions)
    const [disks, datasets, interfaces, vms] = await Promise.all([
      safe('/api/v2.0/disk'),
      safe('/api/v2.0/pool/dataset?limit=200'),
      safe('/api/v2.0/interface'),
      safe('/api/v2.0/vm'),
    ]);

    // Aggregate storage stats
    const poolList = pools || [];
    const totalSize      = poolList.reduce((a, p) => a + (p.size?.total     || p.size || 0), 0);
    const totalAllocated = poolList.reduce((a, p) => a + (p.size?.allocated || 0), 0);
    const totalFree      = poolList.reduce((a, p) => a + (p.size?.free      || 0), 0);

    // Disk summary
    const diskSummary = (disks || []).map(d => ({
      name: d.name, size: d.size, model: d.model,
      serial: d.serial, type: d.type, temp: d.temperature,
    }));

    // Root datasets only
    const rootDatasets = (datasets || [])
      .filter(d => !d.id.includes('/') || d.id.split('/').length <= 2)
      .slice(0, 20)
      .map(d => ({
        id: d.id, used: d.used?.parsed || 0, available: d.available?.parsed || 0,
        compression: d.compression?.value, type: d.type,
        mountpoint: d.mountpoint, encrypted: !!d.encrypted,
      }));

    // Network interfaces
    const netIfaces = (interfaces || [])
      .filter(i => !i.fake)
      .map(i => ({
        name: i.name, type: i.type,
        up: i.state?.link_state === 'LINK_STATE_UP',
        speed: i.state?.speed,
        aliases: (i.aliases || []).filter(a => a.type === 'INET' || a.type === 'INET6').map(a => a.address),
      }));

    // VMs
    const vmSummary = (vms || []).map(v => ({
      name: v.name, status: v.status?.state, vcpus: v.vcpus, memory: v.memory,
    }));

    res.json({
      ok: true,
      info:       info || {},
      pools:      poolList,
      alerts:     (alerts || []).filter(a => a.level !== 'INFO'),
      services:   services || [],
      disks:      diskSummary,
      datasets:   rootDatasets,
      interfaces: netIfaces,
      vms:        vmSummary,
      storage:    { totalSize, totalAllocated, totalFree },
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
  const gql = `{ info { os { platform version } } system { cpu { usage } memory { total free } } docker { containers { names status state cpu memory } } vms { domain { name state } } }`;
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
