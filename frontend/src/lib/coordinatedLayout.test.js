import { it, expect } from 'vitest';
import { coordinatedLayout } from './coordinatedLayout.js';
import { routeConnections, segHitsRects } from './edgeRouting.js';

it('keeps ELK routes for parallel mixed-style edges, invalidates them after movement',async()=>{
  const nodes=[{id:'a',x:0,y:0,w:220,h:120},{id:'b',x:400,y:0,w:220,h:120}];
  const edges=['arrow','dashed','dotted'].map((style,i)=>({id:'e'+i,from:'a',to:'b',style}));
  const layout=await coordinatedLayout(nodes,edges);
  const saved=edges.map(e=>({...e,fromAnchor:{side:'auto',route:layout.routes[e.id]}}));
  const restored=JSON.parse(JSON.stringify(saved));
  expect(routeConnections(layout.nodes,restored)).toEqual(Object.fromEntries(edges.map(e=>[e.id,layout.routes[e.id].points])));
  const paths=Object.values(layout.routes).map(r=>r.points);
  expect(new Set(paths.map(p=>JSON.stringify(p))).size).toBe(3);
  paths.forEach(pts=>pts.slice(1).forEach((p,i)=>expect(segHitsRects(pts[i].x,pts[i].y,p.x,p.y,layout.nodes,0)).toBe(false)));
  const moved=layout.nodes.map(n=>n.id==='b'?{...n,y:n.y+300}:n);
  expect(routeConnections(moved,restored)).not.toEqual(routeConnections(layout.nodes,restored));
});
