import { describe, it, expect } from 'vitest';
import { layoutQuality, betterLayout } from './layoutQuality.js';
import { segmentsOverlap } from './edgeRouting.js';
import { optimizedAutoLayout } from './elkLayout.js';

describe('layout quality',()=>{
  it('distinguishes shared stretches from crossings and endpoint touches',()=>{
    const a={x:0,y:0}, b={x:100,y:0};
    expect(segmentsOverlap(a,b,{x:30,y:0},{x:80,y:0})).toBe(true);
    expect(segmentsOverlap(a,b,{x:50,y:-20},{x:50,y:20})).toBe(false);
    expect(segmentsOverlap(a,b,{x:100,y:0},{x:150,y:0})).toBe(false);
  });
  it('prioritizes overlap removal ahead of shorter paths',()=>{
    expect(betterLayout([0,0,0,1000],[0,1,0,50])).toBe(true);
  });
  it('arranges a branching graph without shared line stretches',async()=>{
    const nodes=['a','b','c','d'].map(id=>({id,type:'server',x:0,y:0,w:180,h:100}));
    const edges=[['a','b'],['a','c'],['b','d'],['c','d']].map(([from,to],i)=>({id:String(i),from,to}));
    const placed=await optimizedAutoLayout(nodes,edges);
    expect(layoutQuality(placed,edges).slice(0,3)).toEqual([0,0,0]);
    expect(nodes.every(n=>n.x===0 && n.y===0)).toBe(true);
  });
});
