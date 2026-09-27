// Audit reproduction against the actual server module, with network/DB mocked.
import { expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
const state=vi.hoisted(()=>({connect:null,query:vi.fn().mockResolvedValue({rows:[]})}));
vi.mock('http',()=>({createServer:()=>({listen:vi.fn()})}));
vi.mock('ws',()=>({WebSocketServer:class {on(event,fn){if(event==='connection')state.connect=fn;}},WebSocket:class {}}));
vi.mock('../src/db/pool.js',()=>({query:state.query,withTransaction:vi.fn()}));
vi.mock('../src/db/redis.js',()=>({default:{get:vi.fn().mockResolvedValue(null)},PREFIXES:{userSession:'us:'}}));
vi.mock('../src/ws/mapAccess.js',()=>({checkMapAccess:vi.fn().mockResolvedValue({ok:true,userName:'Synthetic viewer',permission:'viewer'})}));
await import('../src/index.js');
it('reproduces: viewer admitted for read access cannot broadcast node replacements',async()=>{
  process.env.JWT_ACCESS_SECRET='synthetic-ws-secret';
  const socket=()=>({handlers:{},readyState:1,on(event,fn){this.handlers[event]=fn;},send:vi.fn(),close:vi.fn()});
  const viewer=socket(),peer=socket();state.connect(viewer);state.connect(peer);
  const join=JSON.stringify({type:'join',mapId:'synthetic-map',token:jwt.sign({sub:'synthetic-viewer',role:'viewer'},process.env.JWT_ACCESS_SECRET)});
  await viewer.handlers.message(join);await peer.handlers.message(join);peer.send.mockClear();
  await viewer.handlers.message(JSON.stringify({type:'nodes_update',nodes:[{id:'test',title:'viewer replacement'}]}));
  expect(peer.send.mock.calls.some(([raw])=>JSON.parse(raw).nodes?.[0]?.title==='viewer replacement')).toBe(false);
});
