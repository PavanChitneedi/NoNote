// Disposable UI audit fixture. Real built frontend, synthetic in-memory API.
// Does not connect to PostgreSQL, Redis, Gitea, or any integration.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { WebSocketServer } from 'ws';
const root=fileURLToPath(new URL('../../frontend/dist/',import.meta.url));
const user={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',email:'audit@example.invalid',display_name:'Audit Preview',role:'owner',avatar_color:'#6C63FF'};
const map={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',title:'Weekend ideas',description:'Synthetic notes for the UI audit',owner_id:user.id,owner_name:user.display_name,is_public:false,node_count:3,collab_count:0,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
let nodes=[['cccccccc-cccc-4ccc-8ccc-cccccccccccc','idea','A quieter workspace','What would make writing feel effortless?',80,100],['dddddddd-dddd-4ddd-8ddd-dddddddddddd','note','Things to explore','## This week\n- Read something interesting\n- Make room for new ideas',390,100],['eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','note','Home lab journal','Keep observations close to the ideas they explain.',390,350]].map(([id,node_type,title,node_notes,x,y])=>({id,node_type,title,node_notes,x,y,w:240,h:160,notes:'[]',notes_private:false,properties:{},custom_props:{}}));
let edges=[{id:'ffffffff-ffff-4fff-8fff-ffffffffffff',from_node:nodes[0].id,to_node:nodes[1].id,style:'arrow',label:'',color:'#6C63FF'}];
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path.startsWith('/api/')){
    let data={}; try { let body=''; for await(const c of req) body+=c; data=body?JSON.parse(body):{}; } catch {}
    let out={};
    if(path==='/api/auth/login')out={user,access_token:'synthetic-preview',refresh_token:'synthetic-preview'};
    else if(path==='/api/auth/me')out={user};
    else if(path==='/api/maps')out={maps:[map]};
    else if(path===`/api/maps/${map.id}`)out={map,nodes,edges,groupBoxes:[],collaborators:[]};
    else if(path.endsWith('/save')){nodes=(data.nodes||[]).map(n=>({...n,node_type:n.type,custom_props:n.customProps}));edges=(data.edges||[]).map(e=>({...e,from_node:e.from,to_node:e.to}));out={ok:true};}
    else if(path.endsWith('/versions'))out={versions:[]};
    else if(path.endsWith('/collaborators')||path.endsWith('/changelog'))out=[];
    else if(path.endsWith('/providers'))out={providers:[]};
    else if(path.endsWith('/me/settings'))out={settings:{},permissions:['*'],groups:[]};
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(out));return;
  }
  const file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
  if(!file.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
  try {const bytes=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end();}
});
const wss=new WebSocketServer({server,path:'/ws'});
wss.on('connection',ws=>ws.on('message',raw=>{try{if(JSON.parse(raw).type==='join')ws.send(JSON.stringify({type:'room_state',users:[]}));}catch{}}));
server.listen(4178,'127.0.0.1',()=>console.log('Synthetic UI audit preview: http://127.0.0.1:4178'));
