import { useState, useRef, useEffect } from "react";
import FormattedContent from "./FormattedContent.jsx";

// ── NodeNotesTab ───────────────────────────────────────────────
export default function NodeNotesTab({ node, canEdit, onUpdate }) {
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
