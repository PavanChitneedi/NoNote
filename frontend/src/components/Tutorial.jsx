import { useState, useEffect, useRef, useCallback } from "react";

export const TUTORIAL_STEPS = [
  { id:"welcome", target:null, page:"all",
    title:"👋 Welcome to NoNote!",
    body:"A collaborative mind-mapping, architecture diagramming, and note-taking tool. This 2-minute tour covers everything you need. Press → or click Next to continue — press Escape or Skip to exit anytime." },
  // Dashboard
  { id:"dash-create", target:'[data-tut="new-map"]', page:"dashboard",
    title:"➕ Create a Map",
    body:"Click here to start a new blank canvas. Give it a name and you're ready to diagram. Your maps auto-save as you work." },
  { id:"dash-import", target:'[data-tut="import"]', page:"dashboard",
    title:"↙ Import",
    body:"Upload a .nonote file to restore a previously exported map — all nodes, edges, notes, and group boxes are preserved exactly." },
  { id:"dash-card", target:'[data-tut="map-card"]', page:"dashboard",
    title:"🗂 Map Cards",
    body:"Each card shows your map. Right-click or click ⋮ for: Open, Rename, Duplicate, Export as .nonote, Share with teammates, or Delete." },
  { id:"dash-shared", target:null, page:"dashboard",
    title:"👁 Shared Maps",
    body:"Maps shared with you appear with a 👁 badge showing the owner. Maps you've shared show a 👥 badge with collaborator count." },
  // Canvas — navigation
  { id:"canvas-topbar", target:'[data-tut="topbar"]', page:"canvas",
    title:"🔝 Topbar",
    body:"Top row: ← Maps · map title (click to rename) · save status · collaborator avatars. Right side: Templates · History · Import · Export · Share · Theme · Zoom · Find · Tutorial." },
  { id:"canvas-edit-mode", target:'[data-tut="edit-mode"]', page:"canvas",
    title:"✏ Edit / 👁 View Mode",
    body:"Toggle between Edit mode (add, move, connect, delete) and View mode (read-only for presenting). Shortcut: E. Collaborators with Viewer permission are always in View mode." },
  { id:"canvas-sidebar", target:'[data-tut="sidebar"]', page:"canvas",
    title:"📦 Node Library (60+ types)",
    body:"Drag or click any node type to add it. Categories: General, Network, Computers, Servers, Storage, Mobile & IoT, Cloud, Software, Security. Use the search box to filter by name." },
  // Modes
  { id:"canvas-select", target:'[data-tut="mode-select"]', page:"canvas",
    title:"▷ Select Mode",
    body:"Click a node to select it. Shift+click for multi-select. Drag on empty canvas to box-select a region. Ctrl+A selects all. Arrow keys nudge. Delete removes selected nodes." },
  { id:"canvas-connect", target:'[data-tut="mode-connect"]', page:"canvas",
    title:"⤳ Connect Mode (C)",
    body:"Press C, then drag from any node edge to another. 15 styles: Basic, Dashed, Dotted, Bold, Double, Wave and more. Click a connection to edit its color, style, label, or direction." },
  { id:"canvas-group", target:'[data-tut="mode-group"]', page:"canvas",
    title:"▭ Group Boxes (G)",
    body:"Press G, then drag to draw a labeled region. Double-click the label to rename. Customize border style (solid/dashed/dotted), border color, and background fill." },
  // Layout
  { id:"canvas-layout", target:'[data-tut="layout-btn"]', page:"canvas",
    title:"⊞ Auto Layout (Ctrl+Enter)",
    body:"Auto-arrange all nodes. Choose direction: Left→Right, Top→Bottom, Right→Left, Bottom→Top, or Radial. Arrows are optimized to minimize crossings. Undo with Ctrl+Z." },
  { id:"canvas-focus", target:null, page:"canvas",
    title:"◎ Focus Mode",
    body:"Select a node and enable Focus mode from the toolbar. All other nodes AND edges dim to near-invisible — great for presentations or deep-diving into one part of your diagram." },
  // Nodes
  { id:"canvas-node-edit", target:null, page:"canvas",
    title:"📝 Editing Nodes",
    body:"Double-click a node title to rename inline. Double-click the body to open the detail panel: add a description, multiple notes (with sensitive-data toggle), and custom key-value properties." },
  { id:"canvas-node-resize", target:null, page:"canvas",
    title:"↔ Moving & Resizing",
    body:"Drag the node header to move. Drag the bottom-right handle to resize. Hold Shift while dragging to snap to a 20px grid. Multi-selected nodes move together with collision prevention." },
  { id:"canvas-node-context", target:null, page:"canvas",
    title:"🖱 Right-Click Menu",
    body:"Right-click any node: Duplicate, Copy/Paste style, Collapse to chip, Add note, Connect to…, Set color, Delete. Right-click canvas background: Paste, Select All, Auto-layout." },
  // Export & history
  { id:"canvas-export", target:'[data-tut="export"]', page:"canvas",
    title:"↗ Export Options",
    body:"Export as: PNG · Interactive HTML (shareable, view-only) · Markdown docs · PDF (print dialog) · .nonote bundle (re-importable) · LLM text (for AI tools) · Raw JSON." },
  { id:"canvas-history", target:'[data-tut="history"]', page:"canvas",
    title:"🕐 Version History (V)",
    body:"Maps auto-save every 5 minutes. Browse snapshots — each shows who saved it, when, and node count. Preview any version and restore it with one click. Changes tab shows the full edit log." },
  { id:"canvas-find", target:'[data-tut="find"]', page:"canvas",
    title:"🔍 Find (Ctrl+F)",
    body:"Search across all node titles, descriptions, and notes simultaneously. Results highlight on the canvas; jump between matches with Enter or ↑↓ arrows." },
  // Collaboration
  { id:"canvas-share", target:'[data-tut="share"]', page:"canvas",
    title:"👥 Share & Collaborate",
    body:"Invite teammates by email as Viewer or Editor. Changes sync in real-time — no refresh needed. Editors see each other's selections as colored borders with name badges, exactly like Excel." },
  { id:"canvas-collab-presence", target:null, page:"canvas",
    title:"🟢 Live Presence",
    body:"The avatar stack in the topbar shows who's viewing right now. A green dot = they're actively selecting. Colored node borders with initials and names show what each person is working on." },
  // Done
  { id:"done", target:null, page:"all",
    title:"✅ You're all set!",
    body:"You now know all the essentials of NoNote. Click ? Help in the menu any time for the full documentation. Happy mapping!" },
];

