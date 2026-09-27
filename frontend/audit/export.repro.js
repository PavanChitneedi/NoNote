// Audit-only reproductions: assertions describe current defects, not desired behavior.
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
it('reproduces: Markdown export omits current node_notes body',()=>{
  capture();exportAsDoc([node],'Synthetic map');expect(blobParts).not.toContain(node.node_notes);
});
it('reproduces: HTML export inserts node title markup without escaping',()=>{
  capture();exportAsHTML([{...node,title:'<b data-audit="synthetic">Title</b>'}],[],'Synthetic map');
  expect(blobParts).toContain('<b data-audit="synthetic">Title</b>');
  expect(blobParts).not.toContain(node.node_notes);
});
it('regression: canvas JSON export excludes secret custom fields',()=>{
  capture();exportAsNoNote([{...node,customProps:{password:'synthetic-only'}}],[],{title:'Synthetic map'});
  expect(JSON.parse(blobParts).nodes[0].customProps.password).toBeUndefined();
});
