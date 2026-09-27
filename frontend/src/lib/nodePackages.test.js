import { describe, expect, it } from 'vitest';
import { NT, SIDEBAR_CATS } from './nodeTypes.js';
import { NODE_PACKAGES, findNodePackages, normalizeLibraryPreferences } from './nodePackages.js';

describe('node packages compatibility', () => {
  it('includes every existing type exactly once without changing identifiers', () => {
    const ids = NODE_PACKAGES.flatMap(p => p.typeIds);
    expect(ids.length).toBe(Object.keys(NT).length);
    expect([...ids].sort()).toEqual(Object.keys(NT).sort());
    expect(NODE_PACKAGES.map(p => p.label)).toEqual(SIDEBAR_CATS);
    expect(new Set(NODE_PACKAGES.map(p => p.id)).size).toBe(NODE_PACKAGES.length);
  });
  it('searches all packages even when a different package is pinned', () => {
    expect(findNodePackages('proxmox', ['notes']).flatMap(p => p.typeIds)).toEqual(['proxmox']);
    expect(findNodePackages('', ['servers'])[0].id).toBe('servers');
    expect(findNodePackages('mobile & iot')[0].id).toBe('mobile-iot');
  });
  it('rejects malformed preferences and unknown identifiers', () => {
    expect(normalizeLibraryPreferences({pinned:['servers','servers','unknown'],collapsed:'notes',
      favorites:['note','__proto__',null],recent:{}})).toEqual({pinned:['servers'],collapsed:[],favorites:['note'],recent:[]});
  });
});
