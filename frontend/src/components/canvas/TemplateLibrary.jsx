import { useState } from "react";

// ── Template Library ──────────────────────────────────────────────
const TEMPLATES = [
  {
    id:"blank",
    name:"Blank Starter",
    desc:"Two nodes, one connection",
    icon:"✦",
    color:"#9E9E9E",
    nodes:[
      {id:"t1",type:"note",x:0,y:0,title:"Start here"},
      {id:"t2",type:"process",x:280,y:0,title:"Next step"},
    ],
    edges:[{from:"t1",to:"t2",label:"leads to",style:"arrow",edgeType:"other"}],
  },
  {
    id:"homelab",
    name:"Homelab Network",
    desc:"Router, switch, servers, NAS, clients",
    icon:"🏠",
    color:"#00BCD4",
    nodes:[
      {id:"h1",type:"router",  x:200,y:0,   title:"Router",   properties:{Make:"",IP:"192.168.1.1"}},
      {id:"h2",type:"switch",  x:200,y:120, title:"Switch",   properties:{Layer:"L2",Ports:"24"}},
      {id:"h3",type:"server",  x:0,  y:260, title:"Server 1", properties:{OS:"Ubuntu",Role:"Docker"}},
      {id:"h4",type:"server",  x:200,y:260, title:"Server 2", properties:{OS:"Proxmox",Role:"VM host"}},
      {id:"h5",type:"nas",     x:400,y:260, title:"NAS",      properties:{Capacity:"8TB",Type:"HDD"}},
      {id:"h6",type:"firewall",x:200,y:380, title:"Firewall",  properties:{Rules:""}},
      {id:"h7",type:"desktop", x:0,  y:380, title:"PC",       properties:{OS:"Windows"}},
    ],
    edges:[
      {from:"h1",to:"h2",label:"LAN",style:"arrow",edgeType:"network"},
      {from:"h2",to:"h3",label:"",style:"line",edgeType:"network"},
      {from:"h2",to:"h4",label:"",style:"line",edgeType:"network"},
      {from:"h2",to:"h5",label:"",style:"line",edgeType:"network"},
      {from:"h2",to:"h6",label:"",style:"line",edgeType:"network"},
      {from:"h2",to:"h7",label:"",style:"line",edgeType:"network"},
    ],
  },
  {
    id:"microservices",
    name:"Microservices",
    desc:"API gateway, services, DB, queue",
    icon:"⚙️",
    color:"#4CAF50",
    nodes:[
      {id:"m1",type:"user",       x:220,y:0,   title:"Client"},
      {id:"m2",type:"apigateway", x:220,y:120, title:"API Gateway"},
      {id:"m3",type:"service",    x:0,  y:260, title:"Auth Service"},
      {id:"m4",type:"service",    x:200,y:260, title:"Core Service"},
      {id:"m5",type:"service",    x:400,y:260, title:"Notif Service"},
      {id:"m6",type:"database",   x:100,y:400, title:"Postgres DB"},
      {id:"m7",type:"queue",      x:300,y:400, title:"Message Queue"},
      {id:"m8",type:"cache",      x:200,y:520, title:"Redis Cache"},
    ],
    edges:[
      {from:"m1",to:"m2",label:"HTTPS",style:"arrow",edgeType:"network"},
      {from:"m2",to:"m3",label:"auth",style:"arrow",edgeType:"method"},
      {from:"m2",to:"m4",label:"route",style:"arrow",edgeType:"method"},
      {from:"m4",to:"m5",label:"event",style:"dashed",edgeType:"trigger"},
      {from:"m3",to:"m6",label:"reads/writes",style:"arrow",edgeType:"data"},
      {from:"m4",to:"m6",label:"reads/writes",style:"arrow",edgeType:"data"},
      {from:"m5",to:"m7",label:"publish",style:"dashed",edgeType:"data"},
      {from:"m4",to:"m8",label:"cache",style:"dotted",edgeType:"data"},
    ],
  },
  {
    id:"mindmap",
    name:"Mind Map",
    desc:"Central idea with branches",
    icon:"🧠",
    color:"#9C27B0",
    nodes:[
      {id:"mm1",type:"heading",x:240,y:200,title:"Central Idea"},
      {id:"mm2",type:"note",   x:0,  y:0,  title:"Branch A"},
      {id:"mm3",type:"note",   x:480,y:0,  title:"Branch B"},
      {id:"mm4",type:"note",   x:0,  y:400,title:"Branch C"},
      {id:"mm5",type:"note",   x:480,y:400,title:"Branch D"},
      {id:"mm6",type:"note",   x:0,  y:100, title:"Sub A1"},
      {id:"mm7",type:"note",   x:0,  y:200, title:"Sub A2"},
    ],
    edges:[
      {from:"mm1",to:"mm2",label:"",style:"line",edgeType:"other"},
      {from:"mm1",to:"mm3",label:"",style:"line",edgeType:"other"},
      {from:"mm1",to:"mm4",label:"",style:"line",edgeType:"other"},
      {from:"mm1",to:"mm5",label:"",style:"line",edgeType:"other"},
      {from:"mm2",to:"mm6",label:"",style:"dotted",edgeType:"other"},
      {from:"mm2",to:"mm7",label:"",style:"dotted",edgeType:"other"},
    ],
  },
];

export default function TemplateLibrary({onInsert}){
  const [hovered,setHovered]=useState(null);
  return(
    <div style={{flex:1,overflow:"auto",padding:12,display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:10,color:"var(--text4)",marginBottom:4}}>
        Click a template to drop it onto your canvas.
      </div>
      {TEMPLATES.map(tpl=>(
        <div key={tpl.id}
          onClick={()=>onInsert(tpl)}
          onMouseEnter={()=>setHovered(tpl.id)}
          onMouseLeave={()=>setHovered(null)}
          style={{
            background:hovered===tpl.id?"var(--bg3)":"var(--bg)",
            
            borderRadius:"var(--radius-md)",padding:"12px 14px",cursor:"pointer",
            transition:"all .15s",
          }}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:5}}>
            <span style={{fontSize:22}}>{tpl.icon}</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{tpl.name}</div>
              <div style={{fontSize:10,color:"var(--text4)"}}>{tpl.desc}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <span style={{fontSize:9,color:"var(--text4)",background:"var(--bg3)",
              padding:"1px 6px",borderRadius:8}}>
              {tpl.nodes.length} nodes
            </span>
            <span style={{fontSize:9,color:"var(--text4)",background:"var(--bg3)",
              padding:"1px 6px",borderRadius:8}}>
              {tpl.edges.length} connections
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
