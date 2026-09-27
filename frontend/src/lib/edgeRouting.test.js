import { describe, it, expect } from 'vitest';
import { astarRoute, buildRoutingGrid, port, nrm, segHitsRects, routeConnections, segmentsShareLane } from './edgeRouting.js';

describe('automatic connections', () => {
  it('separates dotted, dashed and solid paths including the attachment stubs',()=>{
    const nodes=[{id:'a',type:'server',x:0,y:0,w:220,h:100},
      {id:'b',type:'server',x:680,y:0,w:220,h:100},
      {id:'n',type:'note',x:300,y:-250,w:240,h:160}];
    const edges=[['a','b','arrow'],['b','a','dotted'],['b','a','dashed'],
      ['a','n','arrow'],['n','b','dotted'],['b','n','dashed']]
      .map(([from,to,style],i)=>({id:String(i),from,to,style}));
    const paths=Object.values(routeConnections(nodes,edges));
    paths.forEach((path,i)=>paths.slice(i+1).forEach(other=>{
      path.slice(1).forEach((p,j)=>other.slice(1).forEach((q,k)=>{
        expect(segmentsShareLane(path[j],p,other[k],q)).toBe(false);
      }));
    }));
    const restyled=edges.map(e=>({...e,style:'arrow'}));
    expect(routeConnections(nodes,edges)).toEqual(routeConnections(nodes,restyled));
  });
  const source = { id:'s', x:0, y:0, w:180, h:100 };
  const target = { id:'t', x:400, y:0, w:180, h:100 };
  const edge = { id:'e', from:'s', to:'t', fromAnchor:{side:'auto'}, toAnchor:{side:'auto'} };
  it('changes attachment sides after a node moves across the source', () => {
    expect(routeConnections([source,target],[edge]).e).toEqual([{x:180,y:50},{x:400,y:50}]);
    const moved = routeConnections([source,{...target,x:-400}],[edge]).e;
    expect(moved[0]).toEqual({x:0,y:50});
    expect(moved.at(-1)).toEqual({x:-220,y:50});
  });
  it('spaces multiple automatic connections on the same face', () => {
    const routes = routeConnections([source,target],[edge,{...edge,id:'e2'}]);
    expect(routes.e[0].y).not.toEqual(routes.e2[0].y);
    expect(routes.e.at(-1).y).not.toEqual(routes.e2.at(-1).y);
  });
  it('uses the same path for a preview and its saved replacement', () => {
    const preview = routeConnections([source,target],[{...edge,id:'__preview__'}]).__preview__;
    expect(preview).toEqual(routeConnections([source,target],[edge]).e);
  });
  it('replaces legacy locked endpoints with automatic attachments', () => {
    const route = routeConnections([source,target],[{...edge,fromAnchor:{side:'top',t:.3}}]).e;
    expect(route).toEqual(routeConnections([source,target],[edge]).e);
  });
  it('switches to another border when the facing border is blocked',()=>{
    const blocker={id:'wall',x:182,y:-40,w:110,h:180};
    const boxes=[source,target,blocker];
    const route=routeConnections(boxes,[edge]).e;
    expect(route[0].x).not.toBe(source.x+source.w);
    expect(route.at(-1).x>=target.x && route.at(-1).x<=target.x+target.w).toBe(true);
    route.slice(1).forEach((p,i)=>expect(segHitsRects(route[i].x,route[i].y,p.x,p.y,boxes,0)).toBe(false));
  });
});

describe('anchored routes', () => {
  it.each(['left', 'right', 'top', 'bottom'])('keeps a %s exit outside both node bodies', side => {
    const source = { x: 0, y: 0, w: 180, h: 100 };
    const target = { x: 340, y: 160, w: 180, h: 120 };
    const blocker = { x: 230, y: 100, w: 60, h: 100 };
    const boxes = [source, target, blocker];
    const fp = port(source, side, 0.3), tp = port(target, 'left', 0.7);
    const fn = nrm(side), tn = nrm('left');
    const grid = buildRoutingGrid(boxes, [
      { x: fp.x + fn.dx * 24, y: fp.y + fn.dy * 24 },
      { x: tp.x + tn.dx * 24, y: tp.y + tn.dy * 24 },
    ]);
    const route = astarRoute(fp, fn, tp, tn, boxes, new Map(), grid);
    expect(route).not.toBeNull();
    expect(route[0]).toEqual(fp);
    expect(route.at(-1)).toEqual(tp);
    // Inset rectangles avoid treating a border touch as an intersection.
    const interiors = boxes.map(b => ({ x: b.x + 0.1, y: b.y + 0.1, w: b.w - 0.2, h: b.h - 0.2 }));
    for (let i = 1; i < route.length; i++) {
      expect(segHitsRects(route[i - 1].x, route[i - 1].y, route[i].x, route[i].y, interiors, 0)).toBe(false);
    }
    expect((route[1].x-fp.x)*fn.dx + (route[1].y-fp.y)*fn.dy).toBeGreaterThan(0);
  });
});
