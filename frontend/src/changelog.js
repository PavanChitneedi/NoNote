// Shared changelog — imported by NodeCanvas and Dashboard
export const CHANGELOG = [
{v:"v5.21",date:"Apr 2026",items:[
  "Arrow routing: smarter bestSides scoring eliminates wrong-face exits",
  "Bezier curves: adaptive handle length reduces path crossings",
  "Expand All now runs auto-layout to prevent node overlaps",
  "Space bar quick capture: offsets each new node to avoid stacking",
  "Topbar Row 1: icon-only buttons with hover tooltips, cleaner grouping",
  "Topbar reorganized: Row 1 = app actions, Row 2 = canvas tools",
]},
{v:"v5.20",date:"Apr 2026",items:[
  "Tutorial mode: interactive step-by-step walkthrough with spotlight on UI elements",
  "Help Guide: full searchable documentation with 10 sections and keyboard shortcut table",
  "Tutorial and Help accessible from canvas topbar (🎓 and ? buttons) and dashboard header",
  "Tutorial adapts to current page — shows dashboard or canvas steps accordingly",
  "Focus mode now dims edges (v5.19 fix carried over)",
  "Drag select fixed: didBoxSel ref prevents onClick from clearing box-selection",
]},
{v:"v5.21",date:"Apr 2026",items:[
  "Arrow routing: smarter bestSides scoring eliminates wrong-face exits",
  "Bezier curves: adaptive handle length reduces path crossings",
  "Expand All now runs auto-layout to prevent node overlaps",
  "Space bar quick capture: offsets each new node to avoid stacking",
  "Topbar Row 1: icon-only buttons with hover tooltips, cleaner grouping",
  "Topbar reorganized: Row 1 = app actions, Row 2 = canvas tools",
]},
{v:"v5.20",date:"Apr 2026",items:[
  "Tutorial mode: 22-step interactive walkthrough with spotlight, progress bar, dot nav",
  "Help Guide: full in-app documentation — 12 sections covering every feature",
  "Both are now wired into canvas topbar buttons and kept updated each release",
  "Focus mode: edges now dim correctly (opacity 0.08) when not focused",
  "Drag select fixed: canvas onClick no longer clears box-selection",
]},
{v:"v5.19",date:"Apr 2026",items:[
  "Focus mode now dims edges too (not just nodes)",
  "Drag select fixed: canvas onClick was clearing box-selection immediately after commit",
]},
{v:"v5.18",date:"Apr 2026",items:[
  "Collab: Excel-style selection overlays — selected nodes get colored border + name badge",
  "Collab: editing state shows '· editing' in the badge (like Google Docs)",
  "Collab: stacked avatar pill in topbar with green dot = user is actively selecting",
  "Collab: removed cursor tracking — only selection state is broadcast",
  "Collab: corner handle dot on selected node (Excel fill handle style)",
]},
{v:"v5.17",date:"Apr 2026",items:[
  "Collab FIXED: broadcast moved to scheduleSave — covers ALL 15 state-update paths",
  "Drag/resize/notes/all mutations now broadcast (previously only applyNodes did)",
  "150ms debounce on WS broadcast batches rapid drag pixels into one message",
  "No side effects inside React state updaters — applyNodes/applyEdges are clean",
  "Echo prevention: server never sends back to the sender (server-side, reliable)",
]},
{v:"v5.16",date:"Apr 2026",items:[
  "Collab rebuilt: applyNodes/applyEdges broadcast ws.send() directly on local change",
  "Collab: receiver calls setNodes/setEdges directly — never applyNodes (no echo possible)",
  "Collab: no useEffect broadcasting — React batch timing issues eliminated entirely",
  "Collab: always-on WS, auto-reconnects on disconnect, no toggle button",
  "MS Office cursors: colored arrow + name badge per collaborator",
]},
{v:"v5.15",date:"Apr 2026",items:[
  "Collaboration is now always-on — auto-connects when any map is open (no toggle button)",
  "MS Office-style cursor presence: colored cursor arrow + name badge per user",
  "Live presence pill in topbar shows avatars + count when others are viewing",
  "Deterministic per-user color (consistent across sessions)",
  "Backend crash fix: runMigrations function was missing (was causing restarting loop)",
  "Login fix: /auth/me and /auth/logout now correctly send access token",
]},
{v:"v5.14",date:"Apr 2026",items:[
  "Login fix: apiFetch skips stale token and 401-retry for /auth/* endpoints",
  "Refresh fix: access token stored in sessionStorage — survives page reload",
  "Perf: mousemove handler now stable (deps [zoom] only) — no re-create on every drag pixel",
  "Perf: draggingRef/resizingRef mirror state — handler reads refs, not captured state",
  "Drag select fixed: onUp handler restructured with correct separate blocks",
]},
{v:"v5.13",date:"Apr 2026",items:[
  "Logout on refresh fixed: access token stored in sessionStorage (survives refresh)",
  "Drag select fixed: onUp handler restructured — box-select, group-box, GB drag all separate",
  "Collab rewritten: clean WS model, JSON echo prevention, 20fps cursor throttle",
  "Collab: wsConnected state (not ref) — effects fire after async connect completes",
  "Collab: auth_error message from server turns off collab gracefully",
  "Collab: auto-reconnect on unexpected close, disabled on intentional close",
  "Backend WS: simple broadcast function, no Redis, correct JWT_ACCESS_SECRET",
]},
{v:"v5.12",date:"Apr 2026",items:[
  "Collab: JWT_ACCESS_SECRET fix — WS auth now works (was using wrong env var)",
  "Collab: Redis pub/sub backend — messages fan-out via Redis, works across instances",
  "Collab: wsConnected state (not just ref) — broadcast effects fire after async connect",
  "Collab: server-side echo filter — subscriber skips sending back to the publisher",
  "Collab: 🟡 connecting → 🟢 live indicator driven by room_state acknowledgement",
  "Auto-migrations: backend runs migrate.sql on every startup (safe IF NOT EXISTS)",
  "migrate.sql: all manual ALTER TABLE / CREATE TABLE in one idempotent file",
]},
{v:"v5.11",date:"Apr 2026",items:[
  "Collab WS: echo prevention fixed using object identity (nodes===lastRemoteNodes.current)",
  "Collab WS: backend now fetches display_name, broadcasts room_state + user_joined events",
  "Collab WS: auto-reconnect on unexpected disconnect (3s delay)",
  "Remote cursors: colored dots with name tags show each user's position live",
  "Changes panel (📋): floating panel showing who changed what with timestamps",
  "Backend logs add/delete/edit_node and add/delete_edge to map_changelog table",
  "WS server broadcasts userId+userName so all receiving clients know who made changes",
]},
{v:"v5.10",date:"Apr 2026",items:[
  "Real-time collaboration: changes now broadcast immediately via applyNodes/applyEdges hooks",
  "WS auth fixed: uses getAccessToken() getter instead of missing localStorage key",
  "Shared map indicator in topbar: collaborators see '👁 Shared · viewer/editor by Owner'",
  "Owner indicator: owners with active shares see '👥 Shared · N people'",
  "Dashboard: map cards show shared-to-me badge (with owner name) and shared-by-me badge",
  "Backend: maps list now returns owner_id and collab_count for badge logic",
]},
{v:"v5.9",date:"Apr 2026",items:[
  "Share map fixed: all API calls now use apiFetch with proper auth token (not localStorage)",
  "Topbar reorganized into 4 logical groups: Map Resources | Import+Export | Collaboration | Appearance+View",
  "Share button no longer overlaps Export — each has its own group with separators",
  "Dashboard fetch calls (rename, duplicate, export) also fixed to use apiFetch",
]},
{v:"v5.8",date:"Apr 2026",items:[
  "Group boxes: drag to move, SE corner resize, border color picker, fill color picker",
  "PDF export: print-dialog PDF with embedded node structure (🖨 Print / Save as PDF)",
  "Group boxes persisted to DB (group_boxes JSONB column in maps table)",
  "nginx WebSocket proxy added (/ws location) — real-time collaboration now fully routable",
  "Keyboard shortcut G added to tooltip reference",
]},
{v:"v5.7",date:"Apr 2026",items:[
  "Arrow crossing minimization: port t-values sorted by target position, no crossing between parallel edges",
  "Map title inline editable in topbar (click to rename)",
  "Box select: live node count shown inside selection rect, works in view mode",
  "All dropdowns open below their button (not fixed top-right corner)",
  "Share modal: user search autocomplete as you type, better error messages",
  "Group box drawing (G key): label, solid/dashed/dotted, click × to delete",
  "Export: HTML (view-only interactive page) and Markdown documentation",
  "Dashboard: Share option in map context menu",
]},
{v:"v5.6",date:"Apr 2026",items:[
  "Build fix: JSX fragment wrapper for Collab button inside canEdit&&()",
  "Dashboard: Import .nonote opens map directly (no empty map created first)",
  "Dashboard: Map cards have ⋮ context menu — Open, Rename, Duplicate, Export, Delete",
  "Dashboard: right-click map card also opens context menu",
  "Backend: PATCH /maps/:id for rename, POST /maps/:id/duplicate",
  "Backend: GET /maps/:id/collaborators endpoint added",
]},
{v:"v5.5",date:"Apr 2026",items:[
  "Share map: 👥 button to invite collaborators with Viewer/Editor roles",
  "Real-time collaboration: WebSocket sync — 🟢 Collab toggle broadcasts changes live",
  "Inline formatting toolbar on note edit: Bold, Italic, Underline, Strikethrough, HR",
  "Changelog now shown on home page (Dashboard)",
  "Arrow markerEnd arrowhead flush fix — removed incorrect endpoint nudge",
]},
{v:"v5.4",date:"Apr 2026",items:[
  "Arrow tip flush fix: endpoint nudged INTO node so arrowhead is visually flush",
  "Description placeholder no longer shown twice (removed duplicate from node body)",
  "Icon grid uses CSS auto-fill — no more trailing empty gap in last row",
]},
{v:"v5.3",date:"Apr 2026",items:[
  "Compact sidebar redesigned: narrower 136px panel, categories preserved, search works in all modes",
  "Arrow gap fix: markerEnd nudged slightly inward so arrowhead is flush with node edge",
  "Arrow bidirectional start correctly pulled forward by markerWidth×strokeWidth",
  "Icon sidebar tooltip shown in compact mode too",
]},
{v:"v5.2",date:"Apr 2026",items:[
  "Arrow endpoint pull fixed: markerEnd no longer creates gap, markerStart correctly offset",
  "Compact sidebar mode now works — fixed out-of-scope state call bug",
  "Node library title no longer truncates in compact/icon modes",
  "Note content inline editable directly on canvas — click ✎ to edit",
  "Bidirectional arrow endpoints now correctly clear both node borders",
  "Node header redesigned: title + description in header, type label at right-bottom",
  "Comment 💬 and Collapse ⊟ icons share one row, no overlap",
  "Pencil ✎ icons on title, description, note title, and note content",
  "Inline note title editing without opening popup",
  "Changelog now maintained automatically in every version",
]},
{v:"v5.0",date:"Apr 2026",items:[
  "Bidirectional arrows correctly show both arrowheads (auto-start-reverse)",
  "Inline text editing: pencil icon on title and description (F2 to rename)",
  "Keyboard shortcuts: E opens node popup, N adds note, F2 renames",
  "Compact sidebar mode: multi-icon dense grid",
  "Node type badge moved to right-bottom, less distracting",
  "Node description displayed directly under title",
  "Export/Import .nonote bundle format",
  "Focus mode activates on node click",
  "Resize snap guides",
  "Notes on node: expand per title, expand all button",
  "Quick add note button on node hover",
]},
{v:"v4.46–4.47",date:"2026",items:[
  "Recursive subtree auto-layout (no overlapping nodes)",
  "5 layout directions: L→R, T→B, R→L, B→T, Radial",
  "Layout direction picker dropdown",
  "Popup closes on canvas click",
  "Absolute layer positions eliminate X-axis overlap",
]},
{v:"v4.42–4.45",date:"2026",items:[
  "Complete search rewrite — searches all node data including note titles",
  "Edge routing: smart right→left preference for horizontal layouts",
  "Endpoint drag: slide t-offset along side, reset button",
  "Left-to-right tree layout",
]},
{v:"v4.38–4.41",date:"2026",items:[
  "Canvas area restored + renderEdges/renderNodes helpers",
  "Node Library: collapse, icon-only, dense modes",
  "5-direction auto layout (LR/TB/RL/BT/Radial)",
  "Smart edge router with bestSides()",
  "Improved search covering note titles and descriptions",
]},
{v:"v4.33–4.37",date:"2026",items:[
  "Multi-note per node (array of notes)",
  "Rich text editor with formatting toolbar",
  "Sensitive data toggle on notes (redacted in LLM export)",
  "Inline node editor popup on double-click (4 tabs)",
  "Node type picker in popup",
  "POPUP / PANEL toggle for properties mode",
  "Redesigned 2-row topbar with functional grouping",
  "Command-palette search overlay",
]},
{v:"v4.25–4.32",date:"2026",items:[
  "Right-click context menu",
  "Snap-to-grid (Shift+drag)",
  "Alignment guides during drag",
  "Status dots on collapsed nodes",
  "Template library (Homelab, Microservices, Mind Map)",
  "Comment pins with threaded sidebar",
  "15 connection styles",
  "Focus mode (dims non-active nodes)",
  "Quick capture (Space bar)",
  "Ctrl+D duplicate",
]},
{v:"v4.0–4.24",date:"2025–2026",items:[
  "Full-stack app: Node.js + PostgreSQL + Redis + Docker",
  "60+ node types across 9 categories",
  "Collision prevention with AABB detection",
  "Anchor system for connection endpoints",
  "Version history with restore",
  "LLM export and AI Chat panel",
  "Custom node properties and themes",
  "PNG export",
]},
              ].map(({v,date,items})=>(
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

      {showVersions&&<VersionHistory mapId={mapId} nodes={nodes} edges={edges} mapTitle={mapMeta?.title} onRestore={handleRestore} onClose={()=>setShowVersions(false)}/>}
      {showAppearance&&<ThemePicker onClose={()=>setShowAppearance(false)} canvasTheme={canvasTheme} setCanvasTheme={t=>{setCanvasTheme(t);localStorage.setItem(`nn_canvas_${mapId}`,t);}} defaultTab="canvas"/>}

      <style>{`
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .nn-node:hover { z-index: 10; }
        .nn-node:hover .nn-collapse-btn { opacity: 0.8 !important; }
        .nn-node .nn-collapse-btn:hover { opacity: 1 !important; }
        .nn-node:hover .nn-comment-btn { opacity: 0.65 !important; }
        .nn-comment-btn:hover { opacity: 1 !important; }
        .nn-node:hover .nn-addnote-btn { opacity: 0.6 !important; }
        .nn-node:hover .nn-pencil-btn { opacity: 0.5 !important; }
        .nn-pencil-btn:hover { opacity: 1 !important; color: var(--accent) !important; }
        .nn-addnote-btn:hover { opacity: 1 !important; }
        .nn-node:hover .nn-addnote-btn { opacity: 0.6 !important; }
        .nn-node:hover .nn-pencil-btn { opacity: 0.5 !important; }
        .nn-pencil-btn:hover { opacity: 1 !important; color: var(--accent) !important; }
        .nn-addnote-btn:hover { opacity: 1 !important; }
        .nn-node:hover .nn-collapse-btn { opacity: 0.7 !important; }
        .nn-collapse-btn:hover { opacity: 1 !important; }
        g:hover .nn-mid-handle { opacity: 1 !important; }
        .nn-mid-handle { transition: opacity .15s; }
      `}</style>
      {showTutorial && <Tutorial page="canvas" onClose={()=>setShowTutorial(false)} />}
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
      <span style={{fontSize:28,lineHeight:1,userSelect:"none"}}>{t.icon}</span>
      {/* Name */}
      <span style={{fontSize:10,fontWeight:700,color:t.color,textAlign:"center",lineHeight:1.2,padding:"0 4px",maxWidth:COL_W-8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {node.title}
      </span>
      {/* ⊞ Expand icon — top-right of collapsed node */}
      {canEdit&&(
        <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onToggleCollapse(e);}}
          title="Expand node (⊞)"
          style={{position:"absolute",top:2,right:2,background:"none",border:`1px solid ${t.color}60`,borderRadius:3,color:t.color,cursor:"pointer",fontSize:11,width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
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
          background:"var(--bg2)",border:`1px solid ${t.color}40`,borderRadius:"var(--radius-md)",
          padding:"10px 12px",minWidth:180,maxWidth:260,
          boxShadow:"0 8px 28px var(--shadow)",zIndex:100,
          pointerEvents:"none",
        }}>
          <div style={{fontSize:12,fontWeight:700,color:t.color,marginBottom:6}}>{t.icon} {node.title}</div>
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
function NodeSidebar({cats,addNode,canEdit,inline,collapsed,onToggleCollapse,iconOnly,onToggleIconOnly,dense,onToggleDense,onCycleMode}){
  const [search, setSearch]   = useState("");
  const [catOpen, setCatOpen] = useState({});
  const [tooltip, setTooltip] = useState(null);

  const toggle = cat => setCatOpen(p=>({...p,[cat]:!(p[cat]===undefined?true:p[cat])}));
  const q = search.trim().toLowerCase();

  const filtered = Object.entries(NT).filter(([,t])=>
    !q || t.label.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q)
  );
  const groups = {};
  filtered.forEach(([k,t])=>{ if(!groups[t.cat]) groups[t.cat]=[];
