import { useState, useRef, useEffect } from "react";


// ── Rich Text Editor — enhanced ──────────────────────────────────
export default function RichTextEditor({ value, onChange, disabled, minHeight = 100 }) {
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
