import { geometrySignature } from './edgeRouting.js';

let engine;
export async function coordinatedLayout(boxes, edges, direction='LR') {
  engine ||= import('elkjs/lib/elk.bundled.js').then(m=>new (m.default)());
  const elk=await engine;
  const ids=new Set(boxes.map(n=>n.id));
  const graph=await elk.layout({id:'root',layoutOptions:{
    'elk.algorithm':'layered',
    'elk.direction':({LR:'RIGHT',RL:'LEFT',TB:'DOWN',BT:'UP'})[direction]||'RIGHT',
    'elk.edgeRouting':'ORTHOGONAL',
    'elk.layered.mergeEdges':'false',
    'elk.spacing.nodeNode':'60',
    'elk.spacing.edgeNode':'24',
    'elk.spacing.edgeEdge':'16',
    'elk.layered.spacing.nodeNodeBetweenLayers':'100',
    'elk.layered.spacing.edgeNodeBetweenLayers':'24',
    'elk.layered.spacing.edgeEdgeBetweenLayers':'16',
  },children:boxes.map(n=>({id:n.id,width:n.w,height:n.h})),
  edges:edges.filter(e=>ids.has(e.from)&&ids.has(e.to)&&e.from!==e.to)
    .map(e=>({id:e.id,sources:[e.from],targets:[e.to]}))});
  const byId=Object.fromEntries(graph.children.map(n=>[n.id,n]));
  const nodes=boxes.map(n=>({...n,x:byId[n.id].x,y:byId[n.id].y}));
  const signature=geometrySignature(nodes,edges);
  const routes={};
  for(const edge of graph.edges) {
    const section=edge.sections?.[0];
    if(section) routes[edge.id]={signature,points:[section.startPoint,...(section.bendPoints||[]),section.endPoint]};
  }
  return {nodes,routes};
}