export default function Tutorial({ page, onClose }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [spotRect, setSpotRect] = useState(null);
  const tipRef = useRef(null);
  const ACCENT = "#58a6ff";

  const steps = TUTORIAL_STEPS.filter(s => s.page === "all" || s.page === page);
  const step   = steps[stepIdx] || steps[steps.length - 1];
  const isLast = stepIdx >= steps.length - 1;

  const findSpot = useCallback(() => {
    if (!step?.target) { setSpotRect(null); return; }
    const el = document.querySelector(step.target);
    if (!el) { setSpotRect(null); return; }
    const r = el.getBoundingClientRect();
    setSpotRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useEffect(() => {
    findSpot();
    const t = setTimeout(findSpot, 80);
    window.addEventListener("resize", findSpot);
    return () => { clearTimeout(t); window.removeEventListener("resize", findSpot); };
  }, [findSpot]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const next = useCallback(() => { if (isLast) { onClose(); return; } setStepIdx(i => Math.min(i+1, steps.length-1)); }, [isLast, onClose, steps.length]);
  const prev = useCallback(() => { setStepIdx(i => Math.max(i-1, 0)); }, []);

  const PAD = 16; const TW = 360; const TH = 240;
  let ts = {
    position:"fixed", zIndex:10000, width:TW,
    background:"var(--bg2)", border:`1.5px solid ${ACCENT}`,
    borderRadius:14, boxShadow:"var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",border:"none",
    padding:"20px 22px 16px", fontFamily:"var(--font-ui)",
  };

  if (spotRect) {
    const below = spotRect.top + spotRect.height + PAD + 8;
    const above = spotRect.top - PAD - TH;
    const rightX = spotRect.left + spotRect.width + PAD;
    if (below + TH < window.innerHeight) {
      ts.top = below; ts.left = Math.max(PAD, Math.min(spotRect.left, window.innerWidth - TW - PAD));
    } else if (above > PAD) {
      ts.top = above; ts.left = Math.max(PAD, Math.min(spotRect.left, window.innerWidth - TW - PAD));
    } else if (rightX + TW < window.innerWidth) {
      ts.top = Math.max(PAD, Math.min(spotRect.top, window.innerHeight - TH - PAD)); ts.left = rightX;
    } else {
      ts.top = Math.max(PAD, Math.min(spotRect.top, window.innerHeight - TH - PAD));
      ts.left = Math.max(PAD, spotRect.left - TW - PAD);
    }
  } else {
    ts.top="50%"; ts.left="50%"; ts.transform="translate(-50%,-50%)";
  }

  const pct = ((stepIdx+1)/steps.length)*100;

  return (
    <>
      {/* Full-screen dim — rendered only when NO spotlight so centered steps have a backdrop */}
      {!spotRect && (
        <div onClick={onClose} data-ui="tutorial" data-component="Tutorial" data-page="global" data-role="overlay" style={{position:"fixed",inset:0,zIndex:9990,background:"rgba(0,0,0,0.72)"}}/>
      )}

      {/* Spotlight: box-shadow creates the dark surround WITHOUT a separate overlay div.
          This guarantees the highlighted element stays fully visible at 100% opacity. */}
      {spotRect ? (
        <div style={{
          position:"fixed",
          top: spotRect.top - 6,
          left: spotRect.left - 6,
          width: spotRect.width + 12,
          height: spotRect.height + 12,
          zIndex: 9995,
          borderRadius: 10,
          border: `2.5px solid ${ACCENT}`,
          /* This single box-shadow dims the ENTIRE page except the spotlight area */
          boxShadow: `0 0 0 3px ${ACCENT}55, 0 0 0 4000px rgba(0,0,0,0.76)`,
          pointerEvents: "none",
          animation: "tut-pulse 2s ease-in-out infinite",
        }}/>
      ) : null}

      <div ref={tipRef} style={ts} onClick={e => e.stopPropagation()}>
        {/* Progress */}
        <div style={{height:3,background:"var(--bg3)",borderRadius:2,marginBottom:16,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${ACCENT},#a78bfa)`,borderRadius:2,transition:"width .3s ease"}}/>
        </div>
        {/* Counter */}
        <div style={{fontSize:9,color:"var(--text4)",fontWeight:700,letterSpacing:1.5,marginBottom:8,
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span>Step {stepIdx+1} / {steps.length}</span>
          <span style={{opacity:.6,textTransform:"none",letterSpacing:0}}>← → to navigate · Esc to exit</span>
        </div>
        {/* Title */}
        <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:10,lineHeight:1.35}}>{step.title}</div>
        {/* Body */}
        <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.7,marginBottom:18}}>{step.body}</div>
        {/* Nav */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text4)",cursor:"pointer",
            fontSize:11,fontFamily:"var(--font-ui)",padding:"4px 0",flex:1,textAlign:"left"}}>
            Skip tour
          </button>
          {stepIdx > 0 && (
            <button onClick={prev} style={{background:"var(--bg3)",border:"1px solid var(--border)",
              borderRadius:6,padding:"6px 14px",color:"var(--text3)",cursor:"pointer",
              fontSize:11,fontFamily:"var(--font-ui)",fontWeight:700}}>← Back</button>
          )}
          <button onClick={next} style={{background:ACCENT,border:"none",borderRadius:6,
            padding:"6px 20px",color:"#0d1117",cursor:"pointer",
            fontSize:11,fontFamily:"var(--font-ui)",fontWeight:800}}>
            {isLast ? "Finish ✓" : "Next →"}
          </button>
        </div>
        {/* Dots */}
        <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:14}}>
          {steps.map((_,i) => (
            <div key={i} onClick={()=>setStepIdx(i)} style={{
              width:i===stepIdx?16:6,height:6,borderRadius:3,cursor:"pointer",
              background:i===stepIdx?ACCENT:"var(--border)",transition:"all .25s",
            }}/>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tut-pulse {
          0%,100%{box-shadow:0 0 0 3px #58a6ff55, 0 0 0 4000px rgba(0,0,0,0.76);}
          50%   {box-shadow:0 0 0 8px #58a6ff22, 0 0 0 4000px rgba(0,0,0,0.76);}
        }
      `}</style>
    </>
  );
}
