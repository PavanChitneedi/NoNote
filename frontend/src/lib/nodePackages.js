import { NT } from './nodeTypes.js';

// Package IDs are picker metadata, never replacements for persisted node type IDs.
const definitions = [
  ['notes', 'Notes'], ['planning', 'Planning'], ['workflow', 'Workflow'],
  ['knowledge', 'Knowledge'], ['general', 'General'], ['network', 'Network'],
  ['computers', 'Computers'], ['servers', 'Servers'], ['storage', 'Storage'],
  ['mobile-iot', 'Mobile & IoT'], ['cloud', 'Cloud'], ['software', 'Software'],
  ['security', 'Security'],
];

export const NODE_PACKAGES = definitions.map(([id, label]) => Object.freeze({
  id, label, typeIds: Object.freeze(Object.keys(NT).filter(type => NT[type].cat === label)),
}));
export const LIBRARY_PREFERENCES_KEY = 'nn_node_library_v1';

export function normalizeLibraryPreferences(value) {
  const list = (items, valid) => Array.isArray(items)
    ? [...new Set(items.filter(item => typeof item === 'string' && valid.has(item)))] : [];
  const packages = new Set(NODE_PACKAGES.map(p => p.id));
  const types = new Set(Object.keys(NT));
  return {
    pinned: list(value?.pinned, packages),
    collapsed: list(value?.collapsed, packages),
    favorites: list(value?.favorites, types),
    recent: list(value?.recent, types).slice(0, 8),
  };
}

export function findNodePackages(search = '', pinned = []) {
  const query = search.trim().toLowerCase();
  return [...NODE_PACKAGES]
    .sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)))
    .map(pkg => ({ ...pkg, typeIds: pkg.typeIds.filter(id =>
      !query || `${id} ${NT[id].label} ${pkg.label}`.toLowerCase().includes(query)) }))
    .filter(pkg => pkg.typeIds.length);
}
