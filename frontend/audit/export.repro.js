// Regression assertions converted from audit reproductions.
import { afterEach, expect, it, vi } from 'vitest';
import { exportAsDoc, exportAsHTML, exportAsNoNote } from '../src/lib/exportFormats.js';
const node={id:'synthetic-node',type:'note',title:'Synthetic note',x:0,y:0,w:240,h:160,notes:[],node_notes:'Current note body that must survive export',properties:{},customProps:{}};
let blobParts;
function capture(){
  vi.stubGlobal('Blob',class {constructor(parts){blobParts=parts.join('');}});
  vi.stubGlobal('URL',{createObjectURL:()=> 'blob:synthetic',revokeObjectURL:()=>{}});
  vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
}
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
it('Markdown export includes current node_notes body',()=>{
  capture();exportAsDoc([node],'Synthetic map');expect(blobParts).toContain(node.node_notes);
});
it('HTML export escapes title markup',()=>{
  capture();exportAsHTML([{...node,title:'<b data-audit="synthetic">Title</b>'}],[],'Synthetic map');
  expect(blobParts).not.toContain('<b data-audit="synthetic">Title</b>');
  expect(blobParts).toContain(node.node_notes);
});
it('regression: canvas JSON export excludes secret custom fields',()=>{
  capture();exportAsNoNote([{...node,customProps:{password:'synthetic-only'}}],[],{title:'Synthetic map'});
  expect(JSON.parse(blobParts).nodes[0].customProps.password).toBeUndefined();
});
it('native export preserves private notes and groups for an authorized backup',()=>{
  capture();exportAsNoNote([{...node,notes_private:true,notes:'[{"content":"legacy"}]'}],[],{title:'Map'},[{id:'g',label:'Group',x:0,y:0}]);
  const parsed=JSON.parse(blobParts);
  expect(parsed.nodes[0].node_notes).toBe(node.node_notes);
  expect(parsed.nodes[0].notes_private).toBe(true);
  expect(parsed.nodes[0].notes).toEqual([{content:'legacy'}]);
  expect(parsed.groupBoxes[0].label).toBe('Group');
});
it('publication exports omit private current notes',()=>{
  capture();exportAsHTML([{...node,notes_private:true}],[],'Map');
  expect(blobParts).not.toContain(node.node_notes);
  exportAsDoc([{...node,notes_private:true}],'Map');
  expect(blobParts).not.toContain(node.node_notes);
});
