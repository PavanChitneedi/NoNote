import { useState } from "react";
import { stripHtml } from "../../lib/notesFormat.js";
import RichTextEditor from "./RichTextEditor.jsx";


// ── Note Card ─────────────────────────────────────────────────────
export default function NoteCard({ note, canEdit, onChange, onDelete }) {
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
