import { useState } from "react";

const SECTIONS = [
  {
    id:"overview", icon:"⬡", title:"Overview",
    content:[
      { h:"What is NoNote?",
        p:"NoNote is a collaborative mind-mapping, architecture diagramming, and note-taking tool that runs in your browser. All data is stored server-side — nothing is lost on refresh. Maps sync in real-time across all editors." },
      { h:"Core concepts",
        p:"A Map contains Nodes (boxes) connected by Edges (arrows). Nodes can hold a title, description, notes, and custom properties. Group Boxes let you visually cluster related nodes. Everything auto-saves continuously." },
      { h:"Keyboard shortcuts", table:[
        ["E","Toggle Edit / View mode"],
        ["C","Connect mode"],
        ["G","Group box mode"],
        ["V","Open Version History"],
        ["F2","Rename selected node"],
        ["Enter","Open node detail panel"],
        ["N","Add note to selected node"],
        ["Ctrl+Enter","Auto layout"],
        ["Ctrl+F","Find in map"],
        ["Ctrl+Z / Y","Undo / Redo"],
        ["Ctrl+A","Select all nodes"],
        ["Ctrl+D","Duplicate selected"],
        ["Ctrl++ / − / 0","Zoom in / out / reset"],
        ["Delete / Backspace","Delete selected"],
        ["Arrow keys","Nudge selected node 1px"],
        ["Shift+Arrow","Nudge selected node 10px"],
        ["Shift+Drag","Snap to 20px grid"],
        ["Space","Quick-add note node at center"],
        ["Escape","Deselect / cancel operation"],
      ]},
    ],
  },
  {
    id:"nodes", icon:"🟦", title:"Nodes",
    content:[
      { h:"Adding nodes",
        p:"Drag or click any node type in the left sidebar. The library has 60+ types across 9 categories: General, Network, Computers, Servers, Storage, Mobile & IoT, Cloud, Software, Security. Use the search box to filter. You can also right-click the canvas and choose Add Node." },
      { h:"Selecting nodes",
        p:"Click to select. Shift+click or Ctrl+click to add/remove from selection. Drag on empty canvas to box-select a region. Ctrl+A selects all. Selected nodes show a blue highlight ring." },
      { h:"Moving nodes",
        p:"Drag the node header to reposition. Hold Shift while dragging to snap to a 20px grid. Multi-selected nodes move together as a group. Collision detection prevents nodes from overlapping." },
      { h:"Resizing nodes",
        p:"Drag the resize handle (bottom-right corner) to change a node's size. Minimum size is 160×60px. Nodes automatically expand vertically to fit their content." },
      { h:"Editing node content",
        p:"Double-click a title to rename it inline. Double-click the body area (or press Enter with the node selected) to open the detail panel. From there you can edit: Description (free text), Notes (multiple, with a sensitive-data toggle that blurs content), and Properties (custom key-value pairs)." },
      { h:"Right-click menu",
        p:"Right-clicking a node gives quick access to: Duplicate, Copy Style, Paste Style (apply color/border of one node to others), Collapse/Expand, Add Note, Connect To (start a connection), Set Color, and Delete. Right-clicking canvas background gives: Paste, Select All, and layout options." },
      { h:"Collapsing nodes",
        p:"Use the ⊙ toolbar button to collapse all nodes to compact 'chip' view — useful for navigating large diagrams. Individual nodes can be collapsed via right-click. Collapsed nodes show only their title and icon." },
      { h:"Node types",
        p:"Node types have preset icons, colors, and default properties relevant to their category. For example, a Server node includes Host, OS, RAM, and CPU fields by default. All properties are fully editable." },
    ],
  },
  {
    id:"edges", icon:"↗", title:"Connections",
    content:[
      { h:"Drawing connections",
        p:"Press C or click Connect mode. Hover a node until you see edge anchors (blue dots) appear on its border, then drag to the target node. The connection is created with the currently selected style." },
      { h:"Connection styles (15 types)",
        p:"Use the connection style panel (visible when an edge is selected) to choose from: Basic, Dashed, Dotted, Thick, Bold, Double, Special/Wave. Each can also have a custom color from the color swatches." },
      { h:"Direction",
        p:"Connections can be: one-way →, reverse ←, bidirectional ↔, or no arrow (plain line). Select an edge and click the direction buttons to change." },
      { h:"Labels & types",
        p:"Select a connection and type a label to annotate it. Also set an edge type: Data, Method call, Network, Dependency, Trigger — these appear as small italic labels on the edge." },
      { h:"Custom anchors",
        p:"When in Connect mode, hover near a specific point on a node's border to snap to a custom anchor. This lets you control exactly where arrows enter and exit a node." },
      { h:"Bezier handles",
        p:"Select an edge and drag the midpoint diamond handle to bend the curve. This lets you route connections around other nodes or create more readable layouts." },
    ],
  },
  {
    id:"layout", icon:"⊞", title:"Layout",
    content:[
      { h:"Auto layout",
        p:"Press Ctrl+Enter or click the Layout button to auto-arrange all nodes. Choose a direction: Left→Right, Top→Bottom, Right→Left, Bottom→Top, or Radial. The algorithm uses a layered hierarchical layout based on your connections." },
      { h:"Layout directions explained",
        p:"Left→Right is ideal for flow diagrams and org charts. Top→Bottom suits dependency trees. Radial works well for hub-and-spoke architectures with a central node. Right→Left and Bottom→Top are mirrors for RTL/BTT documents." },
      { h:"After layout",
        p:"Layout can always be undone with Ctrl+Z. You can then manually adjust any node positions without affecting others. Running layout again will re-arrange everything from scratch." },
      { h:"Group boxes and layout",
        p:"Group boxes are visual overlays and do not constrain auto-layout. Nodes will be repositioned regardless of any group boxes drawn. Redraw group boxes after running layout if needed." },
    ],
  },
  {
    id:"groups", icon:"▭", title:"Group Boxes",
    content:[
      { h:"Drawing group boxes",
        p:"Press G or click the Group tool in the toolbar. Drag on the canvas to draw a rectangular region. The box is created with a default label 'Group'." },
      { h:"Editing group boxes",
        p:"Double-click the label text to rename it. Use the property panel that appears when you click a group box to change: border style (solid/dashed/dotted), border color, and background fill color (transparent by default)." },
      { h:"Moving and resizing",
        p:"Drag the group box header area to move it. Drag the resize handle (bottom-right corner) to resize. Group boxes sit behind all nodes in the z-order — they are purely visual and do not affect connections or layout." },
      { h:"Right-click group box",
        p:"Right-clicking a group box lets you: Rename, Change color, Change border style, Duplicate, or Delete it." },
    ],
  },
  {
    id:"collab", icon:"👥", title:"Collaboration",
    content:[
      { h:"Sharing a map",
        p:"Click Share in the topbar. Search for a user by email or name. Set their permission: Viewer (can view and comment but not edit) or Editor (full edit access). Changes take effect immediately." },
      { h:"Real-time sync",
        p:"All editors see each other's changes within ~150ms — no refresh required. Nodes, edges, and group boxes all sync. The WebSocket connection auto-reconnects if dropped." },
      { h:"Presence indicators",
        p:"The avatar stack in the topbar shows everyone currently viewing the map. A green dot on an avatar means that user has something selected. Colored node borders with a name badge show exactly which nodes each collaborator has selected or is editing — just like Microsoft Excel." },
      { h:"Who can do what",
        p:"Owners can share, unshare, delete, and do everything Editors can. Editors can add/edit/delete nodes, edges, and group boxes. Viewers can browse and use Find but cannot make changes. The topbar shows your current permission." },
      { h:"Changelog",
        p:"The Changes tab in Version History shows a log of add/edit/delete actions with timestamps and the user who made each change. This gives you a full audit trail of who changed what." },
    ],
  },
  {
    id:"export", icon:"↗", title:"Export",
    content:[
      { h:"PNG image",
        p:"Exports the full canvas as a high-resolution PNG. The exported image includes all nodes, edges, labels, and group boxes. Transparent elements appear on a dark background matching your theme." },
      { h:"Interactive HTML",
        p:"Generates a self-contained .html file that renders your diagram in any browser — no NoNote account needed. The viewer can zoom and pan but cannot edit. Great for sharing with stakeholders." },
      { h:"Markdown document",
        p:"Exports each node as a Markdown section with its title, description, notes, and properties formatted as a document. Useful for documentation workflows or pasting into wikis." },
      { h:"PDF",
        p:"Opens the browser's print dialog with the canvas pre-formatted for printing. Choose Save as PDF. Tip: set margins to None and enable Background graphics for best results." },
      { h:".nonote bundle",
        p:"A JSON bundle containing all nodes, edges, group boxes, and metadata. Re-import it later to fully restore the map. This is the recommended format for backups and transfers between accounts." },
      { h:"LLM text",
        p:"Exports a structured plain-text description of your diagram designed to be pasted into AI tools (ChatGPT, Claude, etc.) as context. Includes node relationships, properties, and notes." },
      { h:"Raw JSON",
        p:"Exports the raw internal data structure for developers or advanced integrations." },
    ],
  },
  {
    id:"history", icon:"🕐", title:"Version History",
    content:[
      { h:"Auto-save",
        p:"Every change is saved to the database within 1 second of you stopping. The save status indicator in the topbar shows: Saving… → Saved ✓ → (fades away). You will not lose work." },
      { h:"Version snapshots",
        p:"Automatic snapshots are created every 5 minutes while you're actively editing. Manual snapshots are created when you click Save Version. Each snapshot records the full state of all nodes, edges, and group boxes." },
      { h:"Browsing history",
        p:"Press V or click History in the topbar. The list shows all snapshots with timestamps and node counts. Click any snapshot to preview it on the canvas. Your current work is not affected by previewing." },
      { h:"Restoring a version",
        p:"After previewing, click Restore to make that snapshot the current state. Your current work is automatically saved as a new snapshot before restoring, so you can always get back to it." },
      { h:"Changes log",
        p:"The Changes tab shows a detailed log of individual node and edge add/edit/delete actions with the username and timestamp for each. Useful for auditing collaborative edits." },
    ],
  },
  {
    id:"focus", icon:"◎", title:"Focus Mode",
    content:[
      { h:"What is Focus Mode?",
        p:"Focus Mode dims all nodes and edges except those you have selected, to 8% opacity. This lets you concentrate on a specific part of your diagram — ideal for presentations, walkthroughs, or reviewing a specific subsystem." },
      { h:"Enabling Focus Mode",
        p:"Select one or more nodes, then click the Focus button in the toolbar (or find it in the View menu). The selected nodes and any edges between them remain fully visible." },
      { h:"Moving focus",
        p:"While in Focus Mode, click a different node to shift focus to it. The previously focused nodes dim. Click on empty canvas to dim everything, then click a new node to focus on it." },
      { h:"Exiting Focus Mode",
        p:"Click the Focus button again to exit, or press Escape. All nodes and edges return to full opacity." },
    ],
  },
  {
    id:"find", icon:"🔍", title:"Find",
    content:[
      { h:"Opening Find",
        p:"Press Ctrl+F or click the 🔍 button in the topbar. A search bar appears at the top of the canvas." },
      { h:"What is searched",
        p:"Find searches all node titles, descriptions, and notes simultaneously. The search is case-insensitive and matches partial words." },
      { h:"Navigating results",
        p:"Matching nodes are highlighted on the canvas. Press Enter or ↓ to jump to the next match. Press ↑ to go back. The canvas auto-scrolls to keep the current match in view." },
      { h:"Closing Find",
        p:"Press Escape or click the × button to close Find and remove highlights." },
    ],
  },
  {
    id:"templates", icon:"📋", title:"Templates",
    content:[
      { h:"Using templates",
        p:"Click Templates in the topbar to open the template picker. Templates are pre-built diagrams for common use cases — load one to get a starting structure that you can customize." },
      { h:"Available templates",
        p:"Templates include: System Architecture, Microservices, Network Diagram, Org Chart, Mind Map, Feature Roadmap, AWS Infrastructure, Kubernetes Cluster, Data Pipeline, and more." },
      { h:"Applying a template",
        p:"Selecting a template replaces the current canvas contents. Your map is saved before the template is applied, so you can restore from Version History if needed." },
    ],
  },
  {
    id:"account", icon:"👤", title:"Account & Settings",
    content:[
      { h:"Profile",
        p:"Click your avatar in the top-right of the dashboard to open Profile settings. Change your display name, email, avatar color, and password." },
      { h:"Themes",
        p:"Click the 🎨 Theme button in the canvas topbar to switch between visual themes. Themes change the color palette (dark/light), font family, border radius style, and canvas background pattern." },
      { h:"Admin panel",
        p:"If you have Admin role, an Admin link appears in the dashboard header. From there you can manage all users, invite new ones, change roles, and view the audit log of all login and account events." },
      { h:"Registration",
        p:"Registration is closed by default for security. An admin can invite users directly from the Admin panel, or set REGISTRATION_OPEN=true in the server environment to allow open sign-ups." },
    ],
  },
];

