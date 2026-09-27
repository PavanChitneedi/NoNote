import { routeConnections, segmentsOverlap, segHitsRects } from './edgeRouting.js';

// Lexicographic priorities: collisions, overlaps, crossings, then path cost.
// This avoids trading a shared line for a tiny reduction in canvas size.
export function layoutQuality(nodes, edges) {
  const routes = routeConnections(nodes, edges);
  let collisions=0, overlaps=0, crossings=0, length=0, bends=0;
  nodes.forEach((a,i)=>nodes.slice(i+1).forEach(b=>{
    if(a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y) collisions++;
  }));
  const segments=[];
  Object.entries(routes).forEach(([id,pts])=>{
    let previous;
    pts.forEach((p,i)=>{
      if(!i) return;
      const a=pts[i-1], distance=Math.abs(p.x-a.x)+Math.abs(p.y-a.y);
      if(distance<.01) return;
      const horizontal=Math.abs(p.y-a.y)<.01;
      if(segHitsRects(a.x,a.y,p.x,p.y,nodes,0)) collisions++;
      length+=distance;
      if(previous!==undefined && previous!==horizontal) bends++;
      previous=horizontal;
      segments.forEach(s=>{
        if(s.id===id) return;
        if(segmentsOverlap(a,p,s.a,s.b)) overlaps++;
        else if(horizontal!==s.horizontal) {
          const h=horizontal?{a,b:p}:s, v=horizontal?s:{a,b:p};
          if(v.a.x>Math.min(h.a.x,h.b.x) && v.a.x<Math.max(h.a.x,h.b.x)
            && h.a.y>Math.min(v.a.y,v.b.y) && h.a.y<Math.max(v.a.y,v.b.y)) crossings++;
        }
      });
      segments.push({id,a,b:p,horizontal});
    });
  });
  return [collisions,overlaps,crossings,length+bends*34];
}

export function betterLayout(a,b) {
  const index=a.findIndex((value,i)=>Math.abs(value-b[i])>.01);
  return index>=0 && a[index]<b[index];
}
