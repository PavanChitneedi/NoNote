import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import https from 'https';

const router = Router();
router.use(authenticate);

// HTTPS agent that allows self-signed certs — used ONLY for homelab integration proxying.
// NOT set globally so LLM API calls still use full TLS verification.
const selfSignedAgent = new https.Agent({ rejectUnauthorized: false });

// ── SSRF guard: block private/internal IP ranges ──────────────
function isSafeUrl(rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch { return false; }
  const hostname = parsed.hostname.toLowerCase();

  if (!['http:', 'https:'].includes(parsed.protocol)) return false;

  const BLOCKED = [
    /^localhost$/i, /^127\./, /^0\./, /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
    /^169\.254\./, /^::1$/, /^fc00:/i, /^fe80:/i,
  ];
  if (BLOCKED.some(r => r.test(hostname))) return false;

  const INTERNAL = ['postgres', 'redis', 'backend', 'frontend', 'nginx'];
  if (INTERNAL.includes(hostname)) return false;

  return true;
}

// ── Credential sanity check: non-empty, printable ASCII, reasonable length ──
function isValidToken(t) {
  return typeof t === 'string' && t.length >= 4 && t.length <= 2048 && /^[\x20-\x7E]+$/.test(t);
}

async function go(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const agentOpt = url.startsWith('https://') ? { agent: selfSignedAgent } : {};
    const r = await fetch(url, { ...opts, signal: ctrl.signal, ...agentOpt });
    clearTimeout(timer);
    return r;
  } catch(e) { clearTimeout(timer); throw e; }
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
  try {
    const [iR, pR, aR, sR] = await Promise.all([
      go(`${base}/api/v2.0/system/info`, { headers: h }),
      go(`${base}/api/v2.0/pool`,        { headers: h }),
      go(`${base}/api/v2.0/alert/list`,  { headers: h }),
      go(`${base}/api/v2.0/service`,     { headers: h }),
    ]);
    const [info, pools, alerts, services] = await Promise.all([iR.json(), pR.json(), aR.json(), sR.json()]);
    res.json({ ok: true, info, pools, alerts: (alerts||[]).filter(a => a.level !== 'INFO'), services });
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
