import { expect, it } from 'vitest';
import { normalizeNativeGraph } from './nativeImport.js';
it('remaps identities while preserving current and legacy note content and edge endpoints',()=>{
  const original=[{id:'a',type:'note',title:'Note',description:'Description',node_notes:'Body\nsecond line',notes_private:true,notes:'[{"content":"old"}]',properties:{label:'kept'},customProps:{location:'desk'}},{id:'b',type:'idea',title:'Idea'}];
  const {nodes,edges}=normalizeNativeGraph(original,[{id:'edge',from:'a',to:'b',label:'Link',midOff:{x:2,y:3}}]);
  expect(nodes[0].id).not.toBe('a');
  expect(nodes[0]).toMatchObject({description:'Description',node_notes:'Body\nsecond line',notes_private:true,notes:[{content:'old'}],customProps:{location:'desk'}});
  expect(edges[0]).toMatchObject({from:nodes[0].id,to:nodes[1].id,label:'Link',midOff:{x:2,y:3}});
  expect(original[0].id).toBe('a');
});
it('rejects malformed node arrays without starting an import',()=>{
  expect(()=>normalizeNativeGraph([null],[])).toThrow('Invalid graph');
});
