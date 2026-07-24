import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getMap, saveMap, saveVersion, apiFetch, addCollab, removeCollab, getAccessToken } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme, THEMES } from "../context/ThemeContext.jsx";
import LLMChat        from "./LLMChat.jsx";
import NodeAIChat     from "./NodeAIChat.jsx";
import Tutorial       from "./Tutorial.jsx";
import HelpGuide      from "./HelpGuide.jsx";
import DocExportModal  from "./DocExportModal.jsx";
import WorkflowAuditPanel from "./WorkflowAuditPanel.jsx";
import { CHANGELOG, CURRENT_VERSION } from "../changelog.js";
import { buildLLMText, copyText } from "../utils/llmExport.js";
import { FileText,Type,User,RefreshCw,Folder,GitBranch,MessageSquare,Lightbulb,Pin,Brain,
  BookOpen,Quote,AlignLeft,HelpCircle,CheckCircle,AlertTriangle,Sparkles,Code2,Square,
  ClipboardList,Target,Flag,Clock,StopCircle,Play,XCircle,CheckCircle2,ExternalLink,
  BookMarked,Paperclip,Layers,Bookmark,Calculator,Router,Network,Shield,Scale,Lock,Wifi,
  Tv,Globe,Tag,Repeat,LogIn,ShieldCheck,GitMerge,Map,Building2,Navigation,Shuffle,Zap,
  Radio,AtSign,Search,Timer,Key,LayoutGrid,Eye,Activity,TestTube,Monitor,Laptop,Cpu,
  Tv2,Terminal,Server,Globe2,Settings,Database,Archive,Mail,Printer,HardDrive,
  FolderArchive,Disc,ArchiveRestore,Film,Smartphone,Tablet,CircuitBoard,Binary,Waves,
  Thermometer,Camera,Factory,DoorOpen,Wind,Cloud,Braces,ListOrdered,Share2,Package,
  Hexagon,Box,ArrowUpDown,PackageOpen,Link2,Library,Power,Puzzle,Gauge,MessageCircle,
  BellRing,ShieldOff,LockKeyhole,ScanSearch,Ban,
  Boxes,AppWindow,Component,Layers2,Container,MemoryStick,
  MoreHorizontal,History as HistoryIcon,Palette,LogOut,Keyboard,Import,Users,
  Command,Feather,Hammer,GraduationCap,Copy } from "lucide-react";
import ThemePicker    from "./ThemePicker.jsx";
import IntegrationPanel from "./IntegrationPanel.jsx";
import VersionHistory from "./VersionHistory.jsx";

// ── Node types ────────────────────────────────────────────────
// ── Node type registry ────────────────────────────────────────
export const NT = {
  // ── General ──────────────────────────────────────────────────
  note:        { label:"Note",                color:"#FFD93D", icon:FileText,     cat:"General" },
  heading:     { label:"Heading",             color:"#6C63FF", icon:Type,         cat:"General" },
  user:        { label:"User / Person",       color:"#E91E63", icon:User,         cat:"General" },
  process:     { label:"Process",             color:"#9C27B0", icon:RefreshCw,    cat:"General" },
  group:       { label:"Group",               color:"#9E9E9E", icon:Folder,       cat:"General" },
  decision:    { label:"Decision",            color:"#FF9800", icon:GitBranch,    cat:"General" },
  annotation:  { label:"Annotation",          color:"#78909C", icon:MessageSquare,cat:"General" },
  // ── Notes ────────────────────────────────────────────────────
  idea:        { label:"Idea",                color:"#FFCA28", icon:Lightbulb,    cat:"Notes" },
  topic:       { label:"Topic",               color:"#AB47BC", icon:Pin,          cat:"Notes" },
  concept:     { label:"Concept",             color:"#7E57C2", icon:Brain,        cat:"Notes" },
  definition:  { label:"Definition",          color:"#5C6BC0", icon:BookOpen,     cat:"Notes" },
  quote:       { label:"Quote",               color:"#42A5F5", icon:Quote,        cat:"Notes" },
  summary:     { label:"Summary",             color:"#26C6DA", icon:AlignLeft,    cat:"Notes" },
  question:    { label:"Question",            color:"#FFA726", icon:HelpCircle,   cat:"Notes" },
  answer:      { label:"Answer",              color:"#66BB6A", icon:CheckCircle,  cat:"Notes" },
  warning:     { label:"Warning",             color:"#EF5350", icon:AlertTriangle,cat:"Notes" },
  tip:         { label:"Tip",                 color:"#26A69A", icon:Sparkles,     cat:"Notes" },
  codeblock:   { label:"Code Block",          color:"#78909C", icon:Code2,        cat:"Notes" },
  // ── Workflow (Workflow Audit feature) ──────────────────────────
  workflow_task: { label:"Workflow Task",     color:"#FF7043", icon:Repeat,       cat:"Workflow" },
  // ── Planning ─────────────────────────────────────────────────
  task:        { label:"Task",                color:"#29B6F6", icon:Square,       cat:"Planning" },
  checklist:   { label:"Checklist",           color:"#26C6DA", icon:ClipboardList,cat:"Planning" },
  goal:        { label:"Goal",                color:"#66BB6A", icon:Target,       cat:"Planning" },
  milestone:   { label:"Milestone",           color:"#FFA726", icon:Flag,         cat:"Planning" },
  deadline:    { label:"Deadline",            color:"#EF5350", icon:Clock,        cat:"Planning" },
  blocker:     { label:"Blocker",             color:"#F44336", icon:StopCircle,   cat:"Planning" },
  step:        { label:"Step",                color:"#8BC34A", icon:Play,         cat:"Planning" },
  problem:     { label:"Problem",             color:"#F44336", icon:XCircle,      cat:"Planning" },
  solution:    { label:"Solution",            color:"#4CAF50", icon:CheckCircle2, cat:"Planning" },
  // ── Knowledge ────────────────────────────────────────────────
  reference:   { label:"Reference",           color:"#78909C", icon:ExternalLink, cat:"Knowledge" },
  resource:    { label:"Resource",            color:"#26A69A", icon:BookMarked,   cat:"Knowledge" },
  evidence:    { label:"Evidence",            color:"#5C6BC0", icon:Paperclip,    cat:"Knowledge" },
  flashcard:   { label:"Flashcard",           color:"#EC407A", icon:Layers,       cat:"Knowledge" },
  bookmark:    { label:"Bookmark",            color:"#FF7043", icon:Bookmark,     cat:"Knowledge" },
  formula:     { label:"Formula",             color:"#42A5F5", icon:Calculator,   cat:"Knowledge" },
  // ── Network — Core ───────────────────────────────────────────
  router:      { label:"Router",              color:"#00BCD4", icon:Router,       cat:"Network" },
  switch:      { label:"Switch",              color:"#03A9F4", icon:Network,      cat:"Network" },
  firewall:    { label:"Firewall",            color:"#FF5722", icon:Shield,       cat:"Network" },
  loadbal:     { label:"Load Balancer",       color:"#26C6DA", icon:Scale,        cat:"Network" },
  vpn:         { label:"VPN Gateway",         color:"#42A5F5", icon:Lock,         cat:"Network" },
  ap:          { label:"Access Point",        color:"#29B6F6", icon:Wifi,         cat:"Network" },
  modem:       { label:"Modem",               color:"#4DD0E1", icon:Tv,           cat:"Network" },
  wanlink:     { label:"WAN Link",            color:"#0288D1", icon:Globe,        cat:"Network" },
  vlan:        { label:"VLAN",                color:"#0097A7", icon:Tag,          cat:"Network" },
  proxy:       { label:"Proxy",               color:"#00838F", icon:Repeat,       cat:"Network" },
  // ── Network — VPN & WAN ──────────────────────────────────────
  vpnclient:   { label:"VPN Client",          color:"#1565C0", icon:LogIn,        cat:"Network" },
  vpnserver:   { label:"VPN Server",          color:"#0D47A1", icon:ShieldCheck,  cat:"Network" },
  vpnconc:     { label:"VPN Concentrator",    color:"#1976D2", icon:GitMerge,     cat:"Network" },
  sdwan:       { label:"SD-WAN",              color:"#0277BD", icon:Map,          cat:"Network" },
  // ── Network — Routing Tiers ──────────────────────────────────
  corerouter:  { label:"Core Router",         color:"#006064", icon:Building2,    cat:"Network" },
  edgerouter:  { label:"Edge Router",         color:"#00838F", icon:Navigation,   cat:"Network" },
  l3switch:    { label:"L3 Switch",           color:"#007B83", icon:Shuffle,      cat:"Network" },
  poeswitch:   { label:"PoE Switch",          color:"#00ACC1", icon:Zap,          cat:"Network" },
  wlcont:      { label:"Wireless Controller", color:"#0097A7", icon:Radio,        cat:"Network" },
  // ── Network — Services ───────────────────────────────────────
  dhcpsrv:     { label:"DHCP Server",         color:"#00796B", icon:AtSign,       cat:"Network" },
  dnssrv:      { label:"DNS Server",          color:"#00695C", icon:Search,       cat:"Network" },
  ntpsrv:      { label:"NTP Server",          color:"#004D40", icon:Timer,        cat:"Network" },
  radiussrv:   { label:"RADIUS Server",       color:"#37474F", icon:Key,          cat:"Network" },
  patchpanel:  { label:"Patch Panel",         color:"#546E7A", icon:LayoutGrid,   cat:"Network" },
  nettap:      { label:"Network TAP",         color:"#607D8B", icon:Eye,          cat:"Network" },
  netmon:      { label:"Network Monitor",     color:"#78909C", icon:Activity,     cat:"Network" },
  honeypot:    { label:"Honeypot",            color:"#BF360C", icon:TestTube,     cat:"Network" },
  // ── Computers ────────────────────────────────────────────────
  desktop:     { label:"Desktop PC",          color:"#8D6E63", icon:Monitor,      cat:"Computers" },
  laptop:      { label:"Laptop",              color:"#A1887F", icon:Laptop,       cat:"Computers" },
  workstation: { label:"Workstation",         color:"#795548", icon:Cpu,          cat:"Computers" },
  thinclnt:    { label:"Thin Client",         color:"#6D4C41", icon:Tv2,          cat:"Computers" },
  kiosk:       { label:"Kiosk",               color:"#5D4037", icon:Terminal,     cat:"Computers" },
  // ── Servers ──────────────────────────────────────────────────
  server:      { label:"Server",              color:"#EF5350", icon:Server,       cat:"Servers" },
  webserver:   { label:"Web Server",          color:"#E53935", icon:Globe2,       cat:"Servers" },
  appserver:   { label:"App Server",          color:"#F44336", icon:Settings,     cat:"Servers" },
  dbserver:    { label:"DB Server",           color:"#C62828", icon:Database,     cat:"Servers" },
  fileserver:  { label:"File Server",         color:"#D32F2F", icon:Archive,      cat:"Servers" },
  mailserver:  { label:"Mail Server",         color:"#B71C1C", icon:Mail,         cat:"Servers" },
  printserver: { label:"Print Server",        color:"#FF8A80", icon:Printer,      cat:"Servers" },
  // ── Storage ──────────────────────────────────────────────────
  storage:     { label:"Storage",             color:"#607D8B", icon:HardDrive,    cat:"Storage" },
  nas:         { label:"NAS",                 color:"#546E7A", icon:FolderArchive,cat:"Storage" },
  san:         { label:"SAN",                 color:"#455A64", icon:Disc,         cat:"Storage" },
  backup:      { label:"Backup",              color:"#78909C", icon:ArchiveRestore,cat:"Storage"},
  tape:        { label:"Tape Library",        color:"#90A4AE", icon:Film,         cat:"Storage" },
  // ── Mobile & IoT ─────────────────────────────────────────────
  mobile:      { label:"Mobile / Phone",      color:"#66BB6A", icon:Smartphone,   cat:"Mobile & IoT" },
  tablet:      { label:"Tablet",              color:"#4CAF50", icon:Tablet,       cat:"Mobile & IoT" },
  rpi:         { label:"Raspberry Pi",        color:"#C62828", icon:CircuitBoard, cat:"Mobile & IoT" },
  arduino:     { label:"Arduino",             color:"#00979D", icon:Binary,       cat:"Mobile & IoT" },
  esp:         { label:"ESP32/8266",          color:"#E65100", icon:Waves,        cat:"Mobile & IoT" },
  sensor:      { label:"Sensor",              color:"#26A69A", icon:Thermometer,  cat:"Mobile & IoT" },
  camera:      { label:"IP Camera",           color:"#43A047", icon:Camera,       cat:"Mobile & IoT" },
  plc:         { label:"PLC",                 color:"#2E7D32", icon:Factory,      cat:"Mobile & IoT" },
  gateway:     { label:"IoT Gateway",         color:"#388E3C", icon:DoorOpen,     cat:"Mobile & IoT" },
  hvac:        { label:"HVAC",                color:"#1B5E20", icon:Wind,         cat:"Mobile & IoT" },
  // ── Cloud ────────────────────────────────────────────────────
  cloud:       { label:"Cloud",               color:"#29B6F6", icon:Cloud,        cat:"Cloud" },
  lambda:      { label:"Function / Lambda",   color:"#FF9100", icon:Braces,       cat:"Cloud" },
  queue:       { label:"Queue",               color:"#AB47BC", icon:ListOrdered,  cat:"Cloud" },
  cdn:         { label:"CDN",                 color:"#26A69A", icon:Share2,       cat:"Cloud" },
  s3:          { label:"Object Store",        color:"#FF6D00", icon:Package,      cat:"Cloud" },
  k8s:         { label:"Kubernetes",          color:"#326CE5", icon:Hexagon,      cat:"Cloud" },
  container:   { label:"Container",           color:"#2496ED", icon:Box,          cat:"Cloud" },
  apigateway:  { label:"API Gateway",         color:"#A100FF", icon:ArrowUpDown,  cat:"Cloud" },
  // ── Software ─────────────────────────────────────────────────
  software:    { label:"Software",            color:"#4CAF50", icon:PackageOpen,  cat:"Software" },
  api:         { label:"API",                 color:"#009688", icon:Link2,        cat:"Software" },
  database:    { label:"Database",            color:"#3F51B5", icon:Library,      cat:"Software" },
  service:     { label:"Service",             color:"#8BC34A", icon:Power,        cat:"Software" },
  microservice:{ label:"Microservice",        color:"#66BB6A", icon:Puzzle,       cat:"Software" },
  cache:       { label:"Cache",               color:"#FF7043", icon:Gauge,        cat:"Software" },
  broker:      { label:"Msg Broker",          color:"#7B1FA2", icon:MessageCircle,cat:"Software" },
  // ── Security ─────────────────────────────────────────────────
  ids:         { label:"IDS / IPS",           color:"#F44336", icon:BellRing,     cat:"Security" },
  waf:         { label:"WAF",                 color:"#E53935", icon:ShieldOff,    cat:"Security" },
  vault:       { label:"Vault / HSM",         color:"#B00020", icon:LockKeyhole,  cat:"Security" },
  siem:        { label:"SIEM",                color:"#C62828", icon:ScanSearch,   cat:"Security" },
  dlp:         { label:"DLP",                 color:"#D50000", icon:Ban,          cat:"Security" },
  // ── Homelab / Hypervisors ────────────────────────────────────
  proxmox:     { label:"Proxmox VE",          color:"#FF6C2F", icon:Layers,       cat:"Servers" },
  esxi:        { label:"VMware ESXi",         color:"#717CBD", icon:Cpu,          cat:"Servers" },
  hyperv:      { label:"Hyper-V Host",        color:"#0078D4", icon:Settings,     cat:"Servers" },
  unraid:      { label:"Unraid Server",       color:"#E67C1C", icon:LayoutGrid,   cat:"Servers" },
  truenas:     { label:"TrueNAS",             color:"#0095D5", icon:HardDrive,    cat:"Storage" },
  // ── Virtualisation & Containers ──────────────────────────────
  vm:          { label:"Virtual Machine",     color:"#8E24AA", icon:AppWindow,    cat:"Servers" },
  lxc:         { label:"LXC Container",       color:"#00897B", icon:Component,    cat:"Servers" },
  docker:      { label:"Docker Engine",       color:"#2496ED", icon:Container,    cat:"Software" },
  dockercont:  { label:"Docker Container",    color:"#1A7CC1", icon:Boxes,        cat:"Software" },
  compose:     { label:"Docker Compose",      color:"#003F8E", icon:Layers2,      cat:"Software" },
}
// sidebar category order
const SIDEBAR_CATS = ["Notes","Planning","Workflow","Knowledge","General","Network","Computers","Servers","Storage","Mobile & IoT","Cloud","Software","Security"];

// Intent-based grouping for sidebar
const INTENT_GROUPS = [
  { id:"capture",  label:"📝 Capture",        cats:["Notes","Knowledge","Planning"] },
  { id:"infra",    label:"🏗 Infrastructure",  cats:["Servers","Storage"] },
  { id:"network",  label:"🌐 Network",         cats:["Network"] },
  { id:"devices",  label:"💻 Devices",         cats:["Computers","Mobile & IoT"] },
  { id:"services", label:"☁ Services",         cats:["Cloud","Software"] },
  { id:"security", label:"🔒 Security",        cats:["Security"] },
  { id:"organize", label:"🗂 Organize",         cats:["General"] },
];

// ── Highlight matched text (returns JSX spans) ────────────────
function highlightText(text, query) {
  if(!query||!text) return text||"";
  const str = String(text), q = query.trim();
  const low = str.toLowerCase(), ql = q.toLowerCase();
  const idx = low.indexOf(ql);
  if(idx<0) return str;
  return <span>
    {str.slice(0,idx)}
    <mark style={{background:"var(--accent2)",color:"#fff",borderRadius:2,padding:"0 1px",fontSize:"inherit"}}>
      {str.slice(idx,idx+q.length)}
    </mark>
    {str.slice(idx+q.length)}
  </span>;
}

// ── Edge style definitions ────────────────────────────────────
const EDGE_STYLES = {
  // Basic
  arrow:         { label:"Arrow",        section:"Basic",   strokeW:2,   dash:"none", mEnd:"nn-arr",  mStart:null,       desc:"One-way arrow" },
  bidirectional: { label:"Both ways",    section:"Basic",   strokeW:2,   dash:"none", mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Arrow on both ends" },
  line:          { label:"Plain line",   section:"Basic",   strokeW:2,   dash:"none", mEnd:null,       mStart:null,       desc:"No arrowhead" },
  // Dashed
  dashed:        { label:"Dashed →",     section:"Dashed",  strokeW:2,   dash:"8,5",  mEnd:"nn-arr",  mStart:null,       desc:"Dashed with arrow" },
  "dashed-bi":   { label:"Dashed ↔",    section:"Dashed",  strokeW:2,   dash:"8,5",  mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Dashed bidirectional" },
  "dashed-line": { label:"Dashed line",  section:"Dashed",  strokeW:2,   dash:"8,5",  mEnd:null,       mStart:null,       desc:"Dashed, no arrow" },
  // Dotted
  dotted:        { label:"Dotted →",     section:"Dotted",  strokeW:2,   dash:"2,5",  mEnd:"nn-arr",  mStart:null,       desc:"Dotted with arrow" },
  "dotted-bi":   { label:"Dotted ↔",    section:"Dotted",  strokeW:2,   dash:"2,5",  mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Dotted bidirectional" },
  "dotted-line": { label:"Dotted line",  section:"Dotted",  strokeW:2,   dash:"2,5",  mEnd:null,       mStart:null,       desc:"Dotted, no arrow" },
  // Bold
  thick:         { label:"Bold →",       section:"Bold",    strokeW:4,   dash:"none", mEnd:"nn-tk",   mStart:null,       desc:"Bold arrow" },
  "thick-bi":    { label:"Bold ↔",       section:"Bold",    strokeW:4,   dash:"none", mEnd:"nn-tk",   mStart:"nn-tk",    desc:"Bold bidirectional" },
  // Double
  double:        { label:"Double →",     section:"Double",  strokeW:1.5, dash:"none", mEnd:"nn-dbl",  mStart:null,       desc:"Double chevron" },
  "double-bi":   { label:"Double ↔",    section:"Double",  strokeW:1.5, dash:"none", mEnd:"nn-dbl",  mStart:"nn-dbl",   desc:"Double bidirectional" },
  // Wavy / special
  wave:          { label:"Wave →",       section:"Special", strokeW:2,   dash:"none", mEnd:"nn-arr",  mStart:null,       desc:"Wavy / animated", wave:true },
  "wave-bi":     { label:"Wave ↔",      section:"Special", strokeW:2,   dash:"none", mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Wavy bidirectional", wave:true },
  // Semantic — note-taking relationships
  causes:        { label:"Causes →",     section:"Semantic",strokeW:2,   dash:"4,3",  mEnd:"nn-arr",  mStart:null,       desc:"Causal relationship", color:"#FF7043" },
  supports:      { label:"Supports →",   section:"Semantic",strokeW:2,   dash:"6,3",  mEnd:"nn-arr",  mStart:null,       desc:"Supporting evidence", color:"#66BB6A" },
  contradicts:   { label:"Contradicts",  section:"Semantic",strokeW:2,   dash:"4,3",  mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Opposing idea",       color:"#EF5350" },
  partof:        { label:"Part of",      section:"Semantic",strokeW:1.5, dash:"none", mEnd:"nn-arr",  mStart:null,       desc:"Containment / belongs to" },
  seealso:       { label:"See also",     section:"Semantic",strokeW:1.5, dash:"5,4",  mEnd:"nn-arr",  mStart:"nn-arr",   desc:"Related concept" },
  leads:         { label:"Leads to →",   section:"Semantic",strokeW:2.5, dash:"none", mEnd:"nn-tk",   mStart:null,       desc:"Sequential / next step" },
  depends:       { label:"Depends on",   section:"Semantic",strokeW:2,   dash:"8,4",  mEnd:"nn-arr",  mStart:null,       desc:"Dependency" },
};

// Sections order for the panel
const EDGE_SECTIONS = ["Basic","Dashed","Dotted","Bold","Double","Special","Semantic"];

const DEF_W=220, DEF_H=96, GRP_W=340, GRP_H=240;
const COL_W=72,  COL_H=72; // collapsed node size

// Use browser crypto for UUID - never send non-UUID to DB
const makeId = () => typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:r&0x3|0x8).toString(16);});

// ── Notes helpers ─────────────────────────────────────────────
function looksLikeNote(obj) {
  return obj && typeof obj === 'object' && ('id' in obj || 'title' in obj || 'content' in obj);
}
function escCtrl(s) {
  return s.replace(/[\x00-\x1f]/g, c => {
    const m = {'\n':'\\n','\r':'\\r','\t':'\\t'};
    return m[c] || ('\\u' + c.charCodeAt(0).toString(16).padStart(4,'0'));
  });
}
function tryExtractNotes(str) {
  if (typeof str !== 'string' || !str.trim()) return null;
  const s = str.trim();
  if (s.startsWith('[')) {
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.every(looksLikeNote)) return p;
    } catch {}
  }
  if (s.startsWith('{')) {
    // Escape literal control chars (e.g. \n newline) before re-parsing as JSON array
    try {
      const p = JSON.parse('[' + escCtrl(s) + ']');
      if (Array.isArray(p) && p.every(looksLikeNote)) return p;
    } catch {}
    try {
      const p = JSON.parse(escCtrl(s));
      if (looksLikeNote(p)) return [p];
    } catch {}
  }
  return null;
}
function parseNotes(raw) {
  if (!raw) return [];
  // Already a proper array
  if (Array.isArray(raw)) {
    return raw.flatMap(n => {
      if (!n || typeof n !== 'object') return [];
      // Check if this note's content is itself a serialized notes array (corruption)
      const inner = tryExtractNotes(n.content);
      if (inner && inner.length > 0) return inner;
      return [{ id: n.id || Math.random().toString(36).slice(2), title: n.title || '', content: n.content || '', sensitive: !!n.sensitive }];
    });
  }
  // String from DB
  if (typeof raw === 'string') {
    const extracted = tryExtractNotes(raw);
    if (extracted) return parseNotes(extracted); // recurse to handle nested corruption
    if (raw.trim()) return [{ id: Math.random().toString(36).slice(2), title: '', content: raw, sensitive: false }];
  }
  return [];
}
function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function serializeNotes(notes) {
  return JSON.stringify(Array.isArray(notes) ? notes : []);
}

const DP = {
  workflow_task:{Frequency:"Weekly",Duration:"15 min",Tools:"",Automation:"Manual"},
  note:{Content:""},
  heading:{Level:"H1",Subtitle:""},
  user:{Role:"",Email:"",Team:""},
  process:{Step:"",Input:"",Output:""},
  group:{Description:""},
  decision:{Condition:"",Yes:"",No:""},
  annotation:{Reference:""},
  // Network
  router:{IP:"",Domain:"",Subnet:"",Gateway:"",Make:"",Model:"",Protocol:"BGP",Firmware:"",
    Ports:[
      {id:"eth0",label:"eth0",type:"LAN",connected:"",ip:""},
      {id:"eth1",label:"eth1",type:"WAN",connected:"",ip:""},
      {id:"eth2",label:"eth2",type:"LAN",connected:"",ip:""},
      {id:"eth3",label:"eth3",type:"LAN",connected:"",ip:""},
    ]},
  switch:{IP:"",Domain:"",Subnet:"",Make:"",Model:"",PortCount:"24",VLAN:"",Layer:"L2",
    Ports:[
      {id:"p1",label:"Port 1",type:"access",connected:"",vlan:""},
      {id:"p2",label:"Port 2",type:"access",connected:"",vlan:""},
      {id:"p3",label:"Port 3",type:"trunk",connected:"",vlan:""},
      {id:"p4",label:"Port 4",type:"trunk",connected:"",vlan:""},
    ]},
  firewall:{IP:"",Domain:"",Subnet:"",MAC:"",Make:"",Model:"",Rules:"",Zone:"",OS:""},
  loadbal:{Make:"",Model:"",Algorithm:"Round Robin",VIP:""},
  vpn:{IP:"",Protocol:"IPSec",Endpoint:"",Peer:"",Tunnel:""},
  ap:{IP:"",Make:"",Model:"",SSID:"",Band:"2.4GHz/5GHz",Channel:""},
  modem:{IP:"",Make:"",Model:"",ISP:"",Type:"Cable"},
  wanlink:{IP:"",Provider:"",Speed:"",Type:"MPLS",Redundant:"No"},
  vlan:{ID:"",Name:"",Subnet:"",Tagged:""},
  proxy:{Type:"Forward",IP:"",Port:"3128",Auth:""},
  // Computers
  desktop:{IP:"",Domain:"",Subnet:"",MAC:"",Make:"",Model:"",OS:"Windows 11",CPU:"",RAM:"",User:"",Services:[{id:"svc1",name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}],Ports:[{id:"eth0",label:"Ethernet",type:"Ethernet",connected:"",ip:""},{id:"usb1",label:"USB-A 1",type:"USB 3.0",connected:"",ip:""},{id:"usb2",label:"USB-A 2",type:"USB 3.0",connected:"",ip:""},{id:"hdmi",label:"HDMI",type:"HDMI",connected:"",ip:""}]},
  laptop:{IP:"",Make:"",Model:"",OS:"",CPU:"",RAM:"",User:"",Ports:[{id:"eth0",label:"Ethernet",type:"Ethernet",connected:"",ip:""},{id:"usbc1",label:"USB-C 1",type:"USB-C",connected:"",ip:""},{id:"usbc2",label:"USB-C 2",type:"Thunderbolt 4",connected:"",ip:""},{id:"hdmi",label:"HDMI",type:"HDMI",connected:"",ip:""}]},
  workstation:{IP:"",Make:"",Model:"",OS:"",CPU:"",RAM:"",GPU:"",Services:[{id:"svc1",name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}],Ports:[{id:"eth0",label:"Ethernet",type:"Ethernet",connected:"",ip:""},{id:"eth1",label:"eth1",type:"Ethernet",connected:"",ip:""},{id:"usbc1",label:"Thunderbolt 1",type:"Thunderbolt 4",connected:"",ip:""},{id:"usbc2",label:"Thunderbolt 2",type:"Thunderbolt 4",connected:"",ip:""},{id:"dp1",label:"DisplayPort",type:"DisplayPort",connected:"",ip:""},{id:"hdmi",label:"HDMI",type:"HDMI",connected:"",ip:""}]},
  thinclnt:{IP:"",Make:"",Model:"",OS:"",Server:""},
  kiosk:{IP:"",Make:"",OS:"",Location:"",App:""},
  // Servers
  server:{IP:"",Domain:"",Subnet:"",MAC:"",Make:"",Model:"",OS:"",CPU:"",RAM:"",Role:"",Port:"",Services:[{id:"svc1",name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}],Ports:[{id:"eth0",label:"eth0",type:"Ethernet",connected:"",ip:""},{id:"mgmt",label:"iDRAC/iLO",type:"iDRAC/iLO",connected:"",ip:""}]},
  webserver:{IP:"",Domain:"",Subnet:"",Software:"Nginx",Version:"",Port:"443",SSL:"Yes",CertExpiry:""},
  appserver:{IP:"",Runtime:"",Version:"",Port:"",Instances:"",Services:[{id:"svc1",name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}]},
  dbserver:{IP:"",Engine:"PostgreSQL",Version:"",Port:"5432",RAM:""},
  fileserver:{IP:"",OS:"",Shares:"",Storage:"",Protocol:"SMB"},
  mailserver:{IP:"",Software:"",Domain:"",TLS:"Yes",Spam:""},
  printserver:{IP:"",Make:"",Model:"",Queue:"",Protocol:"IPP"},
  // Storage
  storage:{IP:"",Capacity:"",Type:"SSD",RAID:"",Interface:""},
  nas:{IP:"",Make:"",Model:"",Capacity:"",RAID:"",Shares:"",Services:[{id:"svc1",name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}],Ports:[{id:"eth0",label:"eth0",type:"Ethernet",connected:"",ip:""},{id:"eth1",label:"eth1",type:"Ethernet",connected:"",ip:""}]},
  san:{IP:"",Make:"",Model:"",Capacity:"",FC:"",Protocol:"iSCSI"},
  backup:{IP:"",Software:"",Schedule:"",Retention:"",Target:""},
  tape:{IP:"",Make:"",Model:"",Capacity:"",Library:""},
  // Mobile & IoT
  mobile:{IP:"",Make:"",Model:"",OS:"",User:"",MDM:""},
  tablet:{IP:"",Make:"",Model:"",OS:"",User:""},
  rpi:{IP:"",Model:"Pi 4B",OS:"Raspberry Pi OS",RAM:"4GB",Role:"",Services:[{id:"svc1",name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}],Ports:[{id:"eth0",label:"Ethernet",type:"Ethernet",connected:"",ip:""},{id:"usb1",label:"USB-A 1",type:"USB 3.0",connected:"",ip:""},{id:"usb2",label:"USB-A 2",type:"USB 3.0",connected:"",ip:""},{id:"usbc",label:"USB-C Power",type:"USB-C",connected:"",ip:""},{id:"hdmi1",label:"HDMI 1",type:"HDMI",connected:"",ip:""}]},
  arduino:{IP:"",Model:"Uno",Firmware:"",Sensors:"",Protocol:""},
  esp:{IP:"",Model:"ESP32",Firmware:"",WiFi:"",Protocol:"MQTT"},
  sensor:{IP:"",Type:"",Protocol:"MQTT",Location:"",Unit:""},
  camera:{Make:"",Model:"",Resolution:"",Protocol:"RTSP",IP:""},
  plc:{IP:"",Make:"",Model:"",Protocol:"Modbus",IO:""},
  gateway:{IP:"",Make:"",Model:"",Protocol:"",Upstream:""},
  hvac:{IP:"",Make:"",Model:"",Zone:"",Protocol:"BACnet"},
  // Cloud
  cloud:{IP:"",Domain:"",Provider:"AWS",Region:"",Service:"",Account:""},
  lambda:{Runtime:"Node.js 20",Trigger:"",Memory:"256MB",Timeout:"30s"},
  queue:{Type:"SQS",MaxSize:"",DLQ:"",Delay:""},
  cdn:{Provider:"CloudFront",Origin:"",TTL:"3600",Geo:""},
  s3:{Provider:"AWS",Bucket:"",Region:"",Access:"Private"},
  k8s:{IP:"",Cluster:"",Namespace:"",Replicas:"",Version:""},
  container:{IP:"",Domain:"",Port:"",Image:"",Tag:"latest",Registry:""},
  apigateway:{IP:"",Provider:"AWS",Stage:"",Auth:"",Throttle:""},
  // Software
  software:{IP:"",Version:"",License:"",Port:"",Platform:""},
  api:{IP:"",Endpoint:"",Method:"REST",Auth:"Bearer",Version:"v1"},
  database:{IP:"",Domain:"",Port:"5432",Engine:"PostgreSQL",Schema:"",HA:"",Backup:""},
  service:{IP:"",URL:"",Status:"Running",Port:"",SLA:""},
  microservice:{IP:"",Language:"",Port:"",Version:"",Replicas:""},
  cache:{IP:"",Type:"Redis",Port:"6379",MaxMem:"",Eviction:"LRU"},
  broker:{IP:"",Type:"Kafka",Port:"9092",Topics:"",Retention:"7d"},
  // Security
  ids:{IP:"",Make:"",Model:"",Mode:"Inline",Ruleset:"Snort"},
  waf:{IP:"",Provider:"",Mode:"Block",Rules:"OWASP",SSL:"Yes"},
  vault:{Type:"HashiCorp Vault",Auth:"",Secrets:"",HA:""},
  siem:{Software:"",Sources:"",Retention:"90d",Alerts:""},
  dlp:{Provider:"",Mode:"",Channels:"",Policy:""},
  // Network extended
  vpnclient:{IP:"",Protocol:"WireGuard",Server:"",Port:"51820",Auth:""},
  vpnserver:{IP:"",Protocol:"WireGuard",Port:"51820",Clients:"",Subnet:""},
  vpnconc:{IP:"",Protocol:"IPSec",Tunnels:"",HA:"",Make:"",Model:""},
  sdwan:{IP:"",Make:"",Model:"",Uplinks:"",Policy:"",Orchestrator:""},
  corerouter:{IP:"",Make:"",Model:"",BGP_AS:"",Protocols:"OSPF/BGP",Interfaces:"",Ports:[{id:"eth0",label:"eth0",type:"WAN",connected:"",ip:""},{id:"eth1",label:"eth1",type:"LAN",connected:"",ip:""},{id:"eth2",label:"eth2",type:"LAN",connected:"",ip:""},{id:"sfp1",label:"SFP+ 1",type:"SFP+",connected:"",ip:""}]},
  edgerouter:{IP:"",Make:"",Model:"",ISP:"",NAT:"Yes",Protocols:"",Ports:[{id:"eth0",label:"eth0",type:"WAN",connected:"",ip:""},{id:"eth1",label:"eth1",type:"LAN",connected:"",ip:""},{id:"eth2",label:"eth2",type:"LAN",connected:"",ip:""}]},
  l3switch:{IP:"",Make:"",Model:"",VLANs:"",RoutingProtocol:"",PortCount:"",Ports:[{id:"p1",label:"Port 1",type:"trunk",connected:"",vlan:""},{id:"p2",label:"Port 2",type:"trunk",connected:"",vlan:""},{id:"up1",label:"Uplink 1",type:"uplink",connected:"",vlan:""},{id:"up2",label:"Uplink 2",type:"uplink",connected:"",vlan:""}]},
  poeswitch:{IP:"",Make:"",Model:"",PortCount:"24",PoEBudget:"",VLANs:"",Ports:[{id:"p1",label:"Port 1",type:"PoE",connected:"",vlan:""},{id:"p2",label:"Port 2",type:"PoE",connected:"",vlan:""},{id:"up1",label:"Uplink 1",type:"uplink",connected:"",vlan:""}]},
  wlcont:{IP:"",Make:"",Model:"",APs_Managed:"",SSID:"",Auth:"WPA3"},
  dhcpsrv:{IP:"",Scope:"",RangeStart:"",RangeEnd:"",Lease:"24h",DNS:""},
  dnssrv:{IP:"",Software:"BIND",Zones:"",Forwarders:"",DNSSEC:""},
  ntpsrv:{IP:"",Stratum:"",Upstream:"",Clients:""},
  radiussrv:{IP:"",Software:"FreeRADIUS",Port:"1812",Clients:"",Auth:"EAP-TLS"},
  patchpanel:{Location:"",Ports:"24",RackUnit:"",Label:""},
  nettap:{IP:"",Mode:"Passive",Make:"",Model:"",Speed:"",Mirror:""},
  netmon:{IP:"",Software:"",Protocol:"SNMP",Hosts:"",Dashboard:""},
  honeypot:{IP:"",Type:"Low-interaction",OS:"Decoy",Ports:"",Alert:""},
  // Homelab / Hypervisors
  proxmox:{IP:"",Domain:"",Subnet:"",MAC:"",Make:"",Model:"",CPU:"",RAM:"",Storage:"",PCIPassthrough:"",ClusterName:"",Services:[{id:"svc1",name:"Ubuntu VM",type:"VM",ip:"",port:"",status:"Running",image:"",os:"Ubuntu 22.04",memory:"4GB",cpu:"2",notes:""},{id:"svc2",name:"nginx",type:"LXC",ip:"",port:"80",status:"Running",image:"",os:"Debian",memory:"512MB",cpu:"1",notes:""}],Ports:[{id:"eth0",label:"eth0",type:"Ethernet",connected:"",ip:""},{id:"eth1",label:"eth1",type:"Ethernet",connected:"",ip:""},{id:"mgmt",label:"IPMI/BMC",type:"iDRAC/iLO",connected:"",ip:""}]},
  esxi:{IP:"",Domain:"",Subnet:"",Make:"",Model:"",vCenter:"",Cluster:"",Version:"",CPU:"",RAM:"",DatastoreGB:"",Services:[{id:"svc1",name:"",type:"VM",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}],Ports:[{id:"vmnic0",label:"vmnic0",type:"Ethernet",connected:"",ip:""},{id:"vmnic1",label:"vmnic1",type:"Ethernet",connected:"",ip:""},{id:"mgmt",label:"IPMI/iDRAC",type:"iDRAC/iLO",connected:"",ip:""}]},
  hyperv:{IP:"",Domain:"",Subnet:"",Make:"",Model:"",WindowsVersion:"",vSwitches:"",Cluster:"",Services:[{id:"svc1",name:"",type:"VM",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}],Ports:[{id:"eth0",label:"eth0",type:"Ethernet",connected:"",ip:""},{id:"eth1",label:"eth1",type:"Ethernet",connected:"",ip:""},{id:"mgmt",label:"iDRAC/iLO",type:"iDRAC/iLO",connected:"",ip:""}]},
  unraid:{IP:"",Domain:"",Subnet:"",Make:"",Model:"",OS:"Unraid 7",CPU:"",RAM:"",ArraySize:"",Parity:"",Services:[{id:"svc1",name:"Ubuntu VM",type:"VM",ip:"",port:"",status:"Running",image:"",os:"Ubuntu 22.04",memory:"4GB",cpu:"2",notes:""},{id:"svc2",name:"nginx",type:"LXC",ip:"",port:"80",status:"Running",image:"",os:"Debian",memory:"512MB",cpu:"1",notes:""}],Ports:[{id:"eth0",label:"eth0",type:"Ethernet",connected:"",ip:""},{id:"eth1",label:"eth1 (bonded)",type:"Ethernet",connected:"",ip:""},{id:"mgmt",label:"IPMI",type:"iDRAC/iLO",connected:"",ip:""}]},
  truenas:{IP:"",Domain:"",Subnet:"",Make:"",Model:"",Version:"",Capacity:"",RAID:"RAIDZ2",Shares:"",iSCSI:"",Services:[{id:"svc1",name:"",type:"App",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}],Ports:[{id:"eth0",label:"eth0",type:"Ethernet",connected:"",ip:""},{id:"eth1",label:"eth1",type:"Ethernet",connected:"",ip:""},{id:"hba1",label:"HBA 1",type:"HBA",connected:"",ip:""}]},
  // Virtualisation & Containers
  vm:{IP:"",OS:"Ubuntu 22.04",RAM:"4GB",CPU:"2",Disk:"50GB",Snapshot:"",Hypervisor:"",Status:"Running"},
  lxc:{IP:"",OS:"Debian",RAM:"512MB",CPU:"1",Disk:"10GB",Unprivileged:"Yes",Status:"Running"},
  docker:{IP:"",Version:"",Compose:"Yes",Swarm:"No",Networks:"bridge,host",Volumes:"",Services:[{id:"svc1",name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}]},
  dockercont:{Image:"",Tag:"latest",Port:"",IP:"",Memory:"256MB",CPU:"1",Env:"",Volumes:"",Network:"bridge",Status:"Running"},
  compose:{File:"docker-compose.yml",Services:"",Networks:"",Volumes:"",Version:"3.8"},
  idea:{Content:"",Tags:"",Status:"New"},
  topic:{Content:"",Parent:"",Tags:""},
  concept:{Content:"",RelatedTo:"",Tags:""},
  definition:{Term:"",Definition:"",Source:""},
  quote:{Text:"",Author:"",Source:"",Page:""},
  summary:{Content:"",Source:"",KeyPoints:""},
  question:{Question:"",Context:"",Priority:"Medium"},
  answer:{Answer:"",Confidence:"High",References:""},
  warning:{Message:"",Severity:"Medium",Action:""},
  tip:{Content:"",Category:""},
  codeblock:{Language:"",Code:"",Description:""},
  // Planning
  task:{Title:"",Status:"Todo",Priority:"Medium",Assignee:"",Due:""},
  checklist:{Items:"",Done:"0",Total:"0"},
  goal:{Objective:"",KPI:"",Target:"",Due:""},
  milestone:{Name:"",Date:"",Status:"Upcoming",Owner:""},
  deadline:{Date:"",Item:"",Owner:"",Hard:"Yes"},
  blocker:{Issue:"",Impact:"High",Owner:"",Resolution:""},
  step:{Number:"",Action:"",Input:"",Output:""},
  problem:{Statement:"",Impact:"High",Cause:""},
  solution:{Approach:"",Effort:"Medium",Risk:"",Owner:""},
  // Knowledge
  reference:{URL:"",Title:"",Author:"",Date:""},
  resource:{Type:"Article",URL:"",Title:"",Tags:""},
  evidence:{Content:"",Source:"",Strength:"Strong"},
  flashcard:{Front:"",Back:"",Tags:"",Difficulty:"Medium"},
  bookmark:{URL:"",Title:"",Tags:"",Note:""},
  formula:{Expression:"",Variables:"",Unit:"",Notes:""},
};

const mkNode = (type, x, y) => ({
  id: makeId(), type, x, y,
  w: type==="group" ? GRP_W : type==="note" ? 240 : DEF_W,
  h: type==="group" ? GRP_H : type==="note" ? 160 : DEF_H,
  title: NT[type]?.label || "Node",
  description: "", showNotes: false,
  notes: [], node_notes: "", notes_private: false,
  collapsed: false,
  properties: { ...(DP[type]||{}) }, customProps: {},
});

// ── Auto-layout — topological layers, centered, no overlap ──
function autoLayout(nodes, edges, direction='LR') {
  if (!nodes.length) return nodes;
  try {
    const PAD        = 80;   // canvas padding
    const LAYER_GAP  = 140;  // gap between depth layers (main axis)
    const NODE_GAP   = 44;   // min gap between nodes within a layer (cross axis)
    const nodeW = n => n?.w || DEF_W;
    const nodeH = n => n?.h || DEF_H;
    const rawById = id => nodes.find(n => n.id === id);
    const isHoriz = direction === 'LR' || direction === 'RL';

    // ── 0. Collapse note-stacks into single layout units ─────────────
    // Grouped notes (2+ notes sharing exactly one non-note parent) render on
    // canvas as ONE box at the average of their positions. If the layout treats
    // them as N separate nodes it reserves N slots and spreads them apart, which
    // both wastes space and drags the rendered box away from where the layout
    // "thinks" it is. Treat each stack as one unit, then assign every member the
    // same final coordinate so the averaged box lands exactly on that slot.
    const noteParents = {};
    edges.forEach(e => {
      const fn = rawById(e.from), tn = rawById(e.to);
      if (tn?.type === 'note' && fn?.type !== 'note') (noteParents[e.to]  = noteParents[e.to]  || []).push(e.from);
      if (fn?.type === 'note' && tn?.type !== 'note') (noteParents[e.from]= noteParents[e.from]|| []).push(e.to);
    });
    const stackOf = {};   // parentId -> [noteId,...]
    nodes.forEach(n => {
      if (n.type !== 'note') return;
      const ps = noteParents[n.id] || [];
      if (ps.length === 1) (stackOf[ps[0]] = stackOf[ps[0]] || []).push(n.id);
    });
    const memberToUnit = {};  // noteId -> unitId
    const unitMembers  = {};  // unitId -> [noteId,...]
    const stackParentOf = {}; // unitId -> parent node id (its only real neighbour)
    Object.entries(stackOf).forEach(([pid, ids]) => {
      if (ids.length < 2) return;
      const unitId = `__stack__${pid}`;
      unitMembers[unitId] = ids;
      stackParentOf[unitId] = pid;
      ids.forEach(id => { memberToUnit[id] = unitId; });
    });
    const unitId = id => memberToUnit[id] || id;
    // Size of a unit: the rendered stack box, not the sum of its members.
    const STACK_W = 240, STACK_H = 150;
    const unitW = id => unitMembers[id] ? STACK_W : nodeW(rawById(id));
    const unitH = id => unitMembers[id] ? STACK_H : nodeH(rawById(id));
    const crossSize = id => isHoriz ? unitH(id) : unitW(id);
    const mainSize  = id => isHoriz ? unitW(id) : unitH(id);

    // Work on the collapsed unit graph from here on.
    const unitIds = [...new Set(nodes.map(n => unitId(n.id)))];

    // ── 1. Build adjacency (unit level, no self-loops) ───────────────
    const children = {}, parents = {};
    unitIds.forEach(u => { children[u] = []; parents[u] = []; });
    edges.forEach(e => {
      const a = unitId(e.from), b = unitId(e.to);
      if (a === b || !children[a] || !children[b]) return;
      if (!children[a].includes(b)) { children[a].push(b); parents[b].push(a); }
    });

    // ── 2. Break cycles (DFS back-edge removal) ──────────────────────
    const vis = new Set(), stk = new Set();
    function breakCycles(id) {
      vis.add(id); stk.add(id);
      for (const c of [...children[id]]) {
        if (stk.has(c)) {
          children[id] = children[id].filter(x => x !== c);
          parents[c]   = parents[c].filter(x => x !== id);
        } else if (!vis.has(c)) breakCycles(c);
      }
      stk.delete(id);
    }
    unitIds.forEach(u => { if (!vis.has(u)) breakCycles(u); });

    // ── 3. Longest-path layering ─────────────────────────────────────
    const depthOf = {};
    {
      const memo = {};
      const seen = new Set();
      function d(id) {
        if (memo[id] !== undefined) return memo[id];
        if (seen.has(id)) return 0;      // safety against any residual cycle
        seen.add(id);
        const pd = parents[id].map(p => d(p) + 1);
        seen.delete(id);
        return (memo[id] = pd.length ? Math.max(...pd) : 0);
      }
      unitIds.forEach(u => { depthOf[u] = d(u); });
    }
    const maxDepth = Math.max(0, ...unitIds.map(u => depthOf[u]));

    // ── 4. RADIAL layout (unchanged behaviour, unit-aware) ───────────
    if (direction === 'radial') {
      const cx=2000, cy=1500, radii=[0,320,600,880,1160,1440];
      const px={}, py={};
      const byDepth = Array.from({length:6}, ()=>[]);
      unitIds.forEach(u => byDepth[Math.min(depthOf[u],5)].push(u));
      byDepth.forEach((layer,li) => {
        const r=radii[li];
        layer.forEach((id,i) => {
          if (li===0 && layer.length===1) { px[id]=cx-unitW(id)/2; py[id]=cy-unitH(id)/2; }
          else {
            const a=(i/Math.max(layer.length,1))*Math.PI*2-Math.PI/2;
            px[id]=cx+r*Math.cos(a)-unitW(id)/2;
            py[id]=cy+r*Math.sin(a)-unitH(id)/2;
          }
        });
      });
      return nodes.map(n => {
        const u = unitId(n.id);
        return px[u]!==undefined ? {...n, x:Math.round(px[u]), y:Math.round(py[u])} : n;
      });
    }

    // ── 5. Main-axis position per layer ──────────────────────────────
    const layerPos = [];
    let curMain = PAD;
    for (let d = 0; d <= maxDepth; d++) {
      layerPos[d] = curMain;
      const atD = unitIds.filter(u => depthOf[u] === d);
      curMain += (atD.length ? Math.max(...atD.map(mainSize)) : DEF_W) + LAYER_GAP;
    }

    // ── 6. Order within each layer — barycenter crossing reduction ────
    const layers = [];
    unitIds.forEach(u => { const d = depthOf[u]; (layers[d] = layers[d] || []).push(u); });

    // Seed the order with a DFS of the spanning tree. A pure barycenter run
    // starting from arbitrary insertion order can settle into a worse local
    // optimum than the tree order on tree-shaped graphs (the common case), so
    // start from the tree and let barycenter fix only what the tree gets wrong.
    {
      const primaryParent = {};
      unitIds.forEach(u => {
        if (!parents[u].length) return;
        primaryParent[u] = parents[u].reduce((best,p) => depthOf[p] > depthOf[best] ? p : best);
      });
      const treeKids = {};
      unitIds.forEach(u => { treeKids[u] = []; });
      unitIds.forEach(u => { if (primaryParent[u]) treeKids[primaryParent[u]].push(u); });
      const roots = unitIds.filter(u => !primaryParent[u]);
      const seq = [];
      const seenDfs = new Set();
      (function dfsAll(list) {
        list.forEach(function walk(id) {
          if (seenDfs.has(id)) return;
          seenDfs.add(id); seq.push(id);
          treeKids[id].forEach(walk);
        });
      })(roots);
      unitIds.forEach(u => { if (!seenDfs.has(u)) seq.push(u); });
      const rank = Object.fromEntries(seq.map((id,i) => [id,i]));
      layers.forEach(layer => layer && layer.sort((a,b) => rank[a]-rank[b]));
    }

    const orderIndex = {};
    layers.forEach(layer => layer && layer.forEach((id,i) => { orderIndex[id] = i; }));

    // Count crossings between every adjacent layer pair for the current order.
    function countCrossings() {
      let total = 0;
      for (let d = 0; d < layers.length-1; d++) {
        if (!layers[d] || !layers[d+1]) continue;
        const pairs = [];
        layers[d].forEach(u => children[u].forEach(v => {
          if (depthOf[v] === d+1) pairs.push([orderIndex[u], orderIndex[v]]);
        }));
        for (let i = 0; i < pairs.length; i++)
          for (let j = i+1; j < pairs.length; j++)
            if ((pairs[i][0]-pairs[j][0]) * (pairs[i][1]-pairs[j][1]) < 0) total++;
      }
      return total;
    }

    function sortLayer(layer, refIds) {
      const ref = new Set(refIds || []);
      const bc = {};
      layer.forEach(id => {
        const nb = [...parents[id], ...children[id]].filter(x => ref.has(x));
        bc[id] = nb.length ? nb.reduce((s,x)=>s+orderIndex[x],0)/nb.length : orderIndex[id];
      });
      layer.sort((a,b) => bc[a]-bc[b] || orderIndex[a]-orderIndex[b]);
      layer.forEach((id,i) => { orderIndex[id] = i; });
    }

    // Only keep a pass if it actually reduced crossings — never regress.
    let bestCross = countCrossings();
    let bestOrder = layers.map(l => l ? [...l] : l);
    for (let it = 0; it < 8 && bestCross > 0; it++) {
      if (it % 2 === 0) for (let d = 1; d < layers.length; d++)      layers[d] && sortLayer(layers[d], layers[d-1]);
      else               for (let d = layers.length-2; d >= 0; d--)   layers[d] && sortLayer(layers[d], layers[d+1]);
      const c = countCrossings();
      if (c < bestCross) { bestCross = c; bestOrder = layers.map(l => l ? [...l] : l); }
    }
    bestOrder.forEach((l,d) => { if (l) layers[d] = l; });
    layers.forEach(layer => layer && layer.forEach((id,i) => { orderIndex[id] = i; }));

    // ── 7. Cross-axis coordinates — straighten toward neighbours ─────
    // Pack once, then repeatedly pull each node toward the average cross
    // position of its actual neighbours and re-resolve overlaps. This is what
    // keeps a parent sitting beside its children instead of at the top of a
    // long column, which is what caused the long diagonal sweeping edges.
    const cross = {};
    // A node carrying a note group needs as much room in its own layer as the
    // group box occupies in the next one — otherwise the parents pack tighter
    // than their note boxes can, and it becomes geometrically impossible for
    // them all to line up no matter how the pinning is done.
    const stackChildOf = {};
    Object.entries(stackParentOf).forEach(([sid,pid]) => { stackChildOf[pid] = sid; });
    const effSize = id => {
      const sc = stackChildOf[id];
      return sc ? Math.max(crossSize(id), crossSize(sc)) : crossSize(id);
    };
    const effTop  = id => cross[id] + crossSize(id)/2 - effSize(id)/2;
    const setEffTop = (id,t) => { cross[id] = t + effSize(id)/2 - crossSize(id)/2; };

    layers.forEach(layer => {
      if (!layer) return;
      let c = PAD;
      layer.forEach(id => { setEffTop(id, c); c += effSize(id) + NODE_GAP; });
    });

    function resolveOverlaps(layer) {
      // forward sweep: enforce min separation in current order
      for (let i = 1; i < layer.length; i++) {
        const prev = layer[i-1], cur = layer[i];
        const minT = effTop(prev) + effSize(prev) + NODE_GAP;
        if (effTop(cur) < minT) setEffTop(cur, minT);
      }
      // backward sweep: reclaim slack so the block stays compact
      for (let i = layer.length-2; i >= 0; i--) {
        const next = layer[i+1], cur = layer[i];
        const maxT = effTop(next) - NODE_GAP - effSize(cur);
        if (effTop(cur) > maxT) setEffTop(cur, maxT);
      }
      // never drift above the canvas padding
      const minStart = Math.min(...layer.map(effTop));
      if (minStart < PAD) layer.forEach(id => { cross[id] += PAD - minStart; });
    }

    for (let it = 0; it < 12; it++) {
      const order = it % 2 === 0
        ? [...layers.keys()]
        : [...layers.keys()].reverse();
      order.forEach(d => {
        const layer = layers[d];
        if (!layer) return;
        layer.forEach(id => {
          const nb = it % 2 === 0 ? parents[id] : children[id];
          const ref = nb.length ? nb : [...parents[id], ...children[id]];
          if (!ref.length) return;
          // align centres, not top edges
          const target = ref.reduce((s,x) => s + cross[x] + crossSize(x)/2, 0) / ref.length;
          cross[id] = target - crossSize(id)/2;
        });
        // A note group is an annotation on one node, not a peer in the graph.
        // Pin it dead in line with its parent so the connector is a straight
        // run with zero bends, then let overlap resolution nudge only if it
        // truly has to.
        layer.forEach(id => {
          const pid = stackParentOf[id];
          if (!pid || cross[pid] === undefined) return;
          cross[id] = cross[pid] + crossSize(pid)/2 - crossSize(id)/2;
        });
        resolveOverlaps(layer);
      });
    }
    layers.forEach(layer => layer && resolveOverlaps(layer));

    // ── 8. Assemble unit coordinates ─────────────────────────────────
    const px = {}, py = {};
    unitIds.forEach(u => {
      const d = depthOf[u];
      if (isHoriz) { px[u] = layerPos[d]; py[u] = cross[u]; }
      else          { px[u] = cross[u];    py[u] = layerPos[d]; }
    });

    // ── 9. Flip for RL / BT ──────────────────────────────────────────
    if (direction === 'RL' || direction === 'BT') {
      const maxMain = Math.max(...unitIds.map(u =>
        isHoriz ? px[u] + unitW(u) : py[u] + unitH(u)));
      unitIds.forEach(u => {
        if (isHoriz) px[u] = maxMain - px[u] - unitW(u) + PAD;
        else         py[u] = maxMain - py[u] - unitH(u) + PAD;
      });
    }

    // ── 10. Expand units back to real nodes ──────────────────────────
    // Stack members all share the unit's coordinate so the averaged stack box
    // renders exactly on the reserved slot.
    return nodes.map(n => {
      const u = unitId(n.id);
      if (px[u] === undefined) return n;
      return { ...n, x: Math.round(px[u]), y: Math.round(py[u]) };
    });

  } catch(err) {
    console.error('[autoLayout]', err);
    return nodes;
  }
}

// ── Edge start/end point on node rectangle edge ─────────────────
// nw/nh are the ACTUAL rendered dimensions (not just stored node.w/node.h)
function rectEdgePoint(node, nw, nh, targetX, targetY) {
  const cx = node.x + nw/2, cy = node.y + nh/2;
  const dx = targetX - cx,  dy = targetY - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x:cx, y:cy };
  const hw = nw/2, hh = nh/2;
  const sx = Math.abs(dx) > 0.001 ? hw / Math.abs(dx) : Infinity;
  const sy = Math.abs(dy) > 0.001 ? hh / Math.abs(dy) : Infinity;
  const s  = Math.min(sx, sy);
  return { x: cx + dx*s, y: cy + dy*s };
}

// ── Best face picker — pure function, used by getEdgePath + port pre-compute ──
// Picks the (from, to) face pair that gives the most direct, non-backtracking path
function pickBestSides(fx,fy,fw,fh,tx,ty,tw,th){
  // CRITICAL RULE: Always return OPPOSITE faces.
  // right→left, left→right, bottom→top, top→bottom.
  // Non-opposite pairs (right→right, bottom→left, etc.) create U-curves and loops.
  //
  // Uses STORED node dimensions (fw,fh,tw,th) not DOM-measured heights,
  // so the face decision is stable and independent of ref timing.
  //
  // Decision: whichever axis has larger center-to-center separation wins.
  // Tie goes to horizontal (cleaner for most diagram layouts).
  const fcx=fx+fw/2, fcy=fy+fh/2;
  const tcx=tx+tw/2, tcy=ty+th/2;
  const dx=tcx-fcx, dy=tcy-fcy;

  if(Math.abs(dx)>=Math.abs(dy)){
    // Horizontal dominant (or tie)
    return dx>=0?{from:"right",to:"left"}:{from:"left",to:"right"};
  } else {
    // Vertical dominant
    return dy>=0?{from:"bottom",to:"top"}:{from:"top",to:"bottom"};
  }
}

// ── Orthogonal (Manhattan) edge routing ──────────────────────────
// Curved beziers between two points can't avoid anything: they pass straight
// through nodes, overlap each other when several edges share a corridor, and
// balloon into big loops on long spans. Orthogonal routing fixes all three by
// (a) leaving each node perpendicular to its face, (b) travelling down a
// dedicated "lane" in the empty channel between nodes, and (c) checking that
// lane against every node rectangle before committing to it.

// Turn a polyline into an SVG path with rounded corners.
function roundedPolyPath(pts, r = 14) {
  const P = [];
  pts.forEach(p => {
    const last = P[P.length-1];
    if (!last || Math.abs(last.x-p.x) > 0.5 || Math.abs(last.y-p.y) > 0.5) P.push(p);
  });
  if (P.length < 2) return '';
  let d = `M ${P[0].x} ${P[0].y}`;
  for (let i = 1; i < P.length-1; i++) {
    const p = P[i], prev = P[i-1], next = P[i+1];
    const v1 = { x: p.x-prev.x, y: p.y-prev.y };
    const v2 = { x: next.x-p.x, y: next.y-p.y };
    const l1 = Math.hypot(v1.x,v1.y) || 1, l2 = Math.hypot(v2.x,v2.y) || 1;
    const rr = Math.min(r, l1/2, l2/2);
    d += ` L ${p.x - v1.x/l1*rr} ${p.y - v1.y/l1*rr}`;
    d += ` Q ${p.x} ${p.y}, ${p.x + v2.x/l2*rr} ${p.y + v2.y/l2*rr}`;
  }
  const last = P[P.length-1];
  return d + ` L ${last.x} ${last.y}`;
}

// Does an axis-aligned segment pass through any obstacle rectangle?
function segHitsRects(x1, y1, x2, y2, rects, pad = 8) {
  const lo = (a,b) => Math.min(a,b), hi = (a,b) => Math.max(a,b);
  const sx1 = lo(x1,x2), sx2 = hi(x1,x2), sy1 = lo(y1,y2), sy2 = hi(y1,y2);
  return rects.some(r => {
    const rx1 = r.x - pad, ry1 = r.y - pad;
    const rx2 = r.x + r.w + pad, ry2 = r.y + r.h + pad;
    return sx1 < rx2 && sx2 > rx1 && sy1 < ry2 && sy2 > ry1;
  });
}

// Build an orthogonal route. `lane` is the preferred coordinate of the middle
// travel segment; obstacles are the node rects to route around.
function orthoRoute(fp, fn1, tp, fn2, lane, obstacles = []) {
  const STUB = 26;                       // straight run off the node face
  const horizExit  = Math.abs(fn1.dx) > 0.5;
  const horizEnter = Math.abs(fn2.dx) > 0.5;

  // If the two ports already line up and the direct run is clear, draw a
  // straight line. Forcing a stub-lane-stub route on an aligned pair is what
  // produces those little meaningless kinks on otherwise straight connections.
  const aligned = horizExit && horizEnter ? Math.abs(fp.y - tp.y) < 3
                : !horizExit && !horizEnter ? Math.abs(fp.x - tp.x) < 3
                : false;
  if (aligned && !segHitsRects(fp.x, fp.y, tp.x, tp.y, obstacles)) return [fp, tp];

  const a = { x: fp.x + fn1.dx*STUB, y: fp.y + fn1.dy*STUB };
  const b = { x: tp.x + fn2.dx*STUB, y: tp.y + fn2.dy*STUB };

  const mk = (mid) => {
    if (horizExit && horizEnter) return [fp, a, {x:mid,y:a.y}, {x:mid,y:b.y}, b, tp];
    if (!horizExit && !horizEnter) return [fp, a, {x:a.x,y:mid}, {x:b.x,y:mid}, b, tp];
    if (horizExit && !horizEnter) return [fp, a, {x:b.x,y:a.y}, b, tp];
    return [fp, a, {x:a.x,y:b.y}, b, tp];
  };

  const bothSameAxis = (horizExit && horizEnter) || (!horizExit && !horizEnter);
  if (!bothSameAxis) return mk(0);

  const base = lane !== undefined && lane !== null
    ? lane
    : (horizExit ? (a.x + b.x)/2 : (a.y + b.y)/2);

  // Try the assigned lane first, then progressively wider offsets if the
  // travel segment would cut through a node.
  const hits = (mid) => {
    const pts = mk(mid);
    for (let i = 0; i < pts.length-1; i++) {
      if (segHitsRects(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, obstacles)) return true;
    }
    return false;
  };
  if (!hits(base)) return mk(base);
  for (let step = 1; step <= 12; step++) {
    for (const sign of [1,-1]) {
      const cand = base + sign*step*26;
      if (!hits(cand)) return mk(cand);
    }
  }

  // Still blocked — the edge has to cross a whole row/column of nodes. Shifting
  // the single travel segment can't help, because it's the legs at the source
  // and target heights that are hitting things. Use a 5-segment route instead:
  // step out, run along a clear corridor *between* rows, then come back in.
  const corridorHits = (c) => {
    const pts = horizExit
      ? [fp, a, {x:a.x,y:c}, {x:b.x,y:c}, b, tp]
      : [fp, a, {x:c,y:a.y}, {x:c,y:b.y}, b, tp];
    for (let i = 0; i < pts.length-1; i++) {
      if (segHitsRects(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, obstacles)) return null;
    }
    return pts;
  };
  // Candidate corridors: the gaps between obstacle edges, nearest first.
  const bounds = [];
  obstacles.forEach(r => {
    if (horizExit) { bounds.push(r.y - 30, r.y + r.h + 30); }
    else           { bounds.push(r.x - 30, r.x + r.w + 30); }
  });
  const from = horizExit ? fp.y : fp.x;
  bounds.sort((p,q) => Math.abs(p-from) - Math.abs(q-from));
  for (const c of bounds) {
    const pts = corridorHits(c);
    if (pts) return pts;
  }
  return mk(base);
}

function anchorToPoint(node, nw, nh, anchor) {
  const {side, t=0.5} = anchor;
  switch(side) {
    case "top":    return {x: node.x + nw*t, y: node.y,      normal:{dx:0, dy:-1}};
    case "bottom": return {x: node.x + nw*t, y: node.y + nh, normal:{dx:0, dy:1}};
    case "left":   return {x: node.x,        y: node.y+nh*t, normal:{dx:-1,dy:0}};
    case "right":  return {x: node.x + nw,   y: node.y+nh*t, normal:{dx:1, dy:0}};
    default:       return null; // "auto" — use rectEdgePoint
  }
}

// Snap a canvas-space click position to the nearest border anchor {side,t}
function snapToAnchor(node, nw, nh, cx, cy) {
  // distances to each face
  const dTop    = Math.abs(cy - node.y);
  const dBottom = Math.abs(cy - (node.y + nh));
  const dLeft   = Math.abs(cx - node.x);
  const dRight  = Math.abs(cx - (node.x + nw));
  const minD = Math.min(dTop, dBottom, dLeft, dRight);
  const SNAP_DIST = Math.min(nw, nh) * 0.3; // snap zone = 30% of smallest dim
  if (minD > SNAP_DIST) return null; // too far from any edge — use auto
  if      (minD === dTop)    return {side:"top",    t: Math.min(1,Math.max(0,(cx-node.x)/nw))};
  else if (minD === dBottom) return {side:"bottom", t: Math.min(1,Math.max(0,(cx-node.x)/nw))};
  else if (minD === dLeft)   return {side:"left",   t: Math.min(1,Math.max(0,(cy-node.y)/nh))};
  else                       return {side:"right",  t: Math.min(1,Math.max(0,(cy-node.y)/nh))};
}


// ── Lucide icon renderer ─────────────────────────────────────────────────
// icon can be a Lucide component (new) or a string emoji (legacy/canvas fallback)
function NodeIcon({ icon, size=18, color="currentColor", strokeWidth=1.8 }) {
  if (!icon) return null;
  if (typeof icon === "string") return <span style={{fontSize:size,lineHeight:1}}>{icon}</span>;
  const I = icon;
  return <I size={size} color={color} strokeWidth={strokeWidth} style={{flexShrink:0}} />;
}
// Text fallback for canvas/export contexts
function iconChar(icon) {
  if (!icon) return "□";
  if (typeof icon === "string") return icon;
  return "◉"; // generic fallback for SVG icons in canvas context
}

// ── PNG export ────────────────────────────────────────────────────
function exportAsNoNote(nodes, edges, mapMeta) {
  const bundle = {
    version: 1,
    app: "NoNote",
    title: mapMeta?.title || "Untitled",
    exported: new Date().toISOString(),
    nodes: nodes.map(n => ({...n, notes: Array.isArray(n.notes) ? n.notes : []})),
    edges,
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(mapMeta?.title||"map").replace(/[^a-z0-9]/gi,"-")}.nonote`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Consistent colour per userId (deterministic)
const USER_COLORS = ["#f97316","#06b6d4","#a855f7","#22c55e","#f59e0b","#ef4444","#3b82f6","#ec4899"];
function userColor(userId) {
  if (!userId) return USER_COLORS[0];
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return USER_COLORS[h % USER_COLORS.length];
}

function exportAsPDF(nodes, edges, mapTitle) {
  if(!nodes.length){ alert("No nodes to export."); return; }
  // Build same HTML as visual export, open print-optimised version
  const PAD=60;
  const minX=Math.min(...nodes.map(n=>n.x))-PAD;
  const minY=Math.min(...nodes.map(n=>n.y))-PAD;
  const maxX=Math.max(...nodes.map(n=>n.x+(n.w||220)))+PAD;
  const maxY=Math.max(...nodes.map(n=>n.y+(n.h||96)))+PAD;
  const W=maxX-minX, H=maxY-minY;

  const svgEdges = edges.map(e=>{
    const fn=nodes.find(n=>n.id===e.from), tn=nodes.find(n=>n.id===e.to);
    if(!fn||!tn) return "";
    const fcx=fn.x-minX+(fn.w||220)/2, fcy=fn.y-minY+(fn.h||96)/2;
    const tcx=tn.x-minX+(tn.w||220)/2, tcy=tn.y-minY+(tn.h||96)/2;
    const ctrl=Math.max(50,Math.sqrt((tcx-fcx)**2+(tcy-fcy)**2)*0.4);
    const dx=tcx-fcx,dy=tcy-fcy,d=Math.sqrt(dx*dx+dy*dy)||1;
    return `<path d="M ${fcx} ${fcy} C ${fcx+dx/d*ctrl} ${fcy+dy/d*ctrl}, ${tcx-dx/d*ctrl} ${tcy-dy/d*ctrl}, ${tcx} ${tcy}" stroke="#4d9be6" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>`;
  }).join("");

  const nodeHtml = nodes.map(n=>{
    const t=NT[n.type]||NT.note;
    const notes=(Array.isArray(n.notes)?n.notes:[]).filter(nt=>!nt.sensitive);
    return `<div class="nn-node" style="left:${n.x-minX}px;top:${n.y-minY}px;width:${n.w||220}px;min-height:${n.h||96}px;border-color:${t.color}65">
      <div class="nn-hdr" style="background:${t.color}15;border-bottom:1px solid ${t.color}28;padding:7px 10px 4px">
        <b style="font-size:13px">${iconChar(t.icon)} ${n.title||""}</b>
        ${n.description?`<div style="font-size:10px;color:#666;margin-top:2px">${n.description}</div>`:""}
        <div style="font-size:8px;text-align:right;color:${t.color};opacity:.7;margin-top:1px">${t.label}</div>
      </div>
      ${notes.length?`<div style="padding:6px 10px;font-size:10px">${notes.map(nt=>`<div><b style="color:${t.color}">${nt.title||"Note"}</b><div>${(nt.content||"").replace(/<[^>]+>/g," ")}</div></div>`).join("")}</div>`:""}
    </div>`;
  }).join("");

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${mapTitle||"NoNote"}</title>
<style>
  @page{size:${Math.ceil(W*0.75+40)}px ${Math.ceil(H*0.75+80)}px;margin:20px}
  body{margin:0;background:#fff;font-family:Arial,sans-serif}
  .canvas{position:relative;width:${W}px;height:${H}px;transform:scale(0.75);transform-origin:top left}
  .nn-node{position:absolute;background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;overflow:hidden;font-size:12px}
  svg{position:absolute;inset:0;pointer-events:none}
</style></head><body>
<h2 style="margin:0 0 10px;font-size:14px;color:#333">${mapTitle||"NoNote Map"} — ${new Date().toLocaleDateString()}</h2>
<div class="canvas">
  <svg width="${W}" height="${H}"><defs><marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#4d9be6"/></marker></defs>${svgEdges}</svg>
  ${nodeHtml}
</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`;

  const w=window.open("","_blank","width=800,height=600");
  if(w){ w.document.write(html); w.document.close(); }
  else alert("Allow popups to use PDF export.");
}

function exportAsHTML(nodes, edges, mapTitle) {
  if(!nodes.length){ alert("No nodes to export."); return; }
  const PAD=60;
  const minX=Math.min(...nodes.map(n=>n.x))-PAD;
  const minY=Math.min(...nodes.map(n=>n.y))-PAD;
  const maxX=Math.max(...nodes.map(n=>n.x+(n.w||220)))+PAD;
  const maxY=Math.max(...nodes.map(n=>n.y+(n.h||96)))+PAD;
  const W=maxX-minX, H=maxY-minY;

  const nodeHtml = nodes.map(n=>{
    const t=NT[n.type]||NT.note;
    const notes=(Array.isArray(n.notes)?n.notes:[]).filter(nt=>!nt.sensitive);
    return `<div class="nn-node" style="left:${n.x-minX}px;top:${n.y-minY}px;width:${n.w||220}px;min-height:${n.h||96}px;border-color:${t.color}65;">
      <div class="nn-header" style="background:${t.color}1a;border-bottom-color:${t.color}28">
        <span class="nn-icon">${iconChar(t.icon)}</span>
        <span class="nn-title">${n.title||""}</span>
        ${n.description?`<div class="nn-desc">${n.description}</div>`:""}
        <span class="nn-type" style="color:${t.color}80">${t.label}</span>
      </div>
      ${notes.length?`<div class="nn-notes">${notes.map(nt=>`<div class="nn-note"><div class="nn-note-title">${nt.title||"Note"}</div><div class="nn-note-content">${nt.content||""}</div></div>`).join("")}</div>`:""}
    </div>`;
  }).join("");

  // Build edge SVG paths
  const svgEdges = edges.map(e=>{
    const fn=nodes.find(n=>n.id===e.from), tn=nodes.find(n=>n.id===e.to);
    if(!fn||!tn) return "";
    const fcx=fn.x-minX+(fn.w||220)/2, fcy=fn.y-minY+(fn.h||96)/2;
    const tcx=tn.x-minX+(tn.w||220)/2, tcy=tn.y-minY+(tn.h||96)/2;
    const ctrl=Math.max(50,Math.sqrt((tcx-fcx)**2+(tcy-fcy)**2)*0.4);
    const dx=tcx-fcx, dy=tcy-fcy;
    const d=Math.sqrt(dx*dx+dy*dy)||1;
    const nx=dx/d, ny=dy/d;
    const c1x=fcx+nx*ctrl, c1y=fcy+ny*ctrl;
    const c2x=tcx-nx*ctrl, c2y=tcy-ny*ctrl;
    return `<path d="M ${fcx} ${fcy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tcx} ${tcy}" stroke="#4d9be6" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>`;
  }).join("");

  const html=`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${mapTitle||"NoNote Map"}</title>
<style>
  body{margin:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
  .canvas{position:relative;width:${W}px;height:${H}px;margin:20px auto;}
  .nn-node{position:absolute;background:#161b22;border:1px solid #30363d;border-radius:8px;overflow:hidden;}
  .nn-header{padding:8px 10px 5px;}
  .nn-icon{font-size:13px;margin-right:6px;}
  .nn-title{font-size:13px;font-weight:700;color:#e6edf3;}
  .nn-desc{font-size:10px;color:#7d8590;margin-top:2px;}
  .nn-type{font-size:8px;opacity:.7;display:block;text-align:right;margin-top:2px;}
  .nn-notes{padding:6px 10px;border-top:1px solid #21262d;}
  .nn-note{margin-bottom:6px;}
  .nn-note-title{font-size:10px;font-weight:600;color:#58a6ff;}
  .nn-note-content{font-size:10px;color:#7d8590;margin-top:2px;}
  svg.edges{position:absolute;inset:0;pointer-events:none;}
</style></head>
<body><div class="canvas">
  <svg class="edges" width="${W}" height="${H}">
    <defs><marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#4d9be6"/></marker></defs>
    ${svgEdges}
  </svg>
  ${nodeHtml}
</div></body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`${(mapTitle||"map").replace(/[^a-z0-9]/gi,"-")}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportAsDoc(nodes, mapTitle) {
  // Plain-text documentation export (Simple mode — no LLM)
  const lines=[`# ${mapTitle||"NoNote Map"}`,`*Exported: ${new Date().toLocaleDateString()}*`,""];
  nodes.forEach(n=>{
    const t=NT[n.type]||NT.note;
    lines.push(`## ${iconChar(t.icon)} ${n.title||"Untitled"} (${t.label})`);
    if(n.description) lines.push(`*${n.description}*`);
    const notes=(Array.isArray(n.notes)?n.notes:[]).filter(nt=>!nt.sensitive);
    if(notes.length){
      lines.push("### Notes");
      notes.forEach(nt=>{
        lines.push(`**${nt.title||"Note"}**`);
        lines.push((nt.content||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());
      });
    }
    lines.push("");
  });
  const blob=new Blob([lines.join("\n")],{type:"text/markdown"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`${(mapTitle||"map").replace(/[^a-z0-9]/gi,"-")}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function exportAsPNG(nodes, edges, mapTitle) {
  if(!nodes.length){alert("No nodes to export.");return;}
  const PAD=60;
  const minX=Math.min(...nodes.map(n=>n.x))-PAD, minY=Math.min(...nodes.map(n=>n.y))-PAD;
  const maxX=Math.max(...nodes.map(n=>n.x+(n.collapsed?COL_W:n.w)))+PAD;
  const maxY=Math.max(...nodes.map(n=>n.y+(n.collapsed?COL_H:n.h)))+PAD;
  const W=maxX-minX, H=maxY-minY, DPR=2;
  const canvas=document.createElement("canvas");
  canvas.width=W*DPR; canvas.height=H*DPR;
  const ctx=canvas.getContext("2d"); ctx.scale(DPR,DPR);
  const cs=getComputedStyle(document.documentElement);
  const bg=cs.getPropertyValue("--bg").trim()||"#0d1117";
  const bg2=cs.getPropertyValue("--bg2").trim()||"#161b22";
  const text=cs.getPropertyValue("--text").trim()||"#e6edf3";
  const text3=cs.getPropertyValue("--text3").trim()||"#7d8590";
  const acc=cs.getPropertyValue("--accent").trim()||"#58a6ff";
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  // dot grid
  ctx.fillStyle=cs.getPropertyValue("--canvas-dot").trim()||"#21262d";
  for(let gx=0;gx<W;gx+=28)for(let gy=0;gy<H;gy+=28){ctx.beginPath();ctx.arc(gx,gy,1,0,Math.PI*2);ctx.fill();}
  // edges — orthogonal bezier (same logic as canvas)
  ctx.strokeStyle=acc; ctx.lineWidth=2; ctx.globalAlpha=0.85;
  const pngFaceNormal=(pt,node,nw,nh)=>{
    const eps=1;
    if(Math.abs(pt.y-node.y)<eps)       return {dx:0,dy:-1};
    if(Math.abs(pt.y-(node.y+nh))<eps)  return {dx:0,dy:1};
    if(Math.abs(pt.x-node.x)<eps)       return {dx:-1,dy:0};
    return {dx:1,dy:0};
  };
  edges.forEach(e=>{
    const f=nodes.find(n=>n.id===e.from),t=nodes.find(n=>n.id===e.to); if(!f||!t)return;
    const fw=f.collapsed?COL_W:f.w, fh=f.collapsed?COL_H:f.h;
    const tw=t.collapsed?COL_W:t.w, th=t.collapsed?COL_H:t.h;
    const tcx=t.x+tw/2, tcy=t.y+th/2, fcx=f.x+fw/2, fcy=f.y+fh/2;
    const ffw=f.collapsed?COL_W:f.w, ffh=f.collapsed?COL_H:f.h;
    const ttw=t.collapsed?COL_W:t.w, tth=t.collapsed?COL_H:t.h;
    const fp=rectEdgePoint(f,ffw,ffh,tcx,tcy), tp=rectEdgePoint(t,ttw,tth,fcx,fcy);
    const n1=pngFaceNormal(fp,f,fw,fh), n2=pngFaceNormal(tp,t,tw,th);
    const dist=Math.sqrt((tp.x-fp.x)**2+(tp.y-fp.y)**2);
    const ctrl=Math.max(60,dist*0.4);
    const c1x=fp.x+n1.dx*ctrl, c1y=fp.y+n1.dy*ctrl;
    const c2x=tp.x+n2.dx*ctrl, c2y=tp.y+n2.dy*ctrl;
    ctx.beginPath();
    ctx.moveTo(fp.x-minX,fp.y-minY);
    ctx.bezierCurveTo(c1x-minX,c1y-minY,c2x-minX,c2y-minY,tp.x-minX,tp.y-minY);
    ctx.setLineDash(e.style==="dashed"?[7,5]:[]);ctx.stroke();
    // Arrowhead perpendicular to arrival face
    const angle=Math.atan2(tp.y-c2y,tp.x-c2x);
    ctx.save();ctx.translate(tp.x-minX,tp.y-minY);ctx.rotate(angle);
    ctx.beginPath();ctx.moveTo(-9,-5);ctx.lineTo(0,0);ctx.lineTo(-9,5);
    ctx.fillStyle=acc;ctx.globalAlpha=1;ctx.fill();ctx.restore();
  });
  ctx.globalAlpha=1;ctx.setLineDash([]);
  // nodes
  nodes.forEach(node=>{
    const t=NT[node.type]||NT.note; const nx=node.x-minX,ny=node.y-minY;
    const nw=node.collapsed?COL_W:node.w, nh=node.collapsed?COL_H:node.h;
    const r=parseInt(cs.getPropertyValue("--radius-node")||"10");
    ctx.shadowColor="rgba(0,0,0,.35)";ctx.shadowBlur=8;ctx.shadowOffsetY=2;
    ctx.fillStyle=bg2;ctx.beginPath();ctx.roundRect(nx,ny,nw,nh,r);ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle=`${t.color}70`;ctx.lineWidth=1.5;ctx.stroke();
    if(node.collapsed){
      ctx.font="24px serif";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(iconChar(t.icon),nx+nw/2,ny+nw/2-8);
      ctx.font=`bold 10px monospace`;ctx.fillStyle=t.color;
      ctx.fillText(node.title.slice(0,10),nx+nw/2,ny+nh-10);
    } else {
      const hH=34;ctx.fillStyle=`${t.color}22`;ctx.beginPath();
      ctx.roundRect(nx,ny,nw,hH,[r,r,0,0]);ctx.fill();
      ctx.font="14px serif";ctx.textBaseline="middle";ctx.fillText(iconChar(t.icon),nx+10,ny+hH/2);
      ctx.font="bold 12px monospace";ctx.fillStyle=t.color;
      ctx.fillText(node.title.length>22?node.title.slice(0,22)+"…":node.title,nx+30,ny+hH/2);
      ctx.font="11px monospace";ctx.fillStyle=text3;ctx.textBaseline="top";
      let py=ny+hH+7;
      Object.entries(node.properties||{}).slice(0,3).forEach(([k,v])=>{
        if(!v)return;ctx.fillStyle=text3;ctx.fillText(`${k}:`,nx+10,py);
        ctx.fillStyle=text;ctx.fillText(String(v).slice(0,20),nx+50,py);py+=16;
      });
    }
  });
  ctx.font="bold 11px monospace";ctx.fillStyle=text3;ctx.globalAlpha=0.45;
  ctx.textBaseline="bottom";ctx.textAlign="left";
  ctx.fillText(`⬡ NoNote — ${mapTitle||"Map"}`,12,H-8);
  const a=document.createElement("a");
  a.download=`${(mapTitle||"nonote").replace(/\s+/g,"_")}.png`;
  a.href=canvas.toDataURL("image/png",1);a.click();
}

// ── Style helpers ─────────────────────────────────────────────
const tbtn=(active,color="var(--accent2)")=>({
  padding:"5px 10px",border:"none",borderRadius:"var(--radius-btn)",cursor:"pointer",
  fontSize:11,fontWeight:"var(--font-weight-ui)",flexShrink:0,
  letterSpacing:"var(--letter-space)",
  background:active?color:"var(--bg3)",
  color:active?"#fff":"var(--text3)",
  transition:"var(--transition-all)",
});
// Icon-only square button — tooltip via `title` attribute
const iBtn=(active,ac="var(--accent2)")=>({
  background:active?`${ac}22`:"transparent",
  color:active?ac:"var(--text3)",
  border:active?`1px solid ${ac}55`:"1px solid transparent",
  borderRadius:"var(--radius-sm)",padding:"4px 6px",
  cursor:"pointer",fontSize:14,fontFamily:"var(--font-ui)",
  transition:"all .15s",display:"inline-flex",
  alignItems:"center",justifyContent:"center",
  minWidth:28,lineHeight:1,
});
const inp=()=>({
  width:"100%",background:"var(--bg)",
  borderRadius:"var(--radius-sm)",padding:"7px 9px",color:"var(--text)",
  fontSize:"inherit",fontFamily:"inherit",marginTop:3,
  boxSizing:"border-box",outline:"none",
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function NodeCanvas({ mapId, onBack, onHome }) {
  const { user, logout }      = useAuth();
  const { themeName, theme } = useTheme();
  const canEdit              = ["owner","admin","editor"].includes(user?.role);

  // ── State ──────────────────────────────────────────────────
  const [mapMeta,      setMapMeta]      = useState(null);
  const [nodes,        setNodes]        = useState([]);
  const [edges,        setEdges]        = useState([]);
  const [editMode,     setEditMode]     = useState(canEdit);   // viewers start in view mode
  const [selected,     setSelected]     = useState(new Set()); // set of node ids
  const [selEdge,      setSelEdge]      = useState(null);
  const [mode,         setMode]         = useState("select");
  const [edgeStyle,    setEdgeStyle]    = useState("arrow");
  const [edgeColor,    setEdgeColor]    = useState("var(--accent)");
  const [showConnPanel,setShowConnPanel]= useState(false);
  const [draggingMid,  setDraggingMid]  = useState(null); // {edgeId, startX, startY, origOffset}
  const [dragging,     setDragging]     = useState(null);
  const draggingRef   = useRef(null);   // mirror for stable handler
  const resizingRef   = useRef(null);   // mirror for stable handler
  const [resizing,     setResizing]     = useState(null);
  const [drawingEdge,  setDrawingEdge]  = useState(null);
  // Box-select
  const [boxSel,       setBoxSel]       = useState(null); // {startX,startY,endX,endY}
  const boxSelRef    = useRef(null); // live ref for window mousemove handler
  const didBoxSel    = useRef(false); // true if last mouseup committed a box-selection
  const [saveState,    setSaveState]    = useState("idle");
  const [saveMsg,      setSaveMsg]      = useState("");
  const [loading,      setLoading]      = useState(true);
  const [showSidebar,  setShowSidebar]  = useState(false);
  const [showProps,    setShowProps]    = useState(false);
  const [propsMode,    setPropsMode]    = useState(()=>localStorage.getItem('nn_props_mode')||'popup'); // 'popup'|'panel'
  const [showExport,   setShowExport]   = useState(false);
  const [showChat,     setShowChat]     = useState(false);
  const [showAppearance,setShowAppearance]=useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showExportMenu,  setShowExportMenu]  = useState(false);
  const [showAppMenu,     setShowAppMenu]     = useState(false);
  const [showConnDropdown,setShowConnDropdown]= useState(false);
  const [contextMenu,    setContextMenu]    = useState(null);  // {x,y,nodeId}
  const [snapToGrid,     setSnapToGrid]     = useState(false); // shift-drag snapping
  const [snapGuides,     setSnapGuides]     = useState([]);    // [{x1,y1,x2,y2}] alignment guides
  const [editingNotes,   setEditingNotes]   = useState(null);  // nodeId being edited
  const [inlineEditField,setInlineEditField]= useState(null); // {nodeId, field: 'title'|'desc'|noteId}
  const [expandedStacks,  setExpandedStacks]  = useState(new Set()); // set of parentNodeId whose stack is expanded
  const [expandedStackRows,setExpandedStackRows]=useState(new Set()); // set of noteNodeId whose row is expanded
  // Feature: Focus mode
  const [focusMode,      setFocusMode]      = useState(false);
  const [focusEnabled,   setFocusEnabled]   = useState(true);  // global toggle
  // Feature: Template library
  const [showTemplates,  setShowTemplates]  = useState(false);
  // Feature: Inline node popup editor
  const [nodePopup,      setNodePopup]      = useState(null); // {nodeId, tab}
  const [sidebarCollapsed,setSidebarCollapsed]= useState(false);
  const [layoutDir,     setLayoutDir]     = useState(()=>localStorage.getItem('nn_layout_dir')||'LR');
  // Edge routing: 'curved' (bezier, original) | 'ortho' (right-angle, obstacle-aware)
  const [edgeRouting,   setEdgeRouting]   = useState(()=>localStorage.getItem('nn_edge_routing')||'curved');
  const setEdgeRoutingPersist=(m)=>{setEdgeRouting(m);localStorage.setItem('nn_edge_routing',m);};
  const [showLayoutMenu,setShowLayoutMenu] = useState(false);
  const [showChangelog,    setShowChangelog]    = useState(false);
  const [showDocExport,    setShowDocExport]     = useState(false);
  const [docExportMode,    setDocExportMode]     = useState("normal");
  const [showTutorial,    setShowTutorial]    = useState(false);
  const [showHelp,         setShowHelp]         = useState(false);
  const [showCollabLog,    setShowCollabLog]    = useState(false);
  const [collabLog,        setCollabLog]        = useState([]);
  const [editingMapTitle,  setEditingMapTitle]  = useState(null); // null or string
  const [groupBoxes,       setGroupBoxes]       = useState([]); // [{id,x,y,w,h,label,color,lineStyle,bgColor}]
  const [drawingGroupBox,  setDrawingGroupBox]  = useState(null); // {startX,startY,endX,endY} while drawing
  const [editingGroupBox,  setEditingGroupBox]  = useState(null); // id of box being edited
  const [draggingGB,       setDraggingGB]       = useState(null); // {id,startMX,startMY,origX,origY}
  const [resizingGB,       setResizingGB]       = useState(null); // {id,startMX,startMY,origW,origH,origX,origY}
  const [showShare,     setShowShare]      = useState(false);
  // WS is always-on — auto-connects when map loads, no toggle needed
  // remoteSelections: who's selecting/editing what on the shared canvas
  // {userId: {userName, color, selectedIds: Set, editingId: string|null}}
  const [remoteSelections, setRemoteSelections] = useState({});
  const [wsConnected,   setWsConnected]    = useState(false);
  const wsRef = useRef(null);
  const [shareUsers,    setShareUsers]     = useState([]);
  const [shareEmail,    setShareEmail]     = useState("");
  const [sharePerm,     setSharePerm]      = useState("viewer");
  const [shareStatus,   setShareStatus]    = useState(null);
  const [shareSearch,   setShareSearch]    = useState([]); // user search results
  const [sidebarIconOnly, setSidebarIconOnly] = useState(false);
  const [sidebarDense,    setSidebarDense]    = useState(false); // multi-icon-per-row
  // Feature: Comment pins
  const [comments,       setComments]       = useState({});    // {nodeId: [{id,text,author,ts}]}
  const [showComments,   setShowComments]   = useState(false); // sidebar open
  const [commentNode,    setCommentNode]    = useState(null);  // nodeId of open thread
  const [commentDraft,   setCommentDraft]   = useState("");
  const [showSearch,   setShowSearch]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [searchField,  setSearchField]  = useState("all"); // all|title|notes|props
  const [searchHitIdx, setSearchHitIdx] = useState(0);

  // Quick capture
  const [quickPos,     setQuickPos]     = useState(null);
  const [quickText,    setQuickText]    = useState("");
  // Think / Build canvas mode — Think = frictionless capture, Build = full diagramming
  const [canvasMode,   setCanvasMode]   = useState(()=>localStorage.getItem("nn_canvas_mode")||"build");
  const setCanvasModePersist=(m)=>{setCanvasMode(m);localStorage.setItem("nn_canvas_mode",m);};
  // Topbar overflow ("More") menu
  const [showMore,     setShowMore]     = useState(false);
  // Ctrl+K command palette
  const [showCmdK,     setShowCmdK]     = useState(false);
  const [cmdQ,         setCmdQ]         = useState("");
  const cmdInpRef = useRef(null);
  // Copy-for-AI toast
  const [aiToast,      setAiToast]      = useState(null);
  // Workflow Audit — report panel + badge popup
  const [showWorkflowAudit, setShowWorkflowAudit] = useState(false);
  const [auditBadgePopup,   setAuditBadgePopup]   = useState(null); // {nodeId,x,y}
  // Recently used node types — surfaced at top of sidebar
  const [recentTypes,  setRecentTypes]  = useState(()=>{try{return JSON.parse(localStorage.getItem("nn_recent_types")||"[]");}catch{return [];}});
  const noteRecentType=(t)=>{setRecentTypes(prev=>{const n=[t,...prev.filter(x=>x!==t)].slice(0,8);localStorage.setItem("nn_recent_types",JSON.stringify(n));return n;});};
  // Inline title edit
  const [editingTitle, setEditingTitle] = useState(null);
  // Zoom
  const [zoom,         setZoom]         = useState(1.0);
  // Canvas theme
  const [canvasTheme,  setCanvasTheme]  = useState(
    () => localStorage.getItem(`nn_canvas_${mapId}`) || "global"
  );
  // Undo/redo
  const [canUndo,      setCanUndo]      = useState(false);
  const [canRedo,      setCanRedo]      = useState(false);
  const [globalCollapsed,setGlobalCollapsed]= useState(false); // collapse all / expand all

  const canvasRef   = useRef(null);
  const nodesRef      = useRef([]);        // live ref for box-select
  const nodeHeightsRef= useRef({});       // actual rendered height per node id
  const saveTimer   = useRef(null);
  const versionTimer= useRef(null);
  const notesTimers = useRef({});
  const quickInpRef = useRef(null);
  const historyRef  = useRef([]);
  const histIdxRef  = useRef(-1);

  // ── History ────────────────────────────────────────────────
  const pushHistory = useCallback((ns, es) => {
    historyRef.current = historyRef.current.slice(0, histIdxRef.current+1);
    historyRef.current.push({ nodes:JSON.parse(JSON.stringify(ns)), edges:JSON.parse(JSON.stringify(es)) });
    if (historyRef.current.length>80) historyRef.current.shift();
    histIdxRef.current = historyRef.current.length-1;
    setCanUndo(histIdxRef.current>0); setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (histIdxRef.current<=0) return;
    histIdxRef.current--;
    const s=historyRef.current[histIdxRef.current];
    setNodes(s.nodes); setEdges(s.edges);
    setCanUndo(histIdxRef.current>0); setCanRedo(true);
    scheduleSave(s.nodes,s.edges);
  }, []);

  const redo = useCallback(() => {
    if (histIdxRef.current>=historyRef.current.length-1) return;
    histIdxRef.current++;
    const s=historyRef.current[histIdxRef.current];
    setNodes(s.nodes); setEdges(s.edges);
    setCanUndo(true); setCanRedo(histIdxRef.current<historyRef.current.length-1);
    scheduleSave(s.nodes,s.edges);
  }, []);

  // ── Save ───────────────────────────────────────────────────
  // wsBroadcastTimer: debounced 150ms so rapid drag updates are batched
  const wsBroadcastTimer = useRef(null);
  const pendingBcast     = useRef({ nodes: null, edges: null });

  const scheduleSave = useCallback((ns, es) => {
    if (!canEdit) return;
    // Don't trigger a save if both nodes and edges are empty (brand-new map, nothing to persist yet)
    if ((!ns || ns.length === 0) && (!es || es.length === 0)) return;
    setSaveState("saving"); setSaveMsg("Saving…");

    // ── WS broadcast (150ms debounce — catches drag, resize, all mutations) ──
    pendingBcast.current = { nodes: ns, edges: es };
    clearTimeout(wsBroadcastTimer.current);
    wsBroadcastTimer.current = setTimeout(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === 1) {
        const { nodes: pn, edges: pe } = pendingBcast.current;
        if (pn) ws.send(JSON.stringify({ type: "nodes_update", nodes: pn }));
        if (pe) ws.send(JSON.stringify({ type: "edges_update", edges: pe }));
      }
    }, 150);

    // ── DB save (1s debounce) ────────────────────────────────────────────
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveMap(mapId, { nodes:ns.map(n=>({...n,notes:serializeNotes(n.notes)})), edges:es, groupBoxes });
        setSaveState("saved"); setSaveMsg("Saved ✓");
        setTimeout(()=>{setSaveState("idle");setSaveMsg("");},2500);
        clearTimeout(versionTimer.current);
        versionTimer.current = setTimeout(async()=>{
          try{ await saveVersion(mapId,{nodes:ns.map(n=>({...n,notes:serializeNotes(n.notes)})),edges:es,groupBoxes,label:"Auto-save"}); }catch{}
        }, 5*60*1000);
      } catch {
        setSaveState("error"); setSaveMsg("Save failed — retry in 10s");
        saveTimer.current = setTimeout(()=>scheduleSave(ns,es),10000);
      }
    }, 1000);
  }, [mapId,canEdit]);

  // applyNodes: save + history. Collab broadcast handled by useEffect.
  // applyNodes: for LOCAL changes only. Saves + history. WS broadcast via scheduleSave.
  // Remote changes must call setNodes() directly — never applyNodes().
  const applyNodes = useCallback((fn, skipHistory=false) => {
    setNodes(prev=>{
      const next=typeof fn==="function"?fn(prev):fn;
      setEdges(es=>{ scheduleSave(next,es); if(!skipHistory)pushHistory(next,es); return es; });
      return next;
    });
  }, [scheduleSave,pushHistory]);

  // Broadcast local selection to collaborators whenever it changes
  useEffect(() => {
    broadcastSelection(selected, editingTitle || inlineEditField?.nodeId || null);
  }, [selected, editingTitle, inlineEditField]); // eslint-disable-line

  useEffect(()=>{
    if(!mapId||!canEdit) return;
    // Debounced save when group boxes change
    const t=setTimeout(()=>{
      setNodes(ns=>{ setEdges(es=>{ scheduleSave(ns,es); return es; }); return ns; });
    },800);
    return ()=>clearTimeout(t);
  },[groupBoxes,mapId,canEdit]);

  // applyEdges: for LOCAL changes only. WS broadcast via scheduleSave.
  const applyEdges = useCallback((fn, skipHistory=false) => {
    setEdges(prev=>{
      const next=typeof fn==="function"?fn(prev):fn;
      setNodes(ns=>{ scheduleSave(ns,next); if(!skipHistory)pushHistory(ns,next); return ns; });
      return next;
    });
  }, [scheduleSave,pushHistory]);

  // Keep nodesRef in sync with nodes state
  const edgesRef = useRef([]);
  useEffect(()=>{ nodesRef.current = nodes; },[nodes]);
  useEffect(()=>{ edgesRef.current = edges; },[edges]);
  // ── Auto-populate Services from connected canvas nodes ───────
  const HOST_TYPES = new Set(['server','proxmox','unraid','esxi','hyperv','appserver','nas','truenas','rpi','desktop','workstation','docker','k8s','compose']);
  const SVC_TYPES  = new Set(['docker','dockercont','vm','lxc','compose','container','software','api','database','service','microservice','cache','broker','lambda','k8s','webserver','appserver','dbserver','fileserver','mailserver','server','nas','rpi']);
  const SVC_TYPE_LABEL = {docker:'Docker',dockercont:'Docker',vm:'VM',lxc:'LXC',compose:'Docker',container:'Docker',software:'App',api:'API',database:'Database',service:'Service',microservice:'Service',cache:'Service',broker:'Service',lambda:'App',k8s:'App',webserver:'Web App',appserver:'App',dbserver:'Database',fileserver:'Service',mailserver:'Service',server:'Service',nas:'Service',rpi:'Service'};
  useEffect(()=>{
    applyNodes(prev=>{
      const nodeById = id => prev.find(n=>n.id===id);
      const allIds = new Set(prev.map(n=>n.id));
      let changed = false;
      const next = prev.map(host=>{
        if(!HOST_TYPES.has(host.type)||!Array.isArray(host.properties?.Services)) return host;
        // connected service-type nodes via edges
        const connSvcIds = edges
          .filter(e=>e.from===host.id||e.to===host.id)
          .map(e=>e.from===host.id?e.to:e.from)
          .filter(id=>{ const n=nodeById(id); return n&&SVC_TYPES.has(n.type)&&n.id!==host.id; });
        // split existing services: manual (random ids) vs auto (node ids)
        const manual  = host.properties.Services.filter(s=>!allIds.has(s.id));
        const autoOld = host.properties.Services.filter(s=>allIds.has(s.id));
        // keep auto entries still connected; update their name/props from node
        const keep = autoOld
          .filter(s=>connSvcIds.includes(s.id))
          .map(s=>{ const n=nodeById(s.id); if(!n)return s;
            const updated={...s,name:n.title,
              ip:n.properties?.IP||s.ip,
              port:n.properties?.Port||n.properties?.port||s.port,
              image:n.properties?.Image||n.properties?.image||s.image,
              os:n.properties?.OS||s.os,
              memory:n.properties?.RAM||n.properties?.Memory||n.properties?.memory||s.memory,
              cpu:n.properties?.CPU||n.properties?.cpu||s.cpu,
            };
            return JSON.stringify(updated)===JSON.stringify(s)?s:updated;
          });
        const keepIds = new Set(keep.map(s=>s.id));
        // add newly connected service nodes
        const added = connSvcIds
          .filter(id=>!keepIds.has(id))
          .map(id=>{ const n=nodeById(id); return {
            id, name:n.title,
            type:SVC_TYPE_LABEL[n.type]||'Service',
            ip:n.properties?.IP||'',
            port:n.properties?.Port||n.properties?.port||'',
            status:'Running',
            image:n.properties?.Image||n.properties?.image||'',
            os:n.properties?.OS||'',
            memory:n.properties?.RAM||n.properties?.Memory||n.properties?.memory||'',
            cpu:n.properties?.CPU||n.properties?.cpu||'',
            notes:n.description||'',
          };});
        const newSvcs=[...manual,...keep,...added];
        if(JSON.stringify(newSvcs)===JSON.stringify(host.properties.Services)) return host;
        changed=true;
        return {...host,properties:{...host.properties,Services:newSvcs}};
      });
      return changed?next:prev;
    },true); // skipHistory — auto-populate doesn't pollute undo stack
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[edges]);

  useEffect(()=>{ draggingRef.current = dragging; }, [dragging]);
  useEffect(()=>{ resizingRef.current = resizing; }, [resizing]);

  // ── Actual collision dimensions (uses rendered height, not stored h) ──
  const collW = (n) => n?.collapsed ? COL_W : (n?.w || DEF_W);
  const collH = (n) => {
    if (!n) return DEF_H;
    if (n.collapsed) return COL_H;
    // Use measured DOM height if available, else fall back to stored h
    // Add 2px for border
    return Math.max(n.h || DEF_H, (nodeHeightsRef.current[n.id] || 0));
  };

  // ── Load ───────────────────────────────────────────────────
  useEffect(()=>{
    setLoading(true);
    getMap(mapId).then(data=>{
      setMapMeta(data.map);

      const toContent=nt=>(nt.content||"").replace(/<[^>]+>/g,"").trim();
      const toTitle=nt=>(nt.title||"").trim()||"Note";

      // Parse raw notes from server BEFORE mapping, for migration
      const rawNotesByNodeId={};
      data.nodes.forEach(n=>{
        if(!n.node_notes||!n.node_notes.trim()){
          // Only migrate if node_notes is empty — raw notes[] still has data
          try{
            const raw=n.notes;
            let arr=[];
            if(typeof raw==='string'&&raw.trim().startsWith('[')) arr=JSON.parse(raw);
            else if(Array.isArray(raw)) arr=raw;
            // Unwrap double-serialization
            if(arr.length===1&&typeof arr[0]?.content==='string'&&arr[0].content.trim().startsWith('[')){
              try{ arr=JSON.parse(arr[0].content); }catch{}
            }
            if(Array.isArray(arr)&&arr.length>0) rawNotesByNodeId[n.id]=arr;
          }catch{}
        }
      });

      const ns=data.nodes.map(n=>({
        id:n.id,type:n.node_type,x:n.x,y:n.y,w:n.w,h:n.h,
        title:n.title,description:n.description||"",showNotes:false,notes:parseNotes(n.notes),
        node_notes:n.node_notes||"",notes_private:n.notes_private||false,
        collapsed:false,
        properties:{...(DP[n.node_type||n.type]||{}),...(n.properties||{})},customProps:n.custom_props||{},
      }));
      const es=data.edges.map(e=>({
        id:e.id,from:e.from_node,to:e.to_node,
        label:e.label,style:e.style,color:e.color,
        fromAnchor:e.from_anchor||null,
        toAnchor:e.to_anchor||null,
        midOff:e.mid_off||null,
      }));
      if(Array.isArray(data.groupBoxes)) setGroupBoxes(data.groupBoxes);

      // ── Notes migration: old notes[] → individual note nodes (one per entry) ──
      const extraNodes=[], extraEdges=[];
      const patchedNs=ns.map(n=>{
        const parsed=rawNotesByNodeId[n.id];
        if(!parsed||parsed.length===0) return n;

        if(n.type==="note"){
          const [first,...rest]=parsed;
          rest.forEach((nt,i)=>{
            const c=toContent(nt); if(!c.trim()) return;
            const newId=makeId();
            extraNodes.push({id:newId,type:"note",x:n.x+260*(i+1),y:n.y,w:240,h:160,
              title:toTitle(nt),description:"",notes:[],node_notes:c,
              notes_private:nt.sensitive||false,collapsed:false,properties:{},customProps:{}});
            const parents=[...new Set(es.filter(e=>e.to===n.id||e.from===n.id).map(e=>e.from===n.id?e.to:e.from))];
            parents.forEach(pid=>extraEdges.push({id:makeId(),from:pid,to:newId,label:"",
              style:"dashed",color:"var(--text4)",fromAnchor:{side:"auto"},toAnchor:{side:"auto"},midOff:null}));
          });
          return {...n,title:toTitle(first)||n.title,node_notes:toContent(first),notes:[],notes_private:first.sensitive||false};
        } else {
          parsed.forEach((nt,i)=>{
            const c=toContent(nt); if(!c.trim()) return;
            const newId=makeId();
            extraNodes.push({id:newId,type:"note",x:n.x+n.w+40,y:n.y+i*180,w:240,h:160,
              title:toTitle(nt),description:"",notes:[],node_notes:c,
              notes_private:nt.sensitive||false,collapsed:false,properties:{},customProps:{}});
            extraEdges.push({id:makeId(),from:n.id,to:newId,label:"",
              style:"dashed",color:"var(--text4)",fromAnchor:{side:"auto"},toAnchor:{side:"auto"},midOff:null});
          });
          return {...n,node_notes:"",notes:[]};
        }
      });

      const finalNs=[...patchedNs,...extraNodes];
      const finalEs=[...es,...extraEdges];

      // Always save migration if notes were converted (role check deferred to saveMap auth)
      if(extraNodes.length>0){
        setTimeout(()=>saveMap(mapId,{
          nodes:finalNs.map(n=>({...n,notes:serializeNotes(n.notes)})),
          edges:finalEs,groupBoxes:data.groupBoxes||[]
        }),800);
      }

      setNodes(finalNs); setEdges(finalEs); pushHistory(finalNs,finalEs);

      // "Where was I" — pulse the most recently edited node for 3s
      if(finalNs.length>0){
        const lastEdited = [...finalNs].sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0))[0];
        if(lastEdited?.id){
          setTimeout(()=>{
            const el=document.querySelector(`[data-ui="node-${lastEdited.id}"]`);
            if(el){el.classList.add("nn-last-edited");setTimeout(()=>el.classList.remove("nn-last-edited"),4000);}
          },600);
        }
      }
    }).catch(err=>{ console.error('[NodeCanvas] load error:', err); }).finally(()=>setLoading(false));
  },[mapId]);

  // ── Keyboard shortcuts ────────────────────────────────────
  // ── Copy for AI — one click, straight to clipboard ─────────
  const copyForAI=useCallback(async()=>{
    const ok=await copyText(buildLLMText(mapMeta?.title||"Map",nodesRef.current,edgesRef.current||edges,NT));
    setAiToast(ok?"✓ AI context copied — paste into any chatbot":"Copy failed");
    setTimeout(()=>setAiToast(null),2200);
  },[mapMeta,edges]);

  // ── Frictionless idea creation ─────────────────────────────
  // Creates an "idea" node at world coords, selects it, opens title edit.
  const createIdeaAt=useCallback((wx,wy,linkFromId=null)=>{
    if(!canEdit||!editMode) return null;
    const cur=nodesRef.current;
    let ox=0,oy=0;
    for(let i=0;i<20;i++){
      const clash=cur.some(n=>Math.abs(n.x-(wx+ox))<(n.w||DEF_W)+16&&Math.abs(n.y-(wy+oy))<(n.h||DEF_H)+16);
      if(!clash) break;
      oy+=(DEF_H+24); if(oy>500){oy=0;ox+=(DEF_W+30);}
    }
    const node=mkNode("idea",Math.max(0,wx+ox),Math.max(0,wy+oy));
    node.title="";
    applyNodes(ns=>[...ns,node]);
    if(linkFromId){
      applyEdges(es=>[...es,{id:makeId(),from:linkFromId,to:node.id,label:"",style:"arrow",color:"var(--accent)"}]);
    }
    setSelected(new Set([node.id])); setSelEdge(null);
    setTimeout(()=>{
      setEditingTitle(node.id);
      const el=document.querySelector(`[data-ui="node-${node.id}"]`);
      if(el){el.classList.add("nn-node-new");setTimeout(()=>el.classList.remove("nn-node-new"),260);}
    },16);
    return node;
  },[canEdit,editMode,applyNodes,applyEdges]);

  // Enter = sibling (shares parent if one exists) · Tab = child (linked)
  const createSibling=useCallback(()=>{
    const sel=[...selected]; if(sel.length!==1) return;
    const src=nodesRef.current.find(n=>n.id===sel[0]); if(!src) return;
    const parentEdge=(edgesRef.current||edges).find(e=>e.to===src.id);
    createIdeaAt(src.x,src.y+collH(src)+30,parentEdge?parentEdge.from:null);
  },[selected,edges,createIdeaAt]);
  const createChild=useCallback(()=>{
    const sel=[...selected]; if(sel.length!==1) return;
    const src=nodesRef.current.find(n=>n.id===sel[0]); if(!src) return;
    createIdeaAt(src.x+(src.w||DEF_W)+70,src.y,src.id);
  },[selected,createIdeaAt]);

  // ── Jump to a node (used by Ctrl+K palette) ────────────────
  const jumpToNode=useCallback((id)=>{
    const n=nodesRef.current.find(x=>x.id===id); if(!n) return;
    setSelected(new Set([id])); setSelEdge(null);
    const el=canvasRef.current;
    if(el){
      el.scrollTo({left:Math.max(0,n.x*zoom-el.clientWidth/2+(n.w||DEF_W)*zoom/2),
        top:Math.max(0,n.y*zoom-el.clientHeight/2+(n.h||DEF_H)*zoom/2),behavior:"smooth"});
    }
  },[zoom]);


  useEffect(()=>{
    const h=(e)=>{
      const tag=e.target.tagName;
      const isInput=["INPUT","TEXTAREA","SELECT"].includes(tag);
      if(e.code==="Escape"){
        if(nodePopup){setNodePopup(null);return;}
        if(showSearch){setShowSearch(false);setSearchQuery("");return;}
        if(editingTitle){setEditingTitle(null);return;}
        if(quickPos){setQuickPos(null);setQuickText("");return;}
        if(drawingEdge){setDrawingEdge(null);return;}
        if(boxSel){setBoxSel(null);return;}
        setMode("select"); setSelected(new Set()); setSelEdge(null); return;
      }
      if(isInput) return;
      if(e.code==="Space"){
        e.preventDefault();
        if(!canEdit||!canvasRef.current) return;
        if(quickPos){setQuickPos(null);setQuickText("");return;}
        const el=canvasRef.current;
        setQuickText(""); setQuickPos({x:el.scrollLeft+el.clientWidth/2-130,y:el.scrollTop+el.clientHeight/2-55});
        return;
      }
      if(e.code==="Delete"||e.code==="Backspace"){e.preventDefault();deleteSelected();return;}
      const mod=e.ctrlKey||e.metaKey;
      if(mod&&e.code==="KeyZ"&&!e.shiftKey){e.preventDefault();undo();return;}
      if((mod&&e.code==="KeyY")||(mod&&e.shiftKey&&e.code==="KeyZ")){e.preventDefault();redo();return;}
      if(mod&&e.code==="Enter"){e.preventDefault();handleAutoLayout(layoutDir);return;}
      if(mod&&e.code==="Equal"){e.preventDefault();setZoom(z=>Math.min(3,+(z+0.1).toFixed(1)));return;}
      if(mod&&e.code==="Minus"){e.preventDefault();setZoom(z=>Math.max(0.2,+(z-0.1).toFixed(1)));return;}
      if(mod&&e.code==="Digit0"){e.preventDefault();setZoom(1);return;}
      // Arrow keys: move selected nodes (with collision prevention)
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)&&selected.size>0){
        e.preventDefault();
        const step=e.shiftKey?20:4;
        const adx=e.code==="ArrowLeft"?-step:e.code==="ArrowRight"?step:0;
        const ady=e.code==="ArrowUp"?-step:e.code==="ArrowDown"?step:0;
        applyNodes(ns=>{
          const GAP=14;
          const others=ns.filter(n=>!selected.has(n.id));
          return ns.map(n=>{
            if(!selected.has(n.id)) return n;
            let nx=n.x+adx, ny=n.y+ady;
            const dw=collW(n);
            const dh=collH(n);
            for(const o of others){
              const ow=collW(o);
              const oh=collH(o);
              if(nx<o.x+ow+GAP && nx+dw>o.x-GAP && ny<o.y+oh+GAP && ny+dh>o.y-GAP){
                if(adx>0) nx=o.x-GAP-dw;
                if(adx<0) nx=o.x+ow+GAP;
                if(ady>0) ny=o.y-GAP-dh;
                if(ady<0) ny=o.y+oh+GAP;
              }
            }
            return {...n,x:Math.max(0,nx),y:Math.max(0,ny)};
          });
        });
        return;
      }
      // Ctrl+K — command palette
      if(mod&&e.code==="KeyK"){e.preventDefault();setShowCmdK(v=>!v);setCmdQ("");return;}
      // Enter = sibling idea · Tab = child idea (1 node selected, not typing)
      if(e.code==="Enter"&&!mod&&!e.shiftKey&&canEdit&&editMode&&selected.size===1&&!editingTitle){
        e.preventDefault();createSibling();return;}
      if(e.code==="Tab"&&canEdit&&editMode&&selected.size===1&&!editingTitle){
        e.preventDefault();createChild();return;}
      // N with a node selected = inline note on that node; N alone = add note node
      if(e.code==="KeyN"&&canEdit&&!isInput&&editMode&&selected.size===1){
        e.preventDefault();
        const nid=[...selected][0];
        const nd=nodesRef.current.find(n=>n.id===nid);
        if(nd){
          const newNote={id:Math.random().toString(36).slice(2),title:"",content:"",sensitive:false,editing:true};
          const arr=[...(Array.isArray(nd.notes)?nd.notes:[]),newNote];
          updateNotes(nid,arr);
          updateNode(nid,{showNotes:true,expandedNoteIds:[...(nd.expandedNoteIds||[]),newNote.id]});
          setTimeout(()=>setInlineEditField({noteId:newNote.id,field:"noteTitle"}),60);
        }
        return;
      }
      if(e.code==="KeyN"&&canEdit&&!isInput){addNode("note");return;}
      if(e.code==="F2"&&selected.size===1){
        e.preventDefault();
        setEditingTitle([...selected][0]);
        return;
      }
      if(e.code==="KeyD"&&mod&&canEdit&&selected.size>0){
        e.preventDefault();
        const offset=24;
        applyNodes(ns=>{
          const newNodes=[...ns];
          [...selected].forEach(id=>{
            const src=ns.find(n=>n.id===id); if(!src) return;
            newNodes.push({...src,id:makeId(),x:src.x+offset,y:src.y+offset,
              properties:{...(src.properties||{})},customProps:{...(src.customProps||{})}});
          });
          return newNodes;
        });
        return;
      }
      if(e.code==="KeyC"&&canEdit){setMode(m=>m==="connect"?"select":"connect");setDrawingEdge(null);return;}
      if(e.code==="KeyG"&&!isInput&&canEdit){setMode(m=>m==="groupbox"?"select":"groupbox");return;}
      if(e.code==="KeyS"&&canEdit){setMode("select");setDrawingEdge(null);return;}
      if(e.code==="KeyE"&&canEdit){
        if(selected.size===1&&propsMode==='popup'&&!nodePopup){
          setNodePopup({nodeId:[...selected][0],tab:'notes'});
        } else { setEditMode(v=>!v); }
        return;
      }

      if(e.code==="KeyV"&&canEdit){setShowVersions(true);return;}
      if(e.code==="KeyF"&&mod){e.preventDefault();setShowSearch(v=>!v);setSearchQuery("");return;}
      if(e.code==="KeyA"&&mod){e.preventDefault();setSelected(new Set(nodes.map(n=>n.id)));return;}
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[quickPos,drawingEdge,canEdit,undo,redo,selected,nodes,boxSel,editingTitle,showSearch,applyNodes,nodePopup,editMode,createSibling,createChild]);

  useEffect(()=>{if(quickPos)quickInpRef.current?.focus();},[quickPos]);

  // Persist propsMode + auto-show/hide panel on mode switch
  useEffect(()=>{
    localStorage.setItem('nn_props_mode', propsMode);
    if(propsMode==='panel'&&selected.size===1) setShowProps(true);
    if(propsMode==='popup') setShowProps(false);
  },[propsMode]);

  // Focus mode: activate when editing title/notes OR when a single node is selected
  useEffect(()=>{
    if(!focusEnabled){ setFocusMode(false); return; }
    if(editingTitle||editingNotes||selected.size===1) setFocusMode(true);
    else setFocusMode(false);
  },[editingTitle,editingNotes,focusEnabled,selected]);

  // ── Pinch/scroll zoom ─────────────────────────────────────
  useEffect(()=>{
    const el=canvasRef.current; if(!el) return;
    const fn=(e)=>{
      if(!e.ctrlKey&&!e.metaKey) return;
      e.preventDefault();
      setZoom(z=>Math.min(3,Math.max(0.2,+(z-e.deltaY*0.001).toFixed(2))));
    };
    el.addEventListener("wheel",fn,{passive:false});
    return ()=>el.removeEventListener("wheel",fn);
  },[]);

  // ── Drag: single or multi-select ─────────────────────────
  const startDrag=useCallback((cx,cy,id)=>{
    if(!canEdit||!canvasRef.current) return;
    if(mode==="connect") return;
    const el=canvasRef.current;
    const rect=el.getBoundingClientRect(); const s=1/zoom;
    const canvasX=(cx-rect.left)*s+el.scrollLeft*s;
    const canvasY=(cy-rect.top)*s+el.scrollTop*s;
    // If clicking a node not in selection, select only that node
    const sel=selected.has(id)?new Set(selected):new Set([id]);
    if(!selected.has(id)) setSelected(sel);
    // Record starting positions for all selected nodes
    const startPositions={};
    nodes.forEach(n=>{ if(sel.has(n.id)) startPositions[n.id]={x:n.x,y:n.y}; });
    setDragging({ids:[...sel],startX:canvasX,startY:canvasY,startPositions});
  },[mode,nodes,selected,canEdit,zoom]);

  const startResize=useCallback((e,id)=>{
    e.stopPropagation();e.preventDefault();
    const node=nodes.find(n=>n.id===id);
    setResizing({id,startX:e.clientX,startY:e.clientY,origW:node.w,origH:node.h});
  },[nodes]);

  useEffect(()=>{
    const onMove=(e)=>{
      const isT=!!e.touches;
      const cx=isT?e.touches[0].clientX:e.clientX;
      const cy=isT?e.touches[0].clientY:e.clientY;
      if(draggingRef.current&&canvasRef.current){
        const dragging=draggingRef.current;
        // Clear guides when not dragging single node
        if(dragging.ids.length!==1) setSnapGuides([]);
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const canvasX=(cx-rect.left)*s+el.scrollLeft*s;
        const canvasY=(cy-rect.top)*s+el.scrollTop*s;
        let dx=canvasX-dragging.startX, dy=canvasY-dragging.startY;
        // Shift = snap to 20px grid
        const GRID=20;
        if(e.shiftKey && dragging.ids.length===1){
          const start0=dragging.startPositions[dragging.ids[0]];
          if(start0){
            const snappedX=Math.round((start0.x+dx)/GRID)*GRID;
            const snappedY=Math.round((start0.y+dy)/GRID)*GRID;
            dx=snappedX-start0.x; dy=snappedY-start0.y;
          }
        }
        const GAP=14; // 14px minimum gap between any two node edges
        const fixedNodes=nodesRef.current.filter(n=>!dragging.ids.includes(n.id));

        // Axis-separated collision: X then Y, each fully resolved.
        // Key: full AABB overlap check on each axis, resolve by minimum penetration.
        const resolvedPositions={};

        for(const id of dragging.ids){
          const start=dragging.startPositions[id]; if(!start) continue;
          const base=nodesRef.current.find(n=>n.id===id); if(!base) continue;
          const nw=collW(base);
          const nh=collH(base);

          // Step 1: apply X delta, keep Y unchanged (old position)
          let tx=Math.max(0,start.x+dx);
          const oy=start.y; // old Y — unchanged during X pass

          for(const o of fixedNodes){
            const ow=collW(o);
            const oh=collH(o);
            // Full Y overlap check with old Y
            if(oy+nh<=o.y||oy>=o.y+oh) continue; // no Y overlap — skip
            // Full X overlap check
            if(tx+nw<=o.x||tx>=o.x+ow) continue; // no X overlap — skip
            // Resolve X: push toward smallest penetration side
            const pLeft  = tx+nw - o.x;   // penetration through o's left face
            const pRight = o.x+ow - tx;   // penetration through o's right face
            if(pLeft<=pRight){ tx=o.x-nw-GAP; } else { tx=o.x+ow+GAP; }
          }

          // Step 2: apply Y delta, use resolved X from step 1
          let ty=Math.max(0,start.y+dy);

          for(const o of fixedNodes){
            const ow=collW(o);
            const oh=collH(o);
            // Full X overlap check with resolved tx
            if(tx+nw<=o.x||tx>=o.x+ow) continue; // no X overlap — skip
            // Full Y overlap check
            if(ty+nh<=o.y||ty>=o.y+oh) continue; // no Y overlap — skip
            // Resolve Y: push toward smallest penetration side
            const pTop    = ty+nh - o.y;   // penetration through o's top face
            const pBottom = o.y+oh - ty;   // penetration through o's bottom face
            if(pTop<=pBottom){ ty=o.y-nh-GAP; } else { ty=o.y+oh+GAP; }
          }

          resolvedPositions[id]={x:Math.max(0,tx),y:Math.max(0,ty)};
        }

        setNodes(ns=>ns.map(n=>{
          const rp=resolvedPositions[n.id];
          return rp?{...n,...rp}:n;
        }));
        // Alignment guides — single node drag only
        if(dragging.ids.length===1){
          const movId=dragging.ids[0];
          const base=resolvedPositions[movId];
          if(base){
            const mov=nodesRef.current.find(n=>n.id===movId);
            if(mov){
              const mW=collW(mov),mH=collH(mov);
              const mL=base.x,mR=base.x+mW,mCX=base.x+mW/2;
              const mT=base.y,mB=base.y+mH,mCY=base.y+mH/2;
              const guides=[];const TOL=6;
              nodesRef.current.filter(n=>n.id!==movId).forEach(n=>{
                const nW=collW(n),nH=collH(n);
                const nL=n.x,nR=n.x+nW,nCX=n.x+nW/2;
                const nT=n.y,nB=n.y+nH,nCY=n.y+nH/2;
                if(Math.abs(mCX-nCX)<TOL) guides.push({x:nCX,type:"cx"});
                if(Math.abs(mCY-nCY)<TOL) guides.push({y:nCY,type:"cy"});
                if(Math.abs(mL-nL)<TOL)   guides.push({x:nL,type:"edge"});
                if(Math.abs(mR-nR)<TOL)   guides.push({x:nR,type:"edge"});
                if(Math.abs(mT-nT)<TOL)   guides.push({y:nT,type:"edge"});
                if(Math.abs(mB-nB)<TOL)   guides.push({y:nB,type:"edge"});
              });
              setSnapGuides(guides);
            }
          }
        } else { setSnapGuides([]); }
      }
      if(resizingRef.current&&canvasRef.current){
        const resizing=resizingRef.current;
        const s=1/zoom;
        const newW=Math.max(160,resizing.origW+(cx-resizing.startX)*s);
        const newH=Math.max(60,resizing.origH+(cy-resizing.startY)*s);
        setNodes(ns=>ns.map(n=>n.id===resizing.id?{...n,w:newW,h:newH}:n));
        // Snap guides during resize: right edge and bottom edge alignment
        const resNode=nodesRef.current.find(n=>n.id===resizing.id);
        if(resNode){
          const guides=[];const TOL=8;
          const rR=resNode.x+newW, rB=resNode.y+newH;
          nodesRef.current.filter(n=>n.id!==resizing.id).forEach(n=>{
            const nR=n.x+collW(n), nB=n.y+collH(n);
            if(Math.abs(rR-n.x)<TOL)   guides.push({x:n.x,type:"edge"});
            if(Math.abs(rR-nR)<TOL)    guides.push({x:nR,type:"edge"});
            if(Math.abs(rB-n.y)<TOL)   guides.push({y:n.y,type:"edge"});
            if(Math.abs(rB-nB)<TOL)    guides.push({y:nB,type:"edge"});
          });
          setSnapGuides(guides);
        }
      }
      if(draggingGB&&canvasRef.current){
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const mx=(cx-rect.left)*s+el.scrollLeft*s;
        const my=(cy-rect.top)*s+el.scrollTop*s;
        const dx=mx-draggingGB.startMX, dy=my-draggingGB.startMY;
        setGroupBoxes(bs=>bs.map(b=>b.id===draggingGB.id
          ?{...b,x:draggingGB.origX+dx,y:draggingGB.origY+dy}:b));
        return;
      }
      if(resizingGB&&canvasRef.current){
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const mx=(cx-rect.left)*s+el.scrollLeft*s;
        const my=(cy-rect.top)*s+el.scrollTop*s;
        const dx=mx-resizingGB.startMX, dy=my-resizingGB.startMY;
        setGroupBoxes(bs=>bs.map(b=>b.id===resizingGB.id
          ?{...b,w:Math.max(80,resizingGB.origW+dx),h:Math.max(60,resizingGB.origH+dy)}:b));
        return;
      }

      if(groupBoxDrawRef.current&&canvasRef.current){
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const mx=(cx-rect.left)*s+el.scrollLeft*s;
        const my=(cy-rect.top)*s+el.scrollTop*s;
        const updated={...groupBoxDrawRef.current,endX:mx,endY:my};
        groupBoxDrawRef.current=updated;
        setDrawingGroupBox(updated);
      }
      if(boxSelRef.current&&canvasRef.current){
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const mx=(cx-rect.left)*s+el.scrollLeft*s;
        const my=(cy-rect.top)*s+el.scrollTop*s;
        const updated={...boxSelRef.current,endX:mx,endY:my};
        boxSelRef.current=updated;
        setBoxSel(updated);
      }
      if(drawingEdge&&canvasRef.current){
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        setDrawingEdge(d=>({...d,mouseX:(cx-rect.left)*s+el.scrollLeft*s,mouseY:(cy-rect.top)*s+el.scrollTop*s}));
      }
    };
    const onUp=()=>{
      // 1. Push history when drag/resize ends
      if(draggingRef.current||resizingRef.current){
        setNodes(ns=>{setEdges(es=>{scheduleSave(ns,es);pushHistory(ns,es);return es;});return ns;});
      }
      setDragging(null); setResizing(null); setSnapGuides([]);

      // 2. Commit box-select
      if(boxSelRef.current){
        const {startX,startY,endX,endY}=boxSelRef.current;
        const x1=Math.min(startX,endX), y1=Math.min(startY,endY);
        const x2=Math.max(startX,endX), y2=Math.max(startY,endY);
        if(Math.abs(x2-x1)>5 || Math.abs(y2-y1)>5){
          const sel=new Set();
          nodesRef.current.forEach(n=>{
            const nw=n.w||DEF_W, nh=nodeHeightsRef.current[n.id]||n.h||DEF_H;
            if(n.x<x2 && n.x+nw>x1 && n.y<y2 && n.y+nh>y1) sel.add(n.id);
          });
          if(sel.size>0){ setSelected(sel); didBoxSel.current=true; }
        }
        boxSelRef.current=null; setBoxSel(null);
      }

      // 3. Commit group-box draw
      if(groupBoxDrawRef.current){
        const {startX,startY,endX,endY}=groupBoxDrawRef.current;
        const w=Math.abs(endX-startX), h=Math.abs(endY-startY);
        if(w>30&&h>30){
          setGroupBoxes(prev=>[...prev,{
            id:Math.random().toString(36).slice(2),
            x:Math.min(startX,endX), y:Math.min(startY,endY), w, h,
            label:"Group",color:"var(--accent)",lineStyle:"solid",bgColor:"transparent"
          }]);
        }
        groupBoxDrawRef.current=null; setDrawingGroupBox(null);
      }

      // 4. End group-box drag/resize
      if(draggingGB) setDraggingGB(null);
      if(resizingGB) setResizingGB(null);
    };
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("touchmove",onMove,{passive:true});
    window.addEventListener("touchend",onUp);
    return ()=>{
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
      window.removeEventListener("touchmove",onMove);
      window.removeEventListener("touchend",onUp);
    };
  },[zoom,scheduleSave,pushHistory]); // dragging/resizing accessed via refs — stable handler

  // ── Node click ────────────────────────────────────────────
  const handleNodeRightClick=useCallback((e,id)=>{
    e.preventDefault(); e.stopPropagation();
    if(!canEdit||!editMode) return;
    const el=canvasRef.current; if(!el) return;
    const rect=el.getBoundingClientRect();
    setContextMenu({x:e.clientX-rect.left,y:e.clientY-rect.top,nodeId:id});
    if(!selected.has(id)) setSelected(new Set([id]));
  },[canEdit,editMode,selected]);

  const handleNodeClick=useCallback((e,id)=>{
    e.stopPropagation();
    if(mode==="connect"){
      if(drawingEdge){
        if(drawingEdge.fromId!==id){
          const toNode=nodes.find(n=>n.id===id);
          const tnw=collW(toNode), tnh=collH(toNode);
          const el=canvasRef.current;
          const rect=el.getBoundingClientRect(); const s=1/zoom;
          const clickX=(e.clientX-rect.left)*s+el.scrollLeft*s;
          const clickY=(e.clientY-rect.top)*s+el.scrollTop*s;
          const toAnchor=snapToAnchor(toNode,tnw,tnh,clickX,clickY) || {side:"auto"};
          const fromNode=nodes.find(n=>n.id===drawingEdge.fromId);
          const isNoteEdge = fromNode?.type==="note" || toNode?.type==="note";
          applyEdges(es=>[...es,{
            id:makeId(), from:drawingEdge.fromId, to:id, label:"",
            style: isNoteEdge ? "dashed" : edgeStyle,
            color: isNoteEdge ? "var(--text4)" : edgeColor,
            fromAnchor:drawingEdge.fromAnchor||{side:"auto"},
            toAnchor,
          }]);
        }
        setDrawingEdge(null);
      } else {
        const node=nodes.find(n=>n.id===id);
        const nw=collW(node), nh=collH(node);
        // Compute click position in canvas space
        const el=canvasRef.current;
        const rect=el.getBoundingClientRect(); const s=1/zoom;
        const clickX=(e.clientX-rect.left)*s+el.scrollLeft*s;
        const clickY=(e.clientY-rect.top)*s+el.scrollTop*s;
        // Snap to border anchor if near an edge, else auto
        const anchor=snapToAnchor(node,nw,nh,clickX,clickY) || {side:"auto"};
        const startPt = anchor.side!=="auto"
          ? anchorToPoint(node,nw,nh,anchor)
          : {x:node.x+nw/2, y:node.y+nh/2};
        setDrawingEdge({fromId:id,mouseX:startPt.x,mouseY:startPt.y,fromAnchor:anchor});
      }
      return;
    }
    if(e.shiftKey||e.ctrlKey||e.metaKey){
      // Multi-select toggle
      setSelected(prev=>{
        const s=new Set(prev);
        s.has(id)?s.delete(id):s.add(id);
        return s;
      });
      return;
    }
    setSelected(new Set([id])); setSelEdge(null);
    if(propsMode==='panel') setShowProps(true);
    else if(window.innerWidth<768) setShowProps(true);
  },[mode,drawingEdge,edgeStyle,nodes,applyEdges]);

  const handleEdgeClick=useCallback((e,eid)=>{
    e.stopPropagation();
    if(mode==="select"){setSelEdge(eid);setSelected(new Set());}
  },[mode]);

  // ── Canvas mousedown — start box select ───────────────────
  // ── Group box drawing ─────────────────────────────────────
  const groupBoxDrawRef = useRef(null);

  const handleCanvasMouseDown=useCallback((e)=>{
    if(mode==="groupbox"&&canEdit){
      const target=e.target;
      if(target.closest(".nn-node")) return;
      const el=canvasRef.current; if(!el) return;
      const rect=el.getBoundingClientRect(); const s=1/zoom;
      const x=(e.clientX-rect.left)*s+el.scrollLeft*s;
      const y=(e.clientY-rect.top)*s+el.scrollTop*s;
      const gb={startX:x,startY:y,endX:x,endY:y};
      groupBoxDrawRef.current=gb;
      setDrawingGroupBox(gb);
      return;
    }
    if(mode!=="select") return; // allow box-select in view mode too
    // Only start box-select if clicking directly on canvas background (not a node/edge)
    const target=e.target;
    if(target.closest(".nn-node")) return;
    if(target.tagName==="path"||target.tagName==="text"||target.closest("circle")||target.closest("polygon")||target.closest("foreignObject")) return;
    // Only start box-select on true canvas background
    const el=canvasRef.current; if(!el) return;
    const rect=el.getBoundingClientRect(); const s=1/zoom;
    const x=(e.clientX-rect.left)*s+el.scrollLeft*s;
    const y=(e.clientY-rect.top)*s+el.scrollTop*s;
    const bs={startX:x,startY:y,endX:x,endY:y};
    boxSelRef.current=bs; setBoxSel(bs);
    setSelected(new Set()); setSelEdge(null);
  },[mode,canEdit,zoom]);

  // ── Add node ──────────────────────────────────────────────
  const addNode=useCallback((type)=>{
    if(!canEdit) return;
    const el=canvasRef.current; if(!el) return;
    const s=1/zoom;
    const baseX=(el.scrollLeft+el.clientWidth/2)*s-110;
    const baseY=(el.scrollTop+el.clientHeight/2)*s-48;
    // Offset from any node already close to the center so they don't stack
    const cur = nodesRef.current;
    let ox=0, oy=0;
    for(let tries=0; tries<20; tries++){
      const clash = cur.some(n=>Math.abs(n.x-(baseX+ox))<(n.w||DEF_W)+20 && Math.abs(n.y-(baseY+oy))<(n.h||DEF_H)+20);
      if(!clash) break;
      ox += (DEF_W+30); if(ox > 600){ ox=0; oy += (DEF_H+30); }
    }
    const node=mkNode(type, baseX+ox, baseY+oy);
    applyNodes(ns=>[...ns,node]);
    noteRecentType(type);
    setSelected(new Set([node.id])); setSelEdge(null);
    setShowSidebar(false);
    if(window.innerWidth<768) setShowProps(true);
    // Pop-in animation
    setTimeout(()=>{
      const el=document.querySelector(`[data-ui="node-${node.id}"]`);
      if(el){el.classList.add("nn-node-new");setTimeout(()=>el.classList.remove("nn-node-new"),200);}
    },16);
  },[zoom,applyNodes,canEdit]);

  // ── Delete ─────────────────────────────────────────────────
  const deleteSelected=useCallback(()=>{
    if(!canEdit) return;
    if(selEdge){
      applyEdges(es=>es.filter(e=>e.id!==selEdge));
      setSelEdge(null); return;
    }
    if(selected.size===0) return;
    applyNodes(ns=>ns.filter(n=>!selected.has(n.id)));
    applyEdges(es=>es.filter(e=>!selected.has(e.from)&&!selected.has(e.to)));
    setSelected(new Set()); setShowProps(false);
  },[selected,selEdge,canEdit,applyNodes,applyEdges]);

  // ── Node updates ───────────────────────────────────────────
  const updateNode   =(id,u)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,...u}:n));
  const updateProp   =(id,k,v)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,properties:{...n.properties,[k]:v}}:n));
  const updateCustom =(id,k,v)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,customProps:{...n.customProps,[k]:v}}:n));
  const deleteCustom =(id,k)=>applyNodes(ns=>ns.map(n=>{if(n.id!==id)return n;const c={...n.customProps};delete c[k];return{...n,customProps:c};}));
  // Rename a custom property key — preserves order, checks uniqueness against default+custom keys
  const renameCustom =(id,oldKey,newKey)=>{
    newKey=newKey.trim();
    if(!newKey||newKey===oldKey) return;
    applyNodes(ns=>ns.map(n=>{
      if(n.id!==id) return n;
      const takenKeys=[...Object.keys(n.properties||{}),...Object.keys(n.customProps||{}).filter(k=>k!==oldKey)];
      if(takenKeys.map(k=>k.toLowerCase()).includes(newKey.toLowerCase())) return n; // silently ignore dupe
      const entries=Object.entries(n.customProps||{});
      const updated=Object.fromEntries(entries.map(([k,v])=>k===oldKey?[newKey,v]:[k,v]));
      return {...n,customProps:updated};
    }));
  };
  const resetSize    =(id)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,w:n.type==="group"?GRP_W:DEF_W,h:n.type==="group"?GRP_H:DEF_H}:n));
  const toggleCollapse=(id)=>applyNodes(ns=>ns.map(n=>n.id===id?{...n,collapsed:!n.collapsed}:n));
  const collapseAll=()=>{ applyNodes(ns=>ns.map(n=>({...n,collapsed:true}))); setGlobalCollapsed(true); };
  const expandAll=()=>{
    applyNodes(ns=>ns.map(n=>({...n,collapsed:false})));
    setGlobalCollapsed(false);
    // Re-layout after 80ms so DOM heights reflow before calculating positions
    setTimeout(()=>handleAutoLayout(layoutDir),80);
  };
  const updateNotes  =(id,notes)=>{
    setNodes(ns=>ns.map(n=>n.id===id?{...n,notes}:n));
    clearTimeout(notesTimers.current[id]);
    notesTimers.current[id]=setTimeout(()=>{
      setNodes(ns=>{const u=ns.map(n=>n.id===id?{...n,notes}:n);setEdges(es=>{scheduleSave(u,es);pushHistory(u,es);return es;});return u;});
    },800);
  };

  // ── WebSocket collaboration — always-on ─────────────────────────
  //
  // Architecture (correct):
  //   LOCAL change  → applyNodes(fn)  → setNodes() + ws.send() directly inside
  //   REMOTE change → setNodes(data)  directly, NEVER via applyNodes
  //
  // No useEffect broadcasting. No echo prevention needed.
  // The server only sends to OTHER clients — sender never receives their own message.
  //

  useEffect(() => {
    if (!mapId) return;
    let ws = null;
    let reconnectTimer = null;
    let active = true;

    const connect = () => {
      const token = getAccessToken();
      if (!token) {
        // Not logged in yet — try again shortly
        reconnectTimer = setTimeout(connect, 2000);
        return;
      }
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[collab] connected, joining map", mapId);
        ws.send(JSON.stringify({ type: "join", mapId, token }));
      };

      ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }

        if (msg.type === "auth_error") {
          console.warn("[collab] auth error — reconnect skipped");
          active = false; ws.close(1000); return;
        }

        if (msg.type === "room_state") {
          console.log("[collab] joined room, peers:", msg.users?.length || 0);
          setWsConnected(true);
          setRemoteSelections(Object.fromEntries((msg.users || []).map(u => [
            u.userId, { userName: u.userName || "User", color: userColor(u.userId), selectedIds: new Set(), editingId: null }
          ])));
          // Push our full current state so latecomers sync
          if ((msg.users || []).length > 0) {
            ws.send(JSON.stringify({ type: "nodes_update", nodes: nodesRef.current }));
            ws.send(JSON.stringify({ type: "edges_update", edges: edgesRef.current }));
          }
          return;
        }

        if (msg.type === "user_joined") {
          console.log("[collab] user joined:", msg.userName);
          setRemoteSelections(prev => ({ ...prev, [msg.userId]: { userName: msg.userName || "User", color: userColor(msg.userId), selectedIds: new Set(), editingId: null } }));
          // Send them our current canvas state
          ws.send(JSON.stringify({ type: "nodes_update", nodes: nodesRef.current }));
          ws.send(JSON.stringify({ type: "edges_update", edges: edgesRef.current }));
          return;
        }

        if (msg.type === "user_left") {
          setRemoteSelections(prev => { const n = { ...prev }; delete n[msg.userId]; return n; });
          return;
        }

        // ── Apply remote canvas changes DIRECTLY (not via applyNodes) ──
        if (msg.type === "nodes_update" && Array.isArray(msg.nodes)) {
          console.log("[collab] recv nodes from", msg.userName, "count:", msg.nodes.length);
          setNodes(msg.nodes); // direct set — no broadcast, no history
          return;
        }

        if (msg.type === "edges_update" && Array.isArray(msg.edges)) {
          console.log("[collab] recv edges from", msg.userName, "count:", msg.edges.length);
          setEdges(msg.edges); // direct set — no broadcast, no history
          return;
        }

        if (msg.type === "selection_update") {
          setRemoteSelections(prev => ({
            ...prev,
            [msg.userId]: {
              userName: msg.userName || "User",
              color: userColor(msg.userId),
              selectedIds: new Set(msg.selectedIds || []),
              editingId: msg.editingId || null,
            }
          }));
          return;
        }
      };

      ws.onerror = (err) => console.error("[collab] error", err);

      ws.onclose = (ev) => {
        wsRef.current = null;
        setWsConnected(false);
        console.log("[collab] closed", ev.code);
        if (active && ev.code !== 1000 && ev.code !== 1008) {
          console.log("[collab] reconnecting in 4s…");
          reconnectTimer = setTimeout(connect, 4000);
        }
      };
    };

    connect();

    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      if (ws && ws.readyState <= 1) ws.close(1000, "leaving");
      wsRef.current = null;
      setWsConnected(false);
      setRemoteSelections({});
    };
  }, [mapId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Broadcast local selection to collaborators ───────────────────
  // Called whenever selected nodes or editing state changes
  const broadcastSelection = useCallback((selectedSet, editingId) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({
      type: "selection_update",
      selectedIds: [...(selectedSet || selected)],
      editingId: editingId !== undefined ? editingId : (editingTitle || inlineEditField?.nodeId || null),
    }));
  }, [selected, editingTitle, inlineEditField]);

  // ── Auto-layout ────────────────────────────────────────────
  const handleAutoLayout=useCallback((dir)=>{
    const d=dir||layoutDir;
    localStorage.setItem('nn_layout_dir',d);
    applyEdges(es=>es.map(e=>({...e,fromAnchor:null,toAnchor:null,midOff:null})));
    applyNodes(ns=>{
      const laid=autoLayout(ns,edges,d);

      // Post-layout: assign exit ports so multiple edges from/to same node
      // side are spread out (t values) rather than all exiting at center.
      // This prevents a "fan" of arrows all colliding at the same point.
      setTimeout(()=>{
        applyEdges(es=>{
          // Group edges by (nodeId, side) to assign t offsets
          const groups = {}; // key="nodeId:side" -> [edgeId,...]
          const nodeMap = {};
          laid.forEach(n=>{ nodeMap[n.id]=n; });

          // First pass: determine which side each edge will use
          const sideOf = {}; // edgeId -> {fromSide, toSide}
          es.forEach(e=>{
            const fn=nodeMap[e.from], tn=nodeMap[e.to];
            if(!fn||!tn) return;
            const fw=fn.w||DEF_W, fh=fn.h||DEF_H;
            const tw=tn.w||DEF_W, th=tn.h||DEF_H;
            const dx=(tn.x+tw/2)-(fn.x+fw/2), dy=(tn.y+th/2)-(fn.y+fh/2);
            const ax=Math.abs(dx), ay=Math.abs(dy);
            let fromSide, toSide;
            if(ax>ay*0.5){ fromSide=dx>0?"right":"left"; toSide=dx>0?"left":"right"; }
            else { fromSide=dy>0?"bottom":"top"; toSide=dy>0?"top":"bottom"; }
            sideOf[e.id]={fromSide,toSide};
            // Group by exit side
            const fk=`${e.from}:${fromSide}`, tk=`${e.to}:${toSide}`;
            if(!groups[fk]) groups[fk]=[];
            if(!groups[tk]) groups[tk]=[];
            groups[fk].push({eid:e.id,isFrom:true});
            groups[tk].push({eid:e.id,isFrom:false});
          });

          // Second pass: sort items by other-node cross-axis center, assign t values
          // This ensures arrows going to higher nodes get lower t-offsets (no crossing)
          const anchorOverrides = {}; // edgeId -> {fromAnchor?, toAnchor?}
          const edgeMap = {};
          es.forEach(e=>{ edgeMap[e.id]=e; });

          Object.entries(groups).forEach(([key,items])=>{
            const [nid,side]=key.split(":");
            const isHorizSide = side==="left"||side==="right";
            
            // Sort by the cross-axis center of the other node
            const sorted = [...items].sort((a,b)=>{
              const ea=edgeMap[a.eid], eb=edgeMap[b.eid];
              if(!ea||!eb) return 0;
              const oaId = a.isFrom ? ea.to   : ea.from;
              const obId = b.isFrom ? eb.to   : eb.from;
              const na=nodeMap[oaId], nb=nodeMap[obId];
              if(!na||!nb) return 0;
              // For horizontal sides (left/right), sort by Y of target
              if(isHorizSide) return (na.y+(na.h||DEF_H)/2) - (nb.y+(nb.h||DEF_H)/2);
              // For vertical sides (top/bottom), sort by X of target
              return (na.x+(na.w||DEF_W)/2) - (nb.x+(nb.w||DEF_W)/2);
            });
            
            sorted.forEach((item,i)=>{
              const n = sorted.length;
              const t = n===1 ? 0.5 : (i+1)/(n+1);
              if(!anchorOverrides[item.eid]) anchorOverrides[item.eid]={};
              if(item.isFrom) anchorOverrides[item.eid].fromAnchor={side,t:Math.round(t*100)/100};
              else            anchorOverrides[item.eid].toAnchor={side,t:Math.round(t*100)/100};
            });
          });

          return es.map(e=>({
            ...e,
            fromAnchor: anchorOverrides[e.id]?.fromAnchor || null,
            toAnchor:   anchorOverrides[e.id]?.toAnchor   || null,
            midOff: null,
          }));
        });
        if(canvasRef.current) canvasRef.current.scrollTo({left:0,top:0,behavior:"smooth"});
      },50);

      return laid;
    });
  },[edges,applyNodes,zoom,layoutDir]);

  // ── Restore version ────────────────────────────────────────
  const handleRestore=(ns,es)=>{
    const mappedN=ns.map(n=>({id:n.id,type:n.node_type||n.type,x:n.x,y:n.y,w:n.w,h:n.h,title:n.title,notes:parseNotes(n.notes),collapsed:false,properties:{...(DP[n.node_type||n.type]||{}),...(n.properties||{})},customProps:n.custom_props||n.customProps||{}}));
    const mappedE=es.map(e=>({id:e.id,from:e.from_node||e.from,to:e.to_node||e.to,label:e.label||"",style:e.style||"arrow",color:e.color||"var(--accent)",fromAnchor:e.from_anchor||e.fromAnchor||null,toAnchor:e.to_anchor||e.toAnchor||null}));
    setNodes(mappedN);setEdges(mappedE);pushHistory(mappedN,mappedE);scheduleSave(mappedN,mappedE);
  };

  // ── Quick capture commit ───────────────────────────────────
  const commitCapture=()=>{
    const title=quickText.trim();
    if(!title){setQuickPos(null);setQuickText("");return;}
    // Find non-overlapping position
    const cur=nodesRef.current;
    let ox=0,oy=0;
    for(let i=0;i<20;i++){
      const clash=cur.some(n=>
        Math.abs(n.x-(quickPos.x+ox))<(n.w||DEF_W)+20&&
        Math.abs(n.y-(quickPos.y+oy))<(n.h||DEF_H)+20);
      if(!clash) break;
      ox+=(DEF_W+24); if(ox>600){ox=0;oy+=(DEF_H+24);}
    }
    const node=mkNode("note",quickPos.x+ox,quickPos.y+oy);
    node.title=title;
    applyNodes(ns=>[...ns,node]);
    setSelected(new Set([node.id])); setQuickPos(null); setQuickText("");
  };


  // ── Smart edge router — prefers right→left for horizontal layouts ────
  // ── Pre-compute staggered port t-values for all edges ────────────────────
  // Groups edges by which face they share on a node and spreads their
  // exit/entry points evenly to prevent arrows stacking on the same pixel.
  const edgePortMap = useMemo(()=>{
    // Groups edges by (nodeId, side, from|to) and assigns evenly-spread t-values
    // so multiple arrows on the same face don't stack on the same pixel.
    //
    // CRITICAL: each group is SORTED by where the *other* end of the edge sits.
    // Assigning ports in edge-array order guarantees crossings whenever two
    // edges leave the same face toward targets in the opposite vertical order —
    // the edge heading to the lower node would get the upper port and the two
    // would have to cross right at the node. Sorting removes that entire class
    // of crossing for free.
    //
    // IMPORTANT: uses node.w/node.h (stored) NOT collW/collH (DOM ref) —
    // refs don't trigger memo updates so face decisions would be stale.
    const portGroups = {};
    edges.forEach(edge => {
      const f = nodes.find(n=>n.id===edge.from);
      const t = nodes.find(n=>n.id===edge.to);
      if (!f || !t) return;
      // Use stored dimensions for consistent, stable face selection
      const fw=f.w||220, fh=f.h||96, tw=t.w||220, th=t.h||96;

      if (!edge.fromAnchor || edge.fromAnchor.side==="auto") {
        const {from:fSide} = pickBestSides(f.x,f.y,fw,fh,t.x,t.y,tw,th);
        const k=`${edge.from}:${fSide}:from`;
        // rank = position of the OTHER end along this face's spread axis
        const rank = (fSide==="left"||fSide==="right") ? (t.y+th/2) : (t.x+tw/2);
        (portGroups[k]=portGroups[k]||[]).push({id:edge.id, rank});
      }
      if (!edge.toAnchor || edge.toAnchor.side==="auto") {
        const {to:tSide} = pickBestSides(f.x,f.y,fw,fh,t.x,t.y,tw,th);
        const k=`${edge.to}:${tSide}:to`;
        const rank = (tSide==="left"||tSide==="right") ? (f.y+fh/2) : (f.x+fw/2);
        (portGroups[k]=portGroups[k]||[]).push({id:edge.id, rank});
      }
    });

    // Spread t-values evenly across [0.2, 0.8], in sorted order:
    //   1 edge  → 0.5
    //   2 edges → 0.27, 0.73
    //   3 edges → 0.2, 0.5, 0.8
    const tMap = {};
    Object.entries(portGroups).forEach(([key, group]) => {
      const role = key.split(":")[2];
      group.sort((a,b)=>a.rank-b.rank);
      const n = group.length;
      group.forEach((item, i) => {
        tMap[`${item.id}:${role}`] = n===1 ? 0.5 : 0.2+(i/(n-1))*0.6;
      });
    });
    return tMap;
  }, [edges, nodes]);

  // ── Lane assignment for orthogonal routing ───────────────────────
  // Every edge that travels through the same channel gets its own lane
  // coordinate, so parallel runs never sit on top of each other.
  // ── What is ACTUALLY on screen ───────────────────────────────────
  // Grouped notes render as a single box at the average of their members,
  // and the members themselves are not drawn at all. Any router that uses
  // raw `nodes` is therefore dodging boxes that aren't there while ploughing
  // through the one that is. Everything geometric must use this instead.
  const renderedBoxes = useMemo(()=>{
    const noteParents = {};
    edges.forEach(e => {
      const fn = nodes.find(n=>n.id===e.from), tn = nodes.find(n=>n.id===e.to);
      if (tn?.type==='note' && fn?.type!=='note') (noteParents[e.to]  = noteParents[e.to]  || []).push(e.from);
      if (fn?.type==='note' && tn?.type!=='note') (noteParents[e.from]= noteParents[e.from]|| []).push(e.to);
    });
    const stacks = {};
    nodes.forEach(n => {
      if (n.type !== 'note') return;
      const ps = noteParents[n.id] || [];
      if (ps.length === 1) (stacks[ps[0]] = stacks[ps[0]] || []).push(n);
    });
    const memberToStack = {}, boxes = [], stackByParent = {};
    Object.entries(stacks).forEach(([pid, ns]) => {
      if (ns.length < 2) return;
      const sid = `__stack__${pid}`;
      const ax = ns.reduce((s,n)=>s+n.x,0)/ns.length;
      const ay = ns.reduce((s,n)=>s+n.y,0)/ns.length;
      const box = { id:sid, x:ax, y:ay, w:240, h:150, parentId:pid };
      boxes.push(box); stackByParent[pid] = box;
      ns.forEach(n => { memberToStack[n.id] = sid; });
    });
    nodes.forEach(n => {
      if (memberToStack[n.id]) return;
      boxes.push({ id:n.id, x:n.x, y:n.y, w:n.w||220, h:n.h||96 });
    });
    return { boxes, memberToStack, stackByParent };
  }, [nodes, edges]);

  // nodeId -> ids of note nodes attached to it (any note, grouped or not)
  const attachedNotes = useMemo(()=>{
    const m = {};
    edges.forEach(e => {
      const f = nodes.find(n=>n.id===e.from), t = nodes.find(n=>n.id===e.to);
      if (!f || !t) return;
      if (t.type==='note' && f.type!=='note') (m[f.id]=m[f.id]||[]).push(t.id);
      if (f.type==='note' && t.type!=='note') (m[t.id]=m[t.id]||[]).push(f.id);
    });
    return m;
  }, [nodes, edges]);

  const edgeLaneMap = useMemo(()=>{
    if (edgeRouting !== "ortho") return {};
    const lanes = {};
    const groups = {};
    edges.forEach(edge => {
      const f = nodes.find(n=>n.id===edge.from);
      const t = nodes.find(n=>n.id===edge.to);
      if (!f || !t) return;
      const fw=f.w||220, fh=f.h||96, tw=t.w||220, th=t.h||96;
      const {from:fSide,to:tSide} = pickBestSides(f.x,f.y,fw,fh,t.x,t.y,tw,th);
      const horiz = (fSide==="left"||fSide==="right");
      // channel = the gap between the two facing edges
      const gapLo = horiz ? Math.min(f.x+fw, t.x+tw) : Math.min(f.y+fh, t.y+th);
      const gapHi = horiz ? Math.max(f.x, t.x)       : Math.max(f.y, t.y);
      const key = `${horiz?"h":"v"}:${Math.round(gapLo/40)}:${Math.round(gapHi/40)}`;
      const srcC = horiz ? (f.y+fh/2) : (f.x+fw/2);
      const tgtC = horiz ? (t.y+th/2) : (t.x+tw/2);
      (groups[key]=groups[key]||[]).push({ id:edge.id, gapLo, gapHi, srcC, dist:Math.abs(tgtC-srcC) });
    });
    Object.values(groups).forEach(group => {
      // Order matters. In a fan-out, the edge heading to the FARTHEST target
      // must turn first (nearest lane): its long vertical run then sits inside
      // all the shorter ones instead of cutting across them. Sorting by target
      // position instead — the obvious choice — makes every long edge cross
      // every short one. Group by source first so separate fans stay apart.
      group.sort((a,b) => (a.srcC-b.srcC) || (b.dist-a.dist));
      const n = group.length;
      group.forEach((item, i) => {
        const lo = Math.min(item.gapLo, item.gapHi), hi = Math.max(item.gapLo, item.gapHi);
        const span = hi - lo;
        // keep lanes inside the channel, evenly spread, never hugging a node face
        const inset = Math.min(30, span*0.25);
        const usable = Math.max(0, span - inset*2);
        lanes[item.id] = n===1 ? lo + span/2 : lo + inset + (usable * (i/(n-1)));
      });
    });
    return lanes;
  }, [edges, nodes, edgeRouting]);

  const getEdgePath=(fromNode,toNode,edge={})=>{
    const fw=collW(fromNode), fh=collH(fromNode);
    const tw=collW(toNode),   th=collH(toNode);

    const faceNormal=(side)=>{
      switch(side){
        case "top":    return {dx:0, dy:-1};
        case "bottom": return {dx:0, dy:1};
        case "left":   return {dx:-1,dy:0};
        case "right":  return {dx:1, dy:0};
        default:       return {dx:0, dy:0};
      }
    };

    const sidePt=(nd,nw,nh,side,t=0.5)=>{
      switch(side){
        case "top":    return {x:nd.x+nw*t,   y:nd.y,       normal:faceNormal(side)};
        case "bottom": return {x:nd.x+nw*t,   y:nd.y+nh,    normal:faceNormal(side)};
        case "left":   return {x:nd.x,         y:nd.y+nh*t,  normal:faceNormal(side)};
        case "right":  return {x:nd.x+nw,      y:nd.y+nh*t,  normal:faceNormal(side)};
        default:       return {x:nd.x+nw/2,    y:nd.y+nh/2,  normal:{dx:0,dy:0}};
      }
    };

    // Look up the pre-computed staggered t for this edge on a given port
    const getPortT=(role)=>{
      const key=`${edge.id}:${role}`;
      return edgePortMap[key] ?? 0.5;
    };

    // Resolve from-point
    let fp,fn1;
    const fa=edge.fromAnchor;
    if(fa&&fa.side&&fa.side!=="auto"){
      const t=fa.t??0.5;
      const a=sidePt(fromNode,fw,fh,fa.side,t);
      fp=a; fn1=a.normal;
    }
    if(!fp){
      // Use STORED dims for face selection (consistent with edgePortMap)
      const sw=fromNode.w||220, sh=fromNode.h||96;
      const dw=toNode.w||220,   dh=toNode.h||96;
      const {from:fSide}=pickBestSides(fromNode.x,fromNode.y,sw,sh,toNode.x,toNode.y,dw,dh);
      const t=getPortT("from");
      // But use collW/collH for actual exit POINT so arrow lands on visible edge
      const pt=sidePt(fromNode,fw,fh,fSide,t);
      fp=pt; fn1=pt.normal;
    }

    // Resolve to-point
    let tp,fn2;
    const ta=edge.toAnchor;
    if(ta&&ta.side&&ta.side!=="auto"){
      const t=ta.t??0.5;
      const a=sidePt(toNode,tw,th,ta.side,t);
      tp=a; fn2=a.normal;
    }
    if(!tp){
      const sw=fromNode.w||220, sh=fromNode.h||96;
      const dw=toNode.w||220,   dh=toNode.h||96;
      const {to:tSide}=pickBestSides(fromNode.x,fromNode.y,sw,sh,toNode.x,toNode.y,dw,dh);
      const t=getPortT("to");
      const pt=sidePt(toNode,tw,th,tSide,t);
      tp=pt; fn2=pt.normal;
    }

    // ── Orthogonal routing ─────────────────────────────────────────
    if (edgeRouting === "ortho" && !edge.midOff) {
      // Exclude both endpoints — including the stack box a note endpoint is
      // drawn inside of, otherwise the edge treats its own destination as a
      // wall and detours around it.
      const skip = new Set([
        fromNode.id, toNode.id,
        renderedBoxes.memberToStack[fromNode.id],
        renderedBoxes.memberToStack[toNode.id],
        fromNode.__stackId, toNode.__stackId,
      ].filter(Boolean));
      const obstacles = renderedBoxes.boxes.filter(b => !skip.has(b.id));
      const pts = orthoRoute(fp, fn1, tp, fn2, edgeLaneMap[edge.id], obstacles);
      const path = roundedPolyPath(pts, 14);
      // midpoint = middle vertex of the travel segment, for labels/handles
      const midIdx = Math.max(1, Math.floor(pts.length/2));
      const mid = { x:(pts[midIdx-1].x+pts[midIdx].x)/2, y:(pts[midIdx-1].y+pts[midIdx].y)/2 };
      return { path, fp, tp, mid };
    }

    // Bezier control points — adaptive S-curve
    const dx=tp.x-fp.x, dy=tp.y-fp.y;
    const dist=Math.sqrt(dx*dx+dy*dy)||1;
    const alignF=Math.abs(fn1.dx*(dx/dist)+fn1.dy*(dy/dist));
    // Short handle for aligned routes (direct), long for backtracking
    const ctrlMult = alignF>0.7 ? 0.35 : alignF>0.3 ? 0.48 : 0.65;
    const ctrl=Math.max(60, dist*ctrlMult);
    let c1x=fp.x+fn1.dx*ctrl, c1y=fp.y+fn1.dy*ctrl;
    let c2x=tp.x+fn2.dx*ctrl, c2y=tp.y+fn2.dy*ctrl;

    if(edge.midOff){
      const mx=(fp.x+tp.x)/2+edge.midOff.dx;
      const my=(fp.y+tp.y)/2+edge.midOff.dy;
      c1x=fp.x*0.25+mx*0.75; c1y=fp.y*0.25+my*0.75;
      c2x=tp.x*0.25+mx*0.75; c2y=tp.y*0.25+my*0.75;
    }

    const hasMStart=edge.style&&(EDGE_STYLES[edge.style]?.mStart);
    const sw=EDGE_STYLES[edge.style]?.strokeW||2;
    let fpx=fp.x, fpy=fp.y;
    if(hasMStart){
      const PULL=sw*10;
      const d1=Math.sqrt((c1x-fp.x)**2+(c1y-fp.y)**2)||1;
      fpx=fp.x+(c1x-fp.x)/d1*PULL;
      fpy=fp.y+(c1y-fp.y)/d1*PULL;
    }
    const path=`M ${fpx} ${fpy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tp.x} ${tp.y}`;
    const mid={
      x:0.125*(fp.x+tp.x)+0.375*(c1x+c2x),
      y:0.125*(fp.y+tp.y)+0.375*(c1y+c2y),
    };
    return {path,fp,tp,mid};
  };

  // ── LLM export ─────────────────────────────────────────────
  const exportLLM=()=>buildLLMText(mapMeta?.title||"Map",nodes,edges,NT);

  const _exportLLM_legacy=()=>{
    const title=mapMeta?.title||"Map";
    let out=`# ${title}\n_NoNote export · ${new Date().toLocaleString()}_\n\n## Summary\n${nodes.length} components · ${edges.length} connections\n\n## Components\n\n`;
    const cats={};
    nodes.forEach(n=>{const c=NT[n.type]?.cat||"General";(cats[c]=cats[c]||[]).push(n);});
    Object.entries(cats).forEach(([cat,ns])=>{
      out+=`### ${cat}\n\n`;
      ns.forEach(n=>{
        out+=`**${n.title}** _(${NT[n.type]?.label||n.type})_\n`;
        [...Object.entries(n.properties||{}),...Object.entries(n.customProps||{})].filter(([,v])=>v).forEach(([k,v])=>{out+=`- ${k}: ${v}\n`;});
        if(n.node_notes && n.node_notes.trim()) {
          if(n.notes_private) out+=`- Notes: [PRIVATE]\n`;
          else out+=`- Notes:\n${n.node_notes.split('\n').map(l=>`  ${l}`).join('\n')}\n`;
        }
        out+="\n";
      });
    });
    if(edges.length){
      out+=`## Relationships\n\n`;
      edges.forEach(e=>{
        const f=nodes.find(n=>n.id===e.from),t=nodes.find(n=>n.id===e.to);
        if(!f||!t)return;
        const edgeTypeLbl={"data":"data flow","method":"method call","network":"network link","dependency":"depends on","trigger":"triggers","other":"connects"}[e.edgeType||"data"]||"connects to";
        const verb=e.label?`"${e.label} (${edgeTypeLbl})"`:edgeTypeLbl;
        out+=`- **${f.title}** ${e.style==="bidirectional"?"↔":"→"} **${t.title}**: ${verb}\n`;
      });
    }
    out+=`\n---\n_Paste into any LLM for review, documentation, or Q&A._`;
    return out;
  };

  // ── Derived ────────────────────────────────────────────────
  const selectedNode = selected.size===1 ? nodes.find(n=>n.id===[...selected][0]) : null;
  const selectedEdgeObj = selEdge ? edges.find(e=>e.id===selEdge) : null;
  const cats=useMemo(()=>SIDEBAR_CATS.filter(c=>Object.values(NT).some(t=>t.cat===c)),[]);
  const isMobile=window.innerWidth<768;

  // ── Search ─────────────────────────────────────────────────
  const searchResults = useMemo(()=>{
    const q = searchQuery.trim().toLowerCase();
    if(!q) return [];

    // hit(field, rawText) — finds q in rawText, adds to hits[]
    // Works on any value: strings, numbers, arrays (joined), objects (values)
    const searchAll=(hits, field, value)=>{
      if(value===null||value===undefined) return;
      if(Array.isArray(value)){
        value.forEach((v,i)=>searchAll(hits,`${field}[${i}]`,v));
        return;
      }
      if(typeof value==="object"){
        Object.entries(value).forEach(([k,v])=>searchAll(hits,k,v));
        return;
      }
      const raw=String(value);
      const txt=raw.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(); // strip HTML
      const s=txt.toLowerCase();
      const idx=s.indexOf(q);
      if(idx>=0) hits.push({
        field,
        snippet: txt.slice(Math.max(0,idx-30), idx+q.length+50),
        matchStart: Math.max(0,idx-30)>0?idx+30:idx,
        matchLen: q.length,
      });
    };

    const nodeResults = nodes.map(node=>{
      const t=NT[node.type]||NT.note;
      const hits=[];
      const chk=(f,v)=>searchAll(hits,f,v);
      const inTitle  = searchField==="all"||searchField==="title";
      const inNotes  = searchField==="all"||searchField==="notes";
      const inProps  = searchField==="all"||searchField==="props";
      const inType   = searchField==="all"||searchField==="type";

      // ── Node identity ──────────────────────────────────────────────
      if(inTitle) chk("Name",         node.title);
      if(inTitle) chk("Description",  node.description);

      // ── Type ───────────────────────────────────────────────────────
      if(inType){
        chk("Type",     t.label);
        chk("Category", t.cat);
      }

      // ── Notes ─────────────────────────────────────────────────────
      if(inNotes){
        const nn = node.node_notes || '';
        if(nn && !(node.notes_private && !canEdit)) {
          const idx2 = nn.toLowerCase().indexOf(q);
          if(idx2 >= 0) hits.push({
            field: node.notes_private ? "Notes 🔒" : "Notes",
            snippet: nn.slice(Math.max(0,idx2-30), idx2+q.length+60),
            matchStart: Math.max(0,idx2-30)>0?idx2+30:idx2,
            matchLen: q.length,
          });
        }
      }

      // ── Properties (template + custom) ───────────────────────────
      if(inProps){
        Object.entries(node.properties||{}).forEach(([k,v])=>{
          chk(k, v);
          // Also search the key itself
          const ks=k.toLowerCase();
          if(ks.indexOf(q)>=0) hits.push({field:"Property key",snippet:k,matchStart:0,matchLen:k.length});
        });
        Object.entries(node.customProps||{}).forEach(([k,v])=>{
          chk(k, v);
          const ks=k.toLowerCase();
          if(ks.indexOf(q)>=0) hits.push({field:"Custom field key",snippet:k,matchStart:0,matchLen:k.length});
        });
      }

      if(!hits.length) return null;
      return {node,t,hits};
    }).filter(Boolean);

    // ── Also search edge labels (show which node the edge is on) ──
    if(searchField==="all"||searchField==="title"){
      edges.forEach(edge=>{
        if(!edge.label) return;
        const lbl=edge.label.toLowerCase();
        if(lbl.indexOf(q)>=0){
          const fn=nodes.find(n=>n.id===edge.from);
          const tn=nodes.find(n=>n.id===edge.to);
          if(fn){
            let existing=nodeResults.find(r=>r.node.id===fn.id);
            const hit={field:"Arrow label",snippet:edge.label,matchStart:0,matchLen:edge.label.length};
            if(existing) existing.hits.push(hit);
            else nodeResults.push({node:fn,t:NT[fn.type]||NT.note,hits:[hit]});
          }
        }
      });
    }

    return nodeResults;
  },[nodes, edges, searchQuery, searchField, canEdit]);

  const scrollToNode = (nodeId) => {
    const node = nodes.find(n=>n.id===nodeId);
    if(!node||!canvasRef.current) return;
    const el = canvasRef.current;
    const nw = (node.collapsed?COL_W:node.w)*zoom;
    const nh = (node.collapsed?COL_H:node.h)*zoom;
    const targetX = node.x*zoom - el.clientWidth/2  + nw/2;
    const targetY = node.y*zoom - el.clientHeight/2 + nh/2;
    el.scrollTo({ left:Math.max(0,targetX), top:Math.max(0,targetY), behavior:"smooth" });
    setSelected(new Set([nodeId]));
    setSelEdge(null);
  };
  // Canvas world size — grows with actual content so background/guides never
  // stop short of nodes placed past the old fixed 4000x3000 box.
  const canvasW = useMemo(()=>Math.max(4000, ...nodes.map(n=>(n.x||0)+(n.w||DEF_W)))+400,[nodes]);
  const canvasH = useMemo(()=>Math.max(3000, ...nodes.map(n=>(n.y||0)+(n.h||DEF_H)))+400,[nodes]);
  const canvasBg = canvasTheme!=="global"&&THEMES[canvasTheme]
    ? THEMES[canvasTheme].vars["--bg"]
    : undefined; // undefined = use CSS var
  const canvasDot = canvasTheme!=="global"&&THEMES[canvasTheme]
    ? THEMES[canvasTheme].vars["--canvas-dot"]
    : undefined;

  // Build inline canvas background style (overrides CSS vars when a canvas theme is set)
  const canvasBgStyle = canvasBg
    ? `radial-gradient(circle,${canvasDot||"rgba(0,0,0,0.12)"} 1.5px,transparent 1.5px) 0 0/24px 24px ${canvasBg}`
    : "radial-gradient(circle,var(--canvas-dot) 1.5px,transparent 1.5px) 0 0/24px 24px var(--bg)";

  // ── Search hit IDs for canvas highlight ──────────────────────
  const searchHitIds = useMemo(()=>new Set(searchResults.map(r=>r.node.id)),[searchResults]);

  // ── Box select rect ────────────────────────────────────────
  const boxRect = boxSel ? {
    x:Math.min(boxSel.startX,boxSel.endX),
    y:Math.min(boxSel.startY,boxSel.endY),
    w:Math.abs(boxSel.endX-boxSel.startX),
    h:Math.abs(boxSel.endY-boxSel.startY),
  } : null;

  if(loading) return (
    <div style={{height:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",color:"var(--text4)"}}>
        <div style={{fontSize:36,marginBottom:12}}>⬡</div>
        <div style={{fontSize:14}}>Loading…</div>
      </div>
    </div>
  );

  const saveMsgColor=saveState==="saved"?"var(--success)":saveState==="error"?"var(--danger)":"var(--text3)";

  // ── Render helpers ──────────────────────────────────────────────
  const renderEdges = () => {
    // Compute suppressed edges for stacks.
    // Stacked notes render as ONE box at the averaged (avgX,avgY) position — never at
    // any individual note's own x/y. So every individual note edge must be suppressed
    // (not just all-but-one), and replaced with a single synthetic edge that points at
    // the box's real rendered position. Otherwise the "kept" edge dangles at a hidden
    // note's real (but unrendered) location — the dangling-arrow bug.
    const suppressedEdgeIds = new Set();
    const _noteParents = {};
    edges.forEach(e => {
      const fn=nodes.find(n=>n.id===e.from), tn=nodes.find(n=>n.id===e.to);
      if(tn?.type==='note'&&fn?.type!=='note'){_noteParents[e.to]=_noteParents[e.to]||[];_noteParents[e.to].push(e.from);}
      if(fn?.type==='note'&&tn?.type!=='note'){_noteParents[e.from]=_noteParents[e.from]||[];_noteParents[e.from].push(e.to);}
    });
    const _stacks={};
    nodes.forEach(n=>{
      if(n.type!=='note') return;
      const parents=_noteParents[n.id]||[];
      if(parents.length===1){const pid=parents[0];_stacks[pid]=_stacks[pid]||[];_stacks[pid].push(n);}
    });
    const _activeStacks={}; // pid → notes[], only for stacks of 2+
    Object.entries(_stacks).forEach(([pid,notes])=>{
      if(notes.length<2) return;
      _activeStacks[pid]=notes;
      notes.forEach(n=>{
        edges.filter(e=>(e.from===pid&&e.to===n.id)||(e.to===pid&&e.from===n.id))
          .forEach(e=>suppressedEdgeIds.add(e.id));
      });
    });

    // One consolidated dashed edge per stack → the box's real (avgX,avgY) position,
    // never an individual note's hidden position.
    const stackEdgeElements = Object.entries(_activeStacks).map(([pid,notes])=>{
      const parentNode = nodes.find(n=>n.id===pid);
      if(!parentNode) return null;
      const avgX = notes.reduce((s,n)=>s+n.x,0)/notes.length;
      const avgY = notes.reduce((s,n)=>s+n.y,0)/notes.length;
      const stackTarget = { x:avgX, y:avgY, w:240, h:100, type:'note' };
      const result = getEdgePath(parentNode, stackTarget, {});
      const { path } = result;
      return (
        <path key={`stack-edge-${pid}`} d={path} stroke="var(--text4)" strokeWidth={1.5}
          fill="none" strokeDasharray="5,4" markerEnd="url(#nn-arr)" opacity={0.8}/>
      );
    });

    const edgeElements = edges.map(edge=>{
        const f=nodes.find(n=>n.id===edge.from),t=nodes.find(n=>n.id===edge.to);
        if(!f||!t) return null;
        if(suppressedEdgeIds.has(edge.id)) return null;
        const result=getEdgePath(f,t,edge); const {path,fp,tp}=result;
        const mid=result.mid||{x:(fp.x+tp.x)/2,y:(fp.y+tp.y)/2};
        const isSel=selEdge===edge.id;
        const isThisEdgeSel=isSel;
        // Focus mode: dim edge if neither endpoint is focused
        const edgeFocused = !focusMode || selected.has(edge.from) || selected.has(edge.to) ||
          editingTitle===edge.from || editingTitle===edge.to ||
          editingNotes===edge.from || editingNotes===edge.to;
        return(
          <g key={edge.id} style={{cursor:"pointer",pointerEvents:"all",opacity:edgeFocused?"1":"0.08",transition:"opacity .2s"}} onClick={e=>handleEdgeClick(e,edge.id)}>
            <path d={path} stroke="transparent" strokeWidth="14" fill="none"/>
            {(()=>{
              const def=EDGE_STYLES[edge.style]||EDGE_STYLES.arrow;
              const ec=isSel?"var(--danger)":(edge.color||(def.color||"var(--accent)"));
              const sw=isSel?3:def.strokeW;
              const da=def.dash==="none"?"none":def.dash;
              const mEnd=def.mEnd?`url(#${def.mEnd})`:undefined;
              const mStart=def.mStart?`url(#${def.mStart}-r)`:undefined;
              const usePath = def.wave ? (()=>{
                const dx=tp.x-fp.x, dy=tp.y-fp.y;
                const len=Math.sqrt(dx*dx+dy*dy)||1;
                const px=-dy/len*18, py=dx/len*18;
                const thirds=4; let d=`M ${fp.x} ${fp.y}`;
                for(let i=1;i<=thirds;i++){
                  const t1=(i*2-1)/(thirds*2), t2=i/thirds;
                  const sign=(i%2===1?1:-1);
                  d+=` Q ${fp.x+dx*t1+px*sign} ${fp.y+dy*t1+py*sign}, ${fp.x+dx*t2} ${fp.y+dy*t2}`;
                }
                return d;
              })() : path;
              return <path d={usePath} stroke={ec} strokeWidth={sw} fill="none" strokeDasharray={da} markerEnd={mEnd} markerStart={mStart}
                opacity={def.double?0:1}/>;
            })()}
            {(EDGE_STYLES[edge.style]?.double)&&<>
              <path d={path} stroke={isSel?"var(--danger)":(edge.color||"var(--accent)")} strokeWidth={(isSel?3:(EDGE_STYLES[edge.style]?.strokeW||2))+3} fill="none" opacity={.25}/>
              <path d={path} stroke={isSel?"var(--danger)":(edge.color||"var(--accent)")} strokeWidth={isSel?3:(EDGE_STYLES[edge.style]?.strokeW||2)} fill="none"
                markerEnd={EDGE_STYLES[edge.style]?.mEnd?`url(#${EDGE_STYLES[edge.style].mEnd})`:undefined}/>
            </>}
            {edge.label&&!isSel&&(
              <text x={mid.x} y={mid.y-9} fill="var(--text3)" fontSize="11" textAnchor="middle" fontFamily="var(--font-ui)">{edge.label}</text>
            )}
            {edge.edgeType&&edge.edgeType!=="data"&&!isSel&&(
              <text x={mid.x} y={mid.y+(edge.label?4:0)-6} fill="var(--text4)" fontSize="9" textAnchor="middle" fontFamily="var(--font-ui)" fontStyle="italic">
                {{"method":"call","network":"net","dependency":"dep","trigger":"→","other":""}[edge.edgeType]||""}
              </text>
            )}
            {isSel&&(
              <foreignObject x={mid.x-90} y={mid.y+14} width="180" height="52">
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  <input value={edge.label||""} placeholder="Label (e.g. sends data)"
                    onChange={e=>{e.stopPropagation();applyEdges(es=>es.map(ex=>ex.id===edge.id?{...ex,label:e.target.value}:ex));}}
                    onClick={e=>e.stopPropagation()}
                    style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--accent)",borderRadius:4,padding:"3px 7px",color:"var(--text)",fontSize:10,fontFamily:"var(--font-ui)",outline:"none",boxSizing:"border-box"}}
                  />
                  <select value={edge.edgeType||"data"} onClick={e=>e.stopPropagation()}
                    onChange={e=>{e.stopPropagation();applyEdges(es=>es.map(ex=>ex.id===edge.id?{...ex,edgeType:e.target.value}:ex));}}
                    style={{background:"var(--bg2)",borderRadius:4,padding:"2px 5px",color:"var(--text3)",fontSize:9,fontFamily:"var(--font-ui)",outline:"none",width:"100%",boxSizing:"border-box"}}>
                    <option value="data">Data flow</option><option value="method">Method call</option>
                    <option value="network">Network</option><option value="dependency">Dependency</option>
                    <option value="trigger">Trigger</option><option value="other">Other</option>
                  </select>
                </div>
              </foreignObject>
            )}
            {(()=>{
              const onMidDown=(ev)=>{
                ev.stopPropagation();
                const origOff=edge.midOff||{dx:0,dy:0};
                const startX=ev.clientX, startY=ev.clientY;
                const onMove=(mv)=>{
                  const el=canvasRef.current; if(!el) return;
                  const s=1/zoom;
                  applyEdges(es=>es.map(ex=>ex.id!==edge.id?ex:{...ex,midOff:{dx:origOff.dx+(mv.clientX-startX)*s,dy:origOff.dy+(mv.clientY-startY)*s}}));
                };
                const onUp=()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
                window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
              };
              return(
                <g style={{cursor:"grab",pointerEvents:"all"}} onMouseDown={onMidDown}
                   opacity={isThisEdgeSel?1:0} className="nn-mid-handle">
                  <circle cx={mid.x} cy={mid.y} r="10" fill="transparent"/>
                  <rect x={mid.x-5} y={mid.y-5} width="10" height="10" rx="2"
                    fill="var(--bg2)" stroke={edge.color||"var(--accent)"} strokeWidth="1.5"
                    transform={`rotate(45,${mid.x},${mid.y})`}/>
                  <circle cx={mid.x} cy={mid.y} r="10" fill="transparent"
                    onDoubleClick={ev=>{ev.stopPropagation();applyEdges(es=>es.map(ex=>ex.id!==edge.id?ex:{...ex,midOff:null}));}}/>
                </g>
              );
            })()}
            {isSel&&canEdit&&(()=>{
              // Drag endpoint: if near the SAME node's edge → slide t offset
              //               if dragged onto a DIFFERENT node → reattach
              const handleEndpointDrag=(isFrom)=>(ev)=>{
                ev.stopPropagation();
                const srcId = isFrom ? edge.from : edge.to;
                const onMove=(mv)=>{
                  if(!canvasRef.current) return;
                  const el=canvasRef.current;
                  const rect=el.getBoundingClientRect(); const s=1/zoom;
                  const cx=(mv.clientX-rect.left)*s+el.scrollLeft*s;
                  const cy=(mv.clientY-rect.top)*s+el.scrollTop*s;
                  // Check which node we're over
                  const hoveredNode=nodesRef.current.find(n=>{
                    const nw=collW(n),nh=collH(n);
                    return cx>=n.x&&cx<=n.x+nw&&cy>=n.y&&cy<=n.y+nh;
                  });
                  if(hoveredNode){
                    const nw=collW(hoveredNode),nh=collH(hoveredNode);
                    if(hoveredNode.id===srcId){
                      // Same node — slide t along current side
                      const anchor=snapToAnchor(hoveredNode,nw,nh,cx,cy)||{side:"auto"};
                      applyEdges(es=>es.map(ex=>ex.id!==edge.id?ex:{...ex,
                        ...(isFrom?{fromAnchor:anchor}:{toAnchor:anchor})}));
                    } else {
                      // Different node — reattach
                      const anchor=snapToAnchor(hoveredNode,nw,nh,cx,cy)||{side:"auto"};
                      applyEdges(es=>es.map(ex=>ex.id!==edge.id?ex:{...ex,
                        ...(isFrom?{from:hoveredNode.id,fromAnchor:anchor}:{to:hoveredNode.id,toAnchor:anchor})}));
                    }
                  }
                };
                const onUp=()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
                window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
              };
              return(<>
                {/* FROM handle — green circle */}
                <circle cx={fp.x} cy={fp.y} r="8" fill="var(--success)" stroke="var(--bg2)" strokeWidth="2" opacity="0.9"
                  style={{cursor:"grab",pointerEvents:"all"}} onMouseDown={handleEndpointDrag(true)}/>
                <circle cx={fp.x} cy={fp.y} r="3" fill="#fff" opacity="0.8" style={{pointerEvents:"none"}}/>
                {/* TO handle — blue circle */}
                <circle cx={tp.x} cy={tp.y} r="8" fill="var(--accent)" stroke="var(--bg2)" strokeWidth="2" opacity="0.9"
                  style={{cursor:"grab",pointerEvents:"all"}} onMouseDown={handleEndpointDrag(false)}/>
                <circle cx={tp.x} cy={tp.y} r="3" fill="#fff" opacity="0.8" style={{pointerEvents:"none"}}/>
                {/* Reset anchor button — tiny x near midpoint */}
                {(edge.fromAnchor||edge.toAnchor||edge.midOff)&&(
                  <text x={mid.x+14} y={mid.y-14} fill="var(--text4)" fontSize="10" textAnchor="middle"
                    style={{cursor:"pointer",pointerEvents:"all"}} fontFamily="var(--font-ui)"
                    onClick={ev=>{ev.stopPropagation();applyEdges(es=>es.map(ex=>ex.id!==edge.id?ex:{...ex,fromAnchor:null,toAnchor:null,midOff:null}));}}>
                    ↺
                  </text>
                )}
              </>);
            })()}
          </g>
        );
        }); // end edges.map
    return (

    <svg className="nn-edges" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
      <defs>
        {/* Forward markers (markerEnd) */}
        <marker id="nn-arr" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">
          <polygon points="0 0, 10 4, 0 8" fill="var(--accent)"/>
        </marker>
        <marker id="nn-tk" markerWidth="8" markerHeight="7" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <polygon points="0 0, 8 3.5, 0 7" fill="var(--accent)"/>
        </marker>
        <marker id="nn-dbl" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto" markerUnits="strokeWidth">
          <polyline points="0 1, 5 4, 0 7" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
          <polyline points="4 1, 9 4, 4 7" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
        </marker>
        {/* Reverse markers (markerStart) — auto-start-reverse flips direction */}
        <marker id="nn-arr-r" markerWidth="10" markerHeight="8" refX="0" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth">
          <polygon points="0 0, 10 4, 0 8" fill="var(--accent)"/>
        </marker>
        <marker id="nn-tk-r" markerWidth="8" markerHeight="7" refX="0" refY="3.5" orient="auto-start-reverse" markerUnits="strokeWidth">
          <polygon points="0 0, 8 3.5, 0 7" fill="var(--accent)"/>
        </marker>
        <marker id="nn-dbl-r" markerWidth="12" markerHeight="8" refX="0" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth">
          <polyline points="0 1, 5 4, 0 7" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
          <polyline points="4 1, 9 4, 4 7" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
        </marker>
      </defs>
      {drawingEdge&&(()=>{
        const fn=nodes.find(n=>n.id===drawingEdge.fromId); if(!fn) return null;
        const fw=collW(fn), fh=collH(fn);
        const fp=rectEdgePoint(fn,fw,fh,drawingEdge.mouseX,drawingEdge.mouseY);
        const eps=2; let ndx=0,ndy=0;
        if(Math.abs(fp.y-fn.y)<eps) ndy=-1;
        else if(Math.abs(fp.y-(fn.y+fh))<eps) ndy=1;
        else if(Math.abs(fp.x-fn.x)<eps) ndx=-1;
        else ndx=1;
        const dist=Math.sqrt((drawingEdge.mouseX-fp.x)**2+(drawingEdge.mouseY-fp.y)**2);
        const ctrl=Math.max(50,dist*0.4);
        const c1x=fp.x+ndx*ctrl, c1y=fp.y+ndy*ctrl;
        return <path d={`M ${fp.x} ${fp.y} C ${c1x} ${c1y}, ${drawingEdge.mouseX} ${drawingEdge.mouseY-20}, ${drawingEdge.mouseX} ${drawingEdge.mouseY}`}
          stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="6,4" opacity=".9" markerEnd="url(#nn-arr)"/>;
      })()}
      {edgeElements}
      {stackEdgeElements}

    </svg>
  );
  };

  const renderNodes = () => {
    // ── Compute note stacks ──────────────────────────────────
    // A note node joins a stack only if it has EXACTLY ONE non-note parent
    const noteParents = {}; // noteId → [parentId, ...]
    edges.forEach(e => {
      const fromNode = nodes.find(n=>n.id===e.from);
      const toNode   = nodes.find(n=>n.id===e.to);
      if (toNode?.type==='note' && fromNode?.type!=='note') {
        noteParents[e.to] = noteParents[e.to] || [];
        noteParents[e.to].push(e.from);
      }
      if (fromNode?.type==='note' && toNode?.type!=='note') {
        noteParents[e.from] = noteParents[e.from] || [];
        noteParents[e.from].push(e.to);
      }
    });

    // Group: parentId → [noteNode, ...] where note has exactly 1 non-note parent
    const stacks = {}; // parentId → noteNode[]
    nodes.forEach(n => {
      if (n.type !== 'note') return;
      const parents = noteParents[n.id] || [];
      if (parents.length === 1) {
        const pid = parents[0];
        stacks[pid] = stacks[pid] || [];
        stacks[pid].push(n);
      }
    });

    // Only stack if 2+ notes share a parent
    const stackedNoteIds = new Set();
    const activeStacks = {}; // parentId → noteNode[]
    Object.entries(stacks).forEach(([pid, notes]) => {
      if (notes.length >= 2) {
        activeStacks[pid] = notes;
        notes.forEach(n => stackedNoteIds.add(n.id));
      }
    });

    // Render stacks (one per parent group)
    const stackElements = Object.entries(activeStacks).map(([parentId, stackNotes]) => {
      const parentNode = nodes.find(n=>n.id===parentId);
      const isExpanded = expandedStacks.has(parentId);
      // Position: average of all notes in stack
      const avgX = stackNotes.reduce((s,n)=>s+n.x,0)/stackNotes.length;
      const avgY = stackNotes.reduce((s,n)=>s+n.y,0)/stackNotes.length;

      const toggleStack = (e) => {
        e.stopPropagation();
        setExpandedStacks(prev => {
          const next = new Set(prev);
          next.has(parentId) ? next.delete(parentId) : next.add(parentId);
          return next;
        });
      };

      const handleStackDrag = (clientX, clientY) => {
        // Move all notes in stack together
        stackNotes.forEach(n => startDrag(clientX, clientY, n.id));
      };

      const isFocused = focusMode && stackNotes.some(n=>selected.has(n.id));
      const focusDim = focusMode && !isFocused ? '0.15' : '1';
      const t = NT.note;

      return (
        <div key={`stack-${parentId}`}
          style={{
            position:'absolute', left:avgX, top:avgY,
            width:240, zIndex:5,
            opacity:focusMode&&!isFocused?0.08:1, filter:focusMode&&!isFocused?'blur(1.5px)':'none', transition:'opacity .25s,filter .25s',
          }}>
          {/* Stack card */}
          <div
            onMouseDown={e=>{ e.stopPropagation(); if(!isExpanded) startDrag(e.clientX,e.clientY,stackNotes[0].id); }}
            style={{
              background:'var(--node-bg)',
              border:`var(--node-border-w) solid ${t.color}65`,
              borderRadius:'var(--radius-node)',
              boxShadow:'var(--shadow-node)',
              overflow:'hidden',
              cursor: isExpanded ? 'default' : 'grab',
              // Stack visual: offset shadows underneath
              '--stack-shadow': `3px 3px 0 1px ${t.color}22`,
            }}>
            {/* Stack header */}
            <div style={{background:`${t.color}1a`,borderBottom:`1px solid ${t.color}28`,padding:'7px 10px 6px',
              display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}
              onClick={toggleStack}>
              <span style={{fontSize:14}}>📝</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--text)',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {stackNotes.length} notes
                </div>
                {parentNode && (
                  <div style={{fontSize:9,color:`${t.color}99`,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    → {parentNode.title}
                  </div>
                )}
              </div>
              <span style={{fontSize:10,color:'var(--text4)',flexShrink:0}}>
                {isExpanded ? '▲' : '▼'}
              </span>
            </div>

            {/* Collapsed: stacked card preview lines */}
            {!isExpanded && (
              <div style={{padding:'6px 10px',display:'flex',flexDirection:'column',gap:2}}>
                {stackNotes.slice(0,3).map((n,i)=>(
                  <div key={n.id} style={{fontSize:10,color:'var(--text4)',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                    opacity:1-(i*0.25)}}>
                    {n.title||'Note'}
                  </div>
                ))}
                {stackNotes.length>3&&(
                  <div style={{fontSize:9,color:'var(--text4)',opacity:.4}}>
                    +{stackNotes.length-3} more…
                  </div>
                )}
              </div>
            )}

            {/* Expanded: accordion rows */}
            {isExpanded && (
              <div style={{maxHeight:400,overflowY:'auto'}}>
                {stackNotes.map((n,i)=>{
                  const rowExpanded = expandedStackRows.has(n.id);
                  return (
                    <div key={n.id} style={{borderBottom:i<stackNotes.length-1?`1px solid ${t.color}18`:'none'}}>
                      {/* Row header */}
                      <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 10px',
                        cursor:'pointer',background:rowExpanded?`${t.color}08`:'transparent'}}
                        onClick={e=>{
                          e.stopPropagation();
                          setExpandedStackRows(prev=>{
                            const next=new Set(prev);
                            next.has(n.id)?next.delete(n.id):next.add(n.id);
                            return next;
                          });
                        }}>
                        <span style={{fontSize:9,color:t.color,flexShrink:0}}>{rowExpanded?'▾':'▸'}</span>
                        <span style={{fontSize:11,fontWeight:600,color:'var(--text)',flex:1,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {n.title||'Note'}
                        </span>
                        {n.notes_private&&<span style={{fontSize:9,color:'var(--danger)',flexShrink:0}}>🔒</span>}
                        {canEdit&&editMode&&(
                          <button onClick={e=>{e.stopPropagation();setNodePopup({nodeId:n.id,tab:'notes'});}}
                            style={{background:'none',border:'none',color:'var(--text4)',cursor:'pointer',
                              fontSize:10,padding:'0 2px',flexShrink:0}}
                            title="Edit">✎</button>
                        )}
                      </div>
                      {/* Row content */}
                      {rowExpanded&&n.node_notes&&(
                        <div style={{padding:'0 10px 8px 22px',fontSize:10,color:'var(--text3)',
                          lineHeight:1.6,borderTop:`1px solid ${t.color}10`}}>
                          <FormattedContent content={n.node_notes}/>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pseudo-stack depth lines behind card */}
          <div style={{position:'absolute',top:3,left:3,right:-3,bottom:-3,
            background:'var(--node-bg)',border:`1px solid ${t.color}35`,
            borderRadius:'var(--radius-node)',zIndex:-1}}/>
          <div style={{position:'absolute',top:6,left:6,right:-6,bottom:-6,
            background:'var(--node-bg)',border:`1px solid ${t.color}20`,
            borderRadius:'var(--radius-node)',zIndex:-2}}/>
        </div>
      );
    });

    // ── Render individual nodes (skip stacked ones) ──────────
    const nodeElements = nodes.map(node=>{
      // Skip note nodes that belong to an active stack
      if (node.type==='note' && stackedNoteIds.has(node.id)) return null;
    const t=NT[node.type]||NT.note;
    const isSel=selected.has(node.id);
    const isGroup=node.type==="group";
    const isCollapsed=node.collapsed;
    const nw=isCollapsed?COL_W:node.w;
    const nh=isCollapsed?COL_H:node.h;
    const isFocused=(focusMode&&(editingTitle===node.id||editingNotes===node.id||selected.has(node.id)));
    const focusDim=focusMode&&!isFocused?"0.15":"1";

    if(isCollapsed) return(
      <div key={`fc-${node.id}`} style={{opacity:focusMode&&!isFocused?0.08:1,filter:focusMode&&!isFocused?'blur(1.5px)':'none',transition:'opacity .25s,filter .25s'}}>
        <CollapsedNode node={node} t={t} isSel={isSel}
          canEdit={canEdit&&editMode} mode={mode}
          onMouseDown={e=>{e.stopPropagation();startDrag(e.clientX,e.clientY,node.id);}}
          onTouchStart={e=>{e.stopPropagation();startDrag(e.touches[0].clientX,e.touches[0].clientY,node.id);}}
          onClick={e=>handleNodeClick(e,node.id)}
          onContextMenu={e=>handleNodeRightClick(e,node.id)}
          onToggleCollapse={e=>{e.stopPropagation();toggleCollapse(node.id);}}
        />
      </div>
    );

    return(
      <div key={node.id} className="nn-node" data-ui={`node-${node.id}`} data-component="NodeCard" data-page="canvas" data-role="node" data-variant={node.type}
        ref={el=>{ if(el) nodeHeightsRef.current[node.id]=el.getBoundingClientRect().height/zoom; }}
        onMouseDown={e=>{e.stopPropagation();if(editingTitle!==node.id)startDrag(e.clientX,e.clientY,node.id);}}
        onTouchStart={e=>{e.stopPropagation();startDrag(e.touches[0].clientX,e.touches[0].clientY,node.id);}}
        onClick={e=>handleNodeClick(e,node.id)}
        onContextMenu={e=>handleNodeRightClick(e,node.id)}
        onDoubleClick={e=>{
          e.stopPropagation();
          if(node.type==="note") {
            if(propsMode==='popup') setNodePopup({nodeId:node.id,tab:'notes'});
            else { setSelectedNode(node.id); setNodePanelTab('notes'); }
          } else if(propsMode==='popup') setNodePopup({nodeId:node.id,tab:'notes'});
          else if(canEdit&&editMode) setEditingTitle(node.id);
        }}
        style={{
          opacity: focusMode ? (isFocused ? 1 : 0.08) : 1,
          filter: focusMode && !isFocused ? "blur(1.5px)" : "none",
          transition:"opacity .25s, filter .25s, transform var(--t-fast) var(--ease-out), box-shadow var(--t-fast) var(--ease-out)",
          position:"absolute",left:node.x,top:node.y,width:nw,minHeight:nh,
          background:isGroup?`${t.color}10`:"var(--node-bg)",
          border:`1px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
          borderTop: isGroup ? `1px dashed ${t.color}65` : `3px solid ${t.color}`,
          borderRadius:"var(--radius-node)",
          boxShadow:isSel?"var(--shadow-node-sel)":"var(--shadow-node)",
          cursor:mode==="connect"?"crosshair":canEdit&&editMode?"grab":"default",
          userSelect:"none",overflow:"hidden",touchAction:"none",
          outline:searchHitIds.has(node.id)&&!isSel?"2px solid var(--success)":selected.size>1&&isSel?"2px solid var(--accent)":"none",
          outlineOffset:searchHitIds.has(node.id)&&!isSel?"2px":"0",
        }}>
        {/* Header */}
        <div style={{background:`${t.color}10`,borderBottom:`1px solid ${t.color}18`,padding:"8px 10px 6px"}}>

          {/* ── Row 1: icon + title + comment + collapse in ONE line ── */}
          <div style={{display:"flex",alignItems:"center",gap:5,minHeight:22}}>

            {/* Icon */}
            <NodeIcon icon={t.icon} size={14} color={t.color} />

            {/* Title — editable inline */}
            <div style={{flex:1,minWidth:0}}>
              {editingTitle===node.id?(
                <input autoFocus value={node.title}
                  onChange={e=>{e.stopPropagation();updateNode(node.id,{title:e.target.value});}}
                  onMouseDown={e=>e.stopPropagation()}
                  onBlur={()=>setEditingTitle(null)}
                  onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter"||e.key==="Escape")setEditingTitle(null);}}
                  style={{width:"100%",background:"var(--bg)",borderRadius:"var(--radius-xs)",
                    padding:"1px 5px",color:"var(--text)",fontSize:13,fontFamily:"var(--font-ui)",outline:"none",fontWeight:700,boxSizing:"border-box"}}
                />
              ):(
                <div style={{display:"flex",alignItems:"center",gap:3,minWidth:0}}>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--text)",overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,lineHeight:1.3,
                    cursor:canEdit&&editMode?"text":"default"}}
                    title={node.title}
                    onDoubleClick={e=>{e.stopPropagation();if(canEdit&&editMode)setEditingTitle(node.id);}}>
                    {node.title}
                  </span>
                  {canEdit&&editMode&&(
                    <button className="nn-pencil-btn"
                      onMouseDown={e=>e.stopPropagation()}
                      onClick={e=>{e.stopPropagation();setEditingTitle(node.id);}}
                      title="Edit title (F2)"
                      style={{background:"none",border:"none",cursor:"pointer",padding:"1px 2px",
                        flexShrink:0,opacity:0,transition:"opacity .15s",fontSize:9,color:"var(--text4)",lineHeight:1}}>✎</button>
                  )}
                </div>
              )}
            </div>

            {/* Workflow Audit badge — set by AI analysis, click reveals suggestion */}
            {node.customProps?._auditBadge&&(
              <button
                onMouseDown={e=>e.stopPropagation()}
                onClick={e=>{e.stopPropagation();setAuditBadgePopup({nodeId:node.id,x:e.clientX,y:e.clientY});}}
                title="Flagged automatable by Workflow Audit — click for suggestion"
                style={{background:"var(--warning,#FF9800)22",border:"1px solid var(--warning,#FF9800)77",
                  borderRadius:4,cursor:"pointer",padding:"1px 4px",flexShrink:0,lineHeight:1,
                  fontSize:9,color:"var(--warning,#FF9800)",display:"flex",alignItems:"center",gap:2}}>
                ⚡
              </button>
            )}

            {/* Attached-notes focus — dims everything except this node's notes */}
            {(attachedNotes[node.id]?.length > 0) && (
              <button className="nn-notefocus-btn"
                onMouseDown={e=>e.stopPropagation()}
                onClick={e=>{
                  e.stopPropagation();
                  const ids = attachedNotes[node.id]||[];
                  const already = focusMode && ids.every(i=>selected.has(i)) && selected.has(node.id);
                  if (already) { setFocusMode(false); setSelected(new Set()); }
                  else { setSelected(new Set([node.id, ...ids])); setFocusMode(true); }
                }}
                title={`Focus this node's ${attachedNotes[node.id].length} note${attachedNotes[node.id].length===1?'':'s'}`}
                style={{background:"none",border:"none",cursor:"pointer",padding:"1px 3px",flexShrink:0,
                  lineHeight:1,fontSize:10,fontWeight:700,borderRadius:4,
                  color:"var(--text4)",display:"flex",alignItems:"center",gap:2}}>
                📝<span style={{fontSize:8}}>{attachedNotes[node.id].length}</span>
              </button>
            )}

            {/* Comment icon */}
            <button className="nn-comment-btn"
              onMouseDown={e=>e.stopPropagation()}
              onClick={e=>{e.stopPropagation();setCommentNode(node.id);setShowComments(true);}}
              title={`Comments (${(comments[node.id]||[]).length})`}
              style={{background:"none",border:"none",cursor:"pointer",padding:"1px",flexShrink:0,
                opacity:0,transition:"opacity .15s",lineHeight:1,position:"relative",
                color:(comments[node.id]||[]).length>0?"var(--accent)":"var(--text4)",fontSize:11}}>
              💬
              {(comments[node.id]||[]).length>0&&(
                <span style={{position:"absolute",top:-3,right:-3,fontSize:7,background:"var(--accent)",
                  color:"#fff",borderRadius:"50%",width:10,height:10,display:"flex",alignItems:"center",
                  justifyContent:"center",fontWeight:700}}>
                  {(comments[node.id]||[]).length}
                </span>
              )}
            </button>

            {/* Collapse icon — same line, no gap fight */}
            {canEdit&&(
              <button className="nn-collapse-btn"
                onMouseDown={e=>e.stopPropagation()}
                onClick={e=>{e.stopPropagation();toggleCollapse(node.id);}}
                title={node.collapsed?"Expand node":"Collapse node"}
                style={{background:"none",borderRadius:3,
                  color:t.color,cursor:"pointer",fontSize:9,width:15,height:15,flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,
                  opacity:0,transition:"opacity .15s"}}>
                ⊟
              </button>
            )}
          </div>

          {/* ── Row 2: description (editable) ── */}
          {(node.description||(canEdit&&editMode))&&(
            <div style={{marginTop:2,paddingLeft:25,paddingRight:4}}>
              {inlineEditField?.nodeId===node.id&&inlineEditField?.field==='desc'?(
                <input autoFocus value={node.description||""}
                  onChange={e=>{e.stopPropagation();updateNode(node.id,{description:e.target.value});}}
                  onMouseDown={e=>e.stopPropagation()}
                  onBlur={()=>setInlineEditField(null)}
                  onKeyDown={e=>{e.stopPropagation();if(e.key==="Escape"||e.key==="Enter")setInlineEditField(null);}}
                  placeholder="Add description…"
                  style={{width:"100%",background:"none",border:"none",borderBottom:"1px solid var(--accent)",
                    outline:"none",fontSize:10,color:"var(--text3)",fontFamily:"var(--font-ui)",padding:"0",boxSizing:"border-box"}}
                />
              ):(
                <div style={{display:"flex",alignItems:"center",gap:3}}>
                  <span style={{fontSize:10,color:"var(--text4)",lineHeight:1.3,flex:1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    fontStyle:node.description?"normal":"italic"}}
                    title={node.description||""}>
                    {node.description||(canEdit&&editMode?"Double-click to add description…":"")}
                  </span>
                  {canEdit&&editMode&&(
                    <button className="nn-pencil-btn"
                      onMouseDown={e=>e.stopPropagation()}
                      onClick={e=>{e.stopPropagation();setInlineEditField({nodeId:node.id,field:'desc'});}}
                      title="Edit description"
                      style={{background:"none",border:"none",cursor:"pointer",padding:"0",
                        flexShrink:0,opacity:0,transition:"opacity .15s",fontSize:9,color:"var(--text4)",lineHeight:1}}>✎</button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Row 3: node type — right-aligned, very subtle ── */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:2,paddingRight:2}}>
            {/* IP / Domain quick badge */}
            {(node.properties?.IP||node.properties?.Domain)&&(
              <span style={{fontSize:8,color:`${t.color}99`,letterSpacing:.3,fontFamily:"monospace",
                background:`${t.color}14`,borderRadius:3,padding:"0 4px",userSelect:"none",
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>
                {node.properties.IP||node.properties.Domain}
              </span>
            )}
            <span style={{fontSize:8,color:`${t.color}80`,letterSpacing:.5,fontWeight:400,
              fontFamily:"var(--font-ui)",userSelect:"none",marginLeft:"auto"}}>
              {t.label}
            </span>
          </div>

        </div>
        {/* Body */}
        {!isGroup&&(
          <div style={{padding: node.type==="note" ? "10px 12px" : "var(--node-body-pad)",fontSize:12,color:"var(--text3)",lineHeight:"var(--line-height)"}}>

            {node.type==="note" ? (
              /* ── NOTE NODE: full content inline ── */
              <div>
                {node.notes_private && (
                  <div style={{fontSize:9,color:"var(--danger)",marginBottom:4}}>🔒 Private</div>
                )}
                {(()=>{
                  const content = (node.node_notes||"").trim() ||
                    (Array.isArray(node.notes)?node.notes:[]).map(nt=>
                      ((nt.title?`### ${nt.title}\n`:"")+((nt.content||"").replace(/<[^>]+>/g,"").trim()))
                    ).filter(Boolean).join("\n\n");
                  if(!content) return (
                    <span style={{fontSize:10,color:"var(--text4)",fontStyle:"italic"}}>
                      Double-click to add notes…
                    </span>
                  );
                  // Render markdown inline
                  return <FormattedContent content={content}/>;
                })()}
              </div>
            ) : (
              /* ── OTHER NODES: 2-line preview strip ── */
              ((node.node_notes||"").trim() || (Array.isArray(node.notes)&&node.notes.length>0)) && (
                <div style={{marginTop:4,borderTop:`1px solid ${t.color}20`,paddingTop:4,display:"flex",alignItems:"flex-start",gap:4}}>
                  {node.notes_private
                    ? <span title="Private notes" style={{fontSize:9,color:"var(--danger)",flexShrink:0}}>🔒</span>
                    : <span style={{fontSize:9,color:t.color,flexShrink:0}}>📝</span>
                  }
                  {!node.notes_private && (
                    <span style={{fontSize:9,color:"var(--text4)",lineHeight:1.4,overflow:"hidden",
                      display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                      {((node.node_notes||"").trim() ||
                        (Array.isArray(node.notes)?node.notes:[]).map(nt=>(nt.title?`${nt.title}: `:"")+((nt.content||"").replace(/<[^>]+>/g,"").trim())).join(" · ")
                      ).replace(/^#+\s*/gm,"").replace(/\*\*/g,"").replace(/---/g,"").trim().slice(0,120)}
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        )}
                {/* Anchor dots in connect mode */}
        {mode==="connect"&&canEdit&&!isCollapsed&&(()=>{
          const nw2=collW(node), nh2=collH(node);
          const hCount=Math.max(3,Math.min(7,Math.floor(nw2/60)));
          const vCount=Math.max(3,Math.min(7,Math.floor(nh2/50)));
          const anchors=[];
          for(let i=0;i<hCount;i++){const t=(i+1)/(hCount+1);anchors.push({side:"top",t},{side:"bottom",t});}
          for(let i=0;i<vCount;i++){const t=(i+1)/(vCount+1);anchors.push({side:"left",t},{side:"right",t});}
          return anchors.map((a,i)=>{
            const ax=a.side==="left"?0:a.side==="right"?nw2:nw2*a.t;
            const ay=a.side==="top"?0:a.side==="bottom"?nh2:nh2*a.t;
            return(
              <div key={i} onMouseDown={e=>{e.stopPropagation();setDrawingEdge({fromId:node.id,mouseX:node.x+ax,mouseY:node.y+ay,fromAnchor:{side:a.side,t:a.t}});}}
                style={{position:"absolute",left:ax-5,top:ay-5,width:10,height:10,borderRadius:"50%",
                  background:"var(--accent)",opacity:.7,cursor:"crosshair",zIndex:10,border:"2px solid var(--bg)"}}/>
            );
          });
        })()}
        {/* Resize handle */}
        {canEdit&&editMode&&!isCollapsed&&(
          <div onMouseDown={e=>{e.stopPropagation();setResizing({id:node.id,startX:e.clientX,startY:e.clientY,origW:node.w,origH:node.h});}}
            style={{position:"absolute",bottom:0,right:0,width:12,height:12,cursor:"se-resize",
              background:"transparent",borderRight:`2px solid ${t.color}60`,borderBottom:`2px solid ${t.color}60`}}/>
        )}

      </div>
    );
    }); // end nodeElements map

    return [...stackElements, ...nodeElements.filter(Boolean)];
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--bg)",overflow:"hidden",fontFamily:"var(--font-ui)"}}>

      {/* ── Topbar ── */}
      <div style={{
        background:"var(--bg2)",borderBottom:"1px solid var(--border2)",
        flexShrink:0,overflow:"visible",position:"relative",zIndex:10,
      }}>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ROW 1 — APP BAR
            LEFT:  ⬡ home | ← Maps | map title | save status | presence
            RIGHT: icon-only buttons (tooltip = label) for all app actions
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{height:40,display:"flex",alignItems:"center",gap:0,
          padding:"0 8px",borderBottom:"1px solid var(--border2)"}}
          data-tut="topbar-row1" data-ui="canvas-toolbar-row1" data-component="CanvasToolbar" data-page="canvas" data-role="toolbar" onKeyDown={e=>e.stopPropagation()}>

          {/* ── LEFT: nav + title + presence ── */}
          <div style={{display:"flex",alignItems:"center",gap:4,flex:1,minWidth:0}}>
            <span onClick={onHome} title="Home"
              style={{fontSize:17,cursor:"pointer",padding:"0 3px",userSelect:"none",lineHeight:1}}>⬡</span>
            <button onClick={onBack} style={{...tbtn(false),fontSize:10,padding:"2px 8px"}}
              title="Back to dashboard">← Maps</button>
            <div style={{width:1,height:18,background:"var(--border)",margin:"0 4px",flexShrink:0}}/>

            {/* Map title — click to edit */}
            {editingMapTitle ? (
              <input autoFocus value={editingMapTitle}
                onChange={e=>setEditingMapTitle(e.target.value)}
                onBlur={()=>{
                  if(editingMapTitle.trim()&&editingMapTitle!==mapMeta?.title){
                    apiFetch(`/maps/${mapId}`,{method:"PATCH",
                      body:JSON.stringify({title:editingMapTitle.trim()})})
                      .then(()=>setMapMeta(m=>({...m,title:editingMapTitle.trim()})))
                      .catch(()=>{});
                  }
                  setEditingMapTitle(null);
                }}
                onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape")e.target.blur();e.stopPropagation();}}
                style={{fontSize:12,fontWeight:700,color:"var(--accent)",background:"var(--bg3)",
                  border:"1px solid var(--accent)",borderRadius:4,padding:"1px 6px",outline:"none",
                  maxWidth:180,fontFamily:"var(--font-ui)"}}/>
            ) : (
              <span onClick={()=>setEditingMapTitle(mapMeta?.title||"")}
                title="Click to rename map"
                style={{fontSize:12,fontWeight:700,color:"var(--accent)",maxWidth:160,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",
                  borderBottom:"1px dashed transparent",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderBottomColor="var(--accent)"}
                onMouseLeave={e=>e.currentTarget.style.borderBottomColor="transparent"}>
                {mapMeta?.title}
              </span>
            )}
            {saveMsg&&<span style={{fontSize:9,color:saveMsgColor,whiteSpace:"nowrap",marginLeft:4}}>{saveMsg}</span>}

            {/* Live presence — stacked avatars */}
            {Object.entries(remoteSelections).length>0&&(
              <div data-tut="collab-presence"
                style={{display:"flex",alignItems:"center",gap:2,marginLeft:6,flexShrink:0}}>
                {Object.entries(remoteSelections).map(([uid,rs],i)=>{
                  const initials=(rs.userName||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                  const hasSel=rs.selectedIds&&rs.selectedIds.size>0;
                  return(
                    <div key={uid} title={`${rs.userName}${hasSel?" · selecting":""}`}
                      style={{width:20,height:20,borderRadius:"50%",background:rs.color,color:"#fff",
                        fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                        border:"2px solid var(--bg2)",marginLeft:i>0?-5:0,
                        position:"relative",zIndex:Object.keys(remoteSelections).length-i,
                        boxShadow:hasSel?`0 0 0 2px ${rs.color}55`:"none"}}>
                      {initials}
                      {hasSel&&<div style={{position:"absolute",bottom:-1,right:-1,width:6,height:6,
                        borderRadius:"50%",background:"#22c55e",border:"1.5px solid var(--bg2)"}}/>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: icon-only app actions ── */}
          <div style={{display:"flex",alignItems:"center",gap:1,flexShrink:0}}>

            {/* ── PRIMARY: Copy for AI ── */}
            <button onClick={copyForAI} data-ui="copy-for-ai"
              style={{...tbtn(false,"var(--accent)"),display:"flex",alignItems:"center",gap:5,
                border:"1px solid var(--accent)55",color:"var(--accent)",fontWeight:700,
                padding:"3px 10px",whiteSpace:"nowrap"}}
              title="Copy this map as AI context — paste into any chatbot">
              <Sparkles size={12}/> Copy for AI</button>

            <div style={{width:1,height:18,background:"var(--border)",margin:"0 3px",flexShrink:0}}/>

            <div style={{position:"relative"}}>
              <button onClick={()=>setShowExportMenu(v=>!v)}
                style={tbtn(showExportMenu,"var(--accent2)")}
                data-tut="export" title="Export map">↗</button>
              {showExportMenu&&(<>
                <div style={{position:"fixed",inset:0,zIndex:500}} onClick={()=>setShowExportMenu(false)}/>
                <div style={{position:"absolute",top:"100%",right:0,marginTop:4,zIndex:501,
                  background:"var(--bg2)",
                  borderRadius:"var(--radius-md)",boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
                  minWidth:180,overflow:"hidden"}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1,color:"var(--text4)",padding:"8px 12px 4px"}}>EXPORT AS</div>
                  {[["🤖","LLM Text","For AI context"],["{}","JSON","Raw data backup"],
                    ["🖼","PNG Image","Visual snapshot"],["📦",".nonote","Re-importable bundle"],
                    ["🌐","HTML View","Interactive read-only"],["📝","Markdown","Documentation"],
                    ["🖨","PDF","Print / Save as PDF"],
                    ["📄","Word (.docx)","Traditional documentation"],
                    ["🤖","AI Word (.docx)","LLM-interpreted documentation"],
                    ["🖨","PDF Export","Print-ready documentation page"],
                    ["🤖","AI PDF Export","LLM-interpreted PDF page"]].map(([ic,lbl,desc],i)=>(
                    <div key={i} onClick={()=>{setShowExportMenu(false);
                      if(i===2) exportAsPNG(nodes,edges,mapMeta?.title);
                      else if(i===3) exportAsNoNote(nodes,edges,mapMeta);
                      else if(i===4) exportAsHTML(nodes,edges,mapMeta?.title);
                      else if(i===5) exportAsDoc(nodes,mapMeta?.title);
                      else if(i===6) exportAsPDF(nodes,edges,mapMeta?.title);
                      else if(i===7){setDocExportMode("normal-docx");setShowDocExport(true);}
                      else if(i===8){setDocExportMode("ai-docx");setShowDocExport(true);}
                      else if(i===9){setDocExportMode("normal-pdf");setShowDocExport(true);}
                      else if(i===10){setDocExportMode("ai-pdf");setShowDocExport(true);}
                      else setShowExport(true);}}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="var(--shadow-node-xs,2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight))"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                      <span style={{fontSize:15,minWidth:20,textAlign:"center"}}>{ic}</span>
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:"var(--text)"}}>{lbl}</div>
                        <div style={{fontSize:9,color:"var(--text4)"}}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>)}
            </div>

            <button onClick={()=>{setShowShare(true);
                if(mapId)apiFetch(`/maps/${mapId}/collaborators`)
                  .then(d=>setShareUsers(Array.isArray(d)?d:[])).catch(()=>{});}}
              style={tbtn(false,"var(--accent2)")} data-tut="share" title="Share &amp; Collaborate"><Users size={13}/></button>

            <button onClick={()=>{setShowSearch(v=>!v);if(!showSearch)setSearchQuery("");}}
              style={tbtn(showSearch,"var(--accent2)")}
              data-tut="find" title="Find in map (Ctrl+F)"><Search size={13}/></button>

            <button onClick={()=>{setShowCmdK(true);setCmdQ("");}}
              style={{...tbtn(showCmdK,"var(--accent2)"),display:"flex",alignItems:"center",gap:3}}
              title="Command palette (Ctrl+K)"><Command size={12}/><span style={{fontSize:9,opacity:.7}}>K</span></button>

            <div style={{width:1,height:18,background:"var(--border)",margin:"0 3px",flexShrink:0}}/>

            {/* ── Zoom control ── */}
            <div style={{display:"flex",alignItems:"center",
              borderRadius:"var(--radius-sm)",overflow:"hidden",flexShrink:0}}>
              <button onClick={()=>setZoom(z=>Math.max(0.2,+(z-0.1).toFixed(1)))}
                style={{...tbtn(false),padding:"2px 6px",borderRadius:0,fontSize:13,border:"none"}}>−</button>
              <span onClick={()=>setZoom(1)}
                style={{fontSize:9,color:"var(--text3)",cursor:"pointer",minWidth:32,
                  textAlign:"center",userSelect:"none"}}>{Math.round(zoom*100)}%</span>
              <button onClick={()=>setZoom(z=>Math.min(3,+(z+0.1).toFixed(1)))}
                style={{...tbtn(false),padding:"2px 6px",borderRadius:0,fontSize:13,border:"none"}}>＋</button>
            </div>

            <div style={{width:1,height:18,background:"var(--border)",margin:"0 3px",flexShrink:0}}/>

            {/* ── ⋯ More — everything else, one calm menu ── */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowMore(v=>!v)} style={tbtn(showMore,"var(--accent2)")}
                title="More — templates, history, import, appearance, help"><MoreHorizontal size={14}/></button>
              {showMore&&(<>
                <div style={{position:"fixed",inset:0,zIndex:500}} onClick={()=>setShowMore(false)}/>
                <div className="nn-drop" style={{position:"absolute",top:"100%",right:0,marginTop:4,zIndex:501,
                  background:"var(--bg2)",borderRadius:"var(--radius-md)",
                  boxShadow:"var(--shadow-panel)",border:"1px solid var(--border2)",
                  minWidth:200,overflow:"hidden",padding:4}}>
                  {[
                    [<HistoryIcon size={13}/>,"History & versions","V",()=>{setShowVersions(true);if(!showCollabLog)apiFetch(`/maps/${mapId}/changelog`).then(d=>setCollabLog(Array.isArray(d)?d:[])).catch(()=>{});}],
                    [<ClipboardList size={13}/>,"Templates","",()=>setShowTemplates(true)],
                    [<Zap size={13}/>,"Workflow Audit","",()=>setShowWorkflowAudit(true)],
                    [<Palette size={13}/>,"Appearance","",()=>setShowAppearance(true)],
                    [<HelpCircle size={13}/>,"Help & docs","",()=>setShowHelp(true)],
                    [<GraduationCap size={13}/>,"Guided tour","",()=>setShowTutorial(true)],
                  ].map(([ic,lbl,kbd,act],i)=>(
                    <div key={i} onClick={()=>{act();setShowMore(false);}}
                      style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",cursor:"pointer",
                        fontSize:11,color:"var(--text2)",borderRadius:"var(--radius-sm)"}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{opacity:.75,display:"flex"}}>{ic}</span>{lbl}
                      {kbd&&<span style={{marginLeft:"auto",fontSize:9,color:"var(--text4)"}}>{kbd}</span>}
                    </div>
                  ))}
                  <label style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",cursor:"pointer",
                      fontSize:11,color:"var(--text2)",borderRadius:"var(--radius-sm)"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{opacity:.75,display:"flex"}}><Import size={13}/></span>Import .nonote / JSON
                    <input type="file" accept=".nonote,.json" style={{display:"none"}}
                      onChange={e=>{
                        const f=e.target.files?.[0]; if(!f) return;
                        const r=new FileReader();
                        r.onload=ev=>{
                          try{
                            const b=JSON.parse(ev.target.result);
                            if(b.app==="NoNote"&&b.nodes){
                              const ns=b.nodes.map(n=>({...n,notes:Array.isArray(n.notes)?n.notes:[],collapsed:false}));
                              applyNodes(()=>ns); applyEdges(()=>b.edges||[]);
                              alert(`Imported "${b.title}" — ${ns.length} nodes`);
                            } else { alert("Not a valid .nonote file"); }
                          } catch{ alert("Could not read file"); }
                          e.target.value=""; setShowMore(false);
                        };
                        r.readAsText(f);
                      }}/>
                  </label>
                  <div style={{height:1,background:"var(--border2)",margin:"4px 6px"}}/>
                  <div onClick={()=>{logout();}}
                    style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",cursor:"pointer",
                      fontSize:11,color:"var(--danger)",borderRadius:"var(--radius-sm)"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--danger)15"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{opacity:.85,display:"flex"}}><LogOut size={13}/></span>Log out
                  </div>
                </div>
              </>)}
            </div>

            <button onClick={()=>setShowChangelog(true)}
              style={{...tbtn(false),fontSize:8,padding:"2px 6px",color:"var(--accent)",
                border:"1px solid var(--border30,var(--border))",whiteSpace:"nowrap"}}
              title="What's new">{CURRENT_VERSION}✦</button>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ROW 2 — EDITING TOOLBAR
            Left:  Mode controls (what mode are you in)
            Mid:   Drawing tools (what you're creating)
            Right: Selection tools (what happens to selected items)
                   + Side panels (AI chat, comments)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{height:36,display:"flex",alignItems:"center",gap:0,padding:"0 8px"}}
          onKeyDown={e=>e.stopPropagation()}>

          {/* ── MODE GROUP ── think/build + edit/view + props mode ── */}
          <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
            {/* Think / Build — capture vs. diagram */}
            <div style={{display:"flex",alignItems:"center",background:"var(--bg3)",borderRadius:"var(--radius-md)",overflow:"hidden",flexShrink:0}}
              title="Think — frictionless capture. Build — full diagramming toolkit.">
              {[["think",<Feather size={11} key="f"/>,"Think"],["build",<Hammer size={11} key="h"/>,"Build"]].map(([m,ic,lbl])=>(
                <button key={m} onClick={()=>setCanvasModePersist(m)}
                  style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",border:"none",cursor:"pointer",
                    fontSize:10,fontWeight:700,fontFamily:"var(--font-ui)",
                    background:canvasMode===m?"var(--accent)":"transparent",
                    color:canvasMode===m?"#fff":"var(--text4)",transition:"all .15s"}}>
                  {ic}{lbl}
                </button>
              ))}
            </div>
            {canEdit&&(
              <button onClick={()=>setEditMode(v=>!v)}
                style={{...tbtn(!editMode,"var(--success)"),minWidth:58}}
                data-tut="edit-mode" title="Toggle edit/view mode (E)">
                {editMode?"✏ Edit":"👁 View"}
              </button>
            )}
            {/* POPUP / PANEL — how you open node details */}
            {canvasMode!=="think"&&<div style={{display:"flex",alignItems:"center",background:"var(--bg3)",borderRadius:"var(--radius-md)",overflow:"hidden",flexShrink:0}}
              title="How to view node details">
              <button onClick={()=>{setPropsMode('popup');setShowProps(false);setNodePopup(null);}}
                style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",border:"none",cursor:"pointer",
                  fontSize:10,fontWeight:700,fontFamily:"var(--font-ui)",
                  background:propsMode==='popup'?"var(--accent2)":"transparent",
                  color:propsMode==='popup'?"#fff":"var(--text4)",
                  borderRight:"1px solid var(--border)",transition:"all .15s"}}
                title="Popup — double-click any node">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="3.5" y="3.5" width="4" height="4" rx=".8" fill="currentColor" opacity=".7"/>
                </svg>
                Popup
              </button>
              <button onClick={()=>{setPropsMode('panel');setNodePopup(null);if(selected.size===1)setShowProps(true);}}
                style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",border:"none",cursor:"pointer",
                  fontSize:10,fontWeight:700,fontFamily:"var(--font-ui)",
                  background:propsMode==='panel'?"var(--accent2)":"transparent",
                  color:propsMode==='panel'?"#fff":"var(--text4)",
                  transition:"all .15s"}}
                title="Side panel — click any node">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x=".75" y="1" width="9.5" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <line x1="7" y1="1" x2="7" y2="10" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
                Panel
              </button>
            </div>}
          </div>

          {canvasMode==="think"&&(
            <span style={{fontSize:10,color:"var(--text4)",marginLeft:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              Double-click: new thought · <b>Enter</b>: sibling · <b>Tab</b>: child · <b>Space</b>: quick capture · <b>Ctrl+K</b>: jump anywhere
            </span>
          )}

          {editMode&&canEdit&&canvasMode!=="think"&&<>
            <div style={{width:1,height:20,background:"var(--border)",flexShrink:0,margin:"0 6px"}}/>

            {/* ── DRAWING TOOLS GROUP ── what you're creating/arranging ── */}
            <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
              <button onClick={()=>{setMode("select");setDrawingEdge(null);}} data-tut="mode-select" style={tbtn(mode==="select","var(--accent2)")} title="Select mode (S)">↖ Select</button>
              <button onClick={()=>{setMode(m=>m==="connect"?"select":"connect");setDrawingEdge(null);}} data-tut="mode-connect" style={tbtn(mode==="connect","var(--accent2)")} title="Connect nodes (C)">⤳ Connect</button>
              <button onClick={()=>setMode(m=>m==="groupbox"?"select":"groupbox")}
                data-tut="mode-group" style={tbtn(mode==="groupbox","var(--accent2)")} title="Draw group box (G)">▭ Group</button>

              {/* Connection style — only in connect mode */}
              {mode==="connect"&&(
                <div style={{position:"relative"}}>
                  <button onClick={()=>setShowConnDropdown(v=>!v)}
                    style={{...tbtn(showConnDropdown,"var(--accent2)"),display:"flex",alignItems:"center",gap:4}}
                    title={`Style: ${EDGE_STYLES[edgeStyle]?.label}`}>
                    <EdgeIcon styleKey={edgeStyle} size={24} active/>
                    <span style={{fontSize:9,color:"var(--text3)",maxWidth:40,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{EDGE_STYLES[edgeStyle]?.label}</span>
                    <span style={{fontSize:8,opacity:.6}}>▾</span>
                  </button>
                  {showConnDropdown&&(<>
                    <div style={{position:"fixed",inset:0,zIndex:500}} onClick={()=>setShowConnDropdown(false)}/>
                    <div style={{position:"absolute",top:"100%",left:0,marginTop:4,zIndex:501,background:"var(--bg)",border:"none",outline:"2px solid var(--accent)44",borderRadius:"var(--radius-md)",boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",width:292,overflow:"hidden"}}>
                      {EDGE_SECTIONS.map(section=>{
                        const ss=Object.entries(EDGE_STYLES).filter(([,s])=>s.section===section);
                        return(<div key={section}>
                          <div style={{padding:"5px 10px 3px",fontSize:8,fontWeight:700,letterSpacing:1,color:"var(--text4)",background:"var(--bg3)",borderBottom:"1px solid var(--border2)"}}>{section.toUpperCase()}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:2,padding:"6px 8px"}}>
                            {ss.map(([key,style])=>(
                              <div key={key} title={`${style.label} — ${style.desc}`}
                                onClick={()=>{setEdgeStyle(key);setShowConnDropdown(false);}}
                                style={{width:80,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 4px",borderRadius:"var(--radius-sm)",cursor:"pointer",border:`1.5px solid ${edgeStyle===key?"var(--accent)":"transparent"}`,background:edgeStyle===key?"var(--accent)14":"transparent",transition:"all .1s"}}
                                onMouseEnter={e=>{if(edgeStyle!==key)e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)";}}
                                onMouseLeave={e=>{if(edgeStyle!==key)e.currentTarget.style.boxShadow="";}}>
                                <EdgeIcon styleKey={key} size={56} active={edgeStyle===key} color={edgeStyle===key?"var(--accent)":"var(--text3)"}/>
                                <span style={{fontSize:9,color:edgeStyle===key?"var(--accent)":"var(--text4)",textAlign:"center",lineHeight:1.2,maxWidth:76,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{style.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>);
                      })}
                      <div style={{padding:"8px 12px",borderTop:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:8,background:"var(--bg3)"}}>
                        <span style={{fontSize:9,fontWeight:700,color:"var(--text4)"}}>COLOR</span>
                        <div style={{width:20,height:20,borderRadius:"50%",background:edgeColor==="var(--accent)"?"var(--accent)":edgeColor,border:"2px solid var(--border)",cursor:"pointer",overflow:"hidden"}}>
                          <input type="color" defaultValue="#58a6ff" onChange={e=>setEdgeColor(e.target.value)} style={{opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",padding:0}}/>
                        </div>
                        {["#58a6ff","#3fb950","#f78166","#d2a8ff","#ffa657","#ffffff"].map(c=>(
                          <div key={c} onClick={()=>setEdgeColor(c)} style={{width:16,height:16,borderRadius:"50%",background:c,cursor:"pointer",flexShrink:0,border:(edgeColor===c||edgeColor==="var(--accent)"&&c==="#58a6ff")?"2px solid #fff":"2px solid transparent"}}/>
                        ))}
                        <button onClick={()=>setEdgeColor("var(--accent)")} style={{marginLeft:"auto",fontSize:9,background:"none",borderRadius:3,padding:"2px 6px",color:"var(--text4)",cursor:"pointer",fontFamily:"var(--font-ui)"}}>↺</button>
                      </div>
                    </div>
                  </>)}
                  {drawingEdge&&<span style={{fontSize:10,color:"#f78166",marginLeft:4,animation:"pulse 1s infinite",flexShrink:0}}>● pick target</span>}
                </div>
              )}

              <div style={{width:1,height:18,background:"var(--border)",flexShrink:0,margin:"0 4px"}}/>

              {/* Edge routing: curved vs orthogonal */}
              <div style={{display:"flex",alignItems:"center",background:"var(--bg3)",borderRadius:"var(--radius-sm)",overflow:"hidden",flexShrink:0}}
                title="Connector style — Orthogonal routes around nodes at right angles and never overlaps">
                {[["curved","⌒","Curved"],["ortho","⌐","Right-angle"]].map(([m,ic,lbl])=>(
                  <button key={m} onClick={()=>setEdgeRoutingPersist(m)}
                    style={{padding:"4px 8px",border:"none",cursor:"pointer",fontSize:11,
                      fontFamily:"var(--font-ui)",fontWeight:700,
                      background:edgeRouting===m?"var(--accent2)":"transparent",
                      color:edgeRouting===m?"#fff":"var(--text4)",transition:"all .15s"}}
                    title={lbl}>{ic}</button>
                ))}
              </div>

              {/* Layout with direction picker */}
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{display:"flex",borderRadius:"var(--radius-sm)",overflow:"hidden"}}>
                  <button onClick={()=>handleAutoLayout()} style={{...tbtn(false),borderRadius:0,padding:"4px 9px",fontSize:11,borderRight:"1px solid var(--border)"}}
                    title="Auto-arrange (Ctrl+Enter)">
                    ⊞ Arrange
                  </button>
                  <button data-ui="toolbar-layout" data-component="CanvasToolbar" data-page="canvas" data-role="action-btn" onClick={()=>setShowLayoutMenu(v=>!v)} data-tut="layout-btn"
                    style={{...tbtn(showLayoutMenu,"var(--accent2)"),borderRadius:0,padding:"4px 6px",fontSize:10}}
                    title="Choose layout direction">
                    {{LR:"→",TB:"↓",RL:"←",BT:"↑",radial:"◎"}[layoutDir]||"→"} ▾
                  </button>
                </div>
                {showLayoutMenu&&(<>
                  <div style={{position:"fixed",inset:0,zIndex:500}} onClick={()=>setShowLayoutMenu(false)}/>
                  <div style={{position:"absolute",top:"100%",left:0,marginTop:4,zIndex:501,background:"var(--bg2)",
                    borderRadius:"var(--radius-md)",boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
                    padding:6,minWidth:190,overflow:"hidden"}}>
                    <div style={{fontSize:9,fontWeight:700,color:"var(--text4)",letterSpacing:1,padding:"4px 8px 6px"}}>LAYOUT DIRECTION</div>
                    {[
                      ["LR","→","Left → Right","Hierarchical tree flowing right (default)"],
                      ["TB","↓","Top → Bottom","Classic org chart / flowchart"],
                      ["RL","←","Right → Left","Reverse horizontal tree"],
                      ["BT","↑","Bottom → Top","Reverse vertical / timeline"],
                      ["radial","◎","Radial","Root in center, children spread outward"],
                    ].map(([dir,icon,label,desc])=>(
                      <div key={dir}
                        onClick={()=>{setLayoutDir(dir);setShowLayoutMenu(false);handleAutoLayout(dir);}}
                        style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",cursor:"pointer",
                          borderRadius:"var(--radius-sm)",
                          background:layoutDir===dir?"var(--accent2)20":"transparent",
                          border:layoutDir===dir?"1px solid var(--accent2)":"1px solid transparent",
                          marginBottom:2}}
                        onMouseEnter={e=>{if(layoutDir!==dir)e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"}}
                        onMouseLeave={e=>{if(layoutDir!==dir)e.currentTarget.style.boxShadow=""}}>
                        <NodeIcon icon={icon} size={16} />
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:layoutDir===dir?"var(--accent2)":"var(--text)"}}>{label}</div>
                          <div style={{fontSize:9,color:"var(--text4)"}}>{desc}</div>
                        </div>
                        {layoutDir===dir&&<span style={{marginLeft:"auto",color:"var(--accent2)",fontSize:12}}>✓</span>}
                      </div>
                    ))}
                  </div>
                </>)}
              </div>
              <button onClick={globalCollapsed?expandAll:collapseAll} style={tbtn(globalCollapsed,"var(--accent2)")} title="Collapse / Expand all nodes">
                {globalCollapsed?"⊞ Expand All":"⊟ Collapse"}
              </button>
            </div>

            <div style={{width:1,height:20,background:"var(--border)",flexShrink:0,margin:"0 6px"}}/>

            {/* ── SELECTION ACTIONS GROUP ── what happens to selected items ── */}
            <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
              <button onClick={undo} disabled={!canUndo} style={{...tbtn(false),opacity:!canUndo?.3:1}} title="Undo (Ctrl+Z)">↩ Undo</button>
              <button onClick={redo} disabled={!canRedo} style={{...tbtn(false),opacity:!canRedo?.3:1}} title="Redo (Ctrl+Y)">↪ Redo</button>
              {(selected.size>0||selEdge)&&<button onClick={deleteSelected} style={{...tbtn(false),background:"var(--danger)20",color:"var(--danger)"}} title="Delete selected (Del)">🗑{selected.size>1?` ×${selected.size}`:""}</button>}
              {selectedNode&&propsMode==='popup'&&<button onClick={()=>setShowProps(v=>!v)} style={tbtn(showProps,"var(--accent2)")} title="Open properties panel">✏ Props</button>}
            </div>
          </>}

          <div style={{flex:1}}/>

          {/* ── SIDE PANELS GROUP ── persistent panel toggles ── */}
          <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
            <button onClick={()=>setShowChat(v=>!v)} style={{...tbtn(showChat,"var(--accent2)"),display:"flex",alignItems:"center",gap:4}} title="AI Chat — full canvas context (all nodes &amp; edges)">
              💬 <span style={{fontSize:10}}>AI Chat</span>
            </button>
            {canvasMode!=="think"&&<button onClick={()=>setShowComments(v=>!v)} style={{...tbtn(showComments,"var(--accent2)"),display:"flex",alignItems:"center",gap:4}} title="Comments panel">
              🗨 <span style={{fontSize:10}}>Comments</span>
              {Object.values(comments).flat().length>0&&(
                <span style={{fontSize:8,background:"var(--accent)",color:"#fff",borderRadius:10,padding:"0 4px"}}>{Object.values(comments).flat().length}</span>
              )}
            </button>}
          </div>
        </div>
      </div>


      {/* ── Copy-for-AI toast ── */}
      {aiToast&&(
        <div className="nn-toast" style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:950,
          background:"var(--bg2)",border:"1px solid var(--accent)55",color:"var(--text)",
          borderRadius:"var(--radius-md)",padding:"9px 16px",fontSize:12,fontWeight:600,
          boxShadow:"var(--shadow-panel)",display:"flex",alignItems:"center",gap:8}}>
          <Sparkles size={13} style={{color:"var(--accent)"}}/>{aiToast}
        </div>
      )}

      {/* ── Ctrl+K command palette ── */}
      {showCmdK&&(()=>{
        const q=cmdQ.trim().toLowerCase();
        const actions=[
          ["Switch to "+(canvasMode==="think"?"Build":"Think")+" mode",()=>setCanvasModePersist(canvasMode==="think"?"build":"think")],
          ["Copy for AI — clipboard context",copyForAI],
          ["New thought (center of view)",()=>{const el=canvasRef.current;if(el){const s=1/zoom;createIdeaAt((el.scrollLeft+el.clientWidth/2)*s-110,(el.scrollTop+el.clientHeight/2)*s-40);}}],
          ["Arrange",()=>handleAutoLayout(layoutDir)],
          [globalCollapsed?"Expand all nodes":"Collapse all nodes",globalCollapsed?expandAll:collapseAll],
          ["Find in map",()=>{setShowSearch(true);setSearchQuery("");}],
          ["Export…",()=>setShowExportMenu(true)],
          ["Appearance — theme & skin",()=>setShowAppearance(true)],
          ["History & versions",()=>setShowVersions(true)],
          ["Toggle AI chat panel",()=>setShowChat(v=>!v)],
          ["Back to maps",onBack],
        ].filter(([lbl])=>!q||lbl.toLowerCase().includes(q));
        const nodeHits=q?nodes.filter(n=>(n.title||"").toLowerCase().includes(q)).slice(0,8):[];
        const run=(fn)=>{setShowCmdK(false);setCmdQ("");fn();};
        const first=nodeHits.length?()=>jumpToNode(nodeHits[0].id):(actions[0]?actions[0][1]:null);
        return(<>
          <div style={{position:"fixed",inset:0,zIndex:940,background:"rgba(0,0,0,.4)"}} onClick={()=>{setShowCmdK(false);setCmdQ("");}}/>
          <div className="nn-modal-in" style={{position:"fixed",top:"18%",left:"50%",transform:"translateX(-50%)",zIndex:941,
            width:"min(520px,92vw)",background:"var(--bg2)",border:"1px solid var(--border2)",
            borderRadius:"var(--radius-lg)",boxShadow:"var(--shadow-panel)",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:9,padding:"12px 14px",borderBottom:"1px solid var(--border2)"}}>
              <Command size={14} style={{color:"var(--accent)",flexShrink:0}}/>
              <input autoFocus ref={cmdInpRef} value={cmdQ} onChange={e=>setCmdQ(e.target.value)}
                placeholder="Jump to a node or run an action…"
                onKeyDown={e=>{e.stopPropagation();
                  if(e.key==="Escape"){setShowCmdK(false);setCmdQ("");}
                  if(e.key==="Enter"&&first)run(first);}}
                style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text)",
                  fontSize:14,fontFamily:"var(--font-ui)"}}/>
              <span style={{fontSize:9,color:"var(--text4)"}}>esc</span>
            </div>
            <div style={{maxHeight:320,overflow:"auto",padding:4}}>
              {nodeHits.length>0&&<div style={{fontSize:9,fontWeight:700,letterSpacing:1,color:"var(--text4)",padding:"7px 12px 3px"}}>NODES</div>}
              {nodeHits.map(n=>(
                <div key={n.id} onClick={()=>run(()=>jumpToNode(n.id))}
                  style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",cursor:"pointer",
                    fontSize:12,color:"var(--text)",borderRadius:"var(--radius-sm)"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:NT[n.type]?.color||"var(--accent)",flexShrink:0}}/>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title||"Untitled"}</span>
                  <span style={{marginLeft:"auto",fontSize:9,color:"var(--text4)"}}>{NT[n.type]?.label||n.type}</span>
                </div>
              ))}
              {actions.length>0&&<div style={{fontSize:9,fontWeight:700,letterSpacing:1,color:"var(--text4)",padding:"7px 12px 3px"}}>ACTIONS</div>}
              {actions.map(([lbl,fn],i)=>(
                <div key={i} onClick={()=>run(fn)}
                  style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",cursor:"pointer",
                    fontSize:12,color:"var(--text2)",borderRadius:"var(--radius-sm)"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Zap size={12} style={{opacity:.6,flexShrink:0}}/>{lbl}
                </div>
              ))}
              {!nodeHits.length&&!actions.length&&<div style={{padding:"18px 14px",fontSize:11,color:"var(--text4)",textAlign:"center"}}>No matches</div>}
            </div>
          </div>
        </>);
      })()}

      {/* ── Command-palette search overlay ── */}
      {showSearch&&(
        <>
          {/* Full-screen backdrop */}
          <div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,.45)"}}
            onClick={()=>{setShowSearch(false);setSearchQuery("");}}/>

          {/* Command palette panel */}
          <div style={{
            position:"fixed",top:"12%",left:"50%",transform:"translateX(-50%)",
            width:620,maxWidth:"92vw",zIndex:601,
            background:"var(--bg2)",
            border:"1.5px solid var(--accent)",
            borderRadius:"var(--radius-lg)",
            boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
            overflow:"hidden",
          }} onKeyDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>

            {/* Input row */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:"1px solid var(--border2)"}}>
              <span style={{fontSize:16,color:"var(--accent)",flexShrink:0}}>🔍</span>
              <input id="nn-search-input" autoFocus value={searchQuery}
                onChange={e=>{setSearchQuery(e.target.value);setShowSearch(true);}}
                onKeyDown={e=>{
                  e.stopPropagation();
                  if(e.key==="Escape"){setShowSearch(false);setSearchQuery("");}
                  if(e.key==="Enter"&&searchResults.length>0){scrollToNode(searchResults[0].node.id);setShowSearch(false);setSearchQuery("");}
                  if(e.key==="ArrowDown"&&searchResults.length>0){e.preventDefault();document.getElementById("nn-sr-0")?.focus();}
                }}
                placeholder="Find nodes by name, content, properties, type…"
                style={{flex:1,background:"none",border:"none",outline:"none",
                  color:"var(--text)",fontSize:15,fontFamily:"var(--font-ui)"}}
              />
              {searchQuery&&(
                <button onClick={e=>{e.stopPropagation();setSearchQuery("");document.getElementById("nn-search-input")?.focus();}}
                  style={{background:"var(--bg3)",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text4)",cursor:"pointer",fontSize:13,flexShrink:0}}>×</button>
              )}
              <kbd style={{fontSize:10,color:"var(--text4)",background:"var(--bg3)",borderRadius:4,padding:"2px 7px",flexShrink:0,fontFamily:"var(--font-ui)",whiteSpace:"nowrap"}}>ESC to close</kbd>
            </div>

            {/* Filter chips */}
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderBottom:"1px solid var(--border2)",background:"var(--bg3)"}}>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:.5,color:"var(--text4)",marginRight:4,flexShrink:0}}>SEARCH IN</span>
              {[["all","All fields"],["title","Name & Desc"],["notes","Notes"],["props","Properties"],["type","Type"]].map(([id,lbl])=>(
                <button key={id} onClick={e=>{e.stopPropagation();setSearchField(id);document.getElementById("nn-search-input")?.focus();}}
                  style={{padding:"3px 11px",border:"1px solid",borderRadius:12,cursor:"pointer",
                    fontSize:10,fontWeight:700,fontFamily:"var(--font-ui)",transition:"all .12s",
                    borderColor:searchField===id?"var(--accent)":"var(--border)",
                    background:searchField===id?"var(--accent)":"transparent",
                    color:searchField===id?"#fff":"var(--text3)"}}>
                  {lbl}
                </button>
              ))}
              {searchQuery.trim()&&searchResults.length>0&&(
                <span style={{marginLeft:"auto",fontSize:10,color:"var(--text4)",flexShrink:0}}>
                  {searchResults.length} node{searchResults.length!==1?"s":""} · {searchResults.reduce((s,r)=>s+r.hits.length,0)} match{searchResults.reduce((s,r)=>s+r.hits.length,0)!==1?"es":""}
                </span>
              )}
            </div>

            {/* Results */}
            <div style={{maxHeight:440,overflowY:"auto"}}>
              {!searchQuery.trim()?(
                <div style={{padding:"20px 18px"}}>
                  <div style={{fontSize:11,color:"var(--text4)",fontWeight:700,letterSpacing:.5,marginBottom:12}}>WHAT WOULD YOU LIKE TO FIND?</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["📝","Name","Node titles"],["🗒","Notes","Note content"],["⚙","Properties","IP, OS, Model…"],["🏷","Type","Router, Server…"]].map(([ic,k,v])=>(
                      <div key={k} onClick={()=>{setSearchField(k.toLowerCase().slice(0,5));document.getElementById("nn-search-input")?.focus();}}
                        style={{display:"flex",gap:10,padding:"10px 12px",background:"var(--bg3)",borderRadius:"var(--radius-sm)",cursor:"pointer",alignItems:"center",border:"1px solid var(--border)",transition:"border-color .12s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                        <span style={{fontSize:20}}>{ic}</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{k}</div>
                          <div style={{fontSize:10,color:"var(--text4)"}}>{v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:14,fontSize:10,color:"var(--text4)",textAlign:"center"}}>Start typing to search across {nodes.length} node{nodes.length!==1?"s":""}</div>
                </div>
              ):searchResults.length===0?(
                <div style={{padding:"32px 18px",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:10}}>🔎</div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text2)",marginBottom:6}}>No results for "{searchQuery}"</div>
                  <div style={{fontSize:11,color:"var(--text4)"}}>Try different keywords or switch the field filter above</div>
                </div>
              ):(
                searchResults.map((r,i)=>{
                  const t=r.t;
                  const connCount=edges.filter(e=>e.from===r.node.id||e.to===r.node.id).length;
                  return(
                    <div key={r.node.id} id={`nn-sr-${i}`} tabIndex={0}
                      onClick={()=>{scrollToNode(r.node.id);setShowSearch(false);setSearchQuery("");}}
                      onKeyDown={e=>{
                        e.stopPropagation();
                        if(e.key==="Enter"){scrollToNode(r.node.id);setShowSearch(false);setSearchQuery("");}
                        if(e.key==="ArrowDown") document.getElementById(`nn-sr-${i+1}`)?.focus();
                        if(e.key==="ArrowUp") i===0?document.getElementById("nn-search-input")?.focus():document.getElementById(`nn-sr-${i-1}`)?.focus();
                        if(e.key==="Escape"){setShowSearch(false);setSearchQuery("");}
                      }}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",
                        borderBottom:"1px solid var(--border2)",cursor:"pointer",outline:"none",transition:"background .1s"}}
                      onMouseEnter={e=>e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"}
                      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
                      onFocus={e=>e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"}
                      onBlur={e=>e.currentTarget.style.boxShadow="none"}>
                      <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,
                        background:`${t.color}22`,border:`1.5px solid ${t.color}60`,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                        <NodeIcon icon={t.icon} size={18} color={t.color} />
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:3}}>
                          <span style={{fontSize:13,fontWeight:700,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {highlightText(r.node.title,searchQuery)}
                          </span>
                          <span style={{fontSize:9,fontWeight:700,color:t.color,background:`${t.color}22`,padding:"1px 7px",borderRadius:10,flexShrink:0}}>{t.label}</span>
                        </div>
                        {r.hits.slice(0,2).map((hit,j)=>(
                          <div key={j} style={{display:"flex",gap:7,alignItems:"baseline"}}>
                            <span style={{fontSize:9,fontWeight:700,color:"var(--accent2)",flexShrink:0,minWidth:52,letterSpacing:.3}}>{hit.field.slice(0,10).toUpperCase()}</span>
                            <span style={{fontSize:11,color:"var(--text3)",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>{highlightText(hit.snippet,searchQuery)}</span>
                          </div>
                        ))}
                        {r.hits.length>2&&<span style={{fontSize:9,color:"var(--text4)"}}>+{r.hits.length-2} more</span>}
                        {connCount>0&&<div style={{marginTop:2,fontSize:9,color:"var(--text4)"}}>🔗 {connCount} connection{connCount!==1?"s":""}</div>}
                      </div>
                      <span style={{fontSize:13,color:"var(--text4)",flexShrink:0,opacity:.5}}>↗</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {searchResults.length>0&&searchQuery.trim()&&(
              <div style={{display:"flex",gap:14,padding:"7px 16px",borderTop:"1px solid var(--border2)",background:"var(--bg3)",fontSize:9,color:"var(--text4)"}}>
                <span>↑↓ Navigate</span><span>↵ Jump to node</span><span>ESC Close</span>
                <span style={{marginLeft:"auto"}}>{searchResults.length} of {nodes.length} nodes</span>
              </div>
            )}
          </div>
        </>
      )}
      {/* ── Main area: sidebar + canvas + right panels ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>

        {/* Left: Node Library Sidebar — hidden in Think mode */}
        {!isMobile&&canvasMode!=="think"&&(
          <NodeSidebar
            cats={SIDEBAR_CATS} addNode={addNode} canEdit={canEdit&&editMode} recentTypes={recentTypes}
            collapsed={sidebarCollapsed} onToggleCollapse={()=>setSidebarCollapsed(v=>!v)}
            iconOnly={sidebarIconOnly} onToggleIconOnly={()=>setSidebarIconOnly(v=>!v)}
            dense={sidebarDense} onToggleDense={()=>setSidebarDense(v=>!v)}
            onCycleMode={()=>{
              if(sidebarIconOnly){setSidebarIconOnly(false);setSidebarDense(false);}
              else if(sidebarDense){setSidebarIconOnly(true);setSidebarDense(false);}
              else{setSidebarDense(true);}
            }}
          />
        )}

        {/* Canvas */}
        <div ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onDoubleClick={e=>{
            // Instant idea capture — dbl-click empty canvas, type, done
            const t=e.target;
            if(t.closest(".nn-node")) return;
            if(t.tagName==="path"||t.tagName==="text"||t.closest("circle")||t.closest("polygon")||t.closest("foreignObject")||t.closest("input")||t.closest("button")) return;
            if(!canEdit||!editMode||mode!=="select") return;
            const el=canvasRef.current; if(!el) return;
            const rect=el.getBoundingClientRect(); const s=1/zoom;
            createIdeaAt((e.clientX-rect.left)*s+el.scrollLeft*s-((DEF_W/2)|0),(e.clientY-rect.top)*s+el.scrollTop*s-20);
          }}
          onClick={e=>{
            if(e.target.closest(".nn-node")) return;
            if(e.target.tagName==="path"||e.target.tagName==="text") return;
            // Skip clearing selection if a box-select drag just committed
            if(didBoxSel.current){ didBoxSel.current=false; return; }
            setSelected(new Set()); setSelEdge(null);
            if(drawingEdge) setDrawingEdge(null);
            setContextMenu(null);
            if(nodePopup) setNodePopup(null);
            if(propsMode==='panel') setShowProps(false);
          }}
          onMouseMove={e=>{
            if(drawingEdge&&canvasRef.current){
              const el=canvasRef.current; const rect=el.getBoundingClientRect(); const s=1/zoom;
              setDrawingEdge(d=>({...d,mouseX:(e.clientX-rect.left)*s+el.scrollLeft*s,mouseY:(e.clientY-rect.top)*s+el.scrollTop*s}));
            }
          }}
          onTouchMove={e=>{
            if(drawingEdge&&canvasRef.current){
              const el=canvasRef.current; const rect=el.getBoundingClientRect(); const s=1/zoom;
              setDrawingEdge(d=>({...d,mouseX:(e.touches[0].clientX-rect.left)*s+el.scrollLeft*s,mouseY:(e.touches[0].clientY-rect.top)*s+el.scrollTop*s}));
            }
          }}
          style={{
            flex:1,overflow:"auto",position:"relative",
            cursor:mode==="connect"?"crosshair":dragging?"grabbing":"default",
            background: canvasBg||"var(--bg)",
          }}
          >
          {/* Empty state */}
          {nodes.length===0&&!loading&&(
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",gap:12,pointerEvents:"none",zIndex:1}}>
              <div style={{fontSize:40,opacity:.15}}>⬡</div>
              <div style={{fontSize:14,color:"var(--text4)",fontWeight:600,opacity:.5}}>
                Press <kbd style={{background:"var(--bg3)",border:"1px solid var(--border)",
                  borderRadius:5,padding:"2px 7px",fontSize:12,fontFamily:"var(--font-mono)"}}>Space</kbd> to capture a thought
              </div>
              <div style={{fontSize:11,color:"var(--text4)",opacity:.35}}>or drag a node type from the sidebar</div>
            </div>
          )}
          <div style={{width:canvasW*zoom,height:canvasH*zoom,position:"relative",background:canvasBgStyle}}>
            <div style={{transform:`scale(${zoom})`,transformOrigin:"0 0",width:canvasW,height:canvasH,position:"relative"}}>

              {/* Snap alignment guides */}
              {snapGuides.length>0&&(
                <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible",zIndex:2}}>
                  {snapGuides.map((g,i)=>(
                    g.x!==undefined
                      ? <line key={i} x1={g.x} y1={0} x2={g.x} y2={canvasH} stroke="var(--accent)" strokeWidth={1} strokeDasharray="4,4" opacity={0.7}/>
                      : <line key={i} x1={0} y1={g.y} x2={canvasW} y2={g.y} stroke="var(--accent)" strokeWidth={1} strokeDasharray="4,4" opacity={0.7}/>
                  ))}
                </svg>
              )}

              {/* Box selection rect */}
              {boxRect&&boxRect.w>4&&boxRect.h>4&&(
                <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible",zIndex:1}}>
                  <rect x={boxRect.x} y={boxRect.y} width={boxRect.w} height={boxRect.h}
                    fill="var(--accent2)" fillOpacity="0.1"
                    stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5,3"/>
                  {/* Live count of nodes inside */}
                  <foreignObject x={boxRect.x+4} y={boxRect.y+4} width="80" height="18">
                    <div style={{fontSize:9,color:"var(--accent)",background:"var(--bg2)",
                      padding:"1px 5px",borderRadius:3,display:"inline-block",
                      border:"1px solid var(--accent)40",opacity:.9,fontFamily:"var(--font-ui)"}}>
                      {nodesRef.current.filter(n=>{const nw=collW(n),nh=collH(n);return n.x<boxRect.x+boxRect.w&&n.x+nw>boxRect.x&&n.y<boxRect.y+boxRect.h&&n.y+nh>boxRect.y;}).length} nodes
                    </div>
                  </foreignObject>
                </svg>
              )}

              {/* Edge SVG — DOM-order before nodes = renders behind nodes */}
              {/* ── Group boxes (rendered under edges and nodes) ── */}
              {groupBoxes.map(gb=>(
                <div key={gb.id}
                  onMouseDown={e=>{
                    if(e.target.closest("input")||e.target.closest("button")) return;
                    e.stopPropagation();
                    const el=canvasRef.current; if(!el) return;
                    const rect=el.getBoundingClientRect(); const s=1/zoom;
                    const mx=(e.clientX-rect.left)*s+el.scrollLeft*s;
                    const my=(e.clientY-rect.top)*s+el.scrollTop*s;
                    setDraggingGB({id:gb.id,startMX:mx,startMY:my,origX:gb.x,origY:gb.y});
                  }}
                  style={{position:"absolute",left:gb.x,top:gb.y,width:gb.w,height:gb.h,
                    
                    borderRadius:6,
                    background:gb.bgColor&&gb.bgColor!=="transparent"?gb.bgColor+"22":"transparent",
                    pointerEvents:"all",cursor:"move",boxSizing:"border-box"}}>
                  {/* Label bar */}
                  <div style={{position:"absolute",top:-14,left:8,fontSize:10,fontWeight:700,
                    color:gb.color||"var(--accent)",background:"var(--bg2)",padding:"0 5px",
                    borderRadius:3,userSelect:"none",display:"flex",alignItems:"center",gap:3}}>
                    {editingGroupBox===gb.id?(
                      <input autoFocus value={gb.label||""}
                        onMouseDown={e=>e.stopPropagation()}
                        onChange={e=>setGroupBoxes(bs=>bs.map(b=>b.id===gb.id?{...b,label:e.target.value}:b))}
                        onBlur={()=>setEditingGroupBox(null)}
                        onKeyDown={e=>{e.stopPropagation();if(e.key==="Escape"||e.key==="Enter")setEditingGroupBox(null);}}
                        style={{background:"none",border:"none",outline:"none",fontSize:10,fontWeight:700,
                          color:gb.color||"var(--accent)",fontFamily:"var(--font-ui)",width:90,padding:0}}/>
                    ):(
                      <span onDoubleClick={e=>{e.stopPropagation();setEditingGroupBox(gb.id);}}
                        title="Double-click to rename" style={{cursor:"text"}}>{gb.label||"Group"}</span>
                    )}
                    {/* Line style cycle */}
                    <button onMouseDown={e=>e.stopPropagation()}
                      onClick={e=>{e.stopPropagation();
                        const ls=["solid","dashed","dotted"];
                        const cur=gb.lineStyle||"solid";
                        setGroupBoxes(bs=>bs.map(b=>b.id===gb.id?{...b,lineStyle:ls[(ls.indexOf(cur)+1)%ls.length]}:b));
                      }} title={`Line: ${gb.lineStyle||"solid"} — click to change`}
                      style={{background:"none",border:"none",cursor:"pointer",fontSize:9,color:"var(--text4)",padding:0,lineHeight:1}}>
                      {(gb.lineStyle||"solid")==="dotted"?"···":(gb.lineStyle||"solid")==="dashed"?"---":"—"}
                    </button>
                    {/* Border color */}
                    <input type="color" value={gb.color&&gb.color.startsWith("#")?gb.color:"#58a6ff"}
                      onMouseDown={e=>e.stopPropagation()}
                      onChange={e=>setGroupBoxes(bs=>bs.map(b=>b.id===gb.id?{...b,color:e.target.value}:b))}
                      title="Border color"
                      style={{width:13,height:13,border:"none",borderRadius:2,cursor:"pointer",padding:0,background:"none"}}/>
                    {/* BG color */}
                    <input type="color" value={gb.bgColor&&gb.bgColor.startsWith("#")?gb.bgColor:"#000000"}
                      onMouseDown={e=>e.stopPropagation()}
                      onChange={e=>setGroupBoxes(bs=>bs.map(b=>b.id===gb.id?{...b,bgColor:e.target.value}:b))}
                      title="Fill color"
                      style={{width:13,height:13,border:"none",borderRadius:2,cursor:"pointer",padding:0,background:"none",opacity:.7}}/>
                    <button onMouseDown={e=>e.stopPropagation()}
                      onClick={e=>{e.stopPropagation();setGroupBoxes(bs=>bs.filter(b=>b.id!==gb.id));}}
                      style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"var(--text4)",padding:0,lineHeight:1}}>×</button>
                  </div>
                  {/* SE resize grip */}
                  <div onMouseDown={e=>{
                      e.stopPropagation();
                      const el=canvasRef.current; if(!el) return;
                      const rect=el.getBoundingClientRect(); const s=1/zoom;
                      const mx=(e.clientX-rect.left)*s+el.scrollLeft*s;
                      const my=(e.clientY-rect.top)*s+el.scrollTop*s;
                      setResizingGB({id:gb.id,startMX:mx,startMY:my,origW:gb.w,origH:gb.h});
                    }}
                    style={{position:"absolute",bottom:0,right:0,width:14,height:14,
                      cursor:"se-resize",
                      borderRight:`2px solid ${gb.color||"var(--accent)"}70`,
                      borderBottom:`2px solid ${gb.color||"var(--accent)"}70`,
                      borderRadius:"0 0 5px 0"}}/>
                </div>
              ))}
              {/* Drawing preview */}
              {drawingGroupBox&&(()=>{
                const x=Math.min(drawingGroupBox.startX,drawingGroupBox.endX);
                const y=Math.min(drawingGroupBox.startY,drawingGroupBox.endY);
                const w=Math.abs(drawingGroupBox.endX-drawingGroupBox.startX);
                const h=Math.abs(drawingGroupBox.endY-drawingGroupBox.startY);
                return w>4&&h>4&&(
                  <div style={{position:"absolute",left:x,top:y,width:w,height:h,
                    border:"2px dashed var(--accent)",borderRadius:6,
                    background:"var(--accent)0a",pointerEvents:"none"}}/>
                );
              })()}

              {/* ── Remote selection overlays — Excel style ── */}
              {Object.entries(remoteSelections).map(([uid, rs])=>{
                if(!rs.selectedIds||rs.selectedIds.size===0) return null;
                return [...rs.selectedIds].map(nodeId=>{
                  const node = nodesRef.current.find(n=>n.id===nodeId);
                  if(!node) return null;
                  const nw = node.w||220;
                  const nh = nodeHeightsRef.current[nodeId]||node.h||96;
                  const isEditing = rs.editingId===nodeId;
                  const initials = (rs.userName||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                  return(
                    <div key={uid+"-"+nodeId} style={{
                      position:"absolute",
                      left:node.x-3, top:node.y-3,
                      width:nw+6, height:nh+6,
                      
                      borderRadius:10,
                      pointerEvents:"none",
                      zIndex:50,
                      boxShadow:`0 0 0 1px ${rs.color}40`,
                      animation: isEditing ? "nn-collab-pulse 1.5s infinite" : "none",
                    }}>
                      {/* Name badge — top-right corner like Excel */}
                      <div style={{
                        position:"absolute", top:-10, right:6,
                        background:rs.color, color:"#fff",
                        fontSize:9, fontWeight:700, lineHeight:"16px",
                        padding:"0 5px", borderRadius:3,
                        whiteSpace:"nowrap", fontFamily:"var(--font-ui)",
                        boxShadow:"var(--nEx,2px 2px 5px var(--neu-shadow),-2px -2px 3px var(--neu-hilight))",
                        display:"flex", alignItems:"center", gap:4,
                      }}>
                        <span style={{
                          width:14,height:14,borderRadius:"50%",
                          background:"rgba(255,255,255,.3)",
                          display:"inline-flex",alignItems:"center",justifyContent:"center",
                          fontSize:8,fontWeight:800
                        }}>{initials}</span>
                        {rs.userName}
                        {isEditing && <span style={{opacity:.8}}>· editing</span>}
                      </div>
                      {/* Corner handle dot — Excel style */}
                      <div style={{
                        position:"absolute", bottom:-4, right:-4,
                        width:7,height:7,borderRadius:1,
                        background:rs.color,
                      }}/>
                    </div>
                  );
                });
              })}

              {renderEdges()}

              {/* Nodes */}
              {renderNodes()}

              {/* Inline Node Popup Editor — popup mode only */}
              {propsMode==='popup'&&nodePopup&&(()=>{
                const pn=nodes.find(n=>n.id===nodePopup.nodeId);
                if(!pn) return null;
                const nw=collW(pn), nh=collH(pn);
                const popW=520;
                let px=pn.x, py=pn.y+nh+10;
                if(px+popW>canvasW) px=Math.max(0,pn.x+nw-popW);
                return(
                  <InlineNodeEditor
                    key={pn.id} node={pn} x={px} y={py}
                    mapId={mapId} mapTitle={mapMeta?.title}
                    tab={nodePopup.tab} nodes={nodes} edges={edges}
                    canEdit={canEdit&&editMode}
                    onTabChange={tab=>setNodePopup({nodeId:pn.id,tab})}
                    onClose={()=>setNodePopup(null)}
                    onUpdate={(u)=>updateNode(pn.id,u)}
                    onUpdateProp={(key,val)=>updateProp(pn.id,key,val)}
                    onUpdateNotes={(notes)=>updateNotes(pn.id,notes)}
                    onChangeType={(newType)=>updateNode(pn.id,{type:newType,properties:{...(DP[newType]||{}),...pn.properties}})}
                    onUpdateCustom={(k,v)=>updateCustom(pn.id,k,v)}
                    onDeleteCustom={(k)=>deleteCustom(pn.id,k)}
                    onRenameCustom={(ok,nk)=>renameCustom(pn.id,ok,nk)}
                    onAddCustom={()=>{const k=`field_${Object.keys(pn.customProps||{}).length+1}`;updateCustom(pn.id,k,"");}}
                  />
                );
              })()}

              {/* Quick Capture */}
              {quickPos&&canEdit&&editMode&&(
                <div style={{position:"absolute",left:quickPos.x,top:quickPos.y,zIndex:100,
                  display:"flex",flexDirection:"column",gap:8}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",
                    color:"var(--accent)",opacity:.7}}>⚡ QUICK CAPTURE</div>
                  <div style={{background:"var(--bg2)",borderRadius:"var(--radius-md)",
                    padding:"12px 14px",boxShadow:"var(--shadow-panel)",
                    border:"1.5px solid var(--accent)",display:"flex",gap:8,width:320}}>
                    <input ref={quickInpRef} value={quickText} onChange={e=>setQuickText(e.target.value)}
                      onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter")commitCapture();if(e.key==="Escape"){setQuickPos(null);setQuickText("");}}}
                      placeholder="Type a thought and hit Enter…"
                      style={{background:"none",border:"none",outline:"none",color:"var(--text)",
                        fontSize:14,fontFamily:"var(--font-ui)",flex:1}}/>
                    <button onClick={commitCapture} style={{background:"var(--accent)",border:"none",
                      borderRadius:"var(--radius-sm)",color:"#fff",cursor:"pointer",
                      padding:"4px 12px",fontSize:12,fontWeight:700}}>↵</button>
                  </div>
                  <div style={{fontSize:9,color:"var(--text4)",opacity:.6}}>Esc to cancel</div>
                </div>
              )}

            </div>
          </div>

          {/* Clutter indicator — bottom left of canvas area */}
          {nodes.length>0&&(()=>{
            const connectedIds=new Set(edges.flatMap(e=>[e.from,e.to]));
            const isolated=nodes.filter(n=>n.type!=="group"&&!connectedIds.has(n.id)).length;
            const stacks=Object.values(nodes.reduce((acc,n)=>{
              if(n.type!=="note") return acc;
              // just count note nodes for stack indicator
              acc.count=(acc.count||0)+1; return acc;
            },{})).length;
            return(
              <div style={{position:"absolute",bottom:16,left:16,zIndex:20,
                opacity:0,transition:"opacity .2s",}}
                onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                onMouseLeave={e=>e.currentTarget.style.opacity="0"}>
                <div style={{background:"var(--bg2)",border:"1px solid var(--border)",
                  borderRadius:"var(--radius-sm)",padding:"5px 10px",fontSize:10,
                  color:"var(--text4)",display:"flex",gap:10}}>
                  <span>{nodes.filter(n=>n.type!=="group").length} nodes</span>
                  {isolated>0&&<span style={{color:"var(--danger)",opacity:.7}}>· {isolated} isolated</span>}
                  <span style={{opacity:.5}}>· {edges.length} connections</span>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Right panels */}
        {showTemplates&&(
          <div style={{width:300,flexShrink:0,display:"flex",flexDirection:"column",background:"var(--bg2)",borderLeft:"1px solid var(--border2)",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:"1px solid var(--border2)",background:"var(--bg3)",flexShrink:0}}>
              <span style={{fontSize:13}}>📋</span>
              <span style={{fontSize:11,fontWeight:700,color:"var(--accent)",flex:1}}>TEMPLATE LIBRARY</span>
              <button onClick={()=>setShowTemplates(false)} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
            </div>
            <TemplateLibrary onInsert={(tpl)=>{
              const el=canvasRef.current; if(!el) return;
              const s=1/zoom;
              const ox=(el.scrollLeft+el.clientWidth/2)*s-300;
              const oy=(el.scrollTop+el.clientHeight/2)*s-200;
              const idMap={};
              tpl.nodes.forEach(n=>{idMap[n.id]=makeId();});
              const newNodes=tpl.nodes.map(n=>({...mkNode(n.type,ox+n.x,oy+n.y),id:idMap[n.id],title:n.title,notes:n.notes||[],properties:{...(DP[n.type]||{}),...(n.properties||{})}}));
              const newEdges=tpl.edges.map(e=>({id:makeId(),from:idMap[e.from],to:idMap[e.to],label:e.label||"",style:e.style||"arrow",color:"var(--accent)",edgeType:e.edgeType||"data"}));
              applyNodes(ns=>[...ns,...newNodes]);
              applyEdges(es=>[...es,...newEdges]);
              setShowTemplates(false);
            }}/>
          </div>
        )}

        {showComments&&(
          <div style={{width:290,flexShrink:0,display:"flex",flexDirection:"column",background:"var(--bg2)",borderLeft:"1px solid var(--border2)",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:"1px solid var(--border2)",background:"var(--bg3)",flexShrink:0}}>
              <span style={{fontSize:13}}>🗨</span>
              <span style={{fontSize:11,fontWeight:700,color:"var(--accent)",flex:1}}>
                {commentNode?`"${nodes.find(n=>n.id===commentNode)?.title||"node"}"`:"All Comments"}
              </span>
              {commentNode&&<button onClick={()=>setCommentNode(null)} style={{fontSize:10,background:"none",border:"none",color:"var(--text4)",cursor:"pointer"}}>All</button>}
              <button onClick={()=>{setShowComments(false);setCommentNode(null);}} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
            </div>
            <CommentsPanel comments={comments} nodes={nodes} commentNode={commentNode}
              setCommentNode={setCommentNode} draft={commentDraft} setDraft={setCommentDraft}
              user={user}
              onAdd={(nodeId,text)=>{const c={id:makeId(),text,author:user?.display_name||user?.email||"Me",ts:new Date().toISOString()};setComments(prev=>({...prev,[nodeId]:[...(prev[nodeId]||[]),c]}));setCommentDraft("");}}
              onDelete={(nodeId,cid)=>setComments(prev=>({...prev,[nodeId]:(prev[nodeId]||[]).filter(c=>c.id!==cid)}))}
              onScrollTo={(nodeId)=>scrollToNode(nodeId)}
            />
          </div>
        )}

        {showChat&&(
          <div style={{width:440,flexShrink:0,display:"flex",flexDirection:"column",background:"var(--bg2)",borderLeft:"1px solid var(--border2)",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:"1px solid var(--border2)",background:"var(--bg3)",flexShrink:0}}>
              <span style={{fontSize:13}}>💬</span>
              <span style={{fontSize:11,fontWeight:700,color:"var(--accent)",flex:1}}>AI CHAT</span>
              <button onClick={()=>setShowChat(false)} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
            </div>
            <LLMChat mapId={mapId} nodes={nodes} edges={edges} mapTitle={mapMeta?.title}/>
          </div>
        )}

        {/* Props Panel — panel mode */}
        {selectedNode&&propsMode==='panel'&&(showProps||!isMobile)&&(
          <PropsPanel node={selectedNode} edges={edges} nodes={nodes}
            isMobile={isMobile} canEdit={canEdit&&editMode}
            onClose={()=>setShowProps(false)}
            onUpdate={updateNode} onUpdateProp={updateProp}
            onUpdateCustom={updateCustom} onDeleteCustom={deleteCustom}
            onAddCustom={()=>{const k=`field_${Object.keys(selectedNode.customProps||{}).length+1}`;updateCustom(selectedNode.id,k,"");}}
            onRenameCustom={renameCustom}
            onUpdateEdge={(eid,u)=>applyEdges(es=>es.map(e=>e.id===eid?{...e,...u}:e))}
            onDeleteEdge={eid=>applyEdges(es=>es.filter(e=>e.id!==eid))}
            onResetSize={()=>resetSize(selectedNode.id)}
            onUpdateNotes={updateNotes}
            onStartEditTitle={()=>canEdit&&editMode&&setEditingTitle(selectedNode.id)}
            onToggleCollapse={()=>toggleCollapse(selectedNode.id)}
          />
        )}

        {/* Context Menu */}
        {contextMenu&&(
          <>
            <div style={{position:"fixed",inset:0,zIndex:600}} onClick={()=>setContextMenu(null)} onContextMenu={e=>{e.preventDefault();setContextMenu(null);}}/>
            <ContextMenu
              x={contextMenu.x} y={contextMenu.y}
              nodeId={contextMenu.nodeId}
              nodes={nodes} selected={selected} edges={edges}
              canEdit={canEdit&&editMode}
              onClose={()=>setContextMenu(null)}
              onDuplicate={()=>{
                const src=nodes.find(n=>n.id===contextMenu.nodeId); if(!src) return;
                const dup={...src,id:makeId(),x:src.x+24,y:src.y+24,properties:{...(src.properties||{})},customProps:{...(src.customProps||{})}};
                applyNodes(ns=>[...ns,dup]);
                setSelected(new Set([dup.id]));
              }}
              onDelete={()=>{
                const id=contextMenu.nodeId;
                applyNodes(ns=>ns.filter(n=>n.id!==id));
                applyEdges(es=>es.filter(e=>e.from!==id&&e.to!==id));
                setSelected(new Set()); setSelEdge(null);
              }}
              onCollapse={()=>toggleCollapse(contextMenu.nodeId)}
              onConnect={()=>{
                const node=nodes.find(n=>n.id===contextMenu.nodeId); if(!node) return;
                setMode("connect");
                setDrawingEdge({fromId:contextMenu.nodeId,mouseX:node.x+collW(node)/2,mouseY:node.y+collH(node)/2});
              }}
              onEditTitle={()=>setEditingTitle(contextMenu.nodeId)}
              onSelectAll={()=>setSelected(new Set(nodes.map(n=>n.id)))}
              onProps={()=>setShowProps(true)}
            />
          </>
        )}
      </div>

      {/* ── Collab Change Log Panel ── */}
      {showCollabLog&&(
        <div style={{position:"fixed",top:76,right:8,zIndex:800,width:320,maxHeight:"70vh",
          background:"var(--bg2)",borderRadius:"var(--radius-lg)",
          boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",padding:"10px 14px",
            borderBottom:"1px solid var(--border2)",background:"var(--bg3)",flexShrink:0}}>
            <span style={{fontSize:13,fontWeight:700,color:"var(--text)",flex:1}}>📋 Map Changes</span>
            <button onClick={()=>apiFetch(`/maps/${mapId}/changelog`).then(d=>setCollabLog(Array.isArray(d)?d:[])).catch(()=>{})}
              style={{background:"none",borderRadius:4,
                color:"var(--text4)",cursor:"pointer",fontSize:10,padding:"2px 6px",marginRight:6}}>↺</button>
            <button onClick={()=>setShowCollabLog(false)}
              style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:8}}>
            {collabLog.length===0?(
              <div style={{fontSize:11,color:"var(--text4)",textAlign:"center",padding:"20px 0"}}>
                No changes recorded yet.<br/>Changes appear here when collaborating.
              </div>
            ):collabLog.map((entry,i)=>{
              const actionMap={add_node:"➕ Added",delete_node:"🗑 Deleted",edit_node:"✏ Edited",
                add_edge:"🔗 Connected",delete_edge:"✂ Removed",move_node:"↕ Moved"};
              const colors=['#f97316','#06b6d4','#a855f7','#22c55e','#f59e0b'];
              const color=colors[Math.abs((entry.user_id||'').charCodeAt(0))%colors.length];
              const when=new Date(entry.created_at);
              const ago=Date.now()-when>86400000?when.toLocaleDateString():when.toLocaleTimeString();
              return(
                <div key={entry.id||i} style={{display:"flex",gap:8,padding:"6px 4px",
                  borderBottom:"1px solid var(--border2)"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:color,flexShrink:0,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,
                    color:"#fff",fontWeight:700,marginTop:1}}>
                    {(entry.user_name||"?")[0].toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,color:"var(--text)"}}>
                      <span style={{fontWeight:600,color}}>{entry.user_name||"User"}</span>
                      {" "}{actionMap[entry.action]||entry.action}
                      {entry.target_label&&<span style={{color:"var(--accent)"}}> "{entry.target_label}"</span>}
                    </div>
                    <div style={{fontSize:9,color:"var(--text4)",marginTop:2}}>{ago}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      {showShare&&(
        <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>{setShowShare(false);setShareStatus(null);setShareEmail("");}}>
          <div style={{background:"var(--bg2)",borderRadius:"var(--radius-lg)",
            boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",width:440,maxWidth:"94vw",
            display:"flex",flexDirection:"column",overflow:"hidden"}}
            onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",
              borderBottom:"1px solid var(--border2)",background:"var(--bg3)",flexShrink:0}}>
              <span style={{fontSize:18}}>👥</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Share Map</div>
                <div style={{fontSize:10,color:"var(--text4)",marginTop:1}}>Invite teammates to view or edit this map</div>
              </div>
              <button onClick={()=>setShowShare(false)}
                style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
            </div>
            {/* Invite row */}
            <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border2)"}}>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <div style={{flex:1,position:"relative"}}>
                  <input value={shareEmail}
                    onChange={e=>{
                      setShareEmail(e.target.value);
                      const q=e.target.value.trim();
                      if(q.length>=2){
                        apiFetch(`/users/search?q=${encodeURIComponent(q)}`)
                          .then(d=>setShareSearch(Array.isArray(d)?d:[])).catch(()=>{});
                      } else { setShareSearch([]); }
                    }}
                    placeholder="Search by name or email…"
                    onKeyDown={e=>{if(e.key==="Enter"){const btn=document.getElementById('nn-share-invite-btn');btn&&btn.click();}}}
                    style={{width:"100%",boxSizing:"border-box",background:"var(--bg3)",
                      borderRadius:"var(--radius-sm)",padding:"6px 10px",color:"var(--text)",fontSize:12,
                      fontFamily:"var(--font-ui)",outline:"none"}}/>
                  {shareSearch.length>0&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:10,
                      background:"var(--bg2)",borderRadius:"var(--radius-sm)",
                      boxShadow:"var(--nEm,6px 6px 14px var(--neu-shadow),-5px -5px 10px var(--neu-hilight))",marginTop:2,maxHeight:140,overflowY:"auto"}}>
                      {shareSearch.map(u=>(
                        <div key={u.id} onClick={()=>{setShareEmail(u.email);setShareSearch([]);}}
                          style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",cursor:"pointer",fontSize:11}}
                          onMouseEnter={e=>e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
                          <div style={{width:24,height:24,borderRadius:"50%",background:"var(--accent)",
                            display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,
                            color:"#fff",fontWeight:700,flexShrink:0}}>
                            {(u.display_name||u.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontWeight:600,color:"var(--text)"}}>{u.display_name||u.email}</div>
                            <div style={{fontSize:9,color:"var(--text4)"}}>{u.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <select value={sharePerm} onChange={e=>setSharePerm(e.target.value)}
                  style={{background:"var(--bg3)",borderRadius:"var(--radius-sm)",
                    padding:"6px 8px",color:"var(--text)",fontSize:11,fontFamily:"var(--font-ui)",outline:"none"}}>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={async()=>{
                    if(!shareEmail.trim()) return;
                    setShareStatus("Sending…");
                    try{
                      // apiFetch throws on error, returns JSON on success
                      const data = await addCollab(mapId, {email:shareEmail.trim(), permission:sharePerm});
                      setShareStatus("✓ Invited "+shareEmail.trim()+"!");
                      setShareEmail(""); setShareSearch([]);
                      const collabs = await apiFetch(`/maps/${mapId}/collaborators`).catch(()=>[]);
                      setShareUsers(Array.isArray(collabs)?collabs:[]);
                      setTimeout(()=>setShareStatus(null),3000);
                    }catch(err){setShareStatus("✗ "+(err?.message||"Failed"));setTimeout(()=>setShareStatus(null),5000);}
                  }}
                  id="nn-share-invite-btn"
                  style={{background:"var(--accent)",border:"none",borderRadius:"var(--radius-sm)",
                    padding:"6px 14px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"var(--font-ui)",fontWeight:700}}>
                  Invite
                </button>
              </div>
              {shareStatus&&(
                <div style={{fontSize:11,color:shareStatus.startsWith("✓")?"var(--success)":"var(--danger)",marginTop:4}}>
                  {shareStatus}
                </div>
              )}
            </div>
            {/* Collaborator list */}
            <div style={{padding:"10px 18px",maxHeight:220,overflowY:"auto"}}>
              {shareUsers.length===0?(
                <div style={{fontSize:11,color:"var(--text4)",textAlign:"center",padding:"12px 0"}}>
                  No collaborators yet. Invite someone above.
                </div>
              ):shareUsers.map(u=>(
                <div key={u.user_id||u.email} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",
                  borderBottom:"1px solid var(--border2)"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"var(--accent)",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,
                    color:"#fff",fontWeight:700,flexShrink:0}}>
                    {(u.display_name||u.email||"?")[0].toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {u.display_name||u.email}
                    </div>
                    <div style={{fontSize:9,color:"var(--text4)"}}>{u.email}</div>
                  </div>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,
                    background:u.permission==="editor"?"var(--accent)20":"var(--bg3)",
                    color:u.permission==="editor"?"var(--accent)":"var(--text4)",
                    border:"1px solid "+(u.permission==="editor"?"var(--accent)40":"var(--border)"),
                    fontWeight:600}}>
                    {u.permission||"viewer"}
                  </span>
                  <button onClick={async()=>{
                    await removeCollab(mapId, u.user_id);
                    setShareUsers(v=>v.filter(x=>x.user_id!==u.user_id));
                  }}
                  style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",
                    fontSize:14,padding:"0 2px",lineHeight:1,flexShrink:0}}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Changelog Modal ── */}
      {showTutorial && <Tutorial page="canvas" onClose={()=>setShowTutorial(false)} />}
      {showDocExport && (
        <DocExportModal
          nodes={nodes} edges={edges} mapTitle={mapMeta?.title||"Map"}
          mode={docExportMode} onClose={()=>setShowDocExport(false)}/>
      )}
      {showHelp     && <HelpGuide onClose={()=>setShowHelp(false)} />}
      {showChangelog&&(
        <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>setShowChangelog(false)}>
          <div style={{background:"var(--bg2)",border:"1.5px solid var(--accent)",borderRadius:"var(--radius-lg)",
            boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",width:560,maxWidth:"94vw",maxHeight:"80vh",
            display:"flex",flexDirection:"column",overflow:"hidden"}}
            onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",
              borderBottom:"1px solid var(--border2)",background:"var(--bg3)",flexShrink:0}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"var(--accent)"}}>NoNote — What's New</div>
                <div style={{fontSize:10,color:"var(--text4)",marginTop:2}}>Full changelog across all versions</div>
              </div>
              <button onClick={()=>setShowChangelog(false)}
                style={{marginLeft:"auto",background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
            </div>
            {/* Content */}
            <div style={{flex:1,overflowY:"auto",padding:"14px 18px"}}>
              {CHANGELOG.map(({v,date,items})=>(
                <div key={v} style={{marginBottom:18}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:700,color:"var(--accent)"}}>{v}</span>
                    <span style={{fontSize:10,color:"var(--text4)"}}>{date}</span>
                  </div>
                  {items.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:6,marginBottom:4,fontSize:11,color:"var(--text2)"}}>
                      <span style={{color:"var(--accent)",flexShrink:0,marginTop:1}}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showExport&&<ExportModal nodes={nodes} edges={edges} mapTitle={mapMeta?.title} exportLLM={exportLLM} onClose={()=>setShowExport(false)}/>}

      {showVersions&&<VersionHistory mapId={mapId} nodes={nodes} edges={edges} mapTitle={mapMeta?.title} onRestore={handleRestore} onClose={()=>setShowVersions(false)} collabLog={collabLog}/>}
      {showAppearance&&<ThemePicker onClose={()=>setShowAppearance(false)}/>}
      {showWorkflowAudit&&<WorkflowAuditPanel nodes={nodes} edges={edges} mapTitle={mapMeta?.title} updateCustom={updateCustom} onClose={()=>setShowWorkflowAudit(false)}/>}

      {/* ── Audit badge popup — click ⚡ on a node ── */}
      {auditBadgePopup&&(()=>{
        const n=nodes.find(x=>x.id===auditBadgePopup.nodeId);
        const b=n?.customProps?._auditBadge;
        if(!b) return null;
        return(<>
          <div style={{position:"fixed",inset:0,zIndex:940}} onClick={()=>setAuditBadgePopup(null)}/>
          <div style={{position:"fixed",left:Math.min(auditBadgePopup.x,window.innerWidth-320),top:auditBadgePopup.y+8,zIndex:941,
            width:300,background:"var(--bg2)",border:"1px solid var(--accent)55",borderRadius:"var(--radius-md)",
            boxShadow:"var(--shadow-panel)",padding:12}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <Sparkles size={12} style={{color:"var(--accent)"}}/>
              <span style={{fontSize:11,fontWeight:700,color:"var(--text)"}}>Workflow Audit suggestion</span>
            </div>
            <div style={{fontSize:11,color:"var(--text2)",marginBottom:6}}>{b.reason}</div>
            {b.suggestion&&<div style={{fontSize:11,color:"var(--text3)",marginBottom:b.snippet?8:0}}>→ {b.suggestion}</div>}
            {b.snippet&&(
              <div style={{position:"relative"}}>
                <pre style={{background:"var(--bg)",borderRadius:"var(--radius-sm)",padding:"7px 9px",fontSize:10,
                  color:"var(--text)",overflow:"auto",margin:0,fontFamily:"monospace",maxHeight:100}}>{b.snippet}</pre>
                <button onClick={async()=>{const ok=await copyText(b.snippet);setAiToast(ok?"✓ Snippet copied":"Copy failed");setTimeout(()=>setAiToast(null),1800);}}
                  style={{position:"absolute",top:5,right:5,background:"var(--bg3)",border:"1px solid var(--border)",
                    borderRadius:4,cursor:"pointer",padding:"2px 5px",color:"var(--text3)",fontSize:9}}>Copy</button>
              </div>
            )}
          </div>
        </>);
      })()}

      <style>{`
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        /* ── Motion pass — things that appear, ease in ── */
        @keyframes nnPop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
        @keyframes nnFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes nnFade{from{opacity:0}to{opacity:1}}
        @keyframes nnToast{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
        .nn-node{animation:nnPop .18s cubic-bezier(0.16,1,0.3,1) both}
        .nn-node-new{animation:nnPop .26s cubic-bezier(0.34,1.56,0.64,1) both !important}
        .nn-drop,.nn-modal-in{animation:nnFadeUp .16s cubic-bezier(0.16,1,0.3,1) both}
        .nn-toast{animation:nnToast .22s cubic-bezier(0.16,1,0.3,1) both}
        .nn-edges path,.nn-edges text{animation:nnFade .3s ease both}
        @media (prefers-reduced-motion: reduce){
          *,*::before,*::after{animation-duration:.01ms !important;transition-duration:.01ms !important}
        }
        .nn-node:hover { z-index: 10; }
        .nn-node:hover .nn-collapse-btn { opacity: 0.8 !important; }
        .nn-node .nn-collapse-btn:hover { opacity: 1 !important; }
        .nn-node:hover .nn-comment-btn { opacity: 0.65 !important; }
        .nn-notefocus-btn { opacity: 0.55; }
        .nn-node:hover .nn-notefocus-btn { opacity: 1; }
        .nn-notefocus-btn:hover { background: var(--accent)18 !important; color: var(--accent) !important; }
        .nn-comment-btn:hover { opacity: 1 !important; }
        .nn-node:hover .nn-addnote-btn { opacity: 0.6 !important; }
        .nn-node:hover .nn-pencil-btn { opacity: 0.5 !important; }
        .nn-pencil-btn:hover { opacity: 1 !important; color: var(--accent) !important; }
        .nn-addnote-btn:hover { opacity: 1 !important; }
        .nn-node:hover .nn-collapse-btn { opacity: 0.7 !important; }
        .nn-collapse-btn:hover { opacity: 1 !important; }
        g:hover .nn-mid-handle { opacity: 1 !important; }
        .nn-mid-handle { transition: opacity .15s; }

        /* ── InlineNodeEditor tab bar: scroll horizontally when tabs overflow ── */
        [style*="z-index: 200"] > div:nth-child(3) {
          overflow-x: auto !important;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        [style*="z-index: 200"] > div:nth-child(3)::-webkit-scrollbar { display: none; }
        [style*="z-index: 200"] > div:nth-child(3) > button {
          flex: none !important;
          white-space: nowrap;
        }

        /* ── InlineNodeEditor: clip shadow to panel, prevent overflow bleed ── */
        [style*="z-index: 200"] {
          overflow: visible;
          contain: layout;
        }
      `}</style>
      {showTutorial && <Tutorial page="canvas" onClose={()=>setShowTutorial(false)} />}
      {showDocExport && (
        <DocExportModal
          nodes={nodes} edges={edges} mapTitle={mapMeta?.title||"Map"}
          mode={docExportMode} onClose={()=>setShowDocExport(false)}/>
      )}
      {showHelp     && <HelpGuide onClose={()=>setShowHelp(false)} />}
    </div>
  );
}

// ── Collapsed Node ────────────────────────────────────────────
function CollapsedNode({node,t,isSel,canEdit,mode,onMouseDown,onTouchStart,onClick,onContextMenu,onToggleCollapse}){
  const [hovered,setHovered]=useState(false);
  const propEntries=Object.entries(node.properties||{}).filter(([,v])=>v).slice(0,4);
  return (
    <div
      className="nn-node"
      onMouseDown={onMouseDown} onTouchStart={onTouchStart} onClick={onClick} onContextMenu={onContextMenu}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{
        position:"absolute",left:node.x,top:node.y,
        width:COL_W,height:COL_H,
        background:"var(--node-bg)",
        border:`var(--node-border-w) solid ${isSel?"var(--accent)":`${t.color}65`}`,
        borderRadius:"var(--radius-node)",
        boxShadow:isSel?"var(--shadow-node-sel)":"var(--shadow-node)",
        cursor:mode==="connect"?"crosshair":canEdit?"grab":"default",
        userSelect:"none",touchAction:"none",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,
        overflow:"visible",
        transition:"var(--transition-all)",
        zIndex:hovered?20:1,
      }}
    >
      {/* Icon */}
      <NodeIcon icon={t.icon} size={28} color={t.color} />
      {/* Name */}
      <span style={{fontSize:10,fontWeight:700,color:t.color,textAlign:"center",lineHeight:1.2,padding:"0 4px",maxWidth:COL_W-8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {node.title}
      </span>
      {/* ⊞ Expand icon — top-right of collapsed node */}
      {canEdit&&(
        <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onToggleCollapse(e);}}
          title="Expand node (⊞)"
          style={{position:"absolute",top:2,right:2,background:"none",borderRadius:3,color:t.color,cursor:"pointer",fontSize:11,width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
          ⊞
        </button>
      )}
      {/* Status dots: notes (blue), properties (green), connections — injected via prop */}
      <div style={{position:"absolute",bottom:3,left:0,right:0,display:"flex",justifyContent:"center",gap:3,pointerEvents:"none"}}>
        {(Array.isArray(node.notes)?node.notes:[]).length>0&&<div title="Has notes" style={{width:5,height:5,borderRadius:"50%",background:"var(--accent)",opacity:.9}}/>}
        {Object.values(node.properties||{}).some(v=>v)&&<div title="Has properties" style={{width:5,height:5,borderRadius:"50%",background:"var(--success)",opacity:.9}}/>}
        {Object.keys(node.customProps||{}).length>0&&<div title="Has custom fields" style={{width:5,height:5,borderRadius:"50%",background:"#d2a8ff",opacity:.9}}/>}
      </div>

      {/* Hover tooltip */}
      {hovered&&(propEntries.length>0||node.notes)&&(
        <div style={{
          position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",
          background:"var(--bg2)",borderRadius:"var(--radius-md)",
          padding:"10px 12px",minWidth:180,maxWidth:260,
          boxShadow:"0 8px 28px var(--shadow)",zIndex:100,
          pointerEvents:"none",
        }}>
          <div style={{fontSize:12,fontWeight:700,color:t.color,marginBottom:6}}><NodeIcon icon={t.icon} size={16} color={t.color} /> {node.title}</div>
          {propEntries.map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:6,fontSize:11,marginBottom:2}}>
              <span style={{color:"var(--text4)",flexShrink:0}}>{k}:</span>
              <span style={{color:"var(--text2)"}}>{String(v).slice(0,30)}</span>
            </div>
          ))}
{(Array.isArray(node.notes)?node.notes:[]).filter(nt=>!nt.sensitive).slice(0,2).map(nt=>(
            <div key={nt.id} style={{fontSize:10,color:"var(--text3)",marginTop:4,fontStyle:"italic",borderTop:"1px solid var(--border2)",paddingTop:4}}>
              {nt.title&&<span style={{fontWeight:700,marginRight:4}}>{nt.title}:</span>}{stripHtml(nt.content).slice(0,80)}
            </div>
          ))}
          <div style={{fontSize:9,color:"var(--text4)",marginTop:5,textAlign:"right"}}>Click for full details</div>
        </div>
      )}
    </div>
  );
}

// ── Node Sidebar ──────────────────────────────────────────────
// Modes: full (178px) → compact (136px icons+labels) → icons (48px) → full
function NodeSidebar({cats,addNode,canEdit,inline,collapsed,onToggleCollapse,iconOnly,onToggleIconOnly,dense,onToggleDense,onCycleMode,recentTypes=[]}){
  const [search, setSearch]   = useState("");
  const [catOpen, setCatOpen] = useState({});
  const [tooltip, setTooltip] = useState(null);

  const toggle = cat => setCatOpen(p=>({...p,[cat]:!(p[cat]===undefined?true:p[cat])}));
  const q = search.trim().toLowerCase();

  const filtered = Object.entries(NT).filter(([,t])=>
    !q || t.label.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q)
  );
  const groups = {};
  filtered.forEach(([k,t])=>{ if(!groups[t.cat]) groups[t.cat]=[]; groups[t.cat].push([k,t]); });
  const visibleCats = SIDEBAR_CATS.filter(c=>groups[c]?.length);

  const COMPACT_W = 136;
  const ICON_W    = 48;
  const FULL_W    = 178;

  const sideW = iconOnly ? ICON_W : dense ? COMPACT_W : FULL_W;

  // ── Collapsed bar ────────────────────────────────────────────
  if(collapsed){
    return(
      <div style={{width:28,flexShrink:0,background:"var(--bg2)",borderRight:"1px solid var(--border2)",
        display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8,gap:6,overflow:"hidden"}}>
        <button onClick={onToggleCollapse}
          style={{background:"none",borderRadius:"var(--radius-sm)",
            color:"var(--text4)",cursor:"pointer",fontSize:13,width:20,height:20,display:"flex",
            alignItems:"center",justifyContent:"center",lineHeight:1}}>›</button>
        <div style={{writingMode:"vertical-rl",fontSize:9,fontWeight:700,color:"var(--text4)",
          letterSpacing:2,marginTop:8,userSelect:"none",opacity:.6}}>NODES</div>
      </div>
    );
  }

  return(
    <div style={{width:sideW,flexShrink:0,background:"var(--bg2)",
      borderRight:"1px solid var(--border2)",display:"flex",flexDirection:"column",
      overflow:"hidden",transition:"width .18s",position:"relative"}}>

      {/* ── Header ── */}
      <div style={{padding:"6px 8px 5px",borderBottom:"1px solid var(--border2)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:4}}>
          {!iconOnly&&<span style={{fontSize:9,fontWeight:700,color:"var(--text4)",letterSpacing:.5,flex:1,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>
            {dense?"NODES":"NODES"}
          </span>}
          {iconOnly&&<div style={{flex:1}}/>}
          {/* Mode cycle button */}
          <button onClick={onCycleMode}
            title={iconOnly?"Switch to full mode":dense?"Switch to icons only":"Switch to compact mode"}
            style={{background:"none",borderRadius:"var(--radius-xs)",
              color:dense||iconOnly?"var(--accent)":"var(--text4)",cursor:"pointer",fontSize:8,
              padding:"1px 4px",height:15,display:"flex",alignItems:"center",
              lineHeight:1,flexShrink:0,whiteSpace:"nowrap",gap:2}}>
            {iconOnly?"⊞ Full":dense?"⊡ Icons":"⊟ Compact"}
          </button>
          <button onClick={onToggleCollapse} title="Collapse"
            style={{background:"none",borderRadius:"var(--radius-xs)",
              color:"var(--text4)",cursor:"pointer",fontSize:10,width:15,height:15,
              display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,flexShrink:0}}>‹</button>
        </div>

        {/* Search — visible in all modes */}
        {!iconOnly?(
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",
              fontSize:10,color:"var(--text4)",pointerEvents:"none"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={dense?"Search…":"Search types…"}
              style={{width:"100%",boxSizing:"border-box",paddingLeft:20,paddingRight:search?18:5,
                paddingTop:3,paddingBottom:3,background:"var(--bg3)",
                borderRadius:"var(--radius-sm)",color:"var(--text)",fontSize:dense?9:11,
                fontFamily:"var(--font-ui)",outline:"none"}}/>
            {search&&<span onClick={()=>setSearch("")}
              style={{position:"absolute",right:5,top:"50%",transform:"translateY(-50%)",
                fontSize:11,color:"var(--text4)",cursor:"pointer"}}>×</span>}
          </div>
        ):(
          <button onClick={onCycleMode} title="Switch to full view to search"
            style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",
              fontSize:11,width:"100%",display:"flex",justifyContent:"center",paddingTop:2}}>🔍</button>
        )}
      </div>

      {/* ── Node list ── */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}} onMouseLeave={()=>setTooltip(null)}>
        {visibleCats.length===0&&q&&(
          <div style={{padding:"16px 10px",color:"var(--text4)",fontSize:10,textAlign:"center"}}>
            No nodes match "{search}"
          </div>
        )}

        {/* ── Recently used — your real working set, one click away ── */}
        {!q&&recentTypes.length>0&&(
          <div>
            <div style={{display:"flex",alignItems:"center",padding:iconOnly?"4px 0":"4px 8px",
              background:"var(--bg3)",borderBottom:"1px solid var(--border2)",gap:3}}>
              {!iconOnly&&<span style={{fontSize:8,fontWeight:700,color:"var(--accent)",letterSpacing:1.5,flex:1}}>RECENT</span>}
              {iconOnly&&<div style={{width:"100%",height:2,background:"var(--accent)44",margin:"0 4px",borderRadius:1}}/>}
            </div>
            <div style={{display:iconOnly||dense?"flex":"block",flexWrap:"wrap",padding:iconOnly?"3px 2px":dense?"3px 4px":0}}>
              {recentTypes.filter(k=>NT[k]).map(k=>{
                const t=NT[k], Ic=t.icon;
                return(
                  <div key={"rc-"+k} onClick={()=>canEdit&&addNode(k)}
                    title={t.label}
                    style={{display:"flex",alignItems:"center",gap:6,cursor:canEdit?"pointer":"default",
                      padding:iconOnly?"4px":dense?"3px 4px":"4px 10px",opacity:canEdit?1:.4,
                      borderRadius:"var(--radius-xs)"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{color:t.color,display:"flex",flexShrink:0}}>{typeof Ic==="function"||typeof Ic==="object"?<Ic size={dense||iconOnly?13:14}/>:<NodeIcon icon={t.icon} size={14} color={t.color}/>}</span>
                    {!iconOnly&&!dense&&<span style={{fontSize:10,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visibleCats.map(cat=>{
          const items=groups[cat]||[];
          const isOpen=catOpen[cat]===undefined?true:catOpen[cat];
          const showOpen=q?true:isOpen;

          return(
            <div key={cat}>
              {/* Category header — always shown in all modes */}
              <div onClick={()=>toggle(cat)}
                style={{display:"flex",alignItems:"center",padding:iconOnly?"4px 0":"4px 8px",
                  cursor:"pointer",background:"var(--bg3)",
                  borderBottom:"1px solid var(--border2)",borderTop:"1px solid var(--border2)",
                  userSelect:"none",position:"sticky",top:0,zIndex:1,gap:3}}>
                {!iconOnly&&(
                  <>
                    <span style={{fontSize:8,fontWeight:700,color:"var(--text4)",letterSpacing:dense?0.5:1.5,flex:1,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {dense?cat.slice(0,8).toUpperCase():cat.toUpperCase()}
                    </span>
                    <span style={{fontSize:8,color:"var(--text4)",opacity:.7}}>{items.length}</span>
                    <span style={{fontSize:8,color:"var(--text4)",transition:"transform .15s",display:"inline-block",
                      transform:showOpen?"rotate(0deg)":"rotate(-90deg)"}}>▾</span>
                  </>
                )}
                {iconOnly&&<div style={{width:"100%",height:2,background:"var(--border2)",margin:"0 4px",borderRadius:1}}/>}
              </div>

              {/* Items */}
              {showOpen&&(
                iconOnly||dense?(
                  // Compact / icon grid — CSS grid auto-fills to eliminate trailing gap
                  <div style={{display:"grid",
                    gridTemplateColumns:dense?"repeat(auto-fill,minmax(30px,1fr))":"repeat(auto-fill,minmax(36px,1fr))",
                    gap:dense?2:3,padding:dense?"3px 4px":"3px 2px"}}>
                    {items.map(([key,t])=>(
                      <div key={key}
                        onClick={()=>canEdit&&addNode(key)}
                        onMouseEnter={e=>{
                          const r=e.currentTarget.getBoundingClientRect();
                          setTooltip({key,label:t.label,color:t.color,x:r.right+6,y:r.top+r.height/2});
                        }}
                        onMouseLeave={()=>setTooltip(null)}
                        title={t.label}
                        style={{aspectRatio:"1",borderRadius:5,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:dense?15:18,cursor:canEdit?"pointer":"default",
                          transition:"background .1s,border-color .1s",
                          border:"1.5px solid transparent"}}
                        onMouseOver={e=>{
                          e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)";
                          e.currentTarget.style.borderColor=t.color+"70";
                        }}
                        onMouseOut={e=>{
                          e.currentTarget.style.boxShadow="";
                          e.currentTarget.style.borderColor="transparent";
                        }}>
                        <NodeIcon icon={t.icon} size={16} color={t.color} />
                      </div>
                    ))}
                  </div>
                ):(
                  // Full label list
                  items.map(([key,t])=>(
                    <div key={key} onClick={()=>canEdit&&addNode(key)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",
                        cursor:canEdit?"pointer":"default",
                        borderLeft:"3px solid transparent",transition:"background .1s,border-color .1s"}}
                      onMouseEnter={e=>{if(canEdit){e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)";e.currentTarget.style.borderLeftColor=t.color;}}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.borderLeftColor="transparent";}}>
                      <NodeIcon icon={t.icon} size={15} color={t.color} />
                      <span style={{color:"var(--text2)",flex:1,overflow:"hidden",textOverflow:"ellipsis",
                        whiteSpace:"nowrap",fontSize:11}}>{t.label}</span>
                      <span style={{width:5,height:5,borderRadius:"50%",background:t.color,flexShrink:0}}/>
                    </div>
                  ))
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip for icon/compact modes */}
      {(iconOnly||dense)&&tooltip&&(
        <div style={{position:"fixed",left:tooltip.x,top:tooltip.y-14,zIndex:999,
          background:"var(--bg2)",
          borderRadius:"var(--radius-sm)",padding:"3px 9px",fontSize:11,
          fontWeight:700,color:tooltip.color,
          boxShadow:"var(--nEs,4px 4px 9px var(--neu-shadow),-3px -3px 6px var(--neu-hilight))",pointerEvents:"none",whiteSpace:"nowrap"}}>
          {tooltip.label}
        </div>
      )}

      {!canEdit&&!iconOnly&&(
        <div style={{padding:"5px 10px",fontSize:9,color:"var(--text4)",borderTop:"1px solid var(--border2)"}}>
          View only
        </div>
      )}
    </div>
  );
}
// ── NodeNotesTab ───────────────────────────────────────────────
function NodeNotesTab({ node, canEdit, t, onUpdate }) {
  const [preview, setPreview] = useState(false);

  const getInitialDraft = (n) => {
    if (n.node_notes && n.node_notes.trim()) return n.node_notes;
    try {
      const arr = Array.isArray(n.notes) ? n.notes
        : JSON.parse(typeof n.notes === 'string' ? n.notes : '[]');
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map(nt => {
          const title = (nt.title || '').trim();
          const content = (nt.content || '').replace(/<[^>]+>/g, '').trim();
          return title ? `### ${title}\n${content}` : content;
        }).filter(Boolean).join('\n\n');
      }
    } catch {}
    return '';
  };

  const [draft, setDraft] = useState(() => getInitialDraft(node));
  const saveTimer = useRef(null);

  useEffect(() => { setDraft(getInitialDraft(node)); }, [node.id]);

  const save = (text, priv) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdate({ node_notes: text, notes_private: priv ?? node.notes_private ?? false });
    }, 600);
  };

  const appendTimestamp = () => {
    const ts = new Date().toLocaleString('en-GB', { day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' });
    const header = `\n\n---\n### ${ts}\n`;
    const newVal = (draft.trimEnd()) + header;
    setDraft(newVal);
    save(newVal, node.notes_private);
  };

  const isPrivate = node.notes_private || false;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:0 }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, flexShrink:0 }}>
        <span style={{ fontSize:10, color:'var(--text4)', fontWeight:700, letterSpacing:1, flex:1 }}>NOTES</span>
        {canEdit && (
          <button onClick={appendTimestamp} title="Add timestamp entry"
            style={{ fontSize:10, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:4,
              color:'var(--text3)', cursor:'pointer', padding:'2px 8px', fontFamily:'var(--font-ui)' }}>
            + Entry
          </button>
        )}
        <button onClick={() => setPreview(p => !p)} title={preview ? "Edit" : "Preview"}
          style={{ fontSize:10, background: preview ? 'var(--accent2)' : 'var(--bg3)',
            border:'1px solid var(--border)', borderRadius:4,
            color: preview ? '#fff' : 'var(--text3)', cursor:'pointer', padding:'2px 8px', fontFamily:'var(--font-ui)' }}>
          {preview ? '✎ Edit' : '👁 Preview'}
        </button>
      </div>

      {/* Private toggle */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'5px 8px',
        background: isPrivate ? 'var(--danger)11' : 'var(--bg3)',
        border:`1px solid ${isPrivate ? 'var(--danger)44' : 'var(--border)'}`,
        borderRadius:'var(--radius-sm)', flexShrink:0 }}>
        <span style={{ fontSize:10, color: isPrivate ? 'var(--danger)' : 'var(--text3)', flex:1 }}>
          {isPrivate ? '🔒 Private — only editors & above can see' : '🌐 Public — visible to everyone'}
        </span>
        {canEdit && (
          <button onClick={() => { onUpdate({ notes_private: !isPrivate }); }}
            style={{ background: isPrivate ? 'var(--danger)' : 'var(--bg)',
              border:`1.5px solid ${isPrivate ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius:10, width:32, height:18, cursor:'pointer', position:'relative',
              transition:'background .15s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:2, left: isPrivate ? 14 : 2, width:12, height:12,
              borderRadius:'50%', background: isPrivate ? '#fff' : 'var(--text4)', transition:'left .15s' }}/>
          </button>
        )}
      </div>

      {/* Content */}
      {preview ? (
        <div style={{ flex:1, overflow:'auto', padding:'8px', background:'var(--bg3)',
          borderRadius:'var(--radius-sm)', fontSize:12, lineHeight:1.7,
          color:'var(--text2)', border:'1px solid var(--border)' }}>
          {draft.trim() ? <FormattedContent content={draft} /> :
            <span style={{ color:'var(--text4)', fontStyle:'italic' }}>Nothing written yet.</span>}
        </div>
      ) : (
        <textarea
          value={draft}
          onChange={e => { setDraft(e.target.value); save(e.target.value, isPrivate); }}
          readOnly={!canEdit}
          placeholder={canEdit
            ? "Write anything — steps, observations, commands, decisions…\nClick '+ Entry' to add a timestamped section."
            : "No notes yet."}
          style={{ flex:1, resize:'none', background:'var(--bg3)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-sm)', padding:'8px 10px', color:'var(--text)',
            fontSize:12, fontFamily:'var(--font-ui)', lineHeight:1.7, outline:'none',
            minHeight:180, width:'100%', boxSizing:'border-box' }}
        />
      )}

      {/* Last saved hint */}
      {node.updated_at && (
        <div style={{ fontSize:9, color:'var(--text4)', marginTop:4, textAlign:'right', flexShrink:0 }}>
          Last saved {new Date(node.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ── Props Panel ───────────────────────────────────────────────
// ── Editable custom property key with duplicate detection ────────────────
function CustomKeyInput({ propKey, node, canEdit, onRename, style }) {
  const [val, setVal]   = useState(propKey);
  const [err, setErr]   = useState("");

  // Reset if the key changes externally (e.g. successful rename)
  const prevKey = useRef(propKey);
  useEffect(() => { if(propKey !== prevKey.current){ setVal(propKey); setErr(""); prevKey.current=propKey; }}, [propKey]);

  const takenKeys = (inputVal) => {
    const lower = inputVal.trim().toLowerCase();
    const defaultKeys = Object.keys(node.properties||{}).map(k=>k.toLowerCase());
    const customKeys  = Object.keys(node.customProps||{}).filter(k=>k!==propKey).map(k=>k.toLowerCase());
    return [...defaultKeys,...customKeys].includes(lower);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    if(v.trim() && v.trim() !== propKey && takenKeys(v))
      setErr("Name already used by another property");
    else setErr("");
  };

  const handleBlur = (e) => {
    const nk = e.target.value.trim();
    if(!nk){ setVal(propKey); setErr(""); return; }           // empty → revert
    if(nk === propKey){ setErr(""); return; }                  // unchanged → ok
    if(takenKeys(nk)){ setErr("Name already used by another property"); setVal(propKey); return; } // dupe → revert
    onRename(propKey, nk);                                     // success
    setErr("");
  };

  return (
    <div style={{flex:"0 0 42%",display:"flex",flexDirection:"column",gap:2}}>
      <input
        value={val}
        disabled={!canEdit}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={e=>{if(e.key==="Enter")e.target.blur();e.stopPropagation();}}
        placeholder="property name"
        style={{...style,
          border: err ? "1.5px solid var(--danger)" : style?.border,
          outline: err ? "none" : undefined,
          boxShadow: err ? "0 0 0 2px var(--danger)30" : undefined,
        }}
      />
      {err && <span style={{fontSize:9,color:"var(--danger)",lineHeight:1.3,paddingLeft:2}}>{err}</span>}
    </div>
  );
}

function PropsPanel({node,edges,nodes,isMobile,canEdit,onClose,onUpdate,onUpdateProp,onUpdateCustom,onDeleteCustom,onAddCustom,onRenameCustom,onUpdateEdge,onDeleteEdge,onResetSize,onUpdateNotes,onStartEditTitle,onToggleCollapse}){
  const t=NT[node.type]||NT.note;
  const nodeEdges=edges.filter(e=>e.from===node.id||e.to===node.id);
  return(
    <div style={isMobile?{position:"absolute",bottom:0,left:0,right:0,height:"65vh",background:"var(--bg2)",borderTop:"1px solid var(--border)",borderRadius:"14px 14px 0 0",overflow:"auto",zIndex:40,animation:"slideUp .25s ease"}:{width:"var(--props-w)",background:"var(--bg2)",borderLeft:"1px solid var(--border2)",overflow:"auto",flexShrink:0}}>
      <div style={{padding:"11px 14px",borderBottom:"1px solid var(--border2)",display:"flex",alignItems:"center",gap:8,position:"sticky",top:0,background:"var(--bg2)",zIndex:1}}>
        <NodeIcon icon={t.icon} size={16} color={t.color} />
        <span style={{fontSize:11,color:t.color,fontWeight:700,flex:1}}>{t.label.toUpperCase()}</span>
        <button onClick={onToggleCollapse} title={node.collapsed?"Expand node":"Collapse node"}
          style={{background:node.collapsed?"var(--success)18":"var(--bg3)",borderRadius:5,color:node.collapsed?"var(--success)":"var(--text3)",cursor:"pointer",fontSize:10,padding:"3px 9px",fontFamily:"inherit",fontWeight:700}}>
          {node.collapsed?"▶ EXPAND":"◀ COLLAPSE"}
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
      </div>
      <div style={{padding:"13px 14px",display:"flex",flexDirection:"column",gap:11}}>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
            <label style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>TITLE</label>
            {canEdit&&<button onClick={onStartEditTitle} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>✏ inline</button>}
          </div>
          <input value={node.title} onChange={e=>onUpdate(node.id,{title:e.target.value})} disabled={!canEdit} style={inp()}/>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
            <label style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>SIZE</label>
            {canEdit&&<button onClick={onResetSize} style={{background:"none",borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:"inherit"}}>⊡ RESET</button>}
          </div>
          <div style={{display:"flex",gap:6}}>
            {["w","h"].map(dim=>(
              <div key={dim} style={{flex:1}}>
                <label style={{fontSize:9,color:"var(--text4)"}}>{dim.toUpperCase()}</label>
                <input type="number" value={node[dim]} onChange={e=>onUpdate(node.id,{[dim]:+e.target.value})} disabled={!canEdit} style={{...inp(),marginTop:2}}/>
              </div>
            ))}
          </div>
        </div>
        {/* ── PORTS / INTERFACES — with canvas auto-populate ── */}
        {Array.isArray(node.properties?.Ports)&&(()=>{
          const canvasConn=edges.filter(e=>e.from===node.id||e.to===node.id)
            .map(e=>{const oid=e.from===node.id?e.to:e.from;return nodes.find(n=>n.id===oid)?.title||null;})
            .filter(Boolean);
          const unassigned=canvasConn.filter(name=>!(node.properties.Ports||[]).some(p=>p.connected===name));
          const autoFill=()=>{
            const ports=[...(node.properties.Ports||[])];
            let ui=0;
            for(let pi=0;pi<ports.length&&ui<unassigned.length;pi++){
              if(!ports[pi].connected){ports[pi]={...ports[pi],connected:unassigned[ui]};ui++;}
            }
            onUpdateProp(node.id,"Ports",ports);
          };
          return(
          <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,flex:1}}>PORTS / INTERFACES</span>
              {canEdit&&unassigned.length>0&&<button onClick={autoFill}
                title={`Auto-assign: ${unassigned.join(", ")}`}
                style={{fontSize:10,background:"var(--accent1)18",border:"1px solid var(--accent1)",
                  borderRadius:"var(--radius-xs)",color:"var(--accent1)",cursor:"pointer",
                  padding:"2px 7px",fontFamily:"inherit"}}>⚡ Auto-fill</button>}
              {canEdit&&<button onClick={()=>{
                const ports=[...(node.properties.Ports||[]),
                  {id:Math.random().toString(36).slice(2,7),label:`Port ${(node.properties.Ports||[]).length+1}`,type:"Ethernet",connected:"",ip:"",vlan:""}];
                onUpdateProp(node.id,"Ports",ports);
              }} style={{fontSize:10,background:"none",
                borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",
                padding:"2px 8px",fontFamily:"inherit"}}>+ Port</button>}
            </div>
            {canvasConn.length>0&&(
              <div style={{fontSize:10,color:"var(--text4)",background:"var(--bg3)",borderRadius:5,
                padding:"4px 8px",marginBottom:6,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                <span style={{fontWeight:700,marginRight:2}}>Canvas:</span>
                {canvasConn.map((name,i)=>(
                  <span key={i} style={{background:unassigned.includes(name)?"var(--accent1)22":"var(--success)22",
                    color:unassigned.includes(name)?"var(--accent1)":"var(--success)",
                    borderRadius:3,padding:"1px 5px",fontSize:9,fontWeight:600}}>
                    {unassigned.includes(name)?"○ ":"✓ "}{name}
                  </span>
                ))}
              </div>
            )}
            <datalist id={`portconn-${node.id}`}>
              {canvasConn.map((name,i)=><option key={i} value={name}/>)}
            </datalist>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:4}}>
              {(node.properties.Ports||[]).map((port,pi)=>(
                <div key={port.id||pi} style={{display:"grid",
                  gridTemplateColumns:"60px 90px 1fr 1fr auto",
                  gap:4,alignItems:"center",
                  background:"var(--bg3)",borderRadius:6,padding:"5px 8px",
                  border:port.connected?"1px solid var(--success)44":"1px solid var(--border2)"}}>
                  <input value={port.label||""} placeholder="eth0"
                    disabled={!canEdit}
                    onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],label:e.target.value};onUpdateProp(node.id,"Ports",p);}}
                    style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0,fontFamily:"monospace"}}/>
                  <select value={port.type||"Ethernet"} disabled={!canEdit}
                    onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],type:e.target.value};onUpdateProp(node.id,"Ports",p);}}
                    style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0}}>
                    <optgroup label="Network"><option>Ethernet</option><option>WAN</option><option>LAN</option>
                      <option>uplink</option><option>access</option><option>trunk</option><option>PoE</option>
                      <option>mgmt</option><option>SFP+</option><option>SFP28</option><option>QSFP28</option></optgroup>
                    <optgroup label="USB"><option>USB 3.0</option><option>USB 2.0</option><option>USB-C</option></optgroup>
                    <optgroup label="Thunderbolt"><option>Thunderbolt 4</option><option>Thunderbolt 3</option></optgroup>
                    <optgroup label="Video"><option>HDMI</option><option>DisplayPort</option><option>VGA</option></optgroup>
                    <optgroup label="Storage"><option>SATA</option><option>PCIe/NVMe</option><option>HBA</option></optgroup>
                    <optgroup label="Management"><option>iDRAC/iLO</option><option>IPMI</option></optgroup>
                    <optgroup label="Other"><option>Serial/COM</option><option>Fiber</option><option>Other</option></optgroup>
                  </select>
                  <input value={port.connected||""} placeholder="Connected to…"
                    list={`portconn-${node.id}`}
                    disabled={!canEdit}
                    onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],connected:e.target.value};onUpdateProp(node.id,"Ports",p);}}
                    style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0,
                      color:port.connected?"var(--success)":"inherit"}}/>
                  <input value={port.ip||port.vlan||""} placeholder="IP / VLAN"
                    disabled={!canEdit}
                    onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],ip:e.target.value,vlan:e.target.value};onUpdateProp(node.id,"Ports",p);}}
                    style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0}}/>
                  {canEdit&&<button onClick={()=>{const p=(node.properties.Ports||[]).filter((_,i)=>i!==pi);onUpdateProp(node.id,"Ports",p);}}
                    style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:14,flexShrink:0,lineHeight:1}}>×</button>}
                </div>
              ))}
              {!(node.properties?.Ports?.length)&&(
                <div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>No ports configured</div>
              )}
            </div>
          </div>
          );
        })()}
        {/* ── SERVICES / VMs / CONTAINERS ── */}
        {Array.isArray(node.properties?.Services)&&(
          <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,flex:1}}>SERVICES / VMs / CONTAINERS</span>
              {canEdit&&<button onClick={()=>{
                const svcs=[...(node.properties.Services||[]),
                  {id:Math.random().toString(36).slice(2,7),name:"",type:"Docker",ip:"",port:"",status:"Running",image:"",os:"",memory:"",cpu:"",notes:""}];
                onUpdateProp(node.id,"Services",svcs);
              }} style={{fontSize:10,background:"none",
                borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",
                padding:"2px 8px",fontFamily:"inherit"}}>+ Add</button>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:6}}>
              {(node.properties.Services||[]).map((svc,si)=>(
                <div key={svc.id||si} style={{background:"var(--bg3)",borderRadius:7,padding:"8px 10px",
                  border:`1px solid ${svc.status==="Running"?"var(--success)33":svc.status==="Stopped"?"var(--danger)33":svc.status==="Error"?"var(--danger)55":"var(--border2)"}`}}>
                  {/* auto-populated badge */}
                  {nodes.find(n=>n.id===svc.id)&&(
                    <div style={{fontSize:9,color:"var(--accent1)",background:"var(--accent1)15",borderRadius:3,padding:"1px 6px",marginBottom:4,display:"inline-flex",alignItems:"center",gap:3}}>
                      ⚡ auto — linked to <strong>{nodes.find(n=>n.id===svc.id)?.title}</strong>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 88px 76px auto",gap:4,marginBottom:5,alignItems:"center"}}>
                    <input value={svc.name||""} placeholder="Service name…" disabled={!canEdit}
                      onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],name:e.target.value};onUpdateProp(node.id,"Services",s);}}
                      style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0,fontWeight:600}}/>
                    <select value={svc.type||"Docker"} disabled={!canEdit}
                      onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],type:e.target.value};onUpdateProp(node.id,"Services",s);}}
                      style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0}}>
                      <option>Docker</option><option>VM</option><option>LXC</option>
                      <option>App</option><option>Service</option><option>Daemon</option>
                      <option>Web App</option><option>Database</option><option>API</option><option>Other</option>
                    </select>
                    <select value={svc.status||"Running"} disabled={!canEdit}
                      onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],status:e.target.value};onUpdateProp(node.id,"Services",s);}}
                      style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:0,fontWeight:600,
                        color:svc.status==="Running"?"var(--success)":svc.status==="Stopped"?"var(--danger)":svc.status==="Error"?"var(--danger)":"var(--text2)"}}>
                      <option>Running</option><option>Stopped</option><option>Paused</option><option>Error</option><option>Starting</option>
                    </select>
                    {canEdit&&<button onClick={()=>{const s=(node.properties.Services||[]).filter((_,i)=>i!==si);onUpdateProp(node.id,"Services",s);}}
                      style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 70px 1fr",gap:4,marginBottom:4}}>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>IP</label>
                      <input value={svc.ip||""} placeholder="192.168.x.x" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],ip:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>PORT</label>
                      <input value={svc.port||""} placeholder="8080" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],port:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>IMAGE / OS</label>
                      <input value={svc.image||svc.os||""} placeholder="nginx:latest / Ubuntu…" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],image:e.target.value,os:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"72px 56px 1fr",gap:4}}>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>MEMORY</label>
                      <input value={svc.memory||""} placeholder="2GB" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],memory:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>CPU</label>
                      <input value={svc.cpu||""} placeholder="2" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],cpu:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                    <div><label style={{fontSize:9,color:"var(--text4)"}}>NOTES</label>
                      <input value={svc.notes||""} placeholder="…" disabled={!canEdit}
                        onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],notes:e.target.value};onUpdateProp(node.id,"Services",s);}}
                        style={{...inp(),fontSize:10,padding:"3px 5px",marginTop:1}}/></div>
                  </div>
                </div>
              ))}
              {!(node.properties?.Services?.length)&&(
                <div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>No services configured</div>
              )}
            </div>
          </div>
        )}
        {Object.keys(node.properties||{}).filter(k=>k!=="Ports"&&k!=="Services").length>0&&<>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>TEMPLATE PROPERTIES</div>
          {Object.entries(node.properties||{}).filter(([k,v])=>!k.startsWith('_')&&k!=="Ports"&&k!=="Services"&&!Array.isArray(v)&&typeof v!=="object").map(([k,v])=>(
            <div key={k}>
              <label style={{fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:3,display:"block",color:`${t.color}cc`}}>{k.toUpperCase()}</label>
              <input value={v} onChange={e=>onUpdateProp(node.id,k,e.target.value)} disabled={!canEdit} style={inp()}/>
            </div>
          ))}
        </>}
        <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2}}>CUSTOM PROPERTIES</span>
            {canEdit&&<button onClick={onAddCustom} style={{background:"none",borderRadius:"var(--radius-xs)",color:"var(--text3)",cursor:"pointer",fontSize:10,padding:"2px 8px",fontFamily:"inherit"}}>+ ADD</button>}
          </div>
          {Object.entries(node.customProps||{}).map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:4,marginBottom:5,alignItems:"flex-start"}}>
              <CustomKeyInput propKey={k} node={node} canEdit={canEdit}
                onRename={(old,nk)=>onRenameCustom&&onRenameCustom(node.id,old,nk)}
                style={{...inp(),width:"100%",marginTop:0,fontWeight:600}}
              />
              <input value={v} onChange={e=>onUpdateCustom(node.id,k,e.target.value)} disabled={!canEdit}
                style={{...inp(),flex:1,marginTop:0,alignSelf:"flex-start"}}
                onKeyDown={e=>e.stopPropagation()}
                placeholder="value"
              />
              {canEdit&&<button onClick={()=>onDeleteCustom(node.id,k)}
                style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:16,flexShrink:0,alignSelf:"flex-start",paddingTop:2}}>×</button>}
            </div>
          ))}
          {!Object.keys(node.customProps||{}).length&&<div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>None yet</div>}
        </div>
        {/* ── NOTES SECTION ── */}
        <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,flex:1}}>NOTES</span>
            {canEdit&&<button onClick={()=>{
              const newNote={id:Math.random().toString(36).slice(2),title:"",content:"",sensitive:false};
              onUpdateNotes(node.id,[...(Array.isArray(node.notes)?node.notes:[]),newNote]);
            }} style={{fontSize:10,background:"var(--accent2)",border:"none",borderRadius:"var(--radius-xs)",
              color:"#fff",cursor:"pointer",padding:"2px 8px",fontFamily:"var(--font-ui)",fontWeight:700}}>
              + ADD NOTE
            </button>}
          </div>
          {(Array.isArray(node.notes)?node.notes:[]).map((nt,idx)=>(
            <NoteCard key={nt.id} note={nt} canEdit={canEdit}
              onChange={updated=>{
                const arr=[...(Array.isArray(node.notes)?node.notes:[])];
                arr[idx]=updated;
                onUpdateNotes(node.id,arr);
              }}
              onDelete={()=>{
                const arr=(Array.isArray(node.notes)?node.notes:[]).filter((_,i)=>i!==idx);
                onUpdateNotes(node.id,arr);
              }}
            />
          ))}
          {!(Array.isArray(node.notes)?node.notes:[]).length&&(
            <div style={{fontSize:11,color:"var(--text4)",fontStyle:"italic",textAlign:"center",padding:"10px 0"}}>
              No notes yet. Click + ADD NOTE to create one.
            </div>
          )}
        </div>
        {nodeEdges.length>0&&(
          <div style={{borderTop:"1px solid var(--border2)",paddingTop:10}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--text4)",letterSpacing:2,marginBottom:8}}>CONNECTIONS</div>
            {nodeEdges.map(edge=>{
              const other=nodes.find(n=>n.id===(edge.from===node.id?edge.to:edge.from));
              return(
                <div key={edge.id} style={{display:"flex",alignItems:"center",gap:5,marginBottom:6,fontSize:12}}>
                  <span style={{color:"var(--accent)",flexShrink:0}}>{edge.from===node.id?"→":"←"}</span>
                  <span style={{flex:1,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{other?.title||"?"}</span>
                  <input value={edge.label||""} placeholder="label" onChange={e=>onUpdateEdge(edge.id,{label:e.target.value})} disabled={!canEdit}
                    style={{...inp(),width:62,marginTop:0,padding:"3px 6px",fontSize:11}}/>
                  {canEdit&&<button onClick={()=>onDeleteEdge(edge.id)} style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:16,flexShrink:0}}>×</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Rich Text Editor — enhanced ──────────────────────────────────
function RichTextEditor({ value, onChange, disabled, minHeight = 100 }) {
  const editorRef = useRef(null);
  const isUpdating = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== (value || '')) {
      isUpdating.current = true;
      editorRef.current.innerHTML = value || '';
      isUpdating.current = false;
    }
  }, [value]);

  const exec = (cmd, val) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(cmd, false, val || null);
    onChange(editorRef.current?.innerHTML || '');
  };

  const TBtn = ({ cmd, val, title, active, children, style: s }) => (
    <button onMouseDown={e => { e.preventDefault(); exec(cmd, val); }} title={title}
      style={{
        background: active ? 'var(--accent2)' : 'transparent',
        border: 'none', borderRadius: 3, cursor: disabled ? 'default' : 'pointer',
        padding: '3px 5px', fontSize: 11, color: active ? '#fff' : 'var(--text3)',
        lineHeight: 1, minWidth: 22, height: 22, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, opacity: disabled ? 0.4 : 1, ...s,
      }}>{children}</button>
  );

  const [moreFmt,setMoreFmt]=useState(false); // advanced formatting hidden by default
  const Div = () => <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />;

  const FONT_SIZES = [['1', '10px', 'XS'], ['2', '12px', 'S'], ['3', '14px', 'M'], ['5', '18px', 'L'], ['6', '24px', 'XL']];
  const TEXT_COLORS = ['var(--text)', '#58a6ff', '#3fb950', '#f78166', '#ffa657', '#d2a8ff', '#ffb3c0', '#aff5b4'];
  const execColor = (c) => {
    // execCommand needs a real hex, resolve CSS vars first
    if (c.startsWith('var(')) {
      const resolved = getComputedStyle(document.documentElement).getPropertyValue(c.slice(4,-1).trim()).trim();
      return resolved || '#cccccc';
    }
    return c;
  };
  // BG_COLORS unused - hiliteColor handled by Highlight swatches below

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar Row 1 — essentials; advanced tools behind ⋯ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '3px 6px', background: 'var(--bg2)', borderBottom: '1px solid var(--border2)', flexWrap: 'wrap' }}>
        <TBtn cmd="bold"          title="Bold (Ctrl+B)"        style={{ fontWeight: 700 }}>B</TBtn>
        <TBtn cmd="italic"        title="Italic (Ctrl+I)"      style={{ fontStyle: 'italic' }}>I</TBtn>
        <TBtn cmd="underline"     title="Underline (Ctrl+U)"   style={{ textDecoration: 'underline' }}>U</TBtn>
        <TBtn cmd="strikeThrough" title="Strikethrough"        style={{ textDecoration: 'line-through' }}>S</TBtn>
        <TBtn cmd="insertUnorderedList" title="Bullet list">•≡</TBtn>
        <TBtn cmd="formatBlock" val="H1" title="Heading 1">H1</TBtn>
        <TBtn cmd="formatBlock" val="H2" title="Heading 2">H2</TBtn>
        <button onMouseDown={e=>{e.preventDefault();setMoreFmt(v=>!v);}} title="More formatting tools"
          style={{ minWidth:22,height:22,border:'none',borderRadius:4,cursor:'pointer',fontSize:11,
            background:moreFmt?'var(--accent2)':'var(--bg3)',color:moreFmt?'#fff':'var(--text3)' }}>⋯</button>
        {moreFmt&&<>
        <Div/>
        <TBtn cmd="superscript"   title="Superscript">x²</TBtn>
        <TBtn cmd="subscript"     title="Subscript">x₂</TBtn>
        <Div/>
        <TBtn cmd="formatBlock" val="H3"         title="Heading 3">H3</TBtn>
        <TBtn cmd="formatBlock" val="P"          title="Paragraph">¶</TBtn>
        <TBtn cmd="formatBlock" val="BLOCKQUOTE" title="Quote">❝</TBtn>
        <Div/>
        <TBtn cmd="justifyLeft"   title="Align left">⫷</TBtn>
        <TBtn cmd="justifyCenter" title="Center">≡</TBtn>
        <TBtn cmd="justifyRight"  title="Align right">⫸</TBtn>
        <Div/>
        <TBtn cmd="insertOrderedList"   title="Numbered list">1≡</TBtn>
        <TBtn cmd="indent"              title="Indent">→|</TBtn>
        <TBtn cmd="outdent"             title="Outdent">|←</TBtn>
        <Div/>
        <TBtn cmd="insertHorizontalRule" title="Horizontal rule">—</TBtn>
        <Div/>
        <TBtn cmd="removeFormat" title="Clear formatting">✕</TBtn>
        {/* Font size */}
        <Div/>
        <select onMouseDown={e => e.stopPropagation()}
          onChange={e => { exec('fontSize', e.target.value); }}
          defaultValue="3"
          style={{ fontSize: 9, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text3)', padding: '1px 3px', height: 22, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1 }}>
          {FONT_SIZES.map(([val, , lbl]) => <option key={val} value={val}>{lbl}</option>)}
        </select>
        </>}
      </div>
      {/* Toolbar Row 2 — colors (advanced) */}
      {moreFmt&&<div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: 'var(--bg2)', borderBottom: '1px solid var(--border2)' }}>
        <span style={{ fontSize: 9, color: 'var(--text4)', marginRight: 2 }}>Text</span>
        {TEXT_COLORS.map(c => (
          <div key={c} onMouseDown={e => { e.preventDefault(); exec('foreColor', execColor(c)); }}
            title={`Text: ${c}`}
            style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '1.5px solid var(--border)', cursor: disabled ? 'default' : 'pointer', flexShrink: 0 }}/>
        ))}
        <Div/>
        <span style={{ fontSize: 9, color: 'var(--text4)', marginRight: 2 }}>Highlight</span>
        {[['#fff9c4','Yellow'],['#c8e6c9','Green'],['#ffcdd2','Red'],['#bbdefb','Blue'],['#e1bee7','Purple'],['transparent','None']].map(([c, lbl]) => (
          <div key={c} onMouseDown={e => { e.preventDefault(); exec('hiliteColor', c === 'transparent' ? 'transparent' : c); }}
            title={`Highlight: ${lbl}`}
            style={{ width: 14, height: 14, borderRadius: 2, background: c === 'transparent' ? 'var(--bg3)' : c, border: '1.5px solid var(--border)', cursor: disabled ? 'default' : 'pointer', flexShrink: 0 }}/>
        ))}
      </div>}
      {/* Editor area */}
      <div ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={e => { if (!isUpdating.current) onChange(e.currentTarget.innerHTML); }}
        onKeyDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        data-placeholder="Write note content…"
        style={{
          minHeight, maxHeight: 320, overflowY: 'auto',
          padding: '10px 12px', fontSize: 12, lineHeight: 1.65,
          color: 'var(--text)', outline: 'none',
          background: disabled ? 'var(--bg3)' : 'var(--bg)',
          cursor: disabled ? 'default' : 'text',
        }}
      />
      <style>{`
        [contenteditable]:empty:before{content:attr(data-placeholder);color:var(--text4);font-style:italic;pointer-events:none}
        [contenteditable] h1{font-size:18px;font-weight:700;margin:8px 0 4px;color:var(--text)}
        [contenteditable] h2{font-size:14px;font-weight:700;margin:6px 0 2px;color:var(--text)}
        [contenteditable] h3{font-size:12px;font-weight:700;margin:4px 0 2px;color:var(--text2)}
        [contenteditable] blockquote{border-left:3px solid var(--accent);margin:4px 0;padding:4px 10px;color:var(--text3);font-style:italic}
        [contenteditable] ul,[contenteditable] ol{padding-left:18px;margin:4px 0}
        [contenteditable] li{margin-bottom:2px}
        [contenteditable] hr{border:none;border-top:1px solid var(--border2);margin:8px 0}
      `}</style>
    </div>
  );
}


// ── Note Card ─────────────────────────────────────────────────────
function NoteCard({ note, canEdit, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(!note.content);
  const preview = stripHtml(note.content).slice(0, 80);

  return (
    <div style={{
      marginBottom: 8, border: `1px solid ${note.sensitive ? 'var(--danger)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)', overflow: 'hidden',
      background: note.sensitive ? '#f7816608' : 'var(--bg)',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 8px', background: 'var(--bg3)',
        borderBottom: expanded ? '1px solid var(--border)' : 'none',
        cursor: 'pointer',
      }} onClick={() => setExpanded(v => !v)}>
        <span style={{ fontSize: 10, color: 'var(--text4)', flexShrink: 0 }}>{expanded ? '▾' : '▸'}</span>
        {canEdit ? (
          <input
            value={note.title || ''}
            onChange={e => { e.stopPropagation(); onChange({ ...note, title: e.target.value }); }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            placeholder="Note title…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 11, fontWeight: 700, color: 'var(--text)', fontFamily: 'inherit',
            }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
            {note.title || 'Note'}
          </span>
        )}
        {/* Sensitive toggle */}
        <button
          title={note.sensitive ? 'Sensitive — hidden from exports' : 'Mark as sensitive'}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onChange({ ...note, sensitive: !note.sensitive }); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
            color: note.sensitive ? 'var(--danger)' : 'var(--text4)',
            padding: '0 2px', flexShrink: 0,
          }}>
          {note.sensitive ? '🔒' : '🔓'}
        </button>
        {canEdit && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text4)', fontSize: 14, padding: '0 2px', flexShrink: 0 }}>
            ×
          </button>
        )}
      </div>
      {/* Collapsed preview */}
      {!expanded && preview && (
        <div style={{ padding: '4px 10px', fontSize: 10, color: 'var(--text3)',
          fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {note.sensitive ? '🔒 Sensitive content hidden' : preview}
          {stripHtml(note.content).length > 80 ? '…' : ''}
        </div>
      )}
      {/* Expanded editor */}
      {expanded && (
        <div style={{ padding: 8 }}>
          {note.sensitive && (
            <div style={{ fontSize: 10, color: 'var(--danger)', marginBottom: 6,
              padding: '4px 8px', background: '#f7816615', borderRadius: 4,
              display: 'flex', alignItems: 'center', gap: 5 }}>
              🔒 <strong>Sensitive</strong> — this note will be redacted in exports and LLM context
            </div>
          )}
          <RichTextEditor
            value={note.content || ''}
            onChange={html => onChange({ ...note, content: html })}
            disabled={!canEdit}
          />
        </div>
      )}
    </div>
  );
}

// ── Context Menu ─────────────────────────────────────────────────
function ContextMenu({x,y,nodeId,nodes,selected,edges,canEdit,onClose,
  onDuplicate,onDelete,onCollapse,onConnect,onEditTitle,onSelectAll,onProps}){
  const node=nodes.find(n=>n.id===nodeId);
  if(!node) return null;
  const t=NT[node.type]||NT.note;
  const connCount=edges.filter(e=>e.from===nodeId||e.to===nodeId).length;
  const isMulti=selected.size>1&&selected.has(nodeId);

  // Clamp to viewport
  const menuW=196, menuH=320;
  const vw=window.innerWidth, vh=window.innerHeight;
  const left=Math.min(x+220, vw-menuW-8)-220; // approx canvas offset
  const top=Math.min(y+48, vh-menuH-8)-48;

  const Item=({icon,label,sub,onClick,danger,disabled})=>(
    <div onClick={disabled?undefined:()=>{onClick();onClose();}}
      style={{display:"flex",alignItems:"center",gap:9,padding:"7px 13px",cursor:disabled?"default":"pointer",
        opacity:disabled?.4:1,transition:"background .1s",
        color:danger?"var(--danger)":"var(--text)"}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)";}}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
      <NodeIcon icon={icon} size={14} />
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:600}}>{label}</div>
        {sub&&<div style={{fontSize:9,color:danger?"var(--danger)":"var(--text4)",marginTop:1}}>{sub}</div>}
      </div>
    </div>
  );

  const Sep=()=><div style={{height:1,background:"var(--border2)",margin:"3px 0"}}/>;

  return(
    <div style={{
      position:"absolute",left:x,top:y,zIndex:601,
      background:"var(--bg2)",
      borderRadius:"var(--radius-md)",boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
      width:menuW,overflow:"hidden",userSelect:"none",
    }} onClick={e=>e.stopPropagation()}>
      {/* Header */}
      <div style={{padding:"8px 13px",borderBottom:"1px solid var(--border2)",background:"var(--bg3)",
        display:"flex",alignItems:"center",gap:7}}>
        <NodeIcon icon={t.icon} size={15} color={t.color} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:700,color:t.color,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node.title}</div>
          <div style={{fontSize:9,color:"var(--text4)"}}>{t.label}{connCount>0?` · ${connCount} connections`:""}</div>
        </div>
      </div>

      {canEdit&&<>
        <Item icon="✏" label="Edit title" sub="Double-click" onClick={onEditTitle}/>
        <Item icon="⤳" label="Connect from here" sub="C key" onClick={onConnect}/>
        <Sep/>
        <Item icon="⧉" label={isMulti?`Duplicate ${selected.size} nodes`:"Duplicate"} sub="Ctrl+D" onClick={onDuplicate}/>
        <Item icon={node.collapsed?"⊞":"⊟"} label={node.collapsed?"Expand":"Collapse"} onClick={onCollapse}/>
        <Item icon="✏" label="Properties" onClick={onProps}/>
        <Sep/>
        <Item icon="◻" label="Select all" sub="Ctrl+A" onClick={onSelectAll}/>
        <Sep/>
        <Item icon="🗑" label={isMulti?`Delete ${selected.size} nodes`:"Delete node"} sub="Del"
          danger onClick={onDelete}/>
      </>}
      {!canEdit&&(
        <div style={{padding:"10px 13px",fontSize:11,color:"var(--text4)",fontStyle:"italic"}}>View-only mode</div>
      )}
    </div>
  );
}

// ── Lightweight Markdown renderer ──────────────────────────────
function MarkdownNote({ text, color }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elems = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Heading
    if (/^#{1,3}\s/.test(line)) {
      const lvl = line.match(/^#+/)[0].length;
      const txt = line.replace(/^#+\s/, '');
      const sz = lvl === 1 ? 13 : lvl === 2 ? 12 : 11;
      elems.push(<div key={i} style={{fontWeight:700,fontSize:sz,color:'var(--text)',marginTop:lvl===1?4:2,marginBottom:1}}>{txt}</div>);
    }
    // HR
    else if (/^---+$/.test(line.trim())) {
      elems.push(<hr key={i} style={{border:'none',borderTop:`1px solid ${color}30`,margin:'4px 0'}}/>);
    }
    // Bullet
    else if (/^[-*]\s/.test(line)) {
      const txt = line.replace(/^[-*]\s/, '');
      elems.push(<div key={i} style={{display:'flex',gap:5,fontSize:11,color:'var(--text2)',lineHeight:1.5}}>
        <span style={{color,flexShrink:0,marginTop:1}}>•</span>
        <span>{inlineFormat(txt)}</span>
      </div>);
    }
    // Checkbox
    else if (/^\[[ x]\]\s/i.test(line)) {
      const done = line[1].toLowerCase() === 'x';
      const txt = line.replace(/^\[[ x]\]\s/i, '');
      elems.push(<div key={i} style={{display:'flex',gap:5,fontSize:11,color:done?'var(--text4)':'var(--text2)',lineHeight:1.5,textDecoration:done?'line-through':'none'}}>
        <span style={{color:done?'var(--success)':color,flexShrink:0}}>{done?'☑':'☐'}</span>
        <span>{inlineFormat(txt)}</span>
      </div>);
    }
    // Code block
    else if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      elems.push(<pre key={i} style={{background:'var(--bg)',borderRadius:4,
        padding:'4px 6px',fontSize:10,fontFamily:'monospace',color:'var(--text3)',
        margin:'2px 0',overflow:'auto',whiteSpace:'pre-wrap'}}>{codeLines.join("\n")}</pre>);
    }
    // Normal paragraph
    else if (line.trim()) {
      elems.push(<div key={i} style={{fontSize:11,color:'var(--text3)',lineHeight:1.55}}>{inlineFormat(line)}</div>);
    }
    // Blank line — small gap
    else {
      elems.push(<div key={i} style={{height:4}}/>);
    }
    i++;
  }
  return <>{elems}</>;
}

function inlineFormat(text) {
  // Bold **text**, italic *text*, inline code `text`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} style={{color:'var(--text)',fontWeight:700}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*'))
      return <em key={i} style={{color:'var(--text2)'}}>{p.slice(1,-1)}</em>;
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={i} style={{background:'var(--bg)',borderRadius:3,
        padding:'0 3px',fontSize:10,fontFamily:'monospace',color:'#79c0ff'}}>{p.slice(1,-1)}</code>;
    return p;
  });
}

function FormattedContent({ content }) {
  if (!content) return null;
  const segments = content.split(/(```[\s\S]*?```)/g);
  const elements = [];
  let ki = 0;
  segments.forEach(seg => {
    if (seg.startsWith('```') && seg.endsWith('```')) {
      const inner = seg.slice(3,-3);
      const lm = inner.match(/^[a-zA-Z]+\n/);
      const code = lm ? inner.slice(lm[0].length) : inner;
      elements.push(<pre key={ki++} style={{background:'var(--bg)',border:'1px solid var(--border2)',
        borderRadius:'var(--radius-sm)',padding:'7px 9px',fontSize:10,overflowX:'auto',
        margin:'4px 0',fontFamily:'monospace',color:'var(--accent)',lineHeight:1.5,whiteSpace:'pre'}}>{code.trimEnd()}</pre>);
      return;
    }
    const lines = seg.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^---+$/.test(line.trim())) { elements.push(<hr key={ki++} style={{border:'none',borderTop:'1px solid var(--border)',margin:'6px 0'}}/>); i++; continue; }
      const hm = line.match(/^(#{1,3})\s+(.+)/);
      if (hm) { const sz={1:13,2:12,3:11}[hm[1].length]; elements.push(<div key={ki++} style={{fontWeight:700,fontSize:sz,color:'var(--text)',margin:'6px 0 2px'}}>{inlineFormat(hm[2])}</div>); i++; continue; }
      if (line.startsWith('>')) { elements.push(<div key={ki++} style={{borderLeft:'3px solid var(--accent)',paddingLeft:7,color:'var(--text3)',fontStyle:'italic',margin:'3px 0',fontSize:11}}>{inlineFormat(line.replace(/^>\s*/,''))}</div>); i++; continue; }
      if (/^[-*]\s/.test(line)) {
        const items=[];
        while(i<lines.length&&/^[-*]\s/.test(lines[i])){items.push(lines[i].replace(/^[-*]\s/,''));i++;}
        elements.push(<ul key={ki++} style={{margin:'3px 0',paddingLeft:14,listStyle:'disc'}}>{items.map((it,li)=><li key={li} style={{color:'var(--text2)',fontSize:11,lineHeight:1.6}}>{inlineFormat(it)}</li>)}</ul>);
        continue;
      }
      if (/^\d+\.\s/.test(line)) {
        const items=[];
        while(i<lines.length&&/^\d+\.\s/.test(lines[i])){items.push(lines[i].replace(/^\d+\.\s/,''));i++;}
        elements.push(<ol key={ki++} style={{margin:'3px 0',paddingLeft:14}}>{items.map((it,li)=><li key={li} style={{color:'var(--text2)',fontSize:11,lineHeight:1.6}}>{inlineFormat(it)}</li>)}</ol>);
        continue;
      }
      if (line.trim()==='') { elements.push(<div key={ki++} style={{height:4}}/>); i++; continue; }
      elements.push(<div key={ki++} style={{color:'var(--text2)',fontSize:11,lineHeight:1.6}}>{inlineFormat(line)}</div>);
      i++;
    }
  });
  return <div style={{display:'flex',flexDirection:'column'}}>{elements}</div>;
}

// ── EdgeIcon — SVG preview of a connection style ──────────────
function EdgeIcon({ styleKey, size=40, active=false, color="var(--text3)" }) {
  const s = EDGE_STYLES[styleKey];
  if(!s) return null;
  const w=size, h=Math.round(size*0.55);
  const x1=6, x2=w-8, y=h/2;
  const dash = s.dash==="none" ? "none"
    : s.dash==="8,5" ? `${Math.round(size*.14)},${Math.round(size*.09)}`
    : `${Math.round(size*.035)},${Math.round(size*.09)}`;
  const sw = s.strokeW>=4 ? Math.round(size*.075) : Math.round(size*.045);
  const col = active?"var(--accent)":color;
  const arrowSize = Math.round(size*.13);

  // Arrow marker paths
  const ArrowHead = ({x,y,dir=1})=>(
    <polygon
      points={`${x},${y} ${x-dir*arrowSize},${y-arrowSize*.55} ${x-dir*arrowSize},${y+arrowSize*.55}`}
      fill={col}/>
  );

  // Wave path
  const wavePath = ()=>{
    const segs=5; const segW=(x2-x1)/segs;
    let d=`M ${x1} ${y}`;
    for(let i=0;i<segs;i++){
      const cx1=x1+i*segW+segW*.25, cy1=y-(h*.2);
      const cx2=x1+i*segW+segW*.75, cy2=y+(h*.2);
      const ex=x1+(i+1)*segW;
      d+=` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${y}`;
    }
    return d;
  };

  // Double line
  const offset=Math.round(size*.07);

  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:"block",overflow:"visible"}}>
      {s.wave?(
        <path d={wavePath()} stroke={col} strokeWidth={sw} fill="none"
          strokeDasharray={dash!=="none"?dash:undefined}/>
      ):s.strokeW>=1.5&&s.strokeW<2?(
        // Double line
        <>
          <line x1={x1} y1={y-offset} x2={x2} y2={y-offset} stroke={col} strokeWidth={sw*.7} fill="none"
            strokeDasharray={dash!=="none"?dash:undefined}/>
          <line x1={x1} y1={y+offset} x2={x2} y2={y+offset} stroke={col} strokeWidth={sw*.7} fill="none"
            strokeDasharray={dash!=="none"?dash:undefined}/>
        </>
      ):(
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={col} strokeWidth={sw} fill="none"
          strokeDasharray={dash!=="none"?dash:undefined}
          strokeLinecap="round"/>
      )}
      {/* End arrowhead */}
      {s.mEnd&&<ArrowHead x={x2} y={y} dir={1}/>}
      {/* Start arrowhead */}
      {s.mStart&&<ArrowHead x={x1} y={y} dir={-1}/>}
    </svg>
  );
}

// ── Search Panel ──────────────────────────────────────────────
function SearchPanel({query,setQuery,field,setField,results,onSelect,onClose,nodes,edges}){
  const inputRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),50); },[]);
  useEffect(()=>{ setActiveIdx(0); },[results]);

  const handleKey=(e)=>{
    if(e.key==="ArrowDown"){e.preventDefault();setActiveIdx(i=>Math.min(i+1,results.length-1));}
    if(e.key==="ArrowUp")  {e.preventDefault();setActiveIdx(i=>Math.max(i-1,0));}
    if(e.key==="Enter"&&results[activeIdx]){e.preventDefault();onSelect(results[activeIdx]);}
    if(e.key==="Escape"){onClose();}
  };

  const Hl=({text,q})=>{
    if(!q||!text) return <span>{text}</span>;
    const low=String(text).toLowerCase(), ql=q.toLowerCase();
    const idx=low.indexOf(ql); if(idx<0) return <span>{text}</span>;
    return <span>{String(text).slice(0,idx)}<mark style={{background:"var(--accent2)",color:"#fff",borderRadius:2,padding:"0 1px"}}>{String(text).slice(idx,idx+q.length)}</mark>{String(text).slice(idx+q.length)}</span>;
  };

  const FIELDS=[{id:"all",label:"All"},{id:"title",label:"Title"},{id:"notes",label:"Notes"},{id:"props",label:"Properties"},{id:"type",label:"Type"}];
  const totalMatches=results.reduce((s,r)=>s+r.hits.length,0);

  return(
    <div style={{width:340,background:"var(--bg2)",borderRight:"1px solid var(--border2)",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>

      {/* Search input */}
      <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{fontSize:13,color:"var(--text4)"}}>🔍</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder="Search nodes, notes, properties…"
            style={{flex:1,background:"var(--bg3)",border:"1px solid var(--accent)",borderRadius:"var(--radius-sm)",
              padding:"6px 10px",color:"var(--text)",fontSize:12,fontFamily:"var(--font-ui)",outline:"none"}}/>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",fontSize:18,lineHeight:1,flexShrink:0}}>×</button>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {FIELDS.map(f=>(
            <button key={f.id} onClick={()=>setField(f.id)}
              style={{padding:"2px 8px",border:"none",borderRadius:"var(--radius-xs)",cursor:"pointer",
                fontSize:10,fontWeight:700,fontFamily:"var(--font-ui)",
                background:field===f.id?"var(--accent2)":"var(--bg3)",
                color:field===f.id?"#fff":"var(--text4)"}}>
              {f.label}
            </button>
          ))}
        </div>
        {query.trim()&&(
          <div style={{marginTop:6,fontSize:10,color:"var(--text4)"}}>
            {results.length===0?"No matches":`${results.length} node${results.length!==1?"s":""} · ${totalMatches} match${totalMatches!==1?"es":""}`}
            {results.length>0&&<span style={{marginLeft:6}}>↑↓ navigate · Enter jump</span>}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{flex:1,overflow:"auto"}}>
        {!query.trim()&&(
          <div style={{padding:"20px 14px",textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:8}}>🔍</div>
            <div style={{fontSize:12,color:"var(--text3)",marginBottom:14}}>Search across all your nodes</div>
            {[["Title","Node names"],["Notes","Free-text content"],["Properties","Make, Model, IP, OS…"],["Type","Router, Server, Note…"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:8,fontSize:11,padding:"5px 8px",background:"var(--bg3)",borderRadius:"var(--radius-sm)",marginBottom:4,textAlign:"left"}}>
                <span style={{color:"var(--accent)",fontWeight:700,minWidth:70}}>{k}</span>
                <span style={{color:"var(--text3)"}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:12,fontSize:10,color:"var(--text4)"}}>Ctrl+F to open · ESC to close</div>
          </div>
        )}

        {query.trim()&&results.length===0&&(
          <div style={{padding:"30px 14px",textAlign:"center",color:"var(--text4)"}}>
            <div style={{fontSize:28,marginBottom:8}}>🔎</div>
            <div style={{fontSize:12}}>No results for "{query}"</div>
            <div style={{fontSize:10,marginTop:6}}>Try different terms or change field filter</div>
          </div>
        )}

        {results.map((r,i)=>{
          const isActive=i===activeIdx; const t=r.t;
          const connCount=edges.filter(e=>e.from===r.node.id||e.to===r.node.id).length;
          return(
            <div key={r.node.id} onClick={()=>{setActiveIdx(i);onSelect(r);}}
              style={{padding:"10px 12px",borderBottom:"1px solid var(--border2)",cursor:"pointer",
                background:isActive?"var(--bg3)":"transparent",
                borderLeft:`3px solid ${isActive?t.color:"transparent"}`,transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)"}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="";}}>

              {/* Node title row */}
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <NodeIcon icon={t.icon} size={14} color={t.color} />
                <span style={{fontSize:12,fontWeight:700,color:t.color,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  <Hl text={r.node.title} q={query}/>
                </span>
                <span style={{fontSize:9,color:"var(--text4)",background:"var(--bg)",padding:"1px 5px",borderRadius:3,border:"1px solid var(--border)",flexShrink:0}}>{t.label}</span>
              </div>

              {/* Match snippets */}
              {r.hits.slice(0,4).map((hit,j)=>(
                <div key={j} style={{display:"flex",gap:6,fontSize:10,lineHeight:1.45,marginBottom:2}}>
                  <span style={{color:"var(--accent2)",flexShrink:0,fontWeight:700,minWidth:56,fontSize:9,letterSpacing:.5,paddingTop:1}}>{hit.field.toUpperCase()}</span>
                  <span style={{color:"var(--text3)",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                    <Hl text={hit.snippet} q={query}/>
                  </span>
                </div>
              ))}
              {r.hits.length>4&&<div style={{fontSize:9,color:"var(--text4)",marginTop:1}}>+{r.hits.length-4} more</div>}

              {/* Footer meta */}
              <div style={{marginTop:4,display:"flex",gap:8,fontSize:9,color:"var(--text4)"}}>
                <span>x:{Math.round(r.node.x)} y:{Math.round(r.node.y)}</span>
                {connCount>0&&<span>· {connCount} connection{connCount!==1?"s":""}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {results.length>0&&query.trim()&&(
        <div style={{padding:"6px 12px",borderTop:"1px solid var(--border2)",display:"flex",gap:10,fontSize:9,color:"var(--text4)"}}>
          <span>↑↓ Navigate</span><span>↵ Jump to node</span><span>ESC Close</span>
        </div>
      )}
    </div>
  );
}

const NODE_INT_TYPES = new Set(['proxmox','unraid','truenas','freenas','esxi','hyperv','nas','server','appserver','router','switch','firewall','desktop','laptop','rpi']);

// ── Inline Node Editor — tabbed popup at node ────────────────────
function InlineNodeEditor({ node, x, y, tab, nodes, edges, canEdit, mapId, mapTitle,
  onTabChange, onClose, onUpdate, onUpdateNotes, onChangeType,
  onUpdateCustom, onDeleteCustom, onAddCustom, onRenameCustom, onUpdateProp: onUpdatePropExt }) {
  // onUpdateProp: prefer external (functional update from NodeCanvas) to avoid stale closure on live tab
  const onUpdateProp = onUpdatePropExt || ((key, val) => onUpdate({ properties: { ...node.properties, [key]: val } }));

  const t = NT[node.type] || NT.note;
  const nodeEdges = edges.filter(e => e.from === node.id || e.to === node.id);
  const [typeSearch, setTypeSearch] = useState('');
  const [confirmType, setConfirmType] = useState(null);

  const hasPorts    = Array.isArray(node.properties?.Ports)    && node.properties.Ports.length > 0;
  const hasServices = Array.isArray(node.properties?.Services) && node.properties.Services.length > 0;
  const hasIntegration = !!(node.properties?._integration?.url || NODE_INT_TYPES.has(node.type));
  const TABS = [
    { id: 'notes',    label: '📝 Notes'      },
    { id: 'props',    label: '⚙ Props'       },
    ...(hasServices ? [{ id: 'services', label: `🔧 Services (${node.properties.Services.length})` }] : []),
    ...(hasPorts    ? [{ id: 'ports',    label: `🔌 Ports (${node.properties.Ports.length})`       }] : []),
    ...(hasIntegration ? [{ id: 'live',  label: '📡 Live' }] : []),
    { id: 'ai',       label: '🤖 Ask AI'     },
    { id: 'type',     label: '🏷 Type'       },
    { id: 'conns',    label: `🔗 Links (${nodeEdges.length})` },
  ];

  const inp = () => ({
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)', padding: '6px 8px', color: 'var(--text)',
    fontSize: 11, fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box',
  });

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      style={{
        position: 'absolute', left: x, top: y, width: 520, zIndex: 200,
        background: 'var(--bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))', outline: `2px solid ${t.color}`,
        display: 'flex', flexDirection: 'column', maxHeight: '80vh',
        userSelect: 'none',
      }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderBottom: '1px solid var(--border2)', background: `${t.color}18`, flexShrink: 0 }}>
        <span style={{ fontSize: 18 }}><NodeIcon icon={t.icon} size={16} color={t.color} /></span>
        <input value={node.title} onChange={e => onUpdate({ title: e.target.value })}
          disabled={!canEdit}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 14, fontWeight: 700, color: t.color, fontFamily: 'var(--font-ui)' }}
        />
        <span style={{ fontSize: 9, color: 'var(--text4)', fontWeight: 700, letterSpacing: 1 }}>{t.label.toUpperCase()}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text4)',
          cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
      </div>

      {/* Description field — hidden for note nodes */}
      {node.type !== 'note' && (
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border2)', flexShrink: 0 }}>
        <input
          value={node.description || ''}
          onChange={e => onUpdate({ description: e.target.value })}
          disabled={!canEdit}
          placeholder="Short description (shown on node)…"
          style={{ ...inp(), background: 'transparent', border: 'none', padding: '0',
            fontSize: 11, color: 'var(--text3)', fontStyle: node.description ? 'normal' : 'italic' }}
        />
      </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => onTabChange(tb.id)}
            style={{ flexShrink: 0, padding: '7px 8px', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-ui)',
              background: tab === tb.id ? 'var(--bg)' : 'var(--bg2)',
              color: tab === tb.id ? t.color : 'var(--text4)',
              borderBottom: tab === tb.id ? `2px solid ${t.color}` : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>
            {tb.label}
          </button>
        ))}
      </div>
      {(!hasServices || !hasPorts || !hasIntegration) && (
        <div style={{ fontSize: 9, color: 'var(--text4)', padding: '3px 14px', background: 'var(--bg2)', fontStyle: 'italic', flexShrink: 0 }}>
          {[!hasServices && 'Services', !hasPorts && 'Ports', !hasIntegration && 'Live'].filter(Boolean).join(', ')} tab{(!hasServices && !hasPorts && !hasIntegration) || (!hasServices && !hasPorts) || (!hasServices && !hasIntegration) || (!hasPorts && !hasIntegration) ? 's' : ''} hidden — not applicable to this node type
        </div>
      )}

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', userSelect: 'text', pointerEvents: 'all' }}>

        {/* ── NOTES TAB ── */}
        {tab === 'notes' && (
          <NodeNotesTab
            node={node}
            canEdit={canEdit}
            t={t}
            onUpdate={onUpdate}
          />
        )}

        {/* ── PROPERTIES TAB ── */}
        {tab === 'props' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Template properties */}
            {Object.keys(node.properties || {}).length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', letterSpacing: 1.5, marginBottom: 6 }}>TEMPLATE PROPERTIES</div>
                {Object.entries(node.properties || {}).filter(([k,v])=>!k.startsWith('_')&&!Array.isArray(v)&&typeof v!=='object').map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: `${t.color}cc`, letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>{k.toUpperCase()}</label>
                    <input value={v} onChange={e => onUpdateCustom ? (() => {
                      const p = { ...node.properties, [k]: e.target.value };
                      onUpdate({ properties: p });
                    })() : null} disabled={!canEdit} style={inp()} />
                  </div>
                ))}
              </div>
            )}
            {/* Custom properties */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', letterSpacing: 1.5, flex: 1 }}>CUSTOM FIELDS</span>
                {canEdit && <button onClick={onAddCustom} style={{ fontSize: 9, background: 'none',
                  border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text3)',
                  cursor: 'pointer', padding: '2px 7px', fontFamily: 'var(--font-ui)' }}>+ ADD</button>}
              </div>
              {Object.entries(node.customProps || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                  <CustomKeyInput propKey={k} node={node} canEdit={canEdit}
                    onRename={(old,nk)=>onRenameCustom&&onRenameCustom(old,nk)}
                    style={{ ...inp(), width: '100%', fontWeight: 600 }}
                  />
                  <input value={v} onChange={e => onUpdateCustom(k, e.target.value)} disabled={!canEdit}
                    style={{ ...inp(), flex: 1 }}
                    placeholder="value"
                    onKeyDown={e=>e.stopPropagation()}
                  />
                  {canEdit && <button onClick={() => onDeleteCustom(k)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>}
                </div>
              ))}
              {!Object.keys(node.customProps || {}).length && (
                <div style={{ fontSize: 10, color: 'var(--text4)', fontStyle: 'italic' }}>No custom fields yet</div>
              )}
            </div>
            {/* Size */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', letterSpacing: 1.5, marginBottom: 6 }}>SIZE</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['w', 'h'].map(dim => (
                  <div key={dim} style={{ flex: 1 }}>
                    <label style={{ fontSize: 9, color: 'var(--text4)', display: 'block', marginBottom: 2 }}>{dim.toUpperCase()}</label>
                    <input type="number" value={node[dim]} onChange={e => onUpdate({ [dim]: +e.target.value })} disabled={!canEdit} style={inp()} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SERVICES TAB ── */}
        {tab === 'services' && (
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',letterSpacing:2,flex:1}}>SERVICES / VMs / CONTAINERS</span>
              {canEdit&&<button onClick={()=>{
                const svcs=[...(node.properties.Services||[]),
                  {id:Math.random().toString(36).slice(2,7),name:'',type:'Docker',ip:'',port:'',status:'Running',image:'',os:'',memory:'',cpu:'',notes:''}];
                onUpdateProp('Services',svcs);
              }} style={{fontSize:10,background:'none',borderRadius:4,color:'var(--text3)',cursor:'pointer',padding:'2px 8px',fontFamily:'var(--font-ui)'}}>+ Add</button>}
            </div>
            {(node.properties.Services||[]).map((svc,si)=>{
              const isAuto=nodes.some(n=>n.id===svc.id);
              return(
              <div key={svc.id||si} style={{background:'var(--bg3)',borderRadius:7,padding:'8px 10px',
                border:`1px solid ${svc.status==='Running'?'var(--success)33':svc.status==='Stopped'?'var(--danger)33':svc.status==='Error'?'var(--danger)55':'var(--border2)'}`}}>
                {isAuto&&<div style={{fontSize:9,color:'var(--accent1)',marginBottom:4}}>⚡ auto — {nodes.find(n=>n.id===svc.id)?.title}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 80px 70px auto',gap:4,marginBottom:4,alignItems:'center'}}>
                  <input value={svc.name||''} placeholder='Service name…' disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],name:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 6px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none',fontWeight:600}}/>
                  <select value={svc.type||'Docker'} disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],type:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 4px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}>
                    <option>Docker</option><option>VM</option><option>LXC</option><option>App</option>
                    <option>Service</option><option>Daemon</option><option>Web App</option><option>Database</option><option>API</option><option>Other</option>
                  </select>
                  <select value={svc.status||'Running'} disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],status:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 4px',
                      color:svc.status==='Running'?'var(--success)':svc.status==='Stopped'||svc.status==='Error'?'var(--danger)':'var(--text)',
                      fontSize:10,fontFamily:'var(--font-ui)',outline:'none',fontWeight:700}}>
                    <option>Running</option><option>Stopped</option><option>Paused</option><option>Error</option><option>Starting</option>
                  </select>
                  {canEdit&&<button onClick={()=>{const s=(node.properties.Services||[]).filter((_,i)=>i!==si);onUpdateProp('Services',s);}}
                    style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 60px 1fr',gap:4}}>
                  <input value={svc.ip||''} placeholder='IP' disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],ip:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 6px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                  <input value={svc.port||''} placeholder='Port' disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],port:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 6px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                  <input value={svc.image||svc.os||''} placeholder='Image / OS' disabled={!canEdit}
                    onChange={e=>{const s=[...node.properties.Services];s[si]={...s[si],image:e.target.value,os:e.target.value};onUpdateProp('Services',s);}}
                    style={{background:'var(--bg)',borderRadius:4,padding:'3px 6px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                </div>
              </div>
              );
            })}
            {!node.properties?.Services?.length&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic'}}>No services configured</div>}
          </div>
        )}

        {/* ── PORTS TAB ── */}
        {tab === 'ports' && (()=>{
          const canvasConn=edges.filter(e=>e.from===node.id||e.to===node.id)
            .map(e=>{const oid=e.from===node.id?e.to:e.from;return nodes.find(n=>n.id===oid)?.title||null;})
            .filter(Boolean);
          const unassigned=canvasConn.filter(name=>!(node.properties.Ports||[]).some(p=>p.connected===name));
          return(
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:700,color:'var(--text4)',letterSpacing:2,flex:1}}>PORTS / INTERFACES</span>
              {canEdit&&unassigned.length>0&&<button onClick={()=>{
                const ports=[...(node.properties.Ports||[])];
                let ui=0;
                for(let pi=0;pi<ports.length&&ui<unassigned.length;pi++){
                  if(!ports[pi].connected){ports[pi]={...ports[pi],connected:unassigned[ui]};ui++;}
                }
                onUpdateProp('Ports',ports);
              }} style={{fontSize:10,background:'var(--accent1)18',border:'1px solid var(--accent1)',borderRadius:4,color:'var(--accent1)',cursor:'pointer',padding:'2px 7px',fontFamily:'var(--font-ui)'}}>⚡ Auto-fill</button>}
              {canEdit&&<button onClick={()=>{
                const ports=[...(node.properties.Ports||[]),
                  {id:Math.random().toString(36).slice(2,7),label:`Port ${(node.properties.Ports||[]).length+1}`,type:'Ethernet',connected:'',ip:'',vlan:''}];
                onUpdateProp('Ports',ports);
              }} style={{fontSize:10,background:'none',borderRadius:4,color:'var(--text3)',cursor:'pointer',padding:'2px 8px',fontFamily:'var(--font-ui)'}}>+ Port</button>}
            </div>
            {canvasConn.length>0&&(
              <div style={{fontSize:10,color:'var(--text4)',background:'var(--bg3)',borderRadius:5,padding:'4px 8px',display:'flex',flexWrap:'wrap',gap:4,alignItems:'center'}}>
                <span style={{fontWeight:700,marginRight:2}}>Canvas:</span>
                {canvasConn.map((name,i)=>(
                  <span key={i} style={{background:unassigned.includes(name)?'var(--accent1)22':'var(--success)22',
                    color:unassigned.includes(name)?'var(--accent1)':'var(--success)',
                    borderRadius:3,padding:'1px 5px',fontSize:9,fontWeight:600}}>
                    {unassigned.includes(name)?'○ ':'✓ '}{name}
                  </span>
                ))}
              </div>
            )}
            <datalist id={`popportconn-${node.id}`}>
              {canvasConn.map((name,i)=><option key={i} value={name}/>)}
            </datalist>
            {(node.properties.Ports||[]).map((port,pi)=>(
              <div key={port.id||pi} style={{display:'grid',gridTemplateColumns:'55px 85px 1fr 1fr auto',gap:4,alignItems:'center',
                background:'var(--bg3)',borderRadius:6,padding:'5px 8px',
                border:port.connected?'1px solid var(--success)44':'1px solid var(--border2)'}}>
                <input value={port.label||''} placeholder='eth0' disabled={!canEdit}
                  onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],label:e.target.value};onUpdateProp('Ports',p);}}
                  style={{background:'var(--bg)',borderRadius:4,padding:'3px 5px',color:'var(--text)',fontSize:10,fontFamily:'monospace',outline:'none'}}/>
                <select value={port.type||'Ethernet'} disabled={!canEdit}
                  onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],type:e.target.value};onUpdateProp('Ports',p);}}
                  style={{background:'var(--bg)',borderRadius:4,padding:'3px 4px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}>
                  <optgroup label="Network"><option>Ethernet</option><option>WAN</option><option>LAN</option>
                    <option>uplink</option><option>access</option><option>trunk</option><option>PoE</option><option>SFP+</option></optgroup>
                  <optgroup label="USB"><option>USB 3.0</option><option>USB 2.0</option><option>USB-C</option></optgroup>
                  <optgroup label="Thunderbolt"><option>Thunderbolt 4</option><option>Thunderbolt 3</option></optgroup>
                  <optgroup label="Video"><option>HDMI</option><option>DisplayPort</option><option>VGA</option></optgroup>
                  <optgroup label="Mgmt"><option>iDRAC/iLO</option><option>IPMI</option></optgroup>
                  <optgroup label="Other"><option>HBA</option><option>Fiber</option><option>Other</option></optgroup>
                </select>
                <input value={port.connected||''} placeholder='Connected to…' list={`popportconn-${node.id}`} disabled={!canEdit}
                  onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],connected:e.target.value};onUpdateProp('Ports',p);}}
                  style={{background:'var(--bg)',borderRadius:4,padding:'3px 5px',
                    color:port.connected?'var(--success)':'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                <input value={port.ip||port.vlan||''} placeholder='IP / VLAN' disabled={!canEdit}
                  onChange={e=>{const p=[...node.properties.Ports];p[pi]={...p[pi],ip:e.target.value,vlan:e.target.value};onUpdateProp('Ports',p);}}
                  style={{background:'var(--bg)',borderRadius:4,padding:'3px 5px',color:'var(--text)',fontSize:10,fontFamily:'var(--font-ui)',outline:'none'}}/>
                {canEdit&&<button onClick={()=>{const p=(node.properties.Ports||[]).filter((_,i)=>i!==pi);onUpdateProp('Ports',p);}}
                  style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>}
              </div>
            ))}
            {!node.properties?.Ports?.length&&<div style={{fontSize:11,color:'var(--text4)',fontStyle:'italic'}}>No ports configured</div>}
          </div>
          );
        })()}

        {/* ── LIVE TAB ── */}
        {tab === 'live' && (
          <>
            {!node.properties?.IP && !node.properties?._integration?.url && (
              <div style={{ background:'var(--accent2)11', border:'1px solid var(--accent2)33', borderRadius:'var(--radius-sm)', padding:'10px 12px', marginBottom:10, fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
                💡 Set the <strong style={{color:'var(--accent)'}}>IP address</strong> in the <button onClick={()=>onTabChange('props')} style={{background:'none',border:'none',color:'var(--accent2)',cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:11,fontWeight:700,padding:0,textDecoration:'underline'}}>Properties tab</button> first, then return here to connect.
              </div>
            )}
            <IntegrationPanel
              node={node}
              canEdit={canEdit}
              onUpdateProp={onUpdateProp}
            />
          </>
        )}

        {/* ── TYPE TAB ── */}
        {tab === 'type' && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10 }}>
              Current type: <span style={{ color: t.color, fontWeight: 700 }}><NodeIcon icon={t.icon} size={16} color={t.color} /> {t.label}</span>
              {' '}<span style={{ color: 'var(--text4)', fontSize: 9 }}>(category: {t.cat})</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <input value={typeSearch} onChange={e => setTypeSearch(e.target.value)}
                placeholder="Search node types…"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text)',
                  fontSize: 11, fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {SIDEBAR_CATS.map(cat => {
              const items = Object.entries(NT).filter(([, nt]) => nt.cat === cat &&
                (!typeSearch || nt.label.toLowerCase().includes(typeSearch.toLowerCase())));
              if (!items.length) return null;
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)', letterSpacing: 1.5, marginBottom: 4 }}>{cat.toUpperCase()}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {items.map(([key, nt]) => (
                      <button key={key}
                        onClick={() => {
                          if (key === node.type) return;
                          if (Object.values(node.properties || {}).some(v => v)) {
                            setConfirmType(key);
                          } else {
                            onChangeType(key);
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px',
                          border: `1.5px solid ${key === node.type ? nt.color : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          background: key === node.type ? `${nt.color}22` : 'var(--bg)',
                          color: key === node.type ? nt.color : 'var(--text3)',
                          fontSize: 11, fontFamily: 'var(--font-ui)',
                          transition: 'all .1s',
                        }}>
                        <NodeIcon icon={nt.icon} size={13} color={key===node.type?nt.color:'var(--text4)'} />
                        <span style={{ fontWeight: key === node.type ? 700 : 400 }}>{nt.label}</span>
                        {key === node.type && <span style={{ fontSize: 9 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Confirm type change modal */}
            {confirmType && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  padding: 20, maxWidth: 300, width: '90%' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Change node type?</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
                    Change to <NodeIcon icon={NT[confirmType]?.icon} size={14} color={NT[confirmType]?.color} /> {NT[confirmType]?.label}? You can keep or reset existing property values.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { onChangeType(confirmType); setConfirmType(null); onTabChange('props'); }}
                      style={{ flex: 1, padding: '7px', background: 'var(--accent2)', border: 'none', borderRadius: 6,
                        color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
                      Change + Keep Props
                    </button>
                    <button onClick={() => {
                      onUpdate({ type: confirmType, properties: { ...(DP[confirmType] || {}) } });
                      setConfirmType(null); onTabChange('props');
                    }}
                      style={{ flex: 1, padding: '7px', background: 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)' }}>
                      Reset Props
                    </button>
                    <button onClick={() => setConfirmType(null)}
                      style={{ padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', fontSize: 14 }}>
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI TAB ── */}
        {tab === 'ai' && mapId && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{ fontSize:10, color:'var(--text4)', padding:'6px 14px 0', fontStyle:'italic' }}>
              Asking AI about this node only — use the 💬 AI Chat button in the topbar for full-canvas context.
            </div>
            <NodeAIChat node={node} mapId={mapId} mapTitle={mapTitle} />
          </div>
        )}
        {tab === 'ai' && !mapId && (
          <div style={{ padding: 16, fontSize: 11, color: 'var(--text4)', textAlign: 'center' }}>Map ID not available</div>
        )}

        {/* ── CONNECTIONS TAB ── */}
        {tab === 'conns' && (
          <div>
            {nodeEdges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text4)', fontSize: 11, fontStyle: 'italic' }}>
                No connections yet. Use Connect mode (C) to draw arrows.
              </div>
            ) : nodeEdges.map(edge => {
              const other = nodes.find(n => n.id === (edge.from === node.id ? edge.to : edge.from));
              const isFrom = edge.from === node.id;
              const ot = NT[other?.type] || NT.note;
              return (
                <div key={edge.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10,
                  padding: '8px 10px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                    <NodeIcon icon={ot.icon} size={16} color={ot.color} />
                    <span style={{ fontSize: 18, color: ot.color, lineHeight: 1 }}>{isFrom ? '→' : '←'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ot.color, marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {other?.title || '?'}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <input value={edge.label || ''} placeholder="Label…"
                        onChange={e => {/* handled by parent */}}
                        style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4,
                          padding: '3px 6px', color: 'var(--text)', fontSize: 10, fontFamily: 'var(--font-ui)', outline: 'none' }}
                      />
                      <select value={edge.edgeType || 'data'}
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4,
                          padding: '3px 5px', color: 'var(--text3)', fontSize: 9, fontFamily: 'var(--font-ui)', outline: 'none' }}>
                        <option value="data">Data flow</option>
                        <option value="method">Method call</option>
                        <option value="network">Network</option>
                        <option value="dependency">Dependency</option>
                        <option value="trigger">Trigger</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


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

function TemplateLibrary({onInsert}){
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

// ── Comments Panel ─────────────────────────────────────────────────
function CommentsPanel({comments,nodes,commentNode,setCommentNode,draft,setDraft,user,onAdd,onDelete,onScrollTo}){
  const inputRef=useRef(null);
  // Build list: if commentNode set, show only that node's comments; else all
  const entries=commentNode
    ? [{nodeId:commentNode,list:comments[commentNode]||[]}]
    : nodes.filter(n=>(comments[n.id]||[]).length>0).map(n=>({nodeId:n.id,list:comments[n.id]||[]}));

  const addComment=()=>{
    const t=draft.trim(); if(!t||!commentNode) return;
    onAdd(commentNode,t);
  };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Thread list */}
      <div style={{flex:1,overflow:"auto",padding:"8px 12px",display:"flex",flexDirection:"column",gap:10}}>
        {entries.length===0&&(
          <div style={{padding:"20px 0",textAlign:"center",color:"var(--text4)"}}>
            <div style={{fontSize:24,marginBottom:8}}>🗨</div>
            <div style={{fontSize:12}}>{commentNode?"No comments yet":"No comments on any node"}</div>
            {commentNode&&<div style={{fontSize:10,marginTop:4}}>Add one below</div>}
          </div>
        )}
        {entries.map(({nodeId,list})=>{
          const node=nodes.find(n=>n.id===nodeId);
          const t=NT[node?.type]||NT.note;
          return(
            <div key={nodeId}>
              {/* Node header */}
              {!commentNode&&(
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,
                  cursor:"pointer",padding:"4px 0"}}
                  onClick={()=>{setCommentNode(nodeId);onScrollTo(nodeId);}}>
                  <NodeIcon icon={t.icon} size={13} color={t.color} />
                  <span style={{fontSize:11,fontWeight:700,color:t.color,flex:1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node?.title}</span>
                  <span style={{fontSize:9,color:"var(--text4)"}}>{list.length}</span>
                </div>
              )}
              {/* Comments */}
              {list.map(c=>(
                <div key={c.id} style={{
                  background:"var(--bg3)",borderRadius:"var(--radius-sm)",
                  padding:"8px 10px",marginBottom:4,
                  borderLeft:`3px solid var(--accent)`,
                }}>
                  <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:700,color:"var(--accent)"}}>{c.author}</span>
                    <span style={{fontSize:9,color:"var(--text4)"}}>
                      {new Date(c.ts).toLocaleDateString()} {new Date(c.ts).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
                    </span>
                    <button onClick={()=>onDelete(nodeId,c.id)}
                      style={{marginLeft:"auto",background:"none",border:"none",
                        color:"var(--text4)",cursor:"pointer",fontSize:12,opacity:.5}}>×</button>
                  </div>
                  <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{c.text}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Input */}
      {commentNode?(
        <div style={{padding:"10px 12px",borderTop:"1px solid var(--border2)",background:"var(--bg3)"}}>
          <div style={{fontSize:10,color:"var(--accent)",marginBottom:5,fontWeight:700}}>
            REPLY ON "{nodes.find(n=>n.id===commentNode)?.title||"node"}"
          </div>
          <div style={{display:"flex",gap:6}}>
            <textarea ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addComment();}}}
              placeholder="Write a comment… (Enter to send)"
              rows={2}
              style={{flex:1,background:"var(--bg)",
                borderRadius:"var(--radius-sm)",padding:"6px 8px",color:"var(--text)",
                fontSize:11,fontFamily:"var(--font-ui)",resize:"none",outline:"none"}}/>
            <button onClick={addComment}
              style={{background:"var(--accent2)",border:"none",borderRadius:"var(--radius-sm)",
                color:"#fff",cursor:"pointer",padding:"0 10px",fontSize:11,fontWeight:700,
                fontFamily:"var(--font-ui)",flexShrink:0}}>↑</button>
          </div>
        </div>
      ):(
        <div style={{padding:"10px 12px",borderTop:"1px solid var(--border2)",
          fontSize:10,color:"var(--text4)",textAlign:"center"}}>
          Click a node's 💬 icon or a thread above to comment
        </div>
      )}
    </div>
  );
}


// ── Export Modal ──────────────────────────────────────────────
function ExportModal({nodes,edges,mapTitle,exportLLM,onClose}){
  const [tab,setTab]=useState("llm");
  const [copied,setCopied]=useState(false);
  const content=tab==="llm"?exportLLM():JSON.stringify({title:mapTitle,nodes,edges},null,2);
  const copy=()=>{navigator.clipboard.writeText(content);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const tbS=(active,color="var(--accent2)")=>({padding:"8px 16px",border:"none",borderRadius:"var(--radius-sm)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"var(--font-ui)",background:"var(--bg)",color:active?"var(--text)":"var(--text3)",boxShadow:active?"inset 2px 2px 6px var(--neu-shadow),inset -1px -1px 4px var(--neu-hilight)":"2px 2px 4px var(--neu-shadow),-1px -1px 3px var(--neu-hilight)",transition:"all .14s"});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.76)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={onClose}>
      <div style={{background:"var(--bg2)",borderRadius:"var(--radius-lg)",padding:20,width:"100%",maxWidth:600,maxHeight:"84vh",display:"flex",flexDirection:"column",gap:14}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:14,color:"var(--accent)"}}>↗ EXPORT</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:22}}>×</button>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[["llm","🤖 LLM Text"],["json","{ } JSON"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={tbS(tab===id)}>{label}</button>
          ))}
          <button onClick={()=>exportAsPNG(nodes,edges,mapTitle)} style={tbS(false,"#9C27B0")}>🖼 PNG</button>
          <div style={{flex:1}}/>
          <button onClick={copy} style={tbS(copied,"var(--success)")}>{copied?"✓ COPIED":"📋 COPY"}</button>
        </div>
        {tab==="llm"&&<div style={{fontSize:12,color:"var(--text3)",background:"var(--bg3)",borderRadius:"var(--radius-sm)",padding:"8px 12px",lineHeight:1.6}}>Grouped by category · Arrows as sentences · Paste into any LLM</div>}
        <pre style={{background:"var(--bg)",borderRadius:"var(--radius-md)",padding:16,fontSize:12,overflow:"auto",flex:1,margin:0,color:"var(--text)",lineHeight:1.65,whiteSpace:"pre-wrap"}}>{content}</pre>
      </div>
    </div>
  );
}
