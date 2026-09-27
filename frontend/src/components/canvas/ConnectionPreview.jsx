import { createPortal } from 'react-dom';

export default function ConnectionPreview({ preview }) {
  if (!preview) return null;
  const {start, x, y, targetId} = preview;
  return createPortal(<div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:10000}}>
    <svg width="100%" height="100%" style={{overflow:'visible'}} aria-hidden="true">
      <path d={preview.path || `M ${start.x} ${start.y} L ${x} ${y}`}
        fill="none" stroke={targetId?'var(--success)':'var(--accent)'} strokeWidth="1.8" strokeDasharray="6 4"/>
      <circle cx={x} cy={y} r="5" fill={targetId?'var(--success)':'var(--accent)'}/>
    </svg>
    <span role="status" style={{position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',
      background:'var(--bg2)',color:'var(--text)',border:'1px solid var(--border)',padding:'8px 12px',borderRadius:8}}>
      {targetId ? 'Release to connect' : 'Drag to another node · Esc to cancel'}
    </span>
  </div>, document.body);
}