export default function HelpGuide({ onClose }) {
  const [activeId, setActiveId] = useState("overview");
  const [search, setSearch] = useState("");

  const active = SECTIONS.find(s => s.id === activeId) || SECTIONS[0];
  const filtered = search.trim()
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.some(c => (c.h||"").toLowerCase().includes(search.toLowerCase()) || (c.p||"").toLowerCase().includes(search.toLowerCase()))
      )
    : SECTIONS;

  const S = {
    overlay:{ position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,.75)",
      display:"flex",alignItems:"center",justifyContent:"center" },
    modal:{ background:"var(--bg2)",
      borderRadius:16,width:"min(860px,96vw)",height:"min(640px,92vh)",
      display:"flex",flexDirection:"column",overflow:"hidden",
      boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",fontFamily:"var(--font-ui)" },
    header:{ display:"flex",alignItems:"center",gap:12,padding:"16px 20px",
      borderBottom:"1px solid var(--border)",flexShrink:0 },
    body:{ display:"flex",flex:1,overflow:"hidden" },
    sidebar:{ width:180,borderRight:"1px solid var(--border)",
      overflow:"auto",padding:"8px 0",flexShrink:0 },
    content:{ flex:1,overflow:"auto",padding:"20px 28px" },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={S.header}>
          <span style={{fontSize:18}}>⬡</span>
          <span style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>NoNote Help Guide</span>
          <span style={{flex:1}}/>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search documentation…"
            style={{background:"var(--bg3)",borderRadius:6,
              padding:"5px 10px",color:"var(--text)",fontSize:11,fontFamily:"var(--font-ui)",
              width:180,outline:"none"}}
          />
          <button onClick={onClose} style={{background:"none",border:"none",
            color:"var(--text4)",cursor:"pointer",fontSize:16,padding:"2px 6px",
            borderRadius:4,lineHeight:1}}>✕</button>
        </div>

        <div style={S.body}>
          {/* Sidebar nav */}
          <div style={S.sidebar}>
            {filtered.map(s => (
              <button key={s.id} onClick={()=>{ setActiveId(s.id); setSearch(""); }}
                style={{display:"flex",alignItems:"center",gap:8,width:"100%",
                  padding:"8px 14px",border:"none",cursor:"pointer",textAlign:"left",
                  background: s.id===activeId ? "var(--accent)18" : "transparent",
                  color: s.id===activeId ? "var(--accent)" : "var(--text3)",
                  borderLeft: s.id===activeId ? "2px solid var(--accent)" : "2px solid transparent",
                  fontSize:11,fontWeight:s.id===activeId?700:400,fontFamily:"var(--font-ui)",
                  transition:"all .12s"}}>
                <span style={{fontSize:13}}>{s.icon}</span>
                {s.title}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{padding:"16px 14px",color:"var(--text4)",fontSize:11}}>No results</div>
            )}
          </div>

          {/* Content */}
          <div style={S.content}>
            <div style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:20,
              display:"flex",alignItems:"center",gap:8}}>
              <span>{active.icon}</span> {active.title}
            </div>

            {active.content.map((c, i) => (
              <div key={i} style={{marginBottom:22}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--text)",
                  marginBottom:6,paddingBottom:5,
                  borderBottom:"1px solid var(--border)"}}>{c.h}</div>
                {c.p && (
                  <p style={{fontSize:12,color:"var(--text3)",lineHeight:1.75,margin:0}}>{c.p}</p>
                )}
                {c.table && (
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <tbody>
                      {c.table.map(([key,val],j) => (
                        <tr key={j} style={{borderBottom:"1px solid var(--border)"}}>
                          <td style={{padding:"5px 10px 5px 0",color:"var(--text)",
                            fontWeight:700,whiteSpace:"nowrap",width:160,verticalAlign:"top"}}>
                            <code style={{background:"var(--bg3)",padding:"1px 6px",
                              borderRadius:4,fontSize:10}}>{key}</code>
                          </td>
                          <td style={{padding:"5px 0",color:"var(--text3)",lineHeight:1.55}}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
