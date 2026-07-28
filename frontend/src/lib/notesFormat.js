// ── Notes helpers ─────────────────────────────────────────────
function looksLikeNote(obj) {
  return obj && typeof obj === 'object' && ('id' in obj || 'title' in obj || 'content' in obj);
}
function escCtrl(s) {
  // eslint-disable-next-line no-control-regex -- intentionally matching raw control chars to escape them
  return s.replace(/[\x00-\x1f]/g, c => {
    const m = {'\n':'\\n','\r':'\\r','\t':'\\t'};
    return m[c] || ('\\u' + c.charCodeAt(0).toString(16).padStart(4,'0'));
  });
}
function tryExtractNotes(str) {
  if (typeof str !== 'string' || !str.trim()) return null;
  const s = str.trim();
  if (s.startsWith('[')) {
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.every(looksLikeNote)) return p;
    } catch {}
  }
  if (s.startsWith('{')) {
    // Escape literal control chars (e.g. \n newline) before re-parsing as JSON array
    try {
      const p = JSON.parse('[' + escCtrl(s) + ']');
      if (Array.isArray(p) && p.every(looksLikeNote)) return p;
    } catch {}
    try {
      const p = JSON.parse(escCtrl(s));
      if (looksLikeNote(p)) return [p];
    } catch {}
  }
  return null;
}
export function parseNotes(raw) {
  if (!raw) return [];
  // Already a proper array
  if (Array.isArray(raw)) {
    return raw.flatMap(n => {
      if (!n || typeof n !== 'object') return [];
      // Check if this note's content is itself a serialized notes array (corruption)
      const inner = tryExtractNotes(n.content);
      if (inner && inner.length > 0) return inner;
      return [{ id: n.id || Math.random().toString(36).slice(2), title: n.title || '', content: n.content || '', sensitive: !!n.sensitive }];
    });
  }
  // String from DB
  if (typeof raw === 'string') {
    const extracted = tryExtractNotes(raw);
    if (extracted) return parseNotes(extracted); // recurse to handle nested corruption
    if (raw.trim()) return [{ id: Math.random().toString(36).slice(2), title: '', content: raw, sensitive: false }];
  }
  return [];
}
export function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
export function serializeNotes(notes) {
  return JSON.stringify(Array.isArray(notes) ? notes : []);
}
