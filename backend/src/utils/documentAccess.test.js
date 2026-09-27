import { expect, it } from 'vitest';
import { readableNode } from './documentAccess.js';
import { hashRefreshToken } from './refreshToken.js';
it('redacts nested credentials and private legacy/new bodies without mutating storage', () => {
  const node = { notes_private:true, node_notes:'private', notes:JSON.stringify([{sensitive:true,content:'secret'},{content:'public'}]), properties:{_integration:{token:'secret'},nested:[{password:'secret',label:'safe'}]},custom_props:{api_key:'secret'} };
  const viewer = readableNode(node, 'viewer');
  expect(JSON.stringify(viewer)).not.toContain('secret');
  expect(viewer.node_notes).toBe('');
  expect(JSON.parse(viewer.notes)).toEqual([{content:'public'}]);
  expect(readableNode(node,'editor').node_notes).toBe('private');
  expect(node.properties._integration.token).toBe('secret');
});
it('hashes refresh-token suffixes beyond bcrypt input length', () => {
  const prefix = 'x'.repeat(100);
  expect(hashRefreshToken(prefix+'a')).not.toBe(hashRefreshToken(prefix+'b'));
});
