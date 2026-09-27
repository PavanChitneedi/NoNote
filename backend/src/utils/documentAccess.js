// Map editors may read private notes. Viewers receive neither private bodies
// nor credential-shaped fields, including nested extension/custom properties.
export const canReadPrivate = permission => ['owner', 'admin', 'editor'].includes(permission);
const secretKey = /password|passwd|secret|token|api.?key|authorization|credential/i;
export function stripSecrets(value) {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !secretKey.test(key))
    .map(([key, item]) => [key, stripSecrets(item)]));
}
export function readableNode(node, permission) {
  if (canReadPrivate(permission)) return node;
  const clean = stripSecrets(node);
  if (node.notes_private) clean.node_notes = '';
  let notes = node.notes;
  if (typeof notes === 'string') {
    try { notes = JSON.parse(notes); } catch { notes = []; }
  }
  notes = Array.isArray(notes) ? notes.filter(n => !n?.sensitive) : [];
  clean.notes = typeof node.notes === 'string' ? JSON.stringify(notes) : notes;
  return clean;
}
